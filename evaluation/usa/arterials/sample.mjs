// 25 fresh arterial cuts of Washington (25. 11. 2026): random points on trunk, primary and secondary streets as
// ../ab/sample.mjs, a fixed seed, none within 150 m of the judged cuts (the pilot's and the A/B's), each with a Mapillary
// photo within 30 m. Writes sample.json.   node evaluation/usa/arterials/sample.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { decodeTile } from "../../../pilot/public/osmtile.js";
import { ROOT, DATA, cachedJSON, placeCut } from "../../usa-dc/lib.mjs";
const OLD = [...JSON.parse(await fs.readFile(new URL("../../usa-dc/sample.json", import.meta.url), "utf8")), ...JSON.parse(await fs.readFile(new URL("../ab/sample.json", import.meta.url), "utf8"))];
const OUT = path.dirname(new URL(import.meta.url).pathname);

const KIND = { trunk: "arterial", primary: "arterial", secondary: "arterial", tertiary: "collector", residential: "residential", unclassified: "residential" };
let seed = 251126;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const wards = await cachedJSON("https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/53/query?where=1%3D1&outFields=WARD&outSR=4326&f=json");
const inRing = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const wardAt = (lon, lat) => wards.features.find((f) => f.geometry.rings.reduce((c, r) => (inRing(r, lon, lat) ? !c : c), false))?.attributes.WARD ?? null;

// Every street way of the tiles (pieces joined by id: the longest piece kept, enough to pick a point on).
const ways = new Map();
for (const f of (await fs.readdir(path.join(DATA, "osm-tiles"))).filter((f) => /^-?\d+_-?\d+\.json$/.test(f))) {
  for (const el of decodeTile(await fs.readFile(path.join(DATA, "osm-tiles", f), "utf8"))) {
    const t = el.tags || {};
    if (el.type !== "way" || !KIND[t.highway] || t.tunnel && t.tunnel !== "no" || t.bridge && t.bridge !== "no" || t.area === "yes" || t.covered === "yes" || Number(t.layer) < 0) continue;
    if (!ways.has(el.id) || ways.get(el.id).geometry.length < el.geometry.length) ways.set(el.id, el);
  }
}
const len = (g) => g.slice(1).reduce((a, p, i) => a + Math.hypot((p.lon - g[i].lon) * 86700, (p.lat - g[i].lat) * 110574), 0);
const pool = {};
for (const w of ways.values()) {
  if (len(w.geometry) < 40) continue;
  const m = w.geometry[w.geometry.length >> 1], ward = wardAt(m.lon, m.lat);
  if (!ward) continue;
  ((pool[ward] ??= {})[KIND[w.tags.highway]] ??= []).push(w);
}
for (const [ward, k] of Object.entries(pool)) console.error("ward", ward, Object.entries(k).map(([a, b]) => `${a} ${b.length}`).join(", "));

const TOKEN = (await fs.readFile(path.join(ROOT, "..", "streetview", "token.local"), "utf8")).trim();
async function photoNear(lat, lon) {
  const q = new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 5, fields: "id" });
  const r = await fetch(`https://graph.mapillary.com/images?${q}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}

// 25 arterial cuts with a photo, a random way each (the ways of all wards together).
const out = [], list = Object.values(pool).flatMap((k) => k.arterial || []);
for (let tries = 0; out.length < 25 && tries < 400; tries++) {
  const w = list[Math.floor(rnd() * list.length)];
  const g = w.geometry, at = 0.2 + 0.6 * rnd(), i = Math.min(g.length - 2, Math.floor(at * (g.length - 1))), f = at * (g.length - 1) - i;
  const c = await placeCut(g[i].lat + (g[i + 1].lat - g[i].lat) * f, g[i].lon + (g[i + 1].lon - g[i].lon) * f);
  if (!c || KIND[c.way.tags.highway] !== "arterial" || [...out, ...OLD].some((o) => Math.hypot((o.lat - c.lat) * 110574, (o.lon - c.lon) * 86700) < 150)) continue;
  if (!(await photoNear(c.lat, c.lon))) continue;
  out.push({ id: `te-${out.length + 1}`, country: "US", town: "washington", ward: wardAt(c.lon, c.lat), kind: "arterial", name: c.way.tags.name || "", highway: c.way.tags.highway, wayId: c.way.id,
    lat: +c.lat.toFixed(7), lon: +c.lon.toFixed(7), bearing: +c.bearing.toFixed(1), variants: ["def", "dcold", "dc0"] });
  console.error(out.at(-1).id, out.at(-1).name);
}
await fs.writeFile(path.join(OUT, "sample.json"), JSON.stringify(out, null, 1));
