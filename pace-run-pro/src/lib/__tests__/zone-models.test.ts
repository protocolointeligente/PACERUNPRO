import { describe, it, expect } from "vitest";
import {
  SPORT_LABELS,
  METHOD_LABELS,
  ZONE_PRESETS,
  type ZoneModelPreset,
} from "@/lib/zone-models";

describe("SPORT_LABELS", () => {
  it("contains expected sports", () => {
    expect(SPORT_LABELS["CORRIDA"]).toBe("Corrida");
    expect(SPORT_LABELS["CICLISMO"]).toBe("Ciclismo");
    expect(SPORT_LABELS["NATACAO"]).toBe("Natação");
    expect(SPORT_LABELS["FORCA"]).toBe("Força");
  });
});

describe("METHOD_LABELS", () => {
  it("contains expected methods", () => {
    expect(METHOD_LABELS["FC_MAXIMA"]).toBe("FC Máxima");
    expect(METHOD_LABELS["FTP"]).toBe("FTP (Potência)");
    expect(METHOD_LABELS["PACE"]).toBe("Pace Limiar");
    expect(METHOD_LABELS["RPE"]).toBe("RPE / Esforço");
  });
});

describe("ZONE_PRESETS", () => {
  it("exports an array of presets", () => {
    expect(Array.isArray(ZONE_PRESETS)).toBe(true);
    expect(ZONE_PRESETS.length).toBeGreaterThan(0);
  });

  it("each preset has required fields", () => {
    for (const preset of ZONE_PRESETS) {
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("sport");
      expect(preset).toHaveProperty("method");
      expect(preset).toHaveProperty("zoneCount");
      expect(Array.isArray(preset.zones)).toBe(true);
    }
  });

  it("zoneCount matches actual zones length", () => {
    for (const preset of ZONE_PRESETS) {
      expect(preset.zones).toHaveLength(preset.zoneCount);
    }
  });

  it("each zone has number, name, color, minPct, maxPct", () => {
    for (const preset of ZONE_PRESETS) {
      for (const zone of preset.zones) {
        expect(typeof zone.number).toBe("number");
        expect(typeof zone.name).toBe("string");
        expect(zone.color).toMatch(/^#/);
        expect(typeof zone.minPct).toBe("number");
        expect(typeof zone.maxPct).toBe("number");
      }
    }
  });

  it("zones are numbered starting from 1", () => {
    for (const preset of ZONE_PRESETS) {
      expect(preset.zones[0].number).toBe(1);
    }
  });

  it("includes running presets with FC_MAXIMA and PACE methods", () => {
    const methods = ZONE_PRESETS.filter((p) => p.sport === "CORRIDA").map((p) => p.method);
    expect(methods).toContain("FC_MAXIMA");
    expect(methods).toContain("PACE");
  });

  it("includes cycling preset with FTP method", () => {
    const cycling = ZONE_PRESETS.filter((p) => p.sport === "CICLISMO");
    const ftpPreset = cycling.find((p) => p.method === "FTP");
    expect(ftpPreset).toBeDefined();
    expect(ftpPreset?.zoneCount).toBe(7);
  });

  it("strength preset uses RPE method", () => {
    const forca = ZONE_PRESETS.find((p) => p.sport === "FORCA");
    expect(forca?.method).toBe("RPE");
  });
});
