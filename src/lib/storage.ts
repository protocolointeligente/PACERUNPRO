import type { EvaluationScores } from "./avaliacao/dimensions";
import type { CategoryKey } from "./data/categories";
import type { PositionKey } from "./data/positions";
import type { DiagramElement } from "./diagrams/types";
import type { Exercise } from "./exercises/types";
import type { LessonPlan } from "./planner/generate";

const KEYS = {
  priorities: "futebolcoach:prioridades",
  overrides: "futebolcoach:overrides",
  customExercises: "futebolcoach:custom-exercises",
  theme: "futebolcoach:theme",
  accent: "futebolcoach:accent",
  athletes: "futebolcoach:atletas",
  savedPlans: "futebolcoach:treinos-salvos",
  coachProfile: "futebolcoach:perfil-treinador",
} as const;

export interface ExerciseOverride {
  title?: string;
  objective?: string;
  description?: string;
  organization?: string;
  execution?: string;
  coaching?: string;
  diagram?: DiagramElement[];
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota, etc.) — silently ignore
  }
}

export type CustomPriorities = Partial<Record<CategoryKey, string[]>>;

export function loadCustomPriorities(): CustomPriorities {
  return readJSON(KEYS.priorities, {});
}

export function saveCustomPriorities(value: CustomPriorities): void {
  writeJSON(KEYS.priorities, value);
}

export type ExerciseOverrides = Record<number, ExerciseOverride>;

export function loadOverrides(): ExerciseOverrides {
  return readJSON(KEYS.overrides, {});
}

export function saveOverrides(value: ExerciseOverrides): void {
  writeJSON(KEYS.overrides, value);
}

export function loadCustomExercises(): Exercise[] {
  return readJSON(KEYS.customExercises, []);
}

export function saveCustomExercises(value: Exercise[]): void {
  writeJSON(KEYS.customExercises, value);
}

export type ThemeMode = "dark" | "light";
export type AccentMode = "blue" | "orange";

export function loadTheme(): ThemeMode {
  return readJSON(KEYS.theme, "dark");
}

export function saveTheme(value: ThemeMode): void {
  writeJSON(KEYS.theme, value);
}

export function loadAccent(): AccentMode {
  return readJSON(KEYS.accent, "blue");
}

export function saveAccent(value: AccentMode): void {
  writeJSON(KEYS.accent, value);
}

export function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface AthleteEvaluation {
  id: string;
  date: string;
  scores: EvaluationScores;
  notes?: string;
}

export interface Athlete {
  id: string;
  name: string;
  birthdate?: string;
  position: PositionKey;
  category?: CategoryKey;
  notes?: string;
  evaluations: AthleteEvaluation[];
}

export function loadAthletes(): Athlete[] {
  return readJSON(KEYS.athletes, []);
}

export function saveAthletes(value: Athlete[]): void {
  writeJSON(KEYS.athletes, value);
}

export interface SavedPlan {
  id: string;
  title: string;
  createdAt: string;
  plan: LessonPlan;
}

export function loadSavedPlans(): SavedPlan[] {
  return readJSON(KEYS.savedPlans, []);
}

export function saveSavedPlans(value: SavedPlan[]): void {
  writeJSON(KEYS.savedPlans, value);
}

export interface CoachProfile {
  name: string;
  role: string;
  credential: string;
  club?: string;
  email?: string;
  phone?: string;
  signature?: string;
}

export function loadCoachProfile(): CoachProfile {
  return readJSON(KEYS.coachProfile, {
    name: "",
    role: "Profissional de Educação Física",
    credential: "Treinador Licença B ATFA CONMEBOL",
    club: "",
    email: "",
    phone: "",
    signature: "",
  });
}

export function saveCoachProfile(value: CoachProfile): void {
  writeJSON(KEYS.coachProfile, value);
}
