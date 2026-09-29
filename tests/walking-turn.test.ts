/**
 * Frozen G1 automated proof — the walking slice, end to end, deterministic.
 *
 * REAL stack: VICT registry/activation (@victframework/runtime), pinned
 * Mastra adapter (@victframework/mastra) with the REQUIRED deterministic
 * offline fixture model, real Quellight turn orchestration and real
 * KnowledgeStore wrapper code.
 *
 * DOUBLE: only the Cognee worker boundary (FakeCogneePack at the capability-
 * binding surface), plus a prompt-capturing proxy AROUND the real fixture
 * model. The real Cognee worker path is proven separately
 * (proof/g1-cognee-integration.mjs).
 */

import { mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { KnowledgeStore } from '$lib/server/knowledge';
import { createDeterministicFixture } from '$lib/server/fixture-model';
import { composeTurnInput } from '$lib/server/compose';
import { createQuellightAgent, type QuellightAgent } from '$lib/server/product-agent';
import { runWalkingTurn, type WalkingTurnDeps } from '$lib/server/turn';
import { FakeCogneePack } from './helpers/fake-cognee';
import { CapturedCalls, withPromptCapture } from './helpers/capture-model';
import type { TurnResponse } from '$lib/types';

const FACT = 'My project codename is Zephyr.';
const RECALL = 'What is my project codename?';
const OFF_CORPUS = 'What is my favorite color?';
const tmpDirs: string[] = [];

let fixture = createDeterministicFixture();
let agent: QuellightAgent | null = null;
let captured: CapturedCalls;
let turnCounter = 0;

async function freshStore(searchProvider?: (query: string) => Parameters<typeof composeTurnInput>[1] extends never ? never : { text: string; score?: number }[]): Promise<{
	store: KnowledgeStore;
	pack: FakeCogneePack;
}> {
	const pack = new FakeCogneePack(searchProvider as never);
	const store = (await KnowledgeStore.create({
		pythonPath: 'unused',
		storeRoot: 'unused',
		namespaces: ['g1'],
		createPack: () => pack.get() as never
	})) as never as KnowledgeStore;
	return { store, pack };
}

async function makeDeps(options: {
	question: string;
	store: KnowledgeStore;
	fault?: WalkingTurnDeps['fault'];
}): Promise<WalkingTurnDeps> {
	return {
		question: options.question,
		turnIndex: ++turnCounter,
		knowledge: options.store,
		knowledgeFaulted: false,
		fixture,
		agent: agent as QuellightAgent,
		modelIdentity: 'offline-fixture/deterministic-1',
		fault: options.fault ?? 'none'
	};
}

const answerText = (response: TurnResponse): string =>
	response.kind === 'assistant' ? response.text : `<error:${response.errorCode}>`;
const assistantOf = (response: TurnResponse): Extract<TurnResponse, { kind: 'assistant' }> =>
	response as Extract<TurnResponse, { kind: 'assistant' }>;

beforeAll(async () => {
	const tmp = mkdtempSync(path.join(os.tmpdir(), 'quellight-g1-test-'));
	tmpDirs.push(tmp);
	process.env.QUOLLIGHT_RUN_ROOT = tmp;
	mkdirSync(path.join(tmp, 'mastra-store'), { recursive: true });
	// ONE Quellight fixture instance shared by registration (orchestration)
	// and the model (adapter), wrapped in the prompt-capturing proxy.
	fixture = createDeterministicFixture();
	captured = new CapturedCalls();
	agent = await createQuellightAgent(() => withPromptCapture(fixture.modelFactory(), captured));
});

afterAll(async () => {
	await agent?.close();
	for (const dir of tmpDirs) {
		for (let attempt = 0; attempt < 5; attempt += 1) {
			try {
				rmSync(dir, { recursive: true, force: true });
				break;
			} catch {
				await new Promise((r) => setTimeout(r, 500));
			}
		}
	}
});

beforeEach(() => {
	// Clear recorded prompts; the fixture script accumulates entries
	// deliberately (deterministic replay across tests).
	captured.prompts.splice(0);
	turnCounter = 0;
});

describe('G1 walking slice (frozen contract §7)', () => {
	it('1. accepts a user message and returns an assistant response', async () => {
		const { store } = await freshStore();
		const result = await runWalkingTurn(await makeDeps({ question: 'Hello.', store }));
		expect(result.response.kind).toBe('assistant');
		expect(answerText(result.response).length).toBeGreaterThan(0);
	});

	it('2. durable intake routes through VICT/Cognee capability bindings (add + cognify, keyed)', async () => {
		const { store, pack } = await freshStore();
		const result = await runWalkingTurn(await makeDeps({ question: FACT, store }));
		expect(result.response.kind).toBe('assistant');
		expect(pack.addCalls.length).toBe(1);
		expect(pack.cognifyCalls.length).toBe(1);
		const addInput = pack.addCalls[0].input as { datasetName: string; content: string };
		expect(addInput.datasetName).toBe('g1.quellight');
		expect(addInput.content).toBe(FACT);
		expect(pack.addCalls[0].call.mode).toBe('normal');
		expect(pack.addCalls[0].call.idempotencyKey).toBeTruthy();
		const cognifyInput = pack.cognifyCalls[0].input as { datasetName: string };
		expect(cognifyInput.datasetName).toBe('g1.quellight');
	});

	it('3. later retrieval receives the stored synthetic knowledge through the scoped read', async () => {
		const { store, pack } = await freshStore();
		await runWalkingTurn(await makeDeps({ question: FACT, store }));
		expect(pack.searchCalls.length).toBeGreaterThan(0);
		const result = await runWalkingTurn(await makeDeps({ question: RECALL, store }));
		expect(result.response.kind).toBe('assistant');
		expect(result.retrievedCount).toBeGreaterThan(0);
		expect(answerText(result.response)).toContain(FACT);
	});

	it('4. retrieved candidate context reaches the REAL ProductAgent/model surface', async () => {		const { store } = await freshStore();
		captured.prompts.splice(0);
		await runWalkingTurn(await makeDeps({ question: FACT, store }));
		const factTurnPrompt = captured.prompts.at(-1)?.at(-1);
		expect(factTurnPrompt).toContain(FACT); // the user message itself is the composed input (no hits yet)
		captured.prompts.splice(0);
		await runWalkingTurn(await makeDeps({ question: RECALL, store }));
		const recallComposed = captured.prompts.at(-1)?.at(-1);
		expect(typeof recallComposed).toBe('string');
		expect(recallComposed).toContain('[Retrieved knowledge candidates');
		expect(recallComposed).toContain(FACT);
		expect(recallComposed).toContain(RECALL);
		// The composed input is exactly what the frozen composer produces
		// (mirroring the orchestration's trivial self-match filter).
		const rawCandidates = await store.search(RECALL);
		const filtered = rawCandidates.filter(
			(c) => c.text.trim().toLowerCase() !== RECALL.trim().toLowerCase()
		);
		const expected = composeTurnInput(RECALL, filtered);
		expect(recallComposed).toBe(expected);
	});

	it('5. deterministic fixture produces the expected composed answer end to end', async () => {
		const { store } = await freshStore();
		await runWalkingTurn(await makeDeps({ question: FACT, store }));
		const result = await runWalkingTurn(await makeDeps({ question: RECALL, store }));
		const assistant = assistantOf(result.response);
		expect(assistant.text).toContain(FACT);
		expect(assistant.meta.retrieval).toBe('used');
		expect(assistant.meta.modelIdentity).toBe('offline-fixture/deterministic-1');
	});

	it('6. off-corpus question does NOT assert a stored personal fact (zero-hit case)', async () => {
		const { store } = await freshStore(); // empty datasets
		await runWalkingTurn(await makeDeps({ question: FACT, store }));
		const result = await runWalkingTurn(await makeDeps({ question: OFF_CORPUS, store }));
		const assistant = assistantOf(result.response);
		expect(assistant.text).toContain('don\u2019t have durable knowledge');
		expect(assistant.text).not.toContain('Zephyr');
		expect(assistant.meta.retrieval).toBe('miss');
	});

	it('6b. off-corpus with a weak unrelated candidate does not fabricate a personal fact', async () => {
		const { store } = await freshStore(() => [{ text: FACT, score: 0.4700494408607483 }]);
		const result = await runWalkingTurn(await makeDeps({ question: OFF_CORPUS, store }));
		const assistant = assistantOf(result.response);
		// The weak candidate is quoted AS A NOTE (attributed, unverified), never asserted.
		expect(assistant.text).toContain('From your stored knowledge');
		expect(assistant.text).toContain('unverified candidate');
		expect(assistant.text.toLowerCase()).not.toMatch(/your (favorite|favourite) colo/);
		expect(assistant.text.toLowerCase()).not.toContain('blue');
	});

	it('7. Cognee failure does not fabricate retrieval (truthful degraded answer)', async () => {
		const { store: _store, pack } = await freshStore();
		pack.failMode = 'search';
		const result = await runWalkingTurn(await makeDeps({ question: RECALL, store: _store }));
		const assistant = assistantOf(result.response);
		expect(assistant.meta.retrieval).toBe('unavailable');
		expect(assistant.text).toContain('don\u2019t have durable knowledge');
		expect(assistant.text).not.toContain(FACT);
	});

	it('7b. intake failure degrades storage without killing the turn', async () => {
		const { store: _store, pack } = await freshStore();
		pack.failMode = 'add';
		const result = await runWalkingTurn(await makeDeps({ question: RECALL, store: _store }));
		const assistant = assistantOf(result.response);
		expect(assistant.meta.intakeDegraded).toBe(true);
		expect(result.response.kind).toBe('assistant');
	});

	it('8. model failure surfaces as failure (no fake success)', async () => {
		const { store } = await freshStore();
		const result = await runWalkingTurn(
			await makeDeps({ question: RECALL, store, fault: 'model' })
		);
		expect(result.response.kind).toBe('error');
		expect((result.response as { errorCode?: string }).errorCode).toBe('model-failed');
	});

	it('9. no model output is ever written as durable knowledge (user content only)', async () => {
		const { store, pack } = await freshStore();
		const first = await runWalkingTurn(await makeDeps({ question: FACT, store }));
		const firstText = answerText(first.response);
		let storedContent = pack.addCalls
			.map((c) => (c.input as { content: string }).content)
			.join('|||');
		expect(storedContent).toBe(FACT);
		expect(storedContent.includes(firstText)).toBe(false);
		await runWalkingTurn(await makeDeps({ question: RECALL, store }));
		storedContent = pack.addCalls
			.map((c) => (c.input as { content: string }).content)
			.join('|||');
		expect(storedContent).toBe([FACT, RECALL].join('|||'));
		expect(storedContent.includes('From your stored knowledge')).toBe(false);
	});
});