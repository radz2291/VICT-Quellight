# Architecture

**Status:** G2 baseline (durable meaning) — updated during G2

## 1. High-level structure

```text
Quellight product
    |
    +-- VICT application / UI / runtime contracts
    |
    +-- @victframework/appdata-sqlite (VICT Application Data)
    |      +-- Canonical Quellight meaning store (Meaning Records)
    |
    +-- @victframework/mastra
    |      +-- Mastra
    |             +-- model providers
    |
    +-- @victframework/cognee
           +-- Cognee  (semantic retrieval PROJECTION over eligible meaning)
```

Quellight should consume VICT-facing contracts. Direct framework-specific code should be isolated to provider/adaptor boundaries, not spread through product logic.

## 2. Responsibility split

### Quellight owns

- product identity and experience;
- product-specific ontology and semantic concepts;
- constitution and policy;
- what requires confirmation;
- what may be inferred automatically;
- attention/initiative behavior;
- user-facing conversation and workspace;
- product-specific views/projections;
- composition of capabilities.

### VICT owns

- capability contracts;
- effect and permission semantics;
- durable execution;
- auditability and observability;
- activation/change control;
- retries/recovery boundaries;
- safe action execution;
- application/runtime integration.

### VICT Application Data owns

- application-domain storage (Meaning Records) structurally separate from
  VICT operational stores;
- versioned application-domain migrations;
- authorization/effect boundaries for every declared mutation/query.

### @victframework/mastra / Mastra owns

- model/agent loop implementation;
- model-provider interaction;
- tool-loop machinery;
- structured model output facilities;
- Mastra memory/tracing facilities where specifically adopted.

Quellight should rely on the VICT-neutral ProductAgent boundary rather than Mastra-specific product semantics.

### @victframework/cognee / Cognee owns

- ingestion;
- cognification;
- semantic retrieval;
- graph/relationship enrichment;
- candidate matching;
- dataset knowledge operations.

**Cognee role since G2:** Cognee is a DERIVED semantic retrieval/index PROJECTION over
eligible Quellight meaning — never canonical Quellight state. Only accepted AND current
meaning is projected; proposed, rejected, and superseded meaning never enters the
projection or model context. Because Cognee does not provide per-note canonical
replacement, older projections may remain searchable after supersession; every retrieval
hit must therefore be mapped back to the canonical Meaning Store and pass an eligibility
filter before it may influence model context. Canonical state always wins over the index.

## 3. Important separation (QD-04, binding)

```text
conversation                     != canonical meaning
AI inference                     != accepted meaning
Cognee candidate                 != canonical meaning
stored meaning                   != automatically active model context
knowledge candidate != canonical product meaning
AI proposal         != confirmed user state
technical ability   != authority to act
stored information  != active model context
```

These distinctions are product invariants even if external frameworks provide much of the heavy machinery.

## 4. Current dependency facts

Verified facts now span three gates (2026-09-29/30):

- VICT main: `radz2291/vict-02` @ `fd675d9083a32f282820d9e0135c191d691c943c` (unchanged since bootstrap)
- VICT packages in use (npm registry): `@victframework/{mastra,sdk,runtime} 0.4.0-rc.1` (since G0/G1) and
  `@victframework/{application,appdata-sqlite} 0.4.0-rc.1` (adopted in G2 — Application Data + production
  SQLite adapter for the canonical Meaning Store)
- Cognee repo: `radz2291/VICT-Cognee`
- compatibility candidate: `78e6c0ab3f86c571878675d4a947c934768c5ec7` (`compat/vict-0.4-rc1`)
- `@victframework/cognee`: private `0.1.0`, tarball SHA-256
  `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117`

historically: Cognee compatibility with the then-current VICT line was initially UNPROVEN and
was the first technical proof requirement (G0).

current: compatibility was remediated packaging-only in VICT-Cognee (QD-03) and the Cognee
candidate was proven against VICT `0.4.0-rc.1`; the G1 vertical slice and the G2 durable-meaning
slice both consume the verified pack through VICT capability bindings, and G1 was independently
verified (`docs/reports/G1-INDEPENDENT-AUDIT.md`).

## 5. Build-vs-adopt rule (unchanged)

For every significant capability:

1. identify mature existing machinery;
2. prefer an existing VICT package if already available;
3. otherwise create a thin VICT-facing provider wrapper only if needed;
4. measure fit in a real Quellight vertical slice;
5. custom-build only the missing behavior that cannot be satisfied safely/correctly.

No speculative universal `@vict/intelligence` package is authorized yet. Common abstractions should emerge from real repeated use.

## 6. G2 durable-meaning flow (current architecture)

```text
conversation
    |
    | bounded semantic extraction (ProductAgent extraction lane,
    |   closed Quellight schema; invalid output => no write)
    v
Quellight policy decision (origin + standing are distinct)
    |  remember (explicit user request) -> user_stated + accepted
    |  infer  (model inference)         -> agent_inferred + proposed
    v
Canonical Meaning Store  (VICT Application Data, appdata-sqlite)
    |  only accepted AND current meaning is eligible
    |  supersession = lineage link (supersededById); old records kept
    v
Cognee projection  (dataset g2.meaning; compact traceable content
    |  carrying meaning_record_id; nothing is projected for proposals)
    v
retrieval -> every hit mapped back to the canonical store
    |  -> eligibility filter (stale/unresolvable hits EXCLUDED)
    v
ProductAgent / Mastra reasoning (eligible meaning as labeled context)
```

Canonical storage failures degrade truthfully and never fabricate; Cognee projection
failures surface as degraded retrieval-projection while canonical truth stands.
