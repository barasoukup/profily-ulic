// The blind judgements (vysledky/posudek-<package>.json) against the keys, two judges a cut; W against the other arm.
// A cut counts for an arm when one judge chose it and the other did not choose the opposite; two opposite judges: "neshoda".
// ONLY=regex of the ids, IDS=file of ids.
//   node vyhodnoceni.mjs N a1,a2,…,b8 [v]
import fs from "node:fs";
const only = process.env.ONLY && new RegExp(process.env.ONLY), IDS = process.env.IDS && new Set(JSON.parse(fs.readFileSync(new URL(process.env.IDS, import.meta.url))).map((x) => x.id || x));
const [W, packs, v] = process.argv.slice(2), here = (f) => new URL(f, import.meta.url), cuts = {}, votes = { w: 0, l: 0 };
const binom = (k, n) => { if (!n) return 1; let s = 0; for (let i = 0; i <= Math.min(k, n - k); i++) { let c = 1; for (let j = 0; j < i; j++) c = (c * (n - j)) / (j + 1); s += c / 2 ** n; } return Math.min(1, 2 * s); };
const wilson = (k, n, z = 1.96) => { if (!n) return "–"; const p = k / n, d = 1 + z * z / n, m = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return `${Math.round(100 * (m - h))}–${Math.round(100 * (m + h))} %`; };
for (const p of packs.split(",")) {
  const key = JSON.parse(fs.readFileSync(here(`vysledky/klic-${p}.json`))), q = JSON.parse(fs.readFileSync(here(`vysledky/posudek-${p}.json`)));
  for (const [n, k] of Object.entries(key)) { const x = q[n]; if ((only && !only.test(k.id)) || (IDS && !IDS.has(k.id))) continue;
    if (!x) { console.log("chybí", p, n); continue; } (cuts[k.id] ||= []).push({ w: /^[XY]$/.test(x.a) ? (k[x.a] === W ? "W" : "L") : x.a, pos: x.a, j: x.j, d: x.d }); }
}
const G = {}, pos = {};
for (const [id, l] of Object.entries(cuts)) {
  const w = l.filter((x) => x.w === "W").length, o = l.filter((x) => x.w === "L").length;
  for (const x of l) pos[x.pos] = (pos[x.pos] || 0) + 1;
  votes.w += w; votes.l += o;
  const r = w && o ? "neshoda" : w ? "lépe" : o ? "hůř" : l.every((x) => x.w === "nejde") ? "nejde" : "stejně";
  const both = (w === 2 && "lépe2") || (o === 2 && "hůř2");
  for (const g of [id.split("-")[1].toUpperCase(), "vše"]) { const s = (G[g] ||= { lépe: 0, hůř: 0, neshoda: 0, stejně: 0, nejde: 0, lépe2: 0, hůř2: 0 }); s[r]++; if (both) s[both]++; }
  if (v) console.log(`${id}: ${r} (${l.map((x) => `${x.w} ${x.j}: ${x.d}`).join(" | ")})`);
}
console.table(G);
const t = G.vše;
console.log(`hlasy ${votes.w} : ${votes.l}; X/Y ${JSON.stringify(pos)}; řezy ${t.lépe} : ${t.hůř}, znaménkový test p = ${binom(t.lépe, t.lépe + t.hůř).toFixed(2)}, podíl ${wilson(t.lépe, t.lépe + t.hůř)}; oba posuzovatelé ${t.lépe2} : ${t.hůř2}, p = ${binom(t.lépe2, t.lépe2 + t.hůř2).toFixed(2)}`);
