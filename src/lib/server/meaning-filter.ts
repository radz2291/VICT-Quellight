/**
 * Quellight G2 projection filtering — Cognee content/mapping + eligibility.
 *
 * Cognee is a semantic RETRIEVAL PROJECTION over eligible Quellight meaning
 * (QD-04/Cognee §16–18 binding rules):
 * - projected content is compact and traceable (carries the canonical
 *   meaning_record_id so any hit maps back to the canonical record);
 * - NO conversation transcripts are projected — only accepted/current meaning;
 * - canonical state ALWAYS wins over the semantic index: any retrieval hit
 *   that cannot be safely mapped back to an accepted+current canonical
 *   MeaningRecord is EXCLUDED (stale/unresolvable/proposed/rejected).
 */

import { isEligibleCurrent } from './meaning.js';
import type { MeaningRecord } from '$lib/types';

/** Compact, traceable projection content (no transcripts). */
export function projectionContent(record: MeaningRecord): string {
	return `meaning_record_id=${record.id} key=${record.semanticKey} value=${record.value}`;
}

/**
 * Map a raw retrieval hit back to its canonical record id. Returns undefined
 * when the hit cannot be mapped safely (unresolvable → always excluded).
 */
export function parseMeaningRecordId(hitText: string): string | undefined {
	const match = /meaning_record_id=([A-Za-z0-9_-]+)/.exec(hitText);
	const id = match?.[1];
	return id && id.length > 0 ? id : undefined;
}

/**
 * Render one eligible record as a composed-context item text.
 * Provenance stays visible in the model input (inspectable end to end).
 */
export function renderEligibleMeaning(record: MeaningRecord): string {
	return `${record.semanticKey} = "${record.value}" [${record.origin}, source: ${record.sourceReference}]`;
}

export { isEligibleCurrent };
