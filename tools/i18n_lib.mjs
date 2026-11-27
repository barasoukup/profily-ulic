// The languages' files (app/public/locales/<lang>.json) for the tools i18n_add, i18n_export, i18n_import: read, write
// (keys sorted, one per line, as the translators' tools write them), the list of texts not yet translated
// (locales/_todo.json: { "<lang>": ["<key>", …] }, the text there is English for now) and CSV.
import fs from "node:fs";
import path from "node:path";

export const LOCALES = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "app", "public", "locales");
export const LANGS = fs.readdirSync(LOCALES).filter((f) => /^[a-z]{2}\.json$/.test(f)).map((f) => f.slice(0, 2)).sort();
export const KEY = /^[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9-]+)+$/;
export const params = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const file = (name) => path.join(LOCALES, `${name}.json`);
export const readLang = (l) => JSON.parse(fs.readFileSync(file(l), "utf8"));
const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
export const writeLang = (l, o) => fs.writeFileSync(file(l), JSON.stringify(sorted(o), null, 1) + "\n");
export const readTodo = () => { try { return JSON.parse(fs.readFileSync(file("_todo"), "utf8")); } catch { return {}; } };
export function writeTodo(todo) {
  const out = Object.fromEntries(Object.keys(todo).sort().filter((l) => todo[l].length).map((l) => [l, [...new Set(todo[l])].sort()]));
  if (Object.keys(out).length) fs.writeFileSync(file("_todo"), JSON.stringify(out, null, 1) + "\n");
  else fs.rmSync(file("_todo"), { force: true });
}

// CSV as Numbers, Excel and LibreOffice read it (comma, "…" with "" inside, UTF-8 with a BOM so Excel takes the accents).
const cell = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export const toCsv = (rows) => "﻿" + rows.map((r) => r.map((v) => cell(String(v ?? ""))).join(",")).join("\r\n") + "\r\n";
export function fromCsv(text) {
  text = text.replace(/^﻿/, "");
  // A sheet saved with ; (Excel in Czech) is read too.
  const sep = /^[^\n]*;/.test(text) && !/^[^\n]*,/.test(text) ? ";" : ",";
  const rows = [];
  let row = [], v = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { v += '"'; i++; } else if (c === '"') q = false; else v += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(v); v = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(v); rows.push(row); row = []; v = ""; }
    else v += c;
  }
  if (v || row.length) { row.push(v); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ""));
}
