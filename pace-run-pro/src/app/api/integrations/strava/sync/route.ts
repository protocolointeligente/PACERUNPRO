import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  StravaApiError,
  fetchStravaActivities,
  refreshStravaToken,
  type StravaActivity,
} from "@/lib/integrations/strava";
import { decrypt, encrypt } from "@/lib/encryption";

function stravaTypeToWorkoutType(type: string): string {
  switch (type) {
    case "Run":           return "RODAGEM_LEVE";
    case "TrailRun":      return "SUBIDA";
    case "VirtualRun":    return "RODAGEM_LEVE";
    case "Ride":          return "RODAGEM_LEVE";
    case "Swim":          return "RODAGEM_LEVE";
    case "WeightTraining":return "FORCA";
    case "Workout":       return "FUNCIONAL";
    default:              return "RODAGEM_LEVE";
  }
}

async function persistActivity(athleteId: string, activity: StravaActivity, workoutId: string | null) {
  const stravaId = String(activity.id);
  const exists = await prisma.workoutLog.findUnique({
    where: { stravaActivityId: stravaId },
    select: { id: true },
  });
  if (exists) return false;

  const distKm = activity.distance / 1000;
  const avgPace = distKm > 0 && activity.moving_time > 0
    ? Math.round(activity.moving_time / distKm)
    : null;

  await prisma.workoutLog.create({
    data: {
      workoutId: workoutId ?? undefined,
      athleteId,
      source: "strava",
      stravaActivityId: stravaId,
      startedAt: new Date(activity.start_date),
      distanceKm: distKm,
      durationSec: activity.moving_time,
      avgPaceSecPerKm: avgPace,
      avgHr: activity.average_heartrate ?? null,
      maxHr: activity.max_heartrate ?? null,
      elevationGainM: activity.total_elevation_gain ?? null,
      calories: activity.calories ?? null,
      cadence: activity.average_cadence ?? null,
    },
  });
  return true;
}

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const device = await prisma.connectedDevice.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: "STRAVA" } },
  });
  if (!device?.accessToken) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "athlete_not_found" }, { status: 404 });

  let accessToken = decrypt(device.accessToken);

  let activities: StravaActivity[];
  try {
    activities = await fetchStravaActivities(accessToken, 30);
  } catch (err) {
    if (err instanceof StravaApiError && err.status === 401 && device.refreshToken) {
      const refreshed = await refreshStravaToken(decrypt(device.refreshToken));
      accessToken = refreshed.access_token;
      await prisma.connectedDevice.update({
        where: { id: device.id },
        data: {
          accessToken: encrypt(refreshed.access_token),
          refreshToken: encrypt(refreshed.refresh_token),
        },
      });
      activities = await fetchStravaActivities(accessToken, 30);
    } else {
      console.error("[strava sync]", err);
      return NextResponse.json({ error: "sync_failed" }, { status: 502 });
    }
  }

  let synced = 0;
  for (const activity of activities) {
    const actDate = new Date(activity.start_date);
    const windowStart = new Date(actDate.getTime() - 12 * 60 * 60 * 1000);
    const windowEnd   = new Date(actDate.getTime() + 12 * 60 * 60 * 1000);

    const nearest = await prisma.workout.findFirst({
      where: {
        week: { plan: { athleteId: athlete.id } },
        date: { gte: windowStart, lte: windowEnd },
        status: { in: ["AGENDADO", "LIBERADO"] },
      },
      orderBy: { date: "asc" },
      select: { id: true },
    });

    const created = await persistActivity(athlete.id, activity, nearest?.id ?? null);
    if (created) synced++;
  }

  const now = new Date();
  await prisma.connectedDevice.update({
    where: { id: device.id },
    data: { lastSyncAt: now },
  });

  return NextResponse.json({
    ok: true,
    synced,
    total: activities.length,
    lastSyncAt: now.toISOString(),
  });
}
