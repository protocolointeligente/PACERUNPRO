// Pace Run Pro — Service Worker
// Push notifications + offline-first cache strategies.

const CACHE_STATIC = "prp-static-v5";
const CACHE_PAGES  = "prp-pages-v5";
const CACHE_RSC    = "prp-rsc-v5";
const CACHE_API    = "prp-api-v5";

// Static assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/atleta/dashboard",
  "/atleta/calendario",
  "/atleta/forca",
  "/manifest.webmanifest",
  "/favicon-32.png",
  "/exercises.json",
  "/exercises/agachamento.gif",
  "/exercises/prancha.gif",
  "/exercises/ponte.gif",
  "/exercises/panturrilha.gif",
  "/exercises/mobilidade.gif",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

function offlineResponse(message, contentType = "text/plain; charset=utf-8") {
  return new Response(message, {
    status: 503,
    headers: { "content-type": contentType },
  });
}

function shouldCacheApi(pathname) {
  return (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/webhooks/") &&
    !pathname.startsWith("/api/checkout") &&
    !pathname.startsWith("/api/stripe/") &&
    !pathname.startsWith("/api/cron/") &&
    !pathname.startsWith("/api/debug/")
  );
}

function isRscRequest(request, url) {
  const accept = request.headers.get("accept") ?? "";
  return (
    request.headers.get("rsc") === "1" ||
    url.searchParams.has("_rsc") ||
    accept.includes("text/x-component")
  );
}

async function networkFirst(cacheName, request, fallback) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? fallback();
  }
}

async function offlinePageFallback(request) {
  return (
    (await caches.match(request)) ??
    (await caches.match("/offline.html")) ??
    offlineResponse("Offline")
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Purge old cache versions
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_STATIC, CACHE_PAGES, CACHE_RSC, CACHE_API].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API read routes: network-first + last loaded fallback for offline mode.
  if (shouldCacheApi(url.pathname)) {
    e.respondWith(
      networkFirst(CACHE_API, request, () =>
        offlineResponse(JSON.stringify({ error: "offline" }), "application/json; charset=utf-8")
      )
    );
    return;
  }

  // Other API routes are never cached.
  if (url.pathname.startsWith("/api/")) return;

  // Static assets (_next/static, icons, fonts): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|json|woff2?|ico)$/)
  ) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          }
          return resp;
        })
      )
    );
    return;
  }

  // Next.js App Router navigation data: keep the last loaded RSC payload available offline.
  if (isRscRequest(request, url)) {
    e.respondWith(
      networkFirst(CACHE_RSC, request, () =>
        offlineResponse("Offline", "text/x-component; charset=utf-8")
      )
    );
    return;
  }

  // Authenticated HTML pages: network-first to avoid serving old dashboards/menus after a deploy.
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      networkFirst(CACHE_PAGES, request, () => offlinePageFallback(request))
    );
    return;
  }
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (e) => {
  let data = { title: "Pace Run Pro", body: "Você tem um treino hoje!", url: "/atleta/dashboard" };
  try {
    data = Object.assign(data, e.data?.json());
  } catch {
    if (e.data?.text()) data.body = e.data.text();
  }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/atleta/dashboard";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
