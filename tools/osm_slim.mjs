// Slimming the OSM tiles as they are packed (tools/pack_osm_tiles.mjs; Bára 26. 11. 2026: Europe, the USA and Canada
// under R2's free 10 GB, with room to spare). Only what the app never reads goes; what it reads stays exactly as it was,
// so every profile stays the same (evaluation/osm-r2/ZPRAVA-ZMENSENI.md: the same profiles from the full and the slim
// packs). The format stays (osmpack.js VERSION 1): a slim pack and a full one are read alike.
//   ids   the OSM id of an area or a point. The app reads it only in mergePieces (osmtile.js), to take a shape that is
//         in two tiles once; a way keeps its id (the cut's street, joining its pieces, saved links). An area or a point
//         in one tile only gets 0, unless another shape of the pack would then have the same key in mergePieces (the
//         same type, first two points and length). Ten digits a shape that gzip cannot shrink: about 6 % of a pack.
//   tags  keys no code of the app reads (evaluation/osm-r2/slim/keys-used.mjs): the names in other languages and their
//         etymology (name:fi, name:etymology:wikidata …), the refs of operators (ref:IFOPT, route_ref:De_Lijn …), notes.
// slimmer(names, text) reads all tiles once (names "ix_iy", text(name) → the tile's lines as osmtile.js has them) and
// returns slim(name, elements) → the elements of that tile slimmed; the counts it made in stats.
export const RULES = ["ids", "tags"];
export const DROP_KEY = /^(name|ref|route_ref|local_ref):|:note$/;

const decode = (g, q) => {
  const pts = [];
  let x = 0, y = 0;
  for (let i = 0; i < g.length; i += 2) { x += g[i]; y += g[i + 1]; pts.push([x / q, y / q]); }
  return pts;
};
// The key of mergePieces (osmtile.js) for an element without "o" and with 0 for its id, hashed to a number (53 bits: two
// keys of one hash only keep their ids, never lose a shape).
function zeroKey(el) {
  const p = decode(el.g.slice(0, 4), el.q ? 10 ** el.q : 1e6), s = `${el.t}:${p[0]?.[1]}:${p[0]?.[0]}:${p[1]?.[1]}:${p[1]?.[0]}:${el.g.length / 2}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
// A number for an area's or a point's id (both kinds share the numbers of OSM ids, so the kind goes in the sign).
const idKey = (el) => (el.t === "n" ? -1 - el.i : el.i);
const parse = (text) => text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
const candidate = (el) => el.t !== "w" && el.o === undefined && el.i !== 0;

export function slimmer(names, text, { rules = RULES, stats = {} } = {}) {
  const on = new Set(rules);
  Object.assign(stats, { ids: 0, tags: 0 });
  // The tiles each area and point is in (once: 1, more: 2), then the zero keys of those in one tile (once: 1, more: 2).
  const inTiles = new Map(), zero = new Map();
  if (on.has("ids")) {
    for (const n of names) {
      const here = new Set();
      for (const el of parse(text(n))) if (candidate(el)) here.add(idKey(el));
      for (const k of here) inTiles.set(k, inTiles.has(k) ? 2 : 1);
    }
    for (const n of names) for (const el of parse(text(n))) {
      if (!candidate(el) || inTiles.get(idKey(el)) !== 1) continue;
      const k = zeroKey(el);
      zero.set(k, zero.has(k) ? 2 : 1);
    }
  }
  return (name, els) => els.map((el) => {
    let out = el;
    if (on.has("tags") && el.k) {
      const drop = Object.keys(el.k).filter((k) => DROP_KEY.test(k));
      if (drop.length) { out = { ...out, k: { ...el.k } }; for (const k of drop) delete out.k[k]; stats.tags += drop.length; }
    }
    if (on.has("ids") && candidate(el) && inTiles.get(idKey(el)) === 1 && zero.get(zeroKey(el)) === 1) { out = { ...out, i: 0 }; stats.ids++; }
    return out;
  });
}
