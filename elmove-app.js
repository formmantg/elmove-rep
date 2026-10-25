(function(){
  "use strict";
  var p = window.elmove || {};
  window.elmove = Object.assign({ isElectron:true, version:"1.0.0" }, p);
  window.cookiehub = window.cookiehub || { load:function(){} };
  var s = document.createElement("style");
  s.textContent = "#cookiehub,.ch2,.ch2-container,[id*='cookiehub'],[class*='cookiehub'],.cc-window,#Cookiebot,#onetrust-banner-sdk{display:none!important;}";
  (document.head||document.documentElement).appendChild(s);
})();
