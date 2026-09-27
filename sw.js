/* The Gradient 3.6 — offline shell.
   Every script and stylesheet index.html loads is listed here, so the app
   opens and works with no connection once it has been visited once.
   A version bump in CACHE_NAME invalidates old shells on the next load. */
const CACHE_NAME = "the-gradient-3.6-shell-v1";

const SHELL = [
  "./", "./index.html", "./manifest.json",

  /* Stylesheets, in the order index.html links them. */
  "./styles.css", "./studio.css",
  "./software-mode.css", "./imagine-mode.css", "./canvas-mode.css", "./documents-mode.css",
  "./v26.css", "./v32-shell.css", "./v32-fit.css",
  "./software-3.2.css", "./imagine-3.2.css", "./canvas-3.2.css", "./documents-3.2.css",
  "./v369-workspaces.css", "./v4-polish.css", "./v41-world-class.css",

  /* Core runtime. */
  "./v32-startup.js", "./app.js", "./ai-hub.js",
  "./v32-state.js", "./v32-shell.js", "./v32-quick-menu.js", "./v32-resilience.js",
  "./v26-provider.js", "./v369-core.js",

  /* Studios and workspaces. */
  "./studio-formats.js", "./agent-orchestrator.js", "./document-studio.js", "./prompt-studio.js",
  "./software-mode.js", "./learn-mode.js", "./imagine-mode.js", "./canvas-mode.js", "./documents-mode.js",
  "./mode-router.js", "./language-preview.js", "./v369-tests.js", "./v4-polish.js",

  /* Product layers added in this release. */
  "./v41-world-class.js", "./chat-ux.js", "./preview-engine.js", "./workflows.js",
  "./model-picker.js", "./canvas-fit.js", "./finish-pass.js", "./software-agent.js"
];

/* Install: precache the shell. One bad URL must not abort the whole install,
   so each file is cached individually and failures are tolerated. */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(SHELL.map((url) =>
        cache.add(url).catch(() => { /* a missing optional asset is not fatal */ })
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  /* Only same-origin shell files are cached; model and image traffic is not. */
  if (url.origin !== self.location.origin) return;
  /* Navigations: serve the shell so a deep reload works offline. */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
