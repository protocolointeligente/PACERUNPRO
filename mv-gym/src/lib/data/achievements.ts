import type { Conquista } from "@/lib/types";

export const CONQUISTAS: Conquista[] = [
  {
    id: "primeiro-treino",
    titulo: "Primeiro passo",
    descricao: "Concluiu seu primeiro treino no MV GYM.",
    icone: "Footprints",
    criterio: "treinos_concluidos>=1",
  },
  {
    id: "streak-7",
    titulo: "7 dias de fogo",
    descricao: "Manteve uma sequência de 7 dias seguidos de atividade.",
    icone: "Flame",
    criterio: "streak>=7",
  },
  {
    id: "streak-30",
    titulo: "Hábito formado",
    descricao: "30 dias consecutivos de constância.",
    icone: "CalendarCheck",
    criterio: "streak>=30",
  },
  {
    id: "treinos-10",
    titulo: "Aquecendo",
    descricao: "10 treinos concluídos.",
    icone: "Dumbbell",
    criterio: "treinos_concluidos>=10",
  },
  {
    id: "treinos-50",
    titulo: "Meio caminho andado",
    descricao: "50 treinos concluídos. Consistência de verdade!",
    icone: "Medal",
    criterio: "treinos_concluidos>=50",
  },
  {
    id: "treinos-100",
    titulo: "Centurião",
    descricao: "100 treinos concluídos no MV GYM.",
    icone: "Trophy",
    criterio: "treinos_concluidos>=100",
  },
  {
    id: "primeira-avaliacao",
    titulo: "Ponto de partida",
    descricao: "Registrou sua primeira avaliação física.",
    icone: "Ruler",
    criterio: "avaliacoes>=1",
  },
  {
    id: "primeiro-pr",
    titulo: "Novo recorde",
    descricao: "Bateu seu primeiro recorde pessoal de carga.",
    icone: "TrendingUp",
    criterio: "prs>=1",
  },
  {
    id: "checkin-7",
    titulo: "Em sintonia",
    descricao: "Fez check-in diário por 7 dias seguidos.",
    icone: "HeartPulse",
    criterio: "checkins_seguidos>=7",
  },
  {
    id: "meta-alcancada",
    titulo: "Meta alcançada",
    descricao: "Atingiu o peso/objetivo definido no seu perfil.",
    icone: "Target",
    criterio: "meta_alcancada",
  },
];

export function getConquistaById(id: string): Conquista | undefined {
  return CONQUISTAS.find((c) => c.id === id);
}
