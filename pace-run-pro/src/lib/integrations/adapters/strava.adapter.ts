/**
 * Adapter Strava — implementação completa.
 * Wraps src/lib/integrations/strava.ts mantendo compatibilidade total
 * com as rotas existentes (/api/integrations/strava/*).
 *
 * OAuth 2.0 | Webhooks: sim | Polling: não necessário
 * Docs: https://developers.strava.com/docs/reference/
 */

import { createHmac } from "crypto";
import {
  getStravaAuthorizeUrl,
  exchangeStravaCode,
  refreshStravaToken,
  deauthorizeStrava,
  fetchStravaActivities,
  type StravaActivity,
} from "@/lib/integrations/strava";
import { BaseProviderAdapter } from "@/lib/integrations/adapter";
import {
  ProviderNotConfiguredError,
  type AuthorizeParams,
  type ExchangeResult,
  type NormalizedActivity,
  type ProviderTokens,
  type WebhookEvent,
} from "@/lib/integrations/types";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new ProviderNotConfiguredError("STRAVA", name);
  return v;
}

function toNormalized(a: StravaActivity): NormalizedActivity {
  const durationSec = a.moving_time;
  const distanceKm = a.distance / 1000;
  const avgPaceSecPerKm =
    distanceKm > 0 ? Math.round(durationSec / distanceKm) : undefined;
  const avgHr = a.average_heartrate ? Math.round(a.average_heartrate) : undefined;
  const rpeEstimated = avgHr
    ? Math.min(10, Math.max(1, Math.round((avgHr / 188) * 14)))
    : undefined;

  return {
    sourceId: String(a.id),
    provider: "STRAVA",
    title: a.name,
    activityType: a.type,
    startedAt: new Date(a.start_date),
    finishedAt: new Date(
      new Date(a.start_date).getTime() + a.elapsed_time * 1000,
    ),
    durationSec,
    distanceKm: Math.round(distanceKm * 100) / 100,
    avgPaceSecPerKm,
    avgHrBpm: avgHr,
    maxHrBpm: a.max_heartrate ? Math.round(a.max_heartrate) : undefined,
    elevationGainM: a.total_elevation_gain,
    calories: a.calories,
    cadenceAvg: a.average_cadence
      ? Math.round(a.average_cadence * 2)
      : undefined, // Strava reporta passos/min por pé → ×2
    rpeEstimated,
  };
}

export class StravaAdapter extends BaseProviderAdapter {
  readonly provider = "STRAVA" as const;
  readonly displayName = "Strava";
  readonly iconSlug = "strava";
  override readonly supportsWebhooks = true;

  getAuthorizeUrl({ state, redirectUri }: AuthorizeParams): string {
    requireEnv("STRAVA_CLIENT_ID");
    return getStravaAuthorizeUrl(redirectUri, state);
  }

  async exchangeCode(code: string, _redirectUri: string): Promise<ExchangeResult> {
    requireEnv("STRAVA_CLIENT_ID");
    requireEnv("STRAVA_CLIENT_SECRET");
    const res = await exchangeStravaCode(code);
    return {
      tokens: {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        expiresAt: new Date(res.expires_at * 1000),
      },
      providerUserId: String(res.athlete?.id ?? ""),
    };
  }

  async refreshTokens(current: ProviderTokens): Promise<ProviderTokens> {
    if (!current.refreshToken) throw new Error("Strava: refresh token ausente.");
    const res = await refreshStravaToken(current.refreshToken);
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: new Date(res.expires_at * 1000),
    };
  }

  async revokeTokens(tokens: ProviderTokens): Promise<void> {
    await deauthorizeStrava(tokens.accessToken);
  }

  async fetchActivities(tokens: ProviderTokens, _since?: Date): Promise<NormalizedActivity[]> {
    const activities = await fetchStravaActivities(tokens.accessToken, 30);
    return activities.map(toNormalized);
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean {
    // Strava usa hub.verify_token no GET e não assina o corpo do POST com HMAC.
    // A autenticação do POST é implícita: só o Strava conhece o verify_token
    // registrado na subscription.
    const secret = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
    if (!secret) return false;
    // Verifica que o header X-Hub-Signature-256 bate (quando presente)
    const sig = headers["x-hub-signature-256"];
    if (!sig) return true; // Strava não assina eventos POST com HMAC — aceitamos
    const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    return sig === expected;
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    const b = body as Record<string, unknown>;
    if (b.object_type !== "activity") return null;
    const eventType =
      b.aspect_type === "create"
        ? "activity_created"
        : b.aspect_type === "update"
          ? "activity_updated"
          : b.aspect_type === "delete"
            ? "activity_deleted"
            : null;
    if (!eventType) return null;
    return {
      eventType,
      providerUserId: String(b.owner_id),
      activityId: String(b.object_id),
      raw: body,
    };
  }

  handleChallenge(
    query: Record<string, string>,
    verifyToken: string,
  ): Record<string, string> | null {
    if (query["hub.mode"] !== "subscribe") return null;
    if (query["hub.verify_token"] !== verifyToken) return null;
    return { "hub.challenge": query["hub.challenge"] ?? "" };
  }
}
