import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

function parseCalendarDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

const releaseWeekSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  released: z.boolean().default(true),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const parsed = releaseWeekSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Semana inválida" }, { status: 400 });
  const { id: athleteId } = await params;
  const weekStart = parseCalendarDate(parsed.data.weekStart);
  if (!weekStart) return NextResponse.json({ error: "Semana inválida" }, { status: 400 });
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
  const week = await prisma.trainingWeek.findFirst({ where: { startDate: weekStart, endDate: weekEnd, plan: { athleteId, coachId: coach.id } }, select: { id: true } });
  if (!week) return NextResponse.json({ error: "Semana não encontrada" }, { status: 404 });
  const updated = await prisma.trainingWeek.update({ where: { id: week.id }, data: { released: parsed.data.released, releasedAt: parsed.data.released ? new Date() : null }, select: { id: true, released: true, releasedAt: true } });
  await prisma.auditLog.create({ data: { actorUserId: session.user.id, coachId: coach.id, athleteId, action: parsed.data.released ? "PUBLISH" : "UNPUBLISH", entity: "TrainingWeek", entityId: week.id, message: parsed.data.released ? "Semana liberada para o atleta." : "Liberação da semana removida." } });
  return NextResponse.json(updated);
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
