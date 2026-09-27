/* The Gradient — universal language preview
   Every source language gets a useful Preview surface. Browser-native / WASM
   runtimes remain runnable; languages without a safe in-browser runtime get a
   source-aware preview instead of a misleading blank iframe. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG || !TG.Canvas) return;

  const C = TG.Canvas;
  if (C.__universalPreviewPatched) return;
  const base = C.renderPreview.bind(C);

  const map = {
    js:["JavaScript",true,"Web Worker runtime"], jsx:["JSX",true,"Use a React/HTML project for full browser preview"], ts:["TypeScript",true,"JavaScript-compatible execution where supported"], tsx:["TSX",false,"Source preview; use a configured frontend project for runtime rendering"],
    py:["Python",true,"Pyodide / WASM runtime"], html:["HTML",true,"Sandboxed browser preview"], htm:["HTML",true,"Sandboxed browser preview"], svg:["SVG",true,"Sandboxed vector preview"], css:["CSS",true,"Stylesheet preview wrapper"], scss:["SCSS",false,"Source preview; compile in a project pipeline"], less:["LESS",false,"Source preview; compile in a project pipeline"],
    json:["JSON",true,"Structured data preview"], jsonc:["JSONC",false,"Source preview"], xml:["XML",true,"Structured markup preview"], csv:["CSV",true,"Tabular data preview"], md:["Markdown",true,"Rendered document preview"], markdown:["Markdown",true,"Rendered document preview"], mermaid:["Mermaid",true,"Diagram preview when the Mermaid renderer is available"],
    c:["C",false,"Source preview; native compilation is not browser-safe by default"], cc:["C++",false,"Source preview; native compilation is not browser-safe by default"], cpp:["C++",false,"Source preview; native compilation is not browser-safe by default"], h:["C Header",false,"Source preview"], hpp:["C++ Header",false,"Source preview"],
    java:["Java",false,"Source preview; use a Java runtime/project toolchain to execute"], kt:["Kotlin",false,"Source preview"], kts:["Kotlin Script",false,"Source preview"], rs:["Rust",false,"Source preview; use a Rust toolchain for native execution"], go:["Go",false,"Source preview; use a Go toolchain for native execution"],
    cs:["C#",false,"Source preview; use .NET for execution"], fs:["F#",false,"Source preview"], php:["PHP",false,"Source preview; server runtime required"], rb:["Ruby",false,"Source preview; Ruby runtime required"], swift:["Swift",false,"Source preview; Swift toolchain required"], dart:["Dart",false,"Source preview; Dart/Flutter runtime required"], lua:["Lua",false,"Source preview"], r:["R",false,"Source preview; R runtime required"], sql:["SQL",false,"Query-aware source preview; database runtime required"], sh:["Shell",false,"Source preview; execution requires a server/terminal runtime"], bash:["Bash",false,"Source preview; execution requires a server/terminal runtime"], ps1:["PowerShell",false,"Source preview; PowerShell runtime required"], yml:["YAML",true,"Structured data preview"], yaml:["YAML",true,"Structured data preview"], toml:["TOML",true,"Structured data preview"], ini:["INI",true,"Configuration preview"],
  };

  function extOf(a) {
    const x = String(a?.ext || a?.lang || "").toLowerCase().replace(/^\./, "");
    return x || "txt";
  }

  function escape(s) {
    return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function structuredPreview(ext, code) {
    if (["json","jsonc"].includes(ext)) {
      try {
        const obj = JSON.parse(String(code).replace(/\/\/.*$/gm, ""));
        const pretty = JSON.stringify(obj, null, 2);
        return `<div class="language-preview-data"><pre>${escape(pretty)}</pre></div>`;
      } catch {}
    }
    if (["csv"].includes(ext)) {
      const rows = String(code).trim().split(/\r?\n/).slice(0, 80).map(r => r.split(","));
      if (rows.length) return `<div class="language-preview-table"><table>${rows.map((r,i)=>`<tr>${r.map(c=>`<${i===0?'th':'td'}>${escape(c)}</${i===0?'th':'td'}>`).join("")}</tr>`).join("")}</table></div>`;
    }
    if (["yml","yaml","toml","ini","xml","sql"].includes(ext)) {
      return `<div class="language-preview-data"><pre>${escape(code)}</pre></div>`;
    }
    return null;
  }

  C.renderPreview = function (a, code, projectFiles, activeFile) {
    const ext = extOf(a);
    if (a?.type === "project" || projectFiles || ["html","htm","svg","document"].includes(ext) || a?.type === "document") {
      return base(a, code, projectFiles, activeFile);
    }
    const info = map[ext] || [String(a?.lang || ext || "Text").toUpperCase(), false, "Source preview"];
    const frame = this.els.preview;
    if (!frame) return;
    frame.classList.remove("doc-preview");
    const data = structuredPreview(ext, code);
    const runButton = info[1] && ["js","ts","py"].includes(ext)
      ? `<button class="btn btn-sm" data-language-run>Run in Console</button>` : "";
    frame.innerHTML = `<div class="language-preview">
      <div class="language-preview-head"><div><strong>${escape(info[0])}</strong><span>${escape(info[2])}</span></div><span class="language-preview-badge">${info[1] ? "Browser/WASM supported" : "Source preview"}</span></div>
      <div class="language-preview-note">${escape(info[1] ? "Live execution is available where the current workspace provides a safe runtime. For other languages this panel previews the source without pretending to compile it." : "This language is displayed safely as source here. Native/server execution requires an external toolchain and is not falsely simulated in the browser.")}</div>
      ${data || `<pre class="language-preview-code">${escape(code)}</pre>`}
      ${runButton}</div>`;
    frame.querySelector("[data-language-run]")?.addEventListener("click", () => {
      this.setTab("console");
      const runner = this.els.consoleRunBtn;
      if (runner) runner.click();
    });
  };

  C.__universalPreviewPatched = true;
  TG.LanguagePreview = { languages: map, preview: (a, code) => C.renderPreview(a, code) };
})();
