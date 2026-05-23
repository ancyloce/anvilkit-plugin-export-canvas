import {
	type CanvasIR,
	type PdfSerializeWarning,
	serializeDocumentToPdf,
	serializePageToSvg,
	type SvgSerializeOptions,
	type SvgSerializeWarning,
} from "@anvilkit/canvas-core";
import type { ExportWarning } from "@anvilkit/core/types";
import type { CanvasRaster } from "./types.js";

function svgWarning(w: SvgSerializeWarning): ExportWarning {
	return {
		level: "warn",
		code: w.code,
		message: w.message,
		...(w.nodeId !== undefined ? { nodeId: w.nodeId } : {}),
	};
}

function pdfWarning(w: PdfSerializeWarning): ExportWarning {
	return {
		level: "warn",
		code: w.code,
		message: w.message,
		...(w.pageId !== undefined ? { nodeId: w.pageId } : {}),
	};
}

/** Decode a `data:` URL (or pass through raw bytes) to a `Uint8Array`. */
export function rasterToBytes(image: Uint8Array | string): Uint8Array {
	if (image instanceof Uint8Array) return image;
	const comma = image.indexOf(",");
	const base64 = comma >= 0 ? image.slice(comma + 1) : image;
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/** Serialize the whole canvas document to a JSON snapshot string. */
export function canvasToJson(
	ir: CanvasIR,
	opts: { pretty?: boolean } = {},
): string {
	return JSON.stringify(ir, null, opts.pretty ? 2 : undefined);
}

/** Serialize one canvas page to an SVG string (wraps canvas-core). */
export async function canvasToSvg(
	ir: CanvasIR,
	page: string | number = 0,
	options?: SvgSerializeOptions,
): Promise<{ svg: string; warnings: ExportWarning[] }> {
	const { svg, warnings } = await serializePageToSvg(ir, page, options);
	return { svg, warnings: warnings.map(svgWarning) };
}

/**
 * Serialize the canvas document to a multi-page PDF (wraps canvas-core). The
 * caller supplies one pre-rendered raster per page — this stays headless.
 */
export async function canvasToPdf(
	ir: CanvasIR,
	options: {
		rasters: readonly CanvasRaster[];
		pages?: ReadonlyArray<string | number>;
		dpi?: number;
		title?: string;
		author?: string;
	},
): Promise<{ pdf: Uint8Array; warnings: ExportWarning[] }> {
	const { pdf, warnings } = await serializeDocumentToPdf(ir, {
		rasters: options.rasters.map((r) => ({
			pageId: r.pageId,
			image: r.image,
			...(r.mimeType !== undefined ? { mimeType: r.mimeType } : {}),
		})),
		...(options.pages !== undefined ? { pages: [...options.pages] } : {}),
		...(options.dpi !== undefined ? { dpi: options.dpi } : {}),
		...(options.title !== undefined ? { title: options.title } : {}),
		...(options.author !== undefined ? { author: options.author } : {}),
	});
	return { pdf, warnings: warnings.map(pdfWarning) };
}

/** Produce PNG bytes from a pre-rendered raster (data URL or bytes). */
export function canvasToPng(raster: Uint8Array | string): Uint8Array {
	return rasterToBytes(raster);
}
