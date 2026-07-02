import { describe, it, expect } from "vitest";
import {
  computeTendency,
  detectOverreaching,
  detectTaper,
  detectUndertraining,
} from "@/lib/sports-science/tendency";
import type { LoadDay } from "@/lib/training-load";

function makeSeries(days: { tss: number; ctl: number; atl: number; tsb: number }[]): LoadDay[] {
  return days.map((d, i) => ({
    date: `2025-01-${String(i + 1).padStart(2, "0")}`,
    ...d,
  }));
}

function uniformSeries(n: number, ctl: number, atl: number, tsb: number, tss = 80): LoadDay[] {
  return makeSeries(Array.from({ length: n }, () => ({ tss, ctl, atl, tsb })));
}

describe("computeTendency", () => {
  it("returns stable with < 3 points", () => {
    const result = computeTendency(uniformSeries(2, 50, 40, 10));
    expect(result.trend).toBe("stable");
    expect(result.slope).toBe(0);
  });

  it("detects rising trend when CTL increases steadily", () => {
    const series = makeSeries(
      Array.from({ length: 14 }, (_, i) => ({ tss: 100, ctl: 20 + i * 0.5, atl: 25, tsb: -5 }))
    );
    const result = computeTendency(series, 14);
    expect(result.trend).toBe("rising");
    expect(result.slope).toBeGreaterThan(0);
  });

  it("detects declining trend when CTL decreases steadily", () => {
    const series = makeSeries(
      Array.from({ length: 14 }, (_, i) => ({ tss: 0, ctl: 50 - i * 0.5, atl: 10, tsb: 40 }))
    );
    const result = computeTendency(series, 14);
    expect(result.trend).toBe("declining");
    expect(result.slope).toBeLessThan(0);
  });

  it("stable when CTL is flat", () => {
    const series = uniformSeries(14, 40, 30, 10);
    const result = computeTendency(series, 14);
    expect(result.trend).toBe("stable");
  });

  it("confidence (R²) is between 0 and 1", () => {
    const series = makeSeries(
      Array.from({ length: 14 }, (_, i) => ({ tss: 80, ctl: 30 + i, atl: 35, tsb: -5 }))
    );
    const result = computeTendency(series, 14);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe("detectOverreaching", () => {
  it("returns not detected with < 7 days", () => {
    const result = detectOverreaching(uniformSeries(5, 30, 35, -5));
    expect(result.detected).toBe(false);
  });

  it("detects TSB < -30 as danger", () => {
    const series = [...uniformSeries(10, 50, 80, 0), ...uniformSeries(4, 50, 85, -35)];
    const result = detectOverreaching(series);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("danger");
  });

  it("detects 5 consecutive days TSB < -20 as warning", () => {
    const series = [...uniformSeries(9, 40, 55, -5), ...uniformSeries(5, 40, 65, -25)];
    const result = detectOverreaching(series);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("warning");
  });

  it("detects spike > 135% as warning", () => {
    const lastWeek = uniformSeries(7, 30, 35, -5, 50);
    const thisWeek = uniformSeries(7, 40, 70, -30, 200);
    const result = detectOverreaching([...lastWeek, ...thisWeek]);
    expect(result.detected).toBe(true);
  });

  it("no overreaching with balanced load", () => {
    const result = detectOverreaching(uniformSeries(14, 40, 45, -5, 80));
    expect(result.detected).toBe(false);
  });
});

describe("detectTaper", () => {
  it("returns none with < 14 days", () => {
    const result = detectTaper(uniformSeries(10, 40, 35, 5));
    expect(result.phase).toBe("none");
  });

  it("detects peak form when TSB > 10, rising, ATL falling", () => {
    const base = Array.from({ length: 8 }, (_, i) => ({
      tss: 80, ctl: 45, atl: 50 - i, tsb: -5 + i,
    }));
    const peak = Array.from({ length: 7 }, (_, i) => ({
      tss: 20, ctl: 44, atl: 30 - i * 2, tsb: 14 + i,
    }));
    const series = makeSeries([...base, ...peak]);
    const result = detectTaper(series);
    expect(result.detected).toBe(true);
    expect(result.phase).toBe("peak");
  });

  it("detects taper phase when TSB rising and ATL falling", () => {
    // TSB going from -10 to +5 over 15 days, ATL falling
    const series = makeSeries(
      Array.from({ length: 15 }, (_, i) => ({
        tss: 30,
        ctl: 45,
        atl: 55 - i * 2,
        tsb: -10 + i,
      }))
    );
    const result = detectTaper(series);
    expect(result.detected).toBe(true);
    expect(["taper", "peak", "pre-taper"]).toContain(result.phase);
  });

  it("no taper when ATL rising", () => {
    const series = makeSeries(
      Array.from({ length: 15 }, (_, i) => ({
        tss: 120, ctl: 40 + i * 0.5, atl: 35 + i, tsb: 5 - i * 0.5,
      }))
    );
    const result = detectTaper(series);
    expect(result.phase).toBe("none");
  });
});

describe("detectUndertraining", () => {
  it("returns false with < 7 days", () => {
    const result = detectUndertraining(uniformSeries(5, 40, 30, 10));
    expect(result.detected).toBe(false);
  });

  it("detects high TSB with falling CTL", () => {
    const series = [
      ...uniformSeries(7, 50, 25, 25, 10),
      ...uniformSeries(1, 40, 15, 30, 0), // last day: CTL fell from 50 to 40
    ];
    // Manual: last has tsb=30 > 25, ctl=40 < prev7.ctl=50
    const result = detectUndertraining(series);
    expect(result.detected).toBe(true);
  });

  it("detects 7 consecutive days CTL declining with positive TSB", () => {
    const series = makeSeries(
      Array.from({ length: 8 }, (_, i) => ({
        tss: 10,
        ctl: 40 - i,
        atl: 20,
        tsb: 20,
      }))
    );
    const result = detectUndertraining(series);
    expect(result.detected).toBe(true);
  });

  it("detects weekly TSS well below monthly average", () => {
    // 21 days with TSS 100, then 7 days with TSS 0
    const healthy = uniformSeries(21, 50, 45, 5, 100);
    const idle = uniformSeries(7, 48, 30, 18, 0);
    const result = detectUndertraining([...healthy, ...idle]);
    expect(result.detected).toBe(true);
  });

  it("no undertraining with consistent load", () => {
    const result = detectUndertraining(uniformSeries(14, 45, 48, -3, 100));
    expect(result.detected).toBe(false);
  });

  it("no detection when monthly average TSS is zero (guard against divide by zero)", () => {
    // All TSS = 0 → avgWeekTss = 0, guard condition prevents false trigger
    const result = detectUndertraining(uniformSeries(28, 0, 0, 0, 0));
    expect(result.detected).toBe(false);
  });
});

describe("detectOverreaching — spike path with lastWeek=0", () => {
  it("no spike alert when lastWeek TSS is 0", () => {
    // This week has TSS, last week has none → ratio undefined, should not trigger spike
    const thisWeek = uniformSeries(7, 30, 35, -5, 100);
    const lastWeek = uniformSeries(7, 25, 20, 5, 0);
    const result = detectOverreaching([...lastWeek, ...thisWeek]);
    // Spike branch requires lastWeek > 0, so should NOT fire spike
    expect(result.detected).toBe(false);
  });
});

describe("detectTaper — pre-taper path", () => {
  it("detects pre-taper when ATL falling and TSB improving vs 2 weeks ago", () => {
    // TSB starts negative, ATL falling, but TSB not above 10 yet (not peak/taper)
    // But TSB is better than 2 weeks ago → pre-taper
    const series = makeSeries([
      ...Array.from({ length: 1 }, () => ({ tss: 120, ctl: 50, atl: 60, tsb: -15 })),
      ...Array.from({ length: 14 }, (_, i) => ({
        tss: 40, ctl: 50, atl: 55 - i * 2, tsb: -5 + i * 0.5,
      })),
    ]);
    const result = detectTaper(series);
    // With ATL falling and TSB improving, expect at least pre-taper or taper
    expect(result.detected).toBe(true);
    expect(["pre-taper", "taper", "peak"]).toContain(result.phase);
  });
});
