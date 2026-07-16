import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { assessoriaId, action } = await req.json() as {
    assessoriaId?: string;
    action?: "approve" | "refuse";
    coachUserId?: string;
  };

  if (!assessoriaId || (action !== "approve" && action !== "refuse")) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  if (action === "approve") {
    const coach = await prisma.coach.findUnique({
      where: { id: assessoriaId },
      select: { userId: true },
    });
    if (!coach) return NextResponse.json({ error: "Assessoria não encontrada" }, { status: 404 });

    const existingSub = await prisma.subscription.findFirst({
      where: { userId: coach.userId },
      orderBy: { startedAt: "desc" },
      select: { id: true, plan: true },
    });

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { status: "ACTIVE" },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: coach.userId,
          plan: "COACH",
          status: "ACTIVE",
          renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
    return NextResponse.json({ ok: true, message: "Assessoria aprovada" });
  }

  // action === "refuse"
  await prisma.subscription.updateMany({
    where: {
      user: { role: "COACH", coach: { id: assessoriaId } },
      status: { in: ["TRIAL", "ACTIVE"] },
    },
    data: { status: "CANCELED" },
  });
  return NextResponse.json({ ok: true, message: "Assessoria recusada" });
}
