/** Cooper test (1968): 12-minute run distance → VO2max (ml/kg/min). */
export { vo2FromCooper } from "@/lib/calculations";

export function cooperClassification(vo2max: number): {
  category: string;
  color: string;
} {
  if (vo2max >= 55) return { category: "Excelente", color: "#22C55E" };
  if (vo2max >= 48) return { category: "Bom", color: "#84cc16" };
  if (vo2max >= 42) return { category: "Regular", color: "#F59E0B" };
  if (vo2max >= 35) return { category: "Fraco", color: "#f97316" };
  return { category: "Muito Fraco", color: "#EF4444" };
}
