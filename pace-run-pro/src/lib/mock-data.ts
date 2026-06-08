import type {
  AthleteListItem,
  CheckInEntry,
  ExerciseLibraryItem,
  WorkoutDetail,
  WorkoutSummary,
} from "./types";

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
  title: string;
}

const monthPattern: { offset: number; type: keyof typeof TYPE_COLORS; title: string }[] = [
  { offset: -10, type: "corrida", title: "Rodagem leve 6 km" },
  { offset: -9, type: "forca", title: "Força — Treino B" },
  { offset: -8, type: "corrida", title: "Tempo Run 7 km" },
  { offset: -7, type: "recuperacao", title: "Trote regenerativo" },
  { offset: -6, type: "corrida", title: "Longão 16 km" },
  { offset: -5, type: "mobilidade", title: "Mobilidade ativa" },
  { offset: -3, type: "corrida", title: "Rodagem leve 5 km" },
  { offset: -2, type: "forca", title: "Força — Treino A" },
  { offset: -1, type: "corrida", title: "Fartlek 8 km" },
  { offset: 1, type: "funcional", title: "Funcional — core" },
  { offset: 2, type: "corrida", title: "Longão 18 km" },
  { offset: 3, type: "mobilidade", title: "Mobilidade e liberação" },
  { offset: 4, type: "corrida", title: "Rodagem leve 7 km" },
  { offset: 5, type: "forca", title: "Força — Treino A" },
  { offset: 6, type: "corrida", title: "Intervalado 10 x 400m" },
  { offset: 7, type: "recuperacao", title: "Trote regenerativo" },
  { offset: 8, type: "corrida", title: "Tempo Run 8 km" },
  { offset: 9, type: "funcional", title: "Funcional — mobilidade" },
  { offset: 10, type: "corrida", title: "Longão 20 km" },
  { offset: 14, type: "prova", title: "10 km Night Run BH" },
  { offset: 17, type: "forca", title: "Força — Treino B" },
  { offset: 20, type: "corrida", title: "Progressivo 12 km" },
];

