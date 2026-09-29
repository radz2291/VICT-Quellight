import {
	h as head,
	c as ensure_array_like,
	b as escape_html,
	d as attr_class,
	f as stringify,
	i as attr
} from './index.js-pdQxrlwa.js';

function _page($$renderer, $$props) {
	$$renderer.component(($$renderer2) => {
		let messages = [];
		let input = '';
		let busy = false;
		const DEMO_PROMPTS = [
			{ label: 'Greet', text: 'Hello.' },
			{
				label: 'Store a fact',
				text: 'My project codename is Zephyr.'
			},
			{ label: 'Ask recall', text: 'What is my project codename?' },
			{
				label: 'Off-corpus check',
				text: 'What is my favorite color?'
			}
		];
		head('1uha8ag', $$renderer2, ($$renderer3) => {
			$$renderer3.title(($$renderer4) => {
				$$renderer4.push(`<title>Quellight</title>`);
			});
			$$renderer3.push(
				`<meta name="description" content="Quellight — your persistent cognitive partner (G1 walking slice)"/>`
			);
		});
		$$renderer2.push(
			`<div class="shell svelte-1uha8ag"><header class="svelte-1uha8ag"><div class="brand svelte-1uha8ag"><span class="mark svelte-1uha8ag" aria-hidden="true">✦</span> <span class="name svelte-1uha8ag">Quellight</span> <span class="tagline svelte-1uha8ag">walking proof · G1</span></div> `
		);
		{
			$$renderer2.push('<!--[-1-->');
		}
		$$renderer2.push(
			`<!--]--></header> <main class="thread svelte-1uha8ag" aria-live="polite"><!--[-->`
		);
		const each_array = ensure_array_like(messages);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let message = each_array[$$index];
			if (message.kind === 'user') {
				$$renderer2.push(
					`<!--[0--><div class="row user svelte-1uha8ag"><div class="bubble user svelte-1uha8ag">${escape_html(message.text)}</div></div>`
				);
			} else if (message.kind === 'assistant') {
				$$renderer2.push(
					`<!--[1--><div class="row assistant svelte-1uha8ag"><div class="speaker svelte-1uha8ag">Quellight</div> <div class="bubble assistant svelte-1uha8ag">${escape_html(message.text)}</div> `
				);
				if (message.meta.retrieval === 'used') {
					$$renderer2.push(
						`<!--[0--><div class="meta svelte-1uha8ag">answered using retrieved candidate context</div>`
					);
				} else if (message.meta.retrieval === 'miss') {
					$$renderer2.push(
						`<!--[1--><div class="meta svelte-1uha8ag">no candidate knowledge was retrieved for this turn</div>`
					);
				} else {
					$$renderer2.push('<!--[-1-->');
				}
				$$renderer2.push(`<!--]--></div>`);
			} else {
				$$renderer2.push(
					`<!--[-1--><div class="row note svelte-1uha8ag"><div${attr_class(`note-pill ${stringify(message.tone)}`, 'svelte-1uha8ag')} role="status">${escape_html(message.text)}</div></div>`
				);
			}
			$$renderer2.push(`<!--]-->`);
		}
		$$renderer2.push(`<!--]--> `);
		{
			$$renderer2.push('<!--[-1-->');
		}
		$$renderer2.push(
			`<!--]--></main> <div class="chips svelte-1uha8ag" aria-label="Suggested demo prompts"><!--[-->`
		);
		const each_array_1 = ensure_array_like(DEMO_PROMPTS);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let demo = each_array_1[$$index_1];
			$$renderer2.push(
				`<button class="chip svelte-1uha8ag" type="button"${attr('disabled', busy, true)}>${escape_html(demo.label)}</button>`
			);
		}
		$$renderer2.push(
			`<!--]--></div> <footer class="svelte-1uha8ag"><textarea rows="2" placeholder="Message Quellight…" aria-label="Message Quellight"${attr('disabled', busy, true)} class="svelte-1uha8ag">`
		);
		const $$body = escape_html(input);
		if ($$body) {
			$$renderer2.push(`${$$body}`);
		}
		$$renderer2.push(
			`</textarea> <button class="send svelte-1uha8ag" type="button"${attr('disabled', input.trim().length === 0, true)}>Send</button></footer></div>`
		);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DSC5AouR.js.map
