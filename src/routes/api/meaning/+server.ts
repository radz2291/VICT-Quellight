import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { meaningInspector } from '$lib/server/quellight';

/**
 * GET /api/meaning — the Meaning Inspector's canonical view (G2).
 * Only derived data is exposed: current, proposed, and history views with
 * provenance. Canonical truth remains in VICT Application Data.
 */
export const GET: RequestHandler = async () => {
	try {
		const data = await meaningInspector();
		return json(data);
	} catch (e) {
		error(503, {
			message: `Meaning store unavailable: ${e instanceof Error ? e.message : String(e)}`
		});
	}
};
