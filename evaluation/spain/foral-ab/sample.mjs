// The A/B sample of the foral cadastres (towns/spain-foral.js; Bára 23. 11. 2026): 10 street points a city with a fixed
// seed, within 1.8 km of the centre, and the houses at both sides of each (as the app finds them: the first OSM building
// across the street within 40 m, the point 4 m inside it, derive.js probe).
// - Bilbao, Donostia, Vitoria-Gasteiz: random OSM ways (residential, primary, secondary) from Geofabrik's pais-vasco
//   extract cut by osmium (data/extract.sh → data/<city>.geojsonl, not committed: ODbL); the OSM facts of the house as
//   the app reads them (derive.js buildingAt).
// - Pamplona: Navarre is in no local OSM extract nor in the R2 pack (23. 11. 2026), so the point is a random one in the
//   street (outside every building) and the house the nearest one of the Navarre cadastre's answer for about 60 m
//   around (one request a point, a pause of 1.5 s); no OSM facts.
//   node evaluation/spain/foral-ab/sample.mjs > evaluation/spain/foral-ab/sample.json
import fs from "node:fs";
import { buildingAt, localFrame } from "../../../pilot/public/derive.js";
import { FORAL } from "../../../pilot/public/towns/spain-foral.js";

const DIR = new URL("./data/", import.meta.url);
let seed = 20261127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const CITIES = { bilbao: [43.2630, -2.9350], donostia: [43.3183, -1.9812], vitoria: [42.8467, -2.6716], pamplona: [42.8125, -1.6458] };
const R = 1800, N = 10, REACH = 40, IN = 4;
const ROADS = new Set(["residential", "primary", "secondary"]);

const ring = (cs) => cs.map(([lon, lat]) => ({ lon, lat }));
function elements(city) {
  const out = [];
  for (const line of fs.readFileSync(new URL(`${city}.geojsonl`, DIR), "utf8").split("\n")) {
    if (!line.trim()) continue;
    const f = JSON.parse(line.replace(/^\x1e/, "")), g = f.geometry, t = f.properties || {};
    if (t.building && (g.type === "Polygon" || g.type === "MultiPolygon")) {
      for (const p of g.type === "Polygon" ? [g.coordinates] : g.coordinates) out.push({ type: "area", tags: t, geometry: ring(p[0]), holes: p.slice(1).map(ring) });
    } else if (t.highway && g.type === "LineString") out.push({ type: "way", tags: t, geometry: ring(g.coordinates) });
  }
  return out;
}
// The first crossing of the ray from p along d (metres, frame) with the rings, or Infinity.
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
const inside = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];

for (const [city, [lat0, lon0]] of Object.entries(CITIES)) {
  const frame = localFrame(lat0, lon0);
  if (city !== "pamplona") {
    const els = elements(city), osm = { elements: els };
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
  } else {
    let n = 0, guard = 0;
    while (n < N && guard++ < 40) {
      const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd(), p = [r * Math.sin(a), r * Math.cos(a)];
      const [lon, lat] = frame.toLonLat(...p), d = 0.0003;
      const url = `${FORAL.nc.url}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: FORAL.nc.type, count: "40", srsName: FORAL.nc.srs,
        bbox: `${lat - d},${lon - d * 1.4},${lat + d},${lon + d * 1.4},${FORAL.nc.bboxCrs}` })}`;
      const gml = await (await fetch(url)).text();
      await pause(1500);
      const blds = gml.split(/<wfs:member\b[^>]*>/).slice(1).map((m) => ({ rings: [...m.matchAll(/<gml:posList[^>]*>([^<]*)</g)].map((x) => {
        const v = x[1].trim().split(/\s+/).map(Number), out = [];
        for (let i = 0; i + 1 < v.length; i += 2) out.push(frame.toXY(v[i + 1], v[i]));
        return out;
      }) })).filter((b) => b.rings.length);
      if (!blds.length || blds.some((b) => inside(b.rings, ...p))) continue;
      // The nearest building, along the direction to the nearest point of its outline.
      let best = null;
      for (const b of blds) for (const rg of b.rings) for (let i = 1; i < rg.length; i++) {
        const [ax, ay] = rg[i - 1], [bx, by] = rg[i], ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey;
        const k = l2 ? Math.max(0, Math.min(1, ((p[0] - ax) * ex + (p[1] - ay) * ey) / l2)) : 0, q = [ax + k * ex, ay + k * ey], dd = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (!best || dd < best.dd) best = { dd, q };
      }
      if (!best || best.dd > REACH || best.dd < 0.5) continue;
      const dir = [(best.q[0] - p[0]) / best.dd, (best.q[1] - p[1]) / best.dd], probe = [best.q[0] + dir[0] * IN, best.q[1] + dir[1] * IN];
      const [plon, plat] = frame.toLonLat(...probe);
      n++;
      rows.push({ id: `pa${n}`, town: city, lat: +lat.toFixed(7), lon: +lon.toFixed(7), bearing: +(((Math.atan2(dir[0], dir[1]) * 180) / Math.PI + 90) % 360).toFixed(1), street: null, highway: null,
        houses: [{ side: "near", facadeM: +best.dd.toFixed(1), lat: +plat.toFixed(7), lon: +plon.toFixed(7), osm: null, tags: null }] });
    }
  }
}
console.log(JSON.stringify(rows, null, 1));
