import { describe, it, expect } from "vitest";
import { hrTRIMP, estimateZoneMinutes, hrTRIMPWithFallback } from "@/lib/sports-science/trimp-edwards";

describe("hrTRIMP (Edwards, 1993)", () => {
  it("returns 0 for empty zones", () => {
    expect(hrTRIMP({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })).toBe(0);
  });

  it("correctly weights zone 1 (×1)", () => {
    expect(hrTRIMP({ z1: 10, z2: 0, z3: 0, z4: 0, z5: 0 })).toBe(10);
  });

  it("correctly weights zone 2 (×2)", () => {
    expect(hrTRIMP({ z1: 0, z2: 10, z3: 0, z4: 0, z5: 0 })).toBe(20);
  });

  it("correctly weights zone 3 (×3)", () => {
    expect(hrTRIMP({ z1: 0, z2: 0, z3: 10, z4: 0, z5: 0 })).toBe(30);
  });

  it("correctly weights zone 4 (×4)", () => {
    expect(hrTRIMP({ z1: 0, z2: 0, z3: 0, z4: 10, z5: 0 })).toBe(40);
  });

  it("correctly weights zone 5 (×5)", () => {
    expect(hrTRIMP({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 10 })).toBe(50);
  });

  it("sums mixed zone session correctly", () => {
    // 10×1 + 20×2 + 15×3 + 5×4 + 0×5 = 10+40+45+20 = 115
    expect(hrTRIMP({ z1: 10, z2: 20, z3: 15, z4: 5, z5: 0 })).toBe(115);
  });

  it("high-intensity 60-min session returns higher TRIMP than easy 60-min", () => {
    const hard = hrTRIMP({ z1: 0, z2: 0, z3: 0, z4: 30, z5: 30 });
    const easy = hrTRIMP({ z1: 30, z2: 30, z3: 0, z4: 0, z5: 0 });
    expect(hard).toBeGreaterThan(easy);
  });
});

describe("estimateZoneMinutes", () => {
  it("90% FCmax → mostly zone 5", () => {
    const z = estimateZoneMinutes(60, 180, 200); // 90% = 0.9
    expect(z.z5).toBeGreaterThan(z.z4);
    expect(z.z1 + z.z2 + z.z3).toBe(0);
  });

  it("75% FCmax → mostly zone 3", () => {
    const z = estimateZoneMinutes(60, 150, 200); // 75%
    expect(z.z3).toBeGreaterThan(z.z2);
    expect(z.z4 + z.z5).toBe(0);
  });

  it("55% FCmax → all zone 1", () => {
    const z = estimateZoneMinutes(60, 110, 200); // 55%
    expect(z.z1).toBe(60);
    expect(z.z2 + z.z3 + z.z4 + z.z5).toBe(0);
  });

  it("total minutes sums to duration", () => {
    const z = estimateZoneMinutes(45, 160, 200); // 80%
    const total = z.z1 + z.z2 + z.z3 + z.z4 + z.z5;
    expect(total).toBeCloseTo(45, 1);
  });
});

describe("hrTRIMPWithFallback", () => {
  it("uses zones directly when provided", () => {
    const zones = { z1: 0, z2: 0, z3: 10, z4: 10, z5: 0 };
    // 10×3 + 10×4 = 70
    expect(hrTRIMPWithFallback(20, { zones })).toBe(70);
  });

  it("estimates from avgHr/maxHr when zones not provided", () => {
    // 65% FCmax → zone 2 (×2): 30-min mostly z2 (24 min × 2 + 6 min × 1 = 54)
    const result = hrTRIMPWithFallback(30, { avgHr: 130, maxHr: 200 });
    expect(result).toBeGreaterThan(0);
  });
});
