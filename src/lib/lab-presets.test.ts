import { describe, expect, it } from "vitest";
import { buildLabPresetBlock, buildSuggestedParamsBlock } from "@/lib/lab-presets";

describe("lab-presets", () => {
  it("does not force Midjourney --ar unless user opted in", () => {
    const text = buildLabPresetBlock({
      format: "16:9",
      negativePrompt: "",
      flavor: "none",
      target: "midjourney",
    });
    expect(text).toContain("[LAB_PRESETS]");
    expect(text).not.toContain("--ar 16:9");
  });

  it("includes Midjourney --ar when opted in", () => {
    const text = buildLabPresetBlock({
      format: "16:9",
      negativePrompt: "",
      flavor: "none",
      target: "midjourney",
      midjourneyCli: { includeAr: true, includeVersion: false, version: "6" },
    });
    expect(text).toContain("--ar 16:9");
  });

  it("includes negative prompt when provided", () => {
    const text = buildLabPresetBlock({
      format: "",
      negativePrompt: "blurry, low quality",
      flavor: "none",
      target: "sora",
    });
    expect(text).toContain("Negative constraints");
    expect(text).toContain("blurry");
  });

  it("builds suggested params when enabled", () => {
    const text = buildSuggestedParamsBlock({
      enabled: true,
      target: "midjourney",
      flavor: "none",
      format: "16:9",
    });
    expect(text).toContain("[SUGGESTED_PARAMETERS]");
    expect(text).toContain("--v 6");
  });

  it("returns empty suggested block when disabled", () => {
    expect(
      buildSuggestedParamsBlock({
        enabled: false,
        target: "midjourney",
        flavor: "none",
        format: "",
      }),
    ).toBe("");
  });
});
