import { NextResponse } from "next/server";

const PAGBANK_BASE_URL =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

// Proxy PagBank's card public key to the browser so card data can be encrypted
// client-side before ever reaching our server (PCI DSS compliance).
// The key rotates; we fetch it fresh and cache briefly.
export const revalidate = 3600;

export async function GET() {
  const token = process.env.PAGBANK_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Pagamento não configurado" }, { status: 503 });
  }

  const res = await fetch(`${PAGBANK_BASE_URL}/public-keys/card`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Não foi possível obter a chave de criptografia." }, { status: 502 });
  }

  const data = (await res.json()) as { public_key?: string; created_at?: string };
  if (!data.public_key) {
    return NextResponse.json({ error: "Chave inválida." }, { status: 502 });
  }

  return NextResponse.json({ publicKey: data.public_key });
}
