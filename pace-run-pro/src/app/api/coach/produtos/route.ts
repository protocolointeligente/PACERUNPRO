import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(base: string, coachId: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.planProduct.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    suffix++;
  }
}

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

  const products = await prisma.planProduct.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = await req.json();
  const {
    title, description, sport, level, durationWeeks,
    weeklyHoursMin, weeklyHoursMax, goal,
    priceCents, coverUrl, included,
  } = body as {
    title: string; description?: string; sport?: string; level?: string;
    durationWeeks?: number; weeklyHoursMin?: number; weeklyHoursMax?: number;
    goal?: string; priceCents?: number; coverUrl?: string; included?: string[];
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }

  const slug = await uniqueSlug(title, coach.id);

  const product = await prisma.planProduct.create({
    data: {
      coachId: coach.id,
      title: title.trim(),
      slug,
      description: description ?? "",
      sport: sport ?? "CORRIDA",
      level: level ?? "Intermediário",
      durationWeeks: durationWeeks ?? 12,
      weeklyHoursMin: weeklyHoursMin ?? null,
      weeklyHoursMax: weeklyHoursMax ?? null,
      goal: goal ?? "PERFORMANCE",
      priceCents: priceCents ?? 0,
      coverUrl: coverUrl ?? null,
      included: included ?? [],
    },
  });
  return NextResponse.json(product, { status: 201 });
}
