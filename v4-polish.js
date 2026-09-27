/* The Gradient 3.6 — final polish pass
   - Moves the model selector down next to the composer, Claude/Gemini style.
   - Collapses secondary composer toggles and header tools into hover/click
     flyouts instead of showing every control at once.
   - Adds a genuine two-chat Split View: a second same-origin app instance
     (an <iframe> of this same page) that shares the same IndexedDB/localStorage
     conversation store but runs its own independent script context, so both
     panes can hold and even generate replies in separate conversations at the
     same time.
   None of this renames or removes any existing element id, so every listener
   already bound by app.js / ai-hub.js / mode-router.js keeps working — nodes
   are only moved to a new parent or wrapped, never re-created. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  const svg = (paths, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra || ""}>${paths}</svg>`;
  const ICONS = {
    dots: svg('<circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none"/>'),
    sliders: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2" fill="none"/><circle cx="8" cy="12" r="2" fill="none"/><circle cx="16" cy="18" r="2" fill="none"/>'),
    columns: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    refresh: svg('<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16m0 5v-5h5"/>'),
    open: svg('<path d="M14 3h7v7"/><path d="M21 3 10 14"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>')
  };

  /* ---------------------------------------------------------------------
     1. Model selector: relocate the header model-pill down to the composer,
        directly on the message box row, the way Claude and Gemini place it.
     --------------------------------------------------------------------- */
  function relocateModelPill() {
    const pill = document.getElementById("model-pill");
    const toolbar = document.querySelector(".composer-toolbar");
    if (!pill || !toolbar || pill.dataset.v4Relocated) return;
    pill.dataset.v4Relocated = "1";
    pill.classList.add("composer-model-pill");
    toolbar.insertBefore(pill, toolbar.firstChild || null);
  }

  /* ---------------------------------------------------------------------
     2. Composer: keep only the one or two most-used toggles visible; move
        the rest behind a single "Tools" control that reveals on hover/click.
     --------------------------------------------------------------------- */
  function buildComposerTools() {
    const toolbar = document.querySelector(".composer-toolbar");
    if (!toolbar || toolbar.dataset.v4Polished) return;
    toolbar.dataset.v4Polished = "1";

    const tuckIds = ["image-search-toggle", "thinking-toggle", "persona-chip"];
    const tempField = document.getElementById("temp-slider")?.closest(".temp-mini");
    tempField?.classList.remove("desktop-only");
    const spacer = toolbar.querySelector(".toolbar-spacer");

    const group = document.createElement("div");
    group.className = "composer-tools-group";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = "composer-tools-trigger";
    trigger.className = "icon-btn composer-tools-trigger";
    trigger.title = "More tools";
    trigger.setAttribute("aria-label", "More composer tools");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = ICONS.sliders;

    const flyout = document.createElement("div");
    flyout.className = "composer-tools-flyout";
    flyout.id = "composer-tools-flyout";
    tuckIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) flyout.appendChild(el);
    });
    if (tempField) flyout.appendChild(tempField);

    group.appendChild(trigger);
    group.appendChild(flyout);
    toolbar.insertBefore(group, spacer || null);

    let open = false;
    const setOpen = (v) => {
      open = v;
      flyout.classList.toggle("open", v);
      trigger.classList.toggle("on", v);
      trigger.setAttribute("aria-expanded", String(v));
    };
    trigger.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!open); });
    document.addEventListener("pointerdown", (e) => { if (open && !group.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setOpen(false); });
  }

  /* ---------------------------------------------------------------------
     3. Header tools: collapse the icon row behind a single trigger that
        reveals the individual tools on hover (desktop) or tap (touch).
     --------------------------------------------------------------------- */
  function buildHeaderToolsCluster() {
    const row = document.querySelector(".header-tools");
    if (!row || row.dataset.v4Polished) return;
    row.dataset.v4Polished = "1";
    row.classList.add("header-tools-flyout");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = "header-tools-trigger";
    trigger.className = "icon-btn header-tools-trigger";
    trigger.title = "Workspace tools";
    trigger.setAttribute("aria-label", "Workspace tools");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = ICONS.dots;
    row.parentElement.insertBefore(trigger, row);

    let open = false;
    const setOpen = (v) => {
      open = v;
      row.classList.toggle("open", v);
      trigger.classList.toggle("on", v);
      trigger.setAttribute("aria-expanded", String(v));
    };
    trigger.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!open); });
    trigger.addEventListener("mouseenter", () => setOpen(true));
    trigger.addEventListener("focus", () => setOpen(true));
    row.addEventListener("mouseleave", () => setOpen(false));
    document.addEventListener("pointerdown", (e) => {
      if (open && !row.contains(e.target) && e.target !== trigger) setOpen(false);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setOpen(false); });
  }

  /* ---------------------------------------------------------------------
     4. Split view — a genuine second, independent chat running alongside
        the first. Implemented as a same-origin iframe of this same app: it
        shares the IndexedDB/localStorage conversation store, but is its own
        script context, so it can hold a different active conversation and
        generate a reply at the same time as the primary pane.
     --------------------------------------------------------------------- */
  function buildSplitView() {
    // A pane never gets its own split control — an iframe pane is always a
    // plain, single-chat instance even though it loads the very same page.
    if (window.self !== window.top) return;
    if (document.getElementById("split-view-btn")) return;
    const row = document.querySelector(".header-tools");
    if (!row) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "split-view-btn";
    btn.className = "icon-btn";
    btn.title = "Split view — run a second chat side by side (Ctrl+Shift+2)";
    btn.setAttribute("aria-label", "Split view");
    btn.innerHTML = ICONS.columns;
    row.appendChild(btn);

    let root = null, pane = null, iframe = null, grip = null, dragging = false;

    function openSplit() {
      if (pane) return;
      const app = document.getElementById("app");
      if (!app || !app.parentElement) return;
      root = document.createElement("div");
      root.id = "split-view-root";
      app.parentElement.insertBefore(root, app);
      root.appendChild(app);

      pane = document.createElement("div");
      pane.id = "split-view-pane";
      pane.className = "split-view-pane";
      const savedWidth = Number(localStorage.getItem("gradient_split_width_v1") || 0);
      if (savedWidth > 260) pane.style.flexBasis = savedWidth + "px";

      grip = document.createElement("div");
      grip.className = "split-view-grip";
      grip.title = "Drag to resize";
      grip.setAttribute("role", "separator");
      grip.setAttribute("aria-orientation", "vertical");

      const bar = document.createElement("div");
      bar.className = "split-view-bar";
      bar.innerHTML = `<span>Second chat · shares your conversations</span>`;
      const actions = document.createElement("div");
      actions.className = "split-view-bar-actions";
      const refreshBtn = document.createElement("button");
      refreshBtn.type = "button"; refreshBtn.className = "icon-btn sm"; refreshBtn.title = "Refresh (pick up new conversations)";
      refreshBtn.setAttribute("aria-label", "Refresh split pane");
      refreshBtn.innerHTML = ICONS.refresh;
      const popBtn = document.createElement("button");
      popBtn.type = "button"; popBtn.className = "icon-btn sm"; popBtn.title = "Open in a separate window instead";
      popBtn.setAttribute("aria-label", "Open second chat in a new window");
      popBtn.innerHTML = ICONS.open;
      const closeBtn = document.createElement("button");
      closeBtn.type = "button"; closeBtn.className = "icon-btn sm"; closeBtn.title = "Close split view";
      closeBtn.setAttribute("aria-label", "Close split view");
      closeBtn.innerHTML = ICONS.x;
      actions.appendChild(refreshBtn); actions.appendChild(popBtn); actions.appendChild(closeBtn);
      bar.appendChild(actions);

      iframe = document.createElement("iframe");
      iframe.id = "split-view-frame";
      iframe.title = "Second chat";
      iframe.src = location.pathname + location.search;

      pane.appendChild(grip);
      pane.appendChild(bar);
      pane.appendChild(iframe);
      root.appendChild(pane);

      document.body.classList.add("gradient-split-active");
      btn.classList.add("on");
      localStorage.setItem("gradient_split_view_v1", "1");

      refreshBtn.addEventListener("click", () => { iframe.src = iframe.src; });
      popBtn.addEventListener("click", () => {
        window.open(location.pathname + location.search, "_blank", "noopener,width=980,height=860");
        closeSplit();
      });
      closeBtn.addEventListener("click", closeSplit);

      grip.addEventListener("pointerdown", (e) => {
        dragging = true;
        try { grip.setPointerCapture(e.pointerId); } catch {}
        document.body.classList.add("v32-resizing");
      });
      grip.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const total = root.getBoundingClientRect().width;
        const fromRight = total - (e.clientX - root.getBoundingClientRect().left);
        const width = Math.max(320, Math.min(total - 360, fromRight));
        pane.style.flexBasis = width + "px";
        localStorage.setItem("gradient_split_width_v1", String(Math.round(width)));
      });
      const endDrag = () => { dragging = false; document.body.classList.remove("v32-resizing"); };
      grip.addEventListener("pointerup", endDrag);
      grip.addEventListener("pointercancel", endDrag);
    }

    function closeSplit() {
      if (!pane) return;
      const app = document.getElementById("app");
      if (root && root.parentElement) root.parentElement.insertBefore(app, root);
      root?.remove();
      root = null; pane = null; iframe = null; grip = null;
      document.body.classList.remove("gradient-split-active");
      btn.classList.remove("on");
      localStorage.removeItem("gradient_split_view_v1");
    }

    btn.addEventListener("click", () => { pane ? closeSplit() : openSplit(); });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "2") {
        e.preventDefault();
        pane ? closeSplit() : openSplit();
      }
    });

    if (localStorage.getItem("gradient_split_view_v1") === "1") openSplit();
  }

  ready(() => {
    relocateModelPill();
    buildComposerTools();
    buildHeaderToolsCluster();
    buildSplitView();
  });
  window.addEventListener("gradient-app-ready", () => {
    relocateModelPill();
    buildComposerTools();
    buildHeaderToolsCluster();
    buildSplitView();
  }, { once: true });
})();
