/**
 * Capturing double around the REAL deterministic fixture model (frozen
 * contract §6): records the prompt the REAL pinned Mastra agent loop passes
 * to the model surface, then delegates to the fixture model. This proves
 * retrieved context reached the ProductAgent path without replacing the
 * mandated deterministic fixture.
 */

import type { DeterministicOfflineModel } from '@victframework/mastra';

export class CapturedCalls {
	prompts: string[][] = [];
}

export function withPromptCapture(
	model: DeterministicOfflineModel,
	captured: CapturedCalls
): DeterministicOfflineModel {
	return new Proxy(model, {
		get(target, prop, receiver) {
			if (prop === 'doStream') {
				return async (callOptions: { prompt: Array<{ role: string; content: unknown[] }> }) => {
					const texts: string[] = [];
					for (const message of callOptions.prompt) {
						if (message.role === 'user' && Array.isArray(message.content)) {
							for (const part of message.content) {
								if (
									typeof part === 'object' &&
									part !== null &&
									'text' in part &&
									typeof (part as { text: unknown }).text === 'string'
								) {
									texts.push((part as { text: string }).text);
								}
							}
						}
					}
					captured.prompts.push(texts);
					return target.doStream(callOptions as never);
				};
			}
			const value = Reflect.get(target, prop, target);
			return typeof value === 'function' ? value.bind(target) : value;
		}
	}) as DeterministicOfflineModel;
}
