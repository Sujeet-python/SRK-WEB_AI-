/* The Gradient 3.2 — resilient UI state
   Small state layer used by the shell. It does not replace the app database. */
(function () {
  "use strict";
  const KEY = "the_gradient_v32_ui";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const state = Object.assign({ mode: "software", sidebarWidth: 292, theme: null, accent: null, density: null }, read());
  window.Gradient32State = {
    get() { return Object.assign({}, state); },
    set(patch) { Object.assign(state, patch || {}); write(state); window.dispatchEvent(new CustomEvent("gradient32-state", { detail: this.get() })); },
    clear() { Object.assign(state, { mode: "software", sidebarWidth: 292, theme: null, accent: null, density: null }); write(state); }
  };
})();
