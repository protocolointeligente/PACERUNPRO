import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, athletes: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = await req.json() as { athleteId: string; from: string; to: string };
  const { athleteId, from, to } = body;

  if (!athleteId || !from || !to) {
    return NextResponse.json({ error: "athleteId, from e to são obrigatórios" }, { status: 400 });
  }

  const coachAthleteIds = new Set(coach.athletes.map((a) => a.id));
  if (!coachAthleteIds.has(athleteId)) {
    return NextResponse.json({ error: "Atleta inválido" }, { status: 403 });
  }

  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });
  }

  try {
    // Update workout status from AGENDADO to LIBERADO in range
    const updated = await prisma.workout.updateMany({
      where: {
        date: { gte: fromDate, lte: toDate },
        status: "AGENDADO",
        week: { plan: { athleteId, coachId: coach.id } },
      },
      data: { status: "LIBERADO" },
    });

    // Mark affected weeks as released
    const affectedWeeks = await prisma.trainingWeek.findMany({
      where: {
        plan: { athleteId, coachId: coach.id },
        startDate: { lte: toDate },
        endDate: { gte: fromDate },
      },
      select: { id: true },
    });

    if (affectedWeeks.length > 0) {
      await prisma.trainingWeek.updateMany({
        where: { id: { in: affectedWeeks.map((w) => w.id) } },
        data: { released: true },
      });
    }

    return NextResponse.json({ released: updated.count, weeks: affectedWeeks.length });
  } catch (err: unknown) {
    console.error("[POST /api/coach/workouts/release]", err);
    return NextResponse.json({ error: "Erro ao liberar treinos" }, { status: 500 });
  }
}
