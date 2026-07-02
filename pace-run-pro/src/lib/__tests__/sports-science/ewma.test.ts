import { describe, it, expect } from "vitest";
import { computeEWMASeries, ewmaRiskLevel } from "@/lib/training-load";

/** Generate a Map of the last N days with a fixed TSS value. */
function recentTssMap(days: number, tssPerDay: number): Map<string, number> {
  const map = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, tssPerDay);
  }
  return map;
}

describe("computeEWMASeries", () => {
  it("returns empty array for empty input", () => {
    expect(computeEWMASeries(new Map())).toEqual([]);
  });

  it("returns at least 1 entry for a single recent day", () => {
    const today = new Date().toISOString().slice(0, 10);
    const tss = new Map([[today, 80]]);
    const result = computeEWMASeries(tss, undefined, undefined, 90);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // The entry for today should have tss=80
    const todayEntry = result.find((d) => d.date === today);
    expect(todayEntry?.tss).toBe(80);
  });

  it("ewmaAcute and ewmaChronic start at 0 and build up with training", () => {
    const tss = recentTssMap(30, 80);
    const result = computeEWMASeries(tss);
    // After 30 days of training, both metrics should be > 0
    const last = result[result.length - 1];
    expect(last.ewmaAcute).toBeGreaterThan(0);
    expect(last.ewmaChronic).toBeGreaterThan(0);
  });

  it("consistent training builds ewmaChronic over 60 days", () => {
    const tss = recentTssMap(60, 80);
    const result = computeEWMASeries(tss, undefined, undefined, 60);
    const last = result[result.length - 1];
    expect(last.ewmaChronic).toBeGreaterThan(20);
  });

  it("ewmaChronic is always ≥ 0", () => {
    const tss = recentTssMap(30, 50);
    const result = computeEWMASeries(tss);
    result.forEach((d) => expect(d.ewmaChronic).toBeGreaterThanOrEqual(0));
  });

  it("ewmaRatio is ewmaAcute / ewmaChronic", () => {
    const tss = recentTssMap(45, 80);
    const result = computeEWMASeries(tss, undefined, undefined, 45);
    const last = result[result.length - 1];
    if (last.ewmaChronic > 0) {
      const expectedRatio = Math.round((last.ewmaAcute / last.ewmaChronic) * 100) / 100;
      expect(last.ewmaRatio).toBeCloseTo(expectedRatio, 1);
    }
  });
});

describe("ewmaRiskLevel", () => {
  it("level low for ratio < 0.8", () => {
    expect(ewmaRiskLevel(0.5).level).toBe("low");
  });

  it("level moderate for ratio in [0.8, 1.3]", () => {
    expect(ewmaRiskLevel(0.8).level).toBe("moderate");
    expect(ewmaRiskLevel(1.3).level).toBe("moderate");
  });

  it("level high for ratio in (1.3, 1.5]", () => {
    expect(ewmaRiskLevel(1.4).level).toBe("high");
  });

  it("level very_high for ratio > 1.5", () => {
    expect(ewmaRiskLevel(1.6).level).toBe("very_high");
  });

  it("recommendation for very_high does not use directive medical language", () => {
    const r = ewmaRiskLevel(2.0);
    expect(r.recommendation).not.toMatch(/pare imediatamente/i);
    expect(r.recommendation).not.toMatch(/está lesionado/i);
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it("returns color string for all levels", () => {
    [0.5, 1.0, 1.4, 2.0].forEach((ratio) => {
      expect(ewmaRiskLevel(ratio).color).toMatch(/^#/);
    });
  });
});
