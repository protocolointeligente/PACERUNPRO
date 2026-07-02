import { describe, it, expect } from "vitest";
import { calculateHrZones } from "@/lib/calculations";

describe("calculateHrZones (Karvonen)", () => {
  it("returns 5 zones", () => {
    const zones = calculateHrZones(190, 60);
    expect(zones).toHaveLength(5);
  });

  it("zones are numbered 1-5", () => {
    const zones = calculateHrZones(190, 60);
    expect(zones.map((z) => z.zone)).toEqual([1, 2, 3, 4, 5]);
  });

  it("each zone max equals next zone min", () => {
    const zones = calculateHrZones(190, 60);
    for (let i = 0; i < zones.length - 1; i++) {
      expect(zones[i].max).toBe(zones[i + 1].min);
    }
  });

  it("zone 1 min is above resting HR", () => {
    const zones = calculateHrZones(190, 60);
    expect(zones[0].min).toBeGreaterThan(60);
  });

  it("zone 5 max equals max HR", () => {
    const zones = calculateHrZones(190, 60);
    expect(zones[4].max).toBe(190);
  });

  it("higher max HR shifts all zones up", () => {
    const zones180 = calculateHrZones(180, 60);
    const zones200 = calculateHrZones(200, 60);
    expect(zones200[2].min).toBeGreaterThan(zones180[2].min);
  });

  it("uses default restingHr of 60 when not provided", () => {
    const zonesDefault = calculateHrZones(190);
    const zonesExplicit = calculateHrZones(190, 60);
    expect(zonesDefault[0].min).toBe(zonesExplicit[0].min);
  });

  it("zones have color fields", () => {
    const zones = calculateHrZones(190);
    zones.forEach((z) => expect(z.color).toMatch(/^#/));
  });
});
