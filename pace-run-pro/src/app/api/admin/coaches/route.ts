import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const PLAN_MAP: Record<string, string> = {
  FREE: "starter",
  ATHLETE: "starter",
  COACH: "pro",
  TEAM: "assessoria",
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "ativo",
  TRIAL: "pendente",
  PAST_DUE: "pendente",
  CANCELED: "suspenso",
};

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const coaches = await prisma.coach.findMany({
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
          city: true,
          state: true,
          updatedAt: true,
          subscriptions: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { plan: true, status: true },
          },
        },
      },
      athletes: {
        select: {
          id: true,
          status: true,
          adherenceRate: true,
        },
      },
      trainingPlans: {
        where: { startDate: { gte: sevenDaysAgo } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = coaches.map((coach) => {
    const sub = coach.user.subscriptions[0];
    const plan = sub ? (PLAN_MAP[sub.plan] ?? "starter") : "starter";
    const status = sub ? (STATUS_MAP[sub.status] ?? "pendente") : "pendente";

    const athleteCount = coach.athletes.length;
    const activeAthletes = coach.athletes.filter((a) => a.status === "ativo").length;

    const avgAdherence =
      athleteCount > 0
        ? coach.athletes.reduce((s, a) => s + (a.adherenceRate ?? 0), 0) / athleteCount
        : 0;
    const healthScore = Math.min(100, Math.round(avgAdherence * 100));

    const daysSinceUpdate = Math.floor(
      (now.getTime() - new Date(coach.user.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const churnRisk: "baixo" | "medio" | "alto" =
      daysSinceUpdate > 30 ? "alto" : daysSinceUpdate > 14 ? "medio" : "baixo";

    const city =
      [coach.user.city, coach.user.state].filter(Boolean).join(", ") || "—";

    return {
      id: coach.id,
      name: coach.user.name,
      city,
      plan,
      coaches: 1,
      athletes: athleteCount,
      activeAthletes,
      mrr: 0,
      status,
      approvedAt: coach.createdAt.toISOString(),
      contact: coach.user.email,
      healthScore,
      churnRisk,
      lastLoginDays: daysSinceUpdate,
      prescribedLast7d: coach.trainingPlans.length,
    };
  });

  return NextResponse.json(result);
}
