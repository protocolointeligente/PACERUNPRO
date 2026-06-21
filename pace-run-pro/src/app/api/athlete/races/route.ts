import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return NextResponse.json([]);

  const races = await prisma.race.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(races);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = (await req.json()) as {
    name: string;
    date: string;
    distanceKm: number;
    goalTime?: string;
    location?: string;
  };

  if (!body.name || !body.date || !body.distanceKm) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  const race = await prisma.race.create({
    data: {
      athleteId: athlete.id,
      name: body.name,
      date: new Date(body.date),
      distanceKm: body.distanceKm,
      goalTime: body.goalTime ?? null,
      location: body.location ?? null,
    },
  });

  return NextResponse.json(race, { status: 201 });
}
