import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  StravaApiError,
  fetchStravaActivity,
  refreshStravaToken,
} from "@/lib/integrations/strava";
import { decrypt, encrypt } from "@/lib/encryption";

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ?? "pace-run-pro-strava";

// Strava sends GET to verify the subscription endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

// Strava sends POST for every new activity
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    object_type: string;
    object_id: number;
    aspect_type: string;
    owner_id: number;
    event_time: number;
  };

  // Only handle new activity creation
  if (body.object_type !== "activity" || body.aspect_type !== "create") {
    return NextResponse.json({ ok: true });
  }

  const stravaAthleteId = String(body.owner_id);
  const stravaActivityId = String(body.object_id);

  // Skip if already processed
  const existing = await prisma.workoutLog.findUnique({
    where: { stravaActivityId },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true });

  // Find connected device by Strava athlete ID
  const device = await prisma.connectedDevice.findFirst({
    where: { provider: "STRAVA", externalId: stravaAthleteId },
  });
  if (!device?.accessToken) return NextResponse.json({ ok: true });

  const athlete = await prisma.athlete.findUnique({
    where: { userId: device.userId },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ ok: true });

  let accessToken = decrypt(device.accessToken);

  try {
    let activity;
    try {
      activity = await fetchStravaActivity(stravaActivityId, accessToken);
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
        activity = await fetchStravaActivity(stravaActivityId, accessToken);
      } else {
        throw err;
      }
    }

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

    const distKm = activity.distance / 1000;
    await prisma.workoutLog.create({
      data: {
        workoutId: nearest?.id ?? undefined,
        athleteId: athlete.id,
        source: "strava",
        stravaActivityId,
        startedAt: actDate,
        distanceKm: distKm,
        durationSec: activity.moving_time,
        avgPaceSecPerKm: distKm > 0 && activity.moving_time > 0
          ? Math.round(activity.moving_time / distKm)
          : null,
        avgHr: activity.average_heartrate ?? null,
        maxHr: activity.max_heartrate ?? null,
        elevationGainM: activity.total_elevation_gain ?? null,
        calories: activity.calories ?? null,
        cadence: activity.average_cadence ?? null,
      },
    });

    await prisma.connectedDevice.update({
      where: { id: device.id },
      data: { lastSyncAt: new Date() },
    });
  } catch (err) {
    console.error("[strava webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
