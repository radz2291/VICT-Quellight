# G0 Cognee Re-proof — Independent Audit Report

**Status:** COMPLETE — verdict recorded in `docs/STATE.md`
**Verifier role:** fresh independent auditor/verifier for G0. Did **not** implement the original Quellight G0 candidate, did **not** implement the VICT-Cognee compatibility remediation, and performed **no** implementation remediation anywhere.
**Audit branch:** `verify/g0-cognee-reproof`, created from the exact frozen G0 candidate `5da8b178149ba2776da3777b4e030f92f0700894`.
**Audit verdict:** **VERIFIED — G0 PASS, FORMAL CLOSURE PERMITTED** (§13).

---

## 1. Verifier setup and repository truth (recovered independently)

All SHAs verified with `git fetch` + `git rev-parse` immediately before work:

| Repository | Item | Value | Check |
| --- | --- | --- | --- |
| `radz2291/VICT-Quellight` | `origin/main` | `3248ceb8d1c2af74e8750cf3fcee5e3d331f601e` | ✓ unchanged |
| `radz2291/VICT-Quellight` | `origin/g0/dependency-intake` | `5da8b178149ba2776da3777b4e030f92f0700894` | ✓ exact frozen candidate |
| `radz2291/VICT-Quellight` | working tree | clean at audit start | ✓ |
| `radz2291/VICT-Cognee` | `origin/main` | `2c180efbc564c4a4a3f22556858f108e2fa23bc0` (C7 baseline) | ✓ |
| `radz2291/VICT-Cognee` | `origin/compat/vict-0.4-rc1` | `78e6c0ab3f86c571878675d4a947c934768c5ec7` | ✓ |
| `radz2291/vict-02` | `origin/main` | `fd675d9083a32f282820d9e0135c191d691c943c` | ✓ (unchanged for this G0 cycle) |

The compatibility candidate is **exactly one commit** on top of the recorded C7 baseline (`2c180ef` → `78e6c0a`), i.e. one bounded change lineage. The full diff was inspected: code changes are limited to `pack/package.json` (peer ranges), `pack/src/{manifest,bindings,contracts}.ts` (type narrowing only), `pack/verify/verify.ts` (harness-only optional VICT-target override, default unchanged) and README/doc updates; no worker/supervision/runtime semantic file was touched.

Original G0 blocker verified from repository evidence (`docs/reports/G0-DEPENDENCY-INTAKE.md` §6.1 + `proof/cognee-compat/evidence/eresolve-npm-install-failure.txt`): npm ERESOLVE on `peerOptional ^0.3.1` vs VICT `0.4.0-rc.1`. Preservation of the original report: §14.

All ten governance/state documents were read in the mandated order before the audit.

## 2. Peer declaration verified at the candidate SHA (not from documentation)

Direct source and packed-tarball inspection at `78e6c0a`:

```text
pack/package.json peerDependencies:
  @victframework/sdk:      "^0.3.1 || ^0.4.0-rc.1"
  @victframework/runtime:  "^0.3.1 || ^0.4.0-rc.1"
```

Both remain `peerDependenciesMeta` **optional**; `private: true` retained in the packed manifest.

## 3. Exact artifact built by this verifier (not the implementing agent's tarball)

Fresh cold clone of `https://github.com/radz2291/VICT-Cognee`, checkout at `78e6c0ab…`, clean tree, built per repository route:

```text
Environment: Node v22.13.1, npm 11.19.1 (Windows 11 x64)
cd pack && npm install --no-audit --no-fund   → exit 0
npm run build                                 → exit 0 (TypeScript build clean)
npm pack --pack-destination ..                → victframework-cognee-0.1.0.tgz
```

- Tarball: `victframework-cognee-0.1.0.tgz`, 47,506 bytes, **19 files**
- SHA-256: `9c9545222312cfcc130085b20b04ea5379948ac02d8f151ea7166a8a94439117`
- `private: true` in packed manifest: **confirmed** (npm would refuse publication; no publication performed anywhere in this audit)
- Layout identical to the C5/C7 baseline (see `tarball-contents-verify-build.txt`)

## 4. Fresh flagless consumer install — THE CENTRAL RE-PROOF — PASS

Completely disposable consumer workspace, `package.json` pinning the freshly built tarball plus `@victframework/{sdk,runtime,contracts,kernel}@0.4.0-rc.1` and `zod ^3.25.0`:

```text
npm install --no-audit --no-fund     → exit 0
```

Restrictions honored: **no** `--force`, **no** `--legacy-peer-deps`, **no** overrides, **no** peer-manifest editing, **no** tarball modification, **no** cache substitution. Normal npm resolution only.

Resolved versions (exact):

