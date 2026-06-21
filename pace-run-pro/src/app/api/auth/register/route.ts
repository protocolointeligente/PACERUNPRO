import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function recommendPlanId(athleteCount: number): string {
  if (athleteCount <= 1) return "b2b-free";
  if (athleteCount <= 20) return "b2b-starter";
  if (athleteCount <= 80) return "b2b-pro";
  if (athleteCount <= 250) return "b2b-assessoria";
  return "b2b-unlimited";
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, city, goal, role, studentCount, coachId } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
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
      select: { id: true, email: true, name: true, role: true },
    });

    const recommendedPlanId = isCoach ? recommendPlanId(Number(studentCount) || 1) : null;

    return NextResponse.json({ user, recommendedPlanId }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
