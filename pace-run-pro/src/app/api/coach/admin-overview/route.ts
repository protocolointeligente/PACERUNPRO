import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      plans: {
        where: { active: true },
        select: { id: true, name: true, priceCents: true, period: true },
      },
    },
  });

  if (!coach) {
    return NextResponse.json({
      mrr: 0, mrrGrowth: 0, totalCoaches: 1, totalAthletes: 0,
      activeAthletes: 0, churnRate: 0, recentActivity: [], plans: [],
    });
  }

  const athleteCount = coach.athletes.length;
  const activeAthletes = coach.athletes.filter((a) => a.status === "ativo").length;
  const inactiveCount = coach.athletes.filter((a) => a.status === "inativo").length;
  const churnRate = athleteCount > 0 ? inactiveCount / athleteCount : 0;

  // Recent activity: latest 8 athletes joined (newest first)
  const recentActivity = coach.athletes.slice(0, 8).map((a) => ({
    id: a.id,
    name: a.user.name,
    plan: coach.plans[0]?.name ?? "Sem plano",
    action: "novo" as const,
    date: new Date(a.createdAt).toLocaleDateString("pt-BR"),
    mrr: coach.plans[0] ? Math.round(coach.plans[0].priceCents / 100) : 0,
  }));

  // MRR estimate: average plan price × active athletes
  const avgPlanCents =
    coach.plans.length > 0
      ? coach.plans.reduce((s, p) => s + p.priceCents, 0) / coach.plans.length
      : 0;
  const mrr = Math.round((avgPlanCents / 100) * activeAthletes);

  return NextResponse.json({
    mrr,
    mrrGrowth: 0,
    totalCoaches: 1,
    totalAthletes: athleteCount,
    activeAthletes,
    churnRate,
    recentActivity,
    plans: coach.plans,
  });
}
