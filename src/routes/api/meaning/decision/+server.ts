import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { decideOnMeaning } from '$lib/server/quellight';

/**
 * POST /api/meaning/decision — { recordId, decision: 'accept' | 'reject' }.
 * Policy (frozen contract §7): only a PROPOSED record can be decided.
 * Accept records the decision timestamp and attempts Cognee projection
 * (accepted meaning only) with honest degradation; reject keeps the record
 * permanently ineligible.
 */
export const POST: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		error(400, { message: 'Request body must be JSON.' });
	}
	const recordId =
		typeof payload === 'object' && payload !== null && 'recordId' in payload
			? (payload as { recordId: unknown }).recordId
			: undefined;
	const decision =
		typeof payload === 'object' && payload !== null && 'decision' in payload
			? (payload as { decision: unknown }).decision
			: undefined;
	if (typeof recordId !== 'string' || recordId.length === 0 || recordId.length > 120) {
		error(400, { message: 'recordId must be a bounded non-empty string.' });
	}
	if (decision !== 'accept' && decision !== 'reject') {
		error(400, { message: "decision must be 'accept' or 'reject'." });
	}
	try {
		const result = await decideOnMeaning(recordId, decision);
		return json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		if (message.includes('Only proposed') || message.includes('No such meaning record')) {
			error(404, { message });
		}
		error(503, { message: `Meaning store unavailable: ${message}` });
	}
};
