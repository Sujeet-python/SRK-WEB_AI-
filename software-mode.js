/* The Gradient — Software Development mode
   ChatGPT/Grok/Claude-style coding workspace: conversation-first, minimal chrome. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { State, UI, Conv, App, ModeAI } = TG;

  const escapeHtml = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;").replace(/'/g, "&#39;");

  let picker = null;
  let observer = null;

  function installPicker() {
    if (picker?.isConnected || !UI?.els?.chatScroll) return;
    if (picker && !picker.isConnected) picker = null;
    picker = document.createElement("section");
    picker.id = "software-start-panel";
    picker.className = "software-start-panel";
    picker.innerHTML = `
      <div class="software-start-greeting">
        <div class="software-start-mark" aria-hidden="true">&gt;_</div>
        <h2>What are we building?</h2>
        <p>Describe the feature, bug or system you want. The agent works in the background and delivers the finished artifact.</p>
      </div>
      <div class="software-depth-row">
        <span class="software-depth-label">Response depth</span>
        <div class="software-depth-toggle" role="group" aria-label="Response depth">
          <button type="button" class="software-depth-pill" data-depth="simple" title="Fast, focused implementation">Standard</button>
          <button type="button" class="software-depth-pill active" data-depth="advanced" title="Architecture, edge cases, tests">Advanced</button>
        </div>
      </div>`;

    const inner = UI.els.chatInner;
    if (inner) inner.prepend(picker);
    else UI.els.chatScroll.prepend(picker);

    /* Reflect the saved depth so the panel never lies about the current mode. */
    const saved = State.settings.softwareDepth === "simple" ? "simple" : "advanced";
    picker.querySelectorAll("[data-depth]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.depth === saved);
      btn.addEventListener("click", () => {
        State.settings.softwareDepth = btn.dataset.depth;
        picker.querySelectorAll("[data-depth]").forEach((x) => x.classList.toggle("active", x === btn));
        App.persistSettings?.();
      });
    });

    observer = new MutationObserver(() => refreshVisibility());
    if (UI.els.chatInner) observer.observe(UI.els.chatInner, { childList: true });
    refreshVisibility();
  }

  function refreshVisibility() {
    if (!picker || !picker.isConnected) {
      installPicker();
      if (!picker) return;
    }
    if (State.uiMode !== "software") { picker.hidden = true; return; }
    const conv = Conv?.active?.();
    const hasConversation = !!(conv?.messages?.length);
    picker.hidden = hasConversation;
  }

  function mount() {
    document.body.dataset.gradientMode = "software";
    document.body.classList.add("mode-software");
    document.body.classList.remove("mode-learn", "mode-imagine", "mode-canvas", "mode-documents");
    document.querySelector(".main")?.classList.remove("mode-main-hidden");
    document.getElementById("gradient-mode-stage")?.classList.add("hidden");
    document.getElementById("gradient-mode-stage")?.replaceChildren();
    document.querySelector(".header")?.classList.remove("mode-header-hidden");
    document.getElementById("chat-scroll")?.classList.remove("mode-region-hidden");
    document.getElementById("composer-wrap")?.classList.remove("mode-region-hidden");
    document.getElementById("image-gen-toggle")?.setAttribute("hidden", "true");
    State.settings.imageGenMode = false;
    if (ModeAI) { const pid=ModeAI.provider("software"); const model=ModeAI.model("software"); State.settings.provider=pid; State.settings.model=model; }
    State.settings.softwareDepth = State.settings.softwareDepth || "advanced";
    App.persistSettings?.();
    installPicker();
    refreshVisibility();

    /* Own the composer copy so a previous workspace never leaks its placeholder. */
    const composer = UI.els.composerInput;
    if (composer) composer.placeholder = "Describe a feature, paste an error, or ask for a code review…";
    const list = UI.els?.chatInner?.querySelectorAll?.(".learn-start-panel");
    list?.forEach((n) => n.remove());
  }

  function unmount() {
    if (ModeAI) { State.settings.softwareAI=State.settings.provider; State.settings.softwareModel=State.settings.model; App.persistSettings?.(); }
    document.body.classList.remove("mode-software");
    observer?.disconnect();
    observer = null;
    picker?.remove();
    picker = null;
  }

  // The existing system-prompt layer is extended rather than replacing it.
  if (!App.__softwareDepthPatched) {
    const base = App.systemPrompt.bind(App);
    App.systemPrompt = function (sources) {
      const basePrompt = base(sources);
      if (State.uiMode !== "software") return basePrompt;
      if (State.settings.softwareDepth === "simple") {
        return `${basePrompt}\n\nSOFTWARE DEPTH: STANDARD. Prioritize a clear direct implementation, avoid unnecessary abstractions, and explain only the important choices. Still deliver complete, runnable files.`;
      }
      return `${basePrompt}\n\nSOFTWARE DEPTH: ADVANCED. Think like a senior software engineer: architecture, security, edge cases, maintainability, tests, debugging strategy, performance and integration details matter. This workspace runs verification behind the scenes before showing the final artifact. Return complete files in fenced code blocks, and when a file or test can be executed in the browser sandbox, include the exact verification snippet in <run lang="javascript"> or <run lang="python"> tags.`;
    };
    App.__softwareDepthPatched = true;
  }

  window.TheGradientModeModules = window.TheGradientModeModules || {};
  window.TheGradientModeModules.software = { mount, unmount, refreshVisibility };
})();
