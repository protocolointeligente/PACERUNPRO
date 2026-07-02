import { prisma } from "@/lib/prisma";
import type { CyclePhase, TrainingPlan, TrainingWeek } from "@prisma/client";

/** Monday-aligned week bounds for any date within the week. */
export function computeWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const dow = date.getDay(); // 0=Sun
  const diffToMon = (dow + 6) % 7;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

/**
 * Returns the coach's active training plan for an athlete.
 * If no plan with endDate >= today exists, creates a default 90-day plan.
 */
export async function findOrCreateActivePlan(
  athleteId: string,
  coachId: string,
  startDate: Date = new Date()
): Promise<TrainingPlan> {
  let plan = await prisma.trainingPlan.findFirst({
    where: { athleteId, coachId, endDate: { gte: new Date() } },
  });
  if (!plan) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { goal: true },
    });
    plan = await prisma.trainingPlan.create({
      data: {
        athleteId,
        coachId,
        name: "Plano de Treinamento",
        goal: athlete?.goal ?? "PERFORMANCE",
        phase: "BASE",
        startDate,
        endDate: new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }
  return plan;
}

/**
 * Returns the TrainingWeek for the given plan and weekStart, creating it if needed.
 * weekStart must be a Monday at 00:00:00.
 */
export async function findOrCreateWeek(
  planId: string,
  phase: CyclePhase,
  weekStart: Date,
  weekEnd: Date
): Promise<TrainingWeek> {
  let week = await prisma.trainingWeek.findFirst({
    where: { planId, startDate: weekStart },
  });
  if (!week) {
    const weekCount = await prisma.trainingWeek.count({ where: { planId } });
    week = await prisma.trainingWeek.create({
      data: {
        planId,
        weekNumber: weekCount + 1,
        phase,
        startDate: weekStart,
        endDate: weekEnd,
        released: true,
      },
    });
  }
  return week;
}
