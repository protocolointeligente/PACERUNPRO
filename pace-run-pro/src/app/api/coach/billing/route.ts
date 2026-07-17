import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ReceivingMethod } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await prisma.billingSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(settings ?? {});
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    razaoSocial?: string;
    cpfCnpj?: string;
    responsavel?: string;
    receivingMethod?: string;
    pixKey?: string;
    bankName?: string;
    bankAgency?: string;
    bankAccount?: string;
    bankAccountType?: string;
    asaasAccountId?: string;
    asaasWalletId?: string;
    asaasApiKey?: string;
    asaasOnboardingStatus?: string;
    autoChargeEnabled?: boolean;
    autoChargeDayOfMonth?: number;
    gracePeriodDays?: number;
    blockAfterDays?: number;
  };

  const receivingMethod = body.receivingMethod
    ? (body.receivingMethod.toUpperCase() as ReceivingMethod)
    : undefined;
  const asaasReady = Boolean(
    receivingMethod === "ASAAS" &&
      body.cpfCnpj?.trim() &&
      body.pixKey?.trim() &&
      body.asaasAccountId?.trim() &&
      body.asaasWalletId?.trim(),
  );
  const asaasOnboardingStatus =
    body.asaasOnboardingStatus === "review"
      ? "review"
      : asaasReady
        ? "ready"
        : "pending";

  const data = {
    razaoSocial: body.razaoSocial ?? null,
    cpfCnpj: body.cpfCnpj ?? null,
    responsavel: body.responsavel ?? null,
    receivingMethod: receivingMethod ?? null,
    pixKey: body.pixKey ?? null,
    bankName: body.bankName ?? null,
    bankAgency: body.bankAgency ?? null,
    bankAccount: body.bankAccount ?? null,
    bankAccountType: body.bankAccountType ?? null,
    asaasAccountId: body.asaasAccountId ?? null,
    asaasWalletId: body.asaasWalletId ?? null,
    asaasApiKeyLast4: body.asaasApiKey ? body.asaasApiKey.slice(-4) : undefined,
    asaasOnboardingStatus,
    autoChargeEnabled: body.autoChargeEnabled ?? false,
    autoChargeDayOfMonth: body.autoChargeDayOfMonth ?? 5,
    gracePeriodDays: body.gracePeriodDays ?? 3,
    blockAfterDays: body.blockAfterDays ?? 15,
  };

  const settings = await prisma.billingSettings.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(settings);
}
