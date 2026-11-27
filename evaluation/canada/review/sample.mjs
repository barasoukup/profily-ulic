// The samples of the A/Bs the second review found missing (evaluation/canada/review/README in ../REPORT.md): drawn after the code was
// frozen (00c6995), a fixed seed, none within 150 m of a point used before in evaluation/usa*, evaluation/canada* nor of another
// drawn here. No condition of a photo (the first measurement lost two thirds of the local and service streets to it).
//   node evaluation/canada/review/sample.mjs      writes sample.json
import fs from "node:fs/promises";
import { osmAt, tiles } from "../../clicks/osm.mjs";
import { TILE, mergePieces } from "../../../app/public/osmtile.js";
import { localFrame, nearestStreet, placeCut as place, snapToWay } from "../../../app/public/derive.js";
import { inside } from "../../../app/public/places.js";
import { isTrack } from "../../../app/public/towns/planimetrics.js";
const read = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8")).valueOf();
const P = "../../../app/public/", far = await read(`${P}states-america.json`), DC = (await read(`${P}towns-us.json`)).washington, TO = (await read(`${P}towns-ca.json`)).toronto;
const AREA = { dc: [DC], toronto: [TO], usout: [far.usa, DC], caout: [far.canada, TO] };
const within = (k, lon, lat) => inside(AREA[k][0], lon, lat) && !(AREA[k][1] && inside(AREA[k][1], lon, lat));
const list = (x) => (Array.isArray(x) ? x : x.rows || []);
const USED = (await Promise.all(["../../usa-dc/sample.json", "../../usa/ab/sample.json", "../../usa/arterials/sample.json", "../../usa/fresh/sample.json", "../dev.json", "../fresh.json", "../tracks.json"].map(read))).flatMap(list)
  .concat([[38.895285, -77.029047], [38.8946, -77.0268], [38.96509, -77.00168], [38.8682366, -76.9815684], [38.8998559, -77.0300845], [43.66610, -79.40340], [43.660410, -79.410616], [43.647936, -79.400367], [43.655881, -79.388607], [43.65998, -79.41110], [43.7640, -79.4000], [43.6535, -79.3839],
    [43.649, -79.396], [43.657, -79.4], [43.676, -79.42], [43.6488, -79.378], [43.83, -79.53], [43.5935, -79.6377]].map(([lat, lon]) => ({ lat, lon })));
