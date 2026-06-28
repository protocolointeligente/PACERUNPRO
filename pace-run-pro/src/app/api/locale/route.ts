import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["pt-BR", "en", "es"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isValidLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { locale } = body as { locale?: string };

  if (!locale || !isValidLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const res = NextResponse.json({ locale });
  res.cookies.set("prp-locale", locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return res;
}
