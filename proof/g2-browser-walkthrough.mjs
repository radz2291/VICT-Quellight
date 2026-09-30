/**
 * G2 REAL browser walkthrough (B1–B9, frozen contract §13).
 *
 * Boots a BUILT Quellight server (adapter-node) with the REAL Cognee worker
 * over a disposable run root, then walks the conversation UI and the Meaning
 * inspector in real Chromium:
 *   B1 ordinary turn: answered, no meaning persisted;
 *   B2 explicit durable meaning — accepted/current + provenance; survives
 *      reload and a full server restart;
 *   B3 recall through retrieval/eligibility;
 *   B4 agent-inferred proposal (Proposed only; NOT used as accepted context);
 *   B5 one rejected + one accepted proposal; eligibility changes accordingly;
 *   B6 correction to Orion (Zephyr in history, lineage, no rewrite);
 *   B7 stale-index protection (agent receives Orion only);
 *   B8 cognee projection failure (canonical intact, degradation honest);
 *   B9 narrow viewport + keyboard operability.
 *
 * Run: npm run build && node proof/g2-browser-walkthrough.mjs
 * Ledger/screenshots: proof/g2-evidence/browser/
 */

import { spawn, execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const RUN_ROOT = path.resolve(here, '.g2-browser-run');
const OUT = path.resolve(here, 'g2-evidence/browser');
const PORT_A = process.env.PROOF_PORT_A ?? '5181';
const PORT_B = process.env.PROOF_PORT_B ?? '5182';
const PYTHON =
	process.env.QUOLLIGHT_COGNEE_PYTHON ??
	'C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv/Scripts/python.exe';

const REMEMBER_ZEPHYR = 'Remember that the project codename is Zephyr.';
const REMEMBER_ORION = 'Remember that the project codename is Orion now.';
const RECALL = 'What is my project codename?';
const RECALL_2 = 'Again: what is my project codename?';
const PREFER = 'I prefer dark interfaces.';
const PREFER_RECALL = 'What interface style do I favor?';
const PREFER_NEW = 'I prefer dark interfaces at night.';
const HELLO = 'Hello.';

const ledger = [];
function record(id, name, ok, detail) {
	ledger.push({ id, name, outcome: ok ? 'PASS' : 'FAIL', detail: String(detail ?? '') });
	console.error(
		`[browser] ${id} ${ok ? 'PASS' : 'FAIL'} ${name} :: ${String(detail ?? '').slice(0, 170)}`
	);
	return ok;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function killTree(childProcess) {
	const pid = childProcess.pid;
	if (!pid) return;
	try {
		childProcess.kill();
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
	const free = await waitStoreFree(ms);
	if (!free) throw new Error('python workers still alive; refusing lock release');
	try {
		rmSync(path.join(storeRoot, 'cognee-store-owner.lock'), { force: true });
		console.error('[browser] released stale owner lock after verified stop');
	} catch {}
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
	const childProcess = spawn('node', [path.resolve(here, '../build/index.js')], {
		env,
		stdio: ['ignore', 'inherit', 'inherit'],
		windowsHide: true
	});
	childProcess.on('exit', (code, signal) =>
		console.error(`[srv ${port}] exited code=${code} signal=${signal ?? '-'}`)
	);
	return childProcess;
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

async function stopServer(childProcess, port) {
	try {
		const res = await fetch(`http://127.0.0.1:${port}/api/shutdown`, { method: 'POST' });
		console.error(`[browser] stop ${port}: status=${res.status}`);
		if (res.ok) {
			await sleep(2_000);
			return true;
		}
	} catch {}
	killTree(childProcess);
	await waitStoreFree(25_000);
	await releaseStaleOwnerLock(path.join(RUN_ROOT, 'cognee-store'));
	return false;
}

async function apiTurn(port, message) {
	const res = await fetch(`http://127.0.0.1:${port}/api/turn`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ message })
	});
	return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function apiMeaning(port) {
	const res = await fetch(`http://127.0.0.1:${port}/api/meaning`);
	return { status: res.status, body: await res.json().catch(() => null) };
}

async function apiDecide(port, recordId, decision) {
	const res = await fetch(`http://127.0.0.1:${port}/api/meaning/decision`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ recordId, decision })
	});
	return { status: res.status, body: await res.json().catch(() => null) };
}

