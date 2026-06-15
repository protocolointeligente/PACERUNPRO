import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) {
    return NextResponse.json({ error: "Voucher não encontrado." }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && voucher.createdById !== session.user.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const { active } = (await req.json()) as { active?: boolean };
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Campo 'active' obrigatório." }, { status: 400 });
  }

  const updated = await prisma.voucher.update({ where: { id }, data: { active } });
  return NextResponse.json({ voucher: updated });
}
