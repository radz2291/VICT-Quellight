/**
 * Quellight G1 server composition root.
 *
 * Lazily builds the durable knowledge store and the VICT ProductAgent with
 * the deterministic fixture (QD-02). Knowledge is DEGRADED, never fatal:
 * without a Python worker the app still converses, answering truthfully that
 * knowledge retrieval is unavailable. Singletons live for the app process.
 */

import { resolveFaultInjection, resolveKnowledgeConfig, resolveModelPlan } from './config.js';
import { createDeterministicFixture } from './fixture-model.js';
import { KnowledgeStore } from './knowledge.js';
import { createQuellightAgent, type QuellightAgent } from './product-agent.js';
import { runWalkingTurn } from './turn.js';


interface QuellightState {
	fixture: ReturnType<typeof createDeterministicFixture>;
	agent: QuellightAgent | null;
	knowledge: KnowledgeStore | null;
	knowledgeLoadError: string | null;
	knowledgeFaulted: boolean;
	modelIdentity: string;
	turnIndex: number;
	knowledgeInitStarted: boolean;
}

const state: QuellightState = {
	fixture: createDeterministicFixture(),
	agent: null,
	knowledge: null,
	knowledgeLoadError: null,
	knowledgeFaulted: false,
	modelIdentity: resolveModelPlan().modelIdentity,
	turnIndex: 0,
	knowledgeInitStarted: false
};

export async function ensureAgent(): Promise<QuellightAgent> {
	if (!state.agent) {
		state.agent = await createQuellightAgent(state.fixture.modelFactory);
	}
	return state.agent;
}

/** Knowledge store bootstrap — non-blocking; degrades when unavailable. */
function startKnowledgeInit(): Promise<void> {
	state.knowledgeInitStarted = true;
	const config = resolveKnowledgeConfig();
	if (!config.enabled) {
		state.knowledgeFaulted = true;
		state.knowledgeLoadError = 'No Python worker path configured (QUOLLIGHT_COGNEE_PYTHON).';
		return Promise.resolve();
	}
	const init = KnowledgeStore.create(config)
		.then((store) => {
			state.knowledge = store;
			state.knowledgeFaulted = false;
		})
		.catch((error: unknown) => {
			state.knowledge = null;
			state.knowledgeFaulted = true;
			state.knowledgeLoadError =
				error instanceof Error ? error.message : String(error);
		});
	return init;
}

export async function ensureKnowledge(): Promise<void> {
	if (!state.knowledgeInitStarted) {
		const init = startKnowledgeInit();
		// Do NOT block the first turn on worker readiness; degraded until then.
		void init;
	}
}

export interface ServerTurnResult {
	response: Awaited<ReturnType<typeof runWalkingTurn>>['response'];
}

export async function executeTurn(question: string): Promise<ServerTurnResult> {
	await ensureAgent();
	await ensureKnowledge();
	state.turnIndex += 1;
	const fault = resolveFaultInjection();
	return runWalkingTurn({
		question,
		turnIndex: state.turnIndex,
		knowledge: state.knowledge,
		knowledgeFaulted: state.knowledgeFaulted,
		fixture: state.fixture,
		agent: state.agent as QuellightAgent,
		modelIdentity: state.modelIdentity,
		fault
	});
}

export interface ServerStatus {
	model: { identity: string; mode: string; liveStatus: string };
	knowledge: {
		state: 'ready' | 'degraded';
		detail: string | null;
		dataset: string;
	};
	turns: number;
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
			state: state.knowledge && !state.knowledgeFaulted ? 'ready' : 'degraded',
			detail: state.knowledgeFaulted ? state.knowledgeLoadError : null,
			dataset: 'g1.quellight'
		},
		turns: state.turnIndex
	};
}