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

    // Mark purchase as paid
    await prisma.planPurchase.update({
      where: { id: purchaseId },
      data: {
        status: "PAID",
        pricePaidCents: session.amount_total ?? 0,
        stripeSessionId: session.id,
      },
    });

    // Increment purchase counter on product
    await prisma.planProduct.update({
      where: { id: productId },
      data: { purchases: { increment: 1 } },
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const { purchaseId } = session.metadata ?? {};
    if (purchaseId) {
      // Reset pending purchase so they can retry
      await prisma.planPurchase.update({
        where: { id: purchaseId },
        data: { status: "PENDING", stripeSessionId: null },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