async function sendAndWait(page, text, timeoutMs = 600_000) {
	const textarea = page.getByLabel('Message Quellight');
	await textarea.fill(text);
	await page.keyboard.press('Enter');
	await page.locator('.bubble.thinking').waitFor({ state: 'detached', timeout: timeoutMs });
	await page.waitForTimeout(250);
	return textarea;
}

async function lastAssistantText(page) {
	const bubbles = await page.locator('.bubble.assistant:not(.thinking)').allTextContents();
	return bubbles.at(-1)?.trim() ?? '';
}

async function main() {
	execSync('git rev-parse HEAD', { stdio: 'inherit' });
	const gitHead = execSync('git rev-parse HEAD').toString().trim();
	mkdirSync(OUT, { recursive: true });
	for (let attempt = 0; attempt < 8; attempt += 1) {
		try {
			rmSync(RUN_ROOT, { recursive: true, force: true });
			break;
		} catch {
			await sleep(2_000);
		}
	}
	mkdirSync(RUN_ROOT, { recursive: true });

	const serverA = startServer(PORT_A);
	const readyA = await waitReady(PORT_A, 120_000);
	record(
		'I0',
		'browser server boots with knowledge + meaning READY',
		readyA.knowledge.state === 'ready' && readyA.meaning.state === 'ready',
		JSON.stringify(readyA.knowledge)
	);

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(`http://127.0.0.1:${PORT_A}`, { waitUntil: 'networkidle' });
	await page.screenshot({ path: path.join(OUT, '00-initial.png'), fullPage: true });

	// B1 — ordinary conversation
	const b1Start = Date.now();
	await sendAndWait(page, HELLO);
	const b1 = await lastAssistantText(page);
	const m0 = await apiMeaning(PORT_A);
	record(
		'B1',
		'ordinary browser turn: answered, no meaning persisted',
		b1.length > 0 && !!m0.body && m0.body.current.length === 0 && m0.body.proposed.length === 0,
		`latency=${Date.now() - b1Start}ms; answer="${b1.slice(0, 60)}"`
	);
	await page.screenshot({ path: path.join(OUT, '01-b1-ordinary.png'), fullPage: true });

	// B2 — explicit durable meaning (slow real projection, surfaced honestly)
	console.error('[browser] B2 waiting for durable turn (real worker + cognify)...');
	const b2Start = Date.now();
	await sendAndWait(page, REMEMBER_ZEPHYR, 600_000);
	console.error(`[browser] B2 durable turn latency: ${Date.now() - b2Start}ms`);
	const m1 = await apiMeaning(PORT_A);
	const zephyr = (m1.body.current || []).find((r) => r.value === 'Zephyr');
	record(
		'B2',
		'accepted user_stated Zephyr visible with provenance',
		!!zephyr &&
			zephyr.origin === 'user_stated' &&
			zephyr.decisionState === 'accepted' &&
			zephyr.sourceExcerpt.length > 0,
		JSON.stringify(m1.body && m1.body.current).slice(0, 200)
	);

	// B2b — inspector page (real navigation); reload shows the card
	await page.goto(`http://127.0.0.1:${PORT_A}/meaning`, { waitUntil: 'networkidle' });
	const knownValues1 = await page
		.locator('section[aria-label="Known and current meaning"] .card .value')
		.allTextContents();
	record(
		'B2b',
		'inspector page shows current meaning',
		knownValues1.some((v) => /Zephyr/i.test(v)),
		`cards=${knownValues1.length}`
	);

	// B2c — full application restart; meaning survives
	await stopServer(serverA, PORT_A);
	const serverB = startServer(PORT_A);
	await waitReady(PORT_A, 120_000);
	let runningServer = serverB;
	const m1r = await apiMeaning(PORT_A);
	record(
		'B2c',
		'meaning survives an application restart (inspector after restart)',
		(m1r.body.current || []).some((r) => r.value === 'Zephyr'),
		''
	);
	await page.reload({ waitUntil: 'networkidle' });
	const knownValues2 = await page
		.locator('section[aria-label="Known and current meaning"] .card .value')
		.allTextContents();
	record(
		'B2d',
		'reloaded inspector still shows Zephyr current',
		knownValues2.some((v) => /Zephyr/i.test(v)),
		''
	);
	await page.screenshot({ path: path.join(OUT, '02-b2-inspector.png'), fullPage: true });

	// B3 — recall (bounded retry for the post-restart worker boot race; a
	// degraded first try is honest behavior, the retry targets eligibility)
	console.error('[browser] B3 recall...');
	await page.goto(`http://127.0.0.1:${PORT_A}`, { waitUntil: 'networkidle' });
	await sendAndWait(page, RECALL, 300_000);
	let b3 = await lastAssistantText(page);
	if (!/Zephyr/i.test(b3)) {
		console.error('[browser] B3 first try raced worker boot; bounded retry after 30s');
		await sleep(30_000);
		await sendAndWait(page, RECALL, 300_000);
		b3 = await lastAssistantText(page);
	}
	record(
		'B3',
		'recall uses eligible meaning through the intended path',
		/Zephyr/i.test(b3),
		b3.slice(0, 140)
	);
	await page.screenshot({ path: path.join(OUT, '03-b3-recall.png'), fullPage: true });

	// B4 — inferred proposal
	await sendAndWait(page, PREFER, 120_000);
	const m2 = await apiMeaning(PORT_A);
	const proposal = (m2.body.proposed || []).find((r) => /dark/i.test(r.value));
	record(
		'B4',
		'AI-inferred PROPOSAL created (never accepted)',
		!!proposal && proposal.origin === 'agent_inferred',
		JSON.stringify(m2.body && m2.body.proposed).slice(0, 200)
	);
	await page.screenshot({ path: path.join(OUT, '03-b4-proposal.png'), fullPage: true });

	// B4b — proposal NOT used as accepted user context
	await sendAndWait(page, PREFER_RECALL, 300_000);
	const b4r = await lastAssistantText(page);
	record(
		'B4b',
		'proposed meaning NOT used as established user context',
		!/prefers dark/i.test(b4r),
		b4r.slice(0, 140)
	);

	// B5 — one rejected proposal + one accepted proposal
	const b5aRes = await apiDecide(PORT_A, proposal.id, 'reject');
	record(
		'B5a',
		'rejected proposal recorded (decisionState rejected)',
		b5aRes.status === 200 && !!b5aRes.body && b5aRes.body.record.decisionState === 'rejected',
		JSON.stringify(b5aRes.body ?? {}).slice(0, 160)
	);
	await sendAndWait(page, PREFER_NEW, 120_000); // fresh infer proposal
	const m3 = await apiMeaning(PORT_A);
	const proposal2 = (m3.body.proposed || []).find((r) => /dark/i.test(r.value));
	const b5bRes = proposal2 ? await apiDecide(PORT_A, proposal2.id, 'accept') : null;
	record(
		'B5b',
		'accepted proposal eligible + projected',
		!!proposal2 &&
			!!b5bRes &&
			b5bRes.status === 200 &&
			b5bRes.body.record.decisionState === 'accepted' &&
			b5bRes.body.projectionDegraded === false,
		JSON.stringify(b5bRes.body ?? {}).slice(0, 200)
	);
	await page.screenshot({ path: path.join(OUT, '04-b5-decisions.png'), fullPage: true });

	// B6 — correction to Orion
	console.error('[browser] B6 correction turn (real fresh-worker cognify)...');
	const b6Start = Date.now();
	await sendAndWait(page, REMEMBER_ORION, 600_000);
	console.error(`[browser] B6 correction latency: ${Date.now() - b6Start}ms`);
	const m4 = await apiMeaning(PORT_A);
	const orion = (m4.body.current || []).find((r) => r.value === 'Orion');
	const zephyrH = (m4.body.history || []).find((r) => r.value === 'Zephyr');
	record(
		'B6',
		'correction: Orion current, Zephyr in history, lineage inspectable',
		!!orion && !!zephyrH && (zephyrH.supersededBy || {}).value === 'Orion',
		''
	);

	// B7 — stale-index protection in the browser flow
	await sendAndWait(page, RECALL_2, 300_000);
	const b7 = await lastAssistantText(page);
	record(
		'B7',
		'stale-index protection in browser flow (Orion only)',
		/Orion/i.test(b7) && !/Zephyr/i.test(b7),
		b7.slice(0, 160)
	);
	await page.screenshot({ path: path.join(OUT, '04-b7-stale-protection.png'), fullPage: true });

	await browser.close();

	// Stop the main server before the failure phase (avoid concurrent SQLite access).
	await stopServer(runningServer, PORT_A);

	// B8 — controlled cognee PROJECTION failure (separate gated instance)
	const faultServer = startServer(PORT_B, { QUOLLIGHT_FAULT: 'cognee' });
	await waitReady(PORT_B, 120_000);
	const b8Res = await apiTurn(PORT_B, 'Remember that the demo phase is Sirius.');
	record(
		'B8',
		'projection failure surfaced honestly; canonical meaning intact',
		b8Res.status === 200 &&
			!!b8Res.body.meta &&
			b8Res.body.meta.durableWrite === true &&
			b8Res.body.meta.projectionDegraded === true,
		JSON.stringify(b8Res.body.meta ?? {}).slice(0, 200)
	);
	const b8Meaning = await apiMeaning(PORT_B);
	record(
		'B8b',
		'canonical meaning intact with failed-projection bookkeeping',
		(b8Meaning.body.current || []).some(
			(r) => r.semanticKey === 'demo.phase' && r.projectionState === 'failed'
		),
		''
	);
	killTree(faultServer);
	await waitStoreFree(25_000);
	await releaseStaleOwnerLock(path.join(RUN_ROOT, 'cognee-store'));

	// B9 — narrow viewport + keyboard (fresh server over the same durable stores)
	const serverC = startServer(PORT_A);
	runningServer = serverC;
	await waitReady(PORT_A, 120_000);
	const browser2 = await chromium.launch({ headless: true });
	const context2 = await browser2.newContext({ viewport: { width: 390, height: 844 } });
	const page2 = await context2.newPage();
	await page2.goto(`http://127.0.0.1:${PORT_A}`, { waitUntil: 'networkidle' });
	const overflow = await page2.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
	);
	record(
		'B9',
		'narrow viewport (390px) renders without horizontal overflow',
		overflow === false,
		''
	);
	await page2.locator('textarea').pressSequentially('What is my project codename?');
	await page2.keyboard.press('Enter');
	try {
		await page2.locator('.bubble.thinking').waitFor({ state: 'detached', timeout: 300_000 });
		const b9 = await lastAssistantText(page2);
		record('B9b', 'keyboard-only interaction submits and answers', b9.length > 0, b9.slice(0, 120));
	} catch {
		record(
			'B9b',
			'keyboard-only interaction submits and answers',
			false,
			'no answer within timeout'
		);
	}
	await page2.screenshot({ path: path.join(OUT, '04-b9-narrow.png'), fullPage: true });
	await browser2.close();

	await stopServer(runningServer, PORT_A);

	const passCount = ledger.filter((e) => e.outcome === 'PASS').length;
	console.log(
		JSON.stringify(
			{ pass: passCount === ledger.length, passCount, total: ledger.length, gitHead, ledger },
			null,
			2
		)
	);
	process.exit(passCount === ledger.length ? 0 : 1);
}

main().catch((error) => {
	console.error('BROWSER WALKTHROUGH ERROR:', error?.message ?? error);
	process.exit(1);
});
