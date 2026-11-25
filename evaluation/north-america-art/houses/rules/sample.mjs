// The sample for the choice of the looks (Washington): random points on DC's streets (fixed seed), the nearest house on a
// random side, with a Mapillary photo facing it. OSM from the us_dc extract (geojsonl of tools/build_osm_data.sh).
//   OSM=<dir with us_dc_*.geojsonl> TOKEN=<token.local> node sample.mjs <scratch dir> [n=40]
// Photos go to the scratch directory only; sample.json (houses, no photos) to this folder.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2], N = Number(process.argv[3] || 40);
const DC = [[-77.1198, 38.9343], [-77.041, 38.9958], [-76.9094, 38.8927], [-77.039, 38.7916], [-77.0316, 38.85], [-77.06, 38.9]];
const inDC = ([x, y]) => DC.reduce((r, a, i) => { const b = DC.at(i - 1); return (a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0] ? !r : r; }, false);
let seed = 20261125;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
async function load(file, keep) {
  const out = [];
  for await (let l of readline.createInterface({ input: fs.createReadStream(file) })) {
    l = l.replace(/^\x1e/, "").trim();
    if (!l) continue;
    const f = JSON.parse(l);
    const t = {};
    for (const [k, v] of Object.entries(f.properties)) if (typeof v === "string" && k !== "other_tags") t[k] = v;
    for (const m of (f.properties.other_tags || "").matchAll(/"([^"]+)"=>"((?:[^"\\]|\\.)*)"/g)) t[m[1]] = m[2];
    const r = keep(f, t);
    if (r) out.push(...[r].flat());
  }
  return out;
}
const cache = path.join(OUT, "dc.json");
let data;
if (fs.existsSync(cache)) data = JSON.parse(fs.readFileSync(cache));
else {
  const H = /^(residential|tertiary|secondary|primary|unclassified|living_street)$/;
  const ways = await load(path.join(process.env.OSM, "us_dc_ways.geojsonl"), (f, t) => (H.test(t.highway) && f.geometry.type === "LineString" && inDC(f.geometry.coordinates[0]) ? { name: t.name, g: f.geometry.coordinates } : null));
  const buildings = await load(path.join(process.env.OSM, "us_dc_buildings.geojsonl"), (f, t) => {
    const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    return inDC(polys[0][0][0]) ? polys.map((p) => ({ type: "area", tags: t, geometry: p[0].map(([lon, lat]) => ({ lon, lat })), holes: p.slice(1).map((r) => r.map(([lon, lat]) => ({ lon, lat }))) })) : null;
  });
  data = { ways, buildings };
  fs.writeFileSync(cache, JSON.stringify(data));
}
console.log(data.ways.length, data.buildings.length);
const KX = 111320 * Math.cos((38.9 * Math.PI) / 180), KY = 110574;
const grid = new Map();
for (const b of data.buildings) { const g = b.geometry[0], k = `${Math.floor(g.lon * 500)}_${Math.floor(g.lat * 500)}`; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(b); }
const near = (lon, lat) => { const out = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push(...(grid.get(`${Math.floor(lon * 500) + i}_${Math.floor(lat * 500) + j}`) || [])); return out; };
const token = fs.readFileSync(process.env.TOKEN, "utf8").trim().replace(/^.*=/, "").replace(/["']/g, "");
const mly = async (q) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`https://graph.mapillary.com/${q}`, { headers: { Authorization: `OAuth ${token}` } }); if (r.ok) return await r.json(); } catch {} await new Promise((s) => setTimeout(s, 1500)); } return { data: [] }; };
const lens = data.ways.map((w) => w.g.slice(1).reduce((s, q, i) => s + Math.hypot((q[0] - w.g[i][0]) * KX, (q[1] - w.g[i][1]) * KY), 0));
const total = lens.reduce((a, b) => a + b, 0);
const sample = [];
let tries = 0;
while (sample.length < N && tries++ < 600) {
  let r = rnd() * total, wi = 0;
  while (r > lens[wi]) r -= lens[wi++];
  const side = rnd() < 0.5 ? 1 : -1, w = data.ways[wi];
  let i = 0, seg = 0;
  for (; i < w.g.length - 1; i++) { seg = Math.hypot((w.g[i + 1][0] - w.g[i][0]) * KX, (w.g[i + 1][1] - w.g[i][1]) * KY); if (r <= seg) break; r -= seg; }
  if (i >= w.g.length - 1 || seg < 5) continue;
  const a = w.g[i], b = w.g[i + 1], ux = ((b[0] - a[0]) * KX) / seg, uy = ((b[1] - a[1]) * KY) / seg;
  const c = [a[0] + ((b[0] - a[0]) * r) / seg, a[1] + ((b[1] - a[1]) * r) / seg], nx = -uy * side, ny = ux * side;
  const at = (d) => [c[0] + (nx * d) / KX, c[1] + (ny * d) / KY];
  const cand = near(...c), hit = (p) => cand.find((q) => { let s = false; const g = q.geometry; for (let k = 0, j = g.length - 1; k < g.length; j = k++) if ((g[k].lat > p[1]) !== (g[j].lat > p[1]) && p[0] < ((g[j].lon - g[k].lon) * (p[1] - g[k].lat)) / (g[j].lat - g[k].lat) + g[k].lon) s = !s; return s; });
  let d = 4, h = null;
  for (; d <= 28 && !(h = hit(at(d))); d += 0.25);
  if (!h || sample.some((s) => Math.hypot((s.probe[0] - c[0]) * KX, (s.probe[1] - c[1]) * KY) < 80)) continue;
  // A photo: a panorama within 14 m of the point, or a flat picture looking at the house.
  const bb = [c[0] - 22 / KX, c[1] - 22 / KY, c[0] + 22 / KX, c[1] + 22 / KY].map((v) => v.toFixed(6)).join(",");
  const im = (await mly(`images?fields=id,computed_geometry,geometry,computed_compass_angle,compass_angle,is_pano,captured_at,thumb_2048_url&bbox=${bb}&limit=60`)).data || [];
  const facade = at(d);
  const scored = im.map((x) => {
    const [lo, la] = (x.computed_geometry || x.geometry).coordinates, dx = (facade[0] - lo) * KX, dy = (facade[1] - la) * KY, dist = Math.hypot(dx, dy);
    const brg = (Math.atan2(dx, dy) * 180) / Math.PI, off = Math.abs(((brg - (x.computed_compass_angle ?? x.compass_angle) + 540) % 360) - 180);
    return { x, dist, brg, off, ok: dist > 5 && dist < 26 && (x.is_pano || off < 33), s: (x.is_pano ? 0 : 5 + off / 4) + Math.abs(dist - 14) / 4 + (2026 - new Date(x.captured_at).getFullYear()) / 2 };
  }).filter((q) => q.ok).sort((p, q) => p.s - q.s);
  if (!scored.length) continue;
  const p = scored[0], id = String(sample.length + 1).padStart(2, "0");
  const buf = Buffer.from(await (await fetch(p.x.thumb_2048_url)).arrayBuffer());
  fs.writeFileSync(path.join(OUT, `${id}.jpg`), buf);
  sample.push({ id, street: w.name, probe: at(d + 4).map((v) => +v.toFixed(7)), mapillary: p.x.id, pano: !!p.x.is_pano, dist: +p.dist.toFixed(1), off: +((((p.brg - (p.x.computed_compass_angle ?? p.x.compass_angle) + 540) % 360) - 180).toFixed(1)), tags: h.tags });
}
fs.writeFileSync(path.join(HERE, "sample.json"), JSON.stringify(sample, null, 1));
console.log(sample.length, "of", tries, sample.filter((s) => s.pano).length, "pano");
