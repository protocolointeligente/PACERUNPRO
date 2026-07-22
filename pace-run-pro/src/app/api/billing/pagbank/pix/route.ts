import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createPixOrder } from "@/lib/pagbank";
import { BILLING_PLANS, isBillingPlanId } from "@/lib/billing-plans";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    select: { status: true },
  });
  return NextResponse.json({ active: subscription?.status === "ACTIVE" || subscription?.status === "TRIAL" });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { planId, taxId } = await req.json() as { planId?: unknown; taxId?: unknown };
  if (!isBillingPlanId(planId) || BILLING_PLANS[planId].amountCents === 0) {
    return NextResponse.json({ error: "Plano pago inválido" }, { status: 400 });
  }
  const cleanTaxId = typeof taxId === "string" ? taxId.replace(/\D/g, "") : "";
  if (cleanTaxId.length !== 11 && cleanTaxId.length !== 14) {
    return NextResponse.json({ error: "Informe um CPF ou CNPJ válido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const plan = BILLING_PLANS[planId];
  await prisma.subscription.updateMany({
    where: { userId: session.user.id, status: { notIn: ["ACTIVE", "TRIAL"] } },
    data: { plan: plan.subscriptionPlan, status: "PAST_DUE" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pacerunpro.com.br";
  const result = await createPixOrder({
    referenceId: `${session.user.id}_${planId}_${Date.now()}`,
    customerName: user.name,
    customerEmail: user.email,
    customerCpf: cleanTaxId,
    amountCents: plan.amountCents,
    planName: `Pace Run Pro — Plano ${plan.name}`,
    notificationUrl: `${appUrl.replace(/\/$/, "")}/api/webhooks/pagbank`,
  });

  return NextResponse.json(result);
}
