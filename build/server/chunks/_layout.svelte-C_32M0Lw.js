function _layout($$renderer, $$props) {
	let { children } = $$props;
	children?.($$renderer);
	$$renderer.push(`<!---->`);
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-C_32M0Lw.js.map
