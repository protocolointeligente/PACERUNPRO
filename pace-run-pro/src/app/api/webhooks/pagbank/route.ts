import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

// Maps plan IDs from checkout to SubscriptionPlan enum
function planIdToEnum(planId: string): SubscriptionPlan {
  if (planId === "starter") return SubscriptionPlan.COACH;
  return SubscriptionPlan.TEAM; // pro, assessoria, white-label
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify PagBank HMAC-SHA256 signature when secret is configured
  const webhookSecret = process.env.PAGBANK_WEBHOOK_SECRET;
  if (webhookSecret) {
    const receivedSig = req.headers.get("x-pagbank-signature") ?? "";
    const expectedSig = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (receivedSig !== expectedSig) {
      console.warn("[pagbank] invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type as string | undefined;
  console.log("[pagbank webhook]", eventType, JSON.stringify(event).slice(0, 300));

  if (eventType === "CHARGE_UPDATED") {
    const charge = (event.data as Record<string, unknown> | undefined) ?? {};

    if (charge.status === "PAID") {
      const referenceId = charge.reference_id as string | undefined;
      const chargeId = charge.id as string | undefined;
      const amountObj = charge.amount as Record<string, unknown> | undefined;
      const amountCents = typeof amountObj?.value === "number" ? amountObj.value : 0;

      if (!referenceId) {
        console.warn("[pagbank] charge PAID missing reference_id");
        return NextResponse.json({ received: true });
      }

      // referenceId format: userId_planId_timestamp
      const parts = referenceId.split("_");
      if (parts.length < 3) {
        console.warn("[pagbank] unexpected referenceId format:", referenceId);
        return NextResponse.json({ received: true });
      }

      const [userId, planId] = parts;

      try {
        const plan = planIdToEnum(planId);
        const renewsAt = new Date();
        renewsAt.setDate(renewsAt.getDate() + 30);

        // Upsert subscription: activate or create
        const existingSub = await prisma.subscription.findFirst({
          where: { userId },
          orderBy: { startedAt: "desc" },
        });

        let subscriptionId: string;

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { plan, status: "ACTIVE", renewsAt },
          });
          subscriptionId = existingSub.id;
        } else {
          const newSub = await prisma.subscription.create({
            data: { userId, plan, status: "ACTIVE", renewsAt },
          });
          subscriptionId = newSub.id;
        }

        // Record the payment
        await prisma.payment.create({
          data: {
            userId,
            subscriptionId,
            amountCents,
            currency: "BRL",
            status: "PAID",
            method: "pix",
            paidAt: new Date(),
          },
        });

        console.log("[pagbank] activated subscription for user", userId, "plan", plan, "chargeId", chargeId);
      } catch (err) {
        console.error("[pagbank] failed to activate subscription:", err);
        // Return 500 so PagBank retries the webhook
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
