import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

// GET /api/atleta/dados/exportar
// Returns a complete snapshot of the authenticated athlete's personal data
// Required by LGPD Art. 18 (right to access and portability)
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, athlete] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, avatarUrl: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.athlete.findUnique({
      where: { userId },
      select: {
        id: true, birthDate: true, sex: true, heightCm: true, weightKg: true,
        goal: true, level: true, weeklyAvailability: true, availableMinutes: true,
        injuryHistory: true, status: true, adherenceRate: true, recoveryScore: true,
        parqAccepted: true, parqAcceptedAt: true, createdAt: true,
      },
    }),
  ]);

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const [
    trainingPlans,
    workoutLogs,
    metrics,
    performanceTests,
    checkins,
    recoveryLogs,
    orders,
    reviews,
    questionnaires,
    physicalAssessments,
    races,
    raceEvents,
    consentRecords,
  ] = await Promise.all([
    prisma.trainingPlan.findMany({
      where: { athleteId: athlete.id },
      select: {
        id: true, name: true, startDate: true, endDate: true, goal: true,
        status: true, phase: true, createdAt: true,
        weeks: {
          select: {
            id: true, weekNumber: true,
            workouts: { select: { id: true, date: true, type: true, title: true, status: true } },
          },
        },
      },
    }),
    prisma.workoutLog.findMany({
      where: { athleteId: athlete.id },
      select: {
        id: true, workoutId: true, startedAt: true, finishedAt: true,
        durationSec: true, rpe: true, athleteFeedback: true, avgHr: true, maxHr: true,
        distanceKm: true, sport: true, source: true,
        setLogs: {
          select: { exerciseName: true, setNum: true, loadKg: true, reps: true, rpe: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 500,
    }),
    prisma.metric.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, date: true, weightKg: true, bodyFatPct: true, restingHr: true, hrv: true, vo2max: true, notes: true },
      orderBy: { date: "desc" },
      take: 500,
    }),
    prisma.performanceTest.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, type: true, sport: true, date: true, distanceM: true, durationSec: true, avgHr: true, vo2max: true, ftpWatts: true },
      orderBy: { date: "desc" },
    }),
    prisma.checkIn.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, mood: true, fatigue: true, sleep: true, pain: true, rpe: true, stress: true, notes: true, date: true },
      orderBy: { date: "desc" },
      take: 365,
    }),
    prisma.recoveryLog.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, score: true, ctl: true, atl: true, tsb: true, date: true, createdAt: true },
      orderBy: { date: "desc" },
      take: 365,
    }),
    prisma.marketplaceOrder.findMany({
      where: { athleteId: athlete.id },
      select: {
        id: true, status: true, totalCents: true, createdAt: true,
        items: { select: { product: { select: { title: true, type: true } }, priceCents: true, status: true } },
      },
    }),
    prisma.marketplaceReview.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, rating: true, comment: true, createdAt: true, product: { select: { title: true } } },
    }),
    prisma.questionnaire.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, type: true, title: true, responses: true, score: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 100,
    }),
    prisma.physicalAssessment.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, assessedAt: true, bodyFatPct: true, muscleMassKg: true, notes: true },
      orderBy: { assessedAt: "desc" },
    }),
    prisma.race.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, name: true, date: true, distanceKm: true, goalTime: true, resultTime: true, location: true },
      orderBy: { date: "desc" },
    }),
    prisma.raceEvent.findMany({
      where: { athleteId: athlete.id },
      select: { id: true, title: true, date: true, goalTime: true, priority: true, type: true, distanceKm: true, location: true },
    }),
    prisma.dataConsentRecord.findMany({
      where: { userId },
      select: { type: true, granted: true, createdAt: true, revokedAt: true, version: true },
    }),
  ]);

  await writeAuditLog({
    userId,
    action: "LGPD_DATA_EXPORT",
    entity: "Athlete",
    entityId: athlete.id,
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    lgpdBasis: "LGPD Art. 18 — Direito de acesso e portabilidade",
    user,
    athlete,
    trainingPlans,
    workoutLogs,
    metrics,
    performanceTests,
    checkins,
    recoveryLogs,
    marketplaceOrders: orders,
    marketplaceReviews: reviews,
    questionnaires,
    physicalAssessments,
    races,
    raceEvents,
    consentRecords,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="meus-dados-pace-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
