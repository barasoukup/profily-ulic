// The surface maps of Boston and Cambridge (Bára 26. 11. 2026, towns/boston.js) as small static tiles, downloaded once per
// deploy from the cities' ArcGIS services, never on a click: their roadways are a few polygons of the whole city each
// (Boston's "Street Edges" 5 MB for any box, Cambridge's "Roads" the same), too much for a click, so they are cut here into
// tiles of TILE degrees, each polygon clipped to the tile (a ring by the rectangle, Sutherland–Hodgman; the rings of one
// feature stay together, so a hole stays a hole: the reader tests points by parity).
//   Boston (City of Boston, Open Data Commons PDDL 1.0): Basemaps/basemap_IPS 15 Street Edges (type), 16 buildings
//   (part_floors), Infrastructure/OpenData 0 Sidewalk Inventory (the City of Boston Basemap and Analyze Boston's "Sidewalk
//   Inventory", both PDDL by their ArcGIS items).
//   Cambridge (City of Cambridge GIS, PDDL 1.0 by its ArcGIS items): Roads, Sidewalks, Driveways, Parking_Lots, Buildings.
//   node tools/build_planimetrics_us.mjs [outDir]   (default pilot/data/us-plan; served as data/us-plan/…)
//   ONLY=boston node tools/build_planimetrics_us.mjs   (one city)
// Output: <outDir>/<city>/<ix>_<iy>.json { <layer>: [[attributes…, ring, ring…]…] } (each ring flat integers: 1e-7 degrees
// from the tile's south-west corner), <outDir>/<city>/about.json (written last: the city is whole), <outDir>/about.json
// (the date, the counts). One request at a time, PAUSE ms apart. A city that fails: the others are built, exit 1.
import fs from "node:fs";
import path from "node:path";

export const TILE = 0.005; // degrees (towns/boston.js PLAN_TILE)
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = process.argv[2] || path.join(ROOT, "pilot", "data", "us-plan");
const BOS = "https://gis.boston.gov/arcgis/rest/services", CAM = "https://services1.arcgis.com/WnzC35krSYGuYov4/ArcGIS/rest/services";
// Each layer: its url, the fields kept (in this order, the tile's attributes), the page size (Street Edges and Roads have
// polygons of megabytes).
export const CITIES = {
  boston: {
    b: { url: `${BOS}/Basemaps/basemap_IPS/MapServer/16`, fields: ["part_floors"], page: 2000 },
    s: { url: `${BOS}/Infrastructure/OpenData/MapServer/0`, fields: [], page: 2000 },
    r: { url: `${BOS}/Basemaps/basemap_IPS/MapServer/15`, fields: ["type"], page: 50, skip: (a) => a.type === "RD-RUNWAY" },
  },
  cambridge: {
    b: { url: `${CAM}/Buildings/FeatureServer/0`, fields: ["TYPE"], page: 2000 },
    s: { url: `${CAM}/Sidewalks/FeatureServer/0`, fields: ["TYPE"], page: 2000 },
    r: { url: `${CAM}/Roads/FeatureServer/0`, fields: ["TYPE"], page: 20 },
    d: { url: `${CAM}/Driveways/FeatureServer/0`, fields: [], page: 2000 },
    p: { url: `${CAM}/Parking_Lots/FeatureServer/0`, fields: [], page: 2000 },
  },
};
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const PAUSE = 500;
const pause = () => new Promise((res) => setTimeout(res, PAUSE));

