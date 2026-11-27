// Shoulders and parked cars (Bára 20. 11. 2026): on the hand-labelled kerb strips of Prague's and Brno's local and
// tertiary streets (stitky.json: 125 strips chosen by a loose car rule, its thresholds tuned on them; stitky2.json:
// the other 105 sides of those streets, untouched by any tuning), the estimate as the app makes it (with the lanes
// read on the image and the lane rules): a shoulder at the kerb and how wide, and whether cars stand there; the
// colour detector (ortho-osm.js carsColoured) on the 2 m strip inside the kerb.
//   node evaluation/ortofoto-osm/auta/krajnice.mjs
import fs from "node:fs";
import { cuts, osmAround, stripOf } from "../lib.mjs";
import { orthoOsmPolys, trimToEnds, carsColoured } from "../../../app/public/ortho-osm.js";
import { localFrame, deriveProfile, lanesFromShoulders, splitTwoWayLane, capWideLanes, pedestrianZone, widenNarrowTrams } from "../../../app/public/derive.js";
import { applyLanes } from "../../../app/public/lanes-ortho.js";
import { aiKerbs, parkFromAi, parkSkip } from "../../../app/public/ai-kerbs.js";
import { P } from "../../../app/public/ortho-osm.js";
const wayAlong = (way, frame, dir) => { const g = way.geometry.map((q) => frame.toXY(q.lon, q.lat)); let best = null; for (let i = 0; i + 1 < g.length; i++) { const [a, b] = [g[i], g[i + 1]], d = Math.hypot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); if (!best || d < best.d) best = { d, v: [b[0] - a[0], b[1] - a[1]] }; } return !best || best.v[0] * dir[0] + best.v[1] * dir[1] >= 0; };
// AI=ai-map5-3: the model's kerbs and surfaces as in the app (Brno only).
const AIC = process.env.AI && JSON.parse(fs.readFileSync(`/Users/barasoukupova/streetdesign/data/ai-seg/cuts/brno/${process.env.AI}.json`, "utf8"));
if (AIC) P.aiWalk = true;
// PARK=park-park-b1: the model's parking along the cut (ai-kerbs.js parkFromAi), precomputed by park_cuts.py (Brno).
const PKC = process.env.PARK && Object.fromEntries(["brno", "praha"].map((c) => [c, JSON.parse(fs.readFileSync(`/Users/barasoukupova/streetdesign/data/ai-seg/cuts/${c}/${process.env.PARK}.json`, "utf8"))]));

