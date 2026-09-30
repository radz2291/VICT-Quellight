# G2 Independent Audit — Durable Meaning, Minimal Form

**Auditor:** fresh independent verifier (did NOT implement G2; no implementation remediation applied)
**Date:** 2026-09-30
**Audit branch:** `verify/g2-durable-meaning` (created from the exact frozen candidate)

## 0. Auditor independence statement

The auditor did not author, remediate, or influence the G2 implementation. All results below were
produced by fresh runs on a branch created from the exact frozen candidate SHA. No VICT package,
VICT-Cognee byte, dependency version, test, or product behavior was modified to obtain these
results. The only working-tree additions made by the auditor are this report, `docs/STATE.md`
closure updates, and read-only evidence under `proof/g2-audit-evidence/`.

## 1. Identity and recovery (verified, not inherited)

| Item                         | Value                                                                    | Verified                                          |
| ---------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Remote                       | `https://github.com/radz2291/VICT-Quellight`                             | YES (fetch clean)                                 |
| `origin/main` at audit start | `78010faf716fdfa132acfd429b8b0370e5cec9fc` (G1 closure)                  | YES (`git rev-parse`)                             |
| G2 implementation branch     | `g2/durable-meaning`                                                     | YES                                               |
| **Frozen G2 candidate**      | **`1b658940efc4339dd1c279de143ff2213363f7c1`**                           | YES (== `origin/g2/durable-meaning`)              |
| G2 baseline                  | `78010faf716fdfa132acfd429b8b0370e5cec9fc`                               | YES                                               |
| Frozen contract              | `docs/gates/G2-CONTRACT.md` @ `c3202e6bca79a713d030ae615d89d4b2a8ce4200` | YES (commit exists, frozen BEFORE implementation) |
| Verification tree            | `745029f53b19fafe7c06e0560df05148eb53973a`                               | YES (ancestor of candidate)                       |

- Candidate descends cleanly from G1 closure: `git merge-base --is-ancestor` YES.
- Working tree clean at audit start; audit branch `verify/g2-durable-meaning` created from the
  exact candidate SHA.

## 2. Post-DAG diff (candidate vs verification tree)

`git diff 745029f..1b658940` changes EXACTLY four files, all docs/evidence:

- `docs/reports/G2-DURABLE-MEANING.md` (modified)
- `proof/g2-evidence/browser/walkthrough-ledger.json` (added)
- `proof/g2-evidence/integration/g2-integration-final.log` (added)
- `proof/g2-evidence/integration/integration-ledger.json` (added)

**No source, test, dependency-manifest, runtime-configuration, or semantic change occurred after
the implementation DAG.** `src/`+`tests/` are byte-identical across `745029f`, `938be663`, and
`1b658940` (verified by `git diff`, zero lines). Full fresh verification was performed anyway
(§4–§12).

Dependency drift vs G1 baseline: ONLY `@victframework/application@0.4.0-rc.1` +
`@victframework/appdata-sqlite@0.4.0-rc.1` added (both npm registry, authorized by contract §11),
plus the `proof:g2` script and the version/description strings. No other manifest change.

**Doc-only discrepancy found (recorded, not fixed in the implementation report):** the G2 report
names `938be663f9f9e81f9655d10f3eeb2518a4e6d3f9` as "FINAL candidate"; the owner-frozen candidate
is `1b658940` (the report-updating commit itself; docs-only delta, src+tests byte-identical). This
audit verifies `1b658940`.

## 3. Fresh install and dependency proof (Step 5)

- `rm -rf node_modules && npm ci` — **exit 0**, 305 packages, Node `v22.13.1`, npm `11.19.1`.
- No `--force`, no `--legacy-peer-deps`, no overrides, no edited manifests.
- Warnings (classified by auditor):
  - `posthog-node@5.54.1` EBADENGINE (telemetry dependency of the Cognee pack; no functional
    impact) — **Observation**, retained from G0.
  - `npm audit`: 5 vulnerabilities (3 low, 2 moderate) in dev-facing dependency graph —
    **Observation** (unchanged G1 posture; no new G2-introduced vulnerability class observed).
  - `esbuild` install-scripts allowScripts notice — **Observation** (npm 11 informational).
