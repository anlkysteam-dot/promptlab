import { describe, expect, it } from "vitest";
import { FREE_DAILY_CREDIT_BUDGET } from "./constants";
import { generationCreditCost, splitGenerationAcrossBuckets } from "./usage";

describe("generationCreditCost", () => {
  it("charges free users 2 for normal and 4 for advanced", () => {
    expect(generationCreditCost(false, "normal")).toBe(2);
    expect(generationCreditCost(false, "advanced")).toBe(4);
  });

  it("charges premium users 1 for normal and 2 for advanced", () => {
    expect(generationCreditCost(true, "normal")).toBe(1);
    expect(generationCreditCost(true, "advanced")).toBe(2);
  });
});

describe("splitGenerationAcrossBuckets", () => {
  it("uses only daily free pool when enough remains", () => {
    expect(splitGenerationAcrossBuckets(0, 4, 0)).toEqual({ ok: true, fromFree: 4, fromPurchased: 0 });
  });

  it("splits between daily and purchased", () => {
    expect(splitGenerationAcrossBuckets(FREE_DAILY_CREDIT_BUDGET - 1, 4, 10)).toEqual({
      ok: true,
      fromFree: 1,
      fromPurchased: 3,
    });
  });

  it("fails when purchased balance is insufficient", () => {
    expect(splitGenerationAcrossBuckets(FREE_DAILY_CREDIT_BUDGET, 4, 2)).toEqual({ ok: false });
  });
});
