// Fórmulas de Daniels & Gilbert (Jack Daniels' Running Formula, 2012)
// usadas para estimar o VDOT (índice de capacidade aeróbica) a partir de um
// resultado de prova recente, e derivar as faixas de pace de treino
// E (fácil), M (maratona), T (limiar), I (intervalado) e R (repetição).

const VO2_A = 0.000104;
const VO2_B = 0.182258;
const VO2_C = 4.6;

// VO2 (ml/kg/min) exigido para sustentar uma velocidade (m/min)
function vo2FromVelocity(velocityMPerMin: number): number {
  return -VO2_C + VO2_B * velocityMPerMin + VO2_A * velocityMPerMin * velocityMPerMin;
}

// Inverso de vo2FromVelocity: velocidade (m/min) que exige um dado VO2
function velocityFromVO2(vo2: number): number {
  const c = -(VO2_C + vo2);
  return (-VO2_B + Math.sqrt(VO2_B * VO2_B - 4 * VO2_A * c)) / (2 * VO2_A);
}

// % do VO2máx que pode ser sustentado durante `timeMin` minutos
function percentVO2Max(timeMin: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin)
  );
}

/** Estima o VDOT a partir de um resultado de prova (distância em metros, tempo em segundos). */
export function calculateVDOT(distanceM: number, timeSec: number): number {
  if (distanceM <= 0 || timeSec <= 0) return 0;
  const timeMin = timeSec / 60;
  const velocity = distanceM / timeMin;
  return vo2FromVelocity(velocity) / percentVO2Max(timeMin);
}

/** Pace (segundos por km) correspondente a uma intensidade (% do VDOT/VO2máx). */
export function vdotPaceSecPerKm(vdot: number, intensity: number): number {
  const velocity = velocityFromVO2(vdot * intensity);
  return Math.round((1000 / velocity) * 60);
}

/** Converte "MM:SS" ou "H:MM:SS" em segundos. */
export function parseRaceTime(input: string): number {
  const parts = input.split(":").map(Number);
  if (parts.length === 0 || parts.some((p) => Number.isNaN(p))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

export type TrainingZoneId = "E" | "M" | "T" | "I" | "R";

export interface TrainingZone {
  id: TrainingZoneId;
  label: string;
  description: string;
  /** Intensidade mínima e máxima, em % do VDOT (VO2máx). */
  intensityMin: number;
  intensityMax: number;
  color: string;
}

export const TRAINING_ZONES: TrainingZone[] = [
  {
    id: "E",
    label: "Fácil (E)",
    description: "Rodagens leves, longões e regenerativos — constrói a base aeróbica.",
    intensityMin: 0.59,
    intensityMax: 0.74,
    color: "#84cc16",
  },
  {
    id: "M",
    label: "Maratona (M)",
    description: "Ritmo de maratona — sustentação metabólica em provas longas.",
    intensityMin: 0.75,
    intensityMax: 0.84,
    color: "#38bdf8",
  },
  {
    id: "T",
    label: "Limiar (T)",
    description: "Tempo runs e cruise intervals — eleva o limiar de lactato.",
    intensityMin: 0.83,
    intensityMax: 0.88,
    color: "#eab308",
  },
  {
    id: "I",
    label: "Intervalado (I)",
    description: "Tiros de 3-5 min — maximiza o consumo de VO2máx.",
    intensityMin: 0.95,
    intensityMax: 1.0,
    color: "#f97316",
  },
  {
    id: "R",
    label: "Repetição (R)",
    description: "Tiros curtos e rápidos — economia de corrida e potência.",
    intensityMin: 1.05,
    intensityMax: 1.2,
    color: "#ef4444",
  },
];

export interface PaceRange {
  fastSecPerKm: number;
  slowSecPerKm: number;
}

/** Faixas de pace (seg/km) para cada zona de treino, dado um VDOT. */
export function getTrainingPaces(vdot: number): Record<TrainingZoneId, PaceRange> {
  const result = {} as Record<TrainingZoneId, PaceRange>;
  for (const zone of TRAINING_ZONES) {
    result[zone.id] = {
      fastSecPerKm: vdotPaceSecPerKm(vdot, zone.intensityMax),
      slowSecPerKm: vdotPaceSecPerKm(vdot, zone.intensityMin),
    };
  }
  return result;
}

export const RACE_DISTANCES = [
  { id: "1500", label: "1.500 m", meters: 1500 },
  { id: "3000", label: "3 km", meters: 3000 },
  { id: "5000", label: "5 km", meters: 5000 },
  { id: "10000", label: "10 km", meters: 10000 },
  { id: "15000", label: "15 km", meters: 15000 },
  { id: "21097", label: "Meia maratona", meters: 21097 },
  { id: "42195", label: "Maratona", meters: 42195 },
] as const;
