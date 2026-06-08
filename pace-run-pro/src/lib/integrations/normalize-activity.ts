import type { SyncedActivity } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";

export interface NormalizedActivity {
  id: string;
  source: SyncedActivity["source"];
  title: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  pace: string;          // formatted "M:SS/km"
  avgHrBpm: number;
  maxHrBpm: number;
  elevationM: number;
  calories: number;
  cadenceAvg?: number;
  estimatedRpe: number;  // derived from HR drift
  matchedWorkoutId?: string;
  autoCheckInFilled: boolean;
}

export function normalizeActivity(raw: SyncedActivity, maxHrRef = 188): NormalizedActivity {
  const durationMin = Math.round(raw.durationSec / 60);
  const pace = formatPace(raw.avgPaceSecPerKm);
  // Estimate RPE from average HR as % of maxHR (Borg scale approximation)
  const hrPct = raw.avgHrBpm / maxHrRef;
  const estimatedRpe = Math.min(10, Math.max(1, Math.round(hrPct * 14)));
  return {
    id: raw.id,
    source: raw.source,
    title: raw.title,
    date: raw.date,
    distanceKm: raw.distanceKm,
    durationMin,
    pace,
    avgHrBpm: raw.avgHrBpm,
    maxHrBpm: raw.maxHrBpm,
    elevationM: raw.elevationM,
    calories: raw.calories,
    cadenceAvg: raw.cadenceAvg,
    estimatedRpe,
    matchedWorkoutId: raw.matchedWorkoutId,
    autoCheckInFilled: raw.autoCheckInFilled,
  };
}

export function normalizeAll(activities: SyncedActivity[], maxHrRef?: number): NormalizedActivity[] {
  return activities.map((a) => normalizeActivity(a, maxHrRef));
}
