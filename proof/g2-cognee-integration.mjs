/**
 * G2 REAL integration proof — the central durable-meaning sequence.
 *
 * Proves against the BUILT Quellight server (adapter-node) with the REAL
 * Cognee worker (Python 3.12.x + cognee[gliner]==1.6.1) reached through the
 * VICT capability-pack surface:
 *
 *   "Remember: project.codename = Zephyr"
 *     -> canonical appdata record -> Cognee projection -> retrieval
 *     -> canonical eligibility filter -> model answers Zephyr
 *   "Remember: project.codename = Orion now"
 *     -> new canonical record supersedes Zephyr -> projection
 *     -> Cognee may contain BOTH -> filter removes Zephyr
 *     -> model receives Orion only
 *
 * Also proves restart durability (real on-disk appdata SQLite), honest
 * degraded paths, and the no-cognify ordinary-turn improvement (with
 * measured latencies recorded in the G2 report).
 *
 * Run: npm run build && node proof/g2-cognee-integration.mjs
 * Env: QUOLLIGHT_COGNEE_PYTHON (default: host proof venv), QUOLLIGHT_RUN_ROOT
 * (default: proof/.g2-run — disposable), PORT basis 5175/5176.
 */

import { spawn, execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RUN_ROOT = path.resolve(here, '.g2-run');
const PORT_A = process.env.PROOF_PORT_A ?? '5175';
const PORT_B = process.env.PROOF_PORT_B ?? '5176';
const PYTHON =
	process.env.QUOLLIGHT_COGNEE_PYTHON ??
	'C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv/Scripts/python.exe';

const REMEMBER_ZEPHYR = 'Remember that the project codename is Zephyr.';
const REMEMBER_ORION = 'Remember that the project codename is Orion now.';
const RECALL_BASE = 'What is my project codename?';
const RECALL_AFTER = 'Remind me one more time: what is my project codename?';
const PREFER = 'I prefer dark interfaces.';
const PREFER_RECALL = 'What interface style do I favor?';
const HELLO = 'Hello.';

const results = [];
const check = (id, name, cond, detail = '') => {
	results.push({ id, name, outcome: cond ? 'PASS' : 'FAIL', detail });
	console.error(`[g2-integration] ${id} ${cond ? 'PASS' : 'FAIL'} ${name} ${detail}`);
	return cond;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function killTree(child) {
	const pid = child.pid;
	if (!pid) return;
	try {
		child.kill();
	} catch {}
	try {
		execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
	} catch {}
}

async function waitStoreFree(ms = 20_000) {
	// Only COUNT COGNEE WORKERS: other python processes on this host (e.g.
	// tooling http servers) are unrelated and must not block the proof.
	const query =
		"powershell -NoProfile -Command \"(Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" -ErrorAction SilentlyContinue | Where-Object { ($_.CommandLine ?? '') -match 'cognee' }) | Measure-Object | Select-Object -ExpandProperty Count\"";
	const end = Date.now() + ms;
	while (Date.now() < end) {
		try {
			const out = execSync(query, { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
				.toString()
				.trim();
			if (out === '0') return true;
			console.error(`[harness] ${out} cognee worker(s) still running...`);
		} catch {
			return true;
		}
		await sleep(1000);
	}
	return false;
}

async function releaseStaleOwnerLock(storeRoot, ms = 20_000) {
	const pythonFree = await waitStoreFree(ms);
	if (!pythonFree) {
		throw new Error('python workers still alive; refusing to release store-owner lock');
	}
	const lock = path.join(storeRoot, 'cognee-store-owner.lock');
	try {
		rmSync(lock, { force: true });
		console.error('[g2-integration] released stale owner lock after verified stop');
	} catch {
		// lock absent already
	}
}

function startServer(port, extraEnv = {}) {
	const env = {
		...process.env,
		PORT: port,
		HOST: '127.0.0.1',
		QUOLLIGHT_RUN_ROOT: RUN_ROOT,
		QUOLLIGHT_COGNEE_PYTHON: PYTHON,
		QUOLLIGHT_MAINTENANCE_SHUTDOWN: '1',
		...extraEnv
	};
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
		stdio: ['ignore', 'inherit', 'inherit'],
		windowsHide: true
	});
	child.on('exit', (code, signal) =>
		console.error(`[srv ${port}] exited code=${code} signal=${signal ?? '-'}`)
	);
	return child;
}

async function waitReady(port, ms) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		try {
			const res = await fetch(`http://127.0.0.1:${port}/api/health`);
			if (res.ok) {
				const status = await res.json();
				if (status.knowledge?.state !== 'initializing') return status;
			}
		} catch {}
		await sleep(500);
	}
	throw new Error(`server on ${port} not ready after ${ms}ms`);
}

