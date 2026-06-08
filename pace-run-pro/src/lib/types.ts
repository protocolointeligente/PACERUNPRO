export type WorkoutType =
  | "corrida"
  | "forca"
  | "funcional"
  | "mobilidade"
  | "recuperacao"
  | "prova";

export type RunWorkoutSubtype =
  | "Rodagem leve"
  | "Intervalado curto"
  | "Intervalado longo"
  | "Tempo Run"
  | "Fartlek"
  | "Progressivo"
  | "Longão"
  | "Regenerativo"
  | "Subida"
  | "Técnica"
  | "Prova";

export interface WorkoutSummary {
  id: string;
  date: string; // ISO
  type: WorkoutType;
  subtype?: RunWorkoutSubtype | string;
  title: string;
  status: "agendado" | "liberado" | "concluido" | "perdido";
  distanceKm?: number;
  durationMin?: number;
  targetPaceSecPerKm?: number;
  targetRpe?: number;
  targetHrZone?: string;
  color: string;
}

export interface WorkoutDetail extends WorkoutSummary {
  objective: string;
  warmup: string;
  mainSet: string;
  cooldown: string;
  notes?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface CheckInEntry {
  date: string;
  rpe: number;
  pain: number;
  sleep: number;
  fatigue: number;
  mood: number;
  notes?: string;
  plannedRpe?: number;
}

export interface AthleteListItem {
  id: string;
  name: string;
  avatarUrl?: string;
  goal: string;
  level: string;
  status: "ativo" | "risco" | "inativo";
  adherence: number; // 0-1
  lastCheckIn?: string;
  weeklyLoad: number;
  raceDate?: string;
}

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  category: string;
  muscles: string[];
  imageUrl?: string;
  description: string;
  execution: string;
  mistakes: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: number;
}
