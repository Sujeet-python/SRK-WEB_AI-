/* The Gradient 3.6 — Preview engine
   Every meaningful code block gets a real, sandboxed preview with device
   framing, reload, source/console tabs and full-screen. Nothing here depends
   on the Canvas being open: previews render inline in the transcript. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { UI, State } = TG;

  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---------- what can we actually show? ---------- */
  const KIND = {
    html: { label: "HTML page", mode: "frame" },
    htm: { label: "HTML page", mode: "frame" },
    svg: { label: "SVG graphic", mode: "svg" },
    css: { label: "CSS stylesheet", mode: "frame", wrap: true },
    js: { label: "JavaScript", mode: "frame", wrap: true, needsRuntime: true },
    javascript: { label: "JavaScript", mode: "frame", wrap: true, needsRuntime: true },
    jsx: { label: "React component", mode: "frame", wrap: true, needsRuntime: true },
    ts: { label: "TypeScript", mode: "frame", wrap: true, needsRuntime: true },
    tsx: { label: "React component", mode: "frame", wrap: true, needsRuntime: true },
    json: { label: "JSON data", mode: "json" },
    csv: { label: "Table", mode: "csv" },
    md: { label: "Markdown", mode: "markdown" },
    markdown: { label: "Markdown", mode: "markdown" },
    mermaid: { label: "Diagram", mode: "mermaid" },
    py: { label: "Python", mode: "python" },
    python: { label: "Python", mode: "python" },
    chart: { label: "Chart", mode: "chart" }
  };

  function kindFor(lang, code) {
    const l = String(lang || "").toLowerCase();
    if (KIND[l]) return { ...KIND[l], lang: l };
    if (!l && /^\s*<(!doctype|html|svg)/i.test(code)) {
      return /^\s*<svg/i.test(code) ? { ...KIND.svg, lang: "svg" } : { ...KIND.html, lang: "html" };
    }
    return null;
  }

  function isPreviewable(lang, code) {
    const k = kindFor(lang, code);
    if (!k) return false;
    if (k.mode === "json" || k.mode === "csv") return String(code).trim().length > 2;
    if (k.mode === "python") return String(code).trim().length > 0;
    return String(code).trim().length > 0;
  }

  /* ---------- documents the sandbox can render ---------- */
  const RUNTIME = `
<script>
window.addEventListener('error',function(e){parent.postMessage({__gp:1,type:'error',text:e.message},'*')});
window.addEventListener('unhandledrejection',function(e){parent.postMessage({__gp:1,type:'error',text:String(e.reason&&e.reason.message||e.reason)},'*')});
['log','warn','error','info'].forEach(function(k){var o=console[k];console[k]=function(){try{parent.postMessage({__gp:1,type:'log',level:k,text:Array.prototype.map.call(arguments,function(a){try{return typeof a==='object'?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(' ')},'*')}catch(e){}o&&o.apply(console,arguments)}});
</script>`;

  function shell(body, head) {
    return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{color-scheme:light}
  html,body{margin:0}
  body{padding:16px;background:#fff;color:#111;
    font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  *{box-sizing:border-box}
  img,svg,video,canvas{max-width:100%}
  a{color:#2563eb}
  h1,h2,h3{line-height:1.25}
  button,input,select,textarea{font:inherit}
</style>${RUNTIME}${head || ""}</head><body>${body || ""}</body></html>`;
  }

  function runtimeDocument(code, lang) {
    const l = String(lang || "").toLowerCase();
    /* A full document is used as-is; we only inject the console bridge. */
    if (/<html[\s>]/i.test(code) || /<!doctype/i.test(code)) {
      return code.replace(/<head([^>]*)>/i, `<head$1>${RUNTIME}`);
    }
    const stripped = l === "ts" || l === "tsx"
      ? code.replace(/:\s*[A-Za-z_][\w<>\[\]|,\s.]*(?=\s*[=,);])/g, "").replace(/^\s*(interface|type)\s+[\w<>,\s]+\{[\s\S]*?\n\}/gm, "")
      : code;
    const app = l === "jsx" || l === "tsx"
      ? `<div id="root"></div>
         <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
         <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
         <script crossorigin src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
         <script type="text/babel" data-presets="react">${stripped.replace(/export\s+default\s+/g, "const __App = ")}</script>`
      : `<div id="app"></div><script>${stripped}<\/script>`;
    return shell(app, "");
  }

  /* ---------- per-kind bodies ---------- */
  function jsonBody(code) {
    let html = "";
    try {
      const obj = JSON.parse(String(code).replace(/\/\/.*$/gm, ""));
      html = renderJsonNode(JSON.stringify(obj, null, 2), obj);
    } catch (e) {
      html = `<div class="gp-note gp-bad">Invalid JSON — ${esc(e.message)}</div><pre class="gp-code">${esc(code)}</pre>`;
    }
    return html;
  }

  /* A collapsible JSON tree — far nicer than a wall of text. */
  function renderJsonNode(pretty, value, depth = 0) {
    if (value === null) return `<span class="gp-j-null">null</span>`;
    if (typeof value === "string") return `<span class="gp-j-str">"${esc(value)}"</span>`;
    if (typeof value === "number") return `<span class="gp-j-num">${value}</span>`;
    if (typeof value === "boolean") return `<span class="gp-j-bool">${value}</span>`;
    if (Array.isArray(value)) {
      if (!value.length) return `<span class="gp-j-meta">[]</span>`;
      return `<details ${depth < 2 ? "open" : ""}><summary><span class="gp-j-meta">[${value.length}]</span></summary>` +
        value.map((v, i) => `<div class="gp-j-row"><span class="gp-j-key">${i}</span>${renderJsonNode(pretty, v, depth + 1)}</div>`).join("") +
        `</details>`;
    }
    const keys = Object.keys(value);
    if (!keys.length) return `<span class="gp-j-meta">{}</span>`;
    return `<details ${depth < 2 ? "open" : ""}><summary><span class="gp-j-meta">{${keys.length}}</span></summary>` +
      keys.map((k) => `<div class="gp-j-row"><span class="gp-j-key">${esc(k)}</span>${renderJsonNode(pretty, value[k], depth + 1)}</div>`).join("") +
      `</details>`;
  }

  function csvBody(code) {
    const rows = parseDelimited(String(code));
    if (!rows.length) return `<div class="gp-note">Nothing to show.</div>`;
    const head = rows[0], body = rows.slice(1, 200);
    return `<div class="gp-table-wrap"><table class="gp-table"><thead><tr>${head
      .map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${body
      .map((r) => `<tr>${head.map((_, i) => `<td>${esc(r[i] ?? "")}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div>` +
      (rows.length > 201 ? `<div class="gp-note">Showing first 200 of ${rows.length - 1} rows.</div>` : "");
  }

  function parseDelimited(text) {
    return String(text).replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim()).map((line) => {
      const delim = line.includes("\t") ? "\t" : ",";
      const out = []; let cur = ""; let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (c === delim && !q) { out.push(cur); cur = ""; }
        else cur += c;
      }
      out.push(cur);
      return out;
    });
  }

  function markdownBody(code) {
    const md = TG.MD?.render ? TG.MD.render(code) : `<pre class="gp-code">${esc(code)}</pre>`;
    return `<div class="gp-md">${md}</div>`;
  }

  function pythonBody(code) {
    return `<div class="gp-note">Python runs through the WASM runtime, then prints below.</div>` +
      `<pre class="gp-code gp-python-source">${esc(code)}</pre>` +
      `<div class="gp-console" data-python-out></div>`;
  }

  function mermaidBody(code) {
    return `<div class="gp-mermaid" data-mermaid></div><pre class="gp-code gp-fallback">${esc(code)}</pre>`;
  }

  /* ---------- the panel ---------- */
  function buildPanel(block, code, lang) {
    const kind = kindFor(lang, code);
    if (!kind) return null;

    const wrap = document.createElement("div");
    wrap.className = "gp-panel";
    wrap.dataset.kind = kind.mode;
    wrap.innerHTML =
      `<div class="gp-bar">
         <div class="gp-devices" role="group" aria-label="Preview width">
           <button type="button" data-w="375" title="Mobile">${deviceIcon("mobile")}</button>
           <button type="button" data-w="768" title="Tablet">${deviceIcon("tablet")}</button>
           <button type="button" data-w="full" class="active" title="Full width">${deviceIcon("desktop")}</button>
         </div>
         <span class="gp-title">${esc(kind.label)}</span>
         <span class="gp-spacer"></span>
         <button type="button" class="gp-btn" data-act="reload" title="Reload preview">${TG.ic ? TG.ic("refresh") : ""}Reload</button>
         <button type="button" class="gp-btn" data-act="code" title="Show source">Source</button>
         <button type="button" class="gp-btn" data-act="full" title="Full screen">Expand</button>
         <button type="button" class="gp-btn gp-close" data-act="close" title="Close preview">${TG.ic ? TG.ic("x") : "×"}</button>
       </div>
       <div class="gp-body"></div>
       <div class="gp-console gp-console-hidden" aria-live="polite"></div>`;

    const body = wrap.querySelector(".gp-body");
    const consoleEl = wrap.querySelector(".gp-console");
    let frame = null;
    let frameHost = null;

    const logToConsole = (text, level) => {
      if (!text) return;
      consoleEl.classList.remove("gp-console-hidden");
      const line = document.createElement("div");
      line.className = `gp-log ${level || "log"}`;
      line.textContent = text;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };

    const wireFrame = () => {
      if (!frame) return;
      frame.addEventListener("load", () => {
        try {
          const w = frame.contentWindow;
          if (w) {
            w.addEventListener("error", (e) => logToConsole(e.message, "error"));
          }
        } catch { /* cross-origin (remote includes) — console stays local */ }
      });
    };

    window.addEventListener("message", (e) => {
      const d = e.data;
      if (!d || d.__gp !== 1) return;
      logToConsole(d.text, d.level || (d.type === "error" ? "error" : "log"));
    });

    function renderFrame() {
      frameHost = document.createElement("div");
      frameHost.className = "gp-frame-host";
      frame = document.createElement("iframe");
      frame.className = "gp-frame";
      frame.setAttribute("sandbox", "allow-scripts allow-modals allow-forms allow-popups allow-same-origin");
      frame.setAttribute("title", `${kind.label} preview`);
      frameHost.appendChild(frame);
      body.replaceChildren(frameHost);
      wireFrame();
    }

    function render() {
      consoleEl.replaceChildren();
      consoleEl.classList.add("gp-console-hidden");
      switch (kind.mode) {
        case "frame":
          renderFrame();
          frame.srcdoc = kind.lang === "css" || kind.lang === "js" || kind.lang === "javascript"
            ? shell(kind.lang === "css" ? `<h1>Heading</h1><p>Paragraph with <a href="#">a link</a> and a <button>Button</button>.</p>` : `<div id="app"></div>`,
                   kind.lang === "css" ? `<style>${code}</style>` : `<script>${code}<\/script>`)
            : runtimeDocument(code, kind.lang);
          break;
        case "svg": {
          const doc = shell(String(code).replace(/<\?xml[^>]*\?>/i, ""), "");
          renderFrame();
          frame.srcdoc = doc;
          break;
        }
        case "json": body.innerHTML = jsonBody(code); break;
        case "csv": body.innerHTML = csvBody(code); break;
        case "markdown": body.innerHTML = markdownBody(code); break;
        case "mermaid": {
          body.innerHTML = mermaidBody(code);
          renderMermaid(body.querySelector("[data-mermaid]"), code);
          break;
        }
        case "python": {
          body.innerHTML = pythonBody(code);
          runPython(body.querySelector("[data-python-out]"), code);
          break;
        }
        case "chart": {
          body.innerHTML = `<div class="gp-chart"><canvas data-chart></canvas></div>`;
          renderChart(body.querySelector("[data-chart]"), code);
          break;
        }
      }
    }

    async function renderMermaid(host, src) {
      if (!host) return;
      try {
        if (!window.mermaid) {
          await TG.Visuals?.mermaid?.();
        }
        if (!window.mermaid) throw new Error("Diagram renderer unavailable offline");
        const id = "gpm" + Math.random().toString(36).slice(2);
        const { svg } = await window.mermaid.render(id, src);
        host.innerHTML = svg;
        body.querySelector(".gp-fallback")?.remove();
      } catch {
        /* the escaped source stays visible as a graceful fallback */
      }
    }

    async function runPython(host, src) {
      if (!host) return;
      host.classList.remove("gp-console-hidden");
      host.innerHTML = `<div class="gp-log dim">Starting Python runtime…</div>`;
      try {
        const out = await TG.Executors?.runPythonToString?.(src);
        host.replaceChildren();
        const pre = document.createElement("pre");
        pre.className = "gp-code";
        pre.textContent = out || "(no output)";
        host.appendChild(pre);
      } catch (err) {
        host.innerHTML = `<div class="gp-log error">${esc(err?.message || "Python runtime unavailable")}</div>`;
      }
    }

    function renderChart(canvas, src) {
      if (!canvas) return;
      try {
        const spec = JSON.parse(src);
        TG.Visuals?.chartSpec?.(spec);
        TG.Visuals?.renderChartSpec?.(canvas, spec);
      } catch (err) {
        canvas.replaceWith(Object.assign(document.createElement("div"), { className: "gp-note gp-bad", textContent: "Not a chartable dataset." }));
      }
    }

    /* wire the toolbar */
    wrap.querySelectorAll(".gp-devices button").forEach((b) =>
      b.addEventListener("click", () => {
        wrap.querySelectorAll(".gp-devices button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const w = b.dataset.w;
        if (frameHost) {
          frameHost.style.width = w === "full" ? "100%" : w + "px";
          frameHost.style.margin = w === "full" ? "0" : "0 auto";
        }
      })
    );
    wrap.querySelector("[data-act='reload']").addEventListener("click", render);
    wrap.querySelector("[data-act='close']").addEventListener("click", () => {
      wrap.remove();
      block.classList.remove("gp-open");
    });
    wrap.querySelector("[data-act='full']").addEventListener("click", () => {
      const on = wrap.classList.toggle("gp-fullscreen");
      document.body.classList.toggle("has-fullscreen-preview", on);
      wrap.querySelector("[data-act='full']").textContent = on ? "Exit" : "Expand";
    });
    wrap.querySelector("[data-act='code']").addEventListener("click", () => {
      const showing = wrap.classList.toggle("gp-show-source");
      wrap.querySelector("[data-act='code']").textContent = showing ? "Preview" : "Source";
    });

    render();
    return wrap;
  }

  function deviceIcon(kind) {
    const icons = {
      mobile: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
      tablet: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4.5" y="2.5" width="15" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
      desktop: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 20h8M12 17v3"/></svg>'
    };
    return icons[kind] || "";
  }

  /* ---------- attach to chat code blocks ---------- */
  function decorate(root) {
    const host = root || UI.els?.chatInner;
    if (!host?.querySelectorAll) return;
    host.querySelectorAll(".code-block").forEach((block) => {
      if (block.dataset.gp === "1") return;
      const lang = block.dataset.lang || "";
      let code = "";
      try { code = decodeURIComponent(block.dataset.code || ""); } catch { return; }
      if (!isPreviewable(lang, code)) return;
      block.dataset.gp = "1";

      const head = block.querySelector(".code-head");
      if (!head) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-btn gp-toggle";
      btn.title = "Preview this code";
      btn.innerHTML = `${TG.ic ? TG.ic("eye") : ""}Preview`;
      btn.addEventListener("click", () => {
        const next = block.nextElementSibling;
        if (next && next.classList.contains("gp-panel")) {
          next.remove();
          block.classList.remove("gp-open");
          return;
        }
        const panel = buildPanel(block, code, lang);
        if (!panel) return;
        block.insertAdjacentElement("afterend", panel);
        block.classList.add("gp-open");
        requestAnimationFrame(() => panel.scrollIntoView({ block: "nearest", behavior: "smooth" }));
      });
      head.insertBefore(btn, head.querySelector("[data-code-act='download']") || null);
    });
  }

  function observe() {
    if (!UI.els?.chatInner) {
      setTimeout(observe, 400);
      return;
    }
    const run = () => decorate(UI.els.chatInner);
    run();
    new MutationObserver(() => {
      clearTimeout(observe._t);
      observe._t = setTimeout(run, 140);
    }).observe(UI.els.chatInner, { childList: true, subtree: true });
  }

  /* Auto-open a preview when the assistant just produced a self-contained page. */
  function autoPreviewLast() {
    const blocks = [...(UI.els?.chatInner?.querySelectorAll(".code-block[data-gp='1']") || [])];
    const last = blocks[blocks.length - 1];
    if (!last) return;
    const lang = (last.dataset.lang || "").toLowerCase();
    let code = "";
    try { code = decodeURIComponent(last.dataset.code || ""); } catch { return; }
    if (!["html", "htm", "svg"].includes(lang) && !/^\s*<(!doctype|html)/i.test(code)) return;
    if (last.nextElementSibling?.classList.contains("gp-panel")) return;
    last.querySelector(".gp-toggle")?.click();
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(() => {
    observe();
    window.addEventListener("gradient-app-ready", observe);
  });

  TG.Preview = { decorate, isPreviewable, kindFor, buildPanel, autoPreviewLast, observe };
})();
