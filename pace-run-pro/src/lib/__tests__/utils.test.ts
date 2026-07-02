import { describe, it, expect } from "vitest";
import { cn, formatPace, formatDuration, formatNumber, formatBRL, formatBRLCents } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "excluded", "included");
    expect(result).toContain("included");
    expect(result).not.toContain("excluded");
  });

  it("returns string for empty args", () => {
    expect(typeof cn()).toBe("string");
  });

  it("deduplicates Tailwind conflicting classes", () => {
    // twMerge should keep the last one
    const result = cn("text-sm", "text-lg");
    expect(result).toContain("text-lg");
    expect(result).not.toContain("text-sm");
  });
});

describe("formatPace", () => {
  it("formats 360 sec/km as 6:00/km", () => {
    expect(formatPace(360)).toBe("6:00/km");
  });

  it("formats 300 sec/km as 5:00/km", () => {
    expect(formatPace(300)).toBe("5:00/km");
  });

  it("formats 275 sec/km as 4:35/km", () => {
    expect(formatPace(275)).toBe("4:35/km");
  });

  it("pads seconds correctly for sub-10 values", () => {
    expect(formatPace(305)).toBe("5:05/km");
  });
});

describe("formatDuration", () => {
  it("formats under 1h as M:SS", () => {
    const r = formatDuration(90);
    expect(r).toBe("1:30");
  });

  it("formats exactly 1 hour with h notation", () => {
    expect(formatDuration(3600)).toBe("1h00min");
  });

  it("formats 1h30min correctly", () => {
    expect(formatDuration(5400)).toBe("1h30min");
  });

  it("formats 0 seconds as 0:00", () => {
    expect(formatDuration(0)).toBe("0:00");
  });
});

describe("formatNumber", () => {
  it("formats number with 1 decimal by default", () => {
    const r = formatNumber(1234.5);
    expect(r).toContain("1");
    expect(r).toContain("234");
  });

  it("formats number with 0 decimals", () => {
    const r = formatNumber(42.9, 0);
    expect(r).not.toContain(".");
    expect(r).not.toContain(",9");
  });
});

describe("formatBRL", () => {
  it("formats currency with 2 decimal places", () => {
    const r = formatBRL(1234.56);
    expect(r).toContain("234");
  });
});

describe("formatBRLCents", () => {
  it("converts 10000 centavos to R$ 100,00 format", () => {
    const r = formatBRLCents(10000);
    expect(r).toContain("100");
    expect(r).toContain("R$");
  });

  it("converts 1 centavo correctly", () => {
    const r = formatBRLCents(1);
    expect(r).toContain("0,01");
  });
});
