/**
 * Quellight reasoning boundary — G2 extension of the G1 ProductAgent wrap.
 *
 * Reasoning flows through the neutral VICT ProductAgent boundary
 * (AGENT_PROFILE_SCHEMA authoring in @victframework/sdk; profile registry
 * and activation in @victframework/runtime; `MastraProductAgent` as the
 * Mastra-backed implementation via @victframework/mastra).
 *
 * G2 adds a SECOND conversation lane for bounded semantic extraction
 * (frozen contract §6): extraction turns share the model route but never
 * the main conversation thread.
 *
 * The pinned VICT/Mastra deterministic offline fixture is the REQUIRED
 * deterministic model path (QD-02). No Mastra/product coupling beyond this
 * server module: the browser never sees Mastra concepts.
 *
 * Quellight product instruction (G2): retrieved/eligible meaning is
 * canonical-checked context; the extraction lane must propose, never decide.
 */

import { AgentProfileRegistry, protectCredentialPort } from '@victframework/runtime';
import {
	createDedicatedMastraStore,
	mastraThreadIdForConversation,
	MastraProductAgent,
	MastraThreadCoordinator,
	MASTRA_ADAPTER_COMPATIBILITY,
	OFFLINE_MODEL_IDENTITY,
	verifyMastraAdapterCompatibility
} from '@victframework/mastra';
import { AGENT_PROFILE_SCHEMA } from '@victframework/sdk';
import { resolveStoreLocations } from './config.js';

export const G2_PROFILE_ID = 'agent.quellight.g2';
export const G2_CONVERSATION = 'g2-quellight-conversation';
export const G2_EXTRACTION_LANE = 'g2-meaning-extraction';

const G2_INSTRUCTIONS = `You are Quellight, a persistent cognitive partner of a single user.
You answer the current question in natural, concise language.
An "[Eligible durable meaning]" block, when present, is accepted, current meaning
from your canonical store: it is established user meaning you may use directly.
It never includes proposed, rejected, or superseded meaning.
Your reply becomes visible to the user; it is never automatically accepted as
durable state. Never invent a fact: when nothing answers the question, say so.`;

const G2_EXTRACTION_INSTRUCTIONS = `You perform ONE bounded task: classify the user's
message for durable-meaning candidates and reply with ONLY the JSON object the
input asks for. You may PROPOSE meaning; you never decide whether it is accepted.
Follow the reply shape exactly; never add prose.`;

const RETENTION = {
	messagesMaxAgeMs: 3_600_000,
	threadsMaxAgeMs: 86_400_000,
	spansMaxAgeMs: 3_600_000
};

const G2_TURN_POLICY = { maxSteps: 4, maxToolCalls: 4, onLimit: 'fail-closed' as const };

export type AgentLane = 'conversation' | 'extraction';

export interface QuellightAgent {
	runTurn(input: {
		turnId: string;
		input: string;
		lane?: AgentLane;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		context?: any;
	}): Promise<{
		status: string;
		text?: string;
		errorCode?: string;
		providerModelIdentity?: string;
	}>;
	close(): Promise<void>;
	adapterCompatOk(): boolean;
}

export async function createQuellightAgent(modelFactory: () => unknown): Promise<QuellightAgent> {
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
			id: 'instructions.quellight.g2',
			revision: '1',
			text: G2_INSTRUCTIONS
		},
		{
			kind: 'instructions',
			id: 'instructions.quellight.g2.extraction',
			revision: '1',
			text: G2_EXTRACTION_INSTRUCTIONS
		},
		{
			kind: 'memory-policy',
			id: 'memory-policy.quellight.g2',
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
		id: G2_PROFILE_ID,
		revision: '1',
		instructions: { id: 'instructions.quellight.g2', revision: '1' },
		modelProfile: {
			id: 'model.quellight.g2.deterministic',
			revision: '1',
			routerModel: OFFLINE_MODEL_IDENTITY,
			provider: 'offline-fixture',
			providerCredentialVar: 'QUOLLIGHT_NO_CREDENTIAL_REQUIRED'
		},
		generation: { temperature: 0, maxOutputTokens: 512 },
		turnPolicy: G2_TURN_POLICY,
		memoryPolicy: { id: 'memory-policy.quellight.g2', revision: '1' },
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
	const activation = registry.activateAgentProfile({ id: G2_PROFILE_ID, revision: '1' });

	const agent = MastraProductAgent.create(activation, {
		store: dedicated.store,
		threadCoordinator: new MastraThreadCoordinator(),
		modelFactory
	});

	const context = {
		credentials: protectCredentialPort({
			async get(name) {
				void name;
				return 'QUOLLIGHT-NO-CREDENTIAL-REQUIRED-G2';
			}
		})
	};
	const conversationThread = mastraThreadIdForConversation(G2_CONVERSATION);
	const extractionThread = mastraThreadIdForConversation(G2_EXTRACTION_LANE);
	let counter = 0;

	return {
		adapterCompatOk: () => compat.ok === true,
		close: () => dedicated.close(),
		async runTurn(input) {
			counter += 1;
			const result = await agent.runTurn(
				{
					turnId: `g2-turn-${counter}`,
					threadId: input.lane === 'extraction' ? extractionThread : conversationThread,
					actorId: 'quellight-user-g2',
					input: input.input
				},
				input.context ?? context
			);
			return {
				status: result.status,
				text: typeof result.text === 'string' ? result.text : undefined,
				errorCode: undefined,
				providerModelIdentity: result.providerModelIdentity
			} as { status: string; text?: string; errorCode?: string; providerModelIdentity?: string };
		}
	};
}
