import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { checkContraindications, getInjuryZones, INJURY_ZONE_LABELS } from "@/lib/exercise-contraindications";

const QuerySchema = z.object({
  exercises: z.string().optional(), // comma-separated exercise keywords
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { athleteId } = await params;
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verify this athlete belongs to this coach
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, coachId: coach.id },
    select: { injuryHistory: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ exercises: searchParams.get("exercises") ?? undefined });
  const exerciseKeywords = parsed.success && parsed.data.exercises
    ? parsed.data.exercises.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const zones = getInjuryZones(athlete.injuryHistory);
  const warnings = checkContraindications(athlete.injuryHistory, exerciseKeywords);

  return NextResponse.json({
    hasInjuryHistory: !!athlete.injuryHistory?.trim(),
    injuryZones: zones.map((z) => ({ zone: z, label: INJURY_ZONE_LABELS[z] })),
    warnings,
  });
}
