# G0 Work Package C — Cognee compatibility evidence workspace

This directory holds the G0 compatibility proof artifacts for
`@victframework/cognee@0.1.0` (private tarball candidate) against the current
VICT line (`@victframework/* 0.4.0-rc.1` from the npm registry).

Everything here is **G0 evidence only** — not product code, and not a Quellight
dependency. The disposable consumer/diagnostic workspaces live outside this
repository (see the exact commands below); only captured outputs and the probe
scripts are committed.

## Exact reproduction (all shells from `/tmp/g0-cognee`, Node 22.13.1, npm 11.19.1)

```bash
# 1. Build the UNMODIFIED package tarball from a fresh clone at the recorded SHA.
git clone --branch main https://github.com/radz2291/VICT-Cognee.git   # -> 2c180efbc564c4a4a3f22556858f108e2fa23bc0
cd VICT-Cognee/pack && npm install --no-audit --no-fund && npm run build
npm pack --pack-destination ..        # -> victframework-cognee-0.1.0.tgz

# 2. Failing boundary (recorded, NOT worked around): plain install, VICT
#    current line + cognee tarball. NO --force, NO --legacy-peer-deps.
mkdir -p consumer/vendor && cp ../victframework-cognee-0.1.0.tgz consumer/vendor/
# consumer/package.json deps:
#   @victframework/cognee file:vendor/victframework-cognee-0.1.0.tgz
#   @victframework/{contracts,kernel,runtime,sdk} 0.4.0-rc.1, zod ^3.25.0
cd consumer && npm install --no-audit --no-fund
# RESULT: code ERESOLVE — peerOptional @victframework/runtime@"^0.3.1" from
# @victframework/cognee@0.1.0 conflicts with @victframework/runtime@0.4.0-rc.1.

# 3. Runtime-level diagnostic battery (NOT a bypass; see eREADME header).
#    Imports the UNMODIFIED tarball dist by path beside @victframework/* 0.4.0-rc.1
#    installed normally; mirrors VICT-Cognee's own pure-Node verify battery.
tar -xzf ../victframework-cognee-0.1.0.tgz -C . && mv package extracted-cognee
node battery.mjs          # ../../proof/... battery script — 12/12 PASS, exit 0

# 4. Type-level assignability probe (current line and 0.3.1 parity).
tsc typecheck.ts          # identical error against BOTH sdk lines (pre-existing)
```

## Files

| File | Contents |
| --- | --- |
| `eresolve-npm-install-failure.txt` | Full npm ERESOLVE report (the failing install boundary). |
| `cognee-battery-0.4.0-rc.1.json` | 12-check Node-boundary battery results (PASS, exit 0). |
| `cognee-battery-0.4.0-rc.1.stderr.log` | stderr of the battery (check ledger). |
| `typecheck-probe.ts.txt` | The type-level assignability probe (renamed to .ts.txt). |

## Battery coverage (mirrors VICT-Cognee `pack/verify/verify.ts` V0–V10, workerless)

`V0` manifest validation via current `validateCapabilityPack` — PASS;
`V1` atomic install 6/6 into current runtime — PASS;
`V2`/`V2b` test-mode doubles with zero worker spawns — PASS;
`V3` read fail-closed without a double — PASS;
`V4` permission pre-check before handler — PASS;
`V5b` unkeyed sequential write refused in normal mode (in-process) — PASS;
`V9a/V9b/V9d` durable graphs never reach the real worker in test/simulate (store unchanged) — PASS;
`V10a/V10b` deadline refusal before any worker request — PASS.

Skipped by design: real-worker runs (V5/V6/V7 store-touching parts) — the
Python/cognee worker layer is downstream of VICT and independent of the VICT
version; the G0 question was the VICT-facing Node boundary.

## Interpretation

- The **only hard incompatibility** is the npm peer declaration
  (`^0.3.1`) in the unmodified package manifest, which npm enforces even for
  `peerOptional` entries when the peer is present-but-out-of-range.
- Runtime behavior against VICT 0.4.0-rc.1: fully compatible at the Node
  boundary (runtime dist is byte-identical between 0.3.1 and 0.4.0-rc.1).
- The TypeScript `effect: string` vs `EffectClass` widening friction is
  **pre-existing** (identical against sdk 0.3.1); VICT-Cognee's own verify used
  `as never` casts. It should be fixed in the same bounded remediation.