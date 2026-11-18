/* Shared helpers for the Basque build. */
import fs from "node:fs";
import path from "node:path";

export const FRAMER_DIR = "js/framer";

/** The two modules that carry page copy, plus the per-page ones. */
export const HOME_CHUNK = "-6xHlvkpZ7-QC4u251N5eOmm3R2xhrQi-_U2EJYoA1Q.xjm2LPSw.mjs";

export const TEXT_CHUNKS = [
  "-6xHlvkpZ7-QC4u251N5eOmm3R2xhrQi-_U2EJYoA1Q.xjm2LPSw.mjs", // home
  "toplevel-deps.CjrmDoBT.mjs",                                // footer, shared
  "t5iKQ8d1wFMhoyH7DV4IbKe320dVl0fO91kkqrkkrsE.B-oH4-PK.mjs",  // contact
  "no2RKcSFhp297CW21OOCE2lPPCDvarfhIlb2IEOt0jU.D_8syILo.mjs",  // 404
];

/** Small modules holding each route title and description for the router. */
export const META_CHUNKS = [
  "augiA20Il.Bmqrdqw_.mjs",   // home
  "V1Jng5KWX.tYpUPCG9.mjs",   // contact
  "iJJW5qoTL.CPqw_SqL.mjs",   // 404 and site defaults
];

export const HTML_PAGES = ["index.html", "contact/index.html", "404/index.html", "404.html"];

/**
 * Strings that look like Spanish prose to a regex but are actually values the
 * runtime switches on. Translating these breaks scrolling, autoplay or links.
 */
export const DO_NOT_TRANSLATE = new Set([
  "pan-y",
  "overflow-y",
  "no-autoplay",
  "No Mobile Parallax",
  "No reels available",
  "No",
  "auto",
  "none",
  "mailto:euskania.es@gmail.com",
  "euskania.es@gmail.com",
  "Inter",
  "Geist",
  "Host Grotesk",
]);

/**
 * Candidate translatable literal.
 *
 * Deliberately permissive: it accepts anything that reads as human text and
 * leans on DO_NOT_TRANSLATE for the handful of prose-looking config values.
 * An earlier version required a Spanish accent or function word, and silently
 * dropped short labels such as "Avisos a tiempo" or "Ver soluciones".
 */