async function stopServer(server, port) {
	try {
		const res = await fetch(`http://127.0.0.1:${port}/api/shutdown`, { method: 'POST' });
		console.error(`[g2-integration] stop ${port}: shutdown endpoint status=${res.status}`);
		if (res.ok) {
			await sleep(2_000);
			return true;
		}
	} catch (e) {
		console.error(`[g2-integration] stop ${port}: shutdown fetch failed: ${e.message}`);
	}
	killTree(server);
	await waitStoreFree(25_000);
	await releaseStaleOwnerLock(path.join(RUN_ROOT, 'cognee-store'));
	return false;
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

async function meaning(port) {
	const res = await fetch(`http://127.0.0.1:${port}/api/meaning`);
	return { status: res.status, body: await res.json().catch(() => null) };
}

async function decide(port, recordId, decision) {
	const res = await fetch(`http://127.0.0.1:${port}/api/meaning/decision`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ recordId, decision })
	});
	return { status: res.status, body: await res.json().catch(() => null) };
}
/** Pre-flight: kill any leftover listener on the proof ports (orphan guard). */
function killPortListeners(port) {
	try {
		const out = execSync(
			'powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ' +
				port +
				' -State Listen -ErrorAction SilentlyContinue) | ForEach-Object { $_.OwningProcess }"',
			{ stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }
		)
			.toString()
			.split(/\r?\n/)
			.filter(Boolean);
		const pids = new Set(out.map((v) => v.trim()).filter((v) => /^\d+$/.test(v)));
		for (const pid of pids) {
			try {
				execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
				console.error(`[g2-integration] preflight killed orphan listener ${pid} on ${port}`);
			} catch {}
		}
	} catch {
		// port already free
	}
}

