import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Called by Vercel Cron at 07:00 America/Sao_Paulo
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID não configurado" }, { status: 503 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:support@pacerunpro.com.br",
    vapidPublic,
    vapidPrivate,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: { select: { id: true, name: true } } },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const userIds = subscriptions.map((s) => s.userId);

  const workoutsToday = await prisma.workout.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
      status: { not: "CONCLUIDO" },
      week: { plan: { athlete: { userId: { in: userIds } } } },
    },
    select: {
      type: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      week: { select: { plan: { select: { athlete: { select: { userId: true } } } } } },
    },
  });

  const workoutByUser = new Map<string, { type: string; targetDistanceKm: number | null; targetDurationMin: number | null }>();
  for (const w of workoutsToday) {
    const uid = w.week.plan.athlete.userId;
    if (!workoutByUser.has(uid)) {
      workoutByUser.set(uid, { type: w.type, targetDistanceKm: w.targetDistanceKm, targetDurationMin: w.targetDurationMin });
    }
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    const workout = workoutByUser.get(sub.userId);
    if (!workout) continue;

    const label = workout.targetDistanceKm
      ? `${workout.targetDistanceKm} km`
      : workout.targetDurationMin
      ? `${workout.targetDurationMin} min`
      : workout.type;

    const payload = JSON.stringify({
      title: "Treino de hoje",
      body: `${workout.type} — ${label}. Bora lá, ${sub.user.name.split(" ")[0]}!`,
      url: "/atleta/plano",
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up expired subscriptions
  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  return NextResponse.json({ sent, stale: staleEndpoints.length });
}
