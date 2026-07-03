import { NextResponse } from "next/server";
import { getSession, requireCoach } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET /api/coach/notificacoes
// Returns real-time coach notifications derived from DB events:
// - athlete completed a workout (last 24h)
// - high pain/fatigue check-in (last 24h, level >= 7)
// - missed workout (status PERDIDO, last 48h)
// - unread messages from athletes
// - upcoming race events (within 14 days)

export async function GET() {
  const session = await getSession();
  const guard = requireCoach(session);
  if (guard) return guard;

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user!.id as string },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const days14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const athletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    select: { id: true, user: { select: { name: true } } },
  });

  if (athletes.length === 0) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const athleteIds = athletes.map((a) => a.id);
  const athleteNameMap = new Map(athletes.map((a) => [a.id, a.user.name ?? "Atleta"]));

  const [completions, painCheckins, missedWorkouts, unreadMessages, upcomingRaces] =
    await Promise.all([
      // 1. Workout completions in last 24h
      prisma.workoutLog.findMany({
        where: {
          athleteId: { in: athleteIds },
          createdAt: { gte: h24 },
          workoutId: { not: null },
        },
        select: {
          id: true,
          athleteId: true,
          createdAt: true,
          distanceKm: true,
          durationSec: true,
          rpe: true,
          workout: { select: { title: true, date: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // 2. High pain / fatigue check-ins (last 24h, pain >= 7 or fatigue >= 8)
      prisma.checkIn.findMany({
        where: {
          athleteId: { in: athleteIds },
          createdAt: { gte: h24 },
          OR: [{ pain: { gte: 7 } }, { fatigue: { gte: 8 } }],
        },
        select: {
          id: true,
          athleteId: true,
          createdAt: true,
          pain: true,
          fatigue: true,
          notes: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // 3. Missed workouts (status PERDIDO, last 48h)
      prisma.workout.findMany({
        where: {
          week: { plan: { athleteId: { in: athleteIds } } },
          status: "PERDIDO",
          date: { gte: h48, lte: now },
        },
        select: {
          id: true,
          title: true,
          date: true,
          week: {
            select: {
              plan: { select: { athleteId: true } },
            },
          },
        },
        orderBy: { date: "desc" },
        take: 20,
      }),

      // 4. Unread messages from athletes (one per conversation)
      prisma.message.findMany({
        where: {
          conversation: { coachId: coach.id },
          readAt: null,
          fromUserId: { not: session!.user!.id as string },
        },
        select: {
          id: true,
          createdAt: true,
          content: true,
          conversationId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        distinct: ["conversationId"],
      }),

      // 5. Upcoming races within 14 days
      prisma.raceEvent.findMany({
        where: {
          coachId: coach.id,
          date: { gte: now, lte: days14 },
          completed: false,
        },
        select: {
          id: true,
          athleteId: true,
          title: true,
          date: true,
          priority: true,
          distanceKm: true,
        },
        orderBy: { date: "asc" },
        take: 10,
      }),
    ]);

  // Batch-fetch conversation -> athleteId mapping for messages
  const conversationIds = [...new Set(unreadMessages.map((m) => m.conversationId))];
  const conversations = conversationIds.length
    ? await prisma.conversation.findMany({
        where: { id: { in: conversationIds } },
        select: { id: true, athleteId: true },
      })
    : [];
  const convAthleteMap = new Map(conversations.map((c) => [c.id, c.athleteId]));

  // Build unified notification list
  type NotifItem = {
    id: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    createdAt: Date;
    severity: "info" | "warning" | "alert";
  };

  const notifications: NotifItem[] = [];

  for (const log of completions) {
    const name = athleteNameMap.get(log.athleteId) ?? "Atleta";
    const workoutTitle = log.workout?.title ?? "treino";
    const distStr = log.distanceKm ? ` — ${log.distanceKm.toFixed(1)} km` : "";
    const rpeStr = log.rpe ? ` — RPE ${log.rpe}` : "";
    notifications.push({
      id: `completion-${log.id}`,
      type: "WORKOUT_COMPLETED",
      title: `${name} concluiu um treino`,
      body: `${workoutTitle}${distStr}${rpeStr}`,
      link: `/treinador/atletas/${log.athleteId}`,
      createdAt: log.createdAt,
      severity: "info",
    });
  }

  for (const ci of painCheckins) {
    const name = athleteNameMap.get(ci.athleteId) ?? "Atleta";
    const isPain = (ci.pain ?? 0) >= 7;
    const isFatigue = (ci.fatigue ?? 0) >= 8;
    const detail = [
      isPain ? `dor ${ci.pain}/10` : null,
      isFatigue ? `fadiga ${ci.fatigue}/10` : null,
    ]
      .filter(Boolean)
      .join(", ");
    notifications.push({
      id: `checkin-${ci.id}`,
      type: "HIGH_PAIN_FATIGUE",
      title: `Alerta: ${name}`,
      body: `Check-in com ${detail}${ci.notes ? ` — "${ci.notes}"` : ""}`,
      link: `/treinador/atletas/${ci.athleteId}`,
      createdAt: ci.createdAt,
      severity: (ci.pain ?? 0) >= 8 || (ci.fatigue ?? 0) >= 9 ? "alert" : "warning",
    });
  }

  for (const w of missedWorkouts) {
    const athleteId = w.week.plan.athleteId;
    const name = athleteNameMap.get(athleteId) ?? "Atleta";
    notifications.push({
      id: `missed-${w.id}`,
      type: "MISSED_WORKOUT",
      title: `Treino perdido — ${name}`,
      body: w.title,
      link: `/treinador/atletas/${athleteId}`,
      createdAt: w.date,
      severity: "warning",
    });
  }

  for (const msg of unreadMessages) {
    const athleteId = convAthleteMap.get(msg.conversationId);
    const name = athleteId ? (athleteNameMap.get(athleteId) ?? "Atleta") : "Atleta";
    notifications.push({
      id: `msg-${msg.id}`,
      type: "UNREAD_MESSAGE",
      title: `Mensagem de ${name}`,
      body: msg.content.length > 80 ? msg.content.slice(0, 77) + "…" : msg.content,
      link: `/treinador/mensagens/${msg.conversationId}`,
      createdAt: msg.createdAt,
      severity: "info",
    });
  }

  for (const race of upcomingRaces) {
    const name = athleteNameMap.get(race.athleteId) ?? "Atleta";
    const daysUntil = Math.round((race.date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const distStr = race.distanceKm ? ` (${race.distanceKm} km)` : "";
    notifications.push({
      id: `race-${race.id}`,
      type: "RACE_APPROACHING",
      title: `Prova em ${daysUntil} dias — ${name}`,
      body: `${race.title}${distStr} • Prioridade ${race.priority}`,
      link: `/treinador/atletas/${race.athleteId}`,
      createdAt: race.date,
      severity: daysUntil <= 7 ? "alert" : "warning",
    });
  }

  notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: notifications.length,
  });
}
