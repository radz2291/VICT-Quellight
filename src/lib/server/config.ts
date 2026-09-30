/**
 * Quellight G2 server configuration.
 *
 * Every value is app-local server configuration; no credentials are read or
 * stored here beyond optional documented variable names. Secrets never reach
 * the browser or evidence (G1 frozen contract §8, retained).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export interface StoreLocations {
	mastraStore: string;
	/** Canonical Meaning Store (VICT Application Data, real on-disk SQLite file). */
	meaningStore: string;
}

export function resolveStoreLocations(baseDir?: string): StoreLocations {
	const root =
		baseDir ?? process.env.QUOLLIGHT_RUN_ROOT ?? path.resolve(here, '../../..', 'quellight/run');
	return {
		mastraStore: path.join(root, 'mastra-store'),
		meaningStore: path.join(root, 'meaning', 'appdata.sqlite')
	};
}

export interface MeaningStoreConfig {
	/** SQLite file path (real on-disk database — restart durability). */
	path: string;
	/** Always enabled at runtime; degraded only when creation fails. */
	enabled: boolean;
}

export function resolveMeaningStoreConfig(baseRunRoot?: string): MeaningStoreConfig {
	const locations = resolveStoreLocations(baseRunRoot);
	return { path: locations.meaningStore, enabled: true };
}

export interface KnowledgeConfig {
	pythonPath: string;
	storeRoot: string;
	namespaces: string[];
	/** When false (e.g. demo/test without a Python worker), Cognee is degraded at startup. */
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
		namespaces: ['g2']
	};
}

/**
 * QD-02 provider policy resolution (retained from G1, still binding).
 * The REQUIRED path is the deterministic offline fixture. A live provider
 * path would require a real provider wrapper plus an already-configured
 * credential; neither exists on this host, so the plan is the deterministic
 * fixture and the live proof remains recorded NOT RUN (truthful).
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
 * Bounded, controlled dependency failure knob (G1 W4 pattern, extended):
 * `none` is the default production path. Values:
 * - 'retrieval': Cognee retrieval is exercised as unavailable;
 * - 'cognee': Cognee PROJECTION (add/cognify) fails — canonical write keeps truth;
 * - 'extraction': the extraction model lane fails (degrades honestly, no write);
 * - 'model': the main model surface is exercised as failed.
 */
export type FaultInjection = 'none' | 'retrieval' | 'model' | 'cognee' | 'extraction';

export function resolveFaultInjection(): FaultInjection {
	const value = (process.env.QUOLLIGHT_FAULT ?? 'none').toLowerCase();
	return ['retrieval', 'model', 'cognee', 'extraction'].includes(value)
		? (value as Exclude<FaultInjection, 'none'>)
		: 'none';
}
