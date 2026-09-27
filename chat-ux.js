/* The Gradient 3.6 — Chat experience layer
   ChatGPT-style reasoning control (Standard / Advanced), a single overflow
   menu for secondary tools, and the Claude-style "reasoning strip" the model
   shows while it works. Everything here is additive: it hooks the existing
   composer, never replaces it. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { State, UI, App, Conv, ModeAI } = TG;

  const on = (t, n, f, o) => t.addEventListener(n, f, o);

  /* ============================================================
     1. REASONING MODE — ChatGPT's segmented Standard / Advanced
     ============================================================ */
  const DEPTHS = {
    simple: {
      id: "simple",
      label: "Standard",
      blurb: "Straight to a direct answer. Fewer detours.",
      icon: "bolt"
    },
    advanced: {
      id: "advanced",
      label: "Advanced",
      blurb: "Reasons further, checks edge cases, takes longer.",
      icon: "brain"
    }
  };

  let depthMenu = null;

  function currentDepth() {
    return State.settings.softwareDepth === "simple" ? "simple" : "advanced";
  }

  function setDepth(id) {
    if (!DEPTHS[id]) return;
    State.settings.softwareDepth = id;
    App.persistSettings?.();
    syncDepthButton();
    closeDepthMenu();
    /* Re-render the start panels so they never contradict the control. */
    window.dispatchEvent(new CustomEvent("gradient-depth-changed", { detail: { depth: id } }));
  }

  function depthButtonMarkup() {
    const d = DEPTHS[currentDepth()];
    return (
      `<span class="ico" data-icon="${d.icon}"></span>` +
      `<span class="cw-depth-label">${d.label}</span>` +
      `<span class="ico cw-depth-caret" data-icon="chevron"></span>`
    );
  }

  function syncDepthButton() {
    const btn = document.getElementById("cw-depth-btn");
    if (!btn) return;
    const d = DEPTHS[currentDepth()];
    btn.innerHTML = depthButtonMarkup();
    btn.setAttribute("aria-label", `Reasoning effort: ${d.label}`);
    btn.title = `${d.label} — ${d.blurb}`;
    TG.hydrateIcons?.(btn);
    document.querySelectorAll(".software-depth-pill").forEach((p) => {
      p.classList.toggle("active", p.dataset.depth === currentDepth());
    });
  }

  function closeDepthMenu() {
    depthMenu?.remove();
    depthMenu = null;
    document.getElementById("cw-depth-btn")?.setAttribute("aria-expanded", "false");
  }

  function openDepthMenu(anchor) {
    closeDepthMenu();
    const menu = document.createElement("div");
    menu.className = "cw-depth-menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = Object.values(DEPTHS)
      .map(
        (d) => `
        <button type="button" role="menuitemradio" data-depth="${d.id}" aria-checked="${d.id === currentDepth()}">
          <span class="ico" data-icon="${d.icon}"></span>
          <span class="cw-depth-item">
            <b>${d.label}${d.id === currentDepth() ? ' <em>Current</em>' : ""}</b>
            <small>${d.blurb}</small>
          </span>
          <span class="ico cw-depth-check" data-icon="check"></span>
        </button>`
      )
      .join("");
    document.body.appendChild(menu);
    TG.hydrateIcons?.(menu);

    const r = anchor.getBoundingClientRect();
    const w = menu.offsetWidth, h = menu.offsetHeight;
    let left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    let top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    anchor.setAttribute("aria-expanded", "true");

    menu.querySelectorAll("[data-depth]").forEach((b) =>
      b.addEventListener("click", () => setDepth(b.dataset.depth))
    );
    setTimeout(() => {
      on(document, "pointerdown", (e) => { if (!menu.contains(e.target) && e.target !== anchor) closeDepthMenu(); }, { once: true, capture: true });
      on(document, "keydown", (e) => { if (e.key === "Escape") closeDepthMenu(); }, { once: true });
    }, 0);
    depthMenu = menu;
  }

  /* The control belongs next to the model, exactly where ChatGPT puts it. */
  function installDepthControl() {
    const toolbar = document.querySelector(".composer-toolbar");
    if (!toolbar || document.getElementById("cw-depth-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "cw-depth-btn";
    btn.className = "toggle-chip cw-depth-btn";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = depthButtonMarkup();
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      depthMenu ? closeDepthMenu() : openDepthMenu(btn);
    });
    /* Sit immediately before the spacer so it reads model → effort → tools. */
    const spacer = toolbar.querySelector(".toolbar-spacer");
    if (spacer) toolbar.insertBefore(btn, spacer);
    else toolbar.appendChild(btn);
    TG.hydrateIcons?.(btn);
    syncDepthButton();
  }

  /* ============================================================
     2. EXTRAS MENU — one new icon holds the secondary features
     ============================================================ */
  const EXTRAS = [
    { id: "extras-search", label: "Web search", hint: "Ground answers in live pages", target: "web-search-toggle", setting: "webSearch" },
    { id: "extras-imagesearch", label: "Image search", hint: "Pull reference images into the reply", target: "image-search-toggle", setting: "imageSearch" },
    { id: "extras-imagegen", label: "Create image", hint: "Generate an image instead of a reply", target: "image-gen-toggle", setting: "imageGenMode" },
    { id: "extras-thinking", label: "Show reasoning", hint: "Reveal the model's thinking", target: "thinking-toggle", setting: "showReasoning" },
    { id: "extras-persona", label: "Persona", hint: "Change the assistant's instructions", target: "persona-chip" },
    { id: "extras-pipelines", label: "Pipelines", hint: "Chain several models together", target: "pipelines-entry-btn" },
    { id: "extras-projects", label: "Projects", hint: "Files and saved project context", target: "projects-entry-btn" },
    { id: "extras-memory", label: "Memory", hint: "What the assistant remembers", target: "memory-entry-btn" },
    { id: "extras-prompts", label: "Prompt library", hint: "Reusable prompts", target: "prompts-entry-btn" },
    { id: "extras-agent", label: "Agent Lab", hint: "Multi-step autonomous runs", target: "agent-entry-btn" }
  ];

  let extrasMenu = null;

  function syncExtrasState() {
    if (!extrasMenu) return;
    EXTRAS.forEach((item) => {
      const row = extrasMenu.querySelector(`[data-extra="${item.id}"]`);
      if (!row) return;
      const src = item.target ? document.getElementById(item.target) : null;
      const on = src ? (src.getAttribute("aria-pressed") === "true" || src.classList.contains("active")) : false;
      row.classList.toggle("on", !!on);
    });
  }

  function closeExtras() {
    extrasMenu?.remove();
    extrasMenu = null;
    document.getElementById("cw-extras-btn")?.setAttribute("aria-expanded", "false");
  }

  function openExtras(anchor) {
    closeExtras();
    const menu = document.createElement("div");
    menu.className = "cw-extras-menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML =
      `<div class="cw-extras-head"><b>Tools</b><span>Secondary features, kept out of the way</span></div>` +
      EXTRAS.map(
        (i) => `
        <button type="button" role="menuitem" data-extra="${i.id}">
          <span class="cw-extras-copy"><b>${i.label}</b><small>${i.hint}</small></span>
          <span class="cw-extras-toggle" aria-hidden="true"><i></i></span>
        </button>`
      ).join("");
    document.body.appendChild(menu);

    const r = anchor.getBoundingClientRect();
    const w = menu.offsetWidth, h = menu.offsetHeight;
    let left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    let top = r.top - h - 10;
    if (top < 8) top = Math.min(r.bottom + 10, window.innerHeight - h - 8);
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    anchor.setAttribute("aria-expanded", "true");

    menu.querySelectorAll("[data-extra]").forEach((b) =>
      b.addEventListener("click", () => {
        const item = EXTRAS.find((x) => x.id === b.dataset.extra);
        const src = item?.target ? document.getElementById(item.target) : null;
        if (src) { src.click(); syncExtrasState(); }
      })
    );
    syncExtrasState();

    setTimeout(() => {
      on(document, "pointerdown", (e) => { if (!menu.contains(e.target) && e.target !== anchor) closeExtras(); }, { once: true, capture: true });
      on(document, "keydown", (e) => { if (e.key === "Escape") closeExtras(); }, { once: true });
    }, 0);
    extrasMenu = menu;
  }

  /* The new dedicated icon, added to the composer by us. */
  function installExtrasButton() {
    const toolbar = document.querySelector(".composer-toolbar");
    if (!toolbar || document.getElementById("cw-extras-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "cw-extras-btn";
    btn.className = "toggle-chip cw-extras-btn";
    btn.title = "Tools and secondary features";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Tools");
    btn.innerHTML = `<span class="ico" data-icon="grid"></span>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      extrasMenu ? closeExtras() : openExtras(btn);
    });
    const spacer = toolbar.querySelector(".toolbar-spacer");
    if (spacer) toolbar.insertBefore(btn, spacer);
    else toolbar.appendChild(btn);
    TG.hydrateIcons?.(btn);
  }

  /* ============================================================
     3. REASONING STRIP — Claude-style live "working" disclosure
     ============================================================ */
  function installReasoningStrip() {
    if (!UI.buildMessage || UI.buildMessage.__cwReasoning) return;
    const base = UI.buildMessage.bind(UI);
    UI.buildMessage = function (msg) {
      const el = base(msg);
      if (msg && msg.role === "assistant" && msg.reasoning && String(msg.reasoning).trim()) {
        try {
          const strip = document.createElement("details");
          strip.className = "cw-reasoning";
          strip.innerHTML =
            `<summary><span class="ico" data-icon="brain"></span><span>Reasoning</span>` +
            `<span class="cw-reasoning-len"></span><span class="ico cw-reasoning-caret" data-icon="chevron"></span></summary>` +
            `<div class="cw-reasoning-body"></div>`;
          strip.querySelector(".cw-reasoning-body").textContent = String(msg.reasoning);
          strip.querySelector(".cw-reasoning-len").textContent = `${String(msg.reasoning).split(/\s+/).length} words`;
          const body = el.querySelector(".msg-body");
          const content = el.querySelector(".msg-content");
          if (body && content) body.insertBefore(strip, content);
          else body?.appendChild(strip);
          TG.hydrateIcons?.(strip);
        } catch { /* reasoning is optional */ }
      }
      return el;
    };
    UI.buildMessage.__cwReasoning = true;
  }

  /* ============================================================
     boot
     ============================================================ */
  function install() {
    installDepthControl();
    installExtrasButton();
    installReasoningStrip();
    syncDepthButton();

    window.addEventListener("gradient-depth-changed", syncDepthButton);
    window.addEventListener("gradient-mode-ai-changed", syncDepthButton);

    /* Tapping a depth pill inside a workspace start panel also updates the bar. */
    document.addEventListener("click", (e) => {
      const pill = e.target?.closest?.(".software-depth-pill");
      if (pill?.dataset?.depth) setDepth(pill.dataset.depth);
    });

    /* Keyboard: Ctrl/Cmd + . cycles reasoning effort. */
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        setDepth(currentDepth() === "advanced" ? "simple" : "advanced");
        UI.toast?.(`Reasoning effort: ${DEPTHS[currentDepth()].label}`, { action: "Change", onAction: () => openDepthMenu(document.getElementById("cw-depth-btn")) });
      }
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(() => {
    install();
    window.addEventListener("gradient-app-ready", install);
  });

  TG.ChatUX = { DEPTHS, currentDepth, setDepth, syncDepthButton, installDepthControl, installExtrasButton, EXTRAS };
})();
