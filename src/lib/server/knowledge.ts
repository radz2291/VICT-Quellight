/**
 * Quellight G1 durable knowledge intake/retrieval — Work Package C + D.
 *
 * The ONLY path to Cognee is through the VICT capability-bindings surface of
 * the verified `@victframework/cognee` pack (`cognee.add`, `cognee.cognify`,
 * `cognee.searchChunks`). Product code never touches Cognee internals.
 *
 * Temporary G1 intake policy (frozen contract §5, NOT the final memory
 * policy): every user message submitted through the conversation path is
 * added to dataset `g1.quellight` and cognified. No lifecycle/forgetting
 * machinery is implemented at G1.
 *
 * Cognee hits are CANDIDATES, not canonical Quellight truth (D-007).
 * Scores are raw retrieval signals; no invented threshold is applied here.
 */

import { createCogneePack } from '@victframework/cognee';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { KnowledgeCandidate } from '$lib/types';

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

export const G1_DATASET = 'g1.quellight';

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
		// Quellight-owned, keyless worker configuration for the isolated G1 store
		// (no LLM key; fastembed embeddings; no credentials ever sent to Cognee).
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
	 * G1 bounded recovery for an observed UPSTREAM Cognee-worker defect:
	 * the SECOND cognify in one worker process's lifetime fails deterministically
	 * (Python asyncio lock bound to a different event loop; one cognify per fresh
	 * worker succeeds — verified against the real worker at G1). This is a
	 * recovery behavior inside Quellight/VICT boundaries; VICT-Cognee itself is
	 * NOT modified by this repository.
	 *
	 * Policy: each durable intake gives its cognify a fresh supervised worker,
	 * so every cognify is the first in its worker's lifetime. Bounded: at most
	 * one recreate + one cognify retry per storeMessage call; failure still
	 * degrades truthfully (intakeDegraded) rather than fabricating state.
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

	/** Durable intake: add + cognify a user-submitted message (keyed, idempotent per call). */
	async storeMessage(
		content: string,
		idempotencyKey: string
	): Promise<{ datasetName: string; itemsAfter: number }> {
		// Upstream defect workaround: never run a second cognify on one worker.
		if (this.hasCognified) {
			await this.recyclePack();
		}
		const addReceipt = (await this.addBinding.invoke(
			{ datasetName: G1_DATASET, content },
			{ mode: 'normal', idempotencyKey }
		)) as { datasetName?: string; itemsAfter?: number };
		try {
			await this.cognifyBinding.invoke(
				{ datasetName: G1_DATASET },
				{ mode: 'normal', idempotencyKey: `${idempotencyKey}-cognify` }
			);
			this.hasCognified = true;
		} catch (firstError) {
			// One bounded recovery attempt: fresh worker, one retry.
			await this.recyclePack();
			const retryAdd = (await this.addBinding.invoke(
				{ datasetName: G1_DATASET, content },
				{ mode: 'normal', idempotencyKey: `${idempotencyKey}-r` }
			)) as { datasetName?: string; itemsAfter?: number };
			await this.cognifyBinding.invoke(
				{ datasetName: G1_DATASET },
				{ mode: 'normal', idempotencyKey: `${idempotencyKey}-cognify-r` }
			);
			this.hasCognified = true;
			void firstError;
			return {
				datasetName: retryAdd.datasetName ?? G1_DATASET,
				itemsAfter: typeof retryAdd.itemsAfter === 'number' ? retryAdd.itemsAfter : 0
			};
		}
		return {
			datasetName: addReceipt.datasetName ?? G1_DATASET,
			itemsAfter: typeof addReceipt.itemsAfter === 'number' ? addReceipt.itemsAfter : 0
		};
	}

	/**
	 * Scoped read through the capability pack. Returns candidates only —
	 * callers must treat them as unverified context (D-007 invariant).
	 */
	async search(query: string, topK = 5): Promise<KnowledgeCandidate[]> {
		const result = (await this.searchBinding.invoke(
			{ datasets: [G1_DATASET], query, topK },
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
