/**
 * CTL / ATL / TSB — Modelo de Resposta ao Impulso de Banister.
 * CTL = Chronic Training Load (fitness, τ=42d)
 * ATL = Acute Training Load (fatigue, τ=7d)
 * TSB = Training Stress Balance (form) = CTL(prev) − ATL(prev)
 */
export {
  estimateTSS,
  computeLoadSeries,
  detectAlerts,
  formStatus,
  FORM_LABELS,
} from "@/lib/training-load";

export type { LoadParams, WorkoutForLoad, LoadDay, LoadAlert, FormStatus } from "@/lib/training-load";
