import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createDeterministicOfflineModel,
	verifyMastraAdapterCompatibility,
	createDedicatedMastraStore,
	MASTRA_ADAPTER_COMPATIBILITY,
	OFFLINE_MODEL_IDENTITY,
	MastraProductAgent,
	MastraThreadCoordinator,
	mastraThreadIdForConversation
} from '@victframework/mastra';
import { createCogneePack } from '@victframework/cognee';
import { AgentProfileRegistry, protectCredentialPort } from '@victframework/runtime';
import { AGENT_PROFILE_SCHEMA } from '@victframework/sdk';

const here = path.dirname(fileURLToPath(import.meta.url));
function resolveStoreLocations(baseDir) {
	const root = process.env.QUOLLIGHT_RUN_ROOT ?? path.resolve(here, '../../..', 'quellight/run');
	return { mastraStore: path.join(root, 'mastra-store') };
}
function resolveKnowledgeConfig(baseRunRoot) {
	const root = process.env.QUOLLIGHT_RUN_ROOT ?? path.resolve(here, '../../..', 'quellight/run');
	const pythonPath = process.env.QUOLLIGHT_COGNEE_PYTHON ?? '';
	return {
		enabled: process.env.QUOLLIGHT_COGNEE_DISABLED !== '1' && pythonPath.length > 0,
		pythonPath,
		storeRoot: path.join(root, 'cognee-store'),
		namespaces: ['g1']
	};
}
function resolveModelPlan() {
	return {
		mode: 'deterministic-fixture',
		modelIdentity: 'offline-fixture/deterministic-1',
		liveStatus: 'NOT RUN — no authorized configured credential available'
	};
}
function resolveFaultInjection() {
	const value = (process.env.QUOLLIGHT_FAULT ?? 'none').toLowerCase();
	return value === 'retrieval' || value === 'model' ? value : 'none';
}
function createDeterministicFixture() {
	const writable = {};
	const script = writable;
	const model = createDeterministicOfflineModel({ script });
	let entries = 0;
	const register = (composedInput, step) => {
		writable[composedInput] = step;
		entries += 1;
	};
	return {
		modelFactory: () => model,
		registerText(composedInput, text) {
			const step = { kind: 'text', text };
			register(composedInput, step);
		},
		registerThrow(composedInput) {
			const step = { kind: 'throw', message: 'VICT_OFFLINE_MODEL_FAILED' };
			register(composedInput, step);
		},
		entryCount() {
			return entries;
		},
		hasEntry(composedInput) {
			return Object.prototype.hasOwnProperty.call(writable, composedInput);
		},
		describeCandidates(question, candidates) {
			const useful = candidates.filter((c) => c.text && c.text.trim().length > 0);
			if (useful.length === 0) {
				return 'I don’t have durable knowledge about that — nothing relevant was retrieved from your stored knowledge. I won’t guess or invent a fact.';
			}
			const quoted = useful
				.slice(0, 3)
				.map((c) => `“${c.text.trim()}”`)
				.join('; ');
			const intro =
				useful.length === 1
					? 'From your stored knowledge (retrieved as an unverified candidate), the relevant note I have is:'
					: 'From your stored knowledge (retrieved as unverified candidates), the relevant notes I have are, in order:';
			return `${intro} ${quoted}.`;
		}
	};
}
const G1_DATASET = 'g1.quellight';
function binding(pack, id) {
	const found = pack.bindings.capabilities.find((b) => b.id === id);
	return found ? { id: found.id, invoke: (input, call) => found.invoke(input, call) } : void 0;
}
class KnowledgeDependencyError extends Error {
	constructor(message) {
		super(message);
		this.name = 'KnowledgeDependencyError';
	}
}
class KnowledgeStore {
	constructor(pack, addBinding, cognifyBinding, searchBinding) {
		this.pack = pack;
		this.addBinding = addBinding;
		this.cognifyBinding = cognifyBinding;
		this.searchBinding = searchBinding;
	}
	pack;
	addBinding;
	cognifyBinding;
	searchBinding;
	static async create(options) {
		let pack;
		try {
			const createFn = options.createPack ?? createCogneePack;
			pack = createFn({
				pythonPath: options.pythonPath,
				cwd: options.storeRoot,
				storeRoot: options.storeRoot,
				namespaces: options.namespaces,
				readyBudgetMs: options.readyBudgetMs ?? 24e4
			});
		} catch (error) {
			throw new KnowledgeDependencyError(
				`Cognee capability pack unavailable: ${error instanceof Error ? error.message : String(error)}`
			);
		}
		const add = binding(pack, 'cognee.add');
		const cognify = binding(pack, 'cognee.cognify');
		const search = binding(pack, 'cognee.searchChunks');
		if (!add || !cognify || !search) {
			void pack.supervision.shutdown();
			throw new KnowledgeDependencyError('Required Cognee capability bindings missing from pack');
		}
		return new KnowledgeStore(pack, add, cognify, search);
	}
	/** Durable intake: add + cognify a user-submitted message (keyed, idempotent per call). */
	async storeMessage(content, idempotencyKey) {
		const addReceipt = await this.addBinding.invoke(
			{ datasetName: G1_DATASET, content },
			{ mode: 'normal', idempotencyKey }
		);
		await this.cognifyBinding.invoke(
			{ datasetName: G1_DATASET },
			{ mode: 'normal', idempotencyKey: `${idempotencyKey}-cognify` }
		);
		return {
			datasetName: addReceipt.datasetName ?? G1_DATASET,
			itemsAfter: typeof addReceipt.itemsAfter === 'number' ? addReceipt.itemsAfter : 0
		};
	}
	/**
	 * Scoped read through the capability pack. Returns candidates only —
	 * callers must treat them as unverified context (D-007 invariant).
	 */
	async search(query, topK = 5) {
		const result = await this.searchBinding.invoke(
			{ datasets: [G1_DATASET], query, topK },
			{ mode: 'normal' }
		);
		const hits = Array.isArray(result?.hits) ? result.hits : [];
		return hits
			.filter((h) => typeof h?.text === 'string' && h.text.trim().length > 0)
			.map((h) => ({ text: h.text, score: h.score }));
	}
	async close() {
		try {
			await this.pack.supervision.shutdown();
		} catch {}
	}
}
const G1_PROFILE_ID = 'agent.quellight.g1';
const G1_CONVERSATION = 'g1-walking-quellight';
const G1_INSTRUCTIONS = `You are Quellight, a persistent cognitive partner of a single user.
You answer the current question in natural, concise language.
A "[Retrieved knowledge candidates]" block, when present in the conversation,
is UNVERIFIED retrievable context that may or may not be relevant. Treat it as
context, not as guaranteed truth. Never treat an unsupported candidate as an
established user fact. If nothing in the retrieved context answers the
question, say plainly that you do not have that information rather than
inventing one. Your reply becomes visible to the user; it is never
automatically accepted as durable state.`;
const RETENTION = {
	messagesMaxAgeMs: 36e5,
	threadsMaxAgeMs: 864e5,
	spansMaxAgeMs: 36e5
};
const G1_TURN_POLICY = { maxSteps: 4, maxToolCalls: 4, onLimit: 'fail-closed' };
async function createQuellightAgent(modelFactory) {
	const compat = await verifyMastraAdapterCompatibility();
	if (!compat.ok) {
		throw new Error('Mastra adapter compatibility self-check failed; refusing to start reasoning');
	}
	const locations = resolveStoreLocations();
	const dedicated = await createDedicatedMastraStore({
		dataDir: locations.mastraStore,
		retention: RETENTION
	});
	const registry = new AgentProfileRegistry({ resolveCapabilityRevision: () => true });
	registry.installArtifacts([
		{
			kind: 'instructions',
			id: 'instructions.quellight.g1',
			revision: '1',
			text: G1_INSTRUCTIONS
		},
		{
			kind: 'memory-policy',
			id: 'memory-policy.quellight.g1',
			revision: '1',
			config: {
				lastMessages: 10,
				workingMemory: { enabled: false },
				semanticRecall: false
			}
		}
	]);
	registry.registerProfile({
		schema: AGENT_PROFILE_SCHEMA,
		id: G1_PROFILE_ID,
		revision: '1',
		instructions: { id: 'instructions.quellight.g1', revision: '1' },
		modelProfile: {
			id: 'model.quellight.g1.deterministic',
			revision: '1',
			routerModel: OFFLINE_MODEL_IDENTITY,
			provider: 'offline-fixture',
			providerCredentialVar: 'QUOLLIGHT_NO_CREDENTIAL_REQUIRED'
		},
		generation: { temperature: 0, maxOutputTokens: 512 },
		turnPolicy: G1_TURN_POLICY,
		memoryPolicy: { id: 'memory-policy.quellight.g1', revision: '1' },
		guardrails: [],
		helperTools: [],
		capabilities: [],
		adapter: {
			id: '@victframework/mastra',
			revision: MASTRA_ADAPTER_COMPATIBILITY.revision,
			runtimePackages: {
				'@mastra/core': '1.64.0',
				'@mastra/memory': '1.28.2',
				'@mastra/libsql': '1.22.3',
				'@mastra/observability': '1.17.5'
			}
		}
	});
	const activation = registry.activateAgentProfile({ id: G1_PROFILE_ID, revision: '1' });
	const agent = MastraProductAgent.create(activation, {
		store: dedicated.store,
		threadCoordinator: new MastraThreadCoordinator(),
		modelFactory
	});
	const context = {
		credentials: protectCredentialPort({
			async get(name) {
				return 'QUOLLIGHT-NO-CREDENTIAL-REQUIRED-G1';
			}
		})
	};
	const conversationId = mastraThreadIdForConversation(G1_CONVERSATION);
	let counter = 0;
	return {
		adapterCompatOk: () => compat.ok === true,
		close: () => dedicated.close(),
		async runTurn(input) {
			counter += 1;
			const result = await agent.runTurn(
				{
					turnId: `g1-turn-${counter}`,
					threadId: conversationId,
					actorId: 'quellight-user-g1',
					input: input.input
				},
				input.context ?? context
			);
			return {
				status: result.status,
				text: typeof result.text === 'string' ? result.text : void 0,
				errorCode: void 0,
				providerModelIdentity: result.providerModelIdentity
			};
		}
	};
}
const MAX_CANDIDATES = 5;
function composeTurnInput(question, candidates, options) {
	const max = MAX_CANDIDATES;
	const selected = candidates.slice(0, max);
	if (selected.length === 0) {
		return question;
	}
	const blocks = selected.map((c, i) => `${i + 1}. ${c.text.trim()}`).join('\n');
	return [
		'[Retrieved knowledge candidates — unverified; may or may not be relevant.]',
		blocks,
		'[End retrieved candidates]',
		'',
		'Current question:',
		question
	].join('\n');
}
const G1_MAX_CANDIDATES = MAX_CANDIDATES;
const GREETING_ENTRY_INPUT = 'Hello.';
const GREETING_ENTRY_TEXT =
	'Hello! I’m Quellight — your persistent cognitive partner. What would you like to do?';
