/**
 * G1 browser extras — failure phase and narrow-screen/keyboard phase,
 * against an already-running BUILT app instance (PORT_WALKTHROUGH, default 5179).
 *
 * Phases (chosen by first CLI arg):
 *   failure — server must be running with QUOLLIGHT_FAULT=model;
 *             asserts the model fault surfaces honestly in the browser (no fake success).
 *   narrow  — server must be running normally; asserts 390px-wide usability and
 *             keyboard-only interaction (type + Enter submits).
 *
 * Appends to proof/g1-evidence/browser/extras-ledger.json. Run: node proof/g1-browser-extras.mjs <phase>
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, 'g1-evidence/browser');
mkdirSync(OUT, { recursive: true });
const LEDGER_PATH = path.join(OUT, 'extras-ledger.json');

const BASE = `http://127.0.0.1:${process.env.PORT_WALKTHROUGH ?? '5179'}`;
const RECALL = 'What is my project codename?';

const phase = process.argv[2] ?? '';
if (phase !== 'failure' && phase !== 'narrow') {
	console.error('usage: node proof/g1-browser-extras.mjs <failure|narrow>');
	process.exit(2);
}

let ledger = [];
try {
	ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')).ledger ?? [];
} catch {
	ledger = [];
}
ledger = ledger.filter((e) => e.phase !== phase);
const record = (id, name, ok, detail) => {
	ledger.push({ phase, id, name, outcome: ok ? 'PASS' : 'FAIL', detail });
	console.error(
		`[browser-${phase}] ${id} ${ok ? 'PASS' : 'FAIL'} ${name} :: ${detail.slice(0, 160)}`
	);
};

async function submitAndWait(page, text) {
	const textarea = page.getByLabel('Message Quellight');
	await textarea.click();
	await page.keyboard.type(text, { delay: 20 });
	await page.keyboard.press('Enter');
	await page
		.locator('.bubble.thinking')
		.waitFor({ state: 'visible', timeout: 10_000 })
		.catch(() => undefined); // fast turns may finish before the first poll
	await page.locator('.bubble.thinking').waitFor({ state: 'detached', timeout: 600_000 });
	await page.waitForTimeout(300);
}

async function lastTexts(page) {
	return (await page.locator('.bubble, .note-pill').allTextContents()).map((t) => t.trim());
}

async function finish(code) {
	console.log(JSON.stringify({ pass: ledger.every((e) => e.outcome === 'PASS'), ledger }, null, 2));
	writeFileSync(LEDGER_PATH, JSON.stringify({ ledger }, null, 2));
	process.exit(code);
}

async function failurePhase() {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(BASE, { waitUntil: 'networkidle' });

	await submitAndWait(page, RECALL);
	const texts = await lastTexts(page);
	const failureShown = texts.some((t) =>
		/Quellight could not produce a response|Request failed|could not be reached/i.test(t)
	);
	const fabricated = texts.some((t) => /Zephyr/i.test(t) && /your project codename is/i.test(t));
	record(
		'W4b',
		'controlled model fault surfaces honestly in the browser (no fake success)',
		failureShown && !fabricated,
		`bubbles: ${JSON.stringify(texts).slice(0, 300)}`
	);
	await page.screenshot({ path: path.join(OUT, '04-w4-model-fault.png'), fullPage: true });
	await browser.close();
	return failureShown && !fabricated ? 0 : 1;
}

async function narrowPhase() {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const page = await context.newPage();
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.screenshot({ path: path.join(OUT, '05-narrow-initial.png'), fullPage: true });

	const noHScroll = await page.evaluate(
		() => document.documentElement.scrollWidth <= window.innerWidth + 1
	);
	record(
		'N1',
		'narrow viewport (390px) renders without horizontal overflow',
		noHScroll,
		`scrollWidth check`
	);

	await submitAndWait(page, 'Hello.');
	const texts = await lastTexts(page);
	const answered = texts.some((t) => /Quellight/i.test(t));
	record(
		'N2',
		'keyboard-only interaction submits and answers on narrow viewport',
		answered,
		JSON.stringify(texts)
	);
	await page.screenshot({ path: path.join(OUT, '06-narrow-after-turn.png'), fullPage: true });

	await browser.close();
	return noHScroll && answered ? 0 : 1;
}

const code = phase === 'failure' ? await failurePhase() : await narrowPhase();
await finish(code);
