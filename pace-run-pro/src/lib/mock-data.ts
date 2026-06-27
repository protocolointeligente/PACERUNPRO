import type {
  AthleteListItem,
  AthleteRosterItem,
  CheckInEntry,
  ExerciseLibraryItem,
  RunWorkoutTemplate,
  WorkoutDetail,
  WorkoutSummary,
  WorkoutTemplate,
} from "./types";

export const TYPE_COLORS: Record<string, string> = {
  corrida: "#38bdf8",
  forca: "#C6F24E",
  funcional: "#46E0C8",
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

// Paleta por tipo de treino de corrida (estilo Runna), do mais leve ao mais intenso
export const RUN_SUBTYPE_COLORS: Record<string, string> = {
  "Regenerativo": "#94a3b8",
  "Rodagem leve": "#84cc16",
  "Longão": "#22c55e",
  "Técnica": "#06b6d4",
  "Progressivo": "#38bdf8",
  "Fartlek": "#a78bfa",
  "Tempo Run": "#eab308",
  "Subida": "#fb923c",
  "Intervalado longo": "#FFB020",
  "Intervalado curto": "#ef4444",
  "Prova": "#ec4899",
};

export function getSubtypeColor(type: string, subtype?: string): string {
  if (subtype && RUN_SUBTYPE_COLORS[subtype]) return RUN_SUBTYPE_COLORS[subtype];
  return TYPE_COLORS[type] ?? TYPE_COLORS.corrida;
}

export const currentAthlete = {
  name: "Camila Andrade",
  firstName: "Camila",
  avatarUrl:
    "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?w=256&h=256&fit=crop&crop=faces",
  level: "Intermediário",
  goal: "21 km — Meia Maratona de BH",
  raceDate: "2026-08-16",
  coach: "Treinador Ricardo Pace",
  plan: "Pace Run Pro — Atleta",
  city: "Belo Horizonte, MG",
  weightKg: 61.4,
  heightCm: 167,
  age: 29,
};

export const weekSummary = {
  weekLabel: "Semana 7 de 16 — Bloco Construção",
  cycleProgress: 0.44,
  plannedKm: 42,
  doneKm: 27.8,
  plannedSessions: 5,
  doneSessions: 3,
  totalTimeMin: 198,
  weeklyLoad: 312,
  previousAvgLoad: 288,
  adherence: 0.86,
  recovery: 0.71,
};

export const todayWorkout: WorkoutDetail = {
  id: "w-today",
  date: new Date().toISOString(),
  type: "corrida",
  subtype: "Intervalado curto",
  title: "Intervalado 8 x 400m",
  status: "liberado",
  distanceKm: 9,
  durationMin: 55,
  targetPaceSecPerKm: 282, // 4:42/km
  targetRpe: 7,
  targetHrZone: "Zona 4 — Limiar",
  color: TYPE_COLORS.corrida,
  objective:
    "Desenvolver potência aeróbica e economia de corrida em ritmos próximos ao limiar, com recuperação ativa entre os tiros.",
  warmup:
    "15 min de corrida leve em Zona 1–2 + 4 progressões de 80m + mobilidade dinâmica de tornozelo e quadril.",
  mainSet:
    "8 x 400m a 4:20–4:30/km (RPE 7–8), com 90s de trote leve entre os tiros. Manter cadência ≥ 172 spm.",
  cooldown: "10 min de trote regenerativo em Zona 1 + alongamento ativo de panturrilha e posterior de coxa.",
  notes:
    "Se sentir desconforto na canela direita, reduza para 6 tiros e avise o treinador pelo check-in pós-treino.",
  videoUrl: "https://example.com/videos/intervalado-400m",
  imageUrl:
    "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&h=700&fit=crop",
};

export const weekWorkouts: WorkoutSummary[] = [
  {
    id: "w-mon",
    date: addDays(0),
    type: "recuperacao",
    subtype: "Regenerativo",
    title: "Trote regenerativo 5 km",
    status: "concluido",
    distanceKm: 5,
    durationMin: 32,
    targetPaceSecPerKm: 348,
    targetRpe: 3,
    targetHrZone: "Zona 1",
    color: TYPE_COLORS.recuperacao,
  },
  {
    id: "w-tue",
    date: addDays(1),
    type: "forca",
    subtype: "Treino A — Inferiores",
    title: "Força — membros inferiores",
    status: "concluido",
    durationMin: 50,
    color: TYPE_COLORS.forca,
  },
  {
    id: "w-wed",
    date: addDays(2),
    type: "corrida",
    subtype: "Tempo Run",
    title: "Tempo Run 6 km",
    status: "concluido",
    distanceKm: 6,
    durationMin: 30,
    targetPaceSecPerKm: 300,
    targetRpe: 6,
    targetHrZone: "Zona 3",
    color: TYPE_COLORS.corrida,
  },
  {
    id: "w-today",
    date: addDays(3),
    type: "corrida",
    subtype: "Intervalado curto",
    title: "Intervalado 8 x 400m",
    status: "liberado",
    distanceKm: 9,
    durationMin: 55,
    targetPaceSecPerKm: 282,
    targetRpe: 7,
    targetHrZone: "Zona 4",
    color: TYPE_COLORS.corrida,
  },
  {
    id: "w-fri",
    date: addDays(4),
    type: "funcional",
    subtype: "Core + Mobilidade",
    title: "Funcional — core e mobilidade",
    status: "agendado",
    durationMin: 40,
    color: TYPE_COLORS.funcional,
  },
  {
    id: "w-sat",
    date: addDays(5),
    type: "corrida",
    subtype: "Longão",
    title: "Longão 18 km progressivo",
    status: "agendado",
    distanceKm: 18,
    durationMin: 110,
    targetPaceSecPerKm: 318,
    targetRpe: 6,
    targetHrZone: "Zona 2–3",
    color: TYPE_COLORS.corrida,
  },
  {
    id: "w-sun",
    date: addDays(6),
    type: "mobilidade",
    subtype: "Mobilidade ativa",
    title: "Mobilidade e liberação miofascial",
    status: "agendado",
    durationMin: 25,
    color: TYPE_COLORS.mobilidade,
  },
];

const detailExtras: Record<string, Pick<WorkoutDetail, "objective" | "warmup" | "mainSet" | "cooldown" | "notes" | "videoUrl" | "imageUrl">> = {
  "w-mon": {
    objective: "Promover recuperação ativa após o treino de força, mantendo o fluxo sanguíneo sem gerar fadiga adicional.",
    warmup: "5 min de caminhada + mobilidade leve de tornozelo e quadril.",
    mainSet: "5 km em ritmo confortável (Zona 1), respiração nasal, sem se preocupar com pace.",
    cooldown: "5 min de caminhada + alongamento leve de panturrilha e posterior de coxa.",
    notes: "Esse treino não tem compromisso com pace — o objetivo é se sentir bem e solto.",
    imageUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&h=700&fit=crop",
  },
  "w-tue": {
    objective: "Fortalecer cadeia posterior e estabilizadores de quadril para melhorar a economia de corrida.",
    warmup: "5 min de mobilidade articular + ativação de glúteos com elástico.",
    mainSet: "Circuito força A: agachamento búlgaro, elevação de panturrilha, ponte de glúteo unilateral e prancha — 4 séries cada.",
    cooldown: "Alongamento ativo de quadríceps, isquiotibiais e panturrilha.",
    notes: "Use cargas que permitam completar todas as repetições com boa técnica (RPE 7).",
    imageUrl: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=1200&h=700&fit=crop",
  },
  "w-wed": {
    objective: "Desenvolver a capacidade de sustentar o ritmo de limiar por períodos contínuos.",
    warmup: "12 min de corrida progressiva em Zona 1–2 + 3 acelerações de 60m.",
    mainSet: "20 min contínuos a 5:00/km (RPE 6), foco em manter cadência estável e respiração controlada.",
    cooldown: "8 min de trote leve + mobilidade de tornozelo.",
    notes: "Se o pace ficar 10s/km mais lento que o alvo nos primeiros minutos, ajuste para o seu ritmo confortável sustentável.",
    imageUrl: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=1200&h=700&fit=crop",
  },
  "w-fri": {
    objective: "Melhorar estabilidade de core e mobilidade de quadril e tornozelo — prevenção de lesões.",
    warmup: "5 min de respiração diafragmática + ativação de core.",
    mainSet: "Circuito funcional: prancha com elevação de perna, mobilidade de tornozelo em parede, agachamento profundo assistido, hip airplane — 3 voltas.",
    cooldown: "Alongamento global guiado + respiração.",
    notes: "Priorize qualidade de movimento — sem pressa.",
    imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&h=700&fit=crop",
  },
  "w-sat": {
    objective: "Construir resistência aeróbica de longa duração com final progressivo no ritmo de meia maratona.",
    warmup: "10 min de corrida muito leve em Zona 1.",
    mainSet: "12 km em Zona 2 (5:30/km) + 6 km progressivos terminando em 4:50–5:00/km (ritmo alvo de prova).",
    cooldown: "10 min de caminhada + alongamento completo + hidratação e reposição de carboidratos.",
    notes: "Leve géis ou isotônico — esse é o treino mais longo da semana. Durma bem na noite anterior.",
    videoUrl: "https://example.com/videos/longao-progressivo",
    imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&h=700&fit=crop",
  },
  "w-sun": {
    objective: "Acelerar a recuperação muscular e a amplitude articular antes do início do próximo microciclo.",
    warmup: "Respiração e ativação leve.",
    mainSet: "Sequência guiada de mobilidade (quadril, tornozelo, coluna torácica) + liberação miofascial com rolo.",
    cooldown: "Alongamento estático prolongado + respiração diafragmática.",
    notes: "Sessão totalmente regenerativa — sem pressão de desempenho.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68e71?w=1200&h=700&fit=crop",
  },
};

export function getWorkoutDetail(id: string): WorkoutDetail | undefined {
  if (id === todayWorkout.id) return todayWorkout;
  const summary = weekWorkouts.find((w) => w.id === id);
  if (!summary) return undefined;
  const extra = detailExtras[id];
  if (!extra) return { ...summary, objective: "Sessão prescrita pelo seu treinador conforme o plano da semana.", warmup: "Aquecimento padrão de 10 minutos.", mainSet: "Parte principal conforme orientação do treinador.", cooldown: "Volta à calma de 10 minutos." };
  return { ...summary, ...extra };
}

function addDays(n: number) {
  const monday = startOfWeek(new Date());
  const d = new Date(monday);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const recentSessions = [
  {
    id: "rs-1",
    title: "Tempo Run 6 km",
    date: "Qua, 04 jun",
    distanceKm: 6,
    pace: "5:00/km",
    rpe: 6,
    badge: "Concluído",
  },
  {
    id: "rs-2",
    title: "Força — membros inferiores",
    date: "Ter, 03 jun",
    distanceKm: undefined,
    pace: "50 min",
    rpe: 5,
    badge: "Concluído",
  },
  {
    id: "rs-3",
    title: "Trote regenerativo 5 km",
    date: "Seg, 02 jun",
    distanceKm: 5,
    pace: "5:48/km",
    rpe: 3,
    badge: "Concluído",
  },
];

export const upcomingSessions = weekWorkouts.filter(
  (w) => w.status === "agendado" || w.status === "liberado"
);

export const checkInHistory: CheckInEntry[] = [
  { date: "2026-06-02", rpe: 3, pain: 1, sleep: 8, fatigue: 3, mood: 8, plannedRpe: 3 },
  { date: "2026-06-03", rpe: 6, pain: 2, sleep: 7, fatigue: 5, mood: 7, plannedRpe: 5 },
  { date: "2026-06-04", rpe: 7, pain: 2, sleep: 6, fatigue: 6, mood: 6, plannedRpe: 6 },
  { date: "2026-06-05", rpe: 6, pain: 3, sleep: 7, fatigue: 6, mood: 7, plannedRpe: 6 },
  { date: "2026-06-06", rpe: 5, pain: 2, sleep: 8, fatigue: 4, mood: 8, plannedRpe: 5 },
];

// ── Evolução / gráficos ──────────────────────────────────────────────────

export const weeklyVolumeSeries = [
  { label: "Sem 1", km: 28 },
  { label: "Sem 2", km: 31 },
  { label: "Sem 3", km: 34 },
  { label: "Sem 4", km: 30 },
  { label: "Sem 5", km: 38 },
  { label: "Sem 6", km: 41 },
  { label: "Sem 7", km: 27.8 },
];

export const monthlyVolumeSeries = [
  { label: "Jan", km: 118 },
  { label: "Fev", km: 132 },
  { label: "Mar", km: 145 },
  { label: "Abr", km: 151 },
  { label: "Mai", km: 168 },
  { label: "Jun", km: 96 },
];

export const avgPaceSeries = [
  { label: "Sem 1", paceSec: 336 },
  { label: "Sem 2", paceSec: 330 },
  { label: "Sem 3", paceSec: 324 },
  { label: "Sem 4", paceSec: 322 },
  { label: "Sem 5", paceSec: 318 },
  { label: "Sem 6", paceSec: 312 },
  { label: "Sem 7", paceSec: 308 },
];

export const trainingLoadSeries = [
  { label: "Sem 1", load: 240 },
  { label: "Sem 2", load: 268 },
  { label: "Sem 3", load: 290 },
  { label: "Sem 4", load: 255 },
  { label: "Sem 5", load: 305 },
  { label: "Sem 6", load: 330 },
  { label: "Sem 7", load: 312 },
];

export const avgHrSeries = [
  { label: "Sem 1", hr: 152 },
  { label: "Sem 2", hr: 150 },
  { label: "Sem 3", hr: 149 },
  { label: "Sem 4", hr: 151 },
  { label: "Sem 5", hr: 147 },
  { label: "Sem 6", hr: 146 },
  { label: "Sem 7", hr: 145 },
];

export const vo2Series = [
  { label: "Jan", vo2: 42.1 },
  { label: "Fev", vo2: 42.8 },
  { label: "Mar", vo2: 43.6 },
  { label: "Abr", vo2: 44.2 },
  { label: "Mai", vo2: 45.0 },
  { label: "Jun", vo2: 45.6 },
];

export const weightSeries = [
  { label: "Jan", kg: 64.2 },
  { label: "Fev", kg: 63.5 },
  { label: "Mar", kg: 62.8 },
  { label: "Abr", kg: 62.1 },
  { label: "Mai", kg: 61.7 },
  { label: "Jun", kg: 61.4 },
];

export const personalRecords = [
  { distance: "5 km", time: "22:18", pace: "4:28/km", date: "12 mai 2026" },
  { distance: "10 km", time: "47:52", pace: "4:47/km", date: "29 mar 2026" },
  { distance: "21 km", time: "1:48:10", pace: "5:08/km", date: "17 ago 2025" },
  { distance: "1 km", time: "3:54", pace: "3:54/km", date: "03 jun 2026" },
];

export const achievements = [
  { id: "a1", title: "100 km no mês", description: "Bateu 100 km de volume mensal", icon: "🏅", earned: true },
  { id: "a2", title: "Sequência de ouro", description: "14 dias seguidos de adesão ao plano", icon: "🔥", earned: true },
  { id: "a3", title: "Sub-23 nos 5 km", description: "Completou os 5 km abaixo de 23 minutos", icon: "⚡", earned: true },
  { id: "a4", title: "Madrugador", description: "10 treinos concluídos antes das 6h", icon: "🌅", earned: false },
  { id: "a5", title: "Maratonista", description: "Complete sua primeira maratona", icon: "🏆", earned: false },
];

// ── Calendário ───────────────────────────────────────────────────────────

export interface CalendarEvent {
  date: string; // ISO yyyy-mm-dd
  type: keyof typeof TYPE_COLORS;
  subtype?: string;
  title: string;
}

const monthPattern: { offset: number; type: keyof typeof TYPE_COLORS; subtype?: string; title: string }[] = [
  { offset: -10, type: "corrida", subtype: "Rodagem leve", title: "Rodagem leve 6 km" },
  { offset: -9, type: "forca", title: "Força — Treino B" },
  { offset: -8, type: "corrida", subtype: "Tempo Run", title: "Tempo Run 7 km" },
  { offset: -7, type: "recuperacao", subtype: "Regenerativo", title: "Trote regenerativo" },
  { offset: -6, type: "corrida", subtype: "Longão", title: "Longão 16 km" },
  { offset: -5, type: "mobilidade", title: "Mobilidade ativa" },
  { offset: -3, type: "corrida", subtype: "Rodagem leve", title: "Rodagem leve 5 km" },
  { offset: -2, type: "forca", title: "Força — Treino A" },
  { offset: -1, type: "corrida", subtype: "Fartlek", title: "Fartlek 8 km" },
  { offset: 1, type: "funcional", title: "Funcional — core" },
  { offset: 2, type: "corrida", subtype: "Longão", title: "Longão 18 km" },
  { offset: 3, type: "mobilidade", title: "Mobilidade e liberação" },
  { offset: 4, type: "corrida", subtype: "Rodagem leve", title: "Rodagem leve 7 km" },
  { offset: 5, type: "forca", title: "Força — Treino A" },
  { offset: 6, type: "corrida", subtype: "Intervalado curto", title: "Intervalado 10 x 400m" },
  { offset: 7, type: "recuperacao", subtype: "Regenerativo", title: "Trote regenerativo" },
  { offset: 8, type: "corrida", subtype: "Tempo Run", title: "Tempo Run 8 km" },
  { offset: 9, type: "funcional", title: "Funcional — mobilidade" },
  { offset: 10, type: "corrida", subtype: "Longão", title: "Longão 20 km" },
  { offset: 14, type: "prova", subtype: "Prova", title: "10 km Night Run BH" },
  { offset: 17, type: "forca", title: "Força — Treino B" },
  { offset: 20, type: "corrida", subtype: "Progressivo", title: "Progressivo 12 km" },
];

export function getMonthEvents(reference = new Date()): CalendarEvent[] {
  return monthPattern.map((p) => {
    const d = new Date(reference);
    d.setDate(d.getDate() + p.offset);
    return { date: d.toISOString().slice(0, 10), type: p.type, subtype: p.subtype, title: p.title };
  });
}



export const calendarLegend = [
  { type: "corrida", label: "Corrida", color: TYPE_COLORS.corrida },
  { type: "forca", label: "Força", color: TYPE_COLORS.forca },
  { type: "funcional", label: "Funcional", color: TYPE_COLORS.funcional },
  { type: "mobilidade", label: "Mobilidade", color: TYPE_COLORS.mobilidade },
  { type: "recuperacao", label: "Recuperação", color: TYPE_COLORS.recuperacao },
  { type: "prova", label: "Provas", color: TYPE_COLORS.prova },
];

// ── Força & funcional ────────────────────────────────────────────────────

export const exerciseCategories = [
  "Força",
  "Hipertrofia",
  "Core",
  "Mobilidade",
  "Pliometria",
  "Prevenção",
  "Glúteos",
  "Panturrilhas",
  "Joelho",
  "Quadril",
  "Tornozelo",
];

export const exerciseLibrary: ExerciseLibraryItem[] = [
  {
    id: "ex-1",
    name: "Agachamento búlgaro",
    category: "Glúteos",
    muscles: ["Glúteo máximo", "Quadríceps", "Isquiotibiais"],
    imageUrl: null,
    description:
      "Exercício unilateral que fortalece glúteos e quadríceps, melhora estabilidade e corrige assimetrias entre as pernas — essencial para corredores.",
    execution:
      "Apoie o peito do pé de trás em um banco, desça controladamente até a coxa da frente ficar paralela ao chão, mantendo o tronco ereto e o joelho alinhado ao pé.",
    mistakes:
      "Deixar o joelho da frente ultrapassar muito a linha da ponta do pé; perder o alinhamento do quadril; descer rápido demais sem controle excêntrico.",
    sets: 4,
    reps: "10-12 por perna",
    rest: "60-90s",
    rpe: 7,
  },
  {
    id: "ex-2",
    name: "Elevação de panturrilha unilateral",
    category: "Panturrilhas",
    muscles: ["Gastrocnêmio", "Sóleo"],
    imageUrl: null,
    description:
      "Fortalece a musculatura da panturrilha, fundamental para a fase de propulsão da passada e prevenção de lesões no tendão de Aquiles.",
    execution:
      "Em pé na borda de um degrau, suba na ponta do pé o máximo possível e desça lentamente abaixo da linha do degrau, controlando a fase excêntrica.",
    mistakes:
      "Realizar o movimento rápido demais sem amplitude completa; apoiar a outra perna para compensar; não controlar a descida.",
    sets: 3,
    reps: "12-15 por perna",
    rest: "45-60s",
    rpe: 6,
  },
  {
    id: "ex-3",
    name: "Prancha com elevação de perna",
    category: "Core",
    muscles: ["Reto abdominal", "Transverso", "Glúteo médio"],
    imageUrl: null,
    description:
      "Melhora a estabilidade lombo-pélvica e a transferência de força entre tronco e membros inferiores durante a corrida.",
    execution:
      "Apoiado nos antebraços e pontas dos pés, mantenha o corpo alinhado e eleve uma perna por vez sem deixar o quadril rotacionar.",
    mistakes:
      "Deixar o quadril cair ou subir demais; prender a respiração; rotacionar o tronco ao elevar a perna.",
    sets: 3,
    reps: "8 elevações por lado",
    rest: "45s",
    rpe: 6,
  },
  {
    id: "ex-4",
    name: "Skipping com elástico (pliometria)",
    category: "Pliometria",
    muscles: ["Flexores de quadril", "Quadríceps", "Panturrilhas"],
    imageUrl: null,
    description:
      "Desenvolve potência e ritmo de passada, melhorando a economia de corrida em ritmos de prova.",
    execution:
      "Com elástico de resistência leve na cintura, realize skipping alto mantendo cadência elevada e postura ereta.",
    mistakes:
      "Inclinar o tronco para trás; perder a cadência; usar resistência excessiva que comprometa a técnica.",
    sets: 4,
    reps: "20s de esforço",
    rest: "40s",
    rpe: 8,
  },
  {
    id: "ex-5",
    name: "Ponte de glúteo unilateral",
    category: "Prevenção",
    muscles: ["Glúteo máximo", "Isquiotibiais", "Core"],
    imageUrl: null,
    description:
      "Ativa e fortalece a cadeia posterior, prevenindo dores lombares e desequilíbrios musculares comuns em corredores.",
    execution:
      "Deitado, apoie um pé no chão e estenda a outra perna; eleve o quadril mantendo-o nivelado, contraindo o glúteo no topo do movimento.",
    mistakes:
      "Deixar o quadril rotacionar para o lado de apoio; hiperestender a lombar; movimento muito rápido.",
    sets: 3,
    reps: "12 por lado",
    rest: "45-60s",
    rpe: 6,
  },
  {
    id: "ex-6",
    name: "Mobilidade de tornozelo em parede",
    category: "Tornozelo",
    muscles: ["Tríceps sural", "Tibial anterior"],
    imageUrl: null,
    description:
      "Melhora a amplitude de dorsiflexão do tornozelo, importante para a aterrissagem e propulsão eficiente da passada.",
    execution:
      "Em pé, de frente para a parede, leve o joelho em direção à parede mantendo o calcanhar no chão, sentindo o alongamento na panturrilha.",
    mistakes:
      "Levantar o calcanhar do chão; forçar além do limite de dor; não manter o alinhamento do joelho com o pé.",
    sets: 3,
    reps: "10 repetições por lado",
    rest: "30s",
    rpe: 4,
  },
];

export const strengthDivisions = ["AB", "ABC", "ABCD", "ABCDE", "Full Body", "Upper/Lower", "Personalizada"];

export const strengthSessionExample = {
  label: "Treino A — Inferiores + Core",
  exercises: [
    { ...exerciseLibrary[0] },
    { ...exerciseLibrary[1] },
    { ...exerciseLibrary[4] },
    { ...exerciseLibrary[2] },
  ],
};

// ── Testes de performance ────────────────────────────────────────────────

export const performanceTests = [
  {
    id: "pt-1",
    type: "Cooper",
    description: "Distância máxima percorrida em 12 minutos",
    date: "18 mai 2026",
    inputLabel: "Distância (m)",
    resultLabel: "VO2máx estimado",
  },
  {
    id: "pt-2",
    type: "Teste de 5 minutos",
    description: "Distância máxima em 5 minutos de corrida contínua",
    date: "—",
    inputLabel: "Distância (m)",
    resultLabel: "VO2máx estimado",
  },
  {
    id: "pt-3",
    type: "Teste de 3 km",
    description: "Tempo para completar 3.000 m em ritmo máximo sustentável",
    date: "02 abr 2026",
    inputLabel: "Tempo (mm:ss)",
    resultLabel: "VO2máx estimado",
  },
  {
    id: "pt-4",
    type: "Teste de 2.400 m",
    description: "Tempo para completar 2.400 m — protocolo de campo clássico",
    date: "—",
    inputLabel: "Tempo (mm:ss)",
    resultLabel: "VO2máx estimado",
  },
  {
    id: "pt-5",
    type: "VAM",
    description: "Velocidade Aeróbica Máxima — base para definição de zonas de treino",
    date: "18 mai 2026",
    inputLabel: "Distância (m) e tempo (s)",
    resultLabel: "VAM (km/h) e pace alvo",
  },
  {
    id: "pt-6",
    type: "RAST",
    description: "Running-based Anaerobic Sprint Test — 6 tiros de 35 m",
    date: "—",
    inputLabel: "Tempos dos 6 tiros (s)",
    resultLabel: "Potência pico, mínima e índice de fadiga",
  },
  {
    id: "pt-7",
    type: "Limiar",
    description: "Estimativa do pace de limiar anaeróbico via teste contínuo de 20–30 min",
    date: "12 mar 2026",
    inputLabel: "Distância (m) e tempo (s)",
    resultLabel: "Pace de limiar (min/km)",
  },
];

// ── Planos & periodização ────────────────────────────────────────────────

export const periodizationPhases = [
  { id: "base", name: "Base", weeks: "1-4", color: TYPE_COLORS.recuperacao, description: "Construção de base aeróbica, técnica de corrida e fortalecimento geral.", current: false },
  { id: "construcao", name: "Construção", weeks: "5-9", color: TYPE_COLORS.corrida, description: "Aumento progressivo de volume e introdução de estímulos de limiar.", current: true },
  { id: "especifico", name: "Específico", weeks: "10-13", color: TYPE_COLORS.forca, description: "Treinos no ritmo de prova, simulações e ajustes finos de pace.", current: false },
  { id: "polimento", name: "Polimento", weeks: "14-15", color: TYPE_COLORS.mobilidade, description: "Redução de volume mantendo intensidade — chegar fresco para o dia da prova.", current: false },
  { id: "competicao", name: "Competição", weeks: "16", color: TYPE_COLORS.prova, description: "Semana da prova: ajustes finais, taper completo e estratégia de prova.", current: false },
  { id: "recuperacao", name: "Recuperação", weeks: "17-18", color: "#94a3b8", description: "Recuperação ativa pós-prova e transição para o próximo ciclo.", current: false },
];

export const macrocycle = {
  name: "Macrociclo — Meia Maratona de BH 2026",
  goal: "21 km em até 1h45min",
  start: "21 abr 2026",
  end: "16 ago 2026",
  totalWeeks: 18,
  currentWeek: 7,
};

export const mesocycles = [
  { id: "meso-1", name: "Mesociclo 1 — Base aeróbica", weeks: "Semanas 1-4", phase: "Base", focus: "Volume progressivo + força geral" },
  { id: "meso-2", name: "Mesociclo 2 — Construção de limiar", weeks: "Semanas 5-9", phase: "Construção", focus: "Tempo runs + longões progressivos" },
  { id: "meso-3", name: "Mesociclo 3 — Ritmo de prova", weeks: "Semanas 10-13", phase: "Específico", focus: "Blocos no pace alvo de 21 km" },
  { id: "meso-4", name: "Mesociclo 4 — Polimento e prova", weeks: "Semanas 14-16", phase: "Polimento/Competição", focus: "Taper + estratégia de prova" },
];

// ── Comunidade ───────────────────────────────────────────────────────────

export const communityFeed = [
  {
    id: "post-1",
    author: "Bruno Lacerda",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
    time: "há 2 h",
    content: "Fechei meu primeiro 10 km abaixo de 50 minutos! Obrigado, equipe Pace Run Pro 🙌",
    workout: "10 km · 49:42 · pace 4:58/km",
    likes: 38,
    comments: 9,
  },
  {
    id: "post-2",
    author: "Marina Sales",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces",
    time: "há 5 h",
    content: "Longão de 16 km na chuva, mas valeu cada gota. Semana 7 do bloco de construção concluída ✅",
    workout: "16 km · 1:24:10 · pace 5:15/km",
    likes: 52,
    comments: 14,
  },
  {
    id: "post-3",
    author: "Equipe Pace Run Pro",
    avatarUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=128&h=128&fit=crop",
    time: "há 1 dia",
    content: "Desafio de junho no ar: complete 100 km até o fim do mês e ganhe a medalha exclusiva 🏅 Quem topa?",
    workout: undefined,
    likes: 121,
    comments: 27,
  },
];

export const monthlyChallenge = {
  title: "Desafio 100 km de Junho",
  progress: 0.62,
  daysLeft: 22,
  participants: 1248,
  reward: "Medalha digital + 30 dias de plano Pro grátis",
};

export const ranking = [
  { position: 1, name: "Felipe Tannous", value: "186 km", trend: "up" },
  { position: 2, name: "Marina Sales", value: "172 km", trend: "up" },
  { position: 3, name: "Camila Andrade", value: "164 km", trend: "same", highlight: true },
  { position: 4, name: "Bruno Lacerda", value: "158 km", trend: "down" },
  { position: 5, name: "Renata Vidal", value: "151 km", trend: "up" },
];

export const clubs = [
  { id: "c1", name: "Clube BH Runners", members: 312, location: "Belo Horizonte, MG" },
  { id: "c2", name: "Trail Sisters Brasil", members: 198, location: "Nacional" },
  { id: "c3", name: "Sub-3h Maratona", members: 87, location: "Nacional" },
];

// ── Treinador — visão geral ───────────────────────────────────────────────

export const coachOverview = {
  name: "Ricardo Pace Júnior",
  credential: "CREF 014626-G/MG",
  currentPlanId: "b2b-free",
  athletesCount: 1,
  prescribedThisWeek: 0,
  pendingCheckIns: 0,
  athletesAtRisk: 0,
  teamLoad: 0,
  alerts: [],
};

export const athleteList: AthleteListItem[] = [
  { id: "ath-1", name: "Camila Andrade", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop&crop=faces", goal: "21 km", level: "Intermediário", status: "ativo", adherence: 0.92, lastCheckIn: "Hoje, 07:40", weeklyLoad: 312, raceDate: "16 ago 2026", vdot: 43 },
];

export const runWorkoutTemplates: RunWorkoutTemplate[] = [
  {
    id: "run-tpl-1",
    name: "Base Aeróbica — Iniciante",
    description: "Três sessões semanais em ritmo fácil para construir a base aeróbica sem risco de sobrecarga.",
    targetLevel: "Iniciante",
    weeklyKm: 25,
    sessionsPerWeek: 3,
    focus: "Volume, Aeróbico",
    createdAt: "2026-04-15",
    sessions: [
      { dayLabel: "Ter", title: "Rodagem leve 6 km", type: "corrida", zone: "E", distanceKm: 6, description: "Ritmo confortável, respira pelo nariz sem dificuldade" },
      { dayLabel: "Qui", title: "Rodagem leve + strides 7 km", type: "corrida", zone: "E", distanceKm: 7, intervals: "4×80m", description: "Finaliza com 4 acelerações curtas de 80m para ativar a passada" },
      { dayLabel: "Sáb", title: "Longão 8 km", type: "corrida", zone: "E", distanceKm: 8, description: "Maior sessão da semana — ritmo leve do início ao fim" },
    ],
  },
  {
    id: "run-tpl-2",
    name: "Bloco de Limiar — Intermediário",
    description: "Quatro sessões com ênfase no limiar de lactato para elevar o ritmo de prova em meias maratonas.",
    targetLevel: "Intermediário",
    weeklyKm: 45,
    sessionsPerWeek: 4,
    focus: "Limiar, Resistência",
    createdAt: "2026-05-03",
    sessions: [
      { dayLabel: "Seg", title: "Rodagem leve 8 km", type: "corrida", zone: "E", distanceKm: 8, description: "Recuperação ativa após o fim de semana" },
      { dayLabel: "Ter", title: "Tempo Run 6 km", type: "corrida", zone: "T", distanceKm: 6, description: "Aquecimento 2km (E) + 4km contínuos em limiar + volta calma" },
      { dayLabel: "Qui", title: "Rodagem com progressão 10 km", type: "corrida", zone: "M", distanceKm: 10, description: "Inicia em E, finaliza os últimos 3km em ritmo de maratona" },
      { dayLabel: "Sáb", title: "Longão 14 km", type: "corrida", zone: "E", distanceKm: 14, description: "Volume longo em zona E, foco em resistência geral" },
    ],
  },
  {
    id: "run-tpl-3",
    name: "VO₂máx & Velocidade — Avançado",
    description: "Cinco sessões de alto volume com intervalados e tempo run para maximizar o VO₂máx e a economia de corrida.",
    targetLevel: "Avançado",
    weeklyKm: 70,
    sessionsPerWeek: 5,
    focus: "VO₂máx, Velocidade, Volume",
    createdAt: "2026-05-18",
    sessions: [
      { dayLabel: "Seg", title: "Rodagem leve 10 km", type: "corrida", zone: "E", distanceKm: 10, description: "Ativação após descanso — ritmo totalmente confortável" },
      { dayLabel: "Ter", title: "Intervalado 8×400m", type: "corrida", zone: "R", distanceKm: 8, intervals: "8×400m", description: "Tiros em pace de repetição com 200m de trote entre cada" },
      { dayLabel: "Qui", title: "Tempo Run 8 km", type: "corrida", zone: "T", distanceKm: 8, description: "Aquecimento 2km + 5km em limiar + 1km de volta calma" },
      { dayLabel: "Sex", title: "Rodagem leve 8 km", type: "corrida", zone: "E", distanceKm: 8, description: "Recuperação ativa entre o Tempo Run e o longão" },
      { dayLabel: "Sáb", title: "Longão 20 km", type: "corrida", zone: "E", distanceKm: 20, description: "Maior sessão da semana — últimos 5km em ritmo M se sentir bem" },
    ],
  },
  {
    id: "run-tpl-4",
    name: "Pré-Prova 10 km",
    description: "Semana específica para quem corre 10km, com intervalados em zona I e progressivo para afiar o ritmo de prova.",
    targetLevel: "Intermediário",
    weeklyKm: 40,
    sessionsPerWeek: 4,
    focus: "Velocidade, VO₂máx",
    createdAt: "2026-06-10",
    isCustom: true,
    sessions: [
      { dayLabel: "Ter", title: "Intervalado 6×800m", type: "corrida", zone: "I", distanceKm: 9, intervals: "6×800m", description: "Tiros em zona I com 90s de trote entre cada; ritmo próximo à prova" },
      { dayLabel: "Qui", title: "Progressivo 8 km", type: "corrida", zone: "M", distanceKm: 8, description: "Inicia suave (E) e progride para ritmo de maratona nos últimos 3km" },
      { dayLabel: "Sex", title: "Pernas leves 5 km", type: "corrida", zone: "E", distanceKm: 5, description: "Recuperação curta — não forçar, só manter o movimento" },
      { dayLabel: "Dom", title: "Longão leve 10 km", type: "corrida", zone: "E", distanceKm: 10, description: "Volume de fim de semana em ritmo completamente confortável" },
    ],
  },
];

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: "tpl-1",
    name: "Full Body para Corredores",
    description: "Treino completo focado em força funcional e prevenção de lesões para corredores de longa distância.",
    division: "Full Body",
    targetLevel: "Intermediário",
    focus: "Força funcional, Prevenção",
    createdAt: "2026-05-10",
    sessions: [
      {
        label: "Full Body",
        exercises: [
          { libraryId: "ex-031", name: "Agachamento Búlgaro com Halteres", sets: 4, reps: "10-12 por perna", rest: "60-90s", rpe: 7 },
          { libraryId: "ex-385", name: "Elevação Pélvica Unilateral Com Barra", sets: 3, reps: "12 por lado", rest: "45-60s", rpe: 6 },
          { libraryId: "ex-325", name: "Elevação de Panturrilha com Uma Perna na Máquina Hack", sets: 3, reps: "12-15 por perna", rest: "45-60s", rpe: 6 },
          { libraryId: "ex-401", name: "Escalador de Montanha", sets: 3, reps: "30s de esforço", rest: "45s", rpe: 6 },
        ],
      },
    ],
  },
  {
    id: "tpl-2",
    name: "Força Base AB",
    description: "Divisão AB para iniciantes que estão começando o treinamento de força complementar à corrida.",
    division: "AB",
    targetLevel: "Iniciante",
    focus: "Força, Estabilidade",
    createdAt: "2026-04-22",
    sessions: [
      {
        label: "Treino A",
        exercises: [
          { libraryId: "ex-344", name: "Elevação de Quadril com Peso Corporal", sets: 3, reps: "15 repetições", rest: "45-60s", rpe: 5 },
          { libraryId: "ex-160", name: "Alongamentos de pés e tornozelos", sets: 3, reps: "10 por lado", rest: "30s", rpe: 4 },
          { libraryId: "ex-401", name: "Escalador de Montanha", sets: 3, reps: "20s de esforço", rest: "45s", rpe: 5 },
        ],
      },
      {
        label: "Treino B",
        exercises: [
          { libraryId: "ex-032", name: "Agachamento Búlgaro com Peso Corporal", sets: 3, reps: "8-10 por perna", rest: "60-90s", rpe: 6 },
          { libraryId: "ex-336", name: "Elevação de Panturrilhas", sets: 3, reps: "15-20 repetições", rest: "45-60s", rpe: 6 },
        ],
      },
    ],
  },
  {
    id: "tpl-3",
    name: "Pliometria Sprint",
    description: "Treino de potência e velocidade para atletas avançados que buscam melhorar o ritmo de prova.",
    division: "Full Body",
    targetLevel: "Avançado",
    focus: "Potência, Velocidade",
    createdAt: "2026-05-28",
    sessions: [
      {
        label: "Full Body",
        exercises: [
          { libraryId: "ex-240", name: "Corrida com Joelhos Altos", sets: 5, reps: "20s de esforço", rest: "40s", rpe: 9 },
          { libraryId: "ex-033", name: "Agachamento búlgaro com salto", sets: 4, reps: "8 por perna", rest: "90s", rpe: 8 },
          { libraryId: "ex-407", name: "Exercício Pliométrico X", sets: 3, reps: "10 repetições", rest: "60s", rpe: 8 },
          { libraryId: "ex-401", name: "Escalador de Montanha", sets: 3, reps: "30s de esforço", rest: "45s", rpe: 7 },
        ],
      },
    ],
  },
  {
    id: "tpl-4",
    name: "Força + Mobilidade ABC",
    description: "Divisão ABC equilibrada que combina força muscular com exercícios de mobilidade para prevenção de lesões.",
    division: "ABC",
    targetLevel: "Intermediário",
    focus: "Força, Mobilidade",
    createdAt: "2026-06-01",
    isCustom: true,
    sessions: [
      {
        label: "Treino A — Inferiores",
        exercises: [
          { libraryId: "ex-031", name: "Agachamento Búlgaro com Halteres", sets: 4, reps: "10-12 por perna", rest: "60-90s", rpe: 7 },
          { libraryId: "ex-385", name: "Elevação Pélvica Unilateral Com Barra", sets: 3, reps: "12 por lado", rest: "45-60s", rpe: 6 },
        ],
      },
      {
        label: "Treino B — Panturrilha + Potência",
        exercises: [
          { libraryId: "ex-323", name: "Elevação de Panturrilha com Barra em Pé", sets: 4, reps: "12-15 repetições", rest: "45-60s", rpe: 7 },
          { libraryId: "ex-244", name: "Corrida de Sprint com Assistência de Faixa Elástica", sets: 4, reps: "20s de esforço", rest: "40s", rpe: 8 },
        ],
      },
      {
        label: "Treino C — Core + Mobilidade",
        exercises: [
          { libraryId: "ex-401", name: "Escalador de Montanha", sets: 3, reps: "30s de esforço", rest: "45s", rpe: 6 },
          { libraryId: "ex-160", name: "Alongamentos de pés e tornozelos", sets: 3, reps: "10 por lado", rest: "30s", rpe: 4 },
        ],
      },
    ],
  },
];

export const reportsList = [
  { id: "rp-1", name: "Relatório mensal — Camila Andrade", period: "Maio 2026", type: "PDF" },
  { id: "rp-2", name: "Relatório de carga da equipe", period: "Semana 7", type: "Excel" },
  { id: "rp-3", name: "Avaliação física — Bruno Lacerda", period: "18 mai 2026", type: "PDF" },
  { id: "rp-4", name: "Exportação de check-ins", period: "Maio 2026", type: "CSV" },
];

export const integrationsList = [
  { id: "garmin", name: "Garmin Connect", description: "Sincronize treinos, FC e GPS automaticamente.", connected: true },
  { id: "coros", name: "Coros", description: "Importe sessões de corrida e métricas de desempenho.", connected: false },
  { id: "polar", name: "Polar Flow", description: "Sincronize dados de frequência cardíaca e treinos.", connected: false },
  { id: "suunto", name: "Suunto", description: "Importe atividades e dados de altimetria.", connected: false },
  { id: "apple", name: "Apple Watch / HealthKit", description: "Sincronize treinos e dados de saúde do iPhone.", connected: true },
  { id: "googlefit", name: "Google Fit", description: "Importe atividades do seu Android.", connected: false },
  { id: "strava", name: "Strava", description: "Compartilhe e importe atividades automaticamente.", connected: true },
];

// ── Landing page ─────────────────────────────────────────────────────────

export const platformStats = {
  coaches: 480,
  athletes: 12_400,
  workoutsPrescribed: 318_000,
  countriesActive: 6,
};

export const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Para treinadores autônomos começando",
    price: 197,
    period: "mês",
    highlight: false,
    badge: null,
    features: [
      "Até 15 atletas",
      "Prescrição de corrida e força",
      "Check-in inteligente",
      "Relatórios em PDF",
      "1 integração (Strava ou Garmin)",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    ctaVariant: "secondary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Para treinadores em crescimento",
    price: 397,
    period: "mês",
    highlight: true,
    badge: "Mais popular",
    features: [
      "Até 50 atletas",
      "Tudo do Starter",
      "Motor de prescrição inteligente com IA",
      "Todas as integrações (Garmin, Polar, Coros, Apple Watch)",
      "Liberação semanal automatizada",
      "Relatórios Excel e CSV",
      "Suporte prioritário por WhatsApp",
    ],
    cta: "Começar grátis",
    ctaVariant: "primary" as const,
  },
  {
    id: "agency",
    name: "Assessoria",
    subtitle: "Para assessorias e equipes de treinadores",
    price: 897,
    period: "mês",
    highlight: false,
    badge: null,
    features: [
      "Atletas ilimitados",
      "Múltiplos treinadores na mesma conta",
      "Painel administrativo completo",
      "White-label (domínio e logo próprios)",
      "API para integrações customizadas",
      "Relatórios PDF premium para atletas",
      "Gerente de conta dedicado",
    ],
    cta: "Falar com consultor",
    ctaVariant: "secondary" as const,
  },
];

