import { e as error, j as json } from './index.js-pdQxrlwa.js';
import { e as executeTurn } from './quellight-29t6ux1E.js';
import 'node:path';
import 'node:url';
import '@victframework/mastra';
import '@victframework/cognee';
import '@victframework/runtime';
import '@victframework/sdk';

const POST = async ({ request }) => {
	let payload;
	try {
		payload = await request.json();
	} catch {
		error(400, { message: 'Request body must be JSON.' });
	}
	const message =
		typeof payload === 'object' && payload !== null && 'message' in payload
			? payload.message
			: void 0;
	if (typeof message !== 'string' || message.trim().length === 0 || message.length > 4e3) {
		error(400, { message: 'message must be a non-empty string (max 4000 chars).' });
	}
	const result = await executeTurn(message.trim());
	if (result.response.kind === 'error') {
		error(502, { message: result.response.message });
	}
	return json(result.response);
};

export { POST };
//# sourceMappingURL=_server.ts-LEnvQbKu.js.map
