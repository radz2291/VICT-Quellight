# G0 Report — Repository and Dependency Intake

**Status:** COMPLETE — verdict recorded in `docs/STATE.md`
**Branch:** `g0/dependency-intake`
**Starting SHA (`main`):** `3248ceb8d1c2af74e8750cf3fcee5e3d331f601e` (verified == `origin/main` before any edit)
**Verdict:** **BLOCKED — UPSTREAM REMEDIATION REQUIRED** (bounded, packaging-only; in `radz2291/VICT-Cognee`) — see §13.

---

## 1. Recovery anchor

- Product repository: `radz2291/VICT-Quellight` (`https://github.com/radz2291/VICT-Quellight`)
- Local clone: fresh clone (working directory existed but was empty at start) at `C:/Users/RZ1/Desktop/RZ/260929-VCT-Quellight`
- Verified: remote URL, clean clone, local `main` == `origin/main` == `3248ceb8d1c2af74e8750cf3fcee5e3d331f601e` (materially exact; a fresh verifier can reproduce with `git rev-parse origin/main`)
- All ten bootstrap documents read in the mandated order before implementation.
- Work branch created from `main` at the recovery SHA: `g0/dependency-intake`.

## 2. Exact starting SHA

`3248ceb8d1c2af74e8750cf3fcee5e3d331f601e` — "docs: finalize bootstrap and authorize G0" (commit message abbreviated). No prior Quellight application code existed; the branch adds only G0 intake files.

## 3. VICT SHA/version inventory (Work Package A)

Verified read-only via `git ls-remote` + a clean pre-existing clone refreshed to `origin/main`:

| Item | Value | Changed since bootstrap? |
| --- | --- | --- |
| VICT repo | `https://github.com/radz2291/vict-02` | — |
| VICT `main` SHA | `fd675d9083a32f282820d9e0135c191d691c943c` | No |
| `@victframework/sdk` | `0.4.0-rc.1` (npm; `latest` dist-tag still `0.3.1`; `0.4.0-rc.1` tagged `vict-0.4.0-rc`) | No |
| `@victframework/runtime` | `0.4.0-rc.1` | No |
| `@victframework/mastra` | `0.4.0-rc.1` (npm tarball `mastra-0.4.0-rc.1.tgz`) | No |
| `@victframework/contracts` / `kernel` / `control` | `0.4.0-rc.1` | No |
| Node requirement | `>=22.13.0` (all VICT packages) | No |
| License | Apache-2.0 (all VICT packages) | No |
| Install route | npm registry (public) | No |

Version-line diff facts established by comparing published npm tarballs (`sdk`, `runtime`, `contracts`, `kernel`, `control`), 0.3.1 vs 0.4.0-rc.1:

- `@victframework/runtime` **dist is byte-identical** between the lines (only version/dependency pins differ in `package.json`).
- `@victframework/kernel` and `control` dists: byte-identical between the lines.
- `@victframework/sdk`: pack ABI (`pack.d.ts` incl. `EffectClass`) byte-identical; changes are application/UI surface only.
- `@victframework/contracts`: `dist/zod` changed only.
- `installCapabilityPack` semantics and `VICT_RUNTIME_COMPAT_VERSION = "0.1.0"` unchanged (manifest `victCompatibility: '^0.1.0'` remains valid).

Mastra adapter facts: adapter id `@victframework/mastra`, compatibility revision `3`, pinned Mastra packages `@mastra/core 1.64.0`, `@mastra/libsql 1.22.3`, `@mastra/memory 1.28.2`, `@mastra/observability 1.17.5`; deterministic offline fixture `offline-fixture/deterministic-1` (no provider credential required).

## 4. VICT-Cognee SHA/version inventory (Work Package A)

