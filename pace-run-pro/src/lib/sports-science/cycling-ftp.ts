/**
 * Ciclismo — FTP, Potência Crítica, NP, IF e TSS de ciclismo.
 *
 * Referências:
 *   Allen & Coggan, "Training and Racing with a Power Meter" (2010)
 *   Monod & Scherrer (1965) — Modelo de Potência Crítica
 *
 * DISCLAIMER: Estimativas de suporte à decisão do treinador.
 * Não substituem avaliação profissional individualizada.
 */

// ── FTP 20 min ───────────────────────────────────────────────────────────────

/**
 * FTP estimado a partir de teste de 20 minutos.
 * FTP = potência média × 0.95
 *
 * Limitação: depende de pacing correto e pode super/subestimar o FTP real.
 */
export function ftpFrom20Min(avgWatts20min: number): number {
  if (avgWatts20min <= 0) return 0;
  return Math.round(avgWatts20min * 0.95);
}

// ── FTP Ramp Test ─────────────────────────────────────────────────────────────

/**
 * FTP estimado a partir do Ramp Test (último minuto completo sustentado).
 * FTP = melhor potência 1 min × 0.75
 *
 * Limitação: sensível ao perfil anaeróbio; pode superestimar em atletas explosivos.
 */
export function ftpFromRampTest(bestPower1min: number): number {
  if (bestPower1min <= 0) return 0;
  return Math.round(bestPower1min * 0.75);
}

// ── Potência Crítica — Modelo 2 parâmetros ───────────────────────────────────

export interface CriticalPowerResult {
  cp: number;      // Potência Crítica (W) — pode ser sustentada indefinidamente (teoricamente)
  wPrime: number;  // Reserva anaeróbia W' (joules)
}

/**
 * Potência Crítica calculada a partir de dois testes máximos.
 *
 * CP = (P1×t1 - P2×t2) / (t1 - t2)
 * W' = t1 × (P1 - CP)
 *
 * Onde P = potência média (W) e t = duração (segundos).
 * t1 > t2 (teste mais longo vem primeiro).
 *
 * Limitação: exige testes máximos bem executados. Recomendado: 5 min + 20 min.
 */
export function calculateCriticalPower(
  p1: number, t1Sec: number,
  p2: number, t2Sec: number,
): CriticalPowerResult {
  if (t1Sec === t2Sec || t1Sec <= 0 || t2Sec <= 0) {
    return { cp: 0, wPrime: 0 };
  }
  // Ensure t1 > t2 for conventional sign convention
  const [pLong, tLong, pShort, tShort] = t1Sec > t2Sec
    ? [p1, t1Sec, p2, t2Sec]
    : [p2, t2Sec, p1, t1Sec];

  const cp = (pLong * tLong - pShort * tShort) / (tLong - tShort);
  const wPrime = tShort * (pShort - cp);
  return {
    cp: Math.max(0, Math.round(cp)),
    wPrime: Math.max(0, Math.round(wPrime)),
  };
}

// ── Normalized Power (NP) ────────────────────────────────────────────────────

/**
 * Normalized Power a partir de uma série de potência por segundo (ou 1-s intervals).
 *
 * Algoritmo:
 *   1. Média móvel de 30 s
 *   2. Elevar à 4ª potência
 *   3. Média dos valores
 *   4. Raiz 4ª
 *
 * Limitação: usar apenas em séries com dados de potência confiáveis (min. 20 min).
 */
export function calculateNP(powerData: number[]): number {
  if (powerData.length < 30) return 0;

  const windowSize = 30;
  const smoothed: number[] = [];

  for (let i = windowSize - 1; i < powerData.length; i++) {
    const window = powerData.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((s, v) => s + v, 0) / windowSize;
    smoothed.push(avg);
  }

  const pow4 = smoothed.map((p) => Math.pow(p, 4));
  const meanPow4 = pow4.reduce((s, v) => s + v, 0) / pow4.length;
  return Math.round(Math.pow(meanPow4, 0.25));
}

// ── Intensity Factor (IF) ────────────────────────────────────────────────────

