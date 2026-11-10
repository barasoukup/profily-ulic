// The OSM tiles of the whole Czech Republic (tools/build_osm_tiles.mjs) in their compact form, read by
// the app (gis.js) and the local server (server.mjs). A tile is one element per line:
//   {"t": "w" | "a" | "n", "i": OSM id, "k": tags, "g": [dx, dy, …], "o": index, "h": [[dx, dy, …]], "q": 5}
// t: a line (way), a polygon (area) or a point (node); g: coordinates as integers of 1e-6° (1e-5° with
// "q": 5, buildings), each point the difference from the one before; h: the holes of a polygon. A long
// line is cut by tiles: a tile keeps the segments that touch it, "o" is the index of its first point in
// the whole line, so the pieces of the tiles around a cut join again (mergePieces).
export const TILE = 0.005; // degrees

const decode = (g, q) => {
  const pts = [];
  let x = 0, y = 0;
  for (let i = 0; i < g.length; i += 2) {
    x += g[i]; y += g[i + 1];
    pts.push({ lat: y / q, lon: x / q });
  }
  return pts;
};
const TYPES = { w: "way", a: "area", n: "node" };

export function decodeTile(text) {
  const out = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    const e = JSON.parse(line);
    const q = e.q ? 10 ** e.q : 1e6;
    const el = { type: TYPES[e.t], id: e.i, tags: e.k || {}, geometry: decode(e.g, q) };
    if (e.h) el.holes = e.h.map((h) => decode(h, q));
    if (e.o !== undefined) el.o = e.o;
    out.push(el);
  }
  return out;
}

// Elements of several tiles: the same polygon or point once, the pieces of a line joined back by their
// point indexes (adjacent tiles share the segment across their border). Pieces that do not meet (a tile
// in between was not read) stay apart.
export function mergePieces(lists) {
  const seen = new Set(), out = [], pieces = new Map();
  for (const els of lists) {
    for (const el of els) {
      if (el.o === undefined) {
        const key = `${el.type}:${el.id}:${el.geometry[0].lat}:${el.geometry[0].lon}`;
        if (!seen.has(key)) { seen.add(key); out.push(el); }
        continue;
      }
      if (!pieces.has(el.id)) pieces.set(el.id, []);
      pieces.get(el.id).push(el);
    }
  }
  for (const list of pieces.values()) {
    list.sort((a, b) => a.o - b.o);
    let cur = null, last = -1;
    for (const p of list) {
      const end = p.o + p.geometry.length - 1;
      if (cur && p.o <= last) {
        if (end > last) cur.geometry.push(...p.geometry.slice(last - p.o + 1));
      } else {
        if (cur) out.push(cur);
        cur = { type: p.type, id: p.id, tags: p.tags, geometry: [...p.geometry] };
      }
      last = Math.max(last, end);
    }
    if (cur) out.push(cur);
  }
  return out;
}
