import { describe, expect, it } from "vitest";
import { buildIntentForApi, toneLabel } from "./workbench-compose-intent";

describe("buildIntentForApi", () => {
  it("returns trimmed base when meta empty", () => {
    expect(
      buildIntentForApi("  hello world  ", { topic: "", tone: "", audience: "" }),
    ).toBe("hello world");
  });

  it("appends topic, tone, audience lines", () => {
    const out = buildIntentForApi("Görev", {
      topic: "Kahve",
      tone: "casual",
      audience: "Gen Z",
    });
    expect(out).toContain("Görev");
    expect(out).toContain("Konu / odak: Kahve");
    expect(out).toContain("İstenen ton: Eğlenceli / samimi");
    expect(out).toContain("Hedef kitle: Gen Z");
  });

  it("ignores invalid tone key", () => {
    const out = buildIntentForApi("X", { topic: "", tone: "invalid", audience: "" });
    expect(out).toBe("X");
  });
});

describe("toneLabel", () => {
  it("maps known keys", () => {
    expect(toneLabel("formal")).toBe("Resmi / öz");
  });
});
