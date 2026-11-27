// Experiment (Bára 15. 11. 2026): how well a street's cross-section comes out of the orthophoto and OSM alone,
// without MTVU, a technical map or a town's road register; a fallback for other countries? (REPORT.md)
// For every sampled cut of Prague and Brno (the profiles of ab.mjs in evaluation/<city>/data/ab-city-stejne keep the
// runs of MTVU along the cut: the truth) the kerbs of the carriageway at the OSM axis are found by
//   M0  OSM and the rules: the width tag, else lanes × lane width + parking + bike lanes, centred on the OSM axis;
//   M1  the orthophoto alone: the road grown from the OSM axis while the columns look like the road there;
//   M2  both: edges of the image that hold along the street, scored by the road between them and the axis and by
//       how far they are from where OSM expects the kerb;
// the facades are the OSM buildings (the app's tiles), the sidewalks the space between kerb and facade less green.
// Every orthophoto the cache has (evaluation/orthophoto/data/<city>/img: Prague IPR 10 cm, ČÚZK 12.5 and 25 cm; Brno
// 2025 10 cm and ČÚZK), and 20 cm averaged down from the city's 10 cm. No request is made.
//   node evaluation/ortho-osm/run.mjs [praha|brno …]        → data/<city>/results.json, data/<city>/img/*.jpg
//   node evaluation/ortho-osm/summary.mjs                   → the tables of REPORT.md (results/*.md)
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT, cuts, truthOf, osmAround, osmAlong, stripOf, SOURCES, ALONG, median } from "./lib.mjs";
import { strongLines, osmRoad, withRails, limits, m0, m1, m2, columns, lanesOf, sidewalkOf } from "./methods.mjs";
import { encodePng } from "../orthophoto/run.mjs";

const run = promisify(execFile);
const CITIES = process.argv.slice(2).filter((a) => /^[a-z]+$/.test(a));
const IMAGES = process.env.IMAGES !== "0";

// The independent marks by eye of lines and carriageway edges (evaluation/orthophoto/labels/oznac-<city>-<who>.json):
// the lanes of a marked carriageway = its lines inside (≥ 0.7 m from the edges) + 1.
async function markedLanes(city) {
  const out = {};
  let index;
  try { index = JSON.parse(await fs.readFile(path.join(ROOT, "..", "orthophoto", "data", city, "oznac", "index.json"), "utf8")); } catch { return out; }
  const ix = Object.fromEntries(index.map((x) => [x.name, x]));
  for (const who of ["A", "C", "D"]) {
    let lab;
    try { lab = JSON.parse(await fs.readFile(path.join(ROOT, "..", "orthophoto", "labels", `oznac-${city}-${who}.json`), "utf8")); } catch { continue; }
    for (const [name, m] of Object.entries(lab)) {
      const x = ix[name];
      if (!x || m.quality !== "ok" || (m.edges || []).length < 2) continue;
      const toT = (px) => x.from + px / x.pxPerM, e = m.edges.map(toT), s = e[0], en = e.at(-1);
      const inner = (m.lines || []).map(([px]) => toT(px)).filter((t) => t > s + 0.7 && t < en - 0.7);
      (out[x.n] ??= []).push({ name, who, s, e: en, lanes: inner.length + 1, lines: (m.lines || []).map(([px]) => +toT(px).toFixed(2)) });
    }
  }
  return out;
}

