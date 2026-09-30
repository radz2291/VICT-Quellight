/**
 * Quellight G2 semantic projection — the ONLY path to Cognee.
 *
 * Cognee is a semantic RETRIEVAL/index PROJECTION over eligible Quellight
 * meaning (QD-04). The only reachable surface is the VICT capability-
 * bindings of the verified `@victframework/cognee` pack (`cognee.add`,
 * `cognee.cognify`, `cognee.searchChunks`). Product code never touches
 * Cognee internals.
 *
 * G2 intake policy (frozen contract §9, replacing the REMOVED G1
 * every-message policy): canonical meaning is written first (VICT
 * Application Data); ONLY THEN is the accepted/current record projected
 * here. Ordinary conversation never reaches this module.
 *
 * Cognee hits are CANDIDATES, never canonical truth (D-007): every hit must
 * be mapped back to the canonical Meaning Store and pass the eligibility
 * filter before it may influence model context.
 */

import { createCogneePack } from '@victframework/cognee';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { KnowledgeCandidate, MeaningRecord } from '$lib/types';
import { projectionContent } from './meaning-filter.js';

/**
 * Structural shape of a capability binding as surfaced by the VICT
 * runtime/pack `bindings.capabilities` collection. Kept narrow so tests can
 * provide focused doubles at this exact boundary.
 */
export interface CapabilityBinding {
	id: string;
	invoke(input: unknown, call: { mode: 'normal'; idempotencyKey?: string }): Promise<unknown>;
}

interface CogneeBindingShape {
	id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	invoke(input: any, call: any): Promise<any>;
}

export interface KnowledgePack {
	bindings: { capabilities: readonly CogneeBindingShape[] };
	supervision: { shutdown(): Promise<unknown> };
}

export interface CreationOptions {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createPack(options?: any): KnowledgePack;
	pythonPath: string;
	storeRoot: string;
	namespaces: string[];
}

function binding(pack: KnowledgePack, id: string): CapabilityBinding | undefined {
	const found = pack.bindings.capabilities.find((b) => b.id === id);
	return found ? { id: found.id, invoke: (input, call) => found.invoke(input, call) } : undefined;
}

export class KnowledgeDependencyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'KnowledgeDependencyError';
	}
}

