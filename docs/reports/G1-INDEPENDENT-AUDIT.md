# G1 Independent Audit — Walking Quellight

**Gate:** G1 — Walking Quellight
**Auditor role:** fresh independent verifier/auditor. The auditor did NOT implement the G1 candidate and performed no implementation remediation.
**Audit branch:** `verify/g1-walking-quellight`, created from the exact frozen G1 candidate (not from `main`, not on the implementation branch).
**Candidate verified:** `df2a1f6ce03133c68ecda5a3e577f86b092542c5`
**Baseline (G0 closure):** `7ee427ac1abbb864922eef16f81d28a1394f3666`
**Contract SHA (full):** `04b3e6842aec0c840e6e22b99cf71dedbebe2571` (frozen before implementation; commit `04b3e68`)
**Verification DAG recorded by implementer at:** `b9d52913656018e17c5d8009a9e9cb9d59e4c8cc`
**Audit verdict:** **VERIFIED WITH NON-BLOCKING FINDINGS — G1 CLOSURE PERMITTED**

---

## 1. Repository truth (Step 1–3)

- Remote `origin/main` = `7ee427ac…` (G0 closure) — verified after fetch.
- Remote `origin/g1/walking-quellight` = `df2a1f6ce03133c68ecda5a3e577f86b092542c5` — verified.
- Candidate descends cleanly from G0 closure (`git merge-base --is-ancestor` PASS). No divergent remote history.
- Contract freeze commit `04b3e6842aec0c840e6e22b99cf71dedbebe2571` is an ancestor of the candidate; `docs/gates/G1-CONTRACT.md` at the candidate differs from freeze **only by markdown formatting** (table column padding + final newline). A whitespace-stripped normalized diff proves semantic identity. Classified: **Observation** (frozen artifact touched by `prettier` reformat; zero semantic delta).
- `b9d5291 → df2a1f6` is exactly one commit touching only `docs/reports/G1-WALKING-QUELLIGHT.md` (18 insertions / 10 deletions) — confirmed independently. Consistent with: DAG ran at `b9d5291`; final candidate adds report text only. Independent verification was still performed against `df2a1f6`.

## 2. Fresh install (Step 5)

Command: `rm -rf node_modules && npm ci` — **exit 0**, 303 packages, ~51 s.

- Node `v22.13.1`, npm `11.19.1`.
- Engine warning: `posthog-node@5.54.1` EBADENGINE (requires `^20.20.0 || >=22.22.0`) — known G0 finding, telemetry sink only; **Observation**.
- npm 11 advisory warning: `esbuild@0.28.2` postinstall not covered by allowScripts (standard binary install); **Observation**.
- `npm audit`: 5 vulnerabilities (3 low, 2 moderate):
  - `@vitest/mocker` path traversal (GHSA-82fw-gwwq-j7x9) — **test tooling only**, not in product runtime; **Low**, flag for G5.
  - `cookie <0.7.0` via `@sveltejs/kit` — in runtime dependency graph; the G1 application **does not set or read cookies**, so the vulnerable surface is not exercised; **Low**, flag for G5.
  - No advisories against `@victframework/*` packages.
- Resolved versions (independent `npm ls`): `@victframework/{mastra,runtime,sdk}` `0.4.0-rc.1` from registry; `@victframework/cognee@0.1.0` from `file:vendor/cognee/victframework-cognee-0.1.0.tgz`.
- Tarball provenance: vendor tarball SHA-256 independently recomputed = `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117` — **exact match** with the frozen contract pin and the G0 re-proof audit. No dependency bytes substituted.
- **Low finding:** the tarball is not git-tracked (`vendor/cognee/` gitignored). A fresh clone cannot `npm ci` until the tarball is rebuilt per the route documented in contract §3; provenance is nevertheless pinned by the checksum. Consistent with G0 handling; noted for G2 runbook improvement.

## 3. Mechanical verification (Step 6) — all on the final candidate `df2a1f6`

