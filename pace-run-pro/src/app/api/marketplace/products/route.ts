import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type    = searchParams.get("type");
  const sport   = searchParams.get("sport");
  const level   = searchParams.get("level");
  const storeSlug = searchParams.get("store");

  const where: Record<string, unknown> = { published: true };
  if (type)  where.type  = type;
  if (sport) where.sport = sport;
  if (level) where.level = level;
  if (storeSlug) {
    const store = await prisma.marketplaceStore.findUnique({ where: { slug: storeSlug }, select: { id: true } });
    if (store) where.storeId = store.id;
  }

  const products = await prisma.marketplaceProduct.findMany({
    where,
    include: {
      store: { select: { name: true, slug: true, logoUrl: true } },
      coach: { select: { slug: true, user: { select: { name: true, avatarUrl: true } } } },
    },
    orderBy: [{ featured: "desc" }, { purchases: "desc" }, { createdAt: "desc" }],
    take: 80,
  });

  return NextResponse.json(products);
}
