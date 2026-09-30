import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { gracefulClose } from '$lib/server/quellight';

/**
 * Maintenance-shutdown endpoint — TEMPORARY bounded lifecycle seam (G1
 * finding F3, retained Low per G2 contract §12): clean worker/store shutdown
 * for restart proofs still requires it.
 * DISABLED unless QUOLLIGHT_MAINTENANCE_SHUTDOWN=1 (server-held env; never
 * exposed to the browser). Performs a clean VICT-Cognee supervision shutdown
 * (releases the store-owner lock) plus meaning-store/model close, then exits.
 * Inert on a normal deployment (404 unless gated).
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
