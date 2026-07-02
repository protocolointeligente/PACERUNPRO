/**
 * Interface comum que todos os adapters de wearable/plataforma devem implementar.
 *
 * Princípio: o adapter é a única fronteira entre o provider externo e o sistema.
 * Ele converte dados brutos em NormalizedActivity e gerencia o ciclo de vida
 * dos tokens OAuth sem expor lógica de provider para o resto da aplicação.
 */

import type {
  ProviderName,
  ProviderTokens,
  AuthorizeParams,
  ExchangeResult,
  NormalizedActivity,
  WebhookEvent,
} from "./types";

export interface IProviderAdapter {
  // ── Identidade ──────────────────────────────────────────────────────────────

  /** Valor correspondente ao enum DeviceProvider no Prisma. */
  readonly provider: ProviderName;
  /** Nome legível para exibição na UI. */
  readonly displayName: string;
  /** Ícone SVG slug usado no frontend (ex.: "strava", "garmin"). */
  readonly iconSlug: string;

  // ── Capacidades ─────────────────────────────────────────────────────────────

  /**
   * true = o adapter usa fluxo OAuth server-side.
   * false = a integração é push-only do app mobile (ex.: Apple Health).
   */
  readonly supportsOAuth: boolean;

  /**
   * true = o provider envia eventos via webhook.
   * false = é necessário polling periódico (ex.: Google Fit sem push).
   */
  readonly supportsWebhooks: boolean;

  /**
   * true = o sistema deve fazer polling para obter atividades novas.
   * Complementar a supportsWebhooks para providers sem push.
   */
  readonly requiresPolling: boolean;

  // ── Fluxo OAuth ─────────────────────────────────────────────────────────────
  // Só implementar quando supportsOAuth = true.

  /**
   * Gera a URL de autorização para redirecionar o usuário ao provider.
   * Lê client_id e scopes das variáveis de ambiente.
   */
  getAuthorizeUrl(params: AuthorizeParams): string;

  /**
   * Troca o código de autorização por tokens de acesso.
   * Retorna tokens + ID do usuário no provider (gravado em ConnectedDevice.externalId).
   */
  exchangeCode(code: string, redirectUri: string): Promise<ExchangeResult>;

  /**
   * Renova o access token usando o refresh token.
   * Deve ser chamado quando a API retornar 401 ou quando expiresAt < now.
   */
  refreshTokens(current: ProviderTokens): Promise<ProviderTokens>;

  /**
   * Revoga o acesso no provider (deauthorize).
   * Best-effort: não deve lançar exceção se o provider estiver indisponível.
   */
  revokeTokens(tokens: ProviderTokens): Promise<void>;

  // ── Sincronização de atividades ─────────────────────────────────────────────

  /**
   * Busca as atividades recentes do usuário.
   * @param tokens Tokens de acesso (já decriptados).
   * @param since Se informado, busca apenas atividades após esta data.
   */
  fetchActivities(tokens: ProviderTokens, since?: Date): Promise<NormalizedActivity[]>;

  // ── Webhooks ────────────────────────────────────────────────────────────────
  // Só implementar quando supportsWebhooks = true.

  /**
   * Verifica a assinatura/autenticidade do webhook recebido.
   * @param rawBody Body da requisição como string (necessário para HMAC).
   * @param headers Headers da requisição.
   */
  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean;

  /**
   * Converte o payload bruto do webhook em WebhookEvent normalizado.
   * Retorna null se o evento não for relevante (ex.: evento de update, não de criação).
   */
  parseWebhook(body: unknown): WebhookEvent | null;

  /**
   * Responde ao handshake/challenge de subscription do provider.
   * @returns Objeto a ser retornado como JSON ao provider, ou null se não se aplica.
   */
  handleChallenge(
    query: Record<string, string>,
    verifyToken: string,
  ): Record<string, string> | null;
}

/**
 * Classe base com implementações padrão para providers sem suporte a webhooks/OAuth.
 * Adapters concretos podem estender e sobrescrever apenas o necessário.
 */
export abstract class BaseProviderAdapter implements IProviderAdapter {
  abstract readonly provider: ProviderName;
  abstract readonly displayName: string;
  abstract readonly iconSlug: string;
  readonly supportsOAuth: boolean = true;
  readonly supportsWebhooks: boolean = false;
  readonly requiresPolling: boolean = false;

  getAuthorizeUrl(_params: AuthorizeParams): string {
    throw new Error(`${this.provider}: OAuth não suportado neste adapter.`);
  }

  exchangeCode(_code: string, _redirectUri: string): Promise<ExchangeResult> {
    throw new Error(`${this.provider}: OAuth não suportado neste adapter.`);
  }

  refreshTokens(_current: ProviderTokens): Promise<ProviderTokens> {
    throw new Error(`${this.provider}: refresh de token não implementado.`);
  }

  async revokeTokens(_tokens: ProviderTokens): Promise<void> {
    // Padrão: sem-op (melhor esforço)
  }

  abstract fetchActivities(tokens: ProviderTokens, since?: Date): Promise<NormalizedActivity[]>;

  verifyWebhook(_rawBody: string, _headers: Record<string, string>): boolean {
    return false;
  }

  parseWebhook(_body: unknown): WebhookEvent | null {
    return null;
  }

  handleChallenge(
    _query: Record<string, string>,
    _verifyToken: string,
  ): Record<string, string> | null {
    return null;
  }
}
