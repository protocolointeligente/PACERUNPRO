import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function POST(request: NextRequest) {
  const consumerKey = process.env.GARMIN_CONSUMER_SECRET;
  if (consumerKey) {
    const signature = request.headers.get("x-garmin-signature");
    const rawBody = await request.text();
    const expected = createHmac("sha1", consumerKey).update(rawBody).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
      const body = JSON.parse(rawBody) as { activityFiles?: unknown[] };
      const activities = body?.activityFiles ?? [];
      for (const activity of activities as Record<string, unknown>[]) {
        const { activityId, userId, startTimeInSeconds, totalDistanceInMeters, averageHeartRateInBeatsPerMinute } = activity;
        void startTimeInSeconds;
        console.log(`[Garmin Webhook] Activity ${activityId} from user ${userId} — ${totalDistanceInMeters}m at ${averageHeartRateInBeatsPerMinute}bpm`);
      }
      return NextResponse.json({ status: "ok" });
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
  }

  try {
    const body = await request.json() as { activityFiles?: unknown[] };
    const activities = body?.activityFiles ?? [];
    for (const activity of activities as Record<string, unknown>[]) {
      const { activityId, userId, startTimeInSeconds, totalDistanceInMeters, averageHeartRateInBeatsPerMinute } = activity;
      void startTimeInSeconds;
      console.log(`[Garmin Webhook] Activity ${activityId} from user ${userId} — ${totalDistanceInMeters}m at ${averageHeartRateInBeatsPerMinute}bpm`);
    }
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
