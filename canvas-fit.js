/* The Gradient 3.6 — Canvas fit
   The canvas is the one workspace that can overflow: three columns, a top bar
   and a status bar all inside a stage that must never scroll the page. This
   keeps the whole canvas — colours, toolbar, layers, artboard — inside the
   viewport at every size, and zooms the artboard to genuinely fit.

   Also exposes TG.CanvasFit.applyTheme() so the canvas palette matches the
   active app theme instead of a hard-coded dark sheet. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;

  const ZOOM_MIN = 0.1, ZOOM_MAX = 2.2;

  function stage() {
    return document.getElementById("gradient-mode-stage") || document.querySelector(".canvas-stage");
  }
  function app() {
    return document.querySelector(".canvas-app");
  }
  function viewport() {
    return document.getElementById("canvas-viewport") || document.querySelector(".canvas-viewport");
  }

  /* Give the stage a real height (100dvh minus any chrome) so nothing
     overflows the document and the grid can distribute properly. */
  function sizeStage() {
    const s = stage();
    if (!s || !document.body.classList.contains("mode-canvas")) return;
    const vh = window.visualViewport?.height || window.innerHeight;
    s.style.height = vh + "px";
    s.style.maxHeight = vh + "px";
    s.style.overflow = "hidden";
    const a = app();
    if (a) { a.style.height = "100%"; a.style.minHeight = "0"; a.style.overflow = "hidden"; }
    const vp = viewport();
    if (vp) { vp.style.minHeight = "0"; vp.style.overflow = "auto"; }
  }

  /* Zoom the artboard so the entire page fits inside the viewport with a
     comfortable margin, at any window size. */
  function fitArtboard(userTriggered) {
    const s = stage();
    if (!s) return;
    const vp = viewport();
    if (!vp) return;
    const page = CanvasState() || { w: 1200, h: 800 };
    const box = vp.getBoundingClientRect();
    if (!box.width || !box.height) return;
    /* Account for the grid backdrop padding and the artboard's own border. */
    const pad = 44;
    const zx = (box.width - pad) / Math.max(1, page.w);
    const zy = (box.height - pad) / Math.max(1, page.h);
    let z = Math.min(zx, zy);
    z = Math.min(Math.max(ZOOM_MIN, z), ZOOM_MAX);
    if (userTriggered) z = Math.min(z, 1);
    applyZoom(z);
    /* Recentre after the zoom settles. */
    requestAnimationFrame(() => {
      vp.scrollLeft = Math.max(0, (vp.scrollWidth - vp.clientWidth) / 2);
      vp.scrollTop = Math.max(0, (vp.scrollHeight - vp.clientHeight) / 2);
    });
  }

  /* Drive the canvas module's own zoom through its public controls so its
     internal state stays in sync with what the user sees. */
  function applyZoom(z) {
    const pct = Math.round(z * 100);
    const readout = document.getElementById("canvas-zoom-value");
    const current = readout ? parseInt(readout.textContent, 10) : NaN;
    const currentZoom = Number.isFinite(current) ? current / 100 : 1;
    if (Math.abs(currentZoom - z) < 0.005) return;
    const inBtn = document.getElementById("canvas-zoom-in");
    const outBtn = document.getElementById("canvas-zoom-out");
    /* The module steps zoom in fixed increments; click toward the target. */
    const step = 0.1;
    const delta = z - currentZoom;
    const btn = delta > 0 ? inBtn : outBtn;
    if (!btn) return;
    const clicks = Math.max(1, Math.min(40, Math.round(Math.abs(delta) / step)));
    for (let i = 0; i < clicks; i++) {
      const before = readout ? readout.textContent : "";
      btn.click();
      if (readout && readout.textContent === before) break;
      const now = readout ? parseInt(readout.textContent, 10) / 100 : 0;
      if ((delta > 0 && now >= z) || (delta < 0 && now <= z)) break;
    }
  }

  function CanvasState() {
    try {
      const svg = document.querySelector("#gradient-design-canvas");
      const w = Number(svg?.getAttribute("width")) || 1200;
      const h = Number(svg?.getAttribute("height")) || 800;
      return { w, h };
    } catch { return null; }
  }

  /* The canvas has a native Fit button; wire it to the fitting logic rather
     than adding a second control. */
  function ensureFitButton() {
    if (!document.body.classList.contains("mode-canvas")) return;
    const btn = document.getElementById("canvas-fit");
    if (!btn || btn.dataset.tgFitHooked === "1") return;
    btn.dataset.tgFitHooked = "1";
    btn.addEventListener("click", () => setTimeout(() => fitArtboard(true), 0), true);
  }

  /* ---------- theme sync ---------- */
  function isLight() {
    const t = document.documentElement.dataset.theme || TG.State?.settings?.theme;
    if (t === "light") return true;
    if (t === "dark") return false;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches;
  }

  function applyTheme() {
    const s = document.documentElement;
    if (isLight()) {
      s.style.setProperty("--canvas-bg", "#f4f6fb");
      s.style.setProperty("--canvas-surface", "#ffffff");
      s.style.setProperty("--canvas-line", "#e2e6ee");
      s.style.setProperty("--canvas-text", "#1a1f2b");
    } else {
      s.style.setProperty("--canvas-bg", "#0e1119");
      s.style.setProperty("--canvas-surface", "#161a24");
      s.style.setProperty("--canvas-line", "#242a38");
      s.style.setProperty("--canvas-text", "#e9edf6");
    }
  }

  /* ---------- orchestration ---------- */
  let raf = null;
  function schedule(fit) {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      sizeStage();
      ensureFitButton();
      if (fit) setTimeout(() => fitArtboard(false), 60);
    });
  }

  function watch() {
    if (!TG.UI?.els) { setTimeout(watch, 400); return; }
    const mo = new MutationObserver(() => {
      const on = document.body.classList.contains("mode-canvas");
      if (on) schedule(true);
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class", "data-gradient-mode"] });
    window.addEventListener("resize", () => { if (document.body.classList.contains("mode-canvas")) schedule(true); });
    window.addEventListener("orientationchange", () => schedule(true));
    /* Re-fit whenever the canvas mounts its stage. */
    const bodyMo = new MutationObserver(() => {
      if (document.querySelector(".canvas-stage .canvas-app") && !document.querySelector("#tg-canvas-sized")) {
        const a = app();
        if (a) a.id = a.id || "tg-canvas-sized";
        schedule(true);
      }
    });
    bodyMo.observe(document.body, { childList: true, subtree: true });
    schedule(true);
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(watch);
  window.addEventListener("gradient-app-ready", () => { applyTheme(); schedule(true); });

  TG.CanvasFit = { fitArtboard, sizeStage, applyTheme, schedule };
})();
