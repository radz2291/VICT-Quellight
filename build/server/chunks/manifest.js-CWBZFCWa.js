const manifest = (() => {
	function __memo(fn) {
		let value;
		return () => (value ??= value = fn());
	}

	return {
		appDir: '_app',
		appPath: '_app',
		assets: new Set(['favicon.svg']),
		mimeTypes: { '.svg': 'image/svg+xml' },
		_: {
			client: {
				start: '_app/immutable/entry/start.B14oa_kD.js',
				app: '_app/immutable/entry/app.DKlv_WeZ.js',
				imports: [
					'_app/immutable/entry/start.B14oa_kD.js',
					'_app/immutable/chunks/CC4duI0-.js',
					'_app/immutable/chunks/CB3KyUwj.js',
					'_app/immutable/chunks/DzqdhXdc.js',
					'_app/immutable/entry/app.DKlv_WeZ.js',
					'_app/immutable/chunks/CC4duI0-.js',
					'_app/immutable/chunks/TZTxgFQI.js',
					'_app/immutable/chunks/C2dSpk4b.js',
					'_app/immutable/chunks/DzqdhXdc.js',
					'_app/immutable/chunks/CNLbIbOl.js',
					'_app/immutable/chunks/CZW_XPdU.js'
				],
				stylesheets: [],
				fonts: [],
				uses_env_dynamic_public: false
			},
			nodes: [
				__memo(() => import('./0-BQgaN6uc.js')),
				__memo(() => import('./1-Bu_-Htx5.js')),
				__memo(() => import('./2-DDP8XOVG.js'))
			],
			remotes: {},
			routes: [
				{
					id: '/',
					pattern: /^\/$/,
					params: [],
					page: { layouts: [0], errors: [1], leaf: 2 },
					endpoint: null
				},
				{
					id: '/api/health',
					pattern: /^\/api\/health\/?$/,
					params: [],
					page: null,
					endpoint: __memo(() => import('./_server.ts-Bcon6fV7.js'))
				},
				{
					id: '/api/turn',
					pattern: /^\/api\/turn\/?$/,
					params: [],
					page: null,
					endpoint: __memo(() => import('./_server.ts-LEnvQbKu.js'))
				}
			],
			prerendered_routes: new Set([]),
			matchers: async () => {
				return {};
			},
			server_assets: {}
		}
	};
})();

export { manifest as m };
//# sourceMappingURL=manifest.js-CWBZFCWa.js.map
