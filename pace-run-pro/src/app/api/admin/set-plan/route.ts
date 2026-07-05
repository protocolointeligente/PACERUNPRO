import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type Plan = "FREE" | "ATHLETE" | "COACH" | "TEAM";

// Maps B2B plan slug → Prisma SubscriptionPlan enum + planSlug string
const SLUG_MAP: Record<string, { plan: Plan; slug: string }> = {
  "b2b-free":        { plan: "FREE",    slug: "b2b-free"        },
  "b2b-starter":     { plan: "ATHLETE", slug: "b2b-starter"     },
  "b2b-pro":         { plan: "COACH",   slug: "b2b-pro"         },
  "b2b-assessoria":  { plan: "TEAM",    slug: "b2b-assessoria"  },
  "b2b-unlimited":   { plan: "TEAM",    slug: "b2b-unlimited"   },
};

// Legacy enum → slug (for backwards compat with old callers sending enum values)
const ENUM_TO_SLUG: Record<Plan, string> = {
  FREE:    "b2b-free",
  ATHLETE: "b2b-starter",
  COACH:   "b2b-pro",
  TEAM:    "b2b-unlimited",
};

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { coachId, planSlug, plan: planEnum } = (await req.json()) as {
    coachId: string;
    planSlug?: string;
    plan?: string;
  };

  if (!coachId) return NextResponse.json({ error: "coachId obrigatório" }, { status: 400 });

  // Resolve the plan from either planSlug (preferred) or legacy plan enum
  let resolved: { plan: Plan; slug: string } | undefined;
  if (planSlug && SLUG_MAP[planSlug]) {
    resolved = SLUG_MAP[planSlug];
  } else if (planEnum && ENUM_TO_SLUG[planEnum as Plan]) {
    const slug = ENUM_TO_SLUG[planEnum as Plan];
    resolved = SLUG_MAP[slug];
  }

  if (!resolved) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { userId: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const renewsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const existingSub = await prisma.subscription.findFirst({
    where: { userId: coach.userId },
    orderBy: { startedAt: "desc" },
  });

  let sub;
  if (existingSub) {
    sub = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        plan: resolved.plan,
        planSlug: resolved.slug,
        status: "ACTIVE",
        renewsAt,
      },
    });
  } else {
    sub = await prisma.subscription.create({
      data: {
        userId: coach.userId,
        plan: resolved.plan,
        planSlug: resolved.slug,
        status: "ACTIVE",
        renewsAt,
      },
    });
  }

  return NextResponse.json({ ok: true, plan: sub.plan, planSlug: sub.planSlug, status: sub.status });
}
