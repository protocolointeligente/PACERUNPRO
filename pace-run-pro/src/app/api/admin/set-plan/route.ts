import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const VALID_PLANS = ["FREE", "ATHLETE", "COACH", "TEAM"] as const;
type Plan = (typeof VALID_PLANS)[number];

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { coachId, plan } = (await req.json()) as { coachId: string; plan: string };

  if (!coachId || !VALID_PLANS.includes(plan as Plan)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { userId: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const existingSub = await prisma.subscription.findFirst({
    where: { userId: coach.userId },
    orderBy: { startedAt: "desc" },
  });

  let sub;
  if (existingSub) {
    sub = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        plan: plan as Plan,
        status: "ACTIVE",
        renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    sub = await prisma.subscription.create({
      data: {
        userId: coach.userId,
        plan: plan as Plan,
        status: "ACTIVE",
        renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json({ ok: true, plan: sub.plan, status: sub.status });
}
