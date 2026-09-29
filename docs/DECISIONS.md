# Decision Register

Status values: PROPOSED, ACCEPTED, SUPERSEDED, REJECTED, DEFERRED.

## D-001 — Greenfield Quellight

**Status:** ACCEPTED  
The repository is a fresh product. No migration or compatibility obligation to previous Quellight implementations exists.

## D-002 — Thin-product principle

**Status:** ACCEPTED  
Quellight should own product meaning, policy, UX and composition, while reusing heavy infrastructure through VICT capabilities wherever practical.

## D-003 — Adopt-before-build

**Status:** ACCEPTED  
Use proven external machinery first. Wrap/consume through VICT. Custom-build only when a real requirement cannot be satisfied correctly.

## D-004 — Mastra role

**Status:** ACCEPTED  
Use the existing `@victframework/mastra` VICT package as the preferred reasoning/agent runtime boundary. Do not build a second Quellight-specific agent runtime.

## D-005 — Cognee direction

**Status:** ACCEPTED AS CANDIDATE, NOT YET PRODUCT-ADOPTED  
`@victframework/cognee` is the preferred first candidate for reusable semantic/knowledge machinery. Adoption into Quellight is contingent on compatibility and a real vertical proof against the current VICT baseline.

## D-006 — No premature intelligence meta-package

**Status:** ACCEPTED  
Do not create a large `@vict/intelligence`, semantic-foundation, or cognitive-foundation package before repeated real consumers prove the abstraction.

## D-007 — Framework outputs are not product truth

**Status:** ACCEPTED  
Cognee retrieval/enrichment and Mastra reasoning outputs are candidates/proposals. Quellight defines when information becomes canonical product state.

## D-008 — Current technical gate

**Status:** ACCEPTED  
Before Quellight product implementation depends on Cognee, revalidate/update `@victframework/cognee` against the current VICT line. Do not force-install incompatible peers or bypass compatibility checks.

## Open owner decisions

- QD-01: **RESOLVED FOR G1 — CONFIRMED BY G1 INDEPENDENT AUDIT** — first vertical slice is the conversation UI → durable
  knowledge item → Cognee retrieval → VICT ProductAgent/Mastra reasoning → natural answer;
  canonical demo is codename-fact recall (mechanism-proven, not hardcoded). Recorded verbatim
  in the executing handoff and frozen into `docs/gates/G1-CONTRACT.md` §2. Verified by the G1
  independent audit (`docs/reports/G1-INDEPENDENT-AUDIT.md`): the frozen candidate proves the
  full flow in browser, integration, and deterministic evidence; recall is mechanism-driven
  (fixture keyed on real composed inputs; no scenario-specific product branching).
- QD-02: **RESOLVED FOR G1 — CONFIRMED BY G1 INDEPENDENT AUDIT** — deterministic offline fixture is the REQUIRED path for all
  automated/repeatable verification; live path optional only with an existing legitimate
  VICT/Mastra-route credential. No credential exists on the development host, so the live
  model path is recorded `NOT RUN — no authorized configured credential available`.
  No credential was created, committed, or exposed. G1 is fully functional fixture-only and
  was verified in that mode (deterministic repeat proven through the real Mastra adapter).
- QD-03: **COMPLETED** — the bounded Cognee revalidation/remediation was performed in VICT-Cognee (`compat/vict-0.4-rc1` @ `78e6c0ab…`) under its own branch/governance and was independently verified by the Quellight G0 re-proof audit (`docs/reports/G0-COGNEE-REPROOF-AUDIT.md`). No bypass flags were used at any point.
- QD-04: exact first Quellight semantic concepts for G2. **Still open — the active owner decision gating G2 scope.** G1 evidence does not make this resolution mechanical (no G2 semantics were exercised). G2 planning must also account for the G1 retained findings register (`docs/reports/G1-INDEPENDENT-AUDIT.md` §12: worker-per-cognify workaround, per-turn intake policy, temporary shutdown endpoint, evidence-tracking improvements).
