import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE")
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return NextResponse.json([]);

  const achievements = await prisma.achievement.findMany({
    where: { athleteId: athlete.id },
    orderBy: { earnedAt: "desc" },
  });

  return NextResponse.json(achievements);
}
