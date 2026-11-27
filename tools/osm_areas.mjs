// Pieces of OSM polygons cut to the tiles of osmtile.js (tools/build_osm_tiles.mjs), shared with the tools that add
// such polygons to packed tiles for a trial (evaluation/bridge-water/edge/patch-pack.mjs).
import { TILE } from "../pilot/public/osmtile.js";

export const ringArea = (r) => { let a = 0; for (let i = 0; i + 1 < r.length; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; };
// A ring cut to a box (Sutherland–Hodgman): the box's edges close it where it leaves; null when nothing is left.
export function clipRing(ring, [x0, y0, x1, y1]) {
  let pts = ring.slice(0, -1);
  const edges = [[(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((x0 - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]], [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((x1 - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((y0 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), y0]], [(p) => p[1] <= y1, (a, b) => [a[0] + ((y1 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), y1]]];
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
export const enc = (pts, q) => {
  const g = [];
  let px = 0, py = 0;
  for (const [lon, lat] of pts) {
    const x = Math.round(lon * q), y = Math.round(lat * q);
    g.push(x - px, y - py);
    px = x; py = y;
  }
  return g;
};

// The deck of a bridge (man_made=bridge, mapped as its outline: Bára 26. 11. 2026, a street on a bridge ends at the
// bridge's edge, with a railing): kept with its level and name only.
export const BRIDGE_AREA = (t) => t.man_made === "bridge";
export const bridgeTags = (t) => Object.fromEntries(Object.entries(t).filter(([k]) => /^(man_made|layer|level|name|bridge:structure)$/.test(k)));

// The pieces of a polygon ([outer ring, holes …] of [lon, lat]) in the tiles of its box that keep(key) allows, each cut
// to its tile, as tile lines { t: "a", i, k, g, h } (q: 5 → 1e-5°, else 1e-6°). Returns [[key, element], …].
export function tilePieces(poly, id, tags, keep = () => true, q = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly[0]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const out = [], scale = q ? 10 ** q : 1e6;
  for (let ix = Math.floor(x0 / TILE); ix <= Math.floor(x1 / TILE); ix++) for (let iy = Math.floor(y0 / TILE); iy <= Math.floor(y1 / TILE); iy++) {
    const key = `${ix}_${iy}`;
    if (!keep(key)) continue;
    const box = [ix * TILE, iy * TILE, (ix + 1) * TILE, (iy + 1) * TILE];
    const outer = clipRing(poly[0], box);
    if (!outer) continue;
    const holes = poly.slice(1).map((r) => clipRing(r, box)).filter(Boolean);
    // A hole over the whole tile (a lake in a wood) leaves nothing of the area there.
    if (holes.some((h) => Math.abs(ringArea(h)) >= 0.999 * Math.abs(ringArea(outer)))) continue;
    const el = { t: "a", i: id, k: tags, g: enc(outer, scale) };
    if (q) el.q = q;
    if (holes.length) el.h = holes.map((r) => enc(r, scale));
    out.push([key, el]);
  }
  return out;
}
