const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete?: { id: number; firstname?: string; lastname?: string };
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number; // metros
  moving_time: number; // segundos
  start_date: string;
  average_heartrate?: number;
  total_elevation_gain?: number;
}

export class StravaApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getStravaAuthorizeUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });
  return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new StravaApiError("Falha ao trocar código por token do Strava", res.status);
  return res.json();
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new StravaApiError("Falha ao renovar token do Strava", res.status);
  return res.json();
}

export async function deauthorizeStrava(accessToken: string): Promise<void> {
  try {
    await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // best-effort: ignora falhas ao revogar do lado do Strava
  }
}

export async function fetchStravaActivities(accessToken: string, perPage = 5): Promise<StravaActivity[]> {
  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new StravaApiError("Falha ao buscar atividades do Strava", res.status);
  return res.json();
}
