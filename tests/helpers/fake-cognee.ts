/**
 * Test double at the VICT capability-binding boundary (frozen contract §8
 * allows doubles to isolate behavior). Implements ONLY the binding surface
 * G2 uses: cognee.add, cognee.cognify, cognee.searchChunks.
 */

import type { KnowledgeCandidate } from '$lib/types';

export interface FakeBindingCall {
	mode: string;
	idempotencyKey?: string;
}

export class FakeCogneePack {
	datasets: Map<string, string[]> = new Map();
	cognifiedDatasets = new Set<string>();
	addCalls: Array<{ input: unknown; call: FakeBindingCall }> = [];
	cognifyCalls: Array<{ input: unknown; call: FakeBindingCall }> = [];
	searchCalls: Array<{ input: unknown; call: FakeBindingCall }> = [];
	failMode: 'none' | 'add' | 'cognify' | 'search' = 'none';
	searchProvider: (query: string) => KnowledgeCandidate[];

	constructor(searchProvider?: (query: string) => KnowledgeCandidate[]) {
		this.searchProvider =
			searchProvider ??
			((query) => {
				const words = query
					.toLowerCase()
					.split(/\W+/)
					.filter((w) => w.length > 2);
				const out: KnowledgeCandidate[] = [];
				for (const [dataset, items] of this.datasets) {
					if (!this.cognifiedDatasets.has(dataset)) continue;
					for (const item of items) {
						const lower = item.toLowerCase();
						if (words.some((w) => lower.includes(w))) {
							out.push({ text: item, score: 0.1 });
						}
					}
				}
				return out;
			});
	}

	supervision = { shutdown: async () => undefined };

	private bindingFor(id: string) {
		switch (id) {
			case 'cognee.add':
				return async (input: unknown, call: FakeBindingCall) => {
					this.addCalls.push({ input, call });
					if (this.failMode === 'add') throw new Error('FAKE-ADD-FAILURE');
					const { datasetName, content } = input as { datasetName: string; content: string };
					const items = this.datasets.get(datasetName) ?? [];
					this.datasets.set(datasetName, [...items, content]);
					return {
						datasetName,
						idempotencyKey: call.idempotencyKey,
						reconciled: 'fresh-execution',
						itemsAfter: items.length + 1,
						deduplicated: false
					};
				};
			case 'cognee.cognify':
				return async (input: unknown, call: FakeBindingCall) => {
					this.cognifyCalls.push({ input, call });
					if (this.failMode === 'cognify') throw new Error('FAKE-COGNIFY-FAILURE');
					const { datasetName } = input as { datasetName: string };
					this.cognifiedDatasets.add(datasetName);
					return { datasetName, reconciled: 'fresh-execution' };
				};
			case 'cognee.searchChunks':
				return async (input: unknown, call: FakeBindingCall) => {
					this.searchCalls.push({ input, call });
					if (this.failMode === 'search') throw new Error('FAKE-SEARCH-FAILURE');
					const { datasets, query, topK } = input as {
						datasets: string[];
						query: string;
						topK: number;
					};
					// Deterministic retrieval over the projected (cognified) scope:
					// a hit survives only when its dataset was cognified.
					const hits = this.searchProvider(query).filter(
						(h) => datasets.length === 0 || datasets.includes(PROJECTED_DATASET_NAME)
					);
					return { hits: hits.slice(0, topK), datasets, total: hits.length, truncated: false };
				};
			default:
				throw new Error(`FakeCogneePack: unexpected binding ${id}`);
		}
	}

	get() {
		return {
			bindings: {
				capabilities: ['cognee.add', 'cognee.cognify', 'cognee.searchChunks'].map((id) => ({
					id,
					invoke: (input: unknown, call: FakeBindingCall) => this.bindingFor(id)(input, call)
				}))
			},
			supervision: { shutdown: () => this.supervision.shutdown() }
		};
	}
}

/** The G2 projection dataset name asserted in tests (kept in one place). */
export const PROJECTED_DATASET_NAME = 'g2.meaning';
