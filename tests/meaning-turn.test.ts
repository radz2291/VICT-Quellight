/**
 * Frozen G2 turn-stack proof — the durable-meaning slice end to end,
 * deterministic (frozen contract §14).
 *
 * REAL stack: VICT registry/activation, pinned Mastra adapter with the
 * REQUIRED deterministic offline fixture model, real VICT Application Data
 * adapter (in-memory SQLite), real Quellight turn orchestration.
 * DOUBLE: only the Cognee worker boundary (FakeCogneePack at the capability-
 * binding surface), plus a prompt-capturing proxy around the real fixture
 * model. The real Cognee worker path is proven separately
 * (proof/g2-cognee-integration.mjs).
 */

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { KnowledgeStore } from '$lib/server/knowledge';
import { createDeterministicFixture } from '$lib/server/fixture-model';
import { composeExtractionInput } from '$lib/server/meaning-extraction';
import { createQuellightAgent, type QuellightAgent } from '$lib/server/product-agent';
import { runQuellightTurn, type G2TurnDeps } from '$lib/server/turn';
import { MeaningStore } from '$lib/server/meaning';
import { FakeCogneePack, PROJECTED_DATASET_NAME } from './helpers/fake-cognee';
import { CapturedCalls, withPromptCapture } from './helpers/capture-model';
import type { TurnResponse } from '$lib/types';

const REMEMBER_ZEPHYR = 'Remember that the project codename is Zephyr.';
const RECALL = 'What is my project codename?';
const ORDINARY = 'How does the weather look today for a walk?';
const PREFER = 'I prefer dark interfaces.';
const PREFER_RECALL = 'What interface style do I favor?';
const REMEMBER_ORION = 'Remember that the project codename is Orion now.';

const tmpDirs: string[] = [];

let fixture = createDeterministicFixture();
let agent: QuellightAgent | null = null;
let captured: CapturedCalls;
let turnCounter = 0;

async function freshHarness(
	searchProvider?: (query: string) => { text: string; score?: number }[]
): Promise<{
	knowledge: KnowledgeStore;
	pack: FakeCogneePack;
	meaning: MeaningStore;
}> {
	const pack = new FakeCogneePack(searchProvider as never);
	const store = await KnowledgeStore.create({
		pythonPath: 'unused',
		storeRoot: 'unused',
		namespaces: ['g2'],
		createPack: () => pack.get() as never
	});
	const meaning = MeaningStore.create({ path: ':memory:' });
	return { pack, meaning, knowledge: store };
}

function makeDeps(
	partial: Partial<G2TurnDeps> & {
		question: string;
		knowledge: KnowledgeStore | null;
		meaning: MeaningStore | null;
	}
): G2TurnDeps {
	return {
		question: partial.question,
		turnIndex: partial.turnIndex ?? ++turnCounter,
		knowledge: partial.knowledge,
		knowledgeFaulted: partial.knowledgeFaulted ?? false,
		meaning: partial.meaning,
		meaningFaulted: partial.meaningFaulted ?? false,
		fixture,
		agent: agent as QuellightAgent,
		modelIdentity: 'offline-fixture/deterministic-1',
		fault: partial.fault ?? 'none'
	};
}

const answerText = (response: TurnResponse): string =>
	response.kind === 'assistant' ? response.text : `<error:${response.errorCode}>`;
const assistantOf = (response: TurnResponse): Extract<TurnResponse, { kind: 'assistant' }> =>
	response as Extract<TurnResponse, { kind: 'assistant' }>;

beforeAll(async () => {
	const tmp = mkdtempSync(path.join(os.tmpdir(), 'quellight-g2-test-'));
	tmpDirs.push(tmp);
	process.env.QUOLLIGHT_RUN_ROOT = tmp;
	mkdirSync(path.join(tmp, 'mastra-store'), { recursive: true });
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
	captured.clear();
});

