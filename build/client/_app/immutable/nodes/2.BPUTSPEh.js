import { a as N, f as R, c as De } from '../chunks/C2dSpk4b.js';
import { o as Me } from '../chunks/DzqdhXdc.js';
import {
	R as re,
	b as ke,
	T as we,
	h as A,
	e as ee,
	U as Ee,
	a as Ne,
	g as o,
	r as Ie,
	V as Oe,
	c as ce,
	i as ae,
	j,
	W as xe,
	X as Re,
	Y as he,
	Z as P,
	_ as O,
	$ as ie,
	a0 as He,
	a1 as Qe,
	w as Fe,
	a2 as ze,
	a3 as Ke,
	m as Le,
	a4 as ge,
	a5 as Ve,
	D as Ge,
	a6 as ye,
	a7 as Se,
	a8 as ne,
	a9 as We,
	aa as Ye,
	ab as qe,
	ac as Be,
	ad as Pe,
	ae as Je,
	af as ve,
	ag as Ue,
	ah as ue,
	ai as Xe,
	aj as pe,
	ak as Ze,
	B as je,
	u as $e,
	al as ea,
	y as aa,
	I as q,
	l as ta,
	A as ra,
	M as B,
	G as ia,
	J as W,
	F,
	s as y,
	am as sa,
	an as na,
	K as z,
	C as la,
	Q as U,
	ao as oa
} from '../chunks/CC4duI0-.js';
import { d as fa, a as le, s as X } from '../chunks/TZTxgFQI.js';
import { i as te, b as _e } from '../chunks/CNLbIbOl.js';
function ua(e, i, a) {
	for (var f = [], u = i.length, r, n = i.length, d = 0; d < u; d++) {
		let S = i[d];
		Se(
			S,
			() => {
				if (r) {
					if ((r.pending.delete(S), r.done.add(S), r.pending.size === 0)) {
						var p = e.outrogroups;
						(de(e, ve(r.done)), p.delete(r), p.size === 0 && (e.outrogroups = null));
					}
				} else n -= 1;
			},
			!1
		);
	}
	if (n === 0) {
		var s = f.length === 0 && a !== null && e.pending.size === 0;
		if (s) {
			var h = a,
				v = h.parentNode;
			(Be(v), v.append(h), e.items.clear());
		}
		de(e, i, !s);
	} else ((r = { pending: new Set(i), done: new Set() }), (e.outrogroups ??= new Set()).add(r));
}
function de(e, i, a = !0) {
	var f;
	if (e.pending.size > 0) {
		f = new Set();
		for (const n of e.pending.values()) for (const d of n) f.add(e.items.get(d).e);
	}
	for (var u = 0; u < i.length; u++) {
		var r = i[u];
		if (f?.has(r)) {
			r.f |= O;
			const n = document.createDocumentFragment();
			Pe(r, n);
		} else Je(i[u], a);
	}
}
var me;
function be(e, i, a, f, u, r = null) {
	var n = e,
		d = new Map(),
		s = (i & we) !== 0;
	if (s) {
		var h = e;
		n = A ? ee(Ee(h)) : h.appendChild(re());
	}
	A && Ne();
	var v = null,
		S = Fe(() => {
			var m = a();
			return Ue(m) ? m : m == null ? [] : ve(m);
		}),
		p,
		E = new Map(),
		T = !0;
	function H(m) {
		(I.effect.f & Ge) === 0 &&
			(I.pending.delete(m),
			(I.fallback = v),
			da(I, p, n, i, f),
			v !== null &&
				(p.length === 0
					? (v.f & O) === 0
						? ye(v)
						: ((v.f ^= O), $(v, null, n))
					: Se(v, () => {
							v = null;
						})));
	}
	function t(m) {
		I.pending.delete(m);
	}
	var g = ke(() => {
			p = o(S);
			var m = p.length;
			let k = !1;
			if (A) {
				var L = Ie(n) === Oe;
				L !== (m === 0) && ((n = ce()), ee(n), ae(!1), (k = !0));
			}
			for (var x = new Set(), w = P, l = Qe(), c = 0; c < m; c += 1) {
				A && j.nodeType === xe && j.data === Re && ((n = j), (k = !0), ae(!1));
				var _ = p[c],
					D = f(_, c),
					b = T ? null : d.get(D);
				(b
					? (b.v && he(b.v, _), b.i && he(b.i, c), l && w.unskip_effect(b.e))
					: ((b = va(d, T ? n : (me ??= re()), _, D, c, u, i, a)), T || (b.e.f |= O), d.set(D, b)),
					x.add(D));
			}
			if (
				(m === 0 &&
					r &&
					!v &&
					(T ? (v = ie(() => r(n))) : ((v = ie(() => r((me ??= re())))), (v.f |= O))),
				m > x.size && He(),
				A && m > 0 && ee(ce()),
				!T)
			)
				if ((E.set(w, x), l)) {
					for (const [C, V] of d) x.has(C) || w.skip_effect(V.e);
					(w.oncommit(H), w.ondiscard(t));
				} else H(w);
			(k && ae(!0), o(S));
		}),
		I = { effect: g, items: d, pending: E, outrogroups: null, fallback: v };
	((T = !1), A && (n = j));
}
function Z(e) {
	for (; e !== null && (e.f & Ye) === 0;) e = e.next;
	return e;
}
function da(e, i, a, f, u) {
	var r = (f & qe) !== 0,
		n = i.length,
		d = e.items,
		s = Z(e.effect.first),
		h,
		v = null,
		S,
		p = [],
		E = [],
		T,
		H,
		t,
		g;
	if (r)
		for (g = 0; g < n; g += 1)
			((T = i[g]),
				(H = u(T, g)),
				(t = d.get(H).e),
				(t.f & O) === 0 && (t.nodes?.a?.measure(), (S ??= new Set()).add(t)));
	for (g = 0; g < n; g += 1) {
		if (((T = i[g]), (H = u(T, g)), (t = d.get(H).e), e.outrogroups !== null))
			for (const _ of e.outrogroups) (_.pending.delete(t), _.done.delete(t));
		if (
			((t.f & ne) !== 0 && (ye(t), r && (t.nodes?.a?.unfix(), (S ??= new Set()).delete(t))),
			(t.f & O) !== 0)
		)
			if (((t.f ^= O), t === s)) $(t, null, a);
			else {
				var I = v ? v.next : s;
				(t === e.effect.last && (e.effect.last = t.prev),
					t.prev && (t.prev.next = t.next),
					t.next && (t.next.prev = t.prev),
					K(e, v, t),
					K(e, t, I),
					$(t, I, a),
					(v = t),
					(p = []),
					(E = []),
					(s = Z(v.next)));
				continue;
			}
		if (t !== s) {
			if (h !== void 0 && h.has(t)) {
				if (p.length < E.length) {
					var m = E[0],
						k;
					v = m.prev;
					var L = p[0],
						x = p[p.length - 1];
					for (k = 0; k < p.length; k += 1) $(p[k], m, a);
					for (k = 0; k < E.length; k += 1) h.delete(E[k]);
					(K(e, L.prev, x.next),
						K(e, v, L),
						K(e, x, m),
						(s = m),
						(v = x),
						(g -= 1),
						(p = []),
						(E = []));
				} else
					(h.delete(t),
						$(t, s, a),
						K(e, t.prev, t.next),
						K(e, t, v === null ? e.effect.first : v.next),
						K(e, v, t),
						(v = t));
				continue;
			}
			for (p = [], E = []; s !== null && s !== t;)
				((h ??= new Set()).add(s), E.push(s), (s = Z(s.next)));
			if (s === null) continue;
		}
		((t.f & O) === 0 && p.push(t), (v = t), (s = Z(t.next)));
	}
	if (e.outrogroups !== null) {
		for (const _ of e.outrogroups)
			_.pending.size === 0 && (de(e, ve(_.done)), e.outrogroups?.delete(_));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (s !== null || h !== void 0) {
		var w = [];
		if (h !== void 0) for (t of h) (t.f & ne) === 0 && w.push(t);
		for (; s !== null;) ((s.f & ne) === 0 && s !== e.fallback && w.push(s), (s = Z(s.next)));
		var l = w.length;
		if (l > 0) {
			var c = (f & we) !== 0 && n === 0 ? a : null;
			if (r) {
				for (g = 0; g < l; g += 1) w[g].nodes?.a?.measure();
				for (g = 0; g < l; g += 1) w[g].nodes?.a?.fix();
			}
			ua(e, w, c);
		}
	}
	r &&
		We(() => {
			if (S !== void 0) for (t of S) t.nodes?.a?.apply();
		});
}
function va(e, i, a, f, u, r, n, d) {
	var s = (n & ze) !== 0 ? ((n & Ke) === 0 ? Le(a, !1, !1) : ge(a)) : null,
		h = (n & Ve) !== 0 ? ge(u) : null;
	return {
		v: s,
		i: h,
		e: ie(
			() => (
				r(i, s ?? a, h ?? u, d),
				() => {
					e.delete(f);
				}
			)
		)
	};
}
function $(e, i, a) {
	if (e.nodes)
		for (
			var f = e.nodes.start, u = e.nodes.end, r = i && (i.f & O) === 0 ? i.nodes.start : a;
			f !== null;
		) {
			var n = ue(f);
			if ((r.before(f), f === u)) return;
			f = n;
		}
}
function K(e, i, a) {
	(i === null ? (e.effect.first = a) : (i.next = a),
		a === null ? (e.effect.last = i) : (a.prev = i));
}
function ca(e, i) {
	let a = null,
		f = A;
	var u;
	if (A) {
		a = j;
		for (var r = Ee(document.head); r !== null && (r.nodeType !== xe || r.data !== e);) r = ue(r);
		if (r === null) ae(!1);
		else {
			var n = ue(r);
			(r.remove(), ee(n));
		}
	}
	A || (u = document.head.appendChild(re()));
	try {
		ke(() => {
			var d = ie(() => i(u));
			((d.f |= Xe),
				A ||
					(d.nodes === null
						? (d.nodes = { start: u, end: u, a: null, t: null })
						: (d.nodes.end = u)));
		});
	} finally {
		f && (ae(!0), ee(a));
	}
}
function ha(e, i, a) {
	var f = e == null ? '' : '' + e;
	return ((f = f ? f + ' ' + i : i), f === '' ? null : f);
}
function ga(e, i, a, f, u, r) {
	var n = e[pe];
	if (A || n !== a || n === void 0) {
		var d = ha(a, f);
		((!A || d !== e.getAttribute('class')) &&
			(d == null ? e.removeAttribute('class') : (e.className = d)),
			(e[pe] = a));
	}
	return r;
}
function pa(e, i, a = i) {
	var f = new WeakSet();
	(Ze(e, 'input', async (u) => {
		var r = u ? e.defaultValue : e.value;
		if (((r = oe(e) ? fe(r) : r), a(r), P !== null && f.add(P), await je(), r !== (r = i()))) {
			var n = e.selectionStart,
				d = e.selectionEnd,
				s = e.value.length;
			if (((e.value = r ?? ''), d !== null)) {
				var h = e.value.length;
				n === d && d === s && h > s
					? ((e.selectionStart = h), (e.selectionEnd = h))
					: ((e.selectionStart = n), (e.selectionEnd = Math.min(d, h)));
			}
		}
	}),
		((A && e.defaultValue !== e.value) || ($e(i) == null && e.value)) &&
			(a(oe(e) ? fe(e.value) : e.value), P !== null && f.add(P)),
		ea(() => {
			var u = i();
			if (e === document.activeElement) {
				var r = P;
				if (f.has(r)) return;
			}
			(oe(e) && u === fe(e.value)) ||
				(e.type === 'date' && !u && !e.value) ||
				(u !== e.value && (e.value = u ?? ''));
		}));
}
function oe(e) {
	var i = e.type;
	return i === 'number' || i === 'range';
}
function fe(e) {
	return e === '' ? null : +e;
}
var _a = R(
		'<meta name="description" content="Quellight — your persistent cognitive partner (G1 walking slice)"/>'
	),
	ma = R('<p class="status degraded svelte-1uha8ag"> </p>'),
	ba = R(
		'<div class="row user svelte-1uha8ag"><div class="bubble user svelte-1uha8ag"> </div></div>'
	),
	ka = R('<div class="meta svelte-1uha8ag">answered using retrieved candidate context</div>'),
	wa = R(
		'<div class="meta svelte-1uha8ag">no candidate knowledge was retrieved for this turn</div>'
	),
	Ea = R(
		'<div class="row assistant svelte-1uha8ag"><div class="speaker svelte-1uha8ag">Quellight</div> <div class="bubble assistant svelte-1uha8ag"> </div> <!></div>'
	),
	xa = R('<div class="row note svelte-1uha8ag"><div role="status"> </div></div>'),
	ya = R(
		'<div class="row assistant svelte-1uha8ag"><div class="speaker svelte-1uha8ag">Quellight</div> <div class="bubble assistant thinking svelte-1uha8ag" role="status">Thinking<span class="dots">…</span></div></div>'
	),
	Sa = R('<button class="chip svelte-1uha8ag" type="button"> </button>'),
	Ta = R(
		'<div class="shell svelte-1uha8ag"><header class="svelte-1uha8ag"><div class="brand svelte-1uha8ag"><span class="mark svelte-1uha8ag" aria-hidden="true">✦</span> <span class="name svelte-1uha8ag">Quellight</span> <span class="tagline svelte-1uha8ag">walking proof · G1</span></div> <!></header> <main class="thread svelte-1uha8ag" aria-live="polite"><!> <!></main> <div class="chips svelte-1uha8ag" aria-label="Suggested demo prompts"></div> <footer class="svelte-1uha8ag"><textarea rows="2" placeholder="Message Quellight…" aria-label="Message Quellight" class="svelte-1uha8ag"></textarea> <button class="send svelte-1uha8ag" type="button">Send</button></footer></div>'
	);
function Ia(e, i) {
	aa(i, !0);
	let a = q(ta([])),
		f = q(''),
		u = q(!1),
		r = q(null),
		n = q(null),
		d = q(null),
		s = 0;
	const h = [
		{ label: 'Greet', text: 'Hello.' },
		{ label: 'Store a fact', text: 'My project codename is Zephyr.' },
		{ label: 'Ask recall', text: 'What is my project codename?' },
		{ label: 'Off-corpus check', text: 'What is my favorite color?' }
	];
	(Me(async () => {
		o(d)?.focus();
		try {
			const l = await fetch('/api/health');
			if (l.ok) {
				const c = await l.json();
				(y(
					r,
					c.knowledge.state === 'ready'
						? null
						: `Knowledge retrieval is unavailable in this session (${c.knowledge.detail ?? 'not ready'}). Quellight will answer without it.`,
					!0
				),
					o(a).push({
						kind: 'note',
						id: s++,
						tone: 'info',
						text: 'Deterministic G1 proof mode — model: deterministic offline fixture through VICT. Knowledge answers come only from what you store in this session store.'
					}));
			}
		} catch {
			o(a).push({
				kind: 'note',
				id: s++,
				tone: 'error',
				text: 'Could not reach the Quellight server.'
			});
		}
	}),
		ra(() => {
			o(n) && (o(n).scrollTop = o(n).scrollHeight);
		}));
	async function v(l) {
		const c = l.trim();
		if (!c || o(u)) return;
		y(f, '');
		const _ = {
			kind: 'note',
			id: s++,
			tone: 'info',
			text: 'Storing turn in durable knowledge and thinking…'
		};
		(y(a, [...o(a), { kind: 'user', id: s++, text: c }, _], !0), y(u, !0));
		const D = _.id;
		try {
			const b = await fetch('/api/turn', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: c })
			});
			if (
				(y(
					a,
					o(a).filter((C) => C.id !== D),
					!0
				),
				b.ok)
			) {
				const C = await b.json();
				if (C.kind === 'assistant') {
					const V = C.meta;
					(y(a, [...o(a), { kind: 'assistant', id: s++, text: C.text, meta: V }], !0),
						V.intakeDegraded &&
							y(
								a,
								[
									...o(a),
									{
										kind: 'note',
										id: s++,
										tone: 'info',
										text: 'Durable knowledge intake failed for this turn; earlier knowledge still applies.'
									}
								],
								!0
							),
						V.retrieval === 'unavailable' &&
							y(
								a,
								[
									...o(a),
									{
										kind: 'note',
										id: s++,
										tone: 'info',
										text: 'Knowledge retrieval was unavailable — answered without it. Nothing fabricated.'
									}
								],
								!0
							));
				}
			} else {
				const C = await b.json().catch(() => ({ message: b.statusText }));
				y(
					a,
					[
						...o(a),
						{
							kind: 'note',
							id: s++,
							tone: 'error',
							text: C.message ?? `Request failed (${b.status}).`
						}
					],
					!0
				);
			}
		} catch (b) {
			(y(
				a,
				o(a).filter((C) => C.id !== D),
				!0
			),
				y(
					a,
					[
						...o(a),
						{
							kind: 'note',
							id: s++,
							tone: 'error',
							text: `Quellight could not be reached: ${b instanceof Error ? b.message : String(b)}`
						}
					],
					!0
				));
		} finally {
			(y(u, !1), o(d)?.focus());
		}
	}
	function S(l) {
		l.key === 'Enter' && !l.shiftKey && (l.preventDefault(), v(o(f)));
	}
	var p = Ta();
	ca('1uha8ag', (l) => {
		var c = _a();
		(sa(() => {
			na.title = 'Quellight';
		}),
			N(l, c));
	});
	var E = W(p),
		T = F(W(E), 2);
	{
		var H = (l) => {
			var c = ma(),
				_ = U(c, !0);
			(B(() => X(_, o(r))), N(l, c));
		};
		te(T, (l) => {
			o(r) && l(H);
		});
	}
	z(E);
	var t = F(E, 2),
		g = W(t);
	be(
		g,
		17,
		() => o(a),
		(l) => l.id,
		(l, c) => {
			var _ = De(),
				D = la(_);
			{
				var b = (Q) => {
						var M = ba(),
							G = W(M),
							J = U(G, !0);
						(z(M), B(() => X(J, o(c).text)), N(Q, M));
					},
					C = (Q) => {
						var M = Ea(),
							G = F(W(M), 2),
							J = U(G, !0),
							Te = F(G, 2);
						{
							var Ce = (Y) => {
									var se = ka();
									N(Y, se);
								},
								Ae = (Y) => {
									var se = wa();
									N(Y, se);
								};
							te(Te, (Y) => {
								o(c).meta.retrieval === 'used' ? Y(Ce) : o(c).meta.retrieval === 'miss' && Y(Ae, 1);
							});
						}
						(z(M), B(() => X(J, o(c).text)), N(Q, M));
					},
					V = (Q) => {
						var M = xa(),
							G = W(M),
							J = U(G, !0);
						(z(M),
							B(() => {
								(ga(G, 1, `note-pill ${o(c).tone ?? ''}`, 'svelte-1uha8ag'), X(J, o(c).text));
							}),
							N(Q, M));
					};
				te(D, (Q) => {
					o(c).kind === 'user' ? Q(b) : o(c).kind === 'assistant' ? Q(C, 1) : Q(V, -1);
				});
			}
			N(l, _);
		}
	);
	var I = F(g, 2);
	{
		var m = (l) => {
			var c = ya();
			N(l, c);
		};
		te(I, (l) => {
			o(u) && l(m);
		});
	}
	(z(t),
		_e(
			t,
			(l) => y(n, l),
			() => o(n)
		));
	var k = F(t, 2);
	(be(
		k,
		21,
		() => h,
		(l) => l.text,
		(l, c) => {
			var _ = Sa(),
				D = U(_, !0);
			(B(() => {
				((_.disabled = o(u)), X(D, o(c).label));
			}),
				le('click', _, () => {
					v(o(c).text);
				}),
				N(l, _));
		}
	),
		z(k));
	var L = F(k, 2),
		x = W(L);
	(oa(x),
		_e(
			x,
			(l) => y(d, l),
			() => o(d)
		));
	var w = F(x, 2);
	(z(L),
		z(p),
		B(
			(l) => {
				((x.disabled = o(u)), (w.disabled = l));
			},
			[() => o(u) || o(f).trim().length === 0]
		),
		le('keydown', x, S),
		pa(
			x,
			() => o(f),
			(l) => y(f, l)
		),
		le('click', w, () => {
			v(o(f));
		}),
		N(e, p),
		ia());
}
fa(['click', 'keydown']);
export { Ia as component };
