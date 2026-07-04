import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/reviews?productId=xxx — list reviews for a product
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId obrigatório" }, { status: 400 });

  const reviews = await prisma.marketplaceReview.findMany({
    where: { productId },
    include: { athlete: { select: { user: { select: { name: true, avatarUrl: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      athlete: { name: r.athlete.user.name, avatarUrl: r.athlete.user.avatarUrl },
    })),
  });
}

// POST /api/marketplace/reviews — submit a review (must have purchased the product)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Apenas atletas podem avaliar" }, { status: 401 });
  }

  const body = await req.json() as { productId?: string; rating?: number; comment?: string };
  const { productId, rating, comment } = body;

  if (!productId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "productId e rating (1-5) são obrigatórios" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  // Verify the athlete has purchased this product
  const hasPurchased = await prisma.marketplaceOrderItem.findFirst({
    where: {
      productId,
      order: { athleteId: athlete.id, status: { in: ["PAID", "FULFILLED"] } },
    },
  });
  if (!hasPurchased) {
    return NextResponse.json({ error: "Você precisa comprar o produto antes de avaliar" }, { status: 403 });
  }

  // Upsert (athlete can update their review)
  const review = await prisma.marketplaceReview.upsert({
    where: { productId_athleteId: { productId, athleteId: athlete.id } },
    create: { productId, athleteId: athlete.id, rating, comment: comment?.trim() ?? null },
    update: { rating, comment: comment?.trim() ?? null },
  });

  // Recompute product rating average
  const agg = await prisma.marketplaceReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.marketplaceProduct.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ?? null,
      ratingCount: agg._count.id,
    },
  });

  return NextResponse.json({ reviewId: review.id }, { status: 201 });
}
