import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    heightCm?: number | null;
    weightKg?: number | null;
    goal?: string | null;
    weeklyAvailability?: number | null;
    availableMinutes?: number | null;
    raceDate?: string | null;
    recentBestTime?: string | null;
  };

  const userUpdate: Record<string, unknown> = {};
  if (body.name !== undefined) userUpdate.name = body.name;
  if (body.phone !== undefined) userUpdate.phone = body.phone;
  if (body.city !== undefined) userUpdate.city = body.city;
  if (body.state !== undefined) userUpdate.state = body.state;

  const athleteUpdate: Record<string, unknown> = {};
  if (body.heightCm !== undefined) athleteUpdate.heightCm = body.heightCm;
  if (body.weightKg !== undefined) athleteUpdate.weightKg = body.weightKg;
  if (body.weeklyAvailability !== undefined) athleteUpdate.weeklyAvailability = body.weeklyAvailability;
  if (body.availableMinutes !== undefined) athleteUpdate.availableMinutes = body.availableMinutes;
  if (body.raceDate !== undefined) athleteUpdate.raceDate = body.raceDate ? new Date(body.raceDate) : null;
  if (body.recentBestTime !== undefined) athleteUpdate.recentBestTime = body.recentBestTime;

  try {
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdate,
      });
    }

    if (Object.keys(athleteUpdate).length > 0) {
      await prisma.athlete.upsert({
        where: { userId: session.user.id },
        update: athleteUpdate,
        create: { userId: session.user.id, ...athleteUpdate },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[aluno/perfil PATCH]", err);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }
}
