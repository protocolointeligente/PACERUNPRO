import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (session.user.role !== "COACH") {
    return NextResponse.json({ error: "Apenas treinadores podem cancelar assinaturas por esta rota." }, { status: 403 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { startedAt: "desc" },
  });

  if (!sub) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada." }, { status: 404 });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELED", canceledAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
