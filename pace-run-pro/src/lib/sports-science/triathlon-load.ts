/**
 * Triathlon — carga consolidada multisport, distribuição e alertas.
 *
 * DISCLAIMER: Todos os indicadores são estimativas de suporte à decisão do treinador.
 * Não constituem diagnóstico médico ou prescrição de saúde.
 * Variações individuais de fadiga, técnica e recuperação afetam significativamente os resultados.
 */

// ── Carga consolidada ─────────────────────────────────────────────────────────

export interface MultisportLoad {
  run:      number;
  bike:     number;
  swim:     number;
  strength: number;
  other:    number;
  total:    number;
}

export interface LoadDistribution {
  runPct:      number;
  bikePct:     number;
  swimPct:     number;
  strengthPct: number;
  otherPct:    number;
}

/**
 * Calcula distribuição percentual de carga por modalidade.
 * Total zero → todos os percentuais são 0.
 */
export function loadDistribution(load: MultisportLoad): LoadDistribution {
  const total = load.total || 1;
  return {
    runPct:      Math.round((load.run      / total) * 100),
    bikePct:     Math.round((load.bike     / total) * 100),
    swimPct:     Math.round((load.swim     / total) * 100),
    strengthPct: Math.round((load.strength / total) * 100),
    otherPct:    Math.round((load.other    / total) * 100),
  };
}

// ── Alertas de triathlon ──────────────────────────────────────────────────────

export type TriathlonAlertLevel = "info" | "attention" | "warning";

export interface TriathlonAlert {
  id: string;
  level: TriathlonAlertLevel;
  title: string;
  message: string;
  sport: "RUN" | "BIKE" | "SWIM" | "STRENGTH" | "GENERAL";
}

export interface TriathlonAlertInput {
  /** Carga semanal por modalidade */
  weekLoad:            MultisportLoad;
  /** Dias sem nadar (desde a última sessão de natação) */
  daysSinceSwim:       number;
  /** Dias sem brick (desde o último treino brick) */
  daysSinceBrick:      number;
  /** Dias sem descanso nos últimos 14 dias */
  daysWithoutRest:     number;
  /** Ramp rate semanal em % (variação carga vs semana anterior) */
  rampRatePct:         number;
  /** Objetivo do atleta (para alertas contextuais) */
  goal:                string;
  /** TSB atual (Training Stress Balance) */
  tsb:                 number;
  /** Nível de dor reportado (0–10) */
  painScore:           number;
  /** Nível de fadiga reportado (0–10) */
  fatigueScore:        number;
  /** Qualidade do sono reportada (0–10) */
  sleepScore:          number;
  /** Dias consecutivos com TSB abaixo de -25 */
  consecutiveLowTsb:  number;
}

/**
 * Gera alertas de triathlon baseados em carga, equilíbrio e bem-estar.
 * Linguagem sempre de sugestão — nunca diagnóstico.
 */
