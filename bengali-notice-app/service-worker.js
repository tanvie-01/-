/*
  Service worker for the Bengali Notice Generator PWA.
  Strategy:
   - App shell (HTML/CSS/JS/manifest/logo & watermark images, icons):
     NETWORK-FIRST. Always try to fetch the latest version when online;
     only fall back to the cached copy when there's no network. This is
     what makes future edits to these files show up immediately on next
     reload instead of getting stuck behind an old cached copy — with a
     pure cache-first strategy, updates would be invisible until the
     cache was manually cleared, which is confusing for real users.
   - Cross-origin assets (Google Fonts, html2canvas, jsPDF from CDN):
     cache opportunistically (stale-while-revalidate) — these almost
     never change, so serving the cached copy instantly while quietly
     refreshing it in the background is the right tradeoff.
   - Notices themselves are never touched by the service worker — they
     live only in IndexedDB inside the page, which is untouched by the
     network layer entirely.
*/

const CACHE_VERSION = "bn-notice-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/logo-header.jpg",
  "./assets/logo-watermark.png",
  // Poster Studio section (build output of ../poster-studio, stable file names)
  "./poster/index.html",
  "./poster/assets/poster-studio.js",
  "./poster/assets/index.css",
  "./poster/assets/logo.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Network-first for the app shell: try the network so edits are
    // always picked up; fall back to cache only when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => {
            if (cached) return cached;
            if (req.mode === "navigate") return caches.match("./index.html");
          })
        )
    );
  } else {
    // Cross-origin (fonts / CDN libs): stale-while-revalidate.
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(req).then((cached) => {
          const networkFetch = fetch(req)
            .then((res) => {
              cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
  }
});