- Resolved versions: `@victframework/{application,appdata-sqlite,mastra,runtime,sdk}@0.4.0-rc.1`
  (registry), `@victframework/cognee@0.1.0` (`file:vendor/...tgz`).
- **Cognee tarball SHA-256 re-verified:**
  `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117` — MATCH (no bytes substituted).

## 4. Mechanical verification (Step 6) — auditor's own runs

| Step         | Command                                                        | Auditor result                                |
| ------------ | -------------------------------------------------------------- | --------------------------------------------- |
| Typecheck    | `npx svelte-check --tsconfig ./tsconfig.json --output machine` | **exit 0 — 1379 files, 0 errors, 0 warnings** |
| Format       | `npx prettier --check . --plugin prettier-plugin-svelte`       | **exit 0 — clean**                            |
| Tests        | `npx vitest run`                                               | **exit 0 — 3 files, 35/35 passed** (66.7 s)   |
| Build        | `npm run build`                                                | **exit 0** (adapter-node)                     |
| Mastra proof | `npm run proof:mastra`                                         | **exit 0 — `"pass": true`**                   |

All implementer numbers independently reproduced. Log: `proof/g2-audit-evidence/audit-dag.log.txt`.

## 5. MeaningRecord model audit (Step 7)

`src/lib/server/meaning-resource.ts` + `meaning.ts` + `src/lib/types.ts`:

- All contract §4 fields present with exact semantics: stable `id` (`mr-` + UUID), `semanticKey`
  (closed pattern), `value`, `origin` (`user_stated`|`agent_inferred`), `decisionState`
  (`proposed`|`accepted`|`rejected`), `sourceReference`, `sourceExcerpt`, `createdAt`, `decidedAt`
  (set only on decision; at creation ONLY for explicit persistence), `supersededById`,
  `projectionState`/`projectionDetail`.
- **Origin ≠ standing is structural**: `mapCandidateToPolicy()` is the only (origin,
  decisionState) mapping; accepted-at-creation exists ONLY for `intent=remember` (explicit
  persistence request per contract §5); `infer` is ALWAYS `proposed`; `decide()` operates only on
  proposed records. A user statement does not auto-accept unless the explicit-retention policy
  fired; an AI inference can never auto-accept (no code path).
- Effective state is DERIVED (`accepted && !supersededById → current`), never stored — supersession
  cannot be "forgotten".

## 6. Canonical store audit (Step 8)

- Canonical state lives in VICT Application Data ONLY: `createSqliteApplicationData` from
  `@victframework/appdata-sqlite` with the declared resource `meaning_record` (`defineResource`,
  `RESOURCE_DEFINITION_SCHEMA`), closed contracts `meaning.record@1` / `meaning.patch@1`
  (`defineContract`), application-domain migration `create-quellight-meaning-record` via
  `migrationsFromResources` (history inspectable via `appliedMigrations()`), and every access
  crossing the adapter's authorization/effect boundary (`meaning.read`/`meaning.write`, effect
  read/write).
- Real on-disk SQLite: `quellight/run/meaning/appdata.sqlite` (restart-durable; proven in §10/§12).
- Prohibited shortcuts — independently grepped and inspected:
  - NO `node:sqlite`/`better-sqlite3`/raw SQL in product code (only comments/config strings and
    the adapter itself);
  - NO parallel custom repository/store abstraction (the adapter is the only persistence seam);
  - canonical truth is NOT Cognee-only and NOT Mastra-memory-only (Cognee receives only compact
    projections; Mastra memory holds conversation threads, never semantic truth).
- The patch contract admits ONLY mutable fields (`decisionState`, `decidedAt`, `supersededById`,
  `projectionState`, `projectionDetail`) — a silent rewrite of `value`/`origin`/`semanticKey`
  through update is rejected by the adapter (auditor probe P4).
- **If Cognee vanished, canonical meaning survives** (restart proofs; recall answers from
  eligibility over canonical store; B7/B8/I2b).

## 7. Semantic extraction and policy boundary (Step 11)