export class KnowledgeStore {
	private hasCognified = false;
	static async create(options: {
		pythonPath: string;
		storeRoot: string;
		namespaces: string[];
		readyBudgetMs?: number;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		createPack?: any;
	}): Promise<KnowledgeStore> {
		// Quellight-owned, keyless worker configuration for the isolated
		// projection store (no LLM key; fastembed embeddings; no credentials
		// ever sent to Cognee).
		mkdirSync(options.storeRoot, { recursive: true });
		const envPath = path.join(options.storeRoot, '.env');
		if (!existsSync(envPath)) {
			writeFileSync(
				envPath,
				[
					'ENV=dev',
					'RUNTIME__LOG_LEVEL=INFO',
					...Object.entries({
						SYSTEM_ROOT_DIRECTORY: 'system',
						DATA_ROOT_DIRECTORY: 'data',
						CACHE_ROOT_DIRECTORY: 'cache',
						LOGS_ROOT_DIRECTORY: 'logs',
						COGNEE_REPOS_DIR: 'repos'
					}).map(([k, v]) => `${k}=${path.join(options.storeRoot, v).replace(/\\/g, '/')}`),
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
		}
		let pack: KnowledgePack;
		try {
			const createFn = options.createPack ?? createCogneePack;
			pack = createFn({
				pythonPath: options.pythonPath,
				cwd: options.storeRoot,
				storeRoot: options.storeRoot,
				namespaces: options.namespaces,
				readyBudgetMs: options.readyBudgetMs ?? 240_000
			});
		} catch (error) {
			throw new KnowledgeDependencyError(
				`Cognee capability pack unavailable: ${error instanceof Error ? error.message : String(error)}`
			);
		}
		const add = binding(pack, 'cognee.add');
		const cognify = binding(pack, 'cognee.cognify');
		const search = binding(pack, 'cognee.searchChunks');
		if (!add || !cognify || !search) {
			void pack.supervision.shutdown();
			throw new KnowledgeDependencyError('Required Cognee capability bindings missing from pack');
		}
		return new KnowledgeStore(options, pack, add, cognify, search);
	}

	private constructor(
		private readonly options: {
			pythonPath: string;
			storeRoot: string;
			namespaces: string[];
			readyBudgetMs?: number;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			createPack?: any;
		},
		private pack: KnowledgePack,
		private addBinding: CapabilityBinding,
		private cognifyBinding: CapabilityBinding,
		private searchBinding: CapabilityBinding
	) {}

	/**
	 * Bounded recovery for an observed UPSTREAM Cognee-worker defect
	 * (retained from G1): the SECOND cognify in one worker process's
	 * lifetime fails deterministically (Python asyncio lock bound to a
	 * different event loop). G2 disposition (contract §12): this workaround
	 * now runs ONLY on actual durable-meaning projection — never on ordinary
	 * conversation turns. VICT-Cognee itself is NOT modified by this repo.
	 */
	private async recyclePack(): Promise<void> {
		try {
			await this.pack.supervision.shutdown();
		} catch {
			// best-effort
		}
		const createFn = this.options.createPack ?? createCogneePack;
		const next = createFn({
			pythonPath: this.options.pythonPath,
			cwd: this.options.storeRoot,
			storeRoot: this.options.storeRoot,
			namespaces: this.options.namespaces,
			readyBudgetMs: this.options.readyBudgetMs ?? 240_000
		});
		this.pack = next;
		const add = binding(next, 'cognee.add');
		const cognify = binding(next, 'cognee.cognify');
		const search = binding(next, 'cognee.searchChunks');
		if (!add || !cognify || !search) {
			throw new KnowledgeDependencyError(
				'Required Cognee capability bindings missing after recovery'
			);
		}
		this.addBinding = add;
		this.cognifyBinding = cognify;
		this.searchBinding = search;
	}

	/**
	 * Project one accepted/current canonical record: add + cognify with
	 * keyed idempotency per record. Canonical truth is written BEFORE this
	 * call and is never rolled back by projection failure (contract §9).
	 */
	async projectMeaning(
		record: MeaningRecord,
		idempotencyKey: string
	): Promise<{ datasetName: string; itemsAfter: number }> {
		if (this.hasCognified) {
			// Upstream-defect workaround: never run a second cognify on one worker.
			await this.recyclePack();
		}
		const content = projectionContent(record);
		const addReceipt = (await this.addBinding.invoke(
			{ datasetName: PROJECTED_DATASET, content },
			{ mode: 'normal', idempotencyKey }
		)) as { datasetName?: string; itemsAfter?: number };
		try {
			await this.cognifyBinding.invoke(
				{ datasetName: PROJECTED_DATASET },
				{ mode: 'normal', idempotencyKey: `${idempotencyKey}-cognify` }
			);
			this.hasCognified = true;
		} catch (firstError) {
			// One bounded recovery attempt: fresh worker, one retry (same as G1).
			await this.recyclePack();
			const retryAdd = (await this.addBinding.invoke(
				{ datasetName: PROJECTED_DATASET, content },
				{ mode: 'normal', idempotencyKey: `${idempotencyKey}-r` }
			)) as { datasetName?: string; itemsAfter?: number };
			await this.cognifyBinding.invoke(
				{ datasetName: PROJECTED_DATASET },
				{ mode: 'normal', idempotencyKey: `${idempotencyKey}-cognify-r` }
			);
			this.hasCognified = true;
			void firstError;
			return {
				datasetName: retryAdd.datasetName ?? PROJECTED_DATASET,
				itemsAfter: typeof retryAdd.itemsAfter === 'number' ? retryAdd.itemsAfter : 0
			};
		}
		return {
			datasetName: addReceipt.datasetName ?? PROJECTED_DATASET,
			itemsAfter: typeof addReceipt.itemsAfter === 'number' ? addReceipt.itemsAfter : 0
		};
	}

	/**
	 * Scoped search through the capability pack. Returns RAW candidates only
	 * — callers must map them back to canonical state and apply the
	 * eligibility filter before model context (NEVER trust retrieval text).
	 */
	async search(query: string, topK = 5): Promise<KnowledgeCandidate[]> {
		const result = (await this.searchBinding.invoke(
			{ datasets: [PROJECTED_DATASET], query, topK },
			{ mode: 'normal' }
		)) as { hits?: Array<{ text?: string; score?: number }> };
		const hits = Array.isArray(result?.hits) ? result.hits : [];
		return hits
			.filter((h) => typeof h?.text === 'string' && h.text.trim().length > 0)
			.map((h) => ({ text: h.text as string, score: h.score }));
	}

	async close(): Promise<void> {
		try {
			await this.pack.supervision.shutdown();
		} catch {
			// shutdown is best-effort; supervision owns worker cleanup
		}
	}
}

export const PROJECTED_DATASET = 'g2.meaning';
