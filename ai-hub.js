/* The Gradient — AI Hub v3
   Unified task routing, live model discovery, Hugging Face free-tier support,
   Pollinations catalog support, and Canvas design generation.
*/
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { State, App, UI, ProviderError } = TG;

  const HF_CHAT = "https://router.huggingface.co/v1/chat/completions";
  const HF_IMAGE_BASE = "https://router.huggingface.co/hf-inference/models/";
  const POLL_BASE = "https://gen.pollinations.ai";
  const POLL_LEGACY = "https://image.pollinations.ai/prompt/";
  const CATALOG_TTL = 15 * 60 * 1000;

  const HUB = {
    catalog: { ts: 0, poll: null, hf: null },
    imageDefaults: {
      pollinations: "flux",
      huggingface: "black-forest-labs/FLUX.1-schnell",
      gemini: "gemini-3.1-flash-image"
    },
    designDefaults: {
      huggingface: "Qwen/Qwen3-30B-A3B-Instruct-2507",
      puter: "claude-sonnet-4-6",
      pollinations: "openai"
    },

    init() {
      this.installProviderConfigs();
      this.installSettingsExtras();
      this.patchImageGenerator();
      this.patchSystemPromptHints();
      setTimeout(() => this.refreshCatalog().catch(() => {}), 1800);
      window.addEventListener("online", () => this.refreshCatalog(true).catch(() => {}));
      window.addEventListener("gradient-model-catalog", () => { window.dispatchEvent(new CustomEvent("gradient-imagine-models-refreshed")); });
      return this;
    },

    installProviderConfigs() {
      APP.providers = APP.providers || {};
      if (!APP.providers.huggingface) {
        APP.providers.huggingface = {
          label: "Hugging Face",
          kind: "openai",
          needsKey: true,
          vision: true,
          endpoint: HF_CHAT,
          testEndpoint: "https://router.huggingface.co/v1/models",
          keyUrl: "https://huggingface.co/settings/tokens",
          blurb: "Unified open-model gateway. Free users receive monthly Inference Providers credits; extra usage may require billing.",
          models: [
            { id: "Qwen/Qwen3-30B-A3B-Instruct-2507:fastest", label: "Qwen3 30B — fast", reasoning: true },
            { id: "Qwen/Qwen2.5-7B-Instruct:fastest", label: "Qwen 2.5 7B — fast" },
            { id: "openai/gpt-oss-120b:fastest", label: "GPT-OSS 120B — fast", reasoning: true }
          ],
          imageModels: [
            { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 schnell · free-tier" },
            { id: "black-forest-labs/FLUX.1-dev", label: "FLUX.1 dev · free-tier" },
            { id: "Qwen/Qwen-Image", label: "Qwen Image · free-tier" }
          ]
        };
      }
      const p = APP.providers.pollinations;
      if (p) {
        p.needsKey = true;
        p.endpoint = POLL_BASE + "/v1/chat/completions";
        p.testEndpoint = POLL_BASE + "/v1/models";
        p.blurb = "Pollinations model catalog. Your Pollinations key unlocks the live text and image generation models.";
        p.keyUrl = "https://enter.pollinations.ai/";
      }
    },

    installSettingsExtras() {
      if (APP.providers.huggingface) {
        APP.providers.huggingface.image = true;
      }
    },

    async refreshCatalog(force = false) {
      if (!force && Date.now() - this.catalog.ts < CATALOG_TTL) return this.catalog;
      if (this.catalog.inflight) return this.catalog.inflight;
      this.catalog.inflight = (async () => {
        const next = { ts: Date.now(), poll: this.catalog.poll, hf: this.catalog.hf };
        const json = async (url) => { const r = await fetch(url, { headers: { Accept: "application/json" } }); if(!r.ok) throw new Error(`Catalog HTTP ${r.status}`); return r.json(); };
        try {
          const [all, text, image] = await Promise.allSettled([json(`${POLL_BASE}/v1/models?source=official`), json(`${POLL_BASE}/text/models`), json(`${POLL_BASE}/image/models`)]);
          next.poll = {
            all: all.status === "fulfilled" ? all.value : null,
            text: text.status === "fulfilled" ? text.value : null,
            image: image.status === "fulfilled" ? image.value : null
          };
          const normalize = (payload) => {
            const rows = Array.isArray(payload) ? payload : (payload?.data || payload?.models || payload?.items || []);
            return rows.map(m => ({
              id: String(m.id || m.model || m.name || "").trim(),
              label: String(m.name || m.display_name || m.label || m.id || m.model || "").trim(),
              raw: m
            })).filter(x => x.id);
          };
          const textModels = normalize(next.poll.text || next.poll.all);
          const imageModels = normalize(next.poll.image);
          if (textModels.length) APP.providers.pollinations.models = textModels.slice(0, 200).map(x => ({id:x.id,label:x.label||x.id}));
          if (imageModels.length) APP.providers.pollinations.imageModels = imageModels.slice(0, 100).map(x => ({id:x.id,label:x.label||x.id}));
          else if (APP.providers.pollinations.imageModels?.length) APP.providers.pollinations.imageModels = APP.providers.pollinations.imageModels;
        } catch {}
        try {
          const res = await fetch("https://huggingface.co/api/models?inference_provider=hf-inference&pipeline_tag=text-to-image&limit=40&sort=trendingScore", { headers: { Accept: "application/json" } });
          if (res.ok) next.hf = await res.json();
        } catch {}
        this.catalog = next; this.catalog.inflight = null;
        window.dispatchEvent(new CustomEvent("gradient-model-catalog", { detail: this.catalog }));
        return this.catalog;
      })();
      return this.catalog.inflight;
    },

    pollinationsCatalog(force=false){ return this.refreshCatalog(force); },

    hfKey() { return State.apiKeys?.huggingface || ""; },
    pollKey() { return State.apiKeys?.pollinations || ""; },

    async hfText({ model, messages, temperature = 0.35, maxTokens = 2500, signal }) {
      const key = this.hfKey();
      if (!key) throw new ProviderError("Add a Hugging Face token in Settings to use the free-tier model.", { kind: "no_key" });
      const res = await fetch(HF_CHAT, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: model || this.designDefaults.huggingface, messages, temperature, max_tokens: maxTokens, stream: false })
      });
      if (!res.ok) throw await this.httpError(res, "Hugging Face request failed");
      const j = await res.json();
      return j?.choices?.[0]?.message?.content || "";
    },

    async puterText({ model, messages, signal }) {
      const provider = TG.Providers?.get?.("puter");
      if (!provider?.send) throw new Error("Puter provider is unavailable.");
      const system = messages.find(m => m.role === "system")?.content || "";
      const body = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));
      let full = "";
      const result = await provider.send({ messages: body, model: model || this.designDefaults.puter, systemPrompt: system, signal, stream: false, onDelta: t => { full = t; } });
      return result?.text || full || "";
    },

    async pollText({ model, messages, signal }) {
      const key = this.pollKey();
      if (!key) throw new ProviderError("Add a Pollinations key or connect another AI provider for Canvas design generation.", { kind: "no_key" });
      const res = await fetch(`${POLL_BASE}/v1/chat/completions`, {
        method: "POST", signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: model || this.designDefaults.pollinations, messages, stream: false })
      });
      if (!res.ok) throw await this.httpError(res, "Pollinations request failed");
      const j = await res.json();
      return j?.choices?.[0]?.message?.content || "";
    },

    async text({ task = "general", messages, signal, provider: routedProvider = null, model: routedModel = null }) {
      const tries = [];
      const hf = this.hfKey();
      if (routedProvider) {
        const cfg = APP.providers?.[routedProvider];
        const adapter = TG.Providers?.get?.(routedProvider);
        const key = State.apiKeys?.[routedProvider] || "";
        if (cfg && adapter?.send && (!cfg.needsKey || key)) {
          tries.push(async () => { let partial=""; const result=await adapter.send({messages, model:routedModel || cfg.models?.[0]?.id, apiKey:key, signal, stream:false, onDelta:t=>{partial=t;}}); return result?.text || partial || ""; });
        }
      }
      if (task === "canvas" || task === "design") {
        if (hf) tries.push(() => this.hfText({ model: this.designDefaults.huggingface, messages, signal }));
        tries.push(() => this.puterText({ model: this.designDefaults.puter, messages, signal }));
        if (this.pollKey()) tries.push(() => this.pollText({ model: this.designDefaults.pollinations, messages, signal }));
      } else {
        if (hf) tries.push(() => this.hfText({ model: "Qwen/Qwen3-30B-A3B-Instruct-2507:fastest", messages, signal }));
        if (State.settings?.provider === "puter") tries.push(() => this.puterText({ model: State.settings.model, messages, signal }));
      }
      if (!tries.length) {
        // Use the currently configured provider through the existing engine without mutating the chat.
        const provider = State.settings?.provider;
        const key = State.apiKeys?.[provider] || "";
        if (provider && APP.providers?.[provider] && (!APP.providers[provider].needsKey || key)) {
          const adapter = TG.Providers?.get?.(provider);
          if (adapter?.send) {
            let text = "";
            const systemPrompt = messages.find(m => m.role === "system")?.content || "";
            const userMessages = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));
            const result = await adapter.send({ messages: userMessages, model: State.settings.model, apiKey: key, systemPrompt, signal, stream: false, onDelta: t => { text = t; } });
            return result?.text || text || "";
          }
        }
        throw new ProviderError("No design-capable AI is connected. Add Hugging Face or use a configured AI provider in Settings.", { kind: "no_provider" });
      }
      let last;
      for (const run of tries) {
        try { const out = await run(); if (out) return out; } catch (e) { last = e; }
      }
      throw last || new Error("No AI model returned a response.");
    },

    async designSpec(request, signal, routing = null) {
      const schema = `Return ONLY strict JSON, no markdown. Schema: {"background":"#hex","elements":[{"type":"rect|ellipse|text|line|arrow","x":0,"y":0,"w":100,"h":100,"x2":100,"y2":100,"text":"","fill":"#hex","stroke":"#hex","strokeWidth":2,"radius":12,"fontSize":32,"weight":700,"opacity":1}]}.`;
      const brief = [
        schema,
        "",
        "You are a senior product designer producing a portfolio-grade composition, not a wireframe.",
        "Design rules:",
        "1. Work on a 1200x800 canvas. Keep every element fully inside it with a consistent 64px outer margin.",
        "2. Use a real type scale: a single dominant headline (56-72px, weight 700-800), a supporting subhead (24-30px, weight 400-500), and small labels (14-18px, weight 500-600). Never repeat one font size for everything.",
        "3. Build a deliberate colour system: one dark or light base surface, one accent, and one or two neutrals. Use hex values only. Text must contrast strongly against whatever sits behind it.",
        "4. Create real hierarchy and alignment: decide on a grid (e.g. 12 columns or two 50% panels), align edges to it, and keep consistent spacing between sibling elements.",
        "5. Prefer composition over decoration: large colour fields, cards and panels built from rounded rects (radius 12-28), thin accent rules and small ellipses. Avoid hundreds of tiny shapes.",
        "6. If the brief is a UI, compose an actual interface: a header bar, a sidebar or hero, content cards with a title and body text, and a primary button (a rounded rect with a centred short label).",
        "7. If the brief is a poster or brand piece, lead with the headline, add a supporting line, and use a strong geometric accent.",
        "8. Text elements: give each one enough w and h for its content at its fontSize, and set text exactly — no placeholders like 'Lorem ipsum' unless the brief asks for it.",
        "9. Use 10-22 elements. Every element must have a clear purpose."
      ].join("\n");
      const messages = [
        { role: "system", content: brief },
        { role: "user", content: `Design brief: ${request}\n\nProduce the strongest possible composition for this brief. Return the JSON only.` }
      ];
      const raw = routing ? await this.text({ task: "canvas", messages, signal, provider: routing.provider, model: routing.model }) : await this.text({ task: "canvas", messages, signal });
      const match = String(raw).match(/\{[\s\S]*\}/);
      if (!match) throw new Error("The design model did not return a usable JSON layout.");
      let spec;
      try { spec = JSON.parse(match[0]); } catch { throw new Error("The design model returned malformed JSON. Try again or switch model."); }
      return this.normalizeDesignSpec(spec);
    },

    normalizeDesignSpec(spec) {
      const safeHex = v => /^#[0-9a-f]{6}$/i.test(String(v || "")) ? String(v) : null;
      const out = { background: safeHex(spec?.background) || "#0f172a", elements: [] };
      const types = new Set(["rect", "ellipse", "text", "line", "arrow"]);
      (Array.isArray(spec?.elements) ? spec.elements : []).slice(0, 40).forEach(e => {
        if (!types.has(e?.type)) return;
        const n = k => Number.isFinite(Number(e[k])) ? Number(e[k]) : undefined;
        const bare = e.type === "text";
        const item = {
          type: e.type,
          x: Math.max(0, Math.min(1199, n("x") ?? 0)),
          y: Math.max(0, Math.min(799, n("y") ?? 0)),
          w: Math.max(8, Math.min(1192, n("w") ?? (bare ? 520 : 120))),
          h: Math.max(8, Math.min(792, n("h") ?? (bare ? 96 : 60))),
          fill: safeHex(e.fill) || (bare ? "#ffffff" : "#ffffff"),
          stroke: safeHex(e.stroke) || "transparent",
          strokeWidth: Math.max(0, Math.min(32, n("strokeWidth") ?? (bare ? 0 : 2))),
          radius: Math.max(0, Math.min(200, n("radius") ?? (bare ? 0 : 16))),
          fontSize: Math.max(10, Math.min(160, n("fontSize") ?? 28)),
          weight: Math.max(300, Math.min(900, n("weight") ?? (bare ? 600 : 500))),
          opacity: Math.max(0, Math.min(1, n("opacity") ?? 1)),
          rotation: Math.max(-180, Math.min(180, n("rotation") ?? 0)),
          align: ["left", "center", "right"].includes(e.align) ? e.align : "left",
          text: String(e.text || "")
        };
        if (e.type === "line" || e.type === "arrow") {
          item.x2 = Math.max(0, Math.min(1200, n("x2") ?? item.x + item.w));
          item.y2 = Math.max(0, Math.min(800, n("y2") ?? item.y + item.h));
          item.w = Math.abs(item.x2 - item.x);
          item.h = Math.abs(item.y2 - item.y);
        }
        out.elements.push(item);
      });
      return out;
    },

    async generateImage({ model, prompt, size = "1024x1024", seed }) {
      if (model === "hf:flux-schnell" || model === "black-forest-labs/FLUX.1-schnell" || model === "black-forest-labs/FLUX.1-dev" || model === "Qwen/Qwen-Image") {
        return this.hfImage({ model: model.replace(/^hf:/, ""), prompt, size, seed });
      }
      return null;
    },

    async hfImage({ model, prompt, size, seed }) {
      const key = this.hfKey();
      if (!key) throw new ProviderError("Add a Hugging Face token in Settings to use the free-tier image model.", { kind: "no_key" });
      const [width, height] = String(size || "1024x1024").split("x").map(Number);
      const parameters = { width: Number(width) || 1024, height: Number(height) || 1024 };
      if (Number.isFinite(seed)) parameters.seed = seed;
      const res = await fetch(HF_IMAGE_BASE + encodeURIComponent(model), {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "image/*" },
        body: JSON.stringify({ inputs: prompt, parameters })
      });
      if (!res.ok) throw await this.httpError(res, "Hugging Face image generation failed");
      const blob = await res.blob();
      if (!blob.size) throw new Error("The image provider returned an empty image.");
      const dataUrl = await this.blobToDataUrl(blob);
      return [{ dataUrl, revisedPrompt: "" }];
    },

    async httpError(res, prefix) {
      let message = `${prefix} (${res.status})`;
      try { const j = await res.clone().json(); message = j?.error?.message || j?.error || message; } catch {}
      return new ProviderError(String(message), { kind: res.status === 401 ? "auth" : res.status === 402 ? "billing" : "server" });
    },

    blobToDataUrl(blob) {
      return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(blob); });
    },

    patchImageGenerator() {
      const imageGen = TG.ImageGen;
      if (!imageGen || imageGen.__hubPatched) return;
      const base = imageGen.generate.bind(imageGen);
      const defaultChoice = imageGen.defaultChoice?.bind(imageGen);
      imageGen.generate = async (args) => {
        if (args?.provider === "huggingface") return this.generateImage({ model: args.model, prompt: args.prompt, size: args.size });
        return base(args);
      };
      imageGen.defaultChoice = () => {
        if (this.hfKey()) return { provider: "huggingface", model: "black-forest-labs/FLUX.1-schnell" };
        return { provider: "pollinations", model: (APP.providers.pollinations?.imageModels?.[0]?.id || "flux") };
      };
      if (!imageGen.PROVIDERS.includes("huggingface")) imageGen.PROVIDERS.push("huggingface");
      APP.providers.huggingface.imageModels = APP.providers.huggingface.imageModels || [];
      imageGen.__hubPatched = true;
    },

    patchSystemPromptHints() {
      if (!App?.systemPrompt || App.__aiHubPromptPatched) return;
      const base = App.systemPrompt.bind(App);
      App.systemPrompt = function (sources) {
        const root = base(sources);
        const mode = State.uiMode || "software";
        const taskHints = {
          software: "WORKSPACE: Software Development. Favor correct, maintainable, testable implementation and explicit file-level changes.",
          imagine: "WORKSPACE: Imagine. Do not answer with an image prompt when an image-generation action is available; the UI will invoke the image model directly.",
          canvas: "WORKSPACE: Canvas. Prefer structured visual specifications, hierarchy, alignment, spacing, contrast and editable primitives.",
          documents: "WORKSPACE: Documents. Produce structured content that can be exported cleanly to DOCX, PDF, PPTX or XLSX."
        };
        return `${root}\n\n${taskHints[mode] || ""}`;
      };
      App.__aiHubPromptPatched = true;
    }
  };

  window.TheGradientAIHub = HUB;
  TG.AIHub = HUB;
  HUB.init();
})();
