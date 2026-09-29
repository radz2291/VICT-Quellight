import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { executeTurn } from '$lib/server/quellight';

/**
 * Quellight G1 conversation endpoint.
 * POST { message: string } -> TurnResponse. Server-only composition; the
 * browser never touches VICT, Mastra, Cognee, the model surface, or config.
 */
export const POST: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		error(400, { message: 'Request body must be JSON.' });
	}
	const message =
		typeof payload === 'object' && payload !== null && 'message' in payload
			? (payload as { message: unknown }).message
			: undefined;
	if (typeof message !== 'string' || message.trim().length === 0 || message.length > 4000) {
		error(400, { message: 'message must be a non-empty string (max 4000 chars).' });
	}

	const result = await executeTurn(message.trim());
	if (result.response.kind === 'error') {
		// Model failure surfaces as failure — never converted to a fake answer.
		error(502, { message: result.response.message });
	}
	return json(result.response);
};