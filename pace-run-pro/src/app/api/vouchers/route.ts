import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { VoucherAudience, VoucherType } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const vouchers = await prisma.voucher.findMany({
    where: session.user.role === "ADMIN" ? {} : { createdById: session.user.id },
    include: { createdBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vouchers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { code, type, value, audience, maxUses, expiresAt, note } = body as {
    code?: string;
    type?: VoucherType;
    value?: number;
    audience?: VoucherAudience;
    maxUses?: number | null;
    expiresAt?: string | null;
    note?: string | null;
  };

  if (!code || !type || typeof value !== "number") {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }
  if (type === "PERCENT" && (value < 1 || value > 100)) {
    return NextResponse.json({ error: "Desconto percentual deve ser entre 1 e 100." }, { status: 400 });
  }
  if (type === "FREE_MONTHS" && value < 1) {
    return NextResponse.json({ error: "Quantidade de meses grátis deve ser maior que zero." }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();
  const existing = await prisma.voucher.findUnique({ where: { code: normalizedCode } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um voucher com esse código." }, { status: 409 });
  }

  const voucher = await prisma.voucher.create({
    data: {
      code: normalizedCode,
      type,
      value,
      audience: audience ?? "ALL",
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      note: note ?? null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ voucher }, { status: 201 });
}
