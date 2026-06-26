import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StravaApiError, fetchStravaActivity, refreshStravaToken } from "@/lib/integrations/strava";
import { decrypt, encrypt } from "@/lib/encryption";

// Strava sends a GET to verify the webhook subscription
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Strava sends POST for new/updated activities
export async function POST(request: NextRequest) {
  // Validate secret embedded in webhook URL (registered with ?secret=TOKEN)
  const secret = new URL(request.url).searchParams.get("secret");
  const expectedSecret = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as {
    object_type?: string;
    object_id?: number;
    aspect_type?: string;
    owner_id?: number;
  };

  const { object_type, object_id, aspect_type, owner_id } = body;

  // Only process new activity events
  if (object_type !== "activity" || aspect_type !== "create") {
    return NextResponse.json({ status: "ignored" });
  }

  // Find the connected device by Strava athlete ID
  const device = await prisma.connectedDevice.findFirst({
    where: { provider: "STRAVA", externalId: String(owner_id) },
    include: { user: { include: { athlete: true } } },
  });

  if (!device?.accessToken || !device.user.athlete) {
    console.warn("[strava webhook] device or athlete not found for owner_id", owner_id);
    return NextResponse.json({ status: "not_found" });
  }

  const athlete = device.user.athlete;

  // Fetch full activity, refreshing token if needed
  let accessToken = decrypt(device.accessToken);
  let activity;
  try {
    activity = await fetchStravaActivity(String(object_id), accessToken);
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
      activity = await fetchStravaActivity(String(object_id), accessToken);
    } else {
      console.error("[strava webhook] failed to fetch activity", err);
      return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
    }
  }

  // Find a workout scheduled for the same calendar day
  const activityDate = new Date(activity.start_date);
  const dayStart = new Date(activityDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(activityDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const matchedWorkout = await prisma.workout.findFirst({
    where: {
      week: {
        plan: { athleteId: athlete.id },
        released: true,
      },
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["LIBERADO", "AGENDADO"] },
    },
    orderBy: { date: "asc" },
  });

  const distanceKm = activity.distance > 0 ? activity.distance / 1000 : null;
  const avgPaceSecPerKm =
    distanceKm && distanceKm > 0 && activity.moving_time > 0
      ? Math.round(activity.moving_time / distanceKm)
      : null;

  if (matchedWorkout) {
    await prisma.$transaction([
      prisma.workoutLog.create({
        data: {
          workoutId: matchedWorkout.id,
          athleteId: athlete.id,
          startedAt: activityDate,
          finishedAt: new Date(activityDate.getTime() + activity.elapsed_time * 1000),
          distanceKm,
          durationSec: activity.moving_time || null,
          avgPaceSecPerKm,
          avgHr: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
          maxHr: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
          elevationGainM: activity.total_elevation_gain || null,
          cadence: activity.average_cadence ? Math.round(activity.average_cadence) : null,
          calories: activity.calories ? Math.round(activity.calories) : null,
        },
      }),
      prisma.workout.update({
        where: { id: matchedWorkout.id },
        data: { status: "CONCLUIDO" },
      }),
    ]);

    // Recalculate adherenceRate for last 28 days
    const since28d = new Date();
    since28d.setDate(since28d.getDate() - 28);

    const [totalScheduled, totalCompleted] = await Promise.all([
      prisma.workout.count({
        where: {
          week: { plan: { athleteId: athlete.id }, released: true },
          date: { gte: since28d },
        },
      }),
      prisma.workout.count({
        where: {
          week: { plan: { athleteId: athlete.id } },
          date: { gte: since28d },
          status: "CONCLUIDO",
        },
      }),
    ]);

    const adherenceRate = totalScheduled > 0 ? totalCompleted / totalScheduled : 0;
    await prisma.athlete.update({
      where: { id: athlete.id },
      data: { adherenceRate },
    });

    console.log(
      `[strava webhook] activity ${object_id} → workout ${matchedWorkout.id} CONCLUIDO | adherence ${Math.round(adherenceRate * 100)}%`
    );
  } else {
    console.log(
      `[strava webhook] activity ${object_id} on ${activityDate.toISOString()} — no matching workout for athlete ${athlete.id}`
    );
  }

  await prisma.connectedDevice.update({
    where: { id: device.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ status: "ok", matched: !!matchedWorkout });
}
