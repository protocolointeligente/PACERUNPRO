import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

function planIdToEnum(planId: string): SubscriptionPlan {
  if (planId === "b2b-free" || planId === "b2b-starter" || planId === "starter") {
    return SubscriptionPlan.COACH;
  }
  return SubscriptionPlan.TEAM; // b2b-pro, b2b-assessoria, b2b-unlimited
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // PagBank: SHA-256 de "{token}-{payload bruto}", recebido em x-authenticity-token.
  const pagBankToken = process.env.PAGBANK_TOKEN;
  if (!pagBankToken && process.env.NODE_ENV === "production") {
    console.error("[pagbank] PAGBANK_TOKEN não configurado em produção");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (pagBankToken) {
    const receivedSig = req.headers.get("x-authenticity-token") ?? "";
    const expectedSig = createHash("sha256").update(`${pagBankToken}-${rawBody}`).digest("hex");
    const receivedBuffer = Buffer.from(receivedSig, "utf8");
    const expectedBuffer = Buffer.from(expectedSig, "utf8");
    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.warn("[pagbank] assinatura inválida recebida");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = event.id as string | undefined;
  console.log("[pagbank webhook] recebido id:", eventId, rawBody.slice(0, 200));

  // ── Encontra cobrança paga ──────────────────────────────────────────────
  // A Orders API envia o objeto completo do order com array charges[].
  // Formato: { id: "ORDE_...", reference_id: "...", charges: [{ status: "PAID", ... }] }
  // Também aceita notificação de charge standalone: { id: "CHAR_...", status: "PAID" }

  type ChargeObj = {
    id?: string;
    reference_id?: string;
    status?: string;
    amount?: { value?: number };
  };

  let paymentReferenceId: string | null = null;
  let amountCents = 0;

  const charges = event.charges as ChargeObj[] | undefined;
  if (Array.isArray(charges)) {
    // Order notification — procura primeira charge paga
    const paid = charges.find((c) => c.status === "PAID");
    if (paid) {
      paymentReferenceId = paid.reference_id ?? (event.reference_id as string | undefined) ?? null;
      amountCents = typeof paid.amount?.value === "number" ? paid.amount.value : 0;
    }
  } else if (
    typeof eventId === "string" &&
    (eventId.startsWith("CHAR_") || eventId.startsWith("CHAR")) &&
    (event.status as string | undefined) === "PAID"
  ) {
    // Charge standalone notification
    paymentReferenceId = (event.reference_id as string | undefined) ?? null;
    const amountObj = event.amount as { value?: number } | undefined;
    amountCents = typeof amountObj?.value === "number" ? amountObj.value : 0;
  }

  if (!paymentReferenceId) {
    console.log("[pagbank webhook] sem charge PAID, evento ignorado");
    return NextResponse.json({ received: true });
  }

  // referenceId formatos:
  // - legado: userId_planId_timestamp
  // - marketplace: userId_planProductId_planPurchaseId_timestamp
  const parts = paymentReferenceId.split("_");
  if (parts.length < 3) {
    console.warn("[pagbank] referenceId inesperado:", paymentReferenceId);
    return NextResponse.json({ received: true });
  }

  const [userId, planId, maybePurchaseId] = parts;

  try {
    if (parts.length >= 4 && maybePurchaseId) {
      const previous = await prisma.planPurchase.findUnique({
        where: { id: maybePurchaseId },
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
        console.warn("[pagbank] compra marketplace não encontrada:", maybePurchaseId);
        return NextResponse.json({ received: true });
      }

      const purchase = await prisma.planPurchase.update({
        where: { id: maybePurchaseId },
        data: { status: "paid", pricePaidCents: amountCents || previous.pricePaidCents },
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
          actorUserId: userId,
          coachId: purchase.product.coachId,
          athleteId: purchase.athleteId,
          action: "PAYMENT",
          entity: "PlanPurchase",
          entityId: purchase.id,
          message: "Compra de plano marketplace confirmada pelo PagBank.",
          after: { status: "paid", amountCents },
        },
      });

      console.log("[pagbank] compra marketplace paga:", purchase.id);
      return NextResponse.json({ received: true });
    }

    const plan = planIdToEnum(planId);
    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + 30);

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

    console.log("[pagbank] assinatura ativada — usuário:", userId, "plano:", plan);
  } catch (err) {
    console.error("[pagbank] erro ao ativar assinatura:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
