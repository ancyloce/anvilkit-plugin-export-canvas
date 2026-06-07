/**
 * @file The `exportCanvas` registry entry (pure data — no React) plus the
 * `AnvilkitMessages` type augmentation.
 *
 * The plugin is headless (no `./ui`); its only user-facing strings are the
 * export-format labels surfaced in core's PublishPanel export menu, resolved
 * via the new `ExportFormatDefinition.labelKey` (chrome calls
 * `useMsg(labelKey, label)`) once `register()` contributes this entry.
 * Message content lives in `i18n/messages/<locale>.json`; English ships
 * inline and other locales lazy-load.
 */

import type { RegistryEntry } from "@anvilkit/core/i18n";

// Messages live at the plugin-root `i18n/messages/` (shipped via the package
// `files`). Imported from outside `src/` so the bundleless rslib build keeps
// them external `.json` — same pattern as `meta/config.json`.
import enMessages from "../../i18n/messages/en.json" with { type: "json" };

/** Static lazy-pack map (avoids a dynamic template `import()` under rslib). */
const LOCALE_PACKS: Readonly<
	Record<string, () => Promise<{ readonly default: Record<string, string> }>>
> = {
	zh: () => import("../../i18n/messages/zh.json", { with: { type: "json" } }),
};

/** The registry entry contributed to the catalog (core prepends `studio.*`). */
export const EXPORT_CANVAS_ENTRY: RegistryEntry = {
	namespace: "exportCanvas",
	en: enMessages,
	loadMessages: async (locale) => {
		const pack = LOCALE_PACKS[locale];
		return pack === undefined ? {} : (await pack()).default;
	},
};

/** Exact key union for the `AnvilkitMessages` augmentation. */
export type ExportCanvasMessageKey = keyof typeof enMessages;

// Augment the public key registry so `useT("exportCanvas.*")` autocompletes.
declare module "@anvilkit/core/i18n" {
	interface AnvilkitMessages extends Record<ExportCanvasMessageKey, string> {}
}
