import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { parqAccepted: true, parqAcceptedAt: true },
  });

  return NextResponse.json({
    parqAccepted: athlete?.parqAccepted ?? false,
    parqAcceptedAt: athlete?.parqAcceptedAt ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = (await req.json()) as { hasYesAnswers?: boolean };

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete)
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  await prisma.athlete.update({
    where: { id: athlete.id },
    data: {
      parqAccepted: true,
      parqAcceptedAt: new Date(),
      // Flag athlete if any PAR-Q answer was YES — trainer will be notified
      status: body.hasYesAnswers ? "risco" : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