| Item | Value | Changed since bootstrap? |
| --- | --- | --- |
| Repo | `https://github.com/radz2291/VICT-Cognee` | — |
| `main` SHA (verified live via `git ls-remote`) | `2c180efbc564c4a4a3f22556858f108e2fa23bc0` | No |
| Package | `@victframework/cognee@0.1.0` (`private: true`; `pack/` in source tree) | No |
| Publication | NOT on npm (registry 404); tarball-only private route; `npm pack` refuses to publish a private package | No |
| npm peers | `@victframework/sdk ^0.3.1`, `@victframework/runtime ^0.3.1` (both `peerOptional`) | No |
| Manifest ABI | `vict.capability-pack@1`, `victCompatibility ^0.1.0` — unchanged between VICT lines | No |
| Node requirement | `>=22` | No |
| Python requirement | 3.12.x with `cognee[gliner]==1.6.1` (tested here: Python 3.12.10, venv `C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv`, `import cognee` OK) | No |
| License | `UNLICENSED` (private candidate; NOT a distribution license decision — no adoption into Quellight is made by G0) | No |
| Resource constraints (documented, not re-measured here) | ~2.0 GB peak during cognify; second concurrent worker needs commit headroom (~3–4 GB free observed failures); ≥1 GB disk per active dataset; one-time model downloads on a fresh host (both fastembed `bge-small-en-v1.5` and GLiNER model caches are warmed on this host) | — |

## 5. Mastra proof (Work Package B) — PASS

`proof/mastra-offline-proof.mjs` proves, from the fresh consumer (this repository, `npm install` from the registry at exact pins, no flags):

```text
consumer -> @victframework/sdk (AGENT_PROFILE_SCHEMA)
         -> @victframework/runtime (AgentProfileRegistry, protectCredentialPort)
         -> @victframework/mastra (MastraProductAgent — the neutral ProductAgentPort implementation)
         -> createDeterministicOfflineModel (no provider credential)
```

Results (exit 0; `proof/mastra-evidence/mastra-proof.json`):

- Adapter compatibility self-check (`verifyMastraAdapterCompatibility`): `ok: true`, revision `3`.
- Turn 1: `completed`, text `G0-MASTRA-SENTINEL-OK`, `providerModelIdentity offline-fixture/deterministic-1`.
- Turn 2 (repeat): identical text — deterministic.
- Negative control: off-script input fails closed (`failed`, stable `errorCode`, no fabricated text).
- No provider credential used; the credential port returned a canary that does **not** appear in the durable store (verified by grep).

Pins: `@victframework/mastra@0.4.0-rc.1`, `@victframework/runtime@0.4.0-rc.1`, `@victframework/sdk@0.4.0-rc.1` — all from the npm registry (recorded in `package.json` + `package-lock.json`).

## 6. Cognee compatibility proof (Work Package C) — REFUSED AT THE npm ROUTE; RUNTIME-COMPATIBLE

### 6.1 Failing boundary (recorded; NOT bypassed)

Fresh tarball built from a clean clone at `2c180efb...` (`cd pack && npm install && npm run build && npm pack`). Consumer `package.json` with the tarball + `@victframework/{contracts,kernel,runtime,sdk}@0.4.0-rc.1` + `zod ^3.25.0`, plain `npm install --no-audit --no-fund`:

```text
npm error code ERESOLVE
npm error While resolving: @victframework/cognee@0.1.0
npm error peerOptional @victframework/runtime@"^0.3.1" from @victframework/cognee@0.1.0
npm error Found: @victframework/runtime@0.4.0-rc.1
```

Exit: non-zero. Full report: `proof/cognee-compat/evidence/eresolve-npm-install-failure.txt`. No `--force`, no `--legacy-peer-deps`, no manifest tampering, no vendoring.

### 6.2 Runtime-level diagnostic battery (remediation scoping — NOT a compatibility claim, NOT an install route)

`proof/cognee-compat/scripts/battery.mjs` imports the **unmodified** built tarball by path beside the normally-installed `0.4.0-rc.1` packages and mirrors VICT-Cognee's own `pack/verify/verify.ts` pure-Node invariants against the current VICT line:

`V0,V1,V2,V2b,V3,V4,V5b,V9a,V9b,V9d,V10a,V10b` — **12/12 PASS, exit 0** (`proof/cognee-compat/evidence/cognee-battery-0.4.0-rc.1.json`).

