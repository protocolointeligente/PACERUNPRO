import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const DEFAULT_WHITE_LABEL_CONFIG = {
  assessoriaName: "",
  logoEmoji: "🏃",
  primaryColor: "#C6F24E",
  featuresEnabled: ["Treinos", "Análise semanal", "IA Treinadora"],
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await prisma.billingSettings.findUnique({
    where: { userId: session.user.id },
    select: {
      customDomain: true,
      domainVerified: true,
      domainVerifiedAt: true,
      whiteLabelConfig: true,
    },
  });

  const whiteLabelConfig =
    settings?.whiteLabelConfig &&
    typeof settings.whiteLabelConfig === "object" &&
    !Array.isArray(settings.whiteLabelConfig)
      ? settings.whiteLabelConfig
      : DEFAULT_WHITE_LABEL_CONFIG;

  return NextResponse.json({
    customDomain: settings?.customDomain ?? null,
    domainVerified: settings?.domainVerified ?? false,
    domainVerifiedAt: settings?.domainVerifiedAt ?? null,
    whiteLabelConfig,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    customDomain?: string;
    whiteLabelConfig?: Record<string, unknown>;
  };

  const data: {
    customDomain?: string | null;
    whiteLabelConfig?: Prisma.InputJsonValue;
    domainVerified?: boolean;
  } = {};

  if ("customDomain" in body) {
    data.customDomain = body.customDomain ?? null;
    // If domain changes, reset verification
    const existing = await prisma.billingSettings.findUnique({
      where: { userId: session.user.id },
      select: { customDomain: true },
    });
    if (existing?.customDomain !== body.customDomain) {
      data.domainVerified = false;
    }
  }

  if (body.whiteLabelConfig) {
    data.whiteLabelConfig = body.whiteLabelConfig as Prisma.InputJsonValue;
  }

  const settings = await prisma.billingSettings.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
    select: {
      customDomain: true,
      domainVerified: true,
      domainVerifiedAt: true,
      whiteLabelConfig: true,
    },
  });

  const whiteLabelConfig =
    settings.whiteLabelConfig &&
    typeof settings.whiteLabelConfig === "object" &&
    !Array.isArray(settings.whiteLabelConfig)
      ? settings.whiteLabelConfig
      : DEFAULT_WHITE_LABEL_CONFIG;

  return NextResponse.json({
    customDomain: settings.customDomain,
    domainVerified: settings.domainVerified,
    domainVerifiedAt: settings.domainVerifiedAt,
    whiteLabelConfig,
  });
}
