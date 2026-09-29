/**
 * G0 WP-C — Node-boundary compatibility battery (diagnostic for remediation
 * scoping; the npm install route refusal is recorded separately).
 *
 * Mirrors the pure-Node invariants of VICT-Cognee's own pack/verify/verify.ts
 * (unmodified source @ 2c180ef), now against the CURRENT VICT line
 * (@victframework/* 0.4.0-rc.1 from the npm registry) with the UNMODIFIED
 * built tarball of @victframework/cognee@0.1.0.
 *
 * Excluded by design: real-worker runs (V5/V6/V7 store-touching parts) —
 * the Python/cognee worker layer is downstream of VICT and version-independent;
 * the G0 question is the VICT-facing Node boundary.
 */

import { mkdirSync, rmSync, statSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRuntime, createInMemoryStores, installCapabilityPack } from '@victframework/runtime';
import { validateCapabilityPack, neutralJsonContract } from '@victframework/sdk';
import {
	createCogneePack,
	WorkerError,
	BindingRefusedError
} from './extracted-cognee/dist/index.js';

const storeRoot = path.resolve('.battery-store');
for (let i = 0; i < 5; i++) {
	try {
		rmSync(storeRoot, { recursive: true, force: true });
		break;
	} catch {
		await new Promise((r) => setTimeout(r, 1000));
	}
}
mkdirSync(path.join(storeRoot, 'system'), { recursive: true });
// Same keyless store env shape the C5/C6/C7 stores use (no LLM key).
const envFile = [
	'# G0 diagnostic disposable store',
	'ENV=dev',
	'RUNTIME__LOG_LEVEL=INFO',
	...Object.entries({
		SYSTEM_ROOT_DIRECTORY: 'system',
		DATA_ROOT_DIRECTORY: 'data',
		CACHE_ROOT_DIRECTORY: 'cache',
		LOGS_ROOT_DIRECTORY: 'logs',
		COGNEE_REPOS_DIR: 'repos'
	}).map(([k, v]) => `${k}=${path.join(storeRoot, v).replace(/\\/g, '/')}`),
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
writeFileSync(path.join(storeRoot, '.env'), envFile);

const results = [];
const record = (id, name, outcome, detail) => {
	results.push({ id, name, outcome, detail });
	console.error(`[diag] ${id} ${outcome} ${name}`);
};
const check = (id, name, cond, detail) => {
	record(id, name, cond ? 'PASS' : 'FAIL', detail);
	return cond;
};
const storeSnapshot = () => {
	const files = [];
	const walk = (dir) => {
		for (const e of readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.isFile()) files.push(`${path.relative(storeRoot, p)}:${statSync(p).size}`);
		}
	};
	walk(storeRoot);
	return files.sort();
};

const pack = createCogneePack({
	pythonPath: process.env.PILOT_PYTHON ?? 'C:/unused-in-this-battery/python.exe',
	cwd: storeRoot,
	storeRoot,
	namespaces: ['diag']
});

const neutralContract = {
	id: 'g0.neutral',
	revision: '1',
	expected: 'any object',
	parse: (input) =>
		typeof input === 'object' && input !== null
			? { ok: true, value: input }
			: { ok: false, issues: [{ code: 'SHAPE', path: '$', message: 'expected object' }] }
};
const routeContract = {
	id: 'g0.route-result',
	revision: '1',
	expected: '{ route: string, value: object }',
	parse: (input) => {
		const o = input;
		if (o && typeof o === 'object' && typeof o.route === 'string' && typeof o.value === 'object') {
			return { ok: true, value: o };
		}
		return {
			ok: false,
			issues: [{ code: 'SHAPE', path: '$', message: 'expected { route, value }' }]
		};
	}
};
const identityCapability = {
	id: 'g0.identity',
	revision: '1',
	effect: 'pure',
	input: neutralJsonContract,
	output: neutralJsonContract,
	invoke: (input) => input
};
const routeCapability = {
	id: 'g0.route',
	revision: '1',
	effect: 'pure',
	input: neutralContract,
	output: routeContract,
	invoke: (input) => ({ route: 'go', value: input })
};

