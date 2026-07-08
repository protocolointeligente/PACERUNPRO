import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json([]);

  const models = await prisma.coachZoneModel.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(models);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const model = await prisma.coachZoneModel.create({
    data: {
      coachId: coach.id,
      name: body.name,
      sport: body.sport ?? "CORRIDA",
      method: body.method ?? "FC_MAXIMA",
      zoneCount: body.zoneCount ?? 5,
      zones: body.zones ?? [],
    },
  });
  return NextResponse.json(model);
}
