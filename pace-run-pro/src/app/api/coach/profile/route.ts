import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatarUrl: true,
      bannerUrl: true,
      coach: { select: { slug: true, credential: true } },
    },
  });

  return NextResponse.json({
    name: user?.name ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    bannerUrl: user?.bannerUrl ?? null,
    slug: user?.coach?.slug ?? null,
    credential: user?.coach?.credential ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = (await req.json()) as { avatarUrl?: string; bannerUrl?: string; slug?: string };

  if (body.avatarUrl !== undefined) {
    if (!body.avatarUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
    }
    if (body.avatarUrl.length > 2_800_000) {
      return NextResponse.json({ error: "Imagem muito grande (máx 2 MB)" }, { status: 413 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: body.avatarUrl },
    });
  }

  if (body.bannerUrl !== undefined) {
    if (!body.bannerUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
    }
    if (body.bannerUrl.length > 2_800_000) {
      return NextResponse.json({ error: "Imagem muito grande (máx 2 MB)" }, { status: 413 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { bannerUrl: body.bannerUrl },
    });
  }

  if (body.slug !== undefined) {
    const slug = String(body.slug).toLowerCase().trim();
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
      return NextResponse.json(
        { error: "URL inválida. Use letras, números e hífens (3–50 caracteres). Não pode começar ou terminar com hífen." },
        { status: 400 }
      );
    }
    const existing = await prisma.coach.findUnique({ where: { slug } });
    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Essa URL já está em uso. Escolha outra." }, { status: 409 });
    }
    await prisma.coach.upsert({
      where: { userId: session.user.id },
      update: { slug },
      create: { userId: session.user.id, slug },
    });
  }

  return NextResponse.json({ ok: true });
}
