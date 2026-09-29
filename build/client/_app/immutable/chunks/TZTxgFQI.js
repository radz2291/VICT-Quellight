import {
	d as te,
	as as D,
	at as N,
	au as G,
	o as m,
	av as re,
	g as J,
	al as se,
	u as ie,
	aw as P,
	a9 as w,
	a4 as U,
	j as p,
	h as g,
	ax as $,
	b as ne,
	a as ae,
	V as fe,
	ay as q,
	$ as u,
	R as X,
	az as T,
	Z as _,
	a7 as x,
	ad as he,
	aA as oe,
	aB as W,
	aC as le,
	ap as K,
	Y as de,
	ae as C,
	e as O,
	aD as ce,
	c as _e,
	E as ue,
	aE as pe,
	aF as ge,
	aG as ve,
	aH as M,
	U as ye,
	W as Z,
	H as me,
	ah as be,
	aI as Y,
	i as S,
	aJ as Ee,
	ac as Te,
	aK as we,
	af as ke,
	y as Re,
	aq as Se,
	X as Ae,
	aL as De,
	G as Ne,
	aM as j
} from './CC4duI0-.js';
import { b as Oe } from './C2dSpk4b.js';
const k = Symbol('events'),
	Q = new Set(),
	V = new Set();
function Le(r, e, t) {
	(e[k] ??= {})[r] = t;
}
function Pe(r) {
	for (var e = 0; e < r.length; e++) Q.add(r[e]);
	for (var t of V) t(r);
}
let H = null,
	I = !1;
