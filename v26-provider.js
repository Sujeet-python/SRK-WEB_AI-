/* The Gradient 2.6 — provider/image bridge
   Pollinations uses the current unified API. The secret is entered by the user in Settings.
   A secret key should only be used in a private/local deployment; for public apps use Pollinations BYOP/OAuth. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { APP, ImageGen, State, ProviderError } = TG;
  const POLL_BASE = "https://gen.pollinations.ai";

  APP.name = "The Gradient";
  APP.providers.pollinations = Object.assign({}, APP.providers.pollinations, {
    label: "Pollinations AI",
    kind: "openai",
    needsKey: true,
    endpoint: `${POLL_BASE}/v1/chat/completions`,
    testEndpoint: `${POLL_BASE}/v1/models`,
    keyUrl: "https://enter.pollinations.ai",
    blurb: "Pollinations AI gateway. Add your Pollinations API key to use its live text and image models.",
    models: [
      { id: "openai/gpt-5.4-nano", label: "GPT-5.4 Nano" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
      { id: "google/gemini-3.7-flash", label: "Gemini 3.7 Flash" },
      { id: "mistralai/mistral-small-4", label: "Mistral Small 4" },
      { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
      { id: "tencent/hy3", label: "Tencent HY3" }
    ],
    imageModels: [
      { id: "tongyi-mai/z-image-turbo", label: "Z-Image Turbo" },
      { id: "black-forest-labs/flux.1-schnell", label: "FLUX.1 Schnell" },
      { id: "google/gemini-3.1-flash-image", label: "Nano Banana 2" },
      { id: "google/gemini-3-pro-image", label: "Nano Banana Pro" },
      { id: "openai/gpt-image-2", label: "GPT Image 2" },
      { id: "ideogram-ai/ideogram-v4-balanced", label: "Ideogram v4 Balanced" },
      { id: "bytedance/seedream-5.0-pro", label: "Seedream 5 Pro" },
      { id: "x-ai/grok-imagine-image", label: "Grok Imagine" },
      { id: "qwen/qwen-image", label: "Qwen Image" }
    ],
    imageEndpoint: `${POLL_BASE}/v1/images/generations`
  });

  const originalPollinations = ImageGen.pollinations?.bind(ImageGen);
  ImageGen.PROVIDERS = ["pollinations", "gemini"];
  ImageGen.defaultChoice = function () {
    const list = APP.providers.pollinations?.imageModels || [];
    return { provider: "pollinations", model: list[0]?.id || "flux" };
  };

  // Pollinations' modern catalog serves community models as "owner/model" ids
  // (e.g. "black-forest-labs/flux.1-schnell"). Those ids are only routable
  // through the unified OpenAI-compatible endpoint below. The legacy GET
  // /image/{prompt} endpoint does not understand the owner/model form and
  // silently misroutes it to a Hugging Face inference backend that doesn't
  // host the model, producing "Model not supported by provider hf-inference".
  // Using the documented POST /v1/images/generations endpoint fixes this for
  // every model in the current catalog, including the plain legacy ids.
  ImageGen.pollinations = async function (prompt, model, key, n, size) {
    if (!key) throw new ProviderError("Add your Pollinations AI API key in Settings → Provider → Pollinations AI.", { kind: "no_key" });

    const dims = String(size || "1024x1024").split("x").map(Number);
    const width = Math.max(256, Math.min(2048, Number(dims[0]) || 1024));
    const height = Math.max(256, Math.min(2048, Number(dims[1]) || 1024));
    const count = Math.max(1, Math.min(4, Number(n) || 1));
    const FALLBACK_MODEL = APP.providers.pollinations?.imageModels?.[0]?.id || "flux";

    async function requestImage(selectedModel) {
      const seed = Math.floor(Math.random() * 2147483647);
      const res = await fetch(`${POLL_BASE}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: selectedModel || FALLBACK_MODEL,
          prompt: String(prompt || ""),
          size: `${width}x${height}`,
          seed,
          n: 1,
          response_format: "b64_json"
        })
      });
      if (!res.ok) {
        let message = `Pollinations image request failed (${res.status})`;
        try {
          const text = await res.clone().text();
          if (text) {
            try {
              const j = JSON.parse(text);
              message = j?.error?.message || j?.error?.error || j?.error || message;
            } catch { message = text.slice(0, 300) || message; }
          }
        } catch {}
        const err = new ProviderError(String(message), {
          kind: res.status === 401 ? "auth" : res.status === 402 ? "billing" : res.status === 404 ? "not_found" : res.status === 400 || res.status === 422 ? "invalid_model" : "server"
        });
        err.status = res.status;
        throw err;
      }
      const j = await res.json();
      const item = (j?.data || [])[0];
      if (!item) throw new ProviderError("Pollinations returned an empty image.", { kind: "empty" });
      const dataUrl = item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url;
      if (!dataUrl) throw new ProviderError("Pollinations returned an empty image.", { kind: "empty" });
      return { dataUrl, revisedPrompt: item.revised_prompt || "", model: selectedModel || FALLBACK_MODEL };
    }

    const images = [];
    for (let i = 0; i < count; i++) {
      try {
        images.push(await requestImage(model || FALLBACK_MODEL));
      } catch (err) {
        // A selected community model can be temporarily unavailable, unsupported
        // by its backing provider, or missing entirely. Recover once with the
        // catalog's own first-listed (documented stable) model.
        const recoverable = err?.status === 404 || err?.kind === "not_found" || err?.kind === "invalid_model" || /not supported|not found|unavailable/i.test(err?.message || "");
        if (recoverable && (model || FALLBACK_MODEL) !== FALLBACK_MODEL) {
          images.push(await requestImage(FALLBACK_MODEL));
        } else {
          throw err;
        }
      }
    }
    if (!images.length) throw new ProviderError("Pollinations returned no image.", { kind: "empty" });
    return images;
  };

  async function loadCatalog() {
    try {
      const [textRes, imageRes] = await Promise.all([
        fetch(`${POLL_BASE}/text/models`, { headers: { Accept: "application/json" } }),
        fetch(`${POLL_BASE}/image/models`, { headers: { Accept: "application/json" } })
      ]);
      const text = textRes.ok ? await textRes.json() : [];
      const image = imageRes.ok ? await imageRes.json() : [];
      const normalize = (items) => (Array.isArray(items) ? items : (items?.data || items?.models || []))
        .map(x => ({ id: x.id || x.name || x.alias, label: x.title || x.label || x.name || x.id }))
        .filter(x => x.id);
      const textModels = normalize(text);
      const imageModels = normalize(image);
      if (textModels.length) APP.providers.pollinations.models = textModels.slice(0, 250);
      if (imageModels.length) APP.providers.pollinations.imageModels = imageModels.slice(0, 150);
      window.dispatchEvent(new CustomEvent("gradient-pollinations-ready", { detail: { text: APP.providers.pollinations.models, image: APP.providers.pollinations.imageModels } }));
      window.dispatchEvent(new CustomEvent("gradient-model-catalog"));
      return { text: APP.providers.pollinations.models, image: APP.providers.pollinations.imageModels };
    } catch (err) {
      window.dispatchEvent(new CustomEvent("gradient-pollinations-error", { detail: { error: err } }));
      return null;
    }
  }

  TG.Pollinations = { loadCatalog, base: POLL_BASE };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(loadCatalog, 1600), { once: true });
  else loadCatalog();
})();
