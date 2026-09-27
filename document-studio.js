/* The Gradient — Document Studio
   A focused document/slide/spreadsheet workspace layered on top of the core app. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  const F = TG.StudioFormats;
  if (!TG || !F) throw new Error("Studio core is missing.");

  const STORE_KEY = "studio_draft_v1";
  const state = { title: "Untitled document", type: "document", theme: "dark", markdown: "# Untitled document\n\nStart writing here…", slideIndex: 0, blobUrl: null, pendingPrompt: "", autoGenerate: false };

  function toast(message, error) {
    if (TG.UI && TG.UI.toast) TG.UI.toast(message, error ? { error: true } : undefined);
  }
  function closeBlobUrl() {
    if (state.blobUrl) { URL.revokeObjectURL(state.blobUrl); state.blobUrl = null; }
  }
  function saveDraft() {
    if (TG.Store && TG.Store.kvSet) TG.Store.kvSet(STORE_KEY, { title: state.title, type: state.type, theme: state.theme, markdown: state.markdown, savedAt: Date.now() });
  }
  async function loadDraft() {
    if (!TG.Store || !TG.Store.kvGet) return;
    const saved = await TG.Store.kvGet(STORE_KEY, null);
    if (saved && typeof saved === "object") Object.assign(state, saved);
  }

  function renderPreview(body, root) {
    const preview = root.querySelector("#studio-preview");
    if (!preview) return;
    closeBlobUrl();
    const type = root.querySelector("#studio-type").value;
    state.type = type;
    state.theme = root.querySelector("#studio-theme").value;
    state.markdown = root.querySelector("#studio-source").value;
    state.title = root.querySelector("#studio-title").value || "Untitled document";

    if (type === "html") {
      const iframe = document.createElement("iframe");
      iframe.className = "studio-preview-frame";
      iframe.sandbox.add("allow-scripts", "allow-forms", "allow-modals", "allow-popups");
      iframe.srcdoc = state.markdown;
      preview.replaceChildren(iframe);
      return;
    }
    if (type === "slides" || type === "pptx") {
      const slides = F.buildSlides(state.title, state.markdown);
      state.slideIndex = Math.max(0, Math.min(state.slideIndex, slides.length - 1));
      const deck = document.createElement("div");
      deck.className = "studio-deck";
      deck.innerHTML = F.slideHtml(slides[state.slideIndex], state.slideIndex, slides.length, state.theme);
      const controls = document.createElement("div");
      controls.className = "studio-slide-controls";
      controls.innerHTML = `<button class="btn btn-sm" data-nav="prev">‹ Prev</button><span>${state.slideIndex + 1} / ${slides.length}</span><button class="btn btn-sm" data-nav="next">Next ›</button>`;
      controls.querySelector("[data-nav='prev']").disabled = state.slideIndex === 0;
      controls.querySelector("[data-nav='next']").disabled = state.slideIndex === slides.length - 1;
      controls.querySelector("[data-nav='prev']").onclick = () => { state.slideIndex--; renderPreview(body, root); };
      controls.querySelector("[data-nav='next']").onclick = () => { state.slideIndex++; renderPreview(body, root); };
      deck.appendChild(controls);
      preview.replaceChildren(deck);
      return;
    }
    if (type === "pdf") {
      preview.innerHTML = `<div class="studio-preview-loading">Building a live PDF preview…</div>`;
      F.pdfBlob(state.title, state.markdown).then((blob) => {
        state.blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.className = "studio-preview-frame";
        iframe.src = state.blobUrl;
        preview.replaceChildren(iframe);
      }).catch((e) => { preview.innerHTML = `<div class="studio-error">${escapeHtml(e.message)}</div>`; });
      return;
    }
    if (type === "docx") {
      preview.innerHTML = `<article class="studio-document-preview"><h1>${escapeHtml(state.title)}</h1>${markdownToSimpleHtml(state.markdown)}</article>`;
      return;
    }
    if (type === "spreadsheet") {
      preview.innerHTML = spreadsheetPreview(state.markdown);
      return;
    }
    const article = document.createElement("article");
    article.className = "studio-document-preview";
    article.innerHTML = markdownToSimpleHtml(state.markdown);
    preview.replaceChildren(article);
  }

  function escapeHtml(text) {
    return F.esc(text);
  }

  function markdownToSimpleHtml(md) {
    const blocks = F.parseMarkdown(md);
    return blocks.map((b) => {
      if (b.type === "heading") return `<h${Math.min(6, b.level)}>${escapeHtml(b.text)}</h${Math.min(6, b.level)}>`;
      if (b.type === "paragraph") return `<p>${escapeHtml(b.text)}</p>`;
      if (b.type === "quote") return `<blockquote>${escapeHtml(b.text)}</blockquote>`;
      if (b.type === "list") return `<${b.ordered ? "ol" : "ul"}>${b.items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
      if (b.type === "code") return `<pre><code>${escapeHtml(b.text)}</code></pre>`;
      return `<hr>`;
    }).join("\n");
  }

  function spreadsheetPreview(markdown) {
    const rows = String(markdown || "").split(/\n/).filter(Boolean).map((r) => r.split("\t").length > 1 ? r.split("\t") : r.split(","));
    if (!rows.length) return `<div class="studio-empty">Enter comma-separated or tab-separated rows.</div>`;
    return `<div class="studio-table-wrap"><table>${rows.map((r, i) => `<tr>${r.map((c) => { const tag = i === 0 ? "th" : "td"; return `<${tag}>${escapeHtml(c.trim())}</${tag}>`; }).join("")}</tr>`).join("")}</table></div>`;
  }

  async function exportCurrent(kind) {
    state.title = document.getElementById("studio-title").value || "Untitled document";
    state.markdown = document.getElementById("studio-source").value;
    state.type = document.getElementById("studio-type").value;
    saveDraft();
    const base = state.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "document";
    try {
      toast(`Building ${kind.toUpperCase()}…`);
      let blob;
      if (kind === "pdf") blob = await F.pdfBlob(state.title, state.markdown);
      else if (kind === "docx") blob = await F.docxBlob(state.title, state.markdown);
      else if (kind === "pptx") blob = await F.pptxBlob(state.title, state.markdown, state.theme);
      else if (kind === "xlsx") {
        const rows = state.markdown.split(/\n/).filter(Boolean).map((r) => r.split(/\t|,/).map((c) => c.trim()));
        blob = await F.xlsxBlob(state.title, rows);
      } else {
        const type = kind === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8";
        blob = new Blob([state.markdown], { type });
      }
      TG.Exporters.saveBlob(blob, `${base}.${kind === "markdown" ? "md" : kind}`);
      toast(`${kind.toUpperCase()} created`);
    } catch (e) {
      toast(e.message || `Couldn't create ${kind}.`, true);
    }
  }

  async function importFile(file, root) {
    if (!file) return;
    try {
      toast(`Reading ${file.name}…`);
      const rich = await F.extractRichFile(file);
      const name = file.name.replace(/\.[^.]+$/, "");
      if (rich.kind === "pptx") state.type = "pptx";
      else if (rich.kind === "xlsx") state.type = "spreadsheet";
      else if (rich.kind === "pdf") state.type = "pdf";
      else if (rich.kind === "docx") state.type = "docx";
      else state.type = "document";
      state.title = name || state.title;
      state.markdown = rich.text || "";
      root.querySelector("#studio-title").value = state.title;
      root.querySelector("#studio-type").value = state.type;
      root.querySelector("#studio-source").value = state.markdown;
      state.slideIndex = 0;
      renderPreview(root.querySelector(".pro-body"), root);
      toast(`Imported ${file.name}`);
      saveDraft();
    } catch (e) {
      toast(e.message || "Import failed.", true);
    }
  }

  async function addToKnowledge(root) {
    const input = root.querySelector("#studio-file");
    const file = input && input.files && input.files[0];
    if (!file) return toast("Choose a PDF, Word, PowerPoint, spreadsheet, or text file first.", true);
    try {
      const project = TG.State.projectFilter && TG.Projects ? TG.Projects.byId(TG.State.projectFilter) : null;
      const doc = await F.addToKnowledge(file, project && project.id);
      toast(`Added ${doc.name} to the local knowledge base.`);
    } catch (e) {
      toast(e.message || "Could not add file to the knowledge base.", true);
    }
  }

  async function open(options = {}) {
    await loadDraft();
    if (options.initialPrompt) state.pendingPrompt = String(options.initialPrompt);
    if (options.initialType) state.type = String(options.initialType);
    state.autoGenerate = !!options.autoGenerate;
    if (!state.pendingPrompt) state.autoGenerate = false;
    TG.ProOverlay.open({
      title: "Document Studio",
      build: (body) => {
        const modal = body.closest(".modal");
        if (modal) modal.classList.add("studio-modal");
        body.innerHTML = `
          <div class="studio-shell">
            <aside class="studio-side">
              <div class="studio-section-label">Workspace</div>
              <label class="field"><span>Title</span><input id="studio-title" type="text" value="${escapeHtml(state.title)}"></label>
              <label class="field"><span>Output</span><select id="studio-type">
                <option value="document">Document / Markdown</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word (.docx)</option>
                <option value="pptx">PowerPoint (.pptx)</option>
                <option value="slides">Slide preview</option>
                <option value="html">HTML page</option>
                <option value="spreadsheet">Spreadsheet</option>
              </select></label>
              <label class="field"><span>Theme</span><select id="studio-theme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
              <div class="studio-section-label">Import & Knowledge</div>
              <input id="studio-file" type="file" accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.json,.md,.txt,.html,.htm,.xml,.py,.js,.ts,.css">
              <button class="btn" id="studio-import">Import into Studio</button>
              <button class="btn" id="studio-knowledge">Add to Knowledge Base</button>
              <div class="studio-help">Files are processed in your browser. Imported office content is converted into editable text/structure for the studio.</div>
              <div class="studio-section-label">Create</div>
              <button class="btn btn-primary" id="studio-generate">Generate with AI</button>
            </aside>
            <main class="studio-main">
              <div class="studio-toolbar">
                <div class="studio-tabs"><button class="studio-tab active" data-stab="edit">Edit</button><button class="studio-tab" data-stab="preview">Preview</button><button class="studio-tab" data-stab="slides">Slides</button></div>
                <div class="studio-actions">
                  <button class="btn btn-sm" data-export="markdown">MD</button><button class="btn btn-sm" data-export="pdf">PDF</button><button class="btn btn-sm" data-export="docx">DOCX</button><button class="btn btn-primary btn-sm" data-export="pptx">PPTX</button><button class="btn btn-sm" data-export="xlsx">XLSX</button>
                </div>
              </div>
              <div class="studio-editor-view" id="studio-edit-view"><textarea id="studio-source" spellcheck="false">${escapeHtml(state.markdown)}</textarea></div>
              <div class="studio-preview-view hidden" id="studio-preview-view"><div id="studio-preview"></div></div>
              <div class="studio-preview-view hidden" id="studio-slides-view"><div id="studio-slide-preview"></div></div>
              <div class="studio-status" id="studio-status">Local draft · autosaves while you edit</div>
            </main>
          </div>`;

        const title = body.querySelector("#studio-title");
        const type = body.querySelector("#studio-type");
        const theme = body.querySelector("#studio-theme");
        const source = body.querySelector("#studio-source");
        title.value = state.title;
        type.value = state.type;
        theme.value = document.documentElement.getAttribute("data-theme") === "light" ? "light" : (state.theme || "dark");
        source.value = state.markdown;

        const update = () => {
          state.title = title.value || "Untitled document";
          state.type = type.value;
          state.theme = theme.value;
          state.markdown = source.value;
          saveDraft();
          renderPreview(body, body);
          renderSlides(body);
        };
        let timer;
        source.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(update, 220); });
        [title, type, theme].forEach((el) => el.addEventListener("change", update));
        body.querySelector("#studio-import").onclick = () => importFile(body.querySelector("#studio-file").files[0], body);
        body.querySelector("#studio-knowledge").onclick = () => addToKnowledge(body);
        body.querySelectorAll("[data-export]").forEach((b) => b.onclick = () => exportCurrent(b.dataset.export));
        const generateWithAI = async () => {
          const request = state.pendingPrompt || state.markdown || `Create a polished ${type.value} titled ${state.title}.`;
          const kind = type.value;
          const schemaHint = kind === "pptx" || kind === "slides" ? "Return a presentation outline in Markdown using # for the presentation title and ## for each slide title, with concise bullet points per slide." :
            kind === "spreadsheet" ? "Return CSV or tab-separated rows with a header row first. Do not wrap in a code fence." :
            "Return clean Markdown only, with a strong title, headings, lists and tables when useful.";
          const system = `You are The Gradient's document-generation engine. Create finished, coherent source content from the user's request. ${schemaHint} Do not talk about being an AI, do not say you are writing a prompt, and do not merely give instructions for creating the document. Return the actual document content.`;
          const button = body.querySelector("#studio-generate");
          if(button) { button.disabled=true; button.textContent="Generating…"; }
          try {
            if (!TG.AIHub?.text) throw new Error("The AI document engine is unavailable. Connect a model in Settings.");
            const result = await TG.AIHub.text({task:"documents",messages:[{role:"system",content:system},{role:"user",content:request}],signal:undefined});
            if(!result) throw new Error("The selected model returned no document content.");
            state.markdown = String(result).replace(/^```(?:markdown|text|csv|tsv)?\s*|\s*```$/g, "").trim();
            state.pendingPrompt = "";
            source.value = state.markdown;
            if(!state.title || state.title === "Untitled document") { const first=(state.markdown.match(/^#\s+(.+)$/m)||[])[1]; if(first) { state.title=first.trim(); title.value=state.title; } }
            update();
            setTab("preview", body);
            UI.toast?.("Document created");
          } catch(e) { UI.toast?.(e.message || "Document generation failed", {error:true}); }
          finally { if(button) { button.disabled=false; button.textContent="Generate with AI"; } }
        };
        body.querySelector("#studio-generate").onclick = generateWithAI;
        if(state.pendingPrompt && state.autoGenerate) setTimeout(generateWithAI, 80);
        body.querySelectorAll("[data-stab]").forEach((b) => b.onclick = () => setTab(b.dataset.stab, body));
        update();
        const onTheme=()=>{ state.theme=document.documentElement.getAttribute("data-theme")==="light"?"light":"dark"; theme.value=state.theme; saveDraft(); };
        window.addEventListener("gradient-theme-change",onTheme,{once:false});
      }
    });
  }

  function setTab(tab, body) {
    body.querySelectorAll(".studio-tab").forEach((b) => b.classList.toggle("active", b.dataset.stab === tab));
    body.querySelector("#studio-edit-view").classList.toggle("hidden", tab !== "edit");
    body.querySelector("#studio-preview-view").classList.toggle("hidden", tab !== "preview");
    body.querySelector("#studio-slides-view").classList.toggle("hidden", tab !== "slides");
    if (tab === "preview") renderPreview(body, body);
    if (tab === "slides") renderSlides(body);
  }

  function renderSlides(body) {
    const out = body.querySelector("#studio-slide-preview");
    if (!out) return;
    const title = body.querySelector("#studio-title").value || "Untitled";
    const md = body.querySelector("#studio-source").value;
    const slides = F.buildSlides(title, md);
    state.slideIndex = Math.max(0, Math.min(state.slideIndex, slides.length - 1));
    const slide = slides[state.slideIndex];
    out.innerHTML = F.slideHtml(slide, state.slideIndex, slides.length, state.theme) + `<div class="studio-slide-controls"><button class="btn btn-sm" id="slide-prev">‹</button><span>${state.slideIndex + 1} / ${slides.length}</span><button class="btn btn-sm" id="slide-next">›</button></div>`;
    body.querySelector("#slide-prev").disabled = state.slideIndex === 0;
    body.querySelector("#slide-next").disabled = state.slideIndex === slides.length - 1;
    body.querySelector("#slide-prev").onclick = () => { state.slideIndex--; renderSlides(body); };
    body.querySelector("#slide-next").onclick = () => { state.slideIndex++; renderSlides(body); };
  }

  const Studio = { open, state, exportCurrent };
  window.TheGradient.DocumentStudio = Studio;
  window.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("studio-entry-btn");
    if (sidebar) sidebar.addEventListener("click", () => Studio.open());
    const palette = TG.Palette && TG.Palette.commands;
    if (TG.Palette && palette && !TG.Palette.__studioPatched) {
      const base = TG.Palette.commands.bind(TG.Palette);
      TG.Palette.commands = function () { return [{ group: "Studio", title: "Open Document Studio", sub: "PDF · Word · PowerPoint · spreadsheets", icon: "file", run: () => Studio.open() }].concat(base()); };
      TG.Palette.__studioPatched = true;
    }
  });
})();
