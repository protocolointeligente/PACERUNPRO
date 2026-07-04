import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity");
  const take = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

  const entries = await prisma.auditLog.findMany({
    where: entity ? { entity } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      userId: true,
      action: true,
      entity: true,
      entityId: true,
      meta: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ entries });
}
