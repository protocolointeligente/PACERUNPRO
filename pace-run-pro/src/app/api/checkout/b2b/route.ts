import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireCoach } from "@/lib/auth-guard";
import { createPixOrder, createCreditCardOrder } from "@/lib/pagbank";
import { checkoutLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

const B2bCheckoutSchema = z.object({
  method:        z.enum(["pix", "cartao"]),
  planId:        z.string().min(1).max(50),
  customerName:  z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerCpf:   z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos numéricos").optional(),
  encryptedCard: z.string().max(2000).optional(),
});

// Canonical B2B plan prices — source of truth on the server (in cents)
const B2B_PLAN_PRICES: Record<string, number> = {
  "b2b-free":       0,
  "b2b-starter":    9700,   // R$ 97/mês
  "b2b-pro":        19700,  // R$ 197/mês
  "b2b-assessoria": 39700,  // R$ 397/mês
  "b2b-unlimited":  99700,  // R$ 997/mês
};

const B2B_PLAN_NAMES: Record<string, string> = {
  "b2b-free":       "Pace Run Pro — Grátis",
  "b2b-starter":    "Pace Run Pro — Starter",
  "b2b-pro":        "Pace Run Pro — Pro",
  "b2b-assessoria": "Pace Run Pro — Assessoria",
  "b2b-unlimited":  "Pace Run Pro — White Label",
};

function planIdToEnum(planId: string): SubscriptionPlan {
  if (planId === "b2b-free" || planId === "b2b-starter") return SubscriptionPlan.COACH;
  return SubscriptionPlan.TEAM; // b2b-pro, b2b-assessoria, b2b-unlimited
}

export async function POST(req: NextRequest) {
  const rl = await checkoutLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de pagamento. Aguarde um momento e tente novamente." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const session = await getSession();
  const authError = requireCoach(session);
  if (authError) return authError;

  // requireCoach guarantees session and user.id exist at this point
  const userId = session!.user!.id as string;

  const raw = await req.json();
  const parsed = B2bCheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { method, planId, customerName, customerEmail, customerCpf } = parsed.data;

  // Server-side price lookup — never trust client-sent amounts
  if (!(planId in B2B_PLAN_PRICES)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }
  const amountCents = B2B_PLAN_PRICES[planId]!;
  const planName = B2B_PLAN_NAMES[planId]!;

  // Free plan — activate subscription directly, no payment required
  if (amountCents === 0) {
    try {
      const plan = planIdToEnum(planId);
      const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const existingSub = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { startedAt: "desc" },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: { plan, planSlug: planId, status: "ACTIVE", renewsAt },
        });
      } else {
        await prisma.subscription.create({
          data: { userId, plan, planSlug: planId, status: "ACTIVE", renewsAt },
        });
      }

      return NextResponse.json({ ok: true, free: true });
    } catch (err) {
      console.error("[checkout/b2b] free plan activation error:", err);
      return NextResponse.json({ error: "Erro ao ativar plano." }, { status: 500 });
    }
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "https://www.pacerunpro.com.br";
  const notificationUrl = `${origin}/api/webhooks/pagbank`;
  // _b2b suffix distinguishes B2B orders from B2C in logs and webhook handling
  const referenceId = `${userId}_${planId}_${Date.now()}_b2b`;

  try {
    if (method === "pix") {
      if (!customerCpf) {
        return NextResponse.json(
          { error: "CPF obrigatório para pagamento PIX." },
          { status: 400 },
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
      return NextResponse.json(result);
    }

    if (method === "cartao") {
      const { encryptedCard } = parsed.data;
      if (!encryptedCard) {
        return NextResponse.json(
          { error: "Dados do cartão incompletos. Recarregue a página e tente novamente." },
          { status: 400 },
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
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
  } catch (err) {
    console.error("[checkout/b2b]", err);
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 500 },
    );
  }
}
