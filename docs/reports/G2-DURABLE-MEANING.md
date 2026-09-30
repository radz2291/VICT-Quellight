# G2 Report — Durable Meaning, Minimal Form

**Gate:** G2 — Durable Meaning, Minimal Form (contract: `docs/gates/G2-CONTRACT.md`, frozen at
`c3202e6bca79a713d030ae615d89d4b2a8ce4200` BEFORE implementation)
**Branch:** `g2/durable-meaning` (created from verified `main` `78010faf716fdfa132acfd429b8b0370e5cec9fc`)
**Author:** G2 implementation/integration owner (single lane, per contract)
**Implementation candidate first frozen at:** `f97d12e991a713e44f742698ce0a3eca21d81bf7` (identical
`src/`+`tests/`; docs/evidence commits follow)
**Verification tree (DAG + standalone proofs executed here):** `745029f53b19fafe7c06e0560df05148eb53973a`
**FINAL candidate (pushed; src+tests byte-identical to the verification tree):**
`938be663f9f9e81f9655d10f3eeb2518a4e6d3f9`
**Verdict (implementer, NOT self-closing):** **CANDIDATE COMPLETE — PASS WITH NON-BLOCKING
FINDINGS. Independent G2 verification is permitted.** G2 is NOT declared verified or closed here.

---

## 1. Recovery anchor

Recovery (before any code change) verified: repository identity `origin = https://github.com/radz2291/VICT-Quellight`;
`git fetch` clean; `origin/main` == `78010faf716fdfa132acfd429b8b0370e5cec9fc` exactly; working tree clean on
`main`; G1 implementation candidate `df2a1f6ce03133c68ecda5a3e577f86b092542c5` ancestor of `main`
(`git merge-base --is-ancestor` YES); G1 audit closure commit `78010fa` is `main` tip. Branch
`g2/durable-meaning` created from exactly that tip. All docs read in the required order; then the actual G1
implementation was inspected (every `src/lib/server/*`, routes, tests, proof harnesses).

## 2. QD-04 (owner decision) — as applied

G2 introduced Quellight's first minimal durable semantic object: the **Meaning Record**, implemented with
the binding separations recorded verbatim in the contract §2–§3 (conversation ≠ canonical meaning; AI
inference ≠ accepted meaning; Cognee candidate ≠ canonical meaning; stored meaning ≠ automatically active
model context).

## 3. Dependency pins (actual, verified)

| Dependency                            | Actual                                                                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@victframework/{mastra,runtime,sdk}` | `0.4.0-rc.1` (npm registry) — unchanged from G1                                                                                                                                                                                                   |
| `@victframework/application`          | `0.4.0-rc.1` (npm registry) — NEW in G2, normal install, no flags                                                                                                                                                                                 |
| `@victframework/appdata-sqlite`       | `0.4.0-rc.1` (npm registry) — NEW in G2, normal install, no flags                                                                                                                                                                                 |
| `@victframework/cognee`               | `file:vendor/cognee/victframework-cognee-0.1.0.tgz` — unchanged bytes from G1; SHA-256 re-verified `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117` (lineage `radz2291/VICT-Cognee @ 78e6c0ab3f86c571878675d4a947c934768c5ec7`) |
| Python worker                         | 3.12.10 (host proof venv `260925-VCT-Cognee/proof/.venv`) + `cognee[gliner]==1.6.1`                                                                                                                                                               |
| App host                              | SvelteKit + `@sveltejs/adapter-node` (unchanged)                                                                                                                                                                                                  |

The preferred normal-registry route worked — no tarball/pinning workaround was needed for Application Data.
Install command: `npm install --save-exact @victframework/application@0.4.0-rc.1 @victframework/appdata-sqlite@0.4.0-rc.1`.

## 4. Actual semantic architecture

```text
conversation
    → bounded semantic extraction (ProductAgent/Mastra, EXTRACTION lane — separate thread)
      → reply parsed as bounded JSON → validated against the closed Quellight schema
      → invalid/unknown-shaped output = NO write (warned, observable)
    → Quellight policy mapping (product-owned, deterministic):
        remember (explicit user persistence request) → origin=user_stated, state=accepted
        infer → origin=agent_inferred, state=proposed (never auto-accepted)
        none / schema-invalid → nothing
    → canonical write via VICT Application Data adapter (closed contract re-validation)
    → ONLY accepted+current meaning projected to Cognee (dataset g2.meaning, namespace g2;
      keyed idempotency per record; compact traceable content)
    → retrieval: raw hits mapped back via meaning_record_id → canonical eligibility filter
    → ProductAgent conversation lane answers with labeled eligible meaning
