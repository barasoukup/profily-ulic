// Shared pieces of the experiment "a street profile from the orthophoto and OSM alone" (Bára 15. 11. 2026,
// ZPRAVA.md): the cut and its truth from MTVU (the runs of the surface map along the cut, kept with the profiles of
// ab.mjs), OSM from the app's own tiles of the Czech Republic, and the orthophoto images cached by
// evaluation/ortofoto/run.mjs, sampled on the cut's grid. Nothing here asks IPR or ČÚZK.
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { TILE, decodeTile, mergePieces } from "../../pilot/public/osmtile.js";
import { osmAlong as appOsmAlong } from "../../pilot/public/ortho-osm.js";

export const ROOT = path.dirname(new URL(import.meta.url).pathname);
const EVAL = path.join(ROOT, "..");
// OSM_TILES: another build of the tiles (e.g. with all buildings and green areas, before it is the app's).
const TILES = process.env.OSM_TILES || path.join(EVAL, "..", "pilot", "data", "osm-tiles");
export const median = (a) => { const b = a.filter((v) => Number.isFinite(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

// ---------- the cuts ----------
export async function cuts(city) {
  const dir = path.join(EVAL, city, "data", "ab-city-stejne");
  const list = (await fs.readdir(dir)).filter((f) => /^\d+\.json$/.test(f)).map((f) => +f.slice(0, -5)).sort((a, b) => a - b);
  const out = [];
  for (const n of list) {
    const r = JSON.parse(await fs.readFile(path.join(dir, `${n}.json`), "utf8"));
    if (!r.a?.segments?.length || !r.a.runs?.length || !r.a.extent) continue;
    out.push({ n, cut: r.cut, inZps: !!r.inZps, a: r.a });
  }
  return out;
}

// ---------- the truth: MTVU along the cut ----------
// The carriageway: runs of road (700, 701), parking stalls laid over it (97xx) and parking bays beside it (704, up
// to 8 m: a wide one is a car park). Its edges are the kerbs. Tram beds (705) are not carriageway.
const CARRIAGE = (r) => r.code === 700 || r.code === 701 || (r.code >= 9700 && r.code < 9800) || (r.code === 704 && r.e - r.s < 8);
export const PARKING = (r) => r.code === 704 || (r.code >= 9704 && r.code <= 9708);
const SIDEWALK = (r) => r.code === 702 || r.code === 703;
export function truthOf(c, axisT) {
  const runs = c.a.runs;
  // Carriageways: merged runs.
  const ways = [];
  for (const r of runs) {
    if (!CARRIAGE(r)) continue;
    const last = ways.at(-1);
    if (last && Math.abs(last.e - r.s) < 0.05) { last.e = r.e; last.runs.push(r); } else ways.push({ s: r.s, e: r.e, runs: [r] });
  }
  const gap = (w) => (axisT < w.s ? w.s - axisT : axisT > w.e ? axisT - w.e : 0);
  const way = ways.filter((w) => gap(w) <= 4 && w.s > -39.9 && w.e < 39.9).sort((x, y) => gap(x) - gap(y))[0] || null;
  // The facades: the ends of the app's profile on MTVU where it stopped at a building (left = larger t).
  const ext = c.a.extent, edges = c.a.edges || {};
  const facade = { A: edges.right === "budova" ? ext[0] : null, B: edges.left === "budova" ? ext[1] : null };
  const t = { way, facade, ends: { A: ext[0], B: ext[1] }, endKind: { A: edges.right, B: edges.left } };
  if (!way) return t;
  // Per side, between the kerb and the facade (or the profile's end): sidewalks, greenery, other.
  t.side = {};
  for (const side of ["A", "B"]) {
    const lo = side === "A" ? ext[0] : way.e, hi = side === "A" ? way.s : ext[1];
    let sw = 0, green = 0, other = 0;
    for (const r of runs) {
      const s = Math.max(lo, r.s), e = Math.min(hi, r.e);
      if (e <= s) continue;
      if (SIDEWALK(r)) sw += e - s; else if (r.code >= 400 && r.code < 500) green += e - s; else other += e - s;
    }
    // Parking at this kerb: a parking run within the outer 3 m of the carriageway.
    const k = side === "A" ? way.s : way.e;
    const park = way.runs.some((r) => PARKING(r) && r.e - r.s >= 1.5 && (side === "A" ? r.s - k < 3 : k - r.e < 3));
    t.side[side] = { sidewalk: +sw.toFixed(2), green: +green.toFixed(2), other: +other.toFixed(2), parking: park };
  }
  return t;
}

// ---------- the cut's frame: t across (the profile's axis), u along the street ----------
// As evaluation/ortofoto/run.mjs frameOf and derive.js: dir from the bearing, normal = dir turned left, t along it.
export function frame(cut) {
  const b = (cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const kx = 111320 * Math.cos((cut.lat * Math.PI) / 180), ky = 110574;
  const tu = (lon, lat) => { const x = (lon - cut.lon) * kx, y = (lat - cut.lat) * ky; return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const lonlat = (t, u) => [cut.lon + (normal[0] * t + dir[0] * u) / kx, cut.lat + (normal[1] * t + dir[1] * u) / ky];
  return { dir, normal, tu, lonlat };
}

// ---------- OSM: the app's tiles ----------
async function tile(name) {
  try { return decodeTile(await fs.readFile(path.join(TILES, `${name}.json`), "utf8")); } catch { return []; }
}
export async function osmAround(lat, lon, radius = 60) {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++)
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  return mergePieces(await Promise.all(names.map(tile)));
}
// What OSM says along the cut: the app's own reading (pilot/public/ortho-osm.js osmAlong) in the cut's frame.
export function osmAlong(elements, c, half = 45) {
  return appOsmAlong(elements, frame(c.cut).tu, c.cut.wayId, half);
}

// ---------- the orthophoto: the cached image sampled on the cut's grid ----------
const R = 6378137;
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
// key: the cached image (evaluation/ortofoto/data/<city>/img/<img>/<n>.png); res: its resolution; shift: where the
// image shows a point, east and north (m; Brno 2025, lanes-ortho.js); down: averaged down to a coarser grid
// (ipr10 → 20 cm: the typical European orthophoto, simulated).
export const SOURCES = {
  praha: {
    ipr10: { img: "ipr10", res: 0.1, label: "IPR 10 cm" },
    ipr20: { img: "ipr10", res: 0.1, down: 2, label: "IPR převzorkované na 20 cm" },
    cuzk12: { img: "cuzk12", res: 0.125, label: "ČÚZK 12,5 cm" },
    cuzk25: { img: "cuzk25", res: 0.25, label: "ČÚZK 25 cm" },
  },
  brno: {
    brno10: { img: "brno25", res: 0.1, shift: [1.06, 3.09], label: "Brno 2025, 10 cm" },
    brno20: { img: "brno25", res: 0.1, shift: [1.06, 3.09], down: 2, label: "Brno převzorkované na 20 cm" },
    cuzk12: { img: "cuzk12", res: 0.125, label: "ČÚZK 12,5 cm" },
    cuzk25: { img: "cuzk25", res: 0.25, label: "ČÚZK 25 cm" },
  },
};
export const ALONG = 20;
const decoded = new Map();
export async function stripOf(city, key, c) {
  const src = SOURCES[city][key], file = path.join(EVAL, "ortofoto", "data", city, "img", src.img, `${c.n}.png`);
  let img, bbox;
  try {
    if (!decoded.has(file)) { decoded.clear(); decoded.set(file, await decodePng(await fs.readFile(file))); }
    img = decoded.get(file);
    bbox = JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox;
  } catch { return null; }
  // The image spans the app's profile + 3 m; sampled over it, at the source's resolution.
  const f = frame(c.cut), k = Math.cos((c.cut.lat * Math.PI) / 180), [sx, sy] = (src.shift || [0, 0]).map((v) => v / k);
  const res = src.res, t0 = c.a.extent[0] - 3, t1 = c.a.extent[1] + 3;
  const nt = Math.round((t1 - t0) / res), nu = Math.round((2 * ALONG) / res);
  const [x0, y0, x1, y1] = bbox;
  let L = new Float32Array(nt * nu), rgb = new Uint8Array(nt * nu * 3);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    const [mx0, my0] = merc(...f.lonlat(t0 + (i + 0.5) * res, ALONG - (j + 0.5) * res)), mx = mx0 + sx, my = my0 + sy;
    const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height), q = j * nt + i;
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) { L[q] = NaN; continue; }
    const o = (py * img.width + px) * 4;
    rgb[q * 3] = img.rgba[o]; rgb[q * 3 + 1] = img.rgba[o + 1]; rgb[q * 3 + 2] = img.rgba[o + 2];
    L[q] = 0.299 * img.rgba[o] + 0.587 * img.rgba[o + 1] + 0.114 * img.rgba[o + 2];
  }
  let st = { nt, nu, res, t0, L, rgb };
  if (src.down) st = downsample(st, src.down);
  // As lanes-ortho.js laneImage: G (green), S (saturation), and fine = a city's orthophoto (paint fills its pixels).
  st.G = new Float32Array(st.nt * st.nu);
  st.S = new Float32Array(st.nt * st.nu);
  for (let q = 0; q < st.nt * st.nu; q++) {
    const r = st.rgb[q * 3], g = st.rgb[q * 3 + 1], b = st.rgb[q * 3 + 2];
    st.G[q] = Number.isNaN(st.L[q]) ? NaN : g - (r + b) / 2;
    st.S[q] = Number.isNaN(st.L[q]) ? NaN : Math.max(r, g, b) - Math.min(r, g, b);
  }
  st.fine = !key.startsWith("cuzk") && !src.down;
  return st;
}
function downsample(st, k) {
  const nt = Math.floor(st.nt / k), nu = Math.floor(st.nu / k), L = new Float32Array(nt * nu), rgb = new Uint8Array(nt * nu * 3);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    let n = 0, l = 0; const c = [0, 0, 0];
    for (let b = 0; b < k; b++) for (let a = 0; a < k; a++) {
      const q = (j * k + b) * st.nt + i * k + a;
      if (Number.isNaN(st.L[q])) continue;
      n++; l += st.L[q]; c[0] += st.rgb[q * 3]; c[1] += st.rgb[q * 3 + 1]; c[2] += st.rgb[q * 3 + 2];
    }
    const q = j * nt + i;
    L[q] = n ? l / n : NaN;
    if (n) { rgb[q * 3] = c[0] / n; rgb[q * 3 + 1] = c[1] / n; rgb[q * 3 + 2] = c[2] / n; }
  }
  return { nt, nu, res: st.res * k, t0: st.t0, L, rgb };
}