| Check       | Command                                                        | Auditor result                                |
| ----------- | -------------------------------------------------------------- | --------------------------------------------- |
| Typecheck   | `npx svelte-check --tsconfig ./tsconfig.json --output machine` | exit 0 — **0 errors, 0 warnings, 1358 files** |
| Lint/format | `npx prettier --check . --plugin prettier-plugin-svelte`       | exit 0 — clean                                |
| Unit tests  | `npx vitest run`                                               | exit 0 — **2 files, 15/15 passed**            |
| Build       | `npm run build`                                                | exit 0 (18.7 s, adapter-node)                 |
| Clean tree  | `git status --porcelain` during DAG                            | tracked tree clean                            |

All results match the implementer's claimed numbers; each was independently re-executed by the auditor on `df2a1f6`.

## 4. Deterministic ProductAgent / Mastra verification (Step 7)

- `npm run proof:mastra` — **exit 0**, `pass: true`: adapter compatibility ok (`@victframework/mastra` revision 3), deterministic repeat true, sentinel match true, identity `offline-fixture/deterministic-1`. (Trailing LibSQL `CLIENT_CLOSED` log lines are post-close observability-span noise — **Observation**.)
- Product-suite prompt capture (test 4) proves retrieved candidate text reaches the real Mastra model surface, and that the composed input equals the frozen composer's output exactly.
- **Independent audit probe** (verifier-only, `scratch/audit-model-surface.test.ts`, all-role capture proxy around the real fixture model; doubles only at the pack/model boundaries as the contract permits): **4/4 PASS** —
  1. anti-fabrication instruction text reaches the REAL model call (**system role**: "UNVERIFIED retrievable context", "Never treat an unsupported candidate as an established user fact", "never automatically accepted as durable state");
  2. candidate text reaches the real model call via the composed user input;
  3. model output is never persisted (add calls carry user content ONLY);
  4. off-corpus honesty holds at the real model surface.
- Model failure produces a real failure path (unit test 8; integration W4a; browser W4b — see §6).
- Boundary inspection: product code imports only `@sveltejs/kit`, svelte, node builtins, and `@victframework/{sdk,runtime,cognee,mastra}` public surfaces. `@mastra/*` strings in `product-agent.ts` are adapter `runtimePackages` identity declarations, not imports. No `@vict/intelligence`, no direct Mastra/Cognee internals, no custom agent loop/embeddings/vector/graph machinery. **Clean.**
- **Low finding:** the product test suite's capture proxy records user-role messages only and does not itself assert the anti-fabrication instruction in the captured prompt (contract §6 wording). The auditor verified the instruction does reach the model surface (probe §4) and behavior (W3) demonstrates its effect. Assertion gap, not behavior gap.

## 5. Real Cognee integration proof (Step 8)

