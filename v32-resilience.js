/* The Gradient 3.2 — resilience layer. Keeps failures visible but non-destructive. */
(function(){
  "use strict";
  const seen=new Map();
  function report(message){
    const msg=String(message||"Unexpected error");
    const key=msg.slice(0,180);
    const count=(seen.get(key)||0)+1; seen.set(key,count);
    if(count>2) return;
    try{ window.TheGradient?.UI?.toast?.(msg,{error:true,ms:5000}); }catch{}
  }
  window.addEventListener("error",e=>{ if(e?.error?.message) console.error(e.error); report(e?.error?.message||e?.message); });
  window.addEventListener("unhandledrejection",e=>{ const r=e?.reason; console.error(r); report(r?.message||String(r||"Promise rejected")); });
  window.Gradient32Resilience={report};
})();
