import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id || session.user.role !== "COACH") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, email: rawEmail } = await req.json();
    if (!name || !rawEmail) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const coach = await prisma.coach.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id, specialties: [] },
      select: { id: true },
    });

    // Check if user already exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.role === "ATHLETE") {
      const athleteRow = await prisma.athlete.findUnique({
        where: { userId: user.id },
        select: { coachId: true },
      });
      if (athleteRow?.coachId && athleteRow.coachId !== coach.id) {
        return NextResponse.json({ error: "Atleta já vinculado a outro treinador." }, { status: 409 });
      }
      await prisma.athlete.upsert({
        where: { userId: user.id },
        update: { coachId: coach.id },
        create: { userId: user.id, coachId: coach.id },
      });
      return NextResponse.json({ success: true, existing: true });
    }

    if (user) {
      return NextResponse.json({ error: "Este e-mail já está em uso por outra conta." }, { status: 409 });
    }

    // Enforce athlete slot limit based on coach's active subscription
    const coachUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptions: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: { plan: true, status: true, renewsAt: true },
        },
      },
    });
    const sub = coachUser?.subscriptions?.[0];
    const planIsActive = sub && (sub.status === "ACTIVE" || sub.status === "TRIAL") && (!sub.renewsAt || sub.renewsAt > new Date());
    const SLOT_LIMITS: Record<string, number> = { FREE: 3, ATHLETE: 20, COACH: 80, TEAM: 250 };
    const maxSlots = planIsActive ? (SLOT_LIMITS[sub!.plan] ?? 1) : 1;

    const currentCount = await prisma.athlete.count({ where: { coachId: coach.id } });
    if (currentCount >= maxSlots) {
      return NextResponse.json({ error: `Limite de atletas atingido para seu plano (${maxSlots}). Faça upgrade para adicionar mais atletas.` }, { status: 403 });
    }

    // Generate a temporary password
    const tempPassword = randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ATHLETE",
        athlete: { create: { coachId: coach.id } },
      },
    });

    return NextResponse.json({ success: true, tempPassword, existing: false });
  } catch (err) {
    console.error("[coach/athletes/add]", err);
    return NextResponse.json({ error: "Erro ao adicionar atleta. Tente novamente." }, { status: 500 });
  }
}
