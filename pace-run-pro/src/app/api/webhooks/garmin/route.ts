import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { SportType } from "@prisma/client";

type GarminActivity = {
  activityId: string | number;
  userId: string;
  userAccessToken?: string;
  totalDistanceInMeters?: number;
  averageHeartRateInBeatsPerMinute?: number;
  totalDurationInSeconds?: number;
  activityType?: string;
  averageSpeedInMetersPerSecond?: number;
  startTimeInSeconds?: number;
};

function mapSport(activityType: string | undefined): SportType {
  switch (activityType?.toUpperCase()) {
    case "RUNNING":
      return SportType.RUN;
    case "CYCLING":
      return SportType.BIKE;
    case "SWIMMING":
      return SportType.SWIM;
    case "STRENGTH_TRAINING":
      return SportType.STRENGTH;
    default:
      return SportType.RUN;
  }
}

export async function POST(request: NextRequest) {
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  // Always require the secret — reject silently when not configured
  if (!consumerSecret) {
    console.warn("[garmin] GARMIN_CONSUMER_SECRET not configured — webhook rejected");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-garmin-signature") ?? "";
  const expected = createHmac("sha1", consumerSecret).update(rawBody).digest("hex");

  if (signature !== expected) {
    console.warn("[garmin] invalid signature");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody) as { activityFiles?: unknown[] };
    const activities = (body?.activityFiles ?? []) as GarminActivity[];

    for (const activity of activities) {
      const {
        activityId,
        userId: garminUserId,
        totalDistanceInMeters,
        averageHeartRateInBeatsPerMinute,
        totalDurationInSeconds,
        activityType,
        startTimeInSeconds,
      } = activity;

      const externalActivityIdStr = String(activityId);

      // Find the platform user linked to this Garmin account
      const device = await prisma.connectedDevice.findFirst({
        where: { provider: "GARMIN", externalId: garminUserId },
        select: { userId: true },
      });

      if (!device) {
        console.log(`[garmin] no device found for garmin userId=${garminUserId} — skipping`);
        continue;
      }

      // Find the athlete record for this user
      const athlete = await prisma.athlete.findUnique({
        where: { userId: device.userId },
        select: { id: true },
      });

      if (!athlete) {
        console.log(`[garmin] no athlete for userId=${device.userId} — skipping`);
        continue;
      }

      // Dedup: skip if we already persisted this activity
      const existing = await prisma.workoutLog.findFirst({
        where: { source: "garmin", externalActivityId: externalActivityIdStr },
        select: { id: true },
      });

      if (existing) {
        console.log(`[garmin] activity ${activityId} already persisted — skipping`);
        continue;
      }

      const distanceKm =
        totalDistanceInMeters != null ? totalDistanceInMeters / 1000 : undefined;
      const durationSec = totalDurationInSeconds ?? undefined;
      const sport = mapSport(activityType);

      // Compute avg pace for running activities (sec/km)
      let avgPaceSecPerKm: number | undefined;
      if (
        sport === SportType.RUN &&
        durationSec != null &&
        distanceKm != null &&
        distanceKm > 0
      ) {
        avgPaceSecPerKm = Math.round(durationSec / distanceKm);
      }

      const startedAt =
        startTimeInSeconds != null
          ? new Date(startTimeInSeconds * 1000)
          : undefined;

      await prisma.workoutLog.create({
        data: {
          athleteId: athlete.id,
          source: "garmin",
          externalActivityId: externalActivityIdStr,
          sport,
          startedAt,
          distanceKm,
          durationSec,
          avgHr: averageHeartRateInBeatsPerMinute ?? undefined,
          avgPaceSecPerKm,
        },
      });

      console.log(
        `[garmin] persisted activity ${activityId} for athlete ${athlete.id} (${sport}, ${distanceKm?.toFixed(2) ?? "–"}km)`
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
