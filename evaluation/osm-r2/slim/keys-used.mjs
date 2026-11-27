// Which tag keys of the packs the app's code can read (evaluation/osm-r2/slim): every word of the code of pilot/public
// (comments left out, translations too) is taken as a key it may read, with the parts of a key before a colon (a key
// built in a template, `parking:${side}`) and the words of regular expressions. Conservative: a word used for anything
// else keeps a key of that name. Then the keys of the measured packs (composition.mjs --json, FULL=1) that no word names,
// by their share of the packs.
//   node evaluation/osm-r2/slim/keys-used.mjs data/slimtest/comp-*.json
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "../../../pilot/public");
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.js$/.test(f)) files.push(p); } };
walk(ROOT);
// Translations (a file of a language: two letters) only hold texts.
const code = files.filter((f) => !/\/[a-z]{2}\.js$/.test(f)).map((f) => fs.readFileSync(f, "utf8"));
const words = new Set();
for (let src of code) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\"'`])\/\/[^\n]*/g, "$1");
  for (const m of src.matchAll(/[A-Za-z_][A-Za-z0-9_:]*/g)) {
    words.add(m[0]);
    // A word ending in a colon or holding colons: each of its prefixes.
    const parts = m[0].split(":");
    for (let i = 1; i <= parts.length; i++) words.add(parts.slice(0, i).join(":"));
  }
}
// "exact": the code names the key; "colon P": a template builds it from P (`P:${x}`); "word P": only a word P before a
// colon of it (Object.keys(tags).some((k) => k.startsWith("P")), or a word used for something else).
export const readable = (key) => {
  if (words.has(key)) return "exact";
  const parts = key.split(":");
  for (let i = parts.length - 1; i >= 1; i--) if (words.has(parts.slice(0, i).join(":") + ":")) return `colon ${parts.slice(0, i).join(":")}`;
  for (let i = parts.length - 1; i >= 1; i--) if (words.has(parts.slice(0, i).join(":"))) return `word ${parts.slice(0, i).join(":")}`;
  return null;
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const total = {}, all = {};
  let sum = 0;
  for (const f of process.argv.slice(2)) {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    sum += j.total;
    for (const [k, r] of Object.entries(j.keys)) if (k.startsWith("tag ")) { all[k.slice(4)] = (all[k.slice(4)] || 0) + r.gz; }
  }
  const rows = Object.entries(all).sort((a, b) => b[1] - a[1]);
  let unused = 0, prefixOnly = 0;
  const show = [];
  for (const [k, gz] of rows) {
    const r = readable(k);
    if (!r) unused += gz;
    else if (r.startsWith("word")) prefixOnly += gz;
    if (gz / sum > 0.0003) show.push(`${(100 * gz / sum).toFixed(2).padStart(6)} %  ${(gz / 1e6).toFixed(2).padStart(7)} MB  ${r || "-"}  ${k}`);
  }
  console.log(show.join("\n"));
  console.log(`\nall tags ${(rows.reduce((s, r) => s + r[1], 0) / 1e6).toFixed(1)} MB of ${(sum / 1e6).toFixed(1)} MB; named by no word ${(unused / 1e6).toFixed(1)} MB, only by a word before a colon ${(prefixOnly / 1e6).toFixed(1)} MB`);
}
