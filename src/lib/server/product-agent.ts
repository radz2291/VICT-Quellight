/**
 * Quellight G1 reasoning boundary — Work Package E.
 *
 * Reasoning flows through the neutral VICT ProductAgent boundary
 * (AGENT_PROFILE_SCHEMA authoring in @victframework/sdk; profile registry and
 * activation in @victframework/runtime; `MastraProductAgent` as the
 * Mastra-backed implementation of that boundary via @victframework/mastra).
 *
 * The pinned VICT/Mastra deterministic offline fixture is the REQUIRED
 * deterministic model path (QD-02). No Mastra/product coupling beyond this
 * server module: the browser never sees Mastra concepts.
 *
 * Quellight product instruction (G1): tell the agent how to treat retrieved
 * candidates — as unverified context, never guaranteed truth.
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

export const G1_PROFILE_ID = 'agent.quellight.g1';
export const G1_CONVERSATION = 'g1-walking-quellight';

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
	messagesMaxAgeMs: 3_600_000,
	threadsMaxAgeMs: 86_400_000,
	spansMaxAgeMs: 3_600_000
};

const G1_TURN_POLICY = { maxSteps: 4, maxToolCalls: 4, onLimit: 'fail-closed' as const };

export interface QuellightAgent {
	runTurn(input: {
		turnId: string;
		input: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		context?: any;
	}): Promise<{ status: string; text?: string; errorCode?: string; providerModelIdentity?: string }>;
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
				void name;
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
				text: typeof result.text === 'string' ? result.text : undefined,
				errorCode: undefined,
				providerModelIdentity: result.providerModelIdentity
			} as { status: string; text?: string; errorCode?: string; providerModelIdentity?: string };
		}
	};
}
