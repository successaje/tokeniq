/*
 * TokenIQ service worker.
 *
 * Deliberately small and conservative for a financial product:
 *  - Precaches only the offline page and the static files it needs (CSS, fonts, icons).
 *  - Navigations are network-first and are never cached; when the network fails
 *    the precached /offline page is shown instead.
 *  - Content-hashed build assets (/_next/static/*) are cache-first.
 *  - /api/* and anything that is not a same-origin GET is never intercepted or
 *    cached, so balances, obligations and other financial data are always live.
 *  - Versioned cache names; old caches are deleted on activate.
 *  - A waiting worker activates only when the page asks it to (SKIP_WAITING).
 */
const VERSION = "2026-10-11.1";
const PRECACHE = `tokeniq-precache-${VERSION}`;
const STATIC = `tokeniq-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/icon.svg", "/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })));
      // Also precache the stylesheets and fonts the offline page references, so it renders styled.
      try {
        const res = await cache.match(OFFLINE_URL);
        const html = res ? await res.text() : "";
        const assets = new Set();
        for (const m of html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+\.(?:css|woff2))"/g)) assets.add(m[1]);
        if (assets.size) {
          const staticCache = await caches.open(STATIC);
          await staticCache.addAll([...assets]);
          // Fonts are referenced from inside the stylesheets, relative to them.
          const fonts = new Set();
          for (const href of assets) {
            if (!href.endsWith(".css")) continue;
            const css = await (await staticCache.match(href))?.text();
            for (const m of (css ?? "").matchAll(/url\((?:"|')?([^)"']+\.woff2)(?:"|')?\)/g)) {
              const path = new URL(m[1], new URL(href, self.location.origin)).pathname;
              // Only the subsets Next marks for preload (".p." in the file name), not every unicode range.
              if (path.startsWith("/_next/static/") && /\.p\.[^/]*$/.test(path)) fonts.add(path);
            }
          }
          if (fonts.size) await staticCache.addAll([...fonts]);
        }
      } catch {
        // The offline page still works unstyled; never fail the install over it.
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE, STATIC]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("tokeniq-") && !keep.has(n)).map((n) => caches.delete(n)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touch API traffic or auth flows: financial data must always be live.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse;
          if (preloaded) return preloaded;
          return await fetch(request);
        } catch {
          const cached = await caches.match(OFFLINE_URL, { cacheName: PRECACHE });
          return cached ?? new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC);
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok && res.type === "basic") cache.put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  if (PRECACHE_URLS.includes(url.pathname) && url.pathname !== OFFLINE_URL) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match(url.pathname, { cacheName: PRECACHE });
          return cached ?? Response.error();
        }
      })(),
    );
  }
});
