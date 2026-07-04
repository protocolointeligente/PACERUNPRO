import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ConsentType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { gps?: boolean; health?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;
  const version = "1.0";

  const now = new Date();

  const records: { userId: string; type: ConsentType; granted: boolean; ipAddress: string | null; userAgent: string | null; version: string; revokedAt: Date | null }[] = [];

  if (typeof body.gps === "boolean") {
    records.push({
      userId: session.user.id,
      type: ConsentType.GPS_TRACKING,
      granted: body.gps,
      ipAddress,
      userAgent,
      version,
      revokedAt: body.gps ? null : now,
    });
  }

  if (typeof body.health === "boolean") {
    records.push({
      userId: session.user.id,
      type: ConsentType.HEALTH_DATA,
      granted: body.health,
      ipAddress,
      userAgent,
      version,
      revokedAt: body.health ? null : now,
    });
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "no_consent_types" }, { status: 400 });
  }

  await prisma.dataConsentRecord.createMany({ data: records });

  return NextResponse.json({ ok: true, count: records.length });
}
