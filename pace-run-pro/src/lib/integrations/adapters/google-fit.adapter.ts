/**
 * Adapter Google Fit — Google Fitness REST API (OAuth 2.0).
 * Requer projeto no Google Cloud Console com Fitness API habilitada.
 * https://console.cloud.google.com/
 *
 * Env vars necessárias:
 *   GOOGLE_FIT_CLIENT_ID      — OAuth 2.0 client ID (Web Application)
 *   GOOGLE_FIT_CLIENT_SECRET  — OAuth 2.0 client secret
 *
 * Google Fit não possui webhooks — requer polling periódico.
 * requiresPolling = true.
 *
 * Docs: https://developers.google.com/fit/rest/v1/reference
 */

import { BaseProviderAdapter } from "@/lib/integrations/adapter";
import {
  ProviderNotConfiguredError,
  ProviderError,
  type AuthorizeParams,
  type ExchangeResult,
  type NormalizedActivity,
  type ProviderTokens,
} from "@/lib/integrations/types";

const GOOGLE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_FIT_BASE = "https://www.googleapis.com/fitness/v1/users/me";

const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.location.read",
].join(" ");

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new ProviderNotConfiguredError("GOOGLE_FIT", name);
  return v;
}

/** Google Fit Activity Type ids → string normalizado */
const GOOGLE_ACTIVITY_TYPES: Record<number, string> = {
  7: "Run", 8: "Run", 9: "Walk", 1: "Aerobics", 2: "Archery",
  3: "Badminton", 4: "Baseball", 5: "Basketball", 6: "Biathlon",
  10: "Handbiking", 11: "MountainBiking", 12: "Road Cycling",
  13: "Spinning", 14: "Road Cycling", 15: "Cycling", 17: "Boxing",
  18: "Calisthenics", 19: "Circuit Training", 20: "Cricket",
  21: "Crossfit", 22: "Curling", 24: "Dance", 28: "Elliptical",
  29: "Fencing", 30: "American Football", 31: "Australian Football",
  32: "Soccer", 33: "Frisbee", 34: "Gardening", 35: "Golf",
  36: "Gymnastics", 37: "Handball", 38: "Hiking", 39: "Hockey",
  40: "Horseback Riding", 41: "Housework", 42: "High Intensity Interval Training",
  43: "Kayaking", 45: "Kickboxing", 46: "Kitesurfing",
  47: "Martial Arts", 48: "Meditation", 50: "Pilates", 51: "Polo",
  52: "Racquetball", 53: "Rock Climbing", 54: "Rowing",
  55: "Rugby", 57: "Sailing", 58: "Scuba Diving", 59: "Skateboarding",
  60: "Skating", 61: "Cross Country Skiing", 62: "Downhill Skiing",
  63: "Kite Skiing", 64: "Roller Skiing", 65: "Sledding",
  66: "Sleeping", 69: "Snowboarding", 70: "Snowshoeing", 71: "Squash",
  72: "StairClimbing", 73: "Stand Up Paddleboarding", 74: "Strength Training",
  75: "Surfing", 76: "Swimming", 77: "Table Tennis", 78: "Team Sports",
  79: "Tennis", 80: "Treadmill", 82: "Volleyball", 83: "Wakeboarding",
  84: "Walking", 85: "Water Polo", 86: "Weightlifting",
  87: "Wheelchair", 88: "Windsurfing", 89: "Yoga", 90: "Zumba",
};

export class GoogleFitAdapter extends BaseProviderAdapter {
  readonly provider = "GOOGLE_FIT" as const;
  readonly displayName = "Google Fit";
  readonly iconSlug = "google-fit";
  override readonly supportsWebhooks = false;
  override readonly requiresPolling = true;

