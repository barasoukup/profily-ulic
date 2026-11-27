// A language's table back from a native speaker (tools/i18n_export.mjs): the column of the language (by its header)
// into locales/<lang>.json. A text that differs is taken when its {names} are those of the Czech; a key the app does
// not have, or other {names}, is reported and left out. A text taken is off the list to translate (locales/_todo.json),
// as is one the speaker kept as it was where "todo" is cleared.
//   node tools/i18n_import.mjs <lang> <file.csv> [--dry]
import fs from "node:fs";
import { LANGS, params, readLang, writeLang, readTodo, writeTodo, fromCsv } from "./i18n_lib.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const [lang, file] = args.filter((a) => a !== "--dry");
if (!LANGS.includes(lang) || lang === "cs" || !file) { console.error("node tools/i18n_import.mjs <jazyk> <soubor.csv> [--dry]"); process.exit(1); }
const [head, ...rows] = fromCsv(fs.readFileSync(file, "utf8"));
const at = (name) => head.findIndex((h) => h.trim().toLowerCase() === name);
const K = at("key"), V = at(lang), T = at("todo");
if (K < 0 || V < 0) { console.error(`tabulka nemá sloupec key a ${lang}`); process.exit(1); }
const cs = readLang("cs"), tab = readLang(lang), todo = readTodo();
const left = new Set(todo[lang] || []);
let changed = 0, kept = 0;
const problems = [];
for (const r of rows) {
  const k = r[K]?.trim(), v = r[V] ?? "";
  if (!k) continue;
  if (!(k in cs)) { problems.push(`${k}: aplikace takový klíč nemá`); continue; }
  if (!v.trim()) { problems.push(`${k}: prázdný text`); continue; }
  if (params(v) !== params(cs[k])) { problems.push(`${k}: jiné {jména} (${params(v) || "žádná"}, česky ${params(cs[k]) || "žádná"})`); continue; }
  if (v !== tab[k]) { tab[k] = v; changed++; left.delete(k); }
  else if (T >= 0 && !r[T]?.trim() && left.has(k)) { left.delete(k); kept++; }
}
if (!dry) {
  writeLang(lang, tab);
  todo[lang] = [...left];
  writeTodo(todo);
}
console.log(`${lang}: ${changed} textů změněno, ${kept} ponecháno jako přeložené, ${left.size} zbývá přeložit${dry ? " (--dry: nic nezapsáno)" : ""}`);
if (problems.length) console.log(`Vynecháno (${problems.length}):\n  ${problems.join("\n  ")}`);
