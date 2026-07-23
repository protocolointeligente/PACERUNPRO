import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || "plano";
}

async function uniqueProductSlug(baseTitle: string) {
  const base = slugify(baseTitle);
  let candidate = base;
  let suffix = 2;
  while (await prisma.planProduct.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

function periodToWeeks(period?: string) {
  if (period === "TRIMESTRAL") return 12;
  if (period === "SEMESTRAL") return 24;
  if (period === "ANUAL") return 52;
  return 4;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { plans: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(coach?.plans ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    name: string;
    description?: string;
    priceCents: number;
    period?: string;
    features?: string[];
    highlight?: boolean;
    maxSlots?: number | null;
    sortOrder?: number;
  } | null;

  if (!body) return NextResponse.json({ error: "Dados do plano inválidos" }, { status: 400 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nome do plano obrigatório" }, { status: 400 });
  }

  if (!Number.isInteger(body.priceCents) || body.priceCents < 0) {
    return NextResponse.json({ error: "Informe um valor válido para o plano" }, { status: 400 });
  }

  const validPeriods = ["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"] as const;
  if (body.period && !validPeriods.includes(body.period as (typeof validPeriods)[number])) {
    return NextResponse.json({ error: "Periodicidade inválida" }, { status: 400 });
  }

  const period = (body.period as "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL") ?? "MENSAL";
  const features = body.features ?? [];
  const productSlug = await uniqueProductSlug(body.name);

  const { plan, product } = await prisma.$transaction(async (tx) => {
    const plan = await tx.coachPlan.create({
      data: {
        coachId: coach.id,
        name: body.name,
        description: body.description ?? null,
        priceCents: body.priceCents,
        period,
        features,
        highlight: body.highlight ?? false,
        maxSlots: body.maxSlots ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    const product = await tx.planProduct.create({
      data: {
        coachId: coach.id,
        title: body.name,
        slug: productSlug,
        description: body.description ?? "Plano de acompanhamento personalizado.",
        sport: "MULTIMODAL",
        level: "Todos os níveis",
        durationWeeks: periodToWeeks(period),
        weeklyHoursMin: 0,
        weeklyHoursMax: 0,
        goal: "ACOMPANHAMENTO",
        priceCents: body.priceCents,
        published: true,
        featured: body.highlight ?? false,
        included: features,
        planContent: {
          source: "coachPlan",
          coachPlanId: plan.id,
          period,
          marketplace: "coach",
        },
      },
    });

    return { plan, product };
  });

  return NextResponse.json({ plan, product }, { status: 201 });
}
