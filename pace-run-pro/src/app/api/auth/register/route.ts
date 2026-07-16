import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authRegisterLimiter } from "@/lib/rate-limit";

function recommendPlanId(athleteCount: number): string {
  if (athleteCount <= 1) return "b2b-free";
  if (athleteCount <= 20) return "b2b-starter";
  if (athleteCount <= 80) return "b2b-pro";
  return "b2b-assessoria";
}

export async function POST(req: NextRequest) {
  const rl = authRegisterLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const { name, email, password, phone, city, goal, role, studentCount, coachId, salesPlanId } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Formato de e-mail inválido." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const isCoach = role === "COACH";

    // Look up (or create) coach record when coachId (user ID) is provided for athlete registration
    let coachRecord: { id: string } | null = null;
    if (!isCoach && coachId) {
      const coachUser = await prisma.user.findUnique({
        where: { id: coachId, role: "COACH" },
        select: { id: true },
      });
      if (coachUser) {
        coachRecord = await prisma.coach.upsert({
          where: { userId: coachId },
          update: {},
          create: { userId: coachId, specialties: [] },
          select: { id: true },
        });
      }
    }

    const salesPlan =
      !isCoach && coachRecord && salesPlanId
        ? await prisma.coachPlan.findFirst({
            where: { id: salesPlanId, coachId: coachRecord.id, active: true },
            select: { id: true, priceCents: true },
          })
        : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone ?? null,
        city: city ?? null,
        role: isCoach ? "COACH" : "ATHLETE",
        ...(isCoach
          ? { coach: { create: { specialties: [] } } }
          : { athlete: { create: { goal: goal ?? null, ...(coachRecord ? { coachId: coachRecord.id } : {}) } } }),
      },
      select: { id: true, email: true, name: true, role: true, athlete: { select: { id: true } } },
    });

    if (!isCoach && user.athlete && salesPlan) {
      await prisma.coachPlanPurchase.create({
        data: {
          coachPlanId: salesPlan.id,
          athleteId: user.athlete.id,
          pricePaidCents: salesPlan.priceCents,
          status: salesPlan.priceCents > 0 ? "pending" : "paid",
        },
      }).then(() =>
        prisma.coachPlan.update({
          where: { id: salesPlan.id },
          data: { usedSlots: { increment: 1 } },
        }),
      ).catch(() => null);
    }

    const recommendedPlanId = isCoach ? recommendPlanId(Number(studentCount) || 1) : null;

    return NextResponse.json({ user, recommendedPlanId }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
