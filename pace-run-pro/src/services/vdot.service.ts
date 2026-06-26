/**
 * VDOT Service
 * Encapsulates VDOT computation and AthleteLoadParams upsert.
 * Extracted from API route layer to enable reuse across endpoints.
 */
import { prisma } from "@/lib/prisma";
import { calculateVDOT, getTrainingPaces, parseRaceTime } from "@/lib/vdot";

/**
 * Parses a race result, computes VDOT, and upserts the athlete's
 * threshold pace into AthleteLoadParams.
 * Silently returns null if the resultTime format is invalid.
 */
export async function upsertVdotFromResult(
  athleteId: string,
  distanceKm: number,
  resultTime: string,
): Promise<number | null> {
  try {
    const timeSec = parseRaceTime(resultTime);
    const vdot = calculateVDOT(distanceKm * 1000, timeSec);
    const paces = getTrainingPaces(vdot);
    const thresholdPaceSecPerKm = Math.round(paces.T.fastSecPerKm);

    await prisma.athleteLoadParams.upsert({
      where: { athleteId },
      create: { athleteId, thresholdPaceSecPerKm },
      update: { thresholdPaceSecPerKm },
    });

    return vdot;
  } catch {
    return null;
  }
}
