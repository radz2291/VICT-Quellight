/** Shared Quellight G1 types (browser-safe; no server-only imports). */

/** A candidate item returned by the Cognee retrieval path (NOT truth — labeled candidate context). */
export interface KnowledgeCandidate {
	/** Raw Cognee chunk text. */
	text: string;
	/**
	 * Raw retrieval score, if the capability path exposes one. Kept transparently
	 * as an uninterpreted signal; Quellight applies no invented score threshold at G1.
	 */
	score?: number;
}

export interface TurnMeta {
	/**
	 * Retrieval outcome for this turn:
	 * - `used`: candidates were retrieved and included in the model context;
	 * - `unavailable`: retrieval was degraded (dependency failure) — answered without it;
	 * - `miss`: retrieval ran but returned no candidates — answered without it.
	 */
	retrieval: 'used' | 'unavailable' | 'miss';
	/** Set when durable knowledge intake failed this turn (storage degraded), or null. */
	intakeDegraded: boolean;
	/** Deterministic fixture identity or live provider identity used for this turn. */
	modelIdentity: string;
}

export type TurnResponse =
	| { kind: 'assistant'; text: string; meta: TurnMeta }
	| { kind: 'error'; errorCode: string; message: string };
