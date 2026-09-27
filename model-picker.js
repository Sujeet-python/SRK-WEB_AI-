/* The Gradient 3.6 — Model picker
   Replaces the floating context menu for model selection with a real panel
   anchored to the model pill: search, grouped by provider, sticky header,
   scrolls inside the page, and a click-outside backdrop. No stray "×", small
   but readable type. */
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { UI, State } = TG;
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  let openPanel = null;

  function close() {
    if (!openPanel) return;
    openPanel.panel.classList.remove("open");
    document.removeEventListener("click", openPanel.onDoc, true);
    document.removeEventListener("keydown", openPanel.onKey, true);
    window.removeEventListener("resize", openPanel.reposition);
    const p = openPanel.panel;
    openPanel = null;
    setTimeout(() => p.remove(), 140);
  }

  function modelsFor(pid, cfg) {
    return (cfg.models || []).map((m) => ({ pid, model: m, label: m.label || m.id }));
  }

  function buildRows(query) {
    const s = State.settings;
    const q = (query || "").trim().toLowerCase();
    const groups = [];
    const ordered = [s.provider, ...Object.keys(TG.APP.providers).filter((p) => p !== s.provider)];
    ordered.forEach((pid) => {
      const cfg = TG.APP.providers[pid];
      if (!cfg) return;
      const ready = !cfg.needsKey || (State.apiKeys[pid] || "").trim();
      let list = modelsFor(pid, cfg);
      if (q) list = list.filter((m) => m.label.toLowerCase().includes(q) || m.model.id.toLowerCase().includes(q) || cfg.label.toLowerCase().includes(q));
      if (q && !list.length) return;
      groups.push({ pid, cfg, ready, list });
    });
    return groups;
  }

  function render(panel, query) {
    const s = State.settings;
    const host = panel.querySelector(".mp-list");
    const groups = buildRows(query);
    if (!groups.length) {
      host.innerHTML = `<div class="mp-empty">No model matches that search.</div>`;
      return;
    }
    host.innerHTML = groups
      .map((g) => {
        const isCurrent = g.pid === s.provider;
        const dots = g.ready
          ? `<span class="mp-ready" title="Ready"></span>`
          : `<span class="mp-nokey" title="Needs an API key">${TG.Icon.key || ""}</span>`;
        const rows = g.list
          .map((m) => {
            const active = g.pid === s.provider && m.model.id === s.model;
            const meta = [m.model.context ? `${Math.round(m.model.context / 1000)}K` : "", m.model.note || m.model.desc || ""].filter(Boolean).join(" · ");
            return `<button class="mp-row${active ? " active" : ""}" data-pid="${esc(g.pid)}" data-model="${esc(m.model.id)}">
              <span class="mp-check">${active ? TG.Icon.check || "" : ""}</span>
              <span class="mp-row-main">
                <span class="mp-row-label">${esc(m.label)}</span>
                ${meta ? `<span class="mp-row-meta">${esc(meta)}</span>` : ""}
              </span>
            </button>`;
          })
          .join("");
        return `<div class="mp-group${isCurrent ? " current" : ""}">
            <div class="mp-group-head">
              <span class="mp-group-name">${esc(g.cfg.label)}</span>
              ${dots}
            </div>
            ${rows}
            ${g.ready ? "" : `<button class="mp-needkey" data-pid="${esc(g.pid)}">Add ${esc(g.cfg.label)} key</button>`}
          </div>`;
      })
      .join("");
  }

  function open(rect) {
    if (openPanel) { close(); return; }
    const hostRect = (rect && rect.width) ? rect : UI.els.modelPill.getBoundingClientRect();
    const panel = document.createElement("div");
    panel.className = "mp-panel";
    panel.innerHTML =
      `<div class="mp-head">
         <input class="mp-search" type="text" placeholder="Search models…" autocomplete="off" spellcheck="false">
         <button class="mp-settings" title="Provider settings">${TG.Icon.settings || ""}</button>
       </div>
       <div class="mp-list"></div>
       <div class="mp-foot">
         <span class="mp-count"></span>
         <span class="mp-hint">Ctrl M</span>
       </div>`;
    document.body.appendChild(panel);
    render(panel, "");

    const place = () => {
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const vw = innerWidth, vh = innerHeight, gap = 10;
      let left = hostRect.left + hostRect.width / 2 - w / 2;
      left = Math.min(Math.max(gap, left), Math.max(gap, vw - w - gap));
      /* Always prefer opening upward from the composer pill. */
      let top = hostRect.top - h - 8;
      if (top < gap) top = Math.min(hostRect.bottom + 8, vh - h - gap);
      top = Math.min(Math.max(gap, top), Math.max(gap, vh - h - gap));
      panel.style.left = Math.round(left) + "px";
      panel.style.top = Math.round(top) + "px";
    };
    place();
    requestAnimationFrame(() => { place(); panel.classList.add("open"); });

    const count = panel.querySelector(".mp-count");
    const updateCount = () => {
      const total = buildRows(panel.querySelector(".mp-search").value).reduce((n, g) => n + g.list.length, 0);
      count.textContent = `${total} model${total === 1 ? "" : "s"}`;
    };
    updateCount();

    const list = panel.querySelector(".mp-list");
    panel.querySelector(".mp-search").addEventListener("input", (e) => { render(panel, e.target.value); updateCount(); });
    panel.querySelector(".mp-settings").addEventListener("click", () => { close(); TG.Settings.open("provider"); });
    list.addEventListener("click", (e) => {
      const keyBtn = e.target.closest(".mp-needkey");
      if (keyBtn) { close(); TG.Settings.open("provider"); return; }
      const row = e.target.closest(".mp-row");
      if (!row) return;
      const { pid, model } = row.dataset;
      close();
      TG.App.switchModel(pid, model);
    });
    /* Keyboard: type to search, arrows to move, Enter to pick. */
    panel.querySelector(".mp-search").addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const rows = [...list.querySelectorAll(".mp-row")];
        const idx = rows.findIndex((r) => r.classList.contains("kp-focus"));
        let next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
        if (next < 0) next = rows.length - 1;
        if (next >= rows.length) next = 0;
        rows.forEach((r) => r.classList.remove("kp-focus"));
        rows[next]?.classList.add("kp-focus");
        rows[next]?.scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter") {
        const row = list.querySelector(".mp-row.kp-focus") || list.querySelector(".mp-row");
        if (row) { const { pid, model } = row.dataset; close(); TG.App.switchModel(pid, model); }
      }
    });

    const onDoc = (e) => { if (!panel.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    setTimeout(() => {
      document.addEventListener("click", onDoc, true);
      document.addEventListener("keydown", onKey, true);
    }, 0);
    window.addEventListener("resize", place);
    openPanel = { panel, onDoc, onKey, reposition: place };
    setTimeout(() => panel.querySelector(".mp-search")?.focus(), 30);
  }

  /* ---------- install ---------- */
  function install() {
    if (!TG.UI?.els?.modelPill) { setTimeout(install, 300); return; }
    const pill = TG.UI.els.modelPill;
    if (pill.dataset.mpHooked === "1") return;
    pill.dataset.mpHooked = "1";
    pill.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      open(pill.getBoundingClientRect());
    }, true);
    /* keyboard shortcut opens the panel too */
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        open(pill.getBoundingClientRect());
      }
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(() => {
    install();
    window.addEventListener("gradient-app-ready", () => setTimeout(install, 200));
  });

  TG.ModelPicker = { open, close };
})();
