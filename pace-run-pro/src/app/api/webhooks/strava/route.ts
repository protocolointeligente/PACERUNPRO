import { NextRequest, NextResponse } from "next/server";

// Strava sends a GET request for webhook subscription verification
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

// Strava sends POST for new activities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { object_type, object_id, aspect_type, owner_id } = body;

    if (object_type === "activity" && aspect_type === "create") {
      // In production: fetch full activity from Strava API using owner_id token,
      // normalize with normalizeActivity(), store in database, match to workout plan,
      // trigger auto check-in prefill if matchedWorkoutId found.
      console.log(`[Strava Webhook] New activity ${object_id} for athlete ${owner_id}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
