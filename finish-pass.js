/* The Gradient 3.6 — Finish pass
   1. GPT/Claude-grade "thinking" indicator: orbiting dots + shimmering label,
      plus a typing caret that matches. No more dead "…" while a model works.
   2. The extras menu becomes pure icons — a small glyph per tool, with the
      name only as a tooltip, so the composer stays uncluttered.
   3. Professional type: a clean neutral sans for the UI, monospace for all
      code, previews and data. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;

  /* =========================================================
     1. THINKING / WORKING INDICATOR
     ========================================================= */
  const ORBITER_HTML =
    `<span class="tg-thinking" aria-label="Working">
       <span class="tgo-orbit"><i></i><i></i><i></i></span>
     </span>`;

  const THINK_LABELS = [
    "Thinking", "Working through it", "Reasoning", "Considering", "Piecing it together"
  ];

  /* Replace the flat "Generating reply…" placeholder with an orbiting-dot
     indicator that also names what is happening. */
  function paintThinking(root) {
    if (!root) return;
    root.querySelectorAll(".stream-cursor, .typing-dot, .cw-typing").forEach((el) => {
      if (el.dataset.tgRich === "1") return;
      el.dataset.tgRich = "1";
      el.classList.add("tg-typing-rich");
      el.innerHTML = `<span class="tgt-dots"><i></i><i></i><i></i></span>`;
    });
    root.querySelectorAll(".msg-status, .stream-status").forEach((el) => {
      if (el.dataset.tgRich === "1") return;
      const text = (el.textContent || "").toLowerCase();
      if (!/generat|think|writing|working|loading|composing/.test(text)) return;
      el.dataset.tgRich = "1";
      el.classList.add("tg-status-rich");
      el.innerHTML = `${ORBITER_HTML}<span class="tgo-label"></span>`;
      const label = el.querySelector(".tgo-label");
      label.textContent = THINK_LABELS[0];
      let i = 1;
      const timer = setInterval(() => {
        if (!el.isConnected) { clearInterval(timer); return; }
        label.textContent = THINK_LABELS[i % THINK_LABELS.length];
        i++;
      }, 2600);
      el.dataset.tgTimer = String(timer);
    });
  }

  /* Show the indicator immediately when a turn begins, before the provider
     emits its first token, so there is never an empty pause. */
  function installThinkingOnSend() {
    if (TG.App?.sendMessage && !TG.App.sendMessage.__tgThink) {
      const base = TG.App.sendMessage.bind(TG.App);
      TG.App.sendMessage = function (...args) {
        const inner = TG.UI?.els?.chatInner;
        if (inner) {
          const host = inner.querySelector(".msg.assistant:last-of-type") || inner;
          if (!host.querySelector(".tg-status-rich")) {
            const strip = document.createElement("div");
            strip.className = "msg-status tg-status-rich tg-status-inline";
            strip.innerHTML = `${ORBITER_HTML}<span class="tgo-label">${THINK_LABELS[0]}</span>`;
            host.appendChild(strip);
          }
        }
        const p = base(...args);
        if (p && p.finally) p.finally(() => {
          inner?.querySelectorAll(".tg-status-inline").forEach((n) => n.remove());
        });
        return p;
      };
      TG.App.sendMessage.__tgThink = true;
    }
  }

  /* Observe the transcript so any status the core renders gets upgraded. */
  function observeThinking() {
    const inner = TG.UI?.els?.chatInner;
    if (!inner) { setTimeout(observeThinking, 400); return; }
    const run = () => paintThinking(inner);
    run();
    new MutationObserver(() => {
      clearTimeout(observeThinking._t);
      observeThinking._t = setTimeout(run, 90);
    }).observe(inner, { childList: true, subtree: true, characterData: true });
  }

  /* =========================================================
     2. ICON-ONLY EXTRAS MENU
     ========================================================= */
  const TOOL_ICONS = {
    "extras-search": "search",
    "extras-imagesearch": "image",
    "extras-imagegen": "sparkle",
    "extras-thinking": "eye",
    "extras-persona": "persona",
    "extras-pipelines": "flow",
    "extras-projects": "archive",
    "extras-memory": "chip",
    "extras-prompts": "quote",
    "extras-agent": "branch"
  };

  function iconifyExtras() {
    const menu = document.querySelector(".cw-extras-menu");
    if (!menu || menu.dataset.tgIcons === "1") return;
    menu.dataset.tgIcons = "1";
    menu.classList.add("cw-extras-iconic");
    menu.querySelectorAll("[data-extra]").forEach((btn) => {
      const id = btn.dataset.extra;
      const label = btn.querySelector("b")?.textContent || "";
      const hint = btn.querySelector("small")?.textContent || "";
      btn.setAttribute("title", label + (hint ? " — " + hint : ""));
      btn.setAttribute("aria-label", label);
      btn.innerHTML =
        `<span class="cwx-glyph ico" data-icon="${TOOL_ICONS[id] || "sparkle"}"></span>` +
        `<span class="cwx-dot"></span>`;
    });
    TG.hydrateIcons?.(menu);
  }

  /* =========================================================
     3. PROFESSIONAL TYPE
     ========================================================= */
  function applyType() {
    document.documentElement.classList.add("tg-type-pro");
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    applyType();
    installThinkingOnSend();
    observeThinking();
    const mo = new MutationObserver(() => iconifyExtras());
    mo.observe(document.body, { childList: true, subtree: true });
    /* Switching workspace must not leave a floating menu over the new one. */
    const dismissFloating = () => {
      document.querySelectorAll(".cw-extras-menu, .mp-panel").forEach((n) => n.remove());
      document.querySelectorAll("#cw-extras-btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
    };
    let lastMode = document.body.dataset.gradientMode;
    const modeWatch = () => {
      const mode = document.body.dataset.gradientMode;
      if (mode === lastMode) return;
      lastMode = mode;
      dismissFloating();
    };
    new MutationObserver(modeWatch).observe(document.body, { attributes: true, attributeFilter: ["data-gradient-mode", "class"] });
    /* The router is the authority on mode changes — hook it when it appears. */
    const hookRouter = () => {
      const router = window.TheGradientModeRouter;
      if (!router || router.setMode.__tgDismiss) return;
      const base = router.setMode;
      const wrapped = function (...args) { dismissFloating(); return base(...args); };
      wrapped.__tgDismiss = true;
      router.setMode = wrapped;
      if (TG.Modes) TG.Modes.setMode = wrapped;
    };
    hookRouter();
    setInterval(hookRouter, 800);
    TG.Fonts = { applyType };
    TG.Thinking = { ORBITER_HTML, paintThinking };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  window.addEventListener("gradient-app-ready", () => setTimeout(boot, 200));
})();
