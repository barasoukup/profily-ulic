
export const median = (a) => { const b = a.filter((v) => Number.isFinite(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
// ---------- what OSM says along the cut ----------
const underground = (tags) => Number(tags.layer) < 0 || Number(tags.level) < 0 || tags.location === "underground" || tags.tunnel === "yes";
// Where a ring or a line (in the cut's [t, u]) crosses the line u = u0, within |t| ≤ half.
export function crossT(pts, half, u0 = 0) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t1, u1] = pts[i], [t2, u2] = pts[i + 1];
    if ((u1 > u0) === (u2 > u0) || u1 === u2) continue;
    const t = t1 + ((u0 - u1) / (u2 - u1)) * (t2 - t1);
    if (Math.abs(t) <= half) out.push({ t, d: [t2 - t1, u2 - u1] });
  }
  return out;
}
// The buildings are read on lines u = 0, ±1 and ±2 m: OSM's outlines are simpler than the map's, a row of houses
// may have a gap of a metre exactly at the cut.
export const BUILDING_U = [0, -1, 1, -2, 2];
// Green areas of OSM (tools/build_osm_tiles.mjs keeps them near the roads, cut by tiles): lawns, parks, gardens, woods.
// Water, allotments and cemeteries (kept alike): where a profile ends, as MTVU's water (501) and gardens (300).
export const WATER = (t) => t.natural === "water" || t.water !== undefined || ["reservoir", "basin", "allotments", "cemetery"].includes(t.landuse) || t.waterway === "riverbank";
export const GREEN = (t) => ["grass", "meadow", "village_green", "flowerbed", "forest", "orchard", "recreation_ground"].includes(t.landuse) || ["park", "garden"].includes(t.leisure) || ["grass", "grassland", "scrub", "wood", "heath"].includes(t.natural);
// tu: (lon, lat) → [t across the cut, u along it]; wayId: the clicked street. Returns the clicked way's crossing
// { t, along (+1 when it runs with u), tags }, the other ways crossing the cut, the buildings' stretches on the lines
// u, the nearest facade on each side of the axis (A: t below it, B: above; null where none within 40 m) and the
// buildings' outlines (in [t, u]).
export function osmAlong(elements, tu, wayId, half = 45) {
  const toTU = (g) => g.map((p) => tu(p.lon, p.lat));
  const buildings = [], ways = [], outlines = [], greens = [];
  let own = null;
  for (const el of elements || []) {
    const tags = el.tags || {};
    if (!el.geometry) continue;
    if (el.type === "area" && !tags.building && (GREEN(tags) || WATER(tags))) { greens.push(el); continue; }
    if (el.type === "area" && tags.building && tags.building !== "no" && tags.building !== "roof" && !underground(tags)) {
      const rings = [toTU(el.geometry), ...(el.holes || []).map(toTU)];
      let hit = false;
      for (const u of BUILDING_U) {
        // All the crossings, however far: a big block (a hotel 60 m deep, Drevená in Bratislava) has its far side
        // out of the window, and an odd count of crossings would lose the house.
        const xs = rings.flatMap((r) => crossT([...r, r[0]], Infinity, u).map((x) => x.t)).sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) { buildings.push({ s: xs[i], e: xs[i + 1], u, from: el.from || "OSM" }); hit = true; }
      }
      if (hit) outlines.push({ rings, el });
      continue;
    }
    if (el.type !== "way") continue;
    for (const x of crossT(toTU(el.geometry), half)) {
      const w = { t: x.t, along: Math.sign(x.d[1]) || 1, d: x.d, tags, id: el.id };
      if (el.id === wayId) { if (!own || Math.abs(w.t) < Math.abs(own.t)) own = w; } else ways.push(w);
    }
  }
  // facadeFrom: the source of the house each facade belongs to (an element's own "from", RÚIAN or GRPK; else OSM).
  const facade = {}, facadeU = {}, facadeFrom = {};
  if (own) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    facade[side] = null;
    for (const u of BUILDING_U) {
      const hits = buildings.filter((b) => b.u === u && (sg < 0 ? b.e < own.t : b.s > own.t) && Math.abs((sg < 0 ? b.e : b.s) - own.t) < 40);
      if (hits.length) {
        const best = hits.reduce((a, b) => (Math.abs((sg < 0 ? b.e : b.s) - own.t) < Math.abs((sg < 0 ? a.e : a.s) - own.t) ? b : a));
        facade[side] = sg < 0 ? best.e : best.s; facadeU[side] = u; facadeFrom[side] = best.from;
        break;
      }
    }
  }
  return { own, buildings, ways, facade, facadeU, facadeFrom, outlines, greens };
}
// The level of a way: its layer, or −1 in a tunnel and 1 on a bridge without one. Ways of another level than the
// clicked street (a road in a tunnel under it, tracks on a bridge over it) do not limit or widen it.
export const levelOf = (t) => Number(t.layer) || (t.tunnel && t.tunnel !== "no" ? -1 : t.bridge && t.bridge !== "no" ? 1 : 0);
export const onBridge = (t) => !!t?.bridge && t.bridge !== "no" && levelOf(t) > 0;
export const sameLevel = (w, o) => levelOf(w.tags) === levelOf(o.own.tags);
