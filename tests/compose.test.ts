import { describe, expect, it } from 'vitest';
import { G1_MAX_CANDIDATES, composeTurnInput } from '$lib/server/compose';

describe('frozen turn-input composer', () => {
	it('returns the bare question when no candidates exist', () => {
		expect(composeTurnInput('Hello.', [])).toBe('Hello.');
	});

	it('includes candidates verbatim in a labeled unverified block', () => {
		const composed = composeTurnInput('Q?', [{ text: ' A fact. ' }, { text: 'Another.' }]);
		expect(composed).toContain('[Retrieved knowledge candidates');
		expect(composed).toContain('[End retrieved candidates]');
		expect(composed).toContain('1. A fact.');
		expect(composed).toContain('2. Another.');
	});

	it('is deterministic: same inputs -> same output', () => {
		const a = composeTurnInput('Q?', [{ text: 'X' }]);
		const b = composeTurnInput('Q?', [{ text: 'X' }]);
		expect(a).toBe(b);
	});

	it('bounds candidates conservatively', () => {
		const many = Array.from({ length: 20 }, (_, i) => ({ text: `note ${i}` }));
		const composed = composeTurnInput('Q?', many);
		expect(composed).not.toContain('note 5');
		expect(composed).toContain('note 4');
		expect(G1_MAX_CANDIDATES).toBe(5);
	});
});