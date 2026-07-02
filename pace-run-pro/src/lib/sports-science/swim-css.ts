/**
 * Natação — CSS (Critical Swim Speed), T-pace, sTSS e SWOLF.
 *
 * Referências:
 *   Wakayoshi et al. (1992) — Modelo de Velocidade Crítica de Natação
 *   Olbrecht (2000) — Swimming Science
 *
 * DISCLAIMER: Estimativas de suporte à decisão do treinador.
 * Não substituem avaliação individualizada por profissional qualificado.
 */

// ── CSS — Critical Swim Speed ─────────────────────────────────────────────────

export interface CSSResult {
  cssMetersPerSec: number;    // CSS em m/s
  cssPacePer100m: number;     // CSS em seg/100m (pace por 100m)
  cssPaceFormatted: string;   // "1:35/100m"
}

/**
 * CSS a partir do teste padrão 400m + 200m (natação).
 *
 * CSS (m/s) = (400 - 200) / (tempo400s - tempo200s)
 *
 * Exemplo: 400m em 360s, 200m em 170s
 *   CSS = 200 / (360 - 170) = 200 / 190 = 1.053 m/s
 *   Pace/100m = 100 / 1.053 = 95s = 1:35/100m
 *
 * Limitação: exige esforço máximo em ambos os tiros com descanso adequado entre eles.
 */
export function cssFrom400_200(time400mSec: number, time200mSec: number): CSSResult {
  if (time400mSec <= 0 || time200mSec <= 0 || time400mSec <= time200mSec) {
    return { cssMetersPerSec: 0, cssPacePer100m: 0, cssPaceFormatted: "—" };
  }
  const css = (400 - 200) / (time400mSec - time200mSec);
  return buildCSSResult(css);
}

/**
 * CSS a partir de 1000m máximo.
 * Aproximação: CSS ≈ velocidade média do teste × 0.96
 *
 * Limitação: menos preciso que o protocolo 400+200.
 */
export function cssFrom1000m(time1000mSec: number): CSSResult {
  if (time1000mSec <= 0) return { cssMetersPerSec: 0, cssPacePer100m: 0, cssPaceFormatted: "—" };
  const css = (1000 / time1000mSec) * 0.96;
  return buildCSSResult(css);
}

/**
 * CSS a partir do teste de 30 minutos.
 * CSS ≈ distância percorrida (m) / 1800s × 0.95
 *
 * Limitação: muito dependente de pacing; subestima em nadadores com capacidade de sprint.
 */
export function cssFrom30MinTest(distanceM: number): CSSResult {
  if (distanceM <= 0) return { cssMetersPerSec: 0, cssPacePer100m: 0, cssPaceFormatted: "—" };
  const css = (distanceM / 1800) * 0.95;
  return buildCSSResult(css);
}

function buildCSSResult(cssMs: number): CSSResult {
  if (cssMs <= 0) return { cssMetersPerSec: 0, cssPacePer100m: 0, cssPaceFormatted: "—" };
  const pacePer100m = Math.round(100 / cssMs);
  const min = Math.floor(pacePer100m / 60);
  const sec = pacePer100m % 60;
  return {
    cssMetersPerSec:  Math.round(cssMs * 1000) / 1000,
    cssPacePer100m:   pacePer100m,
    cssPaceFormatted: `${min}:${sec.toString().padStart(2, "0")}/100m`,
  };
}

// ── Swim TSS ──────────────────────────────────────────────────────────────────

/**
 * sTSS — Swim Stress Score simplificado.
 *
 * SwimIF = cssPacePer100m / avgPacePer100m
 * sTSS   = horas × SwimIF² × 100
 *
 * Se avgPace < CSS (mais rápido), SwimIF > 1 (sessão intensa).
 * Se avgPace > CSS (mais lento), SwimIF < 1 (sessão leve).
 *
 * Limitação: estimativa de campo. Pausa, viradas, equipamentos e técnica afetam o resultado.
 */
export function swimTSS(
  durationSec: number,
  avgPacePer100m: number,
  cssPacePer100m: number,
): number {
  if (durationSec <= 0 || avgPacePer100m <= 0 || cssPacePer100m <= 0) return 0;
  const swimIF = cssPacePer100m / avgPacePer100m;
  const hours = durationSec / 3600;
  return Math.round(hours * swimIF * swimIF * 100);
}

