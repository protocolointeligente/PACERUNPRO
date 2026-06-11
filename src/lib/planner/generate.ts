import { CATEGORIES, type CategoryInfo } from "../data/categories";
import { POSITIONS, type PositionInfo } from "../data/positions";
import type { Exercise } from "../exercises/types";
import { getExercises } from "../exercises/bank";
import { escolher } from "./score";
import { getPriorities, type CustomPriorities } from "./lists";
import type { PlannerConfig } from "./types";

export interface OrganizationRow {
  block: string;
  duration: number;
  content: string;
  guidance: string;
}

export interface LessonPlan {
  config: PlannerConfig;
  category: CategoryInfo;
  position: PositionInfo;
  exercises: Exercise[];
  eachMinutes: number;
  warm: number;
  intro: number;
  game: number;
  feedback: number;
  organization: OrganizationRow[];
  priorities: string[];
  bankSize: number;
}

export function gerarTreino(cfg: PlannerConfig, customPriorities: CustomPriorities = {}): LessonPlan {
  const exercises = getExercises();
  const exs = escolher(exercises, cfg);
  const category = CATEGORIES[cfg.categoria];
  const position = POSITIONS[cfg.posicao];

  const warm = cfg.tempo <= 50 ? 8 : 12;
  const intro = 5;
  const game = cfg.tempo <= 60 ? 12 : 18;
  const feedback = 5;
  const eachMinutes = Math.max(8, Math.floor((cfg.tempo - warm - intro - game - feedback) / Math.max(1, exs.length)));

  const organization: OrganizationRow[] = [
    {
      block: "Entrada pedagógica",
      duration: intro,
      content: "Explicar objetivo, regra de sucesso e critério observável.",
      guidance: "Falar pouco, demonstrar rápido e iniciar com bola.",
    },
    {
      block: "Aquecimento específico",
      duration: warm,
      content: "Ativação com bola ligada ao tema.",
      guidance: "Ativar percepção, orientação corporal e comunicação.",
    },
    ...exs.map((ex, i) => ({
      block: `Exercício ${i + 1}`,
      duration: eachMinutes,
      content: ex.title,
      guidance: ex.objective,
    })),
    {
      block: "Jogo aplicado",
      duration: game,
      content: "Jogo condicionado com regra do tema.",
      guidance: "Validar se o comportamento aparece sem parar toda hora.",
    },
    {
      block: "Feedback",
      duration: feedback,
      content: "2 perguntas e 1 critério para próxima aula.",
      guidance: "Registrar evidências, não apenas opinião.",
    },
  ];

  return {
    config: cfg,
    category,
    position,
    exercises: exs,
    eachMinutes,
    warm,
    intro,
    game,
    feedback,
    organization,
    priorities: getPriorities(cfg.categoria, customPriorities).slice(0, 3),
    bankSize: exercises.length,
  };
}