const WRITE_GRAPH = {
	id: 'g0.write',
	entry: 'decide',
	nodes: [
		{ id: 'decide', kind: 'decision', capability: 'g0.route' },
		{ id: 'put', capability: 'cognee.add', timeoutMs: 180_000, output: 'cognee.mutating-receipt' }
	],
	edges: [{ from: 'decide', to: 'put', kind: 'route', key: 'go' }]
};
const DOUBLES_WRITE_GRAPH = {
	id: 'g0.doubles-write',
	entry: 'put',
	nodes: [
		{ id: 'put', capability: 'cognee.add', output: 'cognee.mutating-receipt' },
		{ id: 'adapt', capability: 'g0.identity' },
		{ id: 'graph', capability: 'cognee.cognify', output: 'cognee.mutating-receipt' }
	],
	edges: [
		{ from: 'put', to: 'adapt' },
		{ from: 'adapt', to: 'graph' }
	]
};
const FORGET_GRAPH = {
	id: 'g0.forget',
	entry: 'decide',
	nodes: [
		{ id: 'decide', kind: 'decision', capability: 'g0.route' },
		{ id: 'adapt', capability: 'g0.identity' },
		{
			id: 'remove',
			capability: 'cognee.forgetDataset',
			timeoutMs: 120_000,
			output: 'cognee.forget-receipt'
		}
	],
	edges: [
		{ from: 'decide', to: 'adapt', kind: 'route', key: 'go' },
		{ from: 'adapt', to: 'remove' }
	]
};
const READ_GRAPH = {
	id: 'g0.read',
	entry: 'find',
	nodes: [{ id: 'find', capability: 'cognee.searchChunks', output: 'cognee.search-output' }],
	edges: []
};
const DURABLE_READ_GRAPH = {
	id: 'g0.durable-read',
	entry: 'find',
	nodes: [
		{
			id: 'find',
			capability: 'cognee.searchChunks',
			timeoutMs: 60_000,
			output: 'cognee.search-output'
		}
	],
	edges: []
};

function newRuntime(granted) {
	const runtime = createRuntime({
		stores: createInMemoryStores(),
		...(granted
			? { authority: { grants: ['cognee.write', 'cognee.search', 'cognee.delete'] } }
			: {})
	});
	runtime
		.registerContract(neutralContract)
		.registerContract(routeContract)
		.registerContract(neutralJsonContract);
	runtime.registerCapability(routeCapability).registerCapability(identityCapability);
	return runtime;
}

const runtimeGranted = newRuntime(true);
let ok = true;

