import { prisma } from "@/lib/prisma";

export type DeletionReason =
  | "user_requested"
  | "admin_abuse"
  | "inactivity"
  | "gdpr"
  | "data_breach"
  | "other";

export interface SoftDeleteOptions {
  reason: DeletionReason;
  deletedBy?: string;
  async?: boolean;
}

export interface DeletionAudit {
  userId: string;
  email: string;
  role: string;
  reason: DeletionReason;
  deletedBy?: string;
  deletedAt: Date;
  relatedEntitiesDeleted: {
    athletes: number;
    coaches: number;
    subscriptions: number;
    billingSettings: number;
  };
}

type MiddlewareArgs = {
  meta?: {
    includeSoftDeleted?: boolean;
  };
};

type MiddlewareParams = {
  model?: string;
  action: string;
  args: MiddlewareArgs;
};

type MiddlewareNext = (params: MiddlewareParams) => Promise<unknown>;

export async function softDeleteUser(
  userId: string,
  options: SoftDeleteOptions
): Promise<DeletionAudit> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!options.reason) {
    throw new Error("Deletion reason is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      athlete: { select: { id: true } },
      coach: { select: { id: true } },
      subscriptions: { select: { id: true } },
      billingSettings: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const audit: DeletionAudit = {
    userId: user.id,
    email: user.email,
    role: user.role,
    reason: options.reason,
    deletedBy: options.deletedBy,
    deletedAt: new Date(),
    relatedEntitiesDeleted: {
      athletes: user.athlete ? 1 : 0,
      coaches: user.coach ? 1 : 0,
      subscriptions: user.subscriptions.length,
      billingSettings: user.billingSettings ? 1 : 0,
    },
  };

  await logDeletionBlocked(audit);

  throw new Error(
    "Soft delete is disabled: the current schema has no deletedAt/deletion audit columns. Refusing to hard-delete user data."
  );
}

export async function hardDeleteUser(
  userId: string,
  options: { force?: boolean; grace_days?: number } = {}
): Promise<{ count: number; deletedAt: Date }> {
  if (!options.force) {
    throw new Error("Hard delete requires explicit force=true to prevent accidental deletion");
  }

  await prisma.user.delete({ where: { id: userId } });

  return {
    count: 1,
    deletedAt: new Date(),
  };
}

export async function cleanupSoftDeletedUsers(_options: {
  grace_days?: number;
  batchSize?: number;
  dryRun?: boolean;
} = {}): Promise<{ deleted: number; errors: Array<{ userId: string; error: string }> }> {
  // No-op while the schema has no deletedAt/deletion queue columns.
  return { deleted: 0, errors: [] };
}

export const NOT_DELETED = {
  where: {},
};

export const INCLUDE_DELETED = {
  where: {},
};

export const excludeDeletedMiddleware = async (params: MiddlewareParams, next: MiddlewareNext) => {
  if (params.args.meta?.includeSoftDeleted === true) {
    return next(params);
  }

  return next(params);
};

async function logDeletionBlocked(audit: DeletionAudit): Promise<void> {
  console.warn("[DELETION BLOCKED]", JSON.stringify(audit, null, 2));
}

const deletionService = {
  softDeleteUser,
  hardDeleteUser,
  cleanupSoftDeletedUsers,
  excludeDeletedMiddleware,
  NOT_DELETED,
  INCLUDE_DELETED,
};

export default deletionService;
