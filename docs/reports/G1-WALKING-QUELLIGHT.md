# G1 Report — Walking Quellight

**Gate:** G1 — Walking Quellight (contract: `docs/gates/G1-CONTRACT.md`, frozen at `04b3e68`)
**Branch:** `g1/walking-quellight` (created from G0 closure `7ee427ac1abbb864922eef16f81d28a1394f3666`)
**Author:** G1 implementation/integration owner (single lane, per contract §9)
**Verdict:** **CANDIDATE COMPLETE — PASS with non-blocking findings.** Awaiting independent verification; G1 is NOT self-declared closed.

---

## 1. Objective & scope

A browser user converses with Quellight; messages entered through the conversation path are
stored as durable knowledge through the VICT-Cognee capability path and retrieved so the VICT
ProductAgent (Mastra runtime) answers using them. Retrieval absence and dependency failures
degrade truthfully. Nothing beyond the walking slice; no G2 semantics.

## 2. Owner decisions applied (from the executing handoff; recorded in the frozen contract §2)

- **QD-01 (resolved):** first vertical slice is the conversation UI → durable knowledge item →
  Cognee retrieval → VICT ProductAgent/Mastra reasoning → natural answer. Canonical demo:
  codename-fact recall (mechanism-proven; not hardcoded).
- **QD-02 (resolved):** deterministic offline fixture is the REQUIRED path for all
  automated/repeatable verification. Live model: `NOT RUN — no authorized configured credential
available` (verified at contract freeze; no credential created or exposed). Fixture-only G1
  stays fully functional.
- Per executing authorization: the fresh-supervised-worker-per-cognify behavior is a
  **G1-local compatibility workaround**, not a permanent Quellight architecture decision
  (see §8).

## 3. What was built

- **App:** SvelteKit 2 / Svelte 5 + `@sveltejs/adapter-node` at the repository root.
  - `/` — conversation UI (user / assistant / system-note rendering; demo prompt chips;
    honest degraded-path notes; narrow-screen usable; keyboard-only operable).
  - `POST /api/turn` — the frozen product flow (contract §4): durable intake → retrieval →
    deterministic composition → VICT ProductAgent → answer + honest meta flags.
  - `GET /api/health` — model identity/mode/liveStatus, knowledge state
    (`ready | degraded | initializing` with settle semantics), turn count.
  - `POST /api/shutdown` — **temporary, gated** maintenance endpoint
    (`QUOLLIGHT_MAINTENANCE_SHUTDOWN=1`) used by proofs for clean supervision shutdown
    (releases the store-owner lock). Not part of the product surface; candidate for removal
    at G2 review.
- **Server-only modules** (`src/lib/server/`): frozen composer (`compose.ts`), deterministic
  fixture model keyed on real composed inputs (`fixture-model.ts`), knowledge store via VICT
  capability bindings only (`knowledge.ts` — `cognee.add` / `cognee.cognify` /
  `cognee.searchChunks`; worker `.env` keyless; fresh supervised worker per durable cognify),
  VICT ProductAgent assembly (`product-agent.ts` — `AGENT_PROFILE_SCHEMA`, registry,
  `MastraProductAgent`), turning (`quellight.ts`, `turn.ts`).
- **Dependency intake:** `@victframework/cognee@0.1.0` tarball route (checksum-verified,
  cold-clone LF build reproducing the G0-audit SHA-256 `9c9545…9117`), installed via
  `file:vendor/cognee/victframework-cognee-0.1.0.tgz` with **no** npm flags. VICT pins
  unchanged (`0.4.0-rc.1`; VICT ref `fd675d9…`; Cognee commit `78e6c0a…`).
- **Temporary G1 intake policy (documented, not final memory policy):** every user message
  is stored (`add` + `cognify`) into dataset `g1.quellight`. No forget/lifecycle machinery;
  no model output is ever written to Cognee.

## 4. Mechanical verification (exact commands / exit codes)

All commands run in sequence from the repository root at frozen tip `b9d5291`
(the `npm ci` step was executed immediately before the typecheck/lint/test/build
sequence, producing the fresh install all subsequent steps used; log:
`proof/g1-evidence/frozen-dag.log`). The real-Cognee integration proof and the
browser walkthrough/extras were then re-run once on this same frozen tip.

