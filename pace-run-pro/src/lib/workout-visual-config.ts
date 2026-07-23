export type WorkoutVisualModality = "corrida" | "ciclismo" | "natacao" | "triathlon" | "forca";

export interface WorkoutVisualDefinition {
  label: string;
  short: string;
  icon: "run" | "bike" | "swim" | "strength";
  modality: WorkoutVisualModality;
  status?: { completed: string; missed: string };
  light: { background: string; foreground: string; border: string };
  dark: { background: string; foreground: string; border: string };
}

const RUN: Pick<WorkoutVisualDefinition, "icon" | "modality"> = { icon: "run", modality: "corrida" };

export const WORKOUT_VISUAL_CONFIG: Record<string, WorkoutVisualDefinition> & { DEFAULT: WorkoutVisualDefinition } = {
  REGENERATIVO: { ...RUN, label: "Regenerativo", short: "Z1", light: { background: "#6ee7b7", foreground: "#17212b", border: "#34d399" }, dark: { background: "#047857", foreground: "#ecfdf5", border: "#10b981" } },
  RODAGEM_LEVE: { ...RUN, label: "Rodagem Leve", short: "Z2", light: { background: "#93c5fd", foreground: "#17212b", border: "#60a5fa" }, dark: { background: "#0369a1", foreground: "#eff6ff", border: "#38bdf8" } },
  PROGRESSIVO: { ...RUN, label: "Progressivo", short: "P", light: { background: "#60a5fa", foreground: "#17212b", border: "#3b82f6" }, dark: { background: "#1d4ed8", foreground: "#eff6ff", border: "#60a5fa" } },
  LONGAO: { ...RUN, label: "Longão", short: "L", light: { background: "#a5b4fc", foreground: "#17212b", border: "#818cf8" }, dark: { background: "#4338ca", foreground: "#eef2ff", border: "#818cf8" } },
  FARTLEK: { ...RUN, label: "Fartlek", short: "F", light: { background: "#fbbf24", foreground: "#17212b", border: "#f59e0b" }, dark: { background: "#b45309", foreground: "#fffbeb", border: "#fbbf24" } },
  TECNICA: { ...RUN, label: "Técnica", short: "T", light: { background: "#5eead4", foreground: "#17212b", border: "#2dd4bf" }, dark: { background: "#0f766e", foreground: "#f0fdfa", border: "#2dd4bf" } },
  SUBIDA: { ...RUN, label: "Subida", short: "S", light: { background: "#fb923c", foreground: "#17212b", border: "#f97316" }, dark: { background: "#c2410c", foreground: "#fff7ed", border: "#fb923c" } },
  TEMPO_RUN: { ...RUN, label: "Tempo Run", short: "T4", light: { background: "#fb923c", foreground: "#17212b", border: "#f97316" }, dark: { background: "#c2410c", foreground: "#fff7ed", border: "#fb923c" } },
  INTERVALADO_LONGO: { ...RUN, label: "Intervalado Longo", short: "IL", light: { background: "#fb7185", foreground: "#17212b", border: "#f43f5e" }, dark: { background: "#be123c", foreground: "#fff1f2", border: "#fb7185" } },
  INTERVALADO_CURTO: { ...RUN, label: "Intervalado Curto", short: "IC", light: { background: "#f87171", foreground: "#17212b", border: "#ef4444" }, dark: { background: "#b91c1c", foreground: "#fef2f2", border: "#f87171" } },
  PROVA: { ...RUN, label: "Prova/Competição", short: "★", light: { background: "#f87171", foreground: "#17212b", border: "#ef4444" }, dark: { background: "#991b1b", foreground: "#fef2f2", border: "#f87171" } },
  FORCA: { icon: "strength", modality: "forca", label: "Força", short: "FC", light: { background: "#a78bfa", foreground: "#17212b", border: "#8b5cf6" }, dark: { background: "#6d28d9", foreground: "#f5f3ff", border: "#a78bfa" } },
  FUNCIONAL: { icon: "strength", modality: "forca", label: "Funcional", short: "FN", light: { background: "#c084fc", foreground: "#17212b", border: "#a855f7" }, dark: { background: "#7e22ce", foreground: "#faf5ff", border: "#c084fc" } },
  MOBILIDADE: { icon: "strength", modality: "forca", label: "Mobilidade", short: "MB", light: { background: "#86efac", foreground: "#17212b", border: "#4ade80" }, dark: { background: "#15803d", foreground: "#f0fdf4", border: "#86efac" } },
  RECUPERACAO: { ...RUN, label: "Recuperação", short: "RC", light: { background: "#cbd5e1", foreground: "#17212b", border: "#94a3b8" }, dark: { background: "#475569", foreground: "#f8fafc", border: "#94a3b8" } },
  DEFAULT: { ...RUN, status: { completed: "ring-2 ring-success ring-offset-1", missed: "opacity-45" }, label: "Treino", short: "?", light: { background: "#cbd5e1", foreground: "#17212b", border: "#94a3b8" }, dark: { background: "#4b5563", foreground: "#f9fafb", border: "#9ca3af" } },
};

export function getWorkoutVisualConfig(type?: string | null): WorkoutVisualDefinition {
  const config = WORKOUT_VISUAL_CONFIG[String(type ?? "").toUpperCase()] ?? WORKOUT_VISUAL_CONFIG.DEFAULT;
  return {
    ...config,
    status: config.status ?? { completed: "ring-2 ring-success ring-offset-1", missed: "opacity-45" },
  };
}
