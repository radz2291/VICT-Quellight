import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureKnowledge, ensureMeaning, serverStatus } from '$lib/server/quellight';

/** GET -> server/model/knowledge/meaning status. Starts both stores' init in
 * the background; state is reported honestly (initializing until settled). */
export const GET: RequestHandler = async () => {
	void ensureKnowledge().catch(() => undefined);
	void ensureMeaning().catch(() => undefined);
	return json(await serverStatus());
};
