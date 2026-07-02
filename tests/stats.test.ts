import { describe, expect, it } from "vitest";
import {
  binValues,
  finiteNumbers,
  mean,
  median,
  quantile,
} from "@/lib/analytics/stats";

describe("quantile", () => {
  it("matches pandas linear interpolation", () => {
    // pandas: Series([1,2,3,4]).quantile(0.95) == 3.85
    expect(quantile([1, 2, 3, 4], 0.95)).toBeCloseTo(3.85, 10);
  });

  it("handles single values and empty input", () => {
    expect(quantile([7], 0.95)).toBe(7);
    expect(quantile([], 0.95)).toBe(0);
  });

  it("is order-independent", () => {
    expect(quantile([4, 1, 3, 2], 0.5)).toBe(2.5);
  });
});

describe("mean / median", () => {
  it("computes mean", () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(mean([])).toBe(0);
  });

  it("computes median for odd and even counts", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("finiteNumbers", () => {
  it("drops null, undefined and NaN", () => {
    expect(finiteNumbers([1, null, undefined, NaN, 2])).toEqual([1, 2]);
  });
});

describe("binValues", () => {
  it("covers the full range and preserves total count", () => {
    const values = Array.from({ length: 100 }, (_, i) => i / 10);
    const bins = binValues(values, 10);
    expect(bins.reduce((acc, b) => acc + b.count, 0)).toBe(100);
    expect(bins[0].binStart).toBeLessThanOrEqual(0);
    expect(bins[bins.length - 1].binEnd).toBeGreaterThanOrEqual(9.9);
  });

  it("handles constant series with a single bin", () => {
    expect(binValues([5, 5, 5], 30)).toEqual([{ binStart: 5, binEnd: 5, count: 3 }]);
  });

  it("returns empty for empty input", () => {
    expect(binValues([], 30)).toEqual([]);
  });
});
