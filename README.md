# The Gradient 3.6

A private, browser-first AI workspace built around five purpose-specific workspaces. No build step: plain HTML, CSS and JavaScript, opened straight from `index.html`.

## The five workspaces

- **Learn** — a focused, Claude-style tutoring and normal-chat workspace.
- **Software Development** — a coding agent. The model writes the code, runs it in a sandbox, fixes failures and hands back the finished artifact. Choose **Standard** or **Advanced** depth; there are no canned prompts.
- **Imagine** — image generation and visual creation.
- **Canvas** — AI design generation plus a full manual editor. Generated layouts arrive as ordinary editable layers (move, resize, rotate, recolour, retype), alongside drawing tools, shapes, text, images and export to PNG/SVG/JSON.
- **Documents** — document, presentation, PDF and spreadsheet creation with preview and export through Document Studio.

## What is new in 3.6

**Chat experience**
- `chat-ux.js` — a Standard / Advanced reasoning selector (Ctrl/Cmd + `.` cycles), a compact tools menu, and a Claude-style reasoning strip on replies.
- `model-picker.js` — model selection is a real in-page panel: searchable, grouped by provider, scrolls internally, shows a live model count, and never spills off-screen. Keyboard: arrows to move, Enter to pick, Ctrl/Cmd + M to open.
- `finish-pass.js` — the GPT/Claude-grade loading state: orbiting dots with a shimmering label while a model reasons, bouncing dots while a reply streams, instant feedback on send. Also makes the tools menu icon-only (names in tooltips) and applies the professional type system.

**Code**
- `preview-engine.js` — every code block gets a **Preview** button: live sandboxed HTML/CSS/JS with a console feed, a collapsible JSON tree, a CSV table, real Mermaid diagrams, responsive device widths, reload, source toggle and full screen.

**Pipelines**
- `workflows.js` — a plain-language pipeline gallery (best answer, fact-checked, three depths, both sides, polish, translate, multi-model) with one-click runs and a live progress card that ends in a readable answer.

**Canvas**
- `canvas-fit.js` — the canvas stage is locked to the viewport, the artboard auto-fits and stays centred at any size, panels collapse on small screens, and the **Fit** control works.

**Reliability**
- Image generation retries, then tries another model, then another provider; broken images are never shown as successes.
- Each workspace keeps its own composer prompt, start panel and file folder, so nothing bleeds between modes.
- `sw.js` caches the entire shell, so the app opens and works offline once visited.

## Fonts

A neutral sans (Helvetica / Arial stack) for the interface, and monospace (Courier New) for code, data, model ids and previews.

## Architecture

The original engine remains intact for provider routing, chat storage, projects, memory, RAG, pipelines, execution and artifacts. The 3.2 layer provides the product shell; 3.6 adds the chat, preview, pipeline and canvas layers on top.

Core layers:
- `app.js` — the engine, and the single source of truth for `APP.version`.
- `mode-router.js` — the authoritative workspace router and per-mode metadata.
- `v41-world-class.css` / `.js` — the visual system and recovery UX.
- `v32-shell.js`, `v32-state.js`, `v369-core.js` — shell, state and shared hardening.
- Mode modules: `learn-mode.js`, `software-mode.js` + `software-agent.js`, `imagine-mode.js`, `canvas-mode.js`, `documents-mode.js`.

## Navigation

The five modes appear only in the left sidebar. A mode page never creates its own mode switcher, so the UI stays simple and consistent.

## Pollinations

Pollinations model discovery is loaded from the current public catalog endpoints. Generation requires an API key; browser apps should use a publishable/app key or an appropriate authenticated flow rather than exposing a secret server-side key.
