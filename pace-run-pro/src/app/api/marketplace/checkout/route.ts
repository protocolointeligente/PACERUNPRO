import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Apenas atletas podem comprar" }, { status: 403 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { productId?: string; couponCode?: string };
  const { productId, couponCode } = body;
  if (!productId) return NextResponse.json({ error: "productId obrigatório" }, { status: 400 });

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: productId, published: true },
    include: { store: { select: { name: true, stripeAccountId: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Get commission config
  const config = await prisma.marketplaceConfig.findFirst();
  const defaultPct = config?.defaultCommissionPct ?? 0.15;
  const commissionPct = product.commissionPct ?? defaultPct;

  // Resolve coupon discount
  let appliedCouponId: string | null = null;
  let discountCents = 0;
  if (couponCode && product.priceCents > 0) {
    const coupon = await prisma.marketplaceCoupon.findUnique({
      where: { code: couponCode.toUpperCase() },
      select: {
        id: true, coachId: true, storeId: true,
        discountPct: true, discountCents: true,
        minOrderCents: true, maxUses: true, usedCount: true,
        expiresAt: true, isActive: true,
      },
    });
    const coachMatch = !coupon?.coachId || coupon.coachId === product.coachId;
    const storeMatch = !coupon?.storeId || coupon.storeId === product.storeId;
    if (
      coupon &&
      coupon.isActive &&
      coachMatch &&
      storeMatch &&
      (!coupon.expiresAt || coupon.expiresAt >= new Date()) &&
      (coupon.maxUses == null || coupon.usedCount < coupon.maxUses) &&
      (coupon.minOrderCents == null || product.priceCents >= coupon.minOrderCents)
    ) {
      if (coupon.discountPct != null) {
        discountCents = Math.round(product.priceCents * coupon.discountPct);
      } else if (coupon.discountCents != null) {
        discountCents = coupon.discountCents;
      }
      discountCents = Math.min(discountCents, product.priceCents);
      appliedCouponId = coupon.id;
    }
  }

  const finalPriceCents = product.priceCents - discountCents;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";

  // Free product (or 100% discount)
  if (finalPriceCents === 0) {
    const order = await prisma.marketplaceOrder.create({
      data: {
        athleteId: athlete.id,
        totalCents: 0,
        discountCents: discountCents > 0 ? discountCents : undefined,
        couponId: appliedCouponId ?? undefined,
        status: "PAID",
        items: { create: [{ productId: product.id, priceCents: 0, status: "FULFILLED" }] },
        commissions: {
          create: [{
            coachId: product.coachId ?? null,
            grossCents: 0,
            commissionPct,
            commissionCents: 0,
            netCents: 0,
          }],
        },
      },
    });
    if (appliedCouponId) {
      await prisma.marketplaceCoupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }
    await prisma.marketplaceProduct.update({ where: { id: productId }, data: { purchases: { increment: 1 } } });
    return NextResponse.json({ free: true, orderId: order.id, redirectUrl: "/checkout/sucesso?free=1" });
  }

  // Create order
  const order = await prisma.marketplaceOrder.create({
    data: {
      athleteId: athlete.id,
      totalCents: finalPriceCents,
      discountCents: discountCents > 0 ? discountCents : undefined,
      couponId: appliedCouponId ?? undefined,
      status: "PENDING",
      items: { create: [{ productId: product.id, priceCents: finalPriceCents }] },
      commissions: {
        create: [{
          coachId: product.coachId ?? null,
          grossCents: finalPriceCents,
          commissionPct,
          commissionCents: Math.round(finalPriceCents * commissionPct),
          netCents: finalPriceCents - Math.round(finalPriceCents * commissionPct),
        }],
      },
    },
  });

  // Increment coupon usage counter
  if (appliedCouponId) {
    await prisma.marketplaceCoupon.update({
      where: { id: appliedCouponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  // Stripe checkout
  const stripe = getStripe();
  const coachStripeAccountId = product.store?.stripeAccountId ?? null;
  const netCents = finalPriceCents - Math.round(finalPriceCents * commissionPct);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "brl",
        unit_amount: finalPriceCents,
        product_data: {
          name: product.title,
          description: product.store?.name ? `por ${product.store.name}` : "PACE RUN PRO",
          images: product.coverUrl ? [product.coverUrl] : [],
        },
      },
      quantity: 1,
    }],
    metadata: {
      marketplaceOrderId: order.id,
      productId,
      athleteId: athlete.id,
    },
    success_url: `${appUrl}/checkout/sucesso?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/marketplace/${product.slug}`,
    customer_email: session.user.email ?? undefined,
    locale: "pt-BR",
    // Route net amount to coach's connected Stripe account when available
    ...(coachStripeAccountId
      ? { payment_intent_data: { transfer_data: { destination: coachStripeAccountId, amount: netCents } } }
      : {}),
  });

  await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { stripeSessionId: checkoutSession.id } });

  return NextResponse.json({ url: checkoutSession.url });
}
