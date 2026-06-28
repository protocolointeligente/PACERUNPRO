import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET — list physical assessments for athlete (coach access)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: athleteId } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  // Verify athlete belongs to this coach
  const athlete = await prisma.athlete.findFirst({ where: { id: athleteId, coachId: coach.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const assessments = await prisma.physicalAssessment.findMany({
    where: { athleteId },
    orderBy: { assessedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ assessments });
}

// POST — create a new physical assessment
export async function POST(req: NextRequest, { params }: Params) {
  const { id: athleteId } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const athlete = await prisma.athlete.findFirst({ where: { id: athleteId, coachId: coach.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = await req.json();
  const {
    assessedAt, weightKg, bodyFatPct, muscleMassKg, bmi,
    neckCm, chestCm, waistCm, hipCm, thighCm, calfCm, armCm, forearmCm,
    vo2max, restingHr, hrv, flexibilityScore,
    photoUrls, lgpdConsent, notes,
  } = body;

  if (!lgpdConsent) {
    return NextResponse.json({ error: "Consentimento LGPD é obrigatório para registrar dados de avaliação física" }, { status: 400 });
  }

  const assessment = await prisma.physicalAssessment.create({
    data: {
      athleteId,
      coachId: coach.id,
      assessedAt: assessedAt ? new Date(assessedAt) : new Date(),
      weightKg: weightKg ?? null,
      bodyFatPct: bodyFatPct ?? null,
      muscleMassKg: muscleMassKg ?? null,
      bmi: bmi ?? null,
      neckCm: neckCm ?? null,
      chestCm: chestCm ?? null,
      waistCm: waistCm ?? null,
      hipCm: hipCm ?? null,
      thighCm: thighCm ?? null,
      calfCm: calfCm ?? null,
      armCm: armCm ?? null,
      forearmCm: forearmCm ?? null,
      vo2max: vo2max ?? null,
      restingHr: restingHr ?? null,
      hrv: hrv ?? null,
      flexibilityScore: flexibilityScore ?? null,
      photoUrls: photoUrls ?? [],
      lgpdConsent: true,
      consentAt: new Date(),
      notes: notes ?? null,
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}
