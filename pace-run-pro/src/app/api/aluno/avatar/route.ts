import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { dataUrl } = (await req.json()) as { dataUrl?: string };
  if (!dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: dataUrl },
  });

  return NextResponse.json({ ok: true });
}
