import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

// GET — validate invite token, return coach info
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const invite = await prisma.athleteInvite.findUnique({
    where: { token },
    select: {
      id: true,
      usedAt: true,
      expiresAt: true,
      coach: {
        select: {
          id: true,
          user: { select: { name: true, avatarUrl: true, city: true } },
          specialties: true,
          bio: true,
        },
      },
    },
  });

  if (!invite) return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "Convite já utilizado" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado" }, { status: 410 });

  return NextResponse.json({
    coachId: invite.coach.id,
    coachName: invite.coach.user.name,
    coachAvatar: invite.coach.user.avatarUrl,
    coachCity: invite.coach.user.city,
    coachBio: invite.coach.bio,
    coachSpecialties: invite.coach.specialties,
  });
}

// POST — redeem invite: link the authenticated athlete to the coach
export async function POST(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "ATHLETE") return NextResponse.json({ error: "Apenas atletas podem usar convites" }, { status: 403 });

  const invite = await prisma.athleteInvite.findUnique({
    where: { token },
    select: { id: true, coachId: true, usedAt: true, expiresAt: true },
  });

  if (!invite) return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "Convite já utilizado" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado" }, { status: 410 });

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true, coachId: true } });
  if (!athlete) return NextResponse.json({ error: "Perfil de atleta não encontrado" }, { status: 404 });

  // Link athlete to coach + mark invite used in a transaction
  await prisma.$transaction([
    prisma.athlete.update({ where: { id: athlete.id }, data: { coachId: invite.coachId } }),
    prisma.athleteInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);

  // Notify the coach
  const coachUser = await prisma.coach.findUnique({
    where: { id: invite.coachId },
    select: { userId: true },
  });
  if (coachUser) {
    await prisma.notification.create({
      data: {
        userId: coachUser.userId,
        title: "Novo atleta no seu grupo!",
        body: `${session.user.name ?? "Um atleta"} aceitou seu convite e está vinculado a você.`,
        link: `/treinador/atletas`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
