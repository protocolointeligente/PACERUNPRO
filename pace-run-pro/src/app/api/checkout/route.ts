import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { createPixOrder, createCreditCardOrder } from "@/lib/pagbank";
import { checkoutLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// Canonical B2C plan prices — source of truth on the server
const B2C_PLAN_PRICES: Record<string, number> = {
  mensal:     14990,  // R$ 149,90 × 1 month
  trimestral: 38370,  // R$ 127,90 × 3 months
  semestral:  67740,  // R$ 112,90 × 6 months
  anual:     117480,  // R$  97,90 × 12 months
};

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
    planName: string;
    voucherCode?: string;
    customerName: string;
    customerEmail: string;
    customerCpf: string;
    userId?: string;
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
  };

  const { method, planId, planName, voucherCode, customerName, customerEmail, customerCpf } = body;

  if (!method || !planId || !customerName || !customerEmail) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  // Server-side price computation — never trust client-sent amounts
  const basePriceCents = B2C_PLAN_PRICES[planId];
  if (!basePriceCents) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  let discountPct = 0;
  let usedVoucherId: string | null = null;

  if (voucherCode?.trim()) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode.trim().toUpperCase() },
    });
    if (
      voucher &&
      voucher.active &&
      voucher.type === "PERCENT" &&
      (voucher.audience === "ALL" || voucher.audience === "B2C") &&
      (!voucher.expiresAt || voucher.expiresAt > new Date()) &&
      (voucher.maxUses === null || voucher.usedCount < voucher.maxUses)
    ) {
      discountPct = voucher.value;
      usedVoucherId = voucher.id;
    }
  }

  const amountCents = Math.round(basePriceCents * (1 - discountPct / 100));

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Faça login antes de prosseguir com o pagamento." }, { status: 401 });
  }
  const userId = session.user.id;

  const origin =
    req.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "https://www.pacerunpro.com.br";
  const notificationUrl = `${origin}/api/webhooks/pagbank`;

  const referenceId = `${userId}_${planId}_${Date.now()}`;

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
      // Track voucher usage (fire-and-forget, atomic)
      if (usedVoucherId) {
        prisma.$executeRaw`UPDATE vouchers SET "usedCount" = "usedCount" + 1 WHERE id = ${usedVoucherId} AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`.catch(() => null);
      }
      return NextResponse.json(result);
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
      if (usedVoucherId) {
        prisma.$executeRaw`UPDATE vouchers SET "usedCount" = "usedCount" + 1 WHERE id = ${usedVoucherId} AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`.catch(() => null);
      }
      return NextResponse.json(result);
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
