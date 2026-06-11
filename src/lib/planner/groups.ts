export type FundamentoGroupKey = "tecnico" | "tatico" | "cognitivo" | "fisico";

export const FUNDAMENTO_GROUP_KEYS: FundamentoGroupKey[] = ["tecnico", "tatico", "cognitivo", "fisico"];

export const FUNDAMENTO_GROUP_LABELS: Record<FundamentoGroupKey, string> = {
  tecnico: "Técnicos",
  tatico: "Táticos",
  cognitivo: "Cognitivos",
  fisico: "Físico integrado",
};

const COGNITIVO_KEYWORDS = ["percepção", "tomada de decisão", "criatividade", "comunicação", "leitura"];

const FISICO_KEYWORDS = [
  "coordenação",
  "mudança de direção",
  "reação",
  "agilidade",
  "velocidade",
  "giro sob pressão",
  "alta intensidade",
  "equilíbrio",
  "brincadeira",
];

const TECNICO_KEYWORDS = [
  "condução",
  "drible",
  "passe",
  "domínio",
  "finalização",
  "recepção",
  "cruzamento",
  "ultrapassagem",
  "tabela",
  "jogo aéreo",
  "jogo com os pés",
  "defesa baixa",
  "defesa alta",
  "saída do gol",
  "reposição",
  "ruptura",
  "pivô",
  "chute",
  "controle",
];

export function classifyFundamento(term: string): FundamentoGroupKey {
  const lower = term.toLowerCase();
  if (COGNITIVO_KEYWORDS.some((k) => lower.includes(k))) return "cognitivo";
  if (FISICO_KEYWORDS.some((k) => lower.includes(k))) return "fisico";
  if (TECNICO_KEYWORDS.some((k) => lower.includes(k))) return "tecnico";
  return "tatico";
}

export function groupFundamentos(fundamentos: string[]): Record<FundamentoGroupKey, string[]> {
  const groups: Record<FundamentoGroupKey, string[]> = { tecnico: [], tatico: [], cognitivo: [], fisico: [] };
  for (const term of fundamentos) {
    groups[classifyFundamento(term)].push(term);
  }
  return groups;
}
