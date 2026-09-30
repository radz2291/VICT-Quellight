# VICT-Quellight

Greenfield Quellight application built as a thin consumer of VICT capabilities.

## Product direction

Quellight is a persistent cognitive partner. This repository owns the product-specific meaning, policy, experience, and composition required to deliver that promise.

It does **not** own generic AI or semantic infrastructure when proven machinery already exists.

Default engineering rule:

> Adopt first. Wrap through VICT. Compose into Quellight. Custom-build only when a required capability cannot be satisfied correctly by existing machinery.

Current intended stack:

```text
Quellight
   |
   +-- VICT application / UI / runtime capabilities
   |
   +-- @victframework/mastra  -> Mastra -> model providers
   |
   +-- @victframework/cognee -> Cognee semantic/knowledge machinery
```

The application must consume VICT-facing contracts rather than spread direct Mastra or Cognee dependencies through product code.

## Greenfield rule

Previous Quellight implementations are not migration inputs, compatibility targets, or architectural authority for this repository. Any idea reused here must be chosen again on its present merits.

## Start here

Agents and contributors must read, in order:

1. `AGENTS.md`
2. `docs/VISION.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/GOVERNANCE.md`
6. `docs/STAGES.md`
7. `docs/EVALUATION.md`
8. `docs/RUNBOOK.md`
9. `docs/STATE.md`

The documentation bootstrap is complete. G0 (dependency intake) and G1 (Walking Quellight) are verified and closed — G1 by independent audit (`docs/reports/G1-INDEPENDENT-AUDIT.md`). G2 (Durable Meaning) has a frozen contract (`docs/gates/G2-CONTRACT.md`), a delivered candidate on branch `g2/durable-meaning`, and verification evidence (deterministic suite + real Cognee integration + real browser walkthrough) recorded in `docs/reports/G2-DURABLE-MEANING.md`; it awaits independent verification (implementers do not self-close gates).
