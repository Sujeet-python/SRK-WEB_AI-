/* The Gradient — Canvas mode
   A self-contained visual design editor inspired by modern web design tools.
   Native HTML Canvas 2D; no editor framework required.
*/
(function () {
  "use strict";
  const TG = window.TheGradient;
  if (!TG) return;
  const { State, App, Conv, UI, uid, ModeAI } = TG;

  const DEFAULT_W = 1200;
  const DEFAULT_H = 800;
  const COLORS = [
    "#111827", "#1f2937", "#ffffff", "#e5e7eb", "#111111", "#ef4444", "#f97316", "#f59e0b",
    "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"
  ];

  const state = {
    page: { w: DEFAULT_W, h: DEFAULT_H, background: "#0b1020" },
    objects: [],
    selected: null,
    tool: "select",
    fill: "#ffffff",
    stroke: "#7c8cff",
    strokeWidth: 4,
    opacity: 1,
    zoom: 0.82,
    history: [],
    future: [],
    drawing: false,
    activePath: null,
    start: null,
    drag: null,
    textEditor: null,
    imageInput: null,
    dirty: false,
    grid: true,
    snap: true,
    snapSize: 8,
    showGuides: true
  };

  let stage = null;
  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let ui = {};

  const esc = (s) => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const isFiniteNum = (n) => Number.isFinite(n);

  function iconLabel(symbol, label) { return `<span class="canvas-tool-glyph">${symbol}</span><span>${label}</span>`; }

  function snapshot() {
    state.history.push({ page: clone(state.page), objects: clone(state.objects), selected: state.selected });
    if (state.history.length > 60) state.history.shift();
    state.future = [];
    state.dirty = true;
    updateUndoButtons();
  }

  function undo() {
    if (!state.history.length) return;
    state.future.push({ page: clone(state.page), objects: clone(state.objects), selected: state.selected });
    const p = state.history.pop();
    state.page = p.page; state.objects = p.objects; state.selected = p.selected;
    state.dirty = true; render();
  }
  function redo() {
    if (!state.future.length) return;
    state.history.push({ page: clone(state.page), objects: clone(state.objects), selected: state.selected });
    const p = state.future.pop();
    state.page = p.page; state.objects = p.objects; state.selected = p.selected;
    state.dirty = true; render();
  }

  function ensureSize() {
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.round(state.page.w * dpr);
    canvas.height = Math.round(state.page.h * dpr);
    canvas.style.width = `${state.page.w * state.zoom}px`;
    canvas.style.height = `${state.page.h * state.zoom}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function worldPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const rw = Math.max(1, rect.width), rh = Math.max(1, rect.height);
    let x = clamp((e.clientX - rect.left) * (state.page.w / rw), 0, state.page.w);
    let y = clamp((e.clientY - rect.top) * (state.page.h / rh), 0, state.page.h);
    if (state.snap && !e.shiftKey) {
      x = Math.round(x / state.snapSize) * state.snapSize;
      y = Math.round(y / state.snapSize) * state.snapSize;
    }
    return { x: clamp(x, 0, state.page.w), y: clamp(y, 0, state.page.h) };
  }

  function getBounds(o) {
    if (!o) return null;
    if (o.type === "path") {
      const xs = o.points.map(p => p.x), ys = o.points.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(1, Math.max(...xs)-x), h: Math.max(1, Math.max(...ys)-y) };
    }
    if (o.type === "line" || o.type === "arrow") {
      const x = Math.min(o.x, o.x2), y = Math.min(o.y, o.y2);
      return { x, y, w: Math.max(1, Math.abs(o.x2-o.x)), h: Math.max(1, Math.abs(o.y2-o.y)) };
    }
    return { x: o.x, y: o.y, w: Math.max(1,o.w || 1), h: Math.max(1,o.h || 1) };
  }

  function pointInObject(o, p) {
    const b = getBounds(o); if (!b) return false;
    if (o.type === "ellipse") {
      const rx = b.w/2, ry = b.h/2, cx=b.x+rx, cy=b.y+ry;
      return (((p.x-cx)/rx)**2 + ((p.y-cy)/ry)**2) <= 1.02;
    }
    if (o.type === "line" || o.type === "arrow" || o.type === "path") {
      const threshold = Math.max(10, (o.strokeWidth || 4) + 6);
      if (o.type === "path") return o.points.some(q => Math.hypot(q.x-p.x,q.y-p.y) <= threshold);
      const dx=o.x2-o.x, dy=o.y2-o.y, len=Math.hypot(dx,dy) || 1;
      const t=clamp(((p.x-o.x)*dx+(p.y-o.y)*dy)/(len*len),0,1);
      const q={x:o.x+t*dx,y:o.y+t*dy};
      return Math.hypot(q.x-p.x,q.y-p.y) <= threshold;
    }
    return p.x>=b.x && p.x<=b.x+b.w && p.y>=b.y && p.y<=b.y+b.h;
  }

  function topObjectAt(p) {
    for (let i=state.objects.length-1;i>=0;i--) if (pointInObject(state.objects[i],p)) return state.objects[i];
    return null;
  }

  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r || 0, Math.abs(w)/2, Math.abs(h)/2);
    c.beginPath(); c.moveTo(x+rr,y); c.arcTo(x+w,y,x+w,y+h,rr); c.arcTo(x+w,y+h,x,y+h,rr); c.arcTo(x,y+h,x,y,rr); c.arcTo(x,y,x+w,y,rr); c.closePath();
  }

  function drawObject(o) {
    ctx.save();
    ctx.globalAlpha = clamp(o.opacity == null ? 1 : o.opacity, 0, 1);
    if (o.shadow) { ctx.shadowColor = o.shadow.color || "#0008"; ctx.shadowBlur=o.shadow.blur||18; ctx.shadowOffsetX=o.shadow.x||0; ctx.shadowOffsetY=o.shadow.y||6; }
    ctx.lineWidth = o.strokeWidth || 1;
    ctx.strokeStyle = o.stroke || "transparent";
    ctx.fillStyle = o.fill || "transparent";
    ctx.lineCap = o.lineCap || "round";
    ctx.lineJoin = "round";

    /* Generated layouts may rotate a layer around its own centre. */
    const rot = Number(o.rotation) || 0;
    if (rot && o.type !== "path") {
      const cx = o.x + (o.w || 0) / 2, cy = o.y + (o.h || 0) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (o.type === "rect") {
      roundRectPath(ctx,o.x,o.y,o.w,o.h,o.radius||0);
      if (o.fill) ctx.fill(); if (o.strokeWidth>0 && o.stroke) ctx.stroke();
    } else if (o.type === "ellipse") {
      ctx.beginPath(); ctx.ellipse(o.x+o.w/2,o.y+o.h/2,Math.abs(o.w/2),Math.abs(o.h/2),0,0,Math.PI*2); if(o.fill)ctx.fill(); if(o.strokeWidth>0&&o.stroke)ctx.stroke();
    } else if (o.type === "line" || o.type === "arrow") {
      ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(o.x2,o.y2); ctx.stroke();
      if (o.type === "arrow") {
        const ang=Math.atan2(o.y2-o.y,o.x2-o.x), size=Math.max(8,o.strokeWidth*3);
        ctx.beginPath(); ctx.moveTo(o.x2,o.y2); ctx.lineTo(o.x2-size*Math.cos(ang-Math.PI/6),o.y2-size*Math.sin(ang-Math.PI/6)); ctx.lineTo(o.x2-size*Math.cos(ang+Math.PI/6),o.y2-size*Math.sin(ang+Math.PI/6)); ctx.closePath(); ctx.fillStyle=o.stroke||"#fff"; ctx.fill();
      }
    } else if (o.type === "path") {
      if (!o.points.length) { ctx.restore(); return; }
      ctx.strokeStyle=o.stroke||"#fff"; ctx.lineWidth=o.strokeWidth||4; ctx.globalAlpha=clamp(o.opacity==null?1:o.opacity,0,1);
      ctx.beginPath(); ctx.moveTo(o.points[0].x,o.points[0].y); for(let i=1;i<o.points.length;i++)ctx.lineTo(o.points[i].x,o.points[i].y); ctx.stroke();
    } else if (o.type === "text") {
      ctx.fillStyle=o.fill||"#fff";
      ctx.font=`${o.weight||600} ${o.fontSize||32}px ${o.fontFamily||"Inter, system-ui, sans-serif"}`;
      ctx.textBaseline="top";
      const align = o.textAlign || o.align || "left";
      const maxWidth=o.w||Infinity;
      const lineH = Math.round((o.fontSize||32)*1.25);
      /* Anchor inside the element box so centre/right alignment behaves like a
         normal text layer, not text pinned to the left edge. */
      const anchorX = align === "center" ? o.x + (o.w||0)/2 : align === "right" ? o.x + (o.w||0) : o.x;
      ctx.textAlign = align;
      const lines=String(o.text||"").split("\n");
      let y=o.y;
      lines.forEach(line=>{
        const words=line.split(/\s+/); let row="";
        for(const word of words){ const test=row?row+" "+word:word; if(ctx.measureText(test).width>maxWidth && row){ctx.fillText(row,anchorX,y); y+=lineH; row=word;} else row=test; }
        ctx.fillText(row,anchorX,y); y+=lineH;
      });
    } else if (o.type === "image" && o.image) {
      ctx.drawImage(o.image,o.x,o.y,o.w,o.h);
      if(o.strokeWidth>0&&o.stroke){ctx.strokeStyle=o.stroke;ctx.strokeRect(o.x,o.y,o.w,o.h);}
    }
    ctx.restore();
  }

  function drawSelection() {
    const o=state.objects.find(x=>x.id===state.selected); if(!o)return;
    const b=getBounds(o); if(!b)return;
    ctx.save(); ctx.setLineDash([6,4]); ctx.lineWidth=1.5; ctx.strokeStyle="#7c8cff"; ctx.strokeRect(b.x-3,b.y-3,b.w+6,b.h+6); ctx.setLineDash([]);
    const size=10; ctx.fillStyle="#fff"; ctx.strokeStyle="#7c8cff"; ctx.lineWidth=2;
    [[b.x-5,b.y-5],[b.x+b.w+5,b.y-5],[b.x-5,b.y+b.h+5],[b.x+b.w+5,b.y+b.h+5]].forEach(([x,y])=>{ctx.fillRect(x-size/2,y-size/2,size,size);ctx.strokeRect(x-size/2,y-size/2,size,size);});
    ctx.restore();
  }

  function renderCanvas() {
    if (!ctx || !canvas) return;
    ensureSize();
    ctx.clearRect(0,0,state.page.w,state.page.h);
    ctx.fillStyle=state.page.background||"#fff"; ctx.fillRect(0,0,state.page.w,state.page.h);
    if (state.grid) {
      ctx.save();
      const step = state.snap ? state.snapSize : 16;
      ctx.strokeStyle = state.page.background === "#ffffff" ? "rgba(15,23,42,.07)" : "rgba(255,255,255,.055)";
      ctx.lineWidth = 1;
      for (let x=0; x<=state.page.w; x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,state.page.h); ctx.stroke(); }
      for (let y=0; y<=state.page.h; y+=step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(state.page.w,y); ctx.stroke(); }
      ctx.restore();
    }
    for(const o of state.objects) drawObject(o);
    if(state.activePath) drawObject(state.activePath);
    drawSelection();
  }

  function setSelected(id) {
    state.selected=id||null;
    updateInspector(); renderCanvas(); renderLayers();
  }

  function newObject(type, patch={}) {
    return Object.assign({ id:uid("obj"), type, x:140, y:120, w:320, h:180, fill:state.fill, stroke:state.stroke, strokeWidth:state.strokeWidth, opacity:state.opacity, radius:18, rotation:0 }, patch);
  }

  function add(o, select=true) { snapshot(); state.objects.push(o); if(select)state.selected=o.id; render(); }

  function deleteSelected() { if(!state.selected)return; snapshot(); state.objects=state.objects.filter(o=>o.id!==state.selected); state.selected=null; render(); }
  function bringForward(){const i=state.objects.findIndex(o=>o.id===state.selected);if(i<0||i>=state.objects.length-1)return;snapshot();[state.objects[i],state.objects[i+1]]=[state.objects[i+1],state.objects[i]];render();}
  function sendBackward(){const i=state.objects.findIndex(o=>o.id===state.selected);if(i<=0)return;snapshot();[state.objects[i],state.objects[i-1]]=[state.objects[i-1],state.objects[i]];render();}

  function startText(x,y) {
    const input=document.createElement("input");
    input.className="canvas-inline-text"; input.placeholder="Type text…"; input.value="";
    stage.appendChild(input);
    const place=()=>{const r=canvas.getBoundingClientRect(); const left=r.left+((x/state.page.w)*r.width); const top=r.top+((y/state.page.h)*r.height); input.style.left=`${left}px`;input.style.top=`${top}px`;};
    place(); input.focus(); state.textEditor=input;
    const finish=(cancel=false)=>{const text=input.value.trim();input.remove();state.textEditor=null;if(cancel||!text)return; add(newObject("text",{x,y,text,w:480,h:120,fill:state.fill,fontSize:48,weight:700}),true);};
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();finish();}else if(e.key==="Escape"){finish(true);}});
    input.addEventListener("blur",()=>finish());
  }

  function pointerDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture?.(e.pointerId); } catch {}
    const p=worldPoint(e); state.start=p; state.drawing=true;
    if(state.tool==="select"){
      const o=topObjectAt(p);
      if(o){
        setSelected(o.id);
        state.drag={mode:"move",id:o.id,dx:p.x-o.x,dy:p.y-o.y};
        if(o.type==="line"||o.type==="arrow"){state.drag.dx=p.x-o.x;state.drag.dy=p.y-o.y;}
      } else setSelected(null);
    } else if(state.tool==="pen"||state.tool==="brush"||state.tool==="highlighter"){
      state.activePath=newObject("path",{points:[p],fill:null,stroke:state.stroke,strokeWidth:state.tool==="highlighter"?Math.max(10,state.strokeWidth*3):state.strokeWidth,opacity:state.tool==="highlighter"?0.28:state.opacity});
      renderCanvas();
    } else if(state.tool==="text") {
      state.drawing=false; startText(p.x,p.y);
    } else if(state.tool==="eraser") {
      const o=topObjectAt(p); if(o){deleteObjectById(o.id);} state.drawing=false;
    } else if(state.tool==="image") {
      state.drawing=false; ui.imageInput?.click();
    }
  }

  function pointerMove(e) {
    if(!state.drawing)return;
    e.preventDefault(); const p=worldPoint(e);
    if(state.drag?.mode==="move"){
      const o=state.objects.find(x=>x.id===state.drag.id); if(!o)return;
      const nx=p.x-state.drag.dx, ny=p.y-state.drag.dy; o.x=clamp(nx,-o.w+8,state.page.w-8); o.y=clamp(ny,-o.h+8,state.page.h-8); renderCanvas(); updateInspector(false); return;
    }
    if(state.activePath){state.activePath.points.push(p);renderCanvas();return;}
    const s=state.start; let w=p.x-s.x,h=p.y-s.y;
    if(state.tool==="rect"||state.tool==="ellipse"){ui.toolHint.textContent=`${Math.round(Math.abs(w))} × ${Math.round(Math.abs(h))}`;previewShape(p);}
    else if(state.tool==="line"||state.tool==="arrow"){previewLine(p);}
  }

  function pointerUp(e){
    if(!state.drawing)return;
    e.preventDefault();
    try { canvas.releasePointerCapture?.(e.pointerId); } catch {} const p=worldPoint(e),s=state.start; state.drawing=false;
    if(state.drag){state.drag=null; state.dirty=true; render();return;}
    if(state.activePath){ if(state.activePath.points.length>1){snapshot();state.objects.push(state.activePath);state.selected=state.activePath.id;} state.activePath=null;render();return;}
    const x=Math.min(s.x,p.x),y=Math.min(s.y,p.y),w=Math.max(8,Math.abs(p.x-s.x)),h=Math.max(8,Math.abs(p.y-s.y));
    if(state.tool==="rect"||state.tool==="ellipse") add(newObject(state.tool,{x,y,w,h}),true);
    else if(state.tool==="line"||state.tool==="arrow") add(newObject(state.tool,{x:s.x,y:s.y,x2:p.x,y2:p.y,w:Math.abs(p.x-s.x),h:Math.abs(p.y-s.y),fill:null}),true);
    ui.toolHint.textContent="Canvas ready";
  }

  function previewShape(p){ renderCanvas(); const s=state.start; drawObject(newObject(state.tool,{x:Math.min(s.x,p.x),y:Math.min(s.y,p.y),w:Math.max(8,Math.abs(p.x-s.x)),h:Math.max(8,Math.abs(p.y-s.y))})); }
  function previewLine(p){renderCanvas();const s=state.start;drawObject(newObject(state.tool,{x:s.x,y:s.y,x2:p.x,y2:p.y,fill:null}));}
  function deleteObjectById(id){snapshot();state.objects=state.objects.filter(o=>o.id!==id);if(state.selected===id)state.selected=null;render();}

  function setTool(tool){state.tool=tool;ui.toolButtons?.forEach(b=>b.classList.toggle("active",b.dataset.tool===tool));canvas.style.cursor=tool==="select"?"default":tool==="eraser"?"not-allowed":"crosshair";}

  function colorButtons(){return COLORS.map(c=>`<button class="canvas-color" data-color="${c}" style="--swatch:${c}" title="${c}"></button>`).join("");}

  function renderLayers(){
    if(!ui.layers)return;
    ui.layers.innerHTML=state.objects.length?state.objects.map((o,i)=>`<button class="canvas-layer ${o.id===state.selected?"active":""}" data-layer="${o.id}"><span>${o.type}</span><small>${o.type==="text"?esc((o.text||"").slice(0,28)):esc(`#${i+1}`)}</small></button>`).reverse().join(""):`<div class="canvas-layer-empty">No elements yet</div>`;
    ui.layers.querySelectorAll("[data-layer]").forEach(b=>b.onclick=()=>setSelected(b.dataset.layer));
  }

  function updateInspector(render=true){
    const o=state.objects.find(x=>x.id===state.selected);
    if(!ui.inspector)return;
    ui.inspector.innerHTML=o?inspectorHtml(o):emptyInspectorHtml(); bindInspector(o); if(render)renderCanvas();
  }
  function field(label,id,value,type="text"){return `<label class="canvas-field"><span>${label}</span><input data-prop="${id}" type="${type}" value="${esc(value??"")}"></label>`;}
  function selectField(label,id,value,options){return `<label class="canvas-field"><span>${label}</span><select data-prop="${id}">${options.map(([v,t])=>`<option value="${esc(v)}"${String(value)===String(v)?" selected":""}>${esc(t)}</option>`).join("")}</select></label>`;}
  function inspectorHtml(o){
    const text = o.type==="text";
    return `<div class="canvas-inspector-title"><button data-act="delete" title="Delete this element">Delete element</button></div>
      ${field("X","x",Math.round(o.x),"number")}${field("Y","y",Math.round(o.y),"number")}
      ${field("Width","w",Math.round(o.w||0),"number")}${field("Height","h",Math.round(o.h||0),"number")}
      ${field("Rotation","rotation",Math.round(o.rotation||0),"number")}
      ${field("Opacity","opacity",Math.round((o.opacity??1)*100),"number")}
      ${text?`${field("Text","text",o.text||"")}${field("Font size","fontSize",o.fontSize||32,"number")}
        ${selectField("Weight","weight",o.weight||600,[[300,"Light"],[400,"Regular"],[500,"Medium"],[600,"Semibold"],[700,"Bold"],[800,"Extrabold"]])}
        ${selectField("Align","textAlign",o.textAlign||"left",[["left","Left"],["center","Center"],["right","Right"]])}
        ${field("Font","fontFamily",o.fontFamily||"Inter, system-ui, sans-serif")}`:""}
      ${!text&&o.type!=="line"&&o.type!=="arrow"&&o.type!=="path"?field("Radius","radius",Math.round(o.radius||0),"number"):""}
      <div class="canvas-color-controls"><label>Fill</label><input data-prop="fill" type="color" value="${/^#[0-9a-f]{6}$/i.test(o.fill||"")?o.fill:"#ffffff"}"><label>Stroke</label><input data-prop="stroke" type="color" value="${/^#[0-9a-f]{6}$/i.test(o.stroke||"")?o.stroke:"#7c8cff"}></div>
      ${field("Line width","strokeWidth",Math.round(o.strokeWidth||0),"number")}
      <div class="canvas-layer-actions"><button data-act="back">Send backward</button><button data-act="front">Bring forward</button></div>`;
  }
  function emptyInspectorHtml(){return `<div class="canvas-empty-inspector"><b>Select an element</b><span>Choose an object on the page to edit its properties.</span></div>`;}

  function bindInspector(o){
    if(!o)return;
    ui.inspector.querySelectorAll("[data-prop]").forEach(inp=>inp.addEventListener("change",()=>{
      const key=inp.dataset.prop; snapshot();
      let val=inp.value;
      if(["x","y","w","h","fontSize","strokeWidth","radius","rotation","weight"].includes(key)) val=Number(val);
      /* The renderer reads textAlign, while the design spec calls it align. */
      if(key==="textAlign") { o.textAlign=val; if(o.align!==undefined) o.align=val; render(); return; }
      if(key==="opacity") val=clamp(Number(val)/100,0,1);
      o[key]=val; render();
    }));
    ui.inspector.querySelector("[data-act='delete']")?.addEventListener("click",deleteSelected);
    ui.inspector.querySelector("[data-act='back']")?.addEventListener("click",sendBackward);
    ui.inspector.querySelector("[data-act='front']")?.addEventListener("click",bringForward);
  }

  function updateUndoButtons(){ui.undo.disabled=!state.history.length;ui.redo.disabled=!state.future.length;ui.zoomValue.textContent=`${Math.round(state.zoom*100)}%`;}

  function fitPage(){
    const box=ui.viewport.getBoundingClientRect(); const zx=(box.width-80)/state.page.w, zy=(box.height-80)/state.page.h; state.zoom=clamp(Math.min(zx,zy),.25,1.6); updateUndoButtons();renderCanvas(); }
  function zoom(delta){state.zoom=clamp(state.zoom+delta,.25,1.6);updateUndoButtons();renderCanvas();}

  function loadImage(file){
    const reader=new FileReader(); reader.onload=()=>{const img=new Image(); img.onload=()=>{snapshot();const maxW=520;const scale=Math.min(1,maxW/img.width);const o=newObject("image",{x:120,y:120,w:img.width*scale,h:img.height*scale,fill:null,stroke:null,strokeWidth:0,image:img,src:reader.result,name:file.name});state.objects.push(o);state.selected=o.id;render();};img.src=reader.result;};reader.readAsDataURL(file);
  }

  function addImageToCanvas(dataUrl,name="Generated image"){
    const img=new Image(); img.onload=()=>{snapshot();const maxW=620;const scale=Math.min(1,maxW/img.width);const o=newObject("image",{x:(state.page.w-img.width*scale)/2,y:(state.page.h-img.height*scale)/2,w:img.width*scale,h:img.height*scale,fill:null,stroke:null,strokeWidth:0,image:img,src:dataUrl,name});state.objects.push(o);state.selected=o.id;render();}; img.src=dataUrl;
  }

  async function magicDesign(prompt){
    const text=(prompt||"").trim(); if(!text)return;
    ui.aiButton.disabled=true; ui.aiButton.textContent="Designing…";
    try {
      if (TG.AIHub?.designSpec) {
        const pid=ModeAI?.provider("canvas")||State.settings.canvasAI||State.settings.provider;
        const model=ui.model?.value||ModeAI?.model("canvas")||State.settings.canvasModel;
        applySpec(await TG.AIHub.designSpec(text, undefined, {provider:pid, model}));
      } else {
        throw new Error("AI Hub is unavailable.");
      }
    } catch(e) {
      UI.toast?.("Canvas AI: "+(e.message||"Design generation failed"),{error:true});
    } finally {
      ui.aiButton.disabled=false; ui.aiButton.textContent="Generate design";
    }
  }

  function applySpec(spec){
    snapshot();
    if (typeof spec.background === "string") state.page.background = spec.background;
    /* Generated elements become ordinary editor objects: every one is
       selectable, draggable, recolourable and re-typable like anything
       drawn by hand. */
    state.objects = [];
    const allowed = ["rect","ellipse","text","line","arrow"];
    (Array.isArray(spec.elements) ? spec.elements : []).forEach(e => {
      if (!e || !allowed.includes(e.type)) return;
      const patch = {
        x: e.x, y: e.y, w: e.w, h: e.h,
        fill: e.fill, stroke: e.stroke, strokeWidth: e.strokeWidth,
        radius: e.radius, opacity: e.opacity,
        rotation: e.rotation || 0,
        fontSize: e.fontSize, weight: e.weight,
        align: e.align || "left"
      };
      if (e.type === "text") patch.text = String(e.text || "");
      if (e.type === "line" || e.type === "arrow") { patch.x2 = e.x2; patch.y2 = e.y2; }
      const o = newObject(e.type, patch);
      if (e.type === "text") { o.fill = e.fill || "#ffffff"; o.strokeWidth = 0; }
      state.objects.push(o);
    });
    state.selected = state.objects.length ? state.objects[state.objects.length - 1].id : null;
    state.dirty = true;
    render();
    if (state.objects.length) UI.toast?.(`Design generated — ${state.objects.length} editable layers`);
  }

  function exportPng(){renderCanvas();canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`the-gradient-canvas-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),800);},"image/png");}
  function exportJson(){
    const payload={version:3,page:clone(state.page),objects:state.objects.map(o=>{const x=clone(o);delete x.image;return x;})};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=`the-gradient-canvas-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function escXml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
  function exportSvg(){
    const bg=state.page.background||"#fff"; const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${state.page.w}" height="${state.page.h}" viewBox="0 0 ${state.page.w} ${state.page.h}"><rect width="100%" height="100%" fill="${escXml(bg)}"/>`];
    for(const o of state.objects){const a=clamp(o.opacity??1,0,1);const fill=o.fill&&o.fill!=="transparent"?escXml(o.fill):"none";const stroke=o.stroke?escXml(o.stroke):"none";const sw=Math.max(0,o.strokeWidth||0);
      if(o.type==="rect") parts.push(`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${o.radius||0}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${a}"/>`);
      else if(o.type==="ellipse") parts.push(`<ellipse cx="${o.x+o.w/2}" cy="${o.y+o.h/2}" rx="${Math.abs(o.w/2)}" ry="${Math.abs(o.h/2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${a}"/>`);
      else if(o.type==="line"||o.type==="arrow") parts.push(`<line x1="${o.x}" y1="${o.y}" x2="${o.x2}" y2="${o.y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" opacity="${a}"/>`);
      else if(o.type==="path"&&Array.isArray(o.points)&&o.points.length) parts.push(`<polyline points="${o.points.map(p=>`${p.x},${p.y}`).join(" ")}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${a}"/>`);
      else if(o.type==="text") parts.push(`<text x="${o.x}" y="${o.y}" fill="${fill}" font-size="${o.fontSize||32}px" font-weight="${o.weight||600}" font-family="${escXml(o.fontFamily||"Inter, system-ui, sans-serif")}" opacity="${a}">${escXml(o.text||"")}</text>`);
      else if(o.type==="image"&&o.src) parts.push(`<image href="${escXml(o.src)}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" preserveAspectRatio="none" opacity="${a}"/>`);
    }
    parts.push("</svg>"); const blob=new Blob([parts.join("")],{type:"image/svg+xml;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=`the-gradient-canvas-${Date.now()}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function applyTemplate(name){
    const specs={
      dashboard:{background:"#0b1020",elements:[
        {type:"rect",x:60,y:60,w:1080,h:100,fill:"#111827",stroke:"#334155",strokeWidth:1,radius:18},
        {type:"text",x:94,y:92,text:"AI Engineering Dashboard",fill:"#ffffff",fontSize:34,weight:800},
        {type:"rect",x:60,y:200,w:330,h:220,fill:"#111827",stroke:"#334155",strokeWidth:1,radius:18},
        {type:"rect",x:430,y:200,w:330,h:220,fill:"#111827",stroke:"#334155",strokeWidth:1,radius:18},
        {type:"rect",x:800,y:200,w:340,h:220,fill:"#111827",stroke:"#334155",strokeWidth:1,radius:18},
        {type:"text",x:88,y:238,text:"Build Status",fill:"#a5b4fc",fontSize:18,weight:700},
        {type:"text",x:458,y:238,text:"Tests",fill:"#67e8f9",fontSize:18,weight:700},
        {type:"text",x:828,y:238,text:"Deployments",fill:"#86efac",fontSize:18,weight:700},
        {type:"rect",x:60,y:470,w:1080,h:260,fill:"#0f172a",stroke:"#334155",strokeWidth:1,radius:18},
        {type:"text",x:88,y:510,text:"Activity",fill:"#ffffff",fontSize:22,weight:750}]},
      wireframe:{background:"#ffffff",elements:[{type:"rect",x:72,y:72,w:1056,h:70,fill:"#f8fafc",stroke:"#cbd5e1",strokeWidth:2,radius:12},{type:"text",x:104,y:94,text:"Brand",fill:"#0f172a",fontSize:26,weight:800},{type:"rect",x:72,y:172,w:250,h:560,fill:"#f8fafc",stroke:"#cbd5e1",strokeWidth:2,radius:12},{type:"rect",x:350,y:172,w:778,h:260,fill:"#ffffff",stroke:"#cbd5e1",strokeWidth:2,radius:12},{type:"rect",x:350,y:460,w:778,h:272,fill:"#ffffff",stroke:"#cbd5e1",strokeWidth:2,radius:12},{type:"text",x:382,y:206,text:"Main content",fill:"#334155",fontSize:34,weight:800}]}
    };
    if(specs[name]){snapshot();applySpec(specs[name]);}
  }

  function saveProject(){
    try{localStorage.setItem("the_gradient_canvas_project_v1",JSON.stringify({page:state.page,objects:state.objects.map(o=>{const x=clone(o);delete x.image;return x;})}));UI.toast?.("Canvas saved locally");}
    catch(e){UI.toast?.("Canvas save failed",{error:true});}
  }
  function loadProject(){
    try{const raw=localStorage.getItem("the_gradient_canvas_project_v1");if(!raw)return;const p=JSON.parse(raw);if(p.page)state.page=p.page;if(Array.isArray(p.objects))state.objects=p.objects.filter(Boolean).map(o=>{if(o.type!=="image")return o; if(!o.src)return o; const img=new Image(); img.src=o.src; return Object.assign(o,{image:img});});state.selected=null;render();}catch{}}

  function bind(){
    canvas.addEventListener("pointerdown",pointerDown,{passive:false});
    canvas.addEventListener("pointermove",pointerMove,{passive:false});
    canvas.addEventListener("pointerup",pointerUp,{passive:false});
    canvas.addEventListener("pointercancel",pointerUp,{passive:false});
    canvas.addEventListener("pointerleave",e=>{if(state.drawing && state.activePath) pointerMove(e);},{passive:false});
    ui.undo.onclick=undo;ui.redo.onclick=redo;ui.zoomOut.onclick=()=>zoom(-.1);ui.zoomIn.onclick=()=>zoom(.1);ui.fit.onclick=fitPage;ui.export.onclick=exportPng;ui.save.onclick=saveProject;ui.clear.onclick=()=>{snapshot();state.objects=[];state.selected=null;render();};
    ui.exportJson.onclick=exportJson; ui.exportSvg.onclick=exportSvg; ui.gridToggle.onchange=()=>{state.grid=ui.gridToggle.checked;renderCanvas();}; ui.snapToggle.onchange=()=>{state.snap=ui.snapToggle.checked;renderCanvas();};
    ui.templateButtons.forEach(b=>b.onclick=()=>applyTemplate(b.dataset.template));
    ui.toolButtons.forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
    ui.colorGrid.innerHTML=colorButtons();ui.colorGrid.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>{state.fill=b.dataset.color;state.stroke=b.dataset.color;const o=state.objects.find(x=>x.id===state.selected);if(o){snapshot();if(o.type==="path"||o.type==="line"||o.type==="arrow")o.stroke=b.dataset.color;else{o.fill=b.dataset.color;}render();} updateColorButtons();});
    ui.fillColor.oninput=()=>{state.fill=ui.fillColor.value;const o=state.objects.find(x=>x.id===state.selected);if(o){o.fill=state.fill;renderCanvas();updateInspector(false);}};
    ui.strokeColor.oninput=()=>{state.stroke=ui.strokeColor.value;const o=state.objects.find(x=>x.id===state.selected);if(o){o.stroke=state.stroke;renderCanvas();updateInspector(false);}};
    ui.width.oninput=()=>{state.strokeWidth=Number(ui.width.value)||1;ui.widthValue.textContent=ui.width.value;const o=state.objects.find(x=>x.id===state.selected);if(o){o.strokeWidth=state.strokeWidth;renderCanvas();updateInspector(false);}};
    ui.aiButton.onclick=()=>magicDesign(ui.aiPrompt.value);ui.aiPrompt.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")magicDesign(ui.aiPrompt.value);});
    ui.imageInput.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)loadImage(f);e.target.value="";});
    window.addEventListener("resize",()=>{if(stage?.isConnected)renderCanvas();});
    ui.viewport.addEventListener("wheel",e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();zoom(e.deltaY>0?-0.05:0.05);},{passive:false});
    document.addEventListener("keydown",e=>{if(!stage?.isConnected)return;if(e.key==="Delete"||e.key==="Backspace"){if(document.activeElement?.tagName==="INPUT"||document.activeElement?.tagName==="TEXTAREA")return;deleteSelected();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo();}if(e.key==="Escape"&&state.textEditor){state.textEditor.blur();return;}if(document.activeElement?.tagName==="INPUT"||document.activeElement?.tagName==="TEXTAREA")return;const map={v:"select",p:"pen",b:"brush",h:"highlighter",e:"eraser",t:"text",r:"rect",o:"ellipse",l:"line",a:"arrow",i:"image"};const k=e.key.toLowerCase();if(map[k]){e.preventDefault();setTool(map[k]);}if(k==="g"){state.grid=!state.grid;ui.gridToggle.checked=state.grid;renderCanvas();}if(k==="s"){state.snap=!state.snap;ui.snapToggle.checked=state.snap;renderCanvas();}}
    );
    updateColorButtons();
  }
  function updateColorButtons(){ui.fillColor.value=/^#[0-9a-f]{6}$/i.test(state.fill)?state.fill:"#ffffff";ui.strokeColor.value=/^#[0-9a-f]{6}$/i.test(state.stroke)?state.stroke:"#7c8cff";}

  function inspector(){}

  function render(){
    renderCanvas();renderLayers();updateInspector();updateUndoButtons();ui.pageSize.textContent=`${state.page.w} × ${state.page.h}`;ui.bgColor.value=/^#[0-9a-f]{6}$/i.test(state.page.background||"")?state.page.background:"#0b1020";
  }

  function mount(){
    Object.assign(state,{page:{w:DEFAULT_W,h:DEFAULT_H,background:"#0b1020"},objects:[],selected:null,tool:"select",fill:"#ffffff",stroke:"#7c8cff",strokeWidth:4,opacity:1,zoom:.82,history:[],future:[],drawing:false,activePath:null,start:null,drag:null,textEditor:null,imageInput:null,dirty:false,grid:true,snap:true,snapSize:8,showGuides:true});
    document.body.classList.add("mode-canvas");document.body.classList.remove("mode-software","mode-imagine","mode-documents");
    document.querySelector(".main")?.classList.remove("mode-main-hidden");document.querySelector(".header")?.classList.add("mode-header-hidden");document.getElementById("chat-scroll")?.classList.add("mode-region-hidden");document.getElementById("composer-wrap")?.classList.add("mode-region-hidden");
    stage=document.getElementById("gradient-mode-stage"); if(!stage)return;stage.className="gradient-mode-stage canvas-stage v369-mode-active";
    stage.innerHTML=`
      <div class="canvas-app">
        <header class="canvas-topbar">
          <div class="canvas-brand"><div class="canvas-brand-mark">✦</div><div><span class="canvas-kicker">THE GRADIENT</span><b>Canvas</b><small>Design visually. Create with AI.</small></div></div>
          <div class="canvas-top-actions">
            <button id="canvas-panel-toggle" class="canvas-panel-toggle" title="Generate &amp; properties">${iconLabel("✦","Generate")}</button>
            <button id="canvas-undo" title="Undo">↶</button><button id="canvas-redo" title="Redo">↷</button><button id="canvas-save">Save</button><button id="canvas-clear" title="Clear canvas">Clear</button><button id="canvas-export-json">JSON</button><button id="canvas-export-svg">SVG</button><button id="canvas-export">PNG</button>
          </div>
        </header>
        <div class="canvas-workspace">
          <aside class="canvas-toolbar-panel">
            <div class="canvas-tool-section"><span class="canvas-panel-label">Tools</span>
              <button data-tool="select">${iconLabel("↖","Select")}</button>
              <button data-tool="pen">${iconLabel("✎","Pen")}</button>
              <button data-tool="brush">${iconLabel("●","Brush")}</button>
              <button data-tool="highlighter">${iconLabel("▰","Highlight")}</button>
              <button data-tool="eraser">${iconLabel("⌫","Eraser")}</button>
              <button data-tool="text">${iconLabel("T","Text")}</button>
              <button data-tool="rect">${iconLabel("□","Rectangle")}</button>
              <button data-tool="ellipse">${iconLabel("○","Circle")}</button>
              <button data-tool="line">${iconLabel("╱","Line")}</button>
              <button data-tool="arrow">${iconLabel("➜","Arrow")}</button>
              <button data-tool="image">${iconLabel("▧","Image")}</button>
            </div>
            <div class="canvas-tool-section"><span class="canvas-panel-label">Color</span><div id="canvas-color-grid" class="canvas-color-grid"></div><div class="canvas-color-pickers"><label>Fill<input id="canvas-fill" type="color" value="#ffffff"></label><label>Stroke<input id="canvas-stroke" type="color" value="#7c8cff"></label></div><label class="canvas-range-row">Width <input id="canvas-width" type="range" min="1" max="40" value="4"><b id="canvas-width-value">4</b></label></div>
          </aside>
          <main class="canvas-center">
            <div class="canvas-view-toolbar"><div><span id="canvas-page-size">1200 × 800</span><span class="canvas-dot">•</span><span id="canvas-tool-hint">Canvas ready</span></div><div class="canvas-zoom"><button id="canvas-zoom-out">−</button><b id="canvas-zoom-value">82%</b><button id="canvas-zoom-in">+</button><button id="canvas-fit">Fit</button></div></div>
            <div id="canvas-viewport" class="canvas-viewport"><div class="canvas-grid-backdrop"><canvas id="gradient-design-canvas" width="1200" height="800" style="touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none"></canvas></div></div>
            <div class="canvas-statusbar"><span>Tip: drag to draw · select objects to move them · Delete removes selection</span><span>Local workspace</span></div>
          </main>
          <aside class="canvas-right-panel" id="canvas-right-panel">
            <button id="canvas-panel-close" class="canvas-panel-close" title="Close">✕</button>
            <section class="canvas-side-card canvas-generate-card">
              <div class="canvas-side-head"><span>Generate with AI</span></div>
              <textarea id="canvas-ai-prompt" rows="3" placeholder="Describe a design… e.g. Create a modern AI coding dashboard"></textarea>
              <div class="canvas-generate-row"><select id="canvas-ai-model" class="canvas-ai-model"></select><button id="canvas-ai-button">Generate</button></div>
            </section>
            <section class="canvas-side-card"><div class="canvas-side-head"><span>Layers</span><span id="canvas-layer-count"></span></div><div id="canvas-layers" class="canvas-layers"></div></section>
            <section class="canvas-side-card"><div class="canvas-side-head"><span>Properties</span></div><div id="canvas-inspector"></div></section>
            <section class="canvas-side-card"><div class="canvas-side-head"><span>Page</span></div><label class="canvas-field"><span>Background</span><input id="canvas-bg" type="color" value="#0b1020"></label><div class="canvas-page-presets"><button data-bg="#0b1020">Dark</button><button data-bg="#ffffff">Light</button><button data-bg="#f4f0ff">Soft</button></div><div class="canvas-switch-row"><label><input id="canvas-grid-toggle" type="checkbox" checked> Grid</label><label><input id="canvas-snap-toggle" type="checkbox" checked> Snap</label></div><div class="canvas-template-grid"><button data-template="dashboard">Dashboard</button><button data-template="wireframe">Wireframe</button></div></section>
          </aside>
        </div>
        <input id="canvas-image-input" type="file" accept="image/*" hidden>
      </div>`;
    const designBadge=stage.querySelector("#canvas-ai-model"); if(designBadge){const pid=ModeAI?.provider("canvas")||State.settings.canvasAI||State.settings.provider;const list=ModeAI?.models("canvas")||TG.APP.providers?.[pid]?.models||[];const saved=ModeAI?.model("canvas")||State.settings.canvasModel;designBadge.innerHTML=list.map(m=>`<option value="${esc(m.id)}" ${m.id===saved?"selected":""}>${esc(m.label||m.id)}</option>`).join("");designBadge.onchange=e=>ModeAI?.setModel?.("canvas",e.target.value);designBadge.title=`${TG.APP.providers?.[pid]?.label||pid} model`;} 
    canvas=stage.querySelector("#gradient-design-canvas");ctx=canvas.getContext("2d");
    ui={
      viewport:stage.querySelector("#canvas-viewport"),toolButtons:Array.from(stage.querySelectorAll("[data-tool]")),colorGrid:stage.querySelector("#canvas-color-grid"),fillColor:stage.querySelector("#canvas-fill"),strokeColor:stage.querySelector("#canvas-stroke"),width:stage.querySelector("#canvas-width"),widthValue:stage.querySelector("#canvas-width-value"),undo:stage.querySelector("#canvas-undo"),redo:stage.querySelector("#canvas-redo"),zoomOut:stage.querySelector("#canvas-zoom-out"),zoomIn:stage.querySelector("#canvas-zoom-in"),fit:stage.querySelector("#canvas-fit"),zoomValue:stage.querySelector("#canvas-zoom-value"),pageSize:stage.querySelector("#canvas-page-size"),toolHint:stage.querySelector("#canvas-tool-hint"),layers:stage.querySelector("#canvas-layers"),inspector:stage.querySelector("#canvas-inspector"),bgColor:stage.querySelector("#canvas-bg"),aiPrompt:stage.querySelector("#canvas-ai-prompt"),aiButton:stage.querySelector("#canvas-ai-button"),model:stage.querySelector("#canvas-ai-model"),save:stage.querySelector("#canvas-save"),export:stage.querySelector("#canvas-export"),clear:stage.querySelector("#canvas-clear"),imageInput:stage.querySelector("#canvas-image-input"),exportJson:stage.querySelector("#canvas-export-json"),exportSvg:stage.querySelector("#canvas-export-svg"),gridToggle:stage.querySelector("#canvas-grid-toggle"),snapToggle:stage.querySelector("#canvas-snap-toggle"),templateButtons:Array.from(stage.querySelectorAll("[data-template]")),rightPanel:stage.querySelector("#canvas-right-panel"),panelToggle:stage.querySelector("#canvas-panel-toggle"),panelClose:stage.querySelector("#canvas-panel-close")
    };
    ui.layerCount=stage.querySelector("#canvas-layer-count");
    ui.panelToggle.onclick=()=>ui.rightPanel.classList.toggle("open");
    ui.panelClose.onclick=()=>ui.rightPanel.classList.remove("open");
    ui.bgColor.addEventListener("input",()=>{snapshot();state.page.background=ui.bgColor.value;render();});
    stage.querySelectorAll("[data-bg]").forEach(b=>b.onclick=()=>{snapshot();state.page.background=b.dataset.bg;render();});
    bind();setTool("select");render();fitPage();loadProject();TG.ModeCore?.scanSidebars?.();
  }

  function unmount(){
    document.body.classList.remove("mode-canvas");stage?.replaceChildren();window.removeEventListener("pointerup",pointerUp);state.textEditor?.remove();state.textEditor=null;stage=null;canvas=null;ctx=null;
  }

  const api={mount,unmount,addImageToCanvas,addImage:addImageToCanvas,exportPng,fit:fitPage};
  window.TheGradientCanvasMode=api;
  window.TheGradientModeModules=window.TheGradientModeModules||{};
  window.TheGradientModeModules.canvas=api;
})();
