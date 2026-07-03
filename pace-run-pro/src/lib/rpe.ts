// RPE 1–10 standard (Borg CR10 / Foster session-RPE)
// Used everywhere in the platform — prescriptions, logs, check-ins.
// RPE 1–5 scales are NOT accepted; always validate before saving.

const RPE_LABELS: Record<number, string> = {
  1:  "Repouso ativo",
  2:  "Muito fácil",
  3:  "Fácil",
  4:  "Moderado",
  5:  "Ligeiramente difícil",
  6:  "Difícil",
  7:  "Muito difícil",
  8:  "Intenso",
  9:  "Quase máximo",
  10: "Máximo",
};

/** Human-readable label for an RPE value (1–10). */
export function getRpeLabel(rpe: number): string {
  const int = Math.round(rpe);
  return RPE_LABELS[int] ?? "Desconhecido";
}

/** Returns true only for integers 1–10 (inclusive). */
export function validateRpe(rpe: unknown): rpe is number {
  return typeof rpe === "number" && Number.isInteger(rpe) && rpe >= 1 && rpe <= 10;
}

/**
 * Derive an approximate RPE (1–10) from %HRmax.
 * Based on the relationship: RPE ≈ (%HRmax − 20) / 8
 */
export function rpeFromHrPct(hrPct: number): number {
  return Math.min(10, Math.max(1, Math.round((hrPct - 20) / 8)));
}

/**
 * Session RPE load = duration (minutes) × RPE.
 * Returns null when either value is missing or invalid.
 */
export function sessionRpeLoad(durationMin: number | null | undefined, rpe: number | null | undefined): number | null {
  if (durationMin == null || rpe == null || !validateRpe(rpe)) return null;
  return Math.round(durationMin * rpe);
}
