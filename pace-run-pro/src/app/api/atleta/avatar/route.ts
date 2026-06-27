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
  const mime = dataUrl.split(";")[0].replace("data:", "");
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (mime.includes("svg") || !ALLOWED_MIME_TYPES.includes(mime)) {
    return NextResponse.json({ error: "Tipo de imagem não permitido" }, { status: 400 });
  }
  // ~2 MB limit (base64 inflates by ~1.37×, so 2.7M chars ≈ 2 MB)
  if (dataUrl.length > 2_800_000) {
    return NextResponse.json({ error: "Imagem muito grande (máx 2 MB)" }, { status: 413 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: dataUrl },
  });

  return NextResponse.json({ ok: true });
}
