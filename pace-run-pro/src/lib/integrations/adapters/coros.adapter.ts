/**
 * Adapter COROS — COROS Open Platform (OAuth 2.0).
 * Requer aprovação em https://open.coros.com/
 *
 * Env vars necessárias:
 *   COROS_CLIENT_ID      — OAuth 2.0 client ID
 *   COROS_CLIENT_SECRET  — OAuth 2.0 client secret
 *   COROS_API_SECRET     — Chave para verificação de assinatura de webhook
 *
 * Docs: https://open.coros.com/docs (acesso restrito a parceiros aprovados)
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

const COROS_OAUTH_BASE = "https://open.coros.com/oauth2";
const COROS_API_BASE = "https://open.coros.com/v2";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new ProviderNotConfiguredError("COROS", name);
  return v;
}

export class CorosAdapter extends BaseProviderAdapter {
  readonly provider = "COROS" as const;
  readonly displayName = "COROS";
  readonly iconSlug = "coros";
  override readonly supportsWebhooks = true;

  getAuthorizeUrl({ state, redirectUri }: AuthorizeParams): string {
    const clientId = requireEnv("COROS_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "workout",
      state,
    });
    return `${COROS_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ExchangeResult> {
    const clientId = requireEnv("COROS_CLIENT_ID");
    const clientSecret = requireEnv("COROS_CLIENT_SECRET");

    const res = await fetch(`${COROS_OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    if (!res.ok) throw new ProviderError(`COROS: falha ao trocar código (${res.status})`, res.status);
    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      openId?: string;
    };
    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
      providerUserId: data.openId ?? "",
    };
  }

  async refreshTokens(current: ProviderTokens): Promise<ProviderTokens> {
    if (!current.refreshToken) throw new ProviderError("COROS: refresh token ausente.");
    const clientId = requireEnv("COROS_CLIENT_ID");
    const clientSecret = requireEnv("COROS_CLIENT_SECRET");

    const res = await fetch(`${COROS_OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, refresh_token: current.refreshToken, grant_type: "refresh_token" }),
    });
    if (!res.ok) throw new ProviderError(`COROS: falha ao renovar token (${res.status})`, res.status);
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
      `${COROS_API_BASE}/workout/list?startTime=${startTs}&endTime=${endTs}&size=30`,
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
    );
    if (res.status === 401) throw new ProviderError("COROS: token inválido", 401);
    if (!res.ok) throw new ProviderError(`COROS: erro ao buscar atividades (${res.status})`, res.status);

    const data = await res.json() as {
      result: string;
      data?: {
        workoutList?: Array<{
          workoutId: string;
          name?: string;
          sportType?: number;
          startTime: number;
          endTime?: number;
          totalTime?: number;
          totalDistance?: number; // metros
          avgHr?: number;
          maxHr?: number;
          totalCalories?: number;
          avgCadence?: number;
        }>;
      };
    };

    return (data.data?.workoutList ?? []).map((a) => {
      const distanceKm = a.totalDistance ? a.totalDistance / 1000 : undefined;
      const avgPace = distanceKm && a.totalTime ? Math.round(a.totalTime / distanceKm) : undefined;
      return {
        sourceId: a.workoutId,
        provider: "COROS" as const,
        title: a.name,
        activityType: corosSportType(a.sportType),
        startedAt: new Date(a.startTime * 1000),
        finishedAt: a.endTime ? new Date(a.endTime * 1000) : undefined,
        durationSec: a.totalTime,
        distanceKm,
        avgPaceSecPerKm: avgPace,
        avgHrBpm: a.avgHr,
        maxHrBpm: a.maxHr,
        calories: a.totalCalories,
        cadenceAvg: a.avgCadence,
      };
    });
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean {
    const secret = process.env.COROS_API_SECRET;
    if (!secret) return false;
    const sig = headers["x-coros-signature"];
    if (!sig) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return sig === expected;
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    const b = body as { event?: string; openId?: string; workoutId?: string };
    if (b.event !== "workout.created") return null;
    return {
      eventType: "activity_created",
      providerUserId: b.openId ?? "",
      activityId: b.workoutId,
      raw: body,
    };
  }
}

function corosSportType(code?: number): string | undefined {
  const map: Record<number, string> = {
    100: "Run", 101: "TrailRun", 200: "Ride", 300: "Swim",
    400: "Walk", 500: "Hike", 600: "WeightTraining",
  };
  return code !== undefined ? (map[code] ?? String(code)) : undefined;
}
