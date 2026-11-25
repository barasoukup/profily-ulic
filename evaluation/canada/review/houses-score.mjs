// The floors drawn without the height (?torontohouse=0) and with it against two judges' floors of the photo (their mean where they
// differ by at most one; more: not counted). With OSM's default where nothing is known.   node houses-score.mjs
import fs from "node:fs";
import { sign, wilson } from "./stat.mjs";
const here = (f) => new URL(`results/${f}`, import.meta.url), L = (f) => new Map(fs.readFileSync(here(f), "utf8").trim().split("\n").map((l) => JSON.parse(l)).map((r) => [r.id, r]));
const a = L("houses-a.jsonl"), b = L("houses-b.jsonl"), rows = JSON.parse(fs.readFileSync(here("houses-changed.json"), "utf8"));
const out = []; let skip = 0, apart = 0;
for (const r of rows) {
  const x = a.get(r.id)?.floors, y = b.get(r.id)?.floors;
  if (x == null || y == null) { skip++; continue; }
  if (Math.abs(x - y) > 1) { apart++; continue; }
  const t = (x + y) / 2; out.push({ ...r, t, eb: Math.abs(r.before - t), ea: Math.abs(r.after - t) });
}
const w = out.filter((r) => r.ea < r.eb - 1e-9).length, l = out.filter((r) => r.ea > r.eb + 1e-9).length, mean = (k) => (out.reduce((s, r) => s + r[k], 0) / out.length).toFixed(2), at = (k, d) => out.filter((r) => r[k] <= d).length;
console.log(`změněných ${rows.length}, nejde poznat ${skip}, posudky se liší o víc než jedno ${apart}, porovnáno ${out.length}\nvýška blíž ${w} : ${l}, stejně ${out.length - w - l}; podíl ${wilson(w, w + l)}, p = ${sign(w, l).toFixed(3)}\nchyba podlaží průměr: bez výšky ${mean("eb")}, s výškou ${mean("ea")}; do 0,5: ${at("eb", 0.5)} → ${at("ea", 0.5)}; do 1: ${at("eb", 1)} → ${at("ea", 1)}; s výškou průměrná odchylka ${(out.reduce((s, r) => s + r.after - r.t, 0) / out.length).toFixed(2)}`);
for (const r of out) console.log(`${r.id} fotka ${r.t} bez ${r.before} (${r.lookBefore}) s ${r.after} (${r.lookAfter})`);
