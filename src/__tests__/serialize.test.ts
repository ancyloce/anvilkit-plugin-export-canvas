import {
	type CanvasIR,
	createCanvasIR,
	createGroup,
	createPage,
	createRect,
} from "@anvilkit/canvas-core";
import { describe, expect, it } from "vitest";
import {
	canvasToJson,
	canvasToPdf,
	canvasToPng,
	canvasToSvg,
	rasterToBytes,
} from "../serialize.js";

/** A valid 1×1 transparent PNG (embeds cleanly via pdf-lib's decoder). */
const PNG_1X1 =
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const PNG_1X1_DATA_URL = `data:image/png;base64,${PNG_1X1}`;

function fixtureIR(): CanvasIR {
	const page = createPage({ id: "p1", name: "First" });
	page.root = createGroup({
		id: "p1-root",
		bounds: page.root.bounds,
		children: [
			createRect({
				id: "r1",
				bounds: { width: 40, height: 30 },
				transform: { x: 5, y: 5 },
				fill: "#ff0000",
			}),
		],
	});
	return createCanvasIR({
		id: "doc-1",
		title: "Poster",
		pages: [page],
		now: () => "2026-05-22T00:00:00.000Z",
	});
}

describe("canvasToJson", () => {
	it("round-trips the IR (parses back to an equal document)", () => {
		const ir = fixtureIR();
		const json = canvasToJson(ir);
		expect(JSON.parse(json)).toEqual(ir);
	});

	it("pretty-prints when requested", () => {
		const json = canvasToJson(fixtureIR(), { pretty: true });
		expect(json).toContain("\n");
		expect(json.split("\n").length).toBeGreaterThan(5);
	});
});

describe("canvasToSvg", () => {
	it("emits an <svg> document for the selected page", async () => {
		const { svg, warnings } = await canvasToSvg(fixtureIR(), 0);
		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg>");
		// Warnings are ExportWarning-shaped (level/code/message).
		for (const w of warnings) {
			expect(w.level).toBe("warn");
			expect(typeof w.code).toBe("string");
		}
	});
});

describe("canvasToPdf", () => {
	it("produces PDF bytes from a per-page raster", async () => {
		const ir = fixtureIR();
		const { pdf, warnings } = await canvasToPdf(ir, {
			rasters: [{ pageId: "p1", image: PNG_1X1_DATA_URL }],
		});
		expect(pdf).toBeInstanceOf(Uint8Array);
		expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe("%PDF-");
		expect(warnings).toEqual([]);
	});
});

describe("canvasToPng / rasterToBytes", () => {
	it("decodes a data URL to bytes (PNG magic number)", () => {
		const bytes = canvasToPng(PNG_1X1_DATA_URL);
		expect(bytes).toBeInstanceOf(Uint8Array);
		// PNG signature: 0x89 'P' 'N' 'G'.
		expect(Array.from(bytes.subarray(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
	});

	it("passes raw bytes through unchanged", () => {
		const raw = new Uint8Array([1, 2, 3]);
		expect(rasterToBytes(raw)).toBe(raw);
	});
});
