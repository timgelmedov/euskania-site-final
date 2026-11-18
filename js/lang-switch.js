/*
 * Euskania — ES / EU language switch.
 *
 * The header is rendered by Framer's React runtime, so the control is injected
 * after hydration and re-injected if a re-render drops it. Styling follows the
 * site: Geist, #111 ink, #92FF8C accent, pill radius.
 */
(function () {
  "use strict";

  var MARK = "data-euskania-lang";
  var HEADER = '[data-framer-name="Header Container"]';
  // Wide layouts put a CTA at the end of the header row: the control goes
  // immediately before it. Narrow layouts drop the CTA for a hamburger, and
  // the header becomes a COLUMN, so appending to it would push the control
  // onto a second row; there it goes into the logo row, before the hamburger.
  // Either way it sits to the left of the button.
  var CTA = '[data-framer-name="Call To Action Button"]';
  var ROW = '[data-framer-name="Logo And Hamburger"]';
  var BURGER = '[data-framer-name="Hamburger Menu Icon"]';

  function current() {
    return /^\/eu(\/|$)/.test(location.pathname) ? "eu" : "es";
  }

  /** The same page in the other language. */
  function counterpart(lang) {
    var p = location.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "") || "/";
    if (lang === "eu") {
      if (p === "/") return "/eu";
      return "/eu" + p;
    }
    return p.replace(/^\/eu/, "") || "/";
  }

  function build() {
    var here = current();
    var box = document.createElement("div");
    box.setAttribute(MARK, "");
    box.style.cssText = [
      "display:inline-flex", "align-items:center", "gap:2px",
      "padding:2px", "border-radius:30px",
      "background:rgba(17,17,17,.06)",
      "font-family:Geist, system-ui, sans-serif", "font-size:11px",
      "line-height:1", "flex:0 0 auto",
    ].join(";");

    [["es", "ES"], ["eu", "EU"]].forEach(function (pair) {
      var code = pair[0], label = pair[1];
      var on = code === here;
      var el = document.createElement(on ? "span" : "a");
      if (!on) {
        el.href = counterpart(code);
        el.setAttribute("hreflang", code === "eu" ? "eu-ES" : "es-ES");
      }
      el.textContent = label;
      el.setAttribute("aria-label", code === "eu" ? "Euskaraz" : "En español");
      if (on) el.setAttribute("aria-current", "true");
      el.style.cssText = [
        "padding:5px 9px", "border-radius:30px", "text-decoration:none",
        "font-weight:" + (on ? "600" : "500"),
        "color:" + (on ? "#111" : "rgba(17,17,17,.55)"),
        "background:" + (on ? "#92FF8C" : "transparent"),
        "transition:color .2s, background .2s",
      ].join(";");
      box.appendChild(el);
    });
    return box;
  }

  function mount() {
    var headers = document.querySelectorAll(HEADER);
    if (!headers.length) return false;

    var added = false;
    Array.prototype.forEach.call(headers, function (header) {
      if (header.querySelector("[" + MARK + "]")) return;

      var cta = header.querySelector(CTA);
      if (cta && cta.parentElement) {
        cta.parentElement.insertBefore(build(), cta);
        added = true;
        return;
      }

      var row = header.querySelector(ROW) || header;
      var burger = row.querySelector(BURGER);
      if (burger) row.insertBefore(build(), burger);
      else row.appendChild(build());
      added = true;
    });
    return added;
  }

  function start() {
    mount();
    // Framer re-renders the header on route change and on breakpoint switches.
    var obs = new MutationObserver(function () { mount(); });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
