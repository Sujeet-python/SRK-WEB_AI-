/* The Gradient 3.2.1 — startup guard. Keeps slow/blocked storage from looking like a frozen app. */
(function(){
  "use strict";
  const started = Date.now();
  let ready = false;
  function dismiss(){ document.getElementById("g32-startup-guard")?.remove(); }
  function show(){
    if(ready || document.getElementById("g32-startup-guard")) return;
    const host=document.createElement("div"); host.id="g32-startup-guard";
    host.innerHTML=`<div class="g32-startup-card"><div class="g32-startup-mark">✦</div><h2>The Gradient is taking longer than expected</h2><p>Your local workspace may be waiting on browser storage or an older tab. The app can continue in a clean local-storage mode.</p><div class="g32-startup-actions"><button id="g32-startup-continue">Continue</button><button id="g32-startup-reload">Reload</button></div></div>`;
    document.body.appendChild(host);
    host.querySelector("#g32-startup-continue")?.addEventListener("click",()=>{ try{ localStorage.setItem("nimbus_force_ls_v1","1"); }catch{}; dismiss(); window.dispatchEvent(new CustomEvent("gradient-force-local-storage")); });
    host.querySelector("#g32-startup-reload")?.addEventListener("click",()=>location.reload());
  }
  window.addEventListener("gradient-app-ready",()=>{ ready=true; dismiss(); },{once:true});
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(show,2800),{once:true}); else setTimeout(show,2800);
})();
