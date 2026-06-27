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
  warmup: string;
  mainSet: string;
  cooldown: string;
}

export type PhaseType = "Base" | "Construção" | "Específico" | "Taper";
export type GoalType = "5k" | "10k" | "Meia-maratona" | "Maratona" | "Trail" | "Personalizado";
export type LevelType = "Iniciante" | "Intermediário" | "Avançado";

export interface WorkoutGeneratorParams {
  phase: PhaseType;
  sessionsPerWeek: number;
  trainingDays: string[];   // specific day labels in order, e.g. ["Segunda-feira","Quarta-feira","Sábado"]
  targetKm: number;
  vdot: number | null;
  goal: GoalType;
  level: LevelType;
  isDeload: boolean;
}

type SessionRole = "recovery" | "aerobic" | "quality" | "quality2" | "long";

// Default day labels when no specific days provided (by session count)
const DEFAULT_DAYS: Record<number, string[]> = {
  1: ["Quarta-feira"],
  2: ["Segunda-feira", "Quinta-feira"],
  3: ["Segunda-feira", "Quarta-feira", "Sábado"],
  4: ["Segunda-feira", "Quarta-feira", "Sexta-feira", "Sábado"],
  5: ["Segunda-feira", "Terça-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  6: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  7: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"],
};

// Session role distribution by count
const SESSION_ROLES: Record<number, SessionRole[]> = {
  1: ["long"],
  2: ["aerobic", "long"],
  3: ["aerobic", "quality", "long"],
  4: ["aerobic", "quality", "aerobic", "long"],
  5: ["recovery", "aerobic", "quality", "aerobic", "long"],
  6: ["recovery", "aerobic", "quality", "aerobic", "quality2", "long"],
  7: ["recovery", "aerobic", "quality", "aerobic", "quality2", "aerobic", "long"],
};

// Relative km distribution per session
const KM_DISTRIBUTION: Record<number, number[]> = {
  1: [1.0],
  2: [0.35, 0.65],
  3: [0.25, 0.30, 0.45],
  4: [0.15, 0.25, 0.15, 0.45],
  5: [0.10, 0.15, 0.25, 0.15, 0.35],
  6: [0.08, 0.12, 0.22, 0.12, 0.20, 0.26],
  7: [0.07, 0.10, 0.20, 0.10, 0.18, 0.13, 0.22],
};

// Level-based fallback paces (sec/km) when VDOT not available
const FALLBACK_PACES: Record<LevelType, Record<TrainingZoneId, number>> = {
  Iniciante:     { E: 450, M: 410, T: 370, I: 330, R: 295 },
  Intermediário: { E: 360, M: 325, T: 292, I: 260, R: 230 },
  Avançado:      { E: 290, M: 260, T: 232, I: 205, R: 182 },
};

const ZONE_RPE: Record<TrainingZoneId, number> = { E: 5, M: 6, T: 7, I: 8, R: 9 };

const SUBTYPE_ZONE: Record<WorkoutSubtype, TrainingZoneId> = {
  "Rodagem leve":      "E",
  "Regenerativo":      "E",
  "Longão":            "E",
  "Fartlek":           "T",
  "Progressivo":       "M",
  "Tempo Run":         "T",
  "Intervalado curto": "I",
  "Intervalado longo": "I",
};

export const ZONE_COLORS: Record<TrainingZoneId, string> = {
  E: "#84cc16",
  M: "#38bdf8",
  T: "#eab308",
  I: "#FFB020",
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
  role: "quality" | "quality2",
  level: LevelType,
): WorkoutSubtype {
  // Beginners build aerobic base before adding intensity
  if (level === "Iniciante" && phase === "Base") return "Rodagem leve";
  const isShortGoal = goal === "5k" || goal === "10k";
  if (phase === "Base") return role === "quality2" ? "Progressivo" : "Fartlek";
  if (phase === "Construção") return role === "quality2" ? "Progressivo" : "Tempo Run";
  if (phase === "Específico") {
    if (role === "quality2") return "Progressivo";
    return isShortGoal ? "Intervalado curto" : "Intervalado longo";
  }
  return "Fartlek"; // Taper
}

function getLongZone(goal: GoalType, phase: PhaseType): TrainingZoneId {
  if ((goal === "Maratona" || goal === "Trail") && (phase === "Construção" || phase === "Específico")) return "M";
  if (goal === "Meia-maratona" && phase === "Específico") return "M";
  return "E";
}

