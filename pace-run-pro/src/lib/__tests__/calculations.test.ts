import { describe, it, expect } from "vitest";
import {
  vo2FromCooper,
  vo2From5MinTest,
  vo2From3km,
  vo2From2400m,
  vamFromDistanceTime,
  paceFromKmh,
  vo2FromVam,
  calculateRast,
  calculateHrZones,
  sessionLoad,
  weeklyLoadStatus,
  evaluateCheckInRules,
  maxHrTanaka,
  estimate1RM,
  zoneLoadsFrom1RM,
  calculateHooperIndex,
} from "../calculations";

// ── VO2max por testes de campo ──────────────────────────────────────────────

describe("vo2FromCooper", () => {
  it("retorna VO2max correto para 2800m em 12 min (atleta treinado)", () => {
    const result = vo2FromCooper(2800);
    expect(result).toBeCloseTo(51.4, 0);
  });

  it("retorna valor negativo para distância muito baixa (inativo extremo)", () => {
    // Cooper formula: (distanceM - 504.9) / 44.73 — negativo quando distância < 504.9m
    const result = vo2FromCooper(400);
    expect(result).toBeLessThan(0);
  });
});

describe("vo2From5MinTest", () => {
  it("retorna VO2max razoável para 1500m em 5 minutos", () => {
    const result = vo2From5MinTest(1500);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(75);
  });
});

describe("vo2From3km", () => {
  it("retorna VO2max coerente para 12 min em 3km (corredor médio)", () => {
    const result = vo2From3km(12 * 60);
    expect(result).toBeGreaterThan(40);
    expect(result).toBeLessThan(65);
  });
});

describe("vo2From2400m", () => {
  it("retorna valor positivo para 12 minutos", () => {
    const result = vo2From2400m(12 * 60);
    expect(result).toBeGreaterThan(0);
  });
});

// ── VAM e pace ─────────────────────────────────────────────────────────────────────

describe("vamFromDistanceTime", () => {
  it("calcula VAM corretamente — 3000m em 10min = 18 km/h", () => {
    const result = vamFromDistanceTime(3000, 600);
    expect(result).toBeCloseTo(18, 1);
  });
});

describe("paceFromKmh", () => {
  it("converte 12 km/h para 300 seg/km (5:00/km)", () => {
    expect(paceFromKmh(12)).toBe(300);
  });

  it("retorna 0 para velocidade zero ou negativa", () => {
    expect(paceFromKmh(0)).toBe(0);
  });
});

describe("vo2FromVam", () => {
  it("estima VO2max de 63 ml/kg/min para VAM de 18 km/h", () => {
    expect(vo2FromVam(18)).toBeCloseTo(63, 0);
  });
});

// ── RAST ────────────────────────────────────────────────────────────────────────────

describe("calculateRast", () => {
  const splits = [
    { timeSec: 5.1 },
    { timeSec: 5.3 },
    { timeSec: 5.5 },
    { timeSec: 5.8 },
    { timeSec: 6.0 },
    { timeSec: 6.3 },
  ];

  it("calcula pico de potência maior que potência mínima", () => {
    const result = calculateRast(splits, 70);
    expect(result.peakPowerW).toBeGreaterThan(result.minPowerW);
  });

  it("índice de fadiga é positivo", () => {
    const result = calculateRast(splits, 70);
    expect(result.fatigueIndexWPerS).toBeGreaterThan(0);
  });

  it("retorna 6 valores de potência", () => {
    const result = calculateRast(splits, 70);
    expect(result.powers).toHaveLength(6);
  });
});

// ── FC e zonas ────────────────────────────────────────────────────────────────

describe("calculateHrZones", () => {
  it("retorna 5 zonas de FC", () => {
    const zones = calculateHrZones(190, 55);
    expect(zones).toHaveLength(5);
  });

  it("zonas são crescentes (min da zona N+1 ≈ max da zona N)", () => {
    const zones = calculateHrZones(190, 55);
    for (let i = 0; i < zones.length - 1; i++) {
      expect(zones[i + 1].min).toBeGreaterThanOrEqual(zones[i].max - 1);
    }
  });

  it("zona 5 máxima é igual à FC máxima", () => {
    const zones = calculateHrZones(190, 55);
    expect(zones[4].max).toBe(190);
  });
});

// ── Tanaka FC max ──────────────────────────────────────────────────────────

describe("maxHrTanaka", () => {
  it("retorna 173 para atleta de 50 anos (208 - 0.7×50)", () => {
    expect(maxHrTanaka(50)).toBe(173);
  });

  it("retorna 194 para atleta de 20 anos", () => {
    expect(maxHrTanaka(20)).toBe(194);
  });
});

// ── 1RM ───────────────────────────────────────────────────────────────────────────