// Why a cut may go wrong, read on the image over the true carriageway: trees (green share), shade (share of dark
// pixels), and from the truth: parking at a kerb, a narrow carriageway, the OSM axis off its middle.
function flags(st, truth, axis) {
  const f = [];
  if (!truth.way) return f;
  let n = 0, green = 0, dark = 0;
  const i0 = Math.max(0, Math.round((truth.way.s - st.t0) / st.res)), i1 = Math.min(st.nt, Math.round((truth.way.e - st.t0) / st.res));
  for (let j = 0; j < st.nu; j += 2) for (let i = i0; i < i1; i += 2) {
    const q = j * st.nt + i;
    if (Number.isNaN(st.L[q])) continue;
    n++;
    if (st.G[q] >= 10 && st.rgb[q * 3 + 1] > st.rgb[q * 3 + 2]) green++;
    if (st.L[q] < 55) dark++;
  }
  if (n && green / n >= 0.15) f.push("stromy");
  if (n && dark / n >= 0.3) f.push("stín");
  if (truth.side?.A.parking || truth.side?.B.parking) f.push("stání");
  if (truth.way.e - truth.way.s < 6) f.push("úzká");
  if (Math.abs(axis - (truth.way.s + truth.way.e) / 2) > 1.5) f.push("osa mimo");
  return f;
}
const group = (hw) => (/^(motorway|trunk|primary)/.test(hw) ? "hlavní" : /^(secondary|tertiary)/.test(hw) ? "sběrná" : "místní");

async function cityRun(city) {
  const list = await cuts(city), marked = await markedLanes(city), out = [];
  const OUT = path.join(ROOT, "data", city);
  await fs.mkdir(path.join(OUT, "img"), { recursive: true });
  for (const c of list) {
    const o = osmAlong(await osmAround(c.cut.lat, c.cut.lon), c);
    if (!o.own) continue;
    const axis = o.own.t, truth = truthOf(c, axis), road = withRails(osmRoad(o.own), o), lim = limits(o, axis);
    const rec = {
      n: c.n, name: c.cut.name, highway: c.cut.highway, group: group(c.cut.highway), inZps: c.inZps, junction: !!c.a.junction,
      axis: +axis.toFixed(2), road: { w: +road.w.toFixed(2), lanes: road.lanes, from: road.from, parking: road.parking, parkKind: road.parkKind, sidewalk: road.sidewalk, sidewalkW: road.sidewalkW },
      osmFacade: o.facade, truth: { way: truth.way && { s: +truth.way.s.toFixed(2), e: +truth.way.e.toFixed(2) }, facade: truth.facade, side: truth.side, endKind: truth.endKind },
      marked: marked[c.n] || [], by: {},
    };
    // Another OSM carriageway (the other half of a dual carriageway, a slip road, a road crossing at a junction)
    // within the true carriageway: MTVU has one surface where OSM has two ways; these cuts are told apart.
    const CAR = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$/;
    rec.otherRoads = o.ways.filter((w) => CAR.test(w.tags.highway || "") && w.tags.area !== "yes" && truth.way && w.t > truth.way.s + 0.5 && w.t < truth.way.e - 0.5).map((w) => +w.t.toFixed(2));
    rec.complex = rec.otherRoads.length > 0 || rec.junction;
    rec.m0 = m0(o, road);
    rec.m0sw = Object.fromEntries(["A", "B"].map((s) => [s, o.facade[s] === null ? null : road.sidewalkW[s] !== null && road.sidewalk[s] !== "no" ? { space: Math.abs(o.facade[s] - rec.m0[s]), sidewalk: road.sidewalkW[s] } : sidewalkOf(null, rec.m0[s], o.facade[s], s, road.sidewalk[s])]));
    let shown = false;
    for (const key of Object.keys(SOURCES[city])) {
      const st = await stripOf(city, key, c);
      if (!st) continue;
      st.at = (t, u) => [Math.floor((t - st.t0) / st.res), Math.floor((ALONG - u) / st.res)];
      const cols = columns(st);
      const lo = Math.max(lim.A, st.t0 + 0.5), hi = Math.min(lim.B, st.t0 + st.nt * st.res - 0.5);
      // Lines across the whole street: candidates for the edge lines.
      const lines = hi - lo > 4 ? strongLines(st, lo + 1.5, hi - 1.5) : [];
      const k1 = m1(cols, axis, lim), k2 = m2(cols, axis, lim, road, lines);
      const by = { m1: k1, m2: k2 && { A: k2.A, B: k2.B }, why: k2?.why, flags: flags(st, truth, axis) };
      // Lanes on the M2 carriageway (the lines whose gaps look like lanes), and on the true one.
      if (k2) { const l = lanesOf(st, k2.A, k2.B); by.lanesM2 = l.lanes; by.linesM2 = l.lines.map((t) => +t.toFixed(2)); }
      if (truth.way) { const l = lanesOf(st, truth.way.s, truth.way.e); by.lanesTrue = l.lanes; by.linesTrue = l.lines.map((t) => +t.toFixed(2)); }
      for (const m of ["m1", "m2"]) if (by[m]) by[m + "sw"] = Object.fromEntries(["A", "B"].map((s) => [s, sidewalkOf(cols, by[m][s], o.facade[s], s, road.sidewalk[s])]));
      rec.by[key] = by;
      if (IMAGES && !shown) { shown = true; await review(st, rec, path.join(OUT, "img", `${c.n}.jpg`), lines); }
    }
    out.push(rec);
    const b = rec.by[Object.keys(rec.by)[0]];
    const e = (k) => (truth.way && k ? `${(k.A - truth.way.s).toFixed(1)}/${(k.B - truth.way.e).toFixed(1)}` : "–");
    console.log(city, c.n, c.cut.name, c.cut.highway, `M0 ${e(rec.m0)} M1 ${e(b?.m1)} M2 ${e(b?.m2)}`, b?.flags?.join(",") || "");
  }
  await fs.writeFile(path.join(OUT, "results.json"), JSON.stringify(out, null, 1));
}