export function getMonthEvents(reference = new Date()): CalendarEvent[] {
  return monthPattern.map((p) => {
    const d = new Date(reference);
    d.setDate(d.getDate() + p.offset);
    return { date: d.toISOString().slice(0, 10), type: p.type, title: p.title };
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
    imageUrl:
      "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=800&h=600&fit=crop",
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
    imageUrl:
      "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&h=600&fit=crop",
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
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
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
    imageUrl:
      "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&h=600&fit=crop",
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
    imageUrl:
      "https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=800&h=600&fit=crop",
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
    imageUrl:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&h=600&fit=crop",
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
  athletesCount: 38,
  prescribedThisWeek: 142,
  pendingCheckIns: 9,
  athletesAtRisk: 3,
  teamLoad: 0.78,
  alerts: [
    { id: "al-1", severity: "danger" as const, text: "Bruno Lacerda relatou dor 8/10 — treino intenso bloqueado automaticamente." },
    { id: "al-2", severity: "warning" as const, text: "Marina Sales com fadiga alta por 3 dias — volume da semana reduzido em 20%." },
    { id: "al-3", severity: "info" as const, text: "5 atletas com check-in pendente há mais de 24h." },
  ],
};

export const athleteList: AthleteListItem[] = [
  { id: "ath-1", name: "Camila Andrade", goal: "21 km", level: "Intermediário", status: "ativo", adherence: 0.92, lastCheckIn: "Hoje, 07:40", weeklyLoad: 312, raceDate: "16 ago 2026" },
  { id: "ath-2", name: "Bruno Lacerda", goal: "10 km", level: "Iniciante", status: "risco", adherence: 0.61, lastCheckIn: "Hoje, 06:15", weeklyLoad: 198, raceDate: "20 set 2026" },
  { id: "ath-3", name: "Marina Sales", goal: "42 km", level: "Avançado", status: "risco", adherence: 0.74, lastCheckIn: "Ontem, 21:02", weeklyLoad: 410, raceDate: "07 dez 2026" },
  { id: "ath-4", name: "Felipe Tannous", goal: "Performance", level: "Pro", status: "ativo", adherence: 0.97, lastCheckIn: "Hoje, 05:50", weeklyLoad: 460, raceDate: "—" },
  { id: "ath-5", name: "Renata Vidal", goal: "5 km", level: "Iniciante", status: "ativo", adherence: 0.88, lastCheckIn: "Hoje, 08:12", weeklyLoad: 142, raceDate: "30 ago 2026" },
  { id: "ath-6", name: "Diego Martins", goal: "Retorno às corridas", level: "Iniciante", status: "inativo", adherence: 0.32, lastCheckIn: "há 6 dias", weeklyLoad: 64, raceDate: "—" },
  { id: "ath-7", name: "Ana Beatriz Lima", goal: "21 km", level: "Intermediário", status: "ativo", adherence: 0.81, lastCheckIn: "Hoje, 06:50", weeklyLoad: 268, raceDate: "16 ago 2026" },
  { id: "ath-8", name: "Thiago Ferraz", goal: "Emagrecimento", level: "Iniciante", status: "ativo", adherence: 0.69, lastCheckIn: "Ontem, 19:30", weeklyLoad: 120, raceDate: "—" },
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
      "Relatórios PDF premium estilo IronGuides",
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
    persona: "Aluno",
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
    color: "#8b5cf6",
    items: [
      { icon: "🧠", title: "Prescrição inteligente com IA", description: "Sugestões de pace, volume e RPE baseadas no perfil de cada atleta." },
      { icon: "🚨", title: "Alertas de risco automáticos", description: "Saiba antes do atleta se algo vai sair dos trilhos." },
      { icon: "📄", title: "Relatórios PDF estilo IronGuides", description: "Profissionais, prontos para enviar ao atleta em 1 clique." },
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
  { id: "c1", name: "Ricardo Pace Júnior", credential: "CREF 014626-G/MG", plan: "Pro", athletes: 38, mrr: 397, status: "ativo", joinedAt: "Jan 2025" },
  { id: "c2", name: "Fernando Queiroz", credential: "CREF 022140-G/SP", plan: "Assessoria", athletes: 62, mrr: 897, status: "ativo", joinedAt: "Fev 2025" },
  { id: "c3", name: "Patrícia Melo", credential: "CREF 031822-G/RJ", plan: "Pro", athletes: 41, mrr: 397, status: "ativo", joinedAt: "Mar 2025" },
  { id: "c4", name: "André Bastos", credential: "CREF 018903-G/MG", plan: "Starter", athletes: 12, mrr: 197, status: "ativo", joinedAt: "Abr 2025" },
  { id: "c5", name: "Juliana Fonseca", credential: "CREF 027541-G/PR", plan: "Pro", athletes: 33, mrr: 397, status: "em risco", joinedAt: "Jan 2025" },
  { id: "c6", name: "Run Tribe Assessoria", credential: "CNPJ 42.801.334/0001-99", plan: "Assessoria", athletes: 340, mrr: 897, status: "ativo", joinedAt: "Out 2024" },
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
  usedSlots: 38,
  planName: "Pro",
  mrr: 14_260,
  mrrGrowth: 0.11,
  churn30d: 1,
  newAthletes30d: 4,
  pendingInvoices: 2,
};

export const athleteRosterList = [
  { id: "ath-1", name: "Camila Andrade", plan: "Pace Run Pro — Atleta", status: "ativo" as const, billingStatus: "em dia" as const, nextBilling: "10 jul 2026", monthlyFee: 290, joinedAt: "Jan 2025" },
  { id: "ath-2", name: "Bruno Lacerda", plan: "Pace Run Pro — Atleta", status: "risco" as const, billingStatus: "em dia" as const, nextBilling: "14 jul 2026", monthlyFee: 290, joinedAt: "Mar 2025" },
  { id: "ath-3", name: "Marina Sales", plan: "Pace Run Pro — Atleta", status: "ativo" as const, billingStatus: "em dia" as const, nextBilling: "01 jul 2026", monthlyFee: 350, joinedAt: "Nov 2024" },
  { id: "ath-4", name: "Felipe Tannous", plan: "Pace Run Pro — Elite", status: "ativo" as const, billingStatus: "em dia" as const, nextBilling: "20 jul 2026", monthlyFee: 490, joinedAt: "Set 2024" },
  { id: "ath-5", name: "Renata Vidal", plan: "Pace Run Pro — Atleta", status: "ativo" as const, billingStatus: "em dia" as const, nextBilling: "05 jul 2026", monthlyFee: 290, joinedAt: "Abr 2025" },
  { id: "ath-6", name: "Diego Martins", plan: "Pace Run Pro — Atleta", status: "inativo" as const, billingStatus: "inadimplente" as const, nextBilling: "—", monthlyFee: 290, joinedAt: "Jun 2025" },
  { id: "ath-7", name: "Ana Beatriz Lima", plan: "Pace Run Pro — Atleta", status: "ativo" as const, billingStatus: "em dia" as const, nextBilling: "08 jul 2026", monthlyFee: 290, joinedAt: "Fev 2025" },
  { id: "ath-8", name: "Thiago Ferraz", plan: "Pace Run Pro — Atleta", status: "ativo" as const, billingStatus: "em dia" as const, nextBilling: "22 jul 2026", monthlyFee: 290, joinedAt: "Mai 2025" },
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
