import { NextRequest, NextResponse } from "next/server";

const PAGBANK_BASE_URL =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });
  }

  const token = process.env.PAGBANK_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Pagamento não configurado" }, { status: 503 });
  }

  try {
    const res = await fetch(`${PAGBANK_BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ status: "PENDING" });
    }

    const data = (await res.json()) as {
      charges?: Array<{ status: string }>;
      qr_codes?: Array<{ status: string }>;
    };

    // PIX paid when qr_code status is PAID, or a charge is PAID
    const chargePaid = data.charges?.some((c) => c.status === "PAID");
    const qrPaid = data.qr_codes?.some((q) => q.status === "PAID");

    return NextResponse.json({ status: chargePaid || qrPaid ? "PAID" : "PENDING" });
  } catch {
    return NextResponse.json({ status: "PENDING" });
  }
}