function z(r) {
	var e = this,
		t = e.ownerDocument,
		n = r.type,
		i = r.composedPath?.() || [],
		s = i[0] || r.target;
	((H = r),
		I ||
			((I = !0),
			setTimeout(() => {
				((I = !1), (H = null));
			})));
	var a = 0,
		l = H === r && r[k];
	if (l) {
		var d = i.indexOf(l);
		if (d !== -1 && (e === document || e === window)) {
			r[k] = e;
			return;
		}
		var R = i.indexOf(e);
		if (R === -1) return;
		d <= R && (a = d);
	}
	if (((s = i[a] || r.target), s !== e)) {
		te(r, 'currentTarget', {
			configurable: !0,
			get() {
				return s || t;
			}
		});
		var v = G,
			b = m;
		(D(null), N(null));
		try {
			for (var c, h = []; s !== null && s !== e;) {
				try {
					var o = s[k]?.[n];
					o != null && (!s.disabled || r.target === s) && o.call(s, r);
				} catch (f) {
					c ? h.push(f) : (c = f);
				}
				if (r.cancelBubble) break;
				(a++, (s = a < i.length ? i[a] : null));
			}
			if (c) {
				for (let f of h)
					queueMicrotask(() => {
						throw f;
					});
				throw c;
			}
		} finally {
			((r[k] = e), delete r.currentTarget, D(v), N(b));
		}
	}
}
const Fe = ['touchstart', 'touchmove'];
function xe(r) {
	return Fe.includes(r);
}
function Ce(r) {
	let e = 0,
		t = U(0),
		n;
	return () => {
		re() &&
			(J(t),
			se(
				() => (
					e === 0 && (n = ie(() => r(() => P(t)))),
					(e += 1),
					() => {
						w(() => {
							((e -= 1), e === 0 && (n?.(), (n = void 0), P(t)));
						});
					}
				)
			));
	};
}
var He = ue | pe;
function Ie(r, e, t, n) {
	new Me(r, e, t, n);
}
class Me {
	parent;
	is_pending = !1;
	transform_error;
	#r;
	#u = g ? p : null;
	#n;
	#o;
	#e;
	#s = null;
	#t = null;
	#i = null;
	#a = null;
	#l = 0;
	#h = 0;
	#c = !1;
	#p = new Set();
	#g = new Set();
	#f = null;
	#E = Ce(
		() => (
			(this.#f = U(this.#l)),
			() => {
				this.#f = null;
			}
		)
	);
	constructor(e, t, n, i) {
		((this.#r = e),
			(this.#n = t),
			(this.#o = (s) => {
				var a = m;
				((a.b = this), (a.f |= $), n(s));
			}),
			(this.parent = m.b),
			(this.transform_error = i ?? this.parent?.transform_error ?? ((s) => s)),
			(this.#e = ne(() => {
				if (g) {
					const s = this.#u;
					ae();
					const a = s.data === fe;
					if (s.data.startsWith(q)) {
						const d = JSON.parse(s.data.slice(q.length));
						this.#w(d);
					} else a ? this.#k() : this.#T();
				} else this.#y();
			}, He)),
			g && (this.#r = p));
	}
	#T() {
		try {
			this.#s = u(() => this.#o(this.#r));
		} catch (e) {
			this.error(e);
		}
	}
	#w(e) {
		const t = this.#n.failed,
			{ reset: n, invoke_onerror: i } = this.#v(e);
		(w(i),
			t &&
				(this.#i = u(() => {
					t(
						this.#r,
						() => e,
						() => n
					);
				})));
	}
	#v(e) {
		var t = !1,
			n = !1;
		const i = () => {
			if (t) {
				ge();
				return;
			}
			((t = !0),
				n && ve(),
				this.#i !== null &&
					x(this.#i, () => {
						this.#i = null;
					}),
				this.#_(() => {
					this.#y();
				}));
		};
		return {
			reset: i,
			invoke_onerror: () => {
				try {
					((n = !0), this.#n.onerror?.(e, i), (n = !1));
				} catch (a) {
					T(a, this.#e && this.#e.parent);
				}
			}
		};
	}
	#k() {
		const e = this.#n.pending;
		e &&
			((this.is_pending = !0),
			(this.#t = u(() => e(this.#r))),
			w(() => {
				var t = (this.#a = document.createDocumentFragment()),
					n = X(),
					i = !1;
				if (
					(t.append(n),
					(this.#s = this.#_(() => {
						try {
							return u(() => this.#o(n));
						} catch (s) {
							try {
								(this.error(s), (i = !0));
							} catch (a) {
								T(a, this.#e.parent);
							}
							return null;
						}
					})),
					this.#s === null)
				) {
					((this.#a = null), i && this.#d(_));
					return;
				}
				this.#h === 0 &&
					(this.#r.before(t),
					(this.#a = null),
					x(this.#t, () => {
						this.#t = null;
					}),
					this.#d(_));
			}));
	}
	#y() {
		try {
			if (
				((this.is_pending = this.has_pending_snippet()),
				(this.#h = 0),
				(this.#l = 0),
				(this.#s = u(() => {
					this.#o(this.#r);
				})),
				this.#h > 0)
			) {
				var e = (this.#a = document.createDocumentFragment());
				he(this.#s, e);
				const t = this.#n.pending;
				this.#t = u(() => t(this.#r));
			} else this.#d(_);
		} catch (t) {
			this.error(t);
		}
	}
	#d(e) {
		((this.is_pending = !1), e.transfer_effects(this.#p, this.#g));
	}
	defer_effect(e) {
		oe(e, this.#p, this.#g);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#_(e) {
		var t = m,
			n = G,
			i = K;
		(N(this.#e), D(this.#e), W(this.#e.ctx));
		try {
			return (le.ensure(), e());
		} finally {
			(N(t), D(n), W(i));
		}
	}
	#m(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#m(e, t);
			return;
		}
		((this.#h += e),
			this.#h === 0 &&
				(this.#d(t),
				this.#t &&
					x(this.#t, () => {
						this.#t = null;
					}),
				this.#a && (this.#r.before(this.#a), (this.#a = null))));
	}
	update_pending_count(e, t) {
		(this.#m(e, t),
			(this.#l += e),
			!(!this.#f || this.#c) &&
				((this.#c = !0),
				w(() => {
					((this.#c = !1), this.#f && de(this.#f, this.#l));
				})));
	}
	get_effect_pending() {
		return (this.#E(), J(this.#f));
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		_?.is_fork
			? (this.#s && _.skip_effect(this.#s),
				this.#t && _.skip_effect(this.#t),
				this.#i && _.skip_effect(this.#i),
				_.oncommit(() => {
					this.#b(e);
				}))
			: this.#b(e);
	}
	#b(e) {
		(this.#s && (C(this.#s), (this.#s = null)),
			this.#t && (C(this.#t), (this.#t = null)),
			this.#i && (C(this.#i), (this.#i = null)),
			g && (O(this.#u), ce(), O(_e())));
		let t = this.#n.failed;
		const n = (i) => {
			const { reset: s, invoke_onerror: a } = this.#v(i);
			(a(),
				t &&
					(this.#i = this.#_(() => {
						try {
							return u(() => {
								var l = m;
								((l.b = this),
									(l.f |= $),
									t(
										this.#r,
										() => i,
										() => s
									));
							});
						} catch (l) {
							return (T(l, this.#e.parent), null);
						}
					})));
		};
		w(() => {
			var i;
			try {
				i = this.transform_error(e);
			} catch (s) {
				T(s, this.#e && this.#e.parent);
				return;
			}
			i !== null && typeof i == 'object' && typeof i.then == 'function'
				? i.then(n, (s) => T(s, this.#e && this.#e.parent))
				: n(i);
		});
	}
}
function $e(r, e) {
	var t = e == null ? '' : typeof e == 'object' ? `${e}` : e;
	t !== (r[j] ??= r.nodeValue) && ((r[j] = t), (r.nodeValue = `${t}`));
}
function Ye(r, e) {
	return ee(r, e);
}
function qe(r, e) {
	(M(), (e.intro = e.intro ?? !1));
	const t = e.target,
		n = g,
		i = p;
	try {
		for (var s = ye(t); s && (s.nodeType !== Z || s.data !== me);) s = be(s);
		if (!s) throw Y;
		(S(!0), O(s));
		const a = ee(r, { ...e, anchor: s });
		return (S(!1), a);
	} catch (a) {
		if (
			a instanceof Error &&
			a.message
				.split(
					`
`
				)
				.some((l) => l.startsWith('https://svelte.dev/e/'))
		)
			throw a;
		return (
			a !== Y && console.warn('Failed to hydrate: ', a),
			e.recover === !1 && Ee(),
			M(),
			Te(t),
			S(!1),
			Ye(r, e)
		);
	} finally {
		(S(n), O(i));
	}
}
const A = new Map();
function ee(
	r,
	{ target: e, anchor: t, props: n = {}, events: i, context: s, intro: a = !0, transformError: l }
) {
	M();
	var d = void 0,
		R = we(() => {
			var v = t ?? e.appendChild(X());
			Ie(
				v,
				{ pending: () => {} },
				(h) => {
					Re({});
					var o = K;
					if (
						(s && (o.c = s),
						i && (n.$$events = i),
						g && Oe(h, null),
						(d = r(h, n) || Se()),
						g && ((m.nodes.end = p), p === null || p.nodeType !== Z || p.data !== Ae))
					)
						throw (De(), Y);
					Ne();
				},
				l
			);
			var b = new Set(),
				c = (h) => {
					for (var o = 0; o < h.length; o++) {
						var f = h[o];
						if (!b.has(f)) {
							b.add(f);
							var E = xe(f);
							for (const F of [e, document]) {
								var y = A.get(F);
								y === void 0 && ((y = new Map()), A.set(F, y));
								var L = y.get(f);
								L === void 0
									? (F.addEventListener(f, z, { passive: E }), y.set(f, 1))
									: y.set(f, L + 1);
							}
						}
					}
				};
			return (
				c(ke(Q)),
				V.add(c),
				() => {
					for (var h of b)
						for (const E of [e, document]) {
							var o = A.get(E),
								f = o.get(h);
							--f == 0
								? (E.removeEventListener(h, z), o.delete(h), o.size === 0 && A.delete(E))
								: o.set(h, f);
						}
					(V.delete(c), v !== t && v.parentNode?.removeChild(v));
				}
			);
		});
	return (B.set(d, R), d);
}
let B = new WeakMap();
function We(r, e) {
	const t = B.get(r);
	return t ? (B.delete(r), t(e)) : Promise.resolve();
}
export { Le as a, Pe as d, qe as h, Ye as m, $e as s, We as u };
