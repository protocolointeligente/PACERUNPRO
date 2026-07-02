/**
 * Carga de treinamento por janelas fixas (soma acumulada).
 * Útil para relatórios e visualizações de volume absoluto por período.
 */

/**
 * Soma acumulada de TSS nos últimos `windowDays` dias a partir de hoje (inclusive).
 */
export function rollingLoad(
  dailyTss: Map<string, number>,
  windowDays: number,
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let total = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    total += dailyTss.get(d.toISOString().slice(0, 10)) ?? 0;
  }
  return Math.round(total * 10) / 10;
}

/** Carga semanal: soma dos últimos 7 dias. */
export function weeklyLoad(dailyTss: Map<string, number>): number {
  return rollingLoad(dailyTss, 7);
}

/** Carga mensal: soma dos últimos 28 dias. */
export function monthlyLoad(dailyTss: Map<string, number>): number {
  return rollingLoad(dailyTss, 28);
}

export interface RollingLoadSeries {
  date: string;       // YYYY-MM-DD
  tss: number;        // TSS do dia
  weekly: number;     // soma dos últimos 7 dias (inclusive)
  monthly: number;    // soma dos últimos 28 dias (inclusive)
}

/**
 * Gera série temporal com cargas rolantes para cada dia presente no mapa.
 * Útil para charts de volume.
 */
export function computeRollingLoadSeries(
  dailyTss: Map<string, number>,
  outputDays = 90,
): RollingLoadSeries[] {
  if (dailyTss.size === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: RollingLoadSeries[] = [];

  for (let i = outputDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    // Snapshot the "today" reference at this date for rolling windows
    const snapshotMap = new Map<string, number>();
    for (let j = 0; j < 28; j++) {
      const past = new Date(d);
      past.setDate(past.getDate() - j);
      const key = past.toISOString().slice(0, 10);
      const val = dailyTss.get(key);
      if (val !== undefined) snapshotMap.set(key, val);
    }

    // Build a rolling sum relative to this date
    let w = 0;
    let m = 0;
    for (let j = 0; j < 28; j++) {
      const past = new Date(d);
      past.setDate(past.getDate() - j);
      const v = dailyTss.get(past.toISOString().slice(0, 10)) ?? 0;
      if (j < 7) w += v;
      m += v;
    }

    result.push({
      date: dateStr,
      tss: dailyTss.get(dateStr) ?? 0,
      weekly: Math.round(w * 10) / 10,
      monthly: Math.round(m * 10) / 10,
    });
  }

  return result;
}
