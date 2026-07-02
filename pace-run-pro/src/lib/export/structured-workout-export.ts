// ── Canonical internal workout format ──────────────────────────────────────

export type WorkoutStepType = "WARMUP" | "ACTIVE" | "RECOVERY" | "COOLDOWN" | "REST" | "REPEAT";
export type WorkoutTargetType = "PACE" | "POWER" | "HR" | "CADENCE" | "RPE" | "FREE";
export type WorkoutSport = "RUN" | "BIKE" | "SWIM" | "STRENGTH" | "TRIATHLON" | "BRICK";

export interface WorkoutTarget {
  type: WorkoutTargetType;
  min: number;
  max: number;
  unit: string;
}

export interface WorkoutStep {
  type: WorkoutStepType;
  durationSec?: number;       // undefined = open
  distanceM?: number;         // undefined = time-based
  target: WorkoutTarget;
  intensity: number;          // 0-1 (0=easy, 1=max)
  notes?: string;
  repeatCount?: number;       // if type === REPEAT
  steps?: WorkoutStep[];      // nested steps if type === REPEAT
}

export interface StructuredWorkoutDefinition {
  id: string;
  name: string;
  sport: WorkoutSport;
  description: string;
  steps: WorkoutStep[];
  estimatedDurationSec: number;
  estimatedDistanceM?: number;
  targets: WorkoutTarget[];
  metadata: {
    createdAt: string;
    source: "PACE_RUN_PRO";
    version: "1.0";
    exportedAt?: string;
  };
}

// ── Feature flags ──────────────────────────────────────────────────────────

export const DEVICE_EXPORT_FLAGS = {
  ENABLE_GARMIN_EXPORT: false,
  ENABLE_COROS_EXPORT: false,
  ENABLE_POLAR_EXPORT: false,
  ENABLE_SUUNTO_EXPORT: false,
} as const;

// ── Device adapter interface ───────────────────────────────────────────────

export interface DeviceCapabilities {
  supportsRun: boolean;
  supportsBike: boolean;
  supportsSwim: boolean;
  supportsStructuredWorkouts: boolean;
  supportsPaceTarget: boolean;
  supportsPowerTarget: boolean;
  supportsHRTarget: boolean;
  maxStepsPerWorkout: number;
}

export interface DeviceWorkoutAdapter {
  readonly provider: "GARMIN" | "COROS" | "POLAR" | "SUUNTO";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  exportWorkout(workout: StructuredWorkoutDefinition): Promise<{ success: boolean; workoutId?: string; error?: string }>;
  syncWorkoutStatus(externalId: string): Promise<{ synced: boolean; status?: string }>;
  getCapabilities(): DeviceCapabilities;
  refreshToken(): Promise<void>;
}

// ── Garmin adapter (structure only — feature-flagged) ─────────────────────

export class GarminAdapter implements DeviceWorkoutAdapter {
  readonly provider = "GARMIN" as const;

  getCapabilities(): DeviceCapabilities {
    return {
      supportsRun: true,
      supportsBike: true,
      supportsSwim: false,
      supportsStructuredWorkouts: true,
      supportsPaceTarget: true,
      supportsPowerTarget: true,
      supportsHRTarget: true,
      maxStepsPerWorkout: 20,
    };
  }

  async connect(): Promise<void> {
    throw new Error("Garmin integration not yet enabled. Set ENABLE_GARMIN_EXPORT=true when ready.");
  }
  async disconnect(): Promise<void> { /* noop */ }
  async exportWorkout(): Promise<{ success: boolean; error: string }> {
    return { success: false, error: "Garmin export not yet implemented." };
  }
  async syncWorkoutStatus(): Promise<{ synced: boolean }> { return { synced: false }; }
  async refreshToken(): Promise<void> { /* noop */ }
}

// COROS / Polar / Suunto follow same pattern
export class CorosAdapter implements DeviceWorkoutAdapter {
  readonly provider = "COROS" as const;
  getCapabilities(): DeviceCapabilities {
    return { supportsRun: true, supportsBike: true, supportsSwim: true, supportsStructuredWorkouts: true, supportsPaceTarget: true, supportsPowerTarget: false, supportsHRTarget: true, maxStepsPerWorkout: 30 };
  }
  async connect(): Promise<void> { throw new Error("COROS integration not yet enabled."); }
  async disconnect(): Promise<void> { /* noop */ }
  async exportWorkout(): Promise<{ success: boolean; error: string }> { return { success: false, error: "COROS export not yet implemented." }; }
  async syncWorkoutStatus(): Promise<{ synced: boolean }> { return { synced: false }; }
  async refreshToken(): Promise<void> { /* noop */ }
}

// ── JSON export ────────────────────────────────────────────────────────────

export function toJSON(workout: StructuredWorkoutDefinition): string {
  return JSON.stringify({ ...workout, metadata: { ...workout.metadata, exportedAt: new Date().toISOString() } }, null, 2);
}

// ── ZWO export (Zwift) ────────────────────────────────────────────────────

function intensityToZwiftPower(intensity: number): number {
  // Intensity 0-1 → Zwift power ratio based on FTP (0.5x to 1.1x)
  return 0.5 + intensity * 0.6;
}