// V0: manifest validation against the current SDK line
{
	const validation = validateCapabilityPack(pack, { victVersion: '0.1.0' });
	ok &&= validation.ok === true;
	record(
		'V0',
		'manifest validates against current sdk validateCapabilityPack',
		validation.ok ? 'PASS' : 'FAIL',
		validation.ok ? { capabilities: pack.manifest.capabilities.length } : validation.issues
	);
}
// V1: atomic install (current runtime line)
{
	try {
		const { installed } = installCapabilityPack(runtimeGranted, pack);
		const pass = installed.length === 6;
		ok &&= pass;
		record(
			'V1',
			'installCapabilityPack (VICT 0.4.0-rc.1) installs six capabilities',
			pass ? 'PASS' : 'FAIL',
			{ installed }
		);
	} catch (e) {
		ok = false;
		record('V1', 'installCapabilityPack (VICT 0.4.0-rc.1) installs six capabilities', 'FAIL', {
			error: String(e)
		});
	}
}
// V2: test-mode doubles, zero worker spawns
{
	const activated = await runtimeGranted.activate(DOUBLES_WRITE_GRAPH);
	const spawnsBefore = pack.supervision.stats.spawns;
	const run = !activated.ok
		? null
		: await runtimeGranted.run(
				{ datasetName: 'diag.verify', content: 'G0 marker: doubles must not touch cognee.' },
				{ mode: 'test' }
			);
	const pass =
		activated.ok &&
		run.status === 'completed' &&
		run.output?.datasetName === 'diag.verify' &&
		run.output?.itemsAfter === 1 &&
		pack.supervision.stats.spawns === spawnsBefore;
	ok &&= pass;
	record(
		'V2',
		'test-mode doubles (add+cognify) via current runtime',
		pass ? 'PASS' : 'FAIL',
		activated.ok
			? { status: run.status, output: run.output }
			: { issues: activated.issues.map((x) => x.code) }
	);
}
// V2b: forget double in test mode
{
	const FORGET_DOUBLE_GRAPH = {
		id: 'g0.forget-double',
		entry: 'remove',
		nodes: [{ id: 'remove', capability: 'cognee.forgetDataset', output: 'cognee.forget-receipt' }],
		edges: []
	};
	const activated = await runtimeGranted.activate(FORGET_DOUBLE_GRAPH);
	const run = !activated.ok
		? null
		: await runtimeGranted.run({ datasetName: 'diag.never' }, { mode: 'test' });
	const pass =
		activated.ok && run.status === 'completed' && run.output?.datasetId === 'double-dataset-id';
	ok &&= pass;
	record(
		'V2b',
		'forget double in test mode',
		pass ? 'PASS' : 'FAIL',
		activated.ok
			? { status: run.status, output: run.output }
			: { issues: activated.issues.map((x) => x.code) }
	);
}
// V3: read in test mode fails closed (no double; sequential engine)
{
	const activated = await runtimeGranted.activate(READ_GRAPH);
	const spawnsBefore = pack.supervision.stats.spawns;
	const run = !activated.ok
		? null
		: await runtimeGranted.run({ datasets: ['diag.verify'], query: 'anything' }, { mode: 'test' });
	const pass =
		activated.ok && run.status === 'blocked' && pack.supervision.stats.spawns === spawnsBefore;
	ok &&= pass;
	record(
		'V3',
		'read in test mode fails closed (no double)',
		pass ? 'PASS' : 'FAIL',
		activated.ok
			? { status: run.status, spawns: pack.supervision.stats.spawns }
			: { issues: activated.issues.map((x) => x.code) }
	);
}
// V4: permission pre-check (ungranted runtime, handler never invoked)
{
	const runtimeUngranted = newRuntime(false);
	installCapabilityPack(runtimeUngranted, pack);
	const activated = await runtimeUngranted.activate(WRITE_GRAPH);
	const spawnsBefore = pack.supervision.stats.spawns;
	const run = !activated.ok
		? null
		: await runtimeUngranted.run(
				{ datasetName: 'diag.verify', content: 'must never run' },
				{ mode: 'normal' }
			);
	const msg = JSON.stringify(run?.error ?? run ?? '').toLowerCase();
	const pass =
		activated.ok &&
		run.status !== 'completed' &&
		msg.includes('permission') &&
		pack.supervision.stats.spawns === spawnsBefore;
	ok &&= pass;
	record(
		'V4',
		'ungranted write fails pre-handler',
		pass ? 'PASS' : 'FAIL',
		activated.ok
			? { status: run.status, error: run.error ?? null }
			: { issues: activated.issues.map((x) => x.code) }
	);
}
// V5b: sequential-engine write in NORMAL mode refused (unkeyed; in-process)
{
	const spawnsBefore = pack.supervision.stats.spawns;
	const activated = await runtimeGranted.activate(DOUBLES_WRITE_GRAPH);
	const run = !activated.ok
		? null
		: await runtimeGranted.run(
				{ datasetName: 'diag.verify', content: 'must be refused: unkeyed' },
				{ mode: 'normal' }
			);
	const msg = JSON.stringify(run?.error ?? run ?? '').toLowerCase();
	const pass =
		activated.ok &&
		run.status !== 'completed' &&
		(msg.includes('threw') || msg.includes('idempotencykey')) &&
		pack.supervision.stats.spawns === spawnsBefore;
	ok &&= pass;
	record(
		'V5b',
		'sequential-engine unkeyed write refused in normal mode',
		pass ? 'PASS' : 'FAIL',
		activated.ok
			? { status: run.status, error: run.error ?? null }
			: { issues: activated.issues.map((x) => x.code) }
	);
}
// V9: durable graphs never reach the real worker in test/simulate
{
	const storeBefore = storeSnapshot();
	const spawnsBefore = pack.supervision.stats.spawns;
	const cases = [
		[
			'V9a',
			WRITE_GRAPH,
			{ mode: 'test' },
			{ datasetName: 'diag.never', content: 'must be refused' }
		],
		[
			'V9b',
			WRITE_GRAPH,
			{ mode: 'simulate' },
			{ datasetName: 'diag.never', content: 'must be refused' }
		],
		['V9d', FORGET_GRAPH, { mode: 'test' }, { datasetName: 'diag.never' }]
	];
	for (const [id, graph, opts, runInput] of cases) {
		await runtimeGranted.activate(graph);
		const run = await runtimeGranted.run(runInput, opts);
		const pass =
			run.status !== 'completed' &&
			run.status !== 'blocked' &&
			pack.supervision.stats.spawns === spawnsBefore &&
			JSON.stringify(storeSnapshot()) === JSON.stringify(storeBefore);
		ok &&= pass;
		record(
			id,
			'durable graph in non-normal mode refused, store unchanged',
			pass ? 'PASS' : 'FAIL',
			{ input: runInput, status: run.status }
		);
	}
}
// V10: deadline enforcement at the binding, before any worker request
{
	const spawnsBefore = pack.supervision.stats.spawns;
	const addBinding = pack.bindings.capabilities.find((b) => b.id === 'cognee.add');
	for (const [id, deadlineAt] of [
		['V10a', Date.now() - 1000],
		['V10b', Date.now() + 100]
	]) {
		let refused = null;
		try {
			await addBinding.invoke(
				{ datasetName: 'diag.deadline', content: 'must never run' },
				{ mode: 'normal', idempotencyKey: `g0-${id}`, deadlineAt }
			);
		} catch (e) {
			refused = e;
		}
		const pass =
			refused instanceof BindingRefusedError &&
			refused.code === 'COGNEE_DEADLINE_EXCEEDED' &&
			pack.supervision.stats.spawns === spawnsBefore;
		ok &&= pass;
		record(id, 'ctx deadline fails BEFORE worker request', pass ? 'PASS' : 'FAIL', {
			got: refused instanceof Error ? (refused.code ?? refused.name) : String(refused)
		});
	}
}

// NOTE: no supervision.shutdown() here — with zero worker spawns this battery's
// store ownership lock simply remains on the disposable store.
console.log(
	JSON.stringify(
		{ diagnostic: 'G0-WP-C node-boundary battery vs VICT 0.4.0-rc.1', ok, results },
		null,
		2
	)
);
process.exit(ok ? 0 : 1);
