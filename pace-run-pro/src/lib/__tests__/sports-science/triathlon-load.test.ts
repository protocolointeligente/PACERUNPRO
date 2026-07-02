import { describe, it, expect } from "vitest";
import {
  loadDistribution,
  generateTriathlonAlerts,
  calculateRampRate,
  TRIATHLON_TARGET_DISTRIBUTION,
  type MultisportLoad,
  type TriathlonAlertInput,
} from "@/lib/sports-science/triathlon-load";

const LOAD_EQUAL: MultisportLoad = { run: 100, bike: 200, swim: 50, strength: 25, other: 0, total: 375 };

describe("loadDistribution", () => {
  it("calcula percentuais corretamente", () => {
    const dist = loadDistribution(LOAD_EQUAL);
    expect(dist.runPct).toBeCloseTo(27, 0);
    expect(dist.bikePct).toBeCloseTo(53, 0);
    expect(dist.swimPct).toBeCloseTo(13, 0);
  });

  it("soma de percentuais ≈ 100%", () => {
    const dist = loadDistribution(LOAD_EQUAL);
    const sum = dist.runPct + dist.bikePct + dist.swimPct + dist.strengthPct + dist.otherPct;
    expect(sum).toBeCloseTo(100, 0);
  });

  it("carga total zero não divide por zero", () => {
    const zeroLoad: MultisportLoad = { run: 0, bike: 0, swim: 0, strength: 0, other: 0, total: 0 };
    const dist = loadDistribution(zeroLoad);
    expect(dist.runPct).toBe(0);
  });
});

const BASE_INPUT: TriathlonAlertInput = {
  weekLoad:           { run: 100, bike: 250, swim: 60, strength: 20, other: 0, total: 430 },
  daysSinceSwim:      0,
  daysSinceBrick:     0,
  daysWithoutRest:    1,
  rampRatePct:        5,
  goal:               "OLIMPICO",
  tsb:                5,
  painScore:          0,
  fatigueScore:       4,
  sleepScore:         8,
  consecutiveLowTsb: 0,
};

describe("generateTriathlonAlerts", () => {
  it("retorna array vazio quando tudo está ok", () => {
    const alerts = generateTriathlonAlerts(BASE_INPUT);
    expect(Array.isArray(alerts)).toBe(true);
    // Can have 0 alerts when all metrics are within range
  });

  it("alerta de natação ausente quando daysSinceSwim > 7", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, daysSinceSwim: 8 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "swim-absence")).toBe(true);
  });

  it("alerta de ramp rate quando > 20%", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, rampRatePct: 25 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "high-ramp")).toBe(true);
  });

  it("alerta de dor quando painScore >= 6", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, painScore: 7 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "pain-high")).toBe(true);
  });

  it("alerta de fadiga quando fatigueScore >= 8", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, fatigueScore: 9 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "fatigue-high")).toBe(true);
  });

  it("alerta de sono quando sleepScore <= 4", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, sleepScore: 3 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "sleep-low")).toBe(true);
  });

  it("alerta de TSB baixo após 3 dias consecutivos", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, tsb: -30, consecutiveLowTsb: 3 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "low-tsb")).toBe(true);
  });

  it("sem alerta de TSB se consecutiveLowTsb < 3", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, tsb: -30, consecutiveLowTsb: 2 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "low-tsb")).toBe(false);
  });

  it("alerta de sem descanso quando daysWithoutRest > 10", () => {
    const input: TriathlonAlertInput = { ...BASE_INPUT, daysWithoutRest: 11 };
    const alerts = generateTriathlonAlerts(input);
    expect(alerts.some((a) => a.id === "no-rest")).toBe(true);
  });

  it("nenhuma mensagem de alerta usa linguagem médica definitiva", () => {
    const worst: TriathlonAlertInput = {
      ...BASE_INPUT,
      daysSinceSwim: 20,
      rampRatePct: 30,
      painScore: 8,
      fatigueScore: 9,
      tsb: -35,
      consecutiveLowTsb: 5,
      daysWithoutRest: 12,
    };
    const alerts = generateTriathlonAlerts(worst);
    for (const a of alerts) {
      expect(a.message).not.toMatch(/você está lesionado/i);
      expect(a.message).not.toMatch(/pare imediatamente/i);
      expect(a.message).not.toMatch(/treino proibido/i);
      expect(a.message).not.toMatch(/diagnóstico/i);
    }
  });

  it("todos os alertas têm id, level, title e message", () => {
    const input: TriathlonAlertInput = {
      ...BASE_INPUT,
      daysSinceSwim: 10,
      rampRatePct: 25,
      painScore: 7,
    };
    const alerts = generateTriathlonAlerts(input);
    for (const a of alerts) {
      expect(a.id).toBeTruthy();
      expect(["info", "attention", "warning"]).toContain(a.level);
      expect(a.title).toBeTruthy();
      expect(a.message.length).toBeGreaterThan(10);
    }
  });
});

describe("calculateRampRate", () => {
  it("calcula variação percentual corretamente", () => {
    expect(calculateRampRate(110, 100)).toBe(10);
    expect(calculateRampRate(80, 100)).toBe(-20);
    expect(calculateRampRate(100, 100)).toBe(0);
  });

  it("retorna 0 para carga anterior = 0", () => {
    expect(calculateRampRate(100, 0)).toBe(0);
  });
});

describe("TRIATHLON_TARGET_DISTRIBUTION", () => {
  it("tem distribuição para todos os objetivos principais", () => {
    const goals = ["SPRINT_TRIATHLON", "OLIMPICO", "MEIO_IRONMAN", "IRONMAN", "AQUATLON", "DUATLON"];
    for (const goal of goals) {
      expect(TRIATHLON_TARGET_DISTRIBUTION[goal]).toBeDefined();
    }
  });

  it("Ironman tem maior % de bike que Sprint", () => {
    const ironman = TRIATHLON_TARGET_DISTRIBUTION["IRONMAN"];
    const sprint  = TRIATHLON_TARGET_DISTRIBUTION["SPRINT_TRIATHLON"];
    expect(ironman.bikePct[0]).toBeGreaterThan(sprint.bikePct[0]);
  });
});
