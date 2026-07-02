/**
 * Análise de tendência e detecção de estados fisiológicos críticos.
 * Baseado em: Banister (1991), Mujika & Padilla (2003), Halson (2014),
 * Gabbett (2016), Foster (1998).
 */

import type { LoadDay } from "@/lib/training-load";

export type Trend = "rising" | "stable" | "declining";

export interface TendencyResult {
  trend: Trend;
  slope: number;     // unidades CTL por dia (positivo = crescendo)
  confidence: number; // R² da regressão linear (0–1)
}

/**
 * Calcula a tendência do CTL nos últimos `days` dias via regressão linear simples.
 * Slope positivo = CTL crescendo (volume de treino aumentando).
 * Slope negativo = CTL caindo (destreino ou taper).
 */
export function computeTendency(series: LoadDay[], days = 14): TendencyResult {
  const window = series.slice(-days);
  const n = window.length;
  if (n < 3) return { trend: "stable", slope: 0, confidence: 0 };

  const xs = window.map((_, i) => i);
  const ys = window.map((d) => d.ctl);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  let ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - meanX) * (ys[i] - meanY);
    ssXX += (xs[i] - meanX) ** 2;
    ssYY += (ys[i] - meanY) ** 2;
  }

  const slope = ssXX > 0 ? ssXY / ssXX : 0;
  const r2 = ssXX > 0 && ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;

  let trend: Trend;
  const absSlope = Math.abs(slope);
  if (absSlope < 0.05) {
    trend = "stable";
  } else if (slope > 0) {
    trend = "rising";
  } else {
    trend = "declining";
  }

  return {
    trend,
    slope: Math.round(slope * 1000) / 1000,
    confidence: Math.round(r2 * 100) / 100,
  };
}

export interface OverreachingSignal {
  detected: boolean;
  reason: string;
  severity: "warning" | "danger";
}

/**
 * Detecção de overreaching/overtraining.
 * Critérios (Foster 1998, Meeusen et al. 2013):
 * 1. TSB < -30 (fadiga acumulada severa) → danger
 * 2. TSB < -20 por ≥5 dias consecutivos → warning (overreaching funcional)
 * 3. Spike ATL > 135% da semana anterior → warning
 */
export function detectOverreaching(series: LoadDay[]): OverreachingSignal {
  if (series.length < 7) {
    return { detected: false, reason: "Dados insuficientes", severity: "warning" };
  }

  const last = series[series.length - 1];

  // Critério 1: TSB severamente negativo
  if (last.tsb < -30) {
    return {
      detected: true,
      reason: `TSB ${last.tsb.toFixed(1)} — fadiga acumulada severa (overreaching não funcional provável).`,
      severity: "danger",
    };
  }

  // Critério 2: TSB < -20 por ≥5 dias consecutivos
  const last5 = series.slice(-5);
  if (last5.length === 5 && last5.every((d) => d.tsb < -20)) {
    return {
      detected: true,
      reason: "TSB abaixo de -20 por 5 dias consecutivos — overreaching funcional em progresso.",
      severity: "warning",
    };
  }

  // Critério 3: Spike semanal > 135%
  if (series.length >= 14) {
    const thisWeek = series.slice(-7).reduce((s, d) => s + d.tss, 0);
    const lastWeek = series.slice(-14, -7).reduce((s, d) => s + d.tss, 0);
    if (lastWeek > 0 && thisWeek / lastWeek > 1.35) {
      return {
        detected: true,
        reason: `Spike de carga: +${Math.round((thisWeek / lastWeek - 1) * 100)}% em relação à semana anterior.`,
        severity: "warning",
      };
    }
  }

  return { detected: false, reason: "Sem sinais de overreaching.", severity: "warning" };
}

export interface TaperSignal {
  detected: boolean;
  phase: "pre-taper" | "taper" | "peak" | "none";
  reason: string;
}

