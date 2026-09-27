/* The Gradient 3.6 — product polish and recovery UX. */
(function () {
  "use strict";

  const TG = window.TheGradient;
  if (!TG || !TG.UI || !TG.App) return;

  const { APP, App, UI, State, Settings } = TG;
  /* Version lives in app.js — nothing here should override it. */
  const version = APP.version;

  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };

  function providerState() {
    const provider = State.settings?.provider || "simulation";
    const cfg = APP.providers?.[provider] || APP.providers?.simulation || {};
    const hasKey = !cfg.needsKey || !!String(State.apiKeys?.[provider] || "").trim();
    return { provider, cfg, hasKey, ready: provider === "simulation" || hasKey };
  }

  function openProviderSettings() {
    Settings?.open?.("provider");
  }

  function setPrompt(prompt) {
    const input = UI.els?.composerInput;
    if (!input) return;
    input.value = prompt;
    UI.autoGrow?.(input);
    App.updateComposerState?.();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function statusText() {
    const { provider, cfg, hasKey } = providerState();
    if (provider === "simulation") return { title: "Simulation mode", detail: "Connect a model for live answers", ready: false };
    if (!hasKey) return { title: `${cfg.label || "Provider"} needs a key`, detail: "Add it once in Settings", ready: false };
    return { title: `${cfg.label || "Provider"} connected`, detail: "Ready for your next message", ready: true };
  }

  function renderSidebarStatus() {
    const footer = document.querySelector(".sidebar-footer");
    const meter = document.getElementById("storage-meter");
    if (!footer || !meter) return;
    let card = document.getElementById("w41-sidebar-status");
    if (!card) {
      card = document.createElement("div");
      card.id = "w41-sidebar-status";
      card.className = "w41-sidebar-status";
      footer.insertBefore(card, meter.nextSibling);
    }
    const state = statusText();
    card.innerHTML = `
      <span class="w41-status-dot${state.ready ? " ready" : ""}" aria-hidden="true"></span>
      <div><strong>${escape(state.title)}</strong><span>${escape(state.detail)}</span></div>
      <button type="button">${state.ready ? "Manage" : "Connect"}</button>`;
    card.querySelector("button")?.addEventListener("click", openProviderSettings, { once: true });
  }

  function renderWelcome() {
    const host = UI.els?.chatInner;
    if (!host) return;
    /* Learn mode renders its own, plainer start panel. Don't overwrite it. */
    if (State.uiMode === "learn") return;
    const state = statusText();
    host.replaceChildren();

    const section = document.createElement("section");
    section.className = "welcome w41-welcome";
    section.setAttribute("aria-labelledby", "w41-welcome-title");
    section.innerHTML = `
      <div class="w41-welcome-head">
        <div class="welcome-mark" aria-hidden="true">✦</div>
        <div>
          <div class="w41-eyebrow">Private AI workspace</div>
          <h1 id="w41-welcome-title">What will you make clear?</h1>
          <p class="welcome-copy">A focused space for thinking, building, researching and making. Bring a question, a rough idea or a file. The Gradient keeps the work close and the controls out of the way.</p>
        </div>
      </div>
      <div class="w41-welcome-grid" aria-label="Starter prompts"></div>
      <div class="w41-connection">
        <span class="w41-status-dot${state.ready ? " ready" : ""}" aria-hidden="true"></span>
        <div class="w41-connection-copy"><strong>${escape(state.title)}</strong><br>${escape(state.detail)}</div>
        <button type="button">${state.ready ? "Provider settings" : "Connect a model"}</button>
      </div>
      <div class="w41-welcome-foot">
        <span><b>/</b> commands</span>
        <span><b>⌘ K</b> command palette</span>
        <span><b>Drop</b> a file to attach</span>
      </div>`;

    const prompts = [
      { kicker: "Plan", title: "Turn a rough idea into a clear plan", body: "Milestones, risks and a practical next step.", prompt: "Turn this rough idea into a clear plan with milestones, risks and the best next step:\n\n" },
      { kicker: "Build", title: "Help me solve a hard problem", body: "Reason through the options before choosing one.", prompt: "Help me solve this problem. Ask only the questions that matter, then reason through the options and recommend one:\n\n" },
      { kicker: "Write", title: "Shape notes into something people can use", body: "A clean draft with the right voice and structure.", prompt: "Turn these notes into a clear, useful draft for a non-technical reader. Keep the voice warm and direct:\n\n" },
      { kicker: "Explore", title: "Compare ideas before I commit", body: "Trade-offs, a recommendation and what could change it.", prompt: "Compare these options with the trade-offs, recommend one, and tell me what would change your mind:\n\n" }
    ];
    const grid = section.querySelector(".w41-welcome-grid");
    prompts.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "w41-starter";
      button.innerHTML = `<span class="w41-starter-kicker"></span><strong></strong><span></span>`;
      button.querySelector(".w41-starter-kicker").textContent = item.kicker;
      button.querySelector("strong").textContent = item.title;
      button.querySelector("span:last-child").textContent = item.body;
      button.addEventListener("click", () => setPrompt(item.prompt));
      grid.appendChild(button);
    });
    section.querySelector(".w41-connection button")?.addEventListener("click", openProviderSettings);
    host.appendChild(section);
  }

  function errorMeta(kind) {
    const copy = {
      no_key: ["Connect a provider to continue", "This workspace is ready, but the selected provider needs an API key."],
      auth: ["The provider rejected the key", "Check the key or choose another connected provider."],
      network: ["The provider could not be reached", "Check your connection, CORS settings or local server."],
      rate_limit: ["The provider is busy", "Wait a moment, then retry or switch to another model."],
      invalid_model: ["That model is unavailable", "Choose a model supported by your provider or refresh its catalog."],
      server: ["The provider returned an error", "The service may be having trouble. Retrying is usually safe."],
      empty: ["The model returned no answer", "Try the same message again or select another model."]
    };
    return copy[kind] || ["That message could not be completed", "The conversation is safe. You can retry without losing your prompt."];
  }

  function buildError(msg) {
    const box = document.createElement("section");
    box.className = "w41-error";
    box.setAttribute("role", "alert");
    const [title, detail] = errorMeta(msg.errorKind);
    const hint = msg.errorHint || detail;
    box.innerHTML = `
      <div class="w41-error-head"><span class="w41-error-mark">!</span><span class="w41-error-title"></span></div>
      <div class="w41-error-copy"></div><div class="w41-error-hint"></div><div class="w41-error-actions"></div>`;
    box.querySelector(".w41-error-title").textContent = title;
    box.querySelector(".w41-error-copy").textContent = msg.error || detail;
    box.querySelector(".w41-error-hint").textContent = hint;
    const actions = box.querySelector(".w41-error-actions");
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "primary";
    retry.textContent = "Try again";
    retry.addEventListener("click", () => App.regenerate(msg.id));
    actions.appendChild(retry);
    if (["no_key", "auth", "invalid_model"].includes(msg.errorKind)) {
      const settings = document.createElement("button");
      settings.type = "button";
      settings.textContent = "Open provider settings";
      settings.addEventListener("click", openProviderSettings);
      actions.appendChild(settings);
    }
    return box;
  }

  function syncSurface() {
    const brand = document.getElementById("brand-ver");
    if (brand) brand.textContent = "3.6";
    const state = statusText();
    document.documentElement.dataset.gradientReady = state.ready ? "true" : "false";
    renderSidebarStatus();
  }

  function install() {
    const baseWelcome = UI.showWelcome.bind(UI);
    UI.showWelcome = function () {
      /* Learn mode owns its own start panel; never draw the generic splash. */
      if (State.uiMode === "learn") { UI.els?.chatInner?.querySelector?.(".w41-welcome")?.remove(); return; }
      if (State.uiMode && State.uiMode !== "software") return baseWelcome();
      renderWelcome();
    };
    UI.buildError = buildError;

    const baseSend = App.sendMessage.bind(App);
    App.sendMessage = async function () {
      try {
        return await baseSend();
      } catch (error) {
        State.generating = false;
        State.abort = null;
        UI.els?.sendBtn?.classList.remove("hidden");
        UI.els?.stopBtn?.classList.add("hidden");
        App.updateComposerState?.();
        UI.toast?.("The message could not be completed. Your chat is still safe.", {
          error: true,
          action: "Try again",
          onAction: () => App.sendMessage()
        });
        console.error("The Gradient send boundary:", error);
      }
    };

    syncSurface();
    if (!State.activeId) { if (State.uiMode === "learn") UI.els?.chatInner?.querySelector?.(".w41-welcome")?.remove(); else renderWelcome(); }
    [
      "gradient-app-ready",
      "gradient-provider-keys-changed",
      "gradient-mode-ai-changed",
      "gradient-mode-model-changed",
      "online",
      "offline"
    ].forEach((event) => window.addEventListener(event, syncSurface));
  }

  ready(() => {
    if (window.__gradient41Installed) return;
    window.__gradient41Installed = true;
    install();
  });
})();
