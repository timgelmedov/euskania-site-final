/*
 * Writes scripts/translations-eu.mjs into i18n/eu.json.
 *
 * Untranslated entries are harmless: the build skips empty values and leaves
 * the Spanish in place. The report below exists so that a string which SHOULD
 * have been translated does not slip through unnoticed.
 *
 *   node scripts/apply-translations.mjs
 */
import fs from "node:fs";
import { TRANSLATIONS, SKIP, REVIEW } from "./translations-eu.mjs";

const OUT = "i18n/eu.json";
const table = JSON.parse(fs.readFileSync(OUT, "utf8"));
const skip = new Set(SKIP);

const missing = [];
let applied = 0;
for (const [es, eu] of TRANSLATIONS) {
  if (!(es in table)) { missing.push(es); continue; }
  table[es] = eu;
  applied += 1;
}

fs.writeFileSync(OUT, JSON.stringify(table, null, 2) + "\n");

const keys = Object.keys(table);
const done = keys.filter((k) => table[k] && table[k].trim());
const pending = keys.filter((k) => (!table[k] || !table[k].trim()) && !skip.has(k));

console.log(`applied:     ${applied}/${TRANSLATIONS.length}`);
console.log(`translated:  ${done.length}`);
console.log(`left as-is:  ${keys.length - done.length - pending.length} (SKIP list)`);
console.log(`candidates not translated: ${pending.length}`);

if (missing.length) {
  console.log(`\ntranslations with no matching source string (${missing.length}):`);
  missing.forEach((s) => console.log("  -", JSON.stringify(s.slice(0, 70))));
}
console.log(`\nterms flagged for a native review: ${REVIEW.length}`);
