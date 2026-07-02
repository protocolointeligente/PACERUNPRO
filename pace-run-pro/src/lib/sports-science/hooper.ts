/**
 * Hooper Index — índice de bem-estar subjetivo.
 * Hooper & Mackinnon (1995): sono + estresse + fadiga + dor muscular (DOMS).
 * Score 0–40; menor score = melhor bem-estar.
 */
export { calculateHooperIndex, evaluateCheckInRules } from "@/lib/calculations";
export type { HooperInput, HooperResult, CheckInRecord, CheckInRuleResult } from "@/lib/calculations";
