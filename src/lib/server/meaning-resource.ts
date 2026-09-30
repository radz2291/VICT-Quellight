/**
 * Quellight canonical Meaning Store — VICT Application Data declarations.
 *
 * The canonical durable source of Quellight meaning is application-domain
 * data (QD-04). Persistence enters ONLY through the public VICT Application
 * Data port (`@victframework/application`) with the production SQLite
 * adapter (`@victframework/appdata-sqlite`):
 * - resources/mutations declared with `defineResource` (@victframework/sdk);
 * - every mutation input/output validated through a CLOSED Quellight-owned
 *   contract (`defineContract`, @victframework/contracts);
 * - application-domain migrations via the adapter's migration facility;
 * - every access crosses the adapter's explicit authorization/effect
 *   boundary (`ApplicationDataRequestContext`).
 *
 * NO raw SQLite access and NO private VICT imports exist in this repository.
 */

import {
	RESOURCE_DEFINITION_SCHEMA,
	defineResource,
	type ResourceDefinition
} from '@victframework/sdk';
import { defineContract, type Contract } from '@victframework/contracts';
import type {
	MeaningDecisionState,
	MeaningOrigin,
	MeaningProjectionState,
	MeaningRecord
} from '$lib/types';

export const MEANING_RESOURCE_ID = 'meaning_record';
export const MEANING_RESOURCE_REVISION = '1';

/** Resource-level authorization ids (the adapter enforces both per access). */
export const MEANING_READ_PERMISSION = 'meaning.read';
export const MEANING_WRITE_PERMISSION = 'meaning.write';

const ORIGINS: readonly MeaningOrigin[] = ['user_stated', 'agent_inferred'];
const DECISION_STATES: readonly MeaningDecisionState[] = ['proposed', 'accepted', 'rejected'];
const PROJECTION_STATES: readonly MeaningProjectionState[] = ['unprojected', 'projected', 'failed'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|\+\d{2}:\d{2})?$/;
const KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const MAX_TEXT = 2000;

const FIELD_NAMES = [
	'id',
	'semanticKey',
	'value',
	'origin',
	'decisionState',
	'sourceReference',
	'sourceExcerpt',
	'createdAt',
	'decidedAt',
	'supersededById',
	'projectionState',
	'projectionDetail'
] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isIso = (value: string): boolean => ISO_DATE.test(value);
const isKey = (value: unknown): value is string =>
	typeof value === 'string' && KEY_PATTERN.test(value);
const isBoundedText = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_TEXT;
/**
 * CLOSED full-record contract (create input/output, update output).
 * Unknown fields are rejected; every semantic field is checked.
 */
