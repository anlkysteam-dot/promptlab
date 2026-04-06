import { describe, expect, it } from "vitest";
import {
  checklistInstruction,
  inferPromptTemplate,
  mediaPresetInstruction,
  qualityModeInstruction,
  templateInstruction,
} from "./prompt-quality";

describe("inferPromptTemplate", () => {
  it("detects coding intent", () => {
    expect(inferPromptTemplate("Next.js API route yaz", "universal")).toBe("coding");
  });

  it("detects social intent", () => {
    expect(inferPromptTemplate("Instagram caption yaz", "universal")).toBe("social");
  });

  it("uses target override for image models", () => {
    expect(inferPromptTemplate("random", "midjourney")).toBe("image");
  });

  it("uses target override for video models", () => {
    expect(inferPromptTemplate("random", "runway")).toBe("video");
  });
});

describe("quality instructions", () => {
  it("returns advanced mode instruction", () => {
    expect(qualityModeInstruction("advanced")).toContain("ADVANCED");
  });

  it("provides checklist and template instruction", () => {
    expect(templateInstruction("email")).toContain("email");
    expect(checklistInstruction("email")).toContain("Quality checklist:");
  });

  it("provides media preset instruction", () => {
    expect(mediaPresetInstruction("video_storyboard")).toContain("storyboard");
  });
});
