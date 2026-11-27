// The fresh cuts of the fixes' A/Bs (FIXES.md): drawn after the fixes were written, a seed of their own, none within 150 m of a
// point used before in evaluation/usa*, evaluation/canada* (the second review's sample.json, its fork and tunnel samples, the
// clicks) nor of another drawn here. Washington: random cuts in the proportion of the network and cuts of the kinds the DDOT
// fixes are about (one-way arterials and their ramps: two carriageways; ways with a bike or bus lane); Toronto: ways of two
// carriageways and tram tracks (the gaps) and cycle tracks (the tracks), as the review drew them. Which of them a fix changes
// is told by surf.mjs (in Node), only those are cut in the app.   node evaluation/canada/fixes/sample.mjs   writes sample.json
import fs from "node:fs/promises";
import { osmAt, tiles } from "../../kliky/osm.mjs";
import { TILE, mergePieces } from "../../../pilot/public/osmtile.js";
import { localFrame, nearestStreet, placeCut as place } from "../../../pilot/public/derive.js";
import { inside } from "../../../pilot/public/places.js";
import { isTrack } from "../../../pilot/public/towns/planimetrics.js";
const read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8")).valueOf();
const P = "../../../pilot/public/", DC = (await read(`${P}mesta-us.json`)).washington, TO = (await read(`${P}mesta-ca.json`)).toronto;
const US = await read(`${P}mesta-us.json`);
const AREA = { dc: DC, toronto: TO, boston: US.boston, newyork: US.newyork };
const list = (x) => (Array.isArray(x) ? x : x.rows || []);
const USED = (await Promise.all(["../../usa-dc/sample.json", "../../usa/ab/sample.json", "../../usa/arterials/sample.json", "../../usa/fresh/sample.json", "../dev.json", "../fresh.json", "../tracks.json",
  "../review/sample.json", "../review/fork-sample.json", "../review/clicks.json",
  "../../usa/boston/fresh.json", "../../usa/boston/outer/sample.json", "../../usa/nyc/sample-all.json", "../../usa/nyc/sample.json", "../../usa/nyc/sample-u.json"].map((f) => read(f).catch(() => [])))).flatMap(list).filter((p) => p.lat && p.lon)
  .concat([[38.895285, -77.029047], [38.8946, -77.0268], [38.96509, -77.00168], [38.8682366, -76.9815684], [38.8998559, -77.0300845], [43.66610, -79.40340], [43.660410, -79.410616], [43.647936, -79.400367], [43.655881, -79.388607], [43.65998, -79.41110], [43.7640, -79.4000], [43.6535, -79.3839],
    [43.649, -79.396], [43.657, -79.4], [43.676, -79.42], [43.6488, -79.378], [43.83, -79.53], [43.5935, -79.6377]].map(([lat, lon]) => ({ lat, lon })));
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && el.geometry?.length > 1 && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
let seed = 20261127;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const out = [];
const near = (o, p) => Math.hypot((o.lat - p.lat) * 110574, (o.lon - p.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180)) < 150;
const free = (p) => ![...out, ...USED].some((o) => near(o, p));
async function cut(lat, lon) {
  const osm = await osmAt(lat, lon, 80), frame = localFrame(lat, lon), n = nearestStreet(osm, frame, [0, 0]);
  if (!n) return null;
  const c = place(osm, frame, n), [clon, clat] = frame.toLonLat(...c.point);
  let d = c.dir; if (d[1] < 0) d = [-d[0], -d[1]];
  return { lat: clat, lon: clon, bearing: (Math.atan2(d[0], d[1]) * 180) / Math.PI, way: n.way };
}
function add(group, c) {
  out.push({ id: `${group}-${out.filter((o) => o.group === group).length + 1}`, group, kind: KIND[c.way.tags.highway], name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id, lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1) });
}
async function network(k, test = ok) {
  const xs = AREA[k].flat(), x0 = Math.floor(Math.min(...xs.map((p) => p[0])) / TILE), x1 = Math.floor(Math.max(...xs.map((p) => p[0])) / TILE), y0 = Math.floor(Math.min(...xs.map((p) => p[1])) / TILE), y1 = Math.floor(Math.max(...xs.map((p) => p[1])) / TILE);
  const names = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) names.push(`${x}_${y}`);
  const lists = []; for (let i = 0; i < names.length; i += 400) lists.push(...(await tiles(names.slice(i, i + 400))).map((l) => l.filter((e) => e.type === "way" && (e.tags?.highway || e.tags?.railway))));
  const segs = []; let total = 0;
  for (const w of mergePieces(lists).filter(test).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
    const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180), (b.lat - a.lat) * 110574);
    if (!len || !inside(AREA[k], (a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
    segs.push({ a, b, from: total, len, w }); total += len;
  }
  return { segs, total, pick: () => { const d = rnd() * total; let lo = 0, hi = segs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (segs[m].from <= d) lo = m; else hi = m - 1; } const s = segs[lo], f = (d - s.from) / s.len; return { s, lat: s.a.lat + (s.b.lat - s.a.lat) * f, lon: s.a.lon + (s.b.lon - s.a.lon) * f }; } };
}
// Cuts of a group: the cut of the picked point must keep the picked way's kind (same: its test) and lie away from the others.
async function pick(group, k, test, n, same = (c, q) => KIND[c.way.tags.highway] === KIND[q.s.w.tags.highway]) {
  const net = await network(k, test);
  for (let t = 0, m = 0; net.segs.length && m < n && t < n * 25; t++) {
    const q = net.pick();
    let c = await cut(q.lat, q.lon);
    // (Of a track or a tram line the street beside it: up to 9 m off each side, as the review drew them.)
    if (c && !same(c, q) && /(tram|track)$/.test(group)) {
      const L = q.s.len, M = 111320 * Math.cos((q.lat * Math.PI) / 180), nx = -((q.s.b.lat - q.s.a.lat) * 110574) / L, ny = ((q.s.b.lon - q.s.a.lon) * M) / L;
      c = null;
      for (const d of [5, -5, 9, -9]) if (!c) { const x = await cut(q.lat + (ny * d) / 110574, q.lon + (nx * d) / M); if (x && same(x, q)) c = x; }
    }
    if (!c || !same(c, q) || !free(c)) continue;
    add(group, c); m++;
  }
  console.error(group, (net.total / 1000).toFixed(0), "km", out.filter((o) => o.group === group).length);
}
const road = /primary|secondary|tertiary|residential|unclassified|trunk/;
// node sample.mjs more: a second draw of Washington (the first changed 13 of 420 cuts), appended to sample.json with a seed
// of its own: random cuts and one-way ways (the carriageways of divided streets, where the cut's centre is off its way).
if (process.argv[2] === "more") {
  const had = await read("sample.json");
  out.push(...had);
  seed = 20261128;
  await pick("dd", "dc", ok, 450);
  await pick("dw", "dc", (w) => ok(w) && w.tags.oneway === "yes" && w.tags.highway !== "service", 250, (c) => c.way.tags.oneway === "yes");
  await fs.writeFile(new URL("sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
  console.log(out.length);
  process.exit(0);
}
// node sample.mjs other: the shared fixes (planimetrics.js) in the other cities of a planimetric map (Bára 26. 11. 2026: only
// fixes general enough for more cities): Boston's ways of two carriageways (the gaps) and cycle tracks of both (the tracks).
if (process.argv[2] === "other") {
  out.push(...(await read("sample.json")));
  seed = 20261130;
  const tr = (w) => w.type === "way" && w.geometry?.length > 1 && !(w.tags?.tunnel && w.tags.tunnel !== "no") && !(Number(w.tags?.layer) < 0) && w.tags.highway && ((isTrack(w) && w.tags.highway === "cycleway") || ["cycleway", "cycleway:left", "cycleway:right", "cycleway:both"].some((k) => w.tags[k] === "track"));
  await pick("bdual", "boston", (w) => ok(w) && /^(primary|secondary|tertiary|trunk)$/.test(w.tags.highway) && w.tags.oneway === "yes" && w.tags.name, 120, (c) => road.test(c.way.tags.highway));
  await pick("btrack", "boston", tr, 100, (c) => road.test(c.way.tags.highway));
  await pick("ntrack", "newyork", tr, 120, (c) => road.test(c.way.tags.highway));
  await fs.writeFile(new URL("sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
  console.log(out.length);
  process.exit(0);
}
// node sample.mjs tracks: more cuts for the tracks' fix (3 of the first 320 changed): Toronto's one-way arterials beside a cycle
// track (two one-way ways in one roadway of the map, Finch Avenue West), appended with a seed of its own.
if (process.argv[2] === "tracks") {
  out.push(...(await read("sample.json")));
  seed = 20261129;
  const near = new Set();
  const net0 = await network("toronto", (w) => w.type === "way" && w.geometry?.length > 1 && ((isTrack(w) && w.tags.highway === "cycleway") || ["cycleway:left", "cycleway:right", "cycleway:both", "cycleway"].some((k) => w.tags[k] === "track")));
  for (const s of net0.segs) near.add(`${Math.round(s.a.lat * 500)},${Math.round(s.a.lon * 500)}`);
  const by = (w) => w.geometry.some((p) => near.has(`${Math.round(p.lat * 500)},${Math.round(p.lon * 500)}`));
  await pick("tf", "toronto", (w) => ok(w) && /^(primary|secondary|tertiary)$/.test(w.tags.highway) && w.tags.oneway === "yes" && by(w), 220, (c) => road.test(c.way.tags.highway));
  await fs.writeFile(new URL("sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
  console.log(out.length);
  process.exit(0);
}
await pick("dc", "dc", ok, 260);
const lanes = (t) => ["cycleway", "cycleway:both", "cycleway:left", "cycleway:right"].some((x) => /lane|share_busway/.test(t[x] || "")) || Object.keys(t).some((x) => /^bus(way)?(:|$)|^bus:lanes/.test(x));
await pick("dcx", "dc", (w) => ok(w) && (/^(primary|secondary|trunk|tertiary)(_link)?$/.test(w.tags.highway) && (w.tags.oneway === "yes" || /_link$/.test(w.tags.highway)) || lanes(w.tags)), 160, (c) => road.test(c.way.tags.highway) || /_link$/.test(c.way.tags.highway));
const open = (w) => w.type === "way" && w.geometry?.length > 1 && !(w.tags?.tunnel && w.tags.tunnel !== "no") && !(Number(w.tags?.layer) < 0);
await pick("dual", "toronto", (w) => ok(w) && /^(primary|secondary|tertiary|trunk)$/.test(w.tags.highway) && w.tags.oneway === "yes" && w.tags.name, 120, (c) => road.test(c.way.tags.highway));
await pick("tram", "toronto", (w) => open(w) && w.tags.railway === "tram" && w.tags.service === undefined, 40, (c) => road.test(c.way.tags.highway));
await pick("track", "toronto", (w) => open(w) && w.tags.highway && ((isTrack(w) && w.tags.highway === "cycleway") || ["cycleway", "cycleway:left", "cycleway:right", "cycleway:both"].some((k) => w.tags[k] === "track")), 160, (c) => road.test(c.way.tags.highway));
await fs.writeFile(new URL("sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
const c = {}; for (const o of out) c[o.group] = (c[o.group] || 0) + 1; console.log(c);
