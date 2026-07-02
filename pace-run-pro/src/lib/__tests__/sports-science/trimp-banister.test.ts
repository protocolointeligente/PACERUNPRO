import { describe, it, expect } from "vitest";
import { trimpBanister, trimpWithFallback } from "@/lib/training-load";

describe("trimpBanister", () => {
  it("calculates positive TRIMP for a moderate effort run", () => {
    // 60 min at avgHr=150, maxHr=195, hrRest=60, male
    const trimp = trimpBanister(60, 150, 195, 60, "M");
    expect(trimp).not.toBeNull();
    expect(trimp!).toBeGreaterThan(0);
  });

  it("female coefficient (1.67) produces lower TRIMP than male (1.92) at same effort", () => {
    const male = trimpBanister(60, 160, 190, 55, "M");
    const female = trimpBanister(60, 160, 190, 55, "F");
    expect(male).not.toBeNull();
    expect(female).not.toBeNull();
    expect(male!).toBeGreaterThan(female!);
  });

  it("longer duration → higher TRIMP", () => {
    const short = trimpBanister(30, 155, 190, 60, "M");
    const long = trimpBanister(90, 155, 190, 60, "M");
    expect(long!).toBeGreaterThan(short!);
  });

  it("returns null for invalid inputs", () => {
    expect(trimpBanister(0, 160, 190, 60)).toBeNull();   // zero duration
    expect(trimpBanister(60, 0, 190, 60)).toBeNull();    // zero avgHr
    expect(trimpBanister(60, 160, 0, 60)).toBeNull();    // zero maxHr
    expect(trimpBanister(60, 160, 190, 0)).toBeNull();   // zero hrRest
    expect(trimpBanister(60, 160, 60, 60)).toBeNull();   // maxHr = hrRest
  });

  it("higher HR ratio → higher TRIMP", () => {
    const easy = trimpBanister(60, 130, 190, 60, "M");  // hrRatio ≈ 0.54
    const hard = trimpBanister(60, 175, 190, 60, "M");  // hrRatio ≈ 0.88
    expect(hard!).toBeGreaterThan(easy!);
  });
});

describe("trimpWithFallback", () => {
  it("uses Banister when HR data is available", () => {
    const result = trimpWithFallback(60, { avgHr: 155, maxHr: 190, hrRest: 60 });
    expect(result.method).toBe("banister");
    expect(result.value).toBeGreaterThan(0);
  });

  it("falls back to Foster RPE when HR data missing", () => {
    const result = trimpWithFallback(60, { rpe: 7 });
    expect(result.method).toBe("foster");
    expect(result.value).toBe(420); // 60 * 7
  });

  it("Foster fallback uses default RPE of 6 when rpe not provided", () => {
    const result = trimpWithFallback(60, {});
    expect(result.method).toBe("foster");
    expect(result.value).toBe(360); // 60 * 6
  });
});
