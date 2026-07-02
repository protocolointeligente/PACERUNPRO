import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { workoutToDefinition, toERG } from "@/lib/export/structured-workout-export";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const ftp = parseInt(searchParams.get("ftp") ?? "250", 10);

  const workout = await prisma.workout.findUnique({
    where: { id },
    select: {
      id: true, title: true, sport: true, type: true,
      targetDurationMin: true, targetDistanceKm: true,
      targetPaceSecPerKm: true, targetPowerPctFtp: true,
      mainSet: true, notes: true,
      week: { select: { plan: { select: { athlete: { select: { userId: true } }, coachId: true } } } },
    },
  });

  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uid = session.user.id;
  if (workout.week.plan.athlete.userId !== uid && workout.week.plan.coachId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const definition = workoutToDefinition({ ...workout, workoutType: workout.type });
  const erg = toERG(definition, Number.isFinite(ftp) ? ftp : 250);

  return new Response(erg, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="treino-${id}.erg"`,
    },
  });
}