async function runWalkingTurn(deps) {
	const { question, knowledge, knowledgeFaulted, fixture, agent, modelIdentity, fault } = deps;
	let intakeDegraded = false;
	let retrievalDegraded = false;
	let candidates = [];
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
	const normalize = (s) => s.trim().toLowerCase();
	candidates = candidates.filter((c) => normalize(c.text) !== normalize(question));
	const composedInput = composeTurnInput(question, candidates);
	if (fault === 'model') {
		fixture.registerThrow(composedInput);
	} else if (!fixture.hasEntry(composedInput)) {
		if (composedInput === GREETING_ENTRY_INPUT) {
			fixture.registerText(GREETING_ENTRY_INPUT, GREETING_ENTRY_TEXT);
		} else {
			fixture.registerText(composedInput, fixture.describeCandidates(question, candidates));
		}
	}
	let runResult;
	try {
		runResult = await agent.runTurn({ turnId: `turn-${deps.turnIndex}`, input: composedInput });
	} catch (error) {
		return {
			response: {
				kind: 'error',
				errorCode: 'model-failed',
				message: `Quellight could not produce a response: ${error instanceof Error ? error.message : String(error)}`
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
	const meta = {
		retrieval: retrievalDegraded ? 'unavailable' : candidates.length > 0 ? 'used' : 'miss',
		intakeDegraded,
		modelIdentity
	};
	return {
		response: { kind: 'assistant', text: runResult.text, meta },
		retrievedCount: candidates.length
	};
}
const state = {
	fixture: createDeterministicFixture(),
	agent: null,
	knowledge: null,
	knowledgeLoadError: null,
	knowledgeFaulted: false,
	modelIdentity: resolveModelPlan().modelIdentity,
	turnIndex: 0,
	knowledgeInitStarted: false
};
async function ensureAgent() {
	if (!state.agent) {
		state.agent = await createQuellightAgent(state.fixture.modelFactory);
	}
	return state.agent;
}
function startKnowledgeInit() {
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
		.catch((error) => {
			state.knowledge = null;
			state.knowledgeFaulted = true;
			state.knowledgeLoadError = error instanceof Error ? error.message : String(error);
		});
	return init;
}
async function ensureKnowledge() {
	if (!state.knowledgeInitStarted) {
		startKnowledgeInit();
	}
}
async function executeTurn(question) {
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
		agent: state.agent,
		modelIdentity: state.modelIdentity,
		fault
	});
}
async function serverStatus() {
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

export { executeTurn as e, serverStatus as s };
//# sourceMappingURL=quellight-29t6ux1E.js.map
