import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const TYPE_SHORT: Record<string, string> = {
  RODAGEM_LEVE: "corrida",
  INTERVALADO_CURTO: "corrida",
  INTERVALADO_LONGO: "corrida",
  LONGAO: "corrida",
  REGENERATIVO: "corrida",
  PROGRESSIVO: "corrida",
  FARTLEK: "corrida",
  TEMPO_RUN: "corrida",
  SUBIDA: "corrida",
  TECNICA: "corrida",
  PROVA: "prova",
  FORCA: "forca",
  FUNCIONAL: "funcional",
  MOBILIDADE: "mobilidade",
  RECUPERACAO: "recuperacao",
};

const SUBTYPE_LABEL: Record<string, string> = {
  RODAGEM_LEVE: "Rodagem leve",
  INTERVALADO_CURTO: "Intervalado curto",
  INTERVALADO_LONGO: "Intervalado longo",
  LONGAO: "Longão",
  REGENERATIVO: "Regenerativo",
  PROGRESSIVO: "Progressivo",
  FARTLEK: "Fartlek",
  TEMPO_RUN: "Tempo Run",
  SUBIDA: "Subida",
  TECNICA: "Técnica",
};

const TYPE_COLORS: Record<string, string> = {
  corrida: "#38bdf8",
  forca: "#46E0C8",
  funcional: "#46E0C8",
  mobilidade: "#84cc16",
  recuperacao: "#94a3b8",
  prova: "#facc15",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let dateFilter: { gte: Date; lte: Date };
  if (fromParam && toParam) {
    dateFilter = {
      gte: new Date(fromParam + "T00:00:00"),
      lte: new Date(toParam + "T23:59:59"),
    };
  } else {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateFilter = {
      gte: todayStart,
      lte: new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  const workouts = await prisma.workout.findMany({
    where: {
      week: { plan: { athleteId: athlete.id } },
      date: dateFilter,
      status: { in: ["LIBERADO", "AGENDADO"] },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      type: true,
      title: true,
      status: true,
      objective: true,
      targetPaceSecPerKm: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetRpe: true,
      targetHrZone: true,
      imageUrl: true,
    },
  });

  const result = workouts.map((w) => {
    const rawType = w.type as string;
    const typeShort = TYPE_SHORT[rawType] ?? "corrida";
    const color = TYPE_COLORS[typeShort] ?? "#38bdf8";
    return {
      id: w.id,
      date: w.date.toISOString(),
      type: typeShort,
      subtype: SUBTYPE_LABEL[rawType],
      title: w.title,
      status: (w.status as string).toLowerCase() as "liberado" | "agendado",
      objective: w.objective,
      targetPaceSecPerKm: w.targetPaceSecPerKm,
      distanceKm: w.targetDistanceKm,
      durationMin: w.targetDurationMin,
      targetRpe: w.targetRpe,
      targetHrZone: w.targetHrZone,
      imageUrl: w.imageUrl,
      color,
    };
  });

  return NextResponse.json(result);
}
