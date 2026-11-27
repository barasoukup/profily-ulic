// A language's texts as a table for a native speaker (Numbers, Excel, LibreOffice): key | cs | en | <lang> | todo
// ("ano" where the text is still English, locales/_todo.json). The speaker corrects the column of the language and
// sends the table back: node tools/i18n_import.mjs <lang> <file.csv>.
//   node tools/i18n_export.mjs <lang> [file.csv] [--todo]   (--todo: only the texts not yet translated)
import fs from "node:fs";
import { LANGS, readLang, readTodo, toCsv } from "./i18n_lib.mjs";

const args = process.argv.slice(2);
const only = args.includes("--todo");
const [lang, out = `${args[0]}.csv`] = args.filter((a) => a !== "--todo");
if (!LANGS.includes(lang) || lang === "cs") { console.error(`node tools/i18n_export.mjs <jazyk> [soubor.csv] [--todo]; jazyky: ${LANGS.filter((l) => l !== "cs").join(" ")}`); process.exit(1); }
const cs = readLang("cs"), en = readLang("en"), tab = readLang(lang), todo = new Set(readTodo()[lang] || []);
const rows = [["key", "cs", "en", lang, "todo"]];
for (const k of Object.keys(cs)) if (!only || todo.has(k)) rows.push([k, cs[k], en[k], tab[k], todo.has(k) ? "ano" : ""]);
fs.writeFileSync(out, toCsv(lang === "en" ? rows.map((r) => [r[0], r[1], r[3], r[4]]) : rows));
console.log(`${out}: ${rows.length - 1} textů (${todo.size} k překladu)`);