`meaning-extraction.ts`: bounded carve (≤1000 chars) → `JSON.parse` → closed-field validation
(unknown fields rejected WHOLESALE) → enum/pattern/bound checks → `MeaningCandidate` (intent,
semanticKey, value, rationale only — no standing/origin fields exist in the schema). Invalid ⇒
`invalid` (warned, never persisted). The model has NO direct write authority anywhere: the only
persistence route is `MeaningStore.recordCandidate()` through the adapter's closed contract.

Auditor adversarial probes (`proof/g2-audit-evidence/audit-probes.log.txt`):

- malformed JSON ⇒ no write (suite + P-series);
- model emitting `decisionState`/`origin` fields ⇒ output rejected wholesale, ZERO writes
  (suite test 15 — independently re-read and confirmed);
- `none` intent ⇒ no write;
- infer-intent output can NEVER yield accepted directly; `decide()` is the only acceptance path;
  double-decide and unknown-id both throw (probe P3);
- forged schema-valid `remember` intent on an ordinary message ⇒ record IS created accepted
  (probe P1) — see Finding A-1 below.

### Finding A-1 — Extraction intent classification is the acceptance gate (Low)

A schema-valid extraction output with `intent:"remember"` deterministically maps to
`user_stated + accepted`. Thus the detection of "the user EXPLICITLY asked to retain" is delegated
to the extraction lane's intent classification. In the delivered G2 system the model path is the
deterministic offline fixture (QD-02) whose default extraction parser is product-scripted
deterministic code (`/^(?:please\s+)?remember(?:\s+that)?\s+/ …`), so the gate is effectively
deterministic product logic today. The frozen contract (§5/§6) explicitly places intent
classification in the extraction lane, so this is a DESIGNED trade-off, not a deviation.
**However**, if a live model is ever adopted for extraction, intent misclassification (or prompt
manipulation by the user message text) could create accepted meaning without a true explicit
request. **Recommendation to the owner (G3+ hardening, NOT authorized in this audit): consider a
deterministic product-side confirmation gate before any live extraction model.** Classified LOW
(non-blocking for G2; fixture-only model path; contract-consistent).

## 8. Explicit user durable meaning (Step 9)

Proven by unit tests 3/4, real-Cognee integration B2/B2c, and browser B2/B2b/B2c/B2d (all
re-run by the auditor): `Remember that the project codename is Zephyr.` → extraction bounded →
`user_stated` + `accepted` (decidedAt at creation) → provenance (`turn-N` + full utterance as
`sourceExcerpt`) → canonical write BEFORE projection → projection attempted after canonical
commit → record survives full server restart over the real SQLite file. `"Zephyr"` appears NOWHERE
in product logic (grep: only a prompt example string and UI demo chips; the fixture parser derives
`project.codename` generically from the utterance).

## 9. Ordinary conversation MUST NOT write (Step 10)

Unit tests 1+2/18, integration B1/B1b/B1c, browser B1 — all re-run by the auditor:

- `listAll()` stays empty after ordinary turns; `addCalls`/`cognifyCalls` remain zero;
- integration: `durableWrite:false`, no meaning persisted, no cognify through the REAL worker path;
- code path confirms projection is only reachable inside the `intent === 'remember'` branch of an
  accepted candidate — there is no background/async durable write after an ordinary turn.
  G1's every-message intake is REMOVED (`tests/walking-turn.test.ts` deleted; no intake code path).

## 10. Proposal / accept / reject (Step 12)

Re-run by auditor (unit 8–11; integration B4/B4b/B5a/B5b; browser B4/B4b/B5a/B5b):

- `agent_inferred` ⇒ `proposed`; persists canonically (that is the chosen design — proposals are
  inspectable); NOT projected (zero add/cognify); NOT in model context (bare question composed);
  inspector shows it under Proposed with origin "AI inferred"; provenance inspectable.
- Accept ⇒ `accepted` + `decidedAt` + projection attempted + context-eligible (B5b: real Cognee
  add+cognify through VICT bindings; retrieval then returns it).
- Reject ⇒ `rejected`, never eligible, never projected (B5a).

## 11. Non-destructive supersession (Step 13)

