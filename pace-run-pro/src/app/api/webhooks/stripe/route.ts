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
    const { purchaseId, productId, marketplaceOrderId } = session.metadata ?? {};

    // Marketplace order (product/course/event checkout)
    if (marketplaceOrderId) {
      await prisma.marketplaceOrder.update({
        where: { id: marketplaceOrderId },
        data: {
          status: "PAID",
          stripeSessionId: session.id,
        },
      });
      await prisma.marketplaceOrderItem.updateMany({
        where: { orderId: marketplaceOrderId },
        data: { status: "PAID" },
      });
      if (productId) {
        await prisma.marketplaceProduct.update({
          where: { id: productId },
          data: { purchases: { increment: 1 } },
        }).catch(() => null);
      }
      return NextResponse.json({ received: true });
    }

    // Training plan purchase (legacy store)
    if (!purchaseId || !productId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    await prisma.planPurchase.update({
      where: { id: purchaseId },
      data: {
        status: "PAID",
        pricePaidCents: session.amount_total ?? 0,
        stripeSessionId: session.id,
      },
    });

    await prisma.planProduct.update({
      where: { id: productId },
      data: { purchases: { increment: 1 } },
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const { purchaseId, marketplaceOrderId } = session.metadata ?? {};

    if (marketplaceOrderId) {
      await prisma.marketplaceOrder.update({
        where: { id: marketplaceOrderId },
        data: { status: "PENDING", stripeSessionId: null },
      }).catch(() => null);
    } else if (purchaseId) {
      await prisma.planPurchase.update({
        where: { id: purchaseId },
        data: { status: "PENDING", stripeSessionId: null },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
