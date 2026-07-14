import type { WorkoutType } from "@prisma/client";

const VALID_WORKOUT_TYPES = new Set<string>([
  "RODAGEM_LEVE",
  "INTERVALADO_CURTO",
  "INTERVALADO_LONGO",
  "TEMPO_RUN",
  "FARTLEK",
  "PROGRESSIVO",
  "LONGAO",
  "REGENERATIVO",
  "SUBIDA",
  "TECNICA",
  "PROVA",
  "FORCA",
  "FUNCIONAL",
  "MOBILIDADE",
  "RECUPERACAO",
]);

export type WorkoutModality = "corrida" | "ciclismo" | "natacao" | "triathlon" | "forca";

export function normalizeWorkoutType(input?: string | null, sport?: string | null): WorkoutType {
  const raw = String(input ?? "").toUpperCase();
  if (VALID_WORKOUT_TYPES.has(raw)) return raw as WorkoutType;
  const key = `${raw} ${sport ?? ""}`.toUpperCase();
  if (key.includes("FORCA") || key.includes("STRENGTH")) return "FORCA";
  if (key.includes("MOBIL")) return "MOBILIDADE";
  if (key.includes("FUNCIONAL")) return "FUNCIONAL";
  if (key.includes("NAT") || key.includes("SWIM")) return "TECNICA";
  if (key.includes("CICL") || key.includes("BIKE")) return "RODAGEM_LEVE";
  return "RODAGEM_LEVE";
}

export function inferWorkoutModality(input: {
  sport?: string | null;
  type?: string | null;
  title?: string | null;
  objective?: string | null;
  notes?: string | null;
}): WorkoutModality {
  const key = [input.sport, input.type, input.title, input.objective, input.notes].filter(Boolean).join(" ").toUpperCase();
  if (key.includes("TRI")) return "triathlon";
  if (key.includes("FORCA") || key.includes("FORÇA") || key.includes("FUNCIONAL") || key.includes("MOBILIDADE")) return "forca";
  if (key.includes("NAT") || key.includes("SWIM") || key.includes("PISCINA") || key.includes("CSS")) return "natacao";
  if (key.includes("CICL") || key.includes("BIKE") || key.includes("FTP") || key.includes("WATTS")) return "ciclismo";
  return "corrida";
}

export function displayWorkoutType(type: string, modality: WorkoutModality): string {
  if (modality === "ciclismo") return `CICLISMO_${type}`;
  if (modality === "natacao") return `NATACAO_${type}`;
  if (modality === "triathlon") return `TRIATHLON_${type}`;
  return type;
}

export function modalityNote(sport?: string | null): string | null {
  const modality = inferWorkoutModality({ sport });
  return modality === "corrida" ? null : `Modalidade: ${modality}`;
}
