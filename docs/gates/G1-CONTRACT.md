# G1 Contract — Walking Quellight (FROZEN)

**Status:** FROZEN before implementation (per RUNBOOK Gate 1)
**Branch:** `g1/walking-quellight` (created from G0 closure `7ee427ac…`)
**Objective:** smallest real browser end-to-end product slice proving the Quellight → VICT → (ProductAgent/Mastra | Cognee) architecture.

---

## 1. Objective

A user opens Quellight in a browser, converses, and durable knowledge entered through the
conversation path becomes retrievable through the VICT-Cognee capability path so that the
VICT ProductAgent (Mastra runtime) can use it when answering. Retrieval absence and
dependency failure degrade truthfully. Nothing more than the walking slice.

## 2. Owner decisions resolved for G1 (recorded verbatim from the handoff)

- **QD-01** — First vertical slice: conversation UI → durable knowledge item → Cognee
  retrieval → VICT ProductAgent/Mastra reasoning → natural answer. Canonical demo:
  codename-fact recall (mechanism-proven; not hardcoded).
- **QD-02** — Provider policy: deterministic offline fixture is the REQUIRED path for all
  automated/repeatable verification. Live path is optional: `GLM-5.3-flash` (or configured
  equivalent) ONLY IF a legitimate VICT/Mastra-route credential is already configured.
  No credential exists on the development host (verified at contract freeze: only session
  model vars, no app-route provider credential). Live-model proof is therefore recorded
  `NOT RUN — no authorized configured credential available`. Fixture-only G1 stays fully
  functional. No credential creation/commit/exposure.

## 3. Dependency pins (frozen)

| Dependency | Pin | Source |
| --- | --- | --- |
| VICT repo reference | `radz2291/vict-02` @ `fd675d9083a32f282820d9e0135c191d691c943c` | read-only reference |
| `@victframework/{sdk,runtime,mastra,contracts,kernel}` | `0.4.0-rc.1` (npm registry) | exact G0 pins, unchanged |
| `@victframework/cognee` | `0.1.0` tarball built from `radz2291/VICT-Cognee` @ **`78e6c0ab3f86c571878675d4a947c934768c5ec7`**; expected SHA-256 of `victframework-cognee-0.1.0.tgz` = `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117` | verified G0 route: clean clone → `pack && npm install && npm run build && npm pack`; checksum verified before install; `file:` install, NO npm flags |
| Python worker | 3.12.x + `cognee[gliner]==1.6.1` (host venv; path via env `QUOLLIGHT_COGNEE_PYTHON`) | pre-existing proof venv |
| App host | SvelteKit (current, stable) + `@sveltejs/adapter-node` | app-local choice (WP-A) |

No dependency bytes may be substituted without recording and proving the change.

## 4. Product flow (frozen)

```text
Browser (conversation UI)
  ↓ POST /api/turn { message }
Quellight server (src/lib/server/*, server-only)
  ↓ 1. Durable intake (temporary G1 policy): cognee.add + cognee.cognify (keyed, idempotent),
  |    dataset `g1.quellight`, namespace `g1` — via VICT capability-bindings ONLY
  ↓ 2. Retrieval: cognee.searchChunks (scoped read), conservative topK=5, raw scores kept
  ↓ 3. Context selection: include hits verbatim as labeled CANDIDATES (no invented threshold)
  ↓ 4. Compose turn input (deterministic composer: candidates block + current question)
  ↓ 5. VICT ProductAgent (MastraProductAgent, offline deterministic fixture model) runTurn
  ↓ 6. Return { answer, meta { retrievalUsed, degraded flags } }
Browser renders messages distinctly: user / assistant / system-note
```

Semantic invariants honored at G1:

- Cognee hit ≠ truth — candidates are labeled context only;
- model response ≠ durable state — nothing from model output is ever written to Cognee;
- retrieval absence ≠ fabrication — degraded/unavailable retrieval is explicit.

## 5. Allowed storage behavior (temporary G1 policy — documented, not final memory policy)

- Durable store: ONE Cognee dataset `g1.quellight` in namespace `g1`, isolated store root
  `quellight/run/cognee-store` (gitignored; disposable per-run if config chooses).
- `cognee.add` + `cognee.cognify` run for every user message submitted through the
  conversation path (simple sanctioned G1 policy). No forget/lifecycle machinery.
- Session/conversation history: browser session + server thread session only;
  NOT durable product memory. Mastra dedicated store is runtime plumbing, not the
  canonical Quellight durable world.

## 6. Deterministic model contract

- `createDeterministicOfflineModel` scripts map EXACT composed turn input → scripted step.
- The script is built by the same composer function the app uses, so script keys are the
  app's real composed inputs — not product special cases.
- Mechanism proof (retrieval → model): tests capture the prompt passed into the real
  Mastra agent surface via a capturing model-factory wrapper (test-only double at the
  boundary) and assert the retrieved candidate text + anti-fabrication instruction are
  present in the actual composed prompt.
- Browser fixture viability: the UI provides demo prompt chips matching the canonical
  scripted walkthrough scenarios.

## 7. Acceptance tests (frozen)

1. App logic accepts a user message (unit).
2. Durable intake goes through VICT/Cognee capability bindings (unit w/ pack double +
   real integration proof).
3. Retrieval returns the stored synthetic knowledge (real Cognee integration proof).
4. Retrieved context reaches the ProductAgent path (prompt-capture assert).
5. Deterministic fixture returns the expected answer for the composed recall input
   (end-to-end deterministic proof).
6. Off-corpus question does NOT assert a stored personal fact (no fabricated candidates
   become asserted fact in the answer).
7. Cognee failure/absence does not fabricate retrieval (degraded path, explicit flag).
8. Model failure surfaces as failure (no fake success).
9. No model output is ever written as confirmed durable knowledge (write path only from
   user messages via capability bindings; verified by code inspection + tests).

Plus: real Cognee consumer integration proof (add→cognify→searchChunks→feed ProductAgent),
build, typecheck, lint, browser walkthrough W1–W4.

## 8. Negative controls (frozen)

- No old Quellight code; no `@vict/intelligence`; no custom embeddings/vector/graph/agent loop.
- No direct Cognee internals in product code — capability bindings only.
- No direct Mastra internals in product code where the VICT abstraction suffices.
- No force-installed peers; no bypass flags; no VICT/VICT-Cognee edits from this repo.
- No credentials committed; no secrets in evidence; no client exposure of server-held config.
- Cognee retrieval not treated as canonical truth; model output not durably accepted.

## 9. Work ownership

Single implementation lane (this agent). No parallel worktrees; no orchestration framework.

## 10. Verification plan (once, on frozen candidate)

`npm ci` → `npm run typecheck` → `npm run lint` → `npm test` (unit/deterministic) →
`npm run build` → `proof/g1-cognee-integration.mjs` (real worker) → browser walkthrough
(W1–W4 incl. controlled-failure knob) → clean-tree check → record exact commands/exit codes.

## 11. Stop conditions

Per RUNBOOK: architecture conflict, heavyweight framework need, need to modify VICT or
VICT-Cognee, licensing, secrets, publication, production/irreversible actions, bypass of
VICT boundaries, G2-adjacent semantic decisions (final ontology, memory lifecycle, QD-04).

## 12. G2 exclusion

No claims/commitments/open-loops/epistemic types/threads/Shared World/attention/initiative/
action execution/memory editor/G2 semantics. QD-04 stays open unless G1 evidence makes a
resolution purely mechanical.