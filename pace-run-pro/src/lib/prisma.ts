import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { encrypt, decrypt } from "./encryption";
import { excludeDeletedMiddleware } from "./deletion-service";

type MiddlewareArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
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

type PrismaMiddleware = (params: MiddlewareParams, next: MiddlewareNext) => Promise<unknown>;

type PrismaClientWithUse = PrismaClient & {
  $use?: (middleware: PrismaMiddleware) => void;
};

type SentryLike = {
  captureException?: (
    error: Error,
    options?: {
      level?: string;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }
  ) => void;
};

/**
 * Middleware para monitorar performance de queries
 * Purpose: Detect slow queries, N+1 patterns, and performance regressions
 * Thresholds:
 * - 1s+: Warning
 * - 5s+: Error
 */
const queryPerformanceMiddleware: PrismaMiddleware = async (params, next) => {
  const start = performance.now();

  try {
    const result = await next(params);
    const duration = performance.now() - start;

    // Log slow queries
    const threshold = parseInt(process.env.QUERY_SLOW_THRESHOLD || "1000");

    if (duration > threshold) {
      const level = duration > 5000 ? "error" : "warn";
      const message = `[${level.toUpperCase()}] Slow query: ${params.model}.${params.action} took ${duration.toFixed(2)}ms`;
      
      if (level === "error") {
        console.error(message, {
          model: params.model,
          action: params.action,
          duration,
          where: params.args?.where,
        });
      } else {
        console.warn(message, {
          model: params.model,
          action: params.action,
          duration,
        });
      }

      // Send to Sentry if available
      const sentry = globalThis as typeof globalThis & { __SENTRY__?: SentryLike };
      if (typeof globalThis !== "undefined" && sentry.__SENTRY__) {
        try {
          if (sentry.__SENTRY__.captureException) {
            sentry.__SENTRY__.captureException(new Error(message), {
              level,
              tags: {
                source: "database-monitoring",
                model: params.model,
                action: params.action,
              },
              extra: {
                duration,
                threshold,
              },
            });
          }
        } catch {
          // Silently fail if Sentry not available
        }
      }
    }

    return result;
  } catch (error: unknown) {
    const duration = performance.now() - start;
    console.error(`[ERROR] Query failed: ${params.model}.${params.action} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

/**
 * Middleware para auto-encrypt/decrypt de campos sensíveis
 * 
 * Fields encrypted:
 * - BillingSettings: cpfCnpj, pixKey, bankAccount, bankAccountType
 * - ConnectedDevice: accessToken, refreshToken
 */
const encryptionMiddleware: PrismaMiddleware = async (params, next) => {
  // Fields to encrypt by model
  const encryptedFields: Record<string, string[]> = {
    BillingSettings: ["cpfCnpj", "pixKey", "bankAccount", "bankAccountType"],
    ConnectedDevice: ["accessToken", "refreshToken"],
  };

  const fieldsToEncrypt = encryptedFields[params.model] || [];
  const data = params.args.data;
  const createData = params.args.create;
  const updateData = params.args.update;

  // Encrypt before write
  if (["create", "update", "upsert"].includes(params.action)) {
    if (data) {
      for (const field of fieldsToEncrypt) {
        const value = data[field];
        if (typeof value === "string") {
          data[field] = encrypt(value);
        }
      }
    }
    if (params.action === "upsert" && createData) {
      for (const field of fieldsToEncrypt) {
        const value = createData[field];
        if (typeof value === "string") {
          createData[field] = encrypt(value);
        }
      }
    }
    if (params.action === "upsert" && updateData) {
      for (const field of fieldsToEncrypt) {
        const value = updateData[field];
        if (typeof value === "string") {
          updateData[field] = encrypt(value);
        }
      }
    }
  }

  // Execute query
  const result = await next(params);

  // Decrypt after read
  if (["findUnique", "findFirst", "findMany"].includes(params.action)) {
    if (Array.isArray(result)) {
      for (const record of result) {
        for (const field of fieldsToEncrypt) {
          const value = record[field];
          if (typeof value === "string") {
            try {
              record[field] = decrypt(value);
            } catch (error: unknown) {
              console.error(`Failed to decrypt ${params.model}.${field}:`, error);
            }
          }
        }
      }
    } else if (result) {
      for (const field of fieldsToEncrypt) {
        const value = (result as Record<string, unknown>)[field];
        if (typeof value === "string") {
          try {
            (result as Record<string, unknown>)[field] = decrypt(value);
          } catch (error: unknown) {
            console.error(`Failed to decrypt ${params.model}.${field}:`, error);
          }
        }
      }
    }
  }

  return result;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
  const client = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

  // Apply middlewares using the $use method (internal API)
  const prismaClient = client as PrismaClientWithUse;
  
  if (typeof prismaClient.$use === 'function') {
    // Middleware 0: Query Performance Monitoring (first, to measure all queries)
    prismaClient.$use(queryPerformanceMiddleware);
    
    // Middleware 1: Auto-encrypt sensitive fields
    prismaClient.$use(encryptionMiddleware);

    // Middleware 2: Auto-exclude soft-deleted records
    prismaClient.$use(excludeDeletedMiddleware);
  } else {
    console.warn('Prisma $use method not available - middlewares will not be applied');
  }

  return client;
}

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
