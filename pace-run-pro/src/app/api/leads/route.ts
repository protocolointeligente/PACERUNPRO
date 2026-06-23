import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    coachSlug: string;
    name: string;
    phone?: string;
    email?: string;
  };

  if (!body.coachSlug || !body.name) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({ where: { slug: body.coachSlug } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  await prisma.lead.create({
    data: {
      coachId: coach.id,
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      source: "quiz",
      stage: "novo",
    },
  });

  return NextResponse.json({ ok: true });
}
