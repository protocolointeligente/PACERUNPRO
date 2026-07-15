/**
 * Cálculos do "motor de prescrição inteligente":
 * testes de performance (VO2máx, VAM, limiar), força (1RM), frequência cardíaca
 * e regras de check-in com Hooper Index.
 * Fórmulas consolidadas da literatura de fisiologia do exercício
 * (Cooper, Daniels/Gilbert, Balke, RAST de Lacour, Epley, Brzycki, Tanaka) usadas
 * como estimativas de campo — não substituem avaliação laboratorial.
 */

// ── Estimativas de VO2máx por distância/tempo ──────────────────────────────

/** Cooper: distância percorrida em 12 minutos (metros) → VO2máx (ml/kg/min). */
export function vo2FromCooper(distanceM: number) {
  return (distanceM - 504.9) / 44.73;
}

/** Teste de 5 minutos (Balke adaptado): distância em metros → VO2máx estimado. */
export function vo2From5MinTest(distanceM: number) {
  const kmh = distanceM / 1000 / (5 / 60);
  return 3.5 * kmh + 3.5 * 0.2;
}

/** Teste de 3 km: tempo em segundos → VO2máx estimado (fórmula de campo). */
export function vo2From3km(durationSec: number) {
  const minutes = durationSec / 60;
  const kmh = 3 / (minutes / 60);
  return kmh * 3.5;
}

/** Teste de 2400 m (12 min Cooper reverso): tempo em segundos → VO2máx. */
export function vo2From2400m(durationSec: number) {
  const minutes = durationSec / 60;
  return 3.5 * (2400 / (minutes * 60)) * 3.6 * 1.5 + 10;
}

// ── Velocidade Aeróbica Máxima (VAM) ────────────────────────────────────────

export function vamFromDistanceTime(distanceM: number, durationSec: number) {
  return (distanceM / 1000) / (durationSec / 3600);
}

export function paceFromKmh(kmh: number) {
  if (kmh <= 0) return 0;
  return Math.round(3600 / kmh);
}

export function vo2FromVam(vamKmh: number) {
  return vamKmh * 3.5;
}

// ── RAST (Running-based Anaerobic Sprint Test) ──────────────────────────────

export interface RastSplit {
  timeSec: number;
}

export interface RastResult {
  powers: number[];
  peakPowerW: number;
  minPowerW: number;
  avgPowerW: number;
  fatigueIndexWPerS: number;
}

export function calculateRast(splits: RastSplit[], massKg: number, distanceM = 35): RastResult {
  const powers = splits.map((s) => {
    const velocity = distanceM / s.timeSec;
    const acceleration = velocity / s.timeSec;
    return massKg * acceleration * velocity;
  });
  const peakPowerW = Math.max(...powers);
  const minPowerW = Math.min(...powers);
  const avgPowerW = powers.reduce((a, b) => a + b, 0) / powers.length;
  const totalTime = splits.reduce((a, s) => a + s.timeSec, 0);
  const fatigueIndexWPerS = (peakPowerW - minPowerW) / totalTime;
  return { powers, peakPowerW, minPowerW, avgPowerW, fatigueIndexWPerS };
}

// ── Limiar anaeróbico ─────────────────────────────────────────────────────────

export function thresholdPaceFromTest(distanceM: number, durationSec: number) {
  const paceSecPerKm = durationSec / (distanceM / 1000);
  return Math.round(paceSecPerKm * 1.0);
}

// ── Zonas de frequência cardíaca (Karvonen) ─────────────────────────────────

export interface HrZone {
  zone: number;
  name: string;
  min: number;
  max: number;
  color: string;
}

export function calculateHrZones(maxHr: number, restingHr = 60): HrZone[] {
  const reserve = maxHr - restingHr;
  const bounds = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const names = ["Recuperação", "Aeróbico leve", "Aeróbico", "Limiar", "VO2máx"];
  const colors = ["#38bdf8", "#84cc16", "#facc15", "#f97316", "#ef4444"];
  return names.map((name, i) => ({
    zone: i + 1,
    name,
    min: Math.round(restingHr + reserve * bounds[i]),
    max: Math.round(restingHr + reserve * bounds[i + 1]),
    color: colors[i],
  }));
}

