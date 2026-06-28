import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.includes(session.user.email?.toLowerCase() ?? "");
}

// GET — list platform products (coachId = null)
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const products = await prisma.planProduct.findMany({
    where: { coachId: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST — create a platform product
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    title, slug, description, sport, level, durationWeeks,
    weeklyHoursMin, weeklyHoursMax, goal, priceCents,
    coverUrl, featured, included, planContent,
  } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "title e slug são obrigatórios" }, { status: 400 });
  }

  // Check slug uniqueness
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

// PATCH — update platform product
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const product = await prisma.planProduct.findUnique({ where: { id } });
  if (!product || product.coachId !== null) {
    return NextResponse.json({ error: "Produto não encontrado ou não é da plataforma" }, { status: 404 });
  }

  const updated = await prisma.planProduct.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE — remove platform product
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

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
