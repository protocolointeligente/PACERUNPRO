import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const PLAN_PRICE: Record<string, number> = {
  FREE: 0,
  ATHLETE: 4990,
  COACH: 14990,
  TEAM: 49900,
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const coaches = await prisma.coach.findMany({
    select: {
      id: true,
      user: { select: { name: true, subscriptions: { where: { status: "ACTIVE" }, select: { plan: true }, take: 1 } } },
      athletes: {
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          checkins: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          user: { select: { subscriptions: { where: { status: "ACTIVE" }, select: { plan: true }, take: 1 } } },
        },
      },
      marketplaceProducts: { select: { purchases: true }, where: { published: true } },
    },
  });

  const coachIds = coaches.map((c) => c.id);

  // Fetch last assessment date per coach's athletes
  const athleteIds = coaches.flatMap((c) => c.athletes.map((a) => a.id));
  const latestAssessments = athleteIds.length > 0
    ? await prisma.physicalAssessment.groupBy({
        by: ["athleteId"],
        where: { athleteId: { in: athleteIds } },
        _max: { assessedAt: true },
      })
    : [];
  const assessedMap = new Map(latestAssessments.map((a) => [a.athleteId, a._max.assessedAt]));

  // Recent marketplace revenue per coach (last 30 days)
  const recentCommissions = coachIds.length > 0
    ? await prisma.marketplaceCommission.findMany({
        where: { coachId: { in: coachIds }, createdAt: { gte: thirtyDaysAgo }, order: { status: "PAID" } },
        select: { coachId: true, grossCents: true },
      })
    : [];
  const mktRevByCoach = new Map<string, number>();
  for (const c of recentCommissions) {
    if (c.coachId) mktRevByCoach.set(c.coachId, (mktRevByCoach.get(c.coachId) ?? 0) + c.grossCents);
  }

  const results = coaches.map((coach) => {
    const athletes = coach.athletes;
    const totalAthletes = athletes.length;
    const activeAthletes = athletes.filter((a) => a.status === "ativo").length;
    const atRiskAthletes = athletes.filter((a) => a.status === "risco").length;

    const avgAdherence = totalAthletes > 0
      ? Math.round(athletes.reduce((s, a) => s + (a.adherenceRate ?? 0), 0) / totalAthletes)
      : 0;

    // Subscription MRR from coach's athletes
    const athleteMrr = athletes.reduce((sum, a) => {
      const plan = a.user.subscriptions[0]?.plan;
      return sum + (plan ? (PLAN_PRICE[plan] ?? 0) : 0);
    }, 0);

    // Coach's own subscription
    const coachPlan = coach.user.subscriptions[0]?.plan;
    const coachMrr = coachPlan ? (PLAN_PRICE[coachPlan] ?? 0) : 0;

    // Athletes needing assessment (never assessed or > 90 days)
    const pendingAssessments = athletes.filter((a) => {
      const last = assessedMap.get(a.id);
      return !last || last < ninetyDaysAgo;
    }).length;

    // Athletes inactive (no check-in in last 30 days)
    const inactiveAthletes = athletes.filter((a) => {
      const lastCheckin = a.checkins[0]?.date;
      return !lastCheckin || lastCheckin < thirtyDaysAgo;
    }).length;

    const mktRevenue30d = mktRevByCoach.get(coach.id) ?? 0;
    const totalMarketplaceSales = coach.marketplaceProducts.reduce((s, p) => s + p.purchases, 0);

    // Health score (0–100) weighted composite
    const adherenceScore = avgAdherence; // 0–100
    const retentionScore = totalAthletes > 0 ? Math.round((1 - inactiveAthletes / totalAthletes) * 100) : 0;
    const assessmentScore = totalAthletes > 0 ? Math.round((1 - pendingAssessments / totalAthletes) * 100) : 100;
    const activityScore = totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0;

    const healthScore = Math.round(
      adherenceScore * 0.35 +
      retentionScore * 0.30 +
      assessmentScore * 0.20 +
      activityScore * 0.15
    );

    return {
      coachId: coach.id,
      coachName: coach.user.name,
      totalAthletes,
      activeAthletes,
      atRiskAthletes,
      avgAdherence,
      pendingAssessments,
      inactiveAthletes,
      mrrContribution: athleteMrr + coachMrr,
      coachMrr,
      athleteMrr,
      mktRevenue30d,
      totalMarketplaceSales,
      healthScore,
    };
  });

  // Sort by health score ascending (worst first for admin attention)
  results.sort((a, b) => a.healthScore - b.healthScore);

  return NextResponse.json({ coaches: results, total: results.length });
}
