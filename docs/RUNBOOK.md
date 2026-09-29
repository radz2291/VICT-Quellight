# Development Runbook

## Delivery protocol

Use a lightweight FastGate lifecycle.

### Gate 0 — Recover
Verify repository, exact starting SHA, current STATE, decisions, open findings and next permitted action.

### Gate 1 — Freeze
For each milestone freeze:
- objective;
- exclusions;
- acceptance tests;
- negative controls;
- affected paths;
- dependency pins;
- stop conditions.

### Gate 2 — Deliver
Use parallel lanes only when they are actually independent and own disjoint files/worktrees. Do not manufacture parallelism.

### Gate 3 — Integrate
One owner checks ancestry, integrates once, inspects the whole diff, completes evidence/docs and freezes the candidate tree.

### Gate 4 — Verify
Map the test DAG. Run expensive suites once on the frozen candidate where possible. Record failures and reruns honestly.

### Gate 5 — Audit
A fresh verifier checks the frozen SHA against the contract, not merely the test report.

### Gate 6 — Close
If permitted by the verdict, update STATE/DECISIONS, record exact SHA and next permitted action, then stop before the next milestone.

## Handoff requirements

Every executing-agent prompt should include:
- repository URL;
- exact baseline SHA;
- authorized branch/worktree;
- current stage;
- in-scope paths;
- prohibited paths;
- exact acceptance checks;
- required evidence;
- stop conditions;
- push requirement;
- final report format.

## Final report format

- branch + full SHA;
- baseline SHA;
- files changed;
- implementation summary;
- commands and exact results;
- browser/live proof where applicable;
- unresolved findings;
- dependency/decision changes;
- remote push verification;
- explicit stop statement.

## Owner stop rules

Stop for owner input on:
- semantic/product-scope fork;
- constitution/authority change;
- new heavyweight dependency;
- licensing concern;
- credentials/secrets;
- publication;
- irreversible/live external action;
- requirement to bypass VICT boundaries.
