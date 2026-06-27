export const TYPE_COLORS: Record<string, string> = {
  corrida: "#38bdf8",
  forca: "#8b5cf6",
  funcional: "#a855f7",
  mobilidade: "#84cc16",
  recuperacao: "#94a3b8",
  prova: "#facc15",
};

export const TYPE_LABELS: Record<string, string> = {
  corrida: "Corrida",
  forca: "Força",
  funcional: "Funcional",
  mobilidade: "Mobilidade",
  recuperacao: "Recuperação",
  prova: "Prova",
};

export const RUN_SUBTYPE_COLORS: Record<string, string> = {
  "Regenerativo": "#94a3b8",
  "Rodagem leve": "#84cc16",
  "Longão": "#22c55e",
  "Técnica": "#06b6d4",
  "Progressivo": "#38bdf8",
  "Fartlek": "#a78bfa",
  "Tempo Run": "#eab308",
  "Subida": "#fb923c",
  "Intervalado longo": "#f97316",
  "Intervalado curto": "#ef4444",
  "Prova": "#ec4899",
};

export function getSubtypeColor(type: string, subtype?: string): string {
  if (subtype && RUN_SUBTYPE_COLORS[subtype]) return RUN_SUBTYPE_COLORS[subtype];
  return TYPE_COLORS[type] ?? TYPE_COLORS.corrida;
}
