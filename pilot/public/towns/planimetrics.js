// A city's planimetric map behind ArcGIS as the surface map (Washington: towns/usa.js, Toronto: towns/canada.js; taken out
// of usa.js, Bára 25. 11. 2026): the polygons of some layers read along the cut every 0.1 m (as Flanders' GRB,
// towns/belgium.js) and handed on as MTVU-coded strips 2 m along the street. A city is a description (planimetricMap):
//   id, area (places.js inArea), on() (its switch), service (the MapServer),
//   layers: [{ id, fields, code(attributes) → [MTVU code, priority (lower first), true for a parking area] or null }, …],
//   junction: { layer, test(attributes) } the polygons of intersections,
//   alleys: { layer, where, test(attributes), source, off } the alleys drawn as the street's crossings, or none,
//   prepare(runs, { tags, tracks(), cycleTracks() }) the city's own rules on the runs (islandsBeside, gapsBetweenRoads, kerbBays,
//   osmTracks; where OSM's tram and cycle tracks cross the cut), extra(bbox) a further request, and adjust(runs, cut) what the city's own data add
//   (further fields of the answer; towns/usa.js: DDOT's inventory).
// A gap between the polygons (the tree strip, a front yard, a lawn) is green 401.
import { osmTiles, getJSON, envelope, asMtvu } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { cutOfBox } from "./belgium.js";

const STEP = 0.1;
const inRing = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
export const inRings = (rings, x, y) => rings.reduce((c, r) => (inRing(r, x, y) ? !c : c), false);

