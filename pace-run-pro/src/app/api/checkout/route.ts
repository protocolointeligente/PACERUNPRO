import { NextResponse } from "next/server";

const LEGACY_CHECKOUT_RESPONSE = {
  error:
    "Checkout legado desativado. Use /api/stripe/create-checkout-session para compras de planos publicados na loja.",
  canonicalPath: "/api/stripe/create-checkout-session",
};

export async function GET() {
  return NextResponse.json(LEGACY_CHECKOUT_RESPONSE, { status: 410 });
}

export async function POST() {
  return NextResponse.json(LEGACY_CHECKOUT_RESPONSE, { status: 410 });
}