`node proof/g1-cognee-integration.mjs` — **exit 0, 10/10 PASS** (auditor's own run, fresh disposable `proof/.g1-run`, host venv `Python 3.12.10` + `cognee[gliner]==1.6.1`, real Cognee worker through the VICT capability bindings):

| ID      | Evidence point                                                            | Outcome |
| ------- | ------------------------------------------------------------------------- | ------- |
| I0      | server boots with knowledge READY                                         | PASS    |
| W1      | basic conversation answers through the path                               | PASS    |
| I1      | fact stored/cognified through real capability bindings                    | PASS    |
| W2      | recall uses REAL retrieved durable knowledge (verbatim candidate quoting) | PASS    |
| W3      | off-corpus honesty (no fabricated personal fact; attributed notes only)   | PASS    |
| S0      | restart: knowledge ready from persisted store                             | PASS    |
| I2      | durable recall persists across app restart                                | PASS    |
| W4a     | model failure surfaces as HTTP failure                                    | PASS    |
| W4b-pre | knowledge reported degraded with worker disabled                          | PASS    |
| W4b     | knowledge unavailable answered truthfully, no fabricated retrieval        | PASS    |

W2 answer quoted “My project codename is Zephyr.” verbatim from retrieval; W3 did not assert a favorite color; W4b answered "I don't have durable knowledge about that — nothing relevant was retrieved… I won't guess or invent a fact." — invariants `retrieval absence ≠ fabrication` and `model response ≠ durable fact` hold end-to-end.

**Observation:** during I2 the post-restart intake was honestly degraded (`intakeDegraded: true`, bounded recovery exhausted) while recall still worked from the persisted store — degradation surfaced truthfully rather than hidden or fabricated. This is the designed behavior working, not a defect.

## 6. Fresh-worker-per-cognify workaround — independent evaluation (Step 9)

**Upstream defect independently REPRODUCED** (auditor probe `scratch/probe-double-cognify.mjs`, real worker, disposable store):

- COGNIFY 1 (first in worker lifetime): PASS (t+54.4 s cumulative)
- COGNIFY 2: **FAIL** — exact reported error: `RuntimeError: <asyncio.locks.Lock ...[locked]> is bound to a different event loop`
- COGNIFY 3: FAIL — same error (deterministic)
- SEARCH after both failures still returned the stored fact — store durability intact.

Workaround audit:

- Implementation is Quellight-local (`recyclePack()` in `src/lib/server/knowledge.ts`): shutdown supervision, recreate pack with the SAME storeRoot/namespaces, rebind the same three capability bindings. **No VICT or VICT-Cognee code patched** (dep bytes proven unchanged by tarball SHA-256 identity). No custom queue/pool/worker architecture introduced.
- Bounded: at most one recreate + one cognify retry per `storeMessage`; persistent failure raises `KnowledgeDependencyError` → `intakeDegraded` truthful flag, turn still answers.
- Durability: store root is fixed on disk; worker recycling reopens the same store; S0/I2 prove persistence across full process restarts (stronger than worker recycle).
- Ownership semantics: namespace `g1` and dataset `g1.quellight` unchanged across recycles; the pack's fail-closed store-owner lock remains in force. No cross-contamination observed in any run.
- Documented as temporary/local in contract-referenced code comments and the G1 report — not architectural doctrine. ✔

**Classification: Medium (upstream defect, bounded local workaround).** The workaround truthfully and safely satisfies the G1 walking-slice contract; it is NOT a production-architecture claim. Retained for G2+ evaluation.

## 7. Cold-turn latency — independent evaluation (Step 10)

Auditor measurements:

- Worker cold boot + add: ~33 s; first cognify in a fresh worker: ~21 s; search: < 1 s (`audit-double-cognify-probe.log`).
- Representative user turn on a fresh store (includes the temporary every-message intake: fresh worker boot + cognify + retrieval + deterministic answer): **84.5 s**.
- Cold-chain phases in the integration proof were longer (multiple fresh workers + restarts), consistent with the report's ~2–4 min worst-case cold turn.

Latency honesty audit: the UI shows an explicit "Storing turn in durable knowledge and thinking…" state for the whole turn; `/api/health` reports `initializing | ready | degraded` truthfully with settle semantics; no test or UI path converts latency or failure into fake success; browser remained responsive during turns (walkthrough ran interactively against the live app).

**Classification: Medium (honest but material UX cost; per-turn durable intake drives it).** The G1 contract requires truthfulness, not speed; the walking slice remains usable and completes all browser flows. Do-not-impose-production-requirements rule respected.

## 8. Browser walkthrough (Step 11) — auditor's own server instances

Auditor booted the built app (`node build`, adapter-node) on port 5179 with the real worker venv and fresh audit-only run roots, then executed:

- `proof/g1-browser-walkthrough.mjs` — **exit 0, W1/W2a/W2/W3/W-rest all PASS** (real Chromium; my own screenshots/ledger under `proof/g1-evidence/browser/`):
  - W1 basic conversation through the reasoning path;
  - W2a durable intake of "My project codename is Zephyr."; W2 recall answered with the verbatim retrieved candidate (mechanism-driven — the fixture answers are keyed on real composed inputs; no scenario-specific product branching, verified in code);
  - W3 off-corpus question did NOT assert a stored personal fact;
  - W-rest page reload preserved durable knowledge.
- `proof/g1-browser-extras.mjs failure` (server booted with `QUOLLIGHT_FAULT=model`, fault confirmed by direct curl → HTTP 502 before the browser phase) — **exit 0, W4b PASS**: error note "Quellight could not produce a response for this input." shown; no fabricated recall.
- `proof/g1-browser-extras.mjs narrow` (clean server) — **exit 0, N1 PASS** (no horizontal overflow at 390 px), **N2 PASS** (keyboard-only submit + answer).
- W2-R durability additionally evidenced by walkthrough W-rest (reload) and integration S0/I2 (full restart).

Audit-process note (recorded for transparency): the failure phase initially reported FAIL because the auditor's earlier server survived a tree-kill attempt (MSYS PID mismatch) and the fault server never bound (`EADDRINUSE`), so the phase hit a non-fault server. After killing the real listener and verifying the fault with a direct 502 curl probe, the rerun passed. Harness error, not a candidate defect.

## 9. Temporary G1 artifacts (Step 12)

1. **Gated `POST /api/shutdown`** — verified directly: without `QUOLLIGHT_MAINTENANCE_SHUTDOWN=1` the endpoint returns **404** (inert); GET → 405. With the gate enabled it performs a clean VICT-Cognee supervision shutdown and process exit (`{"ok":true,"detail":{"knowledge":true,"agent":true}}` observed in audit runs). Server env only; never exposed to the browser. **Low** — remove at G2 (already flagged in the G1 report).
2. **Every-user-message intake policy** — clearly documented in code and report as temporary contract §5 policy; drives the per-turn duration (§7). Model output never enters this path (verified by tests, probe, and code inspection). **Low.**
3. **Single dataset `g1.quellight`** — scoped, isolated store root; no claim of final storage design anywhere in the tree. **Low.**

None of these violates the frozen contract.

## 10. Security and negative controls (Step 13)

- No secrets or credential values committed (grep incl. secret-shaped strings: none). Only `.env.example` is tracked; worker `.env` is keyless and gitignored.
- No `.npmrc`, no `legacy-peer-deps`/`force` flags anywhere; npm ci ran flagless.
- Browser exposure: the UI touches only `/api/turn`, `/api/health` (`/api/shutdown` gated; verified 404). No VICT/Mastra/Cognee concepts or config reach the browser bundle.
- No direct Cognee/Mastra internals; no custom embeddings/vector/graph/agent loop; no `@vict/intelligence`.
- No direct edits to VICT or VICT-Cognee from this repository (history inspected; dependency bytes proven unchanged by checksum).
- No hidden G2 semantics (grep for open-loops/epistemic/shared-world/attention/initiative/supersession in `src/`: none).
- Cognee hits are labeled unverified candidates in the composed input; model output is never written to Cognee (tests + probe); retrieval failure surfaces as `unavailable` with honest text.
- **Clean — no blocking security findings.**

## 11. Documentation consistency (Step 14)

- `docs/STATE.md` correctly records the G1 candidate execution at the top, but retains stale exclusion wording ("G1 product implementation"; "no G1 work before QD-01/QD-02 owner decisions") in the exclusions section. **Corrected** as documentation-only bookkeeping in this audit (closure §Step 17 below).
- `README.md` status sentence still says "The next permitted work is G0 … no G1 product implementation is authorized yet." — stale. **Corrected** (documentation-only).
- `docs/DECISIONS.md` QD-01/QD-02 record "RESOLVED FOR G1"; with the G1 evidence now verified, both are updated to reflect confirmation by G1 evidence. QD-04 remains OPEN (first semantic concepts are G2 work — not resolvable by G1 closure bookkeeping).
- Historical G0 truth untouched.
- **Low finding:** implementer-supplied raw G1 evidence (`proof/g1-evidence/*` logs/screenshots) is gitignored/local-only; the G1 report references files a fresh clone cannot see. Mitigated by this audit's independent reproduction (audit evidence committed with this report under `proof/g1-audit-evidence/`).

## 12. Verdict (Step 15)

**VERIFIED WITH NON-BLOCKING FINDINGS — G1 CLOSURE PERMITTED.**

The frozen candidate `df2a1f6ce03133c68ecda5a3e577f86b092542c5` installs, builds, typechecks, lints, and passes its deterministic suite cleanly; the VICT ProductAgent/Mastra path is genuine (deterministic fixture through `MastraProductAgent`, adapter self-check, anti-fabrication instruction verified reaching the model surface); the real Cognee path is genuine and durable across restart; off-corpus and failure behaviors are honest; no fabrication path was observed anywhere; architecture boundaries (thin product over VICT capability surfaces) are preserved; retained findings do not violate the G1 contract.

### Retained findings register (auditor classification)

| #   | Finding                                                                                                                                                                           | Class         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| F1  | Upstream warm-worker second-cognify asyncio failure (VICT-Cognee, unfixed upstream); G1-local fresh-worker-per-durable-cognify workaround, bounded, durable, documented temporary | Medium        |
| F2  | Turn latency driven by per-turn durable intake (fresh worker ~33 s + cognify ~21 s; measured user turn 84.5 s; cold chains up to ~2–4 min) — surfaced honestly in UI/health       | Medium        |
| F3  | Gated `POST /api/shutdown` maintenance endpoint — verified gated (404 default); remove at G2                                                                                      | Low           |
| F4  | Every-user-message intake policy (temporary contract §5 policy)                                                                                                                   | Low           |
| F5  | Single dataset `g1.quellight` (temporary storage scope)                                                                                                                           | Low           |
| F6  | Implementer raw G1 evidence local-only/untracked; report pointers not reproducible from a fresh clone (audit evidence committed with this report partially mitigates)             | Low           |
| F7  | Cognee tarball not git-tracked; rebuild route documented in contract §3; SHA-256 pins provenance                                                                                  | Low           |
| F8  | Anti-fabrication instruction not asserted by the product suite's prompt capture (user-role-only); verified by auditor probe (system role)                                         | Low           |
| F9  | `npm audit`: vitest `@vitest/mocker` advisory (dev-only); `cookie` via `@sveltejs/kit` (not exercised — app sets/reads no cookies)                                                | Low (G5 flag) |
| F10 | Contract file formatting delta post-freeze (semantically identical; normalized diff verified)                                                                                     | Observation   |
| F11 | `turn.ts` duplicated idempotent statements in two catch blocks (no behavior change)                                                                                               | Observation   |
| F12 | `posthog-node` EBADENGINE under Node 22.13.1 (known G0); esbuild allowScripts npm-11 warning; LibSQL post-close observability log noise                                           | Observation   |

## 13. Closure performed (Step 17)

- `docs/STATE.md` updated: G1 VERIFIED / CLOSED; G2 PERMITTED BUT NOT BEGUN; stale G1 exclusion wording corrected; candidate/audit SHAs and next permitted action recorded; G0 history unchanged.
- `docs/DECISIONS.md`: QD-01 and QD-02 marked confirmed by G1 evidence. QD-04 remains open (owner decision, G2-adjacent).
- No implementation remediation was performed on product code at any point (double for clarity: fixes were only ever applied to the auditor's own harness processes).

## 14. Exact audit environment

- Host: Windows (MINGW64), Node `v22.13.1`, npm `11.19.1`.
- Python worker venv: `C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv` (Python 3.12.10, `cognee[gliner]==1.6.1`) — same pre-existing proof venv as G0.
- Playwright Chromium (bundled build) for browser phases.
- Audit command evidence: `proof/g1-audit-evidence/audit-*.log` (committed with this report).
- Auditor-only probe code (not part of the product suite, left out of the repository tree): `scratch/audit-model-surface.test.ts`, `scratch/vitest.audit.config.ts`, `scratch/probe-double-cognify.mjs` (pre-existing implementer script, rerun by auditor).

**Final audit verdict: G1 VERIFIED WITH NON-BLOCKING FINDINGS — CLOSURE PERMITTED AND PERFORMED.**
