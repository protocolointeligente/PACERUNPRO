import type { Metadata, Viewport } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import { CookieConsent } from "@/components/cookie-consent";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "PACERUNPRO — Sistema operacional de performance",
  description:
    "Plataforma profissional para treinadores, assessorias e atletas: prescrição, periodização, força, dados de performance e gestão em um só lugar.",
  applicationName: "PACERUNPRO",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PACERUNPRO",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0C0F" },
    { media: "(prefers-color-scheme: light)", color: "#F4F3EE" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme")||"system";var light=t==="light"||(t==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches);document.documentElement.classList.toggle("light",light);document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <PwaRegister />
        <ThemeToggle />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
