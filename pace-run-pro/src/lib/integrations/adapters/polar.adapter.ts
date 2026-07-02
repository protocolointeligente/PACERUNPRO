/**
 * Adapter Polar — Polar Access Link 2 (OAuth 2.0).
 * Requer cadastro em https://admin.polaraccesslink.com/
 *
 * Env vars necessárias:
 *   POLAR_CLIENT_ID      — OAuth 2.0 client ID
 *   POLAR_CLIENT_SECRET  — OAuth 2.0 client secret
 *
 * Fluxo: OAuth 2.0 Authorization Code.
 * Polar suporta webhooks (Transaction API) para atividades.
 * Docs: https://www.polar.com/accesslink-api/
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

const POLAR_OAUTH_BASE = "https://flow.polar.com/oauth2";
const POLAR_API_BASE = "https://www.polaraccesslink.com/v3";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new ProviderNotConfiguredError("POLAR", name);
  return v;
}

export class PolarAdapter extends BaseProviderAdapter {
  readonly provider = "POLAR" as const;
  readonly displayName = "Polar Flow";
  readonly iconSlug = "polar";
  override readonly supportsWebhooks = true;
  override readonly requiresPolling = true; // Transaction API precisa de pull

  getAuthorizeUrl({ state, redirectUri }: AuthorizeParams): string {
    const clientId = requireEnv("POLAR_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "accesslink.read_all",
      state,
    });
    return `${POLAR_OAUTH_BASE}/authorization?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ExchangeResult> {
    const clientId = requireEnv("POLAR_CLIENT_ID");
    const clientSecret = requireEnv("POLAR_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${POLAR_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    });
    if (!res.ok) throw new ProviderError(`Polar: falha ao trocar código (${res.status})`, res.status);
    const data = await res.json() as { access_token: string; token_type: string; x_user_id: number };

    // Primeiro acesso: registrar o usuário na Access Link API
    await this._registerUser(data.access_token);

    return {
      tokens: {
        accessToken: data.access_token,
        // Polar tokens são de longa duração (não expiram automaticamente)
      },
      providerUserId: String(data.x_user_id),
    };
  }

  /** Polar exige registro único do usuário antes de usar a API. */
  private async _registerUser(accessToken: string): Promise<void> {
    await fetch(`${POLAR_API_BASE}/users`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ "member-id": "pace-run-pro-user" }),
    });
    // 409 Conflict = usuário já registrado = OK
  }

  async refreshTokens(current: ProviderTokens): Promise<ProviderTokens> {
    // Polar tokens não expiram (acesso revogável apenas pelo usuário).
    return current;
  }

  async revokeTokens(tokens: ProviderTokens): Promise<void> {
    try {
      await fetch(`${POLAR_API_BASE}/users`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
    } catch { /* best-effort */ }
  }

  async fetchActivities(tokens: ProviderTokens, since?: Date): Promise<NormalizedActivity[]> {
    // Passo 1: criar uma transaction para obter atividades novas
    const txRes = await fetch(`${POLAR_API_BASE}/users/activity-transactions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (txRes.status === 204) return []; // Sem atividades novas
    if (!txRes.ok) throw new ProviderError(`Polar: erro ao criar transaction (${txRes.status})`, txRes.status);

    const tx = await txRes.json() as { "transaction-id": number; "resource-uri": string; urls: string[] };
    const activities: NormalizedActivity[] = [];

    for (const url of tx.urls ?? []) {
      const actRes = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}`, Accept: "application/json" },
      });
      if (!actRes.ok) continue;
      const a = await actRes.json() as {
        id: number;
        name?: string;
        "detailed-sport-info"?: string;
        "start-time": string;
        duration?: string; // PT1H23M45S (ISO 8601 duration)
        distance?: number;
        "average-heart-rate"?: { bpm: number };
        "maximum-heart-rate"?: { bpm: number };
        calories?: number;
        "training-load"?: number;
      };

      if (since && new Date(a["start-time"]) < since) continue;

      const durationSec = a.duration ? parsePolarDuration(a.duration) : undefined;
      const distanceKm = a.distance ? a.distance / 1000 : undefined;
      const avgPace = distanceKm && durationSec ? Math.round(durationSec / distanceKm) : undefined;

      activities.push({
        sourceId: String(a.id),
        provider: "POLAR",
        title: a.name,
        activityType: a["detailed-sport-info"] ?? undefined,
        startedAt: new Date(a["start-time"]),
        durationSec,
        distanceKm,
        avgPaceSecPerKm: avgPace,
        avgHrBpm: a["average-heart-rate"]?.bpm,
        maxHrBpm: a["maximum-heart-rate"]?.bpm,
        calories: a.calories,
      });
    }

    // Commit a transaction para marcar atividades como processadas
    await fetch(`${tx["resource-uri"]}/commit`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    return activities;
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    const b = body as { event?: string; user_id?: number; entity_id?: string };
    if (b.event !== "EXERCISE") return null;
    return {
      eventType: "activity_created",
      providerUserId: String(b.user_id),
      activityId: b.entity_id,
      raw: body,
    };
  }
}

/** Converte duração ISO 8601 (PT1H23M45S) para segundos */
function parsePolarDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? "0") * 3600 +
    parseInt(match[2] ?? "0") * 60 +
    parseInt(match[3] ?? "0"));
}