Unit 12 + probe P6 + integration B6/B6b + browser B6 — re-run by auditor:
Orion record created accepted/current; Zephyr PRESERVED with its own `sourceReference`,
`sourceExcerpt`, `createdAt`, `decidedAt` intact and `supersededById` → Orion; inspector history
shows "Superseded by …" lineage; nothing destructively overwritten; full restart preserves the
lineage (I2, and store test 4 over a real file). Accepting a proposal also supersedes an older
current record with the same key (store test).

## 12. Stale-index protection and canonical-wins (Steps 14–15)

- Forced control (suite test 14-forced, re-read and confirmed): a search provider returning a
  superseded-Zephyr hit, an unresolvable-id hit, and a no-id hit yields eligibleCount = 0 and a
  BARE question at the model surface — stale/malformed hits can never reach context.
- Auditor's own probe (P2): hits mapping to PROPOSED and REJECTED canonical records plus a
  malformed-id hit — ALL excluded; prompt stays the bare question.
- Real-index proof (integration B7, re-run): after Zephyr→Orion BOTH projections sit in the real
  Cognee index; the filter removes Zephyr; the model receives Orion only (composed input verified;
  answer says Orion).
- The eligibility path is exactly: hit text → `meaning_record_id` parse → canonical
  `MeaningRecord` read → `isEligibleCurrent` (accepted AND current) → include, else exclude.
  Retrieval score is never consulted for truth.

## 13. Projection failure semantics (Step 16)

Suite 16+17/17b, integration B8/B8b, browser B8/B8b — re-run by auditor (fake-pack failure AND
`QUOLLIGHT_FAULT=cognee` controlled fault): canonical MeaningRecord commits; `projectionState=failed`
with bounded truthful `projectionDetail`; UI/turn notes say "Meaning saved. Semantic retrieval
projection is currently degraded." — never fabricated success; no rollback; canonical meaning
survives restart. No queue/retry architecture was required by the contract and none was built.

## 14. ProductAgent / Mastra context proof (Step 17)

- Two genuine lanes: `conversation` and `extraction` thread IDs via `MastraThreadCoordinator`;
  extraction never pollutes the conversation thread.
- Only eligible accepted/current meaning is composed into context, under an explicit provenance
  label ("Eligible durable meaning — accepted, current (verified against the canonical meaning
  store)"); capture at the REAL model surface (system + user roles) verified in suite tests 4–7
  (closes G1 finding F8).
- Cognee candidate text is never trusted: every hit is re-resolved to the canonical record before
  inclusion (§12).
- Model replies are never written back as accepted meaning (no write path from conversation
  output; anti-fabrication instruction present at the system role).
- The VICT ProductAgent boundary remains genuine: `AgentProfileRegistry` + `protectCredentialPort`
  - `MastraProductAgent` via VICT public packages only; no Mastra-specific product semantics
    outside `product-agent.ts`.

## 15. Restart durability (Step 18)

- Unit: file-based store close/reopen — records, proposals, rejected, lineage survive (test 4).
- Integration (real on-disk SQLite + real Cognee store): S0-stop (gated shutdown), S0 (both stores
  READY after restart), I2 (records + lineage survive), I2b (recall after restart answers Orion
  with Zephyr filtered — eligibility correct post-restart).
- A restart promotes nothing: proposals stay proposed, superseded stays superseded (derived from
  stored lineage; re-derived identically).

## 16. Latency audit (Step 20)

Auditor's own measurements (real worker; committed logs):

| Scenario                        | Auditor (this audit)                                                   | Implementer (report) |
| ------------------------------- | ---------------------------------------------------------------------- | -------------------- |
| Warm ordinary turn              | **974 ms** (integration B1c); browser B1 12.9 s cold incl. worker boot | 990–1261 ms          |
| Durable write (remember Zephyr) | **45.2 s** (integration B2); 31.5 s (browser B2)                       | 79–133 s             |
| Correction turn (Orion)         | **51.6 s** (integration B6); 41.7 s (browser B6)                       | similar              |

