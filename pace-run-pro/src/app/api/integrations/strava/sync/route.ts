import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  StravaApiError,
  fetchStravaActivities,
  refreshStravaToken,
} from "@/lib/integrations/strava";
import { persistStravaActivity } from "@/lib/integrations/strava-sync";
import { decrypt, encrypt } from "@/lib/encryption";

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
  let matched = 0;
  for (const activity of activities) {
    const result = await persistStravaActivity(athlete.id, activity);
    if (result.created) synced++;
    if (result.matched) matched++;
  }

  const now = new Date();
  await prisma.connectedDevice.update({
    where: { id: device.id },
    data: { lastSyncAt: now },
  });

  return NextResponse.json({
    ok: true,
    synced,
    matched,
    total: activities.length,
    lastSyncAt: now.toISOString(),
  });
}