function stepToZWO(step: WorkoutStep, indent = 2): string {
  const pad = " ".repeat(indent);
  if (step.type === "REPEAT" && step.steps && step.repeatCount) {
    const inner = step.steps.map((s) => stepToZWO(s, indent + 2)).join("\n");
    return `${pad}<IntervalsT Repeat="${step.repeatCount}">\n${inner}\n${pad}</IntervalsT>`;
  }
  const power = intensityToZwiftPower(step.intensity).toFixed(2);
  const dur = step.durationSec ?? 60;
  const tag =
    step.type === "WARMUP" ? "Warmup" :
    step.type === "COOLDOWN" ? "Cooldown" :
    step.type === "RECOVERY" ? "FreeRide" : "SteadyState";
  if (tag === "Warmup" || tag === "Cooldown") {
    return `${pad}<${tag} Duration="${dur}" PowerLow="${power}" PowerHigh="${power}" />`;
  }
  return `${pad}<${tag} Duration="${dur}" Power="${power}" />`;
}

export function toZWO(workout: StructuredWorkoutDefinition): string {
  const stepsXml = workout.steps.map((s) => stepToZWO(s)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>PACE RUN PRO</author>
  <name>${escapeXml(workout.name)}</name>
  <description>${escapeXml(workout.description)}</description>
  <sportType>${workout.sport === "BIKE" ? "bike" : "run"}</sportType>
  <workout>
${stepsXml}
  </workout>
</workout_file>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── ERG export (power-based trainer file) ─────────────────────────────────

export function toERG(workout: StructuredWorkoutDefinition, ftpWatts = 250): string {
  const lines: string[] = [
    "[COURSE HEADER]",
    "VERSION=2",
    `UNITS=WATTS`,
    `DESCRIPTION=${workout.name}`,
    "FILE NAME=PaceRunPro",
    `FTP=${ftpWatts}`,
    "[END COURSE HEADER]",
    "[COURSE DATA]",
  ];

  let t = 0; // minutes
  function addSegment(step: WorkoutStep): void {
    const durMin = (step.durationSec ?? 60) / 60;
    const power = Math.round(intensityToZwiftPower(step.intensity) * ftpWatts);
    lines.push(`${t.toFixed(2)}\t${power}`);
    t += durMin;
    lines.push(`${t.toFixed(2)}\t${power}`);

    if (step.type === "REPEAT" && step.steps && step.repeatCount) {
      for (let i = 0; i < step.repeatCount; i++) {
        step.steps.forEach(addSegment);
      }
    }
  }

  workout.steps.forEach(addSegment);
  lines.push("[END COURSE DATA]");
  return lines.join("\n");
}

// ── Builder: DB workout → StructuredWorkoutDefinition ─────────────────────

interface RawWorkout {
  id: string;
  title: string;
  sport?: string | null;
  workoutType?: string | null;
  targetDurationMin?: number | null;
  targetDistanceKm?: number | null;
  targetPaceSecPerKm?: number | null;
  targetPowerPctFtp?: number | null;
  mainSet?: string | null;
  notes?: string | null;
}

export function workoutToDefinition(w: RawWorkout): StructuredWorkoutDefinition {
  const sport = (w.sport ?? "RUN") as WorkoutSport;
  const durationSec = (w.targetDurationMin ?? 60) * 60;
  const intensityMap: Record<string, number> = {
    REGENERATIVO: 0.55, RODAGEM_LEVE: 0.65, LONGAO: 0.7,
    FARTLEK: 0.8, TEMPO_RUN: 0.85, INTERVALADO_CURTO: 0.9, INTERVALADO_LONGO: 0.88,
    ENDURANCE_BIKE: 0.65, LIMIAR_BIKE: 0.85, VO2MAX_BIKE: 0.95,
    TECNICA_NATACAO: 0.6, ENDURANCE_NATACAO: 0.7, LIMIAR_NATACAO: 0.85,
  };
  const type = w.workoutType ?? "RODAGEM_LEVE";
  const intensity = intensityMap[type] ?? 0.7;
  const target: WorkoutTarget =
    sport === "BIKE"
      ? { type: "POWER", min: Math.round(intensity * 0.95 * 100), max: Math.round(intensity * 1.05 * 100), unit: "% FTP" }
      : { type: "PACE", min: (w.targetPaceSecPerKm ?? 300) - 15, max: (w.targetPaceSecPerKm ?? 300) + 15, unit: "sec/km" };

  return {
    id: w.id,
    name: w.title,
    sport,
    description: w.notes ?? "",
    steps: [
      { type: "WARMUP", durationSec: 600, target: { type: "RPE", min: 1, max: 3, unit: "RPE" }, intensity: 0.5 },
      { type: "ACTIVE", durationSec: durationSec - 1200, target, intensity },
      { type: "COOLDOWN", durationSec: 600, target: { type: "RPE", min: 1, max: 3, unit: "RPE" }, intensity: 0.5 },
    ],
    estimatedDurationSec: durationSec,
    estimatedDistanceM: w.targetDistanceKm ? w.targetDistanceKm * 1000 : undefined,
    targets: [target],
    metadata: { createdAt: new Date().toISOString(), source: "PACE_RUN_PRO", version: "1.0" },
  };
}
