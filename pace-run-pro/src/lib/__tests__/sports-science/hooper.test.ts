import { describe, it, expect } from "vitest";
import { calculateHooperIndex } from "@/lib/calculations";

describe("calculateHooperIndex", () => {
  it("returns score 0 for all-zero input (best case)", () => {
    const result = calculateHooperIndex({ sleep: 0, stress: 0, fatigue: 0, pain: 0 });
    expect(result.score).toBe(0);
    expect(result.classification).toBe("excelente");
  });

  it("returns score 40 for all-10 input (worst case)", () => {
    const result = calculateHooperIndex({ sleep: 10, stress: 10, fatigue: 10, pain: 10 });
    expect(result.score).toBe(40);
    expect(result.classification).toBe("critico");
  });

  it("classification 'bom' for normalized ≤ 4", () => {
    // normalized = score/4 ≤ 4 → score ≤ 16
    const result = calculateHooperIndex({ sleep: 4, stress: 4, fatigue: 4, pain: 4 });
    expect(result.normalized).toBe(4);
    expect(result.classification).toBe("bom");
  });

  it("classification 'moderado' for normalized ≤ 6", () => {
    const result = calculateHooperIndex({ sleep: 6, stress: 6, fatigue: 6, pain: 6 });
    expect(result.normalized).toBe(6);
    expect(result.classification).toBe("moderado");
  });

  it("classification 'ruim' for normalized ≤ 8", () => {
    const result = calculateHooperIndex({ sleep: 8, stress: 8, fatigue: 8, pain: 8 });
    expect(result.normalized).toBe(8);
    expect(result.classification).toBe("ruim");
  });

  it("score is sum of all components", () => {
    const result = calculateHooperIndex({ sleep: 3, stress: 5, fatigue: 2, pain: 4 });
    expect(result.score).toBe(14);
  });

  it("normalized is score/4", () => {
    const result = calculateHooperIndex({ sleep: 2, stress: 2, fatigue: 2, pain: 2 });
    expect(result.normalized).toBeCloseTo(2, 1);
  });

  it("returns a color string", () => {
    const result = calculateHooperIndex({ sleep: 1, stress: 1, fatigue: 1, pain: 1 });
    expect(result.color).toMatch(/^#/);
  });

  it("returns a recommendation string", () => {
    const result = calculateHooperIndex({ sleep: 5, stress: 5, fatigue: 5, pain: 5 });
    expect(typeof result.recommendation).toBe("string");
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});
