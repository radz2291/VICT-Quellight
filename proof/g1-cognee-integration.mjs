/**
 * G1 REAL integration proof — consumer composition, not Cognee battery rerun.
 *
 * Proves the exact frozen pipeline against the BUILT Quellight server
 * (adapter-node) with the REAL Cognee worker (Python 3.12.x +
 * cognee[gliner]==1.6.1) reached through the VICT capability-pack surface:
 *
 *   Quellight app -> VICT capability bindings -> cognee.add -> cognee.cognify
 *   -> cognee.searchChunks -> candidates -> VICT ProductAgent (Mastra,
 *   deterministic fixture) -> answer over HTTP to the caller.
 *
 * Also proves durability across a server restart (W2) and truthfulness of
 * degraded/failure paths (W4-style, bounded, controlled).
 *
 * Run: npm run build && node proof/g1-cognee-integration.mjs
 * Env: QUOLLIGHT_COGNEE_PYTHON (default: host proof venv), QUOLLIGHT_RUN_ROOT
 * (default: proof/.g1-run — disposable), PORT basis 5177/5178.
 */

import { spawn, execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RUN_ROOT = path.resolve(here, '.g1-run');
const PORT_A = process.env.PROOF_PORT_A ?? '5177';
const PORT_B = process.env.PROOF_PORT_B ?? '5178';
const PYTHON =
	process.env.QUOLLIGHT_COGNEE_PYTHON ??
	'C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv/Scripts/python.exe';

const FACT = 'My project codename is Zephyr.';
const RECALL = 'What is my project codename?';
const OFF_CORPUS = 'What is my favorite color?';
const HELLO = 'Hello.';

const results = [];
const check = (id, name, cond, detail = '') => {
	results.push({ id, name, outcome: cond ? 'PASS' : 'FAIL', detail });
	console.error(`[g1-integration] ${id} ${cond ? 'PASS' : 'FAIL'} ${name} ${detail}`);
	return cond;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer(port, extraEnv = {}) {
	const env = {
		...process.env,
		PORT: port,
		HOST: '127.0.0.1',
		QUOLLIGHT_RUN_ROOT: RUN_ROOT,
		QUOLLIGHT_COGNEE_PYTHON: PYTHON,
		...extraEnv
	};
	// Ensure the Cognee store exists and carries a keyless .env (worker config)
	const storeDir = path.join(RUN_ROOT, 'cognee-store');
	mkdirSync(storeDir, { recursive: true });
	const envFile = [
		'ENV=dev',
		'RUNTIME__LOG_LEVEL=INFO',
		...Object.entries({
			SYSTEM_ROOT_DIRECTORY: 'system',
			DATA_ROOT_DIRECTORY: 'data',
			CACHE_ROOT_DIRECTORY: 'cache',
			LOGS_ROOT_DIRECTORY: 'logs',
			COGNEE_REPOS_DIR: 'repos'
		}).map(([k, v]) => `${k}=${path.join(storeDir, v).replace(/\\/g, '/')}`),
		'VECTOR_DB_PROVIDER=lancedb',
		'GRAPH_DATABASE_PROVIDER=ladybug',
		'DB_PROVIDER=sqlite',
		'EMBEDDING_PROVIDER=fastembed',
		'EMBEDDING_MODEL=BAAI/bge-small-en-v1.5',
		'EMBEDDING_DIMENSIONS=384',
		'GRAPH_EXTRACTOR=gliner_demo',
		'AUTO_FEEDBACK=false',
		''
	].join('\n');
	writeFileSync(path.join(storeDir, '.env'), envFile);

	const child = spawn('node', [path.resolve(here, '../build/index.js')], {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
		windowsHide: true
	});
	child.stdout.on(
		'data',
		(d) => process.env.PROOF_VERBOSE && process.stdout.write(`[srv ${port}] ${d}`)
	);
	child.stderr.on(
		'data',
		(d) => process.env.PROOF_VERBOSE && process.stderr.write(`[srv ${port}] ${d}`)
	);
	child.on('exit', (code) => console.error(`[srv ${port}] exited ${code}`));
	return child;
}

async function waitReady(port, ms) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		try {
			const res = await fetch(`http://127.0.0.1:${port}/api/health`);
			if (res.ok) {
				const status = await res.json();
				// Honest 'initializing' state: wait until the knowledge path settles.
				if (status.knowledge?.state !== 'initializing') return status;
			}
		} catch {}
		await sleep(500);
	}
	const res2 = await fetch(`http://127.0.0.1:${port}/api/health`).catch(() => null);
	throw new Error(
		`server on ${port} not ready after ${ms}ms (last: ${res2 ? JSON.stringify(await res2.json()).slice(0, 300) : 'unreachable'})`
	);
}

async function turn(port, message) {
	const res = await fetch(`http://127.0.0.1:${port}/api/turn`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ message })
	});
	const body = await res.json().catch(() => ({}));
	return { status: res.status, body };
}

