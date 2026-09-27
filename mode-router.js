/* The Gradient 3.6 — authoritative workspace router */
(function(){
  "use strict";
  const TG=window.TheGradient;if(!TG)return;
  const modules=()=>window.TheGradientModeModules||{};
  const KEY="the_gradient_v369_mode";let changing=false;
  const MODES=["learn","software","imagine","canvas","documents"];
  const CHAT_MODES=["learn","software"];
  /* Each workspace owns its prompt, its start panel and its file bucket so
     nothing from one mode leaks into another. */
  const MODE_META={
    learn:{
      label:"Learn",
      placeholder:"Ask anything — explain, summarise, quiz me…",
      startPanel:".learn-start-panel",
      folder:"Learn"
    },
    software:{
      label:"Software Development",
      placeholder:"Describe a feature, paste an error, or ask for a code review…",
      startPanel:"#software-start-panel",
      folder:"Software"
    },
    imagine:{
      label:"Imagine",
      placeholder:"Describe the image you want — subject, style, mood…",
      startPanel:null,
      folder:"Imagine"
    },
    canvas:{
      label:"Canvas",
      placeholder:"Describe a design — it lands on the canvas as editable shapes…",
      startPanel:null,
      folder:"Canvas"
    },
    documents:{
      label:"Documents",
      placeholder:"Paste or describe a document — headings, tables, export as PDF…",
      startPanel:null,
      folder:"Documents"
    }
  };
  const PLACEHOLDERS=Object.fromEntries(MODES.map(m=>[m,MODE_META[m].placeholder]));
  const read=()=>{try{const v=localStorage.getItem(KEY)||"learn";return MODES.includes(v)?v:"learn";}catch{return"learn";}};
  const save=m=>{try{localStorage.setItem(KEY,m);}catch{}};
  const chat=mode=>CHAT_MODES.includes(mode);

  function syncButtons(mode){
    document.querySelectorAll(".mode-sidebar-btn[data-mode]").forEach(b=>{
      const a=b.dataset.mode===mode;b.classList.toggle("active",a);b.setAttribute("aria-current",a?"page":"false");
    });
  }

  /* The shell is shared: chat workspaces keep the transcript + composer, the
     canvas-style workspaces hide them and show their own stage instead. */
  function shell(isChat){
    document.querySelector(".main")?.classList.remove("mode-main-hidden");
    document.querySelector(".header")?.classList.toggle("mode-header-hidden",!isChat);
    document.getElementById("find-bar")?.classList.toggle("mode-region-hidden",!isChat);
    document.getElementById("chat-scroll")?.classList.toggle("mode-region-hidden",!isChat);
    document.getElementById("composer-wrap")?.classList.toggle("mode-region-hidden",!isChat);
    const stage=document.getElementById("gradient-mode-stage");
    stage?.classList.toggle("hidden",isChat);
    stage?.classList.toggle("v32-mode-visible",!isChat);
  }

  /* Exactly one start panel may live in the transcript, and a non-chat mode
     keeps none. Prevents a greeting from another workspace bleeding through. */
  function pruneStartPanels(mode){
    const inner=TG.UI?.els?.chatInner;if(!inner?.querySelectorAll)return;
    const keep=MODE_META[mode]?.startPanel||null;
    MODES.map(m=>MODE_META[m].startPanel).filter(Boolean).concat([".w41-welcome"]).forEach(sel=>{
      if(sel===keep)return;
      inner.querySelectorAll(sel).forEach(n=>n.remove());
    });
  }

  /* Workspace modules rewrite the composer placeholder while they mount, so
     the router re-asserts the active mode's own text after they finish. The
     value is read from the router, which is the only place it is authored. */
  function paintPlaceholder(){
    const input=TG.UI?.els?.composerInput;if(!input)return;
    const mode=TG.State.uiMode||"software";
    const ph=PLACEHOLDERS[mode]||PLACEHOLDERS.software;
    if(input.placeholder!==ph)input.placeholder=ph;
  }

  function setPlaceholder(mode){
    const meta=MODE_META[mode];
    if(meta){
      document.querySelector(".header")?.setAttribute("data-mode-label",meta.label);
      /* Files attach into the active workspace's own bucket, so a Canvas
         asset never shows up while you are writing a document. */
      TG.State.modeFolder=meta.folder;
    }
    paintPlaceholder();
    [0,80,300,900].forEach(ms=>setTimeout(paintPlaceholder,ms));
  }

  /* A MutationObserver catches any late write from a workspace module. */
  function watchPlaceholder(){
    const input=TG.UI?.els?.composerInput;if(!input||watchPlaceholder._on)return;
    watchPlaceholder._on=true;
    const obs=new MutationObserver(()=>{
      const mode=TG.State.uiMode||"software";
      const ph=PLACEHOLDERS[mode]||PLACEHOLDERS.software;
      if(input.placeholder!==ph){
        obs.disconnect();
        input.placeholder=ph;
        obs.observe(input,{attributes:true,attributeFilter:["placeholder"]});
      }
    });
    obs.observe(input,{attributes:true,attributeFilter:["placeholder"]});
  }

  async function setMode(mode,opts={}){
    if(changing)return;
    if(!modules()[mode])mode="software";
    const current=TG.State.uiMode||"software";
    if(current===mode&&!opts.force){shell(chat(mode));syncButtons(mode);setPlaceholder(mode);return;}
    changing=true;
    try{
      await Promise.resolve(modules()[current]?.unmount?.());
      TG.State.uiMode=mode;document.body.dataset.gradientMode=mode;
      document.body.classList.remove("mode-software","mode-imagine","mode-canvas","mode-documents","mode-learn");
      document.body.classList.add(`mode-${mode}`);
      shell(chat(mode));syncButtons(mode);save(mode);
      try{window.Gradient32State?.set({mode});}catch{}
      pruneStartPanels(mode);
      await Promise.resolve(modules()[mode]?.mount?.());
      syncButtons(mode);setPlaceholder(mode);pruneStartPanels(mode);
      window.Gradient32Shell?.scan?.();TG.UI?.updateHeader?.();
    }catch(err){
      console.error("Workspace mount failed",err);
      try{await Promise.resolve(modules()[mode]?.unmount?.());}catch{}
      if(mode!=="software"){
        TG.State.uiMode="software";document.body.dataset.gradientMode="software";document.body.classList.remove("mode-imagine","mode-canvas","mode-documents","mode-learn");document.body.classList.add("mode-software");
        shell(true);syncButtons("software");save("software");
        try{await Promise.resolve(modules().software?.mount?.());}catch(e){console.error(e);}
        TG.UI?.toast?.(`${mode} could not open: ${err?.message||"unknown error"}`,{error:true});
      }else TG.UI?.toast?.(err?.message||"Workspace could not open.",{error:true});
    }finally{changing=false;}
  }

  function boot(){const m=read();setMode(modules()[m]?m:"software",{force:true});watchPlaceholder();}
  window.TheGradientModeRouter={setMode,boot,syncButtons,MODE_META,PLACEHOLDERS,paintPlaceholder};TG.Modes=TG.Modes||{};TG.Modes.setMode=setMode;TG.Modes.meta=MODE_META;
  function launch(){
    let done=false;
    const go=()=>{if(done)return;done=true;boot();};
    window.addEventListener("gradient-app-ready",go,{once:true});
    setTimeout(go,1600);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",launch,{once:true});else launch();
})();