/**
 * IF = NP / FTP
 *
 * Interpretação:
 *   0.55–0.75: endurance leve/moderado
 *   0.76–0.90: tempo/sweet spot
 *   0.91–1.05: limiar
 *   > 1.05: alta intensidade
 */
export function calculateIF(np: number, ftp: number): number {
  if (ftp <= 0) return 0;
  return Math.round((np / ftp) * 1000) / 1000; // 3 casas decimais
}

// ── Bike TSS ─────────────────────────────────────────────────────────────────

/**
 * TSS de ciclismo por potência.
 *
 * TSS = (duraçãoSec × NP × IF) / (FTP × 3600) × 100
 *     = horas × IF² × 100
 *
 * Limitação: depende de FTP atualizado. FTP desatualizado distorce todos os valores.
 */
export function bikeTSS(durationSec: number, np: number, ftp: number): number {
  if (ftp <= 0 || durationSec <= 0) return 0;
  const if_ = np / ftp;
  return Math.round((durationSec * np * if_) / (ftp * 3600) * 100);
}

/**
 * TSS de ciclismo a partir de IF e duração (quando NP não está disponível).
 * TSS = horas × IF² × 100
 */
export function bikeTSSFromIF(durationSec: number, intensityFactor: number): number {
  if (durationSec <= 0 || intensityFactor <= 0) return 0;
  const hours = durationSec / 3600;
  return Math.round(hours * intensityFactor * intensityFactor * 100);
}

// ── Zonas de potência por %FTP ────────────────────────────────────────────────

export interface PowerZone {
  number: number;
  name: string;
  color: string;
  minPctFtp: number;
  maxPctFtp: number;
  minWatts: number;
  maxWatts: number;
  description: string;
}

/** Zonas de potência de ciclismo (7 zonas — Allen & Coggan). */
export function getBikePowerZones(ftp: number): PowerZone[] {
  const zones = [
    { number: 1, name: "Recuperação Ativa",      color: "#4ade80", minPct: 0,   maxPct: 55,  desc: "< 55% FTP — pedalada fácil para recuperação" },
    { number: 2, name: "Resistência",             color: "#38bdf8", minPct: 55,  maxPct: 75,  desc: "55–75% FTP — base aeróbica" },
    { number: 3, name: "Ritmo / Tempo",           color: "#34d399", minPct: 75,  maxPct: 90,  desc: "75–90% FTP — sweet spot e tempo" },
    { number: 4, name: "Limiar de Lactato",       color: "#fb923c", minPct: 90,  maxPct: 105, desc: "90–105% FTP — treino de limiar" },
    { number: 5, name: "VO2máx",                  color: "#f87171", minPct: 105, maxPct: 120, desc: "105–120% FTP — intervalados de VO2máx" },
    { number: 6, name: "Cap. Anaeróbica",         color: "#ef4444", minPct: 120, maxPct: 150, desc: "120–150% FTP — esforços anaeróbicos" },
    { number: 7, name: "Potência Neuromuscular",  color: "#dc2626", minPct: 150, maxPct: 999, desc: "> 150% FTP — sprints e acelerações" },
  ];

  return zones.map((z) => ({
    number:      z.number,
    name:        z.name,
    color:       z.color,
    minPctFtp:   z.minPct,
    maxPctFtp:   z.maxPct,
    minWatts:    z.minPct === 0 ? 0 : Math.round(ftp * z.minPct / 100),
    maxWatts:    z.maxPct >= 999 ? 9999 : Math.round(ftp * z.maxPct / 100),
    description: z.desc,
  }));
}

// ── FTP por peso corporal ────────────────────────────────────────────────────

/**
 * FTP relativo (W/kg) — indicador de performance em subidas.
 *
 * Classificação masculina (aproximada):
 *   < 2.0: sedentário
 *   2.0–3.0: ciclista recreativo
 *   3.0–4.0: treinado
 *   4.0–5.0: competidor categorial
 *   > 5.0: elite
 */
export function ftpPerKg(ftpWatts: number, weightKg: number): number {
  if (weightKg <= 0) return 0;
  return Math.round((ftpWatts / weightKg) * 100) / 100;
}
