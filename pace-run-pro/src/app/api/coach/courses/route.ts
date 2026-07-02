import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoachId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return coach?.id ?? null;
}

// GET — list coach's courses (MarketplaceProducts of type CURSO)
export async function GET(_req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const courses = await prisma.marketplaceProduct.findMany({
    where: { coachId, type: "CURSO" },
    include: {
      courseModules: {
        include: { lessons: { select: { id: true } } },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = courses.map((c) => ({
    ...c,
    totalLessons: c.courseModules.reduce((s, m) => s + m.lessons.length, 0),
    totalModules: c.courseModules.length,
  }));

  return NextResponse.json(enriched);
}
