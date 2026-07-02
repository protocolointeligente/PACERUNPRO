/**
 * hrTRIMP de Edwards (1993) — Método por zonas de FC.
 * Cada minuto em zona é ponderado por um fator crescente:
 * Z1 (50-60% FCmax) ×1, Z2 (60-70%) ×2, Z3 (70-80%) ×3,
 * Z4 (80-90%) ×4, Z5 (90-100%) ×5.
 * Referência: Edwards S. (1993). The Heart Rate Monitor Book.
 */

export interface EdwardsZoneMinutes {
  z1: number; // minutos em Zona 1 (50–60% FCmax)
  z2: number; // minutos em Zona 2 (60–70% FCmax)
  z3: number; // minutos em Zona 3 (70–80% FCmax)
  z4: number; // minutos em Zona 4 (80–90% FCmax)
  z5: number; // minutos em Zona 5 (90–100% FCmax)
}

const ZONE_WEIGHTS = [1, 2, 3, 4, 5] as const;

/**
 * Calcula hrTRIMP pelo método de Edwards a partir de minutos por zona.
 * hrTRIMP = Σ (minutosZona_i × pesoZona_i)
 */
export function hrTRIMP(zones: EdwardsZoneMinutes): number {
  const minutes = [zones.z1, zones.z2, zones.z3, zones.z4, zones.z5];
  const total = minutes.reduce((sum, min, i) => sum + min * ZONE_WEIGHTS[i], 0);
  return Math.round(total * 10) / 10;
}

/**
 * Distribui o tempo total de uma sessão pelas zonas de FC usando FCmáx e FCmédia.
 * Estimativa simplificada para quando os dados por zona não estão disponíveis:
 * utiliza FCmédia para inferir a zona predominante e distribui 80% nessa zona
 * e 20% na zona adjacente inferior.
 */
export function estimateZoneMinutes(
  durationMin: number,
  avgHr: number,
  maxHr: number,
): EdwardsZoneMinutes {
  const pct = avgHr / maxHr;
  const zones: EdwardsZoneMinutes = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  if (pct >= 0.9) {
    zones.z5 = durationMin * 0.8;
    zones.z4 = durationMin * 0.2;
  } else if (pct >= 0.8) {
    zones.z4 = durationMin * 0.8;
    zones.z3 = durationMin * 0.2;
  } else if (pct >= 0.7) {
    zones.z3 = durationMin * 0.8;
    zones.z2 = durationMin * 0.2;
  } else if (pct >= 0.6) {
    zones.z2 = durationMin * 0.8;
    zones.z1 = durationMin * 0.2;
  } else {
    zones.z1 = durationMin;
  }

  return {
    z1: Math.round(zones.z1 * 10) / 10,
    z2: Math.round(zones.z2 * 10) / 10,
    z3: Math.round(zones.z3 * 10) / 10,
    z4: Math.round(zones.z4 * 10) / 10,
    z5: Math.round(zones.z5 * 10) / 10,
  };
}

/**
 * hrTRIMP de Edwards com fallback para estimativa a partir de FCmédia e FCmáx.
 */
export function hrTRIMPWithFallback(
  durationMin: number,
  options:
    | { zones: EdwardsZoneMinutes }
    | { avgHr: number; maxHr: number },
): number {
  if ("zones" in options) {
    return hrTRIMP(options.zones);
  }
  const estimated = estimateZoneMinutes(durationMin, options.avgHr, options.maxHr);
  return hrTRIMP(estimated);
}