export const testimonials = [
  {
    id: "t1",
    name: "Camila Andrade",
    role: "Atleta — Meia Maratona de BH",
    avatar: "CA",
    quote:
      "Batei meu recorde nos 21 km depois de 3 meses na plataforma. O motor de check-in percebeu que eu estava sobrecarregada antes de eu mesma perceber — e o treinador ajustou o plano na hora.",
  },
  {
    id: "t2",
    name: "Fernando Queiroz",
    role: "Treinador — 62 atletas ativos",
    avatar: "FQ",
    quote:
      "Antes eu gastava horas montando planilhas. Hoje prescrevo a semana de 60 atletas em 40 minutos, com as métricas de carga automáticas. A plataforma virou meu principal diferencial competitivo.",
  },
  {
    id: "t3",
    name: "Assessoria Run Tribe",
    role: "8 treinadores · 340 atletas",
    avatar: "RT",
    quote:
      "Migramos de três ferramentas separadas para o Pace Run Pro. Centralizar prescrição, check-in e relatórios em um único lugar reduziu nosso custo operacional em 60%.",
  },
];

export const landingFeatures = [
  {
    persona: "Atleta",
    color: "#38bdf8",
    items: [
      { icon: "📅", title: "Plano liberado semana a semana", description: "Sem ansiedade de ver o ciclo todo — só o que importa agora." },
      { icon: "🤖", title: "Check-in inteligente pós-treino", description: "Responde em 60 segundos e o motor já ajusta a próxima sessão." },
      { icon: "📊", title: "Evolução em gráficos", description: "Pace, FC, VO2máx, peso e carga semanal num só lugar." },
      { icon: "⌚", title: "Sincroniza com seu relógio", description: "Garmin, Polar, Coros, Apple Watch — dados automáticos." },
    ],
  },
  {
    persona: "Treinador",
    color: "#C6F24E",
    items: [
      { icon: "🧠", title: "Prescrição inteligente com IA", description: "Sugestões de pace, volume e RPE baseadas no perfil de cada atleta." },
      { icon: "🚨", title: "Alertas de risco automáticos", description: "Saiba antes do atleta se algo vai sair dos trilhos." },
      { icon: "📄", title: "Relatórios PDF profissionais", description: "Prontos para enviar ao atleta em 1 clique, com design premium." },
      { icon: "🔓", title: "Liberação semanal controlada", description: "O atleta só vê o que você liberar — você mantém o controle." },
    ],
  },
  {
    persona: "Assessoria",
    color: "#84cc16",
    items: [
      { icon: "👥", title: "Multi-treinadores", description: "Vários treinadores numa única conta com visões separadas." },
      { icon: "💰", title: "Gestão financeira integrada", description: "Controle de assinaturas, inadimplência e MRR da sua base." },
      { icon: "🏷️", title: "White-label", description: "Sua logo, seu domínio — seus atletas nunca saem da sua marca." },
      { icon: "📈", title: "Painel administrativo", description: "Visão completa da saúde da sua assessoria em tempo real." },
    ],
  },
];

