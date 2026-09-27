/* The Gradient 3.2 — hidden-tool menu behind the Gradient mark.
   Modes stay in the sidebar; secondary tools live here. */
(function(){
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  let menu = null;
  function close(){ if(!menu)return; menu.classList.remove("open"); menu.setAttribute("aria-hidden","true"); }
  function open(){ if(!menu)return; menu.classList.add("open"); menu.setAttribute("aria-hidden","false"); menu.querySelector("button")?.focus(); }
  function toggle(){ menu?.classList.contains("open") ? close() : open(); }
  function invoke(id){ close(); document.getElementById(id)?.click(); }
  function build(){
    if(menu) return;
    const shell=document.querySelector(".sidebar-header"); if(!shell)return;
    menu=document.createElement("div"); menu.className="g32-brand-menu"; menu.setAttribute("aria-hidden","true");
    menu.innerHTML=`
      <div class="g32-brand-menu-head"><b>The Gradient</b><span>Workspace</span></div>
      <div class="g32-brand-menu-section">
        <button data-action="settings"><span>⚙</span><span><b>Settings</b><small>Providers, appearance and storage</small></span></button>
        <button data-action="projects"><span>▣</span><span><b>Projects</b><small>Project files and workspaces</small></span></button>
        <button data-action="memory"><span>◈</span><span><b>Memory</b><small>Saved context and preferences</small></span></button>
        <button data-action="prompts"><span>✧</span><span><b>Prompt Library</b><small>Reusable AI prompts</small></span></button>
        <button data-action="agent"><span>◇</span><span><b>Agent Lab</b><small>Multi-step AI workflows</small></span></button>
        <button data-action="pipelines"><span>⇄</span><span><b>Pipelines</b><small>Model orchestration</small></span></button>
      </div>`;
    document.body.appendChild(menu);
    const map={settings:"settings-entry-btn",projects:"projects-entry-btn",memory:"memory-entry-btn",prompts:"prompts-entry-btn",agent:"agent-entry-btn",pipelines:"pipelines-entry-btn"};
    menu.querySelectorAll("button[data-action]").forEach(b=>b.addEventListener("click",()=>{
      const id=map[b.dataset.action];
      if(b.dataset.action==="settings"){ close(); TG.Settings?.open?.("provider"); } else invoke(id);
    }));
    menu.addEventListener("click",e=>{ if(e.target===menu) close(); });
    document.addEventListener("pointerdown",e=>{ if(!menu.contains(e.target) && !document.querySelector(".brand-mark")?.contains(e.target)) close(); },true);
    document.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); });
  }
  function init(){ build(); }
  window.Gradient32QuickMenu={open,close,toggle,init};
  document.addEventListener("DOMContentLoaded",init,{once:true});
  window.addEventListener("load",init,{once:true});
})();
