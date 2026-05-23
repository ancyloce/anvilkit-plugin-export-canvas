import type { StudioPlugin, StudioPluginMeta } from "@anvilkit/core/types";
import config from "../meta/config.json";
import packageJson from "../package.json";
import { canvasExportFormats } from "./formats.js";
import type { CanvasExportPluginOptions } from "./types.js";

// `version` is derived from package.json so a version bump can never drift the
// runtime metadata away from the published package version.
const canvasExportPluginMeta: StudioPluginMeta = {
	...config,
	version: packageJson.version,
};

/**
 * I2-3: a Studio plugin that registers the four canvas export formats
 * (PNG / JSON / SVG / PDF) via `StudioPluginRegistration.exportFormats`.
 *
 * Headless — it wraps `@anvilkit/canvas-core` serializers only and never
 * imports React/Konva. Because the Studio export contract passes `run()` a
 * Puck `PageIR`, the canvas-mode host invokes these formats with the
 * `CanvasIR` (and any pre-rendered page rasters for PNG/PDF) in the format
 * options bag — see {@link CanvasExportOptions}.
 */
export function createCanvasExportPlugin(
	_opts: CanvasExportPluginOptions = {},
): StudioPlugin {
	return {
		meta: canvasExportPluginMeta,
		register() {
			return {
				meta: canvasExportPluginMeta,
				exportFormats: canvasExportFormats,
			};
		},
	};
}
