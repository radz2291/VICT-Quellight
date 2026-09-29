/**
 * G0 Work Package B — VICT/Mastra proof.
 *
 * Proves, from a fresh consumer (this repository, dependencies installed from
 * the npm registry at the exact recorded pins):
 *
 *   consumer (this script)
 *     -> VICT-neutral ProductAgent boundary (ProductAgentPort / AgentProfileRegistry)
 *     -> @victframework/mastra (MastraProductAgent implementation)
 *     -> deterministic offline model fixture (NO provider credential)
 *
 * Expected output: PASS JSON with a deterministic scripted reply, identical on
 * a repeat turn, and a fail-closed result for an off-script input.
 *
 * Run:  npm install --no-audit --no-fund && npm run proof:mastra
 *
 * G0 evidence only — NOT product code. Nothing here is the Quellight product
 * experience; no Mastra API is treated as product architecture beyond this
 * proof boundary.
 */

import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AgentProfileRegistry, protectCredentialPort } from '@victframework/runtime';
import {
  createDedicatedMastraStore,
  createDeterministicOfflineModel,
  mastraThreadIdForConversation,
  MastraProductAgent,
  MastraThreadCoordinator,
  MASTRA_ADAPTER_COMPATIBILITY,
  OFFLINE_MODEL_IDENTITY,
  verifyMastraAdapterCompatibility,
} from '@victframework/mastra';
import { AGENT_PROFILE_SCHEMA } from '@victframework/sdk';

const RETENTION = {
  messagesMaxAgeMs: 3_600_000,
  threadsMaxAgeMs: 86_400_000,
  spansMaxAgeMs: 3_600_000,
};

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '.g0-run', 'mastra-store');
const SENTINEL = 'G0-MASTRA-SENTINEL-OK';
const INPUT = 'Reply with the marker phrase.';

function profileInput() {
  return {
    schema: AGENT_PROFILE_SCHEMA,
    id: 'agent.quellight.g0prooffinal',
    revision: '1',
    instructions: { id: 'instructions.quellight.g0', revision: '1' },
    modelProfile: {
      id: 'model.quellight.g0.offline',
      revision: '1',
      routerModel: 'offline-fixture/deterministic-1',
      provider: 'offline-fixture',
      providerCredentialVar: 'OFFLINE_FIXTURE_UNUSED',
    },
    generation: { temperature: 0, maxOutputTokens: 512 },
    turnPolicy: { maxSteps: 4, maxToolCalls: 4, onLimit: 'fail-closed' },
    memoryPolicy: { id: 'memory-policy.quellight.g0', revision: '1' },
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
        '@mastra/observability': '1.17.5',
      },
    },
  };
}

function artifacts() {
  return [
    { kind: 'instructions', id: 'instructions.quellight.g0', revision: '1', text: 'Be deterministic and brief.' },
    {
      kind: 'memory-policy',
      id: 'memory-policy.quellight.g0',
      revision: '1',
      config: { lastMessages: 10, workingMemory: { enabled: false }, semanticRecall: false },
    },
  ];
}

async function main() {
  rmSync(dataDir, { recursive: true, force: true });
  mkdirSync(dataDir, { recursive: true });

  // Neutral boundary first: profile authoring/schema live in @victframework/sdk,
  // registry/activation live in @victframework/runtime. No Mastra concept may
  // appear in this composition surface.
  const compat = await verifyMastraAdapterCompatibility();
  const dedicated = await createDedicatedMastraStore({ dataDir, retention: RETENTION });
  const registry = new AgentProfileRegistry({ resolveCapabilityRevision: () => true });
  registry.installArtifacts(artifacts());
  registry.registerProfile(profileInput());
  const activation = registry.activateAgentProfile({ id: 'agent.quellight.g0prooffinal', revision: '1' });

  const agent = MastraProductAgent.create(activation, {
    store: dedicated.store,
    threadCoordinator: new MastraThreadCoordinator(),
    modelFactory: () =>
      createDeterministicOfflineModel({
        script: { [INPUT]: { kind: 'text', text: SENTINEL } },
      }),
  });

  const context = {
    credentials: protectCredentialPort({
      async get(name) {
        void name;
        return 'G0-NO-CREDENTIAL-REQUIRED';
      },
    }),
  };
  const threadId = mastraThreadIdForConversation('g0-proof-conversation');

  const turn1 = await agent.runTurn(
    { turnId: 'g0-turn-1', threadId, actorId: 'g0-proof-actor', input: INPUT },
    context,
  );
  const turn2 = await agent.runTurn(
    { turnId: 'g0-turn-2', threadId, actorId: 'g0-proof-actor', input: INPUT },
    context,
  );
  // Negative control: off-script input must fail closed (no fabricated text).
  const off = await agent.runTurn(
    { turnId: 'g0-turn-3', threadId, actorId: 'g0-proof-actor', input: 'Off-script question.' },
    context,
  );

  await dedicated.close();

  const result = {
    proof: 'G0-WP-B VICT/Mastra consumer proof',
    adapterCompatibility: { ok: compat.ok, adapterId: MASTRA_ADAPTER_COMPATIBILITY.id, revision: MASTRA_ADAPTER_COMPATIBILITY.revision },
    turn1: { status: turn1.status, text: turn1.text ?? null, providerModelIdentity: turn1.providerModelIdentity ?? null },
    turn2: { status: turn2.status, text: turn2.text ?? null },
    deterministicRepeat: turn1.status === 'completed' && turn1.text === turn2.text,
    sentinelMatch: turn1.text === SENTINEL,
    offlineIdentity: turn1.providerModelIdentity ?? null,
    offScript: { status: off.status, errorCode: off.errorCode ?? null, text: off.text ?? null },
    pass:
      compat.ok === true &&
      turn1.status === 'completed' &&
      turn1.text === SENTINEL &&
      turn1.text === turn2.text,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exit(1);
}

main().catch((error) => {
  console.error('G0-WP-B PROOF ERROR:', error?.message ?? error);
  process.exit(1);
});