// The kinds along the cut: runs { code, s, e } in metres from the centre along dir (c: cutOfBox's frame), a gap (code 401)
// marked so. layers: [[code(attributes), esri json]…].
export function runsAlong(layers, c) {
  const P = ([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky];
  const polys = [];
  for (const [codeOf, json] of layers) for (const f of json?.features || []) {
    const code = codeOf(f.attributes || {});
    if (!code || !f.geometry?.rings?.length) continue;
    const rings = f.geometry.rings.map((r) => r.map(P)), xs = rings.flat();
    polys.push({ code: code[0], prio: code[1], lot: code[2], rings, box: [Math.min(...xs.map((p) => p[0])), Math.min(...xs.map((p) => p[1])), Math.max(...xs.map((p) => p[0])), Math.max(...xs.map((p) => p[1]))] });
  }
  polys.sort((a, b) => a.prio - b.prio);
  const runs = [];
  for (let t = -c.half; t < c.half - 1e-9; t += STEP) {
    const x = c.dir[0] * (t + STEP / 2), y = c.dir[1] * (t + STEP / 2);
    const p = polys.find((q) => x >= q.box[0] && x <= q.box[2] && y >= q.box[1] && y <= q.box[3] && inRings(q.rings, x, y));
    const code = p ? p.code : 401, last = runs.at(-1);
    if (last && last.code === code) last.e = t + STEP; else runs.push({ code, s: t, e: t + STEP, ...(!p && { gap: true }), ...(p?.lot && { lot: true }) });
  }
  return runs;
}

// An island with a roadway on both sides of it stays a median; any other is land beside the street, green as the
// map's other gaps (the runs changed in place).
export function islandsBeside(runs) {
  const roads = runs.filter((r) => r.code === 701);
  for (const r of runs) if (r.code === 9950 && !(roads.some((x) => x.e <= r.s + 0.01) && roads.some((x) => x.s >= r.e - 0.01))) r.code = 401;
  return merged(runs);
}
// A map without its medians: a gap between two roadways is the median (9950), with tram tracks in it (tracks: their t) a
// tram bed 705 as far as BED_SIDE beyond the outer axes, what stays beside it green (Toronto's Spadina Avenue).
const BED_SIDE = 1.6, GAP_MEDIAN = 30; // m; a wider gap is two streets
export function gapsBetweenRoads(runs, tracks = []) {
  for (let i = runs.length - 2; i > 0; i--) {
    const r = runs[i];
    if (!r.gap || r.e - r.s > GAP_MEDIAN || runs[i - 1].code !== 701 || runs[i + 1].code !== 701) continue;
    const on = tracks.filter((t) => t > r.s - 0.5 && t < r.e + 0.5);
    if (!on.length) { r.code = 9950; continue; }
    const s = Math.max(r.s, Math.min(...on) - BED_SIDE), e = Math.min(r.e, Math.max(...on) + BED_SIDE);
    runs.splice(i, 1, ...[{ code: 401, s: r.s, e: s }, { code: 705, s, e }, { code: 401, s: e, e: r.e }].filter((x) => x.e - x.s > (x.code === 705 ? 0 : 0.5)));
    // (A rest of half a metre at most is the bed's.)
    const bed = runs.find((x) => x.code === 705 && x.s === s);
    if (s - r.s <= 0.5) bed.s = r.s;
    if (r.e - e <= 0.5) bed.e = r.e;
  }
  return runs;
}
// A parking area no wider than a stall along the kerb with the roadway at its side is kerb parking (704; a lot is 1003).
export function kerbBays(runs, max = 3.5) {
  runs.forEach((r, i) => { if (r.lot && r.e - r.s >= 1.5 && r.e - r.s <= max && [runs[i - 1], runs[i + 1]].some((x) => x?.code === 701)) r.code = 704; });
  return runs;
}
// Neighbours of one code made one (in place).
function merged(runs) {
  for (let i = runs.length - 1; i > 0; i--) if (runs[i].code === runs[i - 1].code) { runs[i - 1].e = runs[i].e; runs.splice(i, 1); }
  return runs;
}

// The carriageway at the cut's centre: the roadway run there (or the nearest) with its neighbours of roadway or median,
// as [lo, hi] its outer roadway runs; null without one.
export function carriageway(runs) {
  // (A cycle track carved in the middle belongs to it.)
  const road = (r) => r.code === 701 || r.code === 9950 || r.code === 703;
  let i = runs.findIndex((r) => r.code === 701 && r.s <= 0 && r.e >= 0);
  if (i < 0) {
    const near = runs.map((r, k) => [k, r]).filter(([, r]) => r.code === 701).sort(([, x], [, y]) => Math.min(Math.abs(x.s), Math.abs(x.e)) - Math.min(Math.abs(y.s), Math.abs(y.e)))[0];
    if (!near) return null;
    i = near[0];
  }
  let lo = i, hi = i;
  while (lo > 0 && road(runs[lo - 1])) lo--;
  while (hi < runs.length - 1 && road(runs[hi + 1])) hi++;
  while (runs[lo].code !== 701) lo++;
  while (runs[hi].code !== 701) hi--;
  return [lo, hi];
}

// A strip of width w and code cut off the outer kerb of the carriageway's run r on side s ("lo", "hi"), or null.
export function kerbStrip(r, s, w, code) {
  if (r.e - r.s < w + 2.5) return null; // no room for a lane beside it
  if (s === "lo") { const x = { code, s: r.s, e: r.s + w }; r.s += w; return x; }
  const x = { code, s: r.e - w, e: r.e }; r.e -= w;
  return x;
}

// A way of OSM that is a cycle track (not the crossing of one).
export const isTrack = (el) => el.tags.cycleway !== "crossing" && el.tags.footway !== "crossing"
  && (el.tags.highway === "cycleway" || (el.tags.highway === "path" && el.tags.bicycle === "designated"));

// Where a cycle track of width w at t lies in the carriageway lo…hi: at a kerb ("lo", "hi") or in its middle ("mid"), and
// carveTrack the track 703 cut there (at: carriageway's; in place, the runs to be sorted after; null when there is no room).
export const trackPlace = (t, lo, hi, w) => (Math.min(t - lo, hi - t) >= w + 3 ? "mid" : t - lo < hi - t ? "lo" : "hi");
export function carveTrack(runs, at, place, w, t) {
  if (place !== "mid") {
    const cut = kerbStrip(runs[place === "lo" ? at[0] : at[1]], place, w, 703);
    if (cut) runs.push(cut);
    return cut;
  }
  const r = runs.find((q) => q.s <= t && q.e >= t && (q.code === 701 || q.code === 9950));
  if (!r) return null;
  const s = Math.max(r.s, t - w / 2), e = Math.min(r.e, t + w / 2);
  runs.push(...[{ code: r.code, s: r.s, e: s }, { code: 703, s, e }, { code: r.code, s: e, e: r.e }].filter((q) => q.e - q.s > 0.05));
  runs.splice(runs.indexOf(r), 1);
  return r;
}
// A map older than the cycle tracks (Toronto's of 2021): a track OSM has as a way of its own in the map's carriageway is cut
// out at its kerb or in its middle, as wide as OSM says or 1.8 m.
export function osmTracks(runs, tracks, width = 1.8) {
  const done = [];
  for (const { t, w = width } of tracks) {
    const at = carriageway(runs);
    if (!at) break;
    const lo = runs[at[0]].s, hi = runs[at[1]].e;
    if (t < lo - 0.3 || t > hi + 0.3 || runs.some((r) => r.code === 703 && r.s <= t && r.e >= t)) continue;
    const place = trackPlace(t, lo, hi, w);
    if (done.includes(place)) continue;
    if (carveTrack(runs, at, place, Math.min(3.5, Math.max(1.2, w)), t)) { done.push(place); runs.sort((x, y) => x.s - y.s); }
  }
  return done;
}

// Where the ways of OSM that pass the test run along the street across the cut: their t (metres from the centre along dir).
export function parallelsAt(osmElements, c, test) {
  const out = [];
  for (const el of osmElements || []) {
    if (el.type !== "way" || !(el.tags?.highway || el.tags?.railway) || !el.geometry || !test(el)) continue;
    const g = el.geometry.map((p) => [(p.lon - c.lon0) * c.kx, (p.lat - c.lat0) * c.ky]).map(([x, y]) => [x * c.dir[0] + y * c.dir[1], -x * c.dir[1] + y * c.dir[0]]); // [t, along]
    for (let i = 1; i < g.length; i++) {
      const [p, q] = [g[i - 1], g[i]], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (!L || p[1] > 0 === q[1] > 0 || Math.abs(q[1] - p[1]) / L < 0.85) continue;
      out.push(p[0] + ((q[0] - p[0]) * -p[1]) / (q[1] - p[1]));
    }
  }
  return out;
}

// The map has the street when a kind of it lies within 3 m of the cut's centre: a roadway, a median or a tram bed under a street for
// cars (a dual carriageway is cut in its middle), a roadway or a sidewalk under a footway, path or cycleway.
export const WALKED = new Set(["footway", "path", "pedestrian", "cycleway", "steps", "bridleway", "corridor"]);
// A service road whose way lies on an alley or a drive of the map has it as its roadway (runs changed in place; a wider
// area is a yard or a lot).
export function alleyRoadway(runs, tags = null) {
  if (tags?.highway !== "service" || runs.some((r) => r.code === 701 && r.s <= 0 && r.e >= 0)) return runs;
  const r = runs.find((x) => x.code === 1003 && x.s <= 1 && x.e >= -1 && x.e - x.s <= 9);
  if (r) r.code = 701;
  return runs;
}
export function hasStreet(runs, tags = null) {
  const kinds = !tags?.highway || WALKED.has(tags.highway) ? [701, 702] : [701, 9950, 705];
  return runs.some((r) => kinds.includes(r.code) && r.s <= 3 && r.e >= -3);
}


// Does the cut's way run along the street's direction: its segment nearest the centre.
export function alongOf(way, c, street) {
  const g = way.geometry.map((p) => [(p.lon - c.lon0) * c.kx, (p.lat - c.lat0) * c.ky]);
  let best = null;
  for (let i = 1; i < g.length; i++) {
    const [a, b] = [g[i - 1], g[i]], d = [b[0] - a[0], b[1] - a[1]], L2 = d[0] * d[0] + d[1] * d[1];
    if (!L2) continue;
    const u = Math.max(0, Math.min(1, -(a[0] * d[0] + a[1] * d[1]) / L2)), dist = Math.hypot(a[0] + u * d[0], a[1] + u * d[1]);
    if (!best || dist < best.dist) best = { dist, d };
  }
  return !best || best.d[0] * street[0] + best.d[1] * street[1] >= 0;
}


// The cut's answer from the layers' answers (in the order of d.layers): { features, junction, …adjust's } or null where the
// map has not the street. way: the cut's way; without it the one of OSM nearest the box's centre.
export function planimetricCut(d, answers, osmElements, bbox, tags = null, { way = null, extra = null } = {}) {
  const c = cutOfBox(bbox, way?.geometry ? [way] : osmElements);
  if (!c) return null;
  const runs = runsAlong(d.layers.map((l, i) => [l.code, answers[i]]), c);
  tags ||= c.tags;
  d.prepare?.(runs, { tags, tracks: () => parallelsAt(osmElements, c, (el) => /^(tram|light_rail)$/.test(el.tags.railway)),
    cycleTracks: () => (osmElements || []).filter((el) => el.tags && el.id !== way?.id && isTrack(el))
      .flatMap((el) => parallelsAt([el], c, () => true).map((t) => ({ t, w: parseFloat(el.tags.width) || (el.tags.oneway === "yes" ? undefined : 3) }))) });
  alleyRoadway(runs, tags);
  if (!hasStreet(runs, tags)) return null;
  const street = [-c.dir[1], c.dir[0]];
  way ||= (osmElements || []).find((el) => el.type === "way" && el.tags === c.tags && el.geometry?.length > 1);
  const more = d.adjust?.(runs, { c, tags: tags || {}, way, wayAlong: way ? alongOf(way, c, street) : true, osmElements, extra }) || {};
  const at = d.junction && answers[d.layers.findIndex((l) => l.id === d.junction.layer)];
  const junction = !!at && (at.features || []).some((f) => d.junction.test(f.attributes || {}) && f.geometry?.rings
    && inRings(f.geometry.rings.map((r) => r.map(([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky])), 0, 0));
  const back = ([x, y]) => [x / c.kx + c.lon0, y / c.ky + c.lat0];
  const features = runs.map((r) => ({ attributes: { code: r.code }, geometry: { rings: [[[r.s, -1], [r.e, -1], [r.e, 1], [r.s, 1], [r.s, -1]]
    .map(([t, u]) => back([c.dir[0] * t + street[0] * u, c.dir[1] * t + street[1] * u]))] } }));
  return { features, junction, ...more };
}

const toRing = (r) => { let d = Infinity; for (let i = 1; i < r.length; i++) { const [a, b] = [r[i - 1], r[i]], e = [b[0] - a[0], b[1] - a[1]], u = Math.max(0, Math.min(1, -(a[0] * e[0] + a[1] * e[1]) / (e[0] * e[0] + e[1] * e[1] || 1))); d = Math.min(d, Math.hypot(a[0] + u * e[0], a[1] + u * e[1])); } return d; };
// Answers kept by their key (a click asks each layer once; a failed one is asked again).
export function memory(size = 40) {
  const memo = new Map();
  return (key, make) => {
    if (!memo.has(key)) {
      if (memo.size > size) memo.delete(memo.keys().next().value);
      memo.set(key, make().catch((err) => { memo.delete(key); throw err; }));
    }
    return memo.get(key);
  };
}

// The alleys of a map as areas (service=alley) that a click keeps away from as from a crossing (derive.js awayFromJunctions).
export function alleyAreas(json, { test, source }) {
  return (json?.features || []).filter((f) => test(f.attributes || {}) && f.geometry?.rings?.length)
    .flatMap((f, k) => f.geometry.rings.slice(0, 1).map((r) => ({ type: "area", id: -(k + 1), tags: { service: "alley", source }, geometry: r.map(([lon, lat]) => ({ lat, lon })) })));
}

// The sources of a described city: ask(layer id, bbox), surfaces, osm (with its alleys) and the part of its area test.
export function planimetricMap(d) {
  const cached = memory(), asked = [], layer = (id) => d.layers.find((l) => l.id === id);
  const here = (bbox) => { const [x0, y0, x1, y1] = bbox.split(",").map(Number); return d.on() && inArea(d.area, (x0 + x1) / 2, (y0 + y1) / 2); };
  const ask = (id, bbox, where = null) => cached(`${id} ${where} ${bbox}`, () => getJSON(`${d.service}/${id}/query?${new URLSearchParams({ ...envelope(bbox), ...(where && { where }), outFields: layer(id)?.fields || d.fields, returnGeometry: "true" })}`));
  // The polygon of a layer at a point (a facade's, so within 1 m of its edge too) in the answers the click already has.
  const at = async (id, lat, lon) => {
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
    for (const [bbox, json] of asked.filter((a) => a[2] === id)) {
      const [x0, y0, x1, y1] = bbox.split(",").map(Number);
      if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
      let best = null;
      for (const f of (await json.catch(() => null))?.features || []) {
        if (!f.geometry?.rings) continue;
        const rings = f.geometry.rings.map((r) => r.map(([x, y]) => [(x - lon) * kx, (y - lat) * ky]));
        const dist = inRings(rings, 0, 0) ? 0 : Math.min(...rings.map(toRing));
        if (dist <= 1 && (!best || dist < best.dist)) best = { dist, f };
      }
      if (best) return best.f;
    }
    return null;
  };
  const estimate = (extra = {}) => ({ features: [], abroad: true, ...extra });
  async function surfaces(bbox, tags = null, way = null) {
    if (!here(bbox)) return estimate();
    const [x0, y0, x1, y1] = bbox.split(",").map(Number), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let own;
    try {
      const r = Math.max((x1 - x0) * 111320 * Math.cos((cy * Math.PI) / 180), (y1 - y0) * 110574) / 2;
      const asks = d.layers.map((l) => { const a = ask(l.id, bbox); asked.unshift([bbox, a, l.id]); return a; });
      asked.length = Math.min(asked.length, 12);
      const [extra, o, ...answers] = await Promise.all([d.extra ? d.extra(bbox) : null, osmTiles(cy, cx, r), ...asks]);
      own = planimetricCut(d, answers, o.elements, bbox, tags, { way, extra });
    } catch {
      return estimate({ mapFailed: d.id });
    }
    if (!own) return estimate();
    const { features, junction, ...more } = own;
    return { features: asMtvu([[{ features }, (a) => a.code]], MTVU_LABELS).features, cityMap: d.id, ...(junction && { junction: true }), ...more };
  }
  async function osm(lat, lon, radius) {
    const o = await osmTiles(lat, lon, radius), a = d.alleys;
    if (!a || !d.on() || a.off?.() || !inArea(d.area, lon, lat)) return o;
    const dy = radius / 110574, dx = radius / (111320 * Math.cos((lat * Math.PI) / 180));
    const bbox = [lon - dx, lat - dy, lon + dx, lat + dy].map((v) => v.toFixed(5)).join(",");
    try {
      const add = alleyAreas(await ask(a.layer, bbox, a.where), a);
      return add.length ? { ...o, elements: [...o.elements, ...add] } : o;
    } catch (err) { console.warn(`${d.id} alleys`, err); return o; }
  }
  return { ask, at, here, surfaces, osm };
}
