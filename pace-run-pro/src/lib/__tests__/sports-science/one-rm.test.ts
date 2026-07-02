import { describe, it, expect } from "vitest";
import { estimate1RM, zoneLoadsFrom1RM } from "@/lib/calculations";

describe("estimate1RM", () => {
  it("returns weight itself for 1 rep", () => {
    const result = estimate1RM(100, 1);
    expect(result.epley).toBe(100);
    expect(result.brzycki).toBe(100);
    expect(result.lombardi).toBe(100);
    expect(result.average).toBe(100);
  });

  it("estimates 1RM from 5 reps at 90kg", () => {
    const result = estimate1RM(90, 5);
    // Epley: 90*(1+5/30) = 90*1.167 ≈ 105
    expect(result.epley).toBeCloseTo(105, 0);
    // All formulas > original weight
    expect(result.brzycki).toBeGreaterThan(90);
    expect(result.lombardi).toBeGreaterThan(90);
    expect(result.average).toBeGreaterThan(90);
  });

  it("returns zeros for invalid input", () => {
    expect(estimate1RM(0, 5).epley).toBe(0);
    expect(estimate1RM(100, 0).epley).toBe(0);
  });

  it("higher reps → higher 1RM estimate", () => {
    const r5 = estimate1RM(80, 5);
    const r10 = estimate1RM(80, 10);
    expect(r10.average).toBeGreaterThan(r5.average);
  });

  it("Brzycki handles edge case at 36 reps without crashing", () => {
    expect(() => estimate1RM(60, 36)).not.toThrow();
  });
});

describe("zoneLoadsFrom1RM", () => {
  it("returns 5 training zones", () => {
    const zones = zoneLoadsFrom1RM(100);
    expect(Object.keys(zones)).toHaveLength(5);
  });

  it("forca_maxima zone is 90% of 1RM", () => {
    const zones = zoneLoadsFrom1RM(100);
    expect(zones.forca_maxima.kg).toBe(90);
    expect(zones.forca_maxima.pct).toBe(90);
  });

  it("zones are ordered by decreasing percentage", () => {
    const zones = zoneLoadsFrom1RM(200);
    expect(zones.forca_maxima.kg).toBeGreaterThan(zones.hipertrofia.kg);
    expect(zones.hipertrofia.kg).toBeGreaterThan(zones.resistencia.kg);
  });
});