async function main() {
	execSync('git rev-parse HEAD', { stdio: 'inherit' });
	const gitHead = execSync('git rev-parse HEAD').toString().trim();
	killPortListeners(PORT_A);
	killPortListeners(PORT_B);
	for (let attempt = 0; attempt < 8; attempt += 1) {
		try {
			rmSync(RUN_ROOT, { recursive: true, force: true });
			break;
		} catch {
			await sleep(2_000);
		}
	}
	mkdirSync(RUN_ROOT, { recursive: true });

	// Phase 1 — fresh store: full real path.
	const serverA = startServer(PORT_A);
	const readyA = await waitReady(PORT_A, 120_000);
	check(
		'I0',
		'server boots with knowledge + meaning store READY',
		readyA.knowledge.state === 'ready' && readyA.meaning.state === 'ready',
		JSON.stringify(readyA.knowledge) + ' ' + JSON.stringify(readyA.meaning)
	);

	// B1 — ordinary conversation: no cognify (measured latency recorded in report)
	console.error('[g2-integration] T1 (B1): ordinary turn — no cognify expected');
	const t1Start = Date.now();
	const t1 = await turn(PORT_A, HELLO);
	check(
		'B1',
		'ordinary turn answers without durable write',
		t1.status === 200 && t1.body.kind === 'assistant' && t1.body.meta.durableWrite === false,
		JSON.stringify(t1.body.meta ?? {}).slice(0, 200)
	);
	console.error(
		`[g2-integration] B1 ordinary turn latency: ${Date.now() - t1Start}ms (turn 2 = warm)`
	);

	const m0 = await meaning(PORT_A);
	check(
		'B1b',
		'ordinary turn persisted NO meaning',
		m0.status === 200 && m0.body.current.length === 0 && m0.body.proposed.length === 0
	);

	// B2 — explicit durable meaning (real add+cognify; slow, honest)
	console.error(
		'[g2-integration] T2 (B2): Remember Zephyr (real projection: fresh worker + cognify)'
	);
	const t2Start = Date.now();
	const t2 = await turn(PORT_A, REMEMBER_ZEPHYR);
	check(
		'B2',
		'explicit durable meaning recorded + projected through real VICT bindings',
		t2.status === 200 &&
			t2.body.kind === 'assistant' &&
			t2.body.meta.durableWrite === true &&
			t2.body.meta.projectionDegraded === false,
		JSON.stringify(t2.body.meta ?? {}).slice(0, 200)
	);
	console.error(`[g2-integration] B2 durable write turn latency: ${Date.now() - t2Start}ms`);
	const m1 = await meaning(PORT_A);
	const zephyr = m1.body.current.find((r) => r.value === 'Zephyr');
	check(
		'B2c',
		'inspector shows accepted user_stated Zephyr with provenance',
		m1.status === 200 &&
			!!zephyr &&
			zephyr.origin === 'user_stated' &&
			zephyr.decisionState === 'accepted' &&
			typeof zephyr.sourceExcerpt === 'string' &&
			zephyr.sourceExcerpt.length > 0
	);

	// B3 — recall through the intended retrieval/eligibility path
	console.error(
		'[g2-integration] T3 (B3): recall (real searchChunks -> canonical filter -> model)'
	);
	const t3 = await turn(PORT_A, RECALL_BASE);
	const t3text = t3.body?.text ?? '';
	check(
		'B3',
		'recall uses the projected + eligible meaning',
		t3.status === 200 &&
			t3.body.kind === 'assistant' &&
			t3text.includes('Zephyr') &&
			t3.body.meta.retrieval === 'used',
		JSON.stringify(t3.body.meta ?? {}).slice(0, 120) + ' :: ' + t3text.slice(0, 160)
	);

	// B4 — agent-inferred proposal
	console.error('[g2-integration] T4 (B4): infer a preference -> proposed, never accepted');
	const t4 = await turn(PORT_A, PREFER);
	check(
		'B4',
		'inference creates a PROPOSED record (never accepted)',
		t4.status === 200 &&
			t4.body.meta.durableWrite === false &&
			t4.body.meta.meaningProposed === true,
		JSON.stringify(t4.body.meta ?? {}).slice(0, 160)
	);
	const m2 = await meaning(PORT_A);
	const prefer = m2.body.proposed.find((r) => /dark/i.test(r.value));
	check(
		'B4b',
		'proposal visible under Proposed in inspector with origin agent_inferred',
		!!prefer && prefer.origin === 'agent_inferred'
	);

	// B7 (streak 1) — the PROPOSED meaning (never projected) must not surface
	// in the answer. Ordinary retrieval may legitimately return other eligible
	// meaning, so the criterion is: no fabricated dark-interface claim.
	const t4r = await turn(PORT_A, PREFER_RECALL);
	check(
		'B4c',
		'proposed meaning excluded from ordinary turn',
		t4r.status === 200 &&
			t4r.body.kind === 'assistant' &&
			!/prefers dark/i.test(t4r.body.text ?? ''),
		JSON.stringify(t4r.body?.meta ?? {}).slice(0, 140) +
			' :: ' +
			(t4r.body?.text ?? '').slice(0, 120)
	);

	// B1c — WARM ordinary turn: materially no cognify latency (G1 finding F2).
	const t3wStart = Date.now();
	const t3w = await turn(
		PORT_A,
		'Do I usually work better in silence or with music? (guess freely)'
	);
	console.error(`[g2-integration] warm ordinary turn latency: ${Date.now() - t3wStart}ms`);
	check(
		'B1c',
		'warm ordinary turn answers with no durable write and no cognify',
		t3w.status === 200 &&
			t3w.body.kind === 'assistant' &&
			t3w.body.meta.durableWrite === false &&
			t3w.body.meta.projectionDegraded === false,
		JSON.stringify(t3w.body.meta ?? {}).slice(0, 160)
	);

	// B5 —— reject the proposal, then accept on a NEW proposal (rejection makes
	// the original ineligible; a fresh statement yields a fresh proposal).
	const rejectRes = await decide(PORT_A, prefer.id, 'reject');
	check(
		'B5a',
		'rejected proposal becomes ineligible (decision recorded)',
		rejectRes.status === 200 && rejectRes.body?.record?.decisionState === 'rejected'
	);
	await turn(PORT_A, 'I prefer dark interfaces at night.'); // fresh infer proposal
	const m2b = await meaning(PORT_A);
	const prefer2 = m2b.body.proposed.find((r) => /dark/i.test(r.value));
	const acceptRes = prefer2 ? await decide(PORT_A, prefer2.id, 'accept') : null;
	check(
		'B5b',
		'accepting a proposal makes it eligible and projects it',
		!!prefer2 &&
			acceptRes?.status === 200 &&
			acceptRes.body?.record?.decisionState === 'accepted' &&
			acceptRes.body?.projectionDegraded === false,
		JSON.stringify(acceptRes?.body ?? {}).slice(0, 200)
	);

	// B6 — correction to Orion (supersession)
	console.error('[g2-integration] T6 (B6): correct to Orion (fresh worker + cognify)');
	const t6Start = Date.now();
	const t6 = await turn(PORT_A, REMEMBER_ORION);
	check(
		'B6',
		'correction records new accepted Orion (slow durable turn, surfaced)',
		t6.status === 200 && t6.body.meta.durableWrite === true,
		JSON.stringify(t6.body.meta ?? {}).slice(0, 160)
	);
	console.error(`[g2-integration] B6 correction turn latency: ${Date.now() - t6Start}ms`);
	const m3 = await meaning(PORT_A);
	const orion = m3.body.current.find((r) => r.value === 'Orion');
	const zephyrHistory = m3.body.history.find((r) => r.value === 'Zephyr');
	check(
		'B6b',
		'Orion current; Zephyr superseded in history; lineage inspectable',
		!!orion && !!zephyrHistory && zephyrHistory.supersededBy?.value === 'Orion'
	);

	// B7 — stale-index protection through REAL retrieval (both projections may sit in Cognee)
	console.error(
		'[g2-integration] T7 (B7): recall after correction (filter must drop stale Zephyr)'
	);
	const t7 = await turn(PORT_A, RECALL_AFTER);
	const t7text = t7.body?.text ?? '';
	check(
		'B7',
		'stale-index protection: agent receives Orion only (Zephyr filtered)',
		t7.status === 200 &&
			t7.body.meta.retrieval === 'used' &&
			t7text.includes('Orion') &&
			!t7text.includes('Zephyr'),
		JSON.stringify(t7.body.meta ?? {}).slice(0, 140) + ' :: ' + t7text.slice(0, 200)
	);

	// Restart proof BEFORE failure phase: same RUN_ROOT, fresh process.
	const stopA = await stopServer(serverA, PORT_A);
	check('S0-stop', 'clean shutdown endpoint used', stopA === true);
	const serverB = startServer(PORT_A);
	const readyB = await waitReady(PORT_A, 120_000);
	check(
		'S0',
		'restart: knowledge + meaning store READY from persisted stores',
		readyB.knowledge.state === 'ready' && readyB.meaning.state === 'ready'
	);
	const m3r = await meaning(PORT_A);
	check(
		'I2',
		'meaning records + lineage survive restart (real on-disk appdata SQLite)',
		m3r.body.current.some((r) => r.value === 'Orion') &&
			m3r.body.history.some((r) => r.value === 'Zephyr' && r.supersededBy?.value === 'Orion') &&
			m3r.body.history.some((r) => /dark/i.test(r.value) && r.decisionState === 'rejected')
	);
	// Bounded settle wait: the worker boots asynchronously after the pack
	// exists; a first search during boot degrades honestly (recorded fact, not
	// hidden) — retry once after a bounded wait so the proof targets the
	// eligibility path, not the boot race.
	await sleep(5_000);
	let t5 = await turn(PORT_A, RECALL_BASE);
	let t5text = t5.body?.text ?? '';
	if (!t5text.includes('Orion')) {
		console.error('[g2-integration] I2b first try raced worker boot; bounded retry after 30s');
		await sleep(30_000);
		t5 = await turn(PORT_A, RECALL_BASE);
		t5text = t5.body?.text ?? '';
	}
	check(
		'I2b',
		'durable recall persists across app restart (eligibility intact)',
		t5.status === 200 && t5text.includes('Orion') && !t5text.includes('Zephyr'),
		JSON.stringify(t5.body?.meta ?? {}).slice(0, 140) + ' :: ' + t5text.slice(0, 160)
	);
	await stopServer(serverB, PORT_A);

	// B8 — controlled Cognee PROJECTION failure (canonical write keeps truth)
	const serverC = startServer(PORT_B, { QUOLLIGHT_FAULT: 'cognee' });
	await waitReady(PORT_B, 120_000);
	const t8 = await turn(PORT_B, 'Remember that the release train is Comet.');
	check(
		'B8',
		'projection failure surfaces honestly; canonical meaning intact',
		t8.status === 200 &&
			t8.body.meta.durableWrite === true &&
			t8.body.meta.projectionDegraded === true,
		JSON.stringify(t8.body.meta ?? {}).slice(0, 200)
	);
	const m4 = await meaning(PORT_B);
	check(
		'B8b',
		'canonical record intact with failed projection bookkeeping',
		m4.body.current.some((r) => r.semanticKey === 'release.train' && r.projectionState === 'failed')
	);
	await stopServer(serverC, PORT_B);

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
	console.error('G2 INTEGRATION PROOF ERROR:', error?.message ?? error);
	process.exit(1);
});
