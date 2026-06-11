export type EvaluationDimensionKey =
  | "conservar"
  | "progredir"
  | "criarFinalizar"
  | "protegerBaliza"
  | "recuperar"
  | "transicaoOfensiva"
  | "transicaoDefensiva";

export interface EvaluationDimension {
  key: EvaluationDimensionKey;
  label: string;
  group: string;
  description: string;
}

export const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
  { key: "conservar", label: "Conservar a bola", group: "Ataque", description: "Apoios, mobilidade e passe seguro" },
  { key: "progredir", label: "Progredir", group: "Ataque", description: "Passe vertical, condução ou terceiro homem" },
  { key: "criarFinalizar", label: "Criar e finalizar", group: "Ataque", description: "Último passe, cruzamento, finalização" },
  { key: "protegerBaliza", label: "Proteger a baliza", group: "Defesa", description: "Compactação, cobertura e controle de profundidade" },
  { key: "recuperar", label: "Recuperar a bola", group: "Defesa", description: "Pressão, interceptação e desarme" },
  { key: "transicaoOfensiva", label: "Acelerar após recuperar", group: "Transição ofensiva", description: "Primeiro passe para frente ou retirada da pressão" },
  { key: "transicaoDefensiva", label: "Reagir após perder", group: "Transição defensiva", description: "Pressão imediata ou temporização" },
];

export const EVALUATION_DIMENSION_KEYS: EvaluationDimensionKey[] = EVALUATION_DIMENSIONS.map((d) => d.key);

export type EvaluationScores = Record<EvaluationDimensionKey, number>;

export function emptyScores(value = 5): EvaluationScores {
  return EVALUATION_DIMENSION_KEYS.reduce((acc, key) => {
    acc[key] = value;
    return acc;
  }, {} as EvaluationScores);
}

export function averageScore(scores: EvaluationScores): number {
  const values = EVALUATION_DIMENSION_KEYS.map((key) => scores[key] ?? 0);
  return values.reduce((a, b) => a + b, 0) / values.length;
}
