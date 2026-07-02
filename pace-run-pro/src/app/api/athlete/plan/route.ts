import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const PLAN_SELECT = {
  id: true,
  name: true,
  goal: true,
  raceDate: true,
  macrocycle: true,
  phase: true,
  startDate: true,
  endDate: true,
  weeks: {
    select: {
      id: true,
      weekNumber: true,
      mesocycle: true,
      phase: true,
      startDate: true,
      endDate: true,
      targetLoad: true,
      targetVolumeKm: true,
      released: true,
    },
    orderBy: { weekNumber: "asc" as const },
  },
} as const;

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ plan: null });

  // Prefer the currently active plan; fall back to the most recently created if none is active.
  const plan =
    (await prisma.trainingPlan.findFirst({
      where: { athleteId: athlete.id, endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
      select: PLAN_SELECT,
    })) ??
    (await prisma.trainingPlan.findFirst({
      where: { athleteId: athlete.id },
      orderBy: { createdAt: "desc" },
      select: PLAN_SELECT,
    }));

  if (!plan) return NextResponse.json({ plan: null });

  return NextResponse.json({
    plan: {
      id: plan.id,
      name: plan.name,
      goal: plan.goal,
      raceDate: plan.raceDate?.toISOString().split("T")[0] ?? null,
      macrocycle: plan.macrocycle,
      phase: plan.phase,
      startDate: plan.startDate.toISOString().split("T")[0],
      endDate: plan.endDate.toISOString().split("T")[0],
      weeks: plan.weeks.map((w) => ({
        id: w.id,
        weekNumber: w.weekNumber,
        mesocycle: w.mesocycle,
        phase: w.phase,
        startDate: w.startDate.toISOString().split("T")[0],
        endDate: w.endDate.toISOString().split("T")[0],
        targetLoad: w.targetLoad,
        targetVolumeKm: w.targetVolumeKm,
        released: w.released,
      })),
    },
  });
}