- **"Ordinary conversation no longer pays Cognify cost" — CONFIRMED**: warm ordinary turn ~1 s;
  no add/cognify calls; no meaning persisted; no hidden async durable write continues after an
  ordinary turn (projection code is reachable only from the accepted-remember branch and is
  awaited inline; nothing schedules background work).
- Durable-write latency is surfaced honestly in the UX (turn notes; inspector projection state).
- Classification of durable-write latency: **Low / retained F2 disposition** — inherent to the
  fresh-worker cognify workaround; honest, rare (only on actual meaning change), documented.

## 17. Retained Cognee worker finding (Step 21)

`knowledge.ts` `recyclePack()`: after any successful cognify the worker is marked used; the NEXT
projection shuts down supervision and creates a FRESH worker (plus one bounded recovery attempt on
first-cognify failure). Auditor classification: **Low — retained bounded workaround** (contract
§12 F1). It is local to `KnowledgeStore`, fires only on actual projection (never on ordinary
turns), is NOT a pool/queue (no persistence, no scheduling, no cross-record state), and the
integration proof exercised multiple sequential cognify cycles (Zephyr → preference accept →
Orion → restart) with no corruption and no cross-record contamination (lineage + per-record ids
verified in the index contents and retrieval mapping). Upstream defect untouched;
VICT-Cognee unmodified.

## 18. `/api/shutdown` (Step 22)

Independently probed on the BUILT app:

- Default (gate off): `POST /api/shutdown` → **HTTP 404** `{"message":"Not found."}`.
- `QUOLLIGHT_MAINTENANCE_SHUTDOWN=1`: HTTP 200 `{"ok":true,"detail":{"meaning":true,"knowledge":true,"agent":true}}`
  — bounded clean close of supervision store/worker, then process exit.
  Classification: **Low — retained F3**, documented temporary in the contract; server-held env only;
  not exposed as ordinary product functionality.

## 19. Browser walkthrough (Step 19) — auditor's own run

Real Chromium (Playwright) against the BUILT app with the REAL Cognee worker — **17/17 PASS**
(gitHead `1b658940`; ledger: `proof/g2-audit-evidence/browser/walkthrough-ledger.json`):

- B1 ordinary: answered; NO meaning persisted. B2 explicit memory: accepted `user_stated` Zephyr
  with provenance; survives reload AND full server restart. B2b/B2d inspector cards. B3 recall via
  retrieval+eligibility ("Zephyr"). B4 proposal under Proposed (agent_inferred, unprojected).
  B4b proposal NOT used as established context. B5a rejected ⇒ ineligible; B5b accepted ⇒
  eligible+projected. B6 correction: Orion current, Zephyr in history, lineage inspectable.
  B7 stale-index protection in the browser flow (Orion only). B8/B8b projection failure honest,
  canonical intact. B9 390 px narrow no horizontal overflow; B9b keyboard-only submit+answer.

## 20. Security and negative controls (Step 24)

Independently inspected/grepped — all clean:

- No secrets; no committed `.env` (only `.env.example` with placeholder paths; worker `.env` is
  generated keyless at runtime inside the gitignored run root).
- No browser-exposed credentials; `protectCredentialPort` keyless stand-in only.
- No direct SQLite bypass; no raw SQL; no private VICT source imports (public `@victframework/*`
  only: `sdk/runtime/contracts/mastra/cognee/application/appdata-sqlite`).
- Cognee touched ONLY via capability bindings in `knowledge.ts`; Mastra ONLY in
  `product-agent.ts`/`fixture-model.ts`.
- No force-install flags anywhere; no custom vector/graph DB; no custom embeddings; no custom
  queue/worker pool; no generic semantic/ontology framework; no `@vict/intelligence`.
- No hidden G3 concepts (threads/open-loops/commitments/goals/epistemic/shared-world/initiative/
  event-loop grep clean; the only durable concept is the MeaningRecord).
- State negative controls all proven (§5–§15): proposed/rejected/superseded/unresolvable never
  active; Cognee failure never deletes canonical meaning; model never self-authorizes durable
  truth through the schema (standing cannot be expressed by model output at all — A-1 records the
  intent-classification nuance).

## 21. Governance/documentation verification (Step 23)

