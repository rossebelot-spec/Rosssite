/**
 * Runs at end of <body> (before deferred React). Injects the same
 * #site-header-height-live rule as components/nav.tsx so --site-header-height
 * matches the real header before hydration (avoids CLS from 4.5rem fallback).
 * Nav’s ResizeObserver then keeps it updated.
 */
export const SITE_HEADER_HEIGHT_BOOTSTRAP = `(function(){
var el=document.querySelector("body>header");
if(!el)return;
var s=document.getElementById("site-header-height-live");
if(!s){s=document.createElement("style");s.id="site-header-height-live";document.head.appendChild(s);}
s.textContent=":root { --site-header-height: "+el.offsetHeight+"px; }";
})();`;
