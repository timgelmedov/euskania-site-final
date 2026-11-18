/*
 * Generates the Basque version of the site at /eu/ from the Spanish source.
 *
 * Everything under eu/ and js/framer-eu/ is generated: never edit it by hand.
 * Re-run after a new Framer export, or after editing i18n/eu.json.
 *
 *   node scripts/build-eu.mjs
 *
 * The run is idempotent: it strips the tags a previous run injected into the
 * Spanish pages before injecting them again.
 */
import fs from "node:fs";
import path from "node:path";
import {
  FRAMER_DIR, HOME_CHUNK, TEXT_CHUNKS, applyTable,
  cutSection, cutHtmlSection, PROJECTS_SECTION, replaceSplitText, META_CHUNKS,
} from "./lib-chunks.mjs";
import { META } from "./translations-eu.mjs";

const SITE = "https://euskania.es";
const EU_FRAMER = "js/framer-eu";
const SCRIPT_MAIN = "script_main.CDmpK-ud.mjs";
const PROJECTS_HTML_CLASS = "framer-1fsn8ne";

const PAGES = [
  { es: "index.html",         eu: "eu/index.html",         pathEs: "/",        pathEu: "/eu" },
  { es: "contact/index.html", eu: "eu/contact/index.html", pathEs: "/contact", pathEu: "/eu/contact" },
  { es: "404/index.html",     eu: "eu/404/index.html",     pathEs: "/404",     pathEu: "/eu/404" },
];

const SWITCH_TAG = '<script defer src="/js/lang-switch.js"></script>';
const HREFLANG_RE = /<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g;
const SWITCH_RE = /<script defer src="\/js\/lang-switch\.js"><\/script>/g;

/** Removes tags a previous run injected, so the build can run repeatedly. */
function stripInjected(html) {
  return html.replace(HREFLANG_RE, "").replace(SWITCH_RE, "");
}

function hreflang(pathEs, pathEu) {
  return `<link rel="alternate" hreflang="es-ES" href="${SITE}${pathEs}">`
       + `<link rel="alternate" hreflang="eu-ES" href="${SITE}${pathEu}">`
       + `<link rel="alternate" hreflang="x-default" href="${SITE}${pathEs}">`;
}

const table = JSON.parse(fs.readFileSync("i18n/eu.json", "utf8"));
const total = Object.keys(table).length;
const filled = Object.values(table).filter((v) => v && v.trim()).length;
console.log(`table: ${filled}/${total} translated`);

/* ---------- 1. modules -------------------------------------------- */

fs.rmSync(EU_FRAMER, { recursive: true, force: true });
fs.mkdirSync(EU_FRAMER, { recursive: true });

let moduleHits = 0;
for (const name of fs.readdirSync(FRAMER_DIR)) {
  let text = fs.readFileSync(path.join(FRAMER_DIR, name), "utf8");

  if (name === HOME_CHUNK) {
    const cut = cutSection(text, PROJECTS_SECTION);
    text = cut.text;
    console.log(`cut "${PROJECTS_SECTION.name}": -${cut.removedChars} chars`);
  }

  if (TEXT_CHUNKS.includes(name)) {
    const r = applyTable(text, table);
    text = r.text;
    moduleHits += r.hits;
  }

  // The router rewrites document.title from these after hydration.
  if (META_CHUNKS.includes(name)) {
    const r = applyTable(text, META);
    text = r.text;
    moduleHits += r.hits;
  }

  if (name === SCRIPT_MAIN) {
    // Keep the client router inside /eu and report Basque as the locale.
    text = text
      .replace("path:`/contact`", "path:`/eu/contact`")
      .replace("path:`/404`", "path:`/eu/404`")
      .replace(/path:`\/`/, "path:`/eu`")
      .replace(
        "q=[{code:`es`,id:`default`,name:`Español`,slug:``,textDirection:`ltr`}]",
        "q=[{code:`eu`,id:`default`,name:`Euskara`,slug:``,textDirection:`ltr`}]",
      );
  }

  fs.writeFileSync(path.join(EU_FRAMER, name), text);
}
console.log(`modules: ${fs.readdirSync(EU_FRAMER).length} written, ${moduleHits} replacements`);

/* ---------- 2. Basque pages --------------------------------------- */

let htmlHits = 0;
let splitHits = 0;
for (const p of PAGES) {
  let html = stripInjected(fs.readFileSync(p.es, "utf8"));

  if (p.es === "index.html") {
    const c = cutHtmlSection(html, PROJECTS_HTML_CLASS);
    html = c.html;
    if (!c.removed) console.warn("  ! projects section not found in index.html");
  }

  html = html
    .split(`/${FRAMER_DIR}/`).join(`/${EU_FRAMER}/`)
    .replace('<html lang="es"', '<html lang="eu"')
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${SITE}${p.pathEu}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE}${p.pathEu}"`)
    .replace(/<meta property="og:locale" content="[^"]*"/, '<meta property="og:locale" content="eu_ES"');

  const r = applyTable(html, table);
  html = r.text;
  htmlHits += r.hits;

  // Headings Framer split into one span per word survive hydration, so the
  // markup itself has to carry the Basque.
  for (const [es, eu] of Object.entries(table)) {
    if (!eu || !eu.trim()) continue;
    const sp = replaceSplitText(html, es, eu);
    html = sp.html;
    splitHits += sp.hits;
  }

  // Title and description live in the head, outside the Framer modules.
  const m = applyTable(html, META);
  html = m.text;
  htmlHits += m.hits;

  html = html.replace("</head>", hreflang(p.pathEs, p.pathEu) + SWITCH_TAG + "</head>");

  fs.mkdirSync(path.dirname(p.eu), { recursive: true });
  fs.writeFileSync(p.eu, html);
}
console.log(`pages: ${PAGES.length} written, ${htmlHits} replacements, ${splitHits} split headings`);

/* ---------- 3. hreflang + switcher on the Spanish pages ----------- */

for (const p of PAGES) {
  const html = stripInjected(fs.readFileSync(p.es, "utf8"))
    .replace("</head>", hreflang(p.pathEs, p.pathEu) + SWITCH_TAG + "</head>");
  fs.writeFileSync(p.es, html);
}
console.log("spanish pages: hreflang + switcher injected");

/* ---------- 4. sitemap -------------------------------------------- */

const today = new Date().toISOString().slice(0, 10);
const url = (loc, prio, freq) =>
  `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n`
  + `    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
fs.writeFileSync(
  "sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + [url("/", "1.0", "monthly"), url("/contact", "0.8", "yearly"),
     url("/eu", "0.9", "monthly"), url("/eu/contact", "0.7", "yearly")].join("\n")
  + "\n</urlset>\n",
);
console.log("sitemap: 4 urls");
