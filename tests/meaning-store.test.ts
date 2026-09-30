/**
 * Frozen G2 canonical Meaning Store tests (real VICT Application Data
 * adapter — @victframework/appdata-sqlite; in-memory SQLite plus a real
 * on-disk restart proof; contract §14 tests 3, 4, 8, 10, 11, 12, 15, 16).
 */

import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { MeaningStore, effectiveState, isEligibleCurrent } from '$lib/server/meaning';
import type { MeaningCandidate } from '$lib/types';

const tmpDirs: string[] = [];

function tmpFile(name: string): string {
	const dir = mkdtempSync(path.join(os.tmpdir(), `quellight-g2-${name}-`));
	tmpDirs.push(dir);
	return path.join(dir, 'appdata.sqlite');
}

afterAll(() => {
	for (const dir of tmpDirs) {
		try {
			rmSync(dir, { recursive: true, force: true });
		} catch {
			// best effort (Windows handles can linger one tick)
		}
	}
});

const REMEMBER: MeaningCandidate = {
	intent: 'remember',
	semanticKey: 'project.codename',
	value: 'Zephyr'
};

const INFER: MeaningCandidate = {
	intent: 'infer',
	semanticKey: 'preference.dark.interfaces',
	value: 'Prefers dark interfaces'
};

const PROV = {
	sourceReference: 'turn-1',
	sourceExcerpt: 'Remember that the project codename is Zephyr.'
};

