/**
 * Mapeamento de zonas de lesão → keywords de exercícios contraindicados.
 * Usa correspondência por keyword no histórico de lesões em texto livre do atleta.
 * Baseado em diretrizes de fisioterapia esportiva e literatura de reabilitação.
 */

export type InjuryZone =
  | "joelho"
  | "quadril"
  | "tornozelo_aquiles"
  | "lombar"
  | "cervical"
  | "ombro"
  | "cotovelo"
  | "isquiotibial"
  | "panturrilha"
  | "virilha";

export interface ContraindicationRule {
  zone: InjuryZone;
  keywords: string[];
  contraindicated: string[];
  warning: string;
}

export const CONTRAINDICATION_RULES: ContraindicationRule[] = [
  {
    zone: "joelho",
    keywords: [
      "joelho", "patelofemoral", "menisco", "ligamento cruzado", "lca", "lcm", "lcp",
      "condromalácia", "tendinite patelar", "síndrome da banda it", "band it",
    ],
    contraindicated: [
      "agachamento", "squat", "lunges", "afundo", "leg press", "step",
      "pliometria", "salto", "jump", "box jump", "corrida descendente",
      "escada", "subida íngreme", "leg extension",
    ],
    warning: "Joelho: evitar agachamentos profundos, pliometria e impacto em descidas.",
  },
  {
    zone: "lombar",
    keywords: [
      "lombar", "coluna", "hérnia", "hérnia de disco", "ciática", "lombalgia",
      "espondilose", "dor nas costas", "dor lombar", "sacroilíaca",
    ],
    contraindicated: [
      "levantamento terra", "deadlift", "hiperextensão", "good morning",
      "flexão de tronco", "abdominais", "sit-up", "crunch", "jefferson curl",
      "barra guiada agachamento", "back squat", "overhead squat",
    ],
    warning: "Lombar: evitar carga axial pesada e flexão/extensão forçada de coluna.",
  },
  {
    zone: "ombro",
    keywords: [
      "ombro", "manguito rotador", "rotatório", "bursita", "impingement",
      "acrômio", "clavícula", "slap", "instabilidade glenoumeral", "luxação ombro",
    ],
    contraindicated: [
      "supino", "desenvolvimento", "remada", "pulldown", "pull-up", "barra fixa",
      "overhead press", "press militar", "elevação lateral", "elevação frontal",
      "arremesso", "natação crawl", "crawl",
    ],
    warning: "Ombro: evitar movimentos acima da cabeça e pressão no ombro.",
  },
  {
    zone: "tornozelo_aquiles",
    keywords: [
      "tornozelo", "entorse", "aquiles", "tendão de aquiles", "fascite",
      "fascite plantar", "calcâneo", "plantar", "síndrome do túnel do tarso",
    ],
    contraindicated: [
      "pliometria", "salto", "jump", "calf raise", "panturrilha", "soleus",
      "elevação de panturrilha", "sprint", "velocidade", "corrida intensa",
      "trail", "terreno irregular",
    ],
    warning: "Tornozelo/Aquiles: evitar impacto e exercícios de ponta de pé.",
  },
  {
    zone: "quadril",
    keywords: [
      "quadril", "iliopsoas", "labrum", "bursita trocantérica", "groin",
      "virilha", "addutor", "piriforme", "FAI", "impingement femoroacetabular",
    ],
    contraindicated: [
      "agachamento profundo", "squat profundo", "afundo", "lunges",
      "adução", "abdução de quadril", "corrida longa", "ciclismo intenso",
      "leg press", "stiff",
    ],
    warning: "Quadril: evitar flexão profunda e movimentos de alta amplitude de quadril.",
  },
  {
    zone: "isquiotibial",
    keywords: [
      "isquiotibial", "posterior de coxa", "bíceps femoral", "semitendíneo",
      "semimembranoso", "hamstring", "tendinopatia proximal",
    ],
    contraindicated: [
      "deadlift", "levantamento terra", "stiff", "leg curl",
      "flexão de joelho", "sprint", "velocidade", "corrida rápida",
      "nordic curl", "good morning",
    ],
    warning: "Isquiotibiais: evitar sprints e exercícios de flexão de joelho com carga.",
  },
  {
    zone: "panturrilha",
    keywords: [
      "panturrilha", "sóleo", "gastrocnêmio", "distensão", "rotura",
      "cãibra crônica", "fibra muscular",
    ],
    contraindicated: [
      "calf raise", "elevação de panturrilha", "jump", "salto",
      "corrida intensa", "sprint", "trilha", "subida",
    ],
    warning: "Panturrilha: evitar exercícios de tríceps sural e impacto de alta velocidade.",
  },
  {
    zone: "virilha",
    keywords: [
      "virilha", "pubis", "osteíte púbica", "pubalgia", "addutor",
      "hérnia inguinal",
    ],
    contraindicated: [
      "adução", "addutor", "agachamento sumo", "sumo squat", "leg press",
      "salto lateral", "mudança de direção", "futebol", "corrida lateral",
    ],
    warning: "Virilha/Púbis: evitar exercícios de adução e mudanças bruscas de direção.",
  },
  {
    zone: "cotovelo",
    keywords: [
      "cotovelo", "epicondilite", "epicondilite lateral", "tennis elbow",
      "epicondilite medial", "golfer elbow", "tendinite do cotovelo",
    ],
    contraindicated: [
      "rosca direta", "rosca bíceps", "tríceps", "pull-up", "remada",
      "barra fixa", "supino estreito", "extensão de cotovelo", "remo",
    ],
    warning: "Cotovelo: evitar flexão/extensão com carga e movimentos repetitivos de punho.",
  },
];

