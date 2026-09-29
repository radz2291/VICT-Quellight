# Development Stages

These are product-development gates, not user-facing navigation.

## G0 — Repository and dependency intake

**Goal:** establish a reproducible greenfield baseline and prove dependency compatibility before product architecture grows.

Required work:

- inspect current VICT public/local package identities;
- verify `@victframework/mastra` current consumer path;
- verify `@victframework/cognee` packaging and compatibility status;
- run or commission a bounded Cognee-vs-current-VICT compatibility proof;
- record exact pins, install route, licenses and operational limits;
- establish minimal app scaffold only if needed to prove the dependencies.

**Pass:**

- fresh checkout installs/builds using documented commands;
- no previous Quellight code is imported;
- Mastra path is proven through VICT;
- Cognee is either proven compatible with the current VICT line or explicitly BLOCKED with a bounded upstream remediation task;
- STATE.md contains exact tested SHAs/package versions.

**Stop:** incompatible peer/runtime behavior is bypassed rather than resolved; secret/license concern; need for a material VICT architecture change.

## G1 — Walking Quellight

**Goal:** smallest real end-to-end product slice.

Target shape:

```text
user input
  -> Quellight app
  -> VICT ProductAgent / Mastra reasoning
  -> optional Cognee retrieval through its VICT capability pack
  -> useful reply
```

Keep this deliberately small. No giant memory architecture.

**Pass:**

- real browser interaction;
- actual model path or an explicitly approved deterministic fixture plus one bounded live proof;
- same-turn retrieval can influence the answer when relevant;
- absence/failure of retrieval degrades truthfully;
- no direct product dependency on private framework internals.

## G2 — Durable meaning, minimal form

**Goal:** introduce the first genuinely Quellight-specific durable semantic behavior.

Choose only the minimum concepts required by a real product scenario. Do not recreate a universal semantic framework.

Required properties:

- proposal versus accepted state is explicit where required;
- provenance is inspectable;
- correction/supersession is not destructive;
- durable state survives restart;
- AI context receives only eligible state.

## G3 — Cognitive continuity

**Goal:** make Quellight meaningfully useful across conversations/time.

Add only demonstrated needs:

- relevant context selection;
- unresolved/important continuity;
- temporal/staleness handling where needed;
- bounded initiative;
- user inspection/correction.

## G4 — Governed action

**Goal:** connect cognition to real actions through VICT, without allowing reasoning output to self-authorize effects.

Pass requires explicit authority boundaries, attributable actions, safe failure and recovery.

## G5 — Product hardening

**Goal:** realistic resilience, performance, cost, usability and recovery evaluation.

Includes:

- restart/provider failure;
- semantic retrieval false positives/irrelevance;
- model substitution;
- protected action tests;
- browser usability;
- observability;
- measured overhead.

## G6 — Extraction review

Only after Quellight has real repeated patterns, evaluate whether any new reusable VICT capability should be extracted.

**Rule:** no extraction solely because code looks generic. Require a second genuine consumer or explicit strategic justification.