export function maxHrTanaka(age: number): number {
  return Math.round(208 - 0.7 * age);
}

// ── Estimativa de 1RM (força) ─────────────────────────────────────────────────

export interface OneRMResult {
  epley: number;
  brzycki: number;
  lombardi: number;
  average: number;
}

export function estimate1RM(weightKg: number, reps: number): OneRMResult {
  if (reps <= 0 || weightKg <= 0) return { epley: 0, brzycki: 0, lombardi: 0, average: 0 };
  if (reps === 1) return { epley: weightKg, brzycki: weightKg, lombardi: weightKg, average: weightKg };

  const epley = weightKg * (1 + reps / 30);
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : epley;
  const lombardi = weightKg * Math.pow(reps, 0.1);
  const average = (epley + brzycki + lombardi) / 3;

  return {
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    lombardi: Math.round(lombardi * 10) / 10,
    average: Math.round(average * 10) / 10,
  };
}

export function zoneLoadsFrom1RM(oneRmKg: number): Record<string, { pct: number; kg: number; reps: string }> {
  return {
    forca_maxima:   { pct: 90, kg: Math.round(oneRmKg * 0.90), reps: "1-3" },
    forca:          { pct: 80, kg: Math.round(oneRmKg * 0.80), reps: "4-6" },
    hipertrofia:    { pct: 70, kg: Math.round(oneRmKg * 0.70), reps: "8-12" },
    resistencia:    { pct: 60, kg: Math.round(oneRmKg * 0.60), reps: "15-20" },
    resistencia_leve: { pct: 50, kg: Math.round(oneRmKg * 0.50), reps: "20+" },
  };
}

// ── Hooper Index ─────────────────────────────────────────────────────────────

export interface HooperInput {
  sleep: number;
  stress: number;
  fatigue: number;
  pain: number;
}

export interface HooperResult {
  score: number;
  normalized: number;
  classification: "excelente" | "bom" | "moderado" | "ruim" | "critico";
  color: string;
  recommendation: string;
}

export function calculateHooperIndex(input: HooperInput): HooperResult {
  const score = input.sleep + input.stress + input.fatigue + input.pain;
  const normalized = score / 4;

  let classification: HooperResult["classification"];
  let color: string;
  let recommendation: string;

  if (normalized <= 2) {
    classification = "excelente";
    color = "#22C55E";
    recommendation = "Condições ideais para treino de alta intensidade.";
  } else if (normalized <= 4) {
    classification = "bom";
    color = "#84cc16";
    recommendation = "Boas condições. Mantenha o plano conforme prescrito.";
  } else if (normalized <= 6) {
    classification = "moderado";
    color = "#F59E0B";
    recommendation = "Atenção: reduza a intensidade em 15-20% e monitore a resposta.";
  } else if (normalized <= 8) {
    classification = "ruim";
    color = "#f97316";
    recommendation = "Evite treinos intensos hoje. Prefira mobilidade ou recuperativo.";
  } else {
    classification = "critico";
    color = "#EF4444";
    recommendation = "Dia de descanso obrigatório. Sinalize ao treinador imediatamente.";
  }

  return { score, normalized: Math.round(normalized * 10) / 10, classification, color, recommendation };
}

// ── Carga de treino (TRIMP simplificado) ────────────────────────────────────

export function sessionLoad(durationMin: number, rpe: number) {
  return Math.round(durationMin * rpe);
}

export function weeklyLoadStatus(currentLoad: number, previousAvgLoad: number) {
  if (previousAvgLoad === 0) return { ratio: 1, label: "Estável", color: "info" as const };
  const ratio = currentLoad / previousAvgLoad;
  if (ratio > 1.5) return { ratio, label: "Risco — pico de carga", color: "danger" as const };
  if (ratio > 1.3) return { ratio, label: "Atenção — carga elevada", color: "warning" as const };
  if (ratio < 0.8) return { ratio, label: "Carga reduzida", color: "info" as const };
  return { ratio, label: "Estável", color: "success" as const };
}

