import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km",
  QUARENTA_E_DOIS_KM: "42 km",
  ULTRAMARATONA: "Ultra",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
  PRO: "Pro",
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatarUrl: true,
      bannerUrl: true,
      city: true,
      state: true,
      phone: true,
      athlete: {
        select: {
          weightKg: true,
          heightCm: true,
          raceDate: true,
          birthDate: true,
          goal: true,
          level: true,
          cpf: true,
          coach: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({});

  return NextResponse.json({
    name: user.name,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    city: user.city,
    state: user.state,
    phone: user.phone,
    weightKg: user.athlete?.weightKg ?? null,
    heightCm: user.athlete?.heightCm ?? null,
    raceDate: user.athlete?.raceDate ? user.athlete.raceDate.toISOString().split("T")[0] : null,
    birthDate: user.athlete?.birthDate ? user.athlete.birthDate.toISOString().split("T")[0] : null,
    goal: user.athlete?.goal ? (GOAL_LABELS[user.athlete.goal] ?? user.athlete.goal) : null,
    level: user.athlete?.level ? (LEVEL_LABELS[user.athlete.level] ?? user.athlete.level) : null,
    coachName: user.athlete?.coach?.user?.name ?? null,
    cpf: user.athlete?.cpf ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    heightCm?: number | null;
    weightKg?: number | null;
    goal?: string | null;
    level?: string | null;
    sex?: string | null;
    injuryHistory?: string | null;
    weeklyAvailability?: number | null;
    availableMinutes?: number | null;
    raceDate?: string | null;
    recentBestTime?: string | null;
    cpf?: string | null;
  };

  const userUpdate: Record<string, unknown> = {};
  if (body.name !== undefined) userUpdate.name = body.name;
  if (body.phone !== undefined) userUpdate.phone = body.phone;
  if (body.city !== undefined) userUpdate.city = body.city;
  if (body.state !== undefined) userUpdate.state = body.state;

  const athleteUpdate: Record<string, unknown> = {};
  if (body.heightCm !== undefined) athleteUpdate.heightCm = body.heightCm;
  if (body.weightKg !== undefined) athleteUpdate.weightKg = body.weightKg;
  if (body.goal !== undefined) athleteUpdate.goal = body.goal ?? null;
  if (body.level !== undefined) athleteUpdate.level = body.level ?? undefined;
  if (body.sex !== undefined) athleteUpdate.sex = body.sex ?? null;
  if (body.injuryHistory !== undefined) athleteUpdate.injuryHistory = body.injuryHistory ?? null;
  if (body.weeklyAvailability !== undefined) athleteUpdate.weeklyAvailability = body.weeklyAvailability;
  if (body.availableMinutes !== undefined) athleteUpdate.availableMinutes = body.availableMinutes;
  if (body.raceDate !== undefined) athleteUpdate.raceDate = body.raceDate ? new Date(body.raceDate) : null;
  if (body.recentBestTime !== undefined) athleteUpdate.recentBestTime = body.recentBestTime;
  if (body.cpf !== undefined) athleteUpdate.cpf = body.cpf ? body.cpf.replace(/\D/g, "") : null;

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
    console.error("[atleta/perfil PATCH]", err);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }
}
