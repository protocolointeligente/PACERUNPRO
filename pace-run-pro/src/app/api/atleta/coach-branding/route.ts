import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const DEFAULT_BRANDING = {
  assessoriaName: null as string | null,
  logoEmoji: "🏃",
  primaryColor: "#C6F24E",
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json(DEFAULT_BRANDING);
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { coachId: true },
  });
  if (!athlete?.coachId) return NextResponse.json(DEFAULT_BRANDING);

  // BillingSettings is tied to User, so go through Coach → User → BillingSettings
  const coach = await prisma.coach.findUnique({
    where: { id: athlete.coachId },
    select: {
      user: {
        select: {
          billingSettings: { select: { whiteLabelConfig: true } },
        },
      },
    },
  });

  const cfg = coach?.user?.billingSettings?.whiteLabelConfig;
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    return NextResponse.json(DEFAULT_BRANDING);
  }

  const config = cfg as Record<string, unknown>;
  return NextResponse.json({
    assessoriaName: typeof config.assessoriaName === "string" && config.assessoriaName
      ? config.assessoriaName
      : null,
    logoEmoji: typeof config.logoEmoji === "string" ? config.logoEmoji : DEFAULT_BRANDING.logoEmoji,
    primaryColor: typeof config.primaryColor === "string" && /^#[0-9a-f]{6}$/i.test(config.primaryColor)
      ? config.primaryColor
      : DEFAULT_BRANDING.primaryColor,
  });
}
