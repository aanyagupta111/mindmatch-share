// Minimal service worker — caches just the app shell (this page's own
// files) so it opens instantly and doesn't show a browser error if
// launched with no connection. It does NOT cache anything from CloudKit
// (videos, saved posts) — those always need a live connection, same as
// the native app does.
// IMPORTANT: bump this version number every time record.html (or any
// shell file) changes. Browsers only re-check/re-cache when this exact
// string changes — otherwise a service worker keeps serving whatever it
// cached on its very first install, ignoring all future updates on the
// server. This was v1 since the first deploy; bumping to v2 here is
// what actually pushes out every fix made since then.
const CACHE_NAME = "mindmatch-web-shell-v4";
const SHELL_FILES = [
  "./record.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin shell files — everything else (CloudKit API
  // calls, the video/image assets themselves) passes straight through
  // to the network untouched.
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
