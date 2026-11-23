// The A/B sample of GURS's buildings (towns/slovenia.js; Bára 23. 11. 2026): 14 street points a city with a fixed seed,
// within 1.8 km of the centre of Ljubljana and Maribor, and the houses at both sides of each (as the app finds them: the
// first OSM building across the street within 40 m, the point 4 m inside it, derive.js probe). OSM from the local
// extract (data/osm/si/si_ways.geojsonl and si_buildings.geojsonl of tools/build_osm_data.sh; not committed: ODbL).
//   node evaluation/slovenia/ab/sample.mjs > evaluation/slovenia/ab/sample.json
import fs from "node:fs";
import { buildingAt, localFrame } from "../../../pilot/public/derive.js";

const OSM = new URL("../../../../../../data/osm/si/", import.meta.url);
let seed = 20261130;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const CITIES = { ljubljana: [46.0514, 14.5058], maribor: [46.5580, 15.6460] };
const R = 1800, N = 14, REACH = 40, IN = 4;
const ROADS = new Set(["residential", "primary", "secondary", "tertiary"]);
// ogr2ogr's GeoJSON: the other tags in one hstore string.
const tagsOf = (p) => {
  const t = { ...p };
  for (const m of String(p.other_tags || "").matchAll(/"([^"]+)"=>"((?:[^"\\]|\\.)*)"/g)) t[m[1]] = m[2];
  delete t.other_tags;
  for (const k of Object.keys(t)) if (t[k] === null) delete t[k];
  return t;
};
const ring = (cs) => cs.map(([lon, lat]) => ({ lon, lat }));
function elements(box) {
  const out = [];
  for (const file of ["si_buildings.geojsonl", "si_ways.geojsonl"]) for (const line of fs.readFileSync(new URL(file, OSM), "utf8").split("\n")) {
    if (!line.trim()) continue;
    const f = JSON.parse(line.replace(/^\x1e/, "")), g = f.geometry;
    const c = g.type === "LineString" ? g.coordinates[0] : g.type === "Polygon" ? g.coordinates[0][0] : g.type === "MultiPolygon" ? g.coordinates[0][0][0] : null;
    if (!c || c[0] < box[0] || c[0] > box[2] || c[1] < box[1] || c[1] > box[3]) continue;
    const t = tagsOf(f.properties || {});
    if (t.building && (g.type === "Polygon" || g.type === "MultiPolygon")) {
      for (const p of g.type === "Polygon" ? [g.coordinates] : g.coordinates) out.push({ type: "area", tags: t, geometry: ring(p[0]), holes: p.slice(1).map(ring) });
    } else if (t.highway && g.type === "LineString") out.push({ type: "way", tags: t, geometry: ring(g.coordinates) });
  }
  return out;
}
function hit(rings, p, d) {
  let best = Infinity;
  for (const r of rings) for (let i = 1; i < r.length; i++) {
    const [ax, ay] = r[i - 1], [bx, by] = r[i], ex = bx - ax, ey = by - ay, den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((ax - p[0]) * ey - (ay - p[1]) * ex) / den, u = ((ax - p[0]) * d[1] - (ay - p[1]) * d[0]) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}
const rows = [];
for (const [city, [lat0, lon0]] of Object.entries(CITIES)) {
  const frame = localFrame(lat0, lon0);
  const els = elements([lon0 - 0.04, lat0 - 0.025, lon0 + 0.04, lat0 + 0.025]), osm = { elements: els };
  const blds = els.filter((e) => e.type === "area").map((e) => ({ e, rings: [e.geometry, ...e.holes].map((r) => r.map((g) => frame.toXY(g.lon, g.lat))) }));
  const ways = els.filter((e) => e.type === "way" && ROADS.has(e.tags.highway) && !e.tags.tunnel && !e.tags.bridge && !e.tags.layer
    && e.geometry.some((g) => Math.hypot(...frame.toXY(g.lon, g.lat)) < R));
  let n = 0, guard = 0;
  while (n < N && guard++ < 500) {
    const w = ways[Math.floor(rnd() * ways.length)], pts = w.geometry.map((g) => frame.toXY(g.lon, g.lat));
    const k = Math.floor(rnd() * (pts.length - 1)), f = rnd();
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], len = Math.hypot(bx - ax, by - ay);
    if (len < 5) continue;
    const p = [ax + (bx - ax) * f, ay + (by - ay) * f];
    if (Math.hypot(...p) > R) continue;
    const dir = [(bx - ax) / len, (by - ay) / len], sides = { left: [-dir[1], dir[0]], right: [dir[1], -dir[0]] };
    const houses = [];
    for (const [side, d] of Object.entries(sides)) {
      let best = null;
      for (const b of blds) { const t = hit(b.rings, p, d); if (t < REACH && (!best || t < best.t)) best = { t, b }; }
      if (!best) continue;
      const probe = [p[0] + d[0] * (best.t + IN), p[1] + d[1] * (best.t + IN)];
      const [plon, plat] = frame.toLonLat(...probe);
      const o = buildingAt(osm, frame, probe);
      const t = best.b.e.tags;
      houses.push({ side, facadeM: +best.t.toFixed(1), lat: +plat.toFixed(7), lon: +plon.toFixed(7),
        osm: { levels: o?.levels, height: o?.height, type: o?.type && o.type !== "yes" ? o.type : undefined, roofShape: o?.roofShape, start: o?.start, block: o?.block },
        tags: { building: t.building, "building:levels": t["building:levels"], "roof:levels": t["roof:levels"], start_date: t.start_date } });
    }
    if (!houses.length) continue;
    const [lon, lat] = frame.toLonLat(...p);
    n++;
    rows.push({ id: `${city.slice(0, 2)}${n}`, town: city, lat: +lat.toFixed(7), lon: +lon.toFixed(7), bearing: +((Math.atan2(dir[0], dir[1]) * 180) / Math.PI).toFixed(1), street: w.tags.name || null, highway: w.tags.highway, houses });
  }
}
console.log(JSON.stringify(rows, null, 1));
