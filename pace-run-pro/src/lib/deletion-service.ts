/**
 * Deletion Service — Soft Delete Implementation (P0.1)
 *
 * Responsável por:
 * 1. Soft delete de usuários (deletedAt + anonymization)
 * 2. Cascata de soft delete para entidades relacionadas
 * 3. Hard delete seguro (apenas após 30 dias)
 * 4. Cleanup automático de dados antigos
 * 5. Auditoria de deleções (who, when, why)
 *
 * LGPD Compliance:
 * - Right to be forgotten: 30-day grace period
 * - Data anonymization: email, password, PII nullified
 * - Audit trail: track deletions
 * - Restoration: possible within grace period
 */

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
  deletedBy?: string; // Admin user ID
  async?: boolean; // Process async (for large users)
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

// ============================================================================
// Main: Soft Delete User
// ============================================================================

/**
 * Soft delete a user and all related entities (LGPD Compliant)
 *
 * Steps:
 * 1. Fetch user to validate
 * 2. Soft delete related entities (Athlete, Coach, Subscription, BillingSettings)
 * 3. Anonymize PII in User record
 * 4. Set deletedAt timestamp
 * 5. Audit log
 * 6. Return audit record
 */
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

  // 1. Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      athlete: true,
      coach: true,
      subscriptions: true,
      billingSettings: true,
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  if (user.deletedAt) {
    throw new Error(`User ${userId} already soft-deleted at ${user.deletedAt}`);
  }

  // 2. Soft delete Athlete if exists
  const athletesDeleted = await prisma.athlete.updateMany({
    where: { userId },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 3. Soft delete Coach if exists
  const coachesDeleted = await prisma.coach.updateMany({
    where: { userId },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 4. Soft delete Subscriptions
  const subscriptionsDeleted = await prisma.subscription.updateMany({
    where: { userId },
    data: {
      deletedAt: new Date(),
    },
  });

  // 5. Soft delete BillingSettings
  const billingDeleted = await prisma.billingSettings.updateMany({
    where: { userId },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 6. Anonymize User record
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Mark as deleted
      deletedAt: new Date(),
      deletionReason: options.reason,
      deletedBy: options.deletedBy,
      updatedAt: new Date(),

      // Anonymize PII
      email: `deleted-${Date.now()}@pacerunpro.local`,
      passwordHash: null,
      avatarUrl: null,
      bannerUrl: null,
      image: null,
      phone: null,
      city: null,
      state: null,
    },
  });

  // 7. Create audit log
  const audit: DeletionAudit = {
    userId: user.id,
    email: user.email,
    role: user.role,
    reason: options.reason,
    deletedBy: options.deletedBy,
    deletedAt: new Date(),
    relatedEntitiesDeleted: {
      athletes: athletesDeleted.count,
      coaches: coachesDeleted.count,
      subscriptions: subscriptionsDeleted.count,
      billingSettings: billingDeleted.count,
    },
  };

  // Log deletion (to database or external service)
  await logDeletion(audit);

  return audit;
}

// ============================================================================
// Hard Delete (only after grace period)
// ============================================================================

/**
 * Hard delete a user after 30-day grace period
 *
 * Safety:
 * - Must be explicitly soft-deleted first
 * - Must wait 30+ days
 * - Requires force=true to prevent accidental deletion
 */
export async function hardDeleteUser(
  userId: string,
  options: { force?: boolean; grace_days?: number } = {}
): Promise<{ count: number; deletedAt: Date }> {
  const GRACE_PERIOD_MS = (options.grace_days || 30) * 24 * 60 * 60 * 1000;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  if (!user.deletedAt) {
    throw new Error(
      `User ${userId} is not soft-deleted. Soft delete first before hard delete.`
    );
  }

  const ageMs = Date.now() - user.deletedAt.getTime();
  if (ageMs < GRACE_PERIOD_MS) {
    const daysRemaining = Math.ceil((GRACE_PERIOD_MS - ageMs) / (24 * 60 * 60 * 1000));
    throw new Error(
      `User ${userId} must remain deleted for ${daysRemaining} more days before hard delete`
    );
  }

  if (!options.force) {
    throw new Error(
      "Hard delete requires explicit force=true to prevent accidental deletion"
    );
  }

  // Permanently delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    count: 1,
    deletedAt: user.deletedAt,
  };
}

// ============================================================================
// Cleanup Job: Auto-delete aged records
// ============================================================================

/**
 * Run daily to permanently delete soft-deleted users after grace period
 *
 * Usage:
 * ```
 * // In cron job (e.g., node-schedule or AWS Lambda)
 * await cleanupSoftDeletedUsers({ batchSize: 100 });
 * ```
 */
export async function cleanupSoftDeletedUsers(options: {
  grace_days?: number;
  batchSize?: number;
  dryRun?: boolean;
} = {}): Promise<{ deleted: number; errors: Array<{ userId: string; error: string }> }> {
  const GRACE_PERIOD_MS = (options.grace_days || 30) * 24 * 60 * 60 * 1000;
  const BATCH_SIZE = options.batchSize || 100;

  const threshold = new Date(Date.now() - GRACE_PERIOD_MS);

  // Find users eligible for hard delete
  const eligibleUsers = await prisma.user.findMany({
    where: {
      deletedAt: {
        lt: threshold,
      },
    },
    select: { id: true },
    take: BATCH_SIZE,
  });

  if (eligibleUsers.length === 0) {
    return { deleted: 0, errors: [] };
  }

  if (options.dryRun) {
    console.log(
      `[DRY RUN] Would delete ${eligibleUsers.length} aged users`
    );
    return { deleted: 0, errors: [] };
  }

  // Hard delete
  const errors: Array<{ userId: string; error: string }> = [];
  let deleted = 0;

  for (const user of eligibleUsers) {
    try {
      await hardDeleteUser(user.id, { force: true });
      deleted++;
    } catch (error) {
      errors.push({
        userId: user.id,
        error: String(error),
      });
    }
  }

  console.log(
    `[CLEANUP] Permanently deleted ${deleted}/${eligibleUsers.length} aged soft-deleted users`
  );

  return { deleted, errors };
}

// ============================================================================
// Query Helpers: Exclude soft-deleted records
// ============================================================================

/**
 * Helper to exclude soft-deleted records from queries
 *
 * Usage:
 * ```
 * const user = await prisma.user.findUnique({
 *   where: { id: userId },
 *   ...NOT_DELETED,
 * });
 *
 * const athletes = await prisma.athlete.findMany({
 *   where: {
 *     coachId: coachId,
 *     ...NOT_DELETED.where,
 *   },
 * });
 * ```
 */
export const NOT_DELETED = {
  where: {
    deletedAt: null,
  },
};

export const INCLUDE_DELETED = {
  where: {
    // No filter - includes deleted
  },
};

// ============================================================================
// Middleware: Auto-exclude soft-deleted
// ============================================================================

/**
 * Prisma middleware to automatically exclude soft-deleted records from queries
 *
 * Usage in src/lib/prisma.ts:
 * ```
 * const prisma = new PrismaClient();
 * prisma.$use(excludeDeletedMiddleware);
 * ```
 *
 * Note: This middleware will exclude deletedAt IS NOT NULL from most operations.
 * For specific cases where you need to include deleted, pass { includeSoftDeleted: true } in meta.
 */
export const excludeDeletedMiddleware = async (params: MiddlewareParams, next: MiddlewareNext) => {
  // Skip middleware for certain operations
  if (["count", "aggregate", "groupBy"].includes(params.action)) {
    return next(params);
  }

  // Check if user explicitly wants to include deleted
  if (params.args.meta?.includeSoftDeleted === true) {
    return next(params);
  }

  // Models with soft delete
  const modelsWithSoftDelete = [
    "User",
    "Athlete",
    "Coach",
    "Subscription",
    "BillingSettings",
  ];

  if (modelsWithSoftDelete.includes(params.model)) {
    // For queries (find, findMany, findFirst)
    if (["findUnique", "findFirst", "findMany"].includes(params.action)) {
      // Add NOT_DELETED filter
      if (params.args.where) {
        params.args.where = {
          AND: [params.args.where, { deletedAt: null }],
        };
      } else {
        params.args.where = { deletedAt: null };
      }
    }

    // For count
    if (params.action === "count") {
      if (params.args.where) {
        params.args.where = {
          AND: [params.args.where, { deletedAt: null }],
        };
      } else {
        params.args.where = { deletedAt: null };
      }
    }
  }

  return next(params);
};

// ============================================================================
// Internal: Logging
// ============================================================================

/**
 * Log deletion to audit trail (database, file, or external service)
 *
 * TODO: Implement actual logging (e.g., DeletionAuditLog table)
 */
async function logDeletion(audit: DeletionAudit): Promise<void> {
  // TODO: Save to DeletionAuditLog table or external service
  console.log("[DELETION AUDIT]", JSON.stringify(audit, null, 2));

  // Example: Save to database
  // await prisma.deletionAuditLog.create({
  //   data: {
  //     userId: audit.userId,
  //     email: audit.email,
  //     reason: audit.reason,
  //     deletedBy: audit.deletedBy,
  //     relatedEntitiesDeleted: audit.relatedEntitiesDeleted,
  //   },
  // });
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
