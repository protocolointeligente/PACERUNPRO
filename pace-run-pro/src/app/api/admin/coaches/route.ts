import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const PLAN_MAP: Record<string, string> = {
  FREE: "starter",
  ATHLETE: "starter",
  COACH: "pro",
  TEAM: "assessoria",
};

const PLAN_MRR: Record<string, number> = {
  FREE: 0,
  ATHLETE: 197,
  COACH: 397,
  TEAM: 997,
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
          id: true,
          name: true,
          email: true,
          city: true,
          state: true,
          updatedAt: true,
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
  }).catch(() => prisma.coach.findMany({
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
      },
      athletes: {
        select: {
          id: true,
          status: true,
          adherenceRate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }));

  // ✅ Fetch subscriptions com batch query ao invés de N queries
  const subscriptionsByUserId = new Map<
    string,
    { plan: string; status: string } | undefined
  >();

  if (coaches.length > 0) {
    const userIds = coaches.map((c) => c.user.id);
    const userSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: { in: userIds },
      },
      orderBy: { startedAt: "desc" },
      distinct: ["userId"],
      select: { userId: true, plan: true, status: true },
    });

    for (const sub of userSubscriptions) {
      subscriptionsByUserId.set(sub.userId, { plan: sub.plan, status: sub.status });
    }
  }

  const result = coaches.map((coach) => {
    const sub = subscriptionsByUserId.get(coach.user.id);
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

    const cityValue = "city" in coach.user ? coach.user.city : null;
    const stateValue = "state" in coach.user ? coach.user.state : null;
    const city =
      [cityValue, stateValue].filter(Boolean).join(", ") || "-";

    return {
      id: coach.id,
      name: coach.user.name,
      city,
      plan,
      coaches: 1,
      athletes: athleteCount,
      activeAthletes,
      mrr: sub ? (PLAN_MRR[sub.plan] ?? 0) : 0,
      status,
      approvedAt: coach.createdAt.toISOString(),
      contact: coach.user.email,
      healthScore,
      churnRisk,
      lastLoginDays: daysSinceUpdate,
      prescribedLast7d: "trainingPlans" in coach ? coach.trainingPlans.length : 0,
    };
  });

  return NextResponse.json(result);
}
