import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

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
    const activities = (body?.activityFiles ?? []) as Record<string, unknown>[];
    for (const activity of activities) {
      const { activityId, userId, totalDistanceInMeters, averageHeartRateInBeatsPerMinute } = activity;
      console.log(`[Garmin] Activity ${activityId} from user ${userId} — ${totalDistanceInMeters}m @ ${averageHeartRateInBeatsPerMinute}bpm`);
    }
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