async function get(url, ms = 300000) {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "profily-ulic build" }, signal: AbortSignal.timeout(ms) });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      const j = await r.json();
      if (j.error) throw new Error(`${j.error.message} ${url}`);
      return j;
    } catch (err) {
      if (attempt >= 2) throw err;
      await new Promise((res) => setTimeout(res, 20000 * (attempt + 1)));
    }
  }
}
// A layer's features (esri JSON in degrees), paged by its object id (where id > the last one), one request at a time.
async function layer({ url, fields, page }) {
  const meta = await get(`${url}?f=json`);
  const oid = meta.objectIdField || meta.fields?.find((f) => f.type === "esriFieldTypeOID")?.name || "OBJECTID";
  const { count } = await get(`${url}/query?where=1%3D1&returnCountOnly=true&f=json`);
  if (!(count > 0)) throw new Error(`${url}: no count`);
  const out = [];
  let last = -1;
  for (;;) {
    await pause();
    const q = new URLSearchParams({ where: `${oid} > ${last}`, outFields: [oid, ...fields].join(","), orderByFields: oid, resultRecordCount: String(page),
      returnGeometry: "true", outSR: "4326", geometryPrecision: "7", f: "json" });
    const j = await get(`${url}/query?${q}`);
    const fs = j.features || [];
    if (!fs.length) break;
    out.push(...fs);
    last = Math.max(...fs.map((f) => f.attributes[oid]));
    if (fs.length < Math.min(page, meta.maxRecordCount || page) && !j.exceededTransferLimit) break;
  }
  if (out.length !== count) throw new Error(`${url}: ${out.length} of ${count} features`);
  return out;
}

