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

- QD-01: exact first user-visible Quellight vertical slice.
- QD-02: initial model/provider for live development proof.
- QD-03: whether Cognee revalidation work occurs immediately in VICT-Cognee or is delegated to a separate bounded session.
- QD-04: exact first Quellight semantic concepts after the walking vertical slice proves the base stack.