/**
 * Detecção de taper (período de polimento pré-competição).
 * Critérios (Mujika & Padilla 2003, Bosquet et al. 2007):
 * 1. TSB crescente (positivo ou subindo de negativo)
 * 2. ATL caindo (redução de carga aguda)
 * 3. CTL se mantendo ou caindo levemente (fitness preservado)
 */
export function detectTaper(series: LoadDay[]): TaperSignal {
  if (series.length < 14) {
    return { detected: false, phase: "none", reason: "Dados insuficientes para detectar taper." };
  }

  const last = series[series.length - 1];
  const prev7 = series[series.length - 8];
  const prev14 = series[series.length - 15] ?? series[0];

  const tsbRising = last.tsb > prev7.tsb;
  const atlFalling = last.atl < prev7.atl;
  const ctlStableOrSlightDrop = last.ctl >= prev7.ctl * 0.85;

  if (last.tsb > 10 && tsbRising && atlFalling && ctlStableOrSlightDrop) {
    return {
      detected: true,
      phase: "peak",
      reason: `Taper concluído — TSB ${last.tsb.toFixed(1)}, atleta em forma de pico.`,
    };
  }

  if (tsbRising && atlFalling && ctlStableOrSlightDrop) {
    const tsbWeeksAgo = prev14.tsb;
    if (last.tsb > tsbWeeksAgo) {
      return {
        detected: true,
        phase: "taper",
        reason: `Taper em andamento — TSB subindo (${prev7.tsb.toFixed(1)} → ${last.tsb.toFixed(1)}), ATL caindo.`,
      };
    }
  }

  if (atlFalling && last.tsb > prev14.tsb) {
    return {
      detected: true,
      phase: "pre-taper",
      reason: "Sinais iniciais de redução de carga. Possível início de taper.",
    };
  }

  return { detected: false, phase: "none", reason: "Sem padrão de taper detectado." };
}

export interface UndertrainingSignal {
  detected: boolean;
  reason: string;
}

/**
 * Detecção de destreinamento/subtreinamento.
 * Critérios (Mujika & Padilla 2000, Fleck 1994):
 * 1. TSB > 25 persistentemente (carga muito baixa)
 * 2. CTL em queda por ≥7 dias
 * 3. TSS semanal < 30% do histórico médio
 */
export function detectUndertraining(series: LoadDay[]): UndertrainingSignal {
  if (series.length < 7) {
    return { detected: false, reason: "Dados insuficientes." };
  }

  const last = series[series.length - 1];
  const prev7 = series[series.length - 8] ?? series[0];

  // Critério 1: TSB muito positivo + CTL caindo
  if (last.tsb > 25 && last.ctl < prev7.ctl) {
    return {
      detected: true,
      reason: `TSB ${last.tsb.toFixed(1)} com CTL caindo — carga insuficiente para manter adaptações.`,
    };
  }

  // Critério 2: CTL em queda por ≥7 dias consecutivos
  const last7 = series.slice(-7);
  const ctlDeclining = last7.every(
    (d, i) => i === 0 || d.ctl <= last7[i - 1].ctl,
  );
  if (ctlDeclining && last.tsb > 10) {
    return {
      detected: true,
      reason: "CTL em declínio por 7 dias consecutivos com TSB positivo — possível destreinamento.",
    };
  }

  // Critério 3: TSS semanal muito baixo comparado ao histórico
  if (series.length >= 28) {
    const weekTss = series.slice(-7).reduce((s, d) => s + d.tss, 0);
    const monthTss = series.slice(-28).reduce((s, d) => s + d.tss, 0);
    const avgWeekTss = monthTss / 4;
    if (avgWeekTss > 0 && weekTss < avgWeekTss * 0.4) {
      return {
        detected: true,
        reason: `TSS semanal (${weekTss.toFixed(0)}) apenas ${Math.round((weekTss / avgWeekTss) * 100)}% da média mensal — volume muito reduzido.`,
      };
    }
  }

  return { detected: false, reason: "Sem sinais de destreinamento." };
}