- `docs/DECISIONS.md`: QD-04 RESOLVED FOR G2 (MeaningRecord model recorded); D-005 → ACCEPTED FOR
  BOUNDED PRIVATE QUELLIGHT USE (private/UNLICENSED status stated; publication unauthorized);
  D-008 → COMPLETED/SATISFIED (terminal); D-009 → ACCEPTED (canonical Application Data vs Cognee
  projection). ACCURATE.
- `docs/ARCHITECTURE.md`: G2 architecture, Cognee-as-projection role, stale-projection rule,
  historical-vs-current compatibility narrative, dependency facts — ACCURATE.
- `docs/STATE.md`: G2 candidate record complete; G0/G1 history preserved verbatim (not rewritten);
  G3 marked BLOCKED/not begun — ACCURATE.
- `README.md`: status reflects "candidate delivered, awaiting independent verification" — ACCURATE
  (updated by closure).
- Historical G0/G1 statements NOT falsely rewritten (diff-inspected).
- G3 not begun (no code, no docs defining G3 semantics beyond exclusion lists).

## 22. Finding register (auditor-independent classification)

| #   | Finding                                                                                                                                                                                                              | Class                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A-1 | Extraction intent classification gates `user_stated+accepted`; deterministic fixture parser stands in for the model today; recommend a deterministic product-side confirmation gate before any live extraction model | **Low**                                                                |
| A-2 | Fresh-supervised-worker-per-cognify workaround (upstream second-cognify defect) — projection-only, bounded, no queue/pool, no corruption observed                                                                    | **Low** (retained)                                                     |
| A-3 | Durable semantic-write latency (~30–50 s auditor; 79–133 s implementer) — inherent to fresh-worker cognify; honestly surfaced; only on actual meaning change                                                         | **Low** (retained)                                                     |
| A-4 | Gated `/api/shutdown` retained (404 default; bounded close when gated)                                                                                                                                               | **Low** (retained)                                                     |
| A-5 | Cognee private/UNLICENSED distribution status — D-005 bounded private use; publication separately governed                                                                                                           | **Low** (governance; unchanged)                                        |
| A-6 | G2 report names `938be663` as "FINAL candidate" while the owner-frozen candidate is `1b658940` (docs-only commit; src+tests byte-identical)                                                                          | **Observation** (recorded; not corrected in the implementation report) |
| A-7 | `posthog-node` EBADENGINE + 5 npm-audit findings (3 low/2 moderate) + esbuild install-scripts notice                                                                                                                 | **Observation**                                                        |
| A-8 | Stale projections remain searchable after supersession (Cognee has no per-note replacement) — mitigated STRUCTURALLY by the canonical eligibility filter; accepted by contract §10                                   | **Observation** (by design)                                            |
| A-9 | O-1 (upstream SDK authoring-capture shared-array quirk) — Quellight-local materialization workaround documented in `meaning-resource.ts`                                                                             | **Low** (upstream observation)                                         |

No Blocking or High findings. All frozen-contract negative controls hold under adversarial probes.

## 23. Verdict

**VERIFIED WITH NON-BLOCKING FINDINGS — G2 CLOSURE PERMITTED.**

The frozen candidate `1b658940efc4339dd1c279de143ff2213363f7c1` establishes a truthful, durable,
inspectable minimal semantic layer in which canonical state — not AI output and not semantic
retrieval — controls what Quellight believes and supplies to reasoning. Every contract §14
acceptance test and §15 negative control was independently re-proven, including under the
auditor's own adversarial probes, the real Cognee worker, and a real browser.

Permitted next step: documentation-only closure on this branch, then ancestry-preserving
integration to `main` (candidate descends from `78010faf`; no divergence).

---

_Evidence (auditor, committed under `proof/g2-audit-evidence/`): `audit-dag.log.txt`,
`g2-integration-audit.log.txt` (21/21, gitHead `1b658940`), `g2-browser-audit.log.txt` +
`browser/walkthrough-ledger.json` (17/17, gitHead `1b658940`, screenshots),
`audit-probes.log.txt` + `audit-probe-source.test.ts.txt` (6 adversarial probes),
`shutdown-probe-default-404.log.txt`._
