import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ logs: [] });

  const logs = await prisma.workoutLog.findMany({
    where: { athleteId: athlete.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      source: true,
      distanceKm: true,
      durationSec: true,
      avgPaceSecPerKm: true,
      rpe: true,
      finishedAt: true,
      createdAt: true,
      workout: { select: { title: true, type: true, date: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ logs });
}
