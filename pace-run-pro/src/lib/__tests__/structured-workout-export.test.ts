import { describe, it, expect } from "vitest";
import {
  toJSON,
  toZWO,
  toERG,
  workoutToDefinition,
  type StructuredWorkoutDefinition,
} from "@/lib/export/structured-workout-export";

function makeWorkoutDef(overrides: Partial<StructuredWorkoutDefinition> = {}): StructuredWorkoutDefinition {
  return {
    id: "w1",
    name: "Teste Intervalado",
    sport: "BIKE",
    description: "8x3min VO2max",
    steps: [
      { type: "WARMUP",   durationSec: 600, target: { type: "RPE", min: 1, max: 3, unit: "RPE" }, intensity: 0.5 },
      { type: "ACTIVE",   durationSec: 1800, target: { type: "POWER", min: 90, max: 100, unit: "% FTP" }, intensity: 0.9 },
      { type: "COOLDOWN", durationSec: 600, target: { type: "RPE", min: 1, max: 3, unit: "RPE" }, intensity: 0.5 },
    ],
    estimatedDurationSec: 3000,
    targets: [{ type: "POWER", min: 90, max: 100, unit: "% FTP" }],
    metadata: { createdAt: "2026-07-02T00:00:00Z", source: "PACE_RUN_PRO", version: "1.0" },
    ...overrides,
  };
}

describe("toJSON", () => {
  it("returns valid JSON", () => {
    const def = makeWorkoutDef();
    const json = toJSON(def);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes exportedAt in metadata", () => {
    const def = makeWorkoutDef();
    const parsed = JSON.parse(toJSON(def));
    expect(parsed.metadata.exportedAt).toBeDefined();
  });

  it("preserves workout name and sport", () => {
    const def = makeWorkoutDef({ name: "Meu Treino", sport: "RUN" });
    const parsed = JSON.parse(toJSON(def));
    expect(parsed.name).toBe("Meu Treino");
    expect(parsed.sport).toBe("RUN");
  });

  it("includes all steps", () => {
    const def = makeWorkoutDef();
    const parsed = JSON.parse(toJSON(def));
    expect(parsed.steps).toHaveLength(3);
  });
});

describe("toZWO", () => {
  it("returns valid XML string", () => {
    const def = makeWorkoutDef();
    const zwo = toZWO(def);
    expect(zwo).toContain("<?xml");
    expect(zwo).toContain("<workout_file>");
    expect(zwo).toContain("</workout_file>");
  });

  it("includes workout name", () => {
    const def = makeWorkoutDef({ name: "Treino Power" });
    const zwo = toZWO(def);
    expect(zwo).toContain("Treino Power");
  });

  it("contains Warmup and Cooldown elements", () => {
    const def = makeWorkoutDef();
    const zwo = toZWO(def);
    expect(zwo).toContain("<Warmup ");
    expect(zwo).toContain("<Cooldown ");
  });

  it("escapes XML special characters in name", () => {
    const def = makeWorkoutDef({ name: 'Treino & <teste>' });
    const zwo = toZWO(def);
    expect(zwo).toContain("Treino &amp; &lt;teste&gt;");
    expect(zwo).not.toContain("<teste>");
  });

  it("sportType is bike for BIKE workouts", () => {
    const def = makeWorkoutDef({ sport: "BIKE" });
    expect(toZWO(def)).toContain("<sportType>bike</sportType>");
  });

  it("sportType is run for RUN workouts", () => {
    const def = makeWorkoutDef({ sport: "RUN" });
    expect(toZWO(def)).toContain("<sportType>run</sportType>");
  });
});

describe("toERG", () => {
  it("returns ERG header", () => {
    const def = makeWorkoutDef();
    const erg = toERG(def, 250);
    expect(erg).toContain("[COURSE HEADER]");
    expect(erg).toContain("[COURSE DATA]");
    expect(erg).toContain("FTP=250");
  });

  it("includes workout name in description", () => {
    const def = makeWorkoutDef({ name: "Teste ERG" });
    const erg = toERG(def, 300);
    expect(erg).toContain("Teste ERG");
  });

  it("power values are positive numbers", () => {
    const def = makeWorkoutDef();
    const erg = toERG(def, 250);
    const dataSection = erg.split("[COURSE DATA]")[1].split("[END COURSE DATA]")[0];
    const lines = dataSection.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      const [, watts] = line.split("\t");
      expect(Number(watts)).toBeGreaterThan(0);
    }
  });

  it("time is monotonically increasing", () => {
    const def = makeWorkoutDef();
    const erg = toERG(def, 250);
    const dataSection = erg.split("[COURSE DATA]")[1].split("[END COURSE DATA]")[0];
    const times = dataSection.trim().split("\n").filter(Boolean).map((l) => parseFloat(l.split("\t")[0]));
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
  });
});

describe("workoutToDefinition", () => {
  it("builds definition from raw workout", () => {
    const raw = {
      id: "abc",
      title: "Rodagem Leve",
      sport: "RUN",
      workoutType: "RODAGEM_LEVE",
      targetDurationMin: 60,
      targetDistanceKm: 10,
      targetPaceSecPerKm: 320,
      targetPowerPctFtp: null,
      mainSet: null,
      notes: "Fácil",
    };
    const def = workoutToDefinition(raw);
    expect(def.id).toBe("abc");
    expect(def.name).toBe("Rodagem Leve");
    expect(def.sport).toBe("RUN");
    expect(def.steps).toHaveLength(3);
    expect(def.steps[0].type).toBe("WARMUP");
    expect(def.steps[1].type).toBe("ACTIVE");
    expect(def.steps[2].type).toBe("COOLDOWN");
  });

  it("estimatedDurationSec = targetDurationMin * 60", () => {
    const raw = { id: "x", title: "T", sport: "BIKE", workoutType: null, targetDurationMin: 90, targetDistanceKm: null, targetPaceSecPerKm: null, targetPowerPctFtp: null, mainSet: null, notes: null };
    const def = workoutToDefinition(raw);
    expect(def.estimatedDurationSec).toBe(5400);
  });

  it("metadata source is PACE_RUN_PRO", () => {
    const raw = { id: "x", title: "T", sport: "RUN", workoutType: null, targetDurationMin: 30, targetDistanceKm: null, targetPaceSecPerKm: null, targetPowerPctFtp: null, mainSet: null, notes: null };
    const def = workoutToDefinition(raw);
    expect(def.metadata.source).toBe("PACE_RUN_PRO");
    expect(def.metadata.version).toBe("1.0");
  });
});
