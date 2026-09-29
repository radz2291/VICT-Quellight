/**
 * G0 WP-C — Runtime-level compatibility diagnostic (NOT a bypass of npm
 * peer enforcement). The npm install route is REFUSED (ERESOLVE) and is
 * recorded as the failing boundary. This diagnostic imports the UNMODIFIED
 * tarball dist by path beside @victframework/* 0.4.0-rc.1 to answer exactly
 * one question for remediation scoping: does the pack's manifest/binding
 * surface still install into the CURRENT VICT runtime line's pack ABI?
 *
 * Expected: installCapabilityPack cross-validates the manifest against the
 * bindings and the declared victCompatibility ('^0.1.0') against
 * VICT_RUNTIME_COMPAT_VERSION; all six capabilities install.
 */

import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createRuntime, installCapabilityPack } from '@victframework/runtime';
// Direct by-path import of the UNMODIFIED tarball dist (diagnostic only:
// this is NOT an npm dependency-resolution route and claims nothing about
// npm peers).
import { createCogneePack } from './extracted-cognee/dist/index.js';

const storeRoot = path.resolve('.diag-store');
rmSync(storeRoot, { recursive: true, force: true });
mkdirSync(storeRoot, { recursive: true });

const pack = createCogneePack({
	pythonPath: process.env.PILOT_PYTHON,
	cwd: storeRoot,
	storeRoot,
	namespaces: ['diag']
});
const runtime = createRuntime({
	stores: (await import('@victframework/runtime')).createInMemoryStores(),
	authority: { grants: ['cognee.write', 'cognee.search'] }
});
let installed;
try {
	installed = installCapabilityPack(runtime, pack).installed;
} catch (error) {
	console.log(
		JSON.stringify(
			{ diagnostic: 'installCapabilityPack', ok: false, error: String(error?.message ?? error) },
			null,
			2
		)
	);
	process.exit(1);
}
console.log(
	JSON.stringify(
		{
			diagnostic: 'installCapabilityPack against VICT 0.4.0-rc.1',
			ok: installed.length === 6,
			installed,
			manifest: {
				schema: pack.manifest.schema,
				id: pack.manifest.id,
				version: pack.manifest.version,
				victCompatibility: pack.manifest.victCompatibility
			}
		},
		null,
		2
	)
);
process.exit(installed.length === 6 ? 0 : 1);