export interface ContraindicationWarning {
  zone: InjuryZone;
  warning: string;
  matchedInjuryKeywords: string[];
  contraindicatedExercises: string[];
}

/**
 * Retorna avisos de contraindicação comparando o histórico de lesões (texto livre)
 * com uma lista de keywords de exercícios/tipos de treino.
 */
export function checkContraindications(
  injuryHistory: string | null | undefined,
  exerciseKeywords: string[],
): ContraindicationWarning[] {
  if (!injuryHistory?.trim()) return [];

  const historyLower = injuryHistory.toLowerCase();
  const exerciseLower = exerciseKeywords.map((e) => e.toLowerCase());
  const warnings: ContraindicationWarning[] = [];

  for (const rule of CONTRAINDICATION_RULES) {
    const matchedInjury = rule.keywords.filter((kw) => historyLower.includes(kw));
    if (matchedInjury.length === 0) continue;

    const contraindicatedMatches = rule.contraindicated.filter((ex) =>
      exerciseLower.some((ek) => ek.includes(ex) || ex.includes(ek)),
    );
    if (contraindicatedMatches.length === 0) continue;

    warnings.push({
      zone: rule.zone,
      warning: rule.warning,
      matchedInjuryKeywords: matchedInjury,
      contraindicatedExercises: contraindicatedMatches,
    });
  }

  return warnings;
}

/**
 * Retorna as zonas de lesão detectadas no histórico do atleta,
 * independente do exercício prescrito. Útil para banner de aviso geral.
 */
export function getInjuryZones(injuryHistory: string | null | undefined): InjuryZone[] {
  if (!injuryHistory?.trim()) return [];
  const historyLower = injuryHistory.toLowerCase();
  return CONTRAINDICATION_RULES
    .filter((rule) => rule.keywords.some((kw) => historyLower.includes(kw)))
    .map((rule) => rule.zone);
}

export const INJURY_ZONE_LABELS: Record<InjuryZone, string> = {
  joelho: "Joelho",
  quadril: "Quadril",
  tornozelo_aquiles: "Tornozelo / Aquiles",
  lombar: "Lombar",
  cervical: "Cervical",
  ombro: "Ombro",
  cotovelo: "Cotovelo",
  isquiotibial: "Isquiotibiais",
  panturrilha: "Panturrilha",
  virilha: "Virilha / Púbis",
};
