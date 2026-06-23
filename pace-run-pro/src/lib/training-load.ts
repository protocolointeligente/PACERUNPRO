// CTL/ATL/TSB — Banister Impulse-Response model
// TSS (Training Stress Score) estimated from workout data.
// Multi-sport ready: running, cycling, swimming, strength.

export interface LoadParams {
  thresholdPaceSecPerKm?: number | null;
  ftpWatts?: number | null;
  swimThresholdSecPer100m?: number | null;
  hrMax?: number | null;
  hrRest?: number | null;
}

export interface WorkoutForLoad {
  type: string;
  targetDistanceKm?: number | null;
  targetDurationMin?: number | null;
  targetPaceSecPerKm?: number | null;
  targetRpe?: number | null;
}

// Intensity Factor (IF) by workout type when threshold pace is unknown
const ZONE_IF: Record<string, number> = {
  REGENERATIVO:       0.65,
  RODAGEM_LEVE:       0.70,
  PROGRESSIVO:        0.78,
  LONGAO:             0.78,
  FARTLEK:            0.85,
  TECNICA:            0.85,
  SUBIDA:             0.88,
  TEMPO_RUN:          0.91,
  INTERVALADO_LONGO:  0.97,
  INTERVALADO_CURTO:  1.04,
  PROVA:              1.05,
  FORCA:              0.65,
  FUNCIONAL:          0.68,
  MOBILIDADE:         0.45,
  RECUPERACAO:        0.55,
};

// Default duration (minutes) when none is specified
const DEFAULT_DURATION_MIN: Record<string, number> = {
  FORCA:      55,
  FUNCIONAL:  45,
  MOBILIDADE: 30,
  RECUPERACAO: 40,
};

export function estimateTSS(workout: WorkoutForLoad, params?: LoadParams | null): number {
  const type = workout.type;

  // Determine duration in hours
  let durationMin: number;
  if (workout.targetDurationMin && workout.targetDurationMin > 0) {
    durationMin = workout.targetDurationMin;
  } else if (workout.targetDistanceKm && workout.targetPaceSecPerKm) {
    durationMin = (workout.targetDistanceKm * workout.targetPaceSecPerKm) / 60;
  } else if (workout.targetDistanceKm) {
    const ifFallback = ZONE_IF[type] ?? 0.75;
    // Estimate pace from IF and a reference pace of 360 sec/km (6:00/km)
    const estPaceSec = 360 / ifFallback;
    durationMin = (workout.targetDistanceKm * estPaceSec) / 60;
  } else {
    durationMin = DEFAULT_DURATION_MIN[type] ?? 45;
  }

  const durationHours = durationMin / 60;

  // Determine Intensity Factor
  let intensityFactor: number;

  // Strength/non-running: use RPE if available
  if (type === "FORCA" || type === "FUNCIONAL" || type === "MOBILIDADE" || type === "RECUPERACAO") {
    const rpe = workout.targetRpe ?? 6;
    intensityFactor = rpe / 10;
    // Scale down strength TSS (not comparable 1:1 with running TSS)
    return Math.round(durationHours * intensityFactor * intensityFactor * 100 * 0.55);
  }

  // Running: use threshold pace if available
  if (params?.thresholdPaceSecPerKm && workout.targetPaceSecPerKm && workout.targetPaceSecPerKm > 0) {
    intensityFactor = Math.min(params.thresholdPaceSecPerKm / workout.targetPaceSecPerKm, 1.3);
  } else {
    intensityFactor = ZONE_IF[type] ?? 0.75;
  }

  const tss = durationHours * intensityFactor * intensityFactor * 100;
  return Math.round(tss);
}

// ── CTL/ATL/TSB time series ───────────────────────────────────────────────────

const DECAY_CTL = Math.exp(-1 / 42); // ~0.9762 — 42-day time constant
const DECAY_ATL = Math.exp(-1 / 7);  // ~0.8668 — 7-day time constant

export interface LoadDay {
  date: string;   // YYYY-MM-DD
  tss: number;
  ctl: number;    // Chronic Training Load (fitness)
  atl: number;    // Acute Training Load (fatigue)
  tsb: number;    // Training Stress Balance (form) = yesterday's CTL - ATL
}

