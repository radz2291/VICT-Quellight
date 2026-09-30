/**
 * Quellight canonical Meaning Store service (G2).
 *
 * Wrap of the VICT Application Data adapter (`createSqliteApplicationData`)
 * for the single Quellight meaning resource. All reads/writes cross the
 * adapter's explicit authorization/effect boundary; input/output validation
 * is enforced by the adapter through the closed Quellight contracts
 * (`meaning.resource` module).
 *
 * Canonical truth lives HERE (application-domain data). Projection
 * bookkeeping lives on the record (projectionState/detail); canonical truth
 * does NOT depend on Cognee in any way.
 *
 * Policy (QD-04, frozen):
 * - origin = where meaning came from; decisionState = standing Quellight
 *   grants it. Distinct, both enforced deterministically here.
 * - superseded state is DERIVED from lineage (supersededById), never stored
 *   separately; old records are preserved, never deleted.
 * - the ONLY accepted-at-creation path is an explicit user persistence
 *   request; agent-inferred meaning is always created `proposed`.
 */

// Single VICT Application Data boundary (public packages only; no raw
// SQLite, no private VICT imports anywhere in this repository).
import {
	createSqliteApplicationData,
	migrationsFromResources,
	type SqliteApplicationDataAdapter
} from '@victframework/appdata-sqlite';
import {
	MEANING_PATCH_CONTRACT,
	MEANING_READ_PERMISSION,
	MEANING_RECORD_CONTRACT,
	MEANING_RESOURCE,
	MEANING_RESOURCE_ID,
	MEANING_RESOURCE_REVISION,
	MEANING_WRITE_PERMISSION
} from './meaning-resource.js';
import type {
	MeaningDecisionState,
	MeaningOrigin,
	MeaningProjectionState,
	MeaningRecord,
	MeaningRecordView
} from '$lib/types';

/** The VICT Application Data adapter type (re-exported for tests). */
export type { SqliteApplicationDataAdapter };

/** The Quellight server actor: every access crosses this declared context. */
export const MEANING_READ_CONTEXT = {
	permissions: [MEANING_READ_PERMISSION, MEANING_WRITE_PERMISSION],
	effect: 'read' as const,
	actor: 'quellight-server'
};

export const MEANING_WRITE_CONTEXT = {
	permissions: [MEANING_READ_PERMISSION, MEANING_WRITE_PERMISSION],
	effect: 'write' as const,
	actor: 'quellight-server'
};

export interface MeaningStoreOptions {
	/** SQLite file path, or ':memory:' (tests). Real on-disk file in the app. */
	path: string;
	/** Test double seam (never set in product code). */
	createAdapter?: (path: string) => SqliteApplicationDataAdapter;
}

export class MeaningStoreError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MeaningStoreError';
	}
}

/** Derived (never stored) effective state from decision state + lineage. */
export function effectiveState(record: MeaningRecord): MeaningRecordView['effectiveState'] {
	const superseded = typeof record.supersededById === 'string' && record.supersededById.length > 0;
	if (record.decisionState === 'accepted') {
		return superseded ? 'superseded' : 'current';
	}
	return record.decisionState === 'proposed' ? 'proposed' : 'rejected';
}

/**
 * Context-eligibility policy (frozen contract §10): ONLY accepted AND
 * current meaning may enter model context. Proposed, rejected, superseded,
 * and unresolvable records are always excluded.
 */
export function isEligibleCurrent(record: MeaningRecord | undefined | null): boolean {
	return !!record && record.decisionState === 'accepted' && effectiveState(record) === 'current';
}

export interface CreatedMeaning {
	record: MeaningRecord;
	/** Older current record(s) this record replaced via lineage (never deleted). */
	superseded: MeaningRecord[];
	/** False when an identical accepted/current record already existed. */
	written: boolean;
}

export interface DecisionResult {
	record: MeaningRecord;
	/** Records made superseded by this acceptance. */
	superseded: MeaningRecord[];
}

interface AppDataQueryResult {
	ok: boolean;
	rows?: readonly unknown[];
	row?: unknown;
	code?: string;
	message?: string;
}

export class MeaningStore {
	private constructor(private readonly adapter: SqliteApplicationDataAdapter) {}

	static create(options: MeaningStoreOptions): MeaningStore {
		// Canonical storage is VICT Application Data: the production SQLite
		// adapter, the declared resource, the closed contract bindings, and
		// the adapter's versioned application-domain migration facility.
		if (options.createAdapter) {
			return new MeaningStore(options.createAdapter(options.path));
		}
		const adapter = createSqliteApplicationData({
			path: options.path,
			id: 'vict-quellight-meaning',
			revision: MEANING_RESOURCE_REVISION,
			resources: [MEANING_RESOURCE],
			contracts: [MEANING_RECORD_CONTRACT, MEANING_PATCH_CONTRACT],
			migrations: [
				migrationsFromResources([MEANING_RESOURCE], 1, 'create-quellight-meaning-record')
			]
		}) as SqliteApplicationDataAdapter;
		return new MeaningStore(adapter);
	}

