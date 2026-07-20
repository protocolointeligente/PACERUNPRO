import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Dumbbell, HeartPulse, Smartphone, Target, Trophy, Watch } from "lucide-react";
import { withEditorialContent } from "./pace-university-editorial";

export type PaceCourseAudience = "athlete" | "coach" | "both";

export interface PaceLesson {
  id?: string;
  title: string;
  durationMin: number;
  objective: string;
  content?: string;
  example?: string;
  commonMistakes?: string[];
  activity?: string;
  summary?: string;
  quiz?: PaceQuizQuestion[];
  references?: string[];
  status?: "draft" | "review" | "approved" | "published" | "archived";
}

export interface PaceQuizQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface PaceCourse {
  id: string;
  title: string;
  description: string;
  level: "Base" | "Intermediario" | "Avancado";
  durationMin: number;
  audience: PaceCourseAudience;
  icon: LucideIcon;
  lessons: PaceLesson[];
}

const basePaceUniversityCourses: PaceCourse[] = [
  {
    id: "zonas-intensidade-rpe",
    title: "Zonas, RPE e controle de intensidade",
    description: "Controlar intensidade combinando zonas fisiológicas, percepção de esforço, ritmo, potência e sinais do atleta.",
    level: "Base",
    durationMin: 48,
    audience: "both",
    icon: Activity,
    lessons: [
      { title: "Intensidade: o que o treinador realmente está controlando", durationMin: 13, objective: "Diferenciar intensidade, volume, carga externa e carga interna." },
      { title: "Zonas de intensidade: Z1 a Z5 sem falsas certezas", durationMin: 15, objective: "Compreender modelos de zonas e evitar interpretações rígidas." },
      { title: "RPE e teste da fala: interpretar o esforço do atleta", durationMin: 13, objective: "Usar RPE e teste da fala para interpretar a carga interna." },
      { title: "Tomada de decisão combinando zonas, ritmo, potência e sinais do corpo", durationMin: 14, objective: "Integrar indicadores e decidir quando manter, reduzir ou interromper." },
    ],
  },
  {
    id: "forca-endurance",
    title: "Força para endurance",
    description: "Rodagem, progressivo, fartlek, tempo run, subida e intervalados com aquecimento, parte principal e volta a calma.",
    level: "Intermediario",
    durationMin: 75,
    audience: "both",
    icon: Dumbbell,
    lessons: [
      { title: "Por que atletas de endurance precisam de força", durationMin: 14, objective: "Relacionar força, economia de movimento, tolerância mecânica e desempenho." },
      { title: "Seleção de exercícios e padrões fundamentais", durationMin: 16, objective: "Escolher padrões de movimento e exercícios conforme modalidade, fase e capacidade técnica." },
      { title: "Carga, séries, repetições, RIR e RPE", durationMin: 16, objective: "Prescrever carga e volume controlando proximidade da falha e fadiga." },
      { title: "Organização semanal e treinamento concorrente", durationMin: 15, objective: "Combinar força e endurance sem comprometer os estímulos prioritários." },
      { title: "Segurança, progressão e montagem de uma sessão completa", durationMin: 14, objective: "Montar uma sessão segura, progressiva e coerente com o atleta." },
    ],
  },
  {
    id: "metricas-feedback",
    title: "Métricas que mudam a prescrição",
    description: "Como combinar natacao, ciclismo, corrida, forca e recuperacao sem competir contra a propria planilha.",
    level: "Intermediario",
    durationMin: 78,
    audience: "coach",
    icon: BarChart3,
    lessons: [
      { title: "Métricas úteis, métricas vaidosas e contexto", durationMin: 14, objective: "Diferenciar dado, informação e decisão e escolher métricas acionáveis." },
      { title: "Sono, fadiga, estresse e prontidão", durationMin: 16, objective: "Interpretar sinais subjetivos usando linha de base e tendência individual." },
      { title: "Dor, desconforto e sinais que exigem atenção", durationMin: 15, objective: "Diferenciar esforço esperado de sinais que exigem adaptação ou encaminhamento." },
      { title: "Carga: volume, sRPE, TSS, monotonia e tendência", durationMin: 18, objective: "Usar métricas de carga com prudência, contexto e limites de interpretação." },
      { title: "Planejado versus realizado e regras de ajuste", durationMin: 15, objective: "Comparar execução e resposta para propor ajustes na semana seguinte." },
    ],
  },
  {
    id: "triatlo-multimodal",
    title: "Triathlon e distribuição multimodal",
    description: "Definicao de meta, pacing, taper, alimentacao basica e retorno pos-prova.",
    level: "Avancado",
    durationMin: 100,
    audience: "coach",
    icon: Trophy,
    lessons: [
      { title: "O problema central da preparação para triathlon", durationMin: 15, objective: "Entender recuperação limitada, carga total e prioridade entre modalidades." },
      { title: "Diagnóstico inicial e definição de prioridades", durationMin: 16, objective: "Avaliar perfil, disponibilidade, limitações e modalidade com maior potencial." },
      { title: "Distribuição de volume e intensidade entre modalidades", durationMin: 18, objective: "Distribuir estímulos, sessões-chave e semanas de descarga." },
      { title: "Sessões combinadas e treinos de transição", durationMin: 16, objective: "Usar bricks e transições com especificidade e custo de fadiga controlado." },
      { title: "Força, recuperação e prevenção de excesso de carga", durationMin: 17, objective: "Proteger recuperação e organizar força, sono, alimentação e dias leves." },
      { title: "Construção de uma semana de triathlon", durationMin: 18, objective: "Montar uma semana viável para um triatleta considerando prioridade e disponibilidade." },
    ],
  },
  {
    id: "dados-relogio-strava",
    title: "Dados de relógio, Strava e lançamento manual",
    description: "Fluxo pratico para abrir o treino certo, filtrar por modalidade, executar forca com GIFs e registrar feedback util.",
    level: "Intermediario",
    durationMin: 88,
    audience: "both",
    icon: Watch,
    lessons: [
      { title: "De onde vêm os dados e por que eles podem falhar", durationMin: 13, objective: "Reconhecer fontes, formatos, perdas de campos e duplicidades na importação." },
      { title: "Distância, tempo, ritmo e velocidade", durationMin: 14, objective: "Interpretar duração, pausas, GPS, ritmo e velocidade conforme o contexto." },
      { title: "Frequência cardíaca: uso e limitações", durationMin: 15, objective: "Usar frequência cardíaca reconhecendo sensores, deriva, falhas e limitações." },
      { title: "Potência, pace e métricas avançadas", durationMin: 16, objective: "Interpretar potência e pace distinguindo medição, estimativa e calibração." },
      { title: "Sono, estresse e dados de recuperação", durationMin: 15, objective: "Usar tendências de recuperação sem comparar indiscriminadamente dispositivos ou atletas." },
      { title: "Validação, correção e lançamento manual", durationMin: 15, objective: "Auditar atividades, corrigir inconsistências e registrar sessões sem dispositivo." },
    ],
  },
];

export const paceUniversityCourses: PaceCourse[] = basePaceUniversityCourses.map(withEditorialContent);

export function getPaceCourses(audience: "athlete" | "coach") {
  return paceUniversityCourses.filter((course) => course.audience === "both" || course.audience === audience);
}
