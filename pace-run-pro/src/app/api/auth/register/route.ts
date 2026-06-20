import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRecommendedB2BPlan } from "@/lib/mock-data";

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

    // Look up coach record when coachId (user ID) is provided for athlete registration
    let coachRecord: { id: string } | null = null;
    if (!isCoach && coachId) {
      coachRecord = await prisma.coach.findUnique({
        where: { userId: coachId },
        select: { id: true },
      });
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

    const recommendedPlanId = isCoach
      ? getRecommendedB2BPlan(Number(studentCount) || 1).id
      : null;

    return NextResponse.json({ user, recommendedPlanId }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
