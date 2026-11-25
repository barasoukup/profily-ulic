// The lane count and the kerb parking of DC's changed pairs against two judges who saw no profile (results/ddot-lanes-*.jsonl; only
// where both say the same).   node lanes-score.mjs
import fs from "node:fs";
import { sign } from "./stat.mjs";
const here = (f) => new URL(f, import.meta.url), L = (f) => fs.readFileSync(here(f), "utf8").trim().split("\n").map((l) => JSON.parse(l)), key = JSON.parse(fs.readFileSync(here("results/key.json"), "utf8"));
const rows = JSON.parse(fs.readFileSync(here("../../universal/data/na-review.json"), "utf8")), a = L("results/ddot-lanes-a.jsonl"), b = L("results/ddot-lanes-b.jsonl");
const LANES = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "obsluzna", "tramvaj_v_pruhu"]);
const of = (id, v) => { const p = rows.find((r) => r.id === id && r.variant === v).parts, i = p.findIndex(([t]) => LANES.has(t)), j = p.findLastIndex(([t]) => LANES.has(t)); return { lanes: p.filter(([t]) => LANES.has(t)).length, parkA: +p.slice(0, i).some(([t]) => t === "parkovani"), parkB: +p.slice(j + 1).some(([t]) => t === "parkovani") }; };
for (const [what, keys] of [["pruhy", ["lanes"]], ["stání (strany)", ["parkA", "parkB"]]]) {
  let n = 0, on = 0, off = 0, w = 0, l = 0, dif = 0;
  for (const x of a) {
    const y = b.find((q) => q.pack === x.pack && q.n === x.n), k = key[`ddot-${x.pack}/${x.n}`];
    if (!k || !y) continue;
    const d = of(k.id, "def"), o = of(k.id, "ddot0");
    for (const q of keys) { if (x[q] == null || y[q] == null || x[q] !== y[q]) { dif++; continue; } n++; const p = d[q] === x[q], r = o[q] === x[q]; on += p; off += r; if (p && !r) w++; if (r && !p) l++; }
  }
  console.log(`${what}: ${n} posouzených (${dif} bez shody posuzovatelů), správně s inventářem ${on}, bez něj ${off}; lépe ${w}, hůř ${l}, p = ${sign(w, l).toFixed(3)}`);
}
