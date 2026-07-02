import { describe, expect, it } from "vitest";
import { presetRange } from "@/stores/filtersStore";
import { EARLIEST_DATA_DATE } from "@/lib/config";
import { todayIso } from "@/lib/format";

describe("presetRange", () => {
  it("computes day-based presets relative to today", () => {
    const { startDate, endDate } = presetRange("Last week");
    expect(endDate).toBe(todayIso());
    expect(startDate < endDate).toBe(true);
  });

  it("All time spans from the earliest data epoch to today", () => {
    const { startDate, endDate } = presetRange("All time");
    expect(startDate).toBe(EARLIEST_DATA_DATE);
    expect(endDate).toBe(todayIso());
  });
});
