# G2 Contract — Durable Meaning, Minimal Form (FROZEN)

**Status:** FROZEN before implementation (per RUNBOOK Gate 1)
**Branch:** `g2/durable-meaning` (created from verified `main` `78010faf716fdfa132acfd429b8b0370e5cec9fc`)
**Objective:** Quellight's first minimal durable semantic object — the **Meaning Record** — with
canonical storage in VICT Application Data, Cognee reduced to an eligibility-filtered semantic
projection, and G1's every-message intake removed.

---

## 1. Baseline and recovery anchor

- Verified `origin/main` at handoff: `78010faf716fdfa132acfd429b8b0370e5cec9fc` (G0 VERIFIED/CLOSED;
  G1 VERIFIED/CLOSED by independent audit; G2 PERMITTED BUT NOT BEGUN).
- G1 candidate lineage: `df2a1f6ce03133c68ecda5a3e577f86b092542c5` (ancestor of `main` — verified
  during recovery).
- Working tree clean at branch creation.

## 2. Owner decision QD-04 — RESOLVED FOR G2

G2 introduces Quellight's first minimal durable semantic object: a **Meaning Record**.

Binding separations (recorded in the handoff, all binding here):

```text
conversation             != canonical meaning
AI inference             != accepted meaning
Cognee candidate         != canonical meaning
stored meaning           != automatically active model context
```

- Quellight application-domain data (VICT Application Data) is the canonical durable source.
- Cognee is a semantic retrieval/index projection over eligible Quellight meaning.
- Cognee retrieval does NOT define canonical Quellight truth.

## 3. Canonical architecture (frozen)

```text
conversation
    | bounded semantic extraction (ProductAgent/Mastra route, closed schema)
    | Quellight policy decision (origin + standing)
    v
Canonical Meaning Store   (VICT Application Data: @victframework/appdata-sqlite)
    | only accepted AND current meaning is eligible
    v
Cognee projection         (add + cognify, dataset g2.meaning, namespace g2)
    | retrieval
    v
candidate results  ->  eligibility filter against canonical store  ->  ProductAgent / Mastra
```

- Cognee is NOT canonical Quellight state; Mastra memory is NOT canonical semantic truth.
- No second database abstraction: VICT Application Data is the only canonical semantic store.
- Model output NEVER writes canonical storage directly: every extraction crosses a closed
  Quellight-owned contract and the Quellight policy mapping before persistence.

## 4. MeaningRecord minimum semantics (frozen)

Fields (exact names are implementer-owned; these semantics are binding):

| Field              | Type / values                                                            |
| ------------------ | ------------------------------------------------------------------------ |
| `id`               | stable identity (identity key)                                           |
| `semanticKey`      | dotted stable key, e.g. `project.codename`                               |
| `value`            | the durable statement/fact                                               |
| `origin`           | `user_stated` \| `agent_inferred`                                        |
| `decisionState`    | `proposed` \| `accepted` \| `rejected`                                   |
| `sourceReference`  | turn reference (provenance)                                              |
| `sourceExcerpt`    | inspectable durable evidence (user utterance / inference rationale)      |
| `createdAt`        | ISO timestamp                                                            |
| `decidedAt`        | ISO timestamp where a decision exists (optional until decided)           |
| `supersededById`   | lineage link to the replacing record (optional)                          |
| `projectionState`  | `unprojected` \| `projected` \| `failed` (Cognee projection bookkeeping) |
| `projectionDetail` | honest failure evidence when projection failed (optional)                |

Effective state:

- **current** — `decisionState = accepted` AND no `supersededById`;
- **superseded** — `supersededById` present (old record preserved, never deleted);
- **proposed / rejected** — per `decisionState`.

Origin ≠ standing: where the meaning came from (`origin`) never determines standing
(`decisionState`). A user statement becomes accepted **only** because the user explicitly
requested durable retention; an AI inference is **always** `proposed` and never auto-accepted.

## 5. User-stated durable meaning policy (frozen)

- The only G2 write trigger for `user_stated` meaning is an explicit persistence request in the
  user message (e.g. "Remember that the project codename is Zephyr.").
- Explicit persistence request → `origin = user_stated`, `decisionState = accepted` immediately
  (justified: the user asked Quellight to retain it), with full provenance.
- Ordinary conversation creates NO canonical semantic write and NO Cognee intake.
- A normal conversation turn must not cause `cognee.add` or `cognee.cognify` merely because it
  exists (removes the G1 Low finding F4).

