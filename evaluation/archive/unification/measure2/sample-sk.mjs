// Second batch, Slovakia only (its law estimate on against off), the code still frozen: as sample.mjs with another seed and towns.
// Fresh random candidates (a fixed seed), drawn after the code was frozen: 40 a place within R m of its centre, none within
// 150 m of any point (lat, lon) in any JSON of evaluation/ (judged, sampled or collected before). The page (../measure/select.js
// pickLocal) snaps them onto local streets and keeps the first of each place up to the cap.
//   node sample-sk.mjs > kandidati-sk.json
import fs from "node:fs";
import path from "node:path";
const EVAL = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const known = new Map(); // a grid of 0.01° → points
const cell = (la, lo) => `${Math.floor(la * 100)},${Math.floor(lo * 100)}`;
let n = 0;
const add = (la, lo) => { if (!Number.isFinite(la) || !Number.isFinite(lo)) return; const c = cell(la, lo); (known.get(c) || known.set(c, []).get(c)).push([la, lo]); n++; };
const walk = (v) => {
  if (!v || typeof v !== "object") return;
  if (Array.isArray(v)) { for (const x of v) if (x && typeof x === "object") walk(x); return; }
  if (typeof v.lat === "number" && typeof (v.lon ?? v.lng) === "number") add(v.lat, v.lon ?? v.lng);
  for (const x of Object.values(v)) if (x && typeof x === "object") walk(x);
};
for (const f of fs.readdirSync(EVAL, { recursive: true })) {
  if (!/\.jsonl?$/.test(f) || /measure2\//.test(f)) continue;
  let text;
  try { text = fs.readFileSync(path.join(EVAL, f), "utf8"); } catch { continue; }
  try { walk(JSON.parse(text)); } catch { for (const l of text.split("\n")) try { walk(JSON.parse(l)); } catch {} }
}
const near = (la, lo, d = 150) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const [a, o] of known.get(cell(la + i * 0.01, lo + j * 0.01)) || []) if (Math.hypot((a - la) * 110574, (o - lo) * 111320 * Math.cos((la * Math.PI) / 180)) < d) return true; return false; };
// State: cap per place, places.
export const PLACES = {
  SK: [9, { petrzalka: [48.115, 17.11], ruzinov: [48.153, 17.165], kosice2: [48.7, 21.24], trencin: [48.8945, 18.0444], levice: [48.2156, 18.607], lucenec: [48.3317, 19.667], komarno: [47.7631, 18.1283], nove_zamky: [47.9855, 18.1619], humenne: [48.9355, 21.9066], bardejov: [49.2915, 21.2761], liptov: [49.0837, 19.6117], ruzomberok: [49.0748, 19.3075], topolcany: [48.5586, 18.1726], piestany: [48.5918, 17.8254] }],
};
let seed = 20261125 + 1919;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = [], R = 1800;
for (const [country, [cap, places]] of Object.entries(PLACES)) for (const [place, [la, lo]] of Object.entries(places)) for (let i = 1; i <= 40; i++) {
  const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  const p = { id: `m2b-${country.toLowerCase()}-${place}-${i}`, group: country, country, place, cap, lat: +(la + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lo + (r * Math.sin(a)) / (111320 * Math.cos((la * Math.PI) / 180))).toFixed(6) };
  if (!near(p.lat, p.lon)) out.push(p);
}
if (process.argv[1] === new URL(import.meta.url).pathname) { console.error(n, "known points;", out.length, "candidates"); console.log(JSON.stringify(out)); }
