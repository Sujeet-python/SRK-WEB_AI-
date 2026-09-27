/* The Gradient — Agent Orchestrator
   Multi-pass planning -> execution -> critique -> synthesis using connected models. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) throw new Error("The Gradient core must load before agent-orchestrator.js");

  const MODE_SYSTEMS = {
    general: "Work as a general-purpose senior assistant. Solve the task directly and make assumptions explicit.",
    learning: "Teach step by step. Use examples, check misconceptions, and keep the requested level appropriate.",
    coding: "Act as a senior software engineer. Produce production-minded code, identify edge cases, and keep interfaces explicit.",
    research: "Act as a research analyst. Separate facts, sources, assumptions, and synthesis. Prefer supplied live evidence when available.",
    documents: "Act as an expert technical writer and document designer. Produce clean, structured content that can be exported to office formats.",
    projects: "Act as a project architect. Turn the request into a concrete plan, dependencies, files, milestones, and validation steps."
  };

  const state = { running: false, abort: null };

  function modelChoices() {
    const out = [];
    Object.entries(TG.APP.providers || {}).forEach(([pid, cfg]) => {
      (cfg.models || []).slice(0, 12).forEach((m) => out.push({ provider: pid, model: m.id, label: `${cfg.label} · ${m.label}` }));
    });
    return out;
  }

  async function ask({ provider, model, prompt, system, signal }) {
    const cfg = TG.APP.providers[provider];
    const adapter = TG.Providers.get(provider);
    const key = TG.State.apiKeys[provider] || "";
    const deltas = [];
    const r = await adapter.send({
      messages: [{ role: "user", content: prompt }],
      model,
      systemPrompt: system,
      apiKey: key,
      endpoint: TG.State.endpoints[provider],
      signal,
      stream: false,
      params: { temperature: Math.min(0.7, Number(TG.State.settings.temperature || 0.5)), maxTokens: Math.min(12000, Number(TG.State.settings.maxTokens || 8000)), topP: 0.95 },
      onDelta: (x) => deltas.push(x)
    });
    return typeof r === "string" ? r : (r && r.text) || deltas[deltas.length - 1] || "";
  }

  function chooseDefault() {
    const provider = TG.State.settings.provider || "puter";
    const cfg = TG.APP.providers[provider] || {};
    const model = TG.State.settings.model || (cfg.models && cfg.models[0] && cfg.models[0].id) || "gpt-5-nano";
    return { provider, model };
  }

  async function run({ task, mode = "general", depth = "standard", provider, model, openStudio = false, onProgress } = {}) {
    if (!String(task || "").trim()) throw new Error("Give the Agent Lab a task to solve.");
    if (state.running) throw new Error("Agent Lab is already running.");
    state.running = true;
    state.abort = new AbortController();
    const choice = provider && model ? { provider, model } : chooseDefault();
    const report = { task, mode, choice, startedAt: Date.now(), plan: "", draft: "", critique: "", final: "", sources: [] };
    const progress = (stage, detail) => { if (onProgress) onProgress({ stage, detail }); };

    try {
      let liveResearch = "";
      if (mode === "research" || /\b(latest|today|current|recent|news|price|release|version)\b/i.test(task)) {
        progress("research", "Collecting live search evidence");
        try {
          const r = await TG.Research.search(task);
          report.sources = r.sources || [];
          liveResearch = report.sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet || ""}\n${s.url}`).join("\n\n");
        } catch (e) { liveResearch = "Live search unavailable: " + e.message; }
      }

      progress("plan", "Designing the solution");
      report.plan = await ask({
        ...choice,
        signal: state.abort.signal,
        system: `${MODE_SYSTEMS[mode] || MODE_SYSTEMS.general}\nYou are the planning phase of a multi-pass agent. Return a compact actionable plan. Do not expose hidden chain-of-thought; provide only concise decisions, assumptions, steps, deliverables and validation checks.`,
        prompt: `TASK:\n${task}\n\nCreate a plan with:\n1. goal\n2. assumptions\n3. ordered steps\n4. acceptance criteria\n5. likely risks\n${liveResearch ? `\nLIVE EVIDENCE:\n${liveResearch}` : ""}`
      });

      progress("execute", "Producing the main solution");
      report.draft = await ask({
        ...choice,
        signal: state.abort.signal,
        system: `${MODE_SYSTEMS[mode] || MODE_SYSTEMS.general}\nYou are the execution phase. Follow the supplied plan. Return the strongest useful deliverable, not meta-commentary.`,
        prompt: `TASK:\n${task}\n\nPLAN:\n${report.plan}\n${liveResearch ? `\nLIVE EVIDENCE:\n${liveResearch}` : ""}`
      });

      if (depth !== "fast") {
        progress("critique", "Checking correctness and completeness");
        report.critique = await ask({
          ...choice,
          signal: state.abort.signal,
          system: "Act as a strict reviewer. Find factual errors, missing requirements, contradictions, edge cases, weak reasoning, and implementation problems. Do not rewrite the whole answer; give an actionable correction list.",
          prompt: `TASK:\n${task}\n\nPLAN:\n${report.plan}\n\nDRAFT:\n${report.draft}`
        });
      }

      if (depth === "deep") {
        progress("synthesis", "Integrating review feedback into the final deliverable");
        report.final = await ask({
          ...choice,
          signal: state.abort.signal,
          system: `${MODE_SYSTEMS[mode] || MODE_SYSTEMS.general}\nYou are the final synthesizer. Produce only the final user-facing result. Resolve reviewer findings where valid, preserve correct work, and do not mention internal passes.`,
          prompt: `TASK:\n${task}\n\nPLAN:\n${report.plan}\n\nDRAFT:\n${report.draft}\n\nREVIEW:\n${report.critique}`
        });
      } else if (depth === "standard") {
        progress("synthesis", "Applying reviewer findings");
        report.final = await ask({
          ...choice,
          signal: state.abort.signal,
          system: MODE_SYSTEMS[mode] || MODE_SYSTEMS.general,
          prompt: `Return the corrected final answer for this task.\n\nTASK:\n${task}\n\nDRAFT:\n${report.draft}\n\nREVIEW:\n${report.critique}`
        });
      } else report.final = report.draft;

      report.finishedAt = Date.now();
      progress("done", "Agent run completed");

      if (openStudio && TG.DocumentStudio) {
        try {
          const md = report.final;
          TG.DocumentStudio.state.markdown = md;
          TG.DocumentStudio.state.title = task.slice(0, 70);
          await TG.DocumentStudio.open();
        } catch (_) {}
      }
      return report;
    } finally {
      state.running = false;
      state.abort = null;
    }
  }

  function renderResult(report) {
    const text = report.final || report.draft || "";
    if (TG.State && TG.Conv) {
      TG.Conv.ensureActive().then((conv) => {
        const msg = { id: TG.uid("msg"), role: "assistant", content: text, timestamp: Date.now(), streaming: false, providerLabel: `Agent Lab · ${report.choice.provider}`, model: report.choice.model, sources: report.sources || [], artifacts: [] };
        conv.messages.push(msg);
        TG.Conv.save(conv).then(() => TG.App.rerenderActive());
      });
    }
  }

  function open(opts = {}) {
    TG.ProOverlay.open({
      title: "Agent Lab",
      build: (body) => {
        const modal = body.closest(".modal");
        if (modal) modal.classList.add("agent-modal");
        const choices = modelChoices();
        const def = chooseDefault();
        const optsHtml = choices.map((c) => `<option value="${Fesc(c.provider + "::" + c.model)}" ${c.provider === def.provider && c.model === def.model ? "selected" : ""}>${Fesc(c.label)}</option>`).join("");
        body.innerHTML = `
          <div class="agent-shell">
            <div class="agent-header"><div><h3>Multi-pass AI engineering agent</h3><p>Plan → execute → critique → synthesize. Uses the models you already connected.</p></div></div>
            <label class="field"><span>Task</span><textarea id="agent-task" rows="7" placeholder="Describe the problem, project, research task or document you want built…"></textarea></label>
            <div class="agent-grid">
              <label class="field"><span>Mode</span><select id="agent-mode"><option value="general">General</option><option value="learning">Learning</option><option value="coding">Coding</option><option value="research">Research</option><option value="documents">Documents</option><option value="projects">Projects</option></select></label>
              <label class="field"><span>Depth</span><select id="agent-depth"><option value="fast">Fast · 1 pass</option><option value="standard" selected>Standard · review + synthesis</option><option value="deep">Deep · full 4-stage</option></select></label>
            </div>
            <label class="field"><span>Model</span><select id="agent-model">${optsHtml}</select></label>
            <div class="agent-progress" id="agent-progress"></div>
            <div class="agent-output hidden" id="agent-output"></div>
            <div class="btn-row end"><button class="btn" id="agent-cancel">Cancel</button><button class="btn btn-primary" id="agent-run">Run Agent</button></div>
          </div>`;
        if (opts.target) body.querySelector("#agent-task").value = opts.task || "";
        body.querySelector("#agent-cancel").onclick = () => { if (state.abort) state.abort.abort(); else TG.ProOverlay.close(); };
        body.querySelector("#agent-run").onclick = async () => {
          const runBtn = body.querySelector("#agent-run");
          const task = body.querySelector("#agent-task").value.trim();
          const mode = body.querySelector("#agent-mode").value;
          const depth = body.querySelector("#agent-depth").value;
          const [p, m] = body.querySelector("#agent-model").value.split("::");
          const progressHost = body.querySelector("#agent-progress");
          const output = body.querySelector("#agent-output");
          if (!task) return TG.UI.toast("Describe the task first.", { error: true });
          runBtn.disabled = true;
          progressHost.textContent = "Starting…";
          try {
            const report = await run({ task, mode, depth, provider: p, model: m, onProgress: (x) => { progressHost.textContent = `${x.stage}: ${x.detail}`; } });
            output.classList.remove("hidden");
            output.innerHTML = `<pre></pre>`;
            output.querySelector("pre").textContent = report.final || report.draft;
            const action = document.createElement("div");
            action.className = "btn-row";
            action.innerHTML = `<button class="btn btn-primary" id="agent-send-chat">Send to chat</button><button class="btn" id="agent-to-studio">Open in Studio</button>`;
            output.appendChild(action);
            action.querySelector("#agent-send-chat").onclick = () => { renderResult(report); TG.ProOverlay.close(); };
            action.querySelector("#agent-to-studio").onclick = async () => {
              TG.DocumentStudio.state.markdown = report.final || report.draft;
              TG.DocumentStudio.state.title = task.slice(0, 70);
              TG.ProOverlay.close();
              await TG.DocumentStudio.open();
            };
          } catch (e) {
            progressHost.textContent = e.name === "AbortError" ? "Cancelled" : (e.message || "Agent run failed.");
            TG.UI.toast(e.message || "Agent run failed.", { error: true });
          } finally { runBtn.disabled = false; }
        };
      }
    });
  }

  function Fesc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }

  const AgentOrchestrator = { run, open, state };
  window.TheGradient.AgentOrchestrator = AgentOrchestrator;
  window.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("agent-entry-btn");
    if (button) button.addEventListener("click", () => open());
    if (TG.Palette && TG.Palette.commands && !TG.Palette.__agentPatched) {
      const base = TG.Palette.commands.bind(TG.Palette);
      TG.Palette.commands = function () { return [{ group: "Agent", title: "Open Agent Lab", sub: "Plan, execute, critique and synthesize", icon: "brain", run: () => open() }].concat(base()); };
      TG.Palette.__agentPatched = true;
    }
  });
})();
