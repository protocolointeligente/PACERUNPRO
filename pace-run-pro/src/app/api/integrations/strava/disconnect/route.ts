import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { deauthorizeStrava } from "@/lib/integrations/strava";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
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
