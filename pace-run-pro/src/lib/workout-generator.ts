import { getTrainingPaces, type TrainingZoneId } from "./vdot";

export type WorkoutSubtype =
  | "Rodagem leve"
  | "Intervalado curto"
  | "Intervalado longo"
  | "Tempo Run"
  | "Fartlek"
  | "Progressivo"
  | "Longão"
  | "Regenerativo";

export interface GeneratedWorkout {
  sessionIndex: number;
  dayLabel: string;
  subtype: WorkoutSubtype;
  title: string;
  zone: TrainingZoneId;
  distanceKm: number;
  durationMin: number;
  targetPaceSecPerKm: number;
  paceRangeStr: string;
  targetRpe: number;
  objective: string;
  mainSet: string;
}

export type PhaseType = "Base" | "Construção" | "Específico" | "Taper";
export type GoalType = "5k" | "10k" | "Meia-maratona" | "Maratona" | "Trail" | "Personalizado";
export type LevelType = "Iniciante" | "Intermediário" | "Avançado";

export interface WorkoutGeneratorParams {
  phase: PhaseType;
  sessionsPerWeek: number;
  targetKm: number;
  vdot: number | null;
  goal: GoalType;
  level: LevelType;
  isDeload: boolean;
}

type SessionRole = "recovery" | "aerobic" | "quality" | "quality2" | "long";

// Day labels by number of sessions per week
const DAY_LABELS: Record<number, string[]> = {
  1: ["Quarta-feira"],
  2: ["Segunda-feira", "Quinta-feira"],
  3: ["Segunda-feira", "Quarta-feira", "Sábado"],
  4: ["Segunda-feira", "Quarta-feira", "Sexta-feira", "Sábado"],
  5: ["Segunda-feira", "Terça-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  6: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  7: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"],
};

// Session role sequence
const SESSION_ROLES: Record<number, SessionRole[]> = {
  1: ["long"],
  2: ["aerobic", "long"],
  3: ["aerobic", "quality", "long"],
  4: ["aerobic", "quality", "aerobic", "long"],
  5: ["recovery", "aerobic", "quality", "aerobic", "long"],
  6: ["recovery", "aerobic", "quality", "aerobic", "quality2", "long"],
  7: ["recovery", "aerobic", "quality", "aerobic", "quality2", "aerobic", "long"],
};

// Relative km distribution per session (sums to 1.0)
const KM_DISTRIBUTION: Record<number, number[]> = {
  1: [1.0],
  2: [0.35, 0.65],
  3: [0.25, 0.30, 0.45],
  4: [0.15, 0.25, 0.15, 0.45],
  5: [0.10, 0.15, 0.25, 0.15, 0.35],
  6: [0.08, 0.12, 0.22, 0.12, 0.20, 0.26],
  7: [0.07, 0.10, 0.20, 0.10, 0.18, 0.13, 0.22],
};

// Level-based fallback paces (sec/km) when VDOT is unknown
const FALLBACK_PACES: Record<LevelType, Record<TrainingZoneId, number>> = {
  Iniciante:      { E: 410, M: 375, T: 340, I: 305, R: 275 },
  Intermediário:  { E: 340, M: 305, T: 275, I: 245, R: 215 },
  Avançado:       { E: 285, M: 255, T: 228, I: 202, R: 180 },
};

const ZONE_RPE: Record<TrainingZoneId, number> = { E: 5, M: 6, T: 7, I: 8, R: 9 };

const SUBTYPE_ZONE: Record<WorkoutSubtype, TrainingZoneId> = {
  "Rodagem leve":       "E",
  "Regenerativo":       "E",
  "Longão":             "E",
  "Fartlek":            "T",
  "Progressivo":        "M",
  "Tempo Run":          "T",
  "Intervalado curto":  "I",
  "Intervalado longo":  "I",
};

export const ZONE_COLORS: Record<TrainingZoneId, string> = {
  E: "#84cc16",
  M: "#38bdf8",
  T: "#eab308",
  I: "#f97316",
  R: "#ef4444",
};

