/**
 * Quellight G2 bounded semantic extraction.
 *
 * The extraction model call goes through the same VICT ProductAgent/Mastra
 * route as conversation (a separate agent conversation lane so durable
 * candidates never share the main thread). The model may PROPOSE structured
 * meaning; Quellight policy decides standing (frozen contract §6).
 *
 * Raw model output NEVER writes canonical storage:
 *   model text -> bounded JSON carve -> closed-schema validation
 *   -> Quellight policy mapping -> (only then) canonical write via the
 *   adapter's own closed contracts.
 * Anything unparseable/invalid yields NO write (honest, observable; the
 * turn still answers).
 */

import type { MeaningCandidate } from '$lib/types';

/** Defensive cap on the parsed extraction output (the model is untrusted). */
export const MAX_EXTRACTION_JSON_CHARS = 1000;

/** Deterministic, product-owned extraction prompt composition. */
export function composeExtractionInput(message: string): string {
	return [
		'Classify this user message for durable-meaning candidates.',
		'Reply with ONLY one JSON object (no prose, no markdown):',
		'{"intent":"none"|"remember"|"infer","semanticKey":"<short dotted key>","value":"<durable statement>","rationale":"<one sentence, required for infer>"}',
		'- intent "none": nothing durable to retain.',
		'- intent "remember": the user EXPLICITLY asks to remember/retain something.',
		'- intent "infer": a preference or fact plausibly inferable that the user did not explicitly state.',
		'Semantic keys are short, lowercase, dotted (e.g. project.codename).',
		'Message:',
		message
	].join('\n');
}

export interface ExtractionResult {
	kind: 'none' | 'candidate' | 'invalid';
	/** Present only when kind === 'candidate' (already schema-valid). */
	candidate?: MeaningCandidate;
	/** Set when the model produced output that the closed schema rejects. */
	rejectionReason?: string;
}

/** Closed-schema field catalogue of the extraction result. */
const EXTRACTION_FIELDS = ['intent', 'semanticKey', 'value', 'rationale'] as const;
const KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,79}$/;

/**
 * Parse + validate raw model output against the closed Quellight schema.
 * Never throws; the output is treated as UNTRUSTED (bounded, closed, and
 * rejected wholesale on any violation or unknown field).
 */
export function parseExtractionOutput(text: string): ExtractionResult {
	const carved = carveJson(text);
	if (carved === undefined) {
		// No JSON at all == the model surfaced nothing durable.
		return { kind: 'none' };
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(carved);
	} catch {
		return { kind: 'invalid', rejectionReason: 'extraction output was not valid JSON' };
	}
	return validateExtraction(parsed);
}

/** Bounded first-JSON-object carve; never returns more than the cap. */
export function carveJson(text: string): string | undefined {
	const bounded = text.slice(0, MAX_EXTRACTION_JSON_CHARS + 64);
	const start = bounded.indexOf('{');
	if (start === -1) {
		return undefined;
	}
	const end = bounded.lastIndexOf('}');
	if (end <= start) {
		return undefined;
	}
	return bounded.slice(start, end + 1);
}

function validateExtraction(input: unknown): ExtractionResult {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return { kind: 'invalid', rejectionReason: 'extraction output must be a JSON object' };
	}
	const record = input as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		if (!(EXTRACTION_FIELDS as readonly string[]).includes(key)) {
			return { kind: 'invalid', rejectionReason: `unknown extraction field '${key.slice(0, 40)}'` };
		}
	}
	const intent = record.intent;
	if (typeof intent !== 'string' || !['none', 'remember', 'infer'].includes(intent)) {
		return { kind: 'invalid', rejectionReason: 'invalid intent' };
	}
	if (intent === 'none') {
		return { kind: 'none' };
	}
	const semanticKey = record.semanticKey;
	const value = record.value;
	const rationale = record.rationale;
	if (typeof semanticKey !== 'string' || !KEY_PATTERN.test(semanticKey)) {
		return { kind: 'invalid', rejectionReason: 'invalid semanticKey' };
	}
	if (typeof value !== 'string' || value.trim().length === 0 || value.length > 400) {
		return { kind: 'invalid', rejectionReason: 'invalid value' };
	}
	if (rationale !== undefined && (typeof rationale !== 'string' || rationale.length > 400)) {
		return { kind: 'invalid', rejectionReason: 'invalid rationale' };
	}
	const candidate: MeaningCandidate = {
		intent: intent as 'remember' | 'infer',
		semanticKey,
		value: value.trim()
	};
	if (typeof rationale === 'string' && rationale.trim().length > 0) {
		candidate.rationale = rationale.trim().slice(0, 400);
	}
	return { kind: 'candidate', candidate };
}
