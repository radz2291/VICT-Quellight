import { a as u, f as g } from '../chunks/C2dSpk4b.js';
import { y as c, C as h, M as l, G as v, Q as a, F as _ } from '../chunks/CC4duI0-.js';
import { s as e } from '../chunks/TZTxgFQI.js';
import { p as s } from '../chunks/CB3KyUwj.js';
const x = {
		get error() {
			return s.error;
		},
		get status() {
			return s.status;
		}
	},
	o = x;
var d = g('<h1> </h1> <p> </p>', 1);
function E(p, m) {
	c(m, !0);
	var r = d(),
		t = h(r),
		n = a(t, !0),
		f = _(t, 2),
		i = a(f, !0);
	(l(() => {
		(e(n, o.status), e(i, o.error?.message));
	}),
		u(p, r),
		v());
}
export { E as component };
