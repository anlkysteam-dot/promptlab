import { describe, expect, it } from "vitest";
import { formatLedgerMetaLine, parseLedgerMetaJson } from "./credit-ledger-meta";

describe("parseLedgerMetaJson", () => {
  it("parses generation meta", () => {
    const raw = JSON.stringify({ creditCost: 4, fromDaily: 2, fromBonus: 2, target: "midjourney" });
    expect(parseLedgerMetaJson(raw)).toEqual({
      creditCost: 4,
      fromDaily: 2,
      fromBonus: 2,
      target: "midjourney",
    });
  });

  it("returns null for invalid json", () => {
    expect(parseLedgerMetaJson("{")).toBeNull();
  });
});

describe("formatLedgerMetaLine", () => {
  it("formats TR line with target and split", () => {
    const raw = JSON.stringify({ creditCost: 4, fromDaily: 2, fromBonus: 2, target: "midjourney" });
    const line = formatLedgerMetaLine(raw, "tr");
    expect(line).toContain("Midjourney");
    expect(line).toContain("günlük");
  });

  it("formats EN line", () => {
    const raw = JSON.stringify({ target: "chatgpt", creditCost: 2, fromDaily: 2, fromBonus: 0 });
    const line = formatLedgerMetaLine(raw, "en");
    expect(line).toContain("Target:");
    expect(line).toContain("ChatGPT");
  });
});
