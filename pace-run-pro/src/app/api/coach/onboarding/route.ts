import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET — current onboarding completion state
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { onboardingDone: true },
  });

  return NextResponse.json({ done: coach?.onboardingDone ?? [] });
}

// POST — mark a step complete (idempotent)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { stepId } = (await req.json()) as { stepId?: string };
  if (!stepId) return NextResponse.json({ error: "stepId obrigatório" }, { status: 400 });

  const coach = await prisma.coach.update({
    where: { userId: session.user.id },
    data: { onboardingDone: { push: stepId } },
    select: { onboardingDone: true },
  });

  return NextResponse.json({ done: coach.onboardingDone });
}

// DELETE — reset all steps (useful for testing / dev)
export async function DELETE() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.coach.update({
    where: { userId: session.user.id },
    data: { onboardingDone: [] },
  });

  return NextResponse.json({ done: [] });
}
