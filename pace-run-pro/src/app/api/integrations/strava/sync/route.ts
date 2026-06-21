import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { StravaApiError, fetchStravaActivities, refreshStravaToken } from "@/lib/integrations/strava";

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

  try {
    let accessToken = device.accessToken;
    let activities;
    try {
      activities = await fetchStravaActivities(accessToken, 5);
    } catch (err) {
      if (err instanceof StravaApiError && err.status === 401 && device.refreshToken) {
        const refreshed = await refreshStravaToken(device.refreshToken);
        accessToken = refreshed.access_token;
        await prisma.connectedDevice.update({
          where: { id: device.id },
          data: { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token },
        });
        activities = await fetchStravaActivities(accessToken, 5);
      } else {
        throw err;
      }
    }

    const now = new Date();
    await prisma.connectedDevice.update({
      where: { id: device.id },
      data: { lastSyncAt: now },
    });

    return NextResponse.json({
      ok: true,
      count: activities.length,
      lastSyncAt: now.toISOString(),
      latest: activities[0]
        ? {
            name: activities[0].name,
            date: activities[0].start_date,
            distanceKm: activities[0].distance / 1000,
          }
        : null,
    });
  } catch (err) {
    console.error("[strava sync]", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 502 });
  }
}
