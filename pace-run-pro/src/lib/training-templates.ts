/**
 * Planilhas de treinamento prontas para atletas gratuitos.
 * Derivadas dos Modelos de Planilhas — Corrida de Rua (7 trilhas).
 *
 * Abreviações:
 *   CO=Corrida | CA=Caminhada | COL=Corrida lenta | COR=Corrida rápida
 *   TF=Fartlek | TI=Intervalado | TE=Extensivo | TL=Longo | TR=Regenerativo
 *   TRT=Time-trial | Z1-Z3=Zona de FC | Ra=Rec. ativa | Rp=Rec. passiva
 *   DPRP=Dia pré-prova (descanso) | PROVA=Dia de prova
 */

export type TrackLevel = "superacao" | "evolucao" | "performance";
export type GoalDistance = "3km" | "5km" | "10km";

export interface DayWorkout {
  /** SEG/TER/QUA/QUI/SEX/SAB/DOM */
  day: string;
  /** Ex: "TL 8km 75% Z2" | "DESCANSO" | "PROVA" */
  workout: string;
}

export interface TrainingWeek {
  week: number;
  days: DayWorkout[];
}

export interface TrainingTemplate {
  id: string;
  goal: GoalDistance;
  level: TrackLevel;
  durationWeeks: 8 | 12;
  title: string;
  description: string;
  weeks: TrainingWeek[];
}

// ─── Utilitário ──────────────────────────────────────────────────────────────

function week(n: number, seg: string, ter: string, qua: string, qui: string, sex: string, sab: string, dom: string): TrainingWeek {
  return {
    week: n,
    days: [
      { day: "SEG", workout: seg },
      { day: "TER", workout: ter },
      { day: "QUA", workout: qua },
      { day: "QUI", workout: qui },
      { day: "SEX", workout: sex },
      { day: "SAB", workout: sab },
      { day: "DOM", workout: dom },
    ],
  };
}

const D = "DESCANSO";
const P = "PROVA";
const DPRP = "DPRP";

// ─── 3 KM — 8 semanas ────────────────────────────────────────────────────────

const template3km: TrainingTemplate = {
  id: "3km-8w",
  goal: "3km",
  level: "superacao",
  durationWeeks: 8,
  title: "3 km — Superação (8 semanas)",
  description: "Prepare-se para completar os primeiros 3 km com treinos progressivos de corrida e caminhada.",
  weeks: [
    week(1,  "CO 20min Z1",   D,            "CO 20min Z1",   D,            "CO 20min Z1",   D,            D),
    week(2,  "CO 25min Z1",   D,            "CO 25min Z1",   D,            "CO 25min Z1",   D,            D),
    week(3,  "CO 30min Z2",   D,            "CO 30min Z2",   D,            "TRT 3km",       D,            D),
    week(4,  "TR 20min",      D,            "CO 25min Z1",   D,            "CO 25min Z1",   D,            D),
    week(5,  "TI 4x400m Ra3", D,            "CO 30min Z2",   D,            "TRT 3km",       D,            D),
    week(6,  "CO 35min Z2",   D,            "TF 30min",      D,            "CO 30min Z2",   D,            D),
    week(7,  "TI 6x400m Ra3", D,            "CO 30min Z2",   D,            "TR 20min",      D,            D),
    week(8,  "CO 20min Z1",   D,            "TR 15min",      D,            DPRP,            P,            D),
  ],
};

// ─── 5 KM Superação — 8 semanas ──────────────────────────────────────────────

const template5kmSuperacao8w: TrainingTemplate = {
  id: "5km-superacao-8w",
  goal: "5km",
  level: "superacao",
  durationWeeks: 8,
  title: "5 km — Superação (8 semanas)",
  description: "Plano de base para quem quer completar os primeiros 5 km com conforto.",
  weeks: [
    week(1,  "CO 25min Z1",   D,            "CO 25min Z1",   D,            "CO 25min Z1",   D,            D),
    week(2,  "CO 30min Z1",   D,            "CO 30min Z1",   D,            "TRT 5km",       D,            D),
    week(3,  "CO 35min Z2",   D,            "TF 30min",      D,            "CO 30min Z1",   D,            D),
    week(4,  "TR 25min",      D,            "CO 30min Z1",   D,            "CO 30min Z2",   D,            D),
    week(5,  "TI 5x500m Ra4", D,            "CO 35min Z2",   D,            "TRT 5km",       D,            D),
    week(6,  "TE 4km 80%",    D,            "CO 35min Z2",   D,            "TL 6km 70%",    D,            D),
    week(7,  "TI 6x500m Ra4", D,            "CO 30min Z2",   D,            "TR 25min",      D,            D),
    week(8,  "CO 25min Z1",   D,            "TR 20min",      D,            DPRP,            P,            D),
  ],
};

// ─── 5 KM Evolução — 8 semanas ───────────────────────────────────────────────

