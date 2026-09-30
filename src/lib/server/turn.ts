/**
 * Quellight G2 turn orchestration.
 *
 * Sequence per user message (frozen contract §4–§10):
 *   1. bounded semantic extraction through the ProductAgent extraction lane
 *      (output validated against the closed schema; anything invalid means NO
 *      write);
 *   2. Quellight policy maps a valid candidate (remember → user_stated +
 *      accepted; infer → agent_inferred + proposed) and the canonical
 *      Meaning Record is written to VICT Application Data (accepted only);
 *   3. ONLY accepted/current meaning is projected to Cognee (add + cognify);
 *      projection failure degrades honestly; the canonical write never rolls
 *      back;
 *   4. scoped retrieval; EVERY hit is mapped back to the canonical store and
 *      eligibility-filtered (stale/unresolvable hits are EXCLUDED);
 *   5. deterministic composition (eligible meaning block + question);
 *   6. reasoning via the VICT ProductAgent; meta distinguishes outcomes.
 *
 * Invariants (frozen):
 * - ordinary conversation writes NOTHING and never reaches Cognee add/cognify;
 * - model output is never accepted meaning; extraction never auto-accepts;
 * - Cognee candidates never bypass the canonical eligibility filter;
 * - Cognee failure never corrupts canonical state and is surfaced honestly;
 * - retrieval/model absence is surfaced, never converted to fake success.
 */

import { ELIGIBLE_MEANING_LABEL, G2_MAX_CANDIDATES, composeTurnInput } from './compose.js';
import type { DeterministicFixture } from './fixture-model.js';
import type { KnowledgeStore } from './knowledge.js';
import { parseMeaningRecordId, renderEligibleMeaning } from './meaning-filter.js';
import { composeExtractionInput, parseExtractionOutput } from './meaning-extraction.js';
import type { MeaningStore } from './meaning.js';
import type { FaultInjection } from './config.js';
import type { QuellightAgent } from './product-agent.js';
import type { MeaningCandidate, MeaningRecord, TurnMeta, TurnResponse } from '$lib/types';

export interface G2TurnDeps {
	question: string;
	turnIndex: number;
	knowledge: KnowledgeStore | null;
	knowledgeFaulted: boolean;
	meaning: MeaningStore | null;
	meaningFaulted: boolean;
	fixture: DeterministicFixture;
	agent: QuellightAgent;
	modelIdentity: string;
	fault: FaultInjection;
}

export interface G2TurnResult {
	response: TurnResponse;
	eligibleCount: number;
}

const GREETING_ENTRY_INPUT = 'Hello.';
const GREETING_ENTRY_TEXT =
	'Hello! I\u2019m Quellight — your persistent cognitive partner. What would you like to do?';

