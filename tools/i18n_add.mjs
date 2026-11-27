// A new text of the app in every language (docs/coding-guidelines.md, Texts): its key, its Czech and its English;
// the other 22 languages get the English for now and the key goes on their list of texts to translate
// (locales/_todo.json; tools/i18n_export.mjs hands them to a translator, i18n_import.mjs takes them back).
//   node tools/i18n_add.mjs <key> "<cs>" "<en>" [--de "<de>"] [--sk "<sk>"] …   a new key
//   node tools/i18n_add.mjs <key> "<cs>" "<en>" --change                          a changed text: Czech and English
//                                                                                 anew, the others to translate again
// The key: <area>.<name> in English, the area by where the text is (part, note, page, app, country.at, city.brno …;
// see the keys there are), e.g. note.mapDown. {name} as in the Czech in every language.
import { LANGS, KEY, params, readLang, writeLang, readTodo, writeTodo } from "./i18n_lib.mjs";

const args = process.argv.slice(2);
const change = args.includes("--change");
const own = {};
for (let i = 0; i < args.length; i++) if (/^--[a-z]{2}$/.test(args[i])) { own[args[i].slice(2)] = args[i + 1]; args.splice(i, 2); i--; }
const [key, cs, en] = args.filter((a) => a !== "--change");
const fail = (m) => { console.error(m); process.exit(1); };
if (!key || cs === undefined || en === undefined) fail('node tools/i18n_add.mjs <klíč> "<česky>" "<anglicky>" [--de "<německy>"] [--change]');
if (!KEY.test(key)) fail(`klíč ${key}: oblast.jméno anglicky, např. note.mapDown`);
if (!cs.trim() || !en.trim()) fail("prázdný text");
for (const [l, v] of Object.entries({ en, ...own })) {
  if (!LANGS.includes(l)) fail(`neznámý jazyk ${l}`);
  if (params(v) !== params(cs)) fail(`${l}: jiné {jména} než česky (${params(v) || "žádná"} ≠ ${params(cs) || "žádná"})`);
}
const csTab = readLang("cs");
if (key in csTab && !change) fail(`klíč ${key} už je („${csTab[key]}“); změna textu: --change`);
if (!(key in csTab) && change) fail(`klíč ${key} není; nový bez --change`);

const todo = readTodo();
for (const l of LANGS) {
  const tab = l === "cs" ? csTab : readLang(l);
  tab[key] = l === "cs" ? cs : l === "en" ? en : own[l] ?? en;
  writeLang(l, tab);
  if (l !== "cs" && l !== "en" && !(l in own)) (todo[l] ??= []).push(key);
  else if (todo[l]) todo[l] = todo[l].filter((k) => k !== key);
}
writeTodo(todo);
const left = LANGS.filter((l) => !["cs", "en"].includes(l) && !(l in own));
console.log(`${key}: ${change ? "změněno" : "přidáno"} ve ${LANGS.length} jazycích${left.length ? `; k překladu (zatím anglicky) v ${left.length}: ${left.join(" ")} (locales/_todo.json)` : ""}`);
