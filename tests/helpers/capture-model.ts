/**
 * Capturing double around the REAL deterministic fixture model (frozen
 * G2 contract §6, retaining the G1 pattern): records the prompts the REAL
 * pinned Mastra agent loop passes to the model surface, then delegates to
 * the fixture model. Records ALL roles (system included) so tests can assert
 * the anti-fabrication instruction and eligible meaning reach the real
 * model call — closing G1 audit finding F8's assertion gap.
 */

import type { DeterministicOfflineModel } from '@victframework/mastra';

export class CapturedCalls {
	/** User-role texts per model call (composed turn inputs). */
	prompts: string[][] = [];
	/** All-role texts per model call (system instructions included). */
	calls: Array<Array<{ role: string; text: string }>> = [];

	clear(): void {
		this.prompts.splice(0);
		this.calls.splice(0);
	}

	/** Latest call's texts for one role. */
	lastUserText(): string | undefined {
		return this.prompts.at(-1)?.at(-1);
	}

	/** All texts across all calls for one role. */
	allTextsForRole(role: string): string {
		return this.calls
			.flat()
			.filter((m) => m.role === role)
			.map((m) => m.text)
			.join('\n|||\n');
	}
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
					const all: Array<{ role: string; text: string }> = [];
					for (const message of callOptions.prompt) {
						if (Array.isArray(message.content)) {
							for (const part of message.content) {
								if (typeof part === 'string') {
									const text = part;
									all.push({ role: message.role, text });
									if (message.role === 'user') {
										texts.push(text);
									}
								} else if (
									typeof part === 'object' &&
									part !== null &&
									'text' in part &&
									typeof (part as { text: unknown }).text === 'string'
								) {
									const text = (part as { text: string }).text;
									all.push({ role: message.role, text });
									if (message.role === 'user') {
										texts.push(text);
									}
								}
							}
						} else if (typeof message.content === 'string') {
							const text = message.content;
							all.push({ role: message.role, text });
							if (message.role === 'user') {
								texts.push(text);
							}
						}
					}
					captured.calls.push(all);
					captured.prompts.push(texts);
					return target.doStream(callOptions as never);
				};
			}
			const value = Reflect.get(target, prop, target);
			return typeof value === 'function' ? value.bind(target) : value;
		}
	}) as DeterministicOfflineModel;
}
