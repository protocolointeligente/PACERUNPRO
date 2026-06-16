const PAGBANK_BASE_URL =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAGBANK_CLIENT_ID}:${process.env.PAGBANK_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAGBANK_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=accounts.read",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PagBank auth ${res.status}: ${text.slice(0, 200)}`);
  }

  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
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
  const token = await getAccessToken();

  const res = await fetch(`${PAGBANK_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
  cardNumber: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardCvv: string;
  cardHolderName: string;
  notificationUrl: string;
}): Promise<CardOrderResult> {
  const token = await getAccessToken();

  const res = await fetch(`${PAGBANK_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
              number: params.cardNumber.replace(/\D/g, ""),
              exp_month: params.cardExpMonth,
              exp_year: params.cardExpYear,
              security_code: params.cardCvv,
              holder: { name: params.cardHolderName },
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
