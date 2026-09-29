import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureKnowledge, serverStatus } from '$lib/server/quellight';

/** GET -> server/model/knowledge status. Starts knowledge init in the background;
 * state is reported honestly (initializing until it settles). */
export const GET: RequestHandler = async () => {
	void ensureKnowledge().catch(() => undefined);
	return json(await serverStatus());
};