export const MEANING_RECORD_CONTRACT: Contract<MeaningRecord> = defineContract<MeaningRecord>({
	id: 'meaning.record@1',
	revision: '1',
	expected: 'Closed Quellight MeaningRecord (all catalogue fields, enums valid)',
	parse(input) {
		if (!isPlainObject(input)) {
			return {
				ok: false,
				issues: [{ code: 'invalid_type', path: '(root)', message: 'Expected a plain object.' }]
			};
		}
		const issues: Array<{ code: string; path: string; message: string }> = [];
		const unknown = Object.keys(input).filter(
			(k) => !(FIELD_NAMES as readonly string[]).includes(k)
		);
		if (unknown.length > 0) {
			issues.push({
				code: 'unrecognized_keys',
				path: '(root)',
				message: 'Unknown fields are rejected (closed schema).'
			});
		}
		for (const name of [
			'id',
			'semanticKey',
			'value',
			'origin',
			'decisionState',
			'sourceReference',
			'sourceExcerpt',
			'createdAt',
			'projectionState'
		] as const) {
			if (typeof input[name] !== 'string') {
				issues.push({ code: 'invalid_type', path: name, message: `${name} must be a string.` });
			}
		}
		if (!isKey(input.semanticKey)) {
			issues.push({
				code: 'invalid_value',
				path: 'semanticKey',
				message: 'semanticKey must be a short dotted lowercase key.'
			});
		}
		if (!isBoundedText(input.value)) {
			issues.push({
				code: 'invalid_value',
				path: 'value',
				message: 'value must be a non-empty bounded string.'
			});
		}
		if (!isBoundedText(input.sourceExcerpt)) {
			issues.push({
				code: 'invalid_value',
				path: 'sourceExcerpt',
				message: 'sourceExcerpt must be a non-empty bounded string.'
			});
		}
		if (typeof input.sourceReference === 'string' && input.sourceReference.length > 200) {
			issues.push({
				code: 'too_long',
				path: 'sourceReference',
				message: 'sourceReference too long.'
			});
		}
		if (typeof input.id === 'string' && input.id.length > 120) {
			issues.push({ code: 'too_long', path: 'id', message: 'id too long.' });
		}
		if (
			typeof input.origin === 'string' &&
			!(ORIGINS as readonly string[]).includes(input.origin)
		) {
			issues.push({
				code: 'invalid_value',
				path: 'origin',
				message: 'origin must be user_stated or agent_inferred.'
			});
		}
		if (
			typeof input.decisionState === 'string' &&
			!(DECISION_STATES as readonly string[]).includes(input.decisionState)
		) {
			issues.push({
				code: 'invalid_value',
				path: 'decisionState',
				message: 'decisionState must be proposed, accepted, or rejected.'
			});
		}
		if (
			typeof input.projectionState === 'string' &&
			!(PROJECTION_STATES as readonly string[]).includes(input.projectionState)
		) {
			issues.push({
				code: 'invalid_value',
				path: 'projectionState',
				message: 'projectionState must be unprojected, projected, or failed.'
			});
		}
		if (typeof input.createdAt === 'string' && !isIso(input.createdAt)) {
			issues.push({
				code: 'invalid_value',
				path: 'createdAt',
				message: 'createdAt must be an ISO timestamp.'
			});
		}
		if (input.decidedAt !== undefined) {
			if (typeof input.decidedAt !== 'string' || !isIso(input.decidedAt)) {
				issues.push({
					code: 'invalid_value',
					path: 'decidedAt',
					message: 'decidedAt must be an ISO timestamp when present.'
				});
			}
		}
		if (input.supersededById !== undefined) {
			if (
				typeof input.supersededById !== 'string' ||
				input.supersededById.length === 0 ||
				input.supersededById.length > 120
			) {
				issues.push({
					code: 'invalid_value',
					path: 'supersededById',
					message: 'supersededById must be a bounded id when present.'
				});
			}
		}
		if (input.projectionDetail !== undefined) {
			if (typeof input.projectionDetail !== 'string' || input.projectionDetail.length > MAX_TEXT) {
				issues.push({
					code: 'invalid_value',
					path: 'projectionDetail',
					message: 'projectionDetail must be a bounded string when present.'
				});
			}
		}
		if (issues.length > 0) {
			return { ok: false, issues };
		}
		return { ok: true, value: input as unknown as MeaningRecord };
	}
});

/**
 * CLOSED update-patch contract (update input): any subset of mutable
 * fields, no unknown fields. The adapter validates the merged record
 * against `meaning.record@1` before commit.
 */
export const MEANING_PATCH_CONTRACT: Contract<Partial<MeaningRecord>> = defineContract<
	Partial<MeaningRecord>
