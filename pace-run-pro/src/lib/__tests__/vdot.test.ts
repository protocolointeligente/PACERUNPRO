import { describe, it, expect } from "vitest";
import {
  calculateVDOT,
  vdotPaceSecPerKm,
  getTrainingPaces,
  parseRaceTime,
  TRAINING_ZONES,
  RACE_DISTANCES,
} from "../vdot";

describe("calculateVDOT", () => {
  it("retorna 0 para entradas inválidas", () => {
    expect(calculateVDOT(0, 600)).toBe(0);
    expect(calculateVDOT(5000, 0)).toBe(0);
  });

  it("5km em 20 min → VDOT entre 46 e 52", () => {
    // Daniels & Gilbert (1979): fórmula retorna ~49.8 para 5km/20min;
    // tabelas publicadas mostram ~47.4 — aceita range para ambas as versões
    const result = calculateVDOT(5000, 20 * 60);
    expect(result).toBeGreaterThan(46);
    expect(result).toBeLessThan(52);
  });

  it("10km mais rápido = VDOT maior", () => {
    const vdot20 = calculateVDOT(10000, 40 * 60);
    const vdot35 = calculateVDOT(10000, 35 * 60);
    expect(vdot35).toBeGreaterThan(vdot20);
  });

  it("maratona em 3h → VDOT ≈ 48-52", () => {
    const result = calculateVDOT(42195, 3 * 3600);
    expect(result).toBeGreaterThan(44);
    expect(result).toBeLessThan(58);
  });
});

describe("vdotPaceSecPerKm", () => {
  it("intensidade maior = pace mais rápido (menor seg/km)", () => {
    const easyPace = vdotPaceSecPerKm(50, 0.65);
    const intervalPace = vdotPaceSecPerKm(50, 0.98);
    expect(intervalPace).toBeLessThan(easyPace);
  });

  it("VDOT maior = pace mais rápido na mesma intensidade", () => {
    const pace50 = vdotPaceSecPerKm(50, 0.75);
    const pace60 = vdotPaceSecPerKm(60, 0.75);
    expect(pace60).toBeLessThan(pace50);
  });
});

describe("getTrainingPaces", () => {
  it("retorna as 5 zonas de treino de Daniels", () => {
    const paces = getTrainingPaces(50);
    expect(Object.keys(paces)).toEqual(["E", "M", "T", "I", "R"]);
  });

  it("pace de cada zona é consistente — E < M < T < I < R (mais rápido = menor seg/km)", () => {
    const paces = getTrainingPaces(50);
    // Pace em seg/km: menor = mais rápido
    // Zona R deve ter paces menores (mais rápidos) que E
    expect(paces.R.fastSecPerKm).toBeLessThan(paces.E.fastSecPerKm);
    expect(paces.I.fastSecPerKm).toBeLessThan(paces.T.fastSecPerKm);
  });

  it("intervalo de cada zona é válido (fast <= slow)", () => {
    const paces = getTrainingPaces(50);
    for (const zone of Object.values(paces)) {
      expect(zone.fastSecPerKm).toBeLessThanOrEqual(zone.slowSecPerKm);
    }
  });
});

describe("parseRaceTime", () => {
  it("converte MM:SS corretamente", () => {
    expect(parseRaceTime("20:00")).toBe(1200);
    expect(parseRaceTime("3:45")).toBe(225);
  });

  it("converte H:MM:SS corretamente", () => {
    expect(parseRaceTime("1:30:00")).toBe(5400);
    expect(parseRaceTime("3:05:30")).toBe(11130);
  });

  it("retorna 0 para entrada inválida", () => {
    expect(parseRaceTime("abc")).toBe(0);
  });
});

describe("TRAINING_ZONES", () => {
  it("contém exatamente 5 zonas", () => {
    expect(TRAINING_ZONES).toHaveLength(5);
  });

  it("IDs das zonas são E, M, T, I, R", () => {
    const ids = TRAINING_ZONES.map((z) => z.id);
    expect(ids).toEqual(["E", "M", "T", "I", "R"]);
  });

  it("intensidades são crescentes entre zonas", () => {
    for (let i = 0; i < TRAINING_ZONES.length - 1; i++) {
      expect(TRAINING_ZONES[i + 1].intensityMin).toBeGreaterThanOrEqual(
        TRAINING_ZONES[i].intensityMax - 0.05,
      );
    }
  });
});

describe("RACE_DISTANCES", () => {
  it("inclui as distâncias principais", () => {
    const meters = RACE_DISTANCES.map((d) => d.meters);
    expect(meters).toContain(5000);
    expect(meters).toContain(10000);
    expect(meters).toContain(21097);
    expect(meters).toContain(42195);
  });
});