| Step                    | Command                                                        | Result                                                                 |
| ----------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Fresh CI install        | `npm ci`                                                       | exit 0 (EBADENGINE warning for `posthog-node` only — known G0 finding) |
| Typecheck               | `npx svelte-check --tsconfig ./tsconfig.json --output machine` | exit 0 — 0 errors, 0 warnings (1358 files)                             |
| Lint/format             | `npx prettier --check .`                                       | exit 0 — all matched files clean                                       |
| Unit tests              | `npx vitest run`                                               | exit 0 — 2 files, 15/15 passed                                         |
| Build                   | `npm run build`                                                | exit 0                                                                 |
| Integration proof       | `node proof/g1-cognee-integration.mjs`                         | exit 0 — 10/10 evidence points PASS                                    |
| Browser walkthrough     | `node proof/g1-browser-walkthrough.mjs`                        | exit 0 — W1/W2/W3/W-rest PASS                                          |
| Browser failure phase   | `node proof/g1-browser-extras.mjs failure`                     | exit 0 — PASS                                                          |
| Browser narrow/keyboard | `node proof/g1-browser-extras.mjs narrow`                      | exit 0 — PASS                                                          |
| Clean-tree check        | `git status --porcelain` after the DAG and proofs              | tracked tree clean (disposable run-store content only, gitignored)     |

Deterministic test suite (`tests/walking-turn.test.ts`, `tests/compose.test.ts`) covers the
frozen contract's acceptance tests 1, 4–9 with doubles at the boundary only
(`tests/helpers/fake-cognee.ts` pack double; `tests/helpers/capture-model.ts` prompt-capture
proxy around the real fixture model — asserts retrieved candidate text and the
anti-fabrication instruction are present in the actual composed prompt).

## 5. Real VICT/Cognee consumer integration proof

Script: `proof/g1-cognee-integration.mjs` (real worker: host venv
`cognee[gliner]==1.6.1`). Log: `proof/g1-evidence/g1-integration-run.log`, exit code `0`.

| ID      | Evidence point                                                         | Outcome |
| ------- | ---------------------------------------------------------------------- | ------- |
| I0      | server boots with knowledge configured to READY                        | PASS    |
| W1      | basic conversation answers through the path                            | PASS    |
| I1      | fact stored/cognified through real VICT capability bindings            | PASS    |
| W2      | recall uses REAL retrieved durable knowledge (verbatim candidates)     | PASS    |
| W3      | off-corpus question: no fabricated personal fact                       | PASS    |
| S0      | restart: knowledge ready from persisted store                          | PASS    |
| I2      | durable recall persists across app restart                             | PASS    |
| W4a     | model failure surfaces as HTTP failure (no fake success)               | PASS    |
| W4b-pre | knowledge reported degraded when worker disabled                       | PASS    |
| W4b     | knowledge unavailable answered truthfully without fabricated retrieval | PASS    |

**10/10 PASS.** Observed real latencies (honest, preserved): worker cold boot ~30–40 s;
cognify ~17–25 s per fresh worker; search ~0.4 s; a full cold-turn measured ~2–4 min.
Latency is not hidden: the UI shows a truthful "Storing turn in durable knowledge and
thinking…" state during turns.

## 6. Browser walkthrough (real browser, Playwright, built app)

Script: `proof/g1-browser-walkthrough.mjs`; extras: `proof/g1-browser-extras.mjs`.
Ledgers/screenshots: `proof/g1-evidence/browser/` (`walkthrough-ledger.json`,
`extras-ledger.json`, `00`–`06` PNGs). All runs exit 0.

| ID      | Evidence point                                                                                                               | Outcome |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| W1      | basic conversation through the reasoning path (browser)                                                                      | PASS    |
| W2a     | durable intake of the synthetic fact through the browser UI                                                                  | PASS    |
| W2      | durable recall through the browser (answer textually quotes the stored fact)                                                 | PASS    |
| W3      | off-corpus honesty through the browser (favorite color NOT asserted)                                                         | PASS    |
| W-rest  | page reload preserves durable knowledge (fresh conversation view)                                                            | PASS    |
| W4b(br) | controlled model fault (`QUOLLIGHT_FAULT=model`) surfaces honestly in the browser — failure note shown, no fabricated recall | PASS    |
| N1      | narrow viewport (390px) renders without horizontal overflow                                                                  | PASS    |
| N2      | keyboard-only interaction (type + Enter) submits and answers                                                                 | PASS    |

