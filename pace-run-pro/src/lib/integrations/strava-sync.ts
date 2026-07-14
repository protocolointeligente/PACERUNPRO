import { prisma } from "@/lib/prisma";
import { type StravaActivity } from "@/lib/integrations/strava";

export function stravaTypeToWorkoutType(type: string): string {
  switch (type) {
    case "Run": return "RODAGEM_LEVE";
    case "TrailRun": return "SUBIDA";
    case "VirtualRun": return "RODAGEM_LEVE";
    case "Ride": return "RODAGEM_LEVE";
    case "Swim": return "RODAGEM_LEVE";
    case "WeightTraining": return "FORCA";
    case "Workout": return "FUNCIONAL";
    default: return "RODAGEM_LEVE";
  }
}

export async function findMatchingWorkout(athleteId: string, activity: StravaActivity) {
  const actDate = new Date(activity.start_date);
  const windowStart = new Date(actDate.getTime() - 12 * 60 * 60 * 1000);
  const windowEnd = new Date(actDate.getTime() + 12 * 60 * 60 * 1000);

  return prisma.workout.findFirst({
    where: {
      week: { plan: { athleteId } },
      date: { gte: windowStart, lte: windowEnd },
      status: { in: ["AGENDADO", "LIBERADO", "AJUSTADO"] },
    },
    orderBy: { date: "asc" },
    select: { id: true },
  });
}

export async function updateAthleteAdherenceFromWorkouts(athleteId: string) {
  const since28d = new Date();
  since28d.setDate(since28d.getDate() - 28);

  const [totalScheduled, totalCompleted] = await Promise.all([
    prisma.workout.count({
      where: {
        week: { plan: { athleteId }, released: true },
        date: { gte: since28d },
      },
    }),
    prisma.workout.count({
      where: {
        week: { plan: { athleteId } },
        date: { gte: since28d },
        status: "CONCLUIDO",
      },
    }),
  ]);

  const adherenceRate = totalScheduled > 0 ? totalCompleted / totalScheduled : 0;
  await prisma.athlete.update({ where: { id: athleteId }, data: { adherenceRate } });
  return adherenceRate;
}

export async function persistStravaActivity(athleteId: string, activity: StravaActivity) {
  const stravaActivityId = String(activity.id);
  const existing = await prisma.workoutLog.findUnique({
    where: { stravaActivityId },
    select: { id: true, workoutId: true },
  });
  if (existing) return { created: false, matched: Boolean(existing.workoutId), workoutId: existing.workoutId };

  const matchedWorkout = await findMatchingWorkout(athleteId, activity);
  const activityDate = new Date(activity.start_date);
  const distanceKm = activity.distance > 0 ? activity.distance / 1000 : null;
  const avgPaceSecPerKm = distanceKm && distanceKm > 0 && activity.moving_time > 0
    ? Math.round(activity.moving_time / distanceKm)
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.workoutLog.create({
      data: {
        workoutId: matchedWorkout?.id,
        athleteId,
        source: "strava",
        stravaActivityId,
        startedAt: activityDate,
        finishedAt: activity.elapsed_time ? new Date(activityDate.getTime() + activity.elapsed_time * 1000) : null,
        distanceKm,
        durationSec: activity.moving_time || null,
        avgPaceSecPerKm,
        avgHr: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
        maxHr: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
        elevationGainM: activity.total_elevation_gain ?? null,
        cadence: activity.average_cadence ? Math.round(activity.average_cadence) : null,
        calories: activity.calories ? Math.round(activity.calories) : null,
      },
    });

    if (matchedWorkout?.id) {
      await tx.workout.update({
        where: { id: matchedWorkout.id },
        data: { status: "CONCLUIDO" },
      });
    }
  });

  if (matchedWorkout?.id) await updateAthleteAdherenceFromWorkouts(athleteId);

  return { created: true, matched: Boolean(matchedWorkout?.id), workoutId: matchedWorkout?.id ?? null };
}
