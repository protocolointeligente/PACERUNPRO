const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";
export const STRAVA_CALLBACK_PATH = "/api/auth/strava/callback";
const PRODUCTION_APP_URL = "https://www.pacerunpro.com.br";

type StravaRedirectSource =
  | "STRAVA_REDIRECT_URI"
  | "APP_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "VERCEL_URL"
  | "production_default"
  | "development_default";

export interface StravaRedirectConfig {
  redirectUri: string;
  domain: string;
  callbackPath: string;
  environment: string;
  source: StravaRedirectSource;
}

function configuredValue(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, "");
  return normalized ? normalized : null;
}

function absoluteUrl(value: string, variableName: string): URL {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol);
  } catch {
    throw new Error(`${variableName} must be a valid absolute URL`);
  }
}

export function getStravaRedirectConfig(): StravaRedirectConfig {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const isProduction = environment === "production" || process.env.NODE_ENV === "production";
  const explicitRedirect = configuredValue(process.env.STRAVA_REDIRECT_URI);
  const appUrl = configuredValue(process.env.APP_URL);
  const publicAppUrl = configuredValue(process.env.NEXT_PUBLIC_APP_URL);
  const vercelUrl = configuredValue(process.env.VERCEL_URL);

  let redirectUrl: URL;
  let source: StravaRedirectSource;

  if (explicitRedirect) {
    redirectUrl = absoluteUrl(explicitRedirect, "STRAVA_REDIRECT_URI");
    source = "STRAVA_REDIRECT_URI";
  } else if (appUrl) {
    redirectUrl = new URL(STRAVA_CALLBACK_PATH, absoluteUrl(appUrl, "APP_URL"));
    source = "APP_URL";
  } else if (publicAppUrl) {
    redirectUrl = new URL(STRAVA_CALLBACK_PATH, absoluteUrl(publicAppUrl, "NEXT_PUBLIC_APP_URL"));
    source = "NEXT_PUBLIC_APP_URL";
  } else if (!isProduction && vercelUrl) {
    redirectUrl = new URL(STRAVA_CALLBACK_PATH, absoluteUrl(vercelUrl, "VERCEL_URL"));
    source = "VERCEL_URL";
  } else if (isProduction) {
    redirectUrl = new URL(STRAVA_CALLBACK_PATH, PRODUCTION_APP_URL);
    source = "production_default";
  } else {
    redirectUrl = new URL(STRAVA_CALLBACK_PATH, "http://localhost:3000");
    source = "development_default";
  }

  if (redirectUrl.pathname !== STRAVA_CALLBACK_PATH) {
    throw new Error(`STRAVA_REDIRECT_URI must use callback path ${STRAVA_CALLBACK_PATH}`);
  }
  if (isProduction && redirectUrl.protocol !== "https:") {
    throw new Error("STRAVA_REDIRECT_URI must use HTTPS in production");
  }

  const configuredOrigins = [appUrl, publicAppUrl]
    .filter((value): value is string => Boolean(value))
    .map((value) => absoluteUrl(value, "app URL").origin);
  if (new Set(configuredOrigins).size > 1) {
    console.warn("[strava oauth] APP_URL and NEXT_PUBLIC_APP_URL use different origins");
  }
  if (isProduction && vercelUrl && absoluteUrl(vercelUrl, "VERCEL_URL").origin !== redirectUrl.origin) {
    console.info("[strava oauth] ignoring VERCEL_URL for stable production OAuth callback");
  }

  return {
    redirectUri: redirectUrl.toString(),
    domain: redirectUrl.host,
    callbackPath: redirectUrl.pathname,
    environment,
    source,
  };
}

export function logStravaOAuthConfig(config: StravaRedirectConfig): void {
  console.info("[strava oauth] configuration", {
    domain: config.domain,
    callbackPath: config.callbackPath,
    environment: config.environment,
    source: config.source,
  });
}

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
  distance: number;         // metros
  moving_time: number;      // segundos (em movimento)
  elapsed_time: number;     // segundos (total)
  start_date: string;
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain?: number;
  average_cadence?: number; // passos/min (corrida)
  calories?: number;
}

export class StravaApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getStravaAuthorizeUrl(redirectUri: string, state: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID ?? "";
  return `${STRAVA_OAUTH_BASE}/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    "&approval_prompt=auto" +
    `&scope=${encodeURIComponent("read,activity:read_all")}` +
    `&state=${encodeURIComponent(state)}`;
}

export async function exchangeStravaCode(
  code: string,
  redirectUri: string,
): Promise<StravaTokenResponse> {
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
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

export async function fetchStravaActivity(activityId: string, accessToken: string): Promise<StravaActivity> {
  const res = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new StravaApiError("Falha ao buscar atividade do Strava", res.status);
  return res.json();
}