	/** Inspectable application-domain migration history (VICT facility). */
	appliedMigrations(): readonly {
		id: string;
		version: number;
		name: string;
		appliedAt: string;
	}[] {
		return this.adapter.appliedMigrations();
	}

	// ------------------------------------------------------------------ reads

	private async listWhere(filters: Record<string, string>): Promise<MeaningRecord[]> {
		const res = (await this.adapter.query(
			{
				op: 'list',
				resourceId: MEANING_RESOURCE_ID,
				filters,
				sort: [{ field: 'createdAt', direction: 'desc' }]
			},
			MEANING_READ_CONTEXT
		)) as AppDataQueryResult;
		assertOk(res);
		return (res.rows ?? []) as unknown as MeaningRecord[];
	}

	async listCurrent(): Promise<MeaningRecord[]> {
		return (await this.listWhere({ decisionState: 'accepted' })).filter(isEligibleCurrent);
	}

	async listProposed(): Promise<MeaningRecord[]> {
		return this.listWhere({ decisionState: 'proposed' });
	}

	async listRejected(): Promise<MeaningRecord[]> {
		return this.listWhere({ decisionState: 'rejected' });
	}

	/** Superseded = accepted records carrying lineage (derived, never a stored state). */
	async listSuperseded(): Promise<MeaningRecord[]> {
		return (await this.listWhere({ decisionState: 'accepted' })).filter(
			(r) => typeof r.supersededById === 'string' && r.supersededById.length > 0
		);
	}

	async listAll(): Promise<MeaningRecord[]> {
		return this.listWhere({});
	}

	async get(id: string): Promise<MeaningRecord | undefined> {
		const res = (await this.adapter.query(
			{ op: 'get', resourceId: MEANING_RESOURCE_ID, id },
			MEANING_READ_CONTEXT
		)) as AppDataQueryResult;
		if (!res.ok) {
			return undefined;
		}
		return (res.row ?? undefined) as MeaningRecord | undefined;
	}

	// --------------------------------------------------------------- mutation

	/** Stable idempotency key for a turn-driven create (per turn + key). */
	makeCreateKey(turnRef: string, semanticKey: string): string {
		return `meaning-create:${turnRef}:${semanticKey}`;
	}

	/**
	 * Record a VALIDATED durable-meaning candidate through Quellight policy.
	 * The only route to canonical semantic persistence; the adapter's closed
	 * contract re-validates the full record, so raw model output can never
	 * become canonical state directly (frozen §14/§15 negative controls).
	 *
	 * Policy mapping: remember → user_stated + accepted (explicit user
	 * persistence request); infer → agent_inferred + proposed (never auto-
	 * accepted anywhere in Quellight).
	 */
	async recordCandidate(
		candidate: {
			intent: 'remember' | 'infer';
			semanticKey: string;
			value: string;
			rationale?: string;
		},
		provenance: { sourceReference: string; sourceExcerpt: string },
		options?: { idempotencyKey?: string }
	): Promise<CreatedMeaning> {
		const policy = mapCandidateToPolicy(candidate);
		if (!policy) {
			throw new MeaningStoreError('Candidate did not map to any durable-meaning policy.');
		}
		const now = new Date().toISOString();
		const record: MeaningRecord = {
			id: `mr-${crypto.randomUUID()}`,
			semanticKey: candidate.semanticKey,
			value: candidate.value,
			origin: policy.origin,
			decisionState: policy.decisionState,
			sourceReference: provenance.sourceReference,
			sourceExcerpt: provenance.sourceExcerpt,
			createdAt: now,
			projectionState: 'unprojected'
		};
		if (policy.decisionState === 'accepted') {
			// Accepted at creation: the user explicitly asked to retain this meaning.
			record.decidedAt = now;
		}

		// Re-statement guard: an identical accepted/current meaning is a no-op.
		if (policy.decisionState === 'accepted') {
			const existing = await this.listWhere({ semanticKey: record.semanticKey });
			const match = existing.find((r) => isEligibleCurrent(r) && r.value === record.value);
			if (match) {
				return { record: match, superseded: [], written: false };
			}
		}

		const created = (await this.mutate({
			op: 'create',
			input: record,
			idempotencyKey: options?.idempotencyKey ?? `mr-create:${record.id}`
		})) as MeaningRecord;

		// Non-destructive supersession: LINK (never delete) older current records.
		const superseded: MeaningRecord[] = [];
		if (policy.decisionState === 'accepted') {
			const others = await this.listWhere({ semanticKey: record.semanticKey });
			for (const old of others.filter((r) => r.id !== created.id && isEligibleCurrent(r))) {
				await this.mutate({ op: 'update', id: old.id, input: { supersededById: created.id } });
				superseded.push({ ...old, supersededById: created.id });
			}
		}
		return { record: created, superseded, written: true };
	}

