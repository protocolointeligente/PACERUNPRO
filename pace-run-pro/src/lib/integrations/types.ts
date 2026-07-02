/**
 * Tipos compartilhados da camada de integração de wearables/plataformas.
 * Todos os adapters falam essa linguagem comum — nenhum dado raw do provider
 * vaza para além do adapter que o produziu.
 */

// ── Providers suportados ──────────────────────────────────────────────────────

export type ProviderName =
  | "STRAVA"
  | "GARMIN"
  | "POLAR"
  | "COROS"
  | "SUUNTO"
  | "APPLE_WATCH"
  | "GOOGLE_FIT";

// ── Tokens OAuth ──────────────────────────────────────────────────────────────

/**
 * Representação unificada de credenciais de acesso a um provider.
 * Os tokens nunca são armazenados em plaintext — passam por encrypt() antes
 * de serem escritos no banco (ConnectedDevice.accessToken / refreshToken).
 */
export interface ProviderTokens {
  accessToken: string;
  refreshToken?: string;
  /** Quando o accessToken expira. Ausente em tokens sem prazo (ex.: OAuth 1.0a). */
  expiresAt?: Date;
  /**
   * Para providers que usam OAuth 1.0a (ex.: Garmin Consumer API):
   * guarda o token secret junto com o access token (campo tokenSecret).
   * Armazenado no campo refreshToken do ConnectedDevice.
   */
  tokenSecret?: string;
  /** Campos extras específicos do provider (ex.: scopes, athlete_id). */
  extra?: Record<string, unknown>;
}

export interface AuthorizeParams {
  /** Valor opaco para validação CSRF — deve ser verificado no callback. */
  state: string;
  /** URL de retorno registrada no provider. */
  redirectUri: string;
  /** Code verifier para PKCE (quando o adapter suportar). */
  codeVerifier?: string;
}

export interface ExchangeResult {
  tokens: ProviderTokens;
  /** ID do usuário na plataforma externa (gravado em ConnectedDevice.externalId). */
  providerUserId: string;
}

// ── Atividade normalizada ─────────────────────────────────────────────────────

/**
 * Representação unificada de uma atividade física, independente da plataforma.
 * Adapters convertem dados brutos do provider para este formato.
 */
export interface NormalizedActivity {
  /** ID da atividade na plataforma de origem (ex.: "12345678" no Strava). */
  sourceId: string;
  /** Provider de origem. */
  provider: ProviderName;
  /** Título/nome da atividade (ex.: "Corrida matinal"). */
  title?: string;
  /**
   * Tipo de atividade no vocabulário do provider.
   * Exemplos: "Run", "TrailRun", "Ride", "Swim", "Walk".
   */
  activityType?: string;
  startedAt: Date;
  finishedAt?: Date;
  /** Duração total em segundos. */
  durationSec?: number;
  distanceKm?: number;
  /** Ritmo médio em segundos por km. */
  avgPaceSecPerKm?: number;
  avgHrBpm?: number;
  maxHrBpm?: number;
  elevationGainM?: number;
  calories?: number;
  cadenceAvg?: number;
  /** Suffer Score / Training Load nativo do provider (ex.: Strava Suffer Score). */
  sufferScore?: number;
  /** RPE estimado a partir de FC (1–10). Calculado pelo adapter quando não disponível. */
  rpeEstimated?: number;
}

// ── Eventos de webhook ────────────────────────────────────────────────────────

export type WebhookEventType =
  | "activity_created"
  | "activity_updated"
  | "activity_deleted"
  | "deauthorize";

export interface WebhookEvent {
  eventType: WebhookEventType;
  /**
   * ID do usuário na plataforma (usado para localizar ConnectedDevice.externalId).
   */
  providerUserId: string;
  /** ID da atividade no provider. Ausente para eventos de deauthorize. */
  activityId?: string;
  /** Payload original, para auditoria ou reprocessamento. */
  raw?: unknown;
}

// ── Erros tipados ─────────────────────────────────────────────────────────────

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Lançado quando o access token expirou e o refresh também falhou. */
export class TokenExpiredError extends ProviderError {
  constructor(provider: ProviderName) {
    super(`Token expirado para ${provider}. Reconecte a integração.`, 401, "TOKEN_EXPIRED");
    this.name = "TokenExpiredError";
  }
}

/** Lançado quando o adapter não está configurado (env vars ausentes). */
export class ProviderNotConfiguredError extends ProviderError {
  constructor(provider: ProviderName, missingVar: string) {
    super(`${provider} não configurado: variável de ambiente ${missingVar} ausente.`, 503, "NOT_CONFIGURED");
    this.name = "ProviderNotConfiguredError";
  }
}
