// The verdicts of the blind A/B (results/posudky-<name>*.jsonl) with their keys (results/key-<name>.json: which variant was X
// and which Y), counted per pairing: the variant A (def: the app now) against B.
//   node evaluation/usa/ab/score.mjs
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const lines = (f) => fs.readFileSync(path.join(HERE, "results", f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const key = (name) => { try { return JSON.parse(fs.readFileSync(path.join(HERE, "results", `key-${name}.json`), "utf8")); } catch { return null; } };
const out = {};
for (const f of fs.readdirSync(path.join(HERE, "results")).filter((f) => /^posudky-.*\.jsonl$/.test(f))) {
  for (const j of lines(f)) {
    // An id "ja:ab-1-3" belongs to the pairing <file's name>-ja (the shared changes), a plain id to the file's own.
    const base = f.replace(/^posudky-/, "").replace(/\.jsonl$/, "").replace(/-\d+$/, "").replace(/-zmeny$/, "");
    const [v, id] = j.id.includes(":") ? j.id.split(":") : [null, j.id];
    const name = v ? `${base}-${v}` : base, k = key(name)?.[id];
    if (!k) { console.warn("bez klíče", name, id); continue; }
    const w = j.verdict === "X" || j.verdict === "Y" ? (k[j.verdict] === "def" ? "nová" : "stará") : j.verdict;
    (out[name] ??= {})[w] = (out[name][w] || 0) + 1;
  }
}
for (const [name, c] of Object.entries(out)) console.log(name.padEnd(10), Object.entries(c).map(([w, n]) => `${w} ${n}`).join(", "));