const HERE = new URL(".", import.meta.url).pathname;
const L1 = JSON.parse(fs.readFileSync(`${HERE}stitky.json`, "utf8")), L2 = JSON.parse(fs.readFileSync(`${HERE}stitky2.json`, "utf8"));
const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "cyklopruh", "ochranny_pruh", "obsluzna", "parkovani"]);
const rows = [];
for (const city of ["praha", "brno"]) for (const c of await cuts(city)) {
  if (![..."AB"].some((s) => `${city}|${c.n}|${s}` in L1 || `${city}|${c.n}|${s}` in L2)) continue;
  const st = await stripOf(city, "cuzk12", c);
  if (!st) continue;
  if (!st.Y) { st.Y = new Float32Array(st.nt * st.nu); st.D = new Float32Array(st.nt * st.nu); for (let q = 0; q < st.nt * st.nu; q++) { const r = st.rgb[q * 3], g = st.rgb[q * 3 + 1], b = st.rgb[q * 3 + 2]; st.Y[q] = (r + g) / 2 - b; st.D[q] = g - r; } }
  const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
  const frame = localFrame(c.cut.lat, c.cut.lon), br = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(br), Math.cos(br)];
  const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
  if (!way) continue;
  let ai = null, aiSurf = null;
  if (AIC) {
    if (city !== "brno") continue;
    const cls = AIC[String(c.n)], f = `/Users/barasoukupova/streetdesign/data/ai-seg/cuts/brno/${c.n}.json`, meta = fs.existsSync(f) && JSON.parse(fs.readFileSync(f, "utf8"));
    if (cls && meta) {
      const cut = { ts: meta.ts, cls: cls.map((v) => (v === 0 || v === 3 ? 0 : v < 0 ? -1 : 1)) }; ai = (axis) => aiKerbs(cut, axis);
      const K9 = { 1: "chodník", 2: "chodník", 5: "zeleň", 6: "budova", 0: "vozovka", 3: "vozovka", 4: "vozovka", 7: "jiné", 8: "jiné" };
      aiSurf = (tt) => { const i = Math.round((tt - meta.ts[0]) / (meta.ts[1] - meta.ts[0])); return i >= 0 && i < cls.length && cls[i] >= 0 ? K9[cls[i]] : null; };
    }
  }
  const polys = orthoOsmPolys({ osm, frame, dir, way, st, ai, aiSurf });
  if (!polys) continue;
  const p = trimToEnds(deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 }, lanesImage: st, ...(process.env.ZPS0 && { inZps: false }) }), polys.ends);
  if (!p?.segments?.length) continue;
  applyLanes(p, { source: "cuzk12", st });
  lanesFromShoulders(p.segments, way.tags); splitTwoWayLane(p.segments, way.tags); capWideLanes(p.segments, way.tags); pedestrianZone(p.segments, way.tags, { measured: false }); widenNarrowTrams(p.segments);
  if (PKC) {
    const pk = PKC[city][String(c.n)], meta = JSON.parse(fs.readFileSync(`/Users/barasoukupova/streetdesign/data/ai-seg/cuts/${city}/${c.n}.json`, "utf8"));
    if (pk) parkFromAi(p, (tt) => { const i = Math.round((tt - meta.ts[0]) / (meta.ts[1] - meta.ts[0])); return i >= 0 && i < pk.length && pk[i] >= 0 ? pk[i] : null; }, parkSkip(way.tags, wayAlong(way, frame, dir), false));
  }
  let t = p.extent[1];
  const parts = p.segments.map((s) => { const r = { type: s.type, s: t - s.width, e: t }; t -= s.width; return r; });
  const road = parts.filter((x) => ROAD.has(x.type));
  if (!road.length) continue;
  const PARKED_AT = (side) => { const kb0 = side === "A" ? Math.min(...road.map((x) => x.s)) : Math.max(...road.map((x) => x.e)); return parts.some((x) => x.type === "parkovani" && (side === "A" ? x.s < kb0 + 3 && x.e > kb0 - 3 : x.e > kb0 - 3 && x.s < kb0 + 3)); };
  const lo = Math.min(...road.map((x) => x.s)), hi = Math.max(...road.map((x) => x.e));
  for (const [side, sg, kb] of [["A", -1, lo], ["B", 1, hi]]) {
    const id = `${city}|${c.n}|${side}`, set = id in L2 ? 2 : id in L1 ? 1 : 0;
    if (!set) continue;
    const label = set === 2 ? L2[id] : L1[id];
    const edge = road.filter((x) => (sg < 0 ? x.s - lo < 0.05 : hi - x.e < 0.05))[0];
    const shoulder = edge?.type === "krajnice" ? edge.e - edge.s : 0, parked = edge?.type === "parkovani" || PARKED_AT(side);
    // the 2 m inside the kerb (the strip a parking lane would take)
    const cars = carsColoured(st, sg < 0 ? kb : kb - 2, sg < 0 ? kb + 2 : kb);
    rows.push({ id, set, label, kb: +kb.toFixed(2), n: c.n, city, hw: way.tags.highway, shoulder: +shoulder.toFixed(2), parked, cars, edge: edge?.type, osmPark: way.tags[`parking:${sg < 0 ? "left" : "right"}`] || way.tags["parking:both"] || way.tags[`parking:lane:${sg < 0 ? "left" : "right"}`] || way.tags["parking:lane:both"] || "", beyond: parts.find((x) => (sg < 0 ? Math.abs(x.e - lo) < 0.05 : Math.abs(x.s - hi) < 0.05))?.type });
  }
}
const n = (f) => rows.filter(f).length;
console.log(`${rows.length} stran (sada 1: ${n((r) => r.set === 1)}, sada 2: ${n((r) => r.set === 2)}), auta: ${n((r) => r.label)}`);
for (const [name, f] of [["krajnice u obruby (jakákoli)", (r) => r.shoulder > 0], ["krajnice ≥ 1,5 m", (r) => r.shoulder >= 1.5], ["krajnice ≥ 1,8 m", (r) => r.shoulder >= 1.8], ["stání u obruby v odhadu", (r) => r.parked]])
  console.log(`${name}: ${n(f)} stran, z nich s auty ${n((r) => f(r) && r.label)}`);
for (const set of [1, 2]) {
  const R = rows.filter((r) => r.set === set), tp = R.filter((r) => r.cars && r.label).length, fp = R.filter((r) => r.cars && !r.label).length, pos = R.filter((r) => r.label).length;
  console.log(`detektor barev na pásu 2 m u obruby, sada ${set}: nalezeno ${tp} z ${pos}, falešně ${fp} z ${R.length - pos}`);
}
for (const [name, f] of [["krajnice ≥ 1,8 m a auta podle barev", (r) => r.shoulder >= 1.8 && r.cars], ["krajnice ≥ 1,5 m a auta podle barev", (r) => r.shoulder >= 1.5 && r.cars]])
  console.log(`${name}: ${n(f)} stran, z nich s auty ${n((r) => f(r) && r.label)} (auta celkem ${n((r) => r.label)})`);
fs.writeFileSync(`${HERE}krajnice${AIC ? "-ai" : ""}${PKC ? "-park" : ""}.json`, JSON.stringify(rows));