Restart durability through the browser is additionally evidenced by the `S0`/`I2` server-side
phases and the reload/persistence observations above.

## 7. Acceptance test mapping (frozen contract §7)

| #   | Acceptance test                                         | Where proven                                 |
| --- | ------------------------------------------------------- | -------------------------------------------- |
| 1   | app logic accepts a user message                        | unit (`walking-turn.test.ts`)                |
| 2   | durable intake via VICT/Cognee capability bindings      | unit (pack double) + integration I1          |
| 3   | retrieval returns stored synthetic knowledge            | integration W2/I2 + browser W2               |
| 4   | retrieved context reaches the ProductAgent path         | unit (prompt capture) + integration W2/I2    |
| 5   | deterministic fixture answers the composed recall input | unit + integration + browser W2              |
| 6   | off-corpus does NOT assert a stored personal fact       | unit + integration W3 + browser W3           |
| 7   | Cognee failure/absence does not fabricate retrieval     | unit + integration W4b(-pre)                 |
| 8   | model failure surfaces as failure                       | unit + integration W4a + browser W4b         |
| 9   | no model output written as durable knowledge            | code inspection + unit write-path assertions |

## 8. Negative controls (frozen contract §8) — checked

- No old-Quellight imports; no `@vict/intelligence` (grep: none).
- No custom embeddings/vector/graph/agent-loop machinery in product code (grep: none; the
  `EMBEDDING_*` strings are the Cognee worker's own env defaults, set unconditionally, no
  credentials).
- Product code touches only package public surfaces: `createCogneePack`
  (`@victframework/cognee`), `AgentProfileRegistry` / `protectCredentialPort`
  (`@victframework/runtime`), `AGENT_PROFILE_SCHEMA` (`@victframework/sdk`),
  `MastraProductAgent` + offline model (`@victframework/mastra`).
- No direct Cognee/Mastra internals; no direct Python embedding in the server — only the
  supervised worker subprocess with a keyless `.env`.
- No force-installed peers / bypass flags anywhere (dependency intake reviewed).
- No credentials or secrets committed (grep over src/tests/docs: no values; docs hits are
  governance prose).
- No VICT or VICT-Cognee repository edits from this repo (tarball intake route only).
- Retrieval hits are labeled unverified candidates; model output is never written to Cognee.

## 9. Non-blocking findings (retained for later evaluation)

1. **Warm-worker second-cognify failure (upstream, UNFIXED by design here).**
   A second `cognee.cognify` within one worker process's lifetime fails deterministically
   (`RuntimeError: <asyncio.locks.Lock> is bound to a different event loop`). Diagnosed with
   `scratch/probe-double-cognify.mjs`. **Quellight-local workaround (bounded):** one fresh
   supervised Cognee worker per durable cognify, plus bounded recovery on intake failure.
   Recorded as a **G1-local compatibility workaround, not a permanent architecture decision**;
   no custom queue/pool/semantic engine was introduced; VICT/VICT-Cognee untouched.
2. **Cold-cognify turn latency (honest).** Cold turn ~2–4 min (worker boot + cognize);
   warm turn (no fresh cognify) ~0.5–2 s for retrieval-backed answering. Surfaced truthfully
   in UX; not hidden by tests/UX anywhere.
3. **Store-owner lock refuses to release after hard-killed owners** (fail-closed by design,
   C5/C3 contract §8.1). Proofs use clean shutdown; documented manual recovery (delete lock
   file) applies after abnormal termination.
4. **CRLF tarball note.** A CRLF working-copy build produces line-ending diffs only in worker
   `.py` files vs the G0-audit checksum; the committed route pins the cold-clone (LF) build
   that reproduces the audit SHA exactly.
5. **Temporary artifacts requiring G2 follow-up:** the gated `/api/shutdown` endpoint; the
   every-message intake policy; single dataset `g1.quellight`.

## 10. Verdict

The frozen G1 candidate proves the Quellight → VICT → Cognee/Mastra walking architecture in
browser and integration proofs with honest degradation and no fabrication paths observed.
**G1 is not declared verified or closed here.** Per governance, independent verification with
reproducible evidence is required; findings §9 are retained, not resolved.

---

_Evidence pointers: `proof/g1-evidence/*` (integration + browser ledgers, logs, screenshots),
`tests/*` (deterministic suite), `docs/gates/G1-CONTRACT.md` (frozen contract)._
