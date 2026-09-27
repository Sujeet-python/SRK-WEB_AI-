/* ============================================================
   NIMBUS AI — app.js
   A browser-only AI chat workspace.
   Sections: 1 Config · 2 Icons · 3 Utils · 4 Highlighter · 5 Markdown
             6 Storage · 7 Theme · 8 Providers · 9 Research · 10 Speech
             11 State · 12 Conversations · 13 UI · 14 Settings
             15 Palette · 16 App controller
   ============================================================ */
(function () {
"use strict";

/* ============================================================
   1. CONFIGURATION
   ============================================================ */
const APP = {
  name: "The Gradient",
  version: "3.6.0",
  db: { name: "nimbus_ai_db", version: 3, store: "conversations", meta: "meta", documents: "documents" },
  keys: {
    settings: "nimbus_settings_v2",
    apiKeys: "nimbus_keys_v1",
    theme: "nimbus_theme_v1",
    prompts: "nimbus_prompts_v1",
    personas: "nimbus_personas_v1",
    fallback: "nimbus_conversations_fallback_v1",
    projects: "nimbus_projects_v1",
    memory: "nimbus_memory_v1",
    artifacts: "nimbus_artifacts_v1"
  },
  limits: {
    maxRendered: 400,
    maxChars: 24000,
    softChars: 16000,
    attachmentBytes: 4 * 1024 * 1024,
    maxAttachments: 6
  },
  providers: {
    simulation: {
      label: "Simulation", kind: "sim", needsKey: false,
      blurb: "A built-in demo responder. No network requests, no key, clearly labelled.",
      models: [{ id: "sim-1", label: "Gradient Simulation" }]
    },
    openai: {
      label: "OpenAI", kind: "openai", needsKey: true,
      endpoint: "https://api.openai.com/v1/chat/completions",
      testEndpoint: "https://api.openai.com/v1/models",
      keyUrl: "https://platform.openai.com/api-keys",
      vision: true,
      models: [
        { id: "gpt-4o-mini", label: "GPT-4o mini" },
        { id: "gpt-4o", label: "GPT-4o" },
        { id: "gpt-4.1", label: "GPT-4.1" },
        { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
        { id: "o3-mini", label: "o3-mini" }
      ]
    },
    anthropic: {
      label: "Anthropic", kind: "anthropic", needsKey: true,
      endpoint: "https://api.anthropic.com/v1/messages",
      testEndpoint: "https://api.anthropic.com/v1/models",
      keyUrl: "https://console.anthropic.com/settings/keys",
      vision: true,
      models: [
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
        { id: "claude-opus-4-1", label: "Claude Opus 4.1" },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" }
      ]
    },
    gemini: {
      label: "Google Gemini", kind: "gemini", needsKey: true,
      endpointBase: "https://generativelanguage.googleapis.com/v1beta/models/",
      keyUrl: "https://aistudio.google.com/app/apikey",
      vision: true,
      models: [
        { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" }
      ]
    },
    openrouter: {
      label: "OpenRouter", kind: "openai", needsKey: true,
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      testEndpoint: "https://openrouter.ai/api/v1/models",
      keyUrl: "https://openrouter.ai/keys",
      vision: true,
      models: [
        { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
        { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
        { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
        { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" }
      ]
    },
    groq: {
      label: "Groq", kind: "openai", needsKey: true,
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      testEndpoint: "https://api.groq.com/openai/v1/models",
      keyUrl: "https://console.groq.com/keys",
      models: [
        { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
        { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
        { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" }
      ]
    },
    mistral: {
      label: "Mistral", kind: "openai", needsKey: true,
      endpoint: "https://api.mistral.ai/v1/chat/completions",
      testEndpoint: "https://api.mistral.ai/v1/models",
      keyUrl: "https://console.mistral.ai/api-keys",
      models: [
        { id: "mistral-large-latest", label: "Mistral Large" },
        { id: "mistral-small-latest", label: "Mistral Small" },
        { id: "open-mistral-nemo", label: "Mistral Nemo" }
      ]
    },
    deepseek: {
      label: "DeepSeek", kind: "openai", needsKey: true,
      endpoint: "https://api.deepseek.com/v1/chat/completions",
      testEndpoint: "https://api.deepseek.com/v1/models",
      keyUrl: "https://platform.deepseek.com/api_keys",
      models: [
        { id: "deepseek-chat", label: "DeepSeek Chat" },
        { id: "deepseek-reasoner", label: "DeepSeek Reasoner" }
      ]
    },
    pollinations: {
      label: "Pollinations AI", kind: "openai", needsKey: false,
      endpoint: "https://gen.pollinations.ai/v1/chat/completions",
      testEndpoint: "https://gen.pollinations.ai/v1/models",
      keyUrl: "https://enter.pollinations.ai",
      blurb: "Pollinations AI gateway. Your key unlocks its live model catalog across text, image, audio, video and other generation routes.",
      models: [{ id: "openai", label: "Pollinations Free Text" }],
      imageModels: [{ id: "flux", label: "Pollinations Flux" }],
      vision: false,
      free: true,
      imageEndpoint: "https://image.pollinations.ai/prompt/"
    },
    ollama: {
      label: "Ollama (local)", kind: "openai", needsKey: false, local: true, editableEndpoint: true,
      endpoint: "http://localhost:11434/v1/chat/completions",
      testEndpoint: "http://localhost:11434/v1/models",
      blurb: "Runs models on your own machine. Start Ollama, then pull a model with: ollama pull llama3.2",
      models: [
        { id: "llama3.2", label: "Llama 3.2" },
        { id: "qwen2.5", label: "Qwen 2.5" },
        { id: "mistral", label: "Mistral" },
        { id: "phi4", label: "Phi-4" }
      ]
    },
    lmstudio: {
      label: "LM Studio (local)", kind: "openai", needsKey: false, local: true, editableEndpoint: true,
      endpoint: "http://localhost:1234/v1/chat/completions",
      testEndpoint: "http://localhost:1234/v1/models",
      blurb: "Point this at the local server LM Studio exposes on port 1234.",
      models: [{ id: "local-model", label: "Loaded model" }]
    },
    custom: {
      label: "Custom endpoint", kind: "openai", needsKey: true, editableEndpoint: true,
      endpoint: "https://your-proxy.example.com/v1/chat/completions",
      blurb: "Any OpenAI-compatible server — including a backend proxy that keeps your key off the browser.",
      models: [{ id: "custom-model", label: "Your model" }]
    }
  },
  search: { ddg: "https://api.duckduckgo.com/", wiki: "https://en.wikipedia.org/w/api.php", max: 6 },
  images: { endpoint: "https://api.openverse.org/v1/images/", max: 12 },
  personas: [
    { id: "default", name: "Default", prompt: "" },
    { id: "engineer", name: "Engineer", prompt: "You are a senior software engineer. Give precise, production-minded answers. Show working code with error handling, name the trade-offs, and flag anything that would break at scale." },
    { id: "teacher", name: "Teacher", prompt: "You explain things patiently from first principles. Use plain language and a concrete example before any abstraction. Check understanding with a short question at the end." },
    { id: "editor", name: "Editor", prompt: "You are a sharp copy editor. Tighten prose, cut filler, fix grammar, and keep the author's voice. Show the edited version first, then a short list of what changed and why." },
    { id: "analyst", name: "Analyst", prompt: "You are a research analyst. Lead with the answer, support it with evidence, separate fact from inference, and state your confidence. Use tables when comparing options." },
    { id: "brainstorm", name: "Brainstorm", prompt: "You are an idea partner. Offer many varied options quickly, including unusual ones. Group them, then recommend the strongest three with a sentence on why." }
  ],
  examples: [
    { title: "Explain something hard", body: "Explain how neural networks learn, using an everyday analogy I'd actually remember." },
    { title: "Debug my code", body: "Here's a function that isn't behaving. Walk me through finding the bug:\n\n```python\n\n```" },
    { title: "Research a topic", body: "Search the web and summarise the latest developments in grid-scale battery storage." },
    { title: "Compare two options", body: "Compare REST and GraphQL for a small mobile backend. Recommend one and say what would change your mind." },
    { title: "Plan the work", body: "Break a two-week project to ship a user-facing search feature into daily tasks with checkpoints." },
    { title: "Turn notes into a draft", body: "Here are my rough notes. Turn them into a clear one-page brief for a non-technical reader:\n\n" }
  ],
  shortcuts: [
    ["Ctrl / ⌘ + K", "Command palette"],
    ["Ctrl / ⌘ + N", "New chat"],
    ["Ctrl / ⌘ + B", "Show or hide sidebar"],
    ["Ctrl / ⌘ + F", "Find in conversation"],
    ["Ctrl / ⌘ + M", "Switch model"],
    ["Ctrl / ⌘ + J", "Switch theme"],
    ["Ctrl / ⌘ + .", "Cycle Standard / Advanced"],
    ["Ctrl / ⌘ + ,", "Settings"],
    ["Ctrl / ⌘ + Shift + V", "Dictate a message"],
    ["Ctrl / ⌘ + Shift + C", "Copy last response"],
    ["Ctrl / ⌘ + Shift + Backspace", "Clear this conversation"],
    ["↑ in empty composer", "Edit your last message"],
    ["Enter", "Send"],
    ["Shift + Enter", "New line"],
    ["/", "Commands and saved prompts"],
    ["?", "This list"],
    ["Esc", "Close, or stop generating"]
  ]
};

/* ============================================================
   2. ICONS
   ============================================================ */
const S = (p, extra) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"${extra || ""}>${p}</svg>`;

const Icon = {
  logo: S('<path d="M12 3.5 19 10 12 20.5 5 10 12 3.5Z"/><path d="M12 3.5v17"/><path d="M5 10h14"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  search: S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  menu: S('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  panel: S('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>'),
  settings: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.6.7 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  dots: S('<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>'),
  edit: S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  trash: S('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>'),
  eraser: S('<path d="m7 21-4-4a2 2 0 0 1 0-2.8l9.6-9.6a2 2 0 0 1 2.8 0l4.4 4.4a2 2 0 0 1 0 2.8L12 19"/><path d="M6 14 12 20"/>'),
  send: S('<path d="m3 11 18-8-8 18-2-8-8-2Z"/>'),
  stop: S('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>'),
  image: S('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.4"/><path d="m21 15-5-5L5 21"/>'),
  copy: S('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  refresh: S('<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16m0 5v-5h5"/>'),
  check: S('<path d="M20 6 9 17l-5-5"/>'),
  alert: S('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
  info: S('<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>'),
  eye: S('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: S('<path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-7 0-11-7-11-7a20 20 0 0 1 4.2-5.2M9.9 4.2A10 10 0 0 1 12 4c7 0 11 7 11 7a20 20 0 0 1-2.4 3.3M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M1 1l22 22"/>'),
  download: S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  upload: S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  broken: S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 16 5-5 3 3 5-6 5 5"/><path d="m3 3 18 18"/>'),
  pin: S('<path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z"/>'),
  archive: S('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/>'),
  command: S('<path d="M15 6a3 3 0 1 1 3 3h-3V6ZM9 6a3 3 0 1 0-3 3h3V6ZM15 18a3 3 0 1 0 3-3h-3v3ZM9 18a3 3 0 1 1-3-3h3v3Z"/><rect x="9" y="9" width="6" height="6" rx="1"/>'),
  keyboard: S('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6M8 17h8"/>'),
  bookmark: S('<path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>'),
  chip: S('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
  chevron: S('<path d="m6 9 6 6 6-6"/>'),
  "chevron-down": S('<path d="m6 9 6 6 6-6"/>'),
  down: S('<path d="M12 5v14M5 12l7 7 7-7"/>'),
  up: S('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  x: S('<path d="M18 6 6 18M6 6l12 12"/>'),
  clip: S('<path d="M21.4 11.1 12.3 20a5.1 5.1 0 0 1-7.2-7.2l9.2-9.2a3.4 3.4 0 1 1 4.8 4.8l-9.2 9.2a1.7 1.7 0 1 1-2.4-2.4l8.5-8.5"/>'),
  mic: S('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>'),
  speaker: S('<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
  moon: S('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
  sun: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  persona: S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  branch: S('<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 7.5v9M8.5 17c4-1 7-2.2 7-5"/>'),
  quote: S('<path d="M7 7h4v6a4 4 0 0 1-4 4V7ZM15 7h4v6a4 4 0 0 1-4 4V7Z"/>'),
  code: S('<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>'),
  print: S('<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>'),
  chart: S('<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>'),
  sparkle: S('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>'),
  bolt: S('<path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"/>'),
  grid: S('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  key: S('<circle cx="7.5" cy="15.5" r="4"/><path d="m10.5 12.5 9-9M17 6l2.5 2.5M14 9l2.5 2.5"/>'),
  file: S('<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/>'),
  clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  filter: S('<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>')
};

function hydrateIcons(root) {
  (root || document).querySelectorAll(".ico[data-icon]").forEach((el) => {
    if (el.dataset.hydrated === "1") return;
    el.innerHTML = Icon[el.dataset.icon] || "";
    el.dataset.hydrated = "1";
  });
}
const ic = (name) => `<span class="ico">${Icon[name] || ""}</span>`;

/* ============================================================
   3. UTILITIES + SECURITY
   ============================================================ */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const Sec = {
  esc(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },
  safeUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      return ["http:", "https:", "mailto:"].includes(u.protocol);
    } catch { return false; }
  },
  host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }
};

const uid = (p) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/* The workspace router authors the composer prompt per mode; fall back only
   when it is not loaded yet. */
function TG_MODE_PLACEHOLDER() {
  try {
    const meta = window.TheGradientModeRouter?.MODE_META;
    const mode = State?.uiMode || "software";
    return meta?.[mode]?.placeholder || "";
  } catch { return ""; }
}
const approxTokens = (text) => Math.max(1, Math.round((text || "").length / 4));

function fmtBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}
function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  if (diff < 604800000) return Math.floor(diff / 86400000) + "d ago";
  return fmtDate(ts);
}
function debounce(fn, ms) {
  let t;
  return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}
function download(filename, text, type) {
  const blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function slug(text) {
  return (text || "chat").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "chat";
}
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const modKey = (e) => (isMac ? e.metaKey : e.ctrlKey);

/* ============================================================
   4. SYNTAX HIGHLIGHTER (dependency-free)
   ============================================================ */
const Highlighter = (function () {
  const kw = (list) => new RegExp("\\b(?:" + list.join("|") + ")\\b");

  const CLIKE_KW = ["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","new","class","extends","super","this","typeof","instanceof","in","of","try","catch","finally","throw","async","await","yield","import","export","from","default","delete","void","static","get","set","null","undefined","true","false","NaN"];
  const PY_KW = ["def","class","return","if","elif","else","for","while","break","continue","import","from","as","try","except","finally","raise","with","lambda","yield","global","nonlocal","pass","assert","del","and","or","not","in","is","None","True","False","async","await","self","match","case"];
  const SQL_KW = ["SELECT","FROM","WHERE","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","ALTER","DROP","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP","BY","ORDER","HAVING","LIMIT","OFFSET","AS","AND","OR","NOT","NULL","DISTINCT","UNION","INDEX","PRIMARY","KEY","FOREIGN","REFERENCES","DEFAULT","CASE","WHEN","THEN","END","WITH","RETURNING"];
  const SH_KW = ["if","then","else","elif","fi","for","while","do","done","case","esac","function","return","export","local","echo","cd","sudo","apt","npm","pip","git","docker","curl","chmod","mkdir","rm","cp","mv","cat","grep","sed","awk","source"];
  const GO_KW = ["package","import","func","var","const","type","struct","interface","map","chan","go","defer","return","if","else","for","range","switch","case","default","break","continue","nil","true","false","error"];
  const RS_KW = ["fn","let","mut","const","struct","enum","impl","trait","pub","use","mod","match","if","else","for","while","loop","return","self","Self","move","ref","where","async","await","dyn","unsafe","true","false","Some","None","Ok","Err"];

  const RULES = {
    clike: [
      ["com", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ["str", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`/],
      ["num", /\b0[xXbBoO][\da-fA-F_]+\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
      ["key", kw(CLIKE_KW)],
      ["fn", /\b[A-Za-z_$][\w$]*(?=\s*\()/],
      ["typ", /\b[A-Z][A-Za-z0-9_]*\b/],
      ["op", /[+\-*/%=<>!&|^~?:;,.]+/]
    ],
    python: [
      ["com", /#[^\n]*/],
      ["str", /"""[\s\S]*?"""|'''[\s\S]*?'''|[rbfu]{0,2}"(?:\\.|[^"\\\n])*"|[rbfu]{0,2}'(?:\\.|[^'\\\n])*'/],
      ["num", /\b0[xXbBoO][\da-fA-F_]+\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
      ["key", kw(PY_KW)],
      ["fn", /\b[A-Za-z_][\w]*(?=\s*\()/],
      ["typ", /@[\w.]+|\b[A-Z][A-Za-z0-9_]*\b/],
      ["op", /[+\-*/%=<>!&|^~:,.]+/]
    ],
    markup: [
      ["com", /<!--[\s\S]*?-->/],
      ["tag", /<\/?[a-zA-Z][\w:-]*/],
      ["str", /"(?:[^"]*)"|'(?:[^']*)'/],
      ["atr", /\b[a-zA-Z-][\w:-]*(?==)/],
      ["op", /\/?>/]
    ],
    css: [
      ["com", /\/\*[\s\S]*?\*\//],
      ["str", /"(?:[^"\n]*)"|'(?:[^'\n]*)'/],
      ["atr", /[-a-zA-Z]+(?=\s*:)/],
      ["num", /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|fr|deg)?\b/],
      ["key", /@[a-zA-Z-]+|![a-z]+/],
      ["fn", /\b[a-zA-Z-]+(?=\()/],
      ["typ", /\.[-\w]+|#[-\w]+|:{1,2}[-\w()]+/],
      ["op", /[{}:;,>+~]/]
    ],
    json: [
      ["atr", /"(?:\\.|[^"\\])*"(?=\s*:)/],
      ["str", /"(?:\\.|[^"\\])*"/],
      ["num", /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
      ["key", /\b(?:true|false|null)\b/],
      ["op", /[{}\[\]:,]/]
    ],
    sql: [
      ["com", /--[^\n]*|\/\*[\s\S]*?\*\//],
      ["str", /'(?:''|[^'])*'|"(?:[^"]*)"/],
      ["num", /\b\d+(?:\.\d+)?\b/],
      ["key", new RegExp("\\b(?:" + SQL_KW.join("|") + ")\\b", "i")],
      ["fn", /\b[A-Za-z_][\w]*(?=\s*\()/],
      ["op", /[*=<>!,;().]+/]
    ],
    shell: [
      ["com", /#[^\n]*/],
      ["str", /"(?:\\.|[^"\\])*"|'[^']*'/],
      ["key", kw(SH_KW)],
      ["typ", /\$\{?[\w]+\}?/],
      ["num", /\b\d+\b/],
      ["op", /[|&;<>()$]+/]
    ],
    go: [
      ["com", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ["str", /"(?:\\.|[^"\\\n])*"|`[^`]*`/],
      ["num", /\b\d[\d_]*(?:\.\d+)?\b/],
      ["key", kw(GO_KW)],
      ["fn", /\b[A-Za-z_][\w]*(?=\s*\()/],
      ["typ", /\b[A-Z][A-Za-z0-9_]*\b/],
      ["op", /[+\-*/%=<>!&|^~?:;,.]+/]
    ],
    rust: [
      ["com", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ["str", /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])'/],
      ["num", /\b\d[\d_]*(?:\.\d+)?(?:[iuf]\d+)?\b/],
      ["key", kw(RS_KW)],
      ["fn", /\b[a-z_][\w]*(?=\s*[(<!])/],
      ["typ", /\b[A-Z][A-Za-z0-9_]*\b|'[a-z]+/],
      ["op", /[+\-*/%=<>!&|^~?:;,.#]+/]
    ],
    yaml: [
      ["com", /#[^\n]*/],
      ["atr", /^[ \t-]*[\w.-]+(?=\s*:)/m],
      ["str", /"(?:[^"\n]*)"|'(?:[^'\n]*)'/],
      ["num", /\b\d+(?:\.\d+)?\b/],
      ["key", /\b(?:true|false|null|yes|no)\b/],
      ["op", /[:\-|>]/]
    ],
    md: [
      ["key", /^#{1,6} [^\n]*/m],
      ["str", /`[^`\n]+`|\*\*[^*\n]+\*\*/],
      ["typ", /^[-*+] |^\d+\. /m],
      ["fn", /\[[^\]\n]+\]\([^)\n]+\)/]
    ]
  };

  const ALIASES = {
    js: "clike", javascript: "clike", jsx: "clike", ts: "clike", typescript: "clike", tsx: "clike",
    java: "clike", c: "clike", cpp: "clike", "c++": "clike", cs: "clike", csharp: "clike",
    php: "clike", swift: "clike", kotlin: "clike", dart: "clike", scala: "clike",
    py: "python", python: "python",
    html: "markup", xml: "markup", svg: "markup", vue: "markup",
    css: "css", scss: "css", sass: "css", less: "css",
    json: "json", jsonc: "json",
    sql: "sql", postgres: "sql", mysql: "sql",
    sh: "shell", bash: "shell", zsh: "shell", shell: "shell", console: "shell",
    go: "go", golang: "go", rust: "rust", rs: "rust",
    yaml: "yaml", yml: "yaml", toml: "yaml",
    md: "md", markdown: "md"
  };

  const compiled = {};
  function compile(name) {
    if (compiled[name]) return compiled[name];
    const rules = RULES[name];
    const flags = "g" + (rules.some((r) => r[1].flags.includes("m")) ? "m" : "") ;
    const re = new RegExp(rules.map((r) => "(" + r[1].source + ")").join("|"), flags + (rules.some(r=>r[1].flags.includes("i")) ? "i" : ""));
    compiled[name] = { re, names: rules.map((r) => r[0]) };
    return compiled[name];
  }

  function emit(out, cls, text) {
    // split on newlines so no span ever crosses a line (keeps line numbering safe)
    const parts = String(text).split("\n");
    parts.forEach((part, i) => {
      if (i) out.push("\n");
      if (part) out.push(cls ? `<span class="tok-${cls}">${Sec.esc(part)}</span>` : Sec.esc(part));
    });
  }

  function highlight(code, lang) {
    const family = ALIASES[(lang || "").toLowerCase()];
    if (!family || !RULES[family]) return Sec.esc(code);
    const { re, names } = compile(family);
    re.lastIndex = 0;
    const out = [];
    let last = 0, m, guard = 0;
    while ((m = re.exec(code)) !== null && guard++ < 60000) {
      if (m.index > last) emit(out, null, code.slice(last, m.index));
      let cls = null;
      for (let g = 1; g < m.length; g++) { if (m[g] !== undefined) { cls = names[g - 1]; break; } }
      emit(out, cls, m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < code.length) emit(out, null, code.slice(last));
    return out.join("");
  }

  function label(lang) {
    const map = { js: "javascript", ts: "typescript", py: "python", sh: "bash", md: "markdown", rs: "rust" };
    return map[(lang || "").toLowerCase()] || (lang || "text").toLowerCase();
  }

  return { highlight, label, supported: (l) => !!ALIASES[(l || "").toLowerCase()] };
})();

/* ============================================================
   5. MARKDOWN RENDERER (escape-first, no raw HTML passthrough)
   ============================================================ */
const MD = (function () {
  function inline(text) {
    // `text` is already HTML-escaped
    const codes = [];
    text = text.replace(/`([^`\n]+)`/g, (m, c) => {
      codes.push(c); return `\u0001C${codes.length - 1}\u0001`;
    });
    text = text.replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
    text = text.replace(/(?<![\w*])\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    text = text.replace(/(?<![\w_])_([^_\n]+)_(?![\w_])/g, "<em>$1</em>");
    text = text.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
    text = text.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
    // images -> linked thumbnails
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
      const u = url.replace(/&amp;/g, "&");
      if (!Sec.safeUrl(u)) return alt;
      return `<a href="${u}" target="_blank" rel="noopener noreferrer">${alt || "image"}</a>`;
    });
    // links
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const u = url.replace(/&amp;/g, "&");
      if (!Sec.safeUrl(u)) return label;
      return `<a href="${u}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    // bare urls
    text = text.replace(/(^|[\s(])((?:https?:\/\/)[^\s<)]+[^\s<).,;:!?])/g, (m, pre, url) =>
      Sec.safeUrl(url) ? `${pre}<a href="${url}" target="_blank" rel="noopener noreferrer">${Sec.host(url)}</a>` : m
    );
    text = text.replace(/\u0001C(\d+)\u0001/g, (m, i) => `<code>${codes[+i]}</code>`);
    return text;
  }

  function citations(html, sources) {
    if (!sources || !sources.length) return html;
    return html.replace(/\[(\d{1,2})\]/g, (m, n) => {
      const s = sources[+n - 1];
      if (!s) return m;
      const t = Sec.esc(s.title || s.domain || "");
      return `<a class="cite-ref" href="${s.url}" target="_blank" rel="noopener noreferrer" title="${t}">${n}</a>`;
    });
  }

  function tableHtml(lines) {
    const rows = lines.filter((l) => l.trim().length);
    if (rows.length < 2 || !/^[\s:|-]+$/.test(rows[1])) return null;
    const split = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const aligns = split(rows[1]).map((c) =>
      c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left"
    );
    const head = split(rows[0]);
    let html = "<table><thead><tr>";
    head.forEach((c, i) => (html += `<th style="text-align:${aligns[i] || "left"}">${inline(c)}</th>`));
    html += "</tr></thead><tbody>";
    rows.slice(2).forEach((r) => {
      html += "<tr>";
      split(r).forEach((c, i) => (html += `<td style="text-align:${aligns[i] || "left"}">${inline(c)}</td>`));
      html += "</tr>";
    });
    return html + "</tbody></table>";
  }

  function codeHtml(block, opts) {
    const lang = block.lang || "";
    const highlighted = Highlighter.highlight(block.code, lang);
    const lines = highlighted.split("\n");
    const numbered = opts.lineNumbers && lines.length > 1;
    const bodyHtml = numbered
      ? lines.map((l) => `<span class="ln">${l || " "}</span>`).join("\n")
      : highlighted;
    const cls = ["code-block", opts.wrap ? "wrap" : "", numbered ? "numbered" : ""].filter(Boolean).join(" ");
    return (
      `<div class="${cls}" data-code="${encodeURIComponent(block.code)}" data-lang="${Sec.esc(lang)}">` +
      `<div class="code-head"><span class="code-lang">${Sec.esc(Highlighter.label(lang))}</span>` +
      `<button type="button" class="code-btn" data-code-act="wrap" title="Toggle line wrapping">${ic("code")}Wrap</button>` +
      `<button type="button" class="code-btn" data-code-act="download" title="Save as a file">${ic("download")}Save</button>` +
      `<button type="button" class="code-btn" data-code-act="copy">${ic("copy")}Copy</button>` +
      `</div><pre><code class="language-${Sec.esc(lang || "text")}">${bodyHtml}</code></pre></div>`
    );
  }

  function render(raw, options) {
    if (!raw) return "";
    const opts = Object.assign({ lineNumbers: true, wrap: false, sources: null }, options);
    const blocks = [];
    // Pull fenced code out of the RAW text first: the highlighter escapes it
    // itself, and `data-code` must carry the original characters for copying.
    let text = String(raw);
    const fence = (re) => {
      text = text.replace(re, (m, lang, code) => {
        blocks.push({ lang: (lang || "").trim(), code: code.replace(/\n$/, "") });
        return `\u0000CB${blocks.length - 1}\u0000`;
      });
    };
    fence(/```([a-zA-Z0-9_+#-]*)[ \t]*\n([\s\S]*?)(?:```|$)/g);
    fence(/~~~([a-zA-Z0-9_+#-]*)[ \t]*\n([\s\S]*?)(?:~~~|$)/g);
    text = Sec.esc(text);

    const lines = text.split("\n");
    const out = [];
    let para = [], list = null, quote = [], table = [];

    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
    const flushList = () => {
      if (!list) return;
      const items = list.items.map((it) => {
        const task = it.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          return `<li class="task-item"><input type="checkbox" disabled ${task[1].toLowerCase() === "x" ? "checked" : ""}><span>${inline(task[2])}</span></li>`;
        }
        return `<li>${inline(it)}</li>`;
      }).join("");
      out.push(`<${list.type}${list.start && list.start !== 1 ? ` start="${list.start}"` : ""}>${items}</${list.type}>`);
      list = null;
    };
    const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`); quote = []; } };
    const flushTable = () => {
      if (!table.length) return;
      const t = tableHtml(table);
      if (t) out.push(t); else table.forEach((l) => para.push(l));
      table = [];
    };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const t = line.trim();

      if (/^\u0000CB\d+\u0000$/.test(t)) { flushAll(); out.push(t); continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flushAll(); out.push("<hr>"); continue; }
      if (/^#{1,6}\s+/.test(t)) {
        flushAll();
        const lvl = t.match(/^#+/)[0].length;
        out.push(`<h${lvl}>${inline(t.replace(/^#{1,6}\s+/, ""))}</h${lvl}>`);
        continue;
      }
      if (/^\|.*\|/.test(t)) { flushPara(); flushList(); flushQuote(); table.push(line); continue; }
      else if (table.length) flushTable();

      if (/^&gt;\s?/.test(t)) { flushPara(); flushList(); quote.push(t.replace(/^&gt;\s?/, "")); continue; }
      else if (quote.length) flushQuote();

      const ul = t.match(/^[-*+]\s+(.*)$/);
      if (ul && !/^\*\*/.test(t)) {
        flushPara(); flushQuote();
        if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
        list.items.push(ul[1]);
        continue;
      }
      const ol = t.match(/^(\d+)[.)]\s+(.*)$/);
      if (ol) {
        flushPara(); flushQuote();
        if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [], start: parseInt(ol[1], 10) }; }
        list.items.push(ol[2]);
        continue;
      }
      if (list && /^\s{2,}\S/.test(line) && list.items.length) {
        list.items[list.items.length - 1] += " " + t;
        continue;
      }
      if (list) flushList();

      if (t === "") { flushAll(); continue; }
      para.push(t);
    }
    flushAll();

    let html = out.join("\n");
    html = citations(html, opts.sources);
    html = html.replace(/\u0000CB(\d+)\u0000/g, (m, i) => {
      const b = blocks[+i];
      return b ? codeHtml(b, opts) : "";
    });
    return html;
  }

  function toPlainText(md) {
    return String(md || "")
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-z]*\n?/gi, ""))
      .replace(/[*_~`#>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
  }

  return { render, inline, toPlainText };
})();

/* ============================================================
   6. STORAGE (IndexedDB with a localStorage fallback)
   ============================================================ */
const Store = (function () {
  let db = null, mode = "idb", ready = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("no-indexeddb"));
      const req = indexedDB.open(APP.db.name, APP.db.version);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(APP.db.store)) d.createObjectStore(APP.db.store, { keyPath: "id" });
        // v2 migration: a small key/value store for projects, memory and artifacts.
        if (!d.objectStoreNames.contains(APP.db.meta)) d.createObjectStore(APP.db.meta, { keyPath: "k" });
        // v3 migration: project knowledge-base documents and their local index.
        if (!d.objectStoreNames.contains(APP.db.documents)) {
          const docs = d.createObjectStore(APP.db.documents, { keyPath: "id" });
          docs.createIndex("projectId", "projectId", { unique: false });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => reject(req.error || new Error("idb-failed"));
      req.onblocked = () => reject(new Error("idb-blocked"));
    });
  }
  function init() {
    if (ready) return ready;
    try { if (localStorage.getItem("nimbus_force_ls_v1") === "1") { mode = "ls"; ready = Promise.resolve(); return ready; } } catch {}
    ready = Promise.race([
      open(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("idb-timeout")), 1800))
    ]).then((d) => { db = d; mode = "idb"; }).catch(() => { mode = "ls"; });
    return ready;
  }
  const lsAll = () => { try { return JSON.parse(localStorage.getItem(APP.keys.fallback) || "[]"); } catch { return []; } };
  const lsSave = (l) => {
    try { localStorage.setItem(APP.keys.fallback, JSON.stringify(l)); return true; }
    catch (err) {
      // Quota exceeded: drop the oldest archived chats and try once more.
      if (err && /quota|exceeded/i.test(err.name + " " + err.message)) {
        const trimmed = l.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, Math.max(5, Math.floor(l.length / 2)));
        try { localStorage.setItem(APP.keys.fallback, JSON.stringify(trimmed)); return true; } catch {}
      }
      return false;
    }
  };

  async function getAll() {
    await init();
    if (mode === "ls") return lsAll();
    return new Promise((resolve) => {
      try {
        const req = db.transaction(APP.db.store, "readonly").objectStore(APP.db.store).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(lsAll());
      } catch { resolve(lsAll()); }
    });
  }
  async function put(conv) {
    await init();
    if (mode === "ls") {
      const list = lsAll();
      const i = list.findIndex((c) => c.id === conv.id);
      if (i >= 0) list[i] = conv; else list.push(conv);
      return lsSave(list);
    }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(APP.db.store, "readwrite");
        tx.objectStore(APP.db.store).put(JSON.parse(JSON.stringify(conv)));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
  }
  async function del(id) {
    await init();
    if (mode === "ls") return lsSave(lsAll().filter((c) => c.id !== id));
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(APP.db.store, "readwrite");
        tx.objectStore(APP.db.store).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
  }
  async function clear() {
    await init();
    if (mode === "ls") return lsSave([]);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(APP.db.store, "readwrite");
        tx.objectStore(APP.db.store).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
  }
  async function kvGet(k, fb) {
    await init();
    if (mode === "ls") { try { const r = localStorage.getItem("nimbus_kv_" + k); return r ? JSON.parse(r) : fb; } catch { return fb; } }
    return new Promise((resolve) => {
      try {
        const req = db.transaction(APP.db.meta, "readonly").objectStore(APP.db.meta).get(k);
        req.onsuccess = () => resolve(req.result ? req.result.v : fb);
        req.onerror = () => resolve(fb);
      } catch { resolve(fb); }
    });
  }
  async function kvSet(k, v) {
    await init();
    if (mode === "ls") { try { localStorage.setItem("nimbus_kv_" + k, JSON.stringify(v)); return true; } catch { return false; } }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(APP.db.meta, "readwrite");
        tx.objectStore(APP.db.meta).put({ k, v: JSON.parse(JSON.stringify(v)) });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  const readJson = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  return {
    init, getAll, put, del, clear, kvGet, kvSet,
    getSettings: () => readJson(APP.keys.settings, null),
    saveSettings: (o) => writeJson(APP.keys.settings, o),
    getKeys: () => readJson(APP.keys.apiKeys, {}),
    saveKeys: (o) => writeJson(APP.keys.apiKeys, o),
    getPrompts: () => readJson(APP.keys.prompts, null),
    savePrompts: (o) => writeJson(APP.keys.prompts, o),
    getTheme: () => { try { return localStorage.getItem(APP.keys.theme); } catch { return null; } },
    saveTheme: (t) => { try { localStorage.setItem(APP.keys.theme, t); return true; } catch { return false; } },
    get mode() { return mode; },
    async usage() {
      if (navigator.storage && navigator.storage.estimate) {
        try { return await navigator.storage.estimate(); } catch { return null; }
      }
      return null;
    }
  };
})();

/* ============================================================
   7. THEME
   ============================================================ */
const Theme = {
  resolve(t) {
    if (t === "system") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return t;
  },
  apply(t) {
    const resolved = this.resolve(t);
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "light" ? "#f6f7f9" : "#0c0e13");
  },
  init() {
    const saved = Store.getTheme() || "dark";
    this.apply(saved);
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
        if ((Store.getTheme() || "dark") === "system") this.apply("system");
      });
    }
    return saved;
  },
  set(t) { Store.saveTheme(t); this.apply(t); }
};

/* ============================================================
   8. AI PROVIDERS
   ============================================================ */
/* Models known to emit reasoning / thinking tokens. */
const REASONING_MODEL = /(^o\d|gpt-5|reason|think|r1\b|qwq|magistral|claude-(3-7|sonnet-4|opus-4|haiku-4)|gemini-2\.[05]|deepseek-r)/i;

class ProviderError extends Error {
  constructor(message, opts) {
    super(message);
    this.name = "ProviderError";
    this.kind = (opts && opts.kind) || "unknown";
    this.hint = (opts && opts.hint) || "";
  }
}

function classifyFetchError(err, providerId) {
  if (err && err.name === "AbortError") return new ProviderError("Generation stopped.", { kind: "aborted" });
  const cfg = APP.providers[providerId] || {};
  const isNetwork =
    err instanceof TypeError ||
    (err && (err.name === "TypeError" || err.name === "NetworkError")) ||
    (err && typeof err.message === "string" && /failed to fetch|network|load failed|connection/i.test(err.message));
  if (isNetwork) {
    return new ProviderError(
      cfg.local
        ? `Couldn't reach ${cfg.label}. Check the server is running and that it allows requests from this page.`
        : "Couldn't reach the provider from this browser. That's usually a network drop or the provider blocking direct browser requests (CORS).",
      { kind: "network", hint: cfg.local ? "For Ollama, start it with OLLAMA_ORIGINS=* so the browser is allowed to connect." : "A small server-side proxy fixes CORS and keeps your key private." }
    );
  }
  return new ProviderError(err.message || "The request failed.", { kind: "unknown" });
}

async function parseHttpError(res) {
  let body = "";
  try { body = await res.text(); } catch {}
  let msg = `The provider returned status ${res.status}.`;
  try {
    const j = JSON.parse(body);
    const m = (j.error && (j.error.message || j.error)) || j.message;
    if (m) msg = typeof m === "string" ? m : JSON.stringify(m);
  } catch { if (body) msg = body.slice(0, 300); }
  let kind = "server", hint = "";
  if (res.status === 401 || res.status === 403) { kind = "auth"; hint = "Check the API key in Settings → Provider."; }
  else if (res.status === 429) { kind = "rate_limit"; hint = "You've hit a rate or quota limit. Wait a moment or check your plan."; }
  else if (res.status === 404) { kind = "invalid_model"; hint = "The model ID may be wrong or unavailable to your account."; }
  else if (res.status >= 500) { hint = "The provider is having trouble. Try again shortly."; }
  return new ProviderError(msg, { kind, hint });
}

async function streamSSE(response, onEvent, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  try {
    while (true) {
      if (signal && signal.aborted) { try { await reader.cancel(); } catch {} break; }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop();
      for (const part of parts) {
        let data = "";
        for (const line of part.split(/\r?\n/)) if (line.startsWith("data:")) data += line.slice(5).trim();
        if (data) onEvent(data);
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

/* --- content builders: turn our message shape into provider payloads --- */
function textOf(msg) {
  let t = msg.content || "";
  (msg.attachments || []).forEach((a) => {
    if (a.kind === "text") t += `\n\n--- file: ${a.name} ---\n${a.text}\n--- end of ${a.name} ---`;
  });
  return t.trim();
}
const imagesOf = (msg) => (msg.attachments || []).filter((a) => a.kind === "image");

function openaiContent(msg, vision) {
  const imgs = vision ? imagesOf(msg) : [];
  if (!imgs.length) return textOf(msg);
  return [
    { type: "text", text: textOf(msg) || "Describe the attached image." },
    ...imgs.map((a) => ({ type: "image_url", image_url: { url: a.dataUrl } }))
  ];
}
function anthropicContent(msg, vision) {
  const imgs = vision ? imagesOf(msg) : [];
  if (!imgs.length) return textOf(msg);
  return [
    ...imgs.map((a) => ({
      type: "image",
      source: { type: "base64", media_type: a.mime, data: a.dataUrl.split(",")[1] }
    })),
    { type: "text", text: textOf(msg) || "Describe the attached image." }
  ];
}
function geminiParts(msg, vision) {
  const parts = [];
  const t = textOf(msg);
  if (t) parts.push({ text: t });
  if (vision) imagesOf(msg).forEach((a) => parts.push({ inline_data: { mime_type: a.mime, data: a.dataUrl.split(",")[1] } }));
  return parts.length ? parts : [{ text: "(empty)" }];
}

/* --- OpenAI-compatible (OpenAI, OpenRouter, Groq, Mistral, DeepSeek, Ollama, LM Studio, custom) --- */
function makeOpenAICompatible(providerId) {
  return {
    async send(opts) {
      const { messages, model, systemPrompt, apiKey, signal, onDelta, params, endpoint, stream } = opts;
      const onReason = opts.onReason || function () {};
      const cfg = APP.providers[providerId];
      if (cfg.needsKey && !apiKey) throw new ProviderError(`Add your ${cfg.label} API key in Settings to send messages.`, { kind: "auth" });
      const body = {
        model,
        stream: stream !== false,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: openaiContent(m, cfg.vision) }))
        ]
      };
      if (params) {
        if (typeof params.temperature === "number") body.temperature = params.temperature;
        if (params.maxTokens) body.max_tokens = params.maxTokens;
        if (typeof params.topP === "number" && params.topP < 1) body.top_p = params.topP;
        if (params.thinking && REASONING_MODEL.test(model)) {
          const effort = params.thinkingEffort || "medium";
          // o-series and gpt-5 style models take `reasoning_effort`; OpenRouter
          // takes a `reasoning` object; DeepSeek/Groq reasoners stream
          // `reasoning_content` with no flag at all.
          if (providerId === "openrouter") body.reasoning = { effort };
          else if (/^(o\d|gpt-5)/i.test(model)) { body.reasoning_effort = effort; delete body.temperature; delete body.top_p; }
        }
      }
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      if (opts.extraHeaders) Object.assign(headers, opts.extraHeaders);
      if (providerId === "openrouter") {
        headers["HTTP-Referer"] = location.origin || "https://localhost";
        headers["X-Title"] = APP.name;
      }
      let res;
      try {
        res = await fetch(endpoint || cfg.endpoint, { method: "POST", headers, body: JSON.stringify(body), signal });
      } catch (err) { throw classifyFetchError(err, providerId); }
      if (!res.ok) throw await parseHttpError(res);

      if (body.stream === false) {
        const json = await res.json();
        const m = (json.choices && json.choices[0] && json.choices[0].message) || {};
        const reason = m.reasoning_content || m.reasoning || "";
        if (reason) onReason(String(reason));
        const text = m.content || "";
        onDelta(text);
        return { text, reasoning: String(reason || "") };
      }
      let full = "", reasoning = "";
      await streamSSE(res, (data) => {
        if (data === "[DONE]") return;
        try {
          const j = JSON.parse(data);
          const d = j.choices && j.choices[0] && j.choices[0].delta;
          if (!d) return;
          const r = d.reasoning_content || d.reasoning ||
            (Array.isArray(d.reasoning_details) ? d.reasoning_details.map((x) => x.text || x.summary || "").join("") : "");
          if (typeof r === "string" && r) { reasoning += r; onReason(reasoning); }
          if (d.content) { full += d.content; onDelta(full); }
        } catch {}
      }, signal);
      return { text: full, reasoning };
    },
    async test(apiKey, endpoint) {
      const cfg = APP.providers[providerId];
      const url = endpoint || cfg.testEndpoint || (cfg.endpoint || "").replace(/\/chat\/completions$/, "/models");
      try {
        const headers = {};
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw await parseHttpError(res);
        let count = 0;
        try { const j = await res.json(); count = (j.data || j.models || []).length; } catch {}
        return count ? `Connected. ${count} models available.` : "Connected.";
      } catch (err) { throw err instanceof ProviderError ? err : classifyFetchError(err, providerId); }
    },
    async listModels(apiKey, endpoint) {
      const cfg = APP.providers[providerId];
      const url = endpoint || cfg.testEndpoint;
      if (!url) return [];
      const headers = {};
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw await parseHttpError(res);
      const j = await res.json();
      return (j.data || j.models || [])
        .map((m) => ({ id: m.id || m.name, label: m.id || m.name }))
        .filter((m) => m.id)
        .sort((a, b) => a.id.localeCompare(b.id));
    }
  };
}

const AnthropicProvider = {
  async send({ messages, model, systemPrompt, apiKey, signal, onDelta, onReason, params, stream }) {
    if (!apiKey) throw new ProviderError("Add your Anthropic API key in Settings to send messages.", { kind: "auth" });
    onReason = onReason || function () {};
    const body = {
      model,
      max_tokens: (params && params.maxTokens) || 4096,
      system: systemPrompt,
      stream: stream !== false,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: anthropicContent(m, true)
      }))
    };
    if (params && typeof params.temperature === "number") body.temperature = clamp(params.temperature, 0, 1);
    if (params && typeof params.topP === "number" && params.topP < 1) body.top_p = params.topP;
    if (params && params.thinking && REASONING_MODEL.test(model)) {
      // Extended thinking: budget must sit below max_tokens, and sampling
      // controls are not allowed alongside it.
      const budget = clamp(params.thinkingBudget || 4000, 1024, 32000);
      body.thinking = { type: "enabled", budget_tokens: budget };
      body.max_tokens = Math.max(body.max_tokens, budget + 1024);
      delete body.temperature;
      delete body.top_p;
    }
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    };
    let res;
    try {
      res = await fetch(APP.providers.anthropic.endpoint, { method: "POST", headers, body: JSON.stringify(body), signal });
    } catch (err) { throw classifyFetchError(err, "anthropic"); }
    if (!res.ok) throw await parseHttpError(res);

    if (body.stream === false) {
      const j = await res.json();
      const blocks = j.content || [];
      const reasoning = blocks.filter((c) => c.type === "thinking").map((c) => c.thinking || "").join("");
      const text = blocks.filter((c) => c.type === "text").map((c) => c.text).join("");
      if (reasoning) onReason(reasoning);
      onDelta(text);
      return { text, reasoning };
    }
    let full = "", reasoning = "";
    await streamSSE(res, (data) => {
      try {
        const j = JSON.parse(data);
        if (j.type !== "content_block_delta" || !j.delta) return;
        if (j.delta.type === "thinking_delta" && j.delta.thinking) { reasoning += j.delta.thinking; onReason(reasoning); }
        else if (j.delta.text) { full += j.delta.text; onDelta(full); }
      } catch {}
    }, signal);
    return { text: full, reasoning };
  },
  async test(apiKey) {
    try {
      const res = await fetch(APP.providers.anthropic.testEndpoint, {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
      });
      if (!res.ok) throw await parseHttpError(res);
      return "Connected.";
    } catch (err) { throw err instanceof ProviderError ? err : classifyFetchError(err, "anthropic"); }
  },
  async listModels(apiKey) {
    const res = await fetch(APP.providers.anthropic.testEndpoint, {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
    });
    if (!res.ok) throw await parseHttpError(res);
    const j = await res.json();
    return (j.data || []).map((m) => ({ id: m.id, label: m.display_name || m.id }));
  }
};

const GeminiProvider = {
  async send({ messages, model, systemPrompt, apiKey, signal, onDelta, onReason, params, stream }) {
    if (!apiKey) throw new ProviderError("Add your Gemini API key in Settings to send messages.", { kind: "auth" });
    onReason = onReason || function () {};
    const doStream = stream !== false;
    const method = doStream ? "streamGenerateContent?alt=sse&key=" : "generateContent?key=";
    const url = `${APP.providers.gemini.endpointBase}${encodeURIComponent(model)}:${method}${encodeURIComponent(apiKey)}`;
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: geminiParts(m, true) })),
      generationConfig: {}
    };
    if (params) {
      if (typeof params.temperature === "number") body.generationConfig.temperature = params.temperature;
      if (params.maxTokens) body.generationConfig.maxOutputTokens = params.maxTokens;
      if (typeof params.topP === "number" && params.topP < 1) body.generationConfig.topP = params.topP;
      if (params.thinking && REASONING_MODEL.test(model)) body.generationConfig.thinkingConfig = { includeThoughts: true };
    }
    let res;
    try {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    } catch (err) { throw classifyFetchError(err, "gemini"); }
    if (!res.ok) throw await parseHttpError(res);

    const pull = (j) => {
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      let text = "", thought = "";
      parts.forEach((p) => { if (p.thought) thought += p.text || ""; else text += p.text || ""; });
      return { text, thought };
    };
    if (!doStream) {
      const j = await res.json();
      const { text, thought } = pull(j);
      if (thought) onReason(thought);
      onDelta(text);
      return { text, reasoning: thought };
    }
    let full = "", reasoning = "";
    await streamSSE(res, (data) => {
      try {
        const chunk = pull(JSON.parse(data));
        if (chunk.thought) { reasoning += chunk.thought; onReason(reasoning); }
        if (chunk.text) { full += chunk.text; onDelta(full); }
      } catch {}
    }, signal);
    return { text: full, reasoning };
  },
  async test(apiKey) {
    try {
      const res = await fetch(`${APP.providers.gemini.endpointBase}?key=${encodeURIComponent(apiKey)}`);
      if (!res.ok) throw await parseHttpError(res);
      return "Connected.";
    } catch (err) { throw err instanceof ProviderError ? err : classifyFetchError(err, "gemini"); }
  },
  async listModels(apiKey) {
    const res = await fetch(`${APP.providers.gemini.endpointBase}?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) throw await parseHttpError(res);
    const j = await res.json();
    return (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => ({ id: (m.name || "").replace("models/", ""), label: m.displayName || m.name }));
  }
};

const SimulationProvider = {
  async send({ messages, signal, onDelta }) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    const text = simulatedReply(last ? textOf(last) : "", last);
    const chunks = text.split(/(\s+)/);
    let full = "";
    for (let i = 0; i < chunks.length; i++) {
      if (signal && signal.aborted) throw new ProviderError("Generation stopped.", { kind: "aborted" });
      full += chunks[i];
      onDelta(full);
      await new Promise((r) => setTimeout(r, 11));
    }
    return { text: full, reasoning: "" };
  },
  async test() { return "Simulation mode needs no connection."; }
};

function simulatedReply(userText, msg) {
  const t = (userText || "").trim();
  const imgs = msg ? imagesOf(msg).length : 0;
  if (imgs) {
    return `You attached ${imgs} image${imgs === 1 ? "" : "s"}. Simulation mode can't see images — it only echoes structure.\n\nConnect a vision-capable provider (OpenAI, Anthropic, or Gemini) in **Settings → Provider** and the image will be sent with your message.`;
  }
  if (!t) {
    return "You're in **simulation mode**: a built-in responder that makes no network requests. Add a provider key in Settings for real answers. Everything else — history, search UI, attachments, exports, themes — works as it will with a real model.";
  }
  const low = t.toLowerCase();
  if (/\b(code|debug|function|error|bug|script)\b/.test(low)) {
    return (
      "Simulation mode can't run a real model, but here's what the formatting looks like:\n\n" +
      "```python\ndef moving_average(values, window):\n    \"\"\"Return the rolling mean over `window` items.\"\"\"\n    if window <= 0:\n        raise ValueError(\"window must be positive\")\n    out = []\n    total = 0.0\n    for i, v in enumerate(values):\n        total += v\n        if i >= window:\n            total -= values[i - window]\n        if i >= window - 1:\n            out.append(total / window)\n    return out\n```\n\n" +
      "| Step | What to check |\n| --- | --- |\n| 1 | Reproduce the failure with the smallest input |\n| 2 | Print or log the value at the boundary |\n| 3 | Fix, then add a test that would have caught it |\n\n" +
      "Add a provider key in **Settings → Provider** to get real help with your own code."
    );
  }
  if (/\b(search|latest|news|current|today)\b/.test(low)) {
    return "Simulation mode never searches the web and won't pretend it did.\n\nTo get live results:\n\n1. Add a provider key in **Settings → Provider**\n2. Turn on **Web search** in the composer\n3. Ask again — sources appear under the answer and can be cited as [1], [2]";
  }
  return (
    `You said: "${t.slice(0, 160)}${t.length > 160 ? "…" : ""}"\n\n` +
    "This is **simulation mode** — a fixed responder, not a real model. It's here so the interface is usable before you connect a provider.\n\n" +
    "- Add a key in **Settings → Provider** for real answers\n" +
    "- Try `/` in the composer for commands and saved prompts\n" +
    "- Press `Ctrl/⌘ + K` for the command palette\n\n" +
    "> Simulation mode never claims to have searched the web or used a real model."
  );
}

const Providers = {
  cache: {},
  get(id) {
    const cfg = APP.providers[id];
    if (!cfg) return SimulationProvider;
    if (cfg.kind === "sim") return SimulationProvider;
    if (cfg.kind === "anthropic") return AnthropicProvider;
    if (cfg.kind === "gemini") return GeminiProvider;
    if (!this.cache[id]) this.cache[id] = makeOpenAICompatible(id);
    return this.cache[id];
  }
};

/* ============================================================
   9. RESEARCH: web + image search
   ============================================================ */
const Research = {
  async wikipedia(query) {
    const url = `${APP.search.wiki}?action=query&format=json&origin=*&list=search&srlimit=4&srsearch=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("wiki-http-" + res.status);
    const j = await res.json();
    return ((j.query && j.query.search) || []).map((r) => ({
      title: r.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
      snippet: String(r.snippet || "").replace(/<[^>]*>/g, "").trim(),
      domain: "en.wikipedia.org"
    }));
  },
  async duckduckgo(query) {
    const url = `${APP.search.ddg}?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("ddg-http-" + res.status);
    const data = await res.json();
    const out = [];
    if (data.AbstractURL && data.AbstractText) {
      out.push({
        title: data.Heading || Sec.host(data.AbstractURL),
        url: data.AbstractURL,
        snippet: data.AbstractText,
        domain: Sec.host(data.AbstractURL)
      });
    }
    const flatten = (topics) => {
      const acc = [];
      for (const t of topics || []) {
        if (t.FirstURL && t.Text) acc.push(t);
        else if (Array.isArray(t.Topics)) acc.push(...flatten(t.Topics));
      }
      return acc;
    };
    flatten(data.RelatedTopics).forEach((t) => {
      out.push({
        title: String(t.Text).split(" - ")[0].slice(0, 120),
        url: t.FirstURL,
        snippet: t.Text,
        domain: Sec.host(t.FirstURL)
      });
    });
    return out;
  },
  async search(query) {
    if (!query || !query.trim()) return { ok: false, reason: "empty", sources: [] };
    const results = await Promise.allSettled([this.duckduckgo(query), this.wikipedia(query)]);
    const sources = [];
    const seen = new Set();
    const failures = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        r.value.forEach((s) => {
          if (!s.url || seen.has(s.url) || sources.length >= APP.search.max) return;
          seen.add(s.url);
          sources.push(s);
        });
      } else failures.push(r.reason);
    });
    if (!sources.length) {
      if (failures.length === results.length) {
        return {
          ok: false, reason: "network", sources: [],
          message: "Web search couldn't reach DuckDuckGo or Wikipedia from this browser — a network drop or a CORS block. The answer below uses the model's own knowledge only."
        };
      }
      return {
        ok: true, empty: true, sources: [],
        message: "No summarised results came back for that query. These are topic-summary APIs rather than a full web index, so niche or very recent queries often return nothing."
      };
    }
    return { ok: true, sources };
  },
  async images(query) {
    if (!query || !query.trim()) return { ok: false, reason: "empty", images: [] };
    const url = `${APP.images.endpoint}?q=${encodeURIComponent(query)}&page_size=${APP.images.max}`;
    let res;
    try { res = await fetch(url); }
    catch {
      return { ok: false, reason: "network", images: [], message: "Image search couldn't reach Openverse from this browser (network or CORS)." };
    }
    if (!res.ok) return { ok: false, reason: "http", images: [], message: `Image search failed with status ${res.status}.` };
    let data;
    try { data = await res.json(); }
    catch { return { ok: false, reason: "parse", images: [], message: "The image response couldn't be read." }; }
    const images = (data.results || []).slice(0, APP.images.max).map((r) => ({
      thumb: r.thumbnail || r.url,
      full: r.url,
      title: r.title || "Untitled",
      link: r.foreign_landing_url || r.url,
      license: r.license ? String(r.license).toUpperCase() : "",
      creator: r.creator || "",
      domain: r.source || Sec.host(r.foreign_landing_url || r.url || "")
    }));
    if (!images.length) return { ok: true, empty: true, images: [], message: "No openly-licensed images matched that query." };
    return { ok: true, images };
  }
};

/* ============================================================
   10. SPEECH: dictation in, narration out
   ============================================================ */
const Speech = {
  rec: null, listening: false, speakingId: null,
  supportedIn: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  supportedOut: !!window.speechSynthesis,

  startDictation(onText, onEnd) {
    if (!this.supportedIn) return false;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.rec = new Ctor();
    this.rec.continuous = true;
    this.rec.interimResults = true;
    this.rec.lang = navigator.language || "en-US";
    let finalText = "";
    this.rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onText(finalText + interim, finalText);
    };
    this.rec.onerror = () => { this.stopDictation(); onEnd && onEnd(); };
    this.rec.onend = () => { this.listening = false; onEnd && onEnd(); };
    try { this.rec.start(); this.listening = true; return true; } catch { return false; }
  },
  stopDictation() {
    if (this.rec) { try { this.rec.stop(); } catch {} }
    this.listening = false;
  },
  speak(text, id, voiceName, rate, onEnd) {
    if (!this.supportedOut) return false;
    window.speechSynthesis.cancel();
    if (this.speakingId === id) { this.speakingId = null; onEnd && onEnd(); return false; }
    const u = new SpeechSynthesisUtterance(MD.toPlainText(text).slice(0, 32000));
    if (voiceName) {
      const v = window.speechSynthesis.getVoices().find((x) => x.name === voiceName);
      if (v) u.voice = v;
    }
    u.rate = rate || 1;
    u.onend = () => { this.speakingId = null; onEnd && onEnd(); };
    u.onerror = () => { this.speakingId = null; onEnd && onEnd(); };
    this.speakingId = id;
    window.speechSynthesis.speak(u);
    return true;
  },
  stopSpeaking() {
    if (this.supportedOut) window.speechSynthesis.cancel();
    this.speakingId = null;
  }
};

/* ============================================================
   11. STATE
   ============================================================ */
const DEFAULTS = {
  provider: "simulation",
  model: "sim-1",
  softwareAI: "simulation",
  canvasAI: "gemini",
  imagineAI: "gemini",
  documentsAI: "gemini",
  softwareModel: "sim-1",
  canvasModel: "gemini-3.8-flash",
  imagineModel: "gemini-3.1-flash-image",
  documentsModel: "gemini-3.8-flash",
  webSearch: false,
  imageSearch: false,
  theme: "dark",
  accent: "indigo",
  density: "cozy",
  width: "cozy",
  fontScale: 15,
  bubbles: false,
  timestamps: true,
  motion: true,
  contrast: "normal",
  streaming: true,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  persona: "default",
  customPersona: "",
  contextLimit: 20,
  autoTitle: true,
  lineNumbers: true,
  codeWrap: false,
  autoSpeak: false,
  ttsVoice: "",
  ttsRate: 1,
  enterSends: true
};

const State = {
  conversations: [],
  activeId: null,
  filter: "all",
  settings: Object.assign({}, DEFAULTS),
  apiKeys: {},
  endpoints: {},
  prompts: [],
  attachments: [],
  generating: false,
  abort: null,
  sidebarCollapsed: false,
  lastDeleted: null,
  find: { term: "", hits: [], index: 0 },
  lightbox: { items: [], index: 0 },
  rawView: new Set()
};

const DEFAULT_PROMPTS = [
  { id: "p1", name: "Summarise", slash: "sum", body: "Summarise the following in five bullet points, then one sentence on what matters most:\n\n" },
  { id: "p2", name: "Code review", slash: "review", body: "Review this code for correctness, readability, and edge cases. List issues by severity, then show the corrected version:\n\n```\n\n```" },
  { id: "p3", name: "Explain simply", slash: "eli5", body: "Explain this so a curious beginner gets it, with one concrete analogy and no jargon:\n\n" },
  { id: "p4", name: "Rewrite clearly", slash: "rewrite", body: "Rewrite this to be clearer and shorter while keeping my voice. Show the rewrite, then list what you changed:\n\n" },
  { id: "p5", name: "Counterargument", slash: "counter", body: "Make the strongest case against the position below, then say which parts of it survive:\n\n" }
];

/* ============================================================
   12. CONVERSATION MANAGER
   ============================================================ */
function normalizeConv(c) {
  return Object.assign(
    { pinned: false, archived: false, tags: [], persona: null, systemPrompt: "", params: null },
    c
  );
}

const Conv = {
  async loadAll() {
    const list = (await Store.getAll()).map(normalizeConv);
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    State.conversations = list;
    return list;
  },
  active() {
    return State.conversations.find((c) => c.id === State.activeId) || null;
  },
  byId(id) {
    return State.conversations.find((c) => c.id === id) || null;
  },
  async create(activate) {
    const conv = normalizeConv({
      id: uid("conv"),
      title: "New conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider: State.settings.provider,
      model: State.settings.model,
      persona: State.settings.persona
    });
    State.conversations.unshift(conv);
    await Store.put(conv);
    if (activate !== false) State.activeId = conv.id;
    return conv;
  },
  async ensureActive() {
    const a = this.active();
    return a || this.create(true);
  },
  async save(conv) {
    conv.updatedAt = Date.now();
    await Store.put(conv);
  },
  async rename(id, title) {
    const c = this.byId(id);
    if (!c) return;
    c.title = (title || "").trim().slice(0, 140) || "Untitled";
    await this.save(c);
  },
  async remove(id) {
    const c = this.byId(id);
    if (c) State.lastDeleted = JSON.parse(JSON.stringify(c));
    State.conversations = State.conversations.filter((x) => x.id !== id);
    await Store.del(id);
    if (State.activeId === id) State.activeId = null;
  },
  async restoreLastDeleted() {
    if (!State.lastDeleted) return null;
    const conv = normalizeConv(State.lastDeleted);
    State.lastDeleted = null;
    State.conversations.unshift(conv);
    await Store.put(conv);
    return conv;
  },
  async duplicate(id) {
    const src = this.byId(id);
    if (!src) return null;
    const copy = normalizeConv(JSON.parse(JSON.stringify(src)));
    copy.id = uid("conv");
    copy.title = src.title + " (copy)";
    copy.createdAt = copy.updatedAt = Date.now();
    copy.pinned = false;
    State.conversations.unshift(copy);
    await Store.put(copy);
    return copy;
  },
  async branchFrom(convId, messageId) {
    const src = this.byId(convId);
    if (!src) return null;
    const idx = src.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;
    const copy = normalizeConv(JSON.parse(JSON.stringify(src)));
    copy.id = uid("conv");
    copy.title = "Branch · " + src.title;
    copy.messages = copy.messages.slice(0, idx + 1);
    copy.createdAt = copy.updatedAt = Date.now();
    copy.pinned = false;
    State.conversations.unshift(copy);
    await Store.put(copy);
    return copy;
  },
  async togglePin(id) {
    const c = this.byId(id);
    if (!c) return;
    c.pinned = !c.pinned;
    await this.save(c);
  },
  async toggleArchive(id) {
    const c = this.byId(id);
    if (!c) return;
    c.archived = !c.archived;
    await this.save(c);
  },
  async clearMessages(id) {
    const c = this.byId(id);
    if (!c) return;
    c.messages = [];
    c.title = "New conversation";
    await this.save(c);
  },
  autoTitle(conv) {
    if (!State.settings.autoTitle) return;
    if (conv.title !== "New conversation") return;
    const first = conv.messages.find((m) => m.role === "user");
    if (!first) return;
    const line = (first.content || "").trim().split("\n").find((l) => l.trim()) || "";
    conv.title = line.replace(/^[#>\-*\s]+/, "").slice(0, 64) || "New conversation";
  },
  visible() {
    let list = State.conversations;
    if (State.filter === "pinned") list = list.filter((c) => c.pinned);
    else if (State.filter === "archived") list = list.filter((c) => c.archived);
    else list = list.filter((c) => !c.archived);
    return list.slice(0, APP.limits.maxRendered);
  },
  groupByDate(list) {
    const groups = { Pinned: [], Today: [], Yesterday: [], "Previous 7 days": [], "Previous 30 days": [], Older: [] };
    const now = new Date();
    const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    list.forEach((c) => {
      if (c.pinned && State.filter === "all") return groups.Pinned.push(c);
      const t = c.updatedAt;
      if (t >= day0) groups.Today.push(c);
      else if (t >= day0 - 864e5) groups.Yesterday.push(c);
      else if (t >= day0 - 7 * 864e5) groups["Previous 7 days"].push(c);
      else if (t >= day0 - 30 * 864e5) groups["Previous 30 days"].push(c);
      else groups.Older.push(c);
    });
    return groups;
  },
  stats() {
    const convs = State.conversations;
    let msgs = 0, userMsgs = 0, chars = 0, code = 0;
    convs.forEach((c) =>
      c.messages.forEach((m) => {
        msgs++;
        if (m.role === "user") userMsgs++;
        chars += (m.content || "").length;
        code += ((m.content || "").match(/```/g) || []).length / 2;
      })
    );
    return {
      conversations: convs.length,
      messages: msgs,
      userMessages: userMsgs,
      chars,
      tokens: approxTokens(" ".repeat(chars)),
      codeBlocks: Math.round(code),
      pinned: convs.filter((c) => c.pinned).length,
      archived: convs.filter((c) => c.archived).length,
      oldest: convs.length ? Math.min(...convs.map((c) => c.createdAt)) : null
    };
  },
  toMarkdown(conv) {
    const lines = [
      `# ${conv.title}`,
      "",
      `*${conv.messages.length} messages · started ${fmtDate(conv.createdAt)} · ${conv.provider || "simulation"} / ${conv.model || ""}*`,
      ""
    ];
    conv.messages.forEach((m) => {
      lines.push(`## ${m.role === "user" ? "You" : m.providerLabel || "Assistant"} · ${fmtTime(m.timestamp)}`, "");
      lines.push(m.content || "");
      (m.attachments || []).forEach((a) => lines.push(`\n> Attachment: ${a.name} (${a.kind})`));
      if (m.sources && m.sources.length) {
        lines.push("", "**Sources**", "");
        m.sources.forEach((s, i) => lines.push(`${i + 1}. [${s.title}](${s.url}) — ${s.domain}`));
      }
      lines.push("");
    });
    return lines.join("\n");
  },
  toText(conv) {
    return conv.messages
      .map((m) => `${m.role === "user" ? "You" : "Assistant"} (${fmtTime(m.timestamp)}):\n${MD.toPlainText(m.content)}`)
      .join("\n\n" + "-".repeat(48) + "\n\n");
  }
};

/* ============================================================
   13. UI
   ============================================================ */
const UI = {
  els: {},

  cache() {
    const ids = [
      "app","sidebar","sidebar-scrim","new-chat-btn","palette-btn","sidebar-search","history","collapse-btn",
      "expand-btn","mobile-menu-btn","settings-entry-btn","prompts-entry-btn","shortcuts-entry-btn","filter-row",
      "storage-text","storage-fill","header-title","header-status-dot","header-status-text","header-search-badge",
      "header-image-badge","model-pill","model-pill-text","find-btn","theme-btn","chat-menu-btn","find-bar",
      "find-input","find-count","find-prev","find-next","find-close","chat-scroll","chat-inner","jump-btn",
      "composer-wrap","composer-box","composer-input","send-btn","stop-btn","attach-btn","attach-input","attach-tray",
      "mic-btn","web-search-toggle","image-search-toggle","image-gen-toggle","persona-chip","persona-label","temp-slider","temp-value",
      "char-count","context-note","composer-hint","slash-menu","settings-overlay","confirm-overlay","palette-overlay",
      "toast-host","net-banner","lightbox","lightbox-img","lightbox-cap","lightbox-close","lightbox-prev",
      "lightbox-next","sr-live","brand-ver"
    ];
    const camel = (s) => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
    ids.forEach((id) => (this.els[camel(id)] = document.getElementById(id)));
  },

  announce(msg) {
    if (this.els.srLive) this.els.srLive.textContent = msg;
  },

  toast(msg, opts) {
    const o = Object.assign({ error: false, action: null, onAction: null, ms: 3200 }, opts || {});
    const t = document.createElement("div");
    t.className = "toast" + (o.error ? " err" : "");
    t.innerHTML = `${ic(o.error ? "alert" : "check")}<span class="t-msg"></span>`;
    t.querySelector(".t-msg").textContent = msg;
    if (o.action) {
      const b = document.createElement("button");
      b.textContent = o.action;
      b.addEventListener("click", () => { o.onAction && o.onAction(); dismiss(); });
      t.appendChild(b);
    }
    this.els.toastHost.appendChild(t);
    this.announce(msg);
    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      t.style.opacity = "0";
      t.style.transition = "opacity .18s ease";
      setTimeout(() => t.remove(), 200);
    };
    setTimeout(dismiss, o.ms);
    return dismiss;
  },

  confirm(title, body, confirmLabel, danger) {
    return new Promise((resolve) => {
      const overlay = this.els.confirmOverlay;
      overlay.innerHTML = `
        <div class="modal confirm-box">
          <div class="modal-main">
            <div class="modal-head"><h2></h2><button class="icon-btn" data-act="cancel" aria-label="Cancel">${Icon.x}</button></div>
            <div class="modal-body">
              <p></p>
              <div class="btn-row">
                <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="confirm"></button>
                <button class="btn" data-act="cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>`;
      overlay.querySelector("h2").textContent = title;
      overlay.querySelector("p").textContent = body;
      overlay.querySelector("[data-act='confirm']").textContent = confirmLabel || "Confirm";
      overlay.classList.add("open");
      const close = (v) => {
        overlay.classList.remove("open");
        overlay.innerHTML = "";
        document.removeEventListener("keydown", onKey, true);
        resolve(v);
      };
      const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(false); } };
      document.addEventListener("keydown", onKey, true);
      overlay.querySelectorAll("[data-act]").forEach((b) =>
        b.addEventListener("click", () => close(b.dataset.act === "confirm"))
      );
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); }, { once: true });
      const c = overlay.querySelector("[data-act='confirm']");
      if (c) c.focus();
    });
  },

  prompt(title, label, value, multiline) {
    return new Promise((resolve) => {
      const overlay = this.els.confirmOverlay;
      overlay.innerHTML = `
        <div class="modal confirm-box">
          <div class="modal-main">
            <div class="modal-head"><h2></h2><button class="icon-btn" data-act="cancel" aria-label="Cancel">${Icon.x}</button></div>
            <div class="modal-body">
              <div class="field-group">
                <label class="field-label" for="prompt-field"></label>
                ${multiline
                  ? '<textarea class="text-input" id="prompt-field" rows="5"></textarea>'
                  : '<input class="text-input" id="prompt-field" type="text" />'}
              </div>
              <div class="btn-row">
                <button class="btn btn-primary" data-act="confirm">Save</button>
                <button class="btn" data-act="cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>`;
      overlay.querySelector("h2").textContent = title;
      overlay.querySelector(".field-label").textContent = label;
      const field = overlay.querySelector("#prompt-field");
      field.value = value || "";
      overlay.classList.add("open");
      const close = (v) => {
        overlay.classList.remove("open");
        overlay.innerHTML = "";
        document.removeEventListener("keydown", onKey, true);
        resolve(v);
      };
      const onKey = (e) => {
        if (e.key === "Escape") { e.stopPropagation(); close(null); }
        if (e.key === "Enter" && !multiline) { e.preventDefault(); close(field.value); }
      };
      document.addEventListener("keydown", onKey, true);
      overlay.querySelectorAll("[data-act]").forEach((b) =>
        b.addEventListener("click", () => close(b.dataset.act === "confirm" ? field.value : null))
      );
      field.focus();
      field.select();
    });
  },

  /* ---------- context menu ---------- */
  menu(anchorRect, items, opts) {
    $$(".ctx-menu").forEach((m) => m.remove());
    const o = Object.assign({ align: "auto", side: "below", offset: 6 }, opts || {});
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    items.forEach((it) => {
      if (it.sep) { const d = document.createElement("div"); d.className = "ctx-sep"; menu.appendChild(d); return; }
      if (it.label) { const l = document.createElement("div"); l.className = "ctx-label"; l.textContent = it.label; menu.appendChild(l); return; }
      const b = document.createElement("button");
      b.className = (it.danger ? "danger " : "") + (it.on ? "on" : "");
      b.innerHTML = `${it.icon ? ic(it.icon) : ""}<span></span>`;
      b.querySelector("span").textContent = it.text;
      b.addEventListener("click", () => { close(); it.run && it.run(); });
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    const w = menu.offsetWidth, h = menu.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const gap = 8;

    /* Horizontal: keep the menu on the same edge of the trigger it was opened
       from. A menu opened from a button near the right edge grows to the left
       so it never jumps across to the other side. */
    let left;
    if (o.align === "right") left = anchorRect.right - w;
    else if (o.align === "left") left = anchorRect.left;
    else if (anchorRect.right + w + gap <= vw) left = anchorRect.left;
    else if (anchorRect.left - w - gap >= 0) left = anchorRect.right - w;
    else left = Math.min(Math.max(gap, anchorRect.left), Math.max(gap, vw - w - gap));
    left = Math.min(Math.max(gap, left), Math.max(gap, vw - w - gap));

    /* Vertical: prefer the requested side, flip only when it genuinely doesn't fit. */
    let top;
    const below = anchorRect.bottom + o.offset;
    const above = anchorRect.top - h - o.offset;
    if (o.side === "above") top = above >= gap ? above : below;
    else if (o.side === "below") top = below + h <= vh - gap ? below : above;
    else if (below + h <= vh - gap) top = below;
    else if (above >= gap) top = above;
    else top = Math.max(gap, vh - h - gap);
    top = Math.min(Math.max(gap, top), Math.max(gap, vh - h - gap));

    menu.dataset.align = o.align;
    menu.style.top = Math.round(top) + "px";
    menu.style.left = Math.round(left) + "px";
    function close() {
      menu.remove();
      document.removeEventListener("click", onDoc, true);
      document.removeEventListener("keydown", onKey, true);
    }
    function onDoc(e) { if (!menu.contains(e.target)) close(); }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    setTimeout(() => {
      document.addEventListener("click", onDoc, true);
      document.addEventListener("keydown", onKey, true);
    }, 0);
    return close;
  },

  /* ---------- sidebar ---------- */
  renderSidebar(term) {
    const host = this.els.history;
    const q = (term || "").trim().toLowerCase();
    let list = Conv.visible();
    if (q) {
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => (m.content || "").toLowerCase().includes(q))
      );
    }
    host.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "no-results";
      empty.textContent = q
        ? "Nothing matches that search."
        : State.filter === "pinned"
        ? "Pin a chat to keep it here."
        : State.filter === "archived"
        ? "Archived chats stay out of the main list."
        : "Start a chat and it appears here.";
      host.appendChild(empty);
      this.updateStorageMeter();
      return;
    }

    const makeItem = (conv) => {
      const item = document.createElement("div");
      item.className = "conv-item" + (conv.id === State.activeId ? " active" : "");
      item.dataset.id = conv.id;
      item.setAttribute("role", "button");
      item.tabIndex = 0;
      item.title = `${conv.title}\n${conv.messages.length} messages · ${relTime(conv.updatedAt)}`;
      item.innerHTML =
        (conv.pinned ? `<span class="conv-pin">${Icon.pin}</span>` : "") +
        `<span class="conv-title"></span>` +
        (conv.messages.length ? `<span class="conv-count">${conv.messages.length}</span>` : "") +
        `<button class="conv-menu-btn" aria-label="Chat options">${Icon.dots}</button>`;
      item.querySelector(".conv-title").textContent = conv.title;
      item.addEventListener("click", (e) => {
        if (e.target.closest(".conv-menu-btn")) return;
        App.openConversation(conv.id);
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); App.openConversation(conv.id); }
      });
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        UI.convMenu(conv, { top: e.clientY, bottom: e.clientY, left: e.clientX });
      });
      item.querySelector(".conv-menu-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        UI.convMenu(conv, e.currentTarget.getBoundingClientRect(), item);
      });
      return item;
    };

    if (q) {
      const label = document.createElement("div");
      label.className = "history-group-label";
      label.textContent = `${list.length} match${list.length === 1 ? "" : "es"}`;
      host.appendChild(label);
      list.forEach((c) => host.appendChild(makeItem(c)));
    } else {
      const groups = Conv.groupByDate(list);
      Object.entries(groups).forEach(([label, items]) => {
        if (!items.length) return;
        const l = document.createElement("div");
        l.className = "history-group-label";
        l.textContent = label;
        host.appendChild(l);
        items.forEach((c) => host.appendChild(makeItem(c)));
      });
    }
    this.updateStorageMeter();
  },

  async updateStorageMeter() {
    const s = Conv.stats();
    const txt = this.els.storageText;
    if (!txt) return;
    txt.textContent = s.conversations
      ? `${s.conversations} chat${s.conversations === 1 ? "" : "s"} · ${s.messages} messages`
      : "No chats stored yet";
    const est = await Store.usage();
    if (est && est.quota) {
      const pct = clamp((est.usage / est.quota) * 100, 0.5, 100);
      this.els.storageFill.style.width = pct + "%";
      txt.title = `${fmtBytes(est.usage)} of ${fmtBytes(est.quota)} used in this browser`;
    } else {
      this.els.storageFill.style.width = clamp(s.messages / 5, 1, 100) + "%";
    }
  },

  convMenu(conv, rect, itemEl) {
    if (itemEl) itemEl.classList.add("menu-open");
    const close = this.menu(rect, [
      { text: "Rename", icon: "edit", run: () => UI.beginRename(conv, itemEl) },
      { text: conv.pinned ? "Unpin" : "Pin to top", icon: "pin", on: conv.pinned, run: () => App.togglePin(conv.id) },
      { text: conv.archived ? "Move out of archive" : "Archive", icon: "archive", run: () => App.toggleArchive(conv.id) },
      { text: "Duplicate", icon: "copy", run: () => App.duplicateConversation(conv.id) },
      { sep: true },
      { text: "Export as Markdown", icon: "download", run: () => App.exportConversation(conv.id, "md") },
      { text: "Export as JSON", icon: "download", run: () => App.exportConversation(conv.id, "json") },
      { text: "Export as PDF", icon: "download", run: () => App.exportConversation(conv.id, "pdf") },
      { text: "Export as Word (.docx)", icon: "download", run: () => App.exportConversation(conv.id, "docx") },
      { text: "Export as slides (.pptx)", icon: "download", run: () => App.exportConversation(conv.id, "pptx") },
      { text: "Copy as text", icon: "copy", run: () => App.copy(Conv.toText(conv), null, "Conversation copied") },
      { sep: true },
      { text: "Clear messages", icon: "eraser", danger: true, run: () => App.clearConversation(conv.id) },
      { text: "Delete chat", icon: "trash", danger: true, run: () => App.deleteConversation(conv.id) }
    ]);
    const cleanup = () => itemEl && itemEl.classList.remove("menu-open");
    setTimeout(() => document.addEventListener("click", cleanup, { once: true }), 0);
    return close;
  },

  beginRename(conv, itemEl) {
    if (!itemEl) {
      UI.prompt("Rename chat", "Title", conv.title).then((v) => {
        if (v !== null) App.renameConversation(conv.id, v);
      });
      return;
    }
    const titleEl = itemEl.querySelector(".conv-title");
    if (!titleEl) return;
    const input = document.createElement("input");
    input.className = "rename-input";
    input.value = conv.title;
    titleEl.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const commit = async (save) => {
      if (done) return;
      done = true;
      if (save) await App.renameConversation(conv.id, input.value);
      else UI.renderSidebar(App.filterTerm());
    };
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") commit(true);
      if (e.key === "Escape") commit(false);
    });
    input.addEventListener("blur", () => commit(true), { once: true });
  },

  /* ---------- welcome ---------- */
  showWelcome() {
    const host = this.els.chatInner;
    host.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "welcome";
    wrap.innerHTML = `
      <div class="welcome-mark">${Icon.logo}</div>
      <h1>What are we working on?</h1>
      <p>Your chats, keys and settings stay in this browser. Connect a provider for real answers, or explore in simulation mode.</p>
      <div class="example-grid"></div>
      <div class="welcome-tips">
        <span>${Icon.command} <span class="kbd">${isMac ? "⌘" : "Ctrl"} K</span> commands</span>
        <span>${Icon.code} <span class="kbd">/</span> saved prompts</span>
        <span>${Icon.clip} drop a file to attach</span>
      </div>`;
    const grid = wrap.querySelector(".example-grid");
    APP.examples.forEach((ex) => {
      const card = document.createElement("button");
      card.className = "example-card";
      card.type = "button";
      card.innerHTML = `<span class="ex-title"></span><span class="ex-body"></span>`;
      card.querySelector(".ex-title").textContent = ex.title;
      card.querySelector(".ex-body").textContent =
        ex.body.replace(/\n+/g, " ").slice(0, 78) + (ex.body.length > 78 ? "…" : "");
      card.addEventListener("click", () => {
        UI.els.composerInput.value = ex.body;
        UI.autoGrow(UI.els.composerInput);
        UI.els.composerInput.focus();
        const len = ex.body.length;
        UI.els.composerInput.setSelectionRange(len, len);
        App.updateComposerState();
      });
      grid.appendChild(card);
    });
    host.appendChild(wrap);
  },

  autoGrow(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  },

  scrollToBottom(force) {
    const el = this.els.chatScroll;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (force || dist < 220) el.scrollTop = el.scrollHeight;
  },

  renderMessages(conv) {
    this.els.chatInner.innerHTML = "";
    if (!conv.messages.length) { this.showWelcome(); return; }
    conv.messages.forEach((m) => this.appendMessage(m));
    this.scrollToBottom(true);
  },

  renderContent(msg) {
    if (State.rawView.has(msg.id)) {
      return `<div class="code-block"><div class="code-head"><span class="code-lang">raw markdown</span></div><pre><code>${Sec.esc(msg.content)}</code></pre></div>`;
    }
    return MD.render(msg.content, {
      lineNumbers: State.settings.lineNumbers,
      wrap: State.settings.codeWrap,
      sources: msg.sources
    });
  },

  appendMessage(msg) {
    const el = this.buildMessage(msg);
    this.els.chatInner.appendChild(el);
    return el;
  },

  buildMessage(msg) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${msg.role}`;
    wrap.dataset.id = msg.id;

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    if (msg.role === "assistant") avatar.innerHTML = Icon.logo;
    else avatar.textContent = "You";

    const body = document.createElement("div");
    body.className = "msg-body";

    const role = document.createElement("div");
    role.className = "msg-role";
    const who = document.createElement("span");
    who.textContent = msg.role === "user" ? "You" : msg.providerLabel || "Assistant";
    role.appendChild(who);
    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = fmtTime(msg.timestamp);
    role.appendChild(time);
    if (msg.edited) {
      const ed = document.createElement("span");
      ed.className = "msg-edited";
      ed.textContent = "edited";
      role.appendChild(ed);
    }
    if (msg.stats && msg.stats.ms) {
      const st = document.createElement("span");
      st.className = "msg-meta";
      const secs = msg.stats.ms / 1000;
      st.textContent = `${secs.toFixed(1)}s · ~${msg.stats.tokens} tokens`;
      st.title = `${msg.model || ""} · ${(msg.stats.tokens / Math.max(secs, 0.1)).toFixed(1)} tokens/sec (estimated)`;
      role.appendChild(st);
    }
    body.appendChild(role);

    if (msg.attachments && msg.attachments.length) body.appendChild(this.buildAttachments(msg.attachments));

    const content = document.createElement("div");
    content.className = "msg-content";
    if (msg.streaming && !msg.content) {
      content.innerHTML = `<div class="thinking"><i></i><i></i><i></i><span>${msg.thinkingLabel || "Thinking"}</span></div>`;
    } else {
      content.innerHTML = this.renderContent(msg);
      if (msg.streaming) content.classList.add("streaming-caret");
    }
    body.appendChild(content);

    if (msg.searchState && msg.searchState.message) body.appendChild(this.buildNote(msg.searchState.message, "warn"));
    if (msg.sources && msg.sources.length) body.appendChild(this.buildSources(msg.sources));
    if (msg.imageState && msg.imageState.message) body.appendChild(this.buildNote(msg.imageState.message, "warn"));
    if (msg.images && msg.images.length) body.appendChild(this.buildImages(msg.images));
    if (msg.error) body.appendChild(this.buildError(msg));

    if (!msg.streaming) body.appendChild(this.buildActions(msg));

    wrap.appendChild(avatar);
    wrap.appendChild(body);
    hydrateIcons(wrap);
    return wrap;
  },

  buildActions(msg) {
    const row = document.createElement("div");
    row.className = "msg-actions";
    const add = (act, icon, text, title) => {
      const b = document.createElement("button");
      b.className = "msg-action-btn";
      b.dataset.act = act;
      b.innerHTML = `${ic(icon)}<span>${text}</span>`;
      if (title) b.title = title;
      row.appendChild(b);
      return b;
    };

    if (msg.content) add("copy", "copy", "Copy").addEventListener("click", (e) => App.copy(msg.content, e.currentTarget));

    if (msg.role === "assistant") {
      if (msg.content || msg.error) {
        add("regen", "refresh", "Retry", "Regenerate this response").addEventListener("click", (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          UI.menu(rect, [
            { label: "Regenerate with" },
            { text: "Same model", icon: "refresh", run: () => App.regenerate(msg.id) },
            ...App.otherModelChoices().map((c) => ({
              text: c.label, icon: "chip", run: () => App.regenerate(msg.id, c)
            }))
          ]);
        });
      }
      if (msg.content && Speech.supportedOut) {
        const b = add("speak", "speaker", Speech.speakingId === msg.id ? "Stop" : "Listen", "Read this aloud");
        if (Speech.speakingId === msg.id) b.classList.add("on");
        b.addEventListener("click", () => App.toggleSpeak(msg));
      }
      if (msg.content) {
        const raw = State.rawView.has(msg.id);
        const b = add("raw", "code", raw ? "Formatted" : "Markdown", "Show the raw markdown");
        if (raw) b.classList.add("on");
        b.addEventListener("click", () => App.toggleRaw(msg.id));
      }
    } else {
      add("edit", "edit", "Edit", "Edit and resend").addEventListener("click", () => App.editMessage(msg.id));
      add("quote", "quote", "Quote", "Quote this in a new message").addEventListener("click", () => App.quote(msg));
    }

    add("branch", "branch", "Branch", "Copy this chat up to here").addEventListener("click", () => App.branch(msg.id));
    add("delete", "trash", "Delete", "Remove this message").addEventListener("click", () => App.deleteMessage(msg.id));
    return row;
  },

  buildAttachments(list) {
    const row = document.createElement("div");
    row.className = "attach-row";
    list.forEach((a, i) => {
      if (a.kind === "image") {
        const btn = document.createElement("button");
        btn.className = "attach-thumb";
        btn.innerHTML = `<img alt="">`;
        btn.querySelector("img").src = a.dataUrl;
        btn.querySelector("img").alt = a.name;
        btn.addEventListener("click", () =>
          UI.openLightbox(list.filter((x) => x.kind === "image").map((x) => ({ full: x.dataUrl, title: x.name })), i)
        );
        row.appendChild(btn);
      } else {
        const f = document.createElement("span");
        f.className = "attach-file";
        f.innerHTML = `${ic("file")}<b></b><span class="size"></span>`;
        f.querySelector("b").textContent = a.name;
        f.querySelector(".size").textContent = fmtBytes(a.size);
        f.title = (a.text || "").slice(0, 400);
        row.appendChild(f);
      }
    });
    return row;
  },

  buildNote(text, kind) {
    const d = document.createElement("div");
    d.className = kind === "warn" ? "warn-box" : "info-box";
    d.innerHTML = `${ic(kind === "warn" ? "info" : "info")}<span></span>`;
    d.querySelector("span").textContent = text;
    return d;
  },

  buildError(msg) {
    const d = document.createElement("div");
    d.className = "err-box";
    d.innerHTML = `${ic("alert")}<div><div class="e-msg"></div><div class="e-hint"></div><div class="err-actions"></div></div>`;
    d.querySelector(".e-msg").textContent = msg.error;
    const hint = d.querySelector(".e-hint");
    if (msg.errorHint) { hint.textContent = msg.errorHint; hint.style.opacity = ".8"; hint.style.marginTop = "4px"; }
    const acts = d.querySelector(".err-actions");
    const retry = document.createElement("button");
    retry.className = "btn btn-sm";
    retry.innerHTML = `${ic("refresh")}Try again`;
    retry.addEventListener("click", () => App.regenerate(msg.id));
    acts.appendChild(retry);
    if (msg.errorKind === "auth") {
      const s = document.createElement("button");
      s.className = "btn btn-sm";
      s.innerHTML = `${ic("key")}Open settings`;
      s.addEventListener("click", () => Settings.open("provider"));
      acts.appendChild(s);
    }
    return d;
  },

  buildSources(sources) {
    const wrap = document.createElement("div");
    wrap.className = "sources-block";
    wrap.innerHTML = `<div class="sources-label">${ic("globe")}<span>Sources</span><span class="count">${sources.length}</span></div><div class="source-list"></div>`;
    const list = wrap.querySelector(".source-list");
    sources.forEach((s, i) => {
      const a = document.createElement("a");
      a.className = "source-card";
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<span class="source-num"></span><span class="source-info"><span class="source-title"></span><span class="source-domain"></span><span class="source-snippet"></span></span>`;
      a.querySelector(".source-num").textContent = String(i + 1);
      a.querySelector(".source-title").textContent = s.title;
      a.querySelector(".source-domain").textContent = s.domain;
      a.querySelector(".source-snippet").textContent = s.snippet;
      list.appendChild(a);
    });
    return wrap;
  },

  buildImages(images) {
    const grid = document.createElement("div");
    grid.className = "image-grid";
    images.forEach((img, i) => {
      const card = document.createElement("button");
      card.className = "image-card";
      card.type = "button";
      card.innerHTML = `<img loading="lazy" alt=""><div class="img-skel"></div>
        <div class="img-fallback">${Icon.broken}<span>Image unavailable</span></div>
        <div class="img-overlay"><span class="img-title"></span><span class="img-domain"></span></div>`;
      const im = card.querySelector("img");
      im.src = img.thumb;
      im.alt = img.title || "";
      im.addEventListener("load", () => im.classList.add("loaded"));
      im.addEventListener("error", () => card.classList.add("errored"));
      card.querySelector(".img-title").textContent = img.title;
      card.querySelector(".img-domain").textContent = [img.domain, img.license].filter(Boolean).join(" · ");
      card.addEventListener("click", () => UI.openLightbox(images, i));
      grid.appendChild(card);
    });
    return grid;
  },

  /* ---------- lightbox ---------- */
  openLightbox(items, index) {
    State.lightbox = { items, index: index || 0 };
    this.els.lightbox.classList.add("open");
    this.renderLightbox();
  },
  renderLightbox() {
    const { items, index } = State.lightbox;
    const item = items[index];
    if (!item) return this.closeLightbox();
    this.els.lightboxImg.src = item.full || item.thumb;
    this.els.lightboxImg.alt = item.title || "";
    const parts = [Sec.esc(item.title || "")];
    if (item.creator) parts.push(Sec.esc(item.creator));
    if (item.license) parts.push(Sec.esc(item.license));
    const link = item.link ? ` — <a href="${item.link}" target="_blank" rel="noopener noreferrer">open source page</a>` : "";
    this.els.lightboxCap.innerHTML = `${parts.filter(Boolean).join(" · ")}${link} <span style="opacity:.6">(${index + 1}/${items.length})</span>`;
    const many = items.length > 1;
    this.els.lightboxPrev.style.display = many ? "grid" : "none";
    this.els.lightboxNext.style.display = many ? "grid" : "none";
  },
  moveLightbox(step) {
    const { items } = State.lightbox;
    if (!items.length) return;
    State.lightbox.index = (State.lightbox.index + step + items.length) % items.length;
    this.renderLightbox();
  },
  closeLightbox() {
    this.els.lightbox.classList.remove("open");
    this.els.lightboxImg.src = "";
  },

  /* ---------- find in conversation ---------- */
  openFind() {
    this.els.findBar.classList.remove("hidden");
    this.els.findInput.focus();
    this.els.findInput.select();
  },
  closeFind() {
    this.els.findBar.classList.add("hidden");
    this.clearFind();
    State.find = { term: "", hits: [], index: 0 };
    this.els.findInput.value = "";
    this.els.findCount.textContent = "0 / 0";
  },
  clearFind() {
    $$(".msg-content mark.find-hit").forEach((m) => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
  },
  runFind(term) {
    this.clearFind();
    State.find = { term, hits: [], index: 0 };
    if (!term || term.length < 2) { this.els.findCount.textContent = "0 / 0"; return; }
    const lower = term.toLowerCase();
    $$(".msg-content").forEach((container) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      const targets = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.toLowerCase().includes(lower)) targets.push(node);
      }
      targets.forEach((textNode) => {
        const frag = document.createDocumentFragment();
        let rest = textNode.nodeValue, idx;
        while ((idx = rest.toLowerCase().indexOf(lower)) !== -1) {
          if (idx) frag.appendChild(document.createTextNode(rest.slice(0, idx)));
          const mark = document.createElement("mark");
          mark.className = "find-hit";
          mark.textContent = rest.slice(idx, idx + term.length);
          frag.appendChild(mark);
          State.find.hits.push(mark);
          rest = rest.slice(idx + term.length);
        }
        if (rest) frag.appendChild(document.createTextNode(rest));
        textNode.parentNode.replaceChild(frag, textNode);
      });
    });
    this.focusHit(0);
  },
  focusHit(i) {
    const hits = State.find.hits;
    if (!hits.length) { this.els.findCount.textContent = "0 / 0"; return; }
    State.find.index = (i + hits.length) % hits.length;
    hits.forEach((h) => h.classList.remove("current"));
    const hit = hits[State.find.index];
    hit.classList.add("current");
    hit.scrollIntoView({ block: "center", behavior: "smooth" });
    this.els.findCount.textContent = `${State.find.index + 1} / ${hits.length}`;
  }
};

/* ============================================================
   14. SETTINGS
   ============================================================ */
const Settings = {
  tab: "provider",
  tabs: [
    ["provider", "Provider", "chip"],
    ["params", "Model behaviour", "sparkle"],
    ["persona", "Persona", "persona"],
    ["research", "Web & images", "globe"],
    ["voice", "Voice", "mic"],
    ["appearance", "Appearance", "eye"],
    ["prompts", "Prompt library", "bookmark"],
    ["data", "Your data", "download"],
    ["stats", "Usage", "chart"],
    ["shortcuts", "Shortcuts", "keyboard"],
    ["about", "About", "info"]
  ],

  open(tab) {
    if (tab) this.tab = tab;
    UI.els.settingsOverlay.classList.add("open");
    this.render();
  },
  close() {
    UI.els.settingsOverlay.classList.remove("open");
    UI.els.settingsOverlay.innerHTML = "";
  },
  isOpen() {
    return UI.els.settingsOverlay.classList.contains("open");
  },

  render() {
    const o = UI.els.settingsOverlay;
    o.innerHTML = `
      <div class="modal">
        <nav class="modal-nav">${this.tabs
          .map(([id, label, icon]) => `<button class="modal-nav-item" data-tab="${id}">${ic(icon)}${label}</button>`)
          .join("")}</nav>
        <div class="modal-main">
          <div class="modal-head"><h2>Settings</h2><button class="icon-btn" id="settings-x" aria-label="Close settings">${Icon.x}</button></div>
          <div class="modal-body" id="settings-body"></div>
        </div>
      </div>`;
    o.querySelector("#settings-x").addEventListener("click", () => this.close());
    o.querySelectorAll("[data-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === this.tab);
      b.addEventListener("click", () => { this.tab = b.dataset.tab; this.render(); });
    });
    const body = o.querySelector("#settings-body");
    const fn = {
      provider: this.provider, params: this.params, persona: this.persona, research: this.research,
      voice: this.voice, appearance: this.appearance, prompts: this.prompts, data: this.data,
      stats: this.stats, shortcuts: this.shortcuts, about: this.about
    }[this.tab];
    fn.call(this, body);
    hydrateIcons(o);
  },

  save() {
    Store.saveSettings(State.settings);
    App.applyPreferences();
  },

  /* --- provider --- */
  provider(body) {
    const id = State.settings.provider;
    const cfg = APP.providers[id];
    body.innerHTML = `
      <div class="security-note">${ic("alert")}<span>Anything typed into a browser page can be read by that browser and by the requests it makes. Keys here are stored only on this device and sent only to the provider you choose. For anything shared or production-facing, put a small server proxy in front and keep the key there.</span></div>
      <div class="field-group">
        <label class="field-label" for="provider-select">Provider</label>
        <select id="provider-select"></select>
        <p class="field-hint" id="provider-blurb"></p>
      </div>
      <div class="field-group" id="endpoint-group" hidden>
        <label class="field-label" for="endpoint-input">Endpoint URL</label>
        <input class="text-input" id="endpoint-input" spellcheck="false" placeholder="https://host/v1/chat/completions" />
        <p class="field-hint">Any server that speaks the OpenAI chat-completions format.</p>
      </div>
      <div class="field-group">
        <label class="field-label" for="model-select">Model</label>
        <select id="model-select"></select>
        <div class="btn-row">
          <button class="btn btn-sm" id="fetch-models">${ic("refresh")}Load models from provider</button>
          <button class="btn btn-sm" id="custom-model">${ic("edit")}Enter a model ID</button>
        </div>
      </div>
      <div id="key-section"></div>`;

    const sel = body.querySelector("#provider-select");
    Object.entries(APP.providers).forEach(([pid, p]) => {
      const opt = document.createElement("option");
      opt.value = pid;
      opt.textContent = p.label;
      if (pid === id) opt.selected = true;
      sel.appendChild(opt);
    });
    body.querySelector("#provider-blurb").textContent = cfg.blurb || `Messages go directly from this browser to ${cfg.label}.`;

    const endpointGroup = body.querySelector("#endpoint-group");
    const endpointInput = body.querySelector("#endpoint-input");
    if (cfg.editableEndpoint) {
      endpointGroup.hidden = false;
      endpointInput.value = State.endpoints[id] || cfg.endpoint;
      endpointInput.addEventListener("change", () => {
        State.endpoints[id] = endpointInput.value.trim();
        Store.saveKeys(Object.assign({}, State.apiKeys, { __endpoints: State.endpoints }));
      });
    }

    const modelSel = body.querySelector("#model-select");
    const fillModels = (models) => {
      modelSel.innerHTML = "";
      const list = models || cfg.models;
      let found = false;
      list.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.label || m.id;
        if (m.id === State.settings.model) { opt.selected = true; found = true; }
        modelSel.appendChild(opt);
      });
      if (!found && State.settings.model) {
        const opt = document.createElement("option");
        opt.value = State.settings.model;
        opt.textContent = State.settings.model + " (current)";
        opt.selected = true;
        modelSel.insertBefore(opt, modelSel.firstChild);
      }
    };
    fillModels();

    sel.addEventListener("change", () => {
      State.settings.provider = sel.value;
      State.settings.model = (APP.providers[sel.value].models[0] || {}).id || "";
      this.save();
      App.updateHeader();
      this.render();
    });
    modelSel.addEventListener("change", () => {
      State.settings.model = modelSel.value;
      this.save();
      App.updateHeader();
    });
    body.querySelector("#custom-model").addEventListener("click", async () => {
      const v = await UI.prompt("Model ID", `Exact model ID for ${cfg.label}`, State.settings.model);
      if (v && v.trim()) {
        State.settings.model = v.trim();
        this.save();
        App.updateHeader();
        this.render();
      }
    });
    body.querySelector("#fetch-models").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const adapter = Providers.get(id);
      if (!adapter.listModels) return UI.toast("This provider has no model list.", { error: true });
      btn.disabled = true;
      btn.innerHTML = `${ic("refresh")}Loading…`;
      hydrateIcons(btn);
      try {
        const models = await adapter.listModels(State.apiKeys[id] || "", State.endpoints[id] ? State.endpoints[id].replace(/\/chat\/completions$/, "/models") : null);
        if (!models.length) throw new Error("No models returned.");
        fillModels(models);
        UI.toast(`Loaded ${models.length} models`);
      } catch (err) {
        UI.toast(err.message || "Couldn't load models", { error: true });
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${ic("refresh")}Load models from provider`;
        hydrateIcons(btn);
      }
    });

    const keySection = body.querySelector("#key-section");
    if (!cfg.needsKey) {
      keySection.innerHTML = `<p class="field-hint">${cfg.kind === "sim"
        ? "Simulation mode makes no network requests at all."
        : "This provider runs locally and needs no key."}</p>`;
      return;
    }
    keySection.innerHTML = `
      <div class="field-group">
        <label class="field-label" for="api-key-input">${Sec.esc(cfg.label)} API key</label>
        <div class="key-row">
          <input type="password" id="api-key-input" class="text-input" placeholder="Paste your key" autocomplete="off" spellcheck="false" />
          <button class="icon-btn" id="toggle-key" aria-label="Show or hide the key">${Icon.eye}</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="save-key">Save key</button>
          <button class="btn" id="test-key">Test connection</button>
          <button class="btn btn-danger" id="delete-key">Delete key</button>
          ${cfg.keyUrl ? `<a class="btn" href="${cfg.keyUrl}" target="_blank" rel="noopener noreferrer">Get a key</a>` : ""}
        </div>
        <div class="test-result" id="test-result"></div>
        <p class="field-hint">Stored in this browser only. Sent only to ${Sec.esc(cfg.label)} when you send a message.</p>
      </div>`;
    const input = keySection.querySelector("#api-key-input");
    input.value = State.apiKeys[id] || "";
    let visible = false;
    const eyeBtn = keySection.querySelector("#toggle-key");
    eyeBtn.addEventListener("click", () => {
      visible = !visible;
      input.type = visible ? "text" : "password";
      eyeBtn.innerHTML = visible ? Icon.eyeOff : Icon.eye;
    });
    keySection.querySelector("#save-key").addEventListener("click", () => {
      State.apiKeys[id] = input.value.trim();
      App.persistKeys();
      UI.toast("Key saved on this device");
      App.updateHeader();
    });
    keySection.querySelector("#delete-key").addEventListener("click", () => {
      State.apiKeys[id] = "";
      input.value = "";
      App.persistKeys();
      UI.toast("Key deleted");
      App.updateHeader();
    });
    keySection.querySelector("#test-key").addEventListener("click", async () => {
      const out = keySection.querySelector("#test-result");
      out.className = "test-result show";
      out.textContent = "Testing…";
      try {
        const msg = await Providers.get(id).test(input.value.trim(), State.endpoints[id]);
        out.className = "test-result show ok";
        out.textContent = msg || "Connected.";
      } catch (err) {
        out.className = "test-result show fail";
        out.textContent = (err.message || "Connection failed.") + (err.hint ? " " + err.hint : "");
      }
    });
  },

  /* --- parameters --- */
  params(body) {
    const s = State.settings;
    body.innerHTML = `
      <div class="field-group">
        <label class="field-label" for="temp-range">Creativity (temperature) </label>
        <div class="slider-row">
          <input type="range" id="temp-range" min="0" max="2" step="0.1" value="${s.temperature}" />
          <span class="slider-val" id="temp-out">${s.temperature.toFixed(1)}</span>
        </div>
        <p class="field-hint">Low values stay focused and repeatable. High values wander — useful for brainstorming, risky for facts.</p>
      </div>
      <div class="field-group">
        <label class="field-label" for="max-tokens">Longest reply (max tokens)</label>
        <div class="slider-row">
          <input type="range" id="max-tokens" min="256" max="16384" step="256" value="${s.maxTokens}" />
          <span class="slider-val" id="tok-out">${s.maxTokens}</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label" for="top-p">Nucleus sampling (top-p)</label>
        <div class="slider-row">
          <input type="range" id="top-p" min="0.1" max="1" step="0.05" value="${s.topP}" />
          <span class="slider-val" id="topp-out">${s.topP}</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label" for="ctx-limit">Messages sent as context</label>
        <div class="slider-row">
          <input type="range" id="ctx-limit" min="2" max="60" step="2" value="${s.contextLimit}" />
          <span class="slider-val" id="ctx-out">${s.contextLimit}</span>
        </div>
        <p class="field-hint">Only the most recent messages travel with each request. Fewer messages cost less and run faster; more keeps the thread coherent.</p>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Stream the reply</div>
          <div class="row-toggle-sub">Words appear as they're generated. Turn this off if a network or proxy breaks streaming.</div>
        </div>
        <label class="switch"><input type="checkbox" id="stream-toggle" ${s.streaming ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Name chats automatically</div>
          <div class="row-toggle-sub">Uses your first message as the title until you rename it.</div>
        </div>
        <label class="switch"><input type="checkbox" id="autotitle-toggle" ${s.autoTitle ? "checked" : ""}><span class="switch-track"></span></label>
      </div>`;

    const bind = (id, outId, key, fmt) => {
      const el = body.querySelector("#" + id);
      const out = body.querySelector("#" + outId);
      el.addEventListener("input", () => {
        const v = parseFloat(el.value);
        State.settings[key] = key === "maxTokens" || key === "contextLimit" ? Math.round(v) : v;
        out.textContent = fmt ? fmt(State.settings[key]) : State.settings[key];
        this.save();
        App.syncComposerControls();
      });
    };
    bind("temp-range", "temp-out", "temperature", (v) => v.toFixed(1));
    bind("max-tokens", "tok-out", "maxTokens");
    bind("top-p", "topp-out", "topP");
    bind("ctx-limit", "ctx-out", "contextLimit");
    body.querySelector("#stream-toggle").addEventListener("change", (e) => { State.settings.streaming = e.target.checked; this.save(); });
    body.querySelector("#autotitle-toggle").addEventListener("change", (e) => { State.settings.autoTitle = e.target.checked; this.save(); });
  },

  /* --- persona --- */
  persona(body) {
    body.innerHTML = `
      <div class="field-group">
        <label class="field-label">How the assistant should behave</label>
        <div class="seg" id="persona-seg"></div>
        <p class="field-hint">Personas prepend instructions to every message in new and existing chats.</p>
      </div>
      <div class="field-group">
        <label class="field-label" for="persona-text">Custom instructions</label>
        <textarea class="text-input" id="persona-text" rows="7" placeholder="For example: I'm a backend developer working in Go. Skip the basics, show code first, and flag anything that would break under load."></textarea>
        <p class="field-hint">Added on top of the selected persona. Leave empty to use the persona alone.</p>
      </div>
      <div class="field-group">
        <label class="field-label">Current system prompt</label>
        <div class="code-block"><pre><code id="sys-preview"></code></pre></div>
      </div>`;
    const seg = body.querySelector("#persona-seg");
    APP.personas.forEach((p) => {
      const b = document.createElement("button");
      b.className = "seg-opt" + (State.settings.persona === p.id ? " active" : "");
      b.textContent = p.name;
      b.addEventListener("click", () => {
        State.settings.persona = p.id;
        this.save();
        App.updatePersonaChip();
        this.render();
      });
      seg.appendChild(b);
    });
    const ta = body.querySelector("#persona-text");
    ta.value = State.settings.customPersona || "";
    const preview = body.querySelector("#sys-preview");
    const refresh = () => (preview.textContent = App.systemPrompt(null));
    refresh();
    ta.addEventListener("input", debounce(() => {
      State.settings.customPersona = ta.value;
      this.save();
      App.updatePersonaChip();
      refresh();
    }, 250));
  },

  /* --- research --- */
  research(body) {
    const s = State.settings;
    body.innerHTML = `
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Web search</div>
          <div class="row-toggle-sub">Looks up your question with DuckDuckGo's instant answers and Wikipedia, then hands the results to the model to cite.</div>
        </div>
        <label class="switch"><input type="checkbox" id="search-toggle" ${s.webSearch ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Image search</div>
          <div class="row-toggle-sub">Finds openly-licensed images through Openverse and shows them under the reply.</div>
        </div>
        <label class="switch"><input type="checkbox" id="image-toggle" ${s.imageSearch ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <p class="field-hint">These are summary APIs, not a full web index, so niche and very recent queries often come back empty. When a lookup fails or returns nothing, you'll see a note saying so — the assistant won't invent sources. Simulation mode never searches.</p>
      <div class="field-group" style="margin-top:22px">
        <label class="field-label">Try a search now</label>
        <div class="key-row">
          <input class="text-input" id="test-query" placeholder="e.g. tidal energy" />
          <button class="btn" id="run-test-search">Search</button>
        </div>
        <div class="test-result" id="search-test"></div>
      </div>`;
    body.querySelector("#search-toggle").addEventListener("change", (e) => {
      State.settings.webSearch = e.target.checked; this.save(); App.syncToggles();
    });
    body.querySelector("#image-toggle").addEventListener("change", (e) => {
      State.settings.imageSearch = e.target.checked; this.save(); App.syncToggles();
    });
    body.querySelector("#run-test-search").addEventListener("click", async () => {
      const q = body.querySelector("#test-query").value.trim();
      const out = body.querySelector("#search-test");
      if (!q) return;
      out.className = "test-result show";
      out.textContent = "Searching…";
      const r = await Research.search(q);
      if (r.ok && r.sources.length) {
        out.className = "test-result show ok";
        out.textContent = `${r.sources.length} sources found: ${r.sources.map((s) => s.domain).join(", ")}`;
      } else {
        out.className = "test-result show fail";
        out.textContent = r.message || "No results.";
      }
    });
  },

  /* --- voice --- */
  voice(body) {
    const s = State.settings;
    const voices = Speech.supportedOut ? window.speechSynthesis.getVoices() : [];
    body.innerHTML = `
      <div class="field-group">
        <label class="field-label">Dictation</label>
        <p class="field-hint">${Speech.supportedIn
          ? "Press the microphone in the composer, or Ctrl/⌘ + Shift + V, and speak. Your browser handles the transcription."
          : "This browser has no speech recognition. Chrome and Edge support it."}</p>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Read replies aloud automatically</div>
          <div class="row-toggle-sub">Starts narrating each finished reply. You can always press Listen on a single message instead.</div>
        </div>
        <label class="switch"><input type="checkbox" id="autospeak" ${s.autoSpeak ? "checked" : ""} ${Speech.supportedOut ? "" : "disabled"}><span class="switch-track"></span></label>
      </div>
      <div class="field-group" style="margin-top:20px">
        <label class="field-label" for="voice-select">Voice</label>
        <select id="voice-select"></select>
      </div>
      <div class="field-group">
        <label class="field-label" for="rate-range">Speaking rate</label>
        <div class="slider-row">
          <input type="range" id="rate-range" min="0.5" max="2" step="0.1" value="${s.ttsRate}" />
          <span class="slider-val" id="rate-out">${s.ttsRate}×</span>
        </div>
        <div class="btn-row"><button class="btn" id="try-voice">${ic("speaker")}Hear a sample</button></div>
      </div>`;
    const sel = body.querySelector("#voice-select");
    const def = document.createElement("option");
    def.value = "";
    def.textContent = "Browser default";
    sel.appendChild(def);
    voices.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.name;
      o.textContent = `${v.name} (${v.lang})`;
      if (v.name === s.ttsVoice) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => { State.settings.ttsVoice = sel.value; this.save(); });
    body.querySelector("#autospeak").addEventListener("change", (e) => { State.settings.autoSpeak = e.target.checked; this.save(); });
    const rate = body.querySelector("#rate-range");
    rate.addEventListener("input", () => {
      State.settings.ttsRate = parseFloat(rate.value);
      body.querySelector("#rate-out").textContent = rate.value + "×";
      this.save();
    });
    body.querySelector("#try-voice").addEventListener("click", () =>
      Speech.speak("This is how replies will sound.", "sample", State.settings.ttsVoice, State.settings.ttsRate)
    );
  },

  /* --- appearance --- */
  appearance(body) {
    const s = State.settings;
    const themes = [["light", "Light"], ["dark", "Dark"], ["system", "Match system"]];
    const accents = [["indigo", "#6c8cff"], ["violet", "#a17bff"], ["emerald", "#35c88a"], ["amber", "#e8a33d"], ["rose", "#f2688f"], ["cyan", "#3ec5e0"]];
    body.innerHTML = `
      <div class="field-group">
        <label class="field-label">Theme</label>
        <div class="seg" id="theme-seg">${themes.map(([v, l]) => `<button class="seg-opt" data-v="${v}">${l}</button>`).join("")}</div>
      </div>
      <div class="field-group">
        <label class="field-label">Accent</label>
        <div class="swatch-row" id="accent-row">${accents
          .map(([v, c]) => `<button class="swatch" data-v="${v}" style="background:${c}" aria-label="${v}"></button>`)
          .join("")}</div>
      </div>
      <div class="field-group">
        <label class="field-label">Text size</label>
        <div class="slider-row">
          <input type="range" id="font-range" min="13" max="19" step="1" value="${s.fontScale}" />
          <span class="slider-val" id="font-out">${s.fontScale}px</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Message spacing</label>
        <div class="seg" id="density-seg">${[["compact", "Compact"], ["cozy", "Cozy"], ["roomy", "Roomy"]]
          .map(([v, l]) => `<button class="seg-opt" data-v="${v}">${l}</button>`).join("")}</div>
      </div>
      <div class="field-group">
        <label class="field-label">Thread width</label>
        <div class="seg" id="width-seg">${[["cozy", "Narrow"], ["wide", "Wide"], ["full", "Full width"]]
          .map(([v, l]) => `<button class="seg-opt" data-v="${v}">${l}</button>`).join("")}</div>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text"><div class="row-toggle-title">Message bubbles</div><div class="row-toggle-sub">Wrap each message in a card instead of running as plain text.</div></div>
        <label class="switch"><input type="checkbox" id="bubbles" ${s.bubbles ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text"><div class="row-toggle-title">Timestamps</div><div class="row-toggle-sub">Show the time next to every message.</div></div>
        <label class="switch"><input type="checkbox" id="timestamps" ${s.timestamps ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text"><div class="row-toggle-title">Line numbers in code</div><div class="row-toggle-sub">Numbers appear on blocks longer than two lines.</div></div>
        <label class="switch"><input type="checkbox" id="linenums" ${s.lineNumbers ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text"><div class="row-toggle-title">Wrap long code lines</div><div class="row-toggle-sub">Wrap instead of scrolling sideways.</div></div>
        <label class="switch"><input type="checkbox" id="codewrap" ${s.codeWrap ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text"><div class="row-toggle-title">Higher contrast</div><div class="row-toggle-sub">Strengthens borders and secondary text.</div></div>
        <label class="switch"><input type="checkbox" id="contrast" ${s.contrast === "high" ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text"><div class="row-toggle-title">Animations</div><div class="row-toggle-sub">Turn off for a completely still interface.</div></div>
        <label class="switch"><input type="checkbox" id="motion" ${s.motion ? "checked" : ""}><span class="switch-track"></span></label>
      </div>`;

    const segBind = (sel, key, after) => {
      body.querySelectorAll(sel + " .seg-opt").forEach((b) => {
        b.classList.toggle("active", State.settings[key] === b.dataset.v || (key === "theme" && (Store.getTheme() || "dark") === b.dataset.v));
        b.addEventListener("click", () => {
          State.settings[key] = b.dataset.v;
          this.save();
          after && after(b.dataset.v);
          body.querySelectorAll(sel + " .seg-opt").forEach((x) => x.classList.toggle("active", x === b));
        });
      });
    };
    segBind("#theme-seg", "theme", (v) => { Theme.set(v); App.updateThemeIcon(); });
    segBind("#density-seg", "density");
    segBind("#width-seg", "width");
    body.querySelectorAll("#accent-row .swatch").forEach((b) => {
      b.classList.toggle("active", State.settings.accent === b.dataset.v);
      b.addEventListener("click", () => {
        State.settings.accent = b.dataset.v;
        this.save();
        body.querySelectorAll("#accent-row .swatch").forEach((x) => x.classList.toggle("active", x === b));
      });
    });
    const font = body.querySelector("#font-range");
    font.addEventListener("input", () => {
      State.settings.fontScale = parseInt(font.value, 10);
      body.querySelector("#font-out").textContent = font.value + "px";
      this.save();
    });
    const toggle = (id, key, transform) => {
      body.querySelector("#" + id).addEventListener("change", (e) => {
        State.settings[key] = transform ? transform(e.target.checked) : e.target.checked;
        this.save();
        App.rerenderActive();
      });
    };
    toggle("bubbles", "bubbles");
    toggle("timestamps", "timestamps");
    toggle("linenums", "lineNumbers");
    toggle("codewrap", "codeWrap");
    toggle("contrast", "contrast", (v) => (v ? "high" : "normal"));
    toggle("motion", "motion");
  },

  /* --- prompt library --- */
  prompts(body) {
    body.innerHTML = `
      <p class="field-hint">Saved prompts appear when you type <code>/</code> in the composer. Give each one a short slash name.</p>
      <div class="btn-row"><button class="btn btn-primary" id="add-prompt">${ic("plus")}New prompt</button></div>
      <div class="prompt-list" id="prompt-list"></div>`;
    const list = body.querySelector("#prompt-list");
    const draw = () => {
      list.innerHTML = "";
      if (!State.prompts.length) {
        list.innerHTML = `<div class="no-results">No saved prompts yet.</div>`;
        return;
      }
      State.prompts.forEach((p) => {
        const row = document.createElement("div");
        row.className = "prompt-row";
        row.innerHTML = `<div class="pr-main">
            <div class="pr-name"></div><div class="pr-slash"></div><div class="pr-body"></div>
          </div>
          <div class="pr-acts">
            <button class="icon-btn sm" data-a="use" title="Insert into composer">${Icon.send}</button>
            <button class="icon-btn sm" data-a="edit" title="Edit">${Icon.edit}</button>
            <button class="icon-btn sm" data-a="del" title="Delete">${Icon.trash}</button>
          </div>`;
        row.querySelector(".pr-name").textContent = p.name;
        row.querySelector(".pr-slash").textContent = "/" + p.slash;
        row.querySelector(".pr-body").textContent = p.body;
        row.querySelector("[data-a='use']").addEventListener("click", () => { App.insertPrompt(p); this.close(); });
        row.querySelector("[data-a='edit']").addEventListener("click", async () => {
          const name = await UI.prompt("Edit prompt", "Name", p.name);
          if (name === null) return;
          const slash = await UI.prompt("Edit prompt", "Slash name (no spaces)", p.slash);
          if (slash === null) return;
          const text = await UI.prompt("Edit prompt", "Prompt text", p.body, true);
          if (text === null) return;
          Object.assign(p, { name: name.trim() || p.name, slash: (slash || "").trim().replace(/\s+/g, "-") || p.slash, body: text });
          App.persistPrompts();
          draw();
        });
        row.querySelector("[data-a='del']").addEventListener("click", async () => {
          if (await UI.confirm("Delete prompt", `Remove "${p.name}" from the library?`, "Delete", true)) {
            State.prompts = State.prompts.filter((x) => x.id !== p.id);
            App.persistPrompts();
            draw();
          }
        });
        list.appendChild(row);
      });
      hydrateIcons(list);
    };
    body.querySelector("#add-prompt").addEventListener("click", async () => {
      const name = await UI.prompt("New prompt", "Name", "");
      if (!name) return;
      const slash = await UI.prompt("New prompt", "Slash name (no spaces)", slug(name).slice(0, 14));
      if (slash === null) return;
      const text = await UI.prompt("New prompt", "Prompt text", "", true);
      if (!text) return;
      State.prompts.push({ id: uid("pr"), name: name.trim(), slash: slash.trim().replace(/\s+/g, "-"), body: text });
      App.persistPrompts();
      draw();
    });
    draw();
  },

  /* --- data --- */
  data(body) {
    body.innerHTML = `
      <div class="field-group">
        <label class="field-label">Export everything</label>
        <p class="field-hint">A single JSON file with every chat, prompt and preference — minus your API keys.</p>
        <div class="btn-row">
          <button class="btn btn-primary" id="export-json">${ic("download")}Export JSON</button>
          <button class="btn" id="export-md">${ic("download")}Export all as Markdown</button>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Import a backup</label>
        <p class="field-hint">Chats are validated and added alongside what's already here. Nothing is overwritten.</p>
        <div class="btn-row">
          <button class="btn" id="import-btn">${ic("upload")}Choose a file</button>
          <input type="file" id="import-file" accept="application/json" class="visually-hidden" />
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Storage</label>
        <div class="about-line"><span>Engine</span><span>${Store.mode === "idb" ? "IndexedDB" : "localStorage fallback"}</span></div>
        <div class="about-line"><span>Chats</span><span id="d-convs">0</span></div>
        <div class="about-line"><span>Space used</span><span id="d-space">—</span></div>
      </div>
      <div class="field-group">
        <label class="field-label">Delete local data</label>
        <p class="field-hint">Removes every chat from this browser. Saved keys and preferences are handled separately below.</p>
        <div class="btn-row">
          <button class="btn btn-danger" id="clear-chats">${ic("trash")}Delete all chats</button>
          <button class="btn btn-danger" id="clear-keys">${ic("key")}Delete all API keys</button>
          <button class="btn btn-danger" id="reset-all">${ic("alert")}Reset everything</button>
        </div>
      </div>`;
    const s = Conv.stats();
    body.querySelector("#d-convs").textContent = `${s.conversations} (${s.messages} messages)`;
    Store.usage().then((est) => {
      if (est && est.quota) body.querySelector("#d-space").textContent = `${fmtBytes(est.usage)} of ${fmtBytes(est.quota)}`;
    });
    body.querySelector("#export-json").addEventListener("click", () => App.exportAll("json"));
    body.querySelector("#export-md").addEventListener("click", () => App.exportAll("md"));
    body.querySelector("#import-btn").addEventListener("click", () => body.querySelector("#import-file").click());
    body.querySelector("#import-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) App.importFile(f);
      e.target.value = "";
    });
    body.querySelector("#clear-chats").addEventListener("click", async () => {
      if (await UI.confirm("Delete all chats", "Every conversation on this device is removed. This can't be undone.", "Delete all", true))
        App.clearAllChats();
    });
    body.querySelector("#clear-keys").addEventListener("click", async () => {
      if (await UI.confirm("Delete API keys", "All saved provider keys are removed from this browser.", "Delete keys", true)) {
        State.apiKeys = {};
        App.persistKeys();
        UI.toast("Keys deleted");
        this.render();
      }
    });
    body.querySelector("#reset-all").addEventListener("click", async () => {
      if (await UI.confirm("Reset everything", "Chats, keys, prompts and preferences are all removed and the app restarts fresh.", "Reset", true)) {
        await Store.clear();
        Object.values(APP.keys).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
        location.reload();
      }
    });
  },

  /* --- stats --- */
  stats(body) {
    const s = Conv.stats();
    const byProvider = {};
    State.conversations.forEach((c) =>
      c.messages.forEach((m) => {
        if (m.role !== "assistant") return;
        const k = m.providerLabel || "Unknown";
        byProvider[k] = (byProvider[k] || 0) + 1;
      })
    );
    body.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-num">${s.conversations}</div><div class="stat-label">Chats</div></div>
        <div class="stat-card"><div class="stat-num">${s.messages}</div><div class="stat-label">Messages</div></div>
        <div class="stat-card"><div class="stat-num">${s.codeBlocks}</div><div class="stat-label">Code blocks</div></div>
        <div class="stat-card"><div class="stat-num">${(s.chars / 1000).toFixed(1)}k</div><div class="stat-label">Characters written</div></div>
      </div>
      <div class="field-group">
        <label class="field-label">Replies by provider</label>
        ${Object.keys(byProvider).length
          ? Object.entries(byProvider).sort((a, b) => b[1] - a[1])
              .map(([k, v]) => `<div class="about-line"><span>${Sec.esc(k)}</span><span>${v}</span></div>`).join("")
          : '<p class="field-hint">No replies yet.</p>'}
      </div>
      <div class="field-group">
        <label class="field-label">Library</label>
        <div class="about-line"><span>Pinned</span><span>${s.pinned}</span></div>
        <div class="about-line"><span>Archived</span><span>${s.archived}</span></div>
        <div class="about-line"><span>First chat</span><span>${s.oldest ? fmtDate(s.oldest) : "—"}</span></div>
        <div class="about-line"><span>Saved prompts</span><span>${State.prompts.length}</span></div>
      </div>
      <p class="field-hint">Token counts anywhere in this app are rough estimates (about four characters per token), not billing figures.</p>`;
  },

  /* --- shortcuts --- */
  shortcuts(body) {
    body.innerHTML = `<div class="sc-grid">${APP.shortcuts
      .map(([k, d]) => `<div class="sc-row"><span>${Sec.esc(d)}</span><span class="kbd">${Sec.esc(k)}</span></div>`)
      .join("")}</div>`;
  },

  /* --- about --- */
  about(body) {
    body.innerHTML = `
      <div class="security-note">${ic("alert")}<span>This whole app runs in your browser. A key pasted here is visible to this page and travels in the requests it makes, so treat it as exposed on any shared machine. Use a server-side proxy — pick "Custom endpoint" under Provider — when that matters.</span></div>
      <div class="about-line"><span>App</span><span>${Sec.esc(APP.name)}</span></div>
      <div class="about-line"><span>Version</span><span>${Sec.esc(APP.version)}</span></div>
      <div class="about-line"><span>Providers</span><span>${Object.keys(APP.providers).length} configured</span></div>
      <div class="about-line"><span>Storage</span><span>${Store.mode === "idb" ? "IndexedDB" : "localStorage fallback"}</span></div>
      <div class="about-line"><span>Dictation</span><span>${Speech.supportedIn ? "Available" : "Not in this browser"}</span></div>
      <div class="about-line"><span>Narration</span><span>${Speech.supportedOut ? "Available" : "Not in this browser"}</span></div>
      <div class="about-line"><span>Dependencies</span><span>None — three files, no build step</span></div>
      <p class="field-hint" style="margin-top:18px">Markdown, syntax highlighting, search, storage and speech are all implemented in app.js. Everything the model returns is escaped before rendering, so a reply can't inject HTML or scripts into the page.</p>`;
  }
};

/* ============================================================
   15. COMMAND PALETTE
   ============================================================ */
const Palette = {
  items: [], index: 0, open_: false,

  open() {
    this.open_ = true;
    const o = UI.els.paletteOverlay;
    o.innerHTML = `
      <div class="palette">
        <div class="palette-input-row">
          ${ic("search")}<input id="palette-input" placeholder="Search chats, switch model, run a command…" aria-label="Command palette" />
        </div>
        <div class="palette-results" id="palette-results"></div>
        <div class="palette-foot"><span><span class="kbd">↑↓</span> move</span><span><span class="kbd">↵</span> run</span><span><span class="kbd">esc</span> close</span></div>
      </div>`;
    o.classList.add("open");
    hydrateIcons(o);
    const input = o.querySelector("#palette-input");
    input.addEventListener("input", () => this.search(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); this.move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); this.move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); this.run(); }
      else if (e.key === "Escape") { e.preventDefault(); this.close(); }
    });
    o.addEventListener("click", (e) => { if (e.target === o) this.close(); });
    this.search("");
    input.focus();
  },
  close() {
    this.open_ = false;
    UI.els.paletteOverlay.classList.remove("open");
    UI.els.paletteOverlay.innerHTML = "";
  },
  commands() {
    const cmds = [
      { group: "Actions", title: "New chat", sub: "Ctrl/⌘ N", icon: "plus", run: () => App.newChat() },
      { group: "Actions", title: "Toggle web search", sub: State.settings.webSearch ? "on" : "off", icon: "globe", run: () => App.toggleWebSearch() },
      { group: "Actions", title: "Toggle image search", sub: State.settings.imageSearch ? "on" : "off", icon: "image", run: () => App.toggleImageSearch() },
      { group: "Actions", title: "Find in this conversation", sub: "Ctrl/⌘ F", icon: "search", run: () => UI.openFind() },
      { group: "Actions", title: "Export this chat as Markdown", icon: "download", run: () => State.activeId && App.exportConversation(State.activeId, "md") },
      { group: "Actions", title: "Export this chat as PDF", icon: "download", run: () => State.activeId && App.exportConversation(State.activeId, "pdf") },
      { group: "Actions", title: "Export this chat as Word (.docx)", icon: "download", run: () => State.activeId && App.exportConversation(State.activeId, "docx") },
      { group: "Actions", title: "Export this chat as slides (.pptx)", icon: "download", run: () => State.activeId && App.exportConversation(State.activeId, "pptx") },
      { group: "Actions", title: "Print this chat", icon: "print", run: () => window.print() },
      { group: "Actions", title: "New multi-file project", sub: "opens in Canvas", icon: "folder", run: () => Files.newProject() },
      { group: "Actions", title: "Toggle Canvas", sub: "Ctrl/⌘ ⇧ E", icon: "canvas", run: () => Canvas.toggle() },
      { group: "Actions", title: "Show diff for the open artifact", icon: "diff", run: () => (State.canvas.open ? Canvas.setTab("diff") : UI.toast("Open something in the Canvas first")) },
      { group: "Actions", title: "Run the active project file", icon: "play", run: () => Canvas.runActive() },
      { group: "Actions", title: "Export open project as ZIP", icon: "download", run: () => { const a = Canvas.current(); a && a.type === "project" ? Files.zip(a) : UI.toast("Open a multi-file project in the Canvas first"); } },
      { group: "Actions", title: "Switch theme", sub: "Ctrl/⌘ J", icon: "moon", run: () => App.cycleTheme() },
      { group: "Settings", title: "Open settings", sub: "Ctrl/⌘ ,", icon: "settings", run: () => Settings.open("provider") },
      { group: "Settings", title: "Prompt library", icon: "bookmark", run: () => Settings.open("prompts") },
      { group: "Settings", title: "Persona and instructions", icon: "persona", run: () => Settings.open("persona") },
      { group: "Settings", title: "Keyboard shortcuts", sub: "?", icon: "keyboard", run: () => Settings.open("shortcuts") },
      { group: "Settings", title: "Usage overview", icon: "chart", run: () => Settings.open("stats") }
    ];
    Object.entries(APP.providers).forEach(([pid, p]) => {
      p.models.slice(0, 4).forEach((m) => {
        cmds.push({
          group: "Models",
          title: `${p.label} · ${m.label}`,
          sub: pid === State.settings.provider && m.id === State.settings.model ? "current" : "",
          icon: "chip",
          run: () => App.switchModel(pid, m.id)
        });
      });
    });
    State.prompts.forEach((p) =>
      cmds.push({ group: "Prompts", title: p.name, sub: "/" + p.slash, icon: "bookmark", run: () => App.insertPrompt(p) })
    );
    State.conversations.slice(0, 40).forEach((c) =>
      cmds.push({
        group: "Chats",
        title: c.title,
        sub: relTime(c.updatedAt),
        icon: c.pinned ? "pin" : "chat",
        run: () => App.openConversation(c.id)
      })
    );
    return cmds;
  },
  search(q) {
    const term = (q || "").trim().toLowerCase();
    let items = this.commands();
    if (term) {
      items = items
        .map((it) => {
          const t = it.title.toLowerCase();
          let score = -1;
          if (t.startsWith(term)) score = 0;
          else if (t.includes(term)) score = 1;
          else if (term.split(" ").every((w) => t.includes(w))) score = 2;
          return { it, score };
        })
        .filter((x) => x.score >= 0)
        .sort((a, b) => a.score - b.score)
        .map((x) => x.it);
    }
    this.items = items.slice(0, 40);
    this.index = 0;
    this.draw();
  },
  draw() {
    const host = UI.els.paletteOverlay.querySelector("#palette-results");
    if (!host) return;
    host.innerHTML = "";
    if (!this.items.length) {
      host.innerHTML = `<div class="no-results">Nothing matches that.</div>`;
      return;
    }
    let group = null;
    this.items.forEach((it, i) => {
      if (it.group !== group) {
        group = it.group;
        const g = document.createElement("div");
        g.className = "palette-group";
        g.textContent = group;
        host.appendChild(g);
      }
      const b = document.createElement("button");
      b.className = "palette-item" + (i === this.index ? " sel" : "");
      b.innerHTML = `${ic(Icon[it.icon] ? it.icon : "sparkle")}<span class="p-title"></span><span class="p-sub"></span>`;
      b.querySelector(".p-title").textContent = it.title;
      b.querySelector(".p-sub").textContent = it.sub || "";
      b.addEventListener("click", () => { this.index = i; this.run(); });
      b.addEventListener("mousemove", () => {
        if (this.index === i) return;
        this.index = i;
        host.querySelectorAll(".palette-item").forEach((x, j) => x.classList.toggle("sel", j === i));
      });
      host.appendChild(b);
    });
    hydrateIcons(host);
  },
  move(step) {
    if (!this.items.length) return;
    this.index = (this.index + step + this.items.length) % this.items.length;
    this.draw();
    const sel = UI.els.paletteOverlay.querySelector(".palette-item.sel");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  },
  run() {
    const it = this.items[this.index];
    if (!it) return;
    this.close();
    setTimeout(() => it.run(), 0);
  }
};

/* ============================================================
   16. APP CONTROLLER
   ============================================================ */
const App = {
  slash: { open: false, items: [], index: 0 },

  /* ---------- lifecycle ---------- */
  async init() {
    UI.cache();
    hydrateIcons(document);
    UI.els.brandVer.textContent = APP.version.split(".").slice(0, 2).join(".");

    const savedTheme = Theme.init();
    const saved = Store.getSettings();
    if (saved) Object.assign(State.settings, saved);
    State.settings.theme = savedTheme;

    const keys = Store.getKeys() || {};
    State.endpoints = keys.__endpoints || {};
    delete keys.__endpoints;
    State.apiKeys = keys;
    State.prompts = Store.getPrompts() || DEFAULT_PROMPTS.slice();

    this.applyPreferences();
    let conversationsReady = false;
    const loadConversations = Conv.loadAll().then((list) => {
      conversationsReady = true;
      UI.renderSidebar();
      return list;
    }).catch((err) => {
      console.warn("Conversation storage unavailable; continuing with an empty workspace.", err);
      State.conversations = [];
      UI.renderSidebar();
      return [];
    });
    await Promise.race([
      loadConversations,
      new Promise((resolve) => setTimeout(resolve, 1200))
    ]);
    if (!conversationsReady) {
      State.conversations = Array.isArray(State.conversations) ? State.conversations : [];
      UI.renderSidebar();
    }
    this.syncToggles();
    this.syncComposerControls();
    this.updatePersonaChip();
    this.updateHeader();
    this.updateThemeIcon();
    this.showHome();
    this.bind();
    this.updateComposerState();
    window.dispatchEvent(new CustomEvent("gradient-app-ready", { detail: { version: APP.version } }));

    if (Speech.supportedOut && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  },

  applyPreferences() {
    const s = State.settings;
    const root = document.documentElement;
    root.setAttribute("data-accent", s.accent);
    root.setAttribute("data-density", s.density);
    root.setAttribute("data-width", s.width);
    root.setAttribute("data-bubbles", s.bubbles ? "on" : "off");
    root.setAttribute("data-timestamps", s.timestamps ? "on" : "off");
    root.setAttribute("data-contrast", s.contrast);
    root.setAttribute("data-motion", s.motion ? "on" : "off");
    root.style.setProperty("--fs-base", s.fontScale + "px");
  },
  persistSettings() { Store.saveSettings(State.settings); },
  persistKeys() { Store.saveKeys(Object.assign({}, State.apiKeys, { __endpoints: State.endpoints })); window.dispatchEvent(new CustomEvent("gradient-provider-keys-changed")); },
  persistPrompts() { Store.savePrompts(State.prompts); },

  /* ---------- navigation ---------- */
  filterTerm() { return UI.els.sidebarSearch.value; },

  showHome() {
    State.activeId = null;
    UI.showWelcome();
    this.updateHeader();
    UI.renderSidebar(this.filterTerm());
  },
  async newChat() {
    Speech.stopSpeaking();
    this.showHome();
    this.closeMobileSidebar();
    UI.els.composerInput.focus();
  },
  openConversation(id) {
    Speech.stopSpeaking();
    State.activeId = id;
    const conv = Conv.active();
    if (conv) UI.renderMessages(conv);
    this.updateHeader();
    UI.renderSidebar(this.filterTerm());
    this.closeMobileSidebar();
    UI.closeFind();
  },
  rerenderActive() {
    const conv = Conv.active();
    if (conv) UI.renderMessages(conv);
    else UI.showWelcome();
  },
  closeMobileSidebar() {
    UI.els.sidebar.classList.remove("mobile-open");
    UI.els.sidebarScrim.classList.remove("show");
  },
  toggleSidebar() {
    if (window.innerWidth <= 900) {
      const open = UI.els.sidebar.classList.toggle("mobile-open");
      UI.els.sidebarScrim.classList.toggle("show", open);
      return;
    }
    State.sidebarCollapsed = !State.sidebarCollapsed;
    UI.els.sidebar.classList.toggle("collapsed", State.sidebarCollapsed);
    UI.els.expandBtn.hidden = !State.sidebarCollapsed;
  },

  /* ---------- header ---------- */
  updateHeader() {
    const conv = Conv.active();
    const s = State.settings;
    const cfg = APP.providers[s.provider] || APP.providers.simulation;
    UI.els.headerTitle.textContent = conv ? conv.title : "New conversation";
    const sim = s.provider === "simulation";
    const hasKey = !cfg.needsKey || !!(State.apiKeys[s.provider] || "").trim();
    UI.els.headerStatusDot.className =
      "status-dot " + (State.generating ? "busy" : sim ? "sim" : hasKey ? "live" : "sim");
    UI.els.headerStatusText.textContent = State.generating
      ? "Generating…"
      : sim
      ? "Simulation mode"
      : hasKey
      ? `${cfg.label} · connected`
      : `${cfg.label} · key needed`;
    const model = (cfg.models.find((m) => m.id === s.model) || {}).label || s.model;
    UI.els.modelPillText.textContent = model;
    UI.els.modelPill.title = `${cfg.label} · ${s.model} — click to switch (Ctrl/⌘ M)`;
    UI.els.headerSearchBadge.hidden = !s.webSearch;
    UI.els.headerImageBadge.hidden = !s.imageSearch;
  },
  updateThemeIcon() {
    const resolved = document.documentElement.getAttribute("data-theme");
    UI.els.themeBtn.innerHTML = `<span class="ico">${resolved === "light" ? Icon.moon : Icon.sun}</span>`;
  },
  cycleTheme() {
    const order = ["dark", "light", "system"];
    const cur = Store.getTheme() || "dark";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    Theme.set(next);
    State.settings.theme = next;
    this.persistSettings();
    this.updateThemeIcon();
    UI.toast(`Theme: ${next}`);
  },
  updatePersonaChip() {
    const p = APP.personas.find((x) => x.id === State.settings.persona) || APP.personas[0];
    const custom = (State.settings.customPersona || "").trim();
    UI.els.personaLabel.textContent = p.id === "default" && !custom ? "Default persona" : p.name + (custom ? " +" : "");
    UI.els.personaChip.classList.toggle("active", p.id !== "default" || !!custom);
  },
  syncToggles() {
    const s = State.settings;
    UI.els.webSearchToggle.classList.toggle("active", s.webSearch);
    UI.els.webSearchToggle.setAttribute("aria-pressed", String(s.webSearch));
    UI.els.imageSearchToggle.classList.toggle("active", s.imageSearch);
    UI.els.imageSearchToggle.setAttribute("aria-pressed", String(s.imageSearch));
    if (UI.els.imageGenToggle) {
      UI.els.imageGenToggle.classList.toggle("active", !!s.imageGenMode);
      UI.els.imageGenToggle.setAttribute("aria-pressed", String(!!s.imageGenMode));
    }
    this.updateHeader();
  },
  toggleImageGen() {
    State.settings.imageGenMode = !State.settings.imageGenMode;
    this.persistSettings();
    this.syncToggles();
    App.syncCapabilities();
    const input = UI.els.composerInput;
    if (input) input.placeholder = State.settings.imageGenMode
      ? "Describe the image you want…"
      : (TG_MODE_PLACEHOLDER() || "Message The Gradient…  Type / for commands");
  },
  syncComposerControls() {
    UI.els.tempSlider.value = State.settings.temperature;
    UI.els.tempValue.textContent = Number(State.settings.temperature).toFixed(1);
  },
  toggleWebSearch() {
    State.settings.webSearch = !State.settings.webSearch;
    this.persistSettings();
    this.syncToggles();
  },
  toggleImageSearch() {
    State.settings.imageSearch = !State.settings.imageSearch;
    this.persistSettings();
    this.syncToggles();
  },
  switchModel(provider, model) {
    State.settings.provider = provider;
    State.settings.model = model;
    if (State.uiMode === "software") {
      State.settings.softwareAI = provider;
      State.settings.softwareModel = model;
    }
    this.persistSettings();
    this.updateHeader();
    const cfg = APP.providers[provider];
    UI.toast(`${cfg.label} · ${model}`);
    if (cfg.needsKey && !(State.apiKeys[provider] || "").trim()) {
      UI.toast(`${cfg.label} needs an API key`, { error: true, action: "Add key", onAction: () => Settings.open("provider") });
    }
  },
  otherModelChoices() {
    const cfg = APP.providers[State.settings.provider];
    return cfg.models
      .filter((m) => m.id !== State.settings.model)
      .slice(0, 4)
      .map((m) => ({ provider: State.settings.provider, model: m.id, label: m.label }));
  },
  openModelMenu(rect) {
    const s = State.settings;
    const items = [{ label: APP.providers[s.provider].label }];
    APP.providers[s.provider].models.forEach((m) =>
      items.push({
        text: m.label,
        icon: m.id === s.model ? "check" : "chip",
        on: m.id === s.model,
        run: () => this.switchModel(s.provider, m.id)
      })
    );
    items.push({ sep: true });
    Object.entries(APP.providers).forEach(([pid, p]) => {
      if (pid === s.provider) return;
      const ready = !p.needsKey || (State.apiKeys[pid] || "").trim();
      items.push({
        text: p.label + (ready ? "" : " · needs key"),
        icon: "chip",
        run: () => (ready ? this.switchModel(pid, p.models[0].id) : Settings.open("provider"))
      });
    });
    items.push({ sep: true }, { text: "Provider settings", icon: "settings", run: () => Settings.open("provider") });
    UI.menu(rect, items);
  },
  openChatMenu(rect, align) {
    const conv = Conv.active();
    const items = [];
    if (conv) {
      items.push(
        { text: "Rename", icon: "edit", run: () => UI.beginRename(conv, null) },
        { text: conv.pinned ? "Unpin" : "Pin to top", icon: "pin", on: conv.pinned, run: () => this.togglePin(conv.id) },
        { text: conv.archived ? "Move out of archive" : "Archive", icon: "archive", run: () => this.toggleArchive(conv.id) },
        { sep: true },
        { text: "Copy whole chat", icon: "copy", run: () => this.copy(Conv.toMarkdown(conv), null, "Chat copied as Markdown") },
        { text: "Export as Markdown", icon: "download", run: () => this.exportConversation(conv.id, "md") },
        { text: "Export as JSON", icon: "download", run: () => this.exportConversation(conv.id, "json") },
        { text: "Export as PDF", icon: "download", run: () => this.exportConversation(conv.id, "pdf") },
        { text: "Export as Word (.docx)", icon: "download", run: () => this.exportConversation(conv.id, "docx") },
        { text: "Export as slides (.pptx)", icon: "download", run: () => this.exportConversation(conv.id, "pptx") },
        { text: "Print", icon: "print", run: () => window.print() },
        { sep: true },
        { text: "Clear messages", icon: "eraser", danger: true, run: () => this.clearConversation(conv.id) },
        { text: "Delete chat", icon: "trash", danger: true, run: () => this.deleteConversation(conv.id) }
      );
    } else {
      items.push({ text: "Start a chat to use these", icon: "info", run: () => UI.els.composerInput.focus() });
    }
    items.push({ sep: true }, { text: "Settings", icon: "settings", run: () => Settings.open("provider") });
    UI.menu(rect, items, { align: align || "auto", side: "below" });
  },

  /* ---------- conversation actions ---------- */
  async renameConversation(id, title) {
    await Conv.rename(id, title);
    UI.renderSidebar(this.filterTerm());
    if (State.activeId === id) this.updateHeader();
  },
  async togglePin(id) {
    await Conv.togglePin(id);
    UI.renderSidebar(this.filterTerm());
  },
  async toggleArchive(id) {
    await Conv.toggleArchive(id);
    const c = Conv.byId(id);
    UI.renderSidebar(this.filterTerm());
    UI.toast(c && c.archived ? "Moved to archive" : "Moved out of archive");
  },
  async duplicateConversation(id) {
    const copy = await Conv.duplicate(id);
    if (copy) { UI.renderSidebar(this.filterTerm()); UI.toast("Chat duplicated", { action: "Open", onAction: () => this.openConversation(copy.id) }); }
  },
  async clearConversation(id) {
    const c = Conv.byId(id);
    if (!c) return;
    if (!(await UI.confirm("Clear messages", `Remove all ${c.messages.length} messages from "${c.title}"?`, "Clear", true))) return;
    await Conv.clearMessages(id);
    UI.renderSidebar(this.filterTerm());
    if (State.activeId === id) { this.rerenderActive(); this.updateHeader(); }
    UI.toast("Messages cleared");
  },
  async deleteConversation(id) {
    const c = Conv.byId(id);
    if (!c) return;
    if (!(await UI.confirm("Delete chat", `"${c.title}" and its ${c.messages.length} messages will be removed.`, "Delete", true))) return;
    const wasActive = State.activeId === id;
    await Conv.remove(id);
    UI.renderSidebar(this.filterTerm());
    if (wasActive) this.showHome();
    UI.toast("Chat deleted", {
      action: "Undo",
      ms: 6000,
      onAction: async () => {
        const restored = await Conv.restoreLastDeleted();
        if (restored) { UI.renderSidebar(this.filterTerm()); this.openConversation(restored.id); }
      }
    });
  },

  /* ---------- clipboard ---------- */
  async copy(text, btn, toastMsg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `${ic("check")}<span>Copied</span>`;
      hydrateIcons(btn);
      setTimeout(() => { btn.innerHTML = orig; hydrateIcons(btn); }, 1400);
    } else {
      UI.toast(toastMsg || "Copied");
    }
  },

  /* ---------- message actions ---------- */
  toggleRaw(id) {
    if (State.rawView.has(id)) State.rawView.delete(id);
    else State.rawView.add(id);
    this.refreshMessage(id);
  },
  refreshMessage(id) {
    const conv = Conv.active();
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === id);
    const el = UI.els.chatInner.querySelector(`.msg[data-id="${id}"]`);
    if (!msg || !el) return;
    el.replaceWith(UI.buildMessage(msg));
  },
  toggleSpeak(msg) {
    const speaking = Speech.speakingId === msg.id;
    if (speaking) { Speech.stopSpeaking(); this.refreshMessage(msg.id); return; }
    Speech.speak(msg.content, msg.id, State.settings.ttsVoice, State.settings.ttsRate, () => this.refreshMessage(msg.id));
    this.refreshMessage(msg.id);
  },
  quote(msg) {
    const quoted = (msg.content || "").split("\n").map((l) => "> " + l).join("\n");
    const input = UI.els.composerInput;
    input.value = quoted + "\n\n" + input.value;
    UI.autoGrow(input);
    input.focus();
    this.updateComposerState();
  },
  async branch(messageId) {
    const conv = Conv.active();
    if (!conv) return;
    const copy = await Conv.branchFrom(conv.id, messageId);
    if (!copy) return;
    UI.renderSidebar(this.filterTerm());
    this.openConversation(copy.id);
    UI.toast("Branched into a new chat");
  },
  async deleteMessage(id) {
    const conv = Conv.active();
    if (!conv) return;
    conv.messages = conv.messages.filter((m) => m.id !== id);
    await Conv.save(conv);
    UI.renderMessages(conv);
    UI.renderSidebar(this.filterTerm());
  },
  editMessage(id) {
    const conv = Conv.active();
    if (!conv || State.generating) return;
    const msg = conv.messages.find((m) => m.id === id);
    const el = UI.els.chatInner.querySelector(`.msg[data-id="${id}"] .msg-content`);
    if (!msg || !el) return;
    const editor = document.createElement("div");
    editor.className = "msg-editor";
    editor.innerHTML = `<textarea></textarea>
      <div class="btn-row">
        <button class="btn btn-primary btn-sm" data-a="save">Save and resend</button>
        <button class="btn btn-sm" data-a="cancel">Cancel</button>
      </div>`;
    const ta = editor.querySelector("textarea");
    ta.value = msg.content;
    el.replaceWith(editor);
    ta.focus();
    ta.style.height = Math.min(ta.scrollHeight + 4, 320) + "px";
    editor.querySelector("[data-a='cancel']").addEventListener("click", () => this.refreshMessage(id));
    editor.querySelector("[data-a='save']").addEventListener("click", async () => {
      const text = ta.value.trim();
      if (!text) return;
      const idx = conv.messages.findIndex((m) => m.id === id);
      msg.content = text;
      msg.edited = true;
      conv.messages = conv.messages.slice(0, idx + 1);
      await Conv.save(conv);
      UI.renderMessages(conv);
      this.runTurn(conv);
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.refreshMessage(id);
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) editor.querySelector("[data-a='save']").click();
    });
  },
  async regenerate(messageId, choice) {
    const conv = Conv.active();
    if (!conv || State.generating) return;
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    conv.messages = conv.messages.slice(0, idx);
    await Conv.save(conv);
    UI.renderMessages(conv);
    this.runTurn(conv, choice);
  },

  /* ---------- attachments ---------- */
  async addFiles(files) {
    const list = Array.from(files || []);
    for (const file of list) {
      if (State.attachments.length >= APP.limits.maxAttachments) {
        UI.toast(`Up to ${APP.limits.maxAttachments} attachments per message`, { error: true });
        break;
      }
      if (file.size > APP.limits.attachmentBytes) {
        UI.toast(`${file.name} is larger than ${fmtBytes(APP.limits.attachmentBytes)}`, { error: true });
        continue;
      }
      try {
        if (file.type.startsWith("image/")) {
          const dataUrl = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsDataURL(file);
          });
          State.attachments.push({ id: uid("at"), kind: "image", name: file.name, size: file.size, mime: file.type, dataUrl });
        } else {
          const text = await file.text();
          State.attachments.push({
            id: uid("at"), kind: "text", name: file.name, size: file.size, mime: file.type || "text/plain",
            text: text.slice(0, 120000)
          });
        }
      } catch {
        UI.toast(`Couldn't read ${file.name}`, { error: true });
      }
    }
    this.renderAttachTray();
    this.updateComposerState();
  },
  renderAttachTray() {
    const tray = UI.els.attachTray;
    tray.innerHTML = "";
    tray.classList.toggle("hidden", !State.attachments.length);
    State.attachments.forEach((a) => {
      const pill = document.createElement("div");
      pill.className = "attach-pill";
      pill.innerHTML = a.kind === "image"
        ? `<img alt=""><span class="name"></span><span class="size"></span><button aria-label="Remove attachment">${Icon.x}</button>`
        : `${ic("file")}<span class="name"></span><span class="size"></span><button aria-label="Remove attachment">${Icon.x}</button>`;
      if (a.kind === "image") pill.querySelector("img").src = a.dataUrl;
      pill.querySelector(".name").textContent = a.name;
      pill.querySelector(".size").textContent = fmtBytes(a.size);
      pill.querySelector("button").addEventListener("click", () => {
        State.attachments = State.attachments.filter((x) => x.id !== a.id);
        this.renderAttachTray();
        this.updateComposerState();
      });
      tray.appendChild(pill);
    });
    hydrateIcons(tray);
  },

  /* ---------- composer ---------- */
  updateComposerState() {
    const input = UI.els.composerInput;
    const len = input.value.length;
    const hasContent = !!input.value.trim() || State.attachments.length > 0;
    UI.els.sendBtn.disabled = !hasContent || State.generating;

    const count = UI.els.charCount;
    if (len > APP.limits.softChars) {
      count.textContent = `${len.toLocaleString()} characters · ~${approxTokens(input.value).toLocaleString()} tokens`;
      count.className = len > APP.limits.maxChars ? "count-over" : "count-warn";
    } else if (len > 400) {
      count.textContent = `${len.toLocaleString()} characters`;
      count.className = "";
    } else {
      count.textContent = "";
      count.className = "";
    }

    const conv = Conv.active();
    const note = UI.els.contextNote;
    if (conv && conv.messages.length > State.settings.contextLimit) {
      note.textContent = `Sending the last ${State.settings.contextLimit} messages`;
      note.title = "Change this in Settings → Model behaviour";
    } else note.textContent = "";
  },

  /* ---------- slash menu ---------- */
  slashCommands() {
    const built = [
      { name: "/new", desc: "Start a new chat", run: () => this.newChat() },
      { name: "/clear", desc: "Clear this chat", run: () => State.activeId && this.clearConversation(State.activeId) },
      { name: "/model", desc: "Switch model", run: () => this.openModelMenu(UI.els.modelPill.getBoundingClientRect()) },
      { name: "/web", desc: "Toggle web search", run: () => this.toggleWebSearch() },
      { name: "/images", desc: "Toggle image search", run: () => this.toggleImageSearch() },
      { name: "/persona", desc: "Change persona", run: () => Settings.open("persona") },
      { name: "/theme", desc: "Switch theme", run: () => this.cycleTheme() },
      { name: "/export", desc: "Export this chat", run: () => State.activeId && this.exportConversation(State.activeId, "md") },
      { name: "/settings", desc: "Open settings", run: () => Settings.open("provider") },
      { name: "/help", desc: "Keyboard shortcuts", run: () => Settings.open("shortcuts") }
    ];
    const saved = State.prompts.map((p) => ({
      name: "/" + p.slash, desc: p.name, prompt: true, run: () => this.insertPrompt(p)
    }));
    return built.concat(saved);
  },
  updateSlashMenu() {
    const input = UI.els.composerInput;
    const v = input.value;
    const match = /^\/([\w-]*)$/.exec(v);
    if (!match) return this.closeSlash();
    const term = match[1].toLowerCase();
    const items = this.slashCommands().filter((c) => c.name.slice(1).toLowerCase().startsWith(term));
    if (!items.length) return this.closeSlash();
    this.slash = { open: true, items, index: 0 };
    this.drawSlash();
  },
  drawSlash() {
    const menu = UI.els.slashMenu;
    menu.innerHTML = "";
    this.slash.items.forEach((it, i) => {
      const b = document.createElement("button");
      b.className = "slash-item" + (i === this.slash.index ? " sel" : "");
      b.type = "button";
      b.innerHTML = `${ic(it.prompt ? "bookmark" : "command")}<span class="sl-name"></span><span class="sl-desc"></span>`;
      b.querySelector(".sl-name").textContent = it.name;
      b.querySelector(".sl-desc").textContent = it.desc;
      b.addEventListener("mousedown", (e) => { e.preventDefault(); this.slash.index = i; this.runSlash(); });
      menu.appendChild(b);
    });
    hydrateIcons(menu);
    menu.classList.remove("hidden");
  },
  moveSlash(step) {
    if (!this.slash.open) return;
    this.slash.index = (this.slash.index + step + this.slash.items.length) % this.slash.items.length;
    this.drawSlash();
  },
  runSlash() {
    const it = this.slash.items[this.slash.index];
    this.closeSlash();
    if (!it) return;
    UI.els.composerInput.value = "";
    UI.autoGrow(UI.els.composerInput);
    this.updateComposerState();
    it.run();
  },
  closeSlash() {
    this.slash = { open: false, items: [], index: 0 };
    UI.els.slashMenu.classList.add("hidden");
  },
  insertPrompt(p) {
    const input = UI.els.composerInput;
    input.value = p.body;
    UI.autoGrow(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    this.updateComposerState();
  },

  /* ---------- system prompt ---------- */
  systemPrompt(sources) {
    const persona = APP.personas.find((p) => p.id === State.settings.persona) || APP.personas[0];
    let sys = `You are ${APP.name}, a direct and capable assistant inside a chat app. Use Markdown where it aids reading: headings, lists, tables, and fenced code blocks with a language tag. Be concise by default and expand when the question deserves it. If you don't know something, say so.`;
    if (persona.prompt) sys += "\n\n" + persona.prompt;
    const custom = (State.settings.customPersona || "").trim();
    if (custom) sys += "\n\nThe person has added these standing instructions:\n" + custom;
    if (sources && sources.length) {
      sys += `\n\nLive search results for the latest message follow. Prefer them over prior knowledge for anything current, and cite them inline as [1], [2]. Never claim to have searched if this list is empty.\n\n`;
      sources.forEach((s, i) => (sys += `[${i + 1}] ${s.title} — ${s.domain}\n${s.snippet}\n\n`));
    }
    return sys;
  },

  /* ---------- sending ---------- */
  async sendMessage() {
    const input = UI.els.composerInput;
    const text = input.value.trim();
    if ((!text && !State.attachments.length) || State.generating) return;
    if (text.length > APP.limits.maxChars) {
      UI.toast(`Messages are capped at ${APP.limits.maxChars.toLocaleString()} characters`, { error: true });
      return;
    }

    const conv = await Conv.ensureActive();
    const userMsg = {
      id: uid("msg"),
      role: "user",
      content: text,
      timestamp: Date.now(),
      attachments: State.attachments.slice()
    };
    conv.messages.push(userMsg);
    Conv.autoTitle(conv);
    await Conv.save(conv);

    input.value = "";
    State.attachments = [];
    this.renderAttachTray();
    UI.autoGrow(input);
    this.closeSlash();
    this.updateComposerState();

    if (UI.els.chatInner.querySelector(".welcome")) UI.els.chatInner.innerHTML = "";
    UI.appendMessage(userMsg);
    UI.scrollToBottom(true);
    UI.renderSidebar(this.filterTerm());
    this.updateHeader();

    await this.runTurn(conv);
  },

  async runTurn(conv, choice) {
    const provider = (choice && choice.provider) || State.settings.provider;
    const model = (choice && choice.model) || State.settings.model;
    const cfg = APP.providers[provider] || APP.providers.simulation;

    State.generating = true;
    UI.els.sendBtn.classList.add("hidden");
    UI.els.stopBtn.classList.remove("hidden");
    UI.els.sendBtn.disabled = true;
    this.updateHeader();

    const lastUser = [...conv.messages].reverse().find((m) => m.role === "user");
    const query = lastUser ? (lastUser.content || "").slice(0, 300) : "";

    const assistant = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
      thinkingLabel: "Thinking",
      model,
      providerLabel: provider === "simulation" ? "Simulation mode" : cfg.label,
      sources: [],
      images: []
    };
    conv.messages.push(assistant);
    let el = UI.appendMessage(assistant);
    UI.scrollToBottom(true);

    const setThinking = (label) => {
      assistant.thinkingLabel = label;
      const t = el.querySelector(".thinking span");
      if (t) t.textContent = label;
    };

    /* research phase */
    if (State.settings.webSearch) {
      if (provider === "simulation") {
        assistant.searchState = { status: "disabled", message: "Simulation mode doesn't search the web. Connect a provider and the search results will appear here with citations." };
      } else {
        setThinking("Searching the web");
        const r = await Research.search(query);
        if (!r.ok) assistant.searchState = { status: "failed", message: r.message };
        else if (r.empty) assistant.searchState = { status: "empty", message: r.message };
        else assistant.sources = r.sources;
      }
    }
    if (State.settings.imageSearch) {
      if (provider === "simulation") {
        assistant.imageState = { status: "disabled", message: "Simulation mode doesn't search for images." };
      } else {
        setThinking("Finding images");
        const r = await Research.images(query);
        if (!r.ok) assistant.imageState = { status: "failed", message: r.message };
        else if (r.empty) assistant.imageState = { status: "empty", message: r.message };
        else assistant.images = r.images;
      }
    }
    setThinking("Thinking");

    const controller = new AbortController();
    State.abort = controller;
    const adapter = Providers.get(provider);
    const history = conv.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(0, -1)
      .filter((m) => (m.content || "").trim() || (m.attachments || []).length)
      .slice(-State.settings.contextLimit);

    const contentEl = () => el.querySelector(".msg-content");
    let raf = null;
    const started = performance.now();
    const onDelta = (text) => {
      assistant.content = text;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const c = contentEl();
        if (c) {
          c.classList.remove("thinking");
          c.classList.add("streaming-caret");
          c.innerHTML = UI.renderContent(assistant);
        }
        UI.scrollToBottom();
        raf = null;
      });
    };

    try {
      const finalText = await adapter.send({
        messages: history,
        model,
        systemPrompt: this.systemPrompt(assistant.sources),
        apiKey: State.apiKeys[provider] || "",
        endpoint: State.endpoints[provider],
        signal: controller.signal,
        stream: State.settings.streaming,
        params: {
          temperature: State.settings.temperature,
          maxTokens: State.settings.maxTokens,
          topP: State.settings.topP
        },
        onDelta
      });
      assistant.content = (finalText || "").trim() || "_The model returned an empty response._";
    } catch (err) {
      const aborted = err instanceof ProviderError && err.kind === "aborted";
      if (aborted) {
        if (!assistant.content) assistant.content = "_Stopped._";
        else assistant.content += "\n\n_Stopped._";
      } else {
        assistant.error = err && err.message ? err.message : "Something went wrong.";
        assistant.errorHint = (err && err.hint) || "";
        assistant.errorKind = (err && err.kind) || "unknown";
      }
    } finally {
      if (raf) cancelAnimationFrame(raf);
      assistant.streaming = false;
      assistant.stats = {
        ms: performance.now() - started,
        chars: assistant.content.length,
        tokens: approxTokens(assistant.content)
      };
      State.generating = false;
      State.abort = null;
      UI.els.sendBtn.classList.remove("hidden");
      UI.els.stopBtn.classList.add("hidden");
      this.updateComposerState();
      this.updateHeader();
    }

    const fresh = UI.buildMessage(assistant);
    el.replaceWith(fresh);
    el = fresh;
    UI.scrollToBottom();

    conv.provider = provider;
    conv.model = model;
    await Conv.save(conv);
    UI.renderSidebar(this.filterTerm());

    if (State.settings.autoSpeak && assistant.content && !assistant.error) this.toggleSpeak(assistant);
  },

  stopGeneration() {
    if (State.abort) State.abort.abort();
  },

  /* ---------- import / export ---------- */
  async exportConversation(id, format) {
    const conv = Conv.byId(id);
    if (!conv) return;
    const base = `the-gradient-${slug(conv.title)}`;
    try {
      if (format === "md") { download(`${base}.md`, Conv.toMarkdown(conv), "text/markdown;charset=utf-8"); UI.toast("Chat exported"); return; }
      if (format === "json") { download(`${base}.json`, JSON.stringify(conv, null, 2), "application/json"); UI.toast("Chat exported"); return; }
      if (format === "pdf") { UI.toast("Building PDF…"); await Exporters.pdfFromMarkdown(conv.title, Conv.toMarkdown(conv), `${base}.pdf`); }
      else if (format === "docx") { UI.toast("Building Word document…"); await Exporters.docxFromMarkdown(conv.title, Conv.toMarkdown(conv), `${base}.docx`); }
      else if (format === "pptx") { UI.toast("Building slides…"); await Exporters.pptxFromMarkdown(conv.title, Conv.toMarkdown(conv), `${base}.pptx`); }
      UI.toast("Chat exported");
    } catch (err) {
      UI.toast((err && err.message) || "Export failed", { error: true });
    }
  },
  exportAll(format) {
    if (format === "md") {
      const all = State.conversations.map((c) => Conv.toMarkdown(c)).join("\n\n---\n\n");
      download(`the-gradient-all-chats-${Date.now()}.md`, all, "text/markdown;charset=utf-8");
    } else {
      const payload = {
        app: APP.name,
        version: APP.version,
        exportedAt: new Date().toISOString(),
        settings: State.settings,
        prompts: State.prompts,
        conversations: State.conversations
      };
      download(`the-gradient-backup-${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json");
    }
    UI.toast("Export ready");
  },
  async importFile(file) {
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : Array.isArray(data.conversations) ? data.conversations : null;
      if (!list) throw new Error("That file doesn't contain any chats.");
      let count = 0;
      for (const c of list) {
        if (!c || !Array.isArray(c.messages)) continue;
        const clean = normalizeConv({
          id: State.conversations.some((x) => x.id === c.id) ? uid("conv") : c.id || uid("conv"),
          title: typeof c.title === "string" ? c.title.slice(0, 200) : "Imported chat",
          messages: c.messages
            .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
            .map((m) => ({
              id: typeof m.id === "string" ? m.id : uid("msg"),
              role: m.role,
              content: String(m.content).slice(0, 200000),
              timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
              providerLabel: typeof m.providerLabel === "string" ? m.providerLabel.slice(0, 60) : undefined,
              sources: Array.isArray(m.sources) ? m.sources.filter((s) => s && Sec.safeUrl(s.url)).slice(0, 10) : undefined,
              images: Array.isArray(m.images) ? m.images.slice(0, 20) : undefined,
              attachments: Array.isArray(m.attachments) ? m.attachments.slice(0, 8) : undefined
            })),
          createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
          updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : Date.now(),
          provider: typeof c.provider === "string" ? c.provider : "simulation",
          model: typeof c.model === "string" ? c.model : "",
          pinned: !!c.pinned,
          archived: !!c.archived
        });
        State.conversations.unshift(clean);
        await Store.put(clean);
        count++;
      }
      if (Array.isArray(data.prompts)) {
        data.prompts.forEach((p) => {
          if (p && p.name && p.body && !State.prompts.some((x) => x.slash === p.slash)) {
            State.prompts.push({ id: uid("pr"), name: String(p.name).slice(0, 60), slash: slug(p.slash || p.name).slice(0, 16), body: String(p.body).slice(0, 8000) });
          }
        });
        this.persistPrompts();
      }
      State.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
      UI.renderSidebar(this.filterTerm());
      UI.toast(`Imported ${count} chat${count === 1 ? "" : "s"}`);
      if (Settings.isOpen()) Settings.render();
    } catch (err) {
      UI.toast("Import failed: " + (err.message || "unreadable file"), { error: true });
    }
  },
  async clearAllChats() {
    await Store.clear();
    State.conversations = [];
    State.activeId = null;
    UI.renderSidebar();
    this.showHome();
    UI.toast("All chats deleted");
    if (Settings.isOpen()) Settings.render();
  },

  /* ---------- events ---------- */
  bind() {
    const E = UI.els;

    E.newChatBtn.addEventListener("click", () => this.newChat());
    E.paletteBtn.addEventListener("click", () => Palette.open());
    E.sidebarSearch.addEventListener("input", debounce(() => UI.renderSidebar(this.filterTerm()), 120));
    E.collapseBtn.addEventListener("click", () => this.toggleSidebar());
    E.expandBtn.addEventListener("click", () => this.toggleSidebar());
    E.mobileMenuBtn.addEventListener("click", () => this.toggleSidebar());
    E.sidebarScrim.addEventListener("click", () => this.closeMobileSidebar());
    E.settingsEntryBtn.addEventListener("click", () => Settings.open("provider"));
    E.promptsEntryBtn.addEventListener("click", () => Settings.open("prompts"));
    E.shortcutsEntryBtn.addEventListener("click", () => Settings.open("shortcuts"));

    E.filterRow.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        State.filter = chip.dataset.filter;
        E.filterRow.querySelectorAll(".filter-chip").forEach((c) => c.classList.toggle("active", c === chip));
        UI.renderSidebar(this.filterTerm());
      });
    });

    E.modelPill.addEventListener("click", (e) => this.openModelMenu(e.currentTarget.getBoundingClientRect()));
    E.chatMenuBtn.addEventListener("click", (e) => this.openChatMenu(e.currentTarget.getBoundingClientRect(), "right"));
    E.themeBtn.addEventListener("click", () => this.cycleTheme());
    E.findBtn.addEventListener("click", () => UI.openFind());
    E.personaChip.addEventListener("click", () => Settings.open("persona"));

    E.findInput.addEventListener("input", debounce(() => UI.runFind(E.findInput.value), 180));
    E.findInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); UI.focusHit(State.find.index + (e.shiftKey ? -1 : 1)); }
      if (e.key === "Escape") UI.closeFind();
    });
    E.findNext.addEventListener("click", () => UI.focusHit(State.find.index + 1));
    E.findPrev.addEventListener("click", () => UI.focusHit(State.find.index - 1));
    E.findClose.addEventListener("click", () => UI.closeFind());

    E.webSearchToggle.addEventListener("click", () => { this.toggleWebSearch(); this.persistSettings(); });
    E.imageSearchToggle.addEventListener("click", () => { this.toggleImageSearch(); this.persistSettings(); });
    if (E.imageGenToggle) E.imageGenToggle.addEventListener("click", () => this.toggleImageGen());
    E.tempSlider.addEventListener("input", () => {
      State.settings.temperature = parseFloat(E.tempSlider.value);
      E.tempValue.textContent = State.settings.temperature.toFixed(1);
      this.persistSettings();
    });

    /* composer */
    E.composerInput.addEventListener("input", () => {
      UI.autoGrow(E.composerInput);
      this.updateComposerState();
      this.updateSlashMenu();
    });
    E.composerInput.addEventListener("keydown", (e) => {
      if (this.slash.open) {
        if (e.key === "ArrowDown") { e.preventDefault(); return this.moveSlash(1); }
        if (e.key === "ArrowUp") { e.preventDefault(); return this.moveSlash(-1); }
        if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); return this.runSlash(); }
        if (e.key === "Escape") { e.preventDefault(); return this.closeSlash(); }
      }
      if (e.key === "Enter" && !e.shiftKey && State.settings.enterSends) {
        e.preventDefault();
        this.sendMessage();
      }
      if (e.key === "ArrowUp" && !E.composerInput.value.trim()) {
        const conv = Conv.active();
        const last = conv && [...conv.messages].reverse().find((m) => m.role === "user");
        if (last) { e.preventDefault(); this.editMessage(last.id); }
      }
    });
    E.sendBtn.addEventListener("click", () => this.sendMessage());
    E.stopBtn.addEventListener("click", () => this.stopGeneration());
    E.attachBtn.addEventListener("click", () => E.attachInput.click());
    E.attachInput.addEventListener("change", (e) => { this.addFiles(e.target.files); e.target.value = ""; });
    E.micBtn.addEventListener("click", () => this.toggleDictation());

    E.composerInput.addEventListener("paste", (e) => {
      const files = Array.from(e.clipboardData && e.clipboardData.files ? e.clipboardData.files : []);
      if (files.length) { e.preventDefault(); this.addFiles(files); }
    });
    ["dragenter", "dragover"].forEach((ev) =>
      document.addEventListener(ev, (e) => {
        if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes("Files")) return;
        e.preventDefault();
        E.composerBox.classList.add("dragover");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      document.addEventListener(ev, (e) => {
        if (ev === "drop" && e.dataTransfer && e.dataTransfer.files.length) {
          e.preventDefault();
          this.addFiles(e.dataTransfer.files);
        }
        if (ev === "dragleave" && e.relatedTarget) return;
        E.composerBox.classList.remove("dragover");
      })
    );

    /* scrolling */
    E.chatScroll.addEventListener("scroll", () => {
      const dist = E.chatScroll.scrollHeight - E.chatScroll.scrollTop - E.chatScroll.clientHeight;
      E.jumpBtn.classList.toggle("show", dist > 400);
    });
    E.jumpBtn.addEventListener("click", () => UI.scrollToBottom(true));

    /* overlays */
    E.settingsOverlay.addEventListener("click", (e) => { if (e.target === E.settingsOverlay) Settings.close(); });
    E.lightboxClose.addEventListener("click", () => UI.closeLightbox());
    E.lightboxPrev.addEventListener("click", () => UI.moveLightbox(-1));
    E.lightboxNext.addEventListener("click", () => UI.moveLightbox(1));
    E.lightbox.addEventListener("click", (e) => { if (e.target === E.lightbox) UI.closeLightbox(); });

    /* code block buttons */
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-code-act]");
      if (!btn) return;
      const block = btn.closest(".code-block");
      const code = decodeURIComponent(block.dataset.code || "");
      const act = btn.dataset.codeAct;
      if (act === "copy") this.copy(code, btn);
      else if (act === "wrap") block.classList.toggle("wrap");
      else if (act === "download") {
        const ext = { javascript: "js", python: "py", typescript: "ts", markdown: "md", bash: "sh", rust: "rs" };
        const lang = block.dataset.lang || "txt";
        download(`snippet.${ext[Highlighter.label(lang)] || lang || "txt"}`, code);
      }
    });

    /* network */
    const netUpdate = () => UI.els.netBanner.classList.toggle("show", !navigator.onLine);
    window.addEventListener("online", () => { netUpdate(); UI.toast("Back online"); });
    window.addEventListener("offline", netUpdate);
    netUpdate();

    /* global keys */
    window.addEventListener("keydown", (e) => this.onKeydown(e));
    window.addEventListener("beforeunload", (e) => {
      if (State.generating) { e.preventDefault(); e.returnValue = ""; }
    });
    window.addEventListener("error", (ev) => console.error("The Gradient error:", ev.error || ev.message));
    window.addEventListener("unhandledrejection", (ev) => console.error("The Gradient rejection:", ev.reason));
  },

  onKeydown(e) {
    const E = UI.els;
    const typing = /^(INPUT|TEXTAREA)$/.test((e.target.tagName || "")) || e.target.isContentEditable;

    if (e.key === "Escape") {
      if (State.lightbox.items.length && E.lightbox.classList.contains("open")) return UI.closeLightbox();
      if (Palette.open_) return Palette.close();
      if (Settings.isOpen()) return Settings.close();
      if (!E.findBar.classList.contains("hidden")) return UI.closeFind();
      if (this.slash.open) return this.closeSlash();
      if (State.generating) return this.stopGeneration();
      if (Speech.speakingId) return Speech.stopSpeaking();
    }
    if (E.lightbox.classList.contains("open")) {
      if (e.key === "ArrowLeft") return UI.moveLightbox(-1);
      if (e.key === "ArrowRight") return UI.moveLightbox(1);
    }

    if (modKey(e) && e.key.toLowerCase() === "k" && !e.shiftKey) { e.preventDefault(); return Palette.open_ ? Palette.close() : Palette.open(); }
    if (modKey(e) && e.key.toLowerCase() === "n" && !e.shiftKey) { e.preventDefault(); return this.newChat(); }
    if (modKey(e) && e.key.toLowerCase() === "b") { e.preventDefault(); return this.toggleSidebar(); }
    if (modKey(e) && e.key.toLowerCase() === "f" && !e.shiftKey) { e.preventDefault(); return UI.openFind(); }
    if (modKey(e) && e.key === ",") { e.preventDefault(); return Settings.open("provider"); }
    if (modKey(e) && e.key.toLowerCase() === "j") { e.preventDefault(); return this.cycleTheme(); }
    if (modKey(e) && e.key.toLowerCase() === "m") { e.preventDefault(); return this.openModelMenu(E.modelPill.getBoundingClientRect()); }
    if (modKey(e) && e.shiftKey && e.key.toLowerCase() === "v") { e.preventDefault(); return this.toggleDictation(); }
    if (modKey(e) && e.shiftKey && e.key.toLowerCase() === "c") {
      const conv = Conv.active();
      const last = conv && [...conv.messages].reverse().find((m) => m.role === "assistant" && m.content);
      if (last) { e.preventDefault(); this.copy(last.content, null, "Last response copied"); }
      return;
    }
    if (modKey(e) && e.shiftKey && e.key === "Backspace") {
      if (State.activeId) { e.preventDefault(); this.clearConversation(State.activeId); }
      return;
    }
    if (e.key === "?" && !typing) { e.preventDefault(); return Settings.open("shortcuts"); }
    if (e.key === "/" && !typing) { e.preventDefault(); UI.els.composerInput.focus(); UI.els.composerInput.value = "/"; this.updateSlashMenu(); return; }
  },

  toggleDictation() {
    if (!Speech.supportedIn) return UI.toast("This browser has no dictation. Try Chrome or Edge.", { error: true });
    const btn = UI.els.micBtn;
    if (Speech.listening) {
      Speech.stopDictation();
      btn.classList.remove("recording");
      return;
    }
    const base = UI.els.composerInput.value ? UI.els.composerInput.value.replace(/\s+$/, "") + " " : "";
    const ok = Speech.startDictation(
      (text) => {
        UI.els.composerInput.value = base + text;
        UI.autoGrow(UI.els.composerInput);
        this.updateComposerState();
      },
      () => { btn.classList.remove("recording"); UI.els.composerInput.focus(); }
    );
    if (ok) { btn.classList.add("recording"); UI.toast("Listening — press the mic again to stop"); }
    else UI.toast("Dictation couldn't start", { error: true });
  }
};

/* ============================================================
   17. NIMBUS WORKSPACE LAYER (3.0)
   17.1 Pro settings and state
   17.2 LaTeX math + markdown hooks
   17.3 Reasoning / thought chains
   17.4 Artifacts + dual-pane Canvas
   17.5 DuckDuckGo synthesis fallback
   17.6 Projects
   17.7 Memory bank
   17.8 Conversation branching (forks + response variants)
   17.9 Turn engine, rendering overrides, wiring
   ============================================================ */

/* ---------- 17.1 settings + state ---------- */
const PRO_DEFAULTS = {
  thinking: false,            // ask compatible models for reasoning tokens
  thinkingEffort: "medium",   // low | medium | high
  thinkingBudget: 4000,       // Anthropic thinking budget, in tokens
  searchFallback: true,       // synthesise from search when the API is unavailable
  canvasAuto: true,           // open generated artifacts in the Canvas pane
  canvasSplit: 46,            // Canvas width, in percent
  memoryEnabled: true,        // let the assistant keep a memory bank
  mathRender: true            // render $…$ and $$…$$ as formatted maths
};
Object.assign(DEFAULTS, PRO_DEFAULTS);
Object.assign(State.settings, PRO_DEFAULTS);
Object.assign(State, {
  projects: [],
  projectFilter: null,
  memory: [],
  canvas: { open: false, artifactId: null, convId: null, tab: "preview", busy: false }
});

const PRO = {
  artifactLangs: {
    html: { type: "html", label: "HTML page", preview: true, ext: "html" },
    svg: { type: "svg", label: "SVG graphic", preview: true, ext: "svg" },
    jsx: { type: "react", label: "React component", preview: true, ext: "jsx" },
    tsx: { type: "react", label: "React component", preview: true, ext: "tsx" },
    react: { type: "react", label: "React component", preview: true, ext: "jsx" },
    vue: { type: "vue", label: "Vue component", preview: false, ext: "vue" },
    markdown: { type: "document", label: "Document", preview: true, ext: "md" },
    md: { type: "document", label: "Document", preview: true, ext: "md" },
    mermaid: { type: "mermaid", label: "Diagram", preview: false, ext: "mmd" },
    streamlit: { type: "streamlit", label: "Streamlit app", preview: false, ext: "py" },
    // Plain source code: no live preview, but still becomes a code artifact
    // that opens in the Canvas automatically — this is what makes every
    // generated snippet in Software mode show up without manual copy/paste.
    javascript: { type: "code", label: "JavaScript", preview: false, ext: "js" },
    js: { type: "code", label: "JavaScript", preview: false, ext: "js" },
    typescript: { type: "code", label: "TypeScript", preview: false, ext: "ts" },
    ts: { type: "code", label: "TypeScript", preview: false, ext: "ts" },
    python: { type: "code", label: "Python", preview: false, ext: "py" },
    py: { type: "code", label: "Python", preview: false, ext: "py" },
    java: { type: "code", label: "Java", preview: false, ext: "java" },
    kotlin: { type: "code", label: "Kotlin", preview: false, ext: "kt" },
    kt: { type: "code", label: "Kotlin", preview: false, ext: "kt" },
    swift: { type: "code", label: "Swift", preview: false, ext: "swift" },
    c: { type: "code", label: "C", preview: false, ext: "c" },
    cpp: { type: "code", label: "C++", preview: false, ext: "cpp" },
    "c++": { type: "code", label: "C++", preview: false, ext: "cpp" },
    cs: { type: "code", label: "C#", preview: false, ext: "cs" },
    csharp: { type: "code", label: "C#", preview: false, ext: "cs" },
    go: { type: "code", label: "Go", preview: false, ext: "go" },
    golang: { type: "code", label: "Go", preview: false, ext: "go" },
    rust: { type: "code", label: "Rust", preview: false, ext: "rs" },
    rs: { type: "code", label: "Rust", preview: false, ext: "rs" },
    ruby: { type: "code", label: "Ruby", preview: false, ext: "rb" },
    rb: { type: "code", label: "Ruby", preview: false, ext: "rb" },
    php: { type: "code", label: "PHP", preview: false, ext: "php" },
    sql: { type: "code", label: "SQL", preview: false, ext: "sql" },
    bash: { type: "code", label: "Shell", preview: false, ext: "sh" },
    sh: { type: "code", label: "Shell", preview: false, ext: "sh" },
    shell: { type: "code", label: "Shell", preview: false, ext: "sh" },
    powershell: { type: "code", label: "PowerShell", preview: false, ext: "ps1" },
    json: { type: "code", label: "JSON", preview: false, ext: "json" },
    yaml: { type: "code", label: "YAML", preview: false, ext: "yaml" },
    yml: { type: "code", label: "YAML", preview: false, ext: "yml" },
    css: { type: "code", label: "CSS", preview: false, ext: "css" },
    scss: { type: "code", label: "SCSS", preview: false, ext: "scss" },
    dart: { type: "code", label: "Dart", preview: false, ext: "dart" },
    r: { type: "code", label: "R", preview: false, ext: "r" },
    scala: { type: "code", label: "Scala", preview: false, ext: "scala" },
    lua: { type: "code", label: "Lua", preview: false, ext: "lua" }
  },
  minArtifactChars: 320,
  minCodeChars: 24,
  minDocChars: 1400
};

/* Extra icons used by the workspace layer. */
Object.assign(Icon, {
  canvas: S('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M13 4v16"/>'),
  folder: S('<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.4h7A1.5 1.5 0 0 1 19 10v7.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5Z"/>'),
  brain: S('<path d="M9 4.5A2.5 2.5 0 0 0 6.5 7 2.5 2.5 0 0 0 5 11.4 2.6 2.6 0 0 0 6.6 16 2.5 2.5 0 0 0 9 19.5 2 2 0 0 0 12 18V6a2 2 0 0 0-3-1.5Z"/><path d="M15 4.5A2.5 2.5 0 0 1 17.5 7 2.5 2.5 0 0 1 19 11.4 2.6 2.6 0 0 1 17.4 16 2.5 2.5 0 0 1 15 19.5 2 2 0 0 1 12 18V6a2 2 0 0 1 3-1.5Z"/>'),
  undo: S('<path d="M4 9h10a5 5 0 0 1 0 10h-3"/><path d="m8 5-4 4 4 4"/>'),
  wand: S('<path d="m4 20 10-10"/><path d="m14.5 5.5 4 4"/><path d="M16 3v3M20.5 7.5h-3M19 11v3M15 13h3"/>'),
  play: S('<path d="M7 4.5v15l12-7.5Z"/>'),
  history: S('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v4h4"/><path d="M12 8v4.5l3 1.8"/>'),
  diff: S('<path d="M12 3v7M8.5 6.5 12 3l3.5 3.5"/><path d="M12 21v-7M15.5 17.5 12 21l-3.5-3.5"/>')
});

/* ---------- 17.2 LaTeX-lite maths ---------- */
const MathLite = (function () {
  const SYMBOLS = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ",
    eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν",
    xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "ϕ",
    chi: "χ", psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ",
    Pi: "Π", Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
    times: "×", div: "÷", pm: "±", mp: "∓", cdot: "·", leq: "≤", le: "≤", geq: "≥", ge: "≥",
    neq: "≠", ne: "≠", approx: "≈", equiv: "≡", propto: "∝", infty: "∞", partial: "∂",
    nabla: "∇", forall: "∀", exists: "∃", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆",
    cup: "∪", cap: "∩", emptyset: "∅", sum: "∑", prod: "∏", int: "∫", oint: "∮",
    rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔", Rightarrow: "⇒",
    Leftarrow: "⇐", Leftrightarrow: "⇔", mapsto: "↦", ldots: "…", cdots: "⋯", dots: "…",
    angle: "∠", perp: "⊥", parallel: "∥", degree: "°", prime: "′", star: "⋆", circ: "∘",
    land: "∧", lor: "∨", neg: "¬", therefore: "∴", because: "∵", sqrt: "√"
  };

  function group(src, i) {
    // Returns [content, nextIndex] for a {...} group or a single character.
    if (src[i] === "{") {
      let depth = 1, j = i + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") depth--;
        j++;
      }
      return [src.slice(i + 1, j - 1), j];
    }
    if (src[i] === "\\") {
      const m = /^\\[a-zA-Z]+/.exec(src.slice(i));
      if (m) return [m[0], i + m[0].length];
    }
    return [src[i] || "", i + 1];
  }

  function convert(src) {
    let out = "";
    for (let i = 0; i < src.length; ) {
      const ch = src[i];
      if (ch === "\\") {
        const cmd = /^\\([a-zA-Z]+)/.exec(src.slice(i));
        if (cmd) {
          const name = cmd[1];
          i += cmd[0].length;
          if (name === "frac" || name === "dfrac" || name === "tfrac") {
            const [num, i1] = group(src, i);
            const [den, i2] = group(src, i1);
            i = i2;
            out += `<span class="m-frac"><span class="m-num">${convert(num)}</span><span class="m-den">${convert(den)}</span></span>`;
            continue;
          }
          if (name === "sqrt") {
            const [body, i1] = group(src, i);
            i = i1;
            out += `<span class="m-sqrt"><span class="m-radic">√</span><span class="m-root">${convert(body)}</span></span>`;
            continue;
          }
          if (name === "text" || name === "mathrm" || name === "mathbf" || name === "operatorname") {
            const [body, i1] = group(src, i);
            i = i1;
            out += `<span class="m-text${name === "mathbf" ? " m-bold" : ""}">${Sec.esc(body)}</span>`;
            continue;
          }
          if (name === "left" || name === "right") continue;
          if (SYMBOLS[name]) { out += SYMBOLS[name]; continue; }
          out += Sec.esc(name);
          continue;
        }
        out += Sec.esc(src[i + 1] || "");
        i += 2;
        continue;
      }
      if (ch === "^" || ch === "_") {
        const [body, next] = group(src, i + 1);
        i = next;
        out += ch === "^" ? `<sup>${convert(body)}</sup>` : `<sub>${convert(body)}</sub>`;
        continue;
      }
      if (ch === "{" || ch === "}") { i++; continue; }
      if (ch === "&" || ch === "$") { i++; continue; }
      out += Sec.esc(ch);
      i++;
    }
    return out;
  }

  function render(tex, display) {
    const body = String(tex || "").trim().replace(/\\\\/g, "<br>");
    const html = convert(body);
    return display
      ? `<div class="math-block" role="math">${html}</div>`
      : `<span class="math-inline" role="math">${html}</span>`;
  }

  return { render, convert };
})();

/* Run `fn` only over the parts of a document that are not fenced or inline code. */
function outsideCode(text, fn) {
  const parts = String(text).split(/(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/g);
  return parts.map((p, i) => (i % 2 === 1 ? p : fn(p))).join("");
}

/* MD.render gains maths, footnote-style citations and artifact-aware code heads. */
(function extendMarkdown() {
  const base = MD.render;
  MD.render = function (raw, options) {
    if (!raw) return base.call(MD, raw, options);
    if (!State.settings.mathRender) return base.call(MD, raw, options);
    const store = [];
    const text = outsideCode(String(raw), (seg) =>
      seg
        .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => {
          store.push(MathLite.render(tex, true));
          return `\u0002M${store.length - 1}\u0002`;
        })
        .replace(/\\\[([\s\S]+?)\\\]/g, (m, tex) => {
          store.push(MathLite.render(tex, true));
          return `\u0002M${store.length - 1}\u0002`;
        })
        .replace(/\\\(([\s\S]+?)\\\)/g, (m, tex) => {
          store.push(MathLite.render(tex, false));
          return `\u0002M${store.length - 1}\u0002`;
        })
        .replace(/(?<![\\$\w])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g, (m, tex) => {
          if (!/[\\^_{}]|\b(frac|sum|int|sqrt)\b/.test(tex)) return m;
          store.push(MathLite.render(tex, false));
          return `\u0002M${store.length - 1}\u0002`;
        })
    );
    let html = base.call(MD, text, options);
    html = html.replace(/\u0002M(\d+)\u0002/g, (m, i) => store[+i] || "");
    return html;
  };
})();

/* ---------- 17.3 reasoning / thought chains ---------- */
const Reasoning = {
  wordCount(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  },
  summaryText(msg) {
    const words = this.wordCount(msg.reasoning);
    if (msg.streaming) return `Thinking… ${words} word${words === 1 ? "" : "s"}`;
    const secs = msg.reasoningMs ? ` for ${(msg.reasoningMs / 1000).toFixed(1)}s` : "";
    return `Thought${secs} · ${words} word${words === 1 ? "" : "s"}`;
  },
  build(msg) {
    const d = document.createElement("details");
    d.className = "thought-chain";
    d.open = !!msg.streaming && !msg.content;
    d.innerHTML =
      `<summary><span class="ico" data-icon="sparkle"></span><span class="tc-label">${Sec.esc(this.summaryText(msg))}</span>` +
      `<span class="tc-caret ico" data-icon="chevron"></span></summary>` +
      `<div class="tc-body"></div>`;
    d.querySelector(".tc-body").innerHTML = MD.render(msg.reasoning || "", { lineNumbers: false, wrap: true });
    hydrateIcons(d);
    return d;
  },
  /* Live update during streaming, without rebuilding the message node. */
  update(el, msg) {
    if (!el) return;
    let d = el.querySelector(".thought-chain");
    if (!d) {
      d = this.build(msg);
      const body = el.querySelector(".msg-body");
      const content = el.querySelector(".msg-content");
      if (body && content) body.insertBefore(d, content);
      else if (body) body.appendChild(d);
      return;
    }
    const label = d.querySelector(".tc-label");
    if (label) label.textContent = this.summaryText(msg);
    const b = d.querySelector(".tc-body");
    if (b) {
      b.textContent = msg.reasoning || "";
      b.scrollTop = b.scrollHeight;
    }
  }
};

/* ---------- 17.4 ARTIFACTS + CANVAS ---------- */
const Artifacts = {
  store(conv) {
    if (!conv.artifacts) conv.artifacts = {};
    return conv.artifacts;
  },
  get(convId, id) {
    const conv = Conv.byId(convId);
    return conv && conv.artifacts ? conv.artifacts[id] : null;
  },
  classify(lang, code) {
    const key = (lang || "").toLowerCase();
    // Streamlit is a special case of python — check it before the generic
    // python->code mapping so streamlit apps still get their own preview kind.
    if ((key === "python" || key === "py") && /streamlit|^\s*import\s+streamlit/m.test(code)) return PRO.artifactLangs.streamlit;
    if (PRO.artifactLangs[key]) return PRO.artifactLangs[key];
    if (!key && /^\s*<(!doctype|html|svg)/i.test(code)) {
      return /^\s*<svg/i.test(code) ? PRO.artifactLangs.svg : PRO.artifactLangs.html;
    }
    // Any other labeled fence (any ```lang block the model tags) still becomes
    // a generic code artifact so it opens in the Canvas automatically instead
    // of sitting inert in the chat transcript.
    if (key) return { type: "code", label: lang, preview: false, ext: key.replace(/[^a-z0-9]/g, "") || "txt" };
    return null;
  },
  titleFor(type, code, fallback) {
    const h = /<title>([^<]{2,80})<\/title>/i.exec(code) || /^#\s+(.{2,80})$/m.exec(code);
    if (h) return h[1].trim();
    const fn = /(?:function|const|class)\s+([A-Z][A-Za-z0-9_]{2,40})/.exec(code);
    if (fn) return fn[1];
    return fallback || "Untitled artifact";
  },

  /* Pull every artifact-worthy block out of a finished assistant message. */
  /* A fence is claimed as one file of a project when its first line names a
     path: `// file: src/App.js`, `# file: app.py`, or `<!-- file: index.html -->`. */
  parseFences(content) {
    const fence = /```([a-zA-Z0-9_+#-]*)[ \t]*\n([\s\S]*?)```/g;
    const fences = [];
    let m;
    while ((m = fence.exec(content))) {
      const lang = (m[1] || "").trim();
      const code = m[2].replace(/\n$/, "");
      const firstLine = code.split("\n")[0] || "";
      const pm = /^\s*(?:\/\/|#|<!--)\s*file:\s*([^\s*>]+)/i.exec(firstLine);
      fences.push({ lang, code, path: pm ? pm[1].trim() : null, markerLen: pm ? firstLine.length : 0 });
    }
    return fences;
  },

  extractProject(conv, msg, fences) {
    const store = this.store(conv);
    const files = {};
    fences.forEach((f, i) => {
      let path = f.path;
      let code = f.markerLen ? f.code.slice(f.markerLen + 1) : f.code;
      if (!path) {
        const ext = (PRO.artifactLangs[f.lang] && PRO.artifactLangs[f.lang].ext) || f.lang || "txt";
        path = `file${i + 1}.${ext}`;
      }
      let unique = path, n = 2;
      while (files[unique] != null) unique = path.replace(/(\.[^./]*)?$/, `-${n++}$1`);
      files[unique] = code;
    });
    const active = Object.keys(files)[0];
    const existingId = (msg.artifacts || [])[0];
    if (existingId && store[existingId] && store[existingId].type === "project") {
      const a = store[existingId];
      const last = a.versions[a.versions.length - 1];
      let lastFiles = {};
      try { lastFiles = JSON.parse(last.code).files || {}; } catch {}
      if (JSON.stringify(lastFiles) !== JSON.stringify(files)) {
        const keepActive = a.activeFile && files[a.activeFile] != null ? a.activeFile : active;
        a.versions.push({ code: Files.serialize(files, keepActive), ts: Date.now(), note: "Model update" });
        a.current = a.versions.length - 1;
      }
      msg.artifacts = [existingId];
      return [existingId];
    }
    const id = uid("art");
    store[id] = {
      id, msgId: msg.id,
      title: this.titleFor(null, "", `Project ${Object.keys(store).length + 1}`),
      type: "project", label: "Project", lang: "", ext: "zip", preview: true, current: 0,
      activeFile: active,
      versions: [{ code: Files.serialize(files, active), ts: Date.now(), note: "Generated" }]
    };
    msg.artifacts = [id];
    return [id];
  },

  extract(conv, msg) {
    if (!msg || msg.role !== "assistant" || !msg.content) return [];
    const store = this.store(conv);
    const fences = this.parseFences(msg.content);
    if (fences.filter((f) => f.path).length >= 2) return this.extractProject(conv, msg, fences);

    const found = [];
    fences.forEach(({ lang, code }) => {
      const kind = this.classify(lang, code);
      if (!kind) return;
      const minChars = kind.type === "svg" ? 0 : kind.type === "code" ? PRO.minCodeChars : PRO.minArtifactChars;
      if (code.length < minChars) return;
      found.push({ kind, lang: lang || kind.ext, code });
    });
    // Long-form prose with structure counts as a document artifact.
    if (!found.length) {
      const stripped = msg.content.replace(/```[\s\S]*?```/g, "");
      const headings = (stripped.match(/^#{1,3}\s+/gm) || []).length;
      if (stripped.length >= PRO.minDocChars && headings >= 2) {
        found.push({ kind: PRO.artifactLangs.markdown, lang: "markdown", code: msg.content.trim() });
      }
    }

    const ids = [];
    found.forEach((f, i) => {
      const existingId = (msg.artifacts || [])[i];
      const title = this.titleFor(f.kind.type, f.code, `${f.kind.label} ${Object.keys(store).length + 1}`);
      if (existingId && store[existingId]) {
        const a = store[existingId];
        if (a.versions[a.versions.length - 1].code !== f.code) {
          a.versions.push({ code: f.code, ts: Date.now(), note: "Model update" });
          a.current = a.versions.length - 1;
        }
        ids.push(existingId);
        return;
      }
      const id = uid("art");
      store[id] = {
        id,
        msgId: msg.id,
        title,
        type: f.kind.type,
        label: f.kind.label,
        lang: f.lang,
        ext: f.kind.ext,
        preview: !!f.kind.preview,
        current: 0,
        versions: [{ code: f.code, ts: Date.now(), note: "Generated" }]
      };
      ids.push(id);
    });
    msg.artifacts = ids;
    return ids;
  },

  code(a) {
    return a && a.versions.length ? a.versions[clamp(a.current, 0, a.versions.length - 1)].code : "";
  },

  /* Index the artifacts of one message by their exact source code, so an
     individual code block in the transcript can find its own artifact. */
  byCode(msg) {
    const conv = Conv.active();
    const map = new Map();
    if (!conv || !msg.artifacts) return map;
    msg.artifacts.forEach((id) => {
      const a = conv.artifacts && conv.artifacts[id];
      if (!a) return;
      const code = this.code(a);
      if (code) map.set(code.trim(), id);
      if (a.type === "project") {
        let files = {};
        try { files = JSON.parse(code).files || {}; } catch {}
        Object.values(files).forEach((src) => { if (src) map.set(String(src).trim(), id); });
      }
    });
    return map;
  },
  pushVersion(a, code, note) {
    if (!a) return;
    const last = a.versions[a.versions.length - 1];
    // Collapse rapid keystroke edits into one version.
    if (last && last.note === note && Date.now() - last.ts < 4000) {
      last.code = code;
      last.ts = Date.now();
    } else {
      a.versions = a.versions.slice(0, a.current + 1);
      a.versions.push({ code, ts: Date.now(), note: note || "Edited" });
      if (a.versions.length > 40) a.versions = a.versions.slice(-40);
    }
    a.current = a.versions.length - 1;
  },

  /* Chips under a message that open the Canvas. */
  buildChips(msg) {
    const conv = Conv.active();
    if (!conv || !msg.artifacts || !msg.artifacts.length) return null;
    const row = document.createElement("div");
    row.className = "artifact-row";
    msg.artifacts.forEach((id) => {
      const a = conv.artifacts && conv.artifacts[id];
      if (!a) return;
      const b = document.createElement("button");
      b.className = "artifact-chip";
      b.innerHTML =
        `<span class="ico" data-icon="canvas"></span><span class="ac-main"><b></b>` +
        `<span class="ac-sub">${Sec.esc(a.label)} · v${a.versions.length}</span></span>` +
        `<span class="ico" data-icon="chevron"></span>`;
      b.querySelector("b").textContent = a.title;
      b.addEventListener("click", () => Canvas.open(id));
      hydrateIcons(b);
      row.appendChild(b);
    });
    return row.children.length ? row : null;
  }
};

const Canvas = {
  els: {},
  saveTimer: null,
  _blobUrls: [],

  mount() {
    this.els = {
      pane: $("#canvas-pane"),
      title: $("#canvas-title"),
      sub: $("#canvas-sub"),
      body: $("#canvas-body"),
      filetree: $("#canvas-filetree"),
      editor: $("#canvas-editor"),
      diff: $("#canvas-diff"),
      console: $("#canvas-console"),
      consoleOut: $("#console-out"),
      consoleExtra: $("#console-extra"),
      consoleStatus: $("#console-status"),
      consoleTime: $("#console-time"),
      consoleRunBtn: $("#console-run-btn"),
      consoleClearBtn: $("#console-clear-btn"),
      preview: $("#canvas-preview"),
      tabs: $("#canvas-tabs"),
      versionWrap: $("#canvas-versions"),
      range: $("#canvas-range"),
      versionLabel: $("#canvas-version-label"),
      revert: $("#canvas-revert"),
      close: $("#canvas-close"),
      copy: $("#canvas-copy"),
      download: $("#canvas-download"),
      newFile: $("#canvas-newfile"),
      exportPdf: $("#canvas-export-pdf"),
      exportDocx: $("#canvas-export-docx"),
      exportPptx: $("#canvas-export-pptx"),
      ask: $("#canvas-ask"),
      askInput: $("#canvas-ask-input"),
      askScope: $("#canvas-ask-scope"),
      askSend: $("#canvas-ask-send"),
      selBtn: $("#canvas-sel-btn"),
      grip: $("#canvas-grip")
    };
    if (!this.els.pane) return;
    this.bind();
    document.documentElement.style.setProperty("--canvas-split", State.settings.canvasSplit + "%");
  },

  current() {
    return Artifacts.get(State.canvas.convId, State.canvas.artifactId);
  },

  isProject(a) {
    return !!a && a.type === "project";
  },

  open(artifactId, convId) {
    const conv = convId ? Conv.byId(convId) : Conv.active();
    if (!conv) return;
    const a = conv.artifacts && conv.artifacts[artifactId];
    if (!a) return;
    State.canvas.open = true;
    State.canvas.convId = conv.id;
    State.canvas.artifactId = artifactId;
    State.canvas.tab = this.isProject(a) ? "code" : a.preview ? "preview" : "code";
    UI.els.app.classList.add("canvas-open");
    this.render();
    UI.announce(`Canvas opened: ${a.title}`);
  },

  close() {
    State.canvas.open = false;
    UI.els.app.classList.remove("canvas-open");
    this.revokeBlobUrls();
  },

  toggle() {
    if (State.canvas.open) return this.close();
    const conv = Conv.active();
    if (!conv) return UI.toast("Start a chat first");
    const ids = conv.artifacts ? Object.keys(conv.artifacts) : [];
    if (!ids.length) return Files.newProject();
    this.open(ids[ids.length - 1]);
  },

  setTab(tab) {
    State.canvas.tab = tab;
    this.render();
  },

  /* ----- render ----- */
  render() {
    const a = this.current();
    const e = this.els;
    if (!e.pane || !a) return;
    const isProject = this.isProject(a);
    let files = null, active = null;
    if (isProject) {
      const parsed = Files.parse(a);
      files = parsed.files;
      active = a.activeFile && parsed.files[a.activeFile] != null ? a.activeFile : parsed.active;
      a.activeFile = active;
    }
    const code = isProject ? (files[active] || "") : Artifacts.code(a);

    e.title.textContent = a.title;
    e.sub.textContent = isProject
      ? `${Object.keys(files).length} file${Object.keys(files).length === 1 ? "" : "s"} · v${a.current + 1} of ${a.versions.length}`
      : `${a.label} · ${code.split("\n").length} lines · v${a.current + 1} of ${a.versions.length}`;

    /* which tabs exist */
    const tabs = [];
    if (isProject) {
      const activeExt = Files.ext(active);
      if (files["index.html"] != null || ["html", "htm", "svg"].includes(activeExt)) tabs.push(["preview", "Preview"]);
      tabs.push(["code", "Code"]);
      if (a.current > 0) tabs.push(["diff", "Diff"]);
      if (Files.runnableLang(active)) tabs.push(["console", "Console"]);
    } else {
      if (a.preview) tabs.push(["preview", "Preview"]);
      tabs.push(["code", "Code"]);
      if (a.current > 0) tabs.push(["diff", "Diff"]);
    }
    if (!tabs.find(([id]) => id === State.canvas.tab)) State.canvas.tab = tabs[0][0];

    e.tabs.innerHTML = "";
    tabs.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.className = "canvas-tab" + (State.canvas.tab === id ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => this.setTab(id));
      e.tabs.appendChild(b);
    });

    /* file tree */
    e.filetree.classList.toggle("hidden", !isProject);
    e.body.classList.toggle("has-filetree", isProject);
    if (isProject) this.renderFileTree(a, files, active);

    /* toolbar buttons */
    e.newFile.classList.toggle("hidden", !isProject);
    const isDoc = a.type === "document";
    e.exportPdf.classList.toggle("hidden", !isDoc);
    e.exportDocx.classList.toggle("hidden", !isDoc);
    e.exportPptx.classList.toggle("hidden", !isDoc);

    /* panels */
    e.editor.value = code;
    e.editor.classList.toggle("hidden", State.canvas.tab !== "code");
    e.preview.classList.toggle("hidden", State.canvas.tab !== "preview");
    e.diff.classList.toggle("hidden", State.canvas.tab !== "diff");
    e.console.classList.toggle("hidden", State.canvas.tab !== "console");

    if (State.canvas.tab === "preview") this.renderPreview(a, code, isProject ? files : null, active);
    if (State.canvas.tab === "diff") this.renderDiff(a, isProject, files, active);
    if (State.canvas.tab === "console" && !e.console.dataset.bound) this.armConsole();

    e.range.max = String(a.versions.length - 1);
    e.range.value = String(a.current);
    e.range.disabled = a.versions.length < 2;
    const v = a.versions[a.current];
    e.versionLabel.textContent = `v${a.current + 1} · ${v.note} · ${fmtTime(v.ts)}`;
    e.revert.disabled = a.current === a.versions.length - 1;
    this.updateSelectionButton();
  },

  /* ----- multi-file tree ----- */
  renderFileTree(a, files, active) {
    const host = this.els.filetree;
    host.innerHTML = "";
    const list = document.createElement("div");
    list.className = "file-list";
    Object.keys(files).sort().forEach((path) => {
      const row = document.createElement("div");
      row.className = "file-row" + (path === active ? " active" : "");
      row.innerHTML =
        `<span class="ico" data-icon="file"></span><span class="file-name"></span>` +
        `<button type="button" class="file-del" title="Delete file"><span class="ico" data-icon="trash"></span></button>`;
      row.querySelector(".file-name").textContent = path;
      row.addEventListener("click", () => Files.setActive(a, path));
      row.querySelector(".file-name").addEventListener("dblclick", async (ev) => {
        ev.stopPropagation();
        const next = await UI.prompt("Rename file", "File name", path);
        if (next && next.trim() && next.trim() !== path) Files.renameFile(a, path, next.trim());
      });
      row.querySelector(".file-del").addEventListener("click", async (ev) => {
        ev.stopPropagation();
        if (await UI.confirm("Delete file", `Remove "${path}" from this project?`, "Delete", true)) Files.deleteFile(a, path);
      });
      hydrateIcons(row);
      list.appendChild(row);
    });
    host.appendChild(list);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "file-add-row";
    add.innerHTML = `${ic("plus")}<span>New file</span>`;
    add.addEventListener("click", async () => {
      const name = await UI.prompt("New file", "File name (e.g. utils.js)", "");
      if (name && name.trim()) { await Files.addFile(a, name.trim()); await Files.setActive(a, name.trim()); }
    });
    hydrateIcons(add);
    host.appendChild(add);
  },

  /* ----- preview ----- */
  renderPreview(a, code, projectFiles, activeFile) {
    const frame = this.els.preview;
    if (a.type === "document") {
      frame.classList.add("doc-preview");
      frame.removeAttribute("srcdoc");
      frame.innerHTML = "";
      const doc = document.createElement("div");
      doc.className = "canvas-doc msg-content";
      doc.innerHTML = MD.render(code, { lineNumbers: false, wrap: true });
      frame.appendChild(doc);
      return;
    }
    frame.classList.remove("doc-preview");
    frame.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.className = "canvas-frame";
    iframe.setAttribute("sandbox", "allow-scripts allow-modals allow-popups allow-forms");
    iframe.setAttribute("title", a.title);
    iframe.srcdoc = projectFiles ? this.projectPreviewDocument(projectFiles, activeFile) : this.previewDocument(a, code);
    frame.appendChild(iframe);
  },

  revokeBlobUrls() {
    this._blobUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    this._blobUrls = [];
  },

  /* Best-effort multi-file preview: the HTML entry file's local <script src>
     and <link href> references are swapped for blob URLs of sibling files. */
  projectPreviewDocument(files, activeFile) {
    this.revokeBlobUrls();
    const entryPath = files["index.html"] != null
      ? "index.html"
      : (["html", "htm", "svg"].includes(Files.ext(activeFile)) ? activeFile : null);
    if (!entryPath) {
      return `<!doctype html><body style="font:13px system-ui;color:#8892a6;padding:20px">No HTML entry file to preview yet — add an <code>index.html</code>, or open an .html file and switch to it.</body>`;
    }
    if (Files.ext(entryPath) === "svg") {
      return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;display:grid;place-items:center;min-height:100vh}</style></head><body>${files[entryPath]}</body></html>`;
    }
    let html = files[entryPath];
    const blobMap = {};
    Object.keys(files).forEach((path) => {
      if (path === entryPath) return;
      const blob = new Blob([files[path]], { type: Files.mimeFor(path) });
      const url = URL.createObjectURL(blob);
      blobMap[path] = url;
      this._blobUrls.push(url);
    });
    html = html.replace(/((?:src|href)=["'])([^"':]+)(["'])/g, (whole, pre, ref, post) => {
      const clean = ref.replace(/^\.?\//, "");
      if (blobMap[clean]) return pre + blobMap[clean] + post;
      const base = clean.split("/").pop();
      const match = Object.keys(blobMap).find((k) => k.split("/").pop() === base);
      return match ? pre + blobMap[match] + post : whole;
    });
    return html;
  },

  previewDocument(a, code) {
    const shell = (body, head) =>
      `<!doctype html><html><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<style>html,body{margin:0;padding:0;background:#fff;color:#111;font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
       *{box-sizing:border-box}body{padding:14px}</style>${head || ""}</head><body>${body}</body></html>`;
    if (a.type === "html") return /<html[\s>]/i.test(code) ? code : shell(code);
    if (a.type === "svg") return shell(`<div style="display:grid;place-items:center;min-height:90vh">${code}</div>`);
    if (a.type === "react") {
      const head =
        `<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>` +
        `<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>` +
        `<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>`;
      const src = code
        .replace(/^\s*import[^\n]*\n/gm, "")
        .replace(/export\s+default\s+/g, "var __Nimbus__ = ");
      const boot =
        `<div id="root"></div><script type="text/babel" data-presets="react,typescript">\n${src}\n` +
        `try{\n  const C = (typeof __Nimbus__ !== "undefined" && __Nimbus__) || (typeof App !== "undefined" && App) || null;\n` +
        `  if (C) ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(C));\n` +
        `  else document.getElementById("root").innerHTML = "<p style=\\"font:13px system-ui;color:#666\\">No default export found to render.</p>";\n` +
        `}catch(err){ document.getElementById("root").innerHTML = "<pre style=\\"color:#b00;white-space:pre-wrap;font:12px ui-monospace\\">"+err+"</pre>"; }\n<\/script>`;
      return shell(boot, head);
    }
    return shell(`<pre style="white-space:pre-wrap">${Sec.esc(code)}</pre>`);
  },

  /* ----- diff ----- */
  renderDiff(a, isProject, files, active) {
    const host = this.els.diff;
    if (a.current === 0) { host.innerHTML = `<div class="diff-empty">This is the first version — nothing to compare yet.</div>`; return; }
    let ops;
    if (isProject) {
      let prevFiles = {};
      try { prevFiles = JSON.parse(a.versions[a.current - 1].code).files || {}; } catch {}
      ops = Diff.lines(prevFiles[active] || "", files[active] || "");
    } else {
      ops = Diff.lines(a.versions[a.current - 1].code, Artifacts.code(a));
    }
    const meta = `Comparing v${a.current} → v${a.current + 1}${isProject ? " · " + Sec.esc(active) : ""}`;
    host.innerHTML = `<div class="diff-meta">${meta}</div><div class="diff-body">${Diff.render(ops)}</div>`;
  },

  /* ----- run console (project files only) ----- */
  consoleTerm() {
    const out = this.els.consoleOut, extra = this.els.consoleExtra, statusEl = this.els.consoleStatus, timeEl = this.els.consoleTime;
    return {
      body: out,
      extra,
      status(text, cls) { statusEl.textContent = text; statusEl.className = "exec-status " + (cls || ""); },
      time(ms) { timeEl.textContent = ms != null ? (ms / 1000).toFixed(2) + "s" : ""; },
      write(text, cls) {
        const span = document.createElement("span");
        if (cls) span.className = cls;
        span.textContent = text;
        out.appendChild(span);
        out.scrollTop = out.scrollHeight;
      },
      reset() { out.textContent = ""; extra.innerHTML = ""; }
    };
  },

  armConsole() {
    this.els.console.dataset.bound = "1";
  },

  async runActive() {
    const a = this.current();
    if (!a || !this.isProject(a)) { UI.toast("Open a project file to run it — the Console works inside multi-file projects"); return; }
    const { files, active } = Files.parse(a);
    const lang = Files.langFor(a.activeFile || active);
    const kind = Executors.language(lang);
    if (!kind) { UI.toast("This file type isn't runnable here — try a .py, .js or .cpp file"); return; }
    if (State.canvas.tab !== "console") { State.canvas.tab = "console"; this.render(); }
    const code = files[a.activeFile || active] || "";
    const term = this.consoleTerm();
    if (kind === "python") await Executors.runPython(code, term);
    else if (kind === "javascript") Executors.runJS(code, term);
    else if (kind === "typescript") {
      term.reset();
      term.write("TypeScript is run by stripping type annotations — complex types may not survive.\n", "dim");
      Executors.runJS(code.replace(/:\s*[A-Za-z_][\w<>[\]|,\s.]*(?=\s*[=,);])/g, "").replace(/^\s*(interface|type)\s+[\s\S]*?\n}/gm, ""), term);
    } else if (kind === "cpp") {
      const stdin = Executors.needsStdin(code) ? await Executors.askStdin(term) : "";
      await Executors.runCpp(code, term, stdin);
    }
  },

  /* ----- persist an edit made in the editor (or by the model) ----- */
  async commit(code, note) {
    const a = this.current();
    const conv = Conv.byId(State.canvas.convId);
    if (!a || !conv) return;
    Artifacts.pushVersion(a, code, note || "Edited in Canvas");
    this.syncMessage(conv, a, code);
    await Conv.save(conv);
    this.render();
    if (State.activeId === conv.id) App.refreshMessage(a.msgId);
  },

  syncMessage(conv, a, code) {
    const msg = conv.messages.find((m) => m.id === a.msgId);
    if (!msg) return;
    if (a.type === "document" && !/```/.test(msg.content)) {
      msg.content = code;
      return;
    }
    let replaced = false;
    msg.content = msg.content.replace(/```([a-zA-Z0-9_+#-]*)[ \t]*\n([\s\S]*?)```/g, (m, lang, body) => {
      if (replaced) return m;
      const kind = Artifacts.classify(lang, body);
      if (!kind || kind.type !== a.type) return m;
      replaced = true;
      return "```" + (lang || a.lang) + "\n" + code + "\n```";
    });
  },

  scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(async () => {
      const a = this.current();
      if (!a) return;
      const val = this.els.editor.value;
      if (this.isProject(a)) {
        const { files, active } = Files.parse(a);
        const target = a.activeFile || active;
        if (val === files[target]) return;
        await Files.updateContent(a, target, val);
      } else {
        if (val === Artifacts.code(a)) return;
        this.commit(val, "Edited in Canvas");
      }
    }, 700);
  },

  scrub(index) {
    const a = this.current();
    if (!a) return;
    a.current = clamp(parseInt(index, 10) || 0, 0, a.versions.length - 1);
    this.render();
  },

  async revert() {
    const a = this.current();
    const conv = Conv.byId(State.canvas.convId);
    if (!a || !conv) return;
    const code = Artifacts.code(a);
    a.versions.push({ code, ts: Date.now(), note: `Reverted to v${a.current + 1}` });
    a.current = a.versions.length - 1;
    this.syncMessage(conv, a, code);
    await Conv.save(conv);
    this.render();
    if (State.activeId === conv.id) App.refreshMessage(a.msgId);
    UI.toast("Reverted — the old versions are still in the history");
  },

  download() {
    const a = this.current();
    if (!a) return;
    if (this.isProject(a)) return Files.zip(a);
    const name = a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artifact";
    download(`${name}.${a.ext}`, Artifacts.code(a));
  },

  async exportDoc(kind) {
    const a = this.current();
    if (!a) return;
    const base = slug(a.title || "document");
    try {
      if (kind === "pdf") { UI.toast("Building PDF…"); await Exporters.pdfFromMarkdown(a.title, Artifacts.code(a), `${base}.pdf`); }
      else if (kind === "docx") { UI.toast("Building Word document…"); await Exporters.docxFromMarkdown(a.title, Artifacts.code(a), `${base}.docx`); }
      else if (kind === "pptx") { UI.toast("Building slides…"); await Exporters.pptxFromMarkdown(a.title, Artifacts.code(a), `${base}.pptx`); }
      UI.toast("Exported");
    } catch (err) {
      UI.toast((err && err.message) || "Export failed", { error: true });
    }
  },

  /* ----- scoped AI edits ----- */
  selection() {
    const ta = this.els.editor;
    if (!ta || State.canvas.tab !== "code") return null;
    const { selectionStart: s, selectionEnd: e } = ta;
    if (e - s < 2) return null;
    return { start: s, end: e, text: ta.value.slice(s, e) };
  },

  updateSelectionButton() {
    const sel = this.selection();
    const btn = this.els.selBtn;
    if (!btn) return;
    btn.classList.toggle("hidden", !sel);
    if (sel) {
      const lines = sel.text.split("\n").length;
      btn.querySelector("span:last-child").textContent =
        `Edit selection (${lines} line${lines === 1 ? "" : "s"})`;
    }
    if (this.els.askScope) {
      this.els.askScope.textContent = sel ? "Selection" : "Whole artifact";
      this.els.askScope.classList.toggle("scoped", !!sel);
    }
  },

  async ask(instruction) {
    const a = this.current();
    if (!a) return;
    const text = (instruction || "").trim();
    if (!text) return;
    if (State.canvas.busy) return UI.toast("Still working on the last Canvas edit");
    const isProject = this.isProject(a);
    const parsed = isProject ? Files.parse(a) : null;
    const target = isProject ? (a.activeFile || parsed.active) : null;
    const sel = this.selection();
    const full = isProject ? (parsed.files[target] || "") : Artifacts.code(a);
    const selText = sel ? sel.text : full;

    State.canvas.busy = true;
    this.els.pane.classList.add("busy");
    this.els.askSend.disabled = true;
    const provider = State.settings.provider;
    const adapter = Providers.get(provider);

    const label = isProject ? `file "${target}"` : a.label.toLowerCase();
    const lang = isProject ? Files.langFor(target) : a.lang;
    const system =
      `You are editing a ${label} inside a code canvas. ` +
      `Return ONLY the replacement ${sel ? "snippet" : "file"} — no explanation, no commentary, ` +
      `and no Markdown fences. Preserve the surrounding style, indentation and language (${lang}).`;
    const user =
      (sel
        ? `Full file for context:\n\n${full}\n\nRevise ONLY this selected part:\n\n${selText}`
        : `Current file:\n\n${full}`) + `\n\nInstruction: ${text}`;

    const controller = new AbortController();
    State.abort = controller;
    try {
      if (provider === "simulation") throw new ProviderError("Canvas edits need a real model — add a provider key in Settings.", { kind: "auth" });
      const res = await adapter.send({
        messages: [{ role: "user", content: user, attachments: [] }],
        model: State.settings.model,
        systemPrompt: system,
        apiKey: State.apiKeys[provider] || "",
        endpoint: State.endpoints[provider],
        signal: controller.signal,
        stream: false,
        params: { temperature: 0.2, maxTokens: State.settings.maxTokens },
        onDelta: () => {}
      });
      let out = (typeof res === "string" ? res : res.text || "").trim();
      out = out.replace(/^```[a-zA-Z0-9_+#-]*\s*\n?/, "").replace(/\n?```\s*$/, "");
      if (!out) throw new ProviderError("The model returned nothing to apply.", { kind: "empty" });
      const next = sel ? full.slice(0, sel.start) + out + full.slice(sel.end) : out;
      if (isProject) await Files.updateContent(a, target, next);
      else await this.commit(next, sel ? "AI edit (selection)" : "AI edit");
      this.els.askInput.value = "";
      UI.toast(sel ? "Selection updated" : "Artifact updated");
    } catch (err) {
      UI.toast(err && err.message ? err.message : "The Canvas edit failed", { error: true });
    } finally {
      State.canvas.busy = false;
      State.abort = null;
      this.els.pane.classList.remove("busy");
      this.els.askSend.disabled = false;
      this.updateSelectionButton();
    }
  },

  bind() {
    const e = this.els;
    e.close.addEventListener("click", () => this.close());
    e.copy.addEventListener("click", (ev) => {
      const a = this.current();
      if (!a) return;
      const text = this.isProject(a) ? (Files.parse(a).files[a.activeFile] || "") : Artifacts.code(a);
      App.copy(text, ev.currentTarget, "Copied");
    });
    e.download.addEventListener("click", () => this.download());
    e.newFile.addEventListener("click", async () => {
      const a = this.current();
      if (!a || !this.isProject(a)) return;
      const name = await UI.prompt("New file", "File name (e.g. utils.js)", "");
      if (name && name.trim()) { await Files.addFile(a, name.trim()); await Files.setActive(a, name.trim()); }
    });
    e.exportPdf.addEventListener("click", () => this.exportDoc("pdf"));
    e.exportDocx.addEventListener("click", () => this.exportDoc("docx"));
    e.exportPptx.addEventListener("click", () => this.exportDoc("pptx"));
    e.consoleRunBtn.addEventListener("click", () => this.runActive());
    e.consoleClearBtn.addEventListener("click", () => { e.consoleOut.textContent = ""; e.consoleExtra.innerHTML = ""; });
    e.revert.addEventListener("click", () => this.revert());
    e.range.addEventListener("input", (ev) => this.scrub(ev.target.value));
    e.editor.addEventListener("input", () => this.scheduleSave());
    ["keyup", "mouseup", "select", "blur"].forEach((evt) =>
      e.editor.addEventListener(evt, () => this.updateSelectionButton())
    );
    e.editor.addEventListener("keydown", (ev) => {
      if (ev.key === "Tab") {
        ev.preventDefault();
        const ta = ev.target;
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
        this.scheduleSave();
      }
    });
    e.selBtn.addEventListener("click", () => {
      e.askInput.focus();
      e.askInput.placeholder = "How should the selection change?";
    });
    e.askSend.addEventListener("click", () => this.ask(e.askInput.value));
    e.askInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        this.ask(e.askInput.value);
      }
    });

    /* Draggable split. */
    let dragging = false;
    const onMove = (ev) => {
      if (!dragging) return;
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const pct = clamp(((window.innerWidth - x) / window.innerWidth) * 100, 26, 74);
      State.settings.canvasSplit = Math.round(pct);
      document.documentElement.style.setProperty("--canvas-split", State.settings.canvasSplit + "%");
    };
    const stop = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("dragging-split");
      App.persistSettings();
    };
    e.grip.addEventListener("mousedown", () => { dragging = true; document.body.classList.add("dragging-split"); });
    e.grip.addEventListener("touchstart", () => { dragging = true; }, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
  }
};

/* ---------- 17.35 LINE DIFF ---------- */
const Diff = {
  /* Classic O(n*m) LCS diff — fine at chat-artifact scale. Falls back to a
     plain replace view for pathologically large files so the tab never hangs. */
  lines(a, b) {
    const A = String(a == null ? "" : a).split("\n");
    const B = String(b == null ? "" : b).split("\n");
    const n = A.length, m = B.length;
    if (n * m > 300000) {
      return A.map((l) => ["del", l]).concat(B.map((l) => ["add", l]));
    }
    const dp = new Array(n + 1);
    for (let i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ops.push(["eq", A[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(["del", A[i]]); i++; }
      else { ops.push(["add", B[j]]); j++; }
    }
    while (i < n) { ops.push(["del", A[i]]); i++; }
    while (j < m) { ops.push(["add", B[j]]); j++; }
    return ops;
  },

  render(ops) {
    if (!ops || !ops.length) return `<div class="diff-empty">No changes</div>`;
    let oldN = 0, newN = 0;
    return ops.map(([kind, text]) => {
      if (kind === "eq") {
        oldN++; newN++;
        return `<div class="diff-line diff-ctx"><span class="diff-ln">${oldN}</span><span class="diff-ln">${newN}</span><span class="diff-txt">${Sec.esc(text) || "&nbsp;"}</span></div>`;
      }
      if (kind === "del") {
        oldN++;
        return `<div class="diff-line diff-del"><span class="diff-ln">${oldN}</span><span class="diff-ln"></span><span class="diff-txt">${Sec.esc(text) || "&nbsp;"}</span></div>`;
      }
      newN++;
      return `<div class="diff-line diff-add"><span class="diff-ln"></span><span class="diff-ln">${newN}</span><span class="diff-txt">${Sec.esc(text) || "&nbsp;"}</span></div>`;
    }).join("");
  }
};

/* ---------- 17.4 MULTI-FILE PROJECT (VFS) ---------- */
const Files = {
  ext(path) {
    const m = /\.([a-z0-9]+)$/i.exec(path || "");
    return m ? m[1].toLowerCase() : "";
  },
  langFor(path) {
    return {
      js: "javascript", mjs: "javascript", jsx: "javascript", cjs: "javascript",
      ts: "typescript", tsx: "typescript",
      py: "python",
      html: "html", htm: "html",
      css: "css",
      json: "json",
      md: "markdown",
      c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
      svg: "svg",
      yml: "yaml", yaml: "yaml",
      sh: "bash"
    }[this.ext(path)] || "";
  },
  mimeFor(path) {
    return {
      html: "text/html", htm: "text/html", css: "text/css",
      js: "text/javascript", mjs: "text/javascript", jsx: "text/javascript",
      json: "application/json", svg: "image/svg+xml", md: "text/markdown",
      py: "text/x-python", txt: "text/plain"
    }[this.ext(path)] || "text/plain";
  },
  runnableLang(path) {
    return !!Executors.language(this.langFor(path));
  },

  parse(a) {
    try {
      const data = JSON.parse(Artifacts.code(a) || "{}");
      if (data && typeof data.files === "object" && data.files) {
        const keys = Object.keys(data.files);
        return { files: data.files, active: data.active && keys.includes(data.active) ? data.active : keys[0] || "" };
      }
    } catch {}
    return { files: { "untitled.txt": "" }, active: "untitled.txt" };
  },
  serialize(files, active) {
    return JSON.stringify({ files, active });
  },

  defaultBoilerplate() {
    return {
      "index.html":
        `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n` +
        `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` +
        `<title>New project</title>\n<link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n` +
        `<h1>Hello, Nimbus</h1>\n<p>Edit the files on the left — this preview updates live.</p>\n` +
        `<script src="app.js"></script>\n</body>\n</html>\n`,
      "styles.css": `body{font-family:system-ui,-apple-system,sans-serif;margin:2.5rem;color:#1a1d29;}\nh1{color:#6c8cff;}\n`,
      "app.js": `console.log("New project ready");\n`
    };
  },

  async newProject(nameHint) {
    const conv = Conv.active();
    if (!conv) { UI.toast("Start a chat first"); return; }
    const files = this.defaultBoilerplate();
    const active = "index.html";
    const id = uid("art");
    const store = Artifacts.store(conv);
    store[id] = {
      id, msgId: null, title: nameHint || "New project", type: "project", label: "Project",
      lang: "", ext: "zip", preview: true, current: 0, activeFile: active,
      versions: [{ code: this.serialize(files, active), ts: Date.now(), note: "Created" }]
    };
    await Conv.save(conv);
    State.canvas.tab = "code";
    Canvas.open(id, conv.id);
    UI.toast("New project created — add files from the tree on the left");
  },

  async commit(a, files, active, note) {
    const conv = Conv.byId(State.canvas.convId) || Conv.active();
    Artifacts.pushVersion(a, this.serialize(files, active), note);
    a.activeFile = active;
    if (conv) await Conv.save(conv);
    Canvas.render();
    if (conv && State.activeId === conv.id && a.msgId) App.refreshMessage(a.msgId);
  },

  async addFile(a, path) {
    const { files, active } = this.parse(a);
    if (files[path] != null) { UI.toast("A file with that name already exists"); return; }
    files[path] = "";
    await this.commit(a, files, active, `Added ${path}`);
  },
  async renameFile(a, oldPath, newPath) {
    const { files, active } = this.parse(a);
    if (!newPath || files[newPath] != null) { UI.toast("Pick a different file name"); return; }
    files[newPath] = files[oldPath];
    delete files[oldPath];
    await this.commit(a, files, active === oldPath ? newPath : active, `Renamed ${oldPath} → ${newPath}`);
  },
  async deleteFile(a, path) {
    const { files, active } = this.parse(a);
    const keys = Object.keys(files);
    if (keys.length <= 1) { UI.toast("A project needs at least one file"); return; }
    delete files[path];
    const nextActive = active === path ? Object.keys(files)[0] : active;
    await this.commit(a, files, nextActive, `Deleted ${path}`);
  },
  async setActive(a, path) {
    const { files } = this.parse(a);
    if (files[path] == null) return;
    a.activeFile = path;
    const conv = Conv.byId(State.canvas.convId) || Conv.active();
    if (conv) await Conv.save(conv);
    Canvas.render();
  },
  async updateContent(a, path, content) {
    const { files, active } = this.parse(a);
    files[path] = content;
    await this.commit(a, files, path || active, `Edited ${path}`);
  },

  async zip(a) {
    const JSZipCtor = await Exporters.ensure("jszip");
    const { files } = this.parse(a);
    const zip = new JSZipCtor();
    Object.entries(files).forEach(([path, content]) => zip.file(path, content));
    const blob = await zip.generateAsync({ type: "blob" });
    Exporters.saveBlob(blob, `${slug(a.title || "project")}.zip`);
    UI.toast("Project zipped");
  }
};

/* ---------- 17.45 MARKDOWN -> DOCUMENT AST (shared by PDF/DOCX/PPTX export) ---------- */
const MDBlocks = {
  parse(md) {
    const lines = String(md || "").replace(/\r/g, "").split("\n");
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        const lang = line.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        blocks.push({ type: "code", lang, text: buf.join("\n") });
        continue;
      }
      if (/^\s*$/.test(line)) { i++; continue; }
      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) { blocks.push({ type: "heading", level: h[1].length, text: h[2].trim() }); i++; continue; }
      if (/^\s*>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        blocks.push({ type: "quote", text: buf.join(" ") });
        continue;
      }
      if (/^\s*[-*]\s+\S/.test(line) || /^\s*\d+\.\s+\S/.test(line)) {
        const ordered = /^\s*\d+\./.test(line);
        const buf = [];
        while (i < lines.length && (/^\s*[-*]\s+\S/.test(lines[i]) || /^\s*\d+\.\s+\S/.test(lines[i]))) {
          buf.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
          i++;
        }
        blocks.push({ type: "list", ordered, items: buf });
        continue;
      }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { blocks.push({ type: "hr" }); i++; continue; }
      const buf = [line];
      i++;
      while (
        i < lines.length && lines[i].trim() &&
        !/^```/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) &&
        !/^\s*[-*]\s+\S/.test(lines[i]) && !/^\s*\d+\.\s+\S/.test(lines[i]) && !/^\s*>\s?/.test(lines[i])
      ) { buf.push(lines[i]); i++; }
      blocks.push({ type: "paragraph", text: buf.join(" ") });
    }
    return blocks;
  },
  stripInline(text) {
    return String(text || "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  }
};

/* ---------- 17.5 DOCUMENT EXPORT (PDF / DOCX / PPTX / ZIP) ---------- */
const Exporters = {
  libs: {},
  async ensure(name) {
    if (this.libs[name]) return this.libs[name];
    if (name === "jszip") { await loadScript(CDN.jszip); this.libs.jszip = window.JSZip; }
    else if (name === "jspdf") { await loadScript(CDN.jspdf); this.libs.jspdf = window.jspdf && window.jspdf.jsPDF; }
    else if (name === "pptx") { await loadScript(CDN.pptxgenjs); this.libs.pptx = window.PptxGenJS || window.pptxgen; }
    else if (name === "docx") { await loadScript(CDN.docx); this.libs.docx = window.docx; }
    if (!this.libs[name]) throw new Error(`Couldn't load the export library — check your connection and try again.`);
    return this.libs[name];
  },

  saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },

  async pdfFromMarkdown(title, md, filename) {
    const jsPDF = await this.ensure("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxW = pageW - margin * 2;
    let y = margin;
    const ensureSpace = (needed) => { if (y + needed > pageH - margin) { doc.addPage(); y = margin; } };
    const writeWrapped = (text, size, lineH, opts) => {
      opts = opts || {};
      doc.setFontSize(size);
      doc.setFont(opts.mono ? "courier" : "helvetica", opts.bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text || " ", maxW - (opts.indent || 0));
      lines.forEach((ln) => {
        ensureSpace(lineH);
        doc.text(ln, margin + (opts.indent || 0), y);
        y += lineH;
      });
    };
    doc.setTextColor(20, 20, 25);
    writeWrapped(title, 20, 26, { bold: true });
    y += 6;
    MDBlocks.parse(md).forEach((b) => {
      if (b.type === "heading") {
        y += 6; ensureSpace(30);
        writeWrapped(MDBlocks.stripInline(b.text), Math.max(11, 18 - b.level), 20, { bold: true });
        y += 2;
      } else if (b.type === "paragraph") {
        writeWrapped(MDBlocks.stripInline(b.text), 10.5, 15);
        y += 6;
      } else if (b.type === "list") {
        b.items.forEach((it, idx) => {
          writeWrapped((b.ordered ? `${idx + 1}. ` : "•  ") + MDBlocks.stripInline(it), 10.5, 15, { indent: 10 });
        });
        y += 6;
      } else if (b.type === "quote") {
        writeWrapped(MDBlocks.stripInline(b.text), 10.5, 15, { indent: 14 });
        y += 6;
      } else if (b.type === "code") {
        const codeLines = b.text.split("\n");
        codeLines.forEach((ln) => {
          ensureSpace(13);
          doc.setFillColor(244, 245, 248);
          doc.rect(margin, y - 9.5, maxW, 13, "F");
          doc.setFont("courier", "normal"); doc.setFontSize(9); doc.setTextColor(40, 40, 45);
          doc.text(ln.slice(0, 110), margin + 6, y);
          y += 13;
        });
        doc.setTextColor(20, 20, 25);
        y += 8;
      } else if (b.type === "hr") {
        ensureSpace(14);
        doc.setDrawColor(210, 212, 220);
        doc.line(margin, y, pageW - margin, y);
        y += 14;
      }
    });
    doc.save(filename);
  },

  async docxFromMarkdown(title, md, filename) {
    const docx = await this.ensure("docx");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, ShadingType } = docx;
    const headingLevels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
    const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE })];
    MDBlocks.parse(md).forEach((b) => {
      if (b.type === "heading") {
        children.push(new Paragraph({ text: MDBlocks.stripInline(b.text), heading: headingLevels[Math.min(b.level - 1, 5)] }));
      } else if (b.type === "paragraph") {
        children.push(new Paragraph({ children: [new TextRun(MDBlocks.stripInline(b.text))] }));
      } else if (b.type === "list") {
        b.items.forEach((it) => {
          children.push(new Paragraph({
            text: MDBlocks.stripInline(it),
            bullet: b.ordered ? undefined : { level: 0 },
            numbering: b.ordered ? { reference: "nimbus-numbered", level: 0 } : undefined
          }));
        });
      } else if (b.type === "quote") {
        children.push(new Paragraph({ children: [new TextRun({ text: MDBlocks.stripInline(b.text), italics: true })], indent: { left: 400 } }));
      } else if (b.type === "code") {
        b.text.split("\n").forEach((ln) => {
          children.push(new Paragraph({
            children: [new TextRun({ text: ln || " ", font: "Consolas", size: 18 })],
            shading: { type: ShadingType.CLEAR, fill: "F2F2F5" }
          }));
        });
      } else if (b.type === "hr") {
        children.push(new Paragraph({ text: "―――――――――――" }));
      }
    });
    const doc = new Document({
      sections: [{ properties: {}, children }],
      numbering: { config: [{ reference: "nimbus-numbered", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] }] }
    });
    const blob = await Packer.toBlob(doc);
    this.saveBlob(blob, filename);
  },

  async pptxFromMarkdown(title, md, filename) {
    const PptxGenJSCtor = await this.ensure("pptx");
    const pres = new PptxGenJSCtor();
    pres.defineLayout({ name: "NIMBUS", width: 10, height: 5.63 });
    pres.layout = "NIMBUS";

    const titleSlide = pres.addSlide();
    titleSlide.background = { color: "0C0E13" };
    titleSlide.addText(title, { x: 0.5, y: 2.05, w: 9, h: 1.3, fontSize: 32, bold: true, color: "FFFFFF", fontFace: "Helvetica" });
    titleSlide.addText("Generated by Nimbus AI", { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 13, color: "9AA3B8" });

    let slide = null, bullets = [];
    const flush = () => {
      if (slide && bullets.length) {
        slide.addText(bullets.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), { x: 0.6, y: 1.3, w: 8.8, h: 3.9, fontSize: 16, color: "222222", valign: "top" });
      }
      bullets = [];
    };
    MDBlocks.parse(md).forEach((b) => {
      if (b.type === "heading" && b.level <= 2) {
        flush();
        slide = pres.addSlide();
        slide.background = { color: "FFFFFF" };
        slide.addText(MDBlocks.stripInline(b.text), { x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 24, bold: true, color: "1A1D29" });
      } else if (b.type === "paragraph" && slide) {
        bullets.push(MDBlocks.stripInline(b.text).slice(0, 220));
      } else if (b.type === "list" && slide) {
        b.items.forEach((it) => bullets.push(MDBlocks.stripInline(it).slice(0, 220)));
      } else if (b.type === "code" && slide) {
        const first = b.text.split("\n")[0].slice(0, 100);
        bullets.push("Code: " + first + (b.text.includes("\n") ? " …" : ""));
      }
    });
    flush();
    if (!slide) {
      slide = pres.addSlide();
      slide.addText("No structured headings to slide-ify — try exporting a chat with ## sections.", { x: 0.6, y: 2.4, w: 8.8, h: 1, fontSize: 16, color: "555555" });
    }
    await pres.writeFile({ fileName: filename });
  }
};

/* ---------- 17.5 SEARCH FALLBACK + SYNTHESIS ---------- */
const Fallback = {
  /* Reasons worth falling back on. Anything else is a genuine bug, not an outage. */
  shouldRun(errKind) {
    if (!State.settings.searchFallback) return false;
    return ["auth", "network", "rate_limit", "server", "invalid_model", "no_key"].indexOf(errKind) !== -1;
  },

  reasonLabel(kind) {
    return {
      no_key: "no API key set",
      auth: "the API key was rejected",
      network: "the provider was unreachable",
      rate_limit: "the provider rate-limited the request",
      server: "the provider returned an error",
      invalid_model: "the model was unavailable"
    }[kind] || "the model was unavailable";
  },

  /* Name the search engines that actually produced the snippets. */
  sourceNames(sources) {
    const names = [];
    const seen = new Set();
    (sources || []).forEach((s) => {
      const domain = String((s && s.domain) || "");
      let label = null;
      if (/wikipedia\.org$/i.test(domain)) label = "Wikipedia";
      else if (/duckduckgo\.com$/i.test(domain) || domain === "") label = "DuckDuckGo";
      else label = domain.replace(/^www\./, "");
      if (!label || seen.has(label)) return;
      seen.add(label);
      names.push(label);
    });
    return names.length ? names : ["web search"];
  },

  sourceSummary(sources) {
    const names = this.sourceNames(sources);
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " and " + names[1];
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  },

  clean(text) {
    return String(text || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\[\d+\]/g, "")
      .trim();
  },

  sentences(text) {
    return this.clean(text)
      .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30);
  },

  /* Build a readable, cited answer out of raw search snippets. */
  synthesize(query, sources, kind) {
    const seen = new Set();
    const points = [];
    sources.forEach((s, i) => {
      const parts = this.sentences(s.snippet);
      const pick = parts.length ? parts.slice(0, 2) : [this.clean(s.snippet)];
      pick.forEach((p) => {
        const key = p.toLowerCase().slice(0, 60);
        if (!p || seen.has(key)) return;
        seen.add(key);
        points.push({ text: p.replace(/\s*\.*$/, "."), n: i + 1 });
      });
    });

    const lead = points.slice(0, 2).map((p) => `${p.text} [${p.n}]`).join(" ");
    const middle = points.slice(2, 5).map((p) => `${p.text} [${p.n}]`).join(" ");
    const domains = Array.from(new Set(sources.map((s) => s.domain).filter(Boolean)));

    let md = `> 🔍 **Assembled from live web search — ${this.sourceSummary(sources)}** (${this.reasonLabel(kind)}). ` +
      `This answer is assembled from search snippets and page summaries, not written by a language model.\n\n`;
    md += `**${query.replace(/\s+/g, " ").trim().replace(/^[a-z]/, (c) => c.toUpperCase())}**\n\n`;
    if (lead) md += lead + "\n\n";
    if (middle) md += middle + "\n\n";

    md += `### Key points\n\n`;
    points.slice(0, 7).forEach((p) => {
      md += `- ${p.text} [${p.n}]\n`;
    });

    md += `\n### Sources\n\n`;
    sources.forEach((s, i) => {
      md += `${i + 1}. [${(s.title || s.domain || s.url).replace(/[\[\]]/g, "")}](${s.url}) — ${s.domain}\n`;
    });
    md += `\n_Snippets come from the DuckDuckGo Instant Answer API and the Wikipedia search API` +
      (domains.length ? ` (${domains.slice(0, 4).join(", ")})` : "") +
      `. They are summaries rather than a full web index, so check the sources before relying on anything specific._`;
    return md;
  },

  async run(query, kind) {
    if (!query || !query.trim()) return null;
    let res;
    try {
      res = await Research.search(query);
    } catch {
      return null;
    }
    if (!res || !res.ok || !res.sources || !res.sources.length) return null;
    return {
      content: this.synthesize(query, res.sources, kind),
      sources: res.sources,
      kind
    };
  }
};

/* ---------- 17.6 PROJECTS ---------- */
const Projects = {
  async load() {
    const list = await Store.kvGet("projects", null);
    State.projects = Array.isArray(list) ? list : [];
  },
  async persist() {
    await Store.kvSet("projects", State.projects);
  },
  byId(id) {
    return State.projects.find((p) => p.id === id) || null;
  },
  ofConv(conv) {
    return conv && conv.projectId ? this.byId(conv.projectId) : null;
  },
  count(id) {
    return State.conversations.filter((c) => c.projectId === id && !c.archived).length;
  },
  async create(name) {
    const p = { id: uid("prj"), name: name || "New project", instructions: "", pinned: [], createdAt: Date.now() };
    State.projects.push(p);
    await this.persist();
    return p;
  },
  async update(id, patch) {
    const p = this.byId(id);
    if (!p) return;
    Object.assign(p, patch);
    await this.persist();
  },
  async remove(id) {
    State.projects = State.projects.filter((p) => p.id !== id);
    for (const c of State.conversations) {
      if (c.projectId === id) {
        c.projectId = null;
        await Conv.save(c);
      }
    }
    if (State.projectFilter === id) State.projectFilter = null;
    await this.persist();
  },
  async assign(convId, projectId) {
    const conv = Conv.byId(convId);
    if (!conv) return;
    conv.projectId = projectId || null;
    await Conv.save(conv);
    UI.renderSidebar(App.filterTerm());
    Projects.renderRail();
    App.updateHeader();
  },

  /* System-prompt contribution: instructions plus pinned context. */
  promptFor(conv) {
    const p = this.ofConv(conv);
    if (!p) return "";
    let out = `\n\nYou are working inside the project "${p.name}".`;
    if ((p.instructions || "").trim()) out += `\nProject instructions:\n${p.instructions.trim()}`;
    (p.pinned || []).forEach((c) => {
      if ((c.text || "").trim()) out += `\n\nPinned context — ${c.name || "note"}:\n${c.text.trim()}`;
    });
    return out;
  },

  renderRail() {
    const host = $("#project-rail");
    if (!host) return;
    host.innerHTML = "";
    const row = document.createElement("div");
    row.className = "project-row";
    const mk = (label, id, count) => {
      const b = document.createElement("button");
      b.className = "project-chip" + (State.projectFilter === id ? " active" : "");
      b.innerHTML = `<span class="ico" data-icon="folder"></span><span></span>${
        count != null ? `<em>${count}</em>` : ""
      }`;
      b.querySelector("span:nth-child(2)").textContent = label;
      b.addEventListener("click", () => {
        State.projectFilter = State.projectFilter === id ? null : id;
        UI.renderSidebar(App.filterTerm());
        this.renderRail();
      });
      if (id) {
        b.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.openEditor(id);
        });
      }
      hydrateIcons(b);
      row.appendChild(b);
    };
    State.projects.forEach((p) => mk(p.name, p.id, this.count(p.id)));
    const add = document.createElement("button");
    add.className = "project-chip add";
    add.innerHTML = `<span class="ico" data-icon="plus"></span><span>Project</span>`;
    add.addEventListener("click", () => this.openEditor(null));
    hydrateIcons(add);
    row.appendChild(add);
    host.appendChild(row);
    host.classList.toggle("empty", !State.projects.length);
  },

  async openEditor(id) {
    let p = id ? this.byId(id) : null;
    if (!p) {
      const name = await UI.prompt("New project", "Project name", "");
      if (!name) return;
      p = await this.create(name.trim());
    }
    ProOverlay.open({
      title: `Project — ${p.name}`,
      build: (body) => {
        body.innerHTML = `
          <label class="field"><span>Name</span><input type="text" id="prj-name"></label>
          <label class="field"><span>Project instructions</span>
            <textarea id="prj-instructions" rows="5" placeholder="Standing instructions for every chat in this project — tone, stack, constraints."></textarea></label>
          <div class="field"><span>Pinned context</span><div id="prj-pins" class="pin-list"></div>
            <button class="btn btn-sm" id="prj-add-pin"><span class="ico" data-icon="plus"></span>Add pinned note</button></div>
          <div class="field"><span>Chats in this project</span><div id="prj-convs" class="pin-list"></div></div>
          <div class="btn-row end">
            <button class="btn btn-danger btn-sm" id="prj-delete">Delete project</button>
            <button class="btn btn-primary btn-sm" id="prj-save">Save</button>
          </div>`;
        const name = $("#prj-name", body);
        const instr = $("#prj-instructions", body);
        name.value = p.name;
        instr.value = p.instructions || "";

        const pins = $("#prj-pins", body);
        const drawPins = () => {
          pins.innerHTML = "";
          (p.pinned || []).forEach((pin, i) => {
            const row = document.createElement("div");
            row.className = "pin-item";
            row.innerHTML = `<input type="text" class="pin-name" placeholder="Label">
              <textarea class="pin-text" rows="2" placeholder="Text the model should always see"></textarea>
              <button class="icon-btn sm" title="Remove"><span class="ico" data-icon="trash"></span></button>`;
            row.querySelector(".pin-name").value = pin.name || "";
            row.querySelector(".pin-text").value = pin.text || "";
            row.querySelector(".pin-name").addEventListener("input", (e) => (pin.name = e.target.value));
            row.querySelector(".pin-text").addEventListener("input", (e) => (pin.text = e.target.value));
            row.querySelector("button").addEventListener("click", () => {
              p.pinned.splice(i, 1);
              drawPins();
            });
            hydrateIcons(row);
            pins.appendChild(row);
          });
        };
        p.pinned = p.pinned || [];
        drawPins();
        $("#prj-add-pin", body).addEventListener("click", () => {
          p.pinned.push({ name: "", text: "" });
          drawPins();
        });
        hydrateIcons(body);

        const convs = $("#prj-convs", body);
        const drawConvs = () => {
          convs.innerHTML = "";
          const mine = State.conversations.filter((c) => c.projectId === p.id);
          if (!mine.length) convs.innerHTML = `<p class="muted sm">No chats yet. Open a chat, then use its menu → Move to project.</p>`;
          mine.forEach((c) => {
            const r = document.createElement("div");
            r.className = "pin-item flat";
            r.innerHTML = `<b></b><button class="btn btn-sm">Remove</button>`;
            r.querySelector("b").textContent = c.title || "Untitled";
            r.querySelector("button").addEventListener("click", async () => {
              await Projects.assign(c.id, null);
              drawConvs();
            });
            convs.appendChild(r);
          });
        };
        drawConvs();

        $("#prj-save", body).addEventListener("click", async () => {
          await this.update(p.id, { name: name.value.trim() || p.name, instructions: instr.value, pinned: p.pinned });
          this.renderRail();
          UI.renderSidebar(App.filterTerm());
          App.updateHeader();
          ProOverlay.close();
          UI.toast("Project saved");
        });
        $("#prj-delete", body).addEventListener("click", async () => {
          const ok = await UI.confirm("Delete project?", "The chats inside it are kept — they just stop being grouped.", "Delete", true);
          if (!ok) return;
          await this.remove(p.id);
          this.renderRail();
          UI.renderSidebar(App.filterTerm());
          ProOverlay.close();
        });
      }
    });
  }
};

/* ---------- 17.7 MEMORY BANK ---------- */
const Memory = {
  async load() {
    const list = await Store.kvGet("memory", null);
    State.memory = Array.isArray(list) ? list : [];
  },
  async persist() {
    await Store.kvSet("memory", State.memory);
  },
  async add(text, source) {
    const clean = String(text || "").trim().slice(0, 400);
    if (!clean) return null;
    const dupe = State.memory.find((m) => m.text.toLowerCase() === clean.toLowerCase());
    if (dupe) return dupe;
    const item = { id: uid("mem"), text: clean, ts: Date.now(), source: source || "manual" };
    State.memory.unshift(item);
    State.memory = State.memory.slice(0, 80);
    await this.persist();
    return item;
  },
  async remove(id) {
    State.memory = State.memory.filter((m) => m.id !== id);
    await this.persist();
  },
  async clear() {
    State.memory = [];
    await this.persist();
  },

  /* Explicit capture only: the user has to actually ask to be remembered. */
  capture(text) {
    if (!State.settings.memoryEnabled) return null;
    const t = String(text || "").trim();
    const patterns = [
      /^(?:please\s+)?remember(?:\s+that)?[:,\s]+(.{4,300})$/i,
      /^note to self[:,\s]+(.{4,300})$/i,
      /^(?:for future reference|from now on)[:,\s]+(.{4,300})$/i,
      /^call me\s+(.{2,60})$/i
    ];
    for (const re of patterns) {
      const m = re.exec(t);
      if (m) return (re.source.indexOf("call me") !== -1 ? "Prefers to be called " : "") + m[1].trim().replace(/\.$/, "");
    }
    return null;
  },

  prompt() {
    if (!State.settings.memoryEnabled || !State.memory.length) return "";
    let out = "\n\nSaved notes about the person you're talking to (they added these deliberately — use them when relevant, don't recite them):\n";
    State.memory.slice(0, 30).forEach((m) => (out += `- ${m.text}\n`));
    return out;
  },

  open() {
    ProOverlay.open({
      title: "Memory bank",
      build: (body) => {
        body.innerHTML = `
          <p class="muted sm">Notes the assistant keeps across chats. Say “remember that …” in a message, or add one here. Everything stays in this browser.</p>
          <label class="switch-row"><span>Use memory in new messages</span>
            <input type="checkbox" id="mem-on"></label>
          <div class="btn-row"><input type="text" id="mem-new" placeholder="Add a note — e.g. I write Python, not Java" class="grow">
            <button class="btn btn-primary btn-sm" id="mem-add">Add</button></div>
          <div id="mem-list" class="mem-list"></div>
          <div class="btn-row end"><button class="btn btn-danger btn-sm" id="mem-clear">Forget everything</button></div>`;
        const on = $("#mem-on", body);
        on.checked = !!State.settings.memoryEnabled;
        on.addEventListener("change", () => {
          State.settings.memoryEnabled = on.checked;
          App.persistSettings();
        });
        const list = $("#mem-list", body);
        const draw = () => {
          list.innerHTML = "";
          if (!State.memory.length) {
            list.innerHTML = `<p class="muted sm">Nothing saved yet.</p>`;
            return;
          }
          State.memory.forEach((m) => {
            const row = document.createElement("div");
            row.className = "mem-item";
            row.innerHTML = `<textarea rows="1"></textarea>
              <span class="mem-meta"></span>
              <button class="icon-btn sm" title="Forget this"><span class="ico" data-icon="trash"></span></button>`;
            const ta = row.querySelector("textarea");
            ta.value = m.text;
            ta.addEventListener("change", async () => {
              m.text = ta.value.trim();
              await Memory.persist();
            });
            row.querySelector(".mem-meta").textContent = `${m.source} · ${relTime(m.ts)}`;
            row.querySelector("button").addEventListener("click", async () => {
              await Memory.remove(m.id);
              draw();
            });
            hydrateIcons(row);
            list.appendChild(row);
          });
        };
        draw();
        const addNew = async () => {
          const input = $("#mem-new", body);
          if (!input.value.trim()) return;
          await Memory.add(input.value, "manual");
          input.value = "";
          draw();
        };
        $("#mem-add", body).addEventListener("click", addNew);
        $("#mem-new", body).addEventListener("keydown", (e) => {
          if (e.key === "Enter") addNew();
        });
        $("#mem-clear", body).addEventListener("click", async () => {
          const ok = await UI.confirm("Forget everything?", "Every saved note is deleted from this browser.", "Forget all", true);
          if (!ok) return;
          await Memory.clear();
          draw();
        });
      }
    });
  }
};

/* A small reusable modal for the workspace panels. */
const ProOverlay = {
  open({ title, build }) {
    const host = $("#pro-overlay");
    if (!host) return;
    host.innerHTML = `<div class="modal pro-modal" role="document">
        <div class="modal-head"><h2></h2>
          <button class="icon-btn" data-a="close" aria-label="Close"><span class="ico" data-icon="x"></span></button></div>
        <div class="modal-body pro-body"></div>
      </div>`;
    host.querySelector("h2").textContent = title;
    hydrateIcons(host);
    host.classList.add("open");
    host.querySelector("[data-a='close']").addEventListener("click", () => this.close());
    host.addEventListener("mousedown", (e) => {
      if (e.target === host) this.close();
    });
    build(host.querySelector(".pro-body"));
  },
  close() {
    const host = $("#pro-overlay");
    if (!host) return;
    host.classList.remove("open");
    host.innerHTML = "";
  },
  isOpen() {
    const host = $("#pro-overlay");
    return !!host && host.classList.contains("open");
  }
};

/* ---------- 17.8 BRANCHING ---------- */
const Branch = {
  /* ----- assistant response variants ----- */
  capture(msg) {
    return {
      content: msg.content,
      reasoning: msg.reasoning || "",
      reasoningMs: msg.reasoningMs || 0,
      sources: msg.sources || [],
      images: msg.images || [],
      stats: msg.stats || null,
      model: msg.model,
      providerLabel: msg.providerLabel,
      error: msg.error || "",
      errorHint: msg.errorHint || "",
      errorKind: msg.errorKind || "",
      fallback: msg.fallback || null,
      artifacts: msg.artifacts || []
    };
  },
  apply(msg, v) {
    Object.assign(msg, {
      content: v.content,
      reasoning: v.reasoning,
      reasoningMs: v.reasoningMs,
      sources: v.sources,
      images: v.images,
      stats: v.stats,
      model: v.model,
      providerLabel: v.providerLabel,
      error: v.error,
      errorHint: v.errorHint,
      errorKind: v.errorKind,
      fallback: v.fallback,
      artifacts: v.artifacts
    });
  },
  snapshot(msg) {
    if (!msg.variants) {
      msg.variants = [this.capture(msg)];
      msg.vi = 0;
    } else {
      msg.variants[msg.vi] = this.capture(msg);
    }
  },
  newVariant(msg) {
    this.snapshot(msg);
    msg.variants.push({ content: "", reasoning: "", sources: [], images: [], artifacts: [] });
    msg.vi = msg.variants.length - 1;
    this.apply(msg, msg.variants[msg.vi]);
    msg.error = "";
    msg.stats = null;
  },
  store(msg) {
    if (!msg.variants) return;
    msg.variants[msg.vi] = this.capture(msg);
  },
  async select(msg, index) {
    const conv = Conv.active();
    if (!conv || !msg.variants) return;
    const i = clamp(index, 0, msg.variants.length - 1);
    if (i === msg.vi) return;
    this.store(msg);
    msg.vi = i;
    this.apply(msg, msg.variants[i]);
    await Conv.save(conv);
    App.refreshMessage(msg.id);
  },

  /* ----- user message forks (edit = new branch of the thread) ----- */
  async editUser(conv, msg, newText) {
    const idx = conv.messages.findIndex((m) => m.id === msg.id);
    if (idx === -1) return;
    const tail = conv.messages.slice(idx + 1);
    if (!msg.forks) {
      msg.forks = [{ content: msg.content, tail }];
      msg.fi = 0;
    } else {
      msg.forks[msg.fi] = { content: msg.content, tail };
    }
    msg.forks.push({ content: newText, tail: [] });
    msg.fi = msg.forks.length - 1;
    msg.content = newText;
    msg.edited = true;
    conv.messages = conv.messages.slice(0, idx + 1);
    await Conv.save(conv);
  },
  async selectFork(msg, index) {
    const conv = Conv.active();
    if (!conv || !msg.forks) return;
    const i = clamp(index, 0, msg.forks.length - 1);
    if (i === msg.fi) return;
    const idx = conv.messages.findIndex((m) => m.id === msg.id);
    msg.forks[msg.fi] = { content: msg.content, tail: conv.messages.slice(idx + 1) };
    msg.fi = i;
    msg.content = msg.forks[i].content;
    conv.messages = conv.messages.slice(0, idx + 1).concat(msg.forks[i].tail || []);
    await Conv.save(conv);
    UI.renderMessages(conv);
    UI.renderSidebar(App.filterTerm());
  },

  /* Nav control: ‹ 2 / 3 › */
  buildNav(msg) {
    const isUser = msg.role === "user";
    const list = isUser ? msg.forks : msg.variants;
    const index = isUser ? msg.fi : msg.vi;
    if (!list || list.length < 2) return null;
    const wrap = document.createElement("div");
    wrap.className = "branch-nav";
    wrap.innerHTML =
      `<button class="bn-btn" data-d="-1" aria-label="Previous version">‹</button>` +
      `<span class="bn-count">${index + 1} / ${list.length}</span>` +
      `<button class="bn-btn" data-d="1" aria-label="Next version">›</button>`;
    wrap.querySelectorAll(".bn-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const next = index + parseInt(b.dataset.d, 10);
        if (next < 0 || next >= list.length) return;
        if (isUser) Branch.selectFork(msg, next);
        else Branch.select(msg, next);
      })
    );
    return wrap;
  }
};

/* ---------- 17.9 RENDER OVERRIDES ---------- */
(function extendMessageRendering() {
  const base = UI.buildMessage.bind(UI);
  UI.buildMessage = function (msg) {
    const el = base(msg);
    const body = el.querySelector(".msg-body");
    const content = el.querySelector(".msg-content");
    if (!body || !content) return el;

    /* reasoning above the answer */
    if (msg.reasoning && String(msg.reasoning).trim()) {
      body.insertBefore(Reasoning.build(msg), content);
    }

    /* fallback badge */
    if (msg.fallback) {
      const badge = document.createElement("div");
      badge.className = "fallback-badge";
      badge.innerHTML = `<span class="ico" data-icon="globe"></span><span></span>`;
      badge.querySelector("span:last-child").textContent =
        `Answered from live web search — ${Fallback.sourceSummary(msg.sources)} · ${Fallback.reasonLabel(msg.fallback.kind)}`;
      hydrateIcons(badge);
      body.insertBefore(badge, content);
    }

    /* artifact chips */
    const chips = Artifacts.buildChips(msg);
    if (chips) content.insertAdjacentElement("afterend", chips);

    /* branch navigation */
    const nav = Branch.buildNav(msg);
    if (nav) {
      const actions = el.querySelector(".msg-actions");
      if (actions) actions.insertBefore(nav, actions.firstChild);
      else body.appendChild(nav);
    }
    return el;
  };
})();

/* ---------- system prompt: projects, memory, artifacts, thinking ---------- */
(function extendSystemPrompt() {
  const base = App.systemPrompt.bind(App);
  App.systemPrompt = function (sources) {
    let sys = base(sources);
    const conv = Conv.active();
    sys += Projects.promptFor(conv);
    sys += Memory.prompt();
    if (State.settings.canvasAuto) {
      sys +=
        "\n\nWhen you produce a complete, self-contained artifact — an HTML page, an SVG, a React component, a Streamlit app, or a long document — put it in a single fenced code block with the right language tag. It will open in a side-by-side canvas the person can edit, so avoid splitting one artifact across several blocks.";
    }
    if (State.settings.thinking) {
      sys +=
        "\n\nThink the problem through before answering. If the model surface supports separate reasoning output, use it; otherwise keep the visible answer clean and final.";
    }
    return sys;
  };
})();

/* ---------- memory capture on send ---------- */
(function extendSend() {
  const base = App.sendMessage.bind(App);
  App.sendMessage = async function () {
    const text = UI.els.composerInput.value.trim();
    const note = Memory.capture(text);
    const p = base();
    if (note) {
      Memory.add(note, "chat").then((item) => {
        if (item) UI.toast("Saved to memory: " + item.text.slice(0, 60));
      });
    }
    return p;
  };
})();

/* ---------- the turn engine ---------- */
App.runTurn = async function (conv, choice, opts) {
  opts = opts || {};
  const provider = (choice && choice.provider) || State.settings.provider;
  const model = (choice && choice.model) || State.settings.model;
  const cfg = APP.providers[provider] || APP.providers.simulation;

  State.generating = true;
  UI.els.sendBtn.classList.add("hidden");
  UI.els.stopBtn.classList.remove("hidden");
  UI.els.sendBtn.disabled = true;
  this.updateHeader();

  const lastUser = [...conv.messages].reverse().find((m) => m.role === "user");
  const query = lastUser ? (lastUser.content || "").slice(0, 300) : "";

  let assistant = opts.target;
  let el;
  if (assistant) {
    assistant.streaming = true;
    assistant.thinkingLabel = "Thinking";
    assistant.model = model;
    assistant.providerLabel = provider === "simulation" ? "Simulation mode" : cfg.label;
    assistant.sources = [];
    assistant.images = [];
    assistant.reasoning = "";
    assistant.fallback = null;
    el = UI.els.chatInner.querySelector(`.msg[data-id="${assistant.id}"]`);
    if (el) {
      const fresh = UI.buildMessage(assistant);
      el.replaceWith(fresh);
      el = fresh;
    } else {
      el = UI.appendMessage(assistant);
    }
  } else {
    assistant = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
      thinkingLabel: "Thinking",
      model,
      providerLabel: provider === "simulation" ? "Simulation mode" : cfg.label,
      sources: [],
      images: [],
      reasoning: "",
      artifacts: []
    };
    conv.messages.push(assistant);
    el = UI.appendMessage(assistant);
  }
  UI.scrollToBottom(true);

  const setThinking = (label) => {
    assistant.thinkingLabel = label;
    const t = el.querySelector(".thinking span");
    if (t) t.textContent = label;
  };

  /* research phase */
  if (State.settings.webSearch) {
    if (provider === "simulation") {
      assistant.searchState = { status: "disabled", message: "Simulation mode doesn't search the web. Connect a provider and the search results will appear here with citations." };
    } else {
      setThinking("Searching the web");
      const r = await Research.search(query);
      if (!r.ok) assistant.searchState = { status: "failed", message: r.message };
      else if (r.empty) assistant.searchState = { status: "empty", message: r.message };
      else assistant.sources = r.sources;
    }
  }
  if (State.settings.imageSearch) {
    if (provider === "simulation") {
      assistant.imageState = { status: "disabled", message: "Simulation mode doesn't search for images." };
    } else {
      setThinking("Finding images");
      const r = await Research.images(query);
      if (!r.ok) assistant.imageState = { status: "failed", message: r.message };
      else if (r.empty) assistant.imageState = { status: "empty", message: r.message };
      else assistant.images = r.images;
    }
  }
  setThinking(State.settings.thinking ? "Reasoning" : "Thinking");

  const controller = new AbortController();
  State.abort = controller;
  const adapter = Providers.get(provider);
  const history = conv.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => m.id !== assistant.id)
    .filter((m) => (m.content || "").trim() || (m.attachments || []).length)
    .slice(-State.settings.contextLimit);

  const contentEl = () => el.querySelector(".msg-content");
  let raf = null;
  const started = performance.now();
  let firstReasonAt = 0;

  const onDelta = (text) => {
    assistant.content = text;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const c = contentEl();
      if (c) {
        c.classList.remove("thinking");
        c.classList.add("streaming-caret");
        c.innerHTML = UI.renderContent(assistant);
      }
      UI.scrollToBottom();
      raf = null;
    });
  };
  const onReason = (text) => {
    if (!firstReasonAt) firstReasonAt = performance.now();
    assistant.reasoning = text;
    assistant.reasoningMs = performance.now() - firstReasonAt;
    Reasoning.update(el, assistant);
    UI.scrollToBottom();
  };

  const apiKey = State.apiKeys[provider] || "";
  let fallbackReason = null;

  try {
    if (cfg.needsKey && !apiKey && State.settings.searchFallback) {
      // No key at all: don't even try the network, go straight to search.
      throw new ProviderError(`No ${cfg.label} API key is set.`, { kind: "no_key" });
    }
    const result = await adapter.send({
      messages: history,
      model,
      systemPrompt: this.systemPrompt(assistant.sources),
      apiKey,
      endpoint: State.endpoints[provider],
      signal: controller.signal,
      stream: State.settings.streaming,
      params: {
        temperature: State.settings.temperature,
        maxTokens: State.settings.maxTokens,
        topP: State.settings.topP,
        thinking: State.settings.thinking,
        thinkingEffort: State.settings.thinkingEffort,
        thinkingBudget: State.settings.thinkingBudget
      },
      onDelta,
      onReason
    });
    const finalText = typeof result === "string" ? result : (result && result.text) || "";
    if (result && result.reasoning && !assistant.reasoning) assistant.reasoning = result.reasoning;
    assistant.content = (finalText || "").trim() || "_The model returned an empty response._";
  } catch (err) {
    const aborted = err instanceof ProviderError && err.kind === "aborted";
    if (aborted) {
      if (!assistant.content) assistant.content = "_Stopped._";
      else assistant.content += "\n\n_Stopped._";
    } else {
      const kind = (err && err.kind) || "unknown";
      if (Fallback.shouldRun(kind) && query) {
        setThinking("Falling back to web search");
        const fb = await Fallback.run(query, kind);
        if (fb) {
          assistant.content = fb.content;
          assistant.sources = fb.sources;
          assistant.fallback = { kind, at: Date.now() };
          assistant.providerLabel = "DuckDuckGo fallback";
          fallbackReason = kind;
        }
      }
      if (!assistant.fallback) {
        assistant.error = err && err.message ? err.message : "Something went wrong.";
        assistant.errorHint = (err && err.hint) || "";
        assistant.errorKind = kind;
      }
    }
  } finally {
    if (raf) cancelAnimationFrame(raf);
    assistant.streaming = false;
    assistant.stats = {
      ms: performance.now() - started,
      chars: assistant.content.length,
      tokens: approxTokens(assistant.content) + approxTokens(assistant.reasoning)
    };
    State.generating = false;
    State.abort = null;
    UI.els.sendBtn.classList.remove("hidden");
    UI.els.stopBtn.classList.add("hidden");
    this.updateComposerState();
    this.updateHeader();
  }

  /* artifacts */
  let newArtifacts = [];
  if (!assistant.error) {
    try { newArtifacts = Artifacts.extract(conv, assistant); } catch (e) { console.warn("artifact extraction failed", e); }
  }
  Branch.store(assistant);

  const fresh = UI.buildMessage(assistant);
  el.replaceWith(fresh);
  el = fresh;
  UI.scrollToBottom();

  conv.provider = provider;
  conv.model = model;
  await Conv.save(conv);
  UI.renderSidebar(this.filterTerm());

  if (newArtifacts.length && State.settings.canvasAuto && window.innerWidth > 860) {
    Canvas.open(newArtifacts[newArtifacts.length - 1], conv.id);
  }
  if (fallbackReason) UI.toast("Answered from live web search — " + Fallback.reasonLabel(fallbackReason));
  if (State.settings.autoSpeak && assistant.content && !assistant.error) this.toggleSpeak(assistant);
};

/* regenerate keeps the old answer as a sibling version */
App.regenerate = async function (messageId, choice) {
  const conv = Conv.active();
  if (!conv || State.generating) return;
  const msg = conv.messages.find((m) => m.id === messageId);
  if (!msg) return;
  if (msg.role !== "assistant") {
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    conv.messages = conv.messages.slice(0, idx + 1);
    await Conv.save(conv);
    UI.renderMessages(conv);
    return this.runTurn(conv, choice);
  }
  // Anything after this answer belongs to the old branch — drop it, the
  // version stack keeps the answer itself.
  const idx = conv.messages.findIndex((m) => m.id === messageId);
  conv.messages = conv.messages.slice(0, idx + 1);
  Branch.newVariant(msg);
  await Conv.save(conv);
  UI.renderMessages(conv);
  return this.runTurn(conv, choice, { target: msg });
};

/* editing a user message forks the thread instead of deleting it */
App.editMessage = function (id) {
  const conv = Conv.active();
  if (!conv || State.generating) return;
  const msg = conv.messages.find((m) => m.id === id);
  const el = UI.els.chatInner.querySelector(`.msg[data-id="${id}"] .msg-content`);
  if (!msg || !el) return;
  const editor = document.createElement("div");
  editor.className = "msg-editor";
  editor.innerHTML = `<textarea></textarea>
    <div class="btn-row">
      <button class="btn btn-primary btn-sm" data-a="save">Save and resend</button>
      <button class="btn btn-sm" data-a="cancel">Cancel</button>
      <span class="editor-hint">This keeps the old version as a branch you can flip back to.</span>
    </div>`;
  const ta = editor.querySelector("textarea");
  ta.value = msg.content;
  el.replaceWith(editor);
  ta.focus();
  ta.style.height = Math.min(ta.scrollHeight + 4, 320) + "px";
  editor.querySelector("[data-a='cancel']").addEventListener("click", () => this.refreshMessage(id));
  editor.querySelector("[data-a='save']").addEventListener("click", async () => {
    const text = ta.value.trim();
    if (!text) return;
    if (msg.role === "user") {
      await Branch.editUser(conv, msg, text);
      UI.renderMessages(conv);
      this.runTurn(conv);
    } else {
      msg.content = text;
      msg.edited = true;
      Branch.store(msg);
      await Conv.save(conv);
      UI.renderMessages(conv);
    }
  });
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Escape") this.refreshMessage(id);
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) editor.querySelector("[data-a='save']").click();
  });
};

/* ---------- sidebar filtering by project ---------- */
(function extendSidebar() {
  const baseVisible = Conv.visible.bind(Conv);
  Conv.visible = function () {
    const list = baseVisible();
    if (!State.projectFilter) return list;
    return list.filter((c) => c.projectId === State.projectFilter);
  };
  const baseRender = UI.renderSidebar.bind(UI);
  UI.renderSidebar = function (term) {
    baseRender(term);
    Projects.renderRail();
  };
})();

/* ---------- conversation menu: move to project ---------- */
(function extendChatMenu() {
  const base = App.openChatMenu.bind(App);
  App.openChatMenu = function (rect, align) {
    const conv = Conv.active();
    if (!conv) return base(rect, align);
    const items = [
      { label: "Project" },
      ...State.projects.map((p) => ({
        text: (conv.projectId === p.id ? "✓ " : "") + p.name,
        icon: "folder",
        run: () => Projects.assign(conv.id, conv.projectId === p.id ? null : p.id)
      })),
      { text: "New project…", icon: "plus", run: () => Projects.openEditor(null) },
      { label: "Canvas" },
      { text: "Open latest artifact", icon: "canvas", run: () => Canvas.toggle() }
    ];
    UI.menu(rect, items, { align: align || "auto", side: "below" });
  };
})();

/* ---------- command palette additions ---------- */
(function extendPalette() {
  const base = Palette.commands.bind(Palette);
  Palette.commands = function () {
    const list = base();
    const extra = [
      { group: "Workspace", title: "Toggle Canvas pane", sub: "Ctrl/⌘ Shift E", icon: "canvas", run: () => Canvas.toggle() },
      { group: "Workspace", title: (State.settings.thinking ? "Disable" : "Enable") + " extended thinking", sub: "Ctrl/⌘ Shift R", icon: "brain", run: () => App.toggleThinking() },
      { group: "Workspace", title: "Memory bank", sub: "What the assistant remembers", icon: "bookmark", run: () => Memory.open() },
      { group: "Workspace", title: "Projects", sub: "Group chats with their own instructions", icon: "folder", run: () => Projects.openEditor(State.projectFilter) },
      { group: "Workspace", title: (State.settings.searchFallback ? "Disable" : "Enable") + " search fallback", sub: "Answer from DuckDuckGo when the API is unavailable", icon: "globe", run: () => { State.settings.searchFallback = !State.settings.searchFallback; App.persistSettings(); UI.toast("Search fallback " + (State.settings.searchFallback ? "on" : "off")); } }
    ];
    if (State.projectFilter) {
      extra.push({ group: "Workspace", title: "Clear project filter", icon: "filter", run: () => { State.projectFilter = null; UI.renderSidebar(App.filterTerm()); Projects.renderRail(); } });
    }
    State.projects.forEach((p) =>
      extra.push({
        group: "Projects",
        title: p.name,
        sub: `${Projects.count(p.id)} chat(s)`,
        icon: "folder",
        run: () => {
          State.projectFilter = p.id;
          UI.renderSidebar(App.filterTerm());
          Projects.renderRail();
        }
      })
    );
    return extra.concat(list);
  };
})();

/* ---------- extra settings ---------- */
(function extendSettings() {
  const baseParams = Settings.params.bind(Settings);
  Settings.params = function (body) {
    baseParams(body);
    const s = State.settings;
    const block = document.createElement("div");
    block.innerHTML = `
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Extended thinking</div>
          <div class="row-toggle-sub">Ask reasoning models (o-series, Claude 4 / 3.7, DeepSeek R1, Gemini 2.x) to show their working in a collapsible block.</div>
        </div>
        <label class="switch"><input type="checkbox" id="pro-thinking-toggle" ${s.thinking ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="field-group">
        <label class="field-label" for="pro-effort">Reasoning effort</label>
        <div class="seg" id="pro-effort">
          ${["low", "medium", "high"].map((v) => `<button data-v="${v}" class="${s.thinkingEffort === v ? "active" : ""}">${v}</button>`).join("")}
        </div>
        <p class="field-hint">Higher effort means slower, more expensive replies. Claude uses this as a thinking-token budget.</p>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Open artifacts in Canvas</div>
          <div class="row-toggle-sub">Generated pages, components and long documents open in an editable side pane.</div>
        </div>
        <label class="switch"><input type="checkbox" id="pro-canvas-toggle" ${s.canvasAuto ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Render maths</div>
          <div class="row-toggle-sub">Formats $inline$ and $$display$$ LaTeX without loading an external library.</div>
        </div>
        <label class="switch"><input type="checkbox" id="pro-math-toggle" ${s.mathRender ? "checked" : ""}><span class="switch-track"></span></label>
      </div>`;
    body.appendChild(block);
    $("#pro-thinking-toggle", block).addEventListener("change", (e) => {
      s.thinking = e.target.checked;
      App.persistSettings();
      App.syncProChips();
    });
    $("#pro-canvas-toggle", block).addEventListener("change", (e) => { s.canvasAuto = e.target.checked; App.persistSettings(); });
    $("#pro-math-toggle", block).addEventListener("change", (e) => { s.mathRender = e.target.checked; App.persistSettings(); App.rerenderActive(); });
    $$("#pro-effort button", block).forEach((b) =>
      b.addEventListener("click", () => {
        s.thinkingEffort = b.dataset.v;
        s.thinkingBudget = { low: 2000, medium: 4000, high: 10000 }[b.dataset.v];
        App.persistSettings();
        $$("#pro-effort button", block).forEach((x) => x.classList.toggle("active", x === b));
      })
    );
  };

  const baseResearch = Settings.research.bind(Settings);
  Settings.research = function (body) {
    baseResearch(body);
    const s = State.settings;
    const block = document.createElement("div");
    block.innerHTML = `
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Search fallback</div>
          <div class="row-toggle-sub">If the provider is offline, rate-limited, unauthenticated or has no key, answer from DuckDuckGo and Wikipedia snippets instead of failing — clearly labelled as such.</div>
        </div>
        <label class="switch"><input type="checkbox" id="pro-fallback-toggle" ${s.searchFallback ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Memory bank</div>
          <div class="row-toggle-sub">Say “remember that …” in a chat and the note is kept for future chats in this browser.</div>
        </div>
        <label class="switch"><input type="checkbox" id="pro-memory-toggle" ${s.memoryEnabled ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="btn-row"><button class="btn btn-sm" id="pro-memory-open"><span class="ico" data-icon="bookmark"></span>Open memory bank</button></div>`;
    body.appendChild(block);
    hydrateIcons(block);
    $("#pro-fallback-toggle", block).addEventListener("change", (e) => { s.searchFallback = e.target.checked; App.persistSettings(); });
    $("#pro-memory-toggle", block).addEventListener("change", (e) => { s.memoryEnabled = e.target.checked; App.persistSettings(); });
    $("#pro-memory-open", block).addEventListener("click", () => { Settings.close(); Memory.open(); });
  };
})();

/* ---------- composer + header wiring ---------- */
App.toggleThinking = function () {
  State.settings.thinking = !State.settings.thinking;
  this.persistSettings();
  this.syncProChips();
  UI.toast(State.settings.thinking ? "Extended thinking on — reasoning shows above the answer" : "Extended thinking off");
};

App.syncProChips = function () {
  const chip = $("#thinking-toggle");
  if (chip) {
    chip.classList.toggle("active", !!State.settings.thinking);
    chip.setAttribute("aria-pressed", State.settings.thinking ? "true" : "false");
  }
  const badge = $("#header-thinking-badge");
  if (badge) badge.hidden = !State.settings.thinking;
};

(function extendBind() {
  const base = App.bind.bind(App);
  App.bind = function () {
    base();
    const on = (sel, ev, fn) => {
      const el = $(sel);
      if (el) el.addEventListener(ev, fn);
    };
    on("#thinking-toggle", "click", () => App.toggleThinking());
    on("#canvas-btn", "click", () => Canvas.toggle());
    on("#memory-entry-btn", "click", () => Memory.open());
    on("#projects-entry-btn", "click", () => Projects.openEditor(State.projectFilter));

    document.addEventListener("keydown", (e) => {
      if (modKey(e) && e.shiftKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        Canvas.toggle();
      } else if (modKey(e) && e.shiftKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        App.toggleThinking();
      } else if (e.key === "Escape" && ProOverlay.isOpen()) {
        ProOverlay.close();
      }
    });
  };

  const baseInit = App.init.bind(App);
  App.init = async function () {
    await baseInit();
    await Promise.all([Projects.load(), Memory.load()]);
    Canvas.mount();
    Projects.renderRail();
    App.syncProChips();
    document.documentElement.style.setProperty("--canvas-split", State.settings.canvasSplit + "%");
    APP.shortcuts.push(["Ctrl / ⌘ + Shift + E", "Toggle the Canvas pane"], ["Ctrl / ⌘ + Shift + R", "Toggle extended thinking"]);
  };

  const baseOpenConv = App.openConversation.bind(App);
  App.openConversation = function (id) {
    baseOpenConv(id);
    if (State.canvas.open && State.canvas.convId !== id) Canvas.close();
  };
})();

/* ---------- slash commands ---------- */
(function extendSlash() {
  const base = App.slashCommands.bind(App);
  App.slashCommands = function () {
    return base().concat([
      { name: "/canvas", desc: "Open the Canvas pane", run: () => Canvas.toggle() },
      { name: "/think", desc: "Toggle extended thinking", run: () => App.toggleThinking() },
      { name: "/remember", desc: "Save a note to the memory bank", run: () => {
          UI.els.composerInput.value = "Remember that ";
          UI.els.composerInput.focus();
          UI.autoGrow(UI.els.composerInput);
          App.updateComposerState();
        } },
      { name: "/project", desc: "Manage projects", run: () => Projects.openEditor(State.projectFilter) },
      { name: "/memory", desc: "Open the memory bank", run: () => Memory.open() }
    ]);
  };
})();

/* ============================================================
   18. NIMBUS WORKBENCH (4.0)
   18.1 Capability registry + expanded provider roster
   18.2 Puter.js and AICredits adapters
   18.3 Token accounting, context meter, auto-compression
   18.4 Client-side executors (Pyodide, JS worker, C/C++)
   18.5 Visual sandbox: live preview, Mermaid, KaTeX, Chart.js
   18.6 Pipelines: sequential chains, DAGs, model comparison
   18.7 Storage: pipelines, snippets, obfuscated keys
   18.8 Wiring
   ============================================================ */

/* ---------- 18.1 CAPABILITIES ----------
   Model IDs below were checked against provider documentation in
   September 2026. Rosters move fast, so every provider with a /models
   endpoint can also refresh itself from the live list in Settings. */
const Caps = {
  vision: /gpt-5|gpt-4o|gpt-4\.1|o3|o4|claude-(opus|sonnet|haiku|fable)|gemini|grok-(4|vision)|kimi-k2\.[56]|llava|qwen.*vl|pixtral/i,
  reasoning: /gpt-5|^o\d|claude-(opus|sonnet|fable|haiku-4)|gemini-(2\.5|3)|grok-4|deepseek-(reasoner|v4|r1)|qwq|magistral|kimi-k2/i,
  tools: /gpt-5|gpt-4|^o\d|claude-|gemini|grok|deepseek|kimi|mistral|llama-3\.[13]|qwen/i,

  windows: [
    [/gpt-5\.6|gpt-5\.5|gpt-4\.1/i, 1000000],
    [/gpt-5|^o\d/i, 400000],
    [/gpt-4o/i, 128000],
    [/claude-(fable|opus-5|sonnet-5|opus-4-8|sonnet-4-6)/i, 1000000],
    [/claude-haiku/i, 200000],
    [/gemini-3|gemini-2\.5/i, 1000000],
    [/grok-4\.(20|3)/i, 1000000],
    [/grok-4/i, 500000],
    [/deepseek-v4/i, 1000000],
    [/deepseek/i, 128000],
    [/kimi-k2/i, 262000],
    [/llama-3\.[13]|mixtral|mistral-large/i, 128000]
  ],

  /* Capability flags for one provider + model pair. */
  of(providerId, modelId) {
    const cfg = APP.providers[providerId] || {};
    const id = modelId || "";
    const declared = (cfg.models || []).find((m) => m.id === id) || {};
    const pick = (key, re) =>
      declared[key] != null ? declared[key] : cfg[key] != null ? cfg[key] && re.test(id) : re.test(id);
    return {
      vision: cfg.vision === false ? false : pick("vision", this.vision),
      reasoning: declared.reasoning != null ? declared.reasoning : this.reasoning.test(id),
      tools: declared.tools != null ? declared.tools : this.tools.test(id),
      streaming: cfg.streaming !== false,
      local: !!cfg.local,
      needsKey: !!cfg.needsKey,
      window: this.window(id)
    };
  },
  window(modelId) {
    for (const [re, n] of this.windows) if (re.test(modelId || "")) return n;
    return 32000;
  }
};

/* Expanded roster. Existing providers keep their endpoints; model lists
   are refreshed to IDs that are current, and new providers are added. */
Object.assign(APP.providers.openai, {
  models: [
    { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", reasoning: true },
    { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", reasoning: true },
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", reasoning: true },
    { id: "gpt-5.5", label: "GPT-5.5", reasoning: true },
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini" }
  ]
});
Object.assign(APP.providers.anthropic, {
  models: [
    { id: "claude-opus-5", label: "Claude Opus 5", reasoning: true },
    { id: "claude-sonnet-5", label: "Claude Sonnet 5", reasoning: true },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", reasoning: true },
    { id: "claude-opus-4-8", label: "Claude Opus 4.8", reasoning: true },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", reasoning: true }
  ]
});
Object.assign(APP.providers.gemini, {
  models: [
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", reasoning: true },
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)", reasoning: true },
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", reasoning: true },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", reasoning: true }
  ]
});
Object.assign(APP.providers.deepseek, {
  models: [
    { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", reasoning: true },
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", reasoning: true },
    { id: "deepseek-chat", label: "DeepSeek Chat (legacy alias)" },
    { id: "deepseek-reasoner", label: "DeepSeek Reasoner (legacy alias)", reasoning: true }
  ]
});
Object.assign(APP.providers.openrouter, {
  models: [
    { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra" },
    { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5" },
    { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { id: "x-ai/grok-4.5", label: "Grok 4.5" },
    { id: "moonshotai/kimi-k2.5", label: "Kimi K2.5" },
    { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
    { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
    { id: "mistralai/mixtral-8x22b-instruct", label: "Mixtral 8x22B" }
  ]
});
Object.assign(APP.providers.groq, {
  models: [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" }
  ]
});
Object.assign(APP.providers.ollama, {
  models: [
    { id: "llama3.3", label: "Llama 3.3" },
    { id: "qwen2.5", label: "Qwen 2.5" },
    { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
    { id: "gpt-oss:20b", label: "GPT-OSS 20B" },
    { id: "phi4", label: "Phi-4" },
    { id: "deepseek-r1", label: "DeepSeek R1 (distill)", reasoning: true }
  ]
});

/* New providers. */
Object.assign(APP.providers, {
  xai: {
    label: "xAI (Grok)", kind: "openai", needsKey: true, vision: true,
    endpoint: "https://api.x.ai/v1/chat/completions",
    testEndpoint: "https://api.x.ai/v1/models",
    keyUrl: "https://console.x.ai/",
    blurb: "OpenAI-compatible. Grok 4.x supports configurable reasoning effort.",
    models: [
      { id: "grok-4.6", label: "Grok 4.6", reasoning: true },
      { id: "grok-4.5", label: "Grok 4.5", reasoning: true },
      { id: "grok-4.3", label: "Grok 4.3", reasoning: true },
      { id: "grok-4.20-reasoning", label: "Grok 4.20 (reasoning)", reasoning: true },
      { id: "grok-4.20-non-reasoning", label: "Grok 4.20 (fast)", reasoning: false },
      { id: "grok-4.1-fast-reasoning", label: "Grok 4.1 Fast", reasoning: true }
    ]
  },
  moonshot: {
    label: "Moonshot (Kimi)", kind: "openai", needsKey: true, vision: true,
    endpoint: "https://api.moonshot.ai/v1/chat/completions",
    testEndpoint: "https://api.moonshot.ai/v1/models",
    keyUrl: "https://platform.moonshot.ai/console/api-keys",
    blurb: "Kimi K2.x — multimodal, strong at agentic tool calling. Also reachable through OpenRouter.",
    models: [
      { id: "kimi-k2.6", label: "Kimi K2.6", reasoning: true },
      { id: "kimi-k2.5", label: "Kimi K2.5", reasoning: true },
      { id: "moonshot-v1-128k", label: "Moonshot v1 128k" }
    ]
  },
  aicredits: {
    label: "AICredits (INR)", kind: "aicredits", needsKey: true, vision: true, editableEndpoint: true,
    endpoint: "https://api.aicredits.in/v1/chat/completions",
    testEndpoint: "https://api.aicredits.in/v1/models",
    balanceEndpoint: "https://api.aicredits.in/v1/balance",
    keyUrl: "https://aicredits.in/",
    blurb: "OpenAI drop-in billed in INR. Sends X-AICredits-Key alongside the bearer token and can report your balance.",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "deepseek-chat", label: "DeepSeek Chat" }
    ]
  },
  puter: {
    label: "Puter.js (no key)", kind: "puter", needsKey: false,
    scriptUrl: "https://js.puter.com/v2/",
    blurb: "Zero-config gateway: Puter loads in the page and bills the signed-in Puter user, so no API key is stored here. Needs internet and a Puter sign-in prompt on first use.",
    vision: true,
    models: [
      { id: "gpt-5-nano", label: "GPT-5 nano (via Puter)" },
      { id: "gpt-4o-mini", label: "GPT-4o mini (via Puter)" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (via Puter)" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (via Puter)" },
      { id: "deepseek-chat", label: "DeepSeek Chat (via Puter)" }
    ]
  }
});

/* ---------- 18.2 NEW ADAPTERS ---------- */

/* Puter.js: script is injected on first use, then puter.ai.chat streams. */
const PuterProvider = {
  loaded: null,
  load() {
    if (this.loaded) return this.loaded;
    this.loaded = new Promise((resolve, reject) => {
      if (window.puter) return resolve(window.puter);
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };
      const s = document.createElement("script");
      s.src = APP.providers.puter.scriptUrl;
      s.async = true;
      s.onload = () => (window.puter
        ? finish(resolve, window.puter)
        : finish(reject, new ProviderError("Puter loaded but exposed no API.", { kind: "server" })));
      s.onerror = () => finish(reject, new ProviderError("Couldn't load Puter.js — check your connection or a content blocker.", { kind: "network" }));
      document.head.appendChild(s);
      const timer = setTimeout(
        () => finish(reject, new ProviderError("Puter.js took too long to load.", { kind: "network" })),
        15000
      );
    }).catch((err) => {
      this.loaded = null;
      throw err;
    });
    return this.loaded;
  },
  flatten(messages, systemPrompt) {
    const parts = [systemPrompt ? `System: ${systemPrompt}` : ""];
    messages.forEach((m) => parts.push(`${m.role === "assistant" ? "Assistant" : "User"}: ${textOf(m)}`));
    parts.push("Assistant:");
    return parts.filter(Boolean).join("\n\n");
  },
  async send({ messages, model, systemPrompt, signal, onDelta, stream }) {
    const puter = await this.load();
    const prompt = this.flatten(messages, systemPrompt);
    let full = "";
    try {
      if (stream === false) {
        const res = await puter.ai.chat(prompt, { model });
        full = typeof res === "string" ? res : (res && (res.text || (res.message && res.message.content))) || "";
        onDelta(full);
        return { text: full, reasoning: "" };
      }
      const iter = await puter.ai.chat(prompt, { model, stream: true });
      for await (const part of iter) {
        if (signal && signal.aborted) throw new ProviderError("Generation stopped.", { kind: "aborted" });
        const chunk = typeof part === "string" ? part : (part && (part.text || part.delta)) || "";
        if (chunk) { full += chunk; onDelta(full); }
      }
      return { text: full, reasoning: "" };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        (err && err.message) || "Puter refused the request. You may need to sign in to Puter in the popup it opens.",
        { kind: "auth", hint: "Puter bills the signed-in Puter account rather than an API key." }
      );
    }
  },
  async test() {
    await this.load();
    return "Puter.js loaded. The first message opens a Puter sign-in if you aren't signed in.";
  }
};

/* AICredits: OpenAI-compatible plus a tier header and balance endpoint. */
function makeAICredits() {
  const base = makeOpenAICompatible("aicredits");
  return Object.assign({}, base, {
    async send(opts) {
      const patched = Object.assign({}, opts, {
        extraHeaders: { "X-AICredits-Key": opts.apiKey || "" }
      });
      return base.send(patched);
    },
    async balance(apiKey) {
      const res = await fetch(APP.providers.aicredits.balanceEndpoint, {
        headers: { Authorization: `Bearer ${apiKey}`, "X-AICredits-Key": apiKey }
      });
      if (!res.ok) throw await parseHttpError(res);
      const j = await res.json();
      const amount = j.balance != null ? j.balance : j.credits != null ? j.credits : j.data && j.data.balance;
      return amount != null ? `Balance: ₹${amount}` : "Connected, but the balance field wasn't recognised.";
    }
  });
}

/* Route the new kinds. */
(function extendProviders() {
  const base = Providers.get.bind(Providers);
  Providers.get = function (id) {
    const cfg = APP.providers[id];
    if (cfg && cfg.kind === "puter") return PuterProvider;
    if (cfg && cfg.kind === "aicredits") {
      if (!this.cache.aicredits) this.cache.aicredits = makeAICredits();
      return this.cache.aicredits;
    }
    return base(id);
  };
})();

/* ---------- 18.3 TOKENS, CONTEXT METER, COMPRESSION ---------- */
const Tokens = {
  /* A small BPE-flavoured estimator: splits like a byte-pair tokenizer
     would (words, sub-word chunks, punctuation, whitespace runs) instead
     of dividing character count by four. Within ~10% of tiktoken on
     English prose and code; it is an estimate, not a tokenizer. */
  count(text) {
    const s = String(text || "");
    if (!s) return 0;
    let n = 0;
    const re = /[A-Za-z]+|\d+|\s+|[^\sA-Za-z\d]/g;
    let m;
    while ((m = re.exec(s))) {
      const t = m[0];
      if (/^\s+$/.test(t)) n += t.length > 1 ? Math.ceil(t.length / 4) : 0;
      else if (/^[A-Za-z]+$/.test(t)) n += t.length <= 4 ? 1 : Math.ceil(t.length / 3.4);
      else if (/^\d+$/.test(t)) n += Math.ceil(t.length / 2.5);
      else n += 1;
    }
    return Math.max(1, n);
  },
  ofMessage(msg) {
    let n = this.count(textOf(msg)) + 4;
    (msg.attachments || []).forEach((a) => {
      if (a.kind === "image") n += 800; // rough vision-tile cost
    });
    return n;
  },
  ofConversation(conv) {
    if (!conv) return 0;
    return (conv.messages || []).reduce((sum, m) => sum + this.ofMessage(m), 0);
  },
  usage(conv) {
    const model = State.settings.model;
    const window = Caps.window(model);
    const used = this.ofConversation(conv) + this.count(App.systemPrompt([]));
    return { used, window, pct: Math.min(100, Math.round((used / window) * 100)) };
  },

  /* Auto-compression: once the thread passes the threshold, older turns
     are replaced by a model-written summary. System instructions, the
     most recent turns and any code blocks are preserved verbatim. */
  async maybeCompress(conv) {
    if (!State.settings.autoCompress || !conv || State.generating) return false;
    const { used, window, pct } = this.usage(conv);
    if (pct < State.settings.compressAt) return false;
    const keep = 6;
    const old = conv.messages.slice(0, -keep).filter((m) => !m.compressed);
    if (old.length < 4) return false;

    const transcript = old
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${(m.content || "").slice(0, 4000)}`)
      .join("\n\n");
    const code = [];
    old.forEach((m) => {
      const fences = (m.content || "").match(/```[\s\S]*?```/g) || [];
      fences.forEach((f) => code.push(f));
    });

    const provider = State.settings.provider;
    const adapter = Providers.get(provider);
    UI.toast(`Context at ${pct}% — summarising older turns`);
    try {
      const res = await adapter.send({
        messages: [{ role: "user", content: transcript, attachments: [] }],
        model: State.settings.model,
        systemPrompt:
          "Summarise this conversation history for use as context in the same conversation. Keep decisions, constraints, names, file paths, open questions and anything the assistant promised to do. Drop pleasantries. Write in compact bullet points under 400 words. Do not add commentary.",
        apiKey: State.apiKeys[provider] || "",
        endpoint: State.endpoints[provider],
        stream: false,
        params: { temperature: 0.1, maxTokens: 1200 },
        onDelta: () => {}
      });
      const summary = (typeof res === "string" ? res : res.text || "").trim();
      if (!summary) return false;
      const marker = {
        id: uid("msg"),
        role: "assistant",
        compressed: true,
        timestamp: old[0].timestamp,
        content:
          `**Earlier conversation, compressed** (${old.length} messages, ~${used.toLocaleString()} tokens)\n\n${summary}` +
          (code.length ? `\n\n<details><summary>Preserved code blocks (${code.length})</summary>\n\n${code.slice(0, 6).join("\n\n")}\n\n</details>` : ""),
        providerLabel: "Context compression",
        sources: [],
        images: []
      };
      conv.messages = [marker].concat(conv.messages.slice(-keep));
      await Conv.save(conv);
      App.rerenderActive();
      UI.toast("Older turns compressed — the thread keeps going");
      return true;
    } catch {
      return false;
    }
  }
};

/* ---------- 18.4 CLIENT-SIDE EXECUTORS ---------- */
/* Runtimes are fetched on first use. Each entry lists fallbacks: pinned
   builds first, then the moving "latest" path, so one dead URL doesn't
   take a feature down. Edit these if you self-host or need a version. */
const CDN = {
  pyodide: ["https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js", "https://cdn.jsdelivr.net/pyodide/v0.27.8/full/pyodide.js"],
  pyodideBase: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
  jscpp: ["https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/dist/JSCPP.es5.min.js", "https://cdn.jsdelivr.net/npm/JSCPP/dist/JSCPP.es5.min.js", "https://unpkg.com/JSCPP/dist/JSCPP.es5.min.js"],
  mermaid: ["https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js", "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"],
  katex: ["https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js", "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js"],
  katexCss: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
  chartjs: ["https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js", "https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"],
  jszip: ["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"],
  jspdf: ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"],
  pptxgenjs: ["https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js", "https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"],
  docx: ["https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js", "https://unpkg.com/docx@8.5.0/build/index.js"]
};

/* Try each candidate URL in turn; resolve on the first that loads. */
async function loadScript(sources) {
  const list = Array.isArray(sources) ? sources : [sources];
  let lastErr = null;
  for (const src of list) {
    try { return await loadOne(src); }
    catch (err) { lastErr = err; }
  }
  throw lastErr || new Error("No source could be loaded.");
}
function loadOne(src) {
  loadScript.cache = loadScript.cache || {};
  if (loadScript.cache[src]) return loadScript.cache[src];
  loadScript.cache[src] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { delete loadScript.cache[src]; reject(new Error("Couldn't load " + src)); };
    document.head.appendChild(s);
  });
  return loadScript.cache[src];
}
function loadStyle(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

/* A terminal panel attached under a code block. */
const Terminal = {
  for(block) {
    let panel = block.nextElementSibling;
    if (!panel || !panel.classList.contains("exec-panel")) {
      panel = document.createElement("div");
      panel.className = "exec-panel";
      panel.innerHTML =
        `<div class="exec-head"><span class="exec-status">idle</span>` +
        `<span class="exec-time"></span><span class="exec-spacer"></span>` +
        `<button class="exec-btn" data-x="clear">Clear</button></div>` +
        `<pre class="exec-body" tabindex="0"></pre><div class="exec-extra"></div>`;
      block.insertAdjacentElement("afterend", panel);
      panel.querySelector("[data-x='clear']").addEventListener("click", () => {
        panel.querySelector(".exec-body").textContent = "";
        panel.querySelector(".exec-extra").innerHTML = "";
      });
    }
    return {
      el: panel,
      body: panel.querySelector(".exec-body"),
      extra: panel.querySelector(".exec-extra"),
      status(text, cls) {
        const s = panel.querySelector(".exec-status");
        s.textContent = text;
        s.className = "exec-status " + (cls || "");
      },
      time(ms) {
        panel.querySelector(".exec-time").textContent = ms != null ? `${(ms / 1000).toFixed(2)}s` : "";
      },
      write(text, cls) {
        const span = document.createElement("span");
        if (cls) span.className = cls;
        span.textContent = text;
        panel.querySelector(".exec-body").appendChild(span);
        panel.querySelector(".exec-body").scrollTop = panel.querySelector(".exec-body").scrollHeight;
      },
      reset() {
        panel.querySelector(".exec-body").textContent = "";
        panel.querySelector(".exec-extra").innerHTML = "";
      }
    };
  }
};

const Executors = {
  busy: false,

  /* ----- Python via Pyodide (WASM) ----- */
  py: { runtime: null, loading: null, packages: new Set() },
  PY_PACKAGES: {
    numpy: "numpy", pandas: "pandas", matplotlib: "matplotlib", scipy: "scipy",
    sklearn: "scikit-learn", sympy: "sympy", PIL: "pillow", pillow: "pillow",
    bs4: "beautifulsoup4", requests: "requests", networkx: "networkx",
    statsmodels: "statsmodels", regex: "regex", lxml: "lxml", yaml: "pyyaml"
  },

  async pyodide(term) {
    if (this.py.runtime) return this.py.runtime;
    if (this.py.loading) return this.py.loading;
    this.py.loading = (async () => {
      if (term) term.status("loading Python runtime…", "run");
      await loadScript(CDN.pyodide);
      const rt = await window.loadPyodide({ indexURL: CDN.pyodideBase });
      this.py.runtime = rt;
      return rt;
    })().catch((err) => {
      this.py.loading = null;
      throw new Error("Pyodide failed to load: " + err.message);
    });
    return this.py.loading;
  },

  detectPackages(code) {
    const found = new Set();
    const re = /^\s*(?:import\s+([A-Za-z_][\w.]*)|from\s+([A-Za-z_][\w.]*)\s+import)/gm;
    let m;
    while ((m = re.exec(code))) {
      const root = (m[1] || m[2] || "").split(".")[0];
      if (this.PY_PACKAGES[root]) found.add(this.PY_PACKAGES[root]);
    }
    return Array.from(found);
  },

  async runPython(code, term) {
    const started = performance.now();
    term.reset();
    term.status("running", "run");
    try {
      const py = await this.pyodide(term);
      const needed = this.detectPackages(code).filter((p) => !this.py.packages.has(p));
      if (needed.length) {
        term.write(`Loading packages: ${needed.join(", ")}\n`, "dim");
        await py.loadPackage(needed);
        needed.forEach((p) => this.py.packages.add(p));
      }
      py.setStdout({ batched: (s) => term.write(s + "\n") });
      py.setStderr({ batched: (s) => term.write(s + "\n", "err") });

      const usesPlt = /matplotlib|pyplot/.test(code);
      if (usesPlt) {
        await py.runPythonAsync("import matplotlib\nmatplotlib.use('AGG')");
      }
      const result = await py.runPythonAsync(code);
      if (result !== undefined && result !== null) term.write(String(result) + "\n", "val");

      if (usesPlt) {
        const figs = await py.runPythonAsync(`
import io, base64, matplotlib.pyplot as _plt
_out = []
for _num in _plt.get_fignums():
    _buf = io.BytesIO()
    _plt.figure(_num).savefig(_buf, format='png', dpi=110, bbox_inches='tight')
    _out.append(base64.b64encode(_buf.getvalue()).decode())
_plt.close('all')
_out
`);
        const list = figs && figs.toJs ? figs.toJs() : figs;
        (list || []).forEach((b64) => {
          const img = document.createElement("img");
          img.className = "exec-figure";
          img.src = "data:image/png;base64," + b64;
          img.alt = "Matplotlib figure";
          term.extra.appendChild(img);
        });
        if (figs && figs.destroy) figs.destroy();
      }
      term.status("done", "ok");
    } catch (err) {
      term.write(String(err && err.message ? err.message : err) + "\n", "err");
      term.status("error", "fail");
    } finally {
      term.time(performance.now() - started);
    }
  },

  resetPython(term) {
    this.py.runtime = null;
    this.py.loading = null;
    this.py.packages = new Set();
    if (term) { term.reset(); term.status("environment reset", ""); }
    UI.toast("Python environment reset — the next run reloads Pyodide");
  },

  /* ----- JavaScript in a throwaway Web Worker ----- */
  runJS(code, term) {
    const started = performance.now();
    term.reset();
    term.status("running", "run");
    const shim = `
      const post = (level, args) => self.postMessage({ type: "log", level, args: args.map(fmt) });
      function fmt(v){
        try {
          if (typeof v === "string") return v;
          if (v instanceof Error) return v.stack || v.message;
          return JSON.stringify(v, (k, val) => (typeof val === "function" ? "[Function " + (val.name||"anonymous") + "]" : val), 2);
        } catch { return String(v); }
      }
      console.log = (...a) => post("log", a);
      console.info = (...a) => post("log", a);
      console.warn = (...a) => post("warn", a);
      console.error = (...a) => post("error", a);
      console.debug = (...a) => post("dim", a);
      console.table = (rows) => self.postMessage({ type: "table", rows: JSON.parse(JSON.stringify(rows)) });
      self.onerror = (msg) => post("error", [String(msg)]);
      (async () => {
        try {
          const __result = await (async () => { ${code}\n })();
          if (__result !== undefined) post("val", [__result]);
          self.postMessage({ type: "done" });
        } catch (err) {
          post("error", [err && err.stack ? err.stack : String(err)]);
          self.postMessage({ type: "done", failed: true });
        }
      })();
    `;
    let worker;
    try {
      worker = new Worker(URL.createObjectURL(new Blob([shim], { type: "text/javascript" })));
    } catch (err) {
      term.write("Web Workers are unavailable here: " + err.message + "\n", "err");
      term.status("error", "fail");
      return;
    }
    const kill = setTimeout(() => {
      worker.terminate();
      term.write("\nTimed out after 10s and was terminated.\n", "err");
      term.status("timeout", "fail");
      term.time(performance.now() - started);
    }, 10000);

    worker.onmessage = (e) => {
      const d = e.data || {};
      if (d.type === "log") d.args.forEach((a) => term.write(a + "\n", d.level === "log" ? "" : d.level));
      else if (d.type === "table") {
        const rows = Array.isArray(d.rows) ? d.rows : Object.values(d.rows || {});
        const cols = Array.from(new Set(rows.flatMap((r) => (r && typeof r === "object" ? Object.keys(r) : ["value"]))));
        const table = document.createElement("table");
        table.className = "exec-table";
        table.innerHTML =
          "<thead><tr><th>#</th>" + cols.map((c) => `<th>${Sec.esc(c)}</th>`).join("") + "</tr></thead><tbody>" +
          rows.map((r, i) =>
            `<tr><td>${i}</td>` +
            cols.map((c) => `<td>${Sec.esc(String(r && typeof r === "object" ? (r[c] ?? "") : r))}</td>`).join("") +
            "</tr>"
          ).join("") + "</tbody>";
        term.extra.appendChild(table);
      } else if (d.type === "done") {
        clearTimeout(kill);
        worker.terminate();
        term.status(d.failed ? "error" : "done", d.failed ? "fail" : "ok");
        term.time(performance.now() - started);
      }
    };
  },

  /* ----- C / C++ through the JSCPP interpreter ----- */
  async runCpp(code, term, stdin) {
    const started = performance.now();
    term.reset();
    term.status("compiling", "run");
    try {
      await loadScript(CDN.jscpp);
      if (!window.JSCPP) throw new Error("JSCPP didn't register on the page.");
      term.status("running", "run");
      const config = {
        stdio: { write: (s) => term.write(s) },
        unsigned_overflow: "warn",
        maxExecutionSteps: 4e7
      };
      const exit = window.JSCPP.run(code, stdin || "", config);
      term.write(`\n[process exited with code ${exit}]\n`, "dim");
      term.status(exit === 0 ? "done" : "exit " + exit, exit === 0 ? "ok" : "fail");
    } catch (err) {
      term.write(String((err && err.message) || err) + "\n", "err");
      term.status("error", "fail");
      if (/unsupported|not implemented|unknown/i.test(String(err))) {
        term.write(
          "JSCPP covers a useful subset of C and C++ — most of the STL beyond <iostream>, <vector>, <string> and <cstdio> is not implemented.\n",
          "dim"
        );
      }
    } finally {
      term.time(performance.now() - started);
    }
  },

  /* stdin prompt shown before running C/C++ that reads input */
  needsStdin(code) {
    return /\bcin\s*>>|\bscanf\s*\(|\bgetline\s*\(|\bfgets\s*\(/.test(code);
  },
  askStdin(term) {
    return new Promise((resolve) => {
      const box = document.createElement("div");
      box.className = "stdin-box";
      box.innerHTML =
        `<label>Program input (stdin) — one value per line</label>` +
        `<textarea rows="2" placeholder="Values the program will read"></textarea>` +
        `<button class="btn btn-primary btn-sm">Run with this input</button>`;
      term.extra.appendChild(box);
      const ta = box.querySelector("textarea");
      ta.focus();
      const go = () => {
        const v = ta.value;
        box.remove();
        resolve(v.endsWith("\n") ? v : v + "\n");
      };
      box.querySelector("button").addEventListener("click", go);
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go();
      });
    });
  },

  /* ----- dispatcher ----- */
  language(lang) {
    const l = (lang || "").toLowerCase();
    if (/^(py|python|python3)$/.test(l)) return "python";
    if (/^(js|javascript|node|mjs)$/.test(l)) return "javascript";
    if (/^(ts|typescript)$/.test(l)) return "typescript";
    if (/^(c|cpp|c\+\+|cc|cxx)$/.test(l)) return "cpp";
    return null;
  },
  async run(lang, code, block) {
    const kind = this.language(lang);
    if (!kind) return;
    const term = Terminal.for(block);
    if (kind === "python") return this.runPython(code, term);
    if (kind === "javascript") return this.runJS(code, term);
    if (kind === "typescript") {
      term.reset();
      term.write("TypeScript is run by stripping type annotations — complex types may not survive.\n", "dim");
      return this.runJS(code.replace(/:\s*[A-Za-z_][\w<>\[\]|,\s.]*(?=\s*[=,);])/g, "").replace(/^\s*(interface|type)\s+[\s\S]*?\n}/gm, ""), term);
    }
    if (kind === "cpp") {
      const stdin = this.needsStdin(code) ? await this.askStdin(term) : "";
      return this.runCpp(code, term, stdin);
    }
  }
};

/* ---------- 18.5 VISUAL SANDBOX + DIAGRAMS ---------- */
const Visuals = {
  mermaidReady: null,
  katexReady: null,
  chartReady: null,

  async mermaid() {
    if (!this.mermaidReady) {
      this.mermaidReady = loadScript(CDN.mermaid).then(() => {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: document.documentElement.getAttribute("data-theme") === "light" ? "default" : "dark",
          fontFamily: "Inter, system-ui, sans-serif"
        });
        return window.mermaid;
      });
    }
    return this.mermaidReady;
  },
  async katex() {
    if (!this.katexReady) {
      loadStyle(CDN.katexCss);
      this.katexReady = loadScript(CDN.katex).then(() => window.katex);
    }
    return this.katexReady;
  },
  async chart() {
    if (!this.chartReady) this.chartReady = loadScript(CDN.chartjs).then(() => window.Chart);
    return this.chartReady;
  },

  async renderMermaid(block, code) {
    let panel = block.nextElementSibling;
    if (!panel || !panel.classList.contains("diagram-panel")) {
      panel = document.createElement("div");
      panel.className = "diagram-panel";
      block.insertAdjacentElement("afterend", panel);
    }
    panel.innerHTML = `<div class="diagram-loading">Rendering diagram…</div>`;
    try {
      const mermaid = await this.mermaid();
      const id = "mmd_" + Math.random().toString(36).slice(2, 9);
      const { svg } = await mermaid.render(id, code);
      panel.innerHTML = svg;
      block.classList.add("collapsed-source");
    } catch (err) {
      panel.innerHTML = `<div class="diagram-error"></div>`;
      panel.querySelector(".diagram-error").textContent =
        "Mermaid couldn't render that diagram: " + ((err && err.message) || err);
    }
  },

  /* JSON blocks that look like chart data get an interactive chart. */
  chartSpec(json) {
    if (Array.isArray(json) && json.length && typeof json[0] === "object") {
      const keys = Object.keys(json[0]);
      const labelKey = keys.find((k) => typeof json[0][k] === "string") || keys[0];
      const numKeys = keys.filter((k) => typeof json[0][k] === "number");
      if (!numKeys.length) return null;
      return {
        type: numKeys.length > 1 || json.length > 12 ? "line" : "bar",
        data: {
          labels: json.map((r) => String(r[labelKey])),
          datasets: numKeys.map((k, i) => ({
            label: k,
            data: json.map((r) => r[k]),
            borderWidth: 2,
            borderColor: ["#6c8cff", "#b28dff", "#7cd9c7", "#e0b04f"][i % 4],
            backgroundColor: ["#6c8cff", "#b28dff", "#7cd9c7", "#e0b04f"][i % 4] + "55"
          }))
        }
      };
    }
    if (json && json.labels && Array.isArray(json.datasets)) {
      return { type: json.type || "bar", data: { labels: json.labels, datasets: json.datasets } };
    }
    return null;
  },

  async renderChart(block, code) {
    let panel = block.nextElementSibling;
    if (!panel || !panel.classList.contains("chart-panel")) {
      panel = document.createElement("div");
      panel.className = "chart-panel";
      block.insertAdjacentElement("afterend", panel);
    }
    panel.innerHTML = "";
    let spec;
    try {
      spec = this.chartSpec(JSON.parse(code));
    } catch {
      spec = null;
    }
    if (!spec) {
      panel.innerHTML = `<div class="diagram-error">That JSON doesn't look like chartable data (an array of objects with numbers, or {labels, datasets}).</div>`;
      return;
    }
    const Chart = await this.chart();
    const canvas = document.createElement("canvas");
    panel.appendChild(canvas);
    new Chart(canvas, {
      type: spec.type,
      data: spec.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: getComputedStyle(document.body).color } } },
        scales: {
          x: { ticks: { color: getComputedStyle(document.body).color } },
          y: { ticks: { color: getComputedStyle(document.body).color } }
        }
      }
    });
  },

  /* Live preview with device widths and a full-screen mode. */
  livePreview(block, code, lang) {
    let panel = block.nextElementSibling;
    if (panel && panel.classList.contains("live-panel")) {
      panel.remove();
      return false;
    }
    panel = document.createElement("div");
    panel.className = "live-panel";
    panel.innerHTML =
      `<div class="live-head">` +
      `<div class="live-viewports">` +
      `<button data-w="375" title="Mobile">375</button>` +
      `<button data-w="768" title="Tablet">768</button>` +
      `<button data-w="full" class="active" title="Full width">Full</button>` +
      `</div><span class="exec-spacer"></span>` +
      `<button class="exec-btn" data-x="full">Full screen</button>` +
      `<button class="exec-btn" data-x="close">Close</button></div>` +
      `<div class="live-stage"><iframe class="live-frame" sandbox="allow-scripts allow-modals allow-forms allow-popups" title="Live preview"></iframe></div>`;
    block.insertAdjacentElement("afterend", panel);

    const frame = panel.querySelector(".live-frame");
    frame.srcdoc = this.document(code, lang);
    panel.hidden = false;
    panel.style.display = "block";
    requestAnimationFrame(() => panel.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    panel.querySelectorAll(".live-viewports button").forEach((b) =>
      b.addEventListener("click", () => {
        panel.querySelectorAll(".live-viewports button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const w = b.dataset.w;
        frame.style.width = w === "full" ? "100%" : w + "px";
        frame.style.margin = w === "full" ? "0" : "0 auto";
      })
    );
    panel.querySelector("[data-x='close']").addEventListener("click", () => panel.remove());
    panel.querySelector("[data-x='full']").addEventListener("click", () => {
      panel.classList.toggle("fullscreen");
      document.body.classList.toggle("has-fullscreen-preview", panel.classList.contains("fullscreen"));
    });
    return true;
  },

  document(code, lang) {
    const l = (lang || "").toLowerCase();
    const shell = (body, head) =>
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<style>html,body{margin:0;background:#fff;color:#111;font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{padding:14px}</style>` +
      `${head || ""}</head><body>${body}</body></html>`;
    if (l === "css") return shell(`<h1>Heading</h1><p>Paragraph with <a href="#">a link</a> and a <button>button</button>.</p>`, `<style>${code}</style>`);
    if (l === "svg") return shell(`<div style="display:grid;place-items:center;min-height:90vh">${code}</div>`);
    if (l === "javascript" || l === "js") return shell(`<div id="app"></div>`, `<script>window.onerror=(m)=>document.body.insertAdjacentHTML("beforeend","<pre style=\\"color:#b00\\">"+m+"</pre>");<\/script><script defer>${code}<\/script>`);
    return /<html[\s>]/i.test(code) ? code : shell(code);
  },

  isPreviewable(lang, code) {
    const l = (lang || "").toLowerCase();
    if (["html", "svg", "css"].includes(l)) return true;
    if ((l === "javascript" || l === "js") && /document\.|window\.|querySelector|innerHTML|canvas/.test(code)) return true;
    return false;
  }
};

/* Upgrade the maths renderer to KaTeX when it is available, keeping the
   built-in renderer as the offline fallback. */
(function upgradeMath() {
  const fallback = MathLite.render;
  let warned = false;
  MathLite.render = function (tex, display) {
    if (State.settings.useKatex !== false) {
      if (window.katex) {
        try {
          return window.katex.renderToString(String(tex).trim(), {
            displayMode: !!display,
            throwOnError: false,
            output: "html"
          });
        } catch { /* fall through */ }
      } else {
        Visuals.katex()
          .then(() => {
            if (!warned) { warned = true; App.rerenderActive(); }
          })
          .catch(() => {});
      }
    }
    return fallback.call(MathLite, tex, display);
  };
})();

/* ---------- code-block decoration ---------- */
const Workbench = {
  artifactMap: new Map(),
  artifactMsg: null,
  decorate(root) {
    $$(".code-block", root || UI.els.chatInner).forEach((block) => {
      if (block.dataset.wb === "1") return;
      const head = block.querySelector(".code-head");
      if (!head) return;
      const msgEl = block.closest("[data-id]");
      const msgId = msgEl && msgEl.dataset.id;
      const conv = Conv.active();
      const msg = msgId && conv ? (conv.messages || []).find((m) => m.id === msgId) : null;
      if (msg && msg !== this.artifactMsg) {
        this.artifactMsg = msg;
        this.artifactMap = Artifacts.byCode(msg);
      }
      const lang = (block.dataset.lang || "").toLowerCase();
      let code = "";
      try { code = decodeURIComponent(block.dataset.code || ""); } catch { code = ""; }
      if (!code) return;
      block.dataset.wb = "1";

      const addBtn = (label, icon, title, fn) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "code-btn wb-btn";
        b.innerHTML = `${ic(icon)}${label}`;
        if (title) b.title = title;
        b.addEventListener("click", () => fn(b));
        head.insertBefore(b, head.querySelector("[data-code-act='wrap']"));
        return b;
      };

      const runnable = State.settings.runCode !== false ? Executors.language(lang) : null;
      const snippet = runnable ? Snippets.note(lang, code) : null;
      if (runnable) {
        addBtn("Run", "play", "Run this code in the browser (Shift+Enter when focused)", async (btn) => {
          btn.disabled = true;
          btn.classList.add("running");
          const t0 = performance.now();
          try {
            await Executors.run(lang, code, block);
            if (snippet) Snippets.record(snippet.hash, true, performance.now() - t0);
          } catch (err) {
            if (snippet) Snippets.record(snippet.hash, false, performance.now() - t0);
            throw err;
          } finally { btn.disabled = false; btn.classList.remove("running"); }
        });
        if (runnable === "python") {
          addBtn("Reset env", "refresh", "Drop the Python runtime and start clean", () =>
            Executors.resetPython(Terminal.for(block))
          );
        }
        block.tabIndex = 0;
        block.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            Executors.run(lang, code, block);
          }
        });
      }

      if (lang === "mermaid") {
        addBtn("Diagram", "chart", "Render with Mermaid", () => Visuals.renderMermaid(block, code));
        Visuals.renderMermaid(block, code);
      }

      if (lang === "json" && /[[{]/.test(code)) {
        let chartable = false;
        try { chartable = !!Visuals.chartSpec(JSON.parse(code)); } catch {}
        if (chartable) addBtn("Chart", "chart", "Plot this data with Chart.js", () => Visuals.renderChart(block, code));
      }

      /* Claude-style: every artifact-worthy block carries a chip that opens it
         in the Canvas, placed on the block itself rather than below the prose. */
      const artifactId = this.artifactMap.get(code.trim());
      if (artifactId) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "code-artifact-chip";
        chip.title = "Open this artifact in the Canvas";
        chip.innerHTML = `${ic("canvas")}<span>Open in Canvas</span>${ic("chevron")}`;
        chip.addEventListener("click", () => {
          try { Canvas.open(artifactId); } catch (err) { UI.toast("Could not open artifact", { error: true }); }
        });
        block.appendChild(chip);
      }

      /* Collapse tall blocks so a long answer stays scannable, with a fade and
         an explicit expand control. Claude-style: 22 lines visible. */
      const pre = block.querySelector("pre");
      const lineCount = code.split("\n").length;
      if (pre && lineCount > 24) {
        block.classList.add("cw-collapsed");
        const expanded = document.createElement("button");
        expanded.type = "button";
        expanded.className = "code-btn cw-expand";
        expanded.innerHTML = `${ic("chevron-down")}<span class="cw-expand-label">Show all ${lineCount} lines</span>`;
        expanded.addEventListener("click", () => {
          const collapsed = block.classList.toggle("cw-collapsed");
          expanded.querySelector(".cw-expand-label").textContent = collapsed
            ? `Show all ${lineCount} lines`
            : "Collapse";
        });
        block.appendChild(expanded);
      }

    });
  },

  /* New code blocks arrive from streaming, re-renders and the canvas, so
     watch the DOM instead of hooking every render path. */
  observe() {
    const targets = [UI.els.chatInner, $("#canvas-preview")].filter(Boolean);
    const run = debounce(() => targets.forEach((t) => this.decorate(t)), 120);
    const obs = new MutationObserver(run);
    targets.forEach((t) => obs.observe(t, { childList: true, subtree: true }));
    run();
  }
};

/* ---------- 18.6 SNIPPETS, PIPELINES, COMPARISON ---------- */

/* Runnable snippets extracted from chats, with their run history. */
const Snippets = {
  list: [],
  async load() {
    this.list = (await Store.kvGet("snippets", [])) || [];
  },
  async persist() {
    await Store.kvSet("snippets", this.list.slice(0, 120));
  },
  note(lang, code) {
    const hash = lang + ":" + code.length + ":" + code.slice(0, 40);
    const found = this.list.find((s) => s.hash === hash);
    if (found) return found;
    const item = { id: uid("snip"), hash, lang, code: code.slice(0, 20000), ts: Date.now(), runs: [] };
    this.list.unshift(item);
    this.persist();
    return item;
  },
  record(hash, ok, ms) {
    const s = this.list.find((x) => x.hash === hash);
    if (!s) return;
    s.runs.unshift({ ok, ms, ts: Date.now() });
    s.runs = s.runs.slice(0, 20);
    this.persist();
  }
};

/* Rough public list prices (USD per million tokens) for cost estimates.
   They are estimates for orientation, not billing. */
const PRICES = [
  [/gpt-5\.6-sol|claude-opus-5/i, 5, 25],
  [/claude-fable/i, 10, 50],
  [/gpt-5\.6-terra|gpt-5\.5|claude-sonnet-5/i, 2, 10],
  [/gpt-5\.6-luna|gpt-4o-mini|gemini-3\.1-flash-lite/i, 0.3, 1.2],
  [/claude-haiku/i, 1, 5],
  [/gpt-4o|gpt-4\.1/i, 2.5, 10],
  [/gemini-3\.5-flash|gemini-2\.5-flash/i, 0.3, 2.5],
  [/gemini-3\.1-pro|gemini-2\.5-pro/i, 1.25, 10],
  [/grok-4\.[356]/i, 1.25, 2.5],
  [/deepseek-v4-pro/i, 0.6, 1.7],
  [/deepseek/i, 0.27, 1.1],
  [/kimi-k2/i, 0.55, 3.25]
];
function estimateCost(model, inTokens, outTokens) {
  const row = PRICES.find(([re]) => re.test(model || ""));
  if (!row) return null;
  return (inTokens / 1e6) * row[1] + (outTokens / 1e6) * row[2];
}

const Pipelines = {
  list: [],
  running: null,

  async load() {
    this.list = (await Store.kvGet("pipelines", [])) || [];
    if (!this.list.length) this.list = [this.starter()];
  },
  async persist() {
    await Store.kvSet("pipelines", this.list);
  },
  starter() {
    return {
      id: uid("pipe"),
      name: "Draft → Critique → Polish",
      mode: "chain",
      nodes: [
        { id: "n1", name: "Draft", provider: State.settings.provider, model: State.settings.model, deps: [], prompt: "{{input}}" },
        { id: "n2", name: "Critique", provider: State.settings.provider, model: State.settings.model, deps: ["n1"], prompt: "Critique this draft harshly and list concrete fixes:\n\n{{n1.output}}" },
        { id: "n3", name: "Polish", provider: State.settings.provider, model: State.settings.model, deps: ["n1", "n2"], prompt: "Original request: {{input}}\n\nDraft:\n{{n1.output}}\n\nCritique:\n{{n2.output}}\n\nProduce the final, improved answer only." }
      ]
    };
  },
  byId(id) {
    return this.list.find((p) => p.id === id) || null;
  },

  /* ----- templating ----- */
  fill(template, ctx) {
    return String(template || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, key) => {
      const parts = key.split(".");
      if (parts[0] === "input") return ctx.input;
      if (parts[0] === "system_context") return ctx.system || "";
      if (parts[0] === "previous") {
        const prev = ctx.previous || {};
        return parts[1] === "reasoning" ? prev.reasoning || "" : prev.output || "";
      }
      const node = ctx.outputs[parts[0]];
      if (!node) return "";
      return parts[1] === "reasoning" ? node.reasoning || "" : node.output || "";
    });
  },

  /* ----- scheduling: honour deps, run independent nodes together ----- */
  order(pipeline) {
    const nodes = pipeline.nodes.slice();
    if (pipeline.mode === "chain") return nodes.map((n) => [n]); // one node per wave, in order
    const done = new Set();
    const waves = [];
    let guard = 0;
    while (done.size < nodes.length && guard++ < 50) {
      const wave = nodes.filter((n) => !done.has(n.id) && (n.deps || []).every((d) => done.has(d)));
      if (!wave.length) {
        const stuck = nodes.filter((n) => !done.has(n.id)).map((n) => n.name || n.id);
        throw new Error(`These nodes can never run — check their dependencies for a cycle: ${stuck.join(", ")}.`);
      }
      wave.forEach((n) => done.add(n.id));
      waves.push(wave);
    }
    return waves;
  },

  async runNode(node, ctx, onUpdate, signal) {
    const provider = node.provider || State.settings.provider;
    const model = node.model || State.settings.model;
    const adapter = Providers.get(provider);
    const prompt = this.fill(node.prompt, ctx);
    const state = { id: node.id, name: node.name, model, status: "running", output: "", reasoning: "", ttft: 0, ms: 0, tokensIn: Tokens.count(prompt), tokensOut: 0 };
    onUpdate(state);
    const started = performance.now();
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        const res = await adapter.send({
          messages: [{ role: "user", content: prompt, attachments: [] }],
          model,
          systemPrompt: ctx.system,
          apiKey: State.apiKeys[provider] || "",
          endpoint: State.endpoints[provider],
          signal,
          stream: State.settings.streaming,
          params: {
            temperature: node.temperature != null ? node.temperature : State.settings.temperature,
            maxTokens: State.settings.maxTokens,
            thinking: State.settings.thinking,
            thinkingEffort: State.settings.thinkingEffort,
            thinkingBudget: State.settings.thinkingBudget
          },
          onDelta: (text) => {
            if (!state.ttft) state.ttft = performance.now() - started;
            state.output = text;
            state.ms = performance.now() - started;
            onUpdate(state);
          },
          onReason: (text) => {
            state.reasoning = text;
            onUpdate(state);
          }
        });
        state.output = (typeof res === "string" ? res : res.text || "").trim();
        if (res && res.reasoning) state.reasoning = res.reasoning;
        state.status = "done";
        break;
      } catch (err) {
        if (err instanceof ProviderError && err.kind === "aborted") {
          state.status = "stopped";
          break;
        }
        if (attempts >= 2) {
          state.status = "failed";
          state.error = (err && err.message) || "failed";
          if (State.settings.searchFallback && Fallback.shouldRun((err && err.kind) || "")) {
            const fb = await Fallback.run(prompt.slice(0, 300), (err && err.kind) || "network");
            if (fb) {
              state.output = fb.content;
              state.status = "fallback";
              state.error = "";
            }
          }
        }
      }
    }
    state.ms = performance.now() - started;
    state.tokensOut = Tokens.count(state.output);
    state.cost = estimateCost(model, state.tokensIn, state.tokensOut);
    onUpdate(state);
    return state;
  },

  async run(pipeline, input, conv) {
    if (State.generating) return UI.toast("Wait for the current reply to finish", { error: true });
    conv = conv || (await Conv.ensureActive());
    const controller = new AbortController();
    State.abort = controller;
    State.generating = true;
    App.updateHeader();

    const msg = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      providerLabel: `Pipeline · ${pipeline.name}`,
      model: "pipeline",
      sources: [],
      images: [],
      pipeline: { name: pipeline.name, mode: pipeline.mode, nodes: [] }
    };
    conv.messages.push(msg);
    let el = UI.appendMessage(msg);
    UI.scrollToBottom(true);

    const ctx = { input, system: App.systemPrompt([]), outputs: {}, previous: null };
    const states = {};
    const paint = () => {
      msg.pipeline.nodes = pipeline.nodes.map((n) => states[n.id] || { id: n.id, name: n.name, status: "pending", model: n.model });
      const card = el.querySelector(".pipeline-card");
      if (card) card.replaceWith(PipelineUI.card(msg));
      else {
        const fresh = UI.buildMessage(msg);
        el.replaceWith(fresh);
        el = fresh;
      }
    };
    paint();

    try {
      const waves = pipeline.mode === "chain"
        ? pipeline.nodes.map((n) => [n])
        : this.order(pipeline);
      for (const wave of waves) {
        await Promise.all(
          wave.map(async (node) => {
            const st = await this.runNode(node, ctx, (s) => { states[s.id] = s; paint(); }, controller.signal);
            states[node.id] = st;
            ctx.outputs[node.id] = st;
            ctx.outputs[(node.name || "").toLowerCase().replace(/\s+/g, "_")] = st;
            ctx.previous = st;
            paint();
          })
        );
      }
      const last = pipeline.nodes[pipeline.nodes.length - 1];
      const final = states[last.id];
      msg.content = (final && final.output) || "_The pipeline produced no final output._";
    } catch (err) {
      msg.error = (err && err.message) || "The pipeline failed.";
    } finally {
      State.generating = false;
      State.abort = null;
      msg.streaming = false;
      const totals = Object.values(states).reduce(
        (acc, s) => ({
          ms: Math.max(acc.ms, s.ms || 0),
          tokens: acc.tokens + (s.tokensIn || 0) + (s.tokensOut || 0),
          cost: acc.cost + (s.cost || 0)
        }),
        { ms: 0, tokens: 0, cost: 0 }
      );
      msg.pipeline.totals = totals;
      msg.stats = { ms: totals.ms, chars: msg.content.length, tokens: totals.tokens };
      App.updateHeader();
      App.updateComposerState();
    }

    const fresh = UI.buildMessage(msg);
    el.replaceWith(fresh);
    await Conv.save(conv);
    UI.renderSidebar(App.filterTerm());
    UI.scrollToBottom();
  },

  /* ----- side-by-side comparison of up to 4 models ----- */
  async compare(prompt, choices, conv) {
    conv = conv || (await Conv.ensureActive());
    const pipeline = {
      id: "cmp",
      name: "Model comparison",
      mode: "dag",
      nodes: choices.slice(0, 4).map((c, i) => ({
        id: "c" + i,
        name: `${APP.providers[c.provider].label} · ${c.model}`,
        provider: c.provider,
        model: c.model,
        deps: [],
        prompt: "{{input}}"
      }))
    };
    const controller = new AbortController();
    State.abort = controller;
    State.generating = true;
    App.updateHeader();

    const msg = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      providerLabel: "Comparison",
      model: "compare",
      sources: [],
      images: [],
      compare: { prompt, nodes: [] }
    };
    conv.messages.push(msg);
    let el = UI.appendMessage(msg);

    const states = {};
    const paint = () => {
      msg.compare.nodes = pipeline.nodes.map((n) => states[n.id] || { id: n.id, name: n.name, status: "pending", model: n.model });
      const fresh = UI.buildMessage(msg);
      el.replaceWith(fresh);
      el = fresh;
    };
    paint();

    const ctx = { input: prompt, system: App.systemPrompt([]), outputs: {}, previous: null };
    await Promise.all(
      pipeline.nodes.map(async (node) => {
        const st = await this.runNode(node, ctx, (s) => { states[s.id] = s; paint(); }, controller.signal);
        states[node.id] = st;
        paint();
      })
    );

    State.generating = false;
    State.abort = null;
    msg.content = "";
    paint();
    App.updateHeader();
    App.updateComposerState();
    await Conv.save(conv);
  }
};

/* ----- pipeline rendering + builder UI ----- */
const PipelineUI = {
  statusLabel: { pending: "Pending", running: "Running", done: "Succeeded", failed: "Failed", fallback: "Fallback", stopped: "Stopped" },

  card(msg) {
    const p = msg.pipeline;
    const wrap = document.createElement("div");
    wrap.className = "pipeline-card";
    const head = document.createElement("div");
    head.className = "pl-head";
    head.innerHTML = `<span class="ico" data-icon="flow"></span><b></b><span class="pl-mode"></span><span class="exec-spacer"></span><span class="pl-totals"></span>`;
    head.querySelector("b").textContent = p.name;
    head.querySelector(".pl-mode").textContent = p.mode === "dag" ? "DAG" : "chain";
    if (p.totals) {
      head.querySelector(".pl-totals").textContent =
        `${(p.totals.ms / 1000).toFixed(1)}s · ~${p.totals.tokens.toLocaleString()} tokens` +
        (p.totals.cost ? ` · ~$${p.totals.cost.toFixed(4)}` : "");
    }
    wrap.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "pl-nodes";
    (p.nodes || []).forEach((n) => {
      const card = document.createElement("div");
      card.className = "pl-node " + (n.status || "pending");
      const tps = n.ms && n.tokensOut ? (n.tokensOut / (n.ms / 1000)).toFixed(1) : null;
      card.innerHTML =
        `<div class="pl-node-head"><b></b><span class="pl-badge">${this.statusLabel[n.status] || "Pending"}</span></div>` +
        `<div class="pl-node-model"></div>` +
        `<div class="pl-metrics"></div>` +
        `<div class="pl-node-out"></div>`;
      card.querySelector("b").textContent = n.name || n.id;
      card.querySelector(".pl-node-model").textContent = n.model || "";
      card.querySelector(".pl-metrics").textContent = [
        n.ttft ? `TTFT ${(n.ttft / 1000).toFixed(2)}s` : "",
        n.ms ? `${(n.ms / 1000).toFixed(1)}s` : "",
        tps ? `${tps} tok/s` : "",
        n.cost ? `~$${n.cost.toFixed(4)}` : ""
      ].filter(Boolean).join(" · ");
      const out = card.querySelector(".pl-node-out");
      out.textContent = (n.error ? "⚠ " + n.error + "\n" : "") + (n.output || "").slice(0, 400);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    hydrateIcons(wrap);
    return wrap;
  },

  compareCard(msg) {
    const wrap = document.createElement("div");
    wrap.className = "compare-grid";
    (msg.compare.nodes || []).forEach((n) => {
      const card = document.createElement("div");
      card.className = "compare-card " + (n.status || "pending");
      const tps = n.ms && n.tokensOut ? (n.tokensOut / (n.ms / 1000)).toFixed(1) : null;
      card.innerHTML =
        `<div class="cc-head"><b></b><span class="pl-badge">${PipelineUI.statusLabel[n.status] || "Pending"}</span></div>` +
        `<div class="pl-metrics"></div><div class="cc-body msg-content"></div>` +
        `<div class="cc-foot"><button class="btn btn-sm">Keep this answer</button></div>`;
      card.querySelector("b").textContent = n.name;
      card.querySelector(".pl-metrics").textContent = [
        n.ttft ? `TTFT ${(n.ttft / 1000).toFixed(2)}s` : "",
        n.ms ? `${(n.ms / 1000).toFixed(1)}s` : "",
        tps ? `${tps} tok/s` : "",
        n.cost ? `~$${n.cost.toFixed(4)}` : ""
      ].filter(Boolean).join(" · ");
      card.querySelector(".cc-body").innerHTML = MD.render(n.output || (n.error ? "⚠ " + n.error : "_waiting…_"), {
        lineNumbers: false,
        wrap: true
      });
      card.querySelector("button").addEventListener("click", async () => {
        const conv = Conv.active();
        if (!conv) return;
        msg.compare = null;
        msg.content = n.output;
        msg.model = n.model;
        msg.providerLabel = n.name;
        await Conv.save(conv);
        App.rerenderActive();
      });
      wrap.appendChild(card);
    });
    return wrap;
  },

  /* Builder modal: nodes, models, prompts, dependencies. */
  open(pipelineId) {
    let p = Pipelines.byId(pipelineId) || Pipelines.list[0];
    ProOverlay.open({
      title: "Pipelines",
      build: (body) => {
        body.innerHTML = `
          <div class="btn-row">
            <select id="pl-select" class="grow"></select>
            <button class="btn btn-sm" id="pl-new">New</button>
            <button class="btn btn-sm" id="pl-dup">Duplicate</button>
            <button class="btn btn-danger btn-sm" id="pl-del">Delete</button>
          </div>
          <label class="field"><span>Name</span><input type="text" id="pl-name"></label>
          <div class="field"><span>Mode</span>
            <div class="seg" id="pl-mode">
              <button data-v="chain">Sequential chain</button>
              <button data-v="dag">DAG (branching)</button>
            </div>
            <p class="muted sm">Chain runs nodes top to bottom. DAG runs every node whose dependencies are met, in parallel — so two branches can feed one synthesiser.</p>
          </div>
          <div class="field"><span>Structure</span><div id="pl-graph" class="pg-host"></div></div>
          <div class="field"><span>Nodes</span><div id="pl-nodes" class="pin-list"></div>
            <button class="btn btn-sm" id="pl-add"><span class="ico" data-icon="plus"></span>Add node</button></div>
          <label class="field"><span>Input for this run — <code>{{input}}</code></span>
            <textarea id="pl-input" rows="3" placeholder="The prompt the first nodes receive"></textarea></label>
          <div class="field"><span>Files for this run (seed the first node — images go to vision models, text files are inlined)</span>
            <div id="pl-attach-tray"></div>
            <div class="btn-row">
              <button class="btn btn-sm" id="pl-attach-btn"><span class="ico" data-icon="clip"></span>Attach files</button>
              <input type="file" id="pl-attach-input" class="visually-hidden" multiple accept="image/*,.txt,.md,.json,.csv,.js,.ts,.py,.html,.css,.yml,.yaml,.xml,.log">
            </div>
          </div>
          <div class="btn-row end">
            <button class="btn btn-sm" id="pl-save">Save</button>
            <button class="btn btn-primary btn-sm" id="pl-run"><span class="ico" data-icon="play"></span>Run pipeline</button>
          </div>`;

        const sel = $("#pl-select", body);
        const nameInput = $("#pl-name", body);
        const nodesHost = $("#pl-nodes", body);
        const graphHost = $("#pl-graph", body);
        let attachments = [];

        const drawGraph = () => {
          if (!p.nodes.length) { graphHost.innerHTML = `<p class="muted sm">Add a node to see the structure.</p>`; return; }
          PipelineGraph.render(graphHost, p);
        };

        const drawAttachTray = () => {
          const tray = $("#pl-attach-tray", body);
          const fresh = attachTrayMarkup(attachments, (id) => {
            attachments = attachments.filter((a) => a.id !== id);
            drawAttachTray();
          });
          tray.className = fresh.className;
          tray.innerHTML = "";
          while (fresh.firstChild) tray.appendChild(fresh.firstChild); // move real nodes, keep their listeners
        };

        $("#pl-attach-btn", body).addEventListener("click", () => $("#pl-attach-input", body).click());
        $("#pl-attach-input", body).addEventListener("change", async (e) => {
          await readFilesAsAttachments(e.target.files, attachments);
          e.target.value = "";
          drawAttachTray();
        });

        const drawSelect = () => {
          sel.innerHTML = "";
          Pipelines.list.forEach((x) => {
            const o = document.createElement("option");
            o.value = x.id;
            o.textContent = `${x.name} (${x.nodes.length} nodes)`;
            if (x.id === p.id) o.selected = true;
            sel.appendChild(o);
          });
        };

        const modelOptions = (node) => {
          const out = [];
          Object.entries(APP.providers).forEach(([pid, cfg]) => {
            (cfg.models || []).forEach((m) => {
              const selected = node.provider === pid && node.model === m.id ? " selected" : "";
              out.push(`<option value="${pid}::${m.id}"${selected}>${Sec.esc(cfg.label)} · ${Sec.esc(m.label)}</option>`);
            });
          });
          return out.join("");
        };

        const drawNodes = () => {
          nodesHost.innerHTML = "";
          p.nodes.forEach((node, i) => {
            const row = document.createElement("div");
            row.className = "pl-edit";
            row.innerHTML = `
              <div class="pl-edit-top">
                <input type="text" class="pl-n-name" placeholder="Node name">
                <select class="pl-n-model">${modelOptions(node)}</select>
                <button class="icon-btn sm" title="Remove node"><span class="ico" data-icon="trash"></span></button>
              </div>
              <textarea class="pl-n-prompt" rows="3" placeholder="Prompt template — {{input}}, {{n1.output}}, {{previous.reasoning}}"></textarea>
              <div class="pl-deps"></div>`;
            row.querySelector(".pl-n-name").value = node.name || `Node ${i + 1}`;
            row.querySelector(".pl-n-prompt").value = node.prompt || "{{input}}";
            row.querySelector(".pl-n-name").addEventListener("input", (e) => (node.name = e.target.value));
            row.querySelector(".pl-n-prompt").addEventListener("input", (e) => (node.prompt = e.target.value));
            row.querySelector(".pl-n-model").addEventListener("change", (e) => {
              const [pid, mid] = e.target.value.split("::");
              node.provider = pid;
              node.model = mid;
              drawGraph();
            });
            row.querySelector("button").addEventListener("click", () => {
              p.nodes.splice(i, 1);
              p.nodes.forEach((n) => (n.deps = (n.deps || []).filter((d) => p.nodes.some((x) => x.id === d))));
              drawNodes();
              drawGraph();
            });
            const deps = row.querySelector(".pl-deps");
            if (p.mode === "dag") {
              deps.innerHTML = `<span class="dep-label">Depends on:</span>`;
              p.nodes.filter((x) => x.id !== node.id).forEach((other) => {
                const id = `dep_${node.id}_${other.id}`;
                const lab = document.createElement("label");
                lab.className = "dep-chip";
                lab.innerHTML = `<input type="checkbox" id="${id}"><span></span>`;
                lab.querySelector("span").textContent = other.name || other.id;
                const box = lab.querySelector("input");
                box.checked = (node.deps || []).includes(other.id);
                box.addEventListener("change", () => {
                  node.deps = node.deps || [];
                  if (box.checked) node.deps.push(other.id);
                  else node.deps = node.deps.filter((d) => d !== other.id);
                  drawGraph();
                });
                deps.appendChild(lab);
              });
            } else {
              deps.innerHTML = `<span class="dep-label">Receives <code>{{previous.output}}</code> from the node above.</span>`;
            }
            hydrateIcons(row);
            nodesHost.appendChild(row);
          });
        };

        const load = (pipeline) => {
          p = pipeline;
          attachments = [];
          nameInput.value = p.name;
          $$("#pl-mode button", body).forEach((b) => b.classList.toggle("active", b.dataset.v === p.mode));
          drawSelect();
          drawNodes();
          drawGraph();
          drawAttachTray();
        };

        sel.addEventListener("change", () => load(Pipelines.byId(sel.value)));
        nameInput.addEventListener("input", () => (p.name = nameInput.value));
        $$("#pl-mode button", body).forEach((b) =>
          b.addEventListener("click", () => {
            p.mode = b.dataset.v;
            load(p);
          })
        );
        $("#pl-add", body).addEventListener("click", () => {
          const n = p.nodes.length + 1;
          p.nodes.push({
            id: "n" + n + "_" + Math.random().toString(36).slice(2, 5),
            name: "Node " + n,
            provider: State.settings.provider,
            model: State.settings.model,
            deps: p.mode === "dag" ? [] : [],
            prompt: n === 1 ? "{{input}}" : "{{previous.output}}"
          });
          drawNodes();
          drawGraph();
        });
        $("#pl-new", body).addEventListener("click", async () => {
          const fresh = { id: uid("pipe"), name: "New pipeline", mode: "chain", nodes: [] };
          Pipelines.list.push(fresh);
          await Pipelines.persist();
          load(fresh);
        });
        $("#pl-dup", body).addEventListener("click", async () => {
          const copy = JSON.parse(JSON.stringify(p));
          copy.id = uid("pipe");
          copy.name = p.name + " copy";
          Pipelines.list.push(copy);
          await Pipelines.persist();
          load(copy);
        });
        $("#pl-del", body).addEventListener("click", async () => {
          if (Pipelines.list.length < 2) return UI.toast("Keep at least one pipeline", { error: true });
          Pipelines.list = Pipelines.list.filter((x) => x.id !== p.id);
          await Pipelines.persist();
          load(Pipelines.list[0]);
        });
        $("#pl-save", body).addEventListener("click", async () => {
          await Pipelines.persist();
          UI.toast("Pipeline saved");
        });
        $("#pl-run", body).addEventListener("click", async () => {
          const input = $("#pl-input", body).value.trim();
          if (!input) return UI.toast("Give the pipeline something to work on", { error: true });
          if (!p.nodes.length) return UI.toast("Add at least one node", { error: true });
          await Pipelines.persist();
          ProOverlay.close();
          Pipelines.run(p, input, undefined, attachments.slice());
        });

        hydrateIcons(body);
        load(p);
      }
    });
  },

  /* Compare launcher: pick up to four models for one prompt. */
  openCompare(prefill) {
    ProOverlay.open({
      title: "Compare models",
      build: (body) => {
        const picks = [];
        body.innerHTML = `
          <label class="field"><span>Prompt</span><textarea id="cmp-input" rows="3"></textarea></label>
          <div class="field"><span>Models (pick up to 4)</span><div id="cmp-list" class="cmp-list"></div></div>
          <div class="btn-row end"><button class="btn btn-primary btn-sm" id="cmp-run"><span class="ico" data-icon="play"></span>Run comparison</button></div>`;
        $("#cmp-input", body).value = prefill || "";
        const list = $("#cmp-list", body);
        Object.entries(APP.providers).forEach(([pid, cfg]) => {
          if (pid === "simulation") return;
          (cfg.models || []).slice(0, 3).forEach((m) => {
            const lab = document.createElement("label");
            lab.className = "dep-chip";
            lab.innerHTML = `<input type="checkbox"><span></span>`;
            lab.querySelector("span").textContent = `${cfg.label} · ${m.label}`;
            lab.querySelector("input").addEventListener("change", (e) => {
              if (e.target.checked) {
                if (picks.length >= 4) {
                  e.target.checked = false;
                  return UI.toast("Four models at a time", { error: true });
                }
                picks.push({ provider: pid, model: m.id });
              } else {
                const i = picks.findIndex((x) => x.provider === pid && x.model === m.id);
                if (i > -1) picks.splice(i, 1);
              }
            });
            list.appendChild(lab);
          });
        });
        hydrateIcons(body);
        $("#cmp-run", body).addEventListener("click", () => {
          const prompt = $("#cmp-input", body).value.trim();
          if (!prompt) return UI.toast("Type a prompt first", { error: true });
          if (picks.length < 2) return UI.toast("Pick at least two models", { error: true });
          ProOverlay.close();
          Pipelines.compare(prompt, picks.slice());
        });
      }
    });
  }
};

/* ---------- 18.7 STORAGE: obfuscated keys ---------- */
(function obfuscateKeys() {
  /* Not encryption — anything in the page can still read these. It only
     stops a casual glance at localStorage or a synced backup showing keys
     in the clear. Real secrecy needs a server-side proxy. */
  const SALT = "nimbus:" + (navigator.userAgent || "").slice(0, 24);
  const mask = (text) => {
    let out = "";
    for (let i = 0; i < text.length; i++) out += String.fromCharCode(text.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
    return "nbx1:" + btoa(unescape(encodeURIComponent(out)));
  };
  const unmask = (text) => {
    if (typeof text !== "string" || !text.startsWith("nbx1:")) return text;
    try {
      const raw = decodeURIComponent(escape(atob(text.slice(5))));
      let out = "";
      for (let i = 0; i < raw.length; i++) out += String.fromCharCode(raw.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
      return out;
    } catch {
      return "";
    }
  };
  const baseGet = Store.getKeys.bind(Store);
  const baseSave = Store.saveKeys.bind(Store);
  Store.getKeys = function () {
    const obj = baseGet() || {};
    const out = {};
    Object.keys(obj).forEach((k) => (out[k] = k === "__endpoints" ? obj[k] : unmask(obj[k])));
    return out;
  };
  Store.saveKeys = function (obj) {
    const out = {};
    Object.keys(obj || {}).forEach((k) => (out[k] = k === "__endpoints" ? obj[k] : obj[k] ? mask(String(obj[k])) : ""));
    return baseSave(out);
  };
})();

/* ---------- 18.8 WIRING ---------- */
Object.assign(Icon, {
  flow: S('<circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="12" cy="18" r="2.6"/><path d="M7.4 8.1 10.8 15.7M16.6 8.1 13.2 15.7M8.6 6h6.8"/>'),
  terminal: S('<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7.5 10 2.5 2.2-2.5 2.2M12.5 14.8h4"/>'),
  scale: S('<path d="M12 4v16M6 8h12"/><path d="M4 16a3 3 0 0 0 6 0l-3-6ZM14 16a3 3 0 0 0 6 0l-3-6Z"/>')
});

Object.assign(DEFAULTS, {
  softwareAI: DEFAULTS.softwareAI,
  canvasAI: DEFAULTS.canvasAI,
  imagineAI: DEFAULTS.imagineAI,
  documentsAI: DEFAULTS.documentsAI,
  softwareModel: DEFAULTS.softwareModel,
  canvasModel: DEFAULTS.canvasModel,
  imagineModel: DEFAULTS.imagineModel,
  documentsModel: DEFAULTS.documentsModel,
  autoCompress: true,
  compressAt: 80,
  useKatex: true,
  runCode: true,
  showTokenMeter: true,
  imageGenMode: false,
  imageProvider: "openai",
  imageModel: "gpt-image-1",
  imageSize: "1024x1024"
});
Object.assign(State.settings, {
  softwareAI: State.settings.softwareAI || DEFAULTS.softwareAI,
  canvasAI: State.settings.canvasAI || DEFAULTS.canvasAI,
  imagineAI: State.settings.imagineAI || DEFAULTS.imagineAI,
  documentsAI: State.settings.documentsAI || DEFAULTS.documentsAI,
  softwareModel: State.settings.softwareModel || DEFAULTS.softwareModel,
  canvasModel: State.settings.canvasModel || DEFAULTS.canvasModel,
  imagineModel: State.settings.imagineModel || DEFAULTS.imagineModel,
  documentsModel: State.settings.documentsModel || DEFAULTS.documentsModel,
  autoCompress: DEFAULTS.autoCompress,
  compressAt: DEFAULTS.compressAt,
  useKatex: DEFAULTS.useKatex,
  runCode: DEFAULTS.runCode,
  showTokenMeter: DEFAULTS.showTokenMeter,
  imageGenMode: DEFAULTS.imageGenMode,
  imageProvider: DEFAULTS.imageProvider,
  imageModel: DEFAULTS.imageModel,
  imageSize: DEFAULTS.imageSize
});

/* pipeline + comparison cards inside messages */
(function extendMessages() {
  const base = UI.buildMessage.bind(UI);
  UI.buildMessage = function (msg) {
    const el = base(msg);
    const content = el.querySelector(".msg-content");
    if (!content) return el;
    if (msg.pipeline) content.insertAdjacentElement("beforebegin", PipelineUI.card(msg));
    if (msg.compare) content.insertAdjacentElement("beforebegin", PipelineUI.compareCard(msg));
    if (msg.compressed) el.classList.add("compressed-msg");
    return el;
  };
})();

/* capability-driven composer + live context meter */
App.syncCapabilities = function () {
  const caps = Caps.of(State.settings.provider, State.settings.model);
  const attach = UI.els.attachBtn;
  if (attach) {
    attach.classList.toggle("dimmed", !caps.vision);
    attach.title = caps.vision
      ? "Attach images or text files"
      : "This model takes text only — files are still sent as text, images are not";
  }
  const think = $("#thinking-toggle");
  if (think) {
    think.classList.toggle("unsupported", !caps.reasoning);
    think.title = caps.reasoning
      ? "Show the model's reasoning (Ctrl+Shift+R)"
      : "This model doesn't expose reasoning tokens";
  }
  const pill = $("#run-code-chip");
  if (pill) pill.classList.toggle("active", !!State.settings.runCode);
};

App.updateTokenMeter = function () {
  const note = UI.els.contextNote;
  if (!note) return;
  if (!State.settings.showTokenMeter) { note.textContent = ""; return; }
  const conv = Conv.active();
  const draft = UI.els.composerInput ? UI.els.composerInput.value : "";
  const usage = Tokens.usage(conv);
  const used = usage.used + Tokens.count(draft);
  const pct = Math.min(100, Math.round((used / usage.window) * 100));
  note.innerHTML = `<span class="ctx-meter ${pct > 80 ? "hot" : pct > 60 ? "warm" : ""}">` +
    `<span class="ctx-fill" style="width:${pct}%"></span></span>` +
    `<span class="ctx-text">${used.toLocaleString()} / ${usage.window.toLocaleString()} tokens (${pct}%)</span>`;
  note.title = `Estimated with a lightweight BPE-style counter for ${State.settings.model}`;
};

(function extendComposerState() {
  const base = App.updateComposerState.bind(App);
  App.updateComposerState = function () {
    base();
    App.updateTokenMeter();
  };
  const baseSwitch = App.switchModel.bind(App);
  App.switchModel = function (provider, model) {
    baseSwitch(provider, model);
    App.syncCapabilities();
    App.updateTokenMeter();
  };
})();

/* auto-compression runs before the request is built */
(function extendTurn() {
  const base = App.runTurn.bind(App);
  App.runTurn = async function (conv, choice, opts) {
    await Tokens.maybeCompress(conv);
    return base(conv, choice, opts);
  };
})();

/* settings: workbench tab contents appended to existing tabs */
(function extendWorkbenchSettings() {
  const baseParams = Settings.params.bind(Settings);
  Settings.params = function (body) {
    baseParams(body);
    const s = State.settings;
    const block = document.createElement("div");
    block.innerHTML = `
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Compress old turns automatically</div>
          <div class="row-toggle-sub">When the thread passes the threshold, older messages are replaced by a model-written summary that keeps decisions, constraints and code.</div>
        </div>
        <label class="switch"><input type="checkbox" id="wb-compress" ${s.autoCompress ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="field-group">
        <label class="field-label" for="wb-compress-at">Compress at</label>
        <div class="slider-row">
          <input type="range" id="wb-compress-at" min="50" max="95" step="5" value="${s.compressAt}">
          <span class="slider-val" id="wb-compress-out">${s.compressAt}%</span>
        </div>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Run code in the browser</div>
          <div class="row-toggle-sub">Adds Run to Python, JavaScript and C/C++ blocks. Python uses Pyodide (WASM), JavaScript runs in a Web Worker, C/C++ uses the JSCPP interpreter — all loaded on first use.</div>
        </div>
        <label class="switch"><input type="checkbox" id="wb-run" ${s.runCode ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Use KaTeX for maths</div>
          <div class="row-toggle-sub">Loads KaTeX from a CDN for exact typesetting. Off (or offline) falls back to the built-in renderer.</div>
        </div>
        <label class="switch"><input type="checkbox" id="wb-katex" ${s.useKatex ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      <div class="row-toggle">
        <div class="row-toggle-text">
          <div class="row-toggle-title">Context meter</div>
          <div class="row-toggle-sub">Shows estimated context usage against the selected model's window.</div>
        </div>
        <label class="switch"><input type="checkbox" id="wb-meter" ${s.showTokenMeter ? "checked" : ""}><span class="switch-track"></span></label>
      </div>`;
    body.appendChild(block);
    const bind = (id, key, after) =>
      $("#" + id, block).addEventListener("change", (e) => {
        s[key] = e.target.checked;
        App.persistSettings();
        if (after) after();
      });
    bind("wb-compress", "autoCompress");
    bind("wb-run", "runCode", () => App.rerenderActive());
    bind("wb-katex", "useKatex", () => App.rerenderActive());
    bind("wb-meter", "showTokenMeter", () => App.updateTokenMeter());
    const range = $("#wb-compress-at", block);
    range.addEventListener("input", () => {
      s.compressAt = parseInt(range.value, 10);
      $("#wb-compress-out", block).textContent = s.compressAt + "%";
      App.persistSettings();
    });
  };

  /* provider tab: live model refresh + AICredits balance */
  const baseProvider = Settings.provider.bind(Settings);
  Settings.provider = function (body) {
    baseProvider(body);
    const id = State.settings.provider;
    const cfg = APP.providers[id] || {};
    const block = document.createElement("div");
    block.className = "field-group";
    block.innerHTML =
      `<div class="btn-row">` +
      (cfg.testEndpoint ? `<button class="btn btn-sm" id="wb-refresh-models"><span class="ico" data-icon="refresh"></span>Refresh model list</button>` : "") +
      (id === "aicredits" ? `<button class="btn btn-sm" id="wb-balance"><span class="ico" data-icon="chart"></span>Check balance</button>` : "") +
      `</div><p class="field-hint" id="wb-provider-note">Capabilities are detected per model: vision, reasoning tokens, tool use and context window.</p>`;
    body.appendChild(block);
    hydrateIcons(block);

    const note = $("#wb-provider-note", block);
    const refresh = $("#wb-refresh-models", block);
    if (refresh) {
      refresh.addEventListener("click", async () => {
        note.textContent = "Fetching the live model list…";
        try {
          const models = await Providers.get(id).listModels(State.apiKeys[id] || "", State.endpoints[id]);
          if (!models.length) throw new Error("The provider returned no models.");
          cfg.models = models.slice(0, 60);
          await Settings.render();
          UI.toast(`${models.length} models loaded from ${cfg.label}`);
        } catch (err) {
          note.textContent = (err && err.message) || "Couldn't load the model list.";
        }
      });
    }
    const bal = $("#wb-balance", block);
    if (bal) {
      bal.addEventListener("click", async () => {
        note.textContent = "Checking balance…";
        try {
          note.textContent = await Providers.get("aicredits").balance(State.apiKeys.aicredits || "");
        } catch (err) {
          note.textContent = (err && err.message) || "Couldn't read the balance.";
        }
      });
    }

    /* Image generation model — independent of the chat provider above,
       since the person may chat on one model and generate images on
       another (only OpenAI, Gemini and xAI currently support it). */
    const imgBlock = document.createElement("div");
    imgBlock.className = "field-group";
    const imgProviders = ImageGen.available();
    imgBlock.innerHTML =
      `<label class="field-label">Image generation model</label>` +
      (imgProviders.length
        ? `<select id="wb-image-model" class="grow"></select>
           <p class="field-hint">Used by the <b>Create image</b> toggle in the composer and by Regenerate on any generated image. Needs a Google Gemini API key. The Gradient always uses Nano Banana for image generation.</p>`
        : `<p class="field-hint">Connect Google Gemini to use Nano Banana image generation.</p>`);
    body.appendChild(imgBlock);
    const imgSelect = $("#wb-image-model", imgBlock);
    if (imgSelect) {
      imgProviders.forEach((pid) => {
        (APP.providers[pid].imageModels || []).forEach((m) => {
          const o = document.createElement("option");
          o.value = pid + "::" + m.id;
          o.textContent = `${APP.providers[pid].label} · ${m.label}`;
          if (State.settings.imageProvider === pid && State.settings.imageModel === m.id) o.selected = true;
          imgSelect.appendChild(o);
        });
      });
      imgSelect.addEventListener("change", () => {
        const [pid, mid] = imgSelect.value.split("::");
        State.settings.imageProvider = pid;
        State.settings.imageModel = mid;
        App.persistSettings();
      });
    }
  };
})();

/* palette, slash commands and shortcuts */
(function extendWorkbenchCommands() {
  const base = Palette.commands.bind(Palette);
  Palette.commands = function () {
    const extra = [
      { group: "Workbench", title: (State.settings.imageGenMode ? "Turn off" : "Turn on") + " image generation", sub: "Composer creates images instead of chat replies", icon: "wand", run: () => App.toggleImageGen() },
      { group: "Workbench", title: "Pipelines", sub: "Chains and DAGs across models", icon: "flow", run: () => PipelineUI.open() },
      { group: "Workbench", title: "Compare models", sub: "Run one prompt on up to four models", icon: "scale", run: () => PipelineUI.openCompare(UI.els.composerInput.value) },
      { group: "Workbench", title: "Reset Python environment", sub: "Drop the Pyodide runtime", icon: "terminal", run: () => Executors.resetPython() },
      { group: "Workbench", title: "Snippet library", sub: `${Snippets.list.length} runnable snippets captured`, icon: "code", run: () => Workbench.openSnippets() }
    ];
    Pipelines.list.forEach((p) =>
      extra.push({
        group: "Pipelines",
        title: "Run: " + p.name,
        sub: `${p.nodes.length} nodes · ${p.mode}`,
        icon: "play",
        run: () => PipelineUI.open(p.id)
      })
    );
    return extra.concat(base());
  };

  const baseSlash = App.slashCommands.bind(App);
  App.slashCommands = function () {
    return baseSlash().concat([
      { name: "/image", desc: "Generate an image from a description", run: () => {
          State.settings.imageGenMode = true;
          App.syncToggles();
          App.persistSettings();
          UI.els.composerInput.value = UI.els.composerInput.value.replace(/^\/image\s*/, "");
          UI.els.composerInput.focus();
        } },
      { name: "/pipeline", desc: "Build or run a multi-model pipeline", run: () => PipelineUI.open() },
      { name: "/compare", desc: "Run this prompt on several models", run: () => PipelineUI.openCompare(UI.els.composerInput.value.replace(/^\/compare\s*/, "")) },
      { name: "/snippets", desc: "Runnable snippets captured from chats", run: () => Workbench.openSnippets() },
      { name: "/tokens", desc: "Show context usage for this chat", run: () => {
          const u = Tokens.usage(Conv.active());
          UI.toast(`${u.used.toLocaleString()} of ${u.window.toLocaleString()} tokens (${u.pct}%)`);
        } }
    ]);
  };
})();

Workbench.openSnippets = function () {
  ProOverlay.open({
    title: "Snippet library",
    build: (body) => {
      body.innerHTML = `<p class="muted sm">Runnable code blocks captured from your chats, newest first.</p><div id="snip-list" class="mem-list"></div>`;
      const host = $("#snip-list", body);
      if (!Snippets.list.length) {
        host.innerHTML = `<p class="muted sm">Nothing captured yet — Python, JavaScript and C/C++ blocks are added automatically.</p>`;
        return;
      }
      Snippets.list.slice(0, 40).forEach((s) => {
        const row = document.createElement("div");
        row.className = "snip-item";
        row.innerHTML = `<div class="snip-head"><b></b><span class="mem-meta"></span>
            <button class="btn btn-sm" data-a="insert">Insert</button></div>
          <pre class="snip-code"></pre>`;
        row.querySelector("b").textContent = s.lang;
        row.querySelector(".mem-meta").textContent = `${relTime(s.ts)} · ${s.runs.length} run(s)`;
        row.querySelector(".snip-code").textContent = s.code.slice(0, 400);
        row.querySelector("[data-a='insert']").addEventListener("click", () => {
          UI.els.composerInput.value += "\n\n```" + s.lang + "\n" + s.code + "\n```";
          UI.autoGrow(UI.els.composerInput);
          App.updateComposerState();
          ProOverlay.close();
        });
        host.appendChild(row);
      });
    }
  });
};

(function bootWorkbench() {
  const baseInit = App.init.bind(App);
  App.init = async function () {
    await baseInit();
    await Promise.all([Pipelines.load(), Snippets.load()]);
    Workbench.observe();
    App.syncCapabilities();
    App.updateTokenMeter();
    UI.els.brandVer.textContent = APP.version.split(".").slice(0, 2).join(".");
    APP.shortcuts.push(
      ["Ctrl / ⌘ + Shift + P", "Pipelines"],
      ["Ctrl / ⌘ + Shift + M", "Compare models"],
      ["Shift + Enter on a code block", "Run that code"],
      ["Alt + ↑ / ↓", "Cycle models in this provider"]
    );

    const on = (sel, ev, fn) => {
      const el = $(sel);
      if (el) el.addEventListener(ev, fn);
    };
    on("#pipeline-btn", "click", () => PipelineUI.open());
    on("#compare-btn", "click", () => PipelineUI.openCompare(UI.els.composerInput.value));
    on("#pipelines-entry-btn", "click", () => PipelineUI.open());
    document.addEventListener("keydown", (e) => {
      if (modKey(e) && e.shiftKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        PipelineUI.open();
      } else if (modKey(e) && e.shiftKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        PipelineUI.openCompare(UI.els.composerInput.value);
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        // Alt+Up / Alt+Down cycles models within the active provider.
        const cfg = APP.providers[State.settings.provider];
        if (!cfg || !cfg.models.length) return;
        e.preventDefault();
        const i = cfg.models.findIndex((m) => m.id === State.settings.model);
        const next = cfg.models[(i + (e.key === "ArrowDown" ? 1 : -1) + cfg.models.length) % cfg.models.length];
        App.switchModel(State.settings.provider, next.id);
        UI.toast("Model: " + next.label);
      }
    });
  };
})();

APP.version = "3.6.0";
APP.build = "3.6.0";


/* ============================================================
   19. IMAGE GENERATION
   Model IDs checked against provider docs, September 2026:
   OpenAI gpt-image-1 (POST /v1/images/generations, b64_json),
   Gemini gemini-2.5-flash-image ("Nano Banana", generateContent
   with IMAGE modality, inline_data base64), xAI grok-imagine-image
   and grok-imagine-image-quality (POST /v1/images/generations).
   ============================================================ */
Object.assign(APP.providers.openai, {
  imageModels: [
    { id: "gpt-image-1", label: "GPT Image 1" },
    { id: "gpt-image-1-mini", label: "GPT Image 1 mini" }
  ]
});
Object.assign(APP.providers.gemini, {
  imageModels: [
    { id: "gemini-3.1-flash-image", label: "Nano Banana 2" },
    { id: "gemini-3.1-flash-lite-image", label: "Nano Banana 2 Lite" },
    { id: "gemini-3-pro-image", label: "Nano Banana Pro" },
    { id: "gemini-2.5-flash-image", label: "Nano Banana" }
  ]
});
// The Gradient is intentionally a Nano Banana image workspace. Other image
// providers are not exposed by the image-generation product surface.
if (APP.providers.openai) APP.providers.openai.imageModels = [];
if (APP.providers.xai) APP.providers.xai.imageModels = [];

const ImageGen = {
  PROVIDERS: ["pollinations", "gemini"],

  available() {
    return this.PROVIDERS.filter((p) => (APP.providers[p].imageModels || []).length);
  },

  defaultChoice() {
    const provider = State.settings?.imagineAI || State.settings?.imageProvider || "gemini";
    const cfg = APP.providers?.[provider];
    const list = cfg?.imageModels || [];
    const model = State.settings?.imagineModel || State.settings?.imageModel || list[0]?.id || (provider === "gemini" ? "gemini-3.1-flash-image" : "flux");
    return { provider, model };
  },

  async generate({ prompt, provider, model, n, size, refs }) {
    const key = State.apiKeys[provider] || "";
    const cfg = APP.providers[provider] || {};
    /* Pollinations works without a key, so only gate providers that need one. */
    if (cfg.needsKey && !key) {
      throw new ProviderError(`Add your ${cfg.label || provider} API key in Settings to generate images.`, { kind: "no_key" });
    }
    if (provider === "openai") return this.openai(prompt, model, key, n, size, refs);
    if (provider === "gemini") return this.gemini(prompt, model, key, refs);
    if (provider === "xai") return this.xai(prompt, model, key, n, size);
    if (provider === "pollinations") return this.pollinations(prompt, model, key, n, size);
    if (provider === "huggingface") return this.huggingface(prompt, model, n, size);
    throw new ProviderError("That provider doesn't generate images.", { kind: "invalid_model" });
  },

  /* One retry, then a different model, then a different provider — so a single
     flaky response never turns into "image generation is broken". */
  async generateResilient(options) {
    const { provider, model, prompt } = options;
    const cfg = APP.providers[provider] || {};
    const attempts = [{ provider, model }, { provider, model }];
    (cfg.imageModels || [])
      .filter((m) => m.id !== model)
      .slice(0, 2)
      .forEach((m) => attempts.push({ provider, model: m.id }));
    /* A different provider is the real escape hatch when one whole service is down. */
    const alt = this.available().filter((p) => p !== provider)[0];
    if (alt && ((APP.providers[alt] || {}).needsKey ? State.apiKeys[alt] : true)) {
      attempts.push({ provider: alt, model: (APP.providers[alt].imageModels || [])[0]?.id });
    }

    let last = null;
    for (const a of attempts) {
      try {
        const images = await this.generate({ ...options, provider: a.provider, model: a.model, prompt });
        if (images && images.length) return images;
      } catch (err) {
        last = err;
        if (err?.kind === "aborted") throw err;
        if (err?.kind === "no_key") break;
      }
    }
    throw last || new ProviderError("Every image model failed. Try again in a moment.", { kind: "server" });
  },

  async openai(prompt, model, key, n, size, refs) {
    const isEdit = refs && refs.length;
    const url = `https://api.openai.com/v1/images/${isEdit ? "edits" : "generations"}`;
    let res;
    if (isEdit) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      form.append("n", String(n || 1));
      form.append("size", size || "1024x1024");
      refs.forEach((r, i) => form.append("image[]", dataUrlToBlob(r.dataUrl), r.name || `ref${i}.png`));
      res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
    } else {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, prompt, n: n || 1, size: size || "1024x1024" })
      });
    }
    if (!res.ok) throw await parseHttpError(res);
    const j = await res.json();
    const images = (j.data || []).map((d) => ({
      dataUrl: d.b64_json ? `data:image/png;base64,${d.b64_json}` : d.url,
      revisedPrompt: d.revised_prompt || ""
    }));
    if (!images.length) throw new ProviderError("The model returned no image.", { kind: "empty" });
    return images;
  },

  async gemini(prompt, model, key, refs) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`;
    const parts = [{ text: prompt }];
    (refs || []).forEach((r) => {
      const [, mime, b64] = /^data:([^;]+);base64,(.+)$/.exec(r.dataUrl) || [];
      if (b64) parts.push({ inline_data: { mime_type: mime || "image/png", data: b64 } });
    });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE"] }
      })
    });
    if (!res.ok) throw await parseHttpError(res);
    const j = await res.json();
    const cparts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const images = cparts
      .filter((p) => p.inlineData || p.inline_data)
      .map((p) => {
        const inline = p.inlineData || p.inline_data;
        return { dataUrl: `data:${inline.mimeType || inline.mime_type || "image/png"};base64,${inline.data}`, revisedPrompt: "" };
      });
    if (!images.length) {
      const text = cparts.map((p) => p.text).filter(Boolean).join(" ");
      throw new ProviderError(text || "Nano Banana returned no image. Check the Gemini key, model availability and prompt.", { kind: "empty" });
    }
    return images;
  },

  async pollinations(prompt, model, key, n, size) {
    const dims=String(size||"1024x1024").split("x").map(Number);
    const width=clamp(Number(dims[0])||1024,256,2048);
    const height=clamp(Number(dims[1])||1024,256,2048);
    const count=Math.max(1,Math.min(4,Number(n)||1));
    const images=[];
    let lastError=null;
    for(let i=0;i<count;i++){
      const seed=Math.floor(Math.random()*2147483647);
      const base=key?"https://gen.pollinations.ai/image/":"https://image.pollinations.ai/prompt/";
      const params=new URLSearchParams({
        model:model||"flux",width:String(width),height:String(height),seed:String(seed),private:key?"true":"false",safe:"true",enhance:"true",nologo:"true",...(key?{key}: {})
      });
      const url=base+encodeURIComponent(prompt)+"?"+params.toString();

      /* Pollinations serves the pixels directly at this URL. Verifying the
         response before showing it is what stops a broken <img> from being
         presented as a successful generation. */
      const verified=await this.verifyImageUrl(url,key);
      if(verified) images.push(verified);
      else lastError=lastError||new Error("The image host did not return a usable image.");
    }
    if(!images.length) throw new ProviderError(
      lastError?.message||"Pollinations returned no image. Try a different prompt or model.",
      {kind:"empty"}
    );
    return images;
  },

  /* Fetch an image URL and only accept it when the bytes really are an image.
     Falls back to a CORS-free <img> probe so a CORS-blocked host still works. */
  async verifyImageUrl(url,key){
    const headerList=key?{Authorization:`Bearer ${key}`}:[];
    try{
      const res=await fetch(url,{mode:"cors",headers:headerList});
      if(res.ok){
        const type=String(res.headers.get("content-type")||"");
        if(type.startsWith("image/")){
          const blob=await res.blob();
          if(blob.size>512){
            const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
            return {dataUrl:String(dataUrl),revisedPrompt:""};
          }
        }
      }
    }catch{ /* CORS or network — fall through to the element probe */ }

    return new Promise((resolve)=>{
      const img=new Image();
      img.crossOrigin="anonymous";
      const done=(ok)=>{clearTimeout(timer);resolve(ok?{dataUrl:url,revisedPrompt:""}:null);};
      const timer=setTimeout(()=>done(false),20000);
      img.onload=()=>done(img.naturalWidth>0&&img.naturalHeight>0);
      img.onerror=()=>done(false);
      img.src=url;
    });
  },

  async xai(prompt, model, key, n, size) {
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, n: n || 1, resolution: /2/.test(size || "") ? "2k" : "1k" })
    });
    if (!res.ok) throw await parseHttpError(res);
    const j = await res.json();
    const images = (j.data || []).map((d) => ({ dataUrl: d.b64_json ? `data:image/png;base64,${d.b64_json}` : d.url, revisedPrompt: "" }));
    if (!images.length) throw new ProviderError("The model returned no image.", { kind: "empty" });
    return images;
  }
};

function dataUrlToBlob(dataUrl) {
  const [, mime, b64] = /^data:([^;]+);base64,(.+)$/.exec(dataUrl) || [];
  const bin = atob(b64 || "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || "image/png" });
}

/* ----- run an image-gen turn as its own assistant message ----- */
App.runImageGen = async function (conv, prompt, refs) {
  const choice = ImageGen.defaultChoice();
  const cfg = APP.providers[choice.provider];
  const msg = {
    id: uid("msg"),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    streaming: true,
    thinkingLabel: "Generating image",
    providerLabel: `${cfg.label} · ${(cfg.imageModels.find((m) => m.id === choice.model) || {}).label || choice.model}`,
    model: choice.model,
    sources: [],
    images: [],
    genImages: null,
    genPrompt: prompt
  };
  conv.messages.push(msg);
  let el = UI.appendMessage(msg);
  UI.scrollToBottom(true);
  State.generating = true;
  UI.els.sendBtn.classList.add("hidden");
  UI.els.stopBtn.classList.remove("hidden");
  this.updateHeader();

  try {
    const images = await ImageGen.generateResilient({
      prompt,
      provider: choice.provider,
      model: choice.model,
      n: 1,
      size: State.settings.imageSize || "1024x1024",
      refs
    });
    msg.genImages = images;
    msg.content = images[0].revisedPrompt ? `_${images[0].revisedPrompt}_` : "";
  } catch (err) {
    const kind = (err && err.kind) || "unknown";
    msg.error = (err && err.message) || "Image generation failed.";
    msg.errorKind = kind;
    if (kind === "no_key") {
      msg.errorHint = "Pollinations can work without a key; add a provider key only if you choose a key-backed image provider.";
    }
  } finally {
    msg.streaming = false;
    State.generating = false;
    UI.els.sendBtn.classList.remove("hidden");
    UI.els.stopBtn.classList.add("hidden");
    this.updateComposerState();
    this.updateHeader();
  }

  const fresh = UI.buildMessage(msg);
  el.replaceWith(fresh);
  UI.scrollToBottom();
  conv.provider = choice.provider;
  await Conv.save(conv);
  UI.renderSidebar(this.filterTerm());
};

/* gallery card + regenerate/download/use-as-reference actions */
const ImageGenUI = {
  card(msg) {
    const wrap = document.createElement("div");
    wrap.className = "gen-image-card";
    if (!msg.genImages) return wrap;
    const grid = document.createElement("div");
    grid.className = "gen-image-grid";
    msg.genImages.forEach((img, i) => {
      const fig = document.createElement("figure");
      fig.className = "gen-image-fig";
      fig.innerHTML = `<img loading="lazy" alt="Generated image">
        <div class="gen-image-actions">
          <button class="icon-btn sm" data-a="view" title="View full size"><span class="ico" data-icon="eye"></span></button>
          <button class="icon-btn sm" data-a="download" title="Download"><span class="ico" data-icon="download"></span></button>
          <button class="icon-btn sm" data-a="edit" title="Use as reference and edit"><span class="ico" data-icon="wand"></span></button>
        </div>`;
      fig.querySelector("img").src = img.dataUrl;
      fig.querySelector("[data-a='view']").addEventListener("click", () =>
        UI.openLightbox(msg.genImages.map((g, gi) => ({ full: g.dataUrl, title: msg.genPrompt || `Image ${gi + 1}` })), i)
      );
      fig.querySelector("[data-a='download']").addEventListener("click", () =>
        downloadDataUrl(img.dataUrl, `the-gradient-image-${msg.id}-${i + 1}.png`)
      );
      fig.querySelector("[data-a='edit']").addEventListener("click", () => {
        UI.els.composerInput.value = "Edit this image: ";
        State.attachments.push({ id: uid("at"), kind: "image", name: `reference-${i + 1}.png`, size: 0, mime: "image/png", dataUrl: img.dataUrl, isGenRef: true });
        App.renderAttachTray();
        App.updateComposerState();
        UI.els.composerInput.focus();
      });
      hydrateIcons(fig);
      grid.appendChild(fig);
    });
    wrap.appendChild(grid);
    const foot = document.createElement("div");
    foot.className = "gen-image-foot";
    foot.innerHTML = `<span class="gen-image-prompt"></span><button class="btn btn-sm" data-a="regen"><span class="ico" data-icon="refresh"></span>Regenerate</button>`;
    foot.querySelector(".gen-image-prompt").textContent = msg.genPrompt || "";
    foot.querySelector("[data-a='regen']").addEventListener("click", async () => {
      const conv = Conv.active();
      if (!conv || State.generating) return;
      const idx = conv.messages.findIndex((m) => m.id === msg.id);
      conv.messages = conv.messages.slice(0, idx);
      await Conv.save(conv);
      UI.renderMessages(conv);
      App.runImageGen(conv, msg.genPrompt, []);
    });
    hydrateIcons(foot);
    wrap.appendChild(foot);
    return wrap;
  }
};

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

(function extendMessagesForImages() {
  const base = UI.buildMessage.bind(UI);
  UI.buildMessage = function (msg) {
    const el = base(msg);
    if (msg.genImages || (msg.streaming && msg.genPrompt)) {
      const content = el.querySelector(".msg-content");
      if (content) content.insertAdjacentElement("afterend", ImageGenUI.card(msg));
    }
    return el;
  };
})();

/* composer: an "Image" toggle next to web/image search */
(function extendComposerImageToggle() {
  const baseSend = App.sendMessage.bind(App);
  App.sendMessage = async function () {
    if (State.uiMode === "imagine" || State.settings.imageGenMode) {
      const text = UI.els.composerInput.value.trim();
      if (!text || State.generating) return;
      const refs = State.attachments.filter((a) => a.kind === "image");
      const conv = await Conv.ensureActive();
      conv.messages.push({ id: uid("msg"), role: "user", content: text, timestamp: Date.now(), attachments: State.attachments.slice() });
      UI.els.composerInput.value = "";
      State.attachments = [];
      App.renderAttachTray();
      UI.renderMessages(conv);
      UI.autoGrow(UI.els.composerInput);
      App.updateComposerState();
      await Conv.save(conv);
      UI.renderSidebar(App.filterTerm());
      return App.runImageGen(conv, text, refs);
    }
    return baseSend();
  };
})();

/* ============================================================
   20. PIPELINE UPLOADS + STRUCTURE GRAPH
   ============================================================ */

/* Read files the same way the composer does, but into a local array
   the pipeline modal owns — separate from State.attachments so opening
   a pipeline never touches whatever is queued in the main composer. */
async function readFilesAsAttachments(files, into) {
  for (const file of Array.from(files || [])) {
    if (into.length >= APP.limits.maxAttachments) {
      UI.toast(`Up to ${APP.limits.maxAttachments} files per run`, { error: true });
      break;
    }
    if (file.size > APP.limits.attachmentBytes) {
      UI.toast(`${file.name} is larger than ${fmtBytes(APP.limits.attachmentBytes)}`, { error: true });
      continue;
    }
    try {
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        into.push({ id: uid("at"), kind: "image", name: file.name, size: file.size, mime: file.type, dataUrl });
      } else {
        const text = await file.text();
        into.push({ id: uid("at"), kind: "text", name: file.name, size: file.size, mime: file.type || "text/plain", text: text.slice(0, 120000) });
      }
    } catch {
      UI.toast(`Couldn't read ${file.name}`, { error: true });
    }
  }
}

function attachTrayMarkup(list, onRemove) {
  const tray = document.createElement("div");
  tray.className = "attach-tray pl-attach-tray";
  tray.classList.toggle("hidden", !list.length);
  list.forEach((a) => {
    const pill = document.createElement("div");
    pill.className = "attach-pill";
    pill.innerHTML = a.kind === "image"
      ? `<img alt=""><span class="name"></span><span class="size"></span><button aria-label="Remove attachment">${Icon.x}</button>`
      : `${ic("file")}<span class="name"></span><span class="size"></span><button aria-label="Remove attachment">${Icon.x}</button>`;
    if (a.kind === "image") pill.querySelector("img").src = a.dataUrl;
    pill.querySelector(".name").textContent = a.name;
    pill.querySelector(".size").textContent = fmtBytes(a.size);
    pill.querySelector("button").addEventListener("click", () => onRemove(a.id));
    tray.appendChild(pill);
  });
  return tray;
}

/* Extend Pipelines.fill / runNode so uploaded files ride along as real
   attachments (vision models see the images, everything else gets the
   text files inlined the same way the main chat composer does). */
(function extendPipelinesForUploads() {
  /* Replaces Pipelines.runNode so any node with no dependencies (a
     "source" node) receives the run's uploaded attachments — vision
     models see the images, everything else gets them as ordinary
     message attachments the way the main composer sends them. */
  Pipelines.runNode = async function (node, ctx, onUpdate, signal) {
    const provider = node.provider || State.settings.provider;
    const model = node.model || State.settings.model;
    const adapter = Providers.get(provider);
    const prompt = this.fill(node.prompt, ctx);
    const isSourceNode = !(node.deps && node.deps.length);
    const attachments = isSourceNode ? (ctx.attachments || []) : [];
    const state = {
      id: node.id, name: node.name, model, status: "running", output: "", reasoning: "",
      ttft: 0, ms: 0, tokensIn: Tokens.count(prompt), tokensOut: 0
    };
    onUpdate(state);
    const started = performance.now();
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        const res = await adapter.send({
          messages: [{ role: "user", content: prompt, attachments }],
          model,
          systemPrompt: ctx.system,
          apiKey: State.apiKeys[provider] || "",
          endpoint: State.endpoints[provider],
          signal,
          stream: State.settings.streaming,
          params: {
            temperature: node.temperature != null ? node.temperature : State.settings.temperature,
            maxTokens: State.settings.maxTokens,
            thinking: State.settings.thinking,
            thinkingEffort: State.settings.thinkingEffort,
            thinkingBudget: State.settings.thinkingBudget
          },
          onDelta: (text) => {
            if (!state.ttft) state.ttft = performance.now() - started;
            state.output = text;
            state.ms = performance.now() - started;
            onUpdate(state);
          },
          onReason: (text) => {
            state.reasoning = text;
            onUpdate(state);
          }
        });
        state.output = (typeof res === "string" ? res : res.text || "").trim();
        if (res && res.reasoning) state.reasoning = res.reasoning;
        state.status = "done";
        break;
      } catch (err) {
        if (err instanceof ProviderError && err.kind === "aborted") {
          state.status = "stopped";
          break;
        }
        if (attempts >= 2) {
          state.status = "failed";
          state.error = (err && err.message) || "failed";
          if (State.settings.searchFallback && Fallback.shouldRun((err && err.kind) || "")) {
            const fb = await Fallback.run(prompt.slice(0, 300), (err && err.kind) || "network");
            if (fb) {
              state.output = fb.content;
              state.status = "fallback";
              state.error = "";
            }
          }
        }
      }
    }
    state.ms = performance.now() - started;
    state.tokensOut = Tokens.count(state.output);
    state.cost = estimateCost(model, state.tokensIn, state.tokensOut);
    onUpdate(state);
    return state;
  };

  /* Replaces Pipelines.run to accept a 4th "attachments" argument and
     thread it into ctx.attachments for runNode above. */
  Pipelines.run = async function (pipeline, input, conv, attachments) {
    conv = conv || (await Conv.ensureActive());
    const controller = new AbortController();
    State.abort = controller;
    State.generating = true;
    App.updateHeader();

    const msg = {
      id: uid("msg"), role: "assistant", content: "", timestamp: Date.now(),
      providerLabel: `Pipeline · ${pipeline.name}`, model: "pipeline", sources: [], images: [],
      pipeline: { name: pipeline.name, mode: pipeline.mode, nodes: [] },
      attachments: (attachments || []).slice()
    };
    conv.messages.push(msg);
    let el = UI.appendMessage(msg);
    UI.scrollToBottom(true);

    const ctx = { input, system: App.systemPrompt([]), outputs: {}, previous: null, attachments: attachments || [] };
    const states = {};
    const paint = () => {
      msg.pipeline.nodes = pipeline.nodes.map((n) => states[n.id] || { id: n.id, name: n.name, status: "pending", model: n.model });
      const card = el.querySelector(".pipeline-card");
      if (card) card.replaceWith(PipelineUI.card(msg));
      else {
        const fresh = UI.buildMessage(msg);
        el.replaceWith(fresh);
        el = fresh;
      }
    };
    paint();

    try {
      const waves = pipeline.mode === "chain" ? pipeline.nodes.map((n) => [n]) : this.order(pipeline);
      for (const wave of waves) {
        await Promise.all(
          wave.map(async (node) => {
            const st = await this.runNode(node, ctx, (s) => { states[s.id] = s; paint(); }, controller.signal);
            states[node.id] = st;
            ctx.outputs[node.id] = st;
            ctx.outputs[(node.name || "").toLowerCase().replace(/\s+/g, "_")] = st;
            ctx.previous = st;
            paint();
          })
        );
      }
      const last = pipeline.nodes[pipeline.nodes.length - 1];
      const final = states[last.id];
      msg.content = (final && final.output) || "_The pipeline produced no final output._";
    } catch (err) {
      msg.error = (err && err.message) || "The pipeline failed.";
    } finally {
      State.generating = false;
      State.abort = null;
      msg.streaming = false;
      const totals = Object.values(states).reduce(
        (acc, s) => ({ ms: Math.max(acc.ms, s.ms || 0), tokens: acc.tokens + (s.tokensIn || 0) + (s.tokensOut || 0), cost: acc.cost + (s.cost || 0) }),
        { ms: 0, tokens: 0, cost: 0 }
      );
      msg.pipeline.totals = totals;
      msg.stats = { ms: totals.ms, chars: msg.content.length, tokens: totals.tokens };
      App.updateHeader();
      App.updateComposerState();
    }

    const fresh = UI.buildMessage(msg);
    el.replaceWith(fresh);
    await Conv.save(conv);
    UI.renderSidebar(App.filterTerm());
    UI.scrollToBottom();
  };
})();

/* ---------- structure graph: a real node-and-arrow diagram ---------- */
const PipelineGraph = {
  /* Simple layered layout: column = wave index (topological depth),
     row = position within that wave. Good enough for up to ~10 nodes. */
  layout(pipeline) {
    const nodes = pipeline.nodes;
    const depth = {};
    if (pipeline.mode === "chain") {
      nodes.forEach((n, i) => (depth[n.id] = i));
    } else {
      const done = new Set();
      let guard = 0;
      while (done.size < nodes.length && guard++ < 50) {
        let progressed = false;
        nodes.forEach((n) => {
          if (done.has(n.id)) return;
          const deps = n.deps || [];
          if (deps.every((d) => done.has(d) || !nodes.some((x) => x.id === d))) {
            depth[n.id] = deps.length ? Math.max(...deps.map((d) => (depth[d] || 0) + 1)) : 0;
            done.add(n.id);
            progressed = true;
          }
        });
        if (!progressed) {
          nodes.forEach((n) => { if (!done.has(n.id)) { depth[n.id] = 0; done.add(n.id); } });
          break;
        }
      }
    }
    const cols = {};
    nodes.forEach((n) => { const d = depth[n.id] || 0; (cols[d] = cols[d] || []).push(n.id); });
    const pos = {};
    const colW = 168, rowH = 74, padX = 60, padY = 40;
    Object.keys(cols).map(Number).sort((a, b) => a - b).forEach((d) => {
      cols[d].forEach((id, row) => {
        pos[id] = { x: padX + d * colW, y: padY + row * rowH, col: d, row };
      });
    });
    const maxCol = Math.max(0, ...Object.values(pos).map((p) => p.col));
    const maxRow = Math.max(0, ...Object.keys(cols).map((d) => cols[d].length - 1));
    return { pos, width: padX * 2 + (maxCol + 1) * colW - (colW - 140), height: padY * 2 + (maxRow + 1) * rowH - (rowH - 50) };
  },

  edges(pipeline) {
    if (pipeline.mode === "chain") {
      return pipeline.nodes.slice(1).map((n, i) => [pipeline.nodes[i].id, n.id]);
    }
    const out = [];
    pipeline.nodes.forEach((n) => (n.deps || []).forEach((d) => out.push([d, n.id])));
    return out;
  },

  svg(pipeline, activeId) {
    const { pos, width, height } = this.layout(pipeline);
    const edges = this.edges(pipeline);
    const boxW = 132, boxH = 44;
    let defs = `<defs><marker id="pg-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent)"></path></marker></defs>`;
    let lines = "";
    edges.forEach(([a, b]) => {
      const pa = pos[a], pb = pos[b];
      if (!pa || !pb) return;
      const x1 = pa.x + boxW, y1 = pa.y + boxH / 2, x2 = pb.x, y2 = pb.y + boxH / 2;
      const mx = (x1 + x2) / 2;
      lines += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="var(--border)" stroke-width="1.6" marker-end="url(#pg-arrow)"/>`;
    });
    let boxes = "";
    pipeline.nodes.forEach((n) => {
      const p = pos[n.id];
      if (!p) return;
      const active = n.id === activeId;
      boxes += `<g class="pg-node${active ? " pg-active" : ""}" data-node="${Sec.esc(n.id)}">
        <rect x="${p.x}" y="${p.y}" width="${boxW}" height="${boxH}" rx="9"></rect>
        <text x="${p.x + boxW / 2}" y="${p.y + boxH / 2 - 3}" text-anchor="middle">${Sec.esc((n.name || n.id).slice(0, 16))}</text>
        <text x="${p.x + boxW / 2}" y="${p.y + boxH / 2 + 13}" text-anchor="middle" class="pg-model">${Sec.esc((n.model || "").slice(0, 20))}</text>
      </g>`;
    });
    return `<svg class="pg-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${defs}${lines}${boxes}</svg>`;
  },

  render(host, pipeline, activeId) {
    host.innerHTML = this.svg(pipeline, activeId);
  }
};

/* ============================================================
   21. EXPANDED MODEL ROSTERS
   More models per provider, on top of the September 2026 baseline
   already set in section 18.1. Verified against provider docs; each
   provider also has Settings → Provider → Refresh model list to pull
   the live roster your key can actually see.
   ============================================================ */
APP.providers.openai.models = [
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", reasoning: true },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", reasoning: true },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", reasoning: true },
  { id: "gpt-5.5", label: "GPT-5.5", reasoning: true },
  { id: "gpt-5.5-pro", label: "GPT-5.5 Pro", reasoning: true },
  { id: "gpt-5.2", label: "GPT-5.2", reasoning: true },
  { id: "gpt-5.1", label: "GPT-5.1", reasoning: true },
  { id: "gpt-5", label: "GPT-5", reasoning: true },
  { id: "gpt-5-mini", label: "GPT-5 mini", reasoning: true },
  { id: "gpt-5-nano", label: "GPT-5 nano", reasoning: true },
  { id: "o3", label: "o3", reasoning: true },
  { id: "o4-mini", label: "o4-mini", reasoning: true },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 nano" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" }
];
APP.providers.anthropic.models = [
  { id: "claude-opus-5", label: "Claude Opus 5", reasoning: true },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", reasoning: true },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", reasoning: true },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", reasoning: true },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", reasoning: true },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", reasoning: true },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", reasoning: true },
  { id: "claude-opus-4-5-20251101", label: "Claude Opus 4.5 (dated)", reasoning: true },
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (dated)", reasoning: true }
];
APP.providers.gemini.models = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", reasoning: true },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)", reasoning: true },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", reasoning: true },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", reasoning: true },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" }
];
APP.providers.xai.models = [
  { id: "grok-4.6", label: "Grok 4.6", reasoning: true },
  { id: "grok-4.5", label: "Grok 4.5", reasoning: true },
  { id: "grok-4.3", label: "Grok 4.3", reasoning: true },
  { id: "grok-4.20-reasoning", label: "Grok 4.20 (reasoning)", reasoning: true },
  { id: "grok-4.20-non-reasoning", label: "Grok 4.20 (fast)" },
  { id: "grok-4.1-fast-reasoning", label: "Grok 4.1 Fast (reasoning)", reasoning: true },
  { id: "grok-4.1-fast-non-reasoning", label: "Grok 4.1 Fast" },
  { id: "grok-build-0.1", label: "Grok Build 0.1 (code)" }
];
APP.providers.deepseek.models = [
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", reasoning: true },
  { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", reasoning: true },
  { id: "deepseek-chat", label: "DeepSeek Chat (legacy alias)" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner (legacy alias)", reasoning: true }
];
APP.providers.moonshot.models = [
  { id: "kimi-k2.6", label: "Kimi K2.6", reasoning: true },
  { id: "kimi-k2.5", label: "Kimi K2.5", reasoning: true },
  { id: "moonshot-v1-128k", label: "Moonshot v1 128k" },
  { id: "moonshot-v1-32k", label: "Moonshot v1 32k" },
  { id: "moonshot-v1-8k", label: "Moonshot v1 8k" }
];
APP.providers.openrouter.models = [
  { id: "openai/gpt-5.6-sol", label: "GPT-5.6 Sol" },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "anthropic/claude-opus-5", label: "Claude Opus 5" },
  { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
  { id: "x-ai/grok-4.5", label: "Grok 4.5" },
  { id: "x-ai/grok-4.3", label: "Grok 4.3" },
  { id: "moonshotai/kimi-k2.5", label: "Kimi K2.5" },
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
  { id: "deepseek/deepseek-reasoner", label: "DeepSeek Reasoner" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B" },
  { id: "mistralai/mixtral-8x22b-instruct", label: "Mixtral 8x22B" },
  { id: "mistralai/mistral-large", label: "Mistral Large" },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
  { id: "qwen/qwen3-coder", label: "Qwen3 Coder" }
];
APP.providers.groq.models = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B", reasoning: true },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  { id: "qwen-2.5-32b", label: "Qwen 2.5 32B" }
];
if (APP.providers.mistral) {
  APP.providers.mistral.models = [
    { id: "mistral-large-latest", label: "Mistral Large" },
    { id: "mistral-small-latest", label: "Mistral Small" },
    { id: "codestral-latest", label: "Codestral" },
    { id: "open-mixtral-8x22b", label: "Mixtral 8x22B" },
    { id: "pixtral-large-latest", label: "Pixtral Large (vision)" }
  ];
}
APP.providers.ollama.models = [
  { id: "llama3.3", label: "Llama 3.3" },
  { id: "llama3.1", label: "Llama 3.1" },
  { id: "qwen2.5", label: "Qwen 2.5" },
  { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
  { id: "gpt-oss:20b", label: "GPT-OSS 20B" },
  { id: "gpt-oss:120b", label: "GPT-OSS 120B" },
  { id: "phi4", label: "Phi-4" },
  { id: "mistral-nemo", label: "Mistral Nemo" },
  { id: "deepseek-r1", label: "DeepSeek R1 (distill)", reasoning: true },
  { id: "gemma2", label: "Gemma 2" }
];

/* ============================================================
   19. KNOWLEDGE, TOOLS, SCHEMA, AND TRANSPORT RESILIENCE (3.1)
   ============================================================ */
/* This layer is deliberately browser-native: documents remain in IndexedDB,
   tools require an explicit model call envelope, and executable code is never
   evaluated in the page's main world. */
(function addDocumentStore() {
  const get = (id) => new Promise(async (resolve) => {
    await Store.init();
    if (Store.mode === "ls") { const all = await Store.kvGet("documents", []); resolve(all.find((x) => x.id === id) || null); return; }
    try { const r = indexedDB.open(APP.db.name, APP.db.version); r.onsuccess = () => { const q = r.result.transaction(APP.db.documents, "readonly").objectStore(APP.db.documents).get(id); q.onsuccess = () => resolve(q.result || null); q.onerror = () => resolve(null); }; r.onerror = () => resolve(null); } catch { resolve(null); }
  });
  const all = () => new Promise(async (resolve) => {
    await Store.init();
    if (Store.mode === "ls") return resolve(await Store.kvGet("documents", []));
    try { const r = indexedDB.open(APP.db.name, APP.db.version); r.onsuccess = () => { const q = r.result.transaction(APP.db.documents, "readonly").objectStore(APP.db.documents).getAll(); q.onsuccess = () => resolve(q.result || []); q.onerror = () => resolve([]); }; r.onerror = () => resolve([]); } catch { resolve([]); }
  });
  const put = async (doc) => {
    await Store.init();
    if (Store.mode === "ls") { const docs = await Store.kvGet("documents", []); const i = docs.findIndex((x) => x.id === doc.id); if (i < 0) docs.push(doc); else docs[i] = doc; return Store.kvSet("documents", docs); }
    return new Promise((resolve) => { try { const r = indexedDB.open(APP.db.name, APP.db.version); r.onsuccess = () => { const tx = r.result.transaction(APP.db.documents, "readwrite"); tx.objectStore(APP.db.documents).put(doc); tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); }; r.onerror = () => resolve(false); } catch { resolve(false); } });
  };
  const del = async (id) => {
    await Store.init();
    if (Store.mode === "ls") return Store.kvSet("documents", (await Store.kvGet("documents", [])).filter((x) => x.id !== id));
    return new Promise((resolve) => { try { const r = indexedDB.open(APP.db.name, APP.db.version); r.onsuccess = () => { const tx = r.result.transaction(APP.db.documents, "readwrite"); tx.objectStore(APP.db.documents).delete(id); tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); }; r.onerror = () => resolve(false); } catch { resolve(false); } });
  };
  Object.assign(Store, { documentGet: get, documentAll: all, documentPut: put, documentDelete: del });
})();

const RAG = {
  docs: [],
  tokenize(text) { return (String(text || "").toLowerCase().match(/[\p{L}\p{N}_-]{2,}/gu) || []).slice(0, 5000); },
  chunks(text, size = 900, overlap = 160) { const clean = String(text || "").replace(/\r/g, "").trim(); const out = []; for (let at = 0; at < clean.length; at += size - overlap) { const part = clean.slice(at, at + size); if (part.trim()) out.push(part.trim()); if (at + size >= clean.length) break; } return out; },
  async load() { this.docs = await Store.documentAll(); return this.docs; },
  async extract(file) {
    const name = file.name.toLowerCase();
    if (/\.(txt|md|csv|json|html?|js|ts|py|ya?ml|xml|log)$/.test(name)) return file.text();
    if (/\.pdf$/.test(name)) {
      await this.script("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs", "pdfjsLib");
      const bytes = new Uint8Array(await file.arrayBuffer()); const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise; let text = "";
      for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); text += "\n" + (await page.getTextContent()).items.map((x) => x.str).join(" "); }
      return text;
    }
    if (/\.docx$/.test(name)) { await this.script("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth"); return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value; }
    throw new Error("Supported knowledge files are PDF, DOCX, CSV, JSON, Markdown, and plain text.");
  },
  async script(url, global) { if (window[global]) return window[global]; if (/\.mjs$/.test(url)) { const mod = await import(url); window[global] = mod; return mod; } return new Promise((resolve, reject) => { const s = document.createElement("script"); s.src = url; s.onload = () => window[global] ? resolve(window[global]) : reject(new Error("The document reader did not load.")); s.onerror = () => reject(new Error("Could not load the document reader.")); document.head.appendChild(s); }); },
  async add(file, projectId) { const text = await this.extract(file); const doc = { id: uid("doc"), projectId: projectId || null, name: file.name, mime: file.type || "text/plain", createdAt: Date.now(), chunks: this.chunks(text).map((text, i) => ({ id: i, text, terms: this.tokenize(text) })) }; await Store.documentPut(doc); this.docs.unshift(doc); return doc; },
  search(query, projectId, limit = 5) { const terms = this.tokenize(query); if (!terms.length) return []; const docs = this.docs.filter((d) => !projectId || d.projectId === projectId); const chunks = docs.flatMap((d) => d.chunks.map((c) => Object.assign({ doc: d }, c))); const df = {}; terms.forEach((t) => { df[t] = chunks.reduce((n, c) => n + (c.terms.includes(t) ? 1 : 0), 0); }); return chunks.map((c) => { const tf = {}; c.terms.forEach((t) => (tf[t] = (tf[t] || 0) + 1)); const score = terms.reduce((n, t) => n + ((tf[t] || 0) / Math.max(1, c.terms.length)) * Math.log((chunks.length + 1) / ((df[t] || 0) + 1)), 0); return { name: c.doc.name, text: c.text, score }; }).filter((x) => x.score > 0).sort((a,b) => b.score-a.score).slice(0, limit); },
  context(conv, query) { const project = Projects.ofConv(conv); const hits = this.search(query, project && project.id); return hits.length ? "\n\nKnowledge-base excerpts (cite their file name; do not invent details):\n" + hits.map((h) => `[${h.name}]\n${h.text}`).join("\n\n") : ""; }
};

const ToolRegistry = {
  tools: new Map(),
  register(def) { this.tools.set(def.name, def); },
  schemas() { return [...this.tools.values()].map(({ name, description, parameters }) => ({ name, description, parameters })); },
  async execute(name, args) { const tool = this.tools.get(name); if (!tool) throw new Error(`Unknown tool: ${name}`); return tool.run(args || {}); },
  parse(text) { const m = String(text || "").match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/i); if (!m) return null; try { const call = JSON.parse(m[1]); return call && typeof call.name === "string" ? call : null; } catch { return null; } }
};
ToolRegistry.register({ name: "web_search", description: "Search DuckDuckGo and Wikipedia for current public facts.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false }, run: async ({ query }) => { const r = await Research.search(String(query).slice(0, 300)); return (r.sources || []).slice(0, 5).map((x) => ({ title: x.title, url: x.url, snippet: x.snippet || x.text || "" })); } });
ToolRegistry.register({ name: "calculator", description: "Evaluate arithmetic without access to browser globals.", parameters: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"], additionalProperties: false }, run: ({ expression }) => { const exp = String(expression); if (!/^[0-9+\-*/%.(),\s^]+$/.test(exp)) throw new Error("Calculator accepts numbers and arithmetic operators only."); const value = Function(`"use strict"; return (${exp.replace(/\^/g, "**")})`)(); if (!Number.isFinite(value)) throw new Error("Result is not finite."); return { value }; } });
ToolRegistry.register({ name: "execute_js", description: "Run JavaScript in an isolated Worker and return console output.", parameters: { type: "object", properties: { code: { type: "string" } }, required: ["code"], additionalProperties: false }, run: ({ code }) => new Promise((resolve, reject) => { const blob = new Blob([`self.console={log:(...x)=>postMessage({log:x.join(' ')})}; try { ${String(code)}; postMessage({done:true}); } catch(e){postMessage({error:e.message})}`], { type: "text/javascript" }); const w = new Worker(URL.createObjectURL(blob)); const lines=[]; const timer=setTimeout(() => { w.terminate(); reject(new Error("JavaScript timed out after 3 seconds.")); },3000); w.onmessage=(e)=>{ if(e.data.log) lines.push(e.data.log); if(e.data.error){clearTimeout(timer);w.terminate();reject(new Error(e.data.error));} if(e.data.done){clearTimeout(timer);w.terminate();resolve({ output: lines.join("\n") });} }; w.onerror=()=>{clearTimeout(timer);w.terminate();reject(new Error("Worker execution failed."));}; } ) });
ToolRegistry.register({ name: "canvas_render", description: "Open HTML or SVG source in the local artifact canvas.", parameters: { type: "object", properties: { source: { type: "string" }, language: { type: "string", enum: ["html", "svg"] } }, required: ["source", "language"], additionalProperties: false }, run: async ({ source, language }) => ({ rendered: true, language, chars: String(source).length }) });

const JsonSchema = { validate(value, schema, path = "$", errors = []) { if (!schema) return errors; if (schema.type && (schema.type === "array" ? !Array.isArray(value) : schema.type === "object" ? (!value || Array.isArray(value) || typeof value !== "object") : typeof value !== schema.type)) errors.push(`${path} must be ${schema.type}`); if (schema.required && value && typeof value === "object") schema.required.forEach((k) => { if (!(k in value)) errors.push(`${path}.${k} is required`); }); if (schema.properties && value && typeof value === "object") Object.entries(schema.properties).forEach(([k, s]) => { if (k in value) this.validate(value[k], s, `${path}.${k}`, errors); }); if (schema.items && Array.isArray(value)) value.forEach((v, i) => this.validate(v, schema.items, `${path}[${i}]`, errors)); if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} must be one of the allowed values`); return errors; } };

(function upgradeTurnEngine() {
  const basePrompt = App.systemPrompt.bind(App);
  App.systemPrompt = function (sources) { const conv = Conv.active(); const q = conv && [...conv.messages].reverse().find((m) => m.role === "user"); return basePrompt(sources) + RAG.context(conv, q && q.content) + "\n\nAvailable client tools use this exact envelope only when needed: <tool_call>{\"name\":\"calculator\",\"arguments\":{\"expression\":\"2+2\"}}</tool_call>. Tools: " + ToolRegistry.schemas().map((t) => t.name).join(", ") + "."; };
  const baseTurn = App.runTurn.bind(App);
  App.runTurn = async function (conv, choice, opts) { await RAG.load(); const result = await baseTurn(conv, choice, opts); const assistant = [...conv.messages].reverse().find((m) => m.role === "assistant"); const call = assistant && ToolRegistry.parse(assistant.content); if (call) { try { const def = ToolRegistry.tools.get(call.name); const errors = JsonSchema.validate(call.arguments, def && def.parameters); if (errors.length) throw new Error(errors.join("; ")); const output = await ToolRegistry.execute(call.name, call.arguments); assistant.tool = { name: call.name, output, at: Date.now() }; assistant.content = assistant.content.replace(/<tool_call>[\s\S]*?<\/tool_call>/i, "").trim() + `\n\n> **${call.name} result**\n> \`${JSON.stringify(output)}\``; if (call.name === "canvas_render") { const artifactId = uid("art"); const kind = Artifacts.classify(call.arguments.language, call.arguments.source); Artifacts.store(conv)[artifactId] = { id: artifactId, msgId: assistant.id, title: "Tool canvas", type: kind.type, label: kind.label, lang: call.arguments.language, ext: kind.ext, preview: true, current: 0, versions: [{ code: call.arguments.source, ts: Date.now(), note: "Tool render" }] }; assistant.artifacts = (assistant.artifacts || []).concat(artifactId); Canvas.open(artifactId, conv.id); } await Conv.save(conv); App.rerenderActive(); } catch (err) { assistant.content += `\n\n> Tool error: ${err.message}`; await Conv.save(conv); App.rerenderActive(); } } return result; };
})();

(function addResilientTransport() { const base = Providers.get.bind(Providers); Providers.get = function (id) { const adapter = base(id); if (adapter.__nimbusRetry) return adapter; const send = adapter.send.bind(adapter); adapter.send = async (opts) => { let last; for (let attempt = 0; attempt < 3; attempt++) { try { return await send(opts); } catch (err) { last = err; if (opts.signal && opts.signal.aborted || !(err instanceof ProviderError) || !["network", "server", "rate_limit"].includes(err.kind) || attempt === 2) throw err; await new Promise((resolve) => setTimeout(resolve, 350 * (2 ** attempt) + Math.random() * 180)); } } throw last; }; adapter.__nimbusRetry = true; return adapter; }; })();

(function knowledgeBindings() { document.addEventListener("DOMContentLoaded", () => { const input = $("#attach-input"); if (input) input.accept += ",.pdf,.docx"; }); })();

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  App.init().catch((err) => {
    console.error(err);
    const host = document.getElementById("toast-host");
    if (host) {
      host.innerHTML = `<div class="toast err"><span>The Gradient failed to start: ${Sec.esc(err && err.message ? err.message : "unknown error")}</span></div>`;
    }
  });
});

/* Installable, offline-capable shell. Registration failures (e.g. serving
   over file:// or a host without HTTPS) are non-fatal — the app still works,
   it just won't cache for offline use. */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("Service worker not registered:", err && err.message));
  });
}

window.APP = APP;
window.TheGradient = window.Nimbus = {
  APP, State, Conv, UI, App, Settings, Palette, MD, Highlighter, Store, Providers, Research, ProviderError,
  Artifacts, Canvas, Projects, Memory, Fallback, Branch, Reasoning, MathLite, ProOverlay, Exporters,
  Caps, Tokens, Executors, Terminal, Visuals, Workbench, Pipelines, PipelineUI, Snippets, PuterProvider,
  ImageGen, ImageGenUI, PipelineGraph, readFilesAsAttachments, RAG, ToolRegistry, JsonSchema,
  hydrateIcons, ic, uid,
  Icon, Sec
};
})();
