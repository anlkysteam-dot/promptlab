import { describe, expect, it } from "vitest";
import { checklistInstruction, inferPromptTemplate, qualityModeInstruction, templateInstruction } from "./prompt-quality";

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
});

describe("quality instructions", () => {
  it("returns advanced mode instruction", () => {
    expect(qualityModeInstruction("advanced")).toContain("ADVANCED");
  });

  it("provides checklist and template instruction", () => {
    expect(templateInstruction("email")).toContain("email");
    expect(checklistInstruction("email")).toContain("Quality checklist:");
  });
});
