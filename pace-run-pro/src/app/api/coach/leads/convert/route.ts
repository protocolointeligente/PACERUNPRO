import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { leadId } = (await req.json()) as { leadId?: string };
  if (!leadId) {
    return NextResponse.json({ error: "leadId obrigatório" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, coachId: coach.id },
  });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  if (!lead.email) {
    return NextResponse.json({ error: "Lead sem e-mail — adicione um e-mail antes de converter" }, { status: 422 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: lead.email },
    select: { id: true, athlete: { select: { id: true } } },
  });

  let athleteId: string;

  if (existingUser) {
    if (existingUser.athlete) {
      // Athlete exists — just link to this coach if not already linked
      await prisma.athlete.update({
        where: { id: existingUser.athlete.id },
        data: { coachId: coach.id },
      });
      athleteId = existingUser.athlete.id;
    } else {
      // User exists but no athlete record yet
      const newAthlete = await prisma.athlete.create({
        data: { userId: existingUser.id, coachId: coach.id },
      });
      athleteId = newAthlete.id;
    }
  } else {
    // Create new user + athlete
    const newUser = await prisma.user.create({
      data: {
        email: lead.email,
        name: lead.name,
        phone: lead.phone ?? undefined,
        role: "ATHLETE",
        athlete: {
          create: { coachId: coach.id },
        },
      },
      select: { athlete: { select: { id: true } } },
    });
    athleteId = newUser.athlete!.id;
  }

  // Mark lead as converted with a dedicated field (not string-in-notes)
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: "ganho",
      convertedAt: new Date(),
      convertedAthleteId: athleteId,
    },
  });

  return NextResponse.json({ ok: true, athleteId });
}
