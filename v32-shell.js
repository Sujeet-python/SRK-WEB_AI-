/* The Gradient 3.2 — product shell
   One sidebar, one resize handle, one theme bridge, no workspace tabs outside the sidebar. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;

  const MODE_META = {
    learn: { title: "Learn", status: "Explanations, study and tutoring", badge: "LEARN" },
    software: { title: "Software Development", status: "Code, projects, debugging and engineering", badge: "SOFTWARE" },
    imagine: { title: "Imagine", status: "Image creation with your selected image model", badge: "IMAGINE" },
    canvas: { title: "Canvas", status: "Visual design and editable composition", badge: "CANVAS" },
    documents: { title: "Documents", status: "Create, edit, preview and export files", badge: "DOCUMENTS" }
  };

  const ui = {
    sidebar: () => document.getElementById("sidebar"),
    scrim: () => document.getElementById("sidebar-scrim"),
    brand: () => document.querySelector(".brand-mark"),
    stage: () => document.getElementById("gradient-mode-stage"),
    main: () => document.querySelector(".main"),
    headerTitle: () => document.getElementById("header-title"),
    headerModeBadge: () => document.getElementById("header-mode-badge"),
    headerStatus: () => document.getElementById("header-status-text"),
    headerDot: () => document.getElementById("header-status-dot"),
    modelPill: () => document.getElementById("model-pill"),
    badges: () => document.querySelectorAll("#header-search-badge,#header-image-badge,#header-thinking-badge"),
    tools: () => document.querySelector(".header-tools")
  };

  function syncTheme() {
    const root = document.documentElement;
    const theme = root.getAttribute("data-theme") || "dark";
    const accent = root.getAttribute("data-accent") || "indigo";
    const density = root.getAttribute("data-density") || "cozy";
    const width = root.getAttribute("data-width") || "cozy";
    document.body.dataset.sharedTheme = theme;
    document.body.dataset.sharedAccent = accent;
    document.body.dataset.sharedDensity = density;
    document.body.dataset.sharedWidth = width;
    document.querySelectorAll(".gradient-mode-stage").forEach((stage) => {
      stage.dataset.theme = theme;
      stage.dataset.accent = accent;
      stage.dataset.density = density;
      stage.dataset.width = width;
    });
    window.Gradient32State?.set({ theme, accent, density });
  }

  function openSidebar() {
    const s = ui.sidebar(), scrim = ui.scrim();
    if (!s) return;
    if (window.innerWidth <= 900) {
      s.classList.add("mobile-open");
      scrim?.classList.add("show");
      return;
    }
    s.classList.remove("collapsed");
    const expand = document.getElementById("expand-btn"); if (expand) expand.hidden = true;
  }
  function closeSidebarMobile() {
    ui.sidebar()?.classList.remove("mobile-open");
    ui.scrim()?.classList.remove("show");
  }

  function installResizeHandle() {
    const sidebar = ui.sidebar();
    if (!sidebar || sidebar.dataset.v32Resizer === "1") return;
    sidebar.dataset.v32Resizer = "1";
    sidebar.style.position = "relative";
    const handle = document.createElement("div");
    handle.className = "gradient-sidebar-resizer-v32";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-label", "Resize sidebar");
    handle.title = "Drag to resize sidebar";
    sidebar.appendChild(handle);

    const saved = Number(window.Gradient32State?.get?.().sidebarWidth || 292);
    document.documentElement.style.setProperty("--sidebar-w", `${Math.max(240, Math.min(500, saved))}px`);
    let drag = null;
    const move = (e) => {
      if (!drag) return;
      e.preventDefault();
      const min = 235;
      const max = Math.min(520, Math.max(320, window.innerWidth - 360));
      const width = Math.max(min, Math.min(max, e.clientX));
      document.documentElement.style.setProperty("--sidebar-w", `${width}px`);
      window.Gradient32State?.set({ sidebarWidth: width });
    };
    const end = () => {
      if (!drag) return;
      try { handle.releasePointerCapture?.(drag.pointerId); } catch {}
      drag = null;
      document.body.classList.remove("v32-resizing");
    };
    handle.addEventListener("pointerdown", (e) => {
      if (window.innerWidth <= 900 || e.button !== 0) return;
      e.preventDefault();
      try { handle.setPointerCapture?.(e.pointerId); } catch {}
      drag = { pointerId: e.pointerId };
      document.body.classList.add("v32-resizing");
    });
    handle.addEventListener("pointermove", move, { passive: false });
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  function installBrandSettings() {
    const brand = ui.brand();
    if (!brand || brand.dataset.v32Settings === "1") return;
    brand.dataset.v32Settings = "1";
    brand.setAttribute("role", "button");
    brand.setAttribute("tabindex", "0");
    brand.title = "Quick menu";
    // NOTE: window.Gradient32QuickMenu.toggle() always returns undefined, so the
    // previous `a() || b()` fallback ran b() (a direct Settings.open) on every
    // single click — meaning the quick menu and the full Settings dialog both
    // opened at once. Only fall back to Settings when the quick menu module
    // genuinely isn't available.
    const open = () => {
      if (window.Gradient32QuickMenu && typeof window.Gradient32QuickMenu.toggle === "function") {
        window.Gradient32QuickMenu.toggle();
      } else {
        TG.Settings?.open?.("provider");
      }
    };
    brand.addEventListener("click", open);
    brand.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  function bindSidebarModes() {
    document.querySelectorAll(".mode-sidebar-btn[data-mode]").forEach((btn) => {
      if (btn.dataset.v32Bound === "1") return;
      btn.dataset.v32Bound = "1";
      btn.addEventListener("click", () => {
        window.TheGradientModeRouter?.setMode(btn.dataset.mode);
        closeSidebarMobile();
      });
    });
    const scrim = ui.scrim();
    if (scrim && scrim.dataset.v32Bound !== "1") {
      scrim.dataset.v32Bound = "1";
      scrim.addEventListener("click", closeSidebarMobile);
    }
    const mobile = document.getElementById("mobile-menu-btn");
    if (mobile && mobile.dataset.v32Bound !== "1") {
      mobile.dataset.v32Bound = "1";
      mobile.addEventListener("click", openSidebar);
    }
  }

  function patchHeader() {
    if (!TG.UI?.updateHeader || TG.UI.updateHeader.__v32) return;
    const base = TG.UI.updateHeader.bind(TG.UI);
    TG.UI.updateHeader = function () {
      base();
      const mode = TG.State.uiMode || "software";
      const meta = MODE_META[mode] || MODE_META.software;
      // Always keep the workspace badge in sync, in every mode, so returning
      // to Software Development from Imagine/Canvas/Documents visibly shows
      // "Software" again instead of leaving the previous mode's label in place.
      ui.headerModeBadge() && (ui.headerModeBadge().textContent = meta.badge || meta.title);
      if (mode === "software" || mode === "learn") return;
      ui.headerTitle() && (ui.headerTitle().textContent = meta.title);
      ui.headerStatus() && (ui.headerStatus().textContent = meta.status);
      ui.headerDot()?.classList.remove("live", "sim", "busy");
      ui.headerDot()?.classList.add("live");
      const pill = ui.modelPill(); if (pill) pill.hidden = true;
      ui.badges().forEach((b) => { b.hidden = true; });
      const tools = ui.tools(); if (tools) tools.classList.add("v32-secondary-header-tools");
    };
    TG.UI.updateHeader.__v32 = true;
  }

  function syncActiveModeButton() {
    const mode = TG.State?.uiMode || document.body.dataset.gradientMode || "software";
    document.querySelectorAll(".mode-sidebar-btn[data-mode]").forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function syncModeHeader() {
    const mode = document.body.dataset.gradientMode || TG.State.uiMode || "software";
    const meta = MODE_META[mode] || MODE_META.software;
    /* Learn is a chat surface like Software: keep the composer, model pill
       and header tools, just relabel them. */
    const chatMode = mode === "software" || mode === "learn";
    document.body.classList.toggle("v32-software", chatMode);
    document.body.classList.toggle("v32-workspace", !chatMode);
    ui.headerModeBadge() && (ui.headerModeBadge().textContent = meta.badge || meta.title);
    if (chatMode) {
      const pill = ui.modelPill(); if (pill) pill.hidden = false;
      ui.tools()?.classList.remove("v32-secondary-header-tools");
      ui.headerTitle() && (ui.headerTitle().textContent = meta.title);
      ui.headerStatus() && (ui.headerStatus().textContent = meta.status);
      ui.badges().forEach((b) => b.hidden = false);
      window.requestAnimationFrame(() => TG.UI?.updateHeader?.());
    } else {
      ui.headerTitle() && (ui.headerTitle().textContent = meta.title);
      ui.headerStatus() && (ui.headerStatus().textContent = meta.status);
      ui.modelPill() && (ui.modelPill().hidden = true);
      ui.badges().forEach((b) => b.hidden = true);
      ui.tools()?.classList.add("v32-secondary-header-tools");
    }
  }

  function scan() {
    installResizeHandle();
    installBrandSettings();
    bindSidebarModes();
    patchHeader();
    syncTheme();
    syncModeHeader();
    syncActiveModeButton();
    // Safety: older builds injected mode-switching chrome into the workspace. 3.2 intentionally keeps modes only in the sidebar.
    document.querySelectorAll(".v26-mode-bar,.v26-mode-tabs").forEach((el) => el.remove());
  }

  function init() {
    syncTheme();
    scan();
    let scanQueued = false;
    const observer = new MutationObserver((records) => {
      const relevant = records.some(r => r.type === "childList" && (r.addedNodes.length || r.removedNodes.length));
      if (!relevant || scanQueued) return;
      scanQueued = true;
      requestAnimationFrame(() => { scanQueued = false; scan(); });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent", "data-density", "data-width"] });
    window.addEventListener("resize", () => { closeSidebarMobile(); scan(); }, { passive: true });
    if (TG.ModeCore == null) TG.ModeCore = {};
    TG.ModeCore.scan = scan;
    TG.ModeCore.syncTheme = syncTheme;
    TG.ModeCore.syncActiveModeButton = syncActiveModeButton;
    TG.ModeCore.ensureChrome = () => {};
    window.Gradient32Shell = { syncTheme, openSidebar, closeSidebarMobile, scan, MODE_META };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
