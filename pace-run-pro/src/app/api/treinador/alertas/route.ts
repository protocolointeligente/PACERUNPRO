import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) {
    return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });
  }

  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  // Plans expiring within 7 days
  const expiringPlans = await prisma.trainingPlan.findMany({
    where: {
      coachId: coach.id,
      endDate: { gte: now, lte: in7Days },
    },
    select: {
      id: true,
      endDate: true,
      athlete: {
        select: {
          id: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { endDate: "asc" },
  });

  // Weeks that should be auto-released but aren't yet
  const unreleasedWeeks = await prisma.trainingWeek.findMany({
    where: {
      released: false,
      startDate: { lte: now },
      plan: { coachId: coach.id },
    },
    select: {
      id: true,
      weekNumber: true,
      startDate: true,
      planId: true,
      plan: {
        select: {
          athlete: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
    take: 20,
  });

  // Auto-release overdue weeks
  if (unreleasedWeeks.length > 0) {
    await prisma.trainingWeek.updateMany({
      where: { id: { in: unreleasedWeeks.map((w) => w.id) } },
      data: { released: true, releasedAt: now },
    });
    await prisma.workout.updateMany({
      where: { weekId: { in: unreleasedWeeks.map((w) => w.id) } },
      data: { status: "LIBERADO" },
    });
  }

  return NextResponse.json({
    expiringPlans: expiringPlans.map((p) => ({
      planId: p.id,
      athleteId: p.athlete.id,
      athleteName: p.athlete.user.name,
      endDate: p.endDate,
      daysLeft: Math.ceil((p.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    })),
    autoReleased: unreleasedWeeks.map((w) => ({
      weekId: w.id,
      weekNumber: w.weekNumber,
      athleteName: w.plan.athlete.user.name,
    })),
  });
}
