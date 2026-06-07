import {
	type CanvasIR,
	createCanvasIR,
	createPage,
} from "@anvilkit/canvas-core";
import type { PageIR } from "@anvilkit/core/types";
import { describe, expect, it } from "vitest";
import { canvasExportFormats, pngFormat, svgFormat } from "../formats.js";
import { createCanvasExportPlugin } from "../plugin.js";
import type { CanvasExportOptions } from "../types.js";

const PNG_1X1_DATA_URL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// The Puck PageIR run() arg is ignored by canvas formats — a stub is fine.
const STUB_PAGE_IR = {
	version: "1",
	root: { id: "root", type: "__root__", props: {}, children: [] },
	assets: [],
	metadata: {},
} as unknown as PageIR;

// Minimal ctx — register() only needs `registerMessages` (compile-time
// catalog contribution); the rest of StudioPluginContext is unused here.
const fakeCtx = {
	registerMessages: () => undefined,
} as unknown as Parameters<
	ReturnType<typeof createCanvasExportPlugin>["register"]
>[0];

function ir(): CanvasIR {
	return createCanvasIR({
		id: "d1",
		title: "Design",
		pages: [createPage({ id: "p1" })],
		now: () => "2026-05-22T00:00:00.000Z",
	});
}

describe("createCanvasExportPlugin", () => {
	it("registers the four canvas export formats with stable ids", async () => {
		const registration = await createCanvasExportPlugin().register(fakeCtx);
		const formats = registration.exportFormats ?? [];
		expect(formats.map((f) => f.id)).toEqual([
			"canvas-png",
			"canvas-json",
			"canvas-svg",
			"canvas-pdf",
		]);
		const pdf = formats.find((f) => f.id === "canvas-pdf");
		expect(pdf?.mimeType).toBe("application/pdf");
		expect(pdf?.extension).toBe("pdf");
	});

	it("derives meta.version from package.json", async () => {
		const plugin = createCanvasExportPlugin();
		expect(plugin.meta.id).toBe("anvilkit-plugin-export-canvas");
		// Allow SemVer prerelease/build suffixes (e.g. `0.1.0-rc.0`).
		expect(plugin.meta.version).toMatch(
			/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
		);
	});
});

describe("format run() reads the CanvasIR from options", () => {
	it("json/svg use the IR title for the filename", async () => {
		const opts: CanvasExportOptions = { canvasIR: ir() };
		const json = canvasExportFormats.find((f) => f.id === "canvas-json");
		const result = await json?.run(STUB_PAGE_IR, opts);
		expect(result?.filename).toBe("Design.json");
		expect(typeof result?.content).toBe("string");

		const svg = await svgFormat.run(STUB_PAGE_IR, opts);
		expect(svg.filename).toBe("Design.svg");
	});

	it("png returns the supplied raster's bytes", async () => {
		const opts: CanvasExportOptions = {
			canvasIR: ir(),
			rasters: [{ pageId: "p1", image: PNG_1X1_DATA_URL }],
		};
		const result = await pngFormat.run(STUB_PAGE_IR, opts);
		expect(result.content).toBeInstanceOf(Uint8Array);
		expect(result.filename).toBe("Design.png");
	});
});

describe("error handling", () => {
	it("throws a clear error when canvasIR is missing", async () => {
		await expect(
			svgFormat.run(STUB_PAGE_IR, {} as CanvasExportOptions),
		).rejects.toThrow(/canvasIR/);
	});

	it("throws when PNG export has no raster for the page", async () => {
		await expect(
			pngFormat.run(STUB_PAGE_IR, { canvasIR: ir() } as CanvasExportOptions),
		).rejects.toThrow(/raster/);
	});
});
