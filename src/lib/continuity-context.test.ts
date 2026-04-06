import { describe, expect, it } from "vitest";
import {
  buildContinuityContext,
  buildContinuityContextWithProjectProfiles,
  buildContinuitySnapshot,
} from "@/lib/continuity-context";

describe("continuity-context", () => {
  it("builds continuity context ordered by scene number", () => {
    const text = buildContinuityContext([
      { sceneNo: 3, userInput: "adam kosuyor", generatedPrompt: "runner in red coat" },
      { sceneNo: 1, userInput: "adam kahve aliyor", generatedPrompt: "red coat man buys coffee" },
      { sceneNo: 2, userInput: "yola cikiyor", generatedPrompt: "same man exits cafe" },
    ]);
    expect(text).toContain("Scene 1");
    expect(text).toContain("Scene 2");
    expect(text).toContain("Scene 3");
    expect(text).toContain("Keep character identity");
  });

  it("builds compact continuity snapshot", () => {
    const snapshot = buildContinuitySnapshot("  red coat   hero walking  ");
    expect(snapshot).toBe("red coat hero walking");
  });

  it("includes project character and style profiles", () => {
    const text = buildContinuityContextWithProjectProfiles([], {
      characterProfile: "Kirmizi paltolu erkek karakter",
      styleProfile: "Sinematik, soft light, realistik",
    });
    expect(text).toContain("Character profile:");
    expect(text).toContain("Style profile:");
  });
});
