import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

// CSP is now applied dynamically in middleware (with per-request nonce).
// Keep other security headers here so they are applied at the CDN/edge level too.
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Fallback static CSP (middleware will override with nonce for page routes)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      [
        "script-src 'self'",
        isDev ? "'unsafe-eval'" : "",
        "'unsafe-inline'",
        "https://sdk.pagseguro.com",
        "https://www.googletagmanager.com",
        "https://*.sentry.io",
      ].filter(Boolean).join(" "),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://images.unsplash.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://sandbox.api.pagseguro.com https://api.pagseguro.com https://res.cloudinary.com https://*.amazonaws.com https://avatars.githubusercontent.com https://*.pacerunpro.com.br",
      "font-src 'self'",
      "connect-src 'self' https://api.pagseguro.com https://sandbox.api.pagseguro.com https://*.sentry.io https://www.strava.com wss:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "@prisma/adapter-pg",
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.pacerunpro.com.br" },
      { protocol: "https", hostname: "pacerunpro.com.br" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },

  // Compress responses
  compress: true,

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "date-fns",
      "recharts",
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Cache public images
      {
        source: "/images/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" }],
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: true,
});
