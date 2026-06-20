import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { assessoriaId, action } = await req.json() as {
    assessoriaId?: string;
    action?: "approve" | "refuse";
    coachUserId?: string;
  };

  if (!assessoriaId || !action) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  if (action === "approve") {
    await prisma.subscription.updateMany({
      where: {
        user: {
          role: "COACH",
          coach: { id: assessoriaId },
        },
        status: "TRIAL",
      },
      data: { status: "ACTIVE" },
    });

    return NextResponse.json({ ok: true, message: "Assessoria aprovada" });
  }

  return NextResponse.json({ ok: true, message: "Assessoria recusada" });
}