  getAuthorizeUrl({ state, redirectUri, codeVerifier: _ }: AuthorizeParams): string {
    const clientId = requireEnv("GOOGLE_FIT_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",  // necessário para receber refresh_token
      prompt: "consent",       // sempre solicitar consent para garantir refresh_token
      state,
    });
    return `${GOOGLE_OAUTH_BASE}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ExchangeResult> {
    const clientId = requireEnv("GOOGLE_FIT_CLIENT_ID");
    const clientSecret = requireEnv("GOOGLE_FIT_CLIENT_SECRET");

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new ProviderError(`Google Fit: falha ao trocar código (${res.status})`, res.status);
    const data = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };

    // Extrair sub (user ID) do id_token
    const sub = data.id_token ? decodeJwtSub(data.id_token) : "";

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
      providerUserId: sub,
    };
  }

  async refreshTokens(current: ProviderTokens): Promise<ProviderTokens> {
    if (!current.refreshToken) throw new ProviderError("Google Fit: refresh token ausente.");
    const clientId = requireEnv("GOOGLE_FIT_CLIENT_ID");
    const clientSecret = requireEnv("GOOGLE_FIT_CLIENT_SECRET");

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: current.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new ProviderError(`Google Fit: falha ao renovar token (${res.status})`, res.status);
    const data = await res.json() as { access_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      refreshToken: current.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async revokeTokens(tokens: ProviderTokens): Promise<void> {
    try {
      await fetch(`${GOOGLE_REVOKE_URL}?token=${tokens.accessToken}`, { method: "POST" });
    } catch { /* best-effort */ }
  }

  async fetchActivities(tokens: ProviderTokens, since?: Date): Promise<NormalizedActivity[]> {
    const startMs = since ? since.getTime() : Date.now() - 30 * 86400000;
    const endMs = Date.now();

    // Passo 1: listar sessions (atividades) no período
    const sessRes = await fetch(
      `${GOOGLE_FIT_BASE}/sessions?startTime=${new Date(startMs).toISOString()}&endTime=${new Date(endMs).toISOString()}`,
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
    );
    if (sessRes.status === 401) throw new ProviderError("Google Fit: token inválido", 401);
    if (!sessRes.ok) throw new ProviderError(`Google Fit: erro ao buscar sessões (${sessRes.status})`, sessRes.status);

    const sessData = await sessRes.json() as {
      session?: Array<{
        id: string;
        name?: string;
        activityType?: number;
        startTimeMillis: string;
        endTimeMillis?: string;
        description?: string;
      }>;
    };

    if (!sessData.session?.length) return [];

    // Passo 2: buscar agregados de dados para cada sessão (HR, distância, calorias)
    const activities: NormalizedActivity[] = await Promise.all(
      sessData.session.map(async (s) => {
        const agg = await this._fetchAggregates(
          tokens.accessToken,
          parseInt(s.startTimeMillis),
          parseInt(s.endTimeMillis ?? String(endMs)),
        );
        return {
          sourceId: s.id,
          provider: "GOOGLE_FIT" as const,
          title: s.name,
          activityType: GOOGLE_ACTIVITY_TYPES[s.activityType ?? -1],
          startedAt: new Date(parseInt(s.startTimeMillis)),
          finishedAt: s.endTimeMillis ? new Date(parseInt(s.endTimeMillis)) : undefined,
          durationSec: Math.round((parseInt(s.endTimeMillis ?? String(endMs)) - parseInt(s.startTimeMillis)) / 1000),
          distanceKm: agg.distanceM ? Math.round((agg.distanceM / 1000) * 100) / 100 : undefined,
          avgPaceSecPerKm: agg.distanceM && agg.durationSec
            ? Math.round(agg.durationSec / (agg.distanceM / 1000))
            : undefined,
          avgHrBpm: agg.avgHr ? Math.round(agg.avgHr) : undefined,
          maxHrBpm: agg.maxHr ? Math.round(agg.maxHr) : undefined,
          calories: agg.calories ? Math.round(agg.calories) : undefined,
        };
      }),
    );

    return activities;
  }

  private async _fetchAggregates(
    accessToken: string,
    startMs: number,
    endMs: number,
  ): Promise<{ distanceM?: number; durationSec?: number; avgHr?: number; maxHr?: number; calories?: number }> {
    const res = await fetch(`${GOOGLE_FIT_BASE}/dataset:aggregate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: "com.google.distance.delta" },
          { dataTypeName: "com.google.heart_rate.bpm" },
          { dataTypeName: "com.google.calories.expended" },
          { dataTypeName: "com.google.active_minutes" },
        ],
        startTimeMillis: startMs,
        endTimeMillis: endMs,
        bucketByTime: { durationMillis: endMs - startMs },
      }),
    });
    if (!res.ok) return {};
    const data = await res.json() as { bucket?: Array<{ dataset?: Array<{ dataSourceId: string; point?: Array<{ value?: Array<{ fpVal?: number; intVal?: number }> }> }> }> };

    const result: { distanceM?: number; durationSec?: number; avgHr?: number; maxHr?: number; calories?: number } = {};
    for (const bucket of data.bucket ?? []) {
      for (const ds of bucket.dataset ?? []) {
        const val = ds.point?.[0]?.value?.[0];
        if (!val) continue;
        if (ds.dataSourceId.includes("distance")) result.distanceM = val.fpVal;
        if (ds.dataSourceId.includes("heart_rate")) {
          result.avgHr = ds.point?.[0]?.value?.[1]?.fpVal;
          result.maxHr = val.fpVal;
        }
        if (ds.dataSourceId.includes("calories")) result.calories = val.fpVal;
        if (ds.dataSourceId.includes("active_minutes")) result.durationSec = (val.intVal ?? 0) * 60;
      }
    }
    return result;
  }
}

/** Extrai o campo `sub` do payload de um JWT sem verificar a assinatura (apenas para user ID). */
function decodeJwtSub(jwt: string): string {
  try {
    const payload = jwt.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string };
    return decoded.sub ?? "";
  } catch {
    return "";
  }
}