Real-worker runs (V5/V6/V7 store-touching parts) were deliberately excluded: the Python/cognee worker layer is downstream of VICT and version-independent; the open question was the VICT-facing Node boundary.

### 6.3 Type-level parity probe

`tsc` assignability of the pack to `CapabilityPack` fails identically (`effect: string` vs `EffectClass` union) against BOTH `sdk@0.3.1` and `sdk@0.4.0-rc.1` — pre-existing friction (VICT-Cognee's own verify used `as never` casts), not a new rc-line incompatibility.

## 7. Commands and exit codes

| # | Command (abbreviated; see `proof/cognee-compat/README.md` for full shell history) | Exit |
| --- | --- | --- |
| 1 | `git clone … VICT-Quellight && git rev-parse origin/main` → `3248ceb8…` | 0 |
| 2 | `git fetch origin` in local VICT/VICT-Cognee clones + `git ls-remote` against both remotes | 0 (no drift) |
| 3 | `cd Quellight && npm install --no-audit --no-fund` | 0 (1 non-blocking `posthog-node` engine warning, §8) |
| 4 | `node proof/mastra-offline-proof.mjs` | **0 (PASS)** |
| 5 | VICT-Cognee clean clone → `pack && npm install && npm run build && npm pack` | 0 (`victframework-cognee-0.1.0.tgz`, 46,732 bytes) |
| 6 | consumer `npm install --no-audit --no-fund` (cognee tarball + VICT rc.1) | **ERESOLVE (non-zero)** — recorded, not bypassed |
| 7 | `node battery.mjs` (diag workspace, unmodified tarball by path) | **0 (12/12 PASS)** |
| 8 | `tsc typecheck.ts` vs `0.4.0-rc.1` and vs `0.3.1` | identical TS2322 both lines (pre-existing friction) |

## 8. Environment / runtime versions

- Node `v22.13.1`, npm `11.19.1` (Windows 11 x64) — meets all VICT `engines` (`>=22.13.0`).
- **Finding (non-blocking):** `posthog-node@5.54.1` (transitive via `@mastra/*`) declares `node ^20.20.0 || >=22.22.0` — EBADENGINE warning under 22.13.1 (telemetry sink; no install failure, no functional impact in G0). Recommend recording a runtime-Node preference (e.g. ≥22.22 where feasible) for G1+ hosts.
- Python 3.12.10 present; existing venv with `cognee[gliner]==1.6.1` importable (`C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv`).
- Model caches warmed on this host: `~/.cache/huggingface` (BAAI/bge-small-en-v1.5 + fastino/gliner2.5-base-v1), ≈748 MB.

## 9. Dependency / license notes

- VICT packages: Apache-2.0. Mastra-related: `@mastra/*` Apache-2.0; `@libsql/client`/`libsql` MIT; `posthog-node` MIT. `zod ^3.25` MIT.
- `@victframework/cognee@0.1.0`: `UNLICENSED`, private, unpublished. It was consumed in this G0 **only** as a disposable diagnostic proof; nothing from it is a Quellight dependency and its code was not vendored or copied.
- No secrets committed: the diagnostic store `.env` is keyless (`EMBEDDING_PROVIDER=fastembed`, `GRAPH_EXTRACTOR=gliner_demo`, no LLM key); no credential canary persisted (verified by grep of the mastra store).
- No new heavyweight dependencies beyond the three pinned VICT packages; all are the intended stack.

## 10. Negative-control results

| Control | Result |
| --- | --- |
| No old Quellight code imported | PASS — repository began at a docs-only commit; branch tree contains only this branch's new G0 files (`git log`/`git ls-files` auditable) |
| No custom semantic foundation / no `@vict/intelligence` | PASS — diff contains only intake scaffold, proof scripts, evidence, docs |
| No direct product dependency on Mastra internals at the product level | PASS — `package.json` deps are the three VICT packages; Mastra APIs appear only inside the G0 proof script |
| No direct product dependency on Cognee internals | PASS — the cognee tarball exists only in external disposable workspaces; nothing vendored into Quellight |
| No custom embeddings / vector search / graph DB / entity resolution / another agent framework | PASS — verified by inspection of the entire diff |
| Incompatible package versions not force-installed | PASS — the one ERESOLVE failure was recorded and left in place |
| Cognee retrieval ≠ canonical truth | PASS (invariant honored) — no retrieval result is consumed anywhere in this repository; only battery receipts (doubles/denials) were exercised; the pack's own fail-closed/double semantics preserved as shipped |
| Model output ≠ accepted durable user state | PASS — offline fixture output asserted as proof only; no product state written |
| Capability ≠ authority | PASS — battery V4 proved permission pre-check before handler |
| No secrets in source/evidence | PASS — keyless everywhere; grep-clean |
| No production deployment / publication / irreversible actions | PASS — none performed; `vict-02` and `VICT-Cognee` remain unmodified (working trees verified clean) |

## 11. Files created/changed on this branch

```text
.gitignore
package.json                     (pins: @victframework/{mastra,runtime,sdk} 0.4.0-rc.1)
package-lock.json                (reproducible install lockfile)
tsconfig.json                    (minimal; strict, noEmit)
proof/mastra-offline-proof.mjs   (WP B proof, runnable: npm run proof:mastra)
proof/mastra-evidence/mastra-proof.json + mastra-proof.stderr.txt
proof/cognee-compat/README.md    (exact reproduction commands + interpretation)
proof/cognee-compat/scripts/battery.mjs      (12-check Node-boundary battery)
proof/cognee-compat/scripts/install-diag.mjs (installCapabilityPack diagnostic)
proof/cognee-compat/evidence/eresolve-npm-install-failure.txt
proof/cognee-compat/evidence/cognee-battery-0.4.0-rc.1.json
proof/cognee-compat/evidence/cognee-battery-0.4.0-rc.1.stderr.txt
proof/cognee-compat/evidence/typecheck-probe.ts.txt
docs/reports/G0-DEPENDENCY-INTAKE.md   (this report)
docs/STATE.md                    (gate table + facts updated)
node_modules/ (ignored), .g0-run/ (proof store; ignored)
```

## 12. Unresolved findings

1. **npm peer-range refusal (blocking for G0 closure of the Cognee arm)** — §6.1. Smallest remediation: in `radz2291/VICT-Cognee`, `pack/package.json`: widen `peerDependencies` to admit the rc line (e.g. `"^0.3.1 || ^0.4.0-rc.1"`), optionally tighten manifest typing with `satisfies PackCapabilityDeclaration[]` (removes the pre-existing `effect: string` widening), then re-run its own `pack/verify/verify.ts` battery against `0.4.0-rc.1` plus one real-worker smoke. Affected contract: npm manifest only; **no runtime/API change is expected** — the Node-boundary battery already passes against the current line with the unmodified artifact.
2. `posthog-node` engine-warning — host/runtime note only.
3. Open owner decisions unchanged: QD-01, QD-02, QD-03 (remediation session location), QD-04.

## 13. Exact G0 verdict

**BLOCKED — UPSTREAM REMEDIATION REQUIRED** (G0 Work Package C Outcome B).

- The unmodified `@victframework/cognee@0.1.0` **cannot be legitimately installed** against the current VICT line: npm strict peer resolution refuses `peerOptional ^0.3.1` vs `0.4.0-rc.1`. A legitimate supported route does not exist today.
- All evidence indicates the remediation is **packaging-only and bounded** (peer declaration + type hygiene in one existing package manifest), because the runtime install surface, manifest ABI, and Node-boundary behavior are identical/fully compatible with `0.4.0-rc.1` (§3, §6.2–6.3).
- The VICT/Mastra arm is proven (§5). No bypasses were used anywhere; no VICT or VICT-Cognee file was modified.

**Remediation of this result belongs to `radz2291/VICT-Cognee` under its own handoff/governance (owner decision QD-03 already records this fork). This repository is not modified by remediation.** After remediation, re-run the G0 Cognee proof commands above (tarball rebuild install without flags + battery) — a PASS there lifts the block.