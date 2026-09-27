/* The Gradient 3.6 — shared module hardening */
(function(){
  "use strict";
  const TG=window.TheGradient;
  if(!TG)return;
  TG.uid=TG.uid||function uid(prefix="id"){return `${String(prefix)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;};
  TG.escapeHtml=TG.escapeHtml||function(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");};
  TG.safeDownload=TG.safeDownload||function(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);};
  if(TG.APP){TG.APP.name="The Gradient";TG.APP.version=TG.APP.version||"3.6.0";TG.APP.build=TG.APP.build||"3.6.0";}
  function mark(){const el=document.getElementById("brand-ver");if(el&&TG.APP?.version)el.textContent=TG.APP.version;}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mark,{once:true});else mark();
  window.addEventListener("gradient-app-ready",mark,{once:true});

  const MODE_KEYS = {learn:"learnAI", software:"softwareAI", canvas:"canvasAI", imagine:"imagineAI", documents:"documentsAI"};
  const MODE_MODEL_KEYS = {learn:"learnModel", software:"softwareModel", canvas:"canvasModel", imagine:"imagineModel", documents:"documentsModel"};
  const MODE_LABELS = {learn:"Learn", software:"Software Development", canvas:"Canvas", imagine:"Imagine", documents:"Documents"};
  const imageProviders = () => Object.entries(TG.APP?.providers || {}).filter(([id,p]) => Array.isArray(p.imageModels) && p.imageModels.length);
  const chatProviders = () => Object.entries(TG.APP?.providers || {}).filter(([id,p]) => Array.isArray(p.models) && p.models.length);
  const ready = p => !p.needsKey || !!(TG.State?.apiKeys?.[p.id] || "").trim();

  TG.ModeAI = {
    labels: MODE_LABELS,
    providerEntries(mode){ return mode === "imagine" ? imageProviders() : chatProviders(); },
    provider(mode){
      const key = MODE_KEYS[mode];
      const entries = this.providerEntries(mode);
      const saved = TG.State.settings[key];
      if (saved && entries.some(([id])=>id===saved)) return saved;
      const preferred = mode === "imagine" || mode === "documents" ? "gemini" : TG.State.settings.provider;
      if (entries.some(([id])=>id===preferred)) { TG.State.settings[key]=preferred; return preferred; }
      const fallback = entries[0]?.[0] || "simulation";
      TG.State.settings[key]=fallback;
      return fallback;
    },
    models(mode){
      const pid=this.provider(mode);
      const p=TG.APP.providers?.[pid] || {};
      return (mode === "imagine" ? p.imageModels : p.models) || [];
    },
    model(mode){
      const key=MODE_MODEL_KEYS[mode];
      const list=this.models(mode);
      const saved=TG.State.settings[key];
      if(saved && list.some(m=>m.id===saved)) return saved;
      const value=list[0]?.id || "";
      TG.State.settings[key]=value;
      if(mode === "software" && TG.State.uiMode === "software"){ TG.State.settings.provider=this.provider(mode); TG.State.settings.model=value; }
      return value;
    },
    setProvider(mode,pid){
      const key=MODE_KEYS[mode]; TG.State.settings[key]=pid;
      const list=this.models(mode); const next=list[0]?.id || "";
      TG.State.settings[MODE_MODEL_KEYS[mode]]=next;
      if(mode === "software"){ TG.State.settings.provider=pid; TG.State.settings.model=next; TG.App?.persistSettings?.(); TG.App?.updateHeader?.(); }
      else TG.App?.persistSettings?.();
      window.dispatchEvent(new CustomEvent("gradient-mode-ai-changed",{detail:{mode,provider:pid,model:next}}));
    },
    setModel(mode,model){
      TG.State.settings[MODE_MODEL_KEYS[mode]]=model;
      if(mode === "software"){ TG.State.settings.provider=this.provider(mode); TG.State.settings.model=model; TG.App?.persistSettings?.(); TG.App?.updateHeader?.(); }
      else TG.App?.persistSettings?.();
      window.dispatchEvent(new CustomEvent("gradient-mode-model-changed",{detail:{mode,model}}));
    }
  };

  // Keep the existing Settings layout and controls intact; replace only the old
  // global model selector with mode-specific provider selectors as requested.
  if(TG.Settings?.provider && !TG.Settings.__modeAIRoutingPatched){
    const baseProvider=TG.Settings.provider.bind(TG.Settings);
    TG.Settings.provider=function(body){
      baseProvider(body);
      const modelSelect=body.querySelector("#model-select");
      const oldModelGroup=modelSelect?.closest(".field-group");
      if(oldModelGroup) oldModelGroup.hidden=true;
      const modeBlock=document.createElement("div");
      modeBlock.className="field-group gradient-mode-ai-routing";
      modeBlock.innerHTML=`<label class="field-label">AI selection by workspace</label><p class="field-hint">Choose the AI provider here. Choose the specific model inside its workspace.</p><div class="field-group" style="margin-top:10px"><label class="field-label" for="mode-ai-learn">Learn AI</label><select id="mode-ai-learn"></select></div><div class="field-group" style="margin-top:10px"><label class="field-label" for="mode-ai-software">Software Development AI</label><select id="mode-ai-software"></select></div><div class="field-group" style="margin-top:10px"><label class="field-label" for="mode-ai-imagine">Imagine AI</label><select id="mode-ai-imagine"></select></div><div class="field-group" style="margin-top:10px"><label class="field-label" for="mode-ai-canvas">Canvas AI</label><select id="mode-ai-canvas"></select></div><div class="field-group" style="margin-top:10px"><label class="field-label" for="mode-ai-documents">Documents AI</label><select id="mode-ai-documents"></select></div>`;
      const keySection=body.querySelector("#key-section");
      (keySection || body).after(modeBlock);
      ["learn","software","imagine","canvas","documents"].forEach(mode=>{
        const sel=modeBlock.querySelector(`#mode-ai-${mode}`);
        if(!sel) return;
        TG.ModeAI.providerEntries(mode).forEach(([id,p])=>{ const o=document.createElement("option"); o.value=id; o.textContent=p.label+(p.needsKey && !ready({id,needsKey:p.needsKey})?" · needs key":""); if(id===TG.ModeAI.provider(mode)) o.selected=true; sel.appendChild(o); });
        sel.addEventListener("change",()=>TG.ModeAI.setProvider(mode,sel.value));
      });
    };
    TG.Settings.__modeAIRoutingPatched=true;
  }

  // Software model picker: searchable, model-only; provider is chosen above in Settings.
  function softwareModelPicker(rect){
    document.querySelector(".gradient-software-model-picker")?.remove();
    const provider=TG.ModeAI.provider("software"); const cfg=TG.APP.providers?.[provider]||{}; const models=TG.ModeAI.models("software");
    const panel=document.createElement("div"); panel.className="gradient-software-model-picker";
    panel.innerHTML=`<div class="gmp-head"><div><b>${TG.escapeHtml(cfg.label||provider)}</b><span>Software Development models</span></div><button type="button" aria-label="Close">×</button></div><input class="gmp-search" placeholder="Search models…" autocomplete="off"/><div class="gmp-list"></div>`;
    Object.assign(panel.style,{position:"fixed",zIndex:"10000",width:"min(420px,calc(100vw - 24px))",maxHeight:"min(560px,calc(100vh - 24px))",overflow:"hidden",display:"flex",flexDirection:"column",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"14px",boxShadow:"0 24px 70px rgba(0,0,0,.38)",padding:"10px"});
    document.body.appendChild(panel);
    let left=Math.min(window.innerWidth-12-panel.offsetWidth,Math.max(12,rect.left)); let top=Math.min(window.innerHeight-12-panel.offsetHeight,Math.max(12,rect.bottom+8)); panel.style.left=`${left}px`; panel.style.top=`${top}px`;
    const search=panel.querySelector(".gmp-search"), list=panel.querySelector(".gmp-list");
    list.style.cssText="overflow:auto;display:flex;flex-direction:column;gap:4px;padding-top:8px"; search.style.cssText="width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);color:var(--text-primary);outline:none";
    const render=()=>{const q=search.value.trim().toLowerCase(); list.replaceChildren(); const rows=models.filter(m=>(m.label||m.id).toLowerCase().includes(q)); rows.forEach(m=>{const b=document.createElement("button");b.type="button";b.textContent=m.label||m.id;b.style.cssText="padding:9px 10px;border:1px solid transparent;background:transparent;color:var(--text-primary);border-radius:9px;text-align:left;cursor:pointer";if(m.id===TG.State.settings.softwareModel)b.style.background="var(--accent-soft)";b.onmouseenter=()=>b.style.background="var(--accent-soft)";b.onmouseleave=()=>{if(m.id!==TG.State.settings.softwareModel)b.style.background="transparent"};b.onclick=()=>{TG.ModeAI.setModel("software",m.id);panel.remove();};list.appendChild(b);}); if(!rows.length){const e=document.createElement("div");e.textContent="No matching models";e.style.cssText="padding:12px;color:var(--text-tertiary);font-size:12px";list.appendChild(e);}};
    panel.querySelector("button").onclick=()=>panel.remove(); search.oninput=render; search.focus(); render();
    const close=e=>{if(!panel.contains(e.target)&&e.target!==TG.UI.els.modelPill){panel.remove();document.removeEventListener("pointerdown",close,true);}}; setTimeout(()=>document.addEventListener("pointerdown",close,true),0);
  }
  if(TG.ImageGen && !TG.ImageGen.__modeAIChoicePatched){
    TG.ImageGen.defaultChoice = function(){
      const pid=TG.ModeAI?.provider("imagine") || TG.State.settings.imagineAI || "gemini";
      const list=(TG.APP.providers?.[pid]?.imageModels)||[];
      const model=TG.ModeAI?.model("imagine") || TG.State.settings.imagineModel || list[0]?.id || (pid === "gemini" ? "gemini-3.1-flash-image" : "flux");
      return {provider:pid,model};
    };
    TG.ImageGen.__modeAIChoicePatched=true;
  }

  if(TG.App?.openModelMenu && !TG.App.__modeSearchPickerPatched){
    const baseModelMenu=TG.App.openModelMenu.bind(TG.App);
    TG.App.openModelMenu=function(rect){ if(TG.State.uiMode==="software") return softwareModelPicker(rect); return baseModelMenu(rect); };
    TG.App.__modeSearchPickerPatched=true;
  }
})();
