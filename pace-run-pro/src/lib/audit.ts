import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function writeAuditLog(opts: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        meta: opts.meta ? (opts.meta as Prisma.InputJsonValue) : undefined,
        ip: opts.ip ?? null,
      },
    });
  } catch {
    // Audit log failure must never crash the main request
  }
}