```

- Canonical store: `src/lib/server/meaning.ts` + `meaning-resource.ts` — `createSqliteApplicationData` with
  resource `meaning_record` (declared via `defineResource`, `RESOURCE_DEFINITION_SCHEMA`), contracts
  `meaning.record@1` (closed full record; create in/out, update out) and `meaning.patch@1` (closed patch;
  update in), bootstrap migration `create-quellight-meaning-record` via `migrationsFromResources`
  (application-domain migration history `appliedMigrations()` is inspectable), and every access crossing the
  adapter's authorization/effect boundary with declared permissions (`meaning.read`/`meaning.write`).
- Database: REAL on-disk SQLite file `quellight/run/meaning/appdata.sqlite` (gitignored run root;
  unit tests use `:memory:` plus a real-file restart test).

## 5. MeaningRecord model (actual)

`id` (mr- uuid) · `semanticKey` (short dotted key) · `value` · `origin` (`user_stated` | `agent_inferred`)
· `decisionState` (`proposed` | `accepted` | `rejected`) · `sourceReference` (turn ref) · `sourceExcerpt`
(the user utterance — durable evidence) · `createdAt` / `decidedAt` (ISO) · `supersededById?` (lineage) ·
`projectionState` (`unprojected` | `projected` | `failed`) + `projectionDetail?` (honest failure evidence).

- **Effective state is DERIVED, never stored:** `accepted && !supersededById` → `current`;
  `accepted && supersededById` → `superseded`; otherwise `proposed`/`rejected`.
- Origin ≠ standing is enforced structurally: `recordCandidate()` maps intent→(origin, decisionState);
  accepted-at-creation exists ONLY for explicit persistence intent; `decide()` only touches proposals.

## 6. Cognee projection path (actual)

- `KnowledgeStore.projectMeaning(record, key)` — `cognee.add` + `cognee.cognify` through VICT capability
  bindings ONLY; content = `meaning_record_id=<id> key=<key> value=<value>` (no transcripts).
- Dataset `g2.meaning`, namespace `g2` (replaces `g1.quellight`; not claimed final).
- Fresh-supervised-worker-per-cognify workaround RETAINED but now only on actual projection (G2 turned the
  G1 every-turn workaround into a rare durable-write event; `hasCognified` recycle is projection-only).
- Failure: canonical write stands; record gets `projectionState=failed` + `projectionDetail`; the turn/meta
  says "Meaning saved. Semantic retrieval projection is currently degraded." No fabricated success; no
  rollback; no queue/scheduler invented (honest degradation deferred per contract §9).

## 7. Extraction/decision policy (actual)

- `composeExtractionInput()` — deterministic G2 prompt with the closed reply shape.
- `parseExtractionOutput()` — bounded JSON carve (≤1000 chars), closed-schema validation (unknown fields
  rejected wholesale). Everything invalid → `invalid` (warned), never persisted.
- `mapCandidateToPolicy()` — the frozen deterministic mapping (remember→user_stated+accepted;
  infer→agent_inferred+proposed).
- Deterministic fixture (QD-02): extraction entries keyed on the EXACT composed extraction input; default
  model behavior is a small bounded parser (`remember …`→remember; `I prefer …`→infer) documented as
  fixture-side model behavior; scripted entries (`registerExtraction`) cover scenario-specific outputs.
- Two agent lanes: `conversation` and `extraction` thread IDs (extraction never pollutes the conversation).

## 8. Inspector UX (actual)

`/meaning` page + `GET /api/meaning` + `POST /api/meaning/decision {recordId, decision}`:

- **Known/Current** — accepted+current meanings with key/value/origin ("User stated")/source/projection state;
- **Proposed** — "AI inferred … awaiting your decision" with [Accept]/[Reject];
- **History** — superseded (with "Superseded by <value> (key)" lineage display) and rejected records.
  Conversation page: honest per-turn notes (recorded/projected/degraded/proposed-not-established), demo chips
  for the canonical scenarios, retained narrow/keyboard operability, nav link both ways.

## 9. Verification evidence (exact commands / counts / exit codes)

Full frozen-DAG run on the final candidate tree (verification tree `745029f53b19fafe7c06e0560df05148eb53973a`,
final candidate `938be663f9f9e81f9655d10f3eeb2518a4e6d3f9` — src+tests identical; all numbers below are
from the recorded runs, committed logs authoritative):

| Step                     | Command                                                        | Result                                                |
| ------------------------ | -------------------------------------------------------------- | ----------------------------------------------------- |
| Fresh install            | `npm ci`                                                       | exit 0 (known `posthog-node` EBADENGINE warning only) |
| Typecheck                | `npx svelte-check --tsconfig ./tsconfig.json --output machine` | exit 0 — 0 errors, 0 warnings (1379 files)            |
| Format check             | `npx prettier --check . --plugin prettier-plugin-svelte`       | exit 0 — clean                                        |
| Unit/deterministic suite | `npx vitest run`                                               | exit 0 — 3 files, **35/35 passed**                    |
| Production build         | `npm run build`                                                | exit 0 (adapter-node)                                 |
| Mastra adapter proof     | `npm run proof:mastra`                                         | exit 0 — pass: true                                   |
| Real Cognee integration  | `node proof/g2-cognee-integration.mjs`                         | exit 0 — **21/21 PASS**                               |
| Real browser walkthrough | `node proof/g2-browser-walkthrough.mjs`                        | exit 0 — **17/17 PASS**                               |
| Clean tree               | `git status --porcelain`                                       | tracked tree clean                                    |

Attribution: the cheap DAG ran end to end in one session (`proof/g2-evidence/final-dag.log`: npm ci,
typecheck, prettier, vitest 35/35, build, mastra proof — all exit 0). The DAG's embedded proof phases
then hit a harness port conflict (an orphan listener from an earlier manual probe — recorded in §13) and
were re-run as clean standalone runs over the SAME frozen tree SHA: integration
(`proof/g2-evidence/integration/g2-integration-final.log`, 21/21) and browser (ledger + screenshots under
`proof/g2-evidence/browser/`, 17/17). Embedded and standalone numbers agree; committed logs are
authoritative.

### Real-Cognee integration proof (proof/g2-cognee-integration.mjs) — the central semantic sequence

Zephyr remember → canonical appdata record → Cognee projection → retrieval → canonical eligibility
filter → model answers "Zephyr"; then Orion correction → supersession → both projections may sit in the
index → filter removes Zephyr → model receives Orion only. 21/21 PASS (I0, B1, B1b, B2, B2c, B3, B4,
B4b, B4c, B1c, B5a, B5b, B6, B6b, B7, S0-stop, S0, I2, I2b, B8, B8b). Log committed:
`proof/g2-evidence/integration/g2-integration.log`.

### Browser walkthrough (proof/g2-browser-walkthrough.mjs, real Chromium, built app)

B1 ordinary turn (answered; no meaning persisted) · B2 accepted user_stated Zephyr + provenance; survives
reload AND full server restart · B2b/B2d inspector page cards · B3 recall → "Zephyr" · B4 proposal created
(agent_inferred, Proposed only) · B4b proposal NOT used as established context · B5a rejected proposal;
B5b accepted proposal eligible + projected · B6 Orion current / Zephyr history / lineage · B7 stale-index
protection in the browser flow (Orion only) · B8/B8b projection failure honest + canonical intact · B9
narrow viewport 390px no overflow · B9b keyboard-only submit+answer. 17/17 PASS. Screenshots + log
committed under `proof/g2-evidence/browser/`.

### Restart persistence proof

- Unit: file-based store, close, reopen — records/proposals/lineage/rejected survive (`meaning-store.test.ts` test 4).
- Integration: full server restart over `quellight/run/meaning/appdata.sqlite` — S0/I2/I2b PASS (current,
  history lineage, rejected disposition, and correct eligibility all survived; recall answered Orion with
  Zephyr filtered).
- Cognee stayed a PROJECTION: canonical facts answer-able after restart come from the canonical store via
  eligibility; the index is not the only copy of truth (I2b + B7).

## 10. Latency measurements (G1 finding F2 disposition)

Honest recorded numbers (real worker; committed logs):

| Scenario              | G1 (every-turn intake)                 | G2 (projection-on-meaning-change)                                                                |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Ordinary browser turn | 84.5 s per representative turn (audit) | cold turn incl. worker boot 46–98 s; **warm ordinary turn 1.0–1.3 s** (B1c measured 990–1261 ms) |
| Durable meaning write | ~2–4 min cold chain                    | 79–133 s (fresh supervised worker boot ~30–40 s + real cognify; surfaced honestly in UX)         |

The G1 medium finding materially improved: non-memory turns no longer cognify at all; durable writes are
honest slow events only when actual meaning changes.

## 11. G1 retained findings disposition (contract §12)

| Finding                                               | G2 result                                                                                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1/Medium fresh-worker-per-cognify                    | RETAINED as bounded workaround; now fires only on actual durable-meaning projection (unit + integration evidence); upstream defect untouched; VICT-Cognee unmodified |
| F2/Medium durable-turn latency                        | MEASURED (§10); ordinary turns materially avoid cognify; durable turns surfaced honestly                                                                             |
| F3/Low gated `/api/shutdown`                          | Removal attempted; restart proofs still require clean supervised shutdown → RETAINED Low, gated off by default (404 verified), documented temporary                  |
| F4/Low every-message intake                           | REMOVED (tests 1, 2, 18)                                                                                                                                             |
| F5/Low `g1.quellight` dataset                         | REPLACED by `g2.meaning` projection scope (not claimed final)                                                                                                        |
| F6/Low evidence local-only                            | Improved: integration + browser logs, ledgers, screenshots committed under `proof/g2-evidence/`                                                                      |
| F7/Low tarball untracked                              | unchanged route (documented rebuild); checksum unchanged and re-verified                                                                                             |
| F8/Low anti-fabrication not asserted at model surface | CLOSED in G2 suite: capture now records system role; suite asserts the instruction reaches the REAL model call (`meaning-turn.test.ts` 4-7)                          |
| F9–F12                                                | G5-flag / observations carried (no product-code impact)                                                                                                              |

## 12. Negative controls (contract §15) — proven

- Ordinary conversation persists NO meaning and NO add/cognify (turn tests 1+2; integration B1/B1b/B1c).
- AI inference never auto-accepted (8; B4).
- Proposed/rejected/superseded never in normal model context (9, 11, 13; B4b/B5/B7 + honest exclusion paths).
- Stale Cognee hits cannot override canonical state (14 forced: unresolvable + stale + superseded hits all
  excluded; real-Cognee B7 both-stale-and-current index state proven).
- Cognee failure never erases canonical meaning; degradation honest (16+17; B8/B8b).
- Model output never directly mutates canonical truth (15: hostile auto-accepting extraction → zero writes;
  every write crosses the adapter's closed contract).
- NO raw SQLite in product code outside the adapter boundary; grep over `src/`: only `@victframework/*`
  public package imports (`@victframework/{sdk,runtime,mastra,cognee,appdata-sqlite,contracts}`, sveltekit,
  node builtins). No `node:sqlite`/`better-sqlite3`/direct SQL anywhere in product code.
- No private VICT imports; no second persistence framework; no custom embeddings/vector/graph/agent loop;
  no generic ontology/semantic framework; no queue/worker-pool (grep + code inspection evidence).
- No hidden G3 work (grep over `src/` + `tests/` for thread/loop/commitment/goal/epistemic/shared-world/
  initiative/supersession-arch concepts; the only durable concept is the MeaningRecord).
- No old Quellight imports; no credentials/secrets committed (grep over src/tests/docs/proof: none; run
  stores keyless by design).

## 13. Failures observed and handled honestly (timeline)

1. Upstream SDK quirk: `frozenCapture` (0.4.0-rc.1) rejects a SHARED ARRAY reference across a definition
   (its DAG dedup only covers objects — arrays are never removed from the seen-set). VICT untouched; fix is
   Quellight-local (materialize projection arrays per query spot). Recorded as upstream observation O-1.
2. Harness races (recorded, not hidden): post-restart first searches raced the Cognee worker's cold boot
   (`COGNEE_DEADLINE_EXCEEDED` / `DatasetNotFoundError` on the very first ordinary turn before any cognify).
   Both degradations were TRUTHFUL app behavior; the harnesses gained bounded settle waits/retries and a
   pre-flight orphan-port guard (also fixes leftover-listener failures between runs). The app-level behavior
   (honest degraded answers, canonical truth intact) is exactly what G2 requires.
3. A stale orphaned fault-server from an aborted first browser run held port 5182 → EADDRINUSE → the run
   aborted with an explicit error (no silent continuation); subsequent runs pre-flight the proof ports.
4. Contract formatting delta (G1 pattern, Observation): `docs/gates/G2-CONTRACT.md` at the candidate
   differs from the freeze commit by markdown table formatting only (`prettier --write` over the tree):
   zero semantic delta.

## 14. Non-blocking findings retained (O-series)

- O-1 / Low (upstream observation): `@victframework/sdk` authoring capture misdetects shared array
  references as cycles (DAG-legal object sharing works; arrays don't). Avoided in code; worth an upstream
  report — NOT fixed here (no VICT changes authorized).
- O-2 / Observation: verification numbers in this report were transcribed from committed logs; the
  committed `proof/g2-evidence/final-dag.log` + `g2-integration.log` + `g2-browser.log` are authoritative.
- O-3 / Low: durable turns remain materially slow by nature of fresh-worker cognify (upstream F1) — retained
  Low; same workaround discipline as G1 (contract §12), now rare rather than per-turn.
- O-4 / Low: the gated `/api/shutdown` endpoint retained (F3) — documented temporary, 404 by default.

## 15. Documentation updates

- `docs/STATE.md` — G2 candidate record added (SHAs, evidence, dispositions).
- `docs/DECISIONS.md` — D-005 → ACCEPTED FOR BOUNDED PRIVATE QUELLIGHT USE; D-008 → COMPLETED/SATISFIED;
  QD-04 → RESOLVED FOR G2; NEW D-009 (canonical semantic state = application-domain data; Cognee = derived
  projection).
- `docs/ARCHITECTURE.md` — G2 architecture, the historical-vs-current compatibility narrative (initially
  unproven → later remediated + independently verified), and the QD-04 invariant list updated truthfully.
- `README.md` — status sentence updated (G2 candidate delivered, awaiting verification).
- G1 historical audit/report files: NOT modified.

## 16. Exact verdict

**PASS WITH NON-BLOCKING FINDINGS — INDEPENDENT G2 VERIFICATION PERMITTED.**

Every G2 contract requirement is evidenced: canonical Application Data MeaningStore works (real
migrations, real on-disk file, closed contracts, authorization boundary); provenance is inspectable
(origin/source/excerpt/timestamps in the inspector); explicit user durable meaning works end to end
(remember→accepted→projected→recalled→corrected); AI inference stays proposed until an explicit user
decision; accept/reject works through the product UI; supersession preserves history and lineage;
accepted/current is the only context-eligibility set; stale Cognee hits are filtered against canonical
truth (forced-control AND real-index evidence); restart persistence works (unit + integration); normal
turns no longer cognify (measured 1–1.3 s warm vs 84.5 s in G1); the browser inspector works; the
architecture remains thin over VICT public surfaces (no VICT/VICT-Cognee/Cognee-fixture changes).

No G3 work was performed. G2 is not self-closed: the next permitted action is independent G2 verification
on the frozen candidate.

---

_Evidence: `proof/g2-evidence/{final-dag.log, integration/g2-integration.log, browser/*}` (committed);
`tests/meaning-turn.test.ts`, `tests/meaning-store.test.ts`, `tests/compose.test.ts` (deterministic suite);
`docs/gates/G2-CONTRACT.md` (frozen contract)._
