// A fresh sample of Toronto's houses for the rule of floors from a height (floors.js): random points along residential streets
// (a fixed seed), the OSM building at the side, the height of the city's outline under it (one request each, 600 ms apart, cached),
// a Mapillary photo facing it. Keeps the houses the new rule changes (CHANGED of them) and some it leaves (KEEP, mixed in blind).
//   TILES=<osm-tiles> TOKEN=<token.local> node sample.mjs <scratch dir> <changed> <kept>     (the token is never printed)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), PUB = path.resolve(HERE, "../../app/public");
const imp = (f) => import(pathToFileURL(path.join(PUB, f)));
const OUT = process.argv[2], CHANGED = Number(process.argv[3] || 36), KEEP = Number(process.argv[4] || 10);
fs.mkdirSync(OUT, { recursive: true });
const { decodeTile, mergePieces } = await imp("osmtile.js"), { inside } = await imp("places.js"), F = await imp("floors.js");
const T = JSON.parse(fs.readFileSync(path.join(PUB, "mesta-ca.json"))).toronto, TILES = process.env.TILES;
const all = mergePieces(fs.readdirSync(TILES).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map((f) => decodeTile(fs.readFileSync(path.join(TILES, f), "utf8"))));
const ROAD = /^(primary|secondary|tertiary|residential|unclassified|living_street)$/;
const ways = all.filter((w) => w.type === "way" && ROAD.test(w.tags?.highway) && inside(T, w.geometry[0].lon, w.geometry[0].lat)).sort((a, b) => a.id - b.id).map((w) => ({ name: w.tags.name || "", g: w.geometry.map((p) => [p.lon, p.lat]) }));
const buildings = all.filter((b) => b.type === "building" || b.tags?.building);
let seed = Number(process.env.SEED || 20271127);
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
const KX = 111320 * Math.cos((43.7 * Math.PI) / 180), KY = 110574;
const token = fs.readFileSync(process.env.TOKEN, "utf8").trim().replace(/^.*=/, "").replace(/["']/g, "");
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const mly = async (q) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`https://graph.mapillary.com/${q}`, { headers: { Authorization: `OAuth ${token}` } }); if (r.ok) return await r.json(); } catch {} await sleep(1500); } return { data: [] }; };
const CACHE = path.join(OUT, "cache"); fs.mkdirSync(CACHE, { recursive: true });
async function height(lon, lat) {
  const url = `https://gis.toronto.ca/arcgis/rest/services/cot_geospatial3/MapServer/2/query?${new URLSearchParams({ geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", f: "json", outFields: "SUBTYPE_DESC,DERIVED_HEIGHT", returnGeometry: "false", distance: "1", units: "esriSRUnit_Meter" })}`;
  const f = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  await sleep(600);
  const j = await (await fetch(url)).json();
  fs.writeFileSync(f, JSON.stringify(j));
  return j;
}
const lens = ways.map((w) => w.g.slice(1).reduce((s, q, i) => s + Math.hypot((q[0] - w.g[i][0]) * KX, (q[1] - w.g[i][1]) * KY), 0)), total = lens.reduce((a, b) => a + b, 0);
const rows = [], used = [];
let nc = 0, nk = 0, tried = 0;
const ownRows = process.env.EXCLUDE ? JSON.parse(fs.readFileSync(process.env.EXCLUDE)).rows.map((r) => r.probe) : [];
while ((nc < CHANGED || nk < KEEP) && tried++ < 4000) {
  let r = rnd() * total, wi = 0;
  while (r > lens[wi]) r -= lens[wi++];
  const side = rnd() < 0.5 ? 1 : -1, w = ways[wi];
  let i = 0, seg = 0;
  for (; i < w.g.length - 1; i++) { seg = Math.hypot((w.g[i + 1][0] - w.g[i][0]) * KX, (w.g[i + 1][1] - w.g[i][1]) * KY); if (r <= seg) break; r -= seg; }
  if (i >= w.g.length - 1 || seg < 5) continue;
  const a = w.g[i], b = w.g[i + 1], nx = (-(b[1] - a[1]) * KY * side) / seg, ny = ((b[0] - a[0]) * KX * side) / seg;
  const c = [a[0] + ((b[0] - a[0]) * r) / seg, a[1] + ((b[1] - a[1]) * r) / seg], at = (d) => [c[0] + (nx * d) / KX, c[1] + (ny * d) / KY];
  const near = buildings.filter((q) => Math.abs(q.geometry[0].lon - c[0]) < 0.0025 && Math.abs(q.geometry[0].lat - c[1]) < 0.002);
  const hit = (p) => near.find((q) => { let s = false; const g = q.geometry; for (let k = 0, j = g.length - 1; k < g.length; j = k++) if ((g[k].lat > p[1]) !== (g[j].lat > p[1]) && p[0] < ((g[j].lon - g[k].lon) * (p[1] - g[k].lat)) / (g[j].lat - g[k].lat) + g[k].lon) s = !s; return s; });
  let d = 4, h = null;
  for (; d <= 28 && !(h = hit(at(d))); d += 0.25);
  const probe = at(d + 4), face = at(d), inner = at(d + 2.5);
  if (!h || [...ownRows, ...used].some((q) => Math.hypot((q[0] - probe[0]) * KX, (q[1] - probe[1]) * KY) < 60)) continue;
  if (h.tags["building:levels"]) continue; // levels are known: the rule does not apply
  const j = await height(inner[0], inner[1]);
  const a0 = (j.features || [])[0]?.attributes;
  if (!a0 || /garage/i.test(a0.SUBTYPE_DESC || "")) continue;
  const hm = Number(a0.DERIVED_HEIGHT), type = h.tags.building === "yes" ? undefined : h.tags.building, roofShape = h.tags["roof:shape"];
  const oldN = F.floorsOld(hm), newN = F.floorsFromHeight(hm, { type, roofShape });
  const changed = oldN !== newN;
  if (!(hm > 2) || (changed && nc >= CHANGED) || (!changed && (nk >= KEEP || !(hm > 4 && hm < 14)))) continue;
  const bb = [c[0] - 22 / KX, c[1] - 22 / KY, c[0] + 22 / KX, c[1] + 22 / KY].map((v) => v.toFixed(6)).join(",");
  const im = (await mly(`images?fields=id,computed_geometry,geometry,computed_compass_angle,compass_angle,is_pano,captured_at,thumb_2048_url&bbox=${bb}&limit=60`)).data || [];
  const best = im.map((x) => {
    const [lo, la] = (x.computed_geometry || x.geometry).coordinates, dx = (face[0] - lo) * KX, dy = (face[1] - la) * KY, dist = Math.hypot(dx, dy);
    const off = (((Math.atan2(dx, dy) * 180) / Math.PI - (x.computed_compass_angle ?? x.compass_angle) + 540) % 360) - 180;
    return { x, dist, off, ok: dist > 5 && dist < 26 && (x.is_pano || Math.abs(off) < 33), s: (x.is_pano ? 0 : 5 + Math.abs(off) / 4) + Math.abs(dist - 14) / 4 + (2027 - new Date(x.captured_at).getFullYear()) / 2 };
  }).filter((z) => z.ok).sort((y, z) => y.s - z.s)[0];
  if (!best) continue;
  const id = `F${String(rows.length + 1).padStart(2, "0")}`;
  fs.writeFileSync(path.join(OUT, `${id}.jpg`), Buffer.from(await (await fetch(best.x.thumb_2048_url)).arrayBuffer()));
  used.push(probe); changed ? nc++ : nk++;
  rows.push({ id, street: w.name, probe, mapillary: best.x.id, pano: !!best.x.is_pano, dist: +best.dist.toFixed(1), off: +best.off.toFixed(1), tags: h.tags, subtype: a0.SUBTYPE_DESC, h: hm, old: oldN, now: newN, changed });
  console.log(id, w.name, h.tags.building, roofShape || "-", hm, oldN, "->", newN, changed ? "CHANGED" : "kept");
}
fs.writeFileSync(path.join(HERE, process.env.OUTFILE || "sample.json"), JSON.stringify({ rows }, null, 1));
