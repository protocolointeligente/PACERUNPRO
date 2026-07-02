import { describe, it, expect } from "vitest";
import {
  rollingLoad,
  weeklyLoad,
  monthlyLoad,
  computeRollingLoadSeries,
} from "@/lib/sports-science/rolling-load";

function buildMap(entries: { daysAgo: number; tss: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const { daysAgo, tss } of entries) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    map.set(d.toISOString().slice(0, 10), tss);
  }
  return map;
}

describe("rollingLoad", () => {
  it("returns 0 for empty map", () => {
    expect(rollingLoad(new Map(), 7)).toBe(0);
  });

  it("sums only within the window", () => {
    const map = buildMap([
      { daysAgo: 0, tss: 100 },
      { daysAgo: 3, tss: 80 },
      { daysAgo: 6, tss: 60 },
      { daysAgo: 10, tss: 999 }, // outside 7-day window
    ]);
    expect(rollingLoad(map, 7)).toBe(240);
  });

  it("includes today (daysAgo=0)", () => {
    const map = buildMap([{ daysAgo: 0, tss: 50 }]);
    expect(rollingLoad(map, 1)).toBe(50);
  });
});

describe("weeklyLoad", () => {
  it("sums last 7 days", () => {
    const map = buildMap(
      Array.from({ length: 7 }, (_, i) => ({ daysAgo: i, tss: 100 }))
    );
    expect(weeklyLoad(map)).toBe(700);
  });

  it("excludes day 8", () => {
    const map = buildMap([
      ...Array.from({ length: 7 }, (_, i) => ({ daysAgo: i, tss: 100 })),
      { daysAgo: 7, tss: 500 },
    ]);
    expect(weeklyLoad(map)).toBe(700);
  });
});

describe("monthlyLoad", () => {
  it("sums last 28 days", () => {
    const map = buildMap(
      Array.from({ length: 28 }, (_, i) => ({ daysAgo: i, tss: 50 }))
    );
    expect(monthlyLoad(map)).toBe(1400);
  });

  it("excludes day 29", () => {
    const map = buildMap([
      ...Array.from({ length: 28 }, (_, i) => ({ daysAgo: i, tss: 50 })),
      { daysAgo: 28, tss: 999 },
    ]);
    expect(monthlyLoad(map)).toBe(1400);
  });
});

describe("computeRollingLoadSeries", () => {
  it("returns empty array for empty map", () => {
    expect(computeRollingLoadSeries(new Map())).toEqual([]);
  });

  it("returns outputDays entries", () => {
    const map = buildMap([{ daysAgo: 0, tss: 100 }]);
    const result = computeRollingLoadSeries(map, 30);
    expect(result).toHaveLength(30);
  });

  it("last entry has weekly and monthly values", () => {
    const map = buildMap(
      Array.from({ length: 28 }, (_, i) => ({ daysAgo: i, tss: 100 }))
    );
    const result = computeRollingLoadSeries(map, 28);
    const last = result[result.length - 1];
    expect(last.weekly).toBe(700);
    expect(last.monthly).toBe(2800);
  });

  it("each entry has date, tss, weekly, monthly fields", () => {
    const map = buildMap([{ daysAgo: 0, tss: 80 }]);
    const series = computeRollingLoadSeries(map, 7);
    for (const entry of series) {
      expect(entry).toHaveProperty("date");
      expect(entry).toHaveProperty("tss");
      expect(entry).toHaveProperty("weekly");
      expect(entry).toHaveProperty("monthly");
    }
  });

  it("entries are in chronological order (oldest first)", () => {
    const map = buildMap(Array.from({ length: 7 }, (_, i) => ({ daysAgo: i, tss: 50 })));
    const series = computeRollingLoadSeries(map, 7);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].date >= series[i - 1].date).toBe(true);
    }
  });
});
