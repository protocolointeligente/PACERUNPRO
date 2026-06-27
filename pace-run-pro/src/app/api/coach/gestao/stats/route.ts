import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const PLAN_SLOTS: Record<string, number> = {
  FREE: 5,
  ATHLETE: 5,
  COACH: 30,
  TEAM: 200,
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuito",
  ATHLETE: "Atleta",
  COACH: "Treinador",
  TEAM: "Equipe",
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [athletes, subscription] = await Promise.all([
    prisma.athlete.findMany({
      where: { coachId: coach.id },
      select: { id: true, createdAt: true, status: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      select: { plan: true, status: true, renewsAt: true },
    }),
  ]);

  const plan = subscription?.plan ?? "FREE";
  const totalSlots = PLAN_SLOTS[plan] ?? 5;
  const usedSlots = athletes.length;
  const newAthletes30d = athletes.filter((a) => a.createdAt >= thirtyDaysAgo).length;
  const inactiveCount = athletes.filter((a) => a.status === "inativo").length;

  // Recent roster (last 10)
  const recentAthletes = athletes.slice(0, 10).map((a) => ({
    name: a.user.name ?? "Atleta",
    status: a.status,
    joinedAt: a.createdAt.toISOString(),
  }));

  return NextResponse.json({
    usedSlots,
    totalSlots,
    planName: PLAN_LABELS[plan] ?? plan,
    planKey: plan,
    newAthletes30d,
    inactiveCount,
    subscriptionStatus: subscription?.status ?? "TRIAL",
    renewsAt: subscription?.renewsAt?.toISOString() ?? null,
    recentAthletes,
  });
}