// ── Warmup by subtype ─────────────────────────────────────────────────────────

function buildWarmup(subtype: WorkoutSubtype): string {
  switch (subtype) {
    case "Regenerativo":
      return "Caminhada ativa por 3–5 min. Sem necessidade de aquecimento adicional — o próprio trote leve já é o aquecimento.";
    case "Rodagem leve":
      return "5 min de caminhada progressiva + mobilidade dinâmica: rotação de tornozelos, elevação de joelhos e circundução de quadril (30 s cada).";
    case "Longão":
      return "10 min de corrida leve (ritmo E−) + 2 × 30 s de strides suaves (acelerações progressivas) com 1 min de trote entre cada.";
    case "Fartlek":
      return "2 km de corrida leve (ritmo E) + mobilidade dinâmica de quadril + 2 × 20 s de acelerações suaves. Total ≈ 10–12 min.";
    case "Tempo Run":
      return "2 km em ritmo E fácil + mobilidade dinâmica + 3 × 20 s de acelerações progressivas saindo do ritmo E até o ritmo T. Total ≈ 12–15 min.";
    case "Progressivo":
      return "Os primeiros 2–3 km do próprio treino servem de aquecimento — comece em ritmo E confortável e progrida gradualmente.";
    case "Intervalado curto":
      return "2 km de corrida leve (ritmo E) + mobilidade dinâmica + 3 × 100 m de strides progressivos com 1 min de trote entre cada. Total ≈ 12–15 min.";
    case "Intervalado longo":
      return "2 km em ritmo E + mobilidade de quadril e panturrilha + 2 × 200 m de acelerações suaves abaixo do ritmo I. Total ≈ 12–15 min.";
  }
}

// ── Cooldown by subtype ───────────────────────────────────────────────────────

function buildCooldown(subtype: WorkoutSubtype): string {
  switch (subtype) {
    case "Regenerativo":
      return "2–3 min de caminhada. Foam roller opcional em panturrilhas e glúteos se disponível.";
    case "Rodagem leve":
      return "5 min de caminhada + alongamento estático: panturrilha (30 s), isquiotibial (30 s), quadríceps (30 s) e flexor do quadril (30 s) — cada lado.";
    case "Longão":
      return "10 min de caminhada progressivamente mais lenta + alongamento estático completo (5–8 min): foco em panturrilha, isquiotibial, quadríceps, TI e glúteos. Hidratação e reposição de carboidratos nos primeiros 30 min pós-treino.";
    case "Fartlek":
      return "1–2 km de trote muito leve (ritmo E−) + 5 min de caminhada + alongamento estático de panturrilha, quadríceps e isquiotibiais (30 s cada lado).";
    case "Tempo Run":
      return "1–2 km de corrida regenerativa (ritmo E−) + 5 min de caminhada + alongamento estático completo (8–10 min). Priorize hidratação imediata.";
    case "Progressivo":
      return "2–3 min de caminhada + alongamento estático suave (5 min). O final em ritmo T exige boa recuperação — priorize hidratação e alimentação pós-treino.";
    case "Intervalado curto":
      return "1 km de trote muito leve + 5 min de caminhada + alongamento estático completo (8–10 min). Foam roller em panturrilha e quadríceps se disponível.";
    case "Intervalado longo":
      return "1–2 km de trote regenerativo (ritmo E−) + 5–8 min de caminhada + alongamento estático completo. Priorize reposição proteica e de carboidratos nos 30 min seguintes.";
  }
}

// ── Main set by subtype ───────────────────────────────────────────────────────

