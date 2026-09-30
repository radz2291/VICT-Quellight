/**
 * Quellight turn-input composition (G1 pattern, retained; G2 extends the
 * candidate block to ELIGIBLE durable meaning).
 *
 * The composer is the ONLY place that transforms user input + retrieval
 * results into the model-turn input. It is pure and deterministic so the
 * VICT deterministic offline fixture can script exact composed inputs, and
 * so tests can assert exactly what reaches the ProductAgent surface.
 *
 * Rules (frozen):
 * - Only ELIGIBLE meaning (accepted AND current, canonical-checked) is
 *   included; the label states the provenance precisely.
 * - No invented score threshold: all eligible items (bounded count) are included.
 * - When no eligible items exist the input is exactly the current question.
 * - Quellight never inspects question content to special-case demo scenarios.
 */

const MAX_CANDIDATES = 5;

export interface ComposeInputOptions {
	maxCandidates?: number;
	/** Explicit label of the candidate block (defaults to unverified candidates). */
	label?: string;
}

export function composeTurnInput(
	question: string,
	candidates: readonly { text: string }[],
	options?: ComposeInputOptions
): string {
	const max = options?.maxCandidates ?? MAX_CANDIDATES;
	const selected = candidates.slice(0, max);
	if (selected.length === 0) {
		return question;
	}
	const blocks = selected.map((c, i) => `${i + 1}. ${c.text.trim()}`).join('\n');
	return [
		`[${options?.label ?? 'Retrieved knowledge candidates — unverified; may or may not be relevant.'}]`,
		blocks,
		'[End retrieved candidates]',
		'',
		'Current question:',
		question
	].join('\n');
}

/** Label for the G2 eligible-meaning block (canonical-verified context). */
export const ELIGIBLE_MEANING_LABEL =
	'Eligible durable meaning — accepted, current (verified against the canonical meaning store)';

/** Conservative, evidence-free bound (retained from G1). */
export const G2_MAX_CANDIDATES = MAX_CANDIDATES;