## 6. Semantic extraction (frozen)

- Bounded, G2-specific extraction via the existing VICT ProductAgent/Mastra route (a separate
  agent conversation lane; never the main conversation thread).
- The extraction output is a small closed-shape candidate (intent `none`/`remember`/`infer`,
  semanticKey, value, optional rationale). Raw model output is validated through a closed
  Quellight-owned contract (`defineContract`); invalid/unparseable output yields NO write.
- Quellight policy (deterministic, product-owned) maps validated candidates:
  `remember` → `user_stated` + accepted; `infer` → `agent_inferred` + proposed; `none` → nothing.
- Deterministic model fixture remains mandatory (QD-02): extraction entries are scripted on the
  exact composed extraction input; the fixture's default transform implements a small bounded
  deterministic parser (explicit remember/preference patterns) standing in for the model, and
  scripted entries cover scenario-specific model behavior in tests.

## 7. Proposal decision UI (frozen)

- Minimal UI: Proposed meaning shown with origin ("AI inferred") and [Accept] / [Reject].
- Accept: `proposed → accepted`, decision timestamp recorded, then Cognee projection attempted.
- Reject: `proposed → rejected` (never eligible, never projected).

## 8. Non-destructive correction / supersession (frozen)

- Correcting an accepted/current meaning creates a NEW accepted record linked by
  `supersededById`; the old record is PRESERVED (inspectable), never silently rewritten.
- Example: `project.codename = Zephyr` (current) then "Remember that the project codename is
  Orion now." → Orion accepted/current; Zephyr superseded (still stored and inspectable).

## 9. Cognee projection (frozen)

- Projection happens ONLY when meaning becomes accepted/current (explicit user statement,
  or accepting a proposal). Proposed and rejected meaning is NEVER projected.
- Projection content is compact and traceable, e.g.
  `meaning_record_id=<id> key=<semanticKey> value=<value>` — no conversation transcripts.
- Dataset `g2.meaning`, namespace `g2` (replaces the G1 Low finding F5 dataset `g1.quellight`).
  This is the G2 semantic-projection scope, not a final product dataset topology.
- Failure (`QUOLLIGHT_FAULT=cognee` or real worker failure): canonical record stays intact;
  `projectionState = failed` + honest `projectionDetail`; the turn/degradation is surfaced
  truthfully ("Meaning saved. Semantic retrieval projection is currently degraded."). No
  fabricated projection success; no rollback of the canonical decision.

## 10. Stale-projection / context eligibility (frozen)

- Cognee does not provide per-note replacement; stale projections may remain searchable after
  supersession. This is acceptable ONLY because any retrieved candidate is mapped back to the
  canonical store before entering model context:
- A hit WITHOUT a parseable `meaning_record_id`, or mapping to a record that is not
  accepted+current, is EXCLUDED (stale/unresolvable → never trusted).
- Only `accepted AND current` meaning reaches ProductAgent context. Proposed, rejected,
  superseded, and unresolvable hits are excluded. Canonical state always wins over the index.

## 11. Dependency pins (frozen)

| Dependency              | Pin                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VICT packages           | `@victframework/{mastra,runtime,sdk} 0.4.0-rc.1` (npm registry) — unchanged, NO VICT upgrade                                                                                                       |
| NEW (adopted)           | `@victframework/application 0.4.0-rc.1` + `@victframework/appdata-sqlite 0.4.0-rc.1` (npm registry, normal install; confirmed available)                                                           |
| `@victframework/cognee` | unchanged tarball `@victframework/cognee@0.1.0` from `radz2291/VICT-Cognee @ 78e6c0ab3f86c571878675d4a947c934768c5ec7`; SHA-256 `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117` |
| Python worker           | 3.12.x + `cognee[gliner]==1.6.1` (host proof venv; `QUOLLIGHT_COGNEE_PYTHON`)                                                                                                                      |
| App host                | SvelteKit + `@sveltejs/adapter-node` (unchanged)                                                                                                                                                   |

No dependency bytes may be substituted without recording and proving the change. No VICT
runtime/config change is authorized; if Application Data requires a VICT source change → STOP.

## 12. G1 retained findings disposition (frozen)

