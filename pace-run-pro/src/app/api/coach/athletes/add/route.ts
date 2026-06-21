import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "COACH") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, email } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    const coach = await prisma.coach.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id, specialties: [] },
      select: { id: true },
    });

    // Check if user already exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.role === "ATHLETE") {
      // Link existing athlete to this coach
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
