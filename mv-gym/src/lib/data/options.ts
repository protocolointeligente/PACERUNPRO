import type { LocalTreino, Objetivo } from "@/lib/types";

export const OBJETIVOS: { id: Objetivo; label: string; descricao: string; icone: string }[] = [
  {
    id: "emagrecimento",
    label: "Emagrecimento",
    descricao: "Reduzir percentual de gordura mantendo massa magra.",
    icone: "Flame",
  },
  {
    id: "hipertrofia",
    label: "Hipertrofia",
    descricao: "Ganhar massa muscular com foco em volume de treino.",
    icone: "Dumbbell",
  },
  {
    id: "forca",
    label: "Força",
    descricao: "Aumentar cargas máximas nos principais movimentos.",
    icone: "BicepsFlexed",
  },
  {
    id: "condicionamento",
    label: "Condicionamento",
    descricao: "Melhorar resistência cardiovascular e fôlego.",
    icone: "HeartPulse",
  },
  {
    id: "saude",
    label: "Saúde",
    descricao: "Manter o corpo ativo com foco em bem-estar geral.",
    icone: "Leaf",
  },
  {
    id: "performance",
    label: "Performance",
    descricao: "Evoluir desempenho físico geral e atlético.",
    icone: "Rocket",
  },
];

export const LOCAIS_TREINO: { id: LocalTreino; label: string; icone: string }[] = [
  { id: "academia", label: "Academia", icone: "Building2" },
  { id: "casa", label: "Casa", icone: "Home" },
  { id: "crossfit", label: "Crossfit", icone: "Hexagon" },
  { id: "funcional", label: "Funcional", icone: "Activity" },
];

export const EQUIPAMENTOS_DISPONIVEIS: string[] = [
  "barra",
  "halteres",
  "anilha",
  "máquina",
  "cabo",
  "banco",
  "rack",
  "smith",
  "kettlebell",
  "barra fixa",
  "elástico",
  "peso corporal",
  "esteira",
  "bicicleta",
  "corda",
];

export const SEXO_OPCOES = [
  { id: "masculino", label: "Masculino" },
  { id: "feminino", label: "Feminino" },
  { id: "outro", label: "Outro" },
] as const;
