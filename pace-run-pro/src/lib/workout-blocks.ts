// Structured workout block definitions
// A structured workout is composed of ordered blocks: warmup → main → cooldown

export type BlockType = "warmup" | "main" | "cooldown" | "other";
export type ZoneKey = "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "LIVRE";

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  label: string;
  // Duration / distance (mutually exclusive preference)
  durationMin?: number | null;
  distanceKm?: number | null;
  zone?: ZoneKey | null;
  notes?: string | null;
  // Interval-specific (when isInterval = true)
  isInterval?: boolean;
  reps?: number | null;
  repDurationMin?: number | null;
  repDistanceM?: number | null;    // in metres for intervals (200m, 400m, 1000m)
  repZone?: ZoneKey | null;
  recoveryDurationMin?: number | null;
  recoveryDistanceM?: number | null;
  recoveryZone?: ZoneKey | null;
}

export const ZONE_OPTIONS: { value: ZoneKey; label: string; color: string; ifEst: number }[] = [
  { value: "Z1",   label: "Z1 — Recuperação",       color: "#4ade80", ifEst: 0.65 },
  { value: "Z2",   label: "Z2 — Aeróbico Leve",     color: "#38bdf8", ifEst: 0.72 },
  { value: "Z3",   label: "Z3 — Aeróbico Moderado", color: "#a78bfa", ifEst: 0.80 },
  { value: "Z4",   label: "Z4 — Limiar",            color: "#fb923c", ifEst: 0.91 },
  { value: "Z5",   label: "Z5 — VO2máx / Intenso",  color: "#f87171", ifEst: 1.04 },
  { value: "LIVRE", label: "Livre",                  color: "#9ca3af", ifEst: 0.75 },
];

export const ZONE_COLOR: Record<ZoneKey, string> = {
  Z1: "#4ade80", Z2: "#38bdf8", Z3: "#a78bfa",
  Z4: "#fb923c", Z5: "#f87171", LIVRE: "#9ca3af",
};

const ZONE_IF: Record<ZoneKey, number> = {
  Z1: 0.65, Z2: 0.72, Z3: 0.80, Z4: 0.91, Z5: 1.04, LIVRE: 0.75,
};

export const BLOCK_TYPE_STYLE: Record<BlockType, { bg: string; border: string; badge: string; label: string }> = {
  warmup:  { bg: "bg-emerald-500/10",  border: "border-emerald-500/30",  badge: "bg-emerald-500",  label: "Aquecimento" },
  main:    { bg: "bg-orange-500/10",   border: "border-orange-500/30",   badge: "bg-orange-500",   label: "Estímulo principal" },
  cooldown:{ bg: "bg-sky-500/10",      border: "border-sky-500/30",      badge: "bg-sky-500",      label: "Desaquecimento" },
  other:   { bg: "bg-violet-500/10",   border: "border-violet-500/30",   badge: "bg-violet-500",   label: "Bloco adicional" },
};

export function makeBlockId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function defaultBlocks(): WorkoutBlock[] {
  return [
    { id: makeBlockId(), type: "warmup",   label: "Aquecimento",       durationMin: 10, zone: "Z1", notes: "" },
    { id: makeBlockId(), type: "main",     label: "Estímulo principal", durationMin: 20, zone: "Z3", isInterval: false, notes: "" },
    { id: makeBlockId(), type: "cooldown", label: "Desaquecimento",     durationMin: 10, zone: "Z1", notes: "" },
  ];
}

/** Total estimated duration of all blocks (minutes) */
export function calcBlocksDuration(blocks: WorkoutBlock[]): number {
  return blocks.reduce((sum, b) => {
    if (b.isInterval && b.reps) {
      const repMin = b.repDurationMin ?? 0;
      const recMin = b.recoveryDurationMin ?? 0;
      return sum + b.reps * (repMin + recMin);
    }
    return sum + (b.durationMin ?? 0);
  }, 0);
}

/** Rough TSS from structured blocks */
export function calcBlocksTSS(blocks: WorkoutBlock[]): number {
  let tss = 0;
  for (const b of blocks) {
    const ifVal = ZONE_IF[b.zone ?? "LIVRE"];
    if (b.isInterval && b.reps && b.repDurationMin) {
      const ifRep = ZONE_IF[b.repZone ?? b.zone ?? "LIVRE"];
      const repH = (b.repDurationMin / 60) * b.reps;
      const recH = ((b.recoveryDurationMin ?? 0) / 60) * b.reps;
      tss += repH * ifRep * ifRep * 100;
      tss += recH * ZONE_IF[b.recoveryZone ?? "Z1"] ** 2 * 100;
    } else {
      const h = (b.durationMin ?? 0) / 60;
      tss += h * ifVal * ifVal * 100;
    }
  }
  return Math.round(tss);
}

/** Human-readable one-line summary of the structured workout */
export function blocksSummary(blocks: WorkoutBlock[]): string {
  return blocks.map((b) => {
    const style = BLOCK_TYPE_STYLE[b.type];
    if (b.isInterval && b.reps) {
      const repStr = b.repDistanceM
        ? `${b.repDistanceM >= 1000 ? b.repDistanceM / 1000 + "km" : b.repDistanceM + "m"}`
        : b.repDurationMin
        ? `${b.repDurationMin}min`
        : "—";
      const recStr = b.recoveryDurationMin
        ? ` rec ${b.recoveryDurationMin}min`
        : b.recoveryDistanceM
        ? ` rec ${b.recoveryDistanceM}m`
        : "";
      return `${b.reps}×${repStr}${recStr}`;
    }
    const dur = b.distanceKm ? `${b.distanceKm}km` : b.durationMin ? `${b.durationMin}min` : "";
    return dur ? `${style.label} ${dur}` : style.label;
  }).join(" → ");
}
