import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverStatus } from '$lib/server/quellight';

/** GET -> server/model/knowledge status for the footer chip. */
export const GET: RequestHandler = async () => {
	return json(await serverStatus());
};