function buildMainSet(subtype: WorkoutSubtype, distanceKm: number, paceRangeStr: string): string {
  switch (subtype) {
    case "Rodagem leve":
      return `Corrida contínua de ${distanceKm} km em ritmo E (fácil), pace ${paceRangeStr}. Conversa confortável durante todo o treino. Mantenha cadência entre 160–170 ppm.`;
    case "Regenerativo":
      return `Corrida muito leve de ${distanceKm} km em ritmo E−, abaixo de ${paceRangeStr}. Pode incluir trechos de caminhada se necessário. Foco na recuperação, não no volume.`;
    case "Longão":
      return `Corrida longa de ${distanceKm} km em ritmo E, pace ${paceRangeStr}. Mantenha hidratação a cada 3–4 km. Nos últimos 20% pode progredir levemente para ritmo M se sentir bem.`;
    case "Fartlek":
      return `Corrida contínua com variações livres de ritmo: após aquecimento, realize 4–6 acelerações de 1–3 min em ritmo T/I (${paceRangeStr}) com 2 min de trote entre cada. Retorne ao ritmo E no final. Total do set principal: ${Math.round(distanceKm * 0.7)} km.`;
    case "Tempo Run":
      return `Após aquecimento: ${Math.max(2, Math.round(distanceKm * 0.55))} km contínuos em ritmo T (${paceRangeStr}) sem paradas. Mantenha respiração controlada e postura ereta. Não sprint — ritmo sustentável e constante.`;
    case "Progressivo":
      return `Início em ritmo E (${paceRangeStr} + 30 s), progressão a cada ${Math.max(2, Math.round(distanceKm / 4))} km. Atingir ritmo M/T (${paceRangeStr}) nos últimos 20–30% do treino (${Math.round(distanceKm * 0.25)} km finais). Total: ${distanceKm} km.`;
    case "Intervalado curto":
      return `6–10 × 400–600 m em ritmo I (${paceRangeStr}) com 60–90 s de recuperação ativa (trote leve) entre cada. Mantenha o ritmo constante em todas as repetições — interrompa se o pace cair >10 s/km.`;
    case "Intervalado longo":
      return `4–5 × 1000–1200 m em ritmo I (${paceRangeStr}) com 2–3 min de trote entre cada. Concentre-se em manter forma técnica e o mesmo pace em todas as repetições. Última repetição com esforço máximo controlado.`;
  }
}

function buildObjective(subtype: WorkoutSubtype): string {
  const map: Record<WorkoutSubtype, string> = {
    "Rodagem leve":      "Acúmulo de volume aeróbico com baixa tensão metabólica",
    "Regenerativo":      "Recuperação ativa e manutenção do padrão motor",
    "Longão":            "Desenvolvimento da resistência aeróbica e eficiência metabólica",
    "Fartlek":           "Estimulação variada do limiar de lactato em contexto livre",
    "Tempo Run":         "Elevação do limiar de lactato e suporte ao ritmo de prova",
    "Progressivo":       "Adaptação ao ritmo de prova e eficiência a velocidades crescentes",
    "Intervalado curto": "Desenvolvimento da potência aeróbica e VO2máx",
    "Intervalado longo": "Maximização do VO2máx e sustentação de alta intensidade",
  };
  return map[subtype];
}

// ── Main export ───────────────────────────────────────────────────────────────

/** Generates all workout sessions for a given training week. */
export function generateWorkoutsForWeek(params: WorkoutGeneratorParams): GeneratedWorkout[] {
  const { phase, sessionsPerWeek, trainingDays, targetKm, vdot, goal, level, isDeload } = params;

  // Resolve the actual days and session count
  const days =
    trainingDays.length > 0
      ? trainingDays
      : (DEFAULT_DAYS[Math.min(7, Math.max(1, sessionsPerWeek))] ?? DEFAULT_DAYS[3]);
  const n = days.length;

  const roles = (SESSION_ROLES[Math.min(7, n)] ?? SESSION_ROLES[3]) as SessionRole[];
  const kmDist = KM_DISTRIBUTION[Math.min(7, n)] ?? KM_DISTRIBUTION[3];
  const weekKm = isDeload ? targetKm * 0.65 : targetKm;

  return roles.map((role, i) => {
    const rawKm = weekKm * (kmDist[i] ?? 0.25);
    const distanceKm = Math.max(2, Math.round(rawKm * 10) / 10);

    // Resolve subtype
    let subtype: WorkoutSubtype;
    if (isDeload) {
      subtype =
        role === "long"
          ? "Rodagem leve"
          : role === "quality" || role === "quality2"
          ? "Rodagem leve"
          : "Regenerativo";
    } else if (role === "quality" || role === "quality2") {
      subtype = getQualitySubtype(phase, goal, role, level);
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
      warmup: buildWarmup(subtype),
      mainSet: buildMainSet(subtype, distanceKm, rangeStr),
      cooldown: buildCooldown(subtype),
    };
  });
}
