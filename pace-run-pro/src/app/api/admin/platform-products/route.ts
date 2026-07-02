import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const products = await prisma.planProduct.findMany({
    where: { coachId: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const {
    title, slug, description, sport, level, durationWeeks,
    weeklyHoursMin, weeklyHoursMax, goal, priceCents,
    coverUrl, featured, included, planContent,
  } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "title e slug são obrigatórios" }, { status: 400 });
  }

  const exists = await prisma.planProduct.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug já existe" }, { status: 409 });

  const product = await prisma.planProduct.create({
    data: {
      coachId: null,
      title,
      slug,
      description: description ?? "",
      sport: sport ?? "FORCA",
      level: level ?? "Intermediário",
      durationWeeks: durationWeeks ?? 12,
      weeklyHoursMin: weeklyHoursMin ?? null,
      weeklyHoursMax: weeklyHoursMax ?? null,
      goal: goal ?? "PERFORMANCE",
      priceCents: priceCents ?? 4990,
      coverUrl: coverUrl ?? null,
      featured: featured ?? true,
      included: included ?? [],
      planContent: planContent ?? null,
      published: true,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const {
    id,
    title, slug, description, sport, level, durationWeeks,
    weeklyHoursMin, weeklyHoursMax, goal, priceCents,
    coverUrl, featured, included, planContent, published,
  } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const product = await prisma.planProduct.findUnique({ where: { id } });
  if (!product || product.coachId !== null) {
    return NextResponse.json({ error: "Produto não encontrado ou não é da plataforma" }, { status: 404 });
  }

  // Allowlist updateable fields — never pass raw body to Prisma
  const data = Object.fromEntries(
    Object.entries({
      title, slug, description, sport, level, durationWeeks,
      weeklyHoursMin, weeklyHoursMax, goal, priceCents,
      coverUrl, featured, included, planContent, published,
    }).filter(([, v]) => v !== undefined),
  );

  const updated = await prisma.planProduct.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const product = await prisma.planProduct.findUnique({ where: { id } });
  if (!product || product.coachId !== null) {
    return NextResponse.json({ error: "Produto não encontrado ou não é da plataforma" }, { status: 404 });
  }

  await prisma.planProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