| Finding                                   | G2 disposition                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1/Medium upstream second-cognify failure | Workaround retained but reduced: fresh-supervised-worker cognify only on actual durable-meaning projection, not every turn                       |
| F2/Medium durable-turn latency            | Ordinary turns no longer cognify (measured); durable writes may stay slow and are surfaced honestly                                              |
| F3/Low gated `/api/shutdown`              | Attempted removal; clean worker/store shutdown for restart proofs still requires it → retained, gated off by default (404), documented temporary |
| F4/Low every-message intake               | REMOVED in G2 (no write, no add/cognify without durable-meaning intent)                                                                          |
| F5/Low `g1.quellight` dataset             | Replaced by `g2.meaning` projection scope (not claimed final)                                                                                    |

## 13. Browser scenarios (frozen)

B1 ordinary turn (no write, no cognify) · B2 explicit durable meaning ("Remember that the
project codename is Zephyr.") with provenance and restart survival · B3 recall through the
intended retrieval/eligibility path · B4 agent-inferred proposal (appears under Proposed, NOT
used as accepted context) · B5 accept + reject exercised (eligibility changes accordingly) ·
B6 correction to Orion (Zephyr in history, lineage inspectable, no destructive rewrite) ·
B7 stale-index protection (superseded Zephyr hit filtered; agent receives Orion only) ·
B8 Cognee failure (canonical meaning intact, degradation honest) · B9 narrow viewport +
keyboard operability (G1 usability retained).

## 14. Automated acceptance tests (frozen)

The suite must prove, deterministically (real appdata adapter; real ProductAgent/Mastra +
fixture; Cognee double at the capability-binding boundary; real Cognee for the integration proof):

1. ordinary conversation (no durable intent) → no canonical semantic write;
2. ordinary conversation → no `cognee.add` and no `cognee.cognify`;
3. explicit persistence intent → accepted `user_stated` MeaningRecord;
4. the record survives application restart (real on-disk SQLite in the integration proof; file-based store in tests);
5. accepted/current meaning is projectable to Cognee;
6. retrieval can find the projected candidate;
7. the candidate is mapped back to canonical state before model-context inclusion;
8. AI inference creates `agent_inferred + proposed`, not accepted;
9. proposed meaning is excluded from ordinary model context;
10. accepting a proposal makes it eligible (and projects it);
11. rejecting a proposal keeps it ineligible;
12. correction creates new accepted meaning and preserves the old record;
13. superseded meaning is excluded from model context;
14. stale Cognee retrieval cannot bypass the canonical eligibility filter;
15. model output never directly becomes accepted canonical state (closed contract + policy only);
16. Cognee failure does not corrupt/delete canonical meaning;
17. projection failure is surfaced honestly;
18. no G1 every-message intake remains.

## 15. Negative controls (frozen)

- No meaning persisted by ordinary conversation; no cognify by ordinary conversation;
- no AI auto-acceptance; proposed/rejected/superseded meaning never in normal model context;
- stale Cognee hits cannot override canonical state; Cognee failure does not erase canonical
  meaning; model output does not directly mutate canonical semantic truth;
- NO raw SQLite access in product code outside the VICT Application Data adapter boundary;
- NO private VICT imports; no second persistence framework; no generic ontology/intelligence
  engine; no custom queue/worker pool; no hidden G3 work (threads, open loops, commitments,
  goals, E1–E7, Shared World, initiative, event-driven loop, knowledge-management platform,
  custom vector/graph/embedding machinery, `@vict/intelligence`).

## 16. Verification plan (once, on frozen candidate)

`npm ci` → `svelte-check` → `prettier --check` → `vitest run` → `npm run build` →
`proof/g2-cognee-integration.mjs` (real worker; Zephyr → correct to Orion; stale-index filter
proof; restart durability; failure honesty) → browser walkthrough B1–B9 (incl. extras:
failure + narrow/keyboard) → clean-tree check → exact commands/exit codes recorded in
`docs/reports/G2-DURABLE-MEANING.md`.

## 17. Stop conditions

Per RUNBOOK: VICT source change / VICT upgrade / Cognee or Mastra replacement, VICT boundary
bypass, heavyweight persistence framework, generic semantic/ontology engine, custom queue or
worker-pool infrastructure, publication/production/credentials/irreversible actions, G3
concepts, authority policy decisions, material license decision. Do not silently expand scope.

## 18. G3 exclusion

No claims about G3 semantics. G2 = Meaning Records only. No threads/open loops/commitments/
goals/SynchronizationState/living user model/self model/world interpretation/initiative/proactive
monitoring/event-driven loops/autonomous actions/connectors/extraction to a framework.
