import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET — list all products pending moderation (unpublished)
export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const products = await prisma.marketplaceProduct.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      type: true,
      priceCents: true,
      published: true,
      featured: true,
      createdAt: true,
      purchases: true,
      coach: { select: { user: { select: { name: true } } } },
      store: { select: { name: true } },
    },
  });

  return NextResponse.json({ products });
}

// PATCH — approve (publish) or reject (unpublish), set featured
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json() as { id?: string; published?: boolean; featured?: boolean };
  const { id, published, featured } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof published === "boolean") data.published = published;
  if (typeof featured === "boolean") data.featured = featured;

  const updated = await prisma.marketplaceProduct.update({ where: { id }, data });
  return NextResponse.json({ product: { id: updated.id, published: updated.published, featured: updated.featured } });
}
