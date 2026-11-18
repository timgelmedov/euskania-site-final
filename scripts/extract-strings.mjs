/*
 * Collects every translatable Spanish literal out of the Framer modules and
 * writes i18n/eu.json, keeping translations already filled in.
 *
 * The home module is read AFTER the "Instalaciones recientes" section is cut,
 * so the strings that only live there never reach the translator.
 *
 *   node scripts/extract-strings.mjs
 */
import fs from "node:fs";
import {
  TEXT_CHUNKS, HOME_CHUNK, readChunk, literals, isTranslatable,
  cutSection, PROJECTS_SECTION,
} from "./lib-chunks.mjs";

const OUT = "i18n/eu.json";
const root = process.cwd();
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};

const found = new Map();
for (const name of TEXT_CHUNKS) {
  let text = readChunk(root, name);
  if (name === HOME_CHUNK) text = cutSection(text, PROJECTS_SECTION).text;
  for (const s of literals(text)) {
    if (isTranslatable(s) && !found.has(s)) found.set(s, name);
  }
}

const keys = [...found.keys()].sort((a, b) => b.length - a.length);
const out = {};
let done = 0;
for (const k of keys) {
  out[k] = existing[k] ?? "";
  if (out[k]) done += 1;
}

fs.mkdirSync("i18n", { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

const words = keys.reduce((n, s) => n + s.trim().split(/\s+/).length, 0);
const stale = Object.keys(existing).filter((k) => !(k in out));
console.log(`${keys.length} strings, ~${words} words`);
console.log(`translated: ${done}   pending: ${keys.length - done}`);
if (stale.length) console.log(`dropped (no longer in source): ${stale.length}`);
