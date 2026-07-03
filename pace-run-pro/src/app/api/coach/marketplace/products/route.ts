import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoach(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  return prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true, slug: true } });
}

// GET — list coach's marketplace products
export async function GET(_req: NextRequest) {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const products = await prisma.marketplaceProduct.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST — create marketplace product
export async function POST(req: NextRequest) {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const {
    type, title, slug, description, coverUrl,
    priceCents, durationWeeks, level, sport, format,
    eventDate, maxParticipants, deliveryDays,
    included, content, fileUrl, published, featured,
  } = body;

  if (!title || !slug || !type) {
    return NextResponse.json({ error: "title, slug e type são obrigatórios" }, { status: 400 });
  }

  const exists = await prisma.marketplaceProduct.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug já existe" }, { status: 409 });

  // Ensure store exists for this coach
  let store = await prisma.marketplaceStore.findUnique({ where: { coachId: coach.id }, select: { id: true } });
  if (!store) {
    const coachData = await prisma.coach.findUnique({
      where: { id: coach.id },
      select: { slug: true, user: { select: { name: true } } },
    });
    store = await prisma.marketplaceStore.create({
      data: {
        coachId: coach.id,
        name: coachData?.user.name ?? "Minha Assessoria",
        slug: coachData?.slug ?? coach.id,
      },
      select: { id: true },
    });
  }

  const product = await prisma.marketplaceProduct.create({
    data: {
      storeId: store.id,
      coachId: coach.id,
      type,
      title,
      slug,
      description: description ?? "",
      coverUrl: coverUrl ?? null,
      priceCents: priceCents ?? 0,
      durationWeeks: durationWeeks ?? null,
      level: level ?? null,
      sport: sport ?? null,
      format: format ?? null,
      eventDate: eventDate ? new Date(eventDate) : null,
      maxParticipants: maxParticipants ?? null,
      deliveryDays: deliveryDays ?? null,
      included: included ?? [],
      content: content ?? null,
      fileUrl: fileUrl ?? null,
      published: published ?? false,
      featured: featured ?? false,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

// Fields coaches are allowed to update on their own products
const PATCH_ALLOWED = new Set([
  "type", "title", "slug", "description", "coverUrl", "priceCents",
  "durationWeeks", "level", "sport", "format", "eventDate", "maxParticipants",
  "deliveryDays", "included", "content", "fileUrl", "published",
]);

// PATCH — update marketplace product
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const product = await prisma.marketplaceProduct.findFirst({ where: { id, coachId: coach.id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Allowlist to prevent mass assignment (coaches cannot set featured, commissionPct, storeId, coachId, etc.)
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => PATCH_ALLOWED.has(k))
  );

  // Slug uniqueness check if being changed
  if (data.slug && data.slug !== product.slug) {
    const exists = await prisma.marketplaceProduct.findFirst({ where: { slug: data.slug as string } });
    if (exists) return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
  }

  const updated = await prisma.marketplaceProduct.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE — remove marketplace product
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const product = await prisma.marketplaceProduct.findFirst({ where: { id, coachId: coach.id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  await prisma.marketplaceProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