export const integrationLogos = [
  { id: "garmin", name: "Garmin Connect", color: "#009BDE" },
  { id: "strava", name: "Strava", color: "#FC4C02" },
  { id: "polar", name: "Polar Flow", color: "#D8001A" },
  { id: "coros", name: "Coros", color: "#0066CC" },
  { id: "suunto", name: "Suunto", color: "#0057A8" },
  { id: "apple", name: "Apple Watch", color: "#555555" },
  { id: "wahoo", name: "Wahoo", color: "#E30B17" },
  { id: "google", name: "Google Fit", color: "#4285F4" },
];

// ── Admin ──────────────────────────────────────────────────────────────────

export const adminOverview = {
  mrr: 47850,
  mrrGrowth: 0.122,
  totalCoaches: 48,
  coachesGrowth: 0.08,
  totalAthletes: 1247,
  athletesGrowth: 0.156,
  activeSubscriptions: 1156,
  churnRate: 0.028,
  avgAthletesPerCoach: 25.9,
  revenueByPlan: [
    { plan: "Starter", count: 22, revenue: 4334 },
    { plan: "Pro", count: 19, revenue: 7543 },
    { plan: "Assessoria", count: 7, revenue: 6279 },
  ],
  mrrSeries: [
    { month: "Jan", mrr: 32100 },
    { month: "Fev", mrr: 35800 },
    { month: "Mar", mrr: 38200 },
    { month: "Abr", mrr: 40500 },
    { month: "Mai", mrr: 44300 },
    { month: "Jun", mrr: 47850 },
  ],
};

