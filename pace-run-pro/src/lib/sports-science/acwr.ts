/**
 * ACWR — Acute:Chronic Workload Ratio (janelas fixas tradicionais).
 * Gabbett TJ (2016): "The training—injury prevention paradox".
 * Zona segura: 0.8–1.3 (Gabbett, 2016; revisado por Impellizzeri et al., 2020).
 *
 * Nota: A abordagem EWMA (Williams et al., 2017) é matematicamente superior
 * (sem "artifact de janela"). Veja ewma.ts para a alternativa recomendada.
 */

export interface ACWRResult {
  acute: number;    // carga acumulada nos últimos acuteDays dias
  chronic: number;  // carga média semanal nos últimos chronicDays dias
  ratio: number;    // acute / chronic
  risk: ACWRRisk;
}

export type ACWRRisk = "undertrained" | "optimal" | "caution" | "danger";

/**
 * Calcula ACWR pelo método de janela fixa tradicional.
 * @param dailyTss - mapa YYYY-MM-DD → TSS do dia (apenas os dias com treino precisam estar presentes)
 * @param acuteDays - janela aguda (padrão 7 dias)
 * @param chronicDays - janela crônica (padrão 28 dias; deve ser múltiplo de acuteDays)
 */
export function computeACWR(
  dailyTss: Map<string, number>,
  acuteDays = 7,
  chronicDays = 28,
): ACWRResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateStr = (daysAgo: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  // Acute: sum over last acuteDays days
  let acute = 0;
  for (let i = 0; i < acuteDays; i++) {
    acute += dailyTss.get(getDateStr(i)) ?? 0;
  }

  // Chronic: total over chronicDays divided by number of weeks
  let chronicTotal = 0;
  for (let i = 0; i < chronicDays; i++) {
    chronicTotal += dailyTss.get(getDateStr(i)) ?? 0;
  }
  const weeks = chronicDays / acuteDays;
  const chronic = chronicTotal / weeks;

  const ratio = chronic > 0 ? acute / chronic : 1;

  return {
    acute: Math.round(acute * 10) / 10,
    chronic: Math.round(chronic * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    risk: acwrRisk(ratio),
  };
}

/** Classifica o risco baseado no ratio ACWR. */
export function acwrRisk(ratio: number): ACWRRisk {
  if (ratio < 0.8) return "undertrained";
  if (ratio <= 1.3) return "optimal";
  if (ratio <= 1.5) return "caution";
  return "danger";
}

export const ACWR_RISK_LABELS: Record<ACWRRisk, { label: string; color: string; recommendation: string }> = {
  undertrained: {
    label: "Subcarga",
    color: "#38bdf8",
    recommendation: "Carga abaixo do habitual. Aumente o volume gradualmente.",
  },
  optimal: {
    label: "Zona ótima",
    color: "#22C55E",
    recommendation: "Carga na zona ótima de adaptação. Mantenha o plano.",
  },
  caution: {
    label: "Atenção",
    color: "#F59E0B",
    recommendation: "Carga elevada. Monitore sinais de fadiga e evite aumentos adicionais.",
  },
  danger: {
    label: "Alto risco",
    color: "#EF4444",
    recommendation: "Ratio ACWR elevado — indicador de carga aguda muito acima do habitual. Sugere-se redução de volume e avaliação pelo treinador. Não substitui orientação de profissional de saúde.",
  },
};
