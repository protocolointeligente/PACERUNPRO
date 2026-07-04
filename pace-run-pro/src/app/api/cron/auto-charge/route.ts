import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixOrder } from "@/lib/pagbank";

// Called by Vercel Cron daily at 08:00 BRT.
// Finds coaches with autoChargeEnabled and processes renewals for their athletes.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Find coaches with auto-charge enabled
  const billingConfigs = await prisma.billingSettings.findMany({
    where: { autoChargeEnabled: true },
    select: {
      userId: true,
      autoChargeDayOfMonth: true,
      gracePeriodDays: true,
      blockAfterDays: true,
    },
  });

  const todayDay = today.getDate();

  let charged = 0;
  let notified = 0;
  let blocked = 0;

  for (const billing of billingConfigs) {
    const chargeDay = billing.autoChargeDayOfMonth ?? 5;
    const graceDays = billing.gracePeriodDays ?? 3;
    const blockDays = billing.blockAfterDays ?? 15;

    // Fetch athletes belonging to this coach
    const coach = await prisma.coach.findUnique({
      where: { userId: billing.userId },
      select: { id: true },
    });
    if (!coach) continue;

    const athletes = await prisma.athlete.findMany({
      where: { coachId: coach.id },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptions: {
              orderBy: { startedAt: "desc" },
              take: 1,
              select: { id: true, status: true, renewsAt: true, planSlug: true, plan: true },
            },
          },
        },
      },
    });

    for (const athlete of athletes) {
      const sub = athlete.user.subscriptions[0];
      if (!sub || !sub.renewsAt) continue;

      const expiresAt = sub.renewsAt;
      const daysSinceExpiry = Math.floor((today.getTime() - expiresAt.getTime()) / 86400_000);

      // Not expired yet — schedule charge on chargeDay of the renewal month
      if (daysSinceExpiry < 0) {
        const daysUntilExpiry = -daysSinceExpiry;
        // Notify 3 days before expiry
        if (daysUntilExpiry <= graceDays) {
          await notifyAthlete(athlete.user.id, athlete.user.name, daysUntilExpiry);
          notified++;
        }
        continue;
      }

      // Past blockAfterDays — suspend access
      if (daysSinceExpiry > blockDays) {
        if (sub.status !== "PAST_DUE") {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "PAST_DUE" },
          });
          await notifyAthlete(athlete.user.id, athlete.user.name, 0, true);
          blocked++;
        }
        continue;
      }

      // Within grace period + it's charge day — attempt PIX charge
      if (todayDay === chargeDay || daysSinceExpiry === 0) {
        const planSlug = sub.planSlug ?? "mensal";
        const planPriceCents = PLAN_PRICES[planSlug] ?? 14990;
        const planName = PLAN_NAMES[planSlug] ?? "Pace Run Pro";

        const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pacerunpro.com.br";
        const notificationUrl = `${origin}/api/webhooks/pagbank`;
        const referenceId = `${athlete.user.id}_${planSlug}_${Date.now()}`;

        try {
          // Create PIX order — athlete will receive the code via notification
          const pix = await createPixOrder({
            referenceId,
            customerName: athlete.user.name,
            customerEmail: athlete.user.email,
            customerCpf: "00000000000", // placeholder — athlete needs to update CPF in profile
            amountCents: planPriceCents,
            planName,
            notificationUrl,
          });

          // Notify athlete with payment link
          await prisma.notification.create({
            data: {
              userId: athlete.user.id,
              title: "Renovação da assinatura",
              body: `Renove seu plano ${planName} para continuar treinando. Copie o código PIX para pagar.`,
              link: `/atleta/assinar?orderId=${pix.orderId}`,
            },
          });

          charged++;
        } catch (err) {
          console.error(`[auto-charge] erro ao criar PIX para atleta ${athlete.user.id}:`, err);
          // Notify athlete to renew manually
          await notifyAthlete(athlete.user.id, athlete.user.name, 0);
          notified++;
        }
      }
    }
  }

  console.log(`[auto-charge] charged=${charged} notified=${notified} blocked=${blocked}`);
  return NextResponse.json({ ok: true, charged, notified, blocked });
}

async function notifyAthlete(userId: string, name: string, daysLeft: number, blocked = false) {
  const title = blocked
    ? "Acesso suspenso — assinatura vencida"
    : daysLeft === 0
    ? "Assinatura vencida — renove agora"
    : `Assinatura vence em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`;

  const body = blocked
    ? `${name}, seu acesso foi suspenso por inadimplência. Renove para retomar.`
    : `${name}, renove seu plano para continuar tendo acesso à plataforma e seus treinos.`;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const already = await prisma.notification.findFirst({
    where: { userId, title, createdAt: { gte: cutoff } },
    select: { id: true },
  });

  if (!already) {
    await prisma.notification.create({
      data: { userId, title, body, link: "/atleta/assinar" },
    });
  }
}

// Canonical plan prices (cents) — mirrors checkout routes
const PLAN_PRICES: Record<string, number> = {
  mensal:     14990,
  trimestral: 38370,
  semestral:  67740,
  anual:     117480,
};

const PLAN_NAMES: Record<string, string> = {
  mensal:     "Pace Run Pro — Mensal",
  trimestral: "Pace Run Pro — Trimestral",
  semestral:  "Pace Run Pro — Semestral",
  anual:      "Pace Run Pro — Anual",
};
