import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoach(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  return prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true, user: { select: { name: true } } },
  });
}

// GET — return coach's store (or null if not yet created)
export async function GET() {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const store = await prisma.marketplaceStore.findUnique({
    where: { coachId: coach.id },
  });

  return NextResponse.json({ store });
}

// POST — create store
export async function POST(req: NextRequest) {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const existing = await prisma.marketplaceStore.findUnique({ where: { coachId: coach.id } });
  if (existing) return NextResponse.json({ store: existing });

  const body = await req.json() as {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    instagramUrl?: string;
    whatsapp?: string;
  };

  const name = body.name?.trim() || coach.user.name || "Minha Assessoria";
  const slug = (body.slug?.trim() || coach.slug || coach.id)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Ensure slug uniqueness
  const slugExists = await prisma.marketplaceStore.findUnique({ where: { slug } });
  const finalSlug = slugExists ? `${slug}-${coach.id.slice(-6)}` : slug;

  const store = await prisma.marketplaceStore.create({
    data: {
      coachId: coach.id,
      name,
      slug: finalSlug,
      description: body.description ?? null,
      logoUrl: body.logoUrl ?? null,
      bannerUrl: body.bannerUrl ?? null,
      primaryColor: body.primaryColor ?? "#C6F24E",
      instagramUrl: body.instagramUrl ?? null,
      whatsapp: body.whatsapp ?? null,
    },
  });

  return NextResponse.json({ store }, { status: 201 });
}

// PATCH — update store settings
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const coach = await getCoach(session);
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const store = await prisma.marketplaceStore.findUnique({ where: { coachId: coach.id } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  const ALLOWED = new Set(["name", "description", "logoUrl", "bannerUrl", "primaryColor", "instagramUrl", "whatsapp", "isActive"]);
  const body = await req.json() as Record<string, unknown>;
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.has(k)));

  // Validate slug separately (needs uniqueness check)
  if (typeof body.slug === "string") {
    const newSlug = body.slug.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (newSlug && newSlug !== store.slug) {
      const slugExists = await prisma.marketplaceStore.findUnique({ where: { slug: newSlug } });
      if (slugExists) return NextResponse.json({ error: "Slug já está em uso" }, { status: 409 });
      data.slug = newSlug;
    }
  }

  const updated = await prisma.marketplaceStore.update({ where: { id: store.id }, data });
  return NextResponse.json({ store: updated });
}
