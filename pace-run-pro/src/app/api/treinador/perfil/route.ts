import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      avatarUrl: true,
      coach: { select: { credential: true, bio: true, whatsapp: true, specialties: true } },
    },
  });

  return NextResponse.json(user ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    avatarUrl?: string | null;
    credential?: string;
    bio?: string;
    whatsapp?: string;
    specialties?: string[];
  };

  try {
    const userUpdate: Record<string, unknown> = {};
    if (body.name !== undefined) userUpdate.name = body.name;
    if (body.phone !== undefined) userUpdate.phone = body.phone;
    if (body.city !== undefined) userUpdate.city = body.city;
    if (body.state !== undefined) userUpdate.state = body.state;
    if (body.avatarUrl !== undefined) userUpdate.avatarUrl = body.avatarUrl;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: session.user.id }, data: userUpdate });
    }

    const coachUpdate: Record<string, unknown> = {};
    if (body.credential !== undefined) coachUpdate.credential = body.credential;
    if (body.bio !== undefined) coachUpdate.bio = body.bio;
    if (body.whatsapp !== undefined) coachUpdate.whatsapp = body.whatsapp;
    if (body.specialties !== undefined) coachUpdate.specialties = body.specialties;

    if (Object.keys(coachUpdate).length > 0) {
      await prisma.coach.upsert({
        where: { userId: session.user.id },
        update: coachUpdate,
        create: { userId: session.user.id, ...coachUpdate },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[treinador/perfil PATCH]", err);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }
}