export function formatPaceSec(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getPaceInfo(
  zone: TrainingZoneId,
  vdot: number | null,
  level: LevelType
): { pace: number; rangeStr: string } {
  if (vdot && vdot > 20) {
    const paces = getTrainingPaces(vdot);
    const range = paces[zone];
    const mid = Math.round((range.fastSecPerKm + range.slowSecPerKm) / 2);
    return {
      pace: mid,
      rangeStr: `${formatPaceSec(range.fastSecPerKm)}–${formatPaceSec(range.slowSecPerKm)}/km`,
    };
  }
  const pace = FALLBACK_PACES[level][zone];
  return { pace, rangeStr: `${formatPaceSec(pace)}/km` };
}

function getQualitySubtype(
  phase: PhaseType,
  goal: GoalType,
  role: "quality" | "quality2"
): WorkoutSubtype {
  const isShortGoal = goal === "5k" || goal === "10k";
  if (phase === "Base") return role === "quality2" ? "Progressivo" : "Fartlek";
  if (phase === "Construção") return role === "quality2" ? "Progressivo" : "Tempo Run";
  if (phase === "Específico") {
    if (role === "quality2") return "Progressivo";
    return isShortGoal ? "Intervalado curto" : "Intervalado longo";
  }
  // Taper — lighter work
  return "Fartlek";
}

function getLongZone(goal: GoalType, phase: PhaseType): TrainingZoneId {
  if ((goal === "Maratona" || goal === "Trail") && (phase === "Construção" || phase === "Específico")) return "M";
  if (goal === "Meia-maratona" && phase === "Específico") return "M";
  return "E";
}

function buildMainSet(
  subtype: WorkoutSubtype,
  distanceKm: number,
  paceRangeStr: string
): string {
  switch (subtype) {
    case "Rodagem leve":
      return `Corrida contínua de ${distanceKm} km em ritmo E (fácil), pace ${paceRangeStr}. Conversa confortável durante todo o treino.`;
    case "Regenerativo":
      return `Corrida muito leve de ${distanceKm} km em ritmo E−, abaixo de ${paceRangeStr}. Foco em recuperação ativa — pode incluir trechos de caminhada.`;
    case "Longão":
      return `Corrida longa de ${distanceKm} km em ritmo E/M, pace ${paceRangeStr}. Mantenha hidratação a cada 3–4 km.`;
    case "Fartlek":
      return `Aquecimento 2 km E + 4–6 acelerações de 1–3 min em T/I (${paceRangeStr}) com 2 min trote entre cada + 1–2 km regenerativo.`;
    case "Tempo Run":
      return `Aquecimento 2 km E + ${Math.max(2, Math.round(distanceKm * 0.55))} km contínuos em ritmo T (${paceRangeStr}) + 1–2 km regenerativo.`;
    case "Progressivo":
      return `Início em ritmo E, progressão a cada 3–5 km até atingir ritmo M/T (${paceRangeStr}) nos últimos 20–30% do treino.`;
    case "Intervalado curto":
      return `Aquecimento 2 km E + 6–10 × 400–600 m em ritmo I (${paceRangeStr}) com 60–90 s de recuperação ativa + 1 km regenerativo.`;
    case "Intervalado longo":
      return `Aquecimento 2 km E + 4–5 × 1000–1200 m em ritmo I (${paceRangeStr}) com 2–3 min de trote entre cada + 1–2 km regenerativo.`;
  }
}

function buildObjective(subtype: WorkoutSubtype): string {
  const map: Record<WorkoutSubtype, string> = {
    "Rodagem leve": "Acúmulo de volume aeróbico com baixa tensão metabólica",
    "Regenerativo": "Recuperação ativa e manutenção do padrão motor",
    "Longão": "Desenvolvimento da resistência aeróbica e eficiência metabólica",
    "Fartlek": "Estimulação variada do limiar de lactato em contexto livre",
    "Tempo Run": "Elevação do limiar de lactato e suporte ao ritmo de prova",
    "Progressivo": "Adaptação ao ritmo de prova e eficiência crescente",
    "Intervalado curto": "Desenvolvimento da potência aeróbica e VO2máx",
    "Intervalado longo": "Maximização do VO2máx e sustentação de alta intensidade",
  };
  return map[subtype];
}

/** Generates all workout sessions for a given training week. */
export function generateWorkoutsForWeek(params: WorkoutGeneratorParams): GeneratedWorkout[] {
  const { phase, sessionsPerWeek, targetKm, vdot, goal, level, isDeload } = params;
  const n = Math.min(7, Math.max(1, sessionsPerWeek));
  const days = DAY_LABELS[n] ?? DAY_LABELS[3];
  const roles = (SESSION_ROLES[n] ?? SESSION_ROLES[3]) as SessionRole[];
  const kmDist = KM_DISTRIBUTION[n] ?? KM_DISTRIBUTION[3];
  const weekKm = isDeload ? targetKm * 0.65 : targetKm;

  return roles.map((role, i) => {
    const rawKm = weekKm * (kmDist[i] ?? 0.25);
    const distanceKm = Math.max(2, Math.round(rawKm * 10) / 10);

    // Resolve subtype
    let subtype: WorkoutSubtype;
    if (isDeload) {
      subtype = role === "long" ? "Rodagem leve" : role === "quality" || role === "quality2" ? "Rodagem leve" : "Regenerativo";
    } else if (role === "quality" || role === "quality2") {
      subtype = getQualitySubtype(phase, goal, role);
    } else if (role === "long") {
      subtype = "Longão";
    } else if (role === "recovery") {
      subtype = "Regenerativo";
    } else {
      subtype = "Rodagem leve";
    }

    // Resolve zone
    const zone: TrainingZoneId =
      role === "long" && !isDeload ? getLongZone(goal, phase) : SUBTYPE_ZONE[subtype];

    const { pace, rangeStr } = getPaceInfo(zone, vdot, level);
    const durationMin = Math.max(15, Math.round((distanceKm * pace) / 60));
    const rpe = isDeload ? Math.max(3, ZONE_RPE[zone] - 1) : ZONE_RPE[zone];

    const titleMap: Record<WorkoutSubtype, string> = {
      "Rodagem leve":      `Rodagem leve — ${distanceKm} km`,
      "Regenerativo":      `Regenerativo — ${distanceKm} km`,
      "Longão":            `Longão — ${distanceKm} km`,
      "Fartlek":           `Fartlek — ${distanceKm} km`,
      "Tempo Run":         `Tempo Run — ${distanceKm} km`,
      "Progressivo":       `Progressivo — ${distanceKm} km`,
      "Intervalado curto": `Intervalado curto — ${distanceKm} km`,
      "Intervalado longo": `Intervalado longo — ${distanceKm} km`,
    };

    return {
      sessionIndex: i,
      dayLabel: days[i] ?? `Sessão ${i + 1}`,
      subtype,
      title: titleMap[subtype],
      zone,
      distanceKm,
      durationMin,
      targetPaceSecPerKm: pace,
      paceRangeStr: rangeStr,
      targetRpe: rpe,
      objective: buildObjective(subtype),
      mainSet: buildMainSet(subtype, distanceKm, rangeStr),
    };
  });
}
