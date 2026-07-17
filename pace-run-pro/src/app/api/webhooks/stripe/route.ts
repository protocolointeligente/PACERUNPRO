import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe sends raw body — must disable Next.js body parser
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const { purchaseId, productId } = session.metadata ?? {};

    if (!purchaseId || !productId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const previous = await prisma.planPurchase.findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        status: true,
        pricePaidCents: true,
        productId: true,
        athleteId: true,
        product: { select: { coachId: true } },
      },
    });

    if (!previous) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const purchase = await prisma.planPurchase.update({
      where: { id: purchaseId },
      data: {
        status: "paid",
        pricePaidCents: session.amount_total ?? previous.pricePaidCents,
        stripeSessionId: session.id,
      },
      select: {
        id: true,
        productId: true,
        athleteId: true,
        product: { select: { coachId: true } },
      },
    });

    if (previous.status !== "paid") {
      await prisma.planProduct.update({
        where: { id: purchase.productId },
        data: { purchases: { increment: 1 } },
      });
    }

    await prisma.athlete.update({
      where: { id: purchase.athleteId },
      data: {
        coachId: purchase.product.coachId,
        status: "ativo",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.client_reference_id ?? null,
        coachId: purchase.product.coachId,
        athleteId: purchase.athleteId,
        action: "PAYMENT",
        entity: "PlanPurchase",
        entityId: purchase.id,
        message: "Compra de plano marketplace confirmada pelo Stripe.",
        after: { status: "paid", amountCents: session.amount_total ?? 0, productId },
      },
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const { purchaseId } = session.metadata ?? {};
    if (purchaseId) {
      // Reset pending purchase so they can retry
      await prisma.planPurchase.update({
        where: { id: purchaseId },
        data: { status: "pending", stripeSessionId: null },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
