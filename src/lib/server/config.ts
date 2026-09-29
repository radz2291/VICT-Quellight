/**
 * Quellight G1 server configuration.
 *
 * Every value is app-local server configuration; no credentials are read or
 * stored here beyond optional documented variable names. Secrets never reach
 * the browser or evidence (see frozen contract §8).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export interface StoreLocations {
	mastraStore: string;
}

export function resolveStoreLocations(baseDir?: string): StoreLocations {
	const root =
		baseDir ?? process.env.QUOLLIGHT_RUN_ROOT ?? path.resolve(here, '../../..', 'quellight/run');
	return { mastraStore: path.join(root, 'mastra-store') };
}

export interface KnowledgeConfig {
	pythonPath: string;
	storeRoot: string;
	namespaces: string[];
	/** When false (e.g. demo/test without a Python worker), knowledge is degraded at startup. */
	enabled: boolean;
}

export function resolveKnowledgeConfig(baseRunRoot?: string): KnowledgeConfig {
	const root =
		baseRunRoot ??
		process.env.QUOLLIGHT_RUN_ROOT ??
		path.resolve(here, '../../..', 'quellight/run');
	const pythonPath = process.env.QUOLLIGHT_COGNEE_PYTHON ?? '';
	return {
		enabled: process.env.QUOLLIGHT_COGNEE_DISABLED !== '1' && pythonPath.length > 0,
		pythonPath,
		storeRoot: path.join(root, 'cognee-store'),
		namespaces: ['g1']
	};
}

/**
 * QD-02 provider policy resolution.
 * At G1 the REQUIRED path is the deterministic offline fixture. A live
 * provider path would require a real provider wrapper on the VICT/Mastra
 * route, plus an already-configured credential. Neither exists on this host
 * (verified at freeze), so the model plan is the deterministic fixture and
 * the live proof is recorded as NOT RUN — reported truthfully, not faked.
 */
export interface ModelPlan {
	mode: 'deterministic-fixture';
	modelIdentity: string;
	liveStatus: 'NOT RUN — no authorized configured credential available';
}

export function resolveModelPlan(): ModelPlan {
	return {
		mode: 'deterministic-fixture',
		modelIdentity: 'offline-fixture/deterministic-1',
		liveStatus: 'NOT RUN — no authorized configured credential available'
	};
}

/**
 * W4 / automated failure-path knob: bounded, controlled dependency failure.
 * `none` is the default production path. Values:
 * - 'retrieval': knowledge intake/retrieval is exercised as unavailable;
 * - 'model': the model surface is exercised as failed.
 */
export type FaultInjection = 'none' | 'retrieval' | 'model';

export function resolveFaultInjection(): FaultInjection {
	const value = (process.env.QUOLLIGHT_FAULT ?? 'none').toLowerCase();
	return value === 'retrieval' || value === 'model' ? value : 'none';
}
