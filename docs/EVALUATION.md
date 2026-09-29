# Evaluation Contract

## Core principles

A green unit suite is not sufficient. Each gate needs evidence appropriate to the behavior being claimed.

## Cross-cutting negative controls

The project must prove that:

- old Quellight code is not silently imported;
- framework-specific internals do not leak across the intended VICT boundary;
- incompatible package versions are not force-installed;
- Cognee candidate retrieval is not treated automatically as truth;
- model output does not automatically become confirmed durable state;
- technical capability does not imply action authority;
- secrets are not committed or serialized into ordinary evidence;
- failure states are surfaced rather than converted into fabricated success.

## G0 checks

- clean checkout install/build;
- exact package/version/commit inventory;
- dependency license review;
- Mastra-through-VICT smoke proof;
- Cognee/current-VICT compatibility proof;
- documented hardware/runtime constraints where material.

## G1 checks

Browser walkthrough:

1. open Quellight;
2. send a simple message;
3. receive a model-generated answer through VICT/Mastra;
4. seed or ingest a small known knowledge item;
5. ask a question that requires that item;
6. verify retrieval contributes through the intended VICT/Cognee boundary;
7. ask an off-corpus question and verify no false certainty is introduced.

Record exact candidate SHA and relevant runtime versions.

## G2+ checks

As durable meaning appears, add:

- restart persistence;
- provenance inspection;
- correction/supersession;
- stale/current separation;
- proposal/confirmation boundaries;
- context inclusion/exclusion proof.

## Verification roles

For material executable or semantic gates:

- implementer may run focused checks;
- integration owner freezes the candidate;
- fresh verifier evaluates the frozen SHA against this contract;
- verifier must not silently remediate implementation.

Findings: Blocking, High, Medium, Low, Observation.

No next gate starts while a required Blocking/High disposition remains open unless the contract explicitly says otherwise.