// ── Zonas de natação por % CSS ────────────────────────────────────────────────

export interface SwimZone {
  number: number;
  name: string;
  color: string;
  pctCssMin: number;
  pctCssMax: number;
  pacePer100mMin: number;  // pace mais lento (seg/100m) — menor intensidade
  pacePer100mMax: number;  // pace mais rápido (seg/100m) — maior intensidade
  description: string;
}

/**
 * Zonas de natação por % do CSS (pace).
 *
 * Nota: para pace, % maior = mais lento (inversão).
 * Z1 = ≥ 115% CSS = muito lento
 * Z5 = 90–100% CSS = ritmo máximo aeróbico
 */
export function getSwimZones(cssPacePer100m: number): SwimZone[] {
  const zones = [
    { n: 1, name: "Recuperação",         color: "#4ade80", minPct: 115, maxPct: 999, desc: "Fácil / técnica — recuperação ativa" },
    { n: 2, name: "Base Aeróbica",       color: "#38bdf8", minPct: 108, maxPct: 115, desc: "Ritmo longo e aeróbico" },
    { n: 3, name: "Desenvolvimento",     color: "#a78bfa", minPct: 103, maxPct: 108, desc: "Desenvolvimento aeróbico" },
    { n: 4, name: "Limiar / CSS",        color: "#fb923c", minPct: 100, maxPct: 103, desc: "Ritmo CSS — limiar anaeróbico" },
    { n: 5, name: "VO2máx / Competição", color: "#f87171", minPct: 90,  maxPct: 100, desc: "Velocidade de prova / sprints" },
  ];

  return zones.map((z) => ({
    number:        z.n,
    name:          z.name,
    color:         z.color,
    pctCssMin:     z.minPct,
    pctCssMax:     z.maxPct,
    // pace inversamente proporcional: % maior = pace mais lento
    pacePer100mMin: z.maxPct >= 999 ? 9999 : Math.round(cssPacePer100m * z.maxPct / 100),
    pacePer100mMax: Math.round(cssPacePer100m * z.minPct / 100),
    description:   z.desc,
  }));
}

// ── T-pace ────────────────────────────────────────────────────────────────────

/**
 * T-pace (Threshold Pace) = CSS pace arredondado para o intervalo de 5s mais próximo.
 * Usado como referência para séries de limiar.
 */
export function tPaceFromCSS(cssPacePer100m: number): number {
  return Math.round(cssPacePer100m / 5) * 5;
}

// ── SWOLF ─────────────────────────────────────────────────────────────────────

/**
 * SWOLF = tempo de nado por piscina (segundos) + número de braçadas.
 *
 * Uso: indicador de eficiência técnica. Menor = melhor.
 *
 * Limitação: comparar apenas o MESMO atleta, MESMA piscina e MESMO estilo.
 * Não usar para comparar atletas diferentes.
 */
export function calculateSwolf(timePerLengthSec: number, strokesPerLength: number): number {
  return timePerLengthSec + strokesPerLength;
}

/**
 * Interpreta a variação do SWOLF entre sessões do mesmo atleta.
 * Positivo = melhora na eficiência.
 */
export function swolfDelta(current: number, previous: number): {
  delta: number;
  improved: boolean;
  pct: number;
} {
  const delta = previous - current; // positivo = melhora
  return {
    delta,
    improved: delta > 0,
    pct: previous > 0 ? Math.round((delta / previous) * 100) : 0,
  };
}

// ── Conversões de pace de natação ─────────────────────────────────────────────

/** Formata pace em seg/100m para "M:SS/100m". */
export function formatSwimPace(secPer100m: number): string {
  if (secPer100m <= 0) return "—";
  const min = Math.floor(secPer100m / 60);
  const sec = secPer100m % 60;
  return `${min}:${sec.toString().padStart(2, "0")}/100m`;
}

/** Converte pace por 100m para velocidade em m/s. */
export function swimPaceToMs(secPer100m: number): number {
  if (secPer100m <= 0) return 0;
  return Math.round((100 / secPer100m) * 1000) / 1000;
}

/** Converte velocidade m/s para pace sec/100m. */
export function msToPace(metersPerSec: number): number {
  if (metersPerSec <= 0) return 0;
  return Math.round(100 / metersPerSec);
}