| Package | Version | Source |
| --- | --- | --- |
| `@victframework/cognee` | 0.1.0 | verifier-built tarball |
| `@victframework/sdk` | 0.4.0-rc.1 | npm registry |
| `@victframework/runtime` | 0.4.0-rc.1 | npm registry |
| `@victframework/contracts` | 0.4.0-rc.1 | npm registry |
| `@victframework/kernel` | 0.4.0-rc.1 | npm registry |
| `zod` | 3.25.76 | npm registry |

Evidence: `install-rc1-resolutions.txt`.

**This single result removes the original G0 blocker.**

## 5. Compatibility battery re-run (original scripts, unmodified)

`proof/cognee-compat/scripts/battery.mjs` was copied **byte-identical** (sha1 `d139701d…` both sides) into the fresh consumer workspace, run against the extracted verifier-built tarball and the installed `0.4.0-rc.1` packages:

```text
V0  manifest validates against current sdk validateCapabilityPack      PASS
V1  installCapabilityPack installs six capabilities                    PASS
V2  test-mode doubles (add+cognify) via current runtime                PASS
V2b forget double in test mode                                         PASS
V3  read in test mode fails closed (no double)                         PASS
V4  ungranted write fails pre-handler (permission before handler)      PASS
V5b sequential-engine unkeyed write refused in normal mode             PASS
V9a durable write graph in test mode refused (store unchanged)         PASS
V9b durable write graph in simulate mode refused                       PASS
V9d durable forgetDataset graph in test mode refused                   PASS
V10a ctx deadline fails BEFORE worker request                          PASS
V10b insufficient deadline fails BEFORE worker request                 PASS
```

**12/12 PASS, exit 0** — same count as the original G0 battery; no script changes were needed or made. Evidence: `battery-reproof-rerun.json`, `battery-reproof-rerun-ledger.txt`.

## 6. Type compatibility probe — clean compile, plus sensitivity control

- **Remediated artifact, unmodified original probe** (`typecheck-probe.ts`, structural assignability to `CapabilityPack`, `installCapabilityPack` call, **no casts**): `tsc --strict` → **exit 0** against `sdk@0.4.0-rc.1`. No `as never` workarounds; no VICT type weakening (VICT untouched).
- **Sensitivity control (extra, this audit):** the same probe against the verifier-built tarball of the **unmodified C7 baseline (`2c180ef`)** fails with the original `TS2322: effect: string vs EffectClass`. The probe is demonstrably sensitive to exactly the friction the remediation claims to fix.

Evidence: `typecheck-probe-rc1-vs-baseline.txt`.

## 7. Bounded real-worker smoke — PASS

Config: Python 3.12.10 + `cognee[gliner]==1.6.1` (pre-existing proof venv), isolated disposable store, keyless `.env` (`EMBEDDING_PROVIDER=fastembed`, `GRAPH_EXTRACTOR=gliner_demo`, no LLM key), one trust domain (`namespaces: ['g0reproof']`), one worker, synthetic test content only. The pack instance used is the one **npm installed** from the verifier's tarball. Script: `real-worker-smoke.mjs` (audit tooling only).

```text
add (keyed)           → receipt { datasetName: g0reproof.d1, reconciled: fresh-execution, itemsAfter: 1 }   PASS
cognify (keyed)       → receipt { reconciled: fresh-execution, deduplicated: true }                          PASS
searchChunks (scoped) → total 1; exact sentinel chunk "…ZEPHYR-QUARTZ-42…" returned                          PASS
REAL_WORKER_SMOKE: OK  → exit 0
```

Honest run ledger: attempt 1 failed (`COGNEE_SCOPE_REJECTED`) and attempt 2 failed (script `TypeError`) — **both were bugs in the verifier's own smoke script** (dataset name must be `<ns>.<name>`; receipt field assertions), which the pack correctly enforced/did not crash on. No pack-behavior failure occurred; no environment/download rerun was needed; model caches were already warm on this host (no model download occurred during the smoke).

Evidence: `real-worker-smoke.mjs`, `reproof-smoke-final-stdout.txt`, `reproof-smoke-final-stderr.txt`.

## 8. Regression / safety inspection (diff inspection + artifact dist diff)

The verifier built **both** tarballs (remediated `78e6c0a` and C7 baseline `2c180ef`) and diffed the package contents:

**Byte-identical (behavior-bearing):**
`dist/supervision.js`, `dist/contracts.js`, `dist/bindings.js`, `dist/index.js`, `dist/index.d.ts`, `dist/worker/cognee_worker.py`, `dist/worker/guard_store_roots.py`.

**Differs — type declarations and metadata only:**
`manifest.js` delta is **one comment** (all manifest values identical); `.d.ts`/`.js.map` deltas are the type narrowing; `package.json` delta is the peers; `README.md` delta is documentation.

