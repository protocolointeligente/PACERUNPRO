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
  where?: Record<string, unknown>;
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

const SOFT_DELETE_MODELS = new Set([
  "User",
  "Athlete",
  "Coach",
  "Subscription",
  "BillingSettings",
]);

const READ_ACTIONS = new Set([
  "findUnique",
  "findFirst",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

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

  if (user.deletedAt) {
    throw new Error(`User ${userId} is already soft-deleted`);
  }

  const deletedAt = new Date();
  const anonymizedEmail = `deleted-${deletedAt.getTime()}-${user.id}@deleted.local`;

  const audit: DeletionAudit = {
    userId: user.id,
    email: user.email,
    role: user.role,
    reason: options.reason,
    deletedBy: options.deletedBy,
    deletedAt,
    relatedEntitiesDeleted: {
      athletes: user.athlete ? 1 : 0,
      coaches: user.coach ? 1 : 0,
      subscriptions: user.subscriptions.length,
      billingSettings: user.billingSettings ? 1 : 0,
    },
  };

  await prisma.$transaction(async (tx) => {
    if (user.athlete) {
      await tx.athlete.update({
        where: { id: user.athlete.id },
        data: { deletedAt },
      });
    }

    if (user.coach) {
      await tx.coach.update({
        where: { id: user.coach.id },
        data: { deletedAt },
      });
    }

    await tx.subscription.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt, status: "CANCELED", canceledAt: deletedAt },
    });

    if (user.billingSettings) {
      await tx.billingSettings.update({
        where: { id: user.billingSettings.id },
        data: {
          deletedAt,
          cpfCnpj: null,
          pixKey: null,
          bankAccount: null,
          bankAccountType: null,
        },
      });
    }

    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        passwordHash: null,
        name: "Conta excluida",
        avatarUrl: null,
        bannerUrl: null,
        image: null,
        phone: null,
        city: null,
        state: null,
        deletedAt,
        deletionReason: options.reason,
        deletedBy: options.deletedBy,
      },
    });

    await tx.deletionAuditLog.create({
      data: {
        userId: audit.userId,
        email: audit.email,
        role: audit.role,
        reason: audit.reason,
        deletedBy: audit.deletedBy,
        deletedAt: audit.deletedAt,
        relatedEntities: audit.relatedEntitiesDeleted,
      },
    });
  });

  return audit;
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

export async function cleanupSoftDeletedUsers(options: {
  grace_days?: number;
  batchSize?: number;
  dryRun?: boolean;
} = {}): Promise<{ deleted: number; errors: Array<{ userId: string; error: string }> }> {
  const graceDays = options.grace_days ?? 30;
  const batchSize = options.batchSize ?? 100;
  const cutoff = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      deletedAt: { lte: cutoff },
    },
    select: { id: true },
    take: batchSize,
    orderBy: { deletedAt: "asc" },
  });

  if (options.dryRun) {
    return { deleted: users.length, errors: [] };
  }

  if (users.length > 0 && process.env.ALLOW_HARD_DELETE_CLEANUP !== "true") {
    throw new Error("Hard-delete cleanup requires ALLOW_HARD_DELETE_CLEANUP=true");
  }

  let deleted = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  for (const user of users) {
    try {
      await hardDeleteUser(user.id, { force: true });
      deleted += 1;
    } catch (error) {
      errors.push({
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { deleted, errors };
}

export const NOT_DELETED = {
  where: { deletedAt: null },
};

export const INCLUDE_DELETED = {
  where: {},
};

export const excludeDeletedMiddleware = async (params: MiddlewareParams, next: MiddlewareNext) => {
  if (
    params.args.meta?.includeSoftDeleted === true ||
    !params.model ||
    !SOFT_DELETE_MODELS.has(params.model) ||
    !READ_ACTIONS.has(params.action)
  ) {
    return next(params);
  }

  if (params.action === "findUnique") {
    params.action = "findFirst";
  }

  if (Object.prototype.hasOwnProperty.call(params.args.where ?? {}, "deletedAt")) {
    return next(params);
  }

  params.args.where = {
    ...(params.args.where ?? {}),
    deletedAt: null,
  };

  return next(params);
};

const deletionService = {
  softDeleteUser,
  hardDeleteUser,
  cleanupSoftDeletedUsers,
  excludeDeletedMiddleware,
  NOT_DELETED,
  INCLUDE_DELETED,
};

export default deletionService;
