# Agent entry point

This repository is a greenfield Quellight product. Do not import architecture, code, migration assumptions, or compatibility obligations from any previous Quellight implementation unless an owner decision in this repository explicitly adopts them.

## Read order

Before proposing or editing a stage, read:

1. `README.md`
2. `docs/VISION.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/GOVERNANCE.md`
6. `docs/STAGES.md`
7. `docs/EVALUATION.md`
8. `docs/RUNBOOK.md`
9. `docs/STATE.md`

Then read the active handoff for the current gate.

## Governing delivery protocol

Use FastGate principles:

- repository evidence outranks conversation memory;
- contract before implementation;
- parallel work only when file ownership is disjoint;
- tests come from the frozen contract, not from implementation convenience;
- one integration owner freezes the candidate tree;
- expensive verification runs once where possible;
- independent audit is required for material semantic/executable gates;
- owner decisions remain owner decisions.

## Agent delegation

When multiple execution lanes are required, delegate through pi-subagents rather than ad hoc orchestration:

- use subagent delegation for genuinely independent lanes with **disjoint file ownership** (e.g. review lanes, contract-test authoring, focused implementation packages);
- keep **one integration owner** who integrates and freezes the candidate tree;
- do not use subagents to bypass boundaries: every delegated lane inherits this repository's stop rules, evidence discipline, and scope limits from its handoff;
- no permanent orchestration framework, custom loop machinery, or orchestration framework packages in the repo;
- prefer a single competent lane when the work is not genuinely independent — artificial parallelism is prohibited;
- read-only review/audit work should run as fresh-context subagents that never fix implementation code.

## Product boundary

Quellight should stay thin.

Own here:

- Quellight product meaning and ontology;
- Quellight constitution, authority, initiative and behavior policy;
- Quellight UX and conversation experience;
- composition of VICT capabilities;
- app-specific state and projections that are genuinely product-specific.

Do not custom-build here by default:

- agent/model runtime;
- model routing;
- tool-loop machinery;
- embeddings;
- vector database/indexing;
- graph database;
- semantic entity extraction or matching;
- document parsing;
- generic tracing/evaluation infrastructure;
- generic VICT execution/governance.

Default rule: **adopt first, wrap through VICT, compose into Quellight, custom-build only when unavoidable and evidenced.**

## Repository safety

- No force-push, rebase of shared history, or history rewrite.
- No publication, production activation, credentials, or irreversible external actions without explicit owner approval.
- Stop and report on architecture conflicts, undeclared dependencies, license concerns, secrets, material product forks, or any need to bypass VICT capability boundaries.
- Do not claim a gate complete without reproducible evidence and the required verifier role.
