import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ConsentType } from "@prisma/client";

const ConsentSchema = z.object({
  type: z.nativeEnum(ConsentType),
  granted: z.boolean().default(true),
  version: z.string().max(32).optional(),
});

// GET — list consent history for the authenticated user (LGPD Art. 18)
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const records = await prisma.dataConsentRecord.findMany({
    where: { userId: session.user.id },
    select: { id: true, type: true, granted: true, version: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ records });
}

// POST — record a new consent or revocation event (LGPD Art. 7 / Art. 15)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ConsentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const record = await prisma.dataConsentRecord.create({
    data: {
      userId: session.user.id,
      type: parsed.data.type,
      granted: parsed.data.granted,
      version: parsed.data.version ?? null,
      ipAddress,
      userAgent,
      revokedAt: parsed.data.granted ? null : new Date(),
    },
    select: { id: true, type: true, granted: true, version: true, createdAt: true },
  });

  return NextResponse.json(record, { status: 201 });
}
