/**
 * Adapter Apple Health / HealthKit.
 *
 * Apple Health NÃO usa OAuth server-side — é uma API exclusivamente do iOS.
 * Arquitetura: o app mobile lê dados do HealthKit e envia para este endpoint
 * via POST autenticado com o JWT de sessão do usuário.
 *
 * Fluxo:
 *   iOS App → lê HealthKit → POST /api/webhooks/APPLE_WATCH (com Authorization: Bearer <session>)
 *
 * supportsOAuth = false (sem redirect OAuth)
 * supportsWebhooks = true (recebe push do app mobile)
 *
 * Sem env vars obrigatórias — autenticação é feita via sessão NextAuth.
 */

import { BaseProviderAdapter } from "@/lib/integrations/adapter";
import {
  ProviderError,
  type NormalizedActivity,
  type ProviderTokens,
  type WebhookEvent,
} from "@/lib/integrations/types";

/** Payload esperado do app mobile iOS. */
export interface AppleHealthPayload {
  workouts: Array<{
    sourceRevisionId: string;
    workoutActivityType: number; // HKWorkoutActivityType rawValue
    startDate: string;           // ISO 8601
    endDate?: string;
    duration: number;            // segundos
    totalDistance?: number;      // metros
    totalEnergyBurned?: number;  // kcal
    averageHeartRate?: number;
    maximumHeartRate?: number;
  }>;
}

/** HKWorkoutActivityType → string legível */
function hkActivityType(code: number): string {
  const map: Record<number, string> = {
    37: "Run", 1: "AmericanFootball", 2: "Archery", 3: "AustralianFootball",
    4: "Badminton", 5: "Baseball", 6: "Basketball", 7: "Bowling", 8: "Boxing",
    9: "Climbing", 10: "Cricket", 11: "CrossTraining", 12: "Curling",
    13: "Cycling", 14: "Dance", 16: "Elliptical", 17: "EquestrianSports",
    18: "Fencing", 19: "Fishing", 20: "FunctionalStrengthTraining",
    21: "Golf", 22: "Gymnastics", 23: "Handball", 24: "Hiking", 25: "Hockey",
    26: "Hunting", 27: "Lacrosse", 28: "MartialArts", 29: "MindAndBody",
    31: "PaddleSports", 32: "Play", 33: "PreparationAndRecovery",
    34: "Racquetball", 35: "Rowing", 36: "Rugby",
    38: "Sailing", 39: "SkatingSports", 40: "SnowSports", 41: "Soccer",
    42: "Softball", 43: "Squash", 44: "StairClimbing",
    45: "SurfingSports", 46: "Swimming", 47: "TableTennis", 48: "Tennis",
    49: "TrackAndField", 50: "TraditionalStrengthTraining", 51: "Volleyball",
    52: "Walking", 53: "WaterFitness", 54: "WaterPolo", 55: "WaterSports",
    56: "Wrestling", 57: "Yoga",
  };
  return map[code] ?? `HKWorkout_${code}`;
}

export class AppleHealthAdapter extends BaseProviderAdapter {
  readonly provider = "APPLE_WATCH" as const;
  readonly displayName = "Apple Health";
  readonly iconSlug = "apple-health";
  override readonly supportsOAuth = false;
  override readonly supportsWebhooks = true;
  override readonly requiresPolling = false;

  getAuthorizeUrl(): string {
    throw new ProviderError(
      "Apple Health não usa OAuth — integração é feita via app mobile iOS.",
      400,
      "NO_OAUTH",
    );
  }

  exchangeCode(): Promise<never> {
    throw new ProviderError("Apple Health não usa OAuth.", 400, "NO_OAUTH");
  }

  async fetchActivities(_tokens: ProviderTokens): Promise<NormalizedActivity[]> {
    // Apple Health não tem API server-side — dados chegam via webhook do app mobile.
    return [];
  }

  /** Verifica que o request veio do nosso próprio app mobile (via header secreto opcional). */
  verifyWebhook(_rawBody: string, headers: Record<string, string>): boolean {
    const secret = process.env.APPLE_HEALTH_WEBHOOK_SECRET;
    if (!secret) return true; // Sem configuração: aceita (autenticação via NextAuth)
    return headers["x-apple-health-secret"] === secret;
  }

  /** Converte payload do app iOS em WebhookEvent + NormalizedActivity[]. */
  parseWebhook(body: unknown): WebhookEvent | null {
    const b = body as { userId?: string; workouts?: unknown[] };
    if (!b.userId || !b.workouts?.length) return null;
    return {
      eventType: "activity_created",
      providerUserId: b.userId,
      raw: body,
    };
  }

  /** Converte payload completo do iOS em atividades normalizadas. */
  parsePayload(userId: string, payload: AppleHealthPayload): NormalizedActivity[] {
    return payload.workouts.map((w) => {
      const distanceKm = w.totalDistance ? w.totalDistance / 1000 : undefined;
      const avgPace = distanceKm && w.duration ? Math.round(w.duration / distanceKm) : undefined;
      const avgHr = w.averageHeartRate ? Math.round(w.averageHeartRate) : undefined;
      const rpeEstimated = avgHr
        ? Math.min(10, Math.max(1, Math.round((avgHr / 188) * 14)))
        : undefined;

      return {
        sourceId: w.sourceRevisionId,
        provider: "APPLE_WATCH" as const,
        activityType: hkActivityType(w.workoutActivityType),
        startedAt: new Date(w.startDate),
        finishedAt: w.endDate ? new Date(w.endDate) : undefined,
        durationSec: Math.round(w.duration),
        distanceKm,
        avgPaceSecPerKm: avgPace,
        avgHrBpm: avgHr,
        maxHrBpm: w.maximumHeartRate ? Math.round(w.maximumHeartRate) : undefined,
        calories: w.totalEnergyBurned ? Math.round(w.totalEnergyBurned) : undefined,
        rpeEstimated,
      };
    });
  }
}
