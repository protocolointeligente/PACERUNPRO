import { describe, it, expect } from "vitest";
import { maxHrTanaka, maxHrFox } from "@/lib/sports-science/tanaka";

describe("maxHrTanaka (2001)", () => {
  it("age 30 → 187", () => expect(maxHrTanaka(30)).toBe(187));
  it("age 40 → 180", () => expect(maxHrTanaka(40)).toBe(180));
  it("age 50 → 173", () => expect(maxHrTanaka(50)).toBe(173));
  it("older age → lower maxHR", () => expect(maxHrTanaka(60)).toBeLessThan(maxHrTanaka(30)));
});

describe("maxHrFox (1971)", () => {
  it("age 30 → 190", () => expect(maxHrFox(30)).toBe(190));
  it("age 40 → 180", () => expect(maxHrFox(40)).toBe(180));
  it("older age → lower maxHR", () => expect(maxHrFox(60)).toBeLessThan(maxHrFox(20)));
});

describe("Tanaka vs Fox comparison", () => {
  it("Fox gives higher estimate than Tanaka for young athletes (age < 40)", () => {
    // Fox: 220 - age; Tanaka: 208 - 0.7×age. Crossover at age 40.
    expect(maxHrFox(25)).toBeGreaterThan(maxHrTanaka(25));
  });
  it("Tanaka gives higher estimate than Fox for older adults (age > 40)", () => {
    // After crossover at 40, Fox drops faster (1 bpm/yr vs 0.7 bpm/yr)
    expect(maxHrTanaka(55)).toBeGreaterThan(maxHrFox(55));
  });
});
