import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const devices = await prisma.connectedDevice.findMany({
    where: { userId: session.user.id },
    select: { provider: true, connectedAt: true, lastSyncAt: true },
  });

  return NextResponse.json({ devices });
}
