import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deauthorizeStrava } from "@/lib/integrations/strava";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const device = await prisma.connectedDevice.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: "STRAVA" } },
  });

  if (device?.accessToken) {
    await deauthorizeStrava(device.accessToken);
  }

  await prisma.connectedDevice.deleteMany({
    where: { userId: session.user.id, provider: "STRAVA" },
  });

  return NextResponse.json({ ok: true });
}
