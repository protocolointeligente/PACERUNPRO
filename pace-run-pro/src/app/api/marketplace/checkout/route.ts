import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createPixOrder, createPixOrderWithSplit, getMarketplaceAccountId, MARKETPLACE_COMMISSION_RATE } from "@/lib/pagbank";

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

  const body = await req.json().catch(() => ({})) as {
    productId?: string;
    couponCode?: string;
    affiliateCode?: string;
    customerTaxId?: string; // CPF/CNPJ — required for PagBank
  };
  const { productId, couponCode, affiliateCode, customerTaxId } = body;
  if (!productId) return NextResponse.json({ error: "productId obrigatório" }, { status: 400 });

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: productId, published: true },
    include: {
      store: { select: { name: true } },
      coach: {
        select: {
          id: true,
          pagbankAccount: { select: { pagbankAccountId: true, authorizationStatus: true } },
        },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Commission is always MARKETPLACE_COMMISSION_RATE (10%) — centralized via marketplace
  const commissionPct = MARKETPLACE_COMMISSION_RATE;

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
      coupon?.isActive &&
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

  // Validate affiliate code
  let appliedAffiliate: { id: string; commissionPct: number } | null = null;
  if (affiliateCode) {
    const affiliate = await prisma.marketplaceAffiliate.findUnique({
      where: { code: affiliateCode.toUpperCase() },
      select: { id: true, commissionPct: true, isActive: true },
    });
    if (affiliate?.isActive) appliedAffiliate = affiliate;
  }

  const finalPriceCents = product.priceCents - discountCents;

  // Free product (or 100% discount)
  if (finalPriceCents === 0) {
    const order = await prisma.marketplaceOrder.create({
      data: {
        athleteId: athlete.id,
        totalCents: 0,
        discountCents: discountCents > 0 ? discountCents : undefined,
        couponId: appliedCouponId ?? undefined,
        affiliateCode: appliedAffiliate ? affiliateCode?.toUpperCase() : undefined,
        status: "PAID",
        items: { create: [{ productId: product.id, priceCents: 0, status: "FULFILLED" }] },
        commissions: {
          create: [{ coachId: product.coachId ?? null, grossCents: 0, commissionPct, commissionCents: 0, netCents: 0 }],
        },
      },
    });
    if (appliedCouponId) await prisma.marketplaceCoupon.update({ where: { id: appliedCouponId }, data: { usedCount: { increment: 1 } } });
    await prisma.marketplaceProduct.update({ where: { id: productId }, data: { purchases: { increment: 1 } } });
    return NextResponse.json({ free: true, orderId: order.id });
  }

  // Platform products (no coachId) → direct PIX to platform account (no split)
  // Coach products → require coach PagBank + split payment
  const isPlatformProduct = !product.coachId;
  const coachPagBank = product.coach?.pagbankAccount;

  if (!isPlatformProduct && (!coachPagBank || coachPagBank.authorizationStatus !== "authorized")) {
    return NextResponse.json(
      { error: "Este produto ainda não está disponível para pagamento. O treinador precisa conectar o PagBank." },
      { status: 422 }
    );
  }

  // For coach products: 90% coach / 10% platform. For platform products: 100% platform.
  const marketplaceCents = isPlatformProduct ? finalPriceCents : Math.round(finalPriceCents * commissionPct);
  const coachCents = isPlatformProduct ? 0 : finalPriceCents - marketplaceCents;

  // Create internal order record
  const order = await prisma.marketplaceOrder.create({
    data: {
      athleteId: athlete.id,
      totalCents: finalPriceCents,
      discountCents: discountCents > 0 ? discountCents : undefined,
      couponId: appliedCouponId ?? undefined,
      affiliateCode: appliedAffiliate ? affiliateCode?.toUpperCase() : undefined,
      status: "PENDING",
      items: { create: [{ productId: product.id, priceCents: finalPriceCents }] },
      commissions: {
        create: [{
          coachId: product.coachId ?? null,
          grossCents: finalPriceCents,
          commissionPct: isPlatformProduct ? 1 : commissionPct,
          commissionCents: marketplaceCents,
          netCents: coachCents,
        }],
      },
    },
  });

  // Record affiliate referral
  if (appliedAffiliate) {
    const earningCents = Math.round(finalPriceCents * appliedAffiliate.commissionPct);
    await prisma.marketplaceReferral.create({
      data: { affiliateId: appliedAffiliate.id, orderId: order.id, earningCents, status: "PENDING" },
    });
    await prisma.marketplaceAffiliate.update({ where: { id: appliedAffiliate.id }, data: { totalSales: { increment: 1 } } });
  }
  if (appliedCouponId) {
    await prisma.marketplaceCoupon.update({ where: { id: appliedCouponId }, data: { usedCount: { increment: 1 } } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";

  try {
    let pagbankOrderId: string;
    let pixCopyPaste: string;
    let pixQrCodeUrl: string | null;
    let expiresAt: string;

    if (isPlatformProduct) {
      // Direct PIX to platform account — no split needed
      const pix = await createPixOrder({
        referenceId: order.id,
        customerName: session.user.name ?? "Atleta",
        customerEmail: session.user.email ?? "",
        customerCpf: customerTaxId ?? "00000000000",
        amountCents: finalPriceCents,
        planName: product.title,
        notificationUrl: `${appUrl}/api/webhooks/pagbank`,
      });
      pagbankOrderId = pix.orderId;
      pixCopyPaste = pix.pixText;
      pixQrCodeUrl = pix.pixQrCodeUrl;
      expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
    } else {
      // Split PIX: coach receives net, platform receives commission
      const pix = await createPixOrderWithSplit({
        internalOrderId: order.id,
        totalCents: finalPriceCents,
        productName: product.title,
        customer: {
          name: session.user.name ?? "Atleta",
          email: session.user.email ?? "",
          taxId: customerTaxId ?? "00000000000",
        },
        receivers: [
          { accountId: coachPagBank!.pagbankAccountId, amountCents: coachCents },
          { accountId: getMarketplaceAccountId(), amountCents: marketplaceCents },
        ],
        notificationUrl: `${appUrl}/api/webhooks/pagbank`,
      });
      pagbankOrderId = pix.pagbankOrderId;
      pixCopyPaste = pix.pixCopyPaste;
      pixQrCodeUrl = pix.pixQrCodeUrl;
      expiresAt = pix.expiresAt;
    }

    await prisma.marketplaceOrder.update({
      where: { id: order.id },
      data: { pagbankOrderId },
    });

    return NextResponse.json({
      orderId: order.id,
      pix: { copyPaste: pixCopyPaste, qrCodeUrl: pixQrCodeUrl, expiresAt },
    });
  } catch {
    await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } }).catch(() => null);
    return NextResponse.json({ error: "Erro ao gerar cobrança PIX. Tente novamente." }, { status: 502 });
  }
}
