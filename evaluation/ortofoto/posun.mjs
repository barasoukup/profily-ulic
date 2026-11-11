// The shift of a city's own orthophoto against ČÚZK's (Bára 11. 11. 2026: add the orthophotos that came out well,
// each with its correction). Per sampled cut both images on the same grid (0.25 m, ±18 m along), their edges
// (brightness change to the next cell, both ways) compared at every shift within ±MAX m across and along; the best
// shift, turned into east and north, per cut; the median over the cuts is the orthophoto's shift, the spread
// tells whether one shift is enough.
//   CITY=brno node evaluation/ortofoto/posun.mjs brno25
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { strip } from "./run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "brno", KEY = process.argv[2] || "brno25";
const OUT = path.join(ROOT, "data", CITY), AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const RES = 0.25, MAX = 4, SPAN = 18;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
async function grid(n, key, r) {
  const file = path.join(OUT, "img", key, `${n}.png`);
  try { return strip(await decodePng(await fs.readFile(file)), JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox, r.cut, r.a.extent[0] - 3, r.a.extent[1] + 3, RES); } catch { return null; }
}
const edges = (st) => { const E = new Float32Array(st.nt * st.nu); for (let j = 0; j + 1 < st.nu; j++) for (let i = 0; i + 1 < st.nt; i++) { const k = j * st.nt + i, v = st.L[k]; E[k] = Number.isNaN(v) ? NaN : Math.abs(st.L[k + 1] - v) + Math.abs(st.L[k + st.nt] - v); } return E; };
const out = [];
for (const f of (await fs.readdir(AB)).filter((f) => /^\d+\.json$/.test(f))) {
  const n = +f.slice(0, -5), r = JSON.parse(await fs.readFile(path.join(AB, f), "utf8"));
  if (!r.a?.extent) continue;
  const a = await grid(n, "cuzk12", r), b = await grid(n, KEY, r);
  if (!a || !b) continue;
  const A = edges(a), B = edges(b), m = Math.round(MAX / RES), j0 = Math.round((20 - SPAN) / RES), j1 = Math.round((20 + SPAN) / RES);
  let best = null;
  for (let dj = -m; dj <= m; dj++) for (let di = -m; di <= m; di++) {
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, c = 0;
    for (let j = j0 + m; j < j1 - m; j++) for (let i = m; i < a.nt - m; i++) {
      const x = A[j * a.nt + i], y = B[(j + dj) * a.nt + i + di];
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; c++;
    }
    if (c < 500) continue;
    const corr = (sab - (sa * sb) / c) / Math.sqrt((saa - (sa * sa) / c) * (sbb - (sb * sb) / c));
    if (!best || corr > best.corr) best = { corr, dt: di * RES, du: -dj * RES }; // rows run against u
  }
  if (!best || best.corr < 0.3) continue;
  // (dt, du): where the city's image shows what ČÚZK's shows at (0, 0); in the world, east and north.
  const br = (r.cut.bearing * Math.PI) / 180, dir = [Math.sin(br), Math.cos(br)], normal = [-dir[1], dir[0]];
  out.push({ n, corr: +best.corr.toFixed(2), east: +(normal[0] * best.dt + dir[0] * best.du).toFixed(2), north: +(normal[1] * best.dt + dir[1] * best.du).toFixed(2) });
}
const E = med(out.map((x) => x.east)), N = med(out.map((x) => x.north));
const off = out.map((x) => Math.hypot(x.east - E, x.north - N));
console.log(`${CITY} ${KEY}: řezů ${out.length}, posun proti ČÚZK ${E} m na východ, ${N} m na sever; od mediánu do 0,3 m ${off.filter((d) => d <= 0.3).length}, do 0,5 m ${off.filter((d) => d <= 0.5).length}`);
