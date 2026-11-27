// What land use areas would add to a pack (Bára 26. 11. 2026: for the look of houses everywhere; not in the app yet):
// the areas of landuse-export.sh, simplified (Douglas–Peucker, TOL_M), to 1e-5° (about 1 m), cut to the tiles a highway
// runs through as the green areas are (tools/build_osm_tiles.mjs), only landuse= or amenity= as their tag and no id (0),
// added to the tiles of a pack, packed again; the size against the same pack packed again without them.
//   node --max-old-space-size=12000 evaluation/osm-r2/slim/landuse-cost.mjs pack.posm areas.geojsonl [tolerance m]
import fs from "node:fs";
import readline from "node:readline";
import { tilesOf } from "./posm.mjs";
import { packTiles } from "../../../tools/pack_osm_tiles.mjs";
import { TILE } from "../../../pilot/public/osmtile.js";

const [packFile, areasFile, tolArg] = process.argv.slice(2);
const TOL_M = Number(tolArg || 2);

const text = new Map(), roadTiles = new Set();
for (const { name, lines } of tilesOf(packFile)) {
  text.set(name, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  if (lines.some((l) => l.t === "w" && l.k.highway !== undefined)) roadTiles.add(name);
}
const base = packTiles([...text.keys()], (n) => text.get(n)).file.length;

// Douglas–Peucker on a ring in metres around its first point.
function simplify(ring, tol) {
  if (ring.length <= 4) return ring;
  const kx = 111320 * Math.cos((ring[0][1] * Math.PI) / 180), ky = 110574;
  const p = ring.map(([x, y]) => [x * kx, y * ky]);
  const keep = new Uint8Array(p.length);
  keep[0] = keep[p.length - 1] = 1;
  const stack = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, at = -1;
    const [ax, ay] = p[a], [bx, by] = p[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = len < 1e-6 ? Math.hypot(p[i][0] - ax, p[i][1] - ay) : Math.abs(dy * (p[i][0] - ax) - dx * (p[i][1] - ay)) / len;
      if (d > best) { best = d; at = i; }
    }
    if (best > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  const out = ring.filter((_, i) => keep[i]);
  return out.length >= 4 ? out : ring;
}
function clipRing(ring, [x0, y0, x1, y1]) {
  let pts = ring.slice(0, -1);
  const edges = [[(q) => q[0] >= x0, (a, b) => [x0, a[1] + ((x0 - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]], [(q) => q[0] <= x1, (a, b) => [x1, a[1] + ((x1 - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]],
    [(q) => q[1] >= y0, (a, b) => [a[0] + ((y0 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), y0]], [(q) => q[1] <= y1, (a, b) => [a[0] + ((y1 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), y1]]];
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[i];
      if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); } else if (inside(a)) out.push(cut(a, b));
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return [...pts, pts[0]];
}
const enc = (pts) => { const g = []; let px = 0, py = 0; for (const [lon, lat] of pts) { const x = Math.round(lon * 1e5), y = Math.round(lat * 1e5); g.push(x - px, y - py); px = x; py = y; } return g; };

let areas = 0, pieces = 0;
const extra = new Map();
for await (const line of readline.createInterface({ input: fs.createReadStream(areasFile), crlfDelay: Infinity })) {
  if (!line.trim()) continue;
  const f = JSON.parse(line), p = f.properties, g = f.geometry;
  if (!g || !/Polygon/.test(g.type)) continue;
  const k = p.landuse ? { landuse: p.landuse } : { amenity: p.amenity };
  areas++;
  for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
    const outer = simplify(poly[0], TOL_M);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of outer) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    for (let ix = Math.floor(x0 / TILE); ix <= Math.floor(x1 / TILE); ix++) for (let iy = Math.floor(y0 / TILE); iy <= Math.floor(y1 / TILE); iy++) {
      const key = `${ix}_${iy}`;
      if (!roadTiles.has(key)) continue;
      const box = [ix * TILE, iy * TILE, (ix + 1) * TILE, (iy + 1) * TILE];
      const r = clipRing(outer, box);
      if (!r) continue;
      const el = { t: "a", i: 0, k, g: enc(r), q: 5 };
      const holes = poly.slice(1).map((h) => clipRing(simplify(h, TOL_M), box)).filter(Boolean);
      if (holes.length) el.h = holes.map(enc);
      extra.set(key, (extra.get(key) || "") + JSON.stringify(el) + "\n");
      pieces++;
    }
  }
}
const withLu = packTiles([...new Set([...text.keys(), ...extra.keys()])], (n) => (text.get(n) || "") + (extra.get(n) || "")).file.length;
const mb = (x) => (x / 1e6).toFixed(2);
console.log(`${packFile}: ${areas} ploch, ${pieces} kusů v dlaždicích se silnicí; bez ${mb(base)} MB, s využitím území ${mb(withLu)} MB (+${mb(withLu - base)} MB, +${((100 * (withLu - base)) / base).toFixed(1)} %), tolerance ${TOL_M} m`);
