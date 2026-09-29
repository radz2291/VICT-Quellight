/**
 * Quellight G1 deterministic model fixture assembly (frozen contract §6).
 *
 * The REQUIRED deterministic path (QD-02) is the existing VICT/Mastra
 * `createDeterministicOfflineModel` fixture. Its script maps the EXACT last
 * user message of the composed turn to a scripted step.
 *
 * G1 assembly policy — documented deliberately:
 * - Static demo entries for no-candidate turns are scripted from canonical
 *   walkthrough constants (composed input == the bare question when no
 *   candidates exist).
 * - Candidate-informed entries are registered at turn time, keyed by the
 *   actual composed input, with a deterministic transform of the REAL
 *   retrieved candidates into a descriptive answer. The answer therefore
 *   only exists because retrieval returned those candidates — the Quellight
 *   logic never special-cases demo fact wording or asserts invented facts.
 * - Quellight code contains no scenario-specific branching: for ANY stored
 *   fact the mechanism behaves identically.
 * - A registered throw step provides the bounded controlled model-failure
 *   path (automated tests + W4).
 *
 * Model output is NEVER written as durable state anywhere in this module.
 */

import {
	createDeterministicOfflineModel,
	type DeterministicOfflineModel,
	type OfflineModelScript,
	type OfflineModelStep,
	type OfflineModelTextStep,
	type OfflineModelThrowStep
} from '@victframework/mastra';
import type { KnowledgeCandidate } from '$lib/types';

type WritableStep = OfflineModelStep | OfflineModelThrowStep;

export interface DeterministicFixture {
	/** Factory suitable for `MastraProductAgent.create` (Quellight-supplied at G1). */
	modelFactory: () => DeterministicOfflineModel;
	/** Script a deterministic text step for an exact composed turn input. */
	registerText(composedInput: string, text: string): void;
	/** Script a deterministic throw (controlled model failure) for an exact composed turn. */
	registerThrow(composedInput: string): void;
	/** Read-only view of which inputs currently have entries (for evidence/reporting). */
	entryCount(): number;
	hasEntry(composedInput: string): boolean;
	/** Deterministic rendering of a candidate-informed answer (no fabrication beyond quoting). */
	describeCandidates(question: string, candidates: readonly KnowledgeCandidate[]): string;
}

export function createDeterministicFixture(): DeterministicFixture {
	const writable = {} as Record<string, WritableStep>;
	const script: OfflineModelScript = writable;
	const model = createDeterministicOfflineModel({ script });
	let entries = 0;

	const register = (composedInput: string, step: WritableStep) => {
		writable[composedInput] = step;
		entries += 1;
	};

	return {
		modelFactory: () => model,
		registerText(composedInput, text) {
			const step: OfflineModelTextStep = { kind: 'text', text };
			register(composedInput, step);
		},
		registerThrow(composedInput) {
			const step: OfflineModelThrowStep = { kind: 'throw', message: 'VICT_OFFLINE_MODEL_FAILED' };
			register(composedInput, step);
		},
		entryCount() {
			return entries;
		},
		hasEntry(composedInput) {
			return Object.prototype.hasOwnProperty.call(writable, composedInput);
		},
		describeCandidates(question, candidates) {
			void question;
			const useful = candidates.filter((c) => c.text && c.text.trim().length > 0);
			if (useful.length === 0) {
				return (
					'I don\u2019t have durable knowledge about that — nothing relevant was ' +
					'retrieved from your stored knowledge. I won\u2019t guess or invent a fact.'
				);
			}
			const quoted = useful
				.slice(0, 3)
				.map((c) => `\u201C${c.text.trim()}\u201D`)
				.join('; ');
			const intro =
				useful.length === 1
					? 'From your stored knowledge (retrieved as an unverified candidate), the relevant note I have is:'
					: 'From your stored knowledge (retrieved as unverified candidates), the relevant notes I have are, in order:';
			return `${intro} ${quoted}.`;
		}
	};
}