export function generateTriathlonAlerts(input: TriathlonAlertInput): TriathlonAlert[] {
  const alerts: TriathlonAlert[] = [];
  const dist = loadDistribution(input.weekLoad);
  const isIronmanGoal = input.goal === "IRONMAN" || input.goal === "MEIO_IRONMAN";
  const isBeginnerTri = input.goal === "SPRINT_TRIATHLON" || input.goal === "OLIMPICO";

  // ── Natação ausente ────────────────────────────────────────────────────────
  if (input.daysSinceSwim > 7) {
    alerts.push({
      id:      "swim-absence",
      level:   "attention",
      sport:   "SWIM",
      title:   "Natação ausente há mais de 7 dias",
      message: `Sugere-se retomar sessão de natação — a ausência prolongada pode impactar a técnica e a base aeróbica aquática. Considere uma sessão regenerativa de baixa intensidade.`,
    });
  }

  // ── Brick ausente ──────────────────────────────────────────────────────────
  if (input.daysSinceBrick > 14 && (isIronmanGoal || isBeginnerTri)) {
    alerts.push({
      id:      "brick-absence",
      level:   "info",
      sport:   "GENERAL",
      title:   "Treino brick não realizado há 14+ dias",
      message: `Recomenda-se incluir pelo menos um treino brick por quinzena para manter a adaptação à transição bike→run. Consulte o treinador sobre o momento ideal.`,
    });
  }

  // ── Sem descanso prolongado ────────────────────────────────────────────────
  if (input.daysWithoutRest > 10) {
    alerts.push({
      id:      "no-rest",
      level:   "warning",
      sport:   "GENERAL",
      title:   "Ausência de dias de descanso (10+ dias)",
      message: `Indica ausência de recuperação ativa recente. Sugere-se avaliar com o treinador a inclusão de um dia de descanso ou sessão regenerativa muito leve para reduzir fadiga acumulada.`,
    });
  }

  // ── Ramp rate elevado ──────────────────────────────────────────────────────
  if (input.rampRatePct > 20) {
    alerts.push({
      id:      "high-ramp",
      level:   "warning",
      sport:   "GENERAL",
      title:   `Aumento de carga elevado (+${input.rampRatePct.toFixed(0)}%)`,
      message: `Variação semanal de carga acima de 20% é um indicador de atenção. Recomenda-se reduzir o aumento para 5–15% por semana ou consultar o treinador sobre a periodização.`,
    });
  } else if (input.rampRatePct > 10) {
    alerts.push({
      id:      "moderate-ramp",
      level:   "info",
      sport:   "GENERAL",
      title:   `Aumento de carga moderado (+${input.rampRatePct.toFixed(0)}%)`,
      message: `Carga aumentou mais de 10% vs. semana anterior. Monitorar fadiga e qualidade do sono nas próximas 48h.`,
    });
  }

  // ── Corrida dominante para iniciantes ─────────────────────────────────────
  if (isBeginnerTri && dist.runPct > 45 && input.weekLoad.total > 0) {
    alerts.push({
      id:      "run-dominant-beginner",
      level:   "attention",
      sport:   "RUN",
      title:   `Corrida representa ${dist.runPct}% da carga semanal`,
      message: `Para triatletas iniciantes, sugere-se manter o percentual de corrida abaixo de 45% da carga total para equilibrar o desenvolvimento nas três modalidades. Considere redistribuir com mais bike e natação.`,
    });
  }

  // ── Bike insuficiente para Ironman/70.3 ───────────────────────────────────
  if (isIronmanGoal && dist.bikePct < 35 && input.weekLoad.total > 0) {
    alerts.push({
      id:      "bike-low-ironman",
      level:   "attention",
      sport:   "BIKE",
      title:   `Volume de bike abaixo do recomendado para ${input.goal}`,
      message: `Para 70.3 e Ironman, o ciclismo costuma representar 40–60% da carga total. Com ${dist.bikePct}%, considera-se aumentar gradualmente o volume de bike. Avalie com o treinador.`,
    });
  }

  // ── Natação com baixo percentual por 2+ semanas ───────────────────────────
  if (dist.swimPct < 10 && input.weekLoad.swim === 0 && input.daysSinceSwim > 13) {
    alerts.push({
      id:      "swim-low-pct",
      level:   "attention",
      sport:   "SWIM",
      title:   "Natação ausente por mais de 2 semanas",
      message: `A natação representa 0% da carga nas últimas semanas. Sugere-se retomar sessões de natação para manter adaptações técnicas e aeróbicas aquáticas.`,
    });
  }

  // ── TSB muito negativo persistente ────────────────────────────────────────
  if (input.tsb < -25 && input.consecutiveLowTsb >= 3) {
    alerts.push({
      id:      "low-tsb",
      level:   "warning",
      sport:   "GENERAL",
      title:   `Forma estimada negativa por ${input.consecutiveLowTsb} dias consecutivos (TSB ${input.tsb.toFixed(0)})`,
      message: `Indicador de fadiga acumulada elevada. Sugere-se avaliar redução de volume, priorizar sono e considerar sessão regenerativa. Estimativa baseada no modelo de Banister — não substitui avaliação profissional de saúde.`,
    });
  }

  // ── Dor reportada ─────────────────────────────────────────────────────────
  if (input.painScore >= 6) {
    alerts.push({
      id:      "pain-high",
      level:   "warning",
      sport:   "GENERAL",
      title:   `Dor reportada: ${input.painScore}/10`,
      message: `Nível de dor elevado indicado pelo atleta. Recomenda-se avaliação por profissional de saúde antes de prosseguir com treinos de alta intensidade. Não substitui avaliação médica.`,
    });
  }

  // ── Fadiga elevada ────────────────────────────────────────────────────────
  if (input.fatigueScore >= 8) {
    alerts.push({
      id:      "fatigue-high",
      level:   "attention",
      sport:   "GENERAL",
      title:   `Fadiga reportada: ${input.fatigueScore}/10`,
      message: `Fadiga subjetiva elevada. Sugere-se substituir a sessão planejada por treino regenerativo ou descanso ativo. Monitorar nas próximas 24–48h.`,
    });
  }

  // ── Qualidade de sono baixa ───────────────────────────────────────────────
  if (input.sleepScore <= 4) {
    alerts.push({
      id:      "sleep-low",
      level:   "info",
      sport:   "GENERAL",
      title:   `Qualidade de sono baixa: ${input.sleepScore}/10`,
      message: `Sono de baixa qualidade reduz a capacidade de recuperação e adaptação ao treino. Sugere-se reduzir intensidade do treino de hoje e priorizar estratégias de higiene do sono.`,
    });
  }

  return alerts;
}

// ── Distribuição ideal por objetivo ──────────────────────────────────────────

export interface TriathlonTargetDistribution {
  swimPct: [number, number];
  bikePct: [number, number];
  runPct:  [number, number];
}

/**
 * Distribuição de carga alvo (%) por modalidade segundo objetivo de triathlon.
 * Valores são intervalos [min, max].
 */
export const TRIATHLON_TARGET_DISTRIBUTION: Record<string, TriathlonTargetDistribution> = {
  SPRINT_TRIATHLON:  { swimPct: [15, 25], bikePct: [35, 45], runPct: [30, 45] },
  OLIMPICO:          { swimPct: [15, 25], bikePct: [38, 48], runPct: [30, 45] },
  MEIO_IRONMAN:      { swimPct: [10, 20], bikePct: [42, 55], runPct: [28, 40] },
  IRONMAN:           { swimPct: [8, 18],  bikePct: [45, 60], runPct: [25, 38] },
  AQUATLON:          { swimPct: [40, 55], bikePct: [0, 5],   runPct: [40, 55] },
  DUATLON:           { swimPct: [0, 5],   bikePct: [45, 60], runPct: [38, 52] },
};

/**
 * Ramp rate semanal (% de variação de carga semana-a-semana).
 */
export function calculateRampRate(currentWeekLoad: number, previousWeekLoad: number): number {
  if (previousWeekLoad <= 0) return 0;
  return Math.round(((currentWeekLoad - previousWeekLoad) / previousWeekLoad) * 100);
}