	/** Accept or reject a PROPOSED meaning (inspector decision path). */
	async decide(recordId: string, decision: 'accept' | 'reject'): Promise<DecisionResult> {
		const existing = await this.get(recordId);
		if (!existing) {
			throw new MeaningStoreError('No such meaning record.');
		}
		if (existing.decisionState !== 'proposed') {
			throw new MeaningStoreError('Only proposed meaning can be decided.');
		}
		const now = new Date().toISOString();
		const updated = (await this.mutate({
			op: 'update',
			id: recordId,
			input: {
				decisionState: decision === 'accept' ? 'accepted' : 'rejected',
				decidedAt: now
			}
		})) as MeaningRecord;

		// Accepting a proposal replaces an older current record with the same key.
		const superseded: MeaningRecord[] = [];
		if (decision === 'accept') {
			const others = await this.listWhere({ semanticKey: updated.semanticKey });
			for (const old of others.filter((r) => r.id !== updated.id && isEligibleCurrent(r))) {
				await this.mutate({ op: 'update', id: old.id, input: { supersededById: updated.id } });
				superseded.push({ ...old, supersededById: updated.id });
			}
		}
		return { record: updated, superseded };
	}

	/** Projection bookkeeping ONLY — never touches canonical semantic fields. */
	async markProjection(
		recordId: string,
		state: MeaningProjectionState,
		detail?: string
	): Promise<MeaningRecord> {
		const input: Partial<MeaningRecord> =
			state === 'failed'
				? {
						projectionState: 'failed',
						projectionDetail: (detail ?? 'unknown projection failure').slice(0, 1500)
					}
				: { projectionState: state };
		const updated = (await this.mutate({ op: 'update', id: recordId, input })) as MeaningRecord;
		return updated;
	}

	/** Resolve which of the given ids are eligible context (frozen §10). */
	async resolveEligible(ids: readonly string[]): Promise<Map<string, MeaningRecord>> {
		const all = await this.listAll();
		const byId = new Map(all.map((r) => [r.id, r]));
		const out = new Map<string, MeaningRecord>();
		for (const id of ids) {
			const record = byId.get(id);
			if (isEligibleCurrent(record)) {
				out.set(id, record);
			}
		}
		return out;
	}

	/** Inspector views (derived state + supersession backlinks). */
	async inspectorData(): Promise<{
		current: MeaningRecordView[];
		proposed: MeaningRecordView[];
		history: MeaningRecordView[];
	}> {
		const all = await this.listAll();
		const byId = new Map(all.map((r) => [r.id, r]));
		const view = (record: MeaningRecord): MeaningRecordView => {
			const eff = effectiveState(record);
			let supersededBy: MeaningRecordView['supersededBy'];
			if (eff === 'superseded' && record.supersededById) {
				const next = byId.get(record.supersededById);
				if (next) {
					supersededBy = { id: next.id, semanticKey: next.semanticKey, value: next.value };
				}
			}
			return { ...record, effectiveState: eff, supersededBy };
		};
		const views = all.map(view);
		return {
			current: views.filter((v) => v.effectiveState === 'current'),
			proposed: views.filter((v) => v.effectiveState === 'proposed'),
			history: views.filter(
				(v) => v.effectiveState === 'superseded' || v.effectiveState === 'rejected'
			)
		};
	}

	private async mutate(request: {
		op: string;
		input?: unknown;
		id?: string;
		idempotencyKey?: string;
	}): Promise<unknown> {
		const res = (await this.adapter.mutate(
			{ resourceId: MEANING_RESOURCE_ID, ...request },
			MEANING_WRITE_CONTEXT
		)) as AppDataQueryResult;
		assertOk(res);
		if (res.row === undefined) {
			throw new MeaningStoreError('Meaning mutation returned no row.');
		}
		return res.row;
	}

	/** Close the underlying database handle (idempotent). */
	close(): void {
		this.adapter.close();
	}
}

function assertOk(res: AppDataQueryResult): void {
	if (!res.ok) {
		throw new MeaningStoreError(`Meaning store rejected: ${res.code} — ${res.message}`);
	}
}

/**
 * Quellight policy mapping (frozen contract §6): the model only PROPOSES.
 * The closed-contract candidate maps deterministically:
 * - remember → user_stated + accepted (explicit user persistence request);
 * - infer → agent_inferred + proposed (never accepted here).
 */
export interface PolicyOutcome {
	origin: MeaningOrigin;
	decisionState: MeaningDecisionState;
}

export function mapCandidateToPolicy(candidate: {
	intent: 'remember' | 'infer';
}): PolicyOutcome | undefined {
	switch (candidate.intent) {
		case 'remember':
			return { origin: 'user_stated', decisionState: 'accepted' };
		case 'infer':
			return { origin: 'agent_inferred', decisionState: 'proposed' };
		default:
			return undefined;
	}
}
