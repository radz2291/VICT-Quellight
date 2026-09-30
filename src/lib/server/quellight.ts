/**
 * Quellight G2 server composition root (extends the G1 root).
 *
 * Builds:
 * - the canonical Meaning Store (VICT Application Data — real on-disk SQLite
 *   via `@victframework/appdata-sqlite`; restart-durable);
 * - the Cognee semantic-projection store (VICT capability bindings only);
 * - the VICT ProductAgent with the deterministic fixture (QD-02).
 *
 * Knowledge and meaning stores are DEGRADED, never fatal: without a Python
 * worker the app still converses; without the meaning store durable meaning
 * is degraded honestly. Singletons live for the app process.
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
	resolveFaultInjection,
	resolveKnowledgeConfig,
	resolveMeaningStoreConfig,
	resolveModelPlan
} from './config.js';
import { createDeterministicFixture } from './fixture-model.js';
import { KnowledgeStore } from './knowledge.js';
import { MeaningStore, type MeaningStoreOptions } from './meaning.js';
import { createQuellightAgent, type QuellightAgent } from './product-agent.js';
import { runQuellightTurn } from './turn.js';
import type { MeaningDecisionResponse, MeaningRecordView } from '$lib/types';

interface QuellightState {
	fixture: ReturnType<typeof createDeterministicFixture>;
	agent: QuellightAgent | null;
	knowledge: KnowledgeStore | null;
	knowledgeLoadError: string | null;
	knowledgeFaulted: boolean;
	meaning: MeaningStore | null;
	meaningLoadError: string | null;
	meaningFaulted: boolean;
	meaningInitStarted: boolean;
	meaningInitPromise: Promise<void> | null;
	meaningInitSettled: boolean;
	knowledgeInitStarted: boolean;
	knowledgeInitPromise: Promise<void> | null;
	knowledgeInitSettled: boolean;
	modelIdentity: string;
	turnIndex: number;
}

// Observability: unhandled rejections must be OBSERVABLE evidence, never
// converted into silent success. Node's default crash behavior is preserved.
process.on('unhandledRejection', (reason) => {
	console.error('[quellight] unhandledRejection:', reason);
});

const state: QuellightState = {
	fixture: createDeterministicFixture(),
	agent: null,
	knowledge: null,
	knowledgeLoadError: null,
	knowledgeFaulted: false,
	meaning: null,
	meaningLoadError: null,
	meaningFaulted: false,
	meaningInitStarted: false,
	meaningInitPromise: null as Promise<void> | null,
	meaningInitSettled: false,
	knowledgeInitStarted: false,
	knowledgeInitPromise: null as Promise<void> | null,
	knowledgeInitSettled: false,
	modelIdentity: resolveModelPlan().modelIdentity,
	turnIndex: 0
};

export async function ensureAgent(): Promise<QuellightAgent> {
	if (!state.agent) {
		state.agent = await createQuellightAgent(state.fixture.modelFactory);
	}
	return state.agent;
}

/** Canonical Meaning Store bootstrap — fast; degrades when creation fails. */
function startMeaningInit(): Promise<void> {
	state.meaningInitStarted = true;
	const init = Promise.resolve().then(() => {
		try {
			const meaningOptions: MeaningStoreOptions = { path: resolveMeaningStoreConfig().path };
			mkdirSync(path.dirname(meaningOptions.path), { recursive: true });
			state.meaning = MeaningStore.create(meaningOptions);
			state.meaningFaulted = false;
			state.meaningInitSettled = true;
		} catch (error) {
			state.meaning = null;
			state.meaningFaulted = true;
			state.meaningLoadError = error instanceof Error ? error.message : String(error);
			state.meaningInitSettled = true;
		}
	});
	return init;
}

export async function ensureMeaning(): Promise<void> {
	if (!state.meaningInitStarted) {
		state.meaningInitPromise = startMeaningInit();
	}
	await state.meaningInitPromise;
}

/** Cognee projection store bootstrap — non-blocking; degrades when unavailable. */
function startKnowledgeInit(): Promise<void> {
	state.knowledgeInitStarted = true;
	const config = resolveKnowledgeConfig();
	if (!config.enabled) {
		state.knowledgeFaulted = true;
		state.knowledgeLoadError = 'No Python worker path configured (QUOLLIGHT_COGNEE_PYTHON).';
		state.knowledgeInitSettled = true;
		return Promise.resolve();
	}
	const init = KnowledgeStore.create(config)
		.then((store) => {
			state.knowledge = store;
			state.knowledgeFaulted = false;
			state.knowledgeInitSettled = true;
		})
		.catch((error: unknown) => {
			state.knowledge = null;
			state.knowledgeFaulted = true;
			state.knowledgeLoadError = error instanceof Error ? error.message : String(error);
			state.knowledgeInitSettled = true;
		});
	return init;
}

export async function ensureKnowledge(): Promise<void> {
	if (!state.knowledgeInitStarted) {
		state.knowledgeInitPromise = startKnowledgeInit();
	}
	await state.knowledgeInitPromise;
}

export interface ServerTurnResult {
	response: Awaited<ReturnType<typeof runQuellightTurn>>['response'];
}

