# Agent Handoff Template

Fill every bracketed field from verified repository facts before execution.

## Recovery anchor

- Repository: [URL]
- Baseline branch: [branch]
- Baseline full SHA: [SHA]
- Current stage: [gate]
- Current STATE.md status: [status]
- Read-only dependency refs: [repos + SHAs]

## Mandate

[One bounded objective.]

## In scope

- [paths]
- [behaviors]

## Explicitly out of scope

- [paths]
- [behaviors]
- publication/production/irreversible actions unless separately authorized

## Contract

Acceptance criteria:
1. [...]
2. [...]

Negative controls:
1. [...]
2. [...]

## Dependency policy

Use existing VICT/provider capability boundaries. Do not add a heavyweight dependency or custom implementation of solved infrastructure without recording the gap and stopping for owner decision.

## Verification

Run:
- [focused commands]
- [final commands]
- [browser/live proof if needed]

Freeze candidate before independent verification.

## Stop conditions

Stop and report on:
- source-of-truth conflict;
- dependency incompatibility requiring a semantic workaround;
- architecture/product fork;
- secret or licensing issue;
- failing unrelated baseline test;
- need to edit another repository without separate authorization.

## Final report

Return:
- branch/full SHA;
- baseline SHA;
- files changed;
- command/results;
- walkthrough evidence;
- findings;
- decision changes;
- remote push verification;
- explicit stop statement.
