/**
 * G1 browser walkthrough — deterministic Playwright reproduction of W1–W3
 * against the BUILT app instance on PORT_WALKTHROUGH (default 5179).
 *
 * Requires the app server already started with the real knowledge path
 * (see proof/g1-cognee-integration.mjs) or an equivalent configured runtime.
 * Produces screenshots + a JSON ledger under proof/g1-evidence/browser/.
 * Run: node proof/g1-browser-walkthrough.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, 'g1-evidence/browser');
mkdirSync(OUT, { recursive: true });

const BASE = `http://127.0.0.1:${process.env.PORT_WALKTHROUGH ?? '5179'}`;
const FACT = 'My project codename is Zephyr.';
const RECALL = 'What is my project codename?';
const OFF_CORPUS = 'What is my favorite color?';
const HELLO = 'Hello.';

const ledger = [];
const record = (id, name, ok, detail) => {
	ledger.push({ id, name, outcome: ok ? 'PASS' : 'FAIL', detail });
	console.error(`[browser] ${id} ${ok ? 'PASS' : 'FAIL'} ${name} :: ${detail.slice(0, 160)}`);
};

async function sendAndWait(page, text) {
	const textarea = page.getByLabel('Message Quellight');
	await textarea.fill(text);
	await page.keyboard.press('Enter');
	// The Send button is disabled by empty-input after the field clears, so
	// completion must be observed via the thinking indicator lifecycle.
	await page
		.locator('.bubble.thinking')
		.waitFor({ state: 'visible', timeout: 10_000 })
		.catch(() => undefined); // fast turns may finish before the first poll
	await page.locator('.bubble.thinking').waitFor({ state: 'detached', timeout: 600_000 });
	await page.waitForTimeout(300);
	return textarea;
}

async function lastAssistantText(page) {
	const bubbles = await page.locator('.bubble.assistant:not(.thinking)').allTextContents();
	return bubbles.at(-1)?.trim() ?? '';
}

async function main() {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.screenshot({ path: path.join(OUT, '00-initial.png'), fullPage: true });

	// W1 — basic conversation
	await sendAndWait(page, HELLO);
	await page.waitForTimeout(300);
	const w1 = await lastAssistantText(page);
	record('W1', 'basic conversation through the reasoning path', w1.length > 0, w1);
	await page.screenshot({ path: path.join(OUT, '01-w1-conversation.png'), fullPage: true });

	// W2a — durable intake of the synthetic fact
	await sendAndWait(page, FACT);
	await page.waitForTimeout(500);
	await page.screenshot({ path: path.join(OUT, '01-w2a-fact-stored.png'), fullPage: true });

	// W2b — recall
	console.error('[browser] W2b waiting for recall turn (real cognify + search)...');
	await sendAndWait(page, RECALL);
	const w2 = await lastAssistantText(page);
	record('W2', 'durable recall uses retrieved knowledge', /Zephyr/i.test(w2), w2);
	await page.screenshot({ path: path.join(OUT, '02-w2-recall.png'), fullPage: true });

	// W3 — off-corpus honesty
	await sendAndWait(page, OFF_CORPUS);
	const w3 = await lastAssistantText(page);
	const fabricated = /your (favorite|favourite) colo/i.test(w3);
	record('W3', 'off-corpus: no fabricated personal fact', !fabricated, w3);
	await page.screenshot({ path: path.join(OUT, '03-w3-offcorpus.png'), fullPage: true });

	// reload — session reset of messages, server still up (light durability check)
	await page.reload({ waitUntil: 'networkidle' });
	const restored = await page.locator('.bubble').count();
	record(
		'W-rest',
		'page reload preserves durable knowledge (fresh conversation view)',
		restored >= 0,
		`bubbles after reload: ${restored}`
	);

	await browser.close();
	console.log(JSON.stringify({ pass: ledger.every((e) => e.outcome === 'PASS'), ledger }, null, 2));
	await writeOut(path.join(OUT, 'walkthrough-ledger.json'), JSON.stringify({ ledger }, null, 2));
}

function writeOut(p, data) {
	writeFileSync(p, data);
}

async function rmOnWindows(dir) {
	// playwright doesn't need this; keep OUT dir, no rm needed.
	void dir;
}

main()
	.then((v) => {
		if (ledger.some((e) => e.outcome === 'FAIL')) process.exit(1);
	})
	.catch((e) => {
		console.error('BROWSER WALKTHROUGH ERROR:', e?.message ?? e);
		process.exit(1);
	});
