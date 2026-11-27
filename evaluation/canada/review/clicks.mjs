// Estonia's click collector (evaluation/clicks/collect.mjs) over Washington and Toronto: 40 clicks each, 8 of them alleys.
// rules (derive.js nearestStreet + placeCut, no browser, no profile) and why it moved. A control of every change there.
//   node evaluation/clicks/collect.mjs [out=results/kliky.json] [seed=20261125] [cities=…]
// OLD=<dir of an older tree's app/public>: the variant "old" by that code (git archive <commit> app/public).
// ABSENT from a click: the cities' own OSM readers (their elements are the same packs), except Washington's alleys.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { osmAt, ROOT } from "../../clicks/osm.mjs";
import * as D from "../../../app/public/derive.js";
import { P } from "../../../app/public/ortho-osm.js";
const arg = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=")));
const OUT = new URL(arg.out || "clicks.json", import.meta.url).pathname;
export const CITIES = {
  washington: [38.905, -77.03, "US"], toronto: [43.66, -79.40, "CA"] };
// How many clicks of each kind a city has.
const STRATA = { street: 12, junction: 7, crossing: 4, dual: 5, service: 5, alley: 8, parking: 2, foot: 3 };
const R = 2500, CARS = /^(primary|secondary|tertiary|unclassified|residential|living_street|trunk)$/, FOOT = /^(footway|pedestrian|path|cycleway)$/;
const N = Number(arg.times || 1);
let seed;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const Old = process.env.OLD ? await import(pathToFileURL(path.join(process.env.OLD, "derive.js"))) : null;
const OldP = process.env.OLD ? (await import(pathToFileURL(path.join(process.env.OLD, "ortho-osm.js")))).P : null;
const VARIANTS = {
  none: { off: ["obsluzne", "ulicky", "protejsi"] }, // streets, crossings and loops only
  pre: { off: ["ulicky", "protejsi"], cz: ["obsluzne", "ulicky", "protejsi"] }, // before 83734e7 (Prague without service ways)
  ...(Old ? { old: { D: Old, P: OldP } } : {}),
  now: {},
  ...(arg.trial ? { trade: { trial: { w: 2, ws: 1.5 } }, trade1: { trial: { w: 2, ws: 1.2 } }, limit: { trial: { limit: 25 } }, cont: { trial: { cont: true } } } : {}),
  ...(arg.extra ? Object.fromEntries(arg.extra.split(";").map((x) => { const [k, v] = x.split(":"); return [k, { off: v ? v.split(",") : [] }]; })) : {}),
};
const lenOf = (pts) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
const arc = (pts, near) => { let d = 0; for (let i = 0; i < near.index; i++) d += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return d + Math.hypot(near.point[0] - pts[near.index][0], near.point[1] - pts[near.index][1]); };
const kindOf = (t) => (t.highway === "service" ? (t.service === "alley" ? "alley" : /^(parking_aisle|driveway|drive-through)$/.test(t.service) ? "parking" : "service") : FOOT.test(t.highway) || t.highway === "steps" ? "foot" : CARS.test(t.highway) || /_link$|motorway/.test(t.highway) ? "street" : "other");
const key = (g) => `${g.lat.toFixed(7)},${g.lon.toFixed(7)}`;
// Nodes of car streets by more than one way: junctions (a plain continuation is two ends of one name).
function junctionsOn(els, way) {
  const own = new Set(way.geometry.map(key)), out = [];
  for (const el of els) {
    if (el.type !== "way" || el.id === way.id || !el.tags?.highway || !el.geometry) continue;
    const k = kindOf(el.tags);
    if (k !== "street" && k !== "service") continue;
    el.geometry.forEach((g, j) => { if (own.has(key(g)) && !((j === 0 || j === el.geometry.length - 1) && el.tags.name === way.tags.name && k === "street" && [0, way.geometry.length - 1].includes(way.geometry.findIndex((q) => key(q) === key(g))))) out.push({ g, kind: k }); });
  }
  return out;
}
function want(els, stratum) {
  const ways = els.filter((e) => e.type === "way" && e.tags?.highway && e.geometry?.length > 1 && !e.tags.tunnel && e.tags.indoor !== "yes" && e.tags.area !== "yes");
  const cars = ways.filter((w) => CARS.test(w.tags.highway));
  if (stratum === "street") return { ways: cars };
  if (stratum === "dual") return { ways: cars.filter((w) => w.tags.oneway === "yes" && w.tags.name && cars.some((v) => v.id !== w.id && v.tags.name === w.tags.name && v.tags.oneway === "yes")) };
  if (stratum === "foot") return { ways: ways.filter((w) => FOOT.test(w.tags.highway) && !/crossing|sidewalk/.test(w.tags.footway || "")) };
  if (stratum === "service" || stratum === "alley" || stratum === "parking") return { ways: ways.filter((w) => kindOf(w.tags) === stratum) };
  if (stratum === "crossing") { const c = new Set(ways.filter((w) => w.tags.footway === "crossing" || w.tags.cycleway === "crossing").flatMap((w) => w.geometry.map(key))); return { ways: cars, nodes: (w) => w.geometry.filter((g) => c.has(key(g))), reach: 8 }; }
  const n = new Map(); cars.concat(ways.filter((w) => kindOf(w.tags) === "service")).forEach((w) => w.geometry.forEach((g) => n.set(key(g), (n.get(key(g)) || 0) + 1)));
  return { ways: cars, nodes: (w) => w.geometry.filter((g) => n.get(key(g)) > 1), reach: 20 };
}
async function click(city, stratum) {
  const [clat, clon] = CITIES[city];
  for (let tries = 0; tries < 80; tries++) {
    const a = rnd() * 2 * Math.PI, r = R * Math.sqrt(rnd()), lat = clat + (r * Math.sin(a)) / 110574, lon = clon + (r * Math.cos(a)) / (111320 * Math.cos((clat * Math.PI) / 180));
    const { elements } = await osmAt(lat, lon, 80, false), f = D.localFrame(lat, lon), w = want(elements, stratum);
    const cands = w.ways.filter((x) => { const c = D.snapToWay(x.geometry.map((g) => f.toXY(g.lon, g.lat)), [0, 0]); return c.d < 250; });
    if (!cands.length) continue;
    const way = pick(cands), pts = way.geometry.map((g) => f.toXY(g.lon, g.lat)), total = lenOf(pts);
    let d = rnd() * total;
    if (w.nodes) { const ns = w.nodes(way); if (!ns.length) continue; const q = pick(ns), xy = f.toXY(q.lon, q.lat), i = way.geometry.indexOf(q); d = lenOf(pts.slice(0, i + 1)) + (rnd() * 2 - 1) * w.reach; d = Math.max(0, Math.min(total, d)); void xy; }
    let i = 0; while (i < pts.length - 2 && d > Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])) { d -= Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); i++; }
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 1, u = [(pts[i + 1][0] - pts[i][0]) / l, (pts[i + 1][1] - pts[i][1]) / l];
    const b = (rnd() * 2 - 1) * 4; // m beside the axis
    const [x, y] = [pts[i][0] + u[0] * d - u[1] * b, pts[i][1] + u[1] * d + u[0] * b];
    if (Math.hypot(x, y) > 300) continue;
    const [lo, la] = f.toLonLat(x, y);
    return { lat: +la.toFixed(6), lon: +lo.toFixed(6), wanted: way.id };
  }
  return null;
}
export async function place(c, variants = VARIANTS) {
  const osm = await osmAt(c.lat, c.lon, 80), wide = await osmAt(c.lat, c.lon, 250, false), frame = D.localFrame(c.lat, c.lon), near = D.nearestStreet(osm, frame, [0, 0]);
  if (!near) return null;
  const plain = osm.elements.filter((e) => e.type === "way" && e.tags?.highway && e.geometry?.length > 1).map((e) => ({ e, d: D.snapToWay(e.geometry.map((g) => frame.toXY(g.lon, g.lat)), [0, 0]).d })).sort((a, b) => a.d - b.d)[0];
  const total = lenOf(near.pts), s0 = arc(near.pts, near), js = junctionsOn(wide.elements, near.way).map((j) => { const p = frame.toXY(j.g.lon, j.g.lat); return { ...j, s: arc(near.pts, D.snapToWay(near.pts, p)), p }; });
  const row = { ...c, way: near.way.id, highway: near.way.tags.highway, service: near.way.tags.service, name: near.way.tags.name, kind: kindOf(near.way.tags), len: Math.round(total), from: Math.round(s0), offAxis: +near.d.toFixed(1),
    nearest: plain.e.id === near.way.id ? undefined : { id: plain.e.id, highway: plain.e.tags.highway, footway: plain.e.tags.footway, d: +plain.d.toFixed(1) }, v: {} };
  for (const [k, v] of Object.entries(variants)) {
    const p = v.P || P, M = v.D || D;
    const keep = p.off;
    p.off = new Set(c.city === "praha" && v.cz ? v.cz : v.off || []);
    p.trial = v.trial;
    const hits = D.junctionHits ? (M.junctionHits || D.junctionHits)(osm, frame, near) : [];
    const n = M.placeCut(osm, frame, near), along = M.awayFromJunctions(osm, frame, near);
    p.off = keep; p.trial = undefined;
    const s = arc(near.pts, D.snapToWay(near.pts, along.point)), [lo, la] = frame.toLonLat(...n.point);
    const bad = (pt) => [...new Set(hits.filter((h) => Math.hypot(pt[0] - h.p[0], pt[1] - h.p[1]) < h.clear - 0.5).map((h) => h.kind))];
    const past = js.filter((j) => j.s > Math.min(s0, s) + 1 && j.s < Math.max(s0, s) - 1);
    row.v[k] = { lat: +la.toFixed(6), lon: +lo.toFixed(6), bearing: +((Math.atan2(n.dir[0], n.dir[1]) * 180) / Math.PI).toFixed(1), moved: +Math.abs(s - s0).toFixed(1), end: +Math.min(s, total - s).toFixed(0), cause: [...bad(near.point), ...(Math.min(s0, total - s0) < Math.min(12, total / 2) - 0.5 ? ["end"] : [])],
      left: bad(along.point), past: past.length ? [...new Set(past.map((j) => j.kind))].join("+") : undefined,
      // A junction of a street nearer than its clearance that the click's own 80 m did not read.
      unseen: js.some((j) => Math.hypot(along.point[0] - j.p[0], along.point[1] - j.p[1]) < 14 && Math.hypot(...along.point) > 60 && !hits.some((h) => Math.hypot(h.p[0] - j.p[0], h.p[1] - j.p[1]) < 1)) || undefined };
  }
  return row;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const rows = [], kinds = arg.city ? Object.fromEntries(arg.city.split(",").map((c) => [c, CITIES[c]])) : CITIES;
  for (const [k, city] of Object.keys(kinds).entries()) {
    seed = Number(arg.seed || 20261125) + 7919 * (Object.keys(CITIES).indexOf(city) + 1);
    for (let i = 0; i < 20; i++) rnd();
    let n = 0; void k;
    for (const [s, count] of Object.entries(STRATA)) for (let i = 0; i < count * N; i++) {
      const c = await click(city, s);
      if (!c) continue;
      const row = await place({ id: `${city}-${++n}`, city, country: CITIES[city][2], stratum: s, ...c });
      if (row) rows.push(row);
    }
    console.error(city, n);
  }
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, "[\n" + rows.map((r) => JSON.stringify(r)).join(",\n") + "\n]\n");
}
