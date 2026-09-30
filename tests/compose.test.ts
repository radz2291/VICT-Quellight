/**
 * Frozen G2 composer + extraction-schema tests (contract §6/§10).
 */

import { describe, expect, it } from 'vitest';
import { ELIGIBLE_MEANING_LABEL, G2_MAX_CANDIDATES, composeTurnInput } from '$lib/server/compose';
import {
	carveJson,
	composeExtractionInput,
	parseExtractionOutput
} from '$lib/server/meaning-extraction';

describe('G2 composer', () => {
	it('returns the bare question when no eligible meaning exists', () => {
		expect(composeTurnInput('What is my project codename?', [])).toBe(
			'What is my project codename?'
		);
	});

	it('includes eligible meaning under the canonical-checked label with provenance', () => {
		const composed = composeTurnInput(
			'What is my project codename?',
			[{ text: 'project.codename = "Orion" [user_stated, source: turn-2]' }],
			{ label: ELIGIBLE_MEANING_LABEL }
		);
		expect(composed).toContain(ELIGIBLE_MEANING_LABEL);
		expect(composed).toContain('project.codename = "Orion"');
		expect(composed).toContain('Current question');
	});

	it('bounds the included items (evidence-free bound)', () => {
		const many = Array.from({ length: G2_MAX_CANDIDATES + 2 }, (_, i) => ({ text: `k${i}=v${i}` }));
		const composed = composeTurnInput('q', many, { label: ELIGIBLE_MEANING_LABEL });
		expect(composed).toContain(`1. k0=v0`);
		expect(composed).toContain(`${G2_MAX_CANDIDATES}. k${G2_MAX_CANDIDATES - 1}`);
		expect(composed).not.toContain(`k${G2_MAX_CANDIDATES}`);
	});

	it('never drops the deterministic structure the fixture keys on', () => {
		const composed = composeTurnInput('Q?', [{ text: 'a=b' }]);
		expect(composed).toBe(
			[
				'[Retrieved knowledge candidates — unverified; may or may not be relevant.]',
				'1. a=b',
				'[End retrieved candidates]',
				'',
				'Current question:',
				'Q?'
			].join('\n')
		);
	});
});

describe('G2 bounded extraction (closed schema)', () => {
	it('composes a deterministic extraction prompt', () => {
		const input = composeExtractionInput('Remember that the project codename is Zephyr.');
		expect(input).toContain('Remember that the project codename is Zephyr.');
		expect(input).toContain('"intent"');
	});

	it('carves bounded JSON only', () => {
		expect(carveJson('The model says: {"intent":"none"} — done.')).toBe('{"intent":"none"}');
		expect(carveJson('no json here')).toBeUndefined();
		expect(carveJson('{"a":1}')).toBe('{"a":1}');
	});

	it('rejects raw output with unknown fields (model output never writes directly)', () => {
		const parsed = parseExtractionOutput(
			'{"intent":"remember","semanticKey":"project.codename","value":"Zephyr","autoAccept":true}'
		);
		expect(parsed.kind).toBe('invalid');
		expect(parsed.candidate).toBeUndefined();
	});

	it('rejects invalid enums wholesale', () => {
		const parsed = parseExtractionOutput('{"intent":"auto_accept_everything"}');
		expect(parsed.kind).toBe('invalid');
	});

	it('accepts a well-formed remember candidate', () => {
		const parsed = parseExtractionOutput(
			'{"intent":"remember","semanticKey":"project.codename","value":"Zephyr"}'
		);
		expect(parsed.kind).toBe('candidate');
		expect(parsed.candidate).toEqual({
			intent: 'remember',
			semanticKey: 'project.codename',
			value: 'Zephyr'
		});
	});

	it('treats empty output as none (no write)', () => {
		expect(parseExtractionOutput('I have no durable candidates.').kind).toBe('none');
		expect(parseExtractionOutput('').kind).toBe('none');
	});
});
