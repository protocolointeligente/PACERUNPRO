import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let event: Record<string, unknown>;
  try {
    event = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type as string | undefined;
  console.log("[pagbank webhook]", eventType, JSON.stringify(event).slice(0, 300));

  if (eventType === "CHARGE_UPDATED") {
    const charge = (event.data as Record<string, unknown> | undefined) ?? {};
    if (charge.status === "PAID") {
      const referenceId = charge.reference_id as string | undefined;
      console.log("[pagbank] charge paid:", charge.id, referenceId);
      // TODO: parse referenceId (format: planId_timestamp), find user by email,
      // activate subscription in DB via prisma.
    }
  }

  return NextResponse.json({ received: true });
}
