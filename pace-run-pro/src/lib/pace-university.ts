import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Dumbbell, HeartPulse, Smartphone, Target, Trophy, Watch } from "lucide-react";

export type PaceCourseAudience = "athlete" | "coach" | "both";

export interface PaceLesson {
  title: string;
  durationMin: number;
  objective: string;
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

export const paceUniversityCourses: PaceCourse[] = [
  {
    id: "zonas-intensidade-rpe",
    title: "Zonas, RPE e controle de intensidade",
    description: "Como interpretar Z1-Z5, RPE, ritmo, potencia e sinais do corpo sem transformar todo treino em teste.",
    level: "Base",
    durationMin: 48,
    audience: "both",
    icon: Activity,
    lessons: [
      { title: "O que cada zona deveria provocar", durationMin: 12, objective: "Diferenciar regenerativo, base, limiar e VO2 na pratica." },
      { title: "RPE como ferramenta de calibragem", durationMin: 10, objective: "Usar percepcao de esforco para ajustar dias bons e ruins." },
      { title: "Quando ritmo, FC e potencia discordam", durationMin: 14, objective: "Escolher a metrica certa por modalidade e contexto." },
      { title: "Alertas de excesso de intensidade", durationMin: 12, objective: "Reconhecer sinais de carga mal distribuida." },
    ],
  },
  {
    id: "execucao-corrida",
    title: "Como executar treinos de corrida",
    description: "Rodagem, progressivo, fartlek, tempo run, subida e intervalados com aquecimento, parte principal e volta a calma.",
    level: "Base",
    durationMin: 54,
    audience: "athlete",
    icon: Target,
    lessons: [
      { title: "Rodagem leve de verdade", durationMin: 9, objective: "Evitar que Z2 vire treino moderado todos os dias." },
      { title: "Fartlek e progressivo sem exagero", durationMin: 12, objective: "Entender variacao de ritmo sem perder controle." },
      { title: "Tempo run e limiar", durationMin: 14, objective: "Sustentar desconforto controlado com tecnica." },
      { title: "Intervalados e recuperacoes", durationMin: 13, objective: "Executar series com consistencia, nao heroismo." },
      { title: "Check-in pos-treino", durationMin: 6, objective: "Registrar feedback util para o treinador." },
    ],
  },
  {
    id: "forca-endurance",
    title: "Forca para endurance",
    description: "Execucao, progressao de carga, RPE/RIR, descanso e seguranca em treinos de forca para atletas.",
    level: "Intermediario",
    durationMin: 62,
    audience: "both",
    icon: Dumbbell,
    lessons: [
      { title: "Por que atleta de endurance precisa de forca", durationMin: 10, objective: "Conectar forca, economia e prevencao." },
      { title: "Como escolher carga por RPE/RIR", durationMin: 13, objective: "Ajustar peso com autonomia e seguranca." },
      { title: "Tecnica antes da exaustao", durationMin: 11, objective: "Preservar padrao de movimento sob fadiga." },
      { title: "Progressao semanal simples", durationMin: 15, objective: "Evoluir sem atrapalhar os treinos-chave." },
      { title: "Registro de carga e reps", durationMin: 13, objective: "Gerar historico util para decisao tecnica." },
    ],
  },
  {
    id: "metricas-feedback",
    title: "Metricas que mudam a prescricao",
    description: "Sono, fadiga, dor, stress, aderencia, TSS, volume e planejado x realizado como base de decisao.",
    level: "Intermediario",
    durationMin: 58,
    audience: "coach",
    icon: BarChart3,
    lessons: [
      { title: "Aderencia e consistencia", durationMin: 10, objective: "Identificar risco antes de cobrar mais volume." },
      { title: "Carga planejada x realizada", durationMin: 14, objective: "Comparar TSS, minutos, distancia e modalidade." },
      { title: "Dor, sono e stress", durationMin: 12, objective: "Usar feedback subjetivo como dado de prescricao." },
      { title: "Sinais de monotonia e fadiga", durationMin: 12, objective: "Reconhecer distribuicao ruim de carga." },
      { title: "Relatorio semanal objetivo", durationMin: 10, objective: "Comunicar decisao sem excesso de informacao." },
    ],
  },
  {
    id: "triatlo-multimodal",
    title: "Triathlon e distribuicao multimodal",
    description: "Como combinar natacao, ciclismo, corrida, forca e recuperacao sem competir contra a propria planilha.",
    level: "Avancado",
    durationMin: 72,
    audience: "coach",
    icon: Trophy,
    lessons: [
      { title: "Frequencia semanal por modalidade", durationMin: 14, objective: "Distribuir estimulos por nivel, tempo disponivel e prova." },
      { title: "Ordem dos treinos-chave", durationMin: 12, objective: "Evitar interferencia entre intensidade e forca." },
      { title: "Brick, transicao e especificidade", durationMin: 13, objective: "Usar combinados sem inflar fadiga." },
      { title: "Volume em horas e nao so distancia", durationMin: 15, objective: "Comparar modalidades com metricas coerentes." },
      { title: "Semana de descarga", durationMin: 10, objective: "Reduzir fadiga mantendo sinal de treinamento." },
      { title: "Publicacao para calendario", durationMin: 8, objective: "Transformar planejamento em sessoes editaveis." },
    ],
  },
  {
    id: "estrategia-prova",
    title: "Estrategia de prova e recuperacao",
    description: "Definicao de meta, pacing, taper, alimentacao basica e retorno pos-prova.",
    level: "Intermediario",
    durationMin: 44,
    audience: "athlete",
    icon: HeartPulse,
    lessons: [
      { title: "Meta realista e ritmo-alvo", durationMin: 10, objective: "Planejar prova com dados, nao ansiedade." },
      { title: "Taper sem perder confianca", durationMin: 9, objective: "Reduzir carga mantendo sensacao de prontidao." },
      { title: "Controle de ritmo no dia", durationMin: 12, objective: "Evitar largada agressiva e quebra." },
      { title: "Feedback pos-prova", durationMin: 8, objective: "Transformar resultado em aprendizagem." },
      { title: "Retorno seguro", durationMin: 5, objective: "Retomar rotina sem acumular dano." },
    ],
  },
  {
    id: "execucao-app-mobile",
    title: "Como usar Meus Treinos no celular",
    description: "Fluxo pratico para abrir o treino certo, filtrar por modalidade, executar forca com GIFs e registrar feedback util.",
    level: "Base",
    durationMin: 36,
    audience: "athlete",
    icon: Smartphone,
    lessons: [
      { title: "Encontrar o treino do dia", durationMin: 7, objective: "Usar a agenda unica e filtros por modalidade sem se perder em abas." },
      { title: "Abrir treino e entender objetivo", durationMin: 8, objective: "Ler zona, RPE, duracao e observacoes antes de comecar." },
      { title: "Forca com GIF e carga", durationMin: 9, objective: "Executar exercicios com referencia visual e registrar carga, reps e RPE." },
      { title: "Feedback que ajuda o treinador", durationMin: 7, objective: "Enviar sensacao, dor, fadiga e comentario objetivo." },
      { title: "Uso offline de emergencia", durationMin: 5, objective: "Abrir a ultima sessao carregada quando a conexao cair." },
    ],
  },
  {
    id: "dados-relogio-strava",
    title: "Dados de relogio, Strava e lancamento manual",
    description: "Como transformar distancia, tempo, FC, pace, potencia, sono e stress em informacao confiavel de treino.",
    level: "Intermediario",
    durationMin: 52,
    audience: "both",
    icon: Watch,
    lessons: [
      { title: "O que sincronizar", durationMin: 8, objective: "Priorizar dados que realmente mudam a prescricao." },
      { title: "Planejado x realizado", durationMin: 10, objective: "Comparar duracao, distancia, TSS e intensidade por modalidade." },
      { title: "FC, pace e potencia", durationMin: 11, objective: "Entender quando cada metrica e confiavel." },
      { title: "Sono, stress e dor", durationMin: 9, objective: "Usar sinais de recuperacao como freio ou permissao de carga." },
      { title: "Quando digitar manualmente", durationMin: 7, objective: "Completar dados que relogio ou Strava nao capturaram." },
      { title: "Auditoria semanal", durationMin: 7, objective: "Fechar a semana com decisao simples: manter, ajustar ou recuperar." },
    ],
  },
];

export function getPaceCourses(audience: "athlete" | "coach") {
  return paceUniversityCourses.filter((course) => course.audience === "both" || course.audience === audience);
}
