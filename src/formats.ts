import type { CanvasIR } from "@anvilkit/canvas-core";
import type { ExportFormatDefinition } from "@anvilkit/core/types";
import {
	canvasToJson,
	canvasToPdf,
	canvasToPng,
	canvasToSvg,
} from "./serialize.js";
import type { CanvasExportOptions } from "./types.js";

function requireIR(o: CanvasExportOptions): CanvasIR {
	if (!o || !o.canvasIR) {
		throw new Error(
			"plugin-export-canvas: `canvasIR` is required in the export options (canvas formats read the design from options, not the Puck PageIR).",
		);
	}
	return o.canvasIR;
}

function baseName(o: CanvasExportOptions, ir: CanvasIR): string {
	return o.filename ?? ir.title ?? "design";
}

/** Resolve a page selector (id, index, or default-first) to a concrete page id. */
function resolvePageId(
	ir: CanvasIR,
	page: string | number | undefined,
): string {
	if (typeof page === "string") return page;
	const index = typeof page === "number" ? page : 0;
	return ir.pages[index]?.id ?? ir.pages[0]?.id ?? "";
}

export const jsonFormat: ExportFormatDefinition<CanvasExportOptions> = {
	id: "canvas-json",
	labelKey: "exportCanvas.format.json",
	label: "Canvas JSON",
	extension: "json",
	mimeType: "application/json",
	run: async (_pageIr, options) => {
		const ir = requireIR(options);
		return {
			content: canvasToJson(ir, { pretty: options.pretty }),
			filename: `${baseName(options, ir)}.json`,
		};
	},
};

export const svgFormat: ExportFormatDefinition<CanvasExportOptions> = {
	id: "canvas-svg",
	labelKey: "exportCanvas.format.svg",
	label: "Canvas SVG",
	extension: "svg",
	mimeType: "image/svg+xml",
	run: async (_pageIr, options) => {
		const ir = requireIR(options);
		const { svg, warnings } = await canvasToSvg(
			ir,
			options.page ?? 0,
			options.svg,
		);
		return {
			content: svg,
			filename: `${baseName(options, ir)}.svg`,
			...(warnings.length > 0 ? { warnings } : {}),
		};
	},
};

export const pdfFormat: ExportFormatDefinition<CanvasExportOptions> = {
	id: "canvas-pdf",
	labelKey: "exportCanvas.format.pdf",
	label: "Canvas PDF",
	extension: "pdf",
	mimeType: "application/pdf",
	run: async (_pageIr, options) => {
		const ir = requireIR(options);
		const { pdf, warnings } = await canvasToPdf(ir, {
			rasters: options.rasters ?? [],
			...(options.pdf?.pages !== undefined ? { pages: options.pdf.pages } : {}),
			...(options.dpi !== undefined ? { dpi: options.dpi } : {}),
			...(options.pdf?.title !== undefined ? { title: options.pdf.title } : {}),
			...(options.pdf?.author !== undefined
				? { author: options.pdf.author }
				: {}),
		});
		return {
			content: pdf,
			filename: `${baseName(options, ir)}.pdf`,
			...(warnings.length > 0 ? { warnings } : {}),
		};
	},
};

export const pngFormat: ExportFormatDefinition<CanvasExportOptions> = {
	id: "canvas-png",
	labelKey: "exportCanvas.format.png",
	label: "Canvas PNG",
	extension: "png",
	mimeType: "image/png",
	run: async (_pageIr, options) => {
		const ir = requireIR(options);
		const pageId = resolvePageId(ir, options.page);
		const raster = (options.rasters ?? []).find((r) => r.pageId === pageId);
		if (!raster) {
			throw new Error(
				`plugin-export-canvas: PNG export needs a pre-rendered raster for page "${pageId}" in options.rasters (the canvas host supplies it via stage.toDataURL / rasterizePage).`,
			);
		}
		return {
			content: canvasToPng(raster.image),
			filename: `${baseName(options, ir)}.png`,
		};
	},
};

/** All four canvas export formats, in menu order. */
export const canvasExportFormats: ReadonlyArray<
	ExportFormatDefinition<CanvasExportOptions>
> = [pngFormat, jsonFormat, svgFormat, pdfFormat];
