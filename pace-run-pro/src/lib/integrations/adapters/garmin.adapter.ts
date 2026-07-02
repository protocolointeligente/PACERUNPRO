/**
 * Adapter Garmin — Health API (OAuth 2.0).
 * Requer cadastro em https://developer.garmin.com/gc-developer-program/overview/
 *
 * Env vars necessárias:
 *   GARMIN_CLIENT_ID       — OAuth 2.0 client ID
 *   GARMIN_CLIENT_SECRET   — OAuth 2.0 client secret
 *   GARMIN_CONSUMER_SECRET — HMAC-SHA1 secret para verificação de webhook
 *
 * Garmin envia atividades via webhook (push) no endpoint registrado.
 * Não há API de polling público sem permissão especial de parceiro.
 *
 * Docs: https://developer.garmin.com/health-api/overview/
 */

import { createHmac } from "crypto";
import { BaseProviderAdapter } from "@/lib/integrations/adapter";
import {
  ProviderNotConfiguredError,
  ProviderError,
  type AuthorizeParams,
  type ExchangeResult,
  type NormalizedActivity,
  type ProviderTokens,
  type WebhookEvent,
} from "@/lib/integrations/types";

const GARMIN_OAUTH_BASE = "https://connect.garmin.com/oauth-service/oauth";
const GARMIN_API_BASE = "https://apis.garmin.com/wellness-api/rest";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new ProviderNotConfiguredError("GARMIN", name);
  return v;
}

/** Converte tipo de atividade Garmin em tipo normalizado */
function mapActivityType(garminType: string): string {
  const map: Record<string, string> = {
    RUNNING: "Run",
    TRAIL_RUNNING: "TrailRun",
    CYCLING: "Ride",
    SWIMMING: "Swim",
    WALKING: "Walk",
    HIKING: "Hike",
    STRENGTH_TRAINING: "WeightTraining",
  };
  return map[garminType] ?? garminType;
}

export class GarminAdapter extends BaseProviderAdapter {
  readonly provider = "GARMIN" as const;
  readonly displayName = "Garmin Connect";
  readonly iconSlug = "garmin";
  override readonly supportsWebhooks = true;
  override readonly requiresPolling = false;

  getAuthorizeUrl({ state, redirectUri }: AuthorizeParams): string {
    const clientId = requireEnv("GARMIN_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "activity:read",
      state,
    });
    // Garmin Health API OAuth 2.0 authorization endpoint
    return `${GARMIN_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ExchangeResult> {
    const clientId = requireEnv("GARMIN_CLIENT_ID");
    const clientSecret = requireEnv("GARMIN_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${GARMIN_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    });
    if (!res.ok) {
      throw new ProviderError(`Garmin: falha ao trocar código por token (${res.status})`, res.status);
    }
    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id?: string;
    };

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
      providerUserId: data.user_id ?? "",
    };
  }

  async refreshTokens(current: ProviderTokens): Promise<ProviderTokens> {
    if (!current.refreshToken) throw new ProviderError("Garmin: refresh token ausente.");
    const clientId = requireEnv("GARMIN_CLIENT_ID");
    const clientSecret = requireEnv("GARMIN_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${GARMIN_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: current.refreshToken }),
    });
    if (!res.ok) throw new ProviderError(`Garmin: falha ao renovar token (${res.status})`, res.status);
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? current.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async fetchActivities(tokens: ProviderTokens, since?: Date): Promise<NormalizedActivity[]> {
    const startTs = since ? Math.floor(since.getTime() / 1000) : Math.floor((Date.now() - 30 * 86400000) / 1000);
    const endTs = Math.floor(Date.now() / 1000);

    const res = await fetch(
      `${GARMIN_API_BASE}/activities?uploadStartTimeInSeconds=${startTs}&uploadEndTimeInSeconds=${endTs}`,
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
    );
    if (res.status === 401) throw new ProviderError("Garmin: token inválido", 401);
    if (!res.ok) throw new ProviderError(`Garmin: erro ao buscar atividades (${res.status})`, res.status);

    const data = await res.json() as Array<{
      activityId: number;
      activityName?: string;
      activityType?: string;
      startTimeInSeconds: number;
      durationInSeconds?: number;
      distanceInMeters?: number;
      averageHeartRateInBeatsPerMinute?: number;
      maxHeartRateInBeatsPerMinute?: number;
      totalElevationGainInMeters?: number;
      activeKilocalories?: number;
      averageBikeCadenceInRoundsPerMinute?: number;
      averageRunCadenceInStepsPerMinute?: number;
    }>;

    return data.map((a) => {
      const distanceKm = a.distanceInMeters ? a.distanceInMeters / 1000 : undefined;
      const avgPace =
        distanceKm && a.durationInSeconds
          ? Math.round(a.durationInSeconds / distanceKm)
          : undefined;
      return {
        sourceId: String(a.activityId),
        provider: "GARMIN" as const,
        title: a.activityName,
        activityType: mapActivityType(a.activityType ?? ""),
        startedAt: new Date(a.startTimeInSeconds * 1000),
        durationSec: a.durationInSeconds,
        distanceKm,
        avgPaceSecPerKm: avgPace,
        avgHrBpm: a.averageHeartRateInBeatsPerMinute,
        maxHrBpm: a.maxHeartRateInBeatsPerMinute,
        elevationGainM: a.totalElevationGainInMeters,
        calories: a.activeKilocalories,
        cadenceAvg:
          a.averageRunCadenceInStepsPerMinute ??
          a.averageBikeCadenceInRoundsPerMinute,
      };
    });
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean {
    const secret = process.env.GARMIN_CONSUMER_SECRET;
    if (!secret) return false;
    const sig = headers["x-garmin-signature"];
    if (!sig) return false;
    const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
    return sig === expected;
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    // Garmin Health API envia: { activityFiles: [{ userId, callbackURL, fileType }] }
    const b = body as { activityFiles?: Array<{ userId: string; callbackURL?: string; activityId?: string }> };
    if (!b.activityFiles?.length) return null;
    const first = b.activityFiles[0];
    return {
      eventType: "activity_created",
      providerUserId: first.userId,
      activityId: first.activityId,
      raw: body,
    };
  }
}