Manifest values cross-checked at runtime (from the built dist): six capability IDs unchanged (`cognee.add`, `cognee.cognify`, `searchChunks`, `searchSummaries`, `datasetsStatus`, `forgetDataset`), revisions unchanged (`1`), `add`/`cognify` = `write`/`keyed`, searches/status = `read`, `forgetDataset` = `irreversible` (`cognee.delete`), doubles unchanged (`test|simulate` on add/cognify/forgetDataset), `secret: []`, `victCompatibility ^0.1.0` unchanged.

Findings from the source diff (checked, none a regression):

| Inspection point | Result |
| --- | --- |
| No stale-lock auto-recovery introduced | ✓ `supervision.js` byte-identical |
| Worker supervision not redesigned | ✓ `supervision.js` byte-identical |
| Unkeyed writes refused / keyed-write semantics | ✓ battery V5b/V6-class checks PASS |
| Namespace/store semantics | ✓ real-worker scope guard **actively enforced** the `<ns>.<name>` scope against this verifier's own first script (observed fail-closed, `COGNEE_SCOPE_REJECTED`) |
| Publication disabled | ✓ `private: true` retained; nothing published |
| `pack/verify/verify.ts` harness change | ✓ optional `C5_VICT_TARGET` env readback, default unchanged; test semantics unchanged — not a test weakening |
| Cognee results are candidate knowledge, not Quellight truth | ✓ (no retrieval consumed as truth anywhere; unchanged repository boundary) |

Full diff record: `dist-diff-baseline-vs-candidate.txt`.

## 9. Mastra arm disposition (Step 10)

**Original PASS preserved, cited, not re-run.** Grounds: no drift — VICT `main` unchanged at `fd675d90…` for this G0 cycle; `@victframework/mastra@0.4.0-rc.1` still current on the `vict-0.4.0-rc` dist-tag; Quellight pins unchanged since the frozen SHA; the Cognee remediation touched only the Cognee pack's npm peer declaration and types — it cannot affect the Mastra dependency route. Original PASS evidence preserved at `proof/mastra-evidence/mastra-proof.json` (see `docs/reports/G0-DEPENDENCY-INTAKE.md` §5).

## 10. G0 exit-condition audit (Step 11)

| # | Original G0 requirement | Disposition |
| --- | --- | --- |
| 1 | Reproducible fresh consumer baseline | ✓ original evidence + this audit's own flagless install (§4) |
| 2 | VICT/Mastra path proven | ✓ original proof; no drift (§9) |
| 3 | Cognee/current-VICT compatibility without bypass | ✓ this audit: build + flagless install + battery + type probe + real-worker (§3–8) |
| 4 | No blocking dependency issue | ✓ the single blocker is removed by `78e6c0a` |
| 5 | No old-Quellight import | ✓ original evidence; this branch adds audit artifacts only |
| 6 | No premature semantic/intelligence framework | ✓ no new code/product in this audit |
| 7 | No unauthorized publication/production/irreversible action | ✓ `private: true` retained; nothing merged to `main`; VICT and VICT-Cognee untouched |

## 11. Findings

**Blocking:** none.

**Non-blocking observations (carried/recorded):**
1. `posthog-node` EBADENGINE warning under Node 22.13.1 (pre-existing, from original G0 §8; telemetry-sink only).
2. Peer ranges admit future `0.3.x`/`0.4.x` semver-compatible versions that were not exercised (only `0.3.1` and `0.4.0-rc.1` exercised) — by the same semver convention as the pre-remediation `^0.3.1` declaration.
3. This audit's own smoke-script corrections (dataset scope shape; receipt field checks) are recorded honestly; they were verifier tooling bugs, not pack defects — and the pack's scope guard and receipt validation behaved correctly throughout.

## 12. Audit independence statement

No VICT repository change; no VICT-Cognee implementation change; no Quellight implementation change; no test was weakened or rewritten; no bypass flag used anywhere; no merge to `main`; no publication; the audit branch adds only evidence, this report, and permitted bookkeeping. All verification artifacts were produced by this verifier from fresh builds/clones in disposable workspaces.

## 13. Exact verdict

**VERIFIED — G0 PASS, FORMAL CLOSURE PERMITTED.**

The previously blocked dependency edge is genuinely removed: the exact remediation candidate `78e6c0ab3f86c571878675d4a947c934768c5ec7` builds a clean tarball that installs flaglessly against `@victframework/* 0.4.0-rc.1`, passes the unmodified 12-check compatibility battery (12/12), type-checks clean without casts (with a demonstrated sensitivity control), and completes a bounded real-worker add→cognify→search path — with zero semantic/safety regression against the C7 baseline artifact.