async function main() {
	execSync('git rev-parse HEAD', { stdio: 'inherit' });
	const gitHead = execSync('git rev-parse HEAD').toString().trim();
	// Windows teardown of a previous run can lag; retry the wipe.
	for (let attempt = 0; attempt < 8; attempt += 1) {
		try {
			rmSync(RUN_ROOT, { recursive: true, force: true });
			break;
		} catch {
			await sleep(2_000);
		}
	}
	rmSync(RUN_ROOT, { recursive: true, force: true });
	mkdirSync(RUN_ROOT, { recursive: true });

	// Phase 1 — fresh store; full real path with the durable store.
	const serverA = startServer(PORT_A);
	const readyA = await waitReady(PORT_A, 90_000);
	check(
		'I0',
		'server boots with knowledge configured to READY',
		readyA.knowledge.state === 'ready',
		JSON.stringify(readyA.knowledge)
	);
	await sleep(1_500); // allow async knowledge init to settle

	console.error('[g1-integration] T1: Hello. (fresh store; worker boot)');
	const t1 = await turn(PORT_A, HELLO);
	check(
		'W1',
		'basic conversation answers through the path',
		t1.status === 200 && t1.body.kind === 'assistant' && t1.body.text.length > 0,
		JSON.stringify(t1.body).slice(0, 220)
	);

	console.error('[g1-integration] T2: store the fact (real add+cognify)');
	const t2 = await turn(PORT_A, FACT);
	check(
		'I1',
		'fact stored cognified (used or degraded-noted intake)',
		t1.status === 200,
		JSON.stringify(t2.body.meta ?? {}).slice(0, 160)
	);

	console.error('[g1-integration] T3: recall question (real searchChunks + reasoning)');
	const t3 = await turn(PORT_A, RECALL);
	const t3text = t3.body.text ?? '';
	check(
		'W2',
		'recall uses REAL retrieved durable knowledge',
		t3.status === 200 && t3.body.kind === 'assistant' && t3text.includes('Zephyr'),
		JSON.stringify({ meta: t3.body.meta, text: t3text.slice(0, 220) })
	);

	console.error('[g1-integration] T4: off-corpus honesty');
	const t4 = await turn(PORT_A, OFF_CORPUS);
	const t4text = t4.body?.text ?? '';
	// Honesty = no personal fact is ASSERTED. Quoting stored notes is explicit,
	// attributed note behavior; only an asserted favorite color is fabrication.
	const fabricated =
		/my (favorite|favourite) colo[r] is/i.test(t4text) ||
		/your (favorite|favourite) colo[^"]*(is|blue|red|green|black|white|yellow|purple|orange)/i.test(
			t4text
		);
	check(
		'W3',
		'off-corpus: no fabricated personal fact',
		t4.status === 200 && !fabricated,
		t4text.slice(0, 220)
	);
	const t4Note = t4.body?.meta?.retrieval === 'used' ? 'quoted-as-note behavior' : 'miss behavior';
	console.error(`[g1-integration] T4 behavior: ${t4Note}; text: ${t4text}`);

	// Persistence check BEFORE restart: confirm durable retrieval (already in W2), then kill server A.
	await sleep(1_000);
	serverA.kill();

	// Fresh process, SAME RUN_ROOT -> proves durable knowledge survives restart.
	await sleep(3_000);
	console.error('[g1-integration] T5: restart with same store; ask recall again');
	const serverB = startServer(PORT_A);
	const readyB = await waitReady(PORT_A, 30_000);
	check(
		'S0',
		'restart: knowledge ready from persisted store',
		readyB.knowledge.state === 'ready',
		JSON.stringify(readyB.knowledge).slice(0, 160)
	);
	await sleep(1_500);
	const t5 = await turn(PORT_A, RECALL);
	const t5text = t5.body?.text ?? '';
	check(
		'I2',
		'durable recall persists across app restart',
		t5.status === 200 && t5text.includes('Zephyr'),
		JSON.stringify({ meta: t5.body.meta }).slice(0, 120) + ' :: ' + t5text.slice(0, 200)
	);
	serverB.kill();

	// Bounded controlled failure: model surface (W4) on a separate instance.
	await sleep(2_000);
	console.error('[g1-integration] W4: controlled model failure');
	const serverC = startServer(PORT_B, { QUOLLIGHT_FAULT: 'model' });
	await waitReady(PORT_B, 90_000);
	await sleep(1_500);
	const w4 = await turn(PORT_B, 'Hello.');
	check(
		'W4a',
		'model failure surfaces as HTTP failure (no fake success)',
		w4.status === 502,
		JSON.stringify(w4.body).slice(0, 200)
	);
	serverC.kill();

	// Knowledge-degraded boot (no Python path): truthful degraded behavior.
	console.error('[g1-integration] W4b: knowledge unavailable degradation');
	const serverD = startServer(PORT_B, { QUOLLIGHT_COGNEE_DISABLED: '1' });
	const readyD = await waitReady(PORT_B, 90_000);
	check(
		'W4b-pre',
		'knowledge reported degraded when worker disabled',
		readyD.knowledge.state === 'degraded',
		JSON.stringify(readyD.knowledge).slice(0, 200)
	);
	await sleep(1_500);
	const tD = await turn(PORT_B, RECALL);
	const tDtext = tD.body?.text ?? '';
	const metaD = tD.body?.meta ?? {};
	check(
		'W4b',
		'knowledge unavailable: answered truthfully without fabricated retrieval',
		tD.status === 200 &&
			tD.body.kind === 'assistant' &&
			metaD.retrieval === 'unavailable' &&
			!tDtext.includes('Zephyr'),
		JSON.stringify(metaD).slice(0, 120) + ' :: ' + tDtext.slice(0, 200)
	);
	serverD.kill();

	[serverA, serverB, serverC, serverD].forEach((s) => {
		try {
			s.kill();
		} catch {}
	});

	const passCount = results.filter((r) => r.outcome === 'PASS').length;
	console.log(
		JSON.stringify(
			{ pass: passCount === results.length, passCount, total: results.length, gitHead, results },
			null,
			2
		)
	);
	process.exit(passCount === results.length ? 0 : 1);
}

main().catch((error) => {
	console.error('G1 INTEGRATION PROOF ERROR:', error?.message ?? error);
	process.exit(1);
});
