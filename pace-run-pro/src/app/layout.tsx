import type { Metadata, Viewport } from "next";
import { Inter, Sora, Montserrat } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pace Run Pro — Treine com propósito. Evolua todos os dias.",
  description:
    "Plataforma profissional para treinadores de corrida, assessorias esportivas, personal trainers e corredores. Prescrição inteligente, periodização, força e funcional, testes de performance e gestão de atletas em um só lugar.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07030f" },
    { media: "(prefers-color-scheme: light)", color: "#f8f6fb" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.add("light");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${sora.variable} ${montserrat.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeToggle />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
