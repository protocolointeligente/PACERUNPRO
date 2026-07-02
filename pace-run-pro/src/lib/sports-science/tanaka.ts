/**
 * Estimativa de FC máxima.
 * Tanaka (2001): 208 − 0.7 × idade (menor erro padrão que Fox 1971).
 * Fox (1971): 220 − idade (referência histórica).
 */
export { maxHrTanaka } from "@/lib/calculations";

/** Fox (1971): 220 − idade. Menos preciso para adultos acima de 40 anos. */
export function maxHrFox(age: number): number {
  return 220 - age;
}
