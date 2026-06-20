import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const futureEnd = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const workouts = await prisma.workout.findMany({
    where: {
      week: { plan: { athleteId: athlete.id } },
      date: { gte: todayStart, lte: futureEnd },
      status: { in: ["LIBERADO", "AGENDADO"] },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      type: true,
      title: true,
      status: true,
      objective: true,
      targetPaceSecPerKm: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetRpe: true,
      targetHrZone: true,
      imageUrl: true,
    },
  });

  const result = workouts.map((w) => ({
    ...w,
    date: w.date.toISOString(),
  }));

  return NextResponse.json(result);
}
