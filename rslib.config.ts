import { defineConfig } from "@rslib/core";

/**
 * Bundleless build for `@anvilkit/plugin-export-canvas`. Each `.ts` under
 * `src/` becomes an individual ESM + CJS output in `dist/`. `@anvilkit/core`,
 * `@anvilkit/canvas-core`, `@puckeditor/core`, `react`, and `react-dom` are
 * left external so the package stays headless and aligned with its dependency
 * contract (it never bundles the canvas-core serializers or pdf-lib).
 */
export default defineConfig({
	source: {
		entry: {
			index: [
				"./src/**/*.ts",
				"!./src/**/*.{test,spec}.ts",
				"!./src/**/__tests__/**",
			],
		},
	},
	lib: [
		{
			bundle: false,
			dts: { autoExtension: true },
			format: "esm",
		},
		{
			bundle: false,
			dts: { autoExtension: true },
			format: "cjs",
		},
	],
	output: {
		target: "node",
		externals: [
			"@anvilkit/core",
			"@anvilkit/canvas-core",
			"@puckeditor/core",
			"react",
			"react-dom",
		],
	},
	performance: {
		// rslib defaults performance.buildCache to true, but rspack 2.x's
		// persistent cache storage is not concurrency-safe under Turbo's
		// parallel `^build` fan-out (concurrency: 32) -> SIGABRT or
		// silently missing/corrupted dist output (e.g. missing .d.ts).
		buildCache: false,
	},
});