export const adminCoaches = [
  { id: "c1", name: "Ricardo Pace Júnior", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces", credential: "CREF 014626-G/MG", plan: "Pro", athletes: 38, mrr: 397, status: "ativo", joinedAt: "Jan 2025" },
  { id: "c2", name: "Fernando Queiroz", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces", credential: "CREF 022140-G/SP", plan: "Assessoria", athletes: 62, mrr: 897, status: "ativo", joinedAt: "Fev 2025" },
  { id: "c3", name: "Patrícia Melo", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces", credential: "CREF 031822-G/RJ", plan: "Pro", athletes: 41, mrr: 397, status: "ativo", joinedAt: "Mar 2025" },
  { id: "c4", name: "André Bastos", avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=128&h=128&fit=crop&crop=faces", credential: "CREF 018903-G/MG", plan: "Starter", athletes: 12, mrr: 197, status: "ativo", joinedAt: "Abr 2025" },
  { id: "c5", name: "Juliana Fonseca", avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=128&h=128&fit=crop&crop=faces", credential: "CREF 027541-G/PR", plan: "Pro", athletes: 33, mrr: 397, status: "em risco", joinedAt: "Jan 2025" },
  { id: "c6", name: "Run Tribe Assessoria", avatarUrl: undefined, credential: "CNPJ 42.801.334/0001-99", plan: "Assessoria", athletes: 340, mrr: 897, status: "ativo", joinedAt: "Out 2024" },
];

export const adminRecentSubscriptions = [
  { id: "sub-1", coachName: "Carolina Dias", plan: "Pro", action: "upgrade", from: "Starter", date: "06 jun 2026", mrr: 200 },
  { id: "sub-2", coachName: "Lucas Motta", plan: "Starter", action: "novo", from: null, date: "05 jun 2026", mrr: 197 },
  { id: "sub-3", coachName: "Mariana Castro", plan: "Assessoria", action: "novo", from: null, date: "04 jun 2026", mrr: 897 },
  { id: "sub-4", coachName: "Paulo Drummond", plan: "Starter", action: "cancelamento", from: null, date: "03 jun 2026", mrr: -197 },
  { id: "sub-5", coachName: "Bianca Lemos", plan: "Pro", action: "upgrade", from: "Starter", date: "02 jun 2026", mrr: 200 },
];

// ── Coach gestão (roster + financeiro) ───────────────────────────────────

export const coachRosterStats = {
  totalSlots: 50,
  usedSlots: 1,
  planName: "Pro",
  mrr: 290,
  mrrGrowth: 0,
  churn30d: 0,
  newAthletes30d: 0,
  pendingInvoices: 0,
};

export const athleteRosterList: AthleteRosterItem[] = [
  { id: "ath-1", name: "Camila Andrade", plan: "Pace Run Pro — Atleta", status: "ativo", billingStatus: "em dia", nextBilling: "10 jul 2026", monthlyFee: 290, joinedAt: "Jan 2025" },
];

export const paymentHistory = [
  { id: "pay-1", description: "Pace Run Pro — Atleta", period: "Jun 2026", amount: 290, status: "pago" as const, date: "01 jun 2026", invoice: "INV-2026-061" },
  { id: "pay-2", description: "Pace Run Pro — Atleta", period: "Mai 2026", amount: 290, status: "pago" as const, date: "01 mai 2026", invoice: "INV-2026-051" },
  { id: "pay-3", description: "Pace Run Pro — Atleta", period: "Abr 2026", amount: 290, status: "pago" as const, date: "01 abr 2026", invoice: "INV-2026-041" },
  { id: "pay-4", description: "Pace Run Pro — Atleta", period: "Mar 2026", amount: 290, status: "pago" as const, date: "01 mar 2026", invoice: "INV-2026-031" },
];

// ── Atividades sincronizadas (Strava / Garmin) ────────────────────────────

export interface SyncedActivity {
  id: string;
  source: "strava" | "garmin" | "polar" | "coros" | "apple";
  sourceActivityId: string;
  title: string;
  date: string;
  distanceKm: number;
  durationSec: number;
  avgPaceSecPerKm: number;
  avgHrBpm: number;
  maxHrBpm: number;
  elevationM: number;
  calories: number;
  cadenceAvg?: number;
  sufferScore?: number;
  matchedWorkoutId?: string;
  autoCheckInFilled: boolean;
}

export const syncedActivities: SyncedActivity[] = [
  {
    id: "act-1",
    source: "garmin",
    sourceActivityId: "14829301847",
    title: "Corrida matinal",
    date: "2026-06-07",
    distanceKm: 9.12,
    durationSec: 3240,
    avgPaceSecPerKm: 355,
    avgHrBpm: 162,
    maxHrBpm: 178,
    elevationM: 48,
    calories: 512,
    cadenceAvg: 168,
    matchedWorkoutId: "w-today",
    autoCheckInFilled: true,
  },
  {
    id: "act-2",
    source: "strava",
    sourceActivityId: "11920384710",
    title: "Longão de sábado",
    date: "2026-06-06",
    distanceKm: 18.3,
    durationSec: 6480,
    avgPaceSecPerKm: 354,
    avgHrBpm: 148,
    maxHrBpm: 165,
    elevationM: 112,
    calories: 1124,
    cadenceAvg: 170,
    sufferScore: 82,
    matchedWorkoutId: "w-sat",
    autoCheckInFilled: true,
  },
  {
    id: "act-3",
    source: "garmin",
    sourceActivityId: "14801938274",
    title: "Tempo Run",
    date: "2026-06-04",
    distanceKm: 6.0,
    durationSec: 1800,
    avgPaceSecPerKm: 300,
    avgHrBpm: 172,
    maxHrBpm: 183,
    elevationM: 22,
    calories: 388,
    cadenceAvg: 178,
    matchedWorkoutId: "w-wed",
    autoCheckInFilled: false,
  },
  {
    id: "act-4",
    source: "apple",
    sourceActivityId: "AW-887322901",
    title: "Trote regenerativo",
    date: "2026-06-02",
    distanceKm: 5.1,
    durationSec: 1860,
    avgPaceSecPerKm: 364,
    avgHrBpm: 132,
    maxHrBpm: 145,
    elevationM: 10,
    calories: 278,
    matchedWorkoutId: "w-mon",
    autoCheckInFilled: true,
  },
];

export const sourceLabels: Record<string, string> = {
  strava: "Strava",
  garmin: "Garmin Connect",
  polar: "Polar Flow",
  coros: "Coros",
  apple: "Apple Watch",
};

export const sourceColors: Record<string, string> = {
  strava: "#FC4C02",
  garmin: "#009BDE",
  polar: "#D8001A",
  coros: "#0066CC",
  apple: "#555555",
};

// ── Planos B2C (atleta avulso) ────────────────────────────────────────────

export const b2cPlans = [
  {
    id: "mensal",
    name: "Mensal",
    price: 149.9,
    pricePerMonth: 149.9,
    totalPrice: 149.9,
    months: 1,
    discountPct: 0,
    badge: null,
    highlight: false,
    description: "Comece sem compromisso",
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: 127.9,
    pricePerMonth: 127.9,
    totalPrice: 383.7,
    months: 3,
    discountPct: 15,
    badge: "15% OFF",
    highlight: false,
    description: "Ideal para uma corrida de preparação",
  },
  {
    id: "semestral",
    name: "Semestral",
    price: 112.9,
    pricePerMonth: 112.9,
    totalPrice: 677.4,
    months: 6,
    discountPct: 25,
    badge: "25% OFF",
    highlight: true,
    description: "Ciclo completo para sua prova",
  },
  {
    id: "anual",
    name: "Anual",
    price: 97.9,
    pricePerMonth: 97.9,
    totalPrice: 1174.8,
    months: 12,
    discountPct: 35,
    badge: "Melhor custo",
    highlight: false,
    description: "Evolução consistente o ano todo",
  },
];

export const b2cIncludes = [
  "Planilha de treino de corrida personalizada",
  "Treino de força para corredores",
  "Check-in inteligente semanal",
  "Suporte direto com Treinador Ricardo Pace e equipe",
  "Acesso completo ao app (GPS, gráficos, evolução)",
  "Testes de performance com cálculo automático (Cooper, VAM, RAST)",
  "Periodização completa até sua prova",
  "Sincronização Garmin, Strava, Apple Watch",
];

// ── Planos B2B (assessorias) ──────────────────────────────────────────────

export const b2bPlans = [
  {
    id: "b2b-free",
    name: "Grátis",
    price: 0,
    maxAthletes: 1,
    maxCoaches: 1,
    highlight: false,
    badge: "Grátis para sempre",
    features: [
      "1 atleta",
      "1 treinador",
      "Prescrição de treino básica",
      "Check-in semanal",
      "Acesso ao app do atleta",
      "Suporte por e-mail",
    ],
  },
  {
    id: "b2b-starter",
    name: "Starter",
    price: 97,
    maxAthletes: 20,
    maxCoaches: 1,
    highlight: false,
    badge: null,
    features: [
      "Até 20 atletas",
      "1 treinador",
      "Prescrição de corrida com VDOT",
      "Periodização automática",
      "Calendário do atleta",
      "Check-in semanal",
      "Relatórios de performance",
      "Suporte por e-mail",
    ],
  },
  {
    id: "b2b-pro",
    name: "Pro",
    price: 197,
    maxAthletes: 80,
    maxCoaches: 3,
    highlight: true,
    badge: "Mais popular",
    features: [
      "Até 80 atletas",
      "Até 3 treinadores",
      "Tudo do Starter",
      "Treino de força para corredores",
      "Check-ins com IA e alertas automáticos",
      "Central de alertas inteligentes",
      "Relatórios PDF profissionais",
      "Painel financeiro do roster",
      "Suporte WhatsApp",
    ],
  },
  {
    id: "b2b-assessoria",
    name: "Assessoria",
    price: 397,
    maxAthletes: 250,
    maxCoaches: 10,
    highlight: false,
    badge: null,
    features: [
      "Até 250 atletas",
      "Até 10 treinadores",
      "Tudo do Pro",
      "CRM de retenção",
      "Painel financeiro multi-treinador",
      "Link de convite personalizado",
      "API básica para integrações",
      "Gerente de conta dedicado",
      "Suporte prioritário",
    ],
  },
  {
    id: "b2b-unlimited",
    name: "White Label",
    price: 997,
    maxAthletes: null,
    maxCoaches: null,
    highlight: false,
    badge: "Sob consulta",
    features: [
      "Atletas ilimitados",
      "Treinadores ilimitados",
      "Tudo do Assessoria",
      "Marca própria (logo e domínio)",
      "App com a identidade da sua assessoria",
      "API completa",
      "SLA 99,9% com suporte 24 h",
      "Onboarding dedicado",
      "Contrato anual com desconto",
    ],
  },
];

// Retorna o plano B2B recomendado para uma assessoria/treinador com base
// no número de atletas informado, escolhendo o menor plano que comporta
// esse total (ou o plano Ilimitado, se nenhum limite for suficiente).
export function getRecommendedB2BPlan(athleteCount: number) {
  return (
    b2bPlans.find((p) => p.maxAthletes === null || athleteCount <= p.maxAthletes) ??
    b2bPlans[b2bPlans.length - 1]
  );
}

// ── Super Admin ──────────────────────────────────────────────────────────

export const superAdminStats = {
  totalMrr: 0,
  mrrGrowth: 0,
  b2cAthletes: 0,
  b2cMrr: 0,
  b2bAssessorias: 0,
  b2bMrr: 0,
  pendingApproval: 0,
  churned30d: 0,
  newSignups30d: 0,
  totalRevenue12m: 0,
  mrrSeries: [] as { month: string; b2c: number; b2b: number }[],
};

export interface AssessoriaItem {
  id: string;
  name: string;
  city: string;
  plan: string;
  coaches: number;
  athletes: number;
  mrr: number;
  status: "ativo" | "pendente" | "suspenso";
  approvedAt: string;
  contact: string;
  healthScore: number;      // 0–100
  churnRisk: "baixo" | "medio" | "alto";
  lastLoginDays: number;    // dias desde último login do treinador principal
  prescribedLast7d: number; // treinos prescritos nos últimos 7 dias
  activeAthletes: number;   // atletas com check-in na última semana
}

export const assessoriaList: AssessoriaItem[] = [];

export const b2cAthletesList: {
  id: string; name: string; avatarUrl: string; city: string; plan: string;
  startDate: string; coachAssigned: string; status: "ativo" | "pendente"; mrr: number;
}[] = [];

export const pendingApprovals = assessoriaList.filter((a) => a.status === "pendente");

export type PendenciaType = "white-label-setup" | "cobranca-falha" | "pix-expirado" | "fraude";

export interface PendenciaItem {
  id: string;
  type: PendenciaType;
  title: string;
  description: string;
  assessoria: string;
  contact: string;
  value?: number;
  createdAt: string;
}

export const pendencias: PendenciaItem[] = [];

// ── Smart Alerts ─────────────────────────────────────────────────────────

export type AlertSeverity = "critico" | "atencao" | "info";
export type AlertCategory = "ausencia" | "overtraining" | "dor" | "fadiga" | "adesao" | "volume" | "fc" | "desempenho";

export interface SmartAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
  daysAgo: number;
  read: boolean;
}

export const smartAlerts: SmartAlert[] = [];

// ── Tênis tracker ─────────────────────────────────────────────────────────────
export interface Shoe {
  id: string;
  name: string;
  brand: string;
  model: string;
  imageUrl?: string;   // base64 or URL
  kmAccumulated: number;
  maxKm: number;
  dateAdded: string;   // ISO date
  color: string;       // for the accent dot
  active: boolean;
  imageEmoji: string;  // shoe emoji fallback
}

export const shoesList: Shoe[] = [
  {
    id: "sh-1",
    name: "Corrida principal",
    brand: "Asics",
    model: "Gel-Nimbus 26",
    kmAccumulated: 487,
    maxKm: 800,
    dateAdded: "2025-11-20",
    color: "#38bdf8",
    active: true,
    imageEmoji: "👟",
  },
  {
    id: "sh-2",
    name: "Treinos leves",
    brand: "Nike",
    model: "Pegasus 41",
    kmAccumulated: 312,
    maxKm: 700,
    dateAdded: "2026-01-10",
    color: "#C6F24E",
    active: true,
    imageEmoji: "👟",
  },
  {
    id: "sh-3",
    name: "Treinos de pista",
    brand: "Mizuno",
    model: "Wave Rider 27",
    kmAccumulated: 156,
    maxKm: 700,
    dateAdded: "2026-03-05",
    color: "#84cc16",
    active: true,
    imageEmoji: "👟",
  },
  {
    id: "sh-4",
    name: "Aposentado",
    brand: "New Balance",
    model: "1080 v13",
    kmAccumulated: 823,
    maxKm: 800,
    dateAdded: "2025-04-01",
    color: "#94a3b8",
    active: false,
    imageEmoji: "👟",
  },
];

// ── Timeline ───────────────────────────────────────────────────────────────────
export type TimelineEventType = "treino" | "checkin" | "teste" | "prova" | "conquista" | "avaliacao" | "lesao" | "tenis";

export interface TimelineEvent {
  id: string;
  date: string;          // ISO date
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  detail?: string;
  badge?: string;
  highlight?: boolean;   // PR or special event
}

export const timelineEvents: TimelineEvent[] = [
  { id: "tl-1", date: "2026-06-07", type: "treino", title: "Intervalado 8×400m", subtitle: "9,2 km · Pace 4:38/km · RPE 7", badge: "Corrida" },
  { id: "tl-2", date: "2026-06-07", type: "checkin", title: "Check-in pós-treino", subtitle: "RPE 7 · Sono 7 · Fadiga 4 · Humor 8" },
  { id: "tl-3", date: "2026-06-05", type: "treino", title: "Longão progressivo 18 km", subtitle: "18 km · Pace 5:20/km · RPE 6", badge: "Corrida" },
  { id: "tl-4", date: "2026-06-03", type: "treino", title: "Treino de força — Inferiores", subtitle: "Agachamento búlgaro · Elevação panturrilha · Prancha", badge: "Força" },
  { id: "tl-5", date: "2026-06-01", type: "treino", title: "Tempo Run 8 km", subtitle: "8 km · Pace 4:52/km · RPE 7", badge: "Corrida" },
  { id: "tl-6", date: "2026-05-25", type: "conquista", title: "PR pessoal — Meia maratona!", subtitle: "1:58:42 · Meia Maratona de BH", detail: "Melhorou 4min12s do PR anterior de 2:02:54.", badge: "PR", highlight: true },
  { id: "tl-7", date: "2026-05-25", type: "prova", title: "Meia Maratona de BH", subtitle: "1:58:42 · Pace médio 5:37/km", badge: "21 km", highlight: true },
  { id: "tl-8", date: "2026-05-18", type: "teste", title: "Teste de Cooper", subtitle: "2.600 m · VO2máx ≈ 46,8 ml/kg/min", badge: "Teste" },
  { id: "tl-9", date: "2026-05-18", type: "teste", title: "Teste VAM — 2.000 m", subtitle: "8:00 · VAM ≈ 15,0 km/h · Pace 4:00/km", badge: "Teste" },
  { id: "tl-10", date: "2026-05-10", type: "tenis", title: "Novo tênis adicionado", subtitle: "Mizuno Wave Rider 27 — Treinos de pista", badge: "Tênis" },
  { id: "tl-11", date: "2026-04-20", type: "treino", title: "Semana pico — 47 km", subtitle: "Volume máximo do ciclo atingido", badge: "Marco", highlight: true },
  { id: "tl-12", date: "2026-03-12", type: "teste", title: "Teste de limiar — 25 min", subtitle: "Pace de limiar ≈ 5:00/km", badge: "Teste" },
  { id: "tl-13", date: "2026-02-02", type: "avaliacao", title: "Avaliação física completa", subtitle: "Peso: 61,4 kg · Gordura: 19,4% · IMC: 22,0", badge: "Avaliação" },
  { id: "tl-14", date: "2026-01-10", type: "tenis", title: "Novo tênis adicionado", subtitle: "Nike Pegasus 41 — Treinos leves", badge: "Tênis" },
  { id: "tl-15", date: "2025-12-01", type: "prova", title: "Corrida de São Silvestre", subtitle: "15 km · 1:22:05 · Pace 5:28/km", badge: "15 km" },
  { id: "tl-16", date: "2025-11-20", type: "tenis", title: "Novo tênis adicionado", subtitle: "Asics Gel-Nimbus 26 — Corrida principal", badge: "Tênis" },
  { id: "tl-17", date: "2025-10-05", type: "conquista", title: "100 km acumulados no mês!", subtitle: "Melhor volume mensal da carreira", badge: "Marco", highlight: true },
];

// ── Análise Semanal ────────────────────────────────────────────────────────
export interface WeeklyMetric {
  label: string;
  value: number;
  prev: number;
  unit: string;
  delta: number;
}

export interface WeeklyAthleteAnalysis {
  athleteId: string;
  athleteName: string;
  weekLabel: string;
  metrics: WeeklyMetric[];
  highlights: string[];
  riskLevel: "low" | "medium" | "high";
  adherence: number;
  recommendation: string;
}

export const weeklyAnalyses: WeeklyAthleteAnalysis[] = [];

// ── CRM ────────────────────────────────────────────────────────────────────
export type LeadStage = "novo" | "contato" | "proposta" | "negociacao" | "ganho" | "perdido";

export interface CrmLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: "instagram" | "indicacao" | "site" | "evento" | "whatsapp";
  stage: LeadStage;
  value: number;
  notes: string;
  createdAt: string;
  lastContact: string;
  avatar: string;
}

export const crmLeads: CrmLead[] = [
  {
    id: "lead-1",
    name: "Gabriela Moura",
    email: "gabriela.moura@email.com",
    phone: "(31) 99812-3456",
    source: "instagram",
    stage: "novo",
    value: 290,
    notes: "Seguiu o perfil após o post do longão de domingo. Curtiu 3 posts.",
    createdAt: "2026-06-07",
    lastContact: "2026-06-07",
    avatar: "GM",
  },
  {
    id: "lead-2",
    name: "Henrique Azevedo",
    email: "henrique.azevedo@gmail.com",
    phone: "(11) 98724-8812",
    source: "indicacao",
    stage: "novo",
    value: 290,
    notes: "Indicado pela Camila Andrade. Quer começar em julho.",
    createdAt: "2026-06-06",
    lastContact: "2026-06-06",
    avatar: "HA",
  },
  {
    id: "lead-3",
    name: "Larissa Drummond",
    email: "larissa.d@empresa.com",
    phone: "(31) 99501-7723",
    source: "whatsapp",
    stage: "contato",
    value: 350,
    notes: "Mandou mensagem perguntando sobre pacote elite. Respondida ontem.",
    createdAt: "2026-06-02",
    lastContact: "2026-06-08",
    avatar: "LD",
  },
  {
    id: "lead-4",
    name: "Roberto Cavalcante",
    email: "roberto.c@outlook.com",
    phone: "(21) 98333-0041",
    source: "site",
    stage: "contato",
    value: 290,
    notes: "Preencheu o formulário do site. Ligação agendada para sexta.",
    createdAt: "2026-06-03",
    lastContact: "2026-06-07",
    avatar: "RC",
  },
  {
    id: "lead-5",
    name: "Tatiane Borges",
    email: "tati.borges@yahoo.com",
    phone: "(41) 99200-6654",
    source: "instagram",
    stage: "contato",
    value: 200,
    notes: "Mandou DM depois do Reels sobre periodização. Iniciante, orçamento limitado.",
    createdAt: "2026-05-28",
    lastContact: "2026-06-05",
    avatar: "TB",
  },
  {
    id: "lead-6",
    name: "Eduardo Pinheiro",
    email: "eduardo.pinheiro@uol.com.br",
    phone: "(85) 99710-2288",
    source: "evento",
    stage: "proposta",
    value: 350,
    notes: "Conhecido na Night Run BH. Quer plano para maratona de outubro.",
    createdAt: "2026-05-25",
    lastContact: "2026-06-06",
    avatar: "EP",
  },
  {
    id: "lead-7",
    name: "Aline Figueiredo",
    email: "aline.figueiredo@gmail.com",
    phone: "(31) 98821-4490",
    source: "indicacao",
    stage: "proposta",
    value: 290,
    notes: "Indicada pelo Felipe Tannous. Recebeu proposta por e-mail, aguardando retorno.",
    createdAt: "2026-05-20",
    lastContact: "2026-06-04",
    avatar: "AF",
  },
  {
    id: "lead-8",
    name: "Vinicius Leal",
    email: "vinicius.leal@hotmail.com",
    phone: "(11) 97766-3312",
    source: "whatsapp",
    stage: "negociacao",
    value: 150,
    notes: "Quer desconto no plano trimestral. Em negociação sobre valor.",
    createdAt: "2026-05-15",
    lastContact: "2026-06-08",
    avatar: "VL",
  },
  {
    id: "lead-9",
    name: "Camile Rezende",
    email: "camile.r@icloud.com",
    phone: "(31) 99034-5671",
    source: "site",
    stage: "ganho",
    value: 290,
    notes: "Fechou plano semestral! Onboarding marcado para segunda-feira.",
    createdAt: "2026-05-10",
    lastContact: "2026-06-07",
    avatar: "CR",
  },
  {
    id: "lead-10",
    name: "Marcos Quintão",
    email: "marcos.quintao@gmail.com",
    phone: "(51) 98882-1103",
    source: "evento",
    stage: "ganho",
    value: 350,
    notes: "Fechou plano elite após a palestra do evento. Primeiro atleta de Porto Alegre.",
    createdAt: "2026-05-05",
    lastContact: "2026-06-01",
    avatar: "MQ",
  },
  {
    id: "lead-11",
    name: "Priscila Machado",
    email: "pri.machado@empresa.com",
    phone: "(31) 99988-7712",
    source: "instagram",
    stage: "ganho",
    value: 290,
    notes: "Convertida após 2 semanas de nutrição de conteúdo. Começou em junho.",
    createdAt: "2026-04-28",
    lastContact: "2026-06-02",
    avatar: "PM",
  },
  {
    id: "lead-12",
    name: "Jonas Carvalho",
    email: "jonas.carvalho@gmail.com",
    phone: "(48) 97734-8821",
    source: "indicacao",
    stage: "perdido",
    value: 290,
    notes: "Optou por treinador local mais barato. Manter contato para futuro.",
    createdAt: "2026-04-20",
    lastContact: "2026-05-28",
    avatar: "JC",
  },
];

// ── Activity posts (feed with photos) ────────────────────────────────────
export interface ActivityMetrics {
  distance: number;
  pace: string;
  duration: string;
  elevation?: number;
  calories?: number;
  avgHr?: number;
  splits?: { km: number; pace: string; elev?: number }[];
}

export interface ActivityPost {
  id: string;
  athleteName: string;
  athleteAvatar: string;
  avatarColor: string;
  timeAgo: string;
  caption: string;
  photoGradient: string;
  metrics: ActivityMetrics;
  likes: number;
  comments: { author: string; text: string; timeAgo: string }[];
}

// ── Monthly challenges ────────────────────────────────────────────────────
export type ChallengeType = "distance" | "sessions" | "elevation" | "speed";

export interface MonthlyChallenge {
  id: string;
  month: string;
  emoji: string;
  title: string;
  theme: string;
  description: string;
  type: ChallengeType;
  target: number;
  unit: string;
  currentProgress: number;
  participants: number;
  prize: string;
  endsInDays: number;
  leaderboard: { rank: number; name: string; avatar: string; value: number; isYou?: boolean }[];
  color: string;
}

export const activityFeed: ActivityPost[] = [
  {
    id: "ap-1",
    athleteName: "Camila Andrade",
    athleteAvatar: "CA",
    avatarColor: "bg-purple-700",
    timeAgo: "há 1 h",
    caption: "Longão de domingo feito! 18 km progressivos com os últimos 6 no ritmo de meia. Semana 7 do bloco de construção concluída. Quem mais tá no bloco? 🏃‍♀️",
    photoGradient: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #0f0824 100%)",
    metrics: {
      distance: 18,
      pace: "5:18",
      duration: "1h 35min",
      elevation: 112,
      calories: 820,
      avgHr: 148,
      splits: [
        { km: 1, pace: "5:42", elev: 8 },
        { km: 2, pace: "5:35", elev: 12 },
        { km: 3, pace: "5:28", elev: 15 },
        { km: 4, pace: "5:20", elev: 10 },
        { km: 5, pace: "5:12", elev: 18 },
        { km: 6, pace: "4:58", elev: 22 },
      ],
    },
    likes: 42,
    comments: [
      { author: "Bruno Lacerda", text: "Que ritmo incrível nos últimos kms! 🔥", timeAgo: "há 45 min" },
      { author: "Marina Sales", text: "Arrasou! Semana 7 também aqui ✅", timeAgo: "há 30 min" },
    ],
  },
  {
    id: "ap-2",
    athleteName: "Bruno Lacerda",
    athleteAvatar: "BL",
    avatarColor: "bg-blue-700",
    timeAgo: "há 3 h",
    caption: "5k fácil de manhã cedo pra começar a semana do jeito certo. Zona 2 pura, respiração pelo nariz o tempo todo. Paz total 🌅",
    photoGradient: "linear-gradient(160deg, #0a1628 0%, #1e3a5f 60%, #0d2137 100%)",
    metrics: {
      distance: 5,
      pace: "6:12",
      duration: "31min 2s",
      elevation: 18,
      calories: 295,
      avgHr: 132,
    },
    likes: 18,
    comments: [
      { author: "Renata Vidal", text: "Treino regenerativo perfeito! 👏", timeAgo: "há 2 h" },
    ],
  },
  {
    id: "ap-3",
    athleteName: "Marina Sales",
    athleteAvatar: "MS",
    avatarColor: "bg-emerald-700",
    timeAgo: "há 5 h",
    caption: "Tiro de 10 x 400m na pista. Último tiro foi o mais rápido do dia — é isso que o treinador chama de progressão! 💪 Obrigada equipe Pace Run Pro",
    photoGradient: "linear-gradient(150deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    metrics: {
      distance: 9.2,
      pace: "4:38",
      duration: "42min 40s",
      elevation: 24,
      calories: 512,
      avgHr: 162,
    },
    likes: 35,
    comments: [
      { author: "Felipe Tannous", text: "Progressão nos tiros é sinal de forma física chegando! 🚀", timeAgo: "há 4 h" },
      { author: "Camila Andrade", text: "Isso aí! A pista não mente 🏃‍♀️", timeAgo: "há 3 h" },
    ],
  },
  {
    id: "ap-4",
    athleteName: "Felipe Tannous",
    athleteAvatar: "FT",
    avatarColor: "bg-amber-700",
    timeAgo: "há 8 h",
    caption: "Longão de 22 km — semana pico do ciclo. FC baixa, pace no controle. Agora é hidratação e reposição. Sábado foi bom! 💧",
    photoGradient: "linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)",
    metrics: {
      distance: 22,
      pace: "5:08",
      duration: "1h 52min 56s",
      elevation: 148,
      calories: 1240,
      avgHr: 152,
      splits: [
        { km: 1, pace: "5:28", elev: 10 },
        { km: 2, pace: "5:22", elev: 14 },
        { km: 3, pace: "5:18", elev: 20 },
        { km: 4, pace: "5:14", elev: 8 },
      ],
    },
    likes: 58,
    comments: [
      { author: "Marina Sales", text: "22 km com essa consistência... respeito demais 🙌", timeAgo: "há 7 h" },
    ],
  },
  {
    id: "ap-5",
    athleteName: "Renata Vidal",
    athleteAvatar: "RV",
    avatarColor: "bg-rose-700",
    timeAgo: "há 1 dia",
    caption: "Primeiro 5k abaixo de 30 minutos da minha vida! Não acreditei quando vi o relógio. Três meses de treino e isso aqui é só o começo 🥹",
    photoGradient: "linear-gradient(160deg, #1a0020 0%, #3d0060 50%, #150010 100%)",
    metrics: {
      distance: 5,
      pace: "5:52",
      duration: "29min 22s",
      elevation: 12,
      calories: 285,
      avgHr: 168,
    },
    likes: 87,
    comments: [
      { author: "Camila Andrade", text: "VAAAI! Que conquista! Orgulho 🎉", timeAgo: "há 23 h" },
      { author: "Bruno Lacerda", text: "Primeira de muitas barreiras quebradas! 💥", timeAgo: "há 22 h" },
    ],
  },
  {
    id: "ap-6",
    athleteName: "Diego Martins",
    athleteAvatar: "DM",
    avatarColor: "bg-cyan-700",
    timeAgo: "há 1 dia",
    caption: "Voltei! Depois de 2 semanas parado com tendinite, hoje fiz um trote leve de 6 km. Corpo agradeceu. Gratidão pelo processo 🙏",
    photoGradient: "linear-gradient(140deg, #001a1a 0%, #003333 60%, #001212 100%)",
    metrics: {
      distance: 6,
      pace: "6:48",
      duration: "40min 48s",
      elevation: 0,
      calories: 312,
      avgHr: 128,
    },
    likes: 24,
    comments: [
      { author: "Renata Vidal", text: "Bem-vindo de volta! Cuida-se 💙", timeAgo: "há 20 h" },
    ],
  },
  {
    id: "ap-7",
    athleteName: "Ana Beatriz Lima",
    athleteAvatar: "AB",
    avatarColor: "bg-fuchsia-700",
    timeAgo: "há 2 dias",
    caption: "Tempo Run de 8 km no ritmo de prova. Difícil, custou, mas fechei. A meia de agosto tá chegando e o preparo tá no nível certo 🎯",
    photoGradient: "linear-gradient(135deg, #0a0020 0%, #200050 40%, #100030 100%)",
    metrics: {
      distance: 8,
      pace: "5:02",
      duration: "40min 16s",
      elevation: 35,
      calories: 468,
      avgHr: 172,
    },
    likes: 31,
    comments: [
      { author: "Felipe Tannous", text: "Pace de prova no treino longo — preparada! 👊", timeAgo: "há 2 dias" },
      { author: "Marina Sales", text: "Meia de agosto vai ser incrível! 🏅", timeAgo: "há 2 dias" },
    ],
  },
  {
    id: "ap-8",
    athleteName: "Thiago Ferraz",
    athleteAvatar: "TF",
    avatarColor: "bg-orange-700",
    timeAgo: "há 2 dias",
    caption: "Pós-prova 10 km Night Run BH. 48:32, novo PR pessoal! Noite inesquecível, cidade iluminada e adrenalina total. Que treino me preparou pra isso 🌃",
    photoGradient: "linear-gradient(150deg, #1a0800 0%, #3d1500 45%, #2a0e00 100%)",
    metrics: {
      distance: 10,
      pace: "4:51",
      duration: "48min 32s",
      elevation: 58,
      calories: 620,
      avgHr: 178,
    },
    likes: 112,
    comments: [
      { author: "Camila Andrade", text: "PR na prova noturna!! Surreal demais 🎊", timeAgo: "há 2 dias" },
      { author: "Diego Martins", text: "Que corrida histórica, cara! Parabéns 🏆", timeAgo: "há 2 dias" },
    ],
  },
];

export const monthlyChallenges: MonthlyChallenge[] = [
  {
    id: "ch-1",
    month: "Junho 2026",
    emoji: "🏃",
    title: "Desafio Resistência",
    theme: "100 km em junho",
    description: "Complete 100 km de corrida ao longo do mês de junho e mostre sua resistência.",
    type: "distance",
    target: 100,
    unit: "km",
    currentProgress: 62,
    participants: 1248,
    prize: "Medalha digital exclusiva + 1 mês grátis",
    endsInDays: 21,
    leaderboard: [
      { rank: 1, name: "Felipe Tannous", avatar: "FT", value: 98 },
      { rank: 2, name: "Marina Sales", avatar: "MS", value: 91 },
      { rank: 3, name: "Ana Beatriz Lima", avatar: "AB", value: 78 },
      { rank: 4, name: "Camila Andrade", avatar: "CA", value: 62, isYou: true },
      { rank: 5, name: "Bruno Lacerda", avatar: "BL", value: 55 },
    ],
    color: "purple",
  },
  {
    id: "ch-2",
    month: "Junho 2026",
    emoji: "🏔",
    title: "Desafio Altitude",
    theme: "2000m de ganho em junho",
    description: "Acumule 2000m de ganho de elevação nos seus treinos de corrida durante junho.",
    type: "elevation",
    target: 2000,
    unit: "m ganho",
    currentProgress: 1240,
    participants: 387,
    prize: "Kit técnico virtual + badge especial",
    endsInDays: 21,
    leaderboard: [
      { rank: 1, name: "Felipe Tannous", avatar: "FT", value: 1920 },
      { rank: 2, name: "Thiago Ferraz", avatar: "TF", value: 1650 },
      { rank: 3, name: "Ana Beatriz Lima", avatar: "AB", value: 1410 },
      { rank: 4, name: "Camila Andrade", avatar: "CA", value: 1240, isYou: true },
      { rank: 5, name: "Diego Martins", avatar: "DM", value: 980 },
    ],
    color: "emerald",
  },
  {
    id: "ch-3",
    month: "Junho 2026",
    emoji: "⚡",
    title: "Desafio Velocidade",
    theme: "12 tiros em junho",
    description: "Complete 12 sessões de treino de velocidade (tiros, intervalados ou fartlek) em junho.",
    type: "sessions",
    target: 12,
    unit: "tiros",
    currentProgress: 7,
    participants: 612,
    prize: "Badge de elite + destaque no ranking",
    endsInDays: 21,
    leaderboard: [
      { rank: 1, name: "Marina Sales", avatar: "MS", value: 11 },
      { rank: 2, name: "Felipe Tannous", avatar: "FT", value: 10 },
      { rank: 3, name: "Renata Vidal", avatar: "RV", value: 9 },
      { rank: 4, name: "Camila Andrade", avatar: "CA", value: 7, isYou: true },
      { rank: 5, name: "Bruno Lacerda", avatar: "BL", value: 6 },
    ],
    color: "amber",
  },
];

// ── White-label ────────────────────────────────────────────────────────────
export interface WhiteLabelConfig {
  assessoriaName: string;
  logoEmoji: string;
  primaryColor: string;
  accentColor: string;
  customDomain: string;
  planName: string;
  welcomeMessage: string;
  featuresEnabled: string[];
  athleteCount: number;
  coachCount: number;
}

export const whiteLabelConfig: WhiteLabelConfig = {
  assessoriaName: "Assessoria Pace Run",
  logoEmoji: "⚡",
  primaryColor: "#C6F24E",
  accentColor: "#06b6d4",
  customDomain: "app.pacerunpro.com.br",
  planName: "Business",
  welcomeMessage: "Bem-vindo à Assessoria Pace Run! Aqui você encontra tudo para evoluir na corrida.",
  featuresEnabled: ["Treinos", "Análise semanal", "IA Treinadora", "Tênis tracker", "Timeline"],
  athleteCount: 47,
  coachCount: 3,
};
