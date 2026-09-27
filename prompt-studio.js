/* The Gradient — AI Prompt Studio
   AI-authored reusable prompts. Every generated prompt is normalized to begin
   with "Act as a ..." and is stored in the existing prompt library. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;

  const { State, Store, Providers, APP, UI, App, ProOverlay } = TG;

  function save() {
    App.persistPrompts?.();
  }

  function normalizePrompt(raw, task) {
    let prompt = String(raw || "").trim();
    prompt = prompt.replace(/^```(?:text|markdown)?\s*/i, "").replace(/```$/i, "").trim();
    prompt = prompt.replace(/^Prompt:\s*/i, "").trim();
    if (!/^act\s+as\b/i.test(prompt)) {
      const topic = String(task || "expert assistant").trim().replace(/\s+/g, " ").slice(0, 90);
      prompt = `Act as a professional expert for ${topic}.\n\n${prompt}`;
    }
    return prompt;
  }

  function parseAnswer(text, task) {
    const raw = String(text || "").trim();
    try {
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      return {
        name: String(json.name || "AI Expert Prompt").trim(),
        slash: String(json.slash || json.name || "ai-expert").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24),
        body: normalizePrompt(json.prompt || json.body || raw, task)
      };
    } catch {
      const body = normalizePrompt(raw, task);
      const first = body.split(/[.!?\n]/)[0].replace(/^Act as\s+(a|an)\s+/i, "").trim();
      return {
        name: first ? first.slice(0, 60) : "AI Expert Prompt",
        slash: (first || "ai-expert").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24),
        body
      };
    }
  }

  async function generate(task, details) {
    const provider = State.settings.provider;
    const model = State.settings.model;
    const adapter = Providers.get(provider);
    const system = `You are The Gradient's expert prompt architect. Build one highly reusable system-style prompt from the user's requested task. The generated prompt MUST begin with exactly “Act as a …”. Choose the most appropriate expert role for the requested task. Make it specific, practical, and production-quality. Include objective, responsibilities, constraints, quality standards, workflow, and output expectations when relevant. Do not discuss prompt engineering. Return JSON only: {"name":"short name","slash":"short-kebab-name","prompt":"complete prompt"}.`;
    const request = `Task: ${task}\n\nExtra requirements: ${details || "None"}`;
    let full = "";
    const result = await adapter.send({
      messages: [{ role: "user", content: request }],
      model,
      systemPrompt: system,
      apiKey: State.apiKeys[provider] || "",
      endpoint: State.endpoints[provider],
      stream: false,
      params: { temperature: 0.35, maxTokens: Math.min(1600, State.settings.maxTokens || 1600), topP: 0.9 },
      onDelta: (t) => { full = typeof t === "string" ? t : (t && t.text) || full; }
    });
    const text = typeof result === "string" ? result : (result?.text || full);
    return parseAnswer(text, task);
  }

  function drawList(root) {
    const list = root.querySelector("#prompt-studio-list");
    if (!list) return;
    if (!State.prompts.length) {
      list.innerHTML = `<div class="prompt-studio-empty">No saved prompts yet. Describe a role or task and let the AI build one.</div>`;
      return;
    }
    list.innerHTML = State.prompts.map((p) => `
      <article class="prompt-studio-card" data-id="${TG.Sec?.esc ? TG.Sec.esc(p.id) : p.id}">
        <div class="prompt-studio-card-head"><div><strong>${TG.Sec?.esc ? TG.Sec.esc(p.name) : p.name}</strong><span>/${TG.Sec?.esc ? TG.Sec.esc(p.slash) : p.slash}</span></div><button class="icon-btn sm" data-action="delete" aria-label="Delete prompt">${TG.Icon ? TG.Icon.trash : "×"}</button></div>
        <p>${(TG.Sec?.esc ? TG.Sec.esc(p.body) : String(p.body)).replace(/\n/g, "<br>")}</p>
        <div class="prompt-studio-card-foot"><button class="btn btn-sm" data-action="insert">Use in composer</button><button class="btn btn-sm" data-action="copy">Copy</button></div>
      </article>`).join("");
    if (TG.hydrateIcons) TG.hydrateIcons(list);
    list.querySelectorAll("[data-id]").forEach((card) => {
      const p = State.prompts.find((x) => x.id === card.dataset.id);
      if (!p) return;
      card.querySelector("[data-action=delete]")?.addEventListener("click", async () => {
        if (UI.confirm && !(await UI.confirm("Delete prompt", `Remove “${p.name}” from the library?`, "Delete", true))) return;
        State.prompts = State.prompts.filter((x) => x.id !== p.id);
        save();
        drawList(root);
      });
      card.querySelector("[data-action=insert]")?.addEventListener("click", () => { App.insertPrompt(p); ProOverlay.close?.(); });
      card.querySelector("[data-action=copy]")?.addEventListener("click", async () => { await navigator.clipboard?.writeText(p.body); UI.toast?.("Prompt copied"); });
    });
  }

  async function open() {
    if (!ProOverlay) return;
    ProOverlay.open({
      title: "Prompt Studio",
      build: (body) => {
        body.innerHTML = `
          <div class="prompt-studio-shell">
            <section class="prompt-studio-hero">
              <div><div class="prompt-studio-eyebrow">AI PROMPT ARCHITECT</div><h2>Build reusable expert prompts</h2><p>Describe what you need. The AI chooses the role and writes a production-ready prompt that always starts with “Act as a …”.</p></div>
            </section>
            <section class="prompt-studio-builder">
              <label class="field"><span>What should the prompt help you do?</span><textarea id="prompt-task" rows="4" placeholder="Example: Build and review a production React dashboard with TypeScript, accessibility and tests."></textarea></label>
              <label class="field"><span>Extra requirements</span><textarea id="prompt-details" rows="3" placeholder="Optional constraints, tools, output format, expertise level, style…"></textarea></label>
              <button class="btn btn-primary" id="prompt-generate">Generate with AI</button>
              <div id="prompt-generation-status" class="prompt-studio-status"></div>
            </section>
            <section><div class="prompt-studio-section-head"><h3>Saved prompts</h3><span>${State.prompts.length} saved</span></div><div id="prompt-studio-list"></div></section>
          </div>`;
        body.querySelector("#prompt-generate").addEventListener("click", async () => {
          const task = body.querySelector("#prompt-task").value.trim();
          const details = body.querySelector("#prompt-details").value.trim();
          if (!task) return UI.toast?.("Describe the task first.", { error: true });
          const btn = body.querySelector("#prompt-generate");
          const status = body.querySelector("#prompt-generation-status");
          btn.disabled = true; status.textContent = "AI is designing the prompt…";
          try {
            const p = await generate(task, details);
            const slash = p.slash || `prompt-${Date.now()}`;
            State.prompts.push({ id: `pr_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, name: p.name || "AI Expert Prompt", slash, body: p.body });
            save();
            status.textContent = "Saved. The prompt is ready from the / command menu too.";
            body.querySelector("#prompt-task").value = "";
            body.querySelector("#prompt-details").value = "";
            drawList(body);
            UI.toast?.("AI prompt created");
          } catch (e) {
            status.textContent = e?.message || "Prompt generation failed.";
            UI.toast?.(status.textContent, { error: true });
          } finally { btn.disabled = false; }
        });
        drawList(body);
      }
    });
  }

  TG.PromptStudio = { open, generate };
})();
