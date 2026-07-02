/**
 * TRIMP de Banister — Impulso de Treinamento baseado em frequência cardíaca.
 * Banister EW et al. (1975), Morton RH et al. (1990).
 * Coeficiente beta: 1.92 (homens), 1.67 (mulheres).
 */
export { trimpBanister, trimpWithFallback } from "@/lib/training-load";
