import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { VoucherAudience } from "@prisma/client";
import { voucherValidateLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = await voucherValidateLimiter(req);
  if (!rl.ok) {
    return NextResponse.json({ valid: false, error: "Muitas tentativas. Aguarde e tente novamente." }, { status: 429 });
  }

  const { code, audience } = (await req.json()) as { code?: string; audience?: VoucherAudience };
  if (!code) {
    return NextResponse.json({ valid: false, error: "Informe um código." }, { status: 400 });
  }

  const voucher = await prisma.voucher.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!voucher || !voucher.active) {
    return NextResponse.json({ valid: false, error: "Cupom inválido ou inativo." });
  }
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Cupom expirado." });
  }
  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
    return NextResponse.json({ valid: false, error: "Cupom esgotado." });
  }
  if (audience && voucher.audience !== "ALL" && voucher.audience !== audience) {
    return NextResponse.json({ valid: false, error: "Cupom não é válido para este plano." });
  }

  return NextResponse.json({
    valid: true,
    type: voucher.type,
    value: voucher.value,
    audience: voucher.audience,
  });
}