// Douglas–Peucker in metres on a closed ring (a tolerance of 5 cm keeps the kerbs where they are).
export function simplifyRing(pts, tol = 0.05) {
  if (pts.length < 5) return pts;
  const kx = 111320 * Math.cos((pts[0][1] * Math.PI) / 180), ky = 110574;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const far = pts.reduce((b, p, i) => (Math.hypot((p[0] - pts[0][0]) * kx, (p[1] - pts[0][1]) * ky) > b.d ? { d: Math.hypot((p[0] - pts[0][0]) * kx, (p[1] - pts[0][1]) * ky), i } : b), { d: -1, i: 1 }).i;
  keep[far] = 1;
  const stack = [[0, far], [far, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = [pts[a][0] * kx, pts[a][1] * ky], [bx, by] = [pts[b][0] * kx, pts[b][1] * ky];
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy);
    let best = -1, dmax = tol;
    for (let i = a + 1; i < b; i++) {
      const d = l ? Math.abs((pts[i][0] * kx - ax) * dy - (pts[i][1] * ky - ay) * dx) / l : Math.hypot(pts[i][0] * kx - ax, pts[i][1] * ky - ay);
      if (d > dmax) { dmax = d; best = i; }
    }
    if (best >= 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// A ring clipped by the rectangle [x0, y0, x1, y1] (Sutherland–Hodgman; edges along the rectangle may remain, which a test
// by parity of a point inside it does not see), or null when nothing is left.
export function clipRing(ring, [x0, y0, x1, y1]) {
  let pts = ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring.slice();
  const edges = [[(p) => p[0] >= x0, (p, q) => [x0, p[1] + ((q[1] - p[1]) * (x0 - p[0])) / (q[0] - p[0])]],
    [(p) => p[0] <= x1, (p, q) => [x1, p[1] + ((q[1] - p[1]) * (x1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= y0, (p, q) => [p[0] + ((q[0] - p[0]) * (y0 - p[1])) / (q[1] - p[1]), y0]],
    [(p) => p[1] <= y1, (p, q) => [p[0] + ((q[0] - p[0]) * (y1 - p[1])) / (q[1] - p[1]), y1]]];
  for (const [inside, cut] of edges) {
    if (!pts.length) break;
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if (inside(p)) { out.push(p); if (!inside(q)) out.push(cut(p, q)); } else if (inside(q)) out.push(cut(p, q));
    }
    pts = out;
  }
  return pts.length >= 3 ? [...pts, pts[0]] : null;
}

// The features of a layer into the tiles their boxes touch, each ring clipped to the tile and a margin of about 1 m.
const MARGIN = 0.00001;
export function tileFeatures(features, fields, tiles, key, skip = () => false) {
  let n = 0;
  for (const f of features) {
    const a = f.attributes || {};
    if (skip(a) || !f.geometry?.rings?.length) continue;
    const rings = f.geometry.rings.map((r) => simplifyRing(r)).filter((r) => r.length >= 4);
    if (!rings.length) continue;
    n++;
    const per = new Map();
    for (const r of rings) {
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      for (const [x, y] of r) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
      for (let ix = Math.floor((bx0 - MARGIN) / TILE); ix <= Math.floor((bx1 + MARGIN) / TILE); ix++)
        for (let iy = Math.floor((by0 - MARGIN) / TILE); iy <= Math.floor((by1 + MARGIN) / TILE); iy++) {
          const box = [ix * TILE - MARGIN, iy * TILE - MARGIN, (ix + 1) * TILE + MARGIN, (iy + 1) * TILE + MARGIN];
          const inside = bx0 >= box[0] && bx1 <= box[2] && by0 >= box[1] && by1 <= box[3];
          const c = inside ? r : clipRing(r, box);
          if (!c) continue;
          const k = `${ix}_${iy}`;
          if (!per.has(k)) per.set(k, []);
          per.get(k).push(c.flatMap(([x, y]) => [Math.round((x - ix * TILE) * 1e7), Math.round((y - iy * TILE) * 1e7)]));
        }
    }
    for (const [k, rs] of per) {
      if (!tiles.has(k)) tiles.set(k, {});
      const t = tiles.get(k);
      (t[key] ||= []).push([...fields.map((x) => a[x] ?? null), ...rs]);
    }
  }
  return n;
}

// One city's tiles into <out>/<city>/, its about.json last (towns/boston.js planPresent: without it the city's map is
// missing from the site). A city that fails leaves its directory as it was and the others are built (the hostile review of
// 26. 11. 2026: one failing city took both off the site).
export async function buildCity(out, city, layers, read = layer) {
  const tiles = new Map(), counts = {};
  for (const [key, l] of Object.entries(layers)) {
    const t0 = Date.now(), fs0 = await read(l);
    counts[key] = tileFeatures(fs0, l.fields, tiles, key, l.skip);
    console.log(`${city} ${key}: ${fs0.length} features, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  const dir = path.join(out, city);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const [k, t] of tiles) { const s = JSON.stringify(t); bytes += s.length; fs.writeFileSync(path.join(dir, `${k}.json`), s); }
  const about = { built: new Date().toISOString().slice(0, 10), tile: TILE, tiles: tiles.size, bytes, features: counts };
  fs.writeFileSync(path.join(dir, "about.json"), JSON.stringify(about));
  console.log(`${city}: ${tiles.size} tiles, ${(bytes / 1e6).toFixed(1)} MB`);
  return about;
}
// All cities (or ONLY): { built: [city…], failed: [city…] }; <out>/about.json the date and the counts of those built.
export async function buildAll(out, cities = CITIES, read = layer) {
  const about = { built: new Date().toISOString().slice(0, 10), tile: TILE, cities: {} }, failed = [];
  for (const [city, layers] of Object.entries(cities)) {
    if (ONLY && !ONLY.has(city)) continue;
    try { about.cities[city] = await buildCity(out, city, layers, read); } catch (err) { failed.push(city); console.error(`${city}: ${err.message}`); }
  }
  fs.mkdirSync(out, { recursive: true });
  const f = path.join(out, "about.json"), old = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  fs.writeFileSync(f, JSON.stringify({ ...old, ...about, cities: { ...old.cities, ...about.cities } }));
  return { built: Object.keys(about.cities), failed };
}

// Exit 0 when every city was built, 1 when one failed (the others are built all the same; pages.yml takes each city's
// directory with its about.json and keeps the cache unsaved, so the next deploy tries again).
if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  const { failed } = await buildAll(OUT);
  if (failed.length) { console.error(`failed: ${failed.join(", ")}`); process.exitCode = 1; }
}
