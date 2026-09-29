const Fn = 32;
const wn = 128;
const yn = 8192,
	On = 16384,
	In = 32768,
	gn = 33554432,
	mn = 65536;
const Sn = 262144,
	bn = 524288;
const Yn = 33554432;
const de = Symbol('$state'),
	je = Symbol('component'),
	Ln = Symbol('legacy props'),
	Nt = Symbol('attributes'),
	Ft = Symbol('class'),
	wt = Symbol('style'),
	yt = Symbol('text'),
	ie = Symbol('form reset'),
	ne = new (class extends Error {
		name = 'StaleReactionError';
		message = 'The reaction that called `getAbortSignal()` was re-run or destroyed';
	})(),
	Ee = 3,
	Ke = 8,
	qe = !1;
var Ot = Array.isArray,
	It = Array.prototype.indexOf,
	fe = Array.prototype.includes,
	xn = Array.from,
	gt = Object.defineProperty,
	Z = Object.getOwnPropertyDescriptor,
	mt = Object.prototype,
	St = Array.prototype,
	bt = Object.getPrototypeOf,
	ke = Object.isExtensible;
const Yt = () => {};
function Lt(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function ze() {
	var e,
		t,
		n = new Promise((r, s) => {
			((e = r), (t = s));
		});
	return { promise: n, resolve: e, reject: t };
}
function Xe(e) {
	return e === this.v;
}
function kt(e, t) {
	return e != e
		? t == t
		: e !== t || (e !== null && typeof e == 'object') || typeof e == 'function';
}
function $e(e) {
	return !kt(e, this.v);
}
function xt() {
	throw new Error('https://svelte.dev/e/async_derived_orphan');
}
function Pn(e, t, n) {
	throw new Error('https://svelte.dev/e/each_key_duplicate');
}
function Pt(e) {
	throw new Error('https://svelte.dev/e/effect_in_teardown');
}
function Bt() {
	throw new Error('https://svelte.dev/e/effect_in_unowned_derived');
}
function Mt(e) {
	throw new Error('https://svelte.dev/e/effect_orphan');
}
function Vt() {
	throw new Error('https://svelte.dev/e/effect_update_depth_exceeded');
}
function Bn() {
	throw new Error('https://svelte.dev/e/hydration_failed');
}
function Mn(e) {
	throw new Error('https://svelte.dev/e/props_invalid_value');
}
function Ut() {
	throw new Error('https://svelte.dev/e/state_descriptors_fixed');
}
function Ht() {
	throw new Error('https://svelte.dev/e/state_prototype_fixed');
}
function Gt() {
	throw new Error('https://svelte.dev/e/state_unsafe_mutation');
}
function Vn() {
	throw new Error('https://svelte.dev/e/svelte_boundary_reset_onerror');
}
let jt = !1;
const Un = 1,
	Hn = 2,
	Gn = 4,
	jn = 8,
	Kn = 16,
	qn = 1,
	zn = 4,
	Xn = 8,
	$n = 16,
	Zn = 1,
	Jn = 2,
	Kt = '[',
	qt = '[!',
	Qn = '[?',
	zt = ']',
	Ne = {},
	R = Symbol('uninitialized');
let F = null;
function ue(e) {
	F = e;
}
function Wn(e, t = !1, n) {
	F = { p: F, i: !1, c: null, e: null, s: e, x: null, r: h, l: null };
}
function er(e) {
	var t = F,
		n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) pt(r);
	}
	return ((t.i = !0), (F = t.p), Xt(e));
}
function Xt(e = {}) {
	return (gt(e, je, { value: !0 }), e);
}
function Ze() {
	return !0;
}
let M = [];
function Je() {
	var e = M;
	((M = []), Lt(e));
}
function xe(e) {
	if (M.length === 0 && !J) {
		var t = M;
		queueMicrotask(() => {
			t === M && Je();
		});
	}
	M.push(e);
}
function $t() {
	for (; M.length > 0;) Je();
}
function Zt() {
	console.warn('https://svelte.dev/e/derived_inert');
}
function Fe(e) {
	console.warn('https://svelte.dev/e/hydration_mismatch');
}
function tr() {
	console.warn('https://svelte.dev/e/svelte_boundary_reset_noop');
}
let S = !1;
function nr(e) {
	S = e;
}
let D;
function j(e) {
	if (e === null) throw (Fe(), Ne);
	return (D = e);
}
function rr() {
	return j(x(D));
}
function Jt(e) {
	if (S) {
		if (x(D) !== null) throw (Fe(), Ne);
		D = e;
	}
}
function sr(e = 1) {
	if (S) {
		for (var t = e, n = D; t--;) n = x(n);
		D = n;
	}
}
function ir(e = !0) {
	for (var t = 0, n = D; ;) {
		if (n.nodeType === Ke) {
			var r = n.data;
			if (r === zt) {
				if (t === 0) return n;
				t -= 1;
			} else (r === Kt || r === qt || (r[0] === '[' && !isNaN(Number(r.slice(1))))) && (t += 1);
		}
		var s = x(n);
		(e && n.remove(), (n = s));
	}
}
function lr(e) {
	if (!e || e.nodeType !== Ke) throw (Fe(), Ne);
	return e.data;
}
function z(e) {
	if (typeof e != 'object' || e === null || de in e || je in e) return e;
	const t = bt(e);
	if (t !== mt && t !== St) return e;
	var n = new Map(),
		r = Ot(e),
		s = b(0),
		i = U,
		f = (l) => {
			if (U === i) return l();
			var a = v,
				u = U;
			(k(null), He(i));
			var _ = l();
			return (k(a), He(u), _);
		};
	return (
		r && n.set('length', b(e.length)),
		new Proxy(e, {
			defineProperty(l, a, u) {
				(!('value' in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) &&
					Ut();
				var _ = n.get(a);
				return (
					_ === void 0
						? f(() => {
								var o = b(u.value);
								return (n.set(a, o), o);
							})
						: P(_, u.value, !0),
					!0
				);
			},
			deleteProperty(l, a) {
				var u = n.get(a);
				if (u === void 0) {
					if (a in l) {
						const _ = f(() => b(R));
						(n.set(a, _), Te(s));
					}
				} else (P(u, R), Te(s));
				return !0;
			},
			get(l, a, u) {
				if (a === de) return e;
				var _ = n.get(a),
					o = a in l;
				if (
					(_ === void 0 &&
						(!o || Z(l, a)?.writable) &&
						((_ = f(() => {
							var c = z(o ? l[a] : R),
								d = b(c);
							return d;
						})),
						n.set(a, _)),
					_ !== void 0)
				) {
					var E = $(_);
					return E === R ? void 0 : E;
				}
				return Reflect.get(l, a, u);
			},
			getOwnPropertyDescriptor(l, a) {
				this.has?.(l, a);
				var u = Reflect.getOwnPropertyDescriptor(l, a),
					_ = n.get(a);
				if (_ !== void 0) {
					var o = $(_);
					if (o === R) return;
					if (u && 'value' in u) u.value = o;
					else return { enumerable: !0, configurable: !0, value: o, writable: !0 };
				}
				return u;
			},
			has(l, a) {
				if (a === de) return !0;
				var u = n.get(a),
					_ = (u !== void 0 && u.v !== R) || Reflect.has(l, a);
				if (u !== void 0 || (h !== null && (!_ || Z(l, a)?.writable))) {
					u === void 0 &&
						((u = f(() => {
							var E = _ ? z(l[a]) : R,
								c = b(E);
							return c;
						})),
						n.set(a, u));
					var o = $(u);
					if (o === R) return !1;
				}
				return _;
			},
			set(l, a, u, _) {
				var o = n.get(a),
					E = a in l;
				if (r && a === 'length')
					for (var c = u; c < o.v; c += 1) {
						var d = n.get(c + '');
						d !== void 0 ? P(d, R) : c in l && ((d = f(() => b(R))), n.set(c + '', d));
					}
				if (o === void 0)
					(!E || Z(l, a)?.writable) && ((o = f(() => b(void 0))), P(o, z(u)), n.set(a, o));
				else {
					E = o.v !== R;
					var At = f(() => z(u));
					P(o, At);
				}
				var Ye = Reflect.getOwnPropertyDescriptor(l, a);
				if ((Ye?.set && Ye.set.call(_, u), !E)) {
					if (r && typeof a == 'string') {
						var Le = n.get('length'),
							ve = Number(a);
						Number.isInteger(ve) && ve >= Le.v && P(Le, ve + 1);
					}
					Te(s);
				}
				return !0;
			},
			ownKeys(l) {
				$(s);
				var a = Reflect.ownKeys(l).filter((o) => {
					var E = n.get(o);
					return E === void 0 || E.v !== R;
				});
				for (var [u, _] of n) _.v !== R && !(u in l) && a.push(u);
				return a;
			},
			setPrototypeOf() {
				Ht();
			}
		})
	);
}
var Pe, Qt, Wt, Qe, We;
function ar() {
	if (Pe === void 0) {
		((Pe = window), (Qt = document), (Wt = /Firefox/.test(navigator.userAgent)));
		var e = Element.prototype,
			t = Node.prototype,
			n = Text.prototype;
		((Qe = Z(t, 'firstChild').get),
			(We = Z(t, 'nextSibling').get),
			ke(e) && ((e[Ft] = void 0), (e[Nt] = null), (e[wt] = void 0), (e.__e = void 0)),
			ke(n) && (n[yt] = void 0));
	}
}
function oe(e = '') {
	return document.createTextNode(e);
}
function W(e) {
	return Qe.call(e);
}
function x(e) {
	return We.call(e);
}
function en(e, t) {
	if (!S) return W(e);
	var n = W(D);
	if (n === null) n = D.appendChild(oe());
	else if (t && n.nodeType !== Ee) {
		var r = oe();
		return (n?.before(r), j(r), r);
	}
	return (t && we(n), j(n), n);
}
function fr(e, t = !1) {
	if (!S) {
		var n = W(e);
		return n instanceof Comment && n.data === '' ? x(n) : n;
	}
	if (t) {
		if (D?.nodeType !== Ee) {
			var r = oe();
			return (D?.before(r), j(r), r);
		}
		we(D);
	}
	return D;
}
function ur(e, t = !1) {
	if (!S) return W(e);
	var n = en(e, t);
	return (Jt(e), n);
}
function or(e, t = 1, n = !1) {
	let r = S ? D : e;
	for (var s; t--;) ((s = r), (r = x(r)));
	if (!S) return r;
	if (n) {
		if (r?.nodeType !== Ee) {
			var i = oe();
			return (r === null ? s?.after(i) : r.before(i), j(i), i);
		}
		we(r);
	}
	return (j(r), r);
}
function tn(e) {
	e.textContent = '';
}
function cr() {
	return !1;
}
function _r(e, t, n) {
	return n ? document.createElement(e, { is: n }) : document.createElement(e);
}
function we(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === Ee;)
		(t.remove(), (e.nodeValue += t.nodeValue), (t = e.nextSibling));
}
function nn(e) {
	var t = h;
	if (t === null) return ((v.f |= 8388608), e);
	if ((t.f & 32768) === 0 && (t.f & 4) === 0) throw e;
	ee(e, t);
}
function ee(e, t) {
	if (!(t !== null && (t.f & 16384) !== 0)) {
		for (; t !== null;) {
			if ((t.f & 128) !== 0 && (t.f & 33570816) === 0) {
				if ((t.f & 32768) === 0) throw e;
				try {
					t.b.error(e);
					return;
				} catch (n) {
					e = n;
				}
			}
			t = t.parent;
		}
		throw e;
	}
}
const rn = -7169;
function T(e, t) {
	e.f = (e.f & rn) | t;
}
function ye(e) {
	(e.f & 512) !== 0 || e.deps === null ? T(e, 1024) : T(e, 4096);
}
function sn(e, t, n) {
	((e.f & 2048) !== 0 ? t.add(e) : (e.f & 4096) !== 0 && n.add(e), T(e, 1024));
}
function Er(e) {
	S && W(e) !== null && tn(e);
}
let Be = !1;
function ln() {
	Be ||
		((Be = !0),
		document.addEventListener(
			'reset',
			(e) => {
				Promise.resolve().then(() => {
					if (!e.defaultPrevented) for (const t of e.target.elements) t[ie]?.();
				});
			},
			{ capture: !0 }
		));
}
function re(e) {
	var t = v,
		n = h;
	(k(null), K(null));
	try {
		return e();
	} finally {
		(k(t), K(n));
	}
}
function vr(e, t, n, r = n) {
	e.addEventListener(t, () => re(n));
	const s = e[ie];
	(s
		? (e[ie] = () => {
				(s(), r(!0));
			})
		: (e[ie] = () => r(!0)),
		ln());
}
function an(e, t, n, r) {
	const s = Oe;
	var i = e.filter((c) => !c.settled),
		f = t.map(s);
	if (n.length === 0 && i.length === 0) {
		r(f);
		return;
	}
	var l = h,
		a = fn(),
		u = i.length === 1 ? i[0].promise : i.length > 1 ? Promise.all(i.map((c) => c.promise)) : null;
	function _(c) {
		if ((l.f & 16384) === 0) {
			a();
			try {
				r([...f, ...c]);
			} catch (d) {
				ee(d, l);
			}
			ce();
		}
	}
	var o = et();
	if (n.length === 0) {
		u.then(() => _([])).finally(o);
		return;
	}
	function E() {
		Promise.all(n.map((c) => un(c)))
			.then(_)
			.catch((c) => ee(c, l))
			.finally(o);
	}
	u
		? u.then(() => {
				(a(), E(), ce());
			})
		: E();
}
function fn() {
	var e = h,
		t = v,
		n = F,
		r = p;
	return function (i = !0) {
		(K(e), k(t), ue(n), i && (e.f & 16384) === 0 && (r?.activate(), r?.apply()));
	};
}
function ce(e = !0) {
	(K(null), k(null), ue(null), e && p?.deactivate());
}
function et() {
	var e = h,
		t = e.b,
		n = p,
		r = !!t?.is_rendered();
	return (
		t?.update_pending_count(1, n),
		n.increment(r, e),
		() => {
			(t?.update_pending_count(-1, n), n.decrement(r, e));
		}
	);
}
function Oe(e) {
	var t = 2050;
	return (
		h !== null && (h.f |= 524288),
		{
			ctx: F,
			deps: null,
			effects: null,
			equals: Xe,
			f: t,
			fn: e,
			reactions: null,
			rv: 0,
			v: R,
			wv: 0,
			parent: h,
			ac: null
		}
	);
}
const X = Symbol('obsolete');
function un(e, t, n) {
	let r = h;
	r === null && xt();
	var s = void 0,
		i = Se(R),
		f = !v,
		l = new Set();
	return (
		Cn(() => {
			var a = h,
				u = ze();
			s = u.promise;
			try {
				Promise.resolve(e())
					.then(u.resolve, (c) => {
						c !== ne && u.reject(c);
					})
					.finally(ce);
			} catch (c) {
				(u.reject(c), ce());
			}
			var _ = p;
			if (f) {
				if ((a.f & 32768) !== 0) var o = et();
				if (r.b?.is_rendered()) _.async_deriveds.get(a)?.reject(X);
				else for (const c of l.values()) c.reject(X);
				(l.add(u), _.async_deriveds.set(a, u));
			}
			const E = (c, d = void 0) => {
				(o?.(),
					l.delete(u),
					d !== X &&
						(_.activate(),
						d
							? ((i.f |= 8388608), Ae(i, d))
							: ((i.f & 8388608) !== 0 && (i.f ^= 8388608), Ae(i, c)),
						_.deactivate()));
			};
			u.promise.then(E, (c) => E(null, c || 'unknown'));
		}),
		Rn(() => {
			for (const a of l) a.reject(X);
		}),
		new Promise((a) => {
			function u(_) {
				function o() {
					_ === s ? a(i) : u(s);
				}
				_.then(o, o);
			}
			u(s);
		})
	);
}
function dr(e) {
	const t = Oe(e);
	return (ft(t), t);
}
function hr(e) {
	const t = Oe(e);
	return ((t.equals = $e), t);
}
function on(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) H(t[n]);
	}
}
function Ie(e) {
	var t,
		n = h,
		r = e.parent;
	if (!L && r !== null && e.v !== R && (r.f & 24576) !== 0) return (Zt(), e.v);
	K(r);
	try {
		(on(e), (t = _t(e)));
	} finally {
		K(n);
	}
	return t;
}
function tt(e) {
	var t = Ie(e);
	if (
		!e.equals(t) &&
		((e.wv = ot()),
		(!p?.is_fork || e.deps === null) &&
			(p !== null ? (p.capture(e, t, !0), Re?.capture(e, t, !0)) : (e.v = t), e.deps === null))
	) {
		T(e, 1024);
		return;
	}
	L || (w !== null ? (ht() || p?.is_fork) && w.set(e, t) : ye(e));
}
function cn(e) {
	if (e.effects !== null)
		for (const t of e.effects)
			(t.teardown || t.ac) &&
				(t.teardown?.(),
				t.ac !== null &&
					re(() => {
						(t.ac.abort(ne), (t.ac = null));
					}),
				t.fn !== null && (t.teardown = Yt),
				te(t, 0),
				be(t));
}
function nt(e) {
	if (e.effects !== null) for (const t of e.effects) t.teardown && t.fn !== null && q(t);
}
let he = null,
	G = null,
	p = null,
	Re = null,
	w = null,
	Ce = null,
	J = !1,
	pe = !1,
	Q = null,
	le = null;
