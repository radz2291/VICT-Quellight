import { c as t, a as p } from '../chunks/C2dSpk4b.js';
import { b as c, E as i, C as m, O as f } from '../chunks/CC4duI0-.js';
import { B as l } from '../chunks/CZW_XPdU.js';
function u(a, o, ...n) {
	var r = new l(a);
	c(() => {
		const e = o() ?? null;
		r.ensure(e, e && ((s) => e(s, ...n)));
	}, i);
}
function b(a, o) {
	var n = t(),
		r = m(n);
	(u(r, () => o.children ?? f), p(a, n));
}
export { b as component };
