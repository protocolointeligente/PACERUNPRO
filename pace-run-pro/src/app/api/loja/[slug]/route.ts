import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.planProduct.findUnique({
    where: { slug, published: true },
    include: {
      coach: { select: { slug: true, user: { select: { name: true, avatarUrl: true } } } },
    },
  });

  if (!product) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Check if the current athlete already owns this
  const session = await getSession();
  let alreadyOwned = false;
  if (session?.user?.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (athlete) {
      const existing = await prisma.planPurchase.findFirst({
        where: { productId: product.id, athleteId: athlete.id, status: "PAID" },
      });
      alreadyOwned = !!existing;
    }
  }

  return NextResponse.json({ product, alreadyOwned });
}
