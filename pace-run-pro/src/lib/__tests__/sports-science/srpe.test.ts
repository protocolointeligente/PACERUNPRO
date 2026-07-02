import { describe, it, expect } from "vitest";
import { sRPE, sessionRPE } from "@/lib/sports-science/srpe";

describe("sRPE (Foster, 2001)", () => {
  it("60 min × RPE 7 = 420", () => {
    expect(sRPE(60, 7)).toBe(420);
  });

  it("30 min × RPE 5 = 150", () => {
    expect(sRPE(30, 5)).toBe(150);
  });

  it("0 duration → 0", () => {
    expect(sRPE(0, 8)).toBe(0);
  });

  it("higher RPE produces higher load for same duration", () => {
    expect(sRPE(45, 9)).toBeGreaterThan(sRPE(45, 6));
  });
});

describe("sessionRPE (re-export alias)", () => {
  it("produces same result as sRPE", () => {
    expect(sessionRPE(60, 7)).toBe(sRPE(60, 7));
  });
});
