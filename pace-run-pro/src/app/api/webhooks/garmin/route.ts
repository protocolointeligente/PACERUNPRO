import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Garmin Health API sends activity summaries via deregistration callback
    const activities = body?.activityFiles ?? [];

    for (const activity of activities) {
      const { activityId, userId, startTimeInSeconds, totalDistanceInMeters, averageHeartRateInBeatsPerMinute } = activity;
      // In production: normalize with normalizeActivity(), upsert in DB, match to plan workout
      console.log(`[Garmin Webhook] Activity ${activityId} from user ${userId} — ${totalDistanceInMeters}m at ${averageHeartRateInBeatsPerMinute}bpm`);
      void startTimeInSeconds;
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
