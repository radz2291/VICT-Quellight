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

**Status:** ACCEPTED FOR BOUNDED PRIVATE QUELLIGHT USE

`@victframework/cognee` is the current semantic retrieval/knowledge machinery of Quellight and
the G0 compatibility gate plus the G1 vertical proof have verified it against the current VICT
line (`0.4.0-rc.1`), including independent audit. Since G2 it is explicitly a DERIVED semantic
retrieval/index PROJECTION over eligible Quellight meaning — it is NOT canonical Quellight
truth (canonical semantic state is application-domain data; see D-009). The package remains
private and UNLICENSED; publication/distribution remains separately governed and unauthorized.
Any broader adoption beyond the bounded private Quellight use still requires an owner decision.

## D-006 — No premature intelligence meta-package

**Status:** ACCEPTED  
Do not create a large `@vict/intelligence`, semantic-foundation, or cognitive-foundation package before repeated real consumers prove the abstraction.

## D-007 — Framework outputs are not product truth

**Status:** ACCEPTED  
Cognee retrieval/enrichment and Mastra reasoning outputs are candidates/proposals. Quellight defines when information becomes canonical product state.

## D-008 — Current technical gate

**Status:** COMPLETED / SATISFIED (terminal)

The technical compatibility gate this decision described — revalidate/update `@victframework/cognee`
against the current VICT line before product implementation depends on it — was performed in
bound form (QD-03, packaging-only peer remediation in VICT-Cognee `78e6c0ab…`), independently
verified in G0 (cognee re-proof audit), and exercised end to end by the G1 vertical slice and the
G2 durable-meaning slice. No force-installed peers or bypass flags were used at any point. The
gate is closed; no further action is pending.

## D-009 — Canonical semantic state vs. Cognee projection (G2)

**Status:** ACCEPTED

Quellight's canonical semantic state is application-domain data (VICT Application Data,
`@victframework/appdata-sqlite`, resource `meaning_record`, closed contracts, application-domain
migrations). Cognee is a derived semantic retrieval/index projection over eligible Quellight
meaning (accepted AND current only). Retrieval candidates must always be mapped back to the
canonical store and eligibility-filtered before entering model context; stale or unresolvable
projection hits are excluded. Origin (where meaning came from) and standing (what Quellight
grants it) are distinct; AI inference is always proposed, never auto-accepted; supersession is
non-destructive lineage, never silent rewrite. Rationale and consequences are recorded in the
contract `docs/gates/G2-CONTRACT.md` (owner decision QD-04, resolved for G2).

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
- QD-04: **RESOLVED FOR G2** — first Quellight semantic concept = the **Meaning Record** (owner decision, G2): Quellight application-domain data is the canonical durable source; Cognee is a semantic retrieval/index projection over eligible Quellight meaning; ProductAgent/Mastra reasons over selected eligible context; canonical truth is never defined by conversation, raw AI output, or Cognee; stored meaning is not automatically active context. Minimum model: id / semantic key / value / origin (user_stated ∣ agent_inferred) / decision state (proposed ∣ accepted ∣ rejected) / provenance (source turn reference + inspectable excerpt) / created + decided timestamps / supersedesId (lineage; superseded derived). Frozen in `docs/gates/G2-CONTRACT.md`.
