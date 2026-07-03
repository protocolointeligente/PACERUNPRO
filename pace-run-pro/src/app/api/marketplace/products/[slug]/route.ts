import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.marketplaceProduct.findFirst({
    where: { slug, published: true },
    include: {
      store: { select: { name: true, slug: true, logoUrl: true, description: true } },
      coach: {
        select: {
          slug: true,
          bio: true,
          specialties: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(product);
}