var Me = 0;
let _n = 1;
class Y {
	id = _n++;
	#c = !1;
	linked = !0;
	#i = null;
	#a = null;
	async_deriveds = new Map();
	current = new Map();
	previous = new Map();
	#_ = new Set();
	#E = new Set();
	#v = 0;
	#r = new Map();
	#d = null;
	#e = [];
	#p = [];
	#s = new Set();
	#t = new Set();
	#n = new Map();
	#h = new Set();
	is_fork = !1;
	#f = !1;
	constructor() {
		(G === null ? (he = G = this) : ((G.#a = this), (this.#i = G)), (G = this));
	}
	#T() {
		if (this.is_fork) return !0;
		for (const r of this.#r.keys()) {
			for (var t = r, n = !1; t.parent !== null;) {
				if (this.#n.has(t)) {
					n = !0;
					break;
				}
				t = t.parent;
			}
			if (!n) return !0;
		}
		return !1;
	}
	skip_effect(t) {
		(this.#n.has(t) || this.#n.set(t, { d: [], m: [] }), this.#h.delete(t));
	}
	unskip_effect(t, n = (r) => this.schedule(r)) {
		var r = this.#n.get(t);
		if (r) {
			this.#n.delete(t);
			for (var s of r.d) (T(s, 2048), n(s));
			for (s of r.m) (T(s, 4096), n(s));
		}
		this.#h.add(t);
	}
	#R() {
		var t = [];
		for (const i of this.#e)
			if (!((i.f & 16384) !== 0 || (i.f & 6144) === 0)) {
				for (var n = i, r = !1; n.parent !== null;) {
					n = n.parent;
					var s = n.f;
					if ((s & 96) !== 0) {
						if ((s & 1024) === 0) {
							r = !0;
							break;
						}
						n.f ^= 1024;
					}
				}
				r || t.push(n);
			}
		return ((this.#e = []), t);
	}
	#u() {
		this.#c = !0;
		for (const l of this.#s) (this.#t.delete(l), T(l, 2048), this.schedule(l));
		for (const l of this.#t) (T(l, 4096), this.schedule(l));
		this.apply();
		for (var t = (Q = []), n = [], r = (le = []); this.#e.length > 0;) {
			Me++ > 1e3 && (this.#o(), vn());
			for (const l of this.#R())
				try {
					this.#C(l, t, n);
				} catch (a) {
					throw (it(l), this.#T() || this.discard(), a);
				}
		}
		if (((p = null), r.length > 0)) {
			var s = Y.ensure();
			for (const l of r) s.schedule(l);
		}
		if (((Q = null), (le = null), this.#T())) {
			(this.#l(n), this.#l(t));
			for (const [l, a] of this.#n) st(l, a);
			r.length > 0 && p.#u();
			return;
		}
		const i = this.#D();
		if (i) {
			(this.#l(n), this.#l(t), i.#A(this));
			return;
		}
		(this.#s.clear(), this.#t.clear());
		for (const l of this.#_) l(this);
		(this.#_.clear(), (Re = this), Ve(n), Ve(t), (Re = null), this.#d?.resolve());
		var f = p;
		if ((this.#v === 0 && (this.#e.length === 0 || f !== null) && this.#o(), this.#e.length > 0))
			if (f !== null) {
				for (const l of this.#e) f.#e.push(l);
				this.#e = [];
			} else f = this;
		f !== null && (O.clear(), f.#u());
	}
	#C(t, n, r) {
		t.f ^= 1024;
		for (var s = t.first; s !== null;) {
			var i = s.f,
				f = (i & 96) !== 0,
				l = f && (i & 1024) !== 0,
				a = l || (i & 8192) !== 0 || this.#n.has(s);
			if (!a && s.fn !== null) {
				f
					? (s.f ^= 1024)
					: (i & 4) !== 0
						? n.push(s)
						: se(s) && ((i & 16) !== 0 && this.#t.add(s), q(s));
				var u = s.first;
				if (u !== null) {
					s = u;
					continue;
				}
			}
			for (; s !== null;) {
				var _ = s.next;
				if (_ !== null) {
					s = _;
					break;
				}
				s = s.parent;
			}
		}
	}
	#D() {
		for (var t = this.#i; t !== null;) {
			if (!t.is_fork) {
				for (const [n, [, r]] of this.current) if (t.current.has(n) && !r) return t;
			}
			t = t.#i;
		}
		return null;
	}
	#A(t) {
		for (const [r, s] of t.current)
			(!this.previous.has(r) && t.previous.has(r) && this.previous.set(r, t.previous.get(r)),
				this.current.set(r, s));
		for (const [r, s] of t.async_deriveds) {
			const i = this.async_deriveds.get(r);
			i && s.promise.then(i.resolve).catch(i.reject);
		}
		(t.async_deriveds.clear(), this.transfer_effects(t.#s, t.#t));
		const n = (r) => {
			var s = r.reactions;
			if (s !== null && !((r.f & 2) !== 0 && (r.f & 6144) === 0))
				for (const l of s) {
					var i = l.f;
					if ((i & 2) !== 0) n(l);
					else {
						var f = l;
						i & 4194320 &&
							!this.async_deriveds.has(f) &&
							(this.#t.delete(f), T(f, 2048), this.schedule(f));
					}
				}
		};
		for (const r of this.current.keys()) n(r);
		(this.oncommit(() => t.discard()), t.#o(), (p = this), this.#u());
	}
	#l(t) {
		for (var n = 0; n < t.length; n += 1) sn(t[n], this.#s, this.#t);
	}
	capture(t, n, r = !1) {
		(t.v !== R && !this.previous.has(t) && this.previous.set(t, t.v),
			(t.f & 8388608) === 0 && (this.current.set(t, [n, r]), w?.set(t, n)),
			this.is_fork || (t.v = n));
	}
	activate() {
		p = this;
	}
	deactivate() {
		((p = null), (w = null));
	}
	flush() {
		try {
			((pe = !0), (p = this), this.#u());
		} finally {
			((Me = 0),
				(Ce = null),
				(Q = null),
				(le = null),
				(pe = !1),
				(p = null),
				(w = null),
				O.clear());
		}
	}
	discard() {
		for (const t of this.#E) t(this);
		this.#E.clear();
		for (const t of this.async_deriveds.values()) t.reject(X);
		(this.#o(), this.#d?.resolve());
	}
	register_created_effect(t) {
		this.#p.push(t);
	}
	#N() {
		for (let o = he; o !== null; o = o.#a) {
			var t = o.id < this.id,
				n = [];
			for (const [E, [c, d]] of this.current) {
				if (o.current.has(E)) {
					var r = o.current.get(E)[0];
					if (t && c !== r) o.current.set(E, [c, d]);
					else continue;
				}
				n.push(E);
			}
			if (t)
				for (const [E, c] of this.async_deriveds) {
					const d = o.async_deriveds.get(E);
					d && c.promise.then(d.resolve).catch(d.reject);
				}
			var s = [...o.current.keys()].filter((E) => !o.current.get(E)[1]);
			if (!(!o.#c || s.length === 0)) {
				var i = s.filter((E) => !this.current.has(E));
				if (i.length === 0) t && o.discard();
				else if (n.length > 0) {
					if (t)
						for (const E of this.#h)
							o.unskip_effect(E, (c) => {
								(c.f & 4194320) !== 0 ? o.schedule(c) : o.#l([c]);
							});
					o.activate();
					var f = new Set(),
						l = new Map();
					for (var a of n) rt(a, i, f, l);
					l = new Map();
					var u = [...o.current]
						.filter(([E, c]) => {
							const d = this.current.get(E);
							return d ? d[0] !== c[0] || d[1] !== c[1] : !0;
						})
						.map(([E]) => E);
					if (u.length > 0)
						for (const E of this.#p)
							(E.f & 155648) === 0 &&
								ge(E, u, l) &&
								((E.f & 4194320) !== 0 ? (T(E, 2048), o.schedule(E)) : o.#s.add(E));
					if (o.#e.length > 0 && !o.#f) {
						o.apply();
						for (var _ of o.#R()) o.#C(_, [], []);
					}
					o.deactivate();
				}
			}
		}
	}
	increment(t, n) {
		if (((this.#v += 1), t)) {
			let r = this.#r.get(n) ?? 0;
			this.#r.set(n, r + 1);
		}
	}
	decrement(t, n) {
		if (((this.#v -= 1), t)) {
			let r = this.#r.get(n) ?? 0;
			r === 1 ? this.#r.delete(n) : this.#r.set(n, r - 1);
		}
		this.#f ||
			((this.#f = !0),
			xe(() => {
				((this.#f = !1), this.linked && this.flush());
			}));
	}
	transfer_effects(t, n) {
		for (const r of t) this.#s.add(r);
		for (const r of n) this.#t.add(r);
		(t.clear(), n.clear());
	}
	oncommit(t) {
		this.#_.add(t);
	}
	ondiscard(t) {
		this.#E.add(t);
	}
	settled() {
		return (this.#d ??= ze()).promise;
	}
	static ensure() {
		if (p === null) {
			const t = (p = new Y());
			!pe &&
				!J &&
				xe(() => {
					t.#c || t.flush();
				});
		}
		return p;
	}
	apply() {
		{
			w = null;
			return;
		}
	}
	schedule(t) {
		if (((Ce = t), t.b?.is_pending && (t.f & 16777228) !== 0 && (t.f & 32768) === 0)) {
			t.b.defer_effect(t);
			return;
		}
		this.#e.push(t);
	}
	#o() {
		if (this.linked) {
			var t = this.#i,
				n = this.#a;
			(t === null ? (he = n) : (t.#a = n), n === null ? (G = t) : (n.#i = t), (this.linked = !1));
		}
	}
}
function En(e) {
	var t = J;
	J = !0;
	try {
		for (var n; ;) {
			if (($t(), p === null)) return n;
			p.flush();
		}
	} finally {
		J = t;
	}
}
function vn() {
	try {
		Vt();
	} catch (e) {
		ee(e, Ce);
	}
}
let m = null;
function Ve(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (
				(r.f & 24576) === 0 &&
				se(r) &&
				((m = new Set()),
				q(r),
				r.deps === null &&
					r.first === null &&
					r.nodes === null &&
					r.teardown === null &&
					r.ac === null &&
					Rt(r),
				m?.size > 0)
			) {
				O.clear();
				for (const s of m) {
					if ((s.f & 24576) !== 0) continue;
					const i = [s];
					let f = s.parent;
					for (; f !== null;) (m.has(f) && (m.delete(f), i.push(f)), (f = f.parent));
					for (let l = i.length - 1; l >= 0; l--) {
						const a = i[l];
						(a.f & 24576) === 0 && q(a);
					}
				}
				m.clear();
			}
		}
		m = null;
	}
}
function rt(e, t, n, r) {
	if (!n.has(e) && (n.add(e), e.reactions !== null))
		for (const s of e.reactions) {
			const i = s.f;
			(i & 2) !== 0
				? rt(s, t, n, r)
				: (i & 4194320) !== 0 && (i & 2048) === 0 && ge(s, t, r) && (T(s, 2048), me(s));
		}
}
function ge(e, t, n) {
	const r = n.get(e);
	if (r !== void 0) return r;
	if (e.deps !== null)
		for (const s of e.deps) {
			if (fe.call(t, s)) return !0;
			if ((s.f & 2) !== 0 && ge(s, t, n)) return (n.set(s, !0), !0);
		}
	return (n.set(e, !1), !1);
}
function me(e) {
	p.schedule(e);
}
function st(e, t) {
	if (!((e.f & 32) !== 0 && (e.f & 1024) !== 0)) {
		((e.f & 2048) !== 0 ? t.d.push(e) : (e.f & 4096) !== 0 && t.m.push(e), T(e, 1024));
		for (var n = e.first; n !== null;) (st(n, t), (n = n.next));
	}
}
function it(e) {
	T(e, 1024);
	for (var t = e.first; t !== null;) (it(t), (t = t.next));
}
let _e = new Set();
const O = new Map();
let lt = !1;
function Se(e, t) {
	var n = { f: 0, v: e, reactions: null, equals: Xe, rv: 0, wv: 0 };
	return n;
}
function b(e, t) {
	const n = Se(e);
	return (ft(n), n);
}
function pr(e, t = !1, n = !0) {
	const r = Se(e);
	return (t || (r.equals = $e), r);
}
function P(e, t, n = !1) {
	v !== null &&
		(!y || (v.f & 131072) !== 0) &&
		Ze() &&
		(v.f & 4325394) !== 0 &&
		(I === null || !I.has(e)) &&
		Gt();
	let r = n ? z(t) : t;
	return Ae(e, r, le);
}
var B = null,
	De = 0;
function Ae(e, t, n = null) {
	if (!e.equals(t)) {
		L ? O.set(e, t) : O.has(e) || O.set(e, e.v);
		var r = Y.ensure();
		if ((r.capture(e, t), (e.f & 2) !== 0)) {
			const s = e;
			((e.f & 2048) !== 0 && Ie(s), w === null && ye(s));
		}
		((e.wv = ot()),
			(B = null),
			(De = 0),
			at(e, 2048, n),
			(B = null),
			h !== null && (h.f & 1024) !== 0 && (h.f & 96) === 0 && (N === null ? hn([e]) : N.push(e)),
			!r.is_fork && _e.size > 0 && !lt && dn());
	}
	return t;
}
function dn() {
	lt = !1;
	for (const e of _e) {
		(e.f & 1024) !== 0 && T(e, 4096);
		let t;
		try {
			t = se(e);
		} catch {
			t = !0;
		}
		t && q(e);
	}
	_e.clear();
}
function Te(e) {
	P(e, e.v + 1);
}
function at(e, t, n) {
	var r = e.reactions;
	if (r !== null) {
		var s = r.length;
		if (((De += s), De > 1e5 && B === null && (B = new Set()), B !== null)) {
			if (B.has(e)) return;
			B.add(e);
		}
		for (var i = 0; i < s; i++) {
			var f = r[i],
				l = f.f,
				a = (l & 2048) === 0;
			if ((a && T(f, t), (l & 131072) !== 0)) _e.add(f);
			else if ((l & 2) !== 0) {
				var u = f;
				(w?.delete(u), at(u, 4096, n));
			} else if (a) {
				var _ = f;
				((l & 16) !== 0 && m !== null && m.add(_), n !== null ? n.push(_) : me(_));
			}
		}
	}
}
let ae = !1,
	L = !1;
function Ue(e) {
	L = e;
}
let v = null,
	y = !1;
function k(e) {
	v = e;
}
let h = null;
function K(e) {
	h = e;
}
let I = null;
function ft(e) {
	v !== null && ((v.f & 2097152) !== 0 || (v.f & 2) !== 0) && (I ??= new Set()).add(e);
}
let C = null,
	A = 0,
	N = null;
function hn(e) {
	N = e;
}
let ut = 1,
	V = 0,
	U = V;
function He(e) {
	U = e;
}
function ot() {
	return ++ut;
}
function se(e) {
	var t = e.f;
	if ((t & 2048) !== 0) return !0;
	if ((t & 4096) !== 0) {
		for (var n = e.deps, r = n.length, s = 0; s < r; s++) {
			var i = n[s];
			if ((se(i) && tt(i), i.wv > e.wv)) return !0;
		}
		(t & 512) !== 0 && w === null && T(e, 1024);
	}
	return !1;
}
function ct(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(I !== null && I.has(e)))
		for (var s = 0; s < r.length; s++) {
			var i = r[s];
			(i.f & 2) !== 0
				? ct(i, t, !1)
				: t === i && (n ? T(i, 2048) : (i.f & 1024) !== 0 && T(i, 4096), me(i));
		}
}
function _t(e) {
	var t = C,
		n = A,
		r = N,
		s = v,
		i = I,
		f = F,
		l = y,
		a = U,
		u = e.f;
	((C = null),
		(A = 0),
		(N = null),
		(v = (u & 96) === 0 ? e : null),
		(I = null),
		ue(e.ctx),
		(y = !1),
		(U = ++V),
		e.ac !== null &&
			(re(() => {
				e.ac.abort(ne);
			}),
			(e.ac = null)));
	try {
		e.f |= 2097152;
		var _ = e.fn,
			o = _();
		e.f |= 32768;
		var E = Ge(e);
		if (Ze() && N !== null && !y && E !== null && (e.f & 6146) === 0)
			for (var c = 0; c < N.length; c++) ct(N[c], e);
		if (s !== null && s !== e) {
			if ((V++, s.deps !== null)) for (let d = 0; d < n; d += 1) s.deps[d].rv = V;
			if (t !== null) for (const d of t) d.rv = V;
			N !== null && (r === null ? (r = N) : r.push(...N));
		}
		return ((e.f & 8388608) !== 0 && (e.f ^= 8388608), o);
	} catch (d) {
		return (Ge(e), nn(d));
	} finally {
		((e.f ^= 2097152), (C = t), (A = n), (N = r), (v = s), (I = i), ue(f), (y = l), (U = a));
	}
}
function Ge(e) {
	var t = e.deps,
		n = p?.is_fork;
	if (C !== null) {
		var r;
		if ((n || te(e, A), t !== null && A > 0))
			for (t.length = A + C.length, r = 0; r < C.length; r++) t[A + r] = C[r];
		else e.deps = t = C;
		if (ht() && (e.f & 512) !== 0) for (r = A; r < t.length; r++) (t[r].reactions ??= []).push(e);
	} else !n && t !== null && A < t.length && (te(e, A), (t.length = A));
	return t;
}
function pn(e, t) {
	let n = t.reactions;
	if (n !== null) {
		var r = It.call(n, e);
		if (r !== -1) {
			var s = n.length - 1;
			s === 0 ? (n = t.reactions = null) : ((n[r] = n[s]), n.pop());
		}
	}
	if (n === null && (t.f & 2) !== 0 && (C === null || !fe.call(C, t))) {
		var i = t;
		((i.f & 512) !== 0 && (i.f ^= 512),
			i.v !== R && ye(i),
			i.ac !== null &&
				re(() => {
					(i.ac.abort(ne), (i.ac = null), T(i, 2048));
				}),
			cn(i),
			te(i, 0));
	}
}
function te(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) pn(e, n[r]);
}
function q(e) {
	var t = e.f;
	if ((t & 16384) === 0) {
		T(e, 1024);
		var n = h,
			r = ae;
		((h = e), (ae = (t & 96) === 0));
		try {
			((t & 16777232) !== 0 ? Dn(e) : be(e), Tt(e));
			var s = _t(e);
			((e.teardown = typeof s == 'function' ? s : null), (e.wv = ut));
			var i;
			qe && jt && (e.f & 2048) !== 0 && e.deps;
		} finally {
			((ae = r), (h = n));
		}
	}
}
async function Tr() {
	(await Promise.resolve(), En());
}
function Rr() {
	return Y.ensure().settled();
}
function $(e) {
	var t = e.f,
		n = (t & 2) !== 0;
	if (v !== null && !y) {
		var r = h !== null && (h.f & 16384) !== 0;
		if (!r && (I === null || !I.has(e))) {
			var s = v.deps;
			if ((v.f & 2097152) !== 0)
				e.rv < V &&
					((e.rv = V),
					C === null && s !== null && s[A] === e ? A++ : C === null ? (C = [e]) : C.push(e));
			else {
				((v.deps ??= []), fe.call(v.deps, e) || v.deps.push(e));
				var i = e.reactions;
				i === null ? (e.reactions = [v]) : fe.call(i, v) || i.push(v);
			}
		}
	}
	if (L && O.has(e)) return O.get(e);
	if (n) {
		var f = e;
		if (L) {
			var l = f.v;
			return (
				(((f.f & 1024) === 0 && f.reactions !== null) || vt(f)) && (l = Ie(f)),
				O.set(f, l),
				l
			);
		}
		var a = (f.f & 512) === 0 && !y && v !== null && (ae || (v.f & 512) !== 0),
			u = (f.f & 32768) === 0;
		(se(f) && (a && (f.f |= 512), tt(f)), a && !u && (nt(f), Et(f)));
	}
	if (w?.has(e)) return w.get(e);
	if ((e.f & 8388608) !== 0) throw e.v;
	return e.v;
}
function Et(e) {
	if (((e.f |= 512), e.deps !== null))
		for (const t of e.deps)
			((t.reactions ??= []).push(e), (t.f & 2) !== 0 && (t.f & 512) === 0 && (nt(t), Et(t)));
}
function vt(e) {
	if (e.v === R) return !0;
	if (e.deps === null) return !1;
	for (const t of e.deps) if (O.has(t) || ((t.f & 2) !== 0 && vt(t))) return !0;
	return !1;
}
function Cr(e) {
	var t = y;
	try {
		return ((y = !0), e());
	} finally {
		y = t;
	}
}
function dt(e) {
	(h === null && (v === null && Mt(), Bt()), L && Pt());
}
function Tn(e, t) {
	var n = t.last;
	n === null ? (t.last = t.first = e) : ((n.next = e), (e.prev = n), (t.last = e));
}
function g(e, t) {
	var n = h;
	n !== null && (n.f & 8192) !== 0 && (e |= 8192);
	var r = {
		ctx: F,
		deps: null,
		nodes: null,
		f: e | 2048 | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	p?.register_created_effect(r);
	var s = r;
	if ((e & 4) !== 0) Q !== null ? Q.push(r) : Y.ensure().schedule(r);
	else if (t !== null) {
		try {
			q(r);
		} catch (f) {
			throw (H(r), f);
		}
		s.deps === null &&
			s.teardown === null &&
			s.nodes === null &&
			s.first === s.last &&
			(s.f & 524288) === 0 &&
			((s = s.first), (e & 16) !== 0 && (e & 65536) !== 0 && s !== null && (s.f |= 65536));
	}
	if (
		s !== null &&
		((s.parent = n), n !== null && Tn(s, n), v !== null && (v.f & 2) !== 0 && (e & 64) === 0)
	) {
		var i = v;
		(i.effects ??= []).push(s);
	}
	return r;
}
function ht() {
	return v !== null && !y;
}
function Rn(e) {
	const t = g(8, null);
	return (T(t, 1024), (t.teardown = e), t);
}
function Dr(e) {
	dt();
	var t = h.f,
		n = !v && (t & 32) !== 0 && F !== null && !F.i;
	if (n) {
		var r = F;
		(r.e ??= []).push(e);
	} else return pt(e);
}
function pt(e) {
	return g(1048580, e);
}
function Ar(e) {
	return (dt(), g(1048584, e));
}
function Nr(e) {
	Y.ensure();
	const t = g(524352, e);
	return (n = {}) =>
		new Promise((r) => {
			n.outro
				? Nn(t, () => {
						(H(t), r(void 0));
					})
				: (H(t), r(void 0));
		});
}
function Fr(e) {
	return g(4, e);
}
function Cn(e) {
	return g(4718592, e);
}
function wr(e, t = 0) {
	return g(8 | t, e);
}
function yr(e, t = [], n = [], r = []) {
	an(r, t, n, (s) => {
		g(8, () => {
			e(...s.map($));
		});
	});
}
function Or(e, t = 0) {
	var n = g(16 | t, e);
	return n;
}
function Ir(e) {
	return g(524320, e);
}
function Tt(e) {
	var t = e.teardown;
	if (t !== null) {
		const n = L,
			r = v;
		(Ue(!0), k(null));
		try {
			t.call(null);
		} catch (s) {
			ee(s, e.parent);
		} finally {
			(Ue(n), k(r));
		}
	}
}
function be(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		const s = n.ac;
		s !== null &&
			re(() => {
				s.abort(ne);
			});
		var r = n.next;
		((n.f & 64) !== 0 ? (n.parent = null) : H(n, t), (n = r));
	}
}
function Dn(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		((t.f & 32) === 0 && H(t), (t = n));
	}
}
function H(e, t = !0) {
	var n = !1;
	((t || (e.f & 262144) !== 0) &&
		e.nodes !== null &&
		e.nodes.end !== null &&
		(An(e.nodes.start, e.nodes.end), (n = !0)),
		(e.f |= 33554432),
		be(e, t && !n),
		te(e, 0));
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (const i of r) i.stop();
	(Tt(e), (e.f ^= 33554432), (e.f |= 16384));
	var s = e.parent;
	(s !== null && s.first !== null && Rt(e),
		(e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null));
}
function An(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : x(e);
		(e.remove(), (e = n));
	}
}
function Rt(e) {
	var t = e.parent,
		n = e.prev,
		r = e.next;
	(n !== null && (n.next = r),
		r !== null && (r.prev = n),
		t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n)));
}
function Nn(e, t, n = !0) {
	var r = [];
	((e.f |= 256), Ct(e, r, !0));
	var s = () => {
			(n && H(e), t && t());
		},
		i = r.length;
	if (i > 0) {
		var f = () => --i || s();
		for (var l of r) l.out(f);
	} else s();
}
function Ct(e, t, n) {
	if ((e.f & 8192) === 0) {
		e.f ^= 8192;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (const l of r) (l.is_global || n) && t.push(l);
		for (var s = e.first; s !== null;) {
			var i = s.next;
			if ((s.f & 64) === 0) {
				var f = (s.f & 65536) !== 0 || ((s.f & 32) !== 0 && (e.f & 16) !== 0);
				Ct(s, t, f ? n : !1);
			}
			s = i;
		}
	}
}
function gr(e) {
	((e.f &= -257), Dt(e, !0));
}
function Dt(e, t) {
	if ((e.f & 256) === 0 && (e.f & 8192) !== 0) {
		((e.f ^= 8192), (e.f & 1024) === 0 && (T(e, 2048), Y.ensure().schedule(e)));
		for (var n = e.first; n !== null;) {
			var r = n.next,
				s = (n.f & 65536) !== 0 || (n.f & 32) !== 0;
			(Dt(n, s ? t : !1), (n = r));
		}
		var i = e.nodes && e.nodes.t;
		if (i !== null) for (const f of i) (f.is_global || t) && f.in();
	}
}
function mr(e, t) {
	if (e.nodes)
		for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
			var s = n === r ? null : x(n);
			(t.append(n), (n = s));
		}
}
export {
	Ir as $,
	Dr as A,
	Tr as B,
	fr as C,
	On as D,
	mn as E,
	or as F,
	er as G,
	Kt as H,
	b as I,
	en as J,
	Jt as K,
	Ln as L,
	yr as M,
	dr as N,
	Yt as O,
	zn as P,
	ur as Q,
	oe as R,
	de as S,
	Gn as T,
	W as U,
	qt as V,
	Ke as W,
	zt as X,
	Ae as Y,
	p as Z,
	Yn as _,
	rr as a,
	Pn as a0,
	cr as a1,
	Un as a2,
	Kn as a3,
	Se as a4,
	Hn as a5,
	gr as a6,
	Nn as a7,
	yn as a8,
	xe as a9,
	sn as aA,
	ue as aB,
	Y as aC,
	sr as aD,
	bn as aE,
	tr as aF,
	Vn as aG,
	ar as aH,
	Ne as aI,
	Bn as aJ,
	Nr as aK,
	Fe as aL,
	yt as aM,
	_r as aN,
	Wt as aO,
	Zn as aP,
	Jn as aQ,
	In as aR,
	Ee as aS,
	we as aT,
	Rr as aU,
	kt as aV,
	Fn as aa,
	jn as ab,
	tn as ac,
	mr as ad,
	H as ae,
	xn as af,
	Ot as ag,
	x as ah,
	Sn as ai,
	Ft as aj,
	vr as ak,
	wr as al,
	Fr as am,
	Qt as an,
	Er as ao,
	F as ap,
	Xt as aq,
	gn as ar,
	k as as,
	K as at,
	v as au,
	ht as av,
	Te as aw,
	wn as ax,
	Qn as ay,
	ee as az,
	Or as b,
	ir as c,
	gt as d,
	j as e,
	En as f,
	$ as g,
	S as h,
	nr as i,
	D as j,
	Z as k,
	z as l,
	pr as m,
	L as n,
	h as o,
	Mn as p,
	Xn as q,
	lr as r,
	P as s,
	qn as t,
	Cr as u,
	Oe as v,
	hr as w,
	$n as x,
	Wn as y,
	Ar as z
};
