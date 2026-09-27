/* The Gradient — Studio format engine
   Structured document, slide, spreadsheet and office-file helpers.
   Loaded after app.js so it can reuse the existing provider/storage/export stack. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) throw new Error("The Gradient core must load before studio-formats.js");

  const CDN = {
    xlsx: "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
    mammoth: "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js"
  };

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadScript(url, global) {
    if (window[global]) return Promise.resolve(window[global]);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-studio-loader="${global}"]`);
      if (existing) {
        existing.addEventListener("load", () => window[global] ? resolve(window[global]) : reject(new Error(`${global} did not load.`)), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Could not load ${global}.`)), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.async = true;
      s.dataset.studioLoader = global;
      s.onload = () => window[global] ? resolve(window[global]) : reject(new Error(`${global} did not load.`));
      s.onerror = () => reject(new Error(`Could not load ${global}. Check your connection or content blocker.`));
      document.head.appendChild(s);
    });
  }

  function inlineToText(s) {
    return String(s || "")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~]/g, "")
      .trim();
  }

  function parseMarkdown(md) {
    const lines = String(md || "").replace(/\r/g, "").split("\n");
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^```/.test(line.trim())) {
        const lang = line.trim().slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
        if (i < lines.length) i++;
        blocks.push({ type: "code", lang, text: buf.join("\n") });
        continue;
      }
      const h = line.match(/^(#{1,6})\s+(.+)$/);
      if (h) { blocks.push({ type: "heading", level: h[1].length, text: inlineToText(h[2]) }); i++; continue; }
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { blocks.push({ type: "hr" }); i++; continue; }
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      if (quote.length) { blocks.push({ type: "quote", text: quote.join(" ") }); continue; }
      const list = [];
      let ordered = false;
      while (i < lines.length) {
        const m = lines[i].match(/^\s*(?:[-*+]|(\d+)[.)])\s+(.+)$/);
        if (!m) break;
        if (m[1]) ordered = true;
        list.push(inlineToText(m[2]));
        i++;
      }
      if (list.length) { blocks.push({ type: "list", ordered, items: list }); continue; }
      const para = [line.trim()];
      i++;
      while (i < lines.length && lines[i].trim() && !/^#{1,6}\s+/.test(lines[i]) && !/^```/.test(lines[i].trim()) && !/^\s*(?:[-*+]|\d+[.)])\s+/.test(lines[i])) para.push(lines[i].trim()), i++;
      blocks.push({ type: "paragraph", text: inlineToText(para.join(" ")) });
    }
    return blocks;
  }

  function normalizeDocument(title, markdown) {
    return {
      title: String(title || "Untitled document").trim() || "Untitled document",
      markdown: String(markdown || "").trim(),
      blocks: parseMarkdown(markdown)
    };
  }

  function buildSlides(title, markdown) {
    const blocks = parseMarkdown(markdown);
    const slides = [{ title: title || "Untitled", subtitle: "", bullets: [], paragraphs: [], code: [] }];
    let current = slides[0];
    blocks.forEach((b) => {
      if (b.type === "heading" && b.level <= 2) {
        current = { title: b.text || "Untitled", subtitle: b.level === 1 ? "" : "", bullets: [], paragraphs: [], code: [] };
        slides.push(current);
      } else if (b.type === "heading") {
        current.paragraphs.push(b.text);
      } else if (b.type === "list") {
        current.bullets.push(...b.items);
      } else if (b.type === "paragraph" || b.type === "quote") {
        current.paragraphs.push(b.text);
      } else if (b.type === "code") {
        current.code.push({ lang: b.lang, text: b.text });
      }
    });
    if (slides.length > 1 && !slides[0].bullets.length && !slides[0].paragraphs.length && !slides[0].code.length) slides.shift();
    return slides.length ? slides : [{ title: title || "Untitled", subtitle: "", bullets: [], paragraphs: [], code: [] }];
  }

  function slideHtml(slide, index, total, theme) {
    const dark = theme === "dark";
    const bg = dark ? "#0d111a" : "#ffffff";
    const fg = dark ? "#eef2ff" : "#182033";
    const muted = dark ? "#9da8bf" : "#657087";
    const accent = dark ? "#8da0ff" : "#526bdf";
    const bullets = slide.bullets.map((b) => `<li>${esc(b)}</li>`).join("");
    const paragraphs = slide.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
    const code = slide.code.map((c) => `<pre><code>${esc(c.text)}</code></pre>`).join("");
    return `<section class="studio-slide" style="--studio-bg:${bg};--studio-fg:${fg};--studio-muted:${muted};--studio-accent:${accent}">
      <div class="studio-slide-kicker">${esc(index + 1)} / ${esc(total)}</div>
      <h2>${esc(slide.title)}</h2>
      ${slide.subtitle ? `<div class="studio-slide-subtitle">${esc(slide.subtitle)}</div>` : ""}
      ${paragraphs}
      ${bullets ? `<ul>${bullets}</ul>` : ""}
      ${code}
    </section>`;
  }

  async function pdfBlob(title, markdown) {
    const jsPDF = await TG.Exporters.ensure("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxW = pageW - margin * 2;
    let y = margin;
    const blocks = parseMarkdown(markdown);
    const space = (n) => { if (y + n > pageH - margin) { doc.addPage(); y = margin; } };
    const text = (raw, size, lineH, opts = {}) => {
      doc.setFont(opts.mono ? "courier" : "helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(opts.color || 28, opts.color || 28, opts.color || 35);
      const lines = doc.splitTextToSize(raw || " ", maxW - (opts.indent || 0));
      lines.forEach((ln) => { space(lineH); doc.text(ln, margin + (opts.indent || 0), y); y += lineH; });
    };
    text(title, 20, 26, { bold: true, color: 18 });
    y += 8;
    blocks.forEach((b) => {
      if (b.type === "heading") { y += 4; text(b.text, Math.max(12, 19 - b.level), 20, { bold: true, color: 20 }); y += 3; }
      else if (b.type === "paragraph") { text(b.text, 10.5, 15, { color: 35 }); y += 5; }
      else if (b.type === "quote") { text(b.text, 10.5, 15, { indent: 16, color: 80 }); y += 5; }
      else if (b.type === "list") { b.items.forEach((it, idx) => text(`${b.ordered ? idx + 1 + "." : "•"} ${it}`, 10.5, 15, { indent: 10 })); y += 4; }
      else if (b.type === "code") {
        b.text.split("\n").forEach((ln) => { space(13); doc.setFillColor(244, 245, 248); doc.rect(margin, y - 9.5, maxW, 13, "F"); doc.setFont("courier", "normal"); doc.setFontSize(8.5); doc.setTextColor(35,35,42); doc.text(ln.slice(0, 115), margin + 6, y); y += 13; });
        y += 7;
      } else if (b.type === "hr") { space(14); doc.setDrawColor(205, 208, 216); doc.line(margin, y, pageW - margin, y); y += 14; }
    });
    return doc.output("blob");
  }

  async function docxBlob(title, markdown) {
    const docx = await TG.Exporters.ensure("docx");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, ShadingType } = docx;
    const headings = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
    const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE })];
    parseMarkdown(markdown).forEach((b) => {
      if (b.type === "heading") children.push(new Paragraph({ text: b.text, heading: headings[Math.min(5, b.level - 1)] }));
      else if (b.type === "paragraph") children.push(new Paragraph({ children: [new TextRun(b.text)] }));
      else if (b.type === "quote") children.push(new Paragraph({ children: [new TextRun({ text: b.text, italics: true })], indent: { left: 420 } }));
      else if (b.type === "list") b.items.forEach((it, n) => children.push(new Paragraph({ text: it, bullet: b.ordered ? undefined : { level: 0 }, numbering: b.ordered ? { reference: "studio-num", level: 0 } : undefined })));
      else if (b.type === "code") b.text.split("\n").forEach((ln) => children.push(new Paragraph({ children: [new TextRun({ text: ln || " ", font: "Consolas", size: 18 })], shading: { type: ShadingType.CLEAR, fill: "F2F3F6" } })));
      else if (b.type === "hr") children.push(new Paragraph({ text: "────────────────────────" }));
    });
    const doc = new Document({
      sections: [{ properties: {}, children }],
      numbering: { config: [{ reference: "studio-num", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] }] }
    });
    return Packer.toBlob(doc);
  }

  async function pptxBlob(title, markdown, theme) {
    const Ctor = await TG.Exporters.ensure("pptx");
    const pres = new Ctor();
    pres.defineLayout({ name: "STUDIO", width: 13.333, height: 7.5 });
    pres.layout = "STUDIO";
    const slides = buildSlides(title, markdown);
    const dark = theme === "dark";
    slides.forEach((s, index) => {
      const slide = pres.addSlide();
      slide.background = { color: dark ? "0D111A" : "FFFFFF" };
      slide.addText(`${index + 1}`.padStart(2, "0"), { x: 0.55, y: 0.3, w: 0.45, h: 0.35, fontSize: 10, color: dark ? "9DA8BF" : "6A7487" });
      slide.addText(s.title, { x: 0.75, y: 0.65, w: 11.9, h: 0.8, fontSize: index === 0 ? 30 : 26, bold: true, color: dark ? "EEF2FF" : "182033", breakLine: false });
      let y = 1.65;
      if (s.paragraphs.length) {
        slide.addText(s.paragraphs.slice(0, 3).map((p) => ({ text: p, options: { breakLine: true } })), { x: 0.85, y, w: 11.6, h: 1.3, fontSize: 17, color: dark ? "C6CDDD" : "4A5568", valign: "top", margin: 0.03 });
        y += Math.min(1.8, 0.55 + s.paragraphs.length * 0.35);
      }
      if (s.bullets.length) {
        const items = s.bullets.slice(0, 7).map((b) => ({ text: b, options: { bullet: { indent: 18 }, breakLine: true } }));
        slide.addText(items, { x: 0.95, y, w: 11.2, h: 4.5, fontSize: 18, color: dark ? "EEF2FF" : "263146", valign: "top", paraSpaceAfterPt: 12, margin: 0.02 });
      }
      if (s.code.length) {
        const code = s.code[0].text.split("\n").slice(0, 16).join("\n");
        slide.addText(code, { x: 0.85, y: Math.max(y, 4.65), w: 11.6, h: 1.65, fontFace: "Consolas", fontSize: 11, color: "E8EDF7", fill: { color: "172033" }, margin: 0.08, fit: "shrink" });
      }
      slide.addText("The Gradient Studio", { x: 0.75, y: 7.08, w: 3.5, h: 0.2, fontSize: 8, color: dark ? "77839A" : "8993A5" });
    });
    return pres.write({ outputType: "blob" });
  }

  async function xlsxBlob(title, matrix) {
    await loadScript(CDN.xlsx, "XLSX");
    const wb = XLSX.utils.book_new();
    const rows = Array.isArray(matrix) ? matrix : [];
    const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [["The Gradient Studio"], [title || "Untitled"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const ab = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([ab], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  async function parseOfficeFile(file) {
    const name = String(file.name || "").toLowerCase();
    if (/\.pptx$/.test(name)) {
      const JSZip = await TG.Exporters.ensure("jszip");
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entries = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p));
      entries.sort((a, b) => Number(a.match(/slide(\d+)\.xml/i)[1]) - Number(b.match(/slide(\d+)\.xml/i)[1]));
      const slides = [];
      for (const path of entries) {
        const xml = await zip.files[path].async("text");
        const texts = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\""));
        slides.push({ title: texts[0] || `Slide ${slides.length + 1}`, text: texts.join(" ") });
      }
      return { kind: "pptx", text: slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.text}`).join("\n\n"), slides };
    }
    if (/\.xlsx?$/.test(name)) {
      await loadScript(CDN.xlsx, "XLSX");
      const wb = XLSX.read(await file.arrayBuffer());
      const sheets = wb.SheetNames.map((sheet) => {
        const ws = wb.Sheets[sheet];
        return { name: sheet, rows: XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) };
      });
      return { kind: "xlsx", text: sheets.map((s) => `## ${s.name}\n${s.rows.map((r) => r.join(" | ")).join("\n")}`).join("\n\n"), sheets };
    }
    throw new Error("Unsupported office file.");
  }

  async function extractRichFile(file) {
    const name = String(file.name || "").toLowerCase();
    if (/\.pptx$|\.xlsx?$/.test(name)) return parseOfficeFile(file);
    if (/\.docx$/.test(name)) {
      await loadScript(CDN.mammoth, "mammoth");
      const ab = await file.arrayBuffer();
      const html = (await window.mammoth.convertToHtml({ arrayBuffer: ab })).value;
      const raw = (await window.mammoth.extractRawText({ arrayBuffer: ab })).value;
      return { kind: "docx", html, text: raw };
    }
    if (/\.pdf$/.test(name)) {
      if (!window.pdfjsLib) {
        const mod = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs");
        window.pdfjsLib = mod;
      }
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += `\n\n## Page ${i}\n` + content.items.map((x) => x.str).join(" ");
      }
      return { kind: "pdf", pageCount: pdf.numPages, text: text.trim() };
    }
    const text = await file.text();
    return { kind: "text", text };
  }

  async function addToKnowledge(file, projectId) {
    const rich = await extractRichFile(file);
    const chunks = TG.RAG.chunks(rich.text || "");
    const doc = {
      id: (TG.uid ? TG.uid("doc") : "doc_" + Date.now()),
      projectId: projectId || null,
      name: file.name,
      mime: file.type || "application/octet-stream",
      createdAt: Date.now(),
      chunks: chunks.map((text, i) => ({ id: i, text, terms: TG.RAG.tokenize(text) }))
    };
    if (!TG.Store.documentPut) throw new Error("Knowledge-store support is unavailable in this build.");
    await TG.Store.documentPut(doc);
    await TG.RAG.load();
    return doc;
  }

  const StudioFormats = {
    esc, parseMarkdown, normalizeDocument, buildSlides, slideHtml,
    pdfBlob, docxBlob, pptxBlob, xlsxBlob, parseOfficeFile, extractRichFile, addToKnowledge, loadScript
  };
  window.TheGradient.StudioFormats = StudioFormats;
})();
