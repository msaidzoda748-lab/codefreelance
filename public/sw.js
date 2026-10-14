/* Zoir Freelance service worker: offline shell only. Never caches API, auth or HTML responses with user data. */
const VERSION = "zoir-v1";
const SHELL = "/offline.html";
const PRECACHE = [SHELL, "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  // Navigations: always network (SSR + cookies), fall back to offline page.
  if (req.mode === "navigate") { e.respondWith(fetch(req).catch(() => caches.match(SHELL))); return; }
  // Immutable static assets: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
