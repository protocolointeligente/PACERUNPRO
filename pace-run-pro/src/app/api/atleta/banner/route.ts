import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { dataUrl } = (await req.json()) as { dataUrl?: string };
  if (!dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bannerUrl: dataUrl },
  });

  return NextResponse.json({ ok: true });
}
