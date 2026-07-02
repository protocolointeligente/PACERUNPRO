/**
 * EWMA — Exponentially Weighted Moving Average.
 * Alternativa ao ACWR clássico com janelas fixas.
 * Williams et al. (2017), Menaspà (2017).
 */
export { computeEWMASeries, ewmaRiskLevel } from "@/lib/training-load";
export type { EWMADay } from "@/lib/training-load";
