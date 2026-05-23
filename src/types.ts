import type { CanvasIR, SvgSerializeOptions } from "@anvilkit/canvas-core";

/**
 * A pre-rendered raster of one canvas page. The canvas renderer is React/Konva
 * and cannot run headlessly, so this plugin never rasterizes itself — the host
 * (e.g. `plugin-canvas-studio`'s `CanvasExportBridge`) renders each page (via
 * `stage.toDataURL()` / `rasterizePage`) and passes the bytes/data-URL in.
 */
export interface CanvasRaster {
	readonly pageId: string;
	/** Raw PNG/JPEG bytes, or a `data:image/...;base64,…` URL. */
	readonly image: Uint8Array | string;
	readonly mimeType?: "image/png" | "image/jpeg";
}

/**
 * Option bag for the canvas export formats. The Studio export contract hands
 * `run()` a Puck `PageIR`, which is meaningless for a canvas design — so the
 * canvas document (and any pre-rendered rasters) arrive HERE instead, supplied
 * by the canvas-mode host when it invokes the format.
 */
export interface CanvasExportOptions extends Record<string, unknown> {
	/**
	 * The canvas document to export. Required at runtime (`run()` throws without
	 * it), but typed optional so `ExportFormatDefinition<CanvasExportOptions>`
	 * stays assignable to the registry's generic `Record<string, unknown>` slot.
	 */
	readonly canvasIR?: CanvasIR;
	/** Page id or index for single-page formats (`svg` / `png`). Defaults to the first page. */
	readonly page?: string | number;
	/**
	 * Pre-rendered rasters keyed by page id. Required for `pdf` (one per page to
	 * embed) and for `png` (the selected page must be present). Ignored by `svg`/`json`.
	 */
	readonly rasters?: readonly CanvasRaster[];
	/** Fallback DPI for unit→px/pt conversion (`svg` / `pdf`). */
	readonly dpi?: number;
	/** Pretty-print the JSON export. */
	readonly pretty?: boolean;
	/** SVG serializer options (image embedding mode, fonts, pretty…). */
	readonly svg?: SvgSerializeOptions;
	/** Extra PDF document metadata + explicit page selection/order. */
	readonly pdf?: {
		readonly pages?: ReadonlyArray<string | number>;
		readonly title?: string;
		readonly author?: string;
	};
	/** Base filename (no extension). Defaults to the IR title, else `"design"`. */
	readonly filename?: string;
}

/** Options for {@link createCanvasExportPlugin}. Reserved for future use. */
export type CanvasExportPluginOptions = Record<string, never>;
