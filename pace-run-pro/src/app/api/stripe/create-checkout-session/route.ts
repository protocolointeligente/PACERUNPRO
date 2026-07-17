import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId obrigatório" }, { status: 400 });

  // Load product
  const product = await prisma.planProduct.findUnique({
    where: { id: productId, published: true },
    include: { coach: { select: { user: { select: { name: true } } } } },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Require athlete role
  if (session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Apenas atletas podem comprar planos" }, { status: 403 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  // Check if already purchased
  const existing = await prisma.planPurchase.findFirst({
    where: { productId, athleteId: athlete.id, status: "paid" },
  });
  if (existing) {
    return NextResponse.json({ error: "Você já adquiriu este plano" }, { status: 409 });
  }

  // Free product — skip Stripe
  if (product.priceCents === 0) {
    const previous = await prisma.planPurchase.findUnique({
      where: { productId_athleteId: { productId, athleteId: athlete.id } },
      select: { id: true, status: true },
    });
    const purchase = await prisma.planPurchase.upsert({
      where: { productId_athleteId: { productId, athleteId: athlete.id } },
      update: { status: "paid", pricePaidCents: 0 },
      create: { productId, athleteId: athlete.id, pricePaidCents: 0, currency: "BRL", status: "paid" },
      select: { id: true },
    });
    if (previous?.status !== "paid") {
      await prisma.planProduct.update({ where: { id: productId }, data: { purchases: { increment: 1 } } });
    }
    await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        coachId: product.coachId,
        status: "ativo",
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        coachId: product.coachId,
        athleteId: athlete.id,
        action: "ACCESS",
        entity: "PlanPurchase",
        entityId: purchase.id,
        message: "Plano gratuito marketplace liberado automaticamente.",
        after: { status: "paid", productId, pricePaidCents: 0 },
      },
    });
    return NextResponse.json({ free: true, redirectUrl: "/checkout/sucesso?free=1" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";

  // Create pending purchase record
  const purchase = await prisma.planPurchase.upsert({
    where: { productId_athleteId: { productId, athleteId: athlete.id } },
    update: { status: "pending", pricePaidCents: product.priceCents },
    create: { productId, athleteId: athlete.id, pricePaidCents: product.priceCents, currency: "BRL", status: "pending" },
  });

  // Create Stripe Checkout Session
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: product.priceCents,
          product_data: {
            name: product.title,
            description: `Plano de ${product.durationWeeks} semanas · ${product.level} · por ${product.coach.user.name}`,
            images: product.coverUrl ? [product.coverUrl] : [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      purchaseId: purchase.id,
      productId,
      athleteId: athlete.id,
    },
    success_url: `${appUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/loja/${product.slug}`,
    customer_email: session.user.email ?? undefined,
    locale: "pt-BR",
  });

  // Save Stripe session ID on the purchase
  await prisma.planPurchase.update({
    where: { id: purchase.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
