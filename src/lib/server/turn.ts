/**
 * Quellight G1 turn orchestration — current-turn composition (frozen §4).
 *
 * Sequence per user message:
 *   1. durable intake (temporary G1 policy) through VICT/Cognee bindings —
 *      failure degrades storage, never fabricates;
 *   2. scoped retrieval of candidate context (bounded count, no invented
 *      threshold); dependency failure degrades explicitly;
 *   3. deterministic composition of (current question, candidates);
 *   4. reasoning via the VICT ProductAgent (deterministic fixture at G1);
 *   5. answer surfaced with meta distinguishing used/unavailable/miss.
 *
 * Invariants (frozen):
 * - Cognee hit ≠ truth: candidates are context only;
 * - model response is NEVER written as durable state;
 * - retrieval/model absence is surfaced, never converted to fake success.
 */

import { G1_MAX_CANDIDATES, composeTurnInput } from './compose.js';
import type { DeterministicFixture } from './fixture-model.js';
import type { KnowledgeStore } from './knowledge.js';
import type { KnowledgeCandidate, TurnMeta, TurnResponse } from '$lib/types';
import type { FaultInjection } from './config.js';
import type { QuellightAgent } from './product-agent.js';

export interface WalkingTurnDeps {
	question: string;
	turnIndex: number;
	knowledge: KnowledgeStore | null;
	knowledgeFaulted: boolean;
	fixture: DeterministicFixture;
	agent: QuellightAgent;
	modelIdentity: string;
	fault: FaultInjection;
}

export interface WalkingTurnResult {
	response: TurnResponse;
	retrievedCount: number;
}

const GREETING_ENTRY_INPUT = 'Hello.';
const GREETING_ENTRY_TEXT =
	'Hello! I\u2019m Quellight — your persistent cognitive partner. What would you like to do?';

export async function runWalkingTurn(deps: WalkingTurnDeps): Promise<WalkingTurnResult> {
	const { question, knowledge, knowledgeFaulted, fixture, agent, modelIdentity, fault } = deps;

	// 1+2. Durable intake + retrieval (both may be degraded; neither fabricates).
	let intakeDegraded = false;
	let retrievalDegraded = false;
	let candidates: KnowledgeCandidate[] = [];

	if (knowledgeFaulted || fault === 'retrieval') {
		retrievalDegraded = true;
	} else {
		if (knowledge === null) {
			retrievalDegraded = true;
		} else {
			try {
				await knowledge.storeMessage(question, `g1-turn-${deps.turnIndex}`);
			} catch {
				intakeDegraded = true;
			}
			try {
				candidates = await knowledge.search(question, G1_MAX_CANDIDATES);
			} catch {
				retrievalDegraded = true;
				candidates = [];
			}
		}
	}

	// Trivial self-match filter: a candidate identical to the current question
	// is the intake echo of this very turn, not additional knowledge. This is
	// an identity filter, not a score threshold.
	const normalize = (s: string) => s.trim().toLowerCase();
	candidates = candidates.filter((c) => normalize(c.text) !== normalize(question));

	// 3. Deterministic composition (contract §6).
	const composedInput = composeTurnInput(question, candidates);

	// 4. Deterministic fixture assembly for THIS composed input.
	// - Static greeting entry applies only to bare (no-candidate) turns.
	// - Candidate-informed/miss entries are the deterministic transform of the
	//   actual retrieval outcome (documented fixture assembly policy).
	if (fault === 'model') {
		fixture.registerThrow(composedInput);
	} else if (!fixture.hasEntry(composedInput)) {
		if (composedInput === GREETING_ENTRY_INPUT) {
			fixture.registerText(GREETING_ENTRY_INPUT, GREETING_ENTRY_TEXT);
		} else {
			fixture.registerText(composedInput, fixture.describeCandidates(question, candidates));
		}
	}

	// 5. Reason through the VICT ProductAgent boundary.
	let runResult: Awaited<ReturnType<QuellightAgent['runTurn']>>;
	try {
		runResult = await agent.runTurn({ turnId: `turn-${deps.turnIndex}`, input: composedInput });
	} catch (error) {
		return {
			response: {
				kind: 'error',
				errorCode: 'model-failed',
				message: `Quellight could not produce a response: ${
					error instanceof Error ? error.message : String(error)
				}`
			},
			retrievedCount: candidates.length
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
			retrievedCount: candidates.length
		};
	}

	const meta: TurnMeta = {
		retrieval: retrievalDegraded ? 'unavailable' : candidates.length > 0 ? 'used' : 'miss',
		intakeDegraded,
		modelIdentity
	};
	return {
		response: { kind: 'assistant', text: runResult.text, meta },
		retrievedCount: candidates.length
	};
}