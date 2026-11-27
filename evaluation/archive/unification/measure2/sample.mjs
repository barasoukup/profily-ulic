// Fresh random candidates (a fixed seed), drawn after the code was frozen: 40 a place within R m of its centre, none within
// 150 m of any point (lat, lon) in any JSON of evaluation/ (judged, sampled or collected before). The page (../measure/select.js
// pickLocal) snaps them onto local streets and keeps the first of each place up to the cap.
//   node sample.mjs > kandidati.json
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
  ES: [9, { madrid: [40.425, -3.7], barcelona: [41.39, 2.165], valencia: [39.47, -0.375], sevilla: [37.39, -5.99], malaga: [36.72, -4.425], bilbao: [43.262, -2.935] }],
  PT: [9, { lisboa: [38.722, -9.142], porto: [41.152, -8.612], braga: [41.55, -8.425], coimbra: [40.208, -8.425], aveiro: [40.64, -8.65], setubal: [38.525, -8.89] }],
  IT: [13, { bologna: [44.494, 11.343], modena: [44.647, 10.925], torino: [45.07, 7.687] }],
  PL: [9, { warszawa: [52.2297, 21.0122], wroclaw: [51.1099, 17.0326], gdansk: [54.352, 18.6466], katowice: [50.2649, 19.0238], lublin: [51.2465, 22.5684], szczecin: [53.4285, 14.5528] }],
  SK: [9, { bratislava: [48.1447, 17.1128], kosice: [48.7206, 21.258], presov: [48.9983, 21.239], zilina: [49.223, 18.74], nitra: [48.309, 18.084], bystrica: [48.736, 19.146], trnava: [48.377, 17.587], martin: [49.066, 18.921], poprad: [49.059, 20.297], zvolen: [48.575, 19.127], michalovce: [48.7543, 21.9195], prievidza: [48.7745, 18.6245] }],
  CZ: [8, { praha: [50.0875, 14.4213], brno: [49.1951, 16.6068], ostrava: [49.835, 18.292], plzen: [49.7475, 13.3776], olomouc: [49.5938, 17.2509], usti: [50.6607, 14.0323], teplice: [50.6404, 13.8245] }],
  AT: [9, { wien: [48.2085, 16.3731], graz: [47.0707, 15.4395], linz: [48.3059, 14.2862], klagenfurt: [46.6247, 14.3053], wels: [48.1575, 14.0289] }],
  DE: [8, { berlin: [52.52, 13.405], muenchen: [48.1374, 11.5755], koeln: [50.9375, 6.9603], frankfurt: [50.1109, 8.6821], leipzig: [51.3397, 12.3731], nuernberg: [49.4521, 11.0767], freiburg: [47.9959, 7.8522] }],
  BE: [9, { bruxelles: [50.8467, 4.3525], antwerpen: [51.2194, 4.4025], gent: [51.0543, 3.7174], liege: [50.6326, 5.5797], charleroi: [50.4108, 4.4446] }],
  DK: [10, { kobenhavn: [55.68, 12.57], aarhus: [56.155, 10.205], odense: [55.396, 10.388], aalborg: [57.048, 9.92] }],
};
let seed = 20261125 + 909;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = [], R = 2500;
for (const [country, [cap, places]] of Object.entries(PLACES)) for (const [place, [la, lo]] of Object.entries(places)) for (let i = 1; i <= 40; i++) {
  const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  const p = { id: `m2-${country.toLowerCase()}-${place}-${i}`, group: country, country, place, cap, lat: +(la + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lo + (r * Math.sin(a)) / (111320 * Math.cos((la * Math.PI) / 180))).toFixed(6) };
  if (!near(p.lat, p.lon)) out.push(p);
}
if (process.argv[1] === new URL(import.meta.url).pathname) { console.error(n, "known points;", out.length, "candidates"); console.log(JSON.stringify(out)); }
