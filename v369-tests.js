/* The Gradient 3.6.9 — non-blocking startup diagnostics */
(function(){
  "use strict";
  window.Gradient369Diagnostics={run(){const TG=window.TheGradient;return{core:!!TG,uid:typeof TG?.uid==="function",router:!!window.TheGradientModeRouter,software:!!window.TheGradientModeModules?.software,imagine:!!window.TheGradientModeModules?.imagine,canvas:!!window.TheGradientModeModules?.canvas,documents:!!window.TheGradientModeModules?.documents,studio:!!TG?.StudioFormats};}};
})();