export function computeLoadSeries(
  /** Map of YYYY-MM-DD → total TSS for that day */
  dailyTss: Map<string, number>,
  /** How many days to include in the returned series */
  outputDays = 90,
): LoadDay[] {
  if (dailyTss.size === 0) return [];

  // Build a sorted list of all dates from the earliest in the map to today
  const dateSet = new Set(dailyTss.keys());
  const allDates = sortedDateRange(dateSet, outputDays);

  let ctl = 0;
  let atl = 0;
  const result: LoadDay[] = [];

  for (const date of allDates) {
    const tss = dailyTss.get(date) ?? 0;
    const tsbToday = ctl - atl; // form = yesterday's fitness − fatigue
    ctl = ctl * DECAY_CTL + tss * (1 - DECAY_CTL);
    atl = atl * DECAY_ATL + tss * (1 - DECAY_ATL);
    result.push({
      date,
      tss,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsbToday * 10) / 10,
    });
  }

  return result.slice(-outputDays);
}

function sortedDateRange(dateSet: Set<string>, outputDays: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the minimum date in the set or 120 days ago (for CTL warm-up)
  const minDateStr = [...dateSet].sort()[0];
  const warmupStart = new Date(today);
  warmupStart.setDate(warmupStart.getDate() - 120);

  const start = new Date(minDateStr) < warmupStart ? new Date(minDateStr) : warmupStart;

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// ── Spike & form detection ────────────────────────────────────────────────────

export interface LoadAlert {
  type: "spike" | "overreaching" | "detraining";
  message: string;
  severity: "warning" | "danger";
}

export function detectAlerts(series: LoadDay[]): LoadAlert[] {
  if (series.length < 14) return [];

  const alerts: LoadAlert[] = [];
  const recent = series.slice(-14);

  // Spike: ATL this week vs last week
  const thisWeekATL = recent.slice(-7).reduce((s, d) => s + d.tss, 0);
  const lastWeekATL = recent.slice(-14, -7).reduce((s, d) => s + d.tss, 0);
  if (lastWeekATL > 0 && thisWeekATL / lastWeekATL > 1.35) {
    alerts.push({
      type: "spike",
      message: `Spike de carga detectado: volume semanal ${Math.round((thisWeekATL / lastWeekATL - 1) * 100)}% acima da semana anterior. Risco de overtraining.`,
      severity: "danger",
    });
  }

  const last = series[series.length - 1];

  // Overreaching: TSB < -30
  if (last.tsb < -30) {
    alerts.push({
      type: "overreaching",
      message: `TSB ${last.tsb.toFixed(0)} — fadiga elevada. Considere uma semana de descarga.`,
      severity: "danger",
    });
  }

  // Detraining: TSB > 25 and CTL dropping
  if (last.tsb > 25 && last.ctl < series[series.length - 7]?.ctl) {
    alerts.push({
      type: "detraining",
      message: `TSB ${last.tsb.toFixed(0)} — carga muito baixa. Risco de destreino.`,
      severity: "warning",
    });
  }

  return alerts;
}

// ── Form label ────────────────────────────────────────────────────────────────

export type FormStatus = "peaking" | "optimal" | "training" | "fatigued" | "overreaching" | "detraining";

export function formStatus(tsb: number): FormStatus {
  if (tsb > 25)  return "detraining";
  if (tsb > 10)  return "peaking";
  if (tsb > 0)   return "optimal";
  if (tsb > -10) return "training";
  if (tsb > -30) return "fatigued";
  return "overreaching";
}

export const FORM_LABELS: Record<FormStatus, { label: string; color: string; bg: string }> = {
  peaking:      { label: "Em pico",      color: "text-success",  bg: "bg-success/10" },
  optimal:      { label: "Ótima forma",  color: "text-primary",  bg: "bg-primary/10" },
  training:     { label: "Em treino",    color: "text-info",     bg: "bg-info/10" },
  fatigued:     { label: "Fadigado",     color: "text-warning",  bg: "bg-warning/10" },
  overreaching: { label: "Sobrecarga",   color: "text-danger",   bg: "bg-danger/10" },
  detraining:   { label: "Destreinando", color: "text-text-muted", bg: "bg-card-hover" },
};
