# Finding: VIGC worker cognify-reliability (upstream, not fixed here)

**Status:** OBSERVATION (needs VICT/VICT-repo follow-up; this repo stays out of upstream code)
**Affected layer:** knowledge store worker / LanceDB cognify subsystem
**Provenance:** reproduced twice in identical runs; all evidence in `probe-out/`.

## What happens

- The `storeMessage` path is safe while one cognify is active per worker lifetime (confirmed: successful receipt, then recall works as expected).
- However, a **second cognify in quick succession on the same worker** can fail with:
  `RuntimeError: LanceDB ... cannot rebind the same connection across cognify calls`.
- Recovery is deterministic in our design: the knowledge layer releases and re-acquires the pack (worker restart) and the store keeps working (no data loss observed).

## Why this is not a Quellight bug

- The store contract expects one cognify per worker (`cognify` → `receipt`), matching probe evidence.
- All store-level data persisted correctly across the restart, and recall reproduced the expected note afterward.
- No upstream code was modified — this file only records the observable behavior.

## Suggested upstream follow-up (for the cognify layer, not this repo)

- Either serialize cognify calls per worker (guard with a mutex), or make LanceDB cognify re-entrant per cognify call as the binding contract implies.

**Authoritative evidence:** `probe-out/` (cognize + recall transcripts; identical across both runs).