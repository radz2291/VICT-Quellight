# Governance

This repository uses the FastGate delivery pattern.

## Governing idea

> Freeze the contract before implementation, parallelize only independent work, verify the frozen candidate, preserve independent audit, and close each gate with an exact recovery anchor.

## Source-of-truth order

1. Published Git history and exact remote SHA.
2. Current repository decision/state documents.
3. Independent audit and formal gate records.
4. Active gate contract/handoff.
5. Implementer completion report.
6. Conversation memory.

If these conflict, stop and report the conflict.

## Standard lifecycle

### G0 / Recover

Verify repository, exact baseline SHA, current state, open findings, dependency pins and next permitted action.

### G1 / Freeze

Freeze objective, exclusions, behavior contracts, acceptance matrix, negative controls, ownership, verification plan and stop conditions.

### G2 / Deliver

Use separate worktrees/branches only for genuinely independent lanes with disjoint ownership. Tests may be authored from the frozen contract in parallel with implementation.

### G3 / Integrate

One integration owner checks ancestry, integrates once, reconciles conflicts, inspects the whole diff and freezes the candidate tree.

### G4 / Verify

Run the authoritative verification DAG on the frozen candidate. Avoid redundant expensive reruns.

### G5 / Audit

A fresh verifier evaluates the frozen SHA against the contract. The auditor may report findings but may not silently fix implementation.

### G6 / Close or remediate

If the verdict permits closure, update STATE and decisions, record the exact SHA and next permitted action, then stop. Otherwise perform one bounded remediation cycle or return semantic/scope-changing findings to the owner.

## Owner-reserved decisions

Agents must stop for:

- semantic/product-scope changes;
- constitution or authority changes;
- licensing;
- credentials/secrets;
- publication;
- irreversible or production actions;
- new heavyweight dependencies;
- bypassing VICT boundaries.

## Evidence discipline

Every material gate report must include:

- baseline SHA;
- candidate full SHA;
- files changed;
- exact commands/results;
- browser/live proof where required;
- unresolved findings;
- dependency/decision changes;
- remote push verification.
