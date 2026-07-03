import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// POST /api/marketplace/coupon-validate
// Body: { code: string, productId: string }
// Returns: { valid: bool, discountCents: number, finalCents: number }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { code?: string; productId?: string };
  if (!body.code || !body.productId) {
    return NextResponse.json({ error: "code e productId obrigatórios" }, { status: 400 });
  }

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: body.productId, published: true },
    select: { id: true, priceCents: true, coachId: true, storeId: true },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const coupon = await prisma.marketplaceCoupon.findUnique({
    where: { code: body.code.toUpperCase() },
    select: {
      id: true,
      coachId: true,
      storeId: true,
      discountPct: true,
      discountCents: true,
      minOrderCents: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      isActive: true,
    },
  });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ valid: false, error: "Cupom inválido ou inativo" });
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Cupom expirado" });
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, error: "Cupom esgotado" });
  }

  // Scope check: coupon must belong to same coach/store as product
  const coachMatch = !coupon.coachId || coupon.coachId === product.coachId;
  const storeMatch = !coupon.storeId || coupon.storeId === product.storeId;
  if (!coachMatch || !storeMatch) {
    return NextResponse.json({ valid: false, error: "Cupom não válido para este produto" });
  }

  if (coupon.minOrderCents != null && product.priceCents < coupon.minOrderCents) {
    return NextResponse.json({
      valid: false,
      error: `Pedido mínimo de R$ ${(coupon.minOrderCents / 100).toFixed(2)} para usar este cupom`,
    });
  }

  // Compute discount
  let discountCents = 0;
  if (coupon.discountPct != null) {
    discountCents = Math.round(product.priceCents * coupon.discountPct);
  } else if (coupon.discountCents != null) {
    discountCents = coupon.discountCents;
  }
  discountCents = Math.min(discountCents, product.priceCents);
  const finalCents = product.priceCents - discountCents;

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    discountCents,
    finalCents,
  });
}
