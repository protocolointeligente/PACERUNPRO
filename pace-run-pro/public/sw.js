// Pace Run Pro — Service Worker
// Push notifications + offline-first cache strategies.

const CACHE_STATIC = "prp-static-v1";
const CACHE_PAGES  = "prp-pages-v1";

// Static assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/atleta/dashboard",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

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
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_PAGES)
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

  // API routes: network-first, no cache
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        })
      )
    );
    return;
  }

  // Static assets (_next/static, icons, fonts): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?|ico)$/)
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

  // HTML pages: stale-while-revalidate
  if (request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      caches.open(CACHE_PAGES).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((resp) => {
            if (resp.ok) cache.put(request, resp.clone());
            return resp;
          });
          return cached ?? networkFetch;
        })
      )
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
  const targetPath = e.notification.data?.url ?? "/atleta/dashboard";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Prefer an existing tab already showing the target path
      const exactMatch = clientList.find((c) => c.url === targetUrl);
      if (exactMatch) return exactMatch.focus();

      // Navigate the first available visible window to the deep link
      const anyWindow = clientList.find((c) => "navigate" in c);
      if (anyWindow) {
        return anyWindow.focus().then(() => anyWindow.navigate(targetUrl));
      }

      // No window open — open a new one
      return self.clients.openWindow(targetUrl);
    })
  );
});
