import { describe, expect, it } from "vitest";
import { getUsageDayKey } from "./day-key";

describe("getUsageDayKey", () => {
  it("formats Istanbul calendar date as YYYY-MM-DD", () => {
    // 2026-06-01 12:00 UTC → 15:00 in Istanbul (no DST) → same calendar day
    const d = new Date("2026-06-01T12:00:00.000Z");
    expect(getUsageDayKey(d)).toBe("2026-06-01");
  });

  it("rolls forward across midnight Istanbul", () => {
    // 2026-01-15 21:00 UTC = 2026-01-16 00:00 Istanbul
    const d = new Date("2026-01-15T21:00:00.000Z");
    expect(getUsageDayKey(d)).toBe("2026-01-16");
  });
});
