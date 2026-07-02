import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CookieConsent } from "@/components/cookie-consent";
import { ToastProvider } from "@/components/toast/toast-provider";
import { PwaInit } from "@/components/pwa/pwa-init";
import { AuthSessionProvider } from "@/components/session-provider";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

// PACERUNPRO — Archivo (display/UI) + JetBrains Mono (pace/dados)
const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PACERUNPRO — Sistema operacional de performance para treinadores de corrida.",
  description:
    "Plataforma profissional para treinadores de corrida, assessorias esportivas e corredores. Prescrição, periodização, força e funcional, testes de performance e gestão de atletas — com dados claros e cara de produto premium.",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    images: [{ url: "/brand/pace-run-pro-logo.png", width: 1200, height: 630, alt: "PACERUNPRO" }],
    siteName: "PACERUNPRO",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/pace-run-pro-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0C0F" },
    { media: "(prefers-color-scheme: light)", color: "#F4F3EE" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.add("light");}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthSessionProvider>
            <QueryProvider>
              <ToastProvider>
                <PwaInit />
                {children}
                <CookieConsent />
              </ToastProvider>
            </QueryProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
