import { randomUUID } from "crypto";

const PAGBANK_BASE_URL =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

const PAGBANK_CONNECT_BASE =
  process.env.PAGBANK_ENV === "production"
    ? "https://connect.pagbank.com.br"
    : "https://connect.sandbox.pagbank.com.br";

/** Platform fee charged by PACE RUN PRO on every marketplace sale */
export const MARKETPLACE_COMMISSION_RATE = 0.10;

function getToken(): string {
  const token = process.env.PAGBANK_TOKEN;
  if (!token) throw new Error("PAGBANK_TOKEN env var not set");
  return token;
}

function brtExpiry(minutesFromNow: number): string {
  // BRT = UTC-3. Subtract 3h then replace Z with -03:00 to get correct BRT string.
  const ms = Date.now() + minutesFromNow * 60 * 1000 - 3 * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "-03:00");
}

export interface PixOrderResult {
  orderId: string;
  pixText: string;
  pixQrCodeUrl: string | null;
}

export async function createPixOrder(params: {
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  amountCents: number;
  planName: string;
  notificationUrl: string;
}): Promise<PixOrderResult> {
  const res = await fetch(`${PAGBANK_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: params.referenceId,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
        tax_id: params.customerCpf.replace(/\D/g, ""),
      },
      items: [
        {
          reference_id: params.referenceId,
          name: params.planName,
          quantity: 1,
          unit_amount: params.amountCents,
        },
      ],
      qr_codes: [
        {
          amount: { value: params.amountCents },
          expiration_date: brtExpiry(30),
        },
      ],
      notification_urls: [params.notificationUrl],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PagBank PIX ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id: string;
    qr_codes?: Array<{
      text?: string;
      links?: Array<{ media_type: string; href: string }>;
    }>;
  };

  const qr = data.qr_codes?.[0];
  return {
    orderId: data.id,
    pixText: qr?.text ?? "",
    pixQrCodeUrl: qr?.links?.find((l) => l.media_type === "image/png")?.href ?? null,
  };
}

export interface CardOrderResult {
  orderId: string;
  chargeId: string;
  status: string;
  declineCode?: string;
}

export async function createCreditCardOrder(params: {
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  amountCents: number;
  planName: string;
  /** Encrypted card token produced by PagBank.js in the browser — replaces raw PAN/CVV */
  encryptedCard: string;
  notificationUrl: string;
}): Promise<CardOrderResult> {
  const res = await fetch(`${PAGBANK_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: params.referenceId,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
        tax_id: params.customerCpf.replace(/\D/g, ""),
      },
      items: [
        {
          reference_id: params.referenceId,
          name: params.planName,
          quantity: 1,
          unit_amount: params.amountCents,
        },
      ],
      charges: [
        {
          reference_id: params.referenceId,
          description: params.planName,
          amount: { value: params.amountCents, currency: "BRL" },
          payment_method: {
            type: "CREDIT_CARD",
            installments: 1,
            capture: true,
            card: {
              encrypted: params.encryptedCard,
            },
          },
        },
      ],
      notification_urls: [params.notificationUrl],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PagBank card ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id: string;
    charges?: Array<{
      id: string;
      status: string;
      payment_response?: { code: string };
    }>;
  };

  const charge = data.charges?.[0];
  return {
    orderId: data.id,
    chargeId: charge?.id ?? "",
    status: charge?.status ?? "UNKNOWN",
    declineCode: charge?.payment_response?.code,
  };
}

// ─── PagBank Connect (marketplace seller authorization) ────────────────────

export function buildConnectAuthUrl(coachId: string): string {
  const clientId = process.env.PAGBANK_CLIENT_ID;
  const redirectUri = process.env.PAGBANK_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error("PAGBANK_CLIENT_ID and PAGBANK_REDIRECT_URI must be set");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "payments.read payments.create payments.refund accounts.read",
    state: coachId,
  });
  return `${PAGBANK_CONNECT_BASE}/oauth2/authorize?${params}`;
}

export async function exchangeConnectCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  account_id: string;
}> {
  const clientId = process.env.PAGBANK_CLIENT_ID;
  const clientSecret = process.env.PAGBANK_CLIENT_SECRET;
  const redirectUri = process.env.PAGBANK_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new Error("PagBank Connect env vars missing");

  const res = await fetch(`${PAGBANK_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "X-CLIENT-ID": clientId,
      "X-CLIENT-SECRET": clientSecret,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PagBank Connect token exchange failed: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// ─── Split payment (marketplace) ───────────────────────────────────────────

export interface SplitReceiver {
  accountId: string;
  amountCents: number;
}

export interface PixSplitResult {
  pagbankOrderId: string;
  pixCopyPaste: string;
  pixQrCodeUrl: string | null;
  expiresAt: string;
}

export async function createPixOrderWithSplit(params: {
  /** Internal marketplace order ID — used as reference and must be unique */
  internalOrderId: string;
  totalCents: number;
  productName: string;
  customer: { name: string; email: string; taxId: string };
  /** Coach receiver (90%) + marketplace receiver (10%) */
  receivers: SplitReceiver[];
  notificationUrl: string;
}): Promise<PixSplitResult> {
  const expiresAt = brtExpiry(24 * 60); // 24 h

  const body = {
    reference_id: `mktplace-${params.internalOrderId}`,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      tax_id: params.customer.taxId.replace(/\D/g, ""),
    },
    items: [
      {
        reference_id: params.internalOrderId,
        name: params.productName.slice(0, 100),
        quantity: 1,
        unit_amount: params.totalCents,
      },
    ],
    qr_codes: [
      {
        amount: { value: params.totalCents },
        expiration_date: expiresAt,
        splits: {
          method: "FIXED",
          receivers: params.receivers.map((r) => ({
            account: { id: r.accountId },
            amount: { value: r.amountCents },
          })),
        },
      },
    ],
    notification_urls: [params.notificationUrl],
  };

  const res = await fetch(`${PAGBANK_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-idempotency-key": randomUUID(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PagBank split PIX order failed ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    id: string;
    qr_codes?: Array<{
      text?: string;
      links?: Array<{ rel?: string; media_type?: string; href: string }>;
    }>;
  };

  const qr = data.qr_codes?.[0];
  const qrImageUrl =
    qr?.links?.find((l) => l.rel === "QRCODE.PNG" || l.media_type === "image/png")?.href ?? null;

  return {
    pagbankOrderId: data.id,
    pixCopyPaste: qr?.text ?? "",
    pixQrCodeUrl: qrImageUrl,
    expiresAt,
  };
}

export async function getPagBankOrder(pagbankOrderId: string) {
  const res = await fetch(`${PAGBANK_BASE_URL}/orders/${pagbankOrderId}`, {
    headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PagBank getOrder ${res.status}`);
  return res.json() as Promise<{
    id: string;
    reference_id: string;
    charges?: Array<{ status: string }>;
    qr_codes?: Array<{ status?: string }>;
  }>;
}

export function getMarketplaceAccountId(): string {
  const id = process.env.PAGBANK_ACCOUNT_ID;
  if (!id) throw new Error("PAGBANK_ACCOUNT_ID env var not set");
  return id;
}
