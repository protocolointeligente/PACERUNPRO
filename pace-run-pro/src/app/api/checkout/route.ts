import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-guard";
import { createPixOrder, createCreditCardOrder } from "@/lib/pagbank";
import { checkoutLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const CheckoutSchema = z.object({
  method:        z.enum(["pix", "cartao"]),
  planId:        z.string().min(1).max(50),
  planName:      z.string().min(1).max(100),
  autoRenew:     z.boolean().optional(),
  voucherCode:   z.string().max(50).optional(),
  customerName:  z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerCpf:   z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos numéricos").optional(),
  encryptedCard: z.string().max(2000).optional(),
});

// Canonical B2C plan prices — source of truth on the server
const B2C_PLAN_PRICES: Record<string, number> = {
  mensal:     14990,  // R$ 149,90 × 1 month
  trimestral: 38370,  // R$ 127,90 × 3 months
  semestral:  67740,  // R$ 112,90 × 6 months
  anual:     117480,  // R$  97,90 × 12 months
};

export async function POST(req: NextRequest) {
  const rl = await checkoutLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de pagamento. Aguarde um momento e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const session = await getSession();

  const raw = await req.json();
  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const body = parsed.data;
  const { method, planId, planName, autoRenew, voucherCode, customerName, customerEmail, customerCpf } = body;

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

  // Encode autoRenew in referenceId so webhook can restore the preference
  const referenceId = `${userId}_${planId}_${Date.now()}${autoRenew ? "_ar" : ""}`;

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
      if (usedVoucherId) {
        await prisma.$executeRaw`UPDATE vouchers SET "usedCount" = "usedCount" + 1 WHERE id = ${usedVoucherId} AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
      }
      return NextResponse.json(result);
    }

    if (method === "cartao") {
      const { encryptedCard } = body;
      if (!encryptedCard) {
        return NextResponse.json(
          { error: "Dados do cartão incompletos. Recarregue a página e tente novamente." },
          { status: 400 }
        );
      }
      const result = await createCreditCardOrder({
        referenceId,
        customerName,
        customerEmail,
        customerCpf: customerCpf ?? "",
        amountCents,
        planName,
        encryptedCard,
        notificationUrl,
      });
      if (usedVoucherId) {
        await prisma.$executeRaw`UPDATE vouchers SET "usedCount" = "usedCount" + 1 WHERE id = ${usedVoucherId} AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
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
