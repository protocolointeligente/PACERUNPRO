import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { createPixOrder, createCreditCardOrder } from "@/lib/pagbank";
import { checkoutLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const rl = checkoutLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de pagamento. Aguarde um momento e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const session = await getSession();

  const body = (await req.json()) as {
    method: string;
    planId: string;
    customerName: string;
    customerEmail: string;
    customerCpf: string;
    userId?: string;
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
  };

  const { method, planId, customerName, customerEmail, customerCpf } = body;

  if (!method || !planId || !customerName || !customerEmail) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Faça login antes de prosseguir com o pagamento." }, { status: 401 });
  }
  const userId = session.user.id;
  const marketplacePlan = await prisma.planProduct.findFirst({
    where: { id: planId, published: true },
    select: {
      id: true,
      title: true,
      priceCents: true,
      currency: true,
      coachId: true,
    },
  });
  if (!marketplacePlan) {
    return NextResponse.json({ error: "Plano inválido ou indisponível para venda." }, { status: 400 });
  }
  const planName = marketplacePlan.title;
  const amountCents = marketplacePlan.priceCents;

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Cadastro de atleta não encontrado para esta compra." }, { status: 400 });
  }

  const purchase = await prisma.planPurchase.upsert({
    where: {
      productId_athleteId: {
        productId: marketplacePlan.id,
        athleteId: athlete.id,
      },
    },
    update: {
      pricePaidCents: amountCents,
      currency: marketplacePlan.currency,
      status: amountCents <= 0 ? "paid" : "pending",
    },
    create: {
      productId: marketplacePlan.id,
      athleteId: athlete.id,
      pricePaidCents: amountCents,
      currency: marketplacePlan.currency,
      status: amountCents <= 0 ? "paid" : "pending",
    },
  });
  const purchaseId = purchase.id;

  if (amountCents <= 0) {
    await prisma.athlete.update({
      where: { id: athlete.id },
      data: { coachId: marketplacePlan.coachId, status: "ativo" },
    });
    await prisma.planProduct.update({
      where: { id: marketplacePlan.id },
      data: { purchases: { increment: 1 } },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        coachId: marketplacePlan.coachId,
        athleteId: athlete.id,
        action: "PAYMENT",
        entity: "PlanPurchase",
        entityId: purchase.id,
        message: "Plano gratuito marketplace liberado automaticamente.",
        after: { status: "paid", amountCents: 0 },
      },
    });
    return NextResponse.json({ status: "PAID", purchaseId });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "https://www.pacerunpro.com.br";
  const notificationUrl = `${origin}/api/webhooks/pagbank`;

  const referenceId = [userId, planId, purchaseId, Date.now()].filter(Boolean).join("_");

  try {
    if (method === "pix") {
      if (!customerCpf) {
        return NextResponse.json(
          { error: "CPF obrigatório para pagamento PIX." },
          { status: 400 }
        );
      }
      const result = await createPixOrder({
        referenceId,
        customerName,
        customerEmail,
        customerCpf,
        amountCents,
        planName,
        notificationUrl,
      });
      return NextResponse.json({ ...result, purchaseId });
    }

    if (method === "cartao") {
      const { cardNumber, cardName, cardExpiry, cardCvv } = body;
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        return NextResponse.json(
          { error: "Dados do cartão incompletos." },
          { status: 400 }
        );
      }
      const [expMonth, expYear] = cardExpiry.split("/");
      const result = await createCreditCardOrder({
        referenceId,
        customerName,
        customerEmail,
        customerCpf: customerCpf ?? "",
        amountCents,
        planName,
        cardNumber,
        cardExpMonth: expMonth,
        cardExpYear: expYear?.length === 2 ? `20${expYear}` : expYear,
        cardCvv,
        cardHolderName: cardName,
        notificationUrl,
      });
      return NextResponse.json({ ...result, purchaseId });
    }

    return NextResponse.json(
      { error: "Método de pagamento inválido." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
