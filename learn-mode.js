/* The Gradient 3.6 — Learn workspace
   A deliberately plain, Claude-style chat: no workspaces, no tool chrome,
   just a clean transcript and a composer. Learning, explaining and tutoring. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { State, UI, Conv, App, ModeAI } = TG;

  let picker = null;
  let observer = null;
  let listeners = [];
  const on = (target, name, fn) => { target.addEventListener(name, fn); listeners.push([target, name, fn]); };

  /* ---------- starters ---------- */
  const STARTERS = [
    { icon: "✦", title: "Explain a concept", prompt: "Explain how large language models work, as if I'm new to the topic but technically minded." },
    { icon: "∑", title: "Walk me through maths", prompt: "Walk me through Bayes' theorem step by step with a concrete real-world example." },
    { icon: "◷", title: "Build a study plan", prompt: "Build me a 4-week study plan to learn the fundamentals of computer science, one hour a day." },
    { icon: "✎", title: "Quiz me", prompt: "Quiz me on the basics of statistics. Ask one question at a time and explain my mistakes." }
  ];

  function installPicker() {
    if (picker?.isConnected && picker.parentNode === UI.els.chatInner) return;
    if (!UI?.els?.chatInner) return;
    picker?.remove();
    picker = document.createElement("section");
    picker.id = "learn-start-panel";
    picker.className = "learn-start-panel";
    picker.innerHTML = `
      <div class="learn-start-inner">
        <div class="learn-mark" aria-hidden="true">✎</div>
        <h2>What would you like to learn?</h2>
        <p>Ask anything. Learn mode keeps things simple — clear explanations, worked examples and no distractions.</p>
        <div class="learn-starters">
          ${STARTERS.map((s, i) => `
            <button type="button" class="learn-starter" data-seed="${i}">
              <span class="learn-starter-icon" aria-hidden="true">${s.icon}</span>
              <b>${s.title}</b>
              <span>${s.prompt.slice(0, 74)}…</span>
            </button>`).join("")}
        </div>
      </div>`;
    UI.els.chatInner.prepend(picker);

    picker.querySelectorAll("[data-seed]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = STARTERS[Number(btn.dataset.seed)];
        const input = UI.els.composerInput;
        if (!input || !s) return;
        input.value = s.prompt;
        UI.autoGrow?.(input);
        App.updateComposerState?.();
        input.focus();
      });
    });

    observer = new MutationObserver(() => refreshVisibility());
    observer.observe(UI.els.chatInner, { childList: true });
    refreshVisibility();
  }

  function refreshVisibility() {
    if (!picker || !picker.isConnected) { installPicker(); if (!picker) return; }
    /* The greeting belongs to a fresh, empty conversation only — once the user
       has said anything it disappears for good and never returns mid-chat. */
    if (State.uiMode !== "learn") { picker.hidden = true; return; }
    const conv = Conv?.active?.();
    picker.hidden = !!(conv?.messages?.length) || !!State.generating;
  }

  /* ---------- mount / unmount ---------- */
  function mount() {
    document.body.dataset.gradientMode = "learn";
    document.body.classList.add("mode-learn");
    document.body.classList.remove("mode-software", "mode-imagine", "mode-canvas", "mode-documents");

    document.querySelector(".main")?.classList.remove("mode-main-hidden");
    document.querySelector(".header")?.classList.remove("mode-header-hidden");
    document.getElementById("chat-scroll")?.classList.remove("mode-region-hidden");
    document.getElementById("composer-wrap")?.classList.remove("mode-region-hidden");
    const stage = document.getElementById("gradient-mode-stage");
    stage?.classList.add("hidden");
    stage?.classList.remove("v32-mode-visible");
    stage?.replaceChildren();

    document.getElementById("image-gen-toggle")?.setAttribute("hidden", "true");
    State.settings.imageGenMode = false;

    if (ModeAI) {
      const pid = ModeAI.provider("learn");
      const model = ModeAI.model("learn");
      if (pid) State.settings.provider = pid;
      if (model) State.settings.model = model;
    }

    /* Learn mode is deliberately minimal: plain answers, no tool/agent chrome. */
    const header = document.querySelector(".header");
    if (header) header.dataset.learnLabel = "Learn";
    document.title = "Learn — The Gradient";

    App.updateHeader?.();
    /* The generic splash belongs to the other chat surface — clear it out. */
    UI.els?.chatInner?.querySelectorAll?.(".w41-welcome, #software-start-panel").forEach((n) => n.remove());
    installPicker();

    const composer = UI.els.composerInput;
    if (composer) composer.placeholder = "Ask anything — explain, summarise, quiz me…";
    UI.els?.chatInner?.querySelectorAll?.("#software-start-panel, .w41-welcome").forEach((n) => n.remove());

    /* Hide the greeting the moment a turn starts, not just after the store write. */
    if (!App.__learnSendPatched) {
      const baseSend = App.sendMessage.bind(App);
      App.sendMessage = async function () {
        if (State.uiMode === "learn") refreshVisibility();
        return baseSend();
      };
      App.__learnSendPatched = true;
    }
    on(window, "gradient-conversation-changed", refreshVisibility);
    on(window, "gradient-mode-ai-changed", refreshVisibility);
  }

  function unmount() {
    if (ModeAI) {
      State.settings.learnAI = State.settings.provider;
      State.settings.learnModel = State.settings.model;
      App.persistSettings?.();
    }
    document.body.classList.remove("mode-learn");
    document.title = "The Gradient — Private AI workspace";
    const header = document.querySelector(".header");
    if (header) delete header.dataset.learnLabel;
    listeners.forEach(([t, n, f]) => t.removeEventListener(n, f));
    listeners = [];
    observer?.disconnect();
    observer = null;
    picker?.remove();
    picker = null;
  }

  /* A short, focused system prompt: this is a tutoring surface, not a coding agent. */
  if (!App.__learnPromptPatched) {
    const base = App.systemPrompt.bind(App);
    App.systemPrompt = function (sources) {
      const p = base(sources);
      if (State.uiMode !== "learn") return p;
      return `${p}\n\nLEARN MODE. Act as a patient, rigorous tutor. Explain ideas from first principles before naming jargon, use concrete examples and analogies, and check understanding with one short question when it helps. Prefer clear prose and small steps over dump-everything answers. Never invent a fake tool run: if you need to compute something, show the working inline.`;
    };
    App.__learnPromptPatched = true;
  }

  window.TheGradientModeModules = window.TheGradientModeModules || {};
  window.TheGradientModeModules.learn = { mount, unmount, refreshVisibility };
})();
