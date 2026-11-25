// Records the OSM scenes of tests/placement.test.js (tests/placement-scenes.json; OSM © its contributors, ODbL 1.0; Washington's
// alleys: DC Planimetrics, CC BY 4.0): what the placement of a click reads within 80 m of it, the ways whole.
//   node evaluation/kliky/record.mjs evaluation/kliky/scenes.json      // [{ id, lat, lon, why, max, way? }]
import fs from "node:fs/promises";
import path from "node:path";
import { osmAt, ROOT } from "./osm.mjs";
import { localFrame, nearestStreet, placeCut } from "../../pilot/public/derive.js";
const TAGS = ["highway", "service", "name", "oneway", "footway", "cycleway", "junction", "area:highway", "tunnel", "layer", "level", "indoor", "bridge", "dual_carriageway", "area"];
const list = JSON.parse(await fs.readFile(process.argv[2], "utf8")), out = [];
for (const s of list) {
  const osm = await osmAt(s.lat, s.lon, 80), f = localFrame(s.lat, s.lon);
  const g = (el) => el.geometry.map((q) => f.toXY(q.lon, q.lat)), near = (el, r) => { const q = g(el), x = q.map((p) => p[0]), y = q.map((p) => p[1]); return Math.min(...x) <= r && Math.max(...x) >= -r && Math.min(...y) <= r && Math.max(...y) >= -r; };
  const street = nearestStreet(osm, f, [0, 0]), reach = Math.max(120, ...street.pts.map((p) => Math.min(400, Math.hypot(...p))));
  const box = (el) => { const q = g(el).filter((p) => street.pts.some((z, i) => i && segD(street.pts[i - 1], z, p) < 60)); return el.id === street.way.id || q.length; };
  const els = osm.elements.filter((el) => (el.tags?.highway || el.tags?.["area:highway"] || el.tags?.service === "alley") && near(el, reach) && box(el))
    .map((el) => [el.type[0], el.id, Object.fromEntries(TAGS.filter((k) => el.tags[k]).map((k) => [k, el.tags[k]])), el.geometry.flatMap((q) => [Math.round(q.lon * 1e7), Math.round(q.lat * 1e7)])]);
  const scene = { ...s, elements: els }, here = placeCut(decode(scene), f, nearestStreet(decode(scene), f, [0, 0])), all = placeCut(osm, f, street);
  console.log(s.id, els.length, "elements", here.way.id === street.way.id ? "same way" : "OTHER WAY", "recorded", Math.hypot(...here.point).toFixed(1), "whole", Math.hypot(...all.point).toFixed(1));
  out.push(scene);
}
function segD(a, b, p) { const d = [b[0] - a[0], b[1] - a[1]], L = d[0] ** 2 + d[1] ** 2 || 1, u = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / L)); return Math.hypot(p[0] - a[0] - u * d[0], p[1] - a[1] - u * d[1]); }
function decode(s) { return { elements: s.elements.map(([t, id, tags, g]) => ({ type: { w: "way", a: "area", n: "node" }[t], id, tags, geometry: Array.from({ length: g.length / 2 }, (_, i) => ({ lon: g[2 * i] / 1e7, lat: g[2 * i + 1] / 1e7 })) })) }; }
const head = { note: "OSM © OpenStreetMap contributors, ODbL 1.0 (opendatacommons.org/licenses/odbl); Washington's alleys: DC Planimetrics, © District of Columbia, CC BY 4.0. Made by evaluation/kliky/record.mjs." };
await fs.writeFile(path.join(ROOT, "../../tests/placement-scenes.json"), `{"note":${JSON.stringify(head.note)},"scenes":[\n${out.map((s) => JSON.stringify(s)).join(",\n")}\n]}\n`);
