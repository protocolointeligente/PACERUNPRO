import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegisterSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
  commissionPct: z.number().min(0.01).max(0.3).optional(),
});

// GET /api/marketplace/affiliates?code=XXX — validate code (public)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code obrigatório" }, { status: 400 });

  const affiliate = await prisma.marketplaceAffiliate.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, commissionPct: true, isActive: true, user: { select: { name: true } } },
  });

  if (!affiliate || !affiliate.isActive) {
    return NextResponse.json({ error: "Código de afiliado inválido" }, { status: 404 });
  }

  return NextResponse.json({
    code: affiliate.code,
    affiliateName: affiliate.user.name,
    discountPct: affiliate.commissionPct,
  });
}

// POST /api/marketplace/affiliates — register as affiliate (authenticated)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const { code, commissionPct = 0.10 } = parsed.data;
  const upperCode = code.toUpperCase();

  const existing = await prisma.marketplaceAffiliate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Você já possui um programa de afiliado" }, { status: 409 });
  }

  const codeConflict = await prisma.marketplaceAffiliate.findUnique({
    where: { code: upperCode },
    select: { id: true },
  });
  if (codeConflict) {
    return NextResponse.json({ error: "Este código já está em uso" }, { status: 409 });
  }

  const affiliate = await prisma.marketplaceAffiliate.create({
    data: { userId: session.user.id, code: upperCode, commissionPct },
    select: { id: true, code: true, commissionPct: true, createdAt: true },
  });

  return NextResponse.json(affiliate, { status: 201 });
}