// The review image: the finest orthophoto's strip at 10 px/m (street top to bottom, the cut left A → right B), with
// the truth (green: MTVU kerbs, cyan: facades the app found on MTVU), OSM (white dashed: the axis, blue: the
// facades) and the kerbs of M0 (yellow), M1 (orange), M2 (red), in bands of their own.
async function review(st, rec, file, lines) {
  const sc = 0.1 / st.res, w = Math.floor(st.nt / sc), h = Math.floor(st.nu / sc), rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = Math.min(st.nt - 1, Math.floor(x * sc)), j = Math.min(st.nu - 1, Math.floor(y * sc)), q = (j * st.nt + i) * 3, o = (y * w + x) * 4;
    rgba[o] = st.rgb[q]; rgba[o + 1] = st.rgb[q + 1]; rgba[o + 2] = st.rgb[q + 2]; rgba[o + 3] = 255;
  }
  const px = (t) => Math.round((t - st.t0) * 10);
  const vline = (t, y0, y1, c, dash = 0, thick = 2) => { if (t === null || t === undefined) return; for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) { if (dash && (y / dash | 0) % 2) continue; for (let k = 0; k < thick; k++) { const x = px(t) + k - (thick >> 1); if (x < 0 || x >= w) continue; const o = (y * w + x) * 4; rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; } } };
  const H = h;
  vline(rec.axis, 0, H, [255, 255, 255], 6, 1);
  for (const t of lines) vline(t, H - 12, H, [255, 60, 255], 0, 1);
  if (rec.truth.way) { vline(rec.truth.way.s, 0, H, [40, 230, 60], 0, 2); vline(rec.truth.way.e, 0, H, [40, 230, 60], 0, 2); }
  for (const s of ["A", "B"]) { vline(rec.truth.facade[s], 0, H, [0, 230, 230], 0, 2); vline(rec.osmFacade[s], 0, H / 2, [40, 80, 255], 4, 2); }
  const b = rec.by[Object.keys(rec.by)[0]];
  const band = (k, y0, y1, c) => { if (!k) return; vline(k.A, y0, y1, c, 0, 3); vline(k.B, y0, y1, c, 0, 3); };
  band(rec.m0, 0, H / 4, [255, 220, 0]);
  band(b?.m1, H / 4, H / 2, [255, 140, 0]);
  band(b?.m2, H / 2, (3 * H) / 4, [255, 30, 30]);
  const tmp = file.replace(/\.jpg$/, ".png");
  await fs.writeFile(tmp, encodePng(rgba, w, h));
  await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", tmp, "--out", file]);
  await fs.rm(tmp, { force: true });
}

for (const city of CITIES.length ? CITIES : ["praha", "brno"]) await cityRun(city);
void median;
