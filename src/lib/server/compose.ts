/**
 * Quellight G1 turn-input composition (frozen contract §4/§6).
 *
 * The composer is the ONLY place that transforms user input + retrieval
 * candidates into the model-turn input. It is pure and deterministic so the
 * VICT deterministic offline fixture can script exact composed inputs, and so
 * tests can assert exactly what reaches the ProductAgent surface.
 *
 * Rules (frozen):
 * - Retrieved candidates are included verbatim in an explicitly labeled block
 *   as UNVERIFIED CANDIDATES — never as asserted truth.
 * - No invented score threshold: all candidates (bounded count) are included.
 * - When no candidates exist the input is exactly the current question.
 * - Quellight never inspects question content to special-case demo scenarios.
 */

const MAX_CANDIDATES = 5;

export interface ComposeInputOptions {
	maxCandidates?: number;
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
	const blocks = selected
		.map((c, i) => `${i + 1}. ${c.text.trim()}`)
		.join('\n');
	return [
		'[Retrieved knowledge candidates — unverified; may or may not be relevant.]',
		blocks,
		'[End retrieved candidates]',
		'',
		'Current question:',
		question,
	].join('\n');
}

/** Conservative, evidence-free bound used at G1 (frozen). */
export const G1_MAX_CANDIDATES = MAX_CANDIDATES;