describe('G2 canonical Meaning Store (VICT Application Data)', () => {
	it('3. explicit persistence intent creates an accepted user_stated record with provenance', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const created = await store.recordCandidate(REMEMBER, PROV, { idempotencyKey: 'k1' });
		expect(created.written).toBe(true);
		expect(created.record.origin).toBe('user_stated');
		expect(created.record.decisionState).toBe('accepted');
		expect(created.record.decidedAt).toBe(created.record.createdAt);
		expect(created.record.sourceExcerpt).toBe('Remember that the project codename is Zephyr.');
		expect(created.record.sourceReference).toBe('turn-1');
		expect(created.record.projectionState).toBe('unprojected');
		expect(created.record.supersededById).toBeUndefined();
		store.close();
	});

	it('8. AI inference creates agent_inferred + PROPOSED — never accepted', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const created = await store.recordCandidate(
			INFER,
			{
				sourceReference: 'turn-2',
				sourceExcerpt: 'I prefer dark interfaces.'
			},
			{ idempotencyKey: 'k2' }
		);
		expect(created.written).toBe(true);
		expect(created.record.origin).toBe('agent_inferred');
		expect(created.record.decisionState).toBe('proposed');
		expect(created.record.decidedAt).toBeUndefined();
		const inspector = await store.inspectorData();
		expect(inspector.proposed).toHaveLength(1);
		expect(inspector.current).toHaveLength(0);
		store.close();
	});

	it('9-11. proposals are context-ineligible; acceptance makes eligible; rejection does not', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const proposed = await store.recordCandidate(INFER, {
			sourceReference: 'turn-3',
			sourceExcerpt: 'I prefer dark interfaces.'
		});
		expect(isEligibleCurrent(proposed.record)).toBe(false);
		expect(await store.listCurrent()).toHaveLength(0);

		const rejected = await store.decide(proposed.record.id, 'reject');
		expect(rejected.record.decisionState).toBe('rejected');
		expect(rejected.record.decidedAt).toBeTruthy();
		expect(isEligibleCurrent(await store.get(proposed.record.id))).toBe(false);

		const proposal2 = await store.recordCandidate(INFER, {
			sourceReference: 'turn-4',
			sourceExcerpt: 'I prefer dark interfaces.'
		});
		const accepted = await store.decide(proposal2.record.id, 'accept');
		expect(accepted.record.decisionState).toBe('accepted');
		expect(isEligibleCurrent(await store.get(proposal2.record.id))).toBe(true);
		store.close();
	});

	it('12. correction creates a new accepted record and PRESERVES the old one (lineage, no deletion)', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const zephyr = await store.recordCandidate(REMEMBER, PROV, { idempotencyKey: 'z1' });
		const orion = await store.recordCandidate(
			{ intent: 'remember', semanticKey: 'project.codename', value: 'Orion' },
			{
				sourceReference: 'turn-5',
				sourceExcerpt: 'Remember that the project codename is Orion now.'
			},
			{ idempotencyKey: 'o1' }
		);
		expect(orion.superseded.some((s) => s.id === zephyr.record.id)).toBe(true);
		// Old record still stored and inspectable:
		const old = await store.get(zephyr.record.id);
		expect(old?.value).toBe('Zephyr');
		expect(old?.supersededById).toBe(orion.record.id);
		expect(old?.decisionState).toBe('accepted');
		expect(effectiveState(old!)).toBe('superseded');
		// Inspector lineage:
		const inspector = await store.inspectorData();
		expect(inspector.current.map((r) => r.value)).toEqual(['Orion']);
		const historical = inspector.history.find((r) => r.id === zephyr.record.id);
		expect(historical?.supersededBy?.value).toBe('Orion');
		store.close();
	});

	it('accepting a proposal SUPERSEDES an older current record with the same key', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const zephyr = await store.recordCandidate(REMEMBER, PROV);
		const proposal = await store.recordCandidate(
			{ intent: 'infer', semanticKey: 'project.codename', value: 'Orion (proposed via inference)' },
			{ sourceReference: 'turn-6', sourceExcerpt: 'conversation evidence' }
		);
		await store.decide(proposal.record.id, 'accept');
		const old = await store.get(zephyr.record.id);
		expect(old?.supersededById).toBe(proposal.record.id);
		expect(await store.listCurrent()).toHaveLength(1);
		store.close();
	});

	it('identical re-statement does not create a duplicate current record', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		await store.recordCandidate(REMEMBER, PROV, { idempotencyKey: 'a1' });
		const again = await store.recordCandidate(REMEMBER, PROV, { idempotencyKey: 'a2' });
		expect(again.written).toBe(false);
		expect(await store.listCurrent()).toHaveLength(1);
		store.close();
	});

	it('15. model-adjacent garbage can never become canonical state (closed contracts)', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		await store.recordCandidate(REMEMBER, PROV, { idempotencyKey: 'k3' });
		const after = await store.listCurrent();
		expect(after).toHaveLength(1);

		// A hostile record (unknown fields + bad key + empty value) must be
		// refused by the adapter's closed contract — never stored, never partial.
		const bad = {
			id: 'forged',
			semanticKey: 'totally bogus KEY with spaces',
			value: '',
			origin: 'user_stated',
			decisionState: 'accepted',
			sourceReference: 'x',
			sourceExcerpt: 'y',
			hackerField: 'injected',
			createdAt: new Date().toISOString(),
			projectionState: 'unprojected'
		};
		await expect(mutateRaw(store, bad)).resolves.toMatchObject({ ok: false });
		expect(await store.listCurrent()).toHaveLength(1);
		store.close();
	});

	it('16. projection bookkeeping never touches canonical semantics', async () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const created = await store.recordCandidate(REMEMBER, PROV);
		await store.markProjection(created.record.id, 'failed', 'cognee worker failed');
		const afterFailed = await store.get(created.record.id);
		expect(afterFailed?.projectionState).toBe('failed');
		expect(afterFailed?.projectionDetail).toContain('cognee worker failed');
		expect(afterFailed?.value).toBe('Zephyr'); // canonical truth untouched
		await store.markProjection(created.record.id, 'projected');
		const afterProjected = await store.get(created.record.id);
		expect(afterProjected?.projectionState).toBe('projected');
		store.close();
	});

	it('4. records survive an application restart (real on-disk SQLite file)', async () => {
		const dbPath = tmpFile('restart');
		const storeA = MeaningStore.create({ path: dbPath });
		const zephyr = await storeA.recordCandidate(REMEMBER, PROV);
		const proposal = await storeA.recordCandidate(INFER, {
			sourceReference: 'turn-7',
			sourceExcerpt: 'I prefer dark interfaces.'
		});
		storeA.close();
		expect(existsSync(dbPath)).toBe(true);

		// "Restart": fresh store over the SAME database file.
		const storeB = MeaningStore.create({ path: dbPath });
		const inspector = await storeB.inspectorData();
		expect(inspector.current.map((r) => r.id)).toContain(zephyr.record.id);
		expect(inspector.proposed.map((r) => r.id)).toContain(proposal.record.id);
		// Superseded lineage survives too:
		const orion = await storeB.recordCandidate(
			{ intent: 'remember', semanticKey: 'project.codename', value: 'Orion' },
			{
				sourceReference: 'turn-8',
				sourceExcerpt: 'Remember that the project codename is Orion now.'
			}
		);
		const old = await storeB.get(zephyr.record.id);
		expect(old?.supersededById).toBe(orion.record.id);
		expect(await storeB.listProposed()).toHaveLength(1);
		storeB.close();
	});

	it('declares and applies its application-domain migration (inspectable history)', () => {
		const store = MeaningStore.create({ path: ':memory:' });
		const migrations = store.appliedMigrations();
		expect(migrations.length).toBeGreaterThanOrEqual(1);
		expect(migrations[0].name).toBe('create-quellight-meaning-record');
		store.close();
	});
});

async function mutateRaw(
	store: MeaningStore,
	input: unknown
): Promise<{
	ok: boolean;
	code?: string;
	message?: string;
}> {
	// Reaches the VICT Application Data adapter directly (test-only boundary
	// probe): proves that even a hostile row is refused by the adapter's
	// closed contract — never stored, never partially stored.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const adapter = (store as unknown as { adapter: any }).adapter;
	return adapter.mutate(
		{ resourceId: 'meaning_record', op: 'create', input },
		{ permissions: ['meaning.read', 'meaning.write'], effect: 'write' }
	);
}
