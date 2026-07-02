/**
 * Provider-agnostic sync service.
 * Fetches activities from any registered adapter, refreshes tokens automatically,
 * normalizes data, and persists to WorkoutLog (dedup by source+externalActivityId).
 */

import { prisma } from "@/lib/prisma";
import { adapterRegistry } from "@/lib/integrations/registry";
import { encrypt, decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";
import type { ProviderName, ProviderTokens, NormalizedActivity } from "@/lib/integrations/types";
import { TokenExpiredError } from "@/lib/integrations/types";

interface SyncResult {
  provider: ProviderName;
  synced: number;
  skipped: number;
  error?: string;
}

/** Load and decrypt tokens from ConnectedDevice row. */
function decryptTokens(device: {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt?: Date | null;
}): ProviderTokens {
  return {
    accessToken: device.accessToken ? decrypt(device.accessToken) : "",
    refreshToken: device.refreshToken ? decrypt(device.refreshToken) : undefined,
    expiresAt: device.tokenExpiresAt ?? undefined,
  };
}

/** Encrypt and save refreshed tokens back to DB. */
async function persistRefreshedTokens(
  deviceId: string,
  tokens: ProviderTokens,
): Promise<void> {
  await prisma.connectedDevice.update({
    where: { id: deviceId },
    data: {
      accessToken: tokens.accessToken ? encrypt(tokens.accessToken) : null,
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt ?? null,
    },
  });
}

/** Save a normalized activity to WorkoutLog; skip if already imported. */
async function upsertActivity(
  athleteId: string,
  activity: NormalizedActivity,
): Promise<"created" | "skipped"> {
  const existing = await prisma.workoutLog.findFirst({
    where: { source: activity.provider, externalActivityId: activity.sourceId },
    select: { id: true },
  });
  if (existing) return "skipped";

  await prisma.workoutLog.create({
    data: {
      athleteId,
      source: activity.provider,
      externalActivityId: activity.sourceId,
      startedAt: activity.startedAt,
      finishedAt: activity.finishedAt ?? null,
      distanceKm: activity.distanceKm ?? null,
      durationSec: activity.durationSec ?? null,
      avgPaceSecPerKm: activity.avgPaceSecPerKm ?? null,
      avgHr: activity.avgHrBpm ?? null,
      maxHr: activity.maxHrBpm ?? null,
      calories: activity.calories ?? null,
      elevationGainM: activity.elevationGainM ?? null,
      cadence: activity.cadenceAvg ?? null,
    },
  });
  return "created";
}

/** Sync one connected device for one athlete. Handles token refresh. */
export async function syncDevice(
  athleteId: string,
  provider: ProviderName,
): Promise<SyncResult> {
  const adapter = adapterRegistry.get(provider);

  const device = await prisma.connectedDevice.findUnique({
    where: { userId_provider: { userId: athleteId, provider: provider as never } },
  });

  if (!device?.accessToken) {
    return { provider, synced: 0, skipped: 0, error: "device_not_connected" };
  }

  let tokens = decryptTokens(device as { accessToken: string | null; refreshToken: string | null; tokenExpiresAt?: Date | null });

  // Auto-refresh if expired
  if (tokens.expiresAt && tokens.expiresAt <= new Date()) {
    try {
      tokens = await adapter.refreshTokens(tokens);
      await persistRefreshedTokens(device.id, tokens);
    } catch (err) {
      logger.error("Token refresh failed", { provider, athleteId, err });
      return { provider, synced: 0, skipped: 0, error: "token_refresh_failed" };
    }
  }

  let activities: NormalizedActivity[] = [];
  try {
    const since = device.lastSyncAt ?? undefined;
    activities = await adapter.fetchActivities(tokens, since ?? undefined);
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      // Try one more refresh
      try {
        tokens = await adapter.refreshTokens(tokens);
        await persistRefreshedTokens(device.id, tokens);
        activities = await adapter.fetchActivities(tokens, device.lastSyncAt ?? undefined);
      } catch {
        return { provider, synced: 0, skipped: 0, error: "auth_failed" };
      }
    } else {
      logger.error("fetchActivities failed", { provider, athleteId, err });
      return { provider, synced: 0, skipped: 0, error: "fetch_failed" };
    }
  }

  let synced = 0;
  let skipped = 0;
  for (const activity of activities) {
    const result = await upsertActivity(athleteId, activity);
    if (result === "created") synced++;
    else skipped++;
  }

  // Update lastSyncAt
  await prisma.connectedDevice.update({
    where: { id: device.id },
    data: { lastSyncAt: new Date() },
  });

  logger.info("Sync complete", { provider, athleteId, synced, skipped });
  return { provider, synced, skipped };
}

/** Sync all polling providers for all athletes with connected devices. */
export async function syncAllPollingProviders(): Promise<SyncResult[]> {
  const pollingProviders = adapterRegistry.pollingProviders().map((a) => a.provider);
  if (!pollingProviders.length) return [];

  const devices = await prisma.connectedDevice.findMany({
    where: { provider: { in: pollingProviders as never[] }, accessToken: { not: null } },
    select: { userId: true, provider: true },
  });

  const results = await Promise.allSettled(
    devices.map((d) => syncDevice(d.userId, d.provider as ProviderName)),
  );

  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((r): r is SyncResult => r !== null);
}
