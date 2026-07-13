const CACHE = "mughis-v2";
const STATIC = [
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return networkFirst(e);
  if (e.request.url.includes("/_next/static/chunks/")) return networkFirst(e);
  if (e.request.url.includes("/_next/webpack/")) return networkFirst(e);
  cacheFirst(e);
});

function cacheFirst(e) {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      const ct = res.headers.get("content-type") || "";
      if (res.ok && (ct.startsWith("text/") || ct.startsWith("application/") || ct.includes("javascript"))) {
        const c = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, c));
      }
      return res;
    }))
  );
}

function networkFirst(e) {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
}
