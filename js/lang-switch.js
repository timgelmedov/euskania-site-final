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
  // Wide layouts put a CTA at the end of the header row: the control sits just
  // to the left of it, shifted 40px towards the button so the pair reads as one
  // group. Narrow layouts have a hamburger instead, and there the control
  // belongs inside the open menu — between the links and the CTA — so the top
  // bar keeps only the logo and the burger. While the menu is closed there is
  // nowhere sensible to show it, so it is removed.
  var CTA = '[data-framer-name="Call To Action Button"]';
  var LINKS = '[data-framer-name="Navigation Links"]';
  var BURGER = '[data-framer-name="Hamburger Menu Icon"]';
  var DESKTOP_SHIFT = 40;

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

  function build(phone) {
    var here = current();
    var box = document.createElement("div");
    box.setAttribute(MARK, "");
    box.style.cssText = [
      "display:inline-flex", "align-items:center", "gap:2px",
      "padding:2px", "border-radius:30px",
      "background:rgba(17,17,17,.06)",
      "font-family:Geist, system-ui, sans-serif",
      "font-size:" + (phone ? "13px" : "11px"),
      "line-height:1", "flex:0 0 auto",
      // In the menu the control is a row of its own. In the header row it is
      // nudged towards the button it belongs with: the row is space-between,
      // so a margin would be swallowed by the free space and a transform is
      // the only way to move it the full distance.
      phone ? "margin:4px 0" : "transform:translateX(" + DESKTOP_SHIFT + "px)",
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
        "padding:" + (phone ? "9px 14px" : "5px 9px"),
        "border-radius:30px", "text-decoration:none",
        "font-weight:" + (on ? "600" : "500"),
        "color:" + (on ? "#111" : "rgba(17,17,17,.55)"),
        "background:" + (on ? "#92FF8C" : "transparent"),
        "transition:color .2s, background .2s",
      ].join(";");
      box.appendChild(el);
    });
    return box;
  }

  /**
   * Where the control belongs in this header, or null if it belongs nowhere.
   * `after` and `before` name a stable sibling, never the control itself, so
   * the "already in place" test below cannot chase its own insertion.
   */
  function slot(header) {
    // A hamburger means the narrow layout, open or closed.
    if (header.querySelector(BURGER)) {
      var links = header.querySelector(LINKS);
      // Links are only in the DOM while the menu is open.
      if (!links || !links.parentElement) return null;
      return { parent: links.parentElement, after: links, phone: true };
    }
    var cta = header.querySelector(CTA);
    if (cta && cta.parentElement) {
      return { parent: cta.parentElement, before: cta, phone: false };
    }
    return { parent: header, before: null, phone: false };
  }

  function inPlace(el, at) {
    if (el.parentElement !== at.parent) return false;
    if (at.after) return el.previousElementSibling === at.after;
    return el.nextElementSibling === (at.before || null);
  }

  function mount() {
    var headers = document.querySelectorAll(HEADER);
    if (!headers.length) return false;

    var added = false;
    Array.prototype.forEach.call(headers, function (header) {
      var existing = header.querySelector("[" + MARK + "]");
      var at = slot(header);

      if (!at) {
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        return;
      }
      if (existing) {
        if (inPlace(existing, at)) return;
        existing.parentNode.removeChild(existing);
      }
      at.parent.insertBefore(build(at.phone), at.after ? at.after.nextSibling : at.before);
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
