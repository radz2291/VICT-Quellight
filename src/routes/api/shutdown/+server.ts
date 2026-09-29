import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gracefulClose } from '$lib/server/quellight';

/**
 * Maintenance-shutdown endpoint — G1 bounded lifecycle seam.
 * DISABLED unless QUOLLIGHT_MAINTENANCE_SHUTDOWN=1 (server-held env; never
 * exposed to the browser). Performs a clean VICT-Cognee supervision shutdown
 * (releases the store-owner lock) plus store close, then exits the process.
 * Used by the G1 proof/restart walkthrough; inert on a normal deployment.
 */
export const POST: RequestHandler = async () => {
	if (process.env.QUOLLIGHT_MAINTENANCE_SHUTDOWN !== '1') {
		error(404, { message: 'Not found.' });
	}
	const result = await gracefulClose();
	const body = json({ ok: true, detail: result });
	// Exit only after the response is flushed.
	setTimeout(() => process.exit(0), 300);
	return body;
};