>({
	id: 'meaning.patch@1',
	revision: '1',
	expected: 'Closed Quellight MeaningRecord patch (mutable fields only)',
	parse(input) {
		if (!isPlainObject(input)) {
			return {
				ok: false,
				issues: [{ code: 'invalid_type', path: '(root)', message: 'Expected a plain object.' }]
			};
		}
		const issues: Array<{ code: string; path: string; message: string }> = [];
		const mutable = [
			'decisionState',
			'decidedAt',
			'supersededById',
			'projectionState',
			'projectionDetail'
		] as const;
		const unknown = Object.keys(input).filter(
			(k) => !mutable.includes(k as (typeof mutable)[number])
		);
		if (unknown.length > 0) {
			issues.push({
				code: 'unrecognized_keys',
				path: '(root)',
				message: 'Only mutable fields may be patched.'
			});
		}
		if (
			input.decisionState !== undefined &&
			(typeof input.decisionState !== 'string' ||
				!(DECISION_STATES as readonly string[]).includes(input.decisionState))
		) {
			issues.push({
				code: 'invalid_value',
				path: 'decisionState',
				message: 'decisionState must be proposed, accepted, or rejected.'
			});
		}
		if (
			input.projectionState !== undefined &&
			(typeof input.projectionState !== 'string' ||
				!(PROJECTION_STATES as readonly string[]).includes(input.projectionState))
		) {
			issues.push({
				code: 'invalid_value',
				path: 'projectionState',
				message: 'projectionState must be unprojected, projected, or failed.'
			});
		}
		if (
			input.decidedAt !== undefined &&
			(typeof input.decidedAt !== 'string' || !isIso(input.decidedAt))
		) {
			issues.push({
				code: 'invalid_value',
				path: 'decidedAt',
				message: 'decidedAt must be an ISO timestamp when present.'
			});
		}
		if (
			input.supersededById !== undefined &&
			(typeof input.supersededById !== 'string' ||
				input.supersededById.length === 0 ||
				input.supersededById.length > 120)
		) {
			issues.push({
				code: 'invalid_value',
				path: 'supersededById',
				message: 'supersededById must be a bounded id when present.'
			});
		}
		if (
			input.projectionDetail !== undefined &&
			(typeof input.projectionDetail !== 'string' || input.projectionDetail.length > MAX_TEXT)
		) {
			issues.push({
				code: 'invalid_value',
				path: 'projectionDetail',
				message: 'projectionDetail must be a bounded string when present.'
			});
		}
		if (issues.length > 0) {
			return { ok: false, issues };
		}
		return { ok: true, value: input as Partial<MeaningRecord> };
	}
});

/**
 * The single canonical Quellight meaning resource. Only the declared
 * mutations (below) and declared query capabilities are permitted by the
 * adapter.
 */
export const MEANING_RESOURCE: ResourceDefinition = defineResource({
	schema: RESOURCE_DEFINITION_SCHEMA,
	id: MEANING_RESOURCE_ID,
	revision: MEANING_RESOURCE_REVISION,
	identity: { key: 'id' },
	fields: [
		{ name: 'id', type: 'string', required: true, label: 'Id' },
		{ name: 'semanticKey', type: 'string', required: true, label: 'Semantic key' },
		{ name: 'value', type: 'string', required: true, label: 'Value' },
		{ name: 'origin', type: 'string', required: true, label: 'Origin' },
		{ name: 'decisionState', type: 'string', required: true, label: 'Decision state' },
		{ name: 'sourceReference', type: 'string', required: true, label: 'Source reference' },
		{ name: 'sourceExcerpt', type: 'string', required: true, label: 'Source excerpt' },
		{ name: 'createdAt', type: 'date', required: true, label: 'Created' },
		{ name: 'decidedAt', type: 'date', label: 'Decided' },
		{ name: 'supersededById', type: 'string', label: 'Superseded by' },
		{ name: 'projectionState', type: 'string', required: true, label: 'Projection state' },
		{ name: 'projectionDetail', type: 'string', label: 'Projection detail' }
	],
	inputContract: 'meaning.record@1',
	outputContract: 'meaning.record@1',
	queries: {
		// NOTE: the VICT authoring capture (0.4.0-rc.1) rejects SHARED array
		// references (its DAG check only covers objects), so projection arrays
		// are materialized per query instead of sharing one array instance.
		list: {
			filters: ['decisionState', 'origin', 'semanticKey', 'supersededById'],
			sort: ['createdAt'],
			pagination: true,
			projection: [...FIELD_NAMES]
		},
		detail: { projection: [...FIELD_NAMES] }
	},
	mutations: [
		{
			op: 'create',
			effect: 'write',
			inputContractId: 'meaning.record@1',
			outputContractId: 'meaning.record@1',
			idempotency: 'keyed',
			permissions: [MEANING_WRITE_PERMISSION]
		},
		{
			op: 'update',
			effect: 'write',
			inputContractId: 'meaning.patch@1',
			outputContractId: 'meaning.record@1',
			permissions: [MEANING_WRITE_PERMISSION]
		}
	],
	authorization: {
		effect: 'read',
		permissions: [MEANING_READ_PERMISSION]
	}
});