export function isTranslatable(s) {
  if (DO_NOT_TRANSLATE.has(s)) return false;
  if (s.length < 2 || s.length > 400) return false;
  if (/[{}<>;=|\\]/.test(s)) return false;                 // code fragments
  if (/https?:|rgba?\(|var\(|\d+px\b|^--|^#|@/.test(s)) return false;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(s)) return false;       // needs a letter
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) return false;      // pan-y, no-autoplay
  if (/^[A-Za-z0-9_$]+$/.test(s) && !/^[A-ZÁÉÍÓÚÑ]/.test(s)) return false;

  // Structural noise that still reads as text to the rules above.
  if (/^[MmLlHhVvCcSsQqTtAaZz][\d\s.,-]/.test(s)) return false;  // SVG path data
  if (/^U\+[0-9A-Fa-f]/.test(s)) return false;                   // unicode ranges
  if (/gradient\(|cubic-bezier|calc\(|sans-serif|monospace|Placeholder/.test(s)) return false;

  // English left over from the Framer template, which never renders on the
  // Spanish site. Requires no Spanish-only character AND two English function
  // words, a combination no Spanish sentence satisfies.
  const spanish = /[áéíóúüñÁÉÍÓÚÑ¿¡]/.test(s);
  const english = (s.match(/\b(the|your|with|this|you|are|can|that|our|for|from|will|have|its|and)\b/gi) || []).length;
  if (!spanish && english >= 2) return false;

  return true;
}

export function readChunk(root, name) {
  return fs.readFileSync(path.join(root, FRAMER_DIR, name), "utf8");
}

/** Every backtick literal in a file, in order. */
export function literals(text) {
  return [...text.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
}

/* ------------------------------------------------------------------ */
/*  Removing a whole page section from the home module                 */
/* ------------------------------------------------------------------ */

/**
 * Sections are sibling `p(v.section,{className:`framer-xxxx`, …})` calls in a
 * children array. Cutting from one section's anchor up to the next one's
 * removes it whole, without having to balance parentheses across 240k chars.
 */
export function cutSection(text, { fromClass, toClass, name }) {
  const start = text.indexOf("/*#__PURE__*/ p(v.section,{className:`" + fromClass + "`");
  const end = text.indexOf("/*#__PURE__*/ p(v.section,{className:`" + toClass + "`");
  if (start < 0) throw new Error(`cutSection: start anchor ${fromClass} not found`);
  if (end < 0) throw new Error(`cutSection: end anchor ${toClass} not found`);
  if (end <= start) throw new Error(`cutSection: ${toClass} precedes ${fromClass}`);
  // The sections are comma separated; swallow the comma that joined them.
  let from = start;
  if (text[from - 1] === ",") from -= 1;
  const removed = text.slice(from, end - 1 === from ? end : end);
  // keep the separating comma that now joins the previous and next sections
  const out = text.slice(0, from) + text.slice(end - 1);
  return { text: out, removedChars: text.length - out.length, name };
}

export const PROJECTS_SECTION = {
  name: "Savings & Impact Section (Instalaciones recientes)",
  fromClass: "framer-1fsn8ne",
  toClass: "framer-h7qpa4",
};

/* ------------------------------------------------------------------ */
/*  Translation                                                        */
/* ------------------------------------------------------------------ */

/**
 * Applies the table to a file's text. Keys are replaced longest-first so a
 * short string can never eat a longer one that contains it. Empty values are
 * skipped, which is what lets the pipeline run on a partial translation.
 */
export function applyTable(text, table) {
  const keys = Object.keys(table)
    .filter((k) => table[k] && table[k].trim())
    .sort((a, b) => b.length - a.length);
  let hits = 0;
  for (const k of keys) {
    const parts = text.split(k);
    if (parts.length > 1) {
      hits += parts.length - 1;
      text = parts.join(table[k]);
    }
  }
  return { text, hits };
}

/* ------------------------------------------------------------------ */
/*  Removing the same section from the server-rendered HTML            */
/* ------------------------------------------------------------------ */

/** Cuts `<section class="CLS" …> … </section>`, counting nested sections. */
export function cutHtmlSection(html, cls) {
  const open = html.indexOf(`<section class="${cls}"`);
  if (open < 0) return { html, removed: 0 };
  let i = open, depth = 0;
  const openTag = /<section\b/g, closeTag = /<\/section>/g;
  while (i < html.length) {
    openTag.lastIndex = i; closeTag.lastIndex = i;
    const o = openTag.exec(html), c = closeTag.exec(html);
    if (!c) break;
    if (o && o.index < c.index) { depth += 1; i = o.index + 8; }
    else {
      depth -= 1;
      i = c.index + 10;
      if (depth === 0) {
        const out = html.slice(0, open) + html.slice(i);
        return { html: out, removed: html.length - out.length };
      }
    }
  }
  return { html, removed: 0 };
}

/* ------------------------------------------------------------------ */
/*  Headings that Framer splits into one span per word                 */
/* ------------------------------------------------------------------ */

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Framer's appear effect emits headings as `<span style="…">word</span>`
 * runs. React keeps that server markup on hydration instead of re-rendering
 * it from the module, so these headings have to be translated in the HTML as
 * well. Matches a run of spans whose words join to `es` and rewrites it with
 * the Basque words, reusing the first span's style.
 */
export function replaceSplitText(html, es, eu) {
  const words = es.trim().split(/\s+/);
  if (words.length < 2) return { html, hits: 0 };

  const span = (w) => `<span style="([^"]*)">${escapeRe(w)}</span>`;
  const re = new RegExp(words.map(span).join("(\\s*)"), "g");

  let hits = 0;
  const out = html.replace(re, (match, ...groups) => {
    hits += 1;
    const style = groups[0];
    const gap = typeof groups[1] === "string" && /\s/.test(groups[1]) ? groups[1] : " ";
    return eu.trim().split(/\s+/)
      .map((w) => `<span style="${style}">${w}</span>`)
      .join(gap);
  });
  return { html: out, hits };
}
