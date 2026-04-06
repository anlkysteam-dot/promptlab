import { describe, expect, it } from "vitest";
import { buildLabPresetBlock } from "@/lib/lab-presets";

describe("lab-presets", () => {
  it("builds Midjourney aspect hint", () => {
    const text = buildLabPresetBlock({
      format: "16:9",
      negativePrompt: "",
      flavor: "none",
      target: "midjourney",
    });
    expect(text).toContain("[LAB_PRESETS]");
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
});
