import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadsLimiter } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rl = await leadsLimiter(req);
  if (!rl.ok) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde e tente novamente." }, { status: 429 });
  }

  const body = (await req.json()) as {
    coachSlug: string;
    name: string;
    phone?: string;
    email?: string;
  };

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const coachSlug = typeof body.coachSlug === "string" ? body.coachSlug.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 20) : undefined;

  if (!coachSlug || !name) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({ where: { slug: coachSlug } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  await prisma.lead.create({
    data: {
      coachId: coach.id,
      name,
      phone: phone ?? null,
      email: email ?? null,
      source: "quiz",
      stage: "novo",
    },
  });

  return NextResponse.json({ ok: true });
}