export async function runQuellightTurn(deps: G2TurnDeps): Promise<G2TurnResult> {
	const {
		question,
		turnIndex,
		knowledge,
		knowledgeFaulted,
		meaning,
		meaningFaulted,
		fixture,
		agent,
		modelIdentity,
		fault
	} = deps;
	const turnRef = `turn-${turnIndex}`;
	const selfMatch = (s: string) => s.trim().toLowerCase();

	// 1. Bounded semantic extraction (separate lane; failure degrades honestly).
	let extractionDegraded = false;
	let candidate: MeaningCandidate | undefined;
	if (fault === 'extraction') {
		extractionDegraded = true;
	} else {
		const extractionInput = composeExtractionInput(question);
		// Deterministic fixture assembly (documented policy): the default
		// extraction model behavior is a bounded parser; scenario scripts win.
		fixture.ensureExtraction(extractionInput, question);
		try {
			const extractionRun = await agent.runTurn({
				turnId: `${turnRef}-extract`,
				input: extractionInput,
				lane: 'extraction'
			});
			if (extractionRun.status === 'completed' && typeof extractionRun.text === 'string') {
				const parsed = parseExtractionOutput(extractionRun.text);
				if (parsed.kind === 'candidate' && parsed.candidate) {
					candidate = parsed.candidate;
				} else if (parsed.kind === 'invalid') {
					// Rejected by the closed schema: observable, never persisted,
					// never silently reshaped into a different candidate.
					console.error(
						'[quellight] extraction output rejected by closed schema:',
						parsed.rejectionReason
					);
				}
			} else {
				extractionDegraded = true;
			}
		} catch {
			extractionDegraded = true;
		}
	}

	// 2. Canonical policy + write (only here, only through the Meaning Store).
	let durableWrite = false;
	let meaningProposed = false;
	let canonicalDegraded = false;
	let projectionDegraded = false;
	let projectionDetail: string | undefined;
	if (candidate && meaning && !meaningFaulted) {
		try {
			const created = await meaning.recordCandidate(
				candidate,
				{ sourceReference: `${turnRef}`, sourceExcerpt: question },
				{ idempotencyKey: meaning.makeCreateKey(turnRef, candidate.semanticKey) }
			);
			if (created.written) {
				if (candidate.intent === 'remember') {
					durableWrite = true;
				} else {
					// agent_inferred meaning is ALWAYS proposed — never accepted here.
					meaningProposed = true;
				}
				// 3. Projection: ONLY accepted meaning, ONLY after the canonical
				// write; failure is honest and never rolls anything back.
				if (candidate.intent === 'remember') {
					const projectionResult = await projectMeaning(created.record, deps, knowledge);
					if (projectionResult.degraded) {
						projectionDegraded = true;
						projectionDetail = await detailProjected(
							meaning,
							created.record.id,
							projectionResult.detail
						);
					}
				}
			}
		} catch (error) {
			console.error('[quellight] canonical meaning write failed:', error);
			canonicalDegraded = true;
		}
	} else if (candidate) {
		// A durable candidate arrived but the canonical store is unavailable.
		canonicalDegraded = true;
	}

	// 4. Retrieval + canonical eligibility filter (stale hits can NEVER pass).
	let retrievalDegraded = false;
	let eligible: MeaningRecord[] = [];
	if (knowledgeFaulted || fault === 'retrieval' || knowledge === null) {
		retrievalDegraded = true;
	} else {
		try {
			const hits = await knowledge.search(question, G2_MAX_CANDIDATES);
			const ids = hits
				.map((h) => parseMeaningRecordId(h.text))
				.filter((id): id is string => typeof id === 'string');
			if (meaning && !meaningFaulted) {
				const eligibleMap = await meaning.resolveEligible(ids);
				eligible = ids.map((id) => eligibleMap.get(id)).filter((r): r is MeaningRecord => !!r);
			}
		} catch (error) {
			console.error('[quellight] knowledge retrieval failed:', error);
			retrievalDegraded = true;
			eligible = [];
		}
	}

	// Trivial identity filter retained (a candidate identical to the question
	// is echo noise, not knowledge).
	eligible = eligible.filter((m) => m.value.trim().toLowerCase() !== question.trim().toLowerCase());

	// 5. Deterministic composition (eligible meaning block + question).
	const meaningItems = eligible.map((m) => ({ text: renderEligibleMeaning(m) }));
	const composedInput = composeTurnInput(question, meaningItems, { label: ELIGIBLE_MEANING_LABEL });

	// Deterministic fixture assembly for THIS composed input (G1 pattern).
	if (fault === 'model') {
		fixture.registerThrow(composedInput);
	} else if (!fixture.hasEntry(composedInput)) {
		if (composedInput === GREETING_ENTRY_INPUT) {
			fixture.registerText(GREETING_ENTRY_INPUT, GREETING_ENTRY_TEXT);
		} else {
			fixture.ensureAnswer(composedInput, question, eligible);
		}
	}

	// 6. Reason through the VICT ProductAgent boundary (conversation lane).
	let runResult: {
		status: string;
		text?: string;
		errorCode?: string;
		providerModelIdentity?: string;
	};
	try {
		runResult = await agent.runTurn({ turnId: `${turnRef}-answer`, input: composedInput });
	} catch (error) {
		return {
			response: {
				kind: 'error',
				errorCode: 'model-failed',
				message: `Quellight could not produce a response: ${
					error instanceof Error ? error.message : String(error)
				}`
			},
			eligibleCount: eligible.length
		};
	}

	if (runResult.status !== 'completed' || typeof runResult.text !== 'string') {
		return {
			response: {
				kind: 'error',
				errorCode: 'model-failed',
				message: runResult.errorCode
					? `Quellight could not produce a response (${runResult.errorCode}).`
					: 'Quellight could not produce a response for this input.'
			},
			eligibleCount: eligible.length
		};
	}

	const meta: TurnMeta = {
		retrieval: retrievalDegraded ? 'unavailable' : eligible.length > 0 ? 'used' : 'miss',
		durableWrite,
		meaningProposed,
		projectionDegraded,
		modelIdentity,
		canonicalDegraded,
		extractionDegraded: extractionDegraded || undefined,
		projectionDetail
	};
	return {
		response: { kind: 'assistant', text: runResult.text, meta },
		eligibleCount: eligible.length
	};
}

/** Projection with honest degradation; the canonical write is NEVER undone. */
async function projectMeaning(
	record: MeaningRecord,
	deps: G2TurnDeps,
	knowledge: KnowledgeStore | null
): Promise<{ degraded: boolean; detail?: string }> {
	if (deps.fault === 'cognee') {
		return { degraded: true, detail: 'controlled cognee fault: projection skipped' };
	}
	if (!knowledge || deps.knowledgeFaulted) {
		return { degraded: true, detail: 'semantic projection unavailable (knowledge path down)' };
	}
	try {
		await knowledge.projectMeaning(record, `meaning-project:${record.id}`);
		return { degraded: false };
	} catch (error) {
		return {
			degraded: true,
			detail: `projection failed: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

async function detailProjected(
	meaning: MeaningStore,
	recordId: string,
	detail: string | undefined
): Promise<string> {
	const resolved = detail ?? 'semantic projection unavailable for this record';
	// Bookkeeping only — canonical truth stays intact either way.
	try {
		await meaning.markProjection(recordId, 'failed', resolved);
	} catch (error) {
		console.error('[quellight] projection-state bookkeeping failed:', error);
	}
	return resolved;
}
