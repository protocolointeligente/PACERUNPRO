import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StravaApiError, fetchStravaActivity, refreshStravaToken } from "@/lib/integrations/strava";
import { persistStravaActivity } from "@/lib/integrations/strava-sync";
import { decrypt, encrypt } from "@/lib/encryption";

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

export async function POST(request: NextRequest) {
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

  if (body.object_type !== "activity" || body.aspect_type !== "create" || !body.object_id || !body.owner_id) {
    return NextResponse.json({ status: "ignored" });
  }

  const device = await prisma.connectedDevice.findFirst({
    where: { provider: "STRAVA", externalId: String(body.owner_id) },
    include: { user: { include: { athlete: true } } },
  });

  if (!device?.accessToken || !device.user.athlete) {
    console.warn("[strava webhook] device or athlete not found for owner_id", body.owner_id);
    return NextResponse.json({ status: "not_found" });
  }

  let accessToken = decrypt(device.accessToken);
  let activity;
  try {
    activity = await fetchStravaActivity(String(body.object_id), accessToken);
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
      activity = await fetchStravaActivity(String(body.object_id), accessToken);
    } else {
      console.error("[strava webhook] failed to fetch activity", err);
      return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
    }
  }

  const result = await persistStravaActivity(device.user.athlete.id, activity);

  await prisma.connectedDevice.update({
    where: { id: device.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ status: "ok", matched: result.matched, created: result.created });
}
