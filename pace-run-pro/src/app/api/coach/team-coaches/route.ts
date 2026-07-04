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
    select: { id: true },
  });

  if (!coach) {
    return NextResponse.json([]);
  }

  // Find teams owned by this coach and all their athlete members
  const teams = await prisma.team.findMany({
    where: { coachId: coach.id },
    include: {
      members: {
        include: {
          athlete: {
            select: { userId: true },
          },
        },
      },
    },
  });

  const memberUserIds = teams.flatMap((t) =>
    t.members.map((m) => m.athlete.userId)
  );

  if (memberUserIds.length === 0) {
    return NextResponse.json([]);
  }

  // Find coaches whose user accounts are also team members (hired coaches)
  const hiredCoaches = await prisma.coach.findMany({
    where: {
      userId: { in: memberUserIds },
      id: { not: coach.id },
    },
    include: {
      user: {
        select: { name: true, avatarUrl: true },
      },
      athletes: {
        select: { id: true },
      },
      plans: {
        where: { active: true },
        select: { priceCents: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = hiredCoaches.map((c) => {
    const avgPlanCents =
      c.plans.length > 0
        ? c.plans.reduce((s, p) => s + p.priceCents, 0) / c.plans.length
        : 0;
    const mrr = Math.round((avgPlanCents / 100) * c.athletes.length);

    return {
      id: c.id,
      name: c.user.name,
      avatarUrl: c.user.avatarUrl ?? null,
      credential: c.credential ?? "–",
      plan: "Contratado",
      athletes: c.athletes.length,
      mrr,
      status: "ativo",
      joinedAt: new Date(c.createdAt).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      }),
    };
  });

  return NextResponse.json(result);
}