const template5kmEvolucao8w: TrainingTemplate = {
  id: "5km-evolucao-8w",
  goal: "5km",
  level: "evolucao",
  durationWeeks: 8,
  title: "5 km — Evolução (8 semanas)",
  description: "Para quem já corre e quer melhorar o tempo nos 5 km, com foco em ritmo e limiar.",
  weeks: [
    week(1,  "COL 5km",       D,            "TI 6x400m Ra3", D,            "COL 5km",       D,            D),
    week(2,  "TF 35min",      D,            "TI 6x500m Ra4", D,            "TE 5km 80%",    D,            D),
    week(3,  "TL 7km 75%",    D,            "TI 8x400m Ra3", D,            "TF 35min",      D,            D),
    week(4,  "TR 25min",      D,            "COL 5km",       D,            "TR 25min",      D,            D),
    week(5,  "TI 8x500m Ra4", D,            "TE 6km 82%",    D,            "TRT 5km",       D,            D),
    week(6,  "TL 8km 75%",    D,            "TI 10x400m Ra3",D,            "TF 40min",      D,            D),
    week(7,  "TI 6x600m Ra4", D,            "TE 5km 85%",    D,            "TR 25min",      D,            D),
    week(8,  "COL 4km",       D,            "TR 20min",      D,            DPRP,            P,            D),
  ],
};

// ─── 5 KM Evolução — 12 semanas ──────────────────────────────────────────────

const template5kmEvolucao12w: TrainingTemplate = {
  id: "5km-evolucao-12w",
  goal: "5km",
  level: "evolucao",
  durationWeeks: 12,
  title: "5 km — Evolução (12 semanas)",
  description: "Periodização completa de 12 semanas para maximizar a performance nos 5 km.",
  weeks: [
    // Mês 1 — Base
    week(1,  "COL 5km",       D,            "TI 4x500m Ra4", D,            "COL 5km",       D,            D),
    week(2,  "TF 30min",      D,            "TI 6x400m Ra3", D,            "TE 5km 78%",    D,            D),
    week(3,  "TL 7km 72%",    D,            "TI 6x500m Ra4", D,            "TF 35min",      D,            D),
    week(4,  "TR 25min",      D,            "COL 4km",       D,            "TR 20min",      D,            D),
    // Mês 2 — Construção
    week(5,  "TI 8x400m Ra3", D,            "TE 6km 80%",    D,            "TRT 5km",       D,            D),
    week(6,  "TL 8km 75%",    D,            "TI 8x500m Ra4", D,            "TF 40min",      D,            D),
    week(7,  "TI 10x400m Ra3",D,            "TE 5km 83%",    D,            "TL 8km 75%",    D,            D),
    week(8,  "TR 25min",      D,            "COL 5km",       D,            "TR 20min",      D,            D),
    // Mês 3 — Específico / Pico
    week(9,  "TI 6x600m Ra4", D,            "TE 6km 85%",    D,            "TRT 5km",       D,            D),
    week(10, "TL 9km 75%",    D,            "TI 8x500m Ra3", D,            "TF 40min",      D,            D),
    week(11, "TI 6x500m Ra3", D,            "TE 5km 87%",    D,            "TR 25min",      D,            D),
    week(12, "COL 4km",       D,            "TR 20min",      D,            DPRP,            P,            D),
  ],
};

// ─── 10 KM Superação — 8 semanas ─────────────────────────────────────────────

const template10kmSuperacao8w: TrainingTemplate = {
  id: "10km-superacao-8w",
  goal: "10km",
  level: "superacao",
  durationWeeks: 8,
  title: "10 km — Superação (8 semanas)",
  description: "Chegue à linha de chegada dos 10 km com segurança, construindo volume e resistência.",
  weeks: [
    week(1,  "COL 5km",       D,            "CO 30min Z1",   D,            "TL 6km 70%",    D,            D),
    week(2,  "TI 4x500m Ra4", D,            "CO 35min Z2",   D,            "TL 7km 70%",    D,            D),
    week(3,  "TF 35min",      D,            "CO 35min Z2",   D,            "TL 8km 70%",    D,            D),
    week(4,  "TR 25min",      D,            "COL 5km",       D,            "TL 6km 72%",    D,            D),
    week(5,  "TI 6x500m Ra4", D,            "TE 6km 80%",    D,            "TL 9km 72%",    D,            D),
    week(6,  "TF 40min",      D,            "TE 7km 80%",    D,            "TL 10km 72%",   D,            D),
    week(7,  "TI 6x600m Ra4", D,            "CO 35min Z2",   D,            "TR 25min",      D,            D),
    week(8,  "COL 5km",       D,            "TR 20min",      D,            DPRP,            P,            D),
  ],
};

// ─── 10 KM Evolução — 12 semanas ─────────────────────────────────────────────

