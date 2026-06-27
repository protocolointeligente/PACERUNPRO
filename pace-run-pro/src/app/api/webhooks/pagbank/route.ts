import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

function planIdToEnum(planId: string): SubscriptionPlan {
  // B2C athlete plans
  if (planId === "mensal" || planId === "trimestral" || planId === "semestral" || planId === "anual") {
    return SubscriptionPlan.ATHLETE;
  }
  // B2B coach / assessoria plans
  if (planId === "b2b-free" || planId === "b2b-starter" || planId === "starter") {
    return SubscriptionPlan.COACH;
  }
  return SubscriptionPlan.TEAM; // b2b-pro, b2b-assessoria, b2b-unlimited
}

function planDurationDays(planId: string): number {
  if (planId === "trimestral") return 90;
  if (planId === "semestral") return 180;
  if (planId === "anual") return 365;
  return 30; // mensal + all B2B plans
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verificação HMAC-SHA256 obrigatória em produção
  const webhookSecret = process.env.PAGBANK_WEBHOOK_SECRET;
  if (!webhookSecret && process.env.NODE_ENV === "production") {
    console.error("[pagbank] PAGBANK_WEBHOOK_SECRET não configurado em produção");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (webhookSecret) {
    // PagBank envia a assinatura no header x-pagbank-signature como hex HMAC-SHA256
    const receivedSig = req.headers.get("x-pagbank-signature") ?? "";
    const expectedSig = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (receivedSig !== expectedSig) {
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

  // referenceId formato: userId_planId_timestamp
  const parts = paymentReferenceId.split("_");
  if (parts.length < 3) {
    console.warn("[pagbank] referenceId inesperado:", paymentReferenceId);
    return NextResponse.json({ received: true });
  }

  const [userId, planId] = parts;

  // Detect payment method from charge object
  let paymentMethod = "pix";
  if (Array.isArray(charges)) {
    const paid = charges.find((c: { status?: string }) => c.status === "PAID");
    const paymentResponse = (paid as Record<string, unknown>)?.payment_response as Record<string, unknown> | undefined;
    const paymentMethodType = (paid as Record<string, unknown>)?.payment_method as string | undefined;
    if (paymentMethodType === "CREDIT_CARD" || paymentResponse?.type === "CREDIT_CARD") {
      paymentMethod = "cartao";
    }
  }

  try {
    const plan = planIdToEnum(planId);
    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + planDurationDays(planId));

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
        method: paymentMethod,
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
