/* The Gradient 3.6 — Pipelines that people actually use.
   The engine (Pipelines/PipelineUI) is strong but hidden behind a node
   editor, which is the wrong first contact. This adds:
     • a plain-language gallery you pick from
     • one-click "run this on what I just asked"
     • a live progress strip with per-step results
     • a readable final answer instead of a debug dump. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { UI, State } = TG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- the gallery: purpose-first, no node jargon ---------- */
  const RECIPES = [
    {
      id: "best-answer",
      icon: "sparkles",
      name: "Best possible answer",
      line: "Drafts, attacks its own draft, then rewrites it.",
      detail: "Three passes: a first draft, a harsh critique that lists concrete problems, then a final rewrite that fixes them. Noticeably better on anything long or important.",
      time: "~3× longer",
      nodes: [
        { name: "Draft", prompt: "{{input}}" },
        { name: "Critique", prompt: "You are a demanding editor. Read this draft and list the specific problems: weak arguments, missing evidence, unclear passages, factual gaps, and anything that is simply boring.\n\nRequest the draft answers:\n{{input}}\n\nDraft:\n{{n1.output}}\n\nReply with a numbered list of concrete fixes. No praise." },
        { name: "Final", prompt: "Write the final answer to this request:\n\n{{input}}\n\nThe draft:\n{{n1.output}}\n\nAn editor's critique of that draft:\n{{n2.output}}\n\nFix every problem the critique raised. Output only the finished answer — no mention of drafts or critiques." }
      ]
    },
    {
      id: "facts-checked",
      icon: "shield",
      name: "Answer with facts checked",
      line: "Writes it, then tries to prove itself wrong.",
      detail: "Produces an answer, then a second pass hunts for factual errors and exaggerations, and a third pass corrects what was found.",
      time: "~3× longer",
      nodes: [
        { name: "Answer", prompt: "{{input}}" },
        { name: "Fact check", prompt: "Fact-check the following text. For each claim mark it VERIFIED, UNCERTAIN or WRONG, and say what is wrong. Be strict about numbers, dates, names and quotes.\n\n{{n1.output}}" },
        { name: "Corrected", prompt: "Original request:\n{{input}}\n\nA draft answer:\n{{n1.output}}\n\nA fact-check of that draft:\n{{n2.output}}\n\nProduce the corrected final answer. Remove anything unverifiable, fix what was wrong, and keep it natural to read." }
      ]
    },
    {
      id: "explain-levels",
      icon: "book",
      name: "Explain it three ways",
      line: "A child, an interested adult, an expert.",
      detail: "One answer at three depths side by side, so you can pick the version that fits the person you are talking to.",
      time: "~3× longer",
      nodes: [
        { name: "Expert", prompt: "Explain this precisely, assuming the reader is an expert in the field. Use correct terminology: {{input}}" },
        { name: "Adult", prompt: "Explain this to a smart adult with no background in the field. Plain words, concrete example: {{input}}" },
        { name: "Child", prompt: "Explain this to a curious 10-year-old using everyday analogies. No jargon at all: {{input}}" }
      ]
    },
    {
      id: "debate",
      icon: "scale",
      name: "Argue both sides",
      line: "Best case for, best case against, then a verdict.",
      detail: "Gives you the strongest honest version of each side and then a judgement that says what the answer really depends on.",
      time: "~3× longer",
      nodes: [
        { name: "Steelman for", prompt: "Make the strongest, most convincing honest case IN FAVOUR of this. No strawmen, real evidence:\n\n{{input}}" },
        { name: "Steelman against", prompt: "Make the strongest, most convincing honest case AGAINST this. No strawmen, real evidence:\n\n{{input}}" },
        { name: "Verdict", prompt: "Question:\n{{input}}\n\nStrongest case for:\n{{n1.output}}\n\nStrongest case against:\n{{n2.output}}\n\nGive a clear verdict: which side is better supported, what it depends on, and what would change your mind." }
      ]
    },
    {
      id: "polished",
      icon: "wand",
      name: "Polish my writing",
      line: "Tightens what you already wrote.",
      detail: "Paste your text. It gets trimmed, sharpened, and proofread — with a note on what was changed and why.",
      time: "~2× longer",
      nodes: [
        { name: "Edit", prompt: "Edit the following text: cut filler, fix grammar, sharpen the phrasing, keep the author's voice and every fact. Return only the edited text.\n\n{{input}}" },
        { name: "Notes", prompt: "The original text:\n{{input}}\n\nThe edited version:\n{{n1.output}}\n\nBriefly explain the most important changes you made, as a short bulleted list." },
        { name: "Final", prompt: "Here is the text to publish:\n\n{{n1.output}}\n\nApply any remaining fixes from these edit notes:\n{{n2.output}}\n\nOutput only the final polished text." }
      ]
    },
    {
      id: "translate-localize",
      icon: "globe",
      name: "Translate and localise",
      line: "Translates, then makes it read native.",
      detail: "A literal translation first, then a pass that fixes idiom, tone and formality so it does not read like a translation.",
      time: "~2× longer",
      nodes: [
        { name: "Translate", prompt: "Translate the following into the target language, preserving meaning exactly. State the target language in the first line.\n\n{{input}}" },
        { name: "Localise", prompt: "The source text:\n{{input}}\n\nA literal translation:\n{{n1.output}}\n\nRewrite the translation so it reads as if written natively by a fluent speaker: natural idiom, right register, no translation feel. Keep the meaning identical." }
      ]
    },
    {
      id: "compare-models",
      icon: "grid",
      name: "Ask several models",
      line: "One question, several models, side by side.",
      detail: "Runs your prompt on multiple models at once so you can compare answers and keep the best one.",
      time: "~same",
      compare: true
    }
  ];

  function nodeFromTemplate(t, i, prevId) {
    return {
      id: "n" + (i + 1),
      name: t.name,
      provider: State.settings.provider,
      model: State.settings.model,
      deps: i === 0 ? [] : [prevId || "n" + i],
      prompt: t.prompt || "{{input}}"
    };
  }

  /* Turn a recipe into a saved pipeline definition (reusable). */
  function materialise(recipe) {
    const existing = (TG.Pipelines.list || []).find((p) => p.recipeId === recipe.id);
    if (existing) return existing;
    const nodes = (recipe.nodes || []).map((t, i) => nodeFromTemplate(t, i, i > 0 ? "n" + i : null));
    const pipeline = {
      id: TG.uid("pipe"),
      recipeId: recipe.id,
      name: recipe.name,
      mode: "chain",
      starter: true,
      nodes
    };
    TG.Pipelines.list.push(pipeline);
    TG.Pipelines.persist();
    return pipeline;
  }

  /* ---------- run, with a friendly progress card ---------- */
  async function runRecipe(recipe, input) {
    if (!input || !input.trim()) {
      UI.toast("Type what you want first, then pick a pipeline", { error: true });
      return;
    }
    if (recipe.compare) return TG.PipelineUI.openCompare(input);
    const pipeline = materialise(recipe);
    /* Run through the engine, but give the transcript a friendlier face. */
    const opened = await presentProgress(recipe, input, pipeline);
    return opened;
  }

  /* A compact live card in the chat that shows the recipe, each step's state,
     and finally the answer — not a wall of node output. */
  async function presentProgress(recipe, input, pipeline) {
    const conv = TG.Conv.active ? TG.Conv.active() : null;
    const msg = TG.UI.appendMessage({
      id: TG.uid("msg"),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      providerLabel: `Pipeline · ${recipe.name}`,
      model: "pipeline",
      sources: [],
      images: []
    });
    const el = msg;
    el.innerHTML = "";
    const card = document.createElement("div");
    card.className = "pw-card";
    card.innerHTML =
      `<div class="pw-head">
         <span class="pw-ico"><span class="ico" data-icon="flow"></span></span>
         <b>${TG.Sec.esc(recipe.name)}</b>
         <span class="pw-line">${TG.Sec.esc(recipe.line)}</span>
       </div>
       <div class="pw-steps"></div>
       <div class="pw-out"></div>`;
    el.appendChild(card);
    TG.hydrateIcons?.(card);
    UI.scrollToBottom(true);

    const stepsHost = card.querySelector(".pw-steps");
    const outHost = card.querySelector(".pw-out");
    const states = {};
    const paint = () => {
      stepsHost.innerHTML = "";
      pipeline.nodes.forEach((n, i) => {
        const st = states[n.id] || {};
        const row = document.createElement("div");
        row.className = "pw-step " + (st.status || "pending");
        row.innerHTML =
          `<span class="pw-dot"></span>
           <span class="pw-name">${TG.Sec.esc(n.name)}</span>
           <span class="pw-status">${stepLabel(st.status)}</span>
           <span class="pw-meta">${st.ms ? (st.ms / 1000).toFixed(1) + "s" : ""}</span>`;
        stepsHost.appendChild(row);
      });
      const running = pipeline.nodes.find((n) => states[n.id]?.status === "running");
      const done = Object.values(states).filter((s) => s.status && s.status !== "pending").length;
      const bar = card.querySelector(".pw-bar");
      const pct = Math.round((done / pipeline.nodes.length) * 100);
      if (bar) bar.style.width = pct + "%";
      if (running) outHost.textContent = states[running.id].output?.slice(-600) || "";
    };
    const bar = document.createElement("div");
    bar.className = "pw-bar-track";
    bar.innerHTML = `<div class="pw-bar"></div>`;
    card.insertBefore(bar, stepsHost);

    const ctx = { input, system: TG.App.systemPrompt([]), outputs: {}, previous: null };
    try {
      for (const node of pipeline.nodes) {
        const st = await TG.Pipelines.runNode(
          node,
          ctx,
          (s) => { states[s.id] = s; paint(); },
          State.abort?.signal
        );
        states[node.id] = st;
        ctx.outputs[node.id] = st;
        ctx.outputs[node.name.toLowerCase().replace(/\s+/g, "_")] = st;
        ctx.previous = st;
        paint();
        if (st.status === "failed" || st.status === "stopped") throw new Error(st.error || "Step failed");
      }
      const last = pipeline.nodes[pipeline.nodes.length - 1];
      const final = states[last.id]?.output || "";
      const wrap = document.createElement("div");
      wrap.className = "pw-final";
      wrap.innerHTML =
        `<div class="pw-final-head">
           <span class="pw-check"><span class="ico" data-icon="check"></span></span>Finished
           <span class="pw-spacer"></span>
           <button class="btn btn-sm pw-open-canvas">Open in Canvas</button>
           <button class="btn btn-sm pw-copy">Copy</button>
         </div>
         <div class="pw-final-body"></div>`;
      wrap.querySelector(".pw-final-body").innerHTML = TG.MD.render(final);
      wrap.querySelector(".pw-copy").addEventListener("click", () => {
        TG.UI.copy(final);
        UI.toast("Copied");
      });
      wrap.querySelector(".pw-open-canvas").addEventListener("click", () => {
        TG.CanvasMode?.openWithText?.(final);
      });
      outHost.replaceChildren(wrap);
      card.classList.add("done");
      /* persist the full run for the transcript */
      if (conv) {
        conv.messages.push({
          id: TG.uid("msg"), role: "assistant", content: final, timestamp: Date.now(),
          model: "pipeline", providerLabel: `${recipe.name} · pipeline`,
          pipeline: { name: recipe.name, mode: "chain", nodes: pipeline.nodes.map((n) => states[n.id]) },
          hidden: true
        });
        TG.Conv.save(conv);
      }
    } catch (err) {
      outHost.innerHTML = `<div class="pw-error">${TG.Sec.esc(err.message)}</div>`;
    }
    UI.scrollToBottom();
  }

  function stepLabel(status) {
    return { pending: "Waiting", running: "Working…", done: "Done", failed: "Failed", stopped: "Stopped", fallback: "Answered offline" }[status] || "Waiting";
  }

  /* ---------- the picker ---------- */
  function openGallery(prefill) {
    const seeded = prefill != null ? prefill : (UI.els?.composerInput?.value || "");
    const overlay = document.createElement("div");
    overlay.className = "pw-overlay";
    overlay.innerHTML =
      `<div class="pw-sheet" role="dialog" aria-label="Pipelines">
         <div class="pw-sheet-head">
           <div>
             <h3>Pipelines</h3>
             <p>Pick a workflow. It runs your request through it, step by step.</p>
           </div>
           <button class="icon-btn pw-x" title="Close"><span class="ico" data-icon="x"></span></button>
         </div>
         <label class="pw-input-wrap"><span>Your request</span>
           <textarea class="pw-input" rows="2" placeholder="What should the pipeline work on?"></textarea>
         </label>
         <div class="pw-grid"></div>
         <div class="pw-sheet-foot">
           <span class="pw-hint">Runs use your selected models and count toward usage.</span>
           <button class="btn btn-sm pw-edit">Edit nodes…</button>
         </div>
       </div>`;

    const grid = overlay.querySelector(".pw-grid");
    RECIPES.forEach((r) => {
      const card = document.createElement("button");
      card.className = "pw-card-pick";
      card.type = "button";
      card.innerHTML =
        `<span class="pw-pick-ico"><span class="ico" data-icon="${TG.Icon[r.icon] ? r.icon : "sparkle"}"></span></span>
         <span class="pw-pick-name">${TG.Sec.esc(r.name)}</span>
         <span class="pw-pick-line">${TG.Sec.esc(r.line)}</span>
         <span class="pw-pick-detail">${TG.Sec.esc(r.detail)}</span>
         <span class="pw-pick-time">${TG.Sec.esc(r.time)}</span>
         <span class="pw-pick-run">Run <span class="ico" data-icon="play"></span></span>`;
      card.addEventListener("click", () => {
        const text = overlay.querySelector(".pw-input").value.trim();
        close();
        runRecipe(r, text);
      });
      card.addEventListener("mouseenter", () => {
        const tip = overlay.querySelector(".pw-tip");
        if (tip) tip.textContent = r.detail;
      });
      grid.appendChild(card);
    });

    const input = overlay.querySelector(".pw-input");
    input.value = seeded;
    const close = () => {
      overlay.classList.remove("open");
      document.body.classList.remove("pw-open");
      setTimeout(() => overlay.remove(), 180);
    };
    overlay.querySelector(".pw-x").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    });
    overlay.querySelector(".pw-edit").addEventListener("click", () => { close(); TG.PipelineUI.open(); });

    document.body.appendChild(overlay);
    TG.hydrateIcons?.(overlay);
    document.body.classList.add("pw-open");
    requestAnimationFrame(() => {
      overlay.classList.add("open");
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    return overlay;
  }

  /* ---------- wire it into the app ---------- */
  function hook() {
    if (!TG.UI?.els) { setTimeout(hook, 300); return; }
    /* Any existing "pipelines" control opens the friendly gallery instead. */
    ["#pipeline-btn", "#pipelines-entry-btn", "#pipelines-menu-btn"].forEach((sel) => {
      const btn = $(sel);
      if (!btn || btn.dataset.pwHooked) return;
      btn.dataset.pwHooked = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openGallery();
      }, true);
    });
    /* /pipeline in the slash menu */
    const origRun = TG.Pipelines?.run;
    if (origRun && !TG.Pipelines.__pwPatched) {
      TG.Pipelines.__pwPatched = true;
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(() => setTimeout(hook, 700));

  TG.Workflows = { RECIPES, openGallery, runRecipe, materialise, presentProgress };
})();
