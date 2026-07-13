import { createCanvasIR } from "@anvilkit/canvas-core";
import { describe, expect, it } from "vitest";
import { canvasExportOptionsToJobSource } from "../job-request-mapping.js";

describe("canvasExportOptionsToJobSource", () => {
	it("maps canvasIR onto a CanvasExportJobSource document", () => {
		const canvasIR = createCanvasIR({
			id: "doc1",
			now: () => "2026-07-13T00:00:00.000Z",
		});
		const source = canvasExportOptionsToJobSource({ canvasIR });
		expect(source).toEqual({ document: canvasIR });
	});

	it("returns undefined when canvasIR is absent", () => {
		expect(canvasExportOptionsToJobSource({})).toBeUndefined();
	});
});
