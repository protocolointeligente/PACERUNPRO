const PAGBANK_BASE_URL =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

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

