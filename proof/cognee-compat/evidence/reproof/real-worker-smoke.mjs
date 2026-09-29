/**
 * Independent G0 re-proof — bounded real-worker smoke.
 * Consumes the INSTALLED @victframework/cognee@0.1.0 (freshly built by this
 * verifier from candidate SHA 78e6c0a) through VICT @victframework/* 0.4.0-rc.1.
 * Purpose only: prove the exact tarball reaches the real Cognee worker through
 * the current VICT line. Not a capacity test.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STORE = path.resolve('.smoke-store');
for (let i = 0; i < 5; i++) {
	try {
		rmSync(STORE, { recursive: true, force: true });
		break;
	} catch {
		await new Promise((r) => setTimeout(r, 1000));
	}
}
mkdirSync(STORE, { recursive: true });
writeFileSync(
	path.join(STORE, '.env'),
	[
		'# G0 reproof real-worker smoke — keyless, disposable',
		'ENV=dev',
		'RUNTIME__LOG_LEVEL=INFO',
		...Object.entries({
			SYSTEM_ROOT_DIRECTORY: 'system',
			DATA_ROOT_DIRECTORY: 'data',
			CACHE_ROOT_DIRECTORY: 'cache',
			LOGS_ROOT_DIRECTORY: 'logs',
			COGNEE_REPOS_DIR: 'repos'
		}).map(([k, v]) => `${k}=${path.join(STORE, v).replace(/\\/g, '/')}`),
		'VECTOR_DB_PROVIDER=lancedb',
		'GRAPH_DATABASE_PROVIDER=ladybug',
		'DB_PROVIDER=sqlite',
		'EMBEDDING_PROVIDER=fastembed',
		'EMBEDDING_MODEL=BAAI/bge-small-en-v1.5',
		'EMBEDDING_DIMENSIONS=384',
		'GRAPH_EXTRACTOR=gliner_demo',
		'AUTO_FEEDBACK=false',
		''
	].join('\n')
);

// INSTALLED package — the artifact npm actually installed from the tarball.
const { createCogneePack } = await import('@victframework/cognee');

const pack = createCogneePack({
	pythonPath: 'C:/Users/RZ1/Desktop/RZ/260925-VCT-Cognee/proof/.venv/Scripts/python.exe',
	cwd: STORE,
	storeRoot: STORE,
	namespaces: ['g0reproof'],
	readyBudgetMs: 180_000
});

const binding = (id) => pack.bindings.capabilities.find((b) => b.id === id);
const results = {};
try {
	// add — keyed durable write; receipt: { datasetName, reconciled, itemsAfter, ... }
	const addReceipt = await binding('cognee.add').invoke(
		{
			datasetName: 'g0reproof.d1',
			content:
				'G0 reproof sentinel: the ZEPHYR-QUARTZ-42 alloy was catalogued by the Meridian Institute.'
		},
		{ mode: 'normal', idempotencyKey: 'g0-reproof-add-1' }
	);
	console.log('ADD receipt:', JSON.stringify(addReceipt));
	results.add =
		addReceipt.datasetName === 'g0reproof.d1' &&
		addReceipt.reconciled === 'fresh-execution' &&
		addReceipt.itemsAfter === 1;

	// cognify — keyed durable write, same receipt shape
	const cgnReceipt = await binding('cognee.cognify').invoke(
		{ datasetName: 'g0reproof.d1' },
		{ mode: 'normal', idempotencyKey: 'g0-reproof-cognify-1' }
	);
	console.log('COGNIFY receipt:', JSON.stringify(cgnReceipt));
	results.cognify =
		cgnReceipt.datasetName === 'g0reproof.d1' && cgnReceipt.reconciled === 'fresh-execution';

	// scoped searchChunks — read: { hits[], datasets, total, truncated }
	const search = await binding('cognee.searchChunks').invoke(
		{ datasets: ['g0reproof.d1'], query: 'ZEPHYR-QUARTZ-42 Meridian Institute', topK: 5 },
		{ mode: 'normal' }
	);
	console.log(
		'SEARCH result:',
		JSON.stringify({
			total: search.total,
			truncated: search.truncated,
			text: search.hits?.map((h) => h.text)
		})
	);
	const text = JSON.stringify(search);
	results.search = Array.isArray(search.hits) && text.includes('ZEPHYR-QUARTZ-42');
} finally {
	await pack.supervision.shutdown();
	rmSync(STORE, { recursive: true, force: true });
}
const pass = results.add && results.cognify && results.search;
console.log('REAL_WORKER_SMOKE:', pass ? 'OK' : 'FAIL', JSON.stringify(results));
process.exit(pass ? 0 : 1);