describe('G2 durable meaning (frozen contract §14)', () => {
	it('1+2. ordinary conversation performs NO canonical semantic write and NO cognify', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		const result = await runQuellightTurn(makeDeps({ question: ORDINARY, knowledge, meaning }));
		const assistant = assistantOf(result.response);
		expect(assistant.meta.durableWrite).toBe(false);
		expect(assistant.meta.meaningProposed).toBe(false);
		expect(await meaning.listAll()).toHaveLength(0);
		expect(pack.addCalls).toHaveLength(0);
		expect(pack.cognifyCalls).toHaveLength(0);
	});

	it('3. explicit persistence intent creates an accepted user_stated MeaningRecord (and answers)', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		const result = await runQuellightTurn(
			makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning })
		);
		const assistant = assistantOf(result.response);
		expect(assistant.meta.durableWrite).toBe(true);
		const records = await meaning.listCurrent();
		expect(records).toHaveLength(1);
		const record = records[0];
		expect(record.origin).toBe('user_stated');
		expect(record.decisionState).toBe('accepted');
		expect(record.semanticKey).toBe('project.codename');
		expect(record.value).toBe('Zephyr');
		expect(record.sourceExcerpt).toBe(REMEMBER_ZEPHYR);
		// 5. accepted/current meaning was projected (add + cognify, keyed).
		expect(pack.addCalls).toHaveLength(1);
		expect(pack.cognifyCalls).toHaveLength(1);
		const addInput = pack.addCalls[0].input as { datasetName: string; content: string };
		expect(addInput.datasetName).toBe(PROJECTED_DATASET_NAME);
		expect(addInput.content).toContain(`meaning_record_id=${record.id}`);
		expect(addInput.content).toContain('key=project.codename');
		expect(addInput.content).toContain('value=Zephyr');
		expect(pack.addCalls[0].call.idempotencyKey).toContain(record.id);
	});

	it('4+5+6+7. recall retrieves the projected meaning and includes it only after canonical mapping', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		await runQuellightTurn(makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning }));
		expect(pack.addCalls).toHaveLength(1);
		const result = await runQuellightTurn(makeDeps({ question: RECALL, knowledge, meaning }));
		const assistant = assistantOf(result.response);
		expect(assistant.meta.retrieval).toBe('used');
		expect(result.eligibleCount).toBe(1);
		// The REAL model surface received the eligible meaning as labeled context.
		const recallPrompt = captured.lastUserText() ?? '';
		expect(recallPrompt).toContain('Eligible durable meaning');
		expect(recallPrompt).toContain('project.codename = "Zephyr"');
		expect(recallPrompt).toContain(RECALL);
		// Anti-fabrication instruction verified at the REAL model call (system role,
		// closes G1 audit finding F8's assertion gap).
		const systemText = captured.allTextsForRole('system');
		expect(systemText).toContain('never automatically accepted as');
		expect(assistant.text).toContain('Zephyr');
	});

	it('8. AI inference creates agent_inferred + PROPOSED — not accepted, never projected', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		const result = await runQuellightTurn(makeDeps({ question: PREFER, knowledge, meaning }));
		const assistant = assistantOf(result.response);
		expect(assistant.meta.meaningProposed).toBe(true);
		expect(assistant.meta.durableWrite).toBe(false);
		const proposed = await meaning.listProposed();
		expect(proposed).toHaveLength(1);
		expect(proposed[0].origin).toBe('agent_inferred');
		expect(proposed[0].decisionState).toBe('proposed');
		// A proposal is NEVER projected.
		expect(pack.addCalls).toHaveLength(0);
		expect(pack.cognifyCalls).toHaveLength(0);
	});

	it('9. proposed meaning is EXCLUDED from ordinary model context', async () => {
		const { meaning, knowledge } = await freshHarness();
		await runQuellightTurn(makeDeps({ question: PREFER, knowledge, meaning }));
		const result = await runQuellightTurn(
			makeDeps({ question: PREFER_RECALL, knowledge, meaning })
		);
		const assistant = assistantOf(result.response);
		expect(assistant.meta.retrieval).toBe('miss');
		expect(result.eligibleCount).toBe(0);
		const recallPrompt = captured.lastUserText() ?? '';
		expect(recallPrompt).toBe(PREFER_RECALL); // bare question: nothing eligible entered context
		expect(recallPrompt).not.toContain('Prefers dark');
		expect(assistant.text).not.toContain('Prefers dark');
	});

	it('10. accepting a proposal makes it eligible (decision path projects accepted meaning)', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		await runQuellightTurn(makeDeps({ question: PREFER, knowledge, meaning }));
		const proposed = (await meaning.listProposed())[0];
		const decided = await meaning.decide(proposed.id, 'accept');
		expect(decided.record.decisionState).toBe('accepted');
		const eligible = await meaning.resolveEligible([proposed.id]);
		expect(eligible.has(proposed.id)).toBe(true);
		// The composition root's decision path then projects accepted meaning
		// (the same sequence decideOnMeaning runs; proven here at the boundary).
		const refreshed = (await meaning.get(proposed.id)) as NonNullable<typeof decided.record>;
		await knowledge.projectMeaning(refreshed, `meaning-project:${refreshed.id}`);
		await meaning.markProjection(refreshed.id, 'projected');
		expect(pack.addCalls.length).toBe(1);
		expect(pack.cognifyCalls.length).toBe(1);
	});

	it('11. rejecting a proposal keeps it ineligible', async () => {
		const { meaning, knowledge } = await freshHarness();
		await runQuellightTurn(makeDeps({ question: PREFER, knowledge, meaning }));
		const proposed = (await meaning.listProposed())[0];
		await meaning.decide(proposed.id, 'reject');
		const eligible = await meaning.resolveEligible([proposed.id]);
		expect(eligible.size).toBe(0);
		expect((await meaning.inspectorData()).history.some((r) => r.id === proposed.id)).toBe(true);
	});

	it('12+13. correction supersedes non-destructively; superseded meaning leaves model context', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		await runQuellightTurn(makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning }));
		expect((await meaning.listCurrent()).length).toBe(1);

		// Supersession via the deterministic remember-extraction.
		const correction = await runQuellightTurn(
			makeDeps({ question: REMEMBER_ORION, knowledge, meaning })
		);
		expect(assistantOf(correction.response).meta.durableWrite).toBe(true);
		const current = await meaning.listCurrent();
		expect(current).toHaveLength(1);
		expect(current[0].value).toBe('Orion');
		const all = await meaning.listAll();
		expect(all).toHaveLength(2); // Zephyr was NEVER deleted
		const zephyr = all.find((r) => r.value === 'Zephyr');
		expect(zephyr?.supersededById).toBe(current[0].id);

		// 14. stale-index protection: retrieval may return BOTH projections,
		// but only the eligible (current) Orion may enter model context.
		const recall = await runQuellightTurn(
			makeDeps({
				question: RECALL,
				knowledge,
				meaning
			})
		);
		const assistant = assistantOf(recall.response);
		expect(assistant.meta.retrieval).toBe('used');
		expect(recall.eligibleCount).toBe(1);
		const prompt = captured.lastUserText() ?? '';
		expect(prompt).toContain('Orion');
		expect(prompt).not.toContain('Zephyr');
		expect(assistant.text).toContain('Orion');
		expect(assistant.text).not.toContain('Zephyr');
		// Sanity: the fake index itself still contains BOTH (stale index persists).
		const projected = pack.addCalls.map((c) => (c.input as { content: string }).content).join('\n');
		expect(projected).toContain('Zephyr');
		expect(projected).toContain('Orion');
	});

	it('14 (forced). stale Cognee hits cannot bypass the canonical eligibility filter', async () => {
		// Deterministically force the search to return the STALE superseded
		// Zephyr projection plus Orion regardless of dataset state.
		const { meaning, knowledge } = await freshHarness(() => [
			{ text: 'meaning_record_id=stale-id key=project.codename value=Zephyr' },
			{ text: 'meaning_record_id=no-such-record-xyz key=project.codename value=Cinder' },
			{ text: 'this hit has NO record id at all' }
		]);
		await runQuellightTurn(makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning }));
		await runQuellightTurn(makeDeps({ question: REMEMBER_ORION, knowledge, meaning }));
		const result = await runQuellightTurn(
			makeDeps({ question: 'What is my project codename, really?', knowledge, meaning })
		);
		const assistant = assistantOf(result.response);
		// Superseded Zephyr hit + unresolvable hits are ALL excluded.
		expect(result.eligibleCount).toBe(0);
		expect(assistant.meta.retrieval).toBe('miss');
		const prompt = captured.lastUserText() ?? '';
		expect(prompt).toBe('What is my project codename, really?');
		expect(prompt).not.toContain('Zephyr');
		expect(prompt).not.toContain('Cinder');
	});

	it('16+17. Cognee failure never corrupts canonical meaning and is surfaced honestly', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		pack.failMode = 'add';
		const result = await runQuellightTurn(
			makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning })
		);
		const assistant = assistantOf(result.response);
		// Canonical truth survived: record written; degradation surfaced.
		expect(assistant.meta.durableWrite).toBe(true);
		expect(assistant.meta.projectionDegraded).toBe(true);
		expect(assistant.meta.projectionDetail).toBeTruthy();
		const records = await meaning.listCurrent();
		expect(records).toHaveLength(1);
		expect(records[0].projectionState).toBe('failed');
		expect(records[0].projectionDetail).toContain('FAKE-ADD-FAILURE');
	});

	it('17b. controlled cognee fault skips projection while the canonical write stands', async () => {
		const { meaning, knowledge } = await freshHarness();
		const result = await runQuellightTurn(
			makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning, fault: 'cognee' })
		);
		const assistant = assistantOf(result.response);
		expect(assistant.meta.durableWrite).toBe(true);
		expect(assistant.meta.projectionDegraded).toBe(true);
		expect(await meaning.listCurrent()).toHaveLength(1);
	});

	it('15. raw model output never directly becomes accepted canonical state', async () => {
		const { meaning, knowledge } = await freshHarness();
		// Script hostile extraction output: tries to auto-accept itself.
		const extractionInput = composeExtractionInput('Remember that the project codename is Zephyr.');
		fixture.registerExtraction(
			extractionInput,
			'{"intent":"remember","semanticKey":"project.codename","value":"ForgedValue","decisionState":"accepted","origin":"user_stated"}'
		);
		await runQuellightTurn(
			makeDeps({
				question: REMEMBER_ZEPHYR,
				knowledge,
				meaning,
				fault: 'none'
			})
		);
		expect(await meaning.listCurrent()).toHaveLength(0);
		// Nothing at all was written: only the closed schema + policy may persist.
		expect(await meaning.listAll()).toHaveLength(0);
	});

	it('extraction lane failure degrades honestly with NO write', async () => {
		const { meaning, knowledge } = await freshHarness();
		const result = await runQuellightTurn(
			makeDeps({ question: REMEMBER_ZEPHYR, knowledge, meaning, fault: 'extraction' })
		);
		const assistant = assistantOf(result.response);
		expect(assistant.meta.extractionDegraded).toBe(true);
		expect(await meaning.listAll()).toHaveLength(0);
		expect(assistant.text.length).toBeGreaterThan(0); // turn still answers
	});

	it('model failure surfaces as failure (no fake success)', async () => {
		const { meaning, knowledge } = await freshHarness();
		const result = await runQuellightTurn(
			makeDeps({ question: RECALL, knowledge, meaning, fault: 'model' })
		);
		expect(result.response.kind).toBe('error');
		expect((result.response as { errorCode?: string }).errorCode).toBe('model-failed');
	});

	it('18. no G1 every-message intake remains (knowledge store is projection-only)', async () => {
		const { pack, meaning, knowledge } = await freshHarness();
		await runQuellightTurn(makeDeps({ question: ORDINARY, knowledge, meaning }));
		expect(pack.addCalls).toHaveLength(0);
		expect(pack.cognifyCalls).toHaveLength(0);
		expect(await meaning.listAll()).toHaveLength(0);
	});
});
