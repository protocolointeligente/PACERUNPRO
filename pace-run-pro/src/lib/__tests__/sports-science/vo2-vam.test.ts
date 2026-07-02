import { describe, it, expect } from "vitest";
import { vo2From5MinTest, vo2From3km, vo2From2400m, vamFromDistanceTime, paceFromKmh, vo2FromVam, thresholdPaceFromTest } from "@/lib/calculations";

describe("vo2From5MinTest", () => {
  it("calculates VO2max from 5-min test distance", () => {
    // George et al. 1993: VO2max = 0.0268 * distance - 11.33 (approx)
    const v = vo2From5MinTest(1500);
    expect(v).toBeGreaterThan(20);
    expect(v).toBeLessThan(90);
  });

  it("returns higher VO2max for longer distance", () => {
    expect(vo2From5MinTest(1600)).toBeGreaterThan(vo2From5MinTest(1400));
  });
});

describe("vo2From3km", () => {
  it("estimates VO2max from 3km time (ACSM)", () => {
    const v = vo2From3km(720); // 12 min
    expect(v).toBeGreaterThan(30);
    expect(v).toBeLessThan(80);
  });

  it("faster runner has higher VO2max", () => {
    expect(vo2From3km(600)).toBeGreaterThan(vo2From3km(900));
  });
});

describe("vo2From2400m", () => {
  it("estimates VO2max from 2400m time", () => {
    const v = vo2From2400m(720); // 12 min
    expect(v).toBeGreaterThan(20);
    expect(v).toBeLessThan(90);
  });

  it("faster 2400m → higher VO2max", () => {
    expect(vo2From2400m(500)).toBeGreaterThan(vo2From2400m(700));
  });
});

describe("vamFromDistanceTime", () => {
  it("calculates VAM in km/h", () => {
    // 3000m in 600s = 18 km/h
    expect(vamFromDistanceTime(3000, 600)).toBeCloseTo(18, 1);
  });

  it("shorter time → higher VAM", () => {
    expect(vamFromDistanceTime(3000, 500)).toBeGreaterThan(vamFromDistanceTime(3000, 700));
  });
});

describe("paceFromKmh", () => {
  it("converts 10 km/h to 360 sec/km (6:00/km)", () => {
    expect(paceFromKmh(10)).toBeCloseTo(360, 0);
  });

  it("converts 12 km/h to 300 sec/km (5:00/km)", () => {
    expect(paceFromKmh(12)).toBeCloseTo(300, 0);
  });
});

describe("vo2FromVam", () => {
  it("returns positive VO2max from VAM", () => {
    const v = vo2FromVam(18);
    expect(v).toBeGreaterThan(0);
  });

  it("higher VAM → higher VO2max", () => {
    expect(vo2FromVam(20)).toBeGreaterThan(vo2FromVam(15));
  });
});

describe("thresholdPaceFromTest", () => {
  it("returns threshold pace in sec/km for 5km test", () => {
    const pace = thresholdPaceFromTest(5000, 1200); // 20min
    expect(pace).toBeGreaterThan(0);
  });

  it("faster test → faster threshold pace", () => {
    expect(thresholdPaceFromTest(5000, 1000)).toBeLessThan(thresholdPaceFromTest(5000, 1400));
  });
});
