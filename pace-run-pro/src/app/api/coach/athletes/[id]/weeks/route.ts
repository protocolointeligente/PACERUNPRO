import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseCalendarDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: athleteId } = await params;
  const weekStart = parseCalendarDate(req.nextUrl.searchParams.get("weekStart"));
  if (!weekStart) {
    return NextResponse.json({ error: "Semana inválida" }, { status: 400 });
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const athlete = await prisma.athlete.findFirst({
    where: {
      id: athleteId,
      OR: [
        { coachId: coach.id },
        { trainingPlans: { some: { coachId: coach.id } } },
      ],
    },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não vinculado" }, { status: 403 });

  const result = await prisma.workout.deleteMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      week: { plan: { athleteId, coachId: coach.id } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      coachId: coach.id,
      athleteId,
      action: "DELETE",
      entity: "training_week_workouts",
      entityId: athleteId,
      message: `Semana de treino removida do calendário (${result.count} treino(s)).`,
      before: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        deletedWorkouts: result.count,
      },
    },
  });

  return NextResponse.json({ success: true, deletedWorkouts: result.count });
}
