import { describe, it, expect } from "vitest";
import {
  generateWorkoutsForWeek,
  formatPaceSec,
  ZONE_COLORS,
  type WorkoutGeneratorParams,
} from "@/lib/workout-generator";

const BASE_PARAMS: WorkoutGeneratorParams = {
  phase: "Base",
  sessionsPerWeek: 3,
  trainingDays: ["Segunda-feira", "Quarta-feira", "Sábado"],
  targetKm: 30,
  vdot: 45,
  goal: "10k",
  level: "Intermediário",
  isDeload: false,
};

describe("generateWorkoutsForWeek", () => {
  it("returns correct number of sessions", () => {
    const result = generateWorkoutsForWeek(BASE_PARAMS);
    expect(result).toHaveLength(3);
  });

  it("each session has required fields", () => {
    const sessions = generateWorkoutsForWeek(BASE_PARAMS);
    for (const s of sessions) {
      expect(typeof s.sessionIndex).toBe("number");
      expect(s.dayLabel).toBeTruthy();
      expect(s.subtype).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.zone).toMatch(/^[EMTIR]$/);
      expect(s.distanceKm).toBeGreaterThan(0);
      expect(s.durationMin).toBeGreaterThan(0);
      expect(s.targetPaceSecPerKm).toBeGreaterThan(0);
      expect(s.paceRangeStr).toBeTruthy();
      expect(typeof s.targetRpe).toBe("number");
    }
  });

  it("uses custom trainingDays for dayLabel", () => {
    const sessions = generateWorkoutsForWeek(BASE_PARAMS);
    expect(sessions[0].dayLabel).toBe("Segunda-feira");
    expect(sessions[2].dayLabel).toBe("Sábado");
  });

  it("session distances sum to roughly targetKm", () => {
    const sessions = generateWorkoutsForWeek(BASE_PARAMS);
    const total = sessions.reduce((s, w) => s + w.distanceKm, 0);
    expect(total).toBeCloseTo(30, 0);
  });

  it("works for 1 session per week", () => {
    const params: WorkoutGeneratorParams = { ...BASE_PARAMS, sessionsPerWeek: 1, trainingDays: ["Domingo"] };
    const sessions = generateWorkoutsForWeek(params);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].dayLabel).toBe("Domingo");
  });

  it("works for 6 sessions per week", () => {
    const params: WorkoutGeneratorParams = {
      ...BASE_PARAMS,
      sessionsPerWeek: 6,
      trainingDays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
      targetKm: 60,
    };
    const sessions = generateWorkoutsForWeek(params);
    expect(sessions).toHaveLength(6);
  });

  it("deload sessions have lower RPE", () => {
    const normal = generateWorkoutsForWeek(BASE_PARAMS);
    const deload = generateWorkoutsForWeek({ ...BASE_PARAMS, isDeload: true });
    const normalMaxRpe = Math.max(...normal.map((s) => s.targetRpe));
    const deloadMaxRpe = Math.max(...deload.map((s) => s.targetRpe));
    expect(deloadMaxRpe).toBeLessThanOrEqual(normalMaxRpe);
  });

  it("works without vdot (null)", () => {
    const params: WorkoutGeneratorParams = { ...BASE_PARAMS, vdot: null };
    const sessions = generateWorkoutsForWeek(params);
    expect(sessions).toHaveLength(3);
    for (const s of sessions) {
      expect(s.targetPaceSecPerKm).toBeGreaterThan(0);
    }
  });

  it("each session has warmup, mainSet, cooldown strings", () => {
    const sessions = generateWorkoutsForWeek(BASE_PARAMS);
    for (const s of sessions) {
      expect(typeof s.warmup).toBe("string");
      expect(typeof s.mainSet).toBe("string");
      expect(typeof s.cooldown).toBe("string");
    }
  });

  it("phase Específico generates quality sessions", () => {
    const params: WorkoutGeneratorParams = { ...BASE_PARAMS, phase: "Específico" };
    const sessions = generateWorkoutsForWeek(params);
    const subtypes = sessions.map((s) => s.subtype);
    const qualityTypes = ["Intervalado curto", "Intervalado longo", "Tempo Run", "Fartlek"];
    const hasQuality = subtypes.some((st) => qualityTypes.includes(st));
    expect(hasQuality).toBe(true);
  });

  it("level Iniciante returns sessions with higher pace values (slower)", () => {
    const iniciante = generateWorkoutsForWeek({ ...BASE_PARAMS, level: "Iniciante", vdot: null });
    const avancado  = generateWorkoutsForWeek({ ...BASE_PARAMS, level: "Avançado", vdot: null });
    const avgIniciante = iniciante.reduce((s, w) => s + w.targetPaceSecPerKm, 0) / iniciante.length;
    const avgAvancado  = avancado.reduce((s, w) => s + w.targetPaceSecPerKm, 0) / avancado.length;
    expect(avgIniciante).toBeGreaterThanOrEqual(avgAvancado);
  });
});

describe("formatPaceSec", () => {
  it("formats 300 s/km as 5:00", () => {
    expect(formatPaceSec(300)).toBe("5:00");
  });

  it("formats 360 s/km as 6:00", () => {
    expect(formatPaceSec(360)).toBe("6:00");
  });

  it("pads seconds below 10", () => {
    expect(formatPaceSec(305)).toBe("5:05");
  });
});

describe("ZONE_COLORS", () => {
  it("has colors for all VDOT zones", () => {
    for (const [, color] of Object.entries(ZONE_COLORS)) {
      expect(color).toMatch(/^#/);
    }
  });
});
