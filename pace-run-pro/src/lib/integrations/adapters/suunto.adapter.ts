/**
 * Adapter Suunto — Suunto API v2 (OAuth 2.0).
 * Requer cadastro em https://apizone.suunto.com/
 *
 * Env vars necessárias:
 *   SUUNTO_CLIENT_ID      — OAuth 2.0 client ID
 *   SUUNTO_CLIENT_SECRET  — OAuth 2.0 client secret
 *   SUUNTO_SUBSCRIPTION_KEY — Ocp-Apim-Subscription-Key (obrigatório no header)
 *
 * Suunto usa Azure API Management — todos os requests precisam do header
 * Ocp-Apim-Subscription-Key além do Bearer token.
 *
 * Docs: https://apizone.suunto.com/
 */

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

const SUUNTO_OAUTH_BASE = "https://cloudapi-oauth.suunto.com";
const SUUNTO_API_BASE = "https://cloudapi.suunto.com/v2";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new ProviderNotConfiguredError("SUUNTO", name);
  return v;
}

export class SuuntoAdapter extends BaseProviderAdapter {
  readonly provider = "SUUNTO" as const;
  readonly displayName = "Suunto";
  readonly iconSlug = "suunto";
  override readonly supportsWebhooks = true;

  private get subscriptionKey() {
    return requireEnv("SUUNTO_SUBSCRIPTION_KEY");
  }

  getAuthorizeUrl({ state, redirectUri }: AuthorizeParams): string {
    const clientId = requireEnv("SUUNTO_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "workout",
      state,
    });
    return `${SUUNTO_OAUTH_BASE}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ExchangeResult> {
    const clientId = requireEnv("SUUNTO_CLIENT_ID");
    const clientSecret = requireEnv("SUUNTO_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${SUUNTO_OAUTH_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    });
    if (!res.ok) throw new ProviderError(`Suunto: falha ao trocar código (${res.status})`, res.status);
    const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number; user?: string };
    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
      providerUserId: data.user ?? "",
    };
  }

  async refreshTokens(current: ProviderTokens): Promise<ProviderTokens> {
    if (!current.refreshToken) throw new ProviderError("Suunto: refresh token ausente.");
    const clientId = requireEnv("SUUNTO_CLIENT_ID");
    const clientSecret = requireEnv("SUUNTO_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${SUUNTO_OAUTH_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: current.refreshToken }),
    });
    if (!res.ok) throw new ProviderError(`Suunto: falha ao renovar token (${res.status})`, res.status);
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? current.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async fetchActivities(tokens: ProviderTokens, since?: Date): Promise<NormalizedActivity[]> {
    const sinceTs = since ? since.toISOString() : new Date(Date.now() - 30 * 86400000).toISOString();
    const res = await fetch(`${SUUNTO_API_BASE}/workouts?since=${sinceTs}&limit=30`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Ocp-Apim-Subscription-Key": this.subscriptionKey,
      },
    });
    if (res.status === 401) throw new ProviderError("Suunto: token inválido", 401);
    if (!res.ok) throw new ProviderError(`Suunto: erro ao buscar atividades (${res.status})`, res.status);

    const data = await res.json() as {
      payload?: Array<{
        workoutKey: string;
        activityId?: number;
        workoutName?: string;
        activityType?: string;
        startTime: string;
        duration?: number; // segundos
        totalDistance?: number; // metros
        avgHR?: number;
        maxHR?: number;
        totalCalories?: number;
        avgCadence?: number;
        ascent?: number;
      }>;
    };

    return (data.payload ?? []).map((a) => {
      const distanceKm = a.totalDistance ? a.totalDistance / 1000 : undefined;
      const avgPace = distanceKm && a.duration ? Math.round(a.duration / distanceKm) : undefined;
      return {
        sourceId: a.workoutKey,
        provider: "SUUNTO" as const,
        title: a.workoutName,
        activityType: a.activityType,
        startedAt: new Date(a.startTime),
        durationSec: a.duration,
        distanceKm,
        avgPaceSecPerKm: avgPace,
        avgHrBpm: a.avgHR,
        maxHrBpm: a.maxHR,
        calories: a.totalCalories,
        cadenceAvg: a.avgCadence,
        elevationGainM: a.ascent,
      };
    });
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    const b = body as { event?: string; username?: string; workoutkey?: string };
    if (b.event !== "workout") return null;
    return {
      eventType: "activity_created",
      providerUserId: b.username ?? "",
      activityId: b.workoutkey,
      raw: body,
    };
  }
}
