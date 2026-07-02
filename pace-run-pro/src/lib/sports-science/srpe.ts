/**
 * Session RPE (sRPE) — método de Foster (2001).
 * Carga da sessão = duração (min) × RPE percebido (0-10 escala CR-10 de Borg).
 */
export { sessionLoad as sessionRPE } from "@/lib/calculations";

/** Alias explícito: Foster Session RPE (duração × RPE). */
export function sRPE(durationMin: number, rpe: number): number {
  return Math.round(durationMin * rpe);
}