describe("estimate1RM", () => {
  it("1 repetição retorna exatamente o peso", () => {
    const result = estimate1RM(100, 1);
    expect(result.epley).toBe(100);
    expect(result.brzycki).toBe(100);
    expect(result.lombardi).toBe(100);
  });

  it("mais repetições = 1RM maior", () => {
    const result5 = estimate1RM(80, 5);
    const result10 = estimate1RM(80, 10);
    expect(result10.epley).toBeGreaterThan(result5.epley);
  });

  it("retorna zeros para entradas inválidas", () => {
    const result = estimate1RM(0, 10);
    expect(result.epley).toBe(0);
  });

  it("Epley 100kg × 5 reps ≈ 116.7 kg", () => {
    const result = estimate1RM(100, 5);
    expect(result.epley).toBeCloseTo(116.7, 0);
  });

  it("Brzycki é mais conservador que Epley para ≥6 reps", () => {
    const result = estimate1RM(80, 8);
    expect(result.brzycki).toBeGreaterThan(80);
  });
});

describe("zoneLoadsFrom1RM", () => {
  it("forca_maxima usa 90% do 1RM", () => {
    const zones = zoneLoadsFrom1RM(100);
    expect(zones.forca_maxima.kg).toBe(90);
    expect(zones.forca_maxima.pct).toBe(90);
  });

  it("retorna 5 zonas de treino", () => {
    const zones = zoneLoadsFrom1RM(100);
    expect(Object.keys(zones)).toHaveLength(5);
  });
});

// ── Hooper Index ───────────────────────────────────────────────────────────

describe("calculateHooperIndex", () => {
  it("score mínimo (tudo zero) = 'excelente'", () => {
    const result = calculateHooperIndex({ sleep: 0, stress: 0, fatigue: 0, pain: 0 });
    expect(result.classification).toBe("excelente");
    expect(result.score).toBe(0);
  });

  it("score máximo (tudo 10) = 'critico'", () => {
    const result = calculateHooperIndex({ sleep: 10, stress: 10, fatigue: 10, pain: 10 });
    expect(result.classification).toBe("critico");
    expect(result.score).toBe(40);
  });

  it("score moderado (5 em cada) = 'moderado'", () => {
    const result = calculateHooperIndex({ sleep: 5, stress: 5, fatigue: 5, pain: 5 });
    expect(result.classification).toBe("moderado");
  });

  it("normalized é a média dos 4 componentes", () => {
    const result = calculateHooperIndex({ sleep: 4, stress: 6, fatigue: 8, pain: 2 });
    expect(result.normalized).toBeCloseTo(5.0, 1);
  });
});

// ── Carga de treino e check-in ────────────────────────────────────────────

describe("sessionLoad", () => {
  it("60 min × RPE 7 = 420", () => {
    expect(sessionLoad(60, 7)).toBe(420);
  });
});

describe("weeklyLoadStatus", () => {
  it("ratio > 1.5 → danger", () => {
    const result = weeklyLoadStatus(1600, 1000);
    expect(result.color).toBe("danger");
  });

  it("previousAvgLoad zero → ratio 1, estável", () => {
    const result = weeklyLoadStatus(500, 0);
    expect(result.ratio).toBe(1);
  });
});

describe("evaluateCheckInRules", () => {
  it("histórico vazio retorna array vazio", () => {
    expect(evaluateCheckInRules([])).toHaveLength(0);
  });

  it("dor > 7 retorna ação bloquear_intenso", () => {
    const history = [{ date: "2026-06-26", rpe: 6, pain: 8, sleep: 5, fatigue: 5, mood: 6 }];
    const results = evaluateCheckInRules(history);
    expect(results.some((r) => r.action === "bloquear_intenso")).toBe(true);
  });

  it("dor > 7 inclui sugestão de treino alternativo", () => {
    const history = [{ date: "2026-06-26", rpe: 6, pain: 9, sleep: 5, fatigue: 5, mood: 6 }];
    const results = evaluateCheckInRules(history);
    const blocked = results.find((r) => r.action === "bloquear_intenso");
    expect(blocked?.suggestion).toBeTruthy();
  });

  it("fadiga >= 7 por 3 dias → reduzir_volume", () => {
    const history = [
      { date: "2026-06-24", rpe: 7, pain: 2, sleep: 5, fatigue: 7, mood: 5 },
      { date: "2026-06-25", rpe: 7, pain: 2, sleep: 5, fatigue: 8, mood: 5 },
      { date: "2026-06-26", rpe: 7, pain: 2, sleep: 5, fatigue: 9, mood: 5 },
    ];
    const results = evaluateCheckInRules(history);
    expect(results.some((r) => r.action === "reduzir_volume")).toBe(true);
  });

  it("tudo normal → ação ok", () => {
    const history = [{ date: "2026-06-26", rpe: 5, pain: 1, sleep: 3, fatigue: 3, mood: 7 }];
    const results = evaluateCheckInRules(history);
    expect(results.some((r) => r.action === "ok")).toBe(true);
  });
});
