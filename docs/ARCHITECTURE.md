# Architecture

**Status:** Initial greenfield architecture proposal

## 1. High-level structure

```text
Quellight product
    |
    +-- VICT application / UI / runtime contracts
    |
    +-- @victframework/mastra
    |      +-- Mastra
    |             +-- model providers
    |
    +-- @victframework/cognee
           +-- Cognee
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

### @victframework/mastra / Mastra owns

- model/agent loop implementation;
- model-provider interaction;
- tool-loop machinery;
- structured model output facilities;
- Mastra memory/tracing facilities where specifically adopted.

Quellight should rely on the VICT-neutral ProductAgent boundary rather than Mastra-specific product semantics.

### @victframework/cognee / Cognee owns

Candidate semantic/knowledge machinery such as:
- ingestion;
- cognification;
- semantic retrieval;
- graph/relationship enrichment;
- candidate matching;
- dataset knowledge operations.

Cognee output is not automatically canonical Quellight truth. Quellight policy decides what retrieved or inferred information means and whether it may become durable product state.

## 3. Important separation

```text
knowledge candidate != canonical product meaning
AI proposal         != confirmed user state
technical ability   != authority to act
stored information  != active model context
```

These distinctions are product invariants even if external frameworks provide much of the heavy machinery.

## 4. Current dependency facts

Verified from current repositories on 2026-09-29:

- VICT main: `radz2291/vict-02`
- current observed VICT main SHA during bootstrap: `fd675d9083a32f282820d9e0135c191d691c943c`
- `@victframework/mastra`: `0.4.0-rc.1`
- Mastra adapter description: optional Mastra-backed implementation of neutral VICT ProductAgent boundary.
- Cognee repo: `radz2291/VICT-Cognee`
- current observed Cognee main SHA during bootstrap: `2c180efbc564c4a4a3f22556858f108e2fa23bc0`
- `@victframework/cognee`: private `0.1.0` candidate
- Cognee candidate peer range currently targets VICT `^0.3.1`
- Cognee candidate was closure-verified only for a bounded private trial and has not yet been proven against VICT `0.4.0-rc.1`.

Therefore **Cognee compatibility with the current VICT line is not assumed**. It is the first technical proof requirement.

## 5. Build-vs-adopt rule

For every significant capability:
1. identify mature existing machinery;
2. prefer an existing VICT package if already available;
3. otherwise create a thin VICT-facing provider wrapper only if needed;
4. measure fit in a real Quellight vertical slice;
5. custom-build only the missing behavior that cannot be satisfied safely/correctly.

No speculative universal `@vict/intelligence` package is authorized yet. Common abstractions should emerge from real repeated use.