export async function executeTurn(question: string): Promise<ServerTurnResult> {
	await ensureAgent();
	await ensureMeaning();
	await ensureKnowledge();
	state.turnIndex += 1;
	const fault = resolveFaultInjection();
	return runQuellightTurn({
		question,
		turnIndex: state.turnIndex,
		knowledge: state.knowledge,
		knowledgeFaulted: state.knowledgeFaulted,
		meaning: state.meaning,
		meaningFaulted: state.meaningFaulted,
		fixture: state.fixture,
		agent: state.agent as QuellightAgent,
		modelIdentity: state.modelIdentity,
		fault
	});
}

export interface ServerStatus {
	model: { identity: string; mode: string; liveStatus: string };
	knowledge: {
		state: 'ready' | 'degraded' | 'initializing';
		detail: string | null;
		dataset: string;
	};
	meaning: { state: 'ready' | 'degraded' | 'initializing'; detail: string | null; store: string };
	turns: number;
}

/**
 * Clean lifecycle close: VICT-Cognee supervision shutdown first (releases the
 * store-owner lock), then the Mastra dedicated store; the canonical meaning
 * adapter closes last. Used by the gated maintenance-shutdown endpoint.
 */
export async function gracefulClose(): Promise<{
	meaning: boolean;
	knowledge: boolean;
	agent: boolean;
}> {
	await ensureAgent();
	await ensureMeaning();
	await ensureKnowledge();
	let meaning = true;
	let knowledge = true;
	let agent = true;
	if (state.meaning) {
		try {
			state.meaning.close();
		} catch {
			meaning = false;
		}
	}
	if (state.knowledge) {
		try {
			await state.knowledge.close();
		} catch {
			knowledge = false;
		}
	}
	if (state.agent) {
		try {
			await state.agent.close();
		} catch {
			agent = false;
		}
	}
	return { meaning, knowledge, agent };
}

export async function serverStatus(): Promise<ServerStatus> {
	const modelPlan = resolveModelPlan();
	return {
		model: {
			identity: state.modelIdentity,
			mode: modelPlan.mode,
			liveStatus: modelPlan.liveStatus
		},
		knowledge: {
			state:
				state.knowledge && !state.knowledgeFaulted
					? 'ready'
					: state.knowledgeInitSettled
						? 'degraded'
						: 'initializing',
			detail: state.knowledgeFaulted ? state.knowledgeLoadError : null,
			dataset: 'g2.meaning'
		},
		meaning: {
			state:
				state.meaning && !state.meaningFaulted
					? 'ready'
					: state.meaningInitSettled
						? 'degraded'
						: 'initializing',
			detail: state.meaningFaulted ? state.meaningLoadError : null,
			store: 'VICT Application Data (appdata-sqlite)'
		},
		turns: state.turnIndex
	};
}

// ------------------------------------------------------------- inspector API

export interface InspectorBundle {
	current: import('$lib/types').MeaningRecordView[];
	proposed: import('$lib/types').MeaningRecordView[];
	history: import('$lib/types').MeaningRecordView[];
}

export async function meaningInspector(): Promise<InspectorBundle> {
	await ensureMeaning();
	if (!state.meaning) {
		throw new Error('Canonical meaning store unavailable.');
	}
	return state.meaning.inspectorData();
}

/**
 * Inspector decision path: proposed → accepted/rejected. Accepting an
 * eligible meaning also attempts projection (accepted meaning only) with
 * honest degradation; canonical state is authoritative either way.
 */
export async function decideOnMeaning(
	recordId: string,
	decision: 'accept' | 'reject'
): Promise<MeaningDecisionResponse> {
	await ensureMeaning();
	await ensureKnowledge();
	const meaning = state.meaning;
	if (!meaning) {
		throw new Error('Canonical meaning store unavailable.');
	}
	const fault = resolveFaultInjection();
	const result = await meaning.decide(recordId, decision);
	let projectionDegraded = false;
	let projectionDetail: string | undefined;
	if (decision === 'accept') {
		// New accepted/current meaning must be projected (accepted only).
		const updatedRecord = await meaning.get(recordId);
		if (updatedRecord && fault !== 'cognee' && state.knowledge && !state.knowledgeFaulted) {
			try {
				await state.knowledge.projectMeaning(updatedRecord, `meaning-project:${updatedRecord.id}`);
				await meaning.markProjection(updatedRecord.id, 'projected');
			} catch (error) {
				projectionDegraded = true;
				projectionDetail = `projection failed: ${error instanceof Error ? error.message : String(error)}`;
				try {
					await meaning.markProjection(updatedRecord.id, 'failed', projectionDetail);
				} catch (markError) {
					console.error('[quellight] projection bookkeeping failed:', markError);
				}
			}
		} else if (
			updatedRecord &&
			(fault === 'cognee' || !state.knowledge || state.knowledgeFaulted)
		) {
			projectionDegraded = true;
			projectionDetail = 'semantic projection unavailable for this record';
			try {
				await meaning.markProjection(updatedRecord.id, 'failed', projectionDetail);
			} catch {
				// bookkeeping only
			}
		}
	}
	const view = await recordViewOf(meaning, recordId);
	return { record: view, projectionDegraded, projectionDetail };
}

async function recordViewOf(
	meaning: MeaningStore,
	recordId: string
): Promise<import('$lib/types').MeaningRecordView> {
	const bundle = await meaning.inspectorData();
	const all = [...bundle.current, ...bundle.proposed, ...bundle.history];
	const found = all.find((r) => r.id === recordId);
	if (!found) {
		throw new Error('Meaning record not found after decision.');
	}
	return found;
}
