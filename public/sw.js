/*
 * mycopyprompt service worker — Step 11 PWA install + offline.
 *
 * Strategy
 * ────────
 *   - HTML navigations: network-first with cache fallback so the app
 *     still opens (even if from yesterday's HTML) on planes/subways.
 *   - Prompt images and Next.js _next/image: cache-first, 30-day TTL.
 *   - Prompt JSON (catalog reads): stale-while-revalidate.
 *   - User-private API routes (/api/account/, /api/favorites/, /api/admin/,
 *     /api/saved-searches/, /api/collections/): NEVER cached — auth state
 *     must always be fresh.
 *   - All POST/PUT/PATCH/DELETE: passed through untouched.
 *
 * Version bumps
 * ─────────────
 * Increment `CACHE_VERSION` to invalidate every cache after a behaviour
 * change. The activate handler nukes anything that doesn't match.
 */

const CACHE_VERSION = "v1";
const PAGES_CACHE = `mcp-pages-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mcp-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `mcp-images-${CACHE_VERSION}`;
const KNOWN_CACHES = new Set([PAGES_CACHE, RUNTIME_CACHE, IMAGE_CACHE]);

const HTML_FALLBACK = "/";

// Auth-sensitive API routes. We want fresh data here every time.
const PRIVATE_API_PATTERNS = [
  /^\/api\/account\//,
  /^\/api\/favorites\//,
  /^\/api\/admin\//,
  /^\/api\/saved-searches\b/,
  /^\/api\/collections\b/,
  /^\/api\/auth\//,
  /^\/auth\//,
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("mcp-") && !KNOWN_CACHES.has(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GETs. Everything else: pass-through.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Auth-sensitive API → never cache.
  if (PRIVATE_API_PATTERNS.some((re) => re.test(url.pathname))) return;

  // Service worker bootstrap files — let the browser handle.
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest") {
    return;
  }

  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(handleHtml(req));
    return;
  }

  if (req.destination === "image" || url.pathname.startsWith("/_next/image")) {
    event.respondWith(handleImage(req));
    return;
  }

  // API JSON reads we DO want to cache (public catalog endpoints).
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleJson(req));
    return;
  }

  // Static assets shipped by Next.js — long-lived, content-hashed.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleAsset(req));
  }
});

async function handleHtml(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok && res.status === 200) {
      const copy = res.clone();
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(req, copy);
    }
    return res;
  } catch {
    const cache = await caches.open(PAGES_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const fallback = await cache.match(HTML_FALLBACK);
    if (fallback) return fallback;
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function handleImage(req) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    if (cached) return cached;
    throw new Error("Image fetch failed and no cache entry");
  }
}

async function handleAsset(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) {
    cache.put(req, res.clone()).catch(() => {});
  }
  return res;
}

async function handleJson(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    // Stale-while-revalidate: serve cache, refresh in the background.
    networkPromise.catch(() => {});
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;
  return new Response(JSON.stringify({ error: "Offline" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
