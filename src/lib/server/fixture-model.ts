/**
 * Quellight G2 deterministic model fixture assembly (QD-02, contract §6).
 *
 * The REQUIRED deterministic path is the existing VICT/Mastra
 * `createDeterministicOfflineModel` fixture. G2 has TWO model lanes:
 *   extraction (durable-meaning classification) and conversation (answers).
 * Both are scripted on the EXACT composed inputs the orchestration builds.
 *
 * Assembly policy (documented deliberately, extends the G1 pattern):
 * - Extraction entries: registered at turn time when absent, keyed on the
 *   exact composed extraction input, with a deterministic bounded parser
 *   standing in for the model (explicit persistence requests → `remember`
 *   candidates; explicit "I prefer …" statements → `infer` candidates;
 *   everything else → none). Scenario-specific model behavior in tests is
 *   scripted explicitly with registerExtraction.
 * - Answer entries: when absent, registered at turn time with a
 *   deterministic transform of the REAL retrieval outcome (only eligible
 *   meaning that was actually retrieved). No scenario-specific product
 *   branching anywhere.
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

type WritableStep = OfflineModelStep | OfflineModelThrowStep;

export interface DeterministicFixture {
	/** Factory suitable for `MastraProductAgent.create` (Quellight-supplied). */
	modelFactory: () => DeterministicOfflineModel;
	/** Script a deterministic text step for an exact composed turn input. */
	registerText(composedInput: string, text: string): void;
	/** Script a deterministic throw (controlled model failure) for an exact composed input. */
	registerThrow(composedInput: string): void;
	/**
	 * Extraction lane: ensure the composed extraction input has a scripted
	 * step. When absent, registers the deterministic default parser output
	 * (documented above). Returns the registered text (observable).
	 */
	ensureExtraction(composedInput: string, message: string): string;
	/** Script extraction model behavior for an exact composed extraction input. */
	registerExtraction(composedInput: string, jsonText: string): void;
	/**
	 * Conversation lane: ensure the composed answer input has a scripted
	 * step; when absent registers the deterministic describeMeanings result.
	 */
	ensureAnswer(
		composedInput: string,
		question: string,
		meaningItems: readonly MeaningCandidateLike[]
	): void;
	/** Read-only view of which inputs have entries (evidence/reporting). */
	entryCount(): number;
	hasEntry(composedInput: string): boolean;
	/** Deterministic rendering of an eligible-meaning answer (no fabrication). */
	describeMeanings(question: string, meanings: readonly MeaningCandidateLike[]): string;
}

/** Shape the answer renderer needs (subset of MeaningRecord). */
export interface MeaningCandidateLike {
	semanticKey: string;
	value: string;
	origin: string;
	sourceReference: string;
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
		registerExtraction(composedInput, jsonText) {
			register(composedInput, { kind: 'text', text: jsonText } as OfflineModelTextStep);
		},
		ensureExtraction(composedInput, message) {
			if (Object.prototype.hasOwnProperty.call(writable, composedInput)) {
				return (writable[composedInput] as OfflineModelTextStep).text;
			}
			const jsonText = JSON.stringify(defaultExtraction(message));
			register(composedInput, { kind: 'text', text: jsonText } as OfflineModelTextStep);
			return jsonText;
		},
		ensureAnswer(composedInput, question, meanings) {
			if (Object.prototype.hasOwnProperty.call(writable, composedInput)) {
				return;
			}
			register(composedInput, {
				kind: 'text',
				text: describeMeanings(question, meanings)
			} as OfflineModelTextStep);
		},
		entryCount() {
			return entries;
		},
		hasEntry(composedInput) {
			return Object.prototype.hasOwnProperty.call(writable, composedInput);
		},
		describeMeanings(question, meanings) {
			return describeMeanings(question, meanings);
		}
	};
}

/**
 * Deterministic extraction rendering an ANSWER candidate set (G1 pattern
 * retained; only eligible, canonical-checked meanings arrive here).
 */
export function describeMeanings(
	question: string,
	meanings: readonly MeaningCandidateLike[]
): string {
	void question;
	const useful = meanings.filter((m) => m.semanticKey && m.value);
	if (useful.length === 0) {
		return (
			'I don\u2019t have durable knowledge about that — nothing eligible was ' +
			'retrieved from your canonical meaning store. I won\u2019t guess or invent a fact.'
		);
	}
	const quoted = useful
		.slice(0, 3)
		.map((m) => `${m.semanticKey} = \u201C${m.value}\u201D`)
		.join('; ');
	const intro =
		useful.length === 1
			? 'From your accepted durable meaning (eligible, current), I have:'
			: 'From your accepted durable meaning (eligible, current), I have, in order:';
	return `${intro} ${quoted}.`;
}

/**
 * Deterministic DEFAULT extraction model behavior (fixture-only):
 * a small bounded parser standing in for the real extraction model.
 * - explicit persistence requests → `remember` candidate;
 * - explicit "I prefer …" statements → `infer` candidate;
 * - anything else → none.
 * This is MODEL-fixture behavior (documented), NOT Quellight product policy:
 * every output still crosses the closed schema + Quellight policy mapping.
 */
export function defaultExtraction(message: string): {
	intent: 'none' | 'remember' | 'infer';
	semanticKey?: string;
	value?: string;
	rationale?: string;
} {
	const trimmed = message.trim();
	const remember = /^(?:please\s+)?remember(?:\s+that)?\s+(.+?)(?:\s+now)?[.?!]*$/i.exec(trimmed);
	if (remember) {
		// Expect "<subject> is <value>" inside the remembered clause.
		const clause = /^(.+?)\s+is\s+(.+)$/.exec(remember[1].trim());
		if (clause) {
			const key = normalizeKey(clause[1]);
			if (key) {
				return {
					intent: 'remember',
					semanticKey: key,
					value: clause[2].trim().replace(/[.?!]+$/, '')
				};
			}
		}
	}
	const prefer = /^i prefer\s+(.+?)[.?!]*$/i.exec(trimmed);
	if (prefer) {
		const phrase = prefer[1].trim();
		const key = normalizeKey(`preference ${phrase}`);
		if (key) {
			return {
				intent: 'infer',
				semanticKey: key,
				value: `Prefers ${phrase}`,
				rationale: 'The user explicitly stated a personal preference.'
			};
		}
	}
	return { intent: 'none' };
}

/** Deterministic subject-phrase → dotted key normalization (bounded). */
export function normalizeKey(phrase: string): string | undefined {
	const normalized = phrase
		.trim()
		.toLowerCase()
		.replace(/^(?:the|my|our)\s+/, '')
		.replace(/[^a-z0-9]+/g, '.')
		.replace(/^\.+|\.+$/g, '');
	if (!/^[a-z0-9]/.test(normalized)) {
		return undefined;
	}
	return normalized.length > 0 && normalized.length <= 80 ? normalized : undefined;
}