const KIND = { motorway: "motorway", motorway_link: "motorway", trunk: "arterial", trunk_link: "arterial", primary: "arterial", primary_link: "arterial", secondary: "arterial", secondary_link: "arterial",
  tertiary: "collector", tertiary_link: "collector", residential: "local", unclassified: "local", living_street: "local", service: "service" };
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
const ok = (el) => { const t = el.tags || {}; return el.type === "way" && el.geometry?.length > 1 && KIND[t.highway] && !NOT.has(t.service) && !(t.tunnel && t.tunnel !== "no") && !(t.bridge && t.bridge !== "no") && t.area !== "yes" && t.covered !== "yes" && !(Number(t.layer) < 0) && !/private|no/.test(t.access || ""); };
let seed = 20261206;
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
function add(group, c, variants, extra = {}) {
  out.push({ id: `${group}-${out.filter((o) => o.group === group).length + 1}`, group, kind: KIND[c.way.tags.highway], name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id, lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), variants, ...extra });
}
// Each way of an area with its length, tile by tile: the proportion of the network.
async function network(k, test = ok) {
  const xs = AREA[k][0].flat(), x0 = Math.floor(Math.min(...xs.map((p) => p[0])) / TILE), x1 = Math.floor(Math.max(...xs.map((p) => p[0])) / TILE), y0 = Math.floor(Math.min(...xs.map((p) => p[1])) / TILE), y1 = Math.floor(Math.max(...xs.map((p) => p[1])) / TILE);
  const names = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) names.push(`${x}_${y}`);
  const lists = []; for (let i = 0; i < names.length; i += 400) lists.push(...(await tiles(names.slice(i, i + 400))).map((l) => l.filter((e) => e.type === "way" && (e.tags?.highway || e.tags?.railway))));
  const segs = []; let total = 0;
  for (const w of mergePieces(lists).filter(test).sort((a, b) => a.id - b.id)) for (let i = 1; i < w.geometry.length; i++) {
    const [a, b] = [w.geometry[i - 1], w.geometry[i]], len = Math.hypot((b.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180), (b.lat - a.lat) * 110574);
    if (!len || !within(k, (a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) continue;
    segs.push({ a, b, from: total, len, w }); total += len;
  }
  return { segs, total, pick: () => { const d = rnd() * total; let lo = 0, hi = segs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (segs[m].from <= d) lo = m; else hi = m - 1; } const s = segs[lo], f = (d - s.from) / s.len; return { s, lat: s.a.lat + (s.b.lat - s.a.lat) * f, lon: s.a.lon + (s.b.lon - s.a.lon) * f }; } };
}
async function random(group, k, n, variants) {
  const net = await network(k), drop = {};
  for (let t = 0, m = 0; m < n && t < n * 8; t++) {
    const q = net.pick(), c = await cut(q.lat, q.lon), kind = KIND[q.s.w.tags.highway];
    if (!c || KIND[c.way.tags.highway] !== kind || !free(c)) { drop[kind] = (drop[kind] || 0) + 1; continue; }
    add(group, c, variants); m++;
  }
  console.error(group, (net.total / 1000).toFixed(0), "km", JSON.stringify(drop));
}
await random("ddot", "dc", 90, ["def", "ddot0"]);
await random("usout", "usout", 15, ["def"]);
await random("caout", "caout", 15, ["def"]);
// Toronto's rules, on streets where each can change something.
const M = (c) => 111320 * Math.cos((c.lat * Math.PI) / 180);
async function targeted(group, test, n, variants) {
  const net = await network("toronto", test), got = net.segs.length;
  for (let t = 0, m = 0; got && m < n && t < n * 25; t++) {
    const q = net.pick();
    let c = await cut(q.lat, q.lon);
    // The street beside the thing (a track, a cycle track): up to 8 m off each side.
    if (c && !/primary|secondary|tertiary|residential|unclassified|trunk/.test(c.way.tags.highway)) {
      const L = q.s.len, nx = -((q.s.b.lat - q.s.a.lat) * 110574) / L, ny = ((q.s.b.lon - q.s.a.lon) * M(q)) / L;
      c = null;
      for (const d of [5, -5, 9, -9]) if (!c) { const x = await cut(q.lat + (ny * d) / 110574, q.lon + (nx * d) / M(q)); if (x && /primary|secondary|tertiary|residential|unclassified|trunk/.test(x.way.tags.highway)) c = x; }
    }
    if (!c || !free(c)) continue;
    add(group, c, variants); m++;
  }
}
const open = (w) => w.type === "way" && w.geometry?.length > 1 && !(w.tags?.tunnel && w.tags.tunnel !== "no") && !(Number(w.tags?.layer) < 0);
await targeted("tram", (w) => open(w) && w.tags.railway === "tram" && w.tags.service === undefined, 40, ["def", "gaps0"]);
await targeted("dual", (w) => ok(w) && /^(primary|secondary|tertiary|trunk)$/.test(w.tags.highway) && w.tags.oneway === "yes" && w.tags.name, 30, ["def", "gaps0"]);
await targeted("track", (w) => open(w) && w.tags.highway && ((isTrack(w) && w.tags.highway === "cycleway") || ["cycleway", "cycleway:left", "cycleway:right", "cycleway:both"].some((k) => w.tags[k] === "track")), 90, ["def", "rt0"]);
await targeted("bay", (w) => ok(w) && ["both", "left", "right"].some((k) => /^(street_side|lay_by)$/.test(w.tags[`parking:${k}`] || "")), 60, ["def", "bays0"]);
await fs.writeFile(new URL("sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
const c = {}; for (const o of out) c[o.group] = (c[o.group] || 0) + 1; console.log(c);
