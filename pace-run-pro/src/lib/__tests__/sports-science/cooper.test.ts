import { describe, it, expect } from "vitest";
import { vo2FromCooper, cooperClassification } from "@/lib/sports-science/cooper";

describe("vo2FromCooper", () => {
  it("3000m → VO2max ≈ 55.9", () => {
    expect(vo2FromCooper(3000)).toBeCloseTo(55.9, 0);
  });

  it("2400m → VO2max ≈ 42.6", () => {
    expect(vo2FromCooper(2400)).toBeCloseTo(42.6, 0);
  });

  it("lower distance → lower VO2max", () => {
    expect(vo2FromCooper(2000)).toBeLessThan(vo2FromCooper(3000));
  });
});

describe("cooperClassification", () => {
  it("≥55 → Excelente", () => expect(cooperClassification(56).category).toBe("Excelente"));
  it("48-54 → Bom", () => expect(cooperClassification(50).category).toBe("Bom"));
  it("42-47 → Regular", () => expect(cooperClassification(44).category).toBe("Regular"));
  it("35-41 → Fraco", () => expect(cooperClassification(37).category).toBe("Fraco"));
  it("<35 → Muito Fraco", () => expect(cooperClassification(30).category).toBe("Muito Fraco"));

  it("has a color field", () => {
    expect(cooperClassification(50).color).toMatch(/^#/);
  });
});