const template10kmEvolucao12w: TrainingTemplate = {
  id: "10km-evolucao-12w",
  goal: "10km",
  level: "evolucao",
  durationWeeks: 12,
  title: "10 km — Evolução (12 semanas)",
  description: "Periodização progressiva de 3 meses para melhorar o tempo e economia de corrida nos 10 km.",
  weeks: [
    // Mês 1 — Base aeróbica
    week(1,  "COL 5km",       D,            "TI 4x500m Ra4", D,            "TL 7km 70%",    D,            D),
    week(2,  "TF 35min",      D,            "TI 6x500m Ra4", D,            "TL 8km 72%",    D,            D),
    week(3,  "TE 7km 78%",    D,            "TI 6x600m Ra4", D,            "TL 9km 72%",    D,            D),
    week(4,  "TR 30min",      D,            "COL 6km",       D,            "TL 7km 70%",    D,            D),
    // Mês 2 — Construção
    week(5,  "TI 8x500m Ra3", D,            "TE 8km 80%",    D,            "TL 10km 74%",   D,            D),
    week(6,  "TF 45min",      D,            "TI 8x600m Ra3", D,            "TL 11km 74%",   D,            D),
    week(7,  "TI 10x500m Ra3",D,            "TE 8km 83%",    D,            "TL 12km 74%",   D,            D),
    week(8,  "TR 30min",      D,            "COL 6km",       D,            "TR 25min",      D,            D),
    // Mês 3 — Específico
    week(9,  "TI 6x800m Ra4", D,            "TE 8km 85%",    D,            "TL 12km 75%",   D,            D),
    week(10, "TF 45min",      D,            "TI 8x600m Ra3", D,            "TL 13km 75%",   D,            D),
    week(11, "TI 8x500m Ra3", D,            "TE 8km 87%",    D,            "TR 30min",      D,            D),
    week(12, "COL 5km",       D,            "TR 20min",      D,            DPRP,            P,            D),
  ],
};

// ─── 10 KM Performance — 12 semanas ──────────────────────────────────────────

const template10kmPerformance12w: TrainingTemplate = {
  id: "10km-performance-12w",
  goal: "10km",
  level: "performance",
  durationWeeks: 12,
  title: "10 km — Performance (12 semanas)",
  description: "Trilha avançada para atletas experientes que buscam um novo recorde pessoal nos 10 km.",
  weeks: [
    // Mês 1 — Base de velocidade
    week(1,  "TI 8x400m Ra3", D,            "TE 8km 80%",    D,            "TL 10km 75%",   D,            D),
    week(2,  "TF 45min",      D,            "TI 8x500m Ra3", D,            "TL 11km 75%",   D,            D),
    week(3,  "TE 9km 82%",    D,            "TI 10x400m Ra3",D,            "TL 12km 75%",   D,            D),
    week(4,  "TR 30min",      D,            "COL 7km",       D,            "TR 25min",      D,            D),
    // Mês 2 — Limiar e VAM
    week(5,  "TI 6x800m Ra4", D,            "TE 9km 85%",    D,            "TL 13km 76%",   D,            D),
    week(6,  "TF 50min",      D,            "TI 8x600m Ra3", D,            "TL 14km 76%",   D,            D),
    week(7,  "TI 10x500m Ra3",D,            "TE 10km 85%",   D,            "TL 14km 76%",   D,            D),
    week(8,  "TR 30min",      D,            "COL 8km",       D,            "TR 30min",      D,            D),
    // Mês 3 — Pico e taper
    week(9,  "TI 8x800m Ra4", D,            "TE 9km 87%",    D,            "TL 15km 76%",   D,            D),
    week(10, "TF 50min",      D,            "TI 8x600m Ra3", D,            "TRT 10km",      D,            D),
    week(11, "TI 6x600m Ra3", D,            "TE 8km 85%",    D,            "TR 25min",      D,            D),
    week(12, "COL 6km",       D,            "TR 20min",      D,            DPRP,            P,            D),
  ],
};

// ─── Exportações ──────────────────────────────────────────────────────────────

export const trainingTemplates: TrainingTemplate[] = [
  template3km,
  template5kmSuperacao8w,
  template5kmEvolucao8w,
  template5kmEvolucao12w,
  template10kmSuperacao8w,
  template10kmEvolucao12w,
  template10kmPerformance12w,
];

/** Retorna o template mais adequado ao objetivo e nível do atleta. */
export function getRecommendedTemplate(goal: GoalDistance, level: TrackLevel, preferLong = false): TrainingTemplate {
  const candidates = trainingTemplates.filter((t) => t.goal === goal && t.level === level);
  if (candidates.length === 0) return trainingTemplates[0];
  if (candidates.length === 1) return candidates[0];
  return preferLong
    ? candidates.reduce((a, b) => (a.durationWeeks >= b.durationWeeks ? a : b))
    : candidates.reduce((a, b) => (a.durationWeeks <= b.durationWeeks ? a : b));
}

/** Template padrão atribuído a atletas gratuitos ao se cadastrarem. */
export const freeAthleteDefaultTemplate = template5kmSuperacao8w;
