/* The Gradient 3.6 — Software Development agent
   Claude-style behaviour: the model works in the background. It writes code,
   runs it in a sandbox, reads the errors, fixes them and iterates — and the
   transcript shows a compact activity timeline instead of raw tool chatter.
   Only the finished artifact and the final answer surface to the user. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { State, UI, Conv, App, Executors, Artifacts, Canvas, uid, ProviderError } = TG;

  const MAX_STEPS = Number(State.settings?.agentMaxSteps) || 8;
  const RUN_TIMEOUT = 6000;

  /* ---------- timeline UI ---------- */
  /* A single collapsible strip of steps, rendered above the answer. */
  function ensureTimeline(msgEl, assistant) {
    const host = (assistant && assistant.id
      ? UI.els.chatInner?.querySelector(`.msg[data-id="${assistant.id}"]`)
      : null) || msgEl;
    let row = host.querySelector(".cw-runline");
    if (row) return row;
    row = document.createElement("div");
    row.className = "cw-runline";
    row.innerHTML =
      `<button type="button" class="cw-runline-head">` +
      `<span class="cw-runline-dot"></span>` +
      `<span class="cw-runline-title">Working…</span>` +
      `<span class="cw-runline-meta"></span>` +
      `<span class="ico cw-runline-caret" data-icon="chevron"></span>` +
      `</button>` +
      `<ol class="cw-runline-steps"></ol>`;
    const body = host.querySelector(".msg-body");
    const content = host.querySelector(".msg-content");
    if (body && content) body.insertBefore(row, content);
    else if (body) body.appendChild(row);

    const head = row.querySelector(".cw-runline-head");
    head.addEventListener("click", () => row.classList.toggle("open"));
    TG.hydrateIcons?.(row);
    return row;
  }

  function pushStep(assistant, msgEl, label, detail) {
    /* The transcript may have re-rendered since we captured the node, so
       always resolve the live element for this message before writing. */
    const live = assistant.id
      ? (UI.els.chatInner?.querySelector(`.msg[data-id="${assistant.id}"]`) || msgEl)
      : msgEl;
    assistant.agentSteps = assistant.agentSteps || [];
    const step = { label, detail: detail || "", state: "active", at: Date.now() };
    assistant.agentSteps.push(step);
    const row = ensureTimeline(live, assistant);
    const list = row.querySelector(".cw-runline-steps");
    const li = document.createElement("li");
    li.className = "cw-step active";
    const n = assistant.agentSteps.length;
    li.innerHTML =
      `<span class="cw-step-n">${n}</span>` +
      `<span class="cw-step-body"><b></b><span class="cw-step-detail"></span></span>` +
      `<span class="cw-step-state"></span>`;
    li.querySelector("b").textContent = label;
    li.querySelector(".cw-step-detail").textContent = detail || "";
    list.appendChild(li);
    updateHeader(row, assistant);
    UI.scrollToBottom?.(false);
    return { li, step, row, assistantSteps: assistant.agentSteps };
  }

  function finishStep(handle, ok, detail) {
    if (!handle || !handle.step) return;
    handle.step.state = ok ? "done" : "failed";
    if (detail) handle.step.detail = detail;
    /* Prefer the element we created; fall back to the live one by index. */
    const li = (handle.li && handle.li.isConnected) ? handle.li : null;
    const live = li || findStepNode(handle);
    if (!live) return;
    live.classList.remove("active");
    live.classList.add(ok ? "done" : "failed");
    const state = live.querySelector(".cw-step-state");
    if (state) state.textContent = ok ? "done" : "failed";
    if (detail) live.querySelector(".cw-step-detail").textContent = detail;
  }

  function findStepNode(handle) {
    const steps = handle.step && handle.assistantSteps;
    const idx = steps ? steps.indexOf(handle.step) : -1;
    if (idx < 0) return null;
    return UI.els.chatInner?.querySelector(`.cw-runline-steps .cw-step:nth-child(${idx + 1})`) || null;
  }

  function updateHeader(row, assistant) {
    const steps = assistant.agentSteps || [];
    const done = steps.filter((s) => s.state === "done").length;
    const failed = steps.filter((s) => s.state === "failed").length;
    const title = row.querySelector(".cw-runline-title");
    const meta = row.querySelector(".cw-runline-meta");
    title.textContent = assistant.agentRunning
      ? (steps.length ? "Working…" : "Starting")
      : failed
        ? "Finished with issues"
        : "Completed in the background";
    meta.textContent = `${done}/${steps.length} steps${failed ? ` · ${failed} failed` : ""}`;
    row.classList.toggle("running", !!assistant.agentRunning);
    row.classList.toggle("has-failure", !assistant.agentRunning && failed > 0);
  }

  /* ---------- code extraction ---------- */
  function fencedBlocks(text) {
    const out = [];
    const re = /```([a-zA-Z0-9_+#-]*)[ \t]*\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(String(text || "")))) out.push({ lang: (m[1] || "").trim(), code: m[2].replace(/\n$/, "") });
    return out;
  }

  /* The model may ask to run something explicitly, or just hand us code. */
  function requestedRuns(text) {
    const runs = [];
    const re = /<run(?:\s+lang="([^"]+)")?\s*>([\s\S]*?)<\/run>/gi;
    let m;
    while ((m = re.exec(String(text || "")))) runs.push({ lang: (m[1] || "").trim(), code: m[2].trim() });
    return runs;
  }

  function stripAgentMarkup(text) {
    return String(text || "")
      .replace(/<run(?:\s+lang="[^"]*")?\s*>[\s\S]*?<\/run>/gi, "")
      .replace(/<artifact[\s\S]*?<\/artifact>/gi, "")
      .trim();
  }

  /* Verifiable = we can actually execute it locally and read the outcome. */
  function runnableLang(lang, code) {
    if (State.settings.runCode === false) return null;
    const l = (lang || "").toLowerCase();
    if (!l) return /^\s*(?:import|from|def |print\()/.test(code) ? "python" : null;
    return Executors.language(l);
  }

  /* ---------- sandbox execution ---------- */
  /* Runs code in the existing executor (Pyodide / Worker) and captures the
     console output as a string, without touching the visible transcript. */
  async function runHidden(lang, code) {
    const marker = uid("sandbox");
    const holder = document.createElement("div");
    holder.className = "cw-sandbox-holder";
    holder.dataset.sandbox = marker;
    /* off-screen, but still a real node so the executor finds it */
    holder.style.cssText = "position:absolute;left:-99999px;top:0;width:10px;height:10px;overflow:hidden";
    document.body.appendChild(holder);

    const timedOut = Symbol("timeout");
    let timer = null;
    try {
      const exec = Executors.run(lang, code, holder);
      const result = await Promise.race([
        Promise.resolve(exec).then(() => "done").catch((e) => { throw e; }),
        new Promise((res) => { timer = setTimeout(() => res(timedOut), RUN_TIMEOUT); })
      ]);
      if (result === timedOut) throw new Error(`Timed out after ${RUN_TIMEOUT / 1000}s`);
      const text = collectOutput(holder);
      return { ok: true, output: text || "(no output)" };
    } catch (err) {
      const text = collectOutput(holder);
      return { ok: false, output: (text ? text + "\n" : "") + (err?.message || String(err)) };
    } finally {
      if (timer) clearTimeout(timer);
      holder.remove();
    }
  }

  function collectOutput(holder) {
    const parts = [];
    holder.querySelectorAll(".term-line, .terminal-line, .term-out, pre, .cw-out, .terminal-body div").forEach((n) => {
      const t = (n.textContent || "").trim();
      if (t) parts.push(t);
    });
    const seen = new Set();
    return parts.filter((p) => (seen.has(p) ? false : (seen.add(p), true))).join("\n").trim();
  }

  /* Also capture console output for JS, since the Worker path reports there. */
  function runJavaScript(code) {
    return new Promise((resolve) => {
      const lines = [];
      const src = `self.console={log:(...a)=>postMessage({log:a.map(x=>{try{return typeof x==="object"?JSON.stringify(x):String(x)}catch{return String(x)}}).join(" ")}),error:(...a)=>postMessage({log:a.map(String).join(" ")}),warn:(...a)=>postMessage({log:a.map(String).join(" ")})};
try { ${code}\n; postMessage({done:true}); } catch(e) { postMessage({error: (e && e.message) || String(e)}); }`;
      let worker;
      try { worker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" }))); }
      catch (e) { return resolve({ ok: false, output: e.message }); }
      const timer = setTimeout(() => { worker.terminate(); resolve({ ok: false, output: lines.join("\n") + "\nTimed out" }); }, RUN_TIMEOUT);
      worker.onmessage = (e) => {
        if (e.data.log) lines.push(e.data.log);
        if (e.data.error) { clearTimeout(timer); worker.terminate(); resolve({ ok: false, output: (lines.join("\n") + "\n" + e.data.error).trim() }); }
        if (e.data.done) { clearTimeout(timer); worker.terminate(); resolve({ ok: true, output: lines.join("\n") || "(no output)" }); }
      };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ ok: false, output: (lines.join("\n") + "\n" + (e.message || "Worker error")).trim() }); };
    });
  }

  async function sandbox(lang, code) {
    if (lang === "javascript" || lang === "js") return runJavaScript(code);
    return runHidden(lang, code);
  }

  /* ---------- iteration ---------- */
  function agentPrompt(base, step, lastOutput) {
    const contract = [
      "",
      "SOFTWARE DEVELOPMENT — BACKGROUND AGENT CONTRACT",
      "You are operating as an autonomous coding agent. Your work runs in a sandbox before the user sees it.",
      "Rules:",
      "1. Actually implement the request. Do not describe what you would do.",
      "2. Put every file you produce in a fenced code block tagged with its language and name the file in the first line (e.g. `// file: app.js`).",
      "3. If code must be executed or verified, wrap the exact snippet to run in <run lang=\"javascript\">…</run> or <run lang=\"python\">…</run> tags. It is executed for real and the output comes back to you.",
      "4. When the sandbox reports an error, fix the code and try again.",
      "5. Keep the user-facing answer short: what was built, where the artifact is, and how to run it. The transcript hides your tool steps."
    ].join("\n");

    if (step === 1) return base + contract;
    return base + contract +
      `\n\nSANDBOX FEEDBACK (attempt ${step - 1}):\n${lastOutput}\n\nContinue. If the last attempt failed, correct the code and emit a corrected <run> block. If it succeeded, stop running code and deliver the final files and a short summary.`;
  }

  function hasDeliverable(text) {
    const blocks = fencedBlocks(text);
    return blocks.length > 0;
  }

  /* ---------- the loop ---------- */
  async function runBackgroundAgent(assistant, msgEl, initialText) {
    const conv = Conv.active();
    const lastUser = conv ? [...conv.messages].reverse().find((m) => m.role === "user") : null;
    const request = lastUser ? lastUser.content : "";

    assistant.agentRunning = true;
    assistant.agentSteps = [];
    updateHeader(ensureTimeline(msgEl, assistant), assistant);

    const provider = State.settings.provider;
    const model = State.settings.model;
    const adapter = TG.Providers?.get?.(provider);
    if (!adapter?.send) throw new ProviderError(`The provider ${provider} is not available.`, { kind: "server" });

    /* Conversation handed to the model: the real chat, but with our contract. */
    const history = conv.messages
      .filter((m) => m.role === "user" || (m.role === "assistant" && m !== assistant && m.content))
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    let lastOutput = "";
    let finalText = String(initialText || "");

    for (let step = 1; step <= MAX_STEPS; step++) {
      const usingDraft = step === 1 && !!initialText;
      const thinking = pushStep(assistant, msgEl, usingDraft ? "Reviewing the implementation" : step === 1 ? "Planning the implementation" : `Attempt ${step}: revising`, "");

      let text = "";
      try {
        if (usingDraft) {
          text = String(initialText || "");
        } else {
          const res = await adapter.send({
            messages: history,
            model,
            apiKey: State.apiKeys?.[provider] || "",
            systemPrompt: agentPrompt(App.systemPrompt([]), step, lastOutput),
            stream: false,
            onDelta: (t) => {
              text = t;
              /* Show progress in the step line without leaking the whole draft. */
              const detail = String(t).replace(/\s+/g, " ").trim();
              const node = (thinking.li && thinking.li.isConnected) ? thinking.li : findStepNode(thinking);
              if (detail && node) node.querySelector(".cw-step-detail").textContent = detail.slice(-90);
            }
          });
          text = String((res && res.text) || text || "");
        }
      } catch (err) {
        finishStep(thinking, false, err?.message || "model call failed");
        reassemble(assistant, msgEl, finalText);
        throw err;
      }

      if (!text.trim()) {
        finishStep(thinking, false, "empty response");
        break;
      }

      /* 1. execute anything the model asked to run */
      const runs = requestedRuns(text);
      const blocks = fencedBlocks(text);

      /* The model shipped a file and did not ask to verify anything. That is a
         finished answer — stop instead of burning another paid round trip. */
      if (!runs.length) {
        finishStep(thinking, true, blocks.length
          ? `${blocks.length} file${blocks.length === 1 ? "" : "s"} written`
          : "answered");
        finalText = text;
        break;
      }
      finishStep(thinking, true, `asked to run ${runs.length} snippet${runs.length === 1 ? "" : "s"}`);

      /* run each requested snippet and feed the result back */
      for (const r of runs) {
        const lang = runnableLang(r.lang, r.code);
        const h = pushStep(assistant, msgEl, lang ? `Running ${lang}` : "Skipped a snippet", firstLine(r.code));
        if (!lang) {
          finishStep(h, false, "this language can't run in the browser sandbox");
          lastOutput = `$ skipped (unsupported language)\n${r.code.slice(0, 400)}`;
          continue;
        }
        const out = await sandbox(lang, r.code);
        finishStep(h, out.ok, summarize(out.output));
        lastOutput = `$ ${lang}\n${out.output.slice(0, 1800)}`;
        assistant.agentRan = (assistant.agentRan || 0) + 1;
      }

      /* keep the latest text as a fallback deliverable */
      finalText = text;
    }

    assistant.agentRunning = false;
    const row = liveMsgEl(assistant, msgEl)?.querySelector(".cw-runline");
    if (row) updateHeader(row, assistant);
    return stripAgentMarkup(finalText);
  }

  /* Resolve the message element that is currently in the transcript. */
  function liveMsgEl(assistant, fallback) {
    if (assistant && assistant.id) {
      const el = UI.els.chatInner?.querySelector(`.msg[data-id="${assistant.id}"]`);
      if (el) return el;
    }
    return fallback || null;
  }

  function firstLine(code) {
    const line = String(code).split("\n").map((l) => l.trim()).find(Boolean) || "";
    return line.length > 70 ? line.slice(0, 70) + "…" : line;
  }

  function summarize(output) {
    const text = String(output || "").replace(/\s+/g, " ").trim();
    if (!text) return "no output";
    const line = text.split(" ").slice(0, 16).join(" ");
    return line.length > 90 ? line.slice(0, 90) + "…" : line;
  }

  function reassemble(assistant, msgEl, text) {
    assistant.agentRunning = false;
    const row = liveMsgEl(assistant, msgEl)?.querySelector(".cw-runline");
    if (row) updateHeader(row, assistant);
    assistant.content = stripAgentMarkup(text || "");
    App.rerenderActive?.();
    renderTimeline(assistant);
  }

  /* A re-render wipes the DOM, so replay the recorded steps onto the fresh node. */
  function renderTimeline(assistant) {
    const steps = assistant.agentSteps || [];
    if (!steps.length || !assistant.id) return;
    const el = UI.els.chatInner?.querySelector(`.msg[data-id="${assistant.id}"]`);
    if (!el) return;
    const row = ensureTimeline(el, assistant);
    const list = row.querySelector(".cw-runline-steps");
    list.replaceChildren();
    steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = `cw-step ${s.state}`;
      li.innerHTML =
        `<span class="cw-step-n">${i + 1}</span>` +
        `<span class="cw-step-body"><b></b><span class="cw-step-detail"></span></span>` +
        `<span class="cw-step-state"></span>`;
      li.querySelector("b").textContent = s.label;
      li.querySelector(".cw-step-detail").textContent = s.detail || "";
      list.appendChild(li);
    });
    if (assistant.agentRunSummary) row.classList.add("open");
    updateHeader(row, assistant);
  }

  /* ---------- wrap runTurn for software mode ---------- */
  if (!App.__softwareAgentPatched) {
    const baseRunTurn = App.runTurn.bind(App);
    App.runTurn = async function (conv, choice, opts) {
      const result = await baseRunTurn(conv, choice, opts);
      if (State.uiMode !== "software") return result;
      const assistant = [...conv.messages].reverse().find((m) => m.role === "assistant");
      if (!assistant || assistant.error) return result;
      if (State.settings.softwareAgent === false) return result;

      const msgEl = UI.els.chatInner?.querySelector(`.msg[data-id="${assistant.id}"]`);
      if (!msgEl) return result;

      State.generating = true;
      UI.els.sendBtn?.classList.add("hidden");
      UI.els.stopBtn?.classList.remove("hidden");
      App.updateHeader?.();
      try {
        const finalText = await runBackgroundAgent(assistant, msgEl, assistant.content);
        if (finalText) {
          assistant.content = finalText;
          assistant.agent = { steps: assistant.agentSteps || [], ran: assistant.agentRan || 0 };
          /* Open the timeline when something actually ran, so the work is visible. */
          assistant.agentRunSummary = true;
          let artifactIds = [];
          try { artifactIds = Artifacts.extract(conv, assistant); } catch (e) { console.warn("software artifact extraction failed", e); }
          await Conv.save(conv);
          App.rerenderActive?.();
          renderTimeline(assistant);
          const artifactId = artifactIds[artifactIds.length - 1];
          if (artifactId) Canvas.open(artifactId, conv.id);
        }
      } catch (err) {
        console.warn("Background agent stopped", err);
        assistant.agentRunning = false;
        const row = liveMsgEl(assistant, msgEl)?.querySelector(".cw-runline");
        if (row) updateHeader(row, assistant);
        if (!assistant.content) {
          assistant.content = `> The background agent stopped: ${err?.message || "unknown error"}`;
          await Conv.save(conv);
          App.rerenderActive?.();
        }
      } finally {
        State.generating = false;
        UI.els.sendBtn?.classList.remove("hidden");
        UI.els.stopBtn?.classList.add("hidden");
        App.updateComposerState?.();
        App.updateHeader?.();
      }
      return result;
    };
    App.__softwareAgentPatched = true;
  }

  TG.SoftwareAgent = { run: runBackgroundAgent, sandbox, MAX_STEPS, renderTimeline };

  /* Replay stored timelines whenever a conversation is drawn from history. */
  if (!UI.buildMessage.__cwTimelinePatched) {
    const baseBuild = UI.buildMessage.bind(UI);
    UI.buildMessage = function (msg) {
      const el = baseBuild(msg);
      if (msg && msg.agentSteps && msg.agentSteps.length && msg.role === "assistant") {
        setTimeout(() => { try { renderTimeline(msg); } catch { /* not attached */ } }, 0);
      }
      return el;
    };
    UI.buildMessage.__cwTimelinePatched = true;
  }
})();