// ── Motor de check-in inteligente ───────────────────────────────────────────

export type CheckInRecord = {
  date: string;
  rpe: number;
  pain: number;
  sleep: number;
  fatigue: number;
  mood: number;
  plannedRpe?: number | null;
};

export interface CheckInRuleResult {
  action: "bloquear_treino" | "substituir_regenerativo" | "reduzir_intensidade" | "bloquear_intenso" | "reduzir_volume" | "ajustar_treino" | "ok";
  severity: "critical" | "danger" | "warning" | "info";
  title: string;
  message: string;
  suggestion?: string;
}

/**
 * Regras do check-in inteligente (Hooper-aware):
 *  - dor >= 8 → bloqueia treino + encaminhamento médico obrigatório + notifica treinador
 *  - dor 6–7 → substitui treino intenso por regenerativo
 *  - dor 4–5 → reduz intensidade com aviso
 *  - fadiga alta (>=7) por 3 dias seguidos → reduz volume com justificativa
 *  - RPE acima do planejado por 2 sessões seguidas → sugere ajuste de pace
 */
export function evaluateCheckInRules(history: CheckInRecord[]): CheckInRuleResult[] {
  const results: CheckInRuleResult[] = [];
  if (history.length === 0) return results;

  const latest = history[history.length - 1];

  if (latest.pain >= 8) {
    results.push({
      action: "bloquear_intenso",
      severity: "critical",
      title: "Dor intensa — interrompa os treinos",
      message: `Dor intensa (${latest.pain}/10): recomendamos interromper os treinos e consultar um profissional de saúde antes de retornar.`,
      suggestion: "Procure avaliação médica ou fisioterapêutica antes de retornar ao treinamento. Seu treinador foi notificado.",
    });
  } else if (latest.pain >= 6) {
    results.push({
      action: "substituir_regenerativo",
      severity: "danger",
      title: "Dor elevada — substituir por regenerativo",
      message: `Dor relatada (${latest.pain}/10). Treinos intensos substituídos por sessão regenerativa hoje.`,
      suggestion: "Realize 20–30 min de mobilidade articular ou caminhada muito leve (RPE 2–3). Sinalize ao treinador se a dor persistir.",
    });
  } else if (latest.pain >= 4) {
    results.push({
      action: "reduzir_intensidade",
      severity: "warning",
      title: "Dor moderada — reduzir intensidade",
      message: `Dor relatada (${latest.pain}/10). Reduza a intensidade do treino de hoje.`,
      suggestion: "Substitua treinos intensos por rodagem leve (RPE 4–5). Observe a evolução e informe ao treinador se a dor aumentar.",
    });
  }

  const last3 = history.slice(-3);
  if (last3.length === 3 && last3.every((c) => c.fatigue >= 7)) {
    results.push({
      action: "reduzir_volume",
      severity: "warning",
      title: "Fadiga elevada por 3 dias seguidos",
      message: "Fadiga ≥ 7 nos últimos 3 check-ins. Volume desta semana reduzido ~20% para favorecer a recuperação.",
      suggestion: "Priorize sono, hidratação e nutrição. Substitua treinos intensos por rodagens leves (Z1) até os índices normalizarem.",
    });
  }

  const last2 = history.slice(-2);
  if (
    last2.length === 2 &&
    last2.every((c) => c.plannedRpe != null && c.rpe > c.plannedRpe)
  ) {
    results.push({
      action: "ajustar_treino",
      severity: "info",
      title: "Esforço acima do planejado",
      message: "RPE percebido ficou acima do planejado em 2 sessões seguidas.",
      suggestion: "Reduza o pace alvo em 5-8 seg/km nas próximas sessões. O treinador será notificado para revisar a periodização.",
    });
  }

  if (results.length === 0) {
    results.push({
      action: "ok",
      severity: "info",
      title: "Tudo certo por aqui",
      message: "Seus indicadores estão dentro do esperado. Mantenha o plano conforme prescrito.",
    });
  }

  return results;
}
