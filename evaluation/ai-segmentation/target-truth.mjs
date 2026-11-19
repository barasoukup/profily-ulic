// The truth along the cuts the app made in the target area (evaluation-ai-collect.js, saved as
// data/ai-seg/target/estimate.json): the town's own map (the passports of Bratislava, Prešov, Žilina; Aachen's street
// database) along the cut line, the facades from OSM's buildings. Written as cuts.mjs writes the regression's cuts
// (data/ai-seg/cuts/target/<n>.json, .osm.json) plus the estimate's parts (cuts/target/estimate-app.json), so
// fetch_ortho.py, eval_cuts.py and compare.py run on them unchanged.
//   node evaluation/ai-segmentation/target-truth.mjs
import fs from "node:fs";
import { setCity, sources } from "./labels-lib.mjs";
const { SK_TOWNS } = await import("../../pilot/public/towns/slovensko.js");
const { DE_TOWNS } = await import("../../pilot/public/towns/germany.js");
const { hintsOf } = await import("./osm.mjs");

const DATA = "/Users/barasoukupova/streetdesign/data/ai-seg";
const est = JSON.parse(fs.readFileSync(`${DATA}/target/estimate.json`, "utf8"));
const dir = `${DATA}/cuts/target`;
fs.mkdirSync(dir, { recursive: true });
const HALF = 41.6, PX = 416;
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const SRC = { bratislava: "sk", presov: "sk", zilina: "sk", aachen: "aachen" };
const out = {}, stats = { cuts: 0, kept: 0, noTruth: 0 };
let n = 0;
for (const [id, r] of Object.entries(est)) {
  stats.cuts++;
  const c = r.cut;
  if (!c?.lat || !r.segs?.length) continue;
  // Without a span (an estimate without one) the profile is centred on the cut's point (as evaluation/slovensko/kontrola).
  const width = r.segs.reduce((a, x) => a + x[1], 0);
  c.span ||= { left: width / 2, right: width / 2 };
  setCity(r.town === "aachen" ? "germany" : "slovensko");
  const b = (c.bearing * Math.PI) / 180, dir2 = [Math.sin(b), Math.cos(b)], normal = [-dir2[1], dir2[0]];
  const kx = 111320 * Math.cos((c.lat * Math.PI) / 180), ky = 110574;
  const lonlat = (t, u) => [c.lon + (normal[0] * t + dir2[0] * u) / kx, c.lat + (normal[1] * t + dir2[1] * u) / ky];
  const dy = HALF / ky, dx = HALF / kx, box = [c.lon - dx, c.lat - dy, c.lon + dx, c.lat + dy];
  const bbox = box.map((v) => v.toFixed(7)).join(",");
  let own;
  try { own = r.town === "aachen" ? await DE_TOWNS.aachen(bbox) : await SK_TOWNS[r.town].own(bbox); } catch (e) { console.log(id, e.message); continue; }
  const feats = (own.features || []).map((f) => ({ code: f.attributes.CTVUK_KOD ?? f.attributes.code, rings: f.geometry?.rings })).filter((f) => f.rings && f.code);
  const osm = (await sources.osm(c.lat, c.lon, 70)).elements;
  const houses = osm.filter((e) => e.type === "area" && e.tags?.building && e.geometry?.length > 2).map((e) => [e.geometry.map((g) => [g.lon, g.lat])]);
  // Along the axis line (u = 0), every 10 cm: the map's code (the last polygon wins), a building from OSM.
  const step = 0.1, ts = [];
  for (let t = -40; t <= 40.001; t += step) ts.push(+t.toFixed(2));
  const code = ts.map((t) => { const [x, y] = lonlat(t, 0); let k = 0; for (const f of feats) if (inRings(f.rings, x, y)) k = f.code; return k; });
  const house = ts.map((t) => { const [x, y] = lonlat(t, 0); return houses.some((h) => inRings(h, x, y)); });
  // Runs of the map's codes; the carriageway as lib.mjs truthOf (road, parking bays under 8 m), nearest the axis.
  const runs = [];
  for (let i = 0; i < ts.length; i++) { const last = runs.at(-1); if (last && last.code === code[i]) last.e = ts[i] + step / 2; else runs.push({ code: code[i], s: ts[i] - step / 2, e: ts[i] + step / 2 }); }
  const carriage = (x) => x.code === 700 || x.code === 701 || (x.code === 704 && x.e - x.s < 8);
  const ways = [];
  for (const x of runs) { if (!carriage(x)) continue; const l = ways.at(-1); if (l && Math.abs(l.e - x.s) < 0.05) l.e = x.e; else ways.push({ s: x.s, e: x.e }); }
  const gap = (w) => (0 < w.s ? w.s : 0 > w.e ? -w.e : 0);
  const way = ways.filter((w) => gap(w) <= 4 && w.s > -39.9 && w.e < 39.9).sort((p, q) => gap(p) - gap(q))[0];
  if (!way) { stats.noTruth++; continue; }
  // Per side: the facade (the first OSM building out from the kerb, within 40 m), the sidewalk (702, 703) between.
  const facade = {}, side = {};
  for (const [s, sg, k] of [["A", -1, way.s], ["B", 1, way.e]]) {
    let f = null;
    for (let i = 0; i < ts.length; i++) { const j = sg < 0 ? ts.length - 1 - i : i; if (sg * (ts[j] - k) > 0 && house[j]) { f = ts[j]; break; } }
    facade[s] = f;
    if (f === null) continue;
    const lo = Math.min(f, k), hi = Math.max(f, k);
    let sw = 0, unknown = 0;
    for (const x of runs) { const a = Math.max(lo, x.s), e = Math.min(hi, x.e); if (e <= a) continue; if (x.code === 702 || x.code === 703) sw += e - a; else if (!x.code) unknown += e - a; }
    // A side the map leaves mostly unmapped (the passports hold streets, not front gardens): no truth for it.
    if (unknown > 0.5 * (hi - lo)) { facade[s] = null; continue; }
    side[s] = { sidewalk: +sw.toFixed(2) };
  }
  // The patch for the model, three lines across as cuts.mjs.
  const lt = [];
  for (let t = -40; t <= 40.001; t += 0.2) lt.push(+t.toFixed(1));
  const lines = [-3, 0, 3].map((u) => lt.map((t) => lonlat(t, u).map((v) => +v.toFixed(8))));
  fs.writeFileSync(`${dir}/${n}.json`, JSON.stringify({ id: "target", n, point: id, town: r.town, src: SRC[r.town], lat: c.lat, lon: c.lon, box, half: HALF, px: PX, feats: [],
    cut: c, truth: { way, facade, side }, ts: lt, lines }));
  fs.writeFileSync(`${dir}/${n}.osm.json`, JSON.stringify(hintsOf(osm, box)));
  // The estimate's parts, laid from A (t = +span.left) as regrese.mjs laid().
  const parts = [];
  let t = c.span.left;
  for (const [type, w] of r.segs) { parts.push({ type, s: +(t - w).toFixed(3), e: +t.toFixed(3) }); t -= w; }
  out[n] = { parts, extent: [t, c.span.left], town: r.town };
  n++; stats.kept++;
}
fs.writeFileSync(`${dir}/estimate-app.json`, JSON.stringify(out));
console.log(JSON.stringify(stats));
