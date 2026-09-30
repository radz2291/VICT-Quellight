/** Shared Quellight G2 types (browser-safe; no server-only imports). */

/** A candidate item returned by the Cognee retrieval path (NOT truth — a
 * candidate that must be mapped back to canonical state before use). */
export interface KnowledgeCandidate {
	/** Raw Cognee chunk text. */
	text: string;
	/** Raw retrieval score, if the capability path exposes one (uninterpreted signal). */
	score?: number;
}

/** Where a MeaningRecord came from (origin is NOT standing; see decisionState). */
export type MeaningOrigin = 'user_stated' | 'agent_inferred';

/** What standing Quellight currently grants the meaning (G2 proposal policy). */
export type MeaningDecisionState = 'proposed' | 'accepted' | 'rejected';

/** Cognee-projection bookkeeping state (canonical truth is never stored here). */
export type MeaningProjectionState = 'unprojected' | 'projected' | 'failed';

/** Effective derived state of a record (never stored; derived from lineage). */
export type MeaningEffectiveState = 'current' | 'superseded' | 'proposed' | 'rejected';

/**
 * One Quellight durable meaning item (canonical store row shape).
 * Canonical storage is VICT Application Data; this interface mirrors the
 * closed resource contract exactly.
 */
export interface MeaningRecord {
	id: string;
	semanticKey: string;
	value: string;
	origin: MeaningOrigin;
	decisionState: MeaningDecisionState;
	/** Turn reference (provenance). */
	sourceReference: string;
	/** Inspectable durable evidence (user utterance / inference rationale). */
	sourceExcerpt: string;
	createdAt: string;
	/** ISO timestamp where a decision exists (absent for proposed records). */
	decidedAt?: string;
	/** Lineage: set on the superseded record only, pointing at its replacement. */
	supersededById?: string;
	projectionState: MeaningProjectionState;
	/** Honest degradation evidence when projection failed. */
	projectionDetail?: string;
}

/**
 * A validated durable-meaning candidate produced by bounded semantic
 * extraction BEFORE policy mapping. This is what the (closed-contract)
 * extraction schema yields; Quellight policy decides what standing it gets.
 */
export interface MeaningCandidate {
	intent: 'remember' | 'infer';
	semanticKey: string;
	value: string;
	/** Model-supplied (or deterministic-parser) rationale — provenance only. */
	rationale?: string;
}

/** Inspector view of one record (browser-safe projection of canonical state). */
export interface MeaningRecordView extends MeaningRecord {
	/** derived: current | superseded | proposed | rejected */
	effectiveState: MeaningEffectiveState;
	/** For superseded history display: the replacing record's key/value. */
	supersededBy?: { id: string; semanticKey: string; value: string } | null;
}

/** GET /api/meaning response. */
export interface MeaningInspectorData {
	current: MeaningRecordView[];
	proposed: MeaningRecordView[];
	history: MeaningRecordView[];
}

/** POST /api/meaning/decision response. */
export interface MeaningDecisionResponse {
	record: MeaningRecordView;
	/** True when the accept path could not project to Cognee (honed degradation). */
	projectionDegraded: boolean;
	projectionDetail?: string;
}

export interface TurnMeta {
	/**
	 * Retrieval outcome for this turn:
	 * - `used`: eligible meaning candidates were retrieved and included;
	 * - `unavailable`: retrieval was degraded (dependency failure) — answered without it;
	 * - `miss`: retrieval ran but returned no eligible candidates — answered without it.
	 */
	retrieval: 'used' | 'unavailable' | 'miss';
	/** A canonical MeaningRecord was durably written this turn. */
	durableWrite: boolean;
	/** An agent-inferred PROPOSAL was created this turn (never accepted here). */
	meaningProposed: boolean;
	/** A durable meaning change happened but Cognee projection failed/degraded. */
	projectionDegraded: boolean;
	/** Honest projection failure detail (never a fabricated success). */
	projectionDetail?: string;
	/** A durable candidate could not reach the canonical store (degraded). */
	canonicalDegraded?: boolean;
	/** Bounded extraction degraded (model/extraction failure) — truthfully flagged. */
	extractionDegraded?: boolean;
	/** Deterministic fixture identity or live provider identity used for this turn. */
	modelIdentity: string;
}

export type TurnResponse =
	| { kind: 'assistant'; text: string; meta: TurnMeta }
	| { kind: 'error'; errorCode: string; message: string };
