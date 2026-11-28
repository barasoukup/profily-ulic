import { TILE } from "../osmtile.js";
import { RAILWAY_CODE } from "../types.js";
import { GREEN, WATER, crossT, levelOf, osmAlong, sameLevel } from "./osm-along.js";
import { deckAt, offDecks } from "./bridges.js";
import { MAX_RAILS, RAIL_GAP, TRACK_HALF, heavyRail, railHalf, railTracks } from "./rail.js";
import { ONEWAY, OSM_CYCLEWAY, OSM_SHARED, OSM_SIDEWALK, STREET, num, osmRoad, partnerOf, withRails } from "./road-tags.js";
import { P } from "./settings.js";
import { kerbsOnImage } from "./kerbs.js";
import { AI_RUN, ALONG, GREEN_AREA, HOUSE, PIECE_GREEN, SIDEWALK, SIDEWALK_MAX } from "./measures.js";
import { houseSources } from "./estimate-info.js";

// The narrowest sidewalk the image may end (from the kerb) and the stretch of green that ends it (m).
const WALK_MIN = 1.0, WALK_WIN = 1.0;
const BACK_MIN = 2; // m: the shortest run of green or paving the image may give behind everything else
// m: a deck edge nearer the kerb (or inside the roadway) does not end the street: OSM drew the roadway only, or roughly
// (e-18, e-13: sidewalks of 0.34 and 0.82 m left)
const DECK_MIN = 1.0;
// m: the axis of the street's other carriageway on a deck of its own at most this far past the kerb (Route des Jeunes,
// e-43: its twin 35 m off, beyond a motorway's two decks, is not the same cross-section)
const TWIN_DECK = 20;
const LAST_WALK = 15, LAST_NONE = 2; // m: the next thing of the street at most this far on; with none, this past the kerb
const REST_MAX = 12;
// frame: derive.js localFrame of the cut (its centre is [0, 0]); dir: the street's direction in it; way: the clicked
// OSM way; st: laneImage's image (null or blank: the kerbs where OSM expects them). Returns the polygons (as derive.js
// mtvuPolygons, with .kerbs and .image: whether the orthophoto found a kerb) or null.
// edges: lines of a town's technical map ([[lon, lat], …]), towns/slovakia.js: candidates for the kerbs and the outer
// edge of a sidewalk.
// widths: centre lines of roads with their width (ZBGIS Cesta, towns/slovakia.js: { path, w }): where one crosses the
// cut by the street's axis it gives the carriageway OSM would only guess (no width tag).
// areas: surfaces of a national map beside the street (ZBGIS car parks and lawns: MTVU features in WGS 84), after the
// carriageway and the houses, before OSM's green; not one under the axis (a lawn the street crosses on the map).
// symbols: point symbols of the kinds of areas of a technical map ({ x: lon, y: lat, code: MTVU code }, Bratislava's):
// a piece between two of its lines takes the kind of the symbols inside it (its lines need not close).
const CROWN = 4;
function canopyMask(st, osm, tu) {
  const pts = [];
  for (const el of osm?.elements || []) {
    if (el.type === "node" && el.tags?.natural === "tree") pts.push(tu(el.geometry[0].lon, el.geometry[0].lat));
    else if (el.type === "way" && el.tags?.natural === "tree_row") {
      const g = el.geometry.map((p) => tu(p.lon, p.lat));
      for (let i = 0; i + 1 < g.length; i++) { const L = Math.hypot(g[i + 1][0] - g[i][0], g[i + 1][1] - g[i][1]); for (let d = 0; d <= L; d += 2) pts.push([g[i][0] + ((g[i + 1][0] - g[i][0]) * d) / L, g[i][1] + ((g[i + 1][1] - g[i][1]) * d) / L]); }
    }
  }
  const { nt, nu, res, t0 } = st, U = (nu * res) / 2, mask = new Uint8Array(nt * nu);
  const near = pts.filter(([t, u]) => t > t0 - CROWN && t < t0 + nt * res + CROWN && Math.abs(u) < U + CROWN);
  if (!near.length) return null;
  for (const [t, u] of near) {
    const i0 = Math.max(0, Math.floor((t - CROWN - t0) / res)), i1 = Math.min(nt - 1, Math.ceil((t + CROWN - t0) / res));
    const j0 = Math.max(0, Math.floor((U - u - CROWN) / res)), j1 = Math.min(nu - 1, Math.ceil((U - u + CROWN) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dt = t0 + (i + 0.5) * res - t, du = U - (j + 0.5) * res - u;
      if (dt * dt + du * du <= CROWN * CROWN) mask[j * nt + i] = 1;
    }
  }
  return mask;
}
// ai: the kerbs a trained model read (ai-kerbs.js; ?ai=1, Bára 18. 11. 2026), a function of the axis (t of the
// clicked way) giving { A, B } or null: they replace the carriageway's kerbs found here, within OSM's limits.
export function orthoOsmPolys({ osm, frame, dir, way, st, mapRuns = [], edges = [], widths = [], areas = [], symbols = [], ai = null, aiSurf = null, decks = null, stretch = null }) {
  if (!way || !STREET.test(way.tags?.highway || "")) return null;
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const xy = (t, u) => [normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u];
  let o = osmAlong(osm?.elements, tu, way.id);
  if (!o.own) return null;
  // The clicked way is a track mapped as a road too (Radlinského in Bratislava: highway=service + railway=tram): the
  // street's carriageway is the nearest road of its name beside it, the tracks its tram bed.
  if (o.own.tags.railway) {
    const name = o.own.tags.name;
    const road = o.ways.filter((w) => !w.tags.railway && STREET.test(w.tags.highway || "") && w.tags.highway !== "service" && sameLevel(w, o) && (!name || w.tags.name === name) && Math.abs(w.t - o.own.t) < 12)
      .sort((a, b) => Math.abs(a.t - o.own.t) - Math.abs(b.t - o.own.t))[0];
    if (road) o = { ...o, own: road, ways: [...o.ways.filter((w) => w !== road), o.own] };
  }
  // Where the map's lines cross the cut (t), on the cut's line and a metre either side (a line may end just at it).
  const edgeT = [...new Set(edges.flatMap((path) => [0, -1, 1].flatMap((u0) => crossT(path.map(([lo, la]) => tu(lo, la)), 45, u0).map((x) => Math.round(x.t * 20) / 20))))].sort((a, b) => a - b);
  const pair = partnerOf(o);
  if (pair) { o.pairId = pair.id; o.pairT = pair.t; }
  // A road's width from the national map (ZBGIS) where its centre line crosses the cut within 4 m of the axis.
  const widthT = widths.flatMap(({ path, w }) => crossT(path.map(([lo, la]) => tu(lo, la)), 45).map((x) => ({ t: x.t, w })));
  const mapWidth = (rd, axis) => {
    if (rd.from === "width") return rd;
    const c = widthT.filter((x) => Math.abs(x.t - axis) < 4 && x.w >= 2.5 && x.w <= 30).sort((a, b) => Math.abs(a.t - axis) - Math.abs(b.t - axis))[0];
    if (!c) return rd;
    const reach = { A: Math.max(1, axis - (c.t - c.w / 2)), B: Math.max(1, c.t + c.w / 2 - axis) };
    return { ...rd, w: reach.A + reach.B, reach, from: "zbgis" };
  };
  // The crowns of the trees OSM knows (natural=tree, tree rows), CROWN m round each: their green is no lawn
  // (Bára 17. 11. 2026, Václavské náměstí: paving under the crowns read as grass).
  if (st) st = { ...st, canopy: canopyMask(st, osm, tu) };
  const road = withRails(mapWidth(osmRoad(o.own), o.own.t), o), k = kerbsOnImage(st, o, road, mapRuns, edgeT);
  const byAi = ai?.(o.own.t);
  if (byAi) {
    const A = Math.max(byAi.A, k.lim?.A ?? -Infinity), B = Math.min(byAi.B, k.lim?.B ?? Infinity);
    if (B - A >= 2 && A < o.own.t && o.own.t < B) { k.A = A; k.B = B; k.why = { A: "ai", B: "ai" }; k.image = true; }
  }
  if (!Number.isFinite(k.A) || !Number.isFinite(k.B) || k.B - k.A < 2) return null;
  // No kerb across a track: with trams in the roadway it reaches at least as far as withRails says.
  if (road.embeddedOnly) { k.A = Math.min(k.A, o.own.t - road.reach.A); k.B = Math.max(k.B, o.own.t + road.reach.B); }
  // The other carriageway, its side (pSide) and the clicked one's kerb towards it.
  let k2 = null, road2 = null, pSide = null;
  if (pair) {
    const o2 = { ...o, own: pair, ways: [...o.ways.filter((w) => w !== pair), o.own], pairId: o.own.id, pairT: o.own.t };
    road2 = withRails(mapWidth(osmRoad(pair), pair.t), o2);
    k2 = kerbsOnImage(st, o2, road2, mapRuns, edgeT);
    pSide = pair.t < o.own.t ? "A" : "B";
    const inner = k2[pSide === "A" ? "B" : "A"];
    if (!Number.isFinite(k2.A) || !Number.isFinite(k2.B) || k2.B - k2.A < 2 || (pSide === "A" ? inner > k.A : inner < k.B)) k2 = null;
  }
  const bboxOf = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const rect = (code, label, s, e) => { const ring = [xy(s, -ALONG), xy(e, -ALONG), xy(e, ALONG), xy(s, ALONG), xy(s, -ALONG)]; return { code, label, guess: true, orthoOsm: true, rings: [ring], bbox: bboxOf(ring) }; };
  // The order is the priority (derive.js classify takes the first polygon containing a point): the carriageway, the
  // OSM buildings, OSM's green areas, water and allotments, then the sidewalks and the rest up to the houses. A house in
  // a park stays a house; where OSM has a lawn beside the street it is greenery; water and allotments end the profile.
  const polys = [rect(701, "vozovka (ortofoto a OSM)", k.A, k.B)];
  if (k2) polys.push(rect(701, "vozovka (ortofoto a OSM)", k2.A, k2.B));
  for (const { el } of o.outlines) {
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    polys.push({ code: 601, label: "budova (OSM)", rings, bbox: bboxOf(rings[0]) });
  }
  // A sidewalk OSM maps on its own beyond a kerb, short of the house: a sidewalk over the national map's lawn or OSM's
  // green (Bára: Štúrova in Nitra, ZBGIS's lawns up to the houses over the sidewalks). Between the map's lines around
  // it (within 3 m; outwards the house within 4 m), else 2 m about its line. P.off "osmwalk": off (the A/B).
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (P.off?.has("osmwalk")) break;
    const out = k2 && side === pSide, kerb = out ? k2[side] : k[side], f = o.facade[side];
    for (const w of o.ways.filter((x) => OSM_SIDEWALK(x.tags) && sameLevel(x, o) && sg * (x.t - kerb) > 0.5 && (f === null || sg * (f - x.t) > 0.3))) {
      // Its outer side: a line of the map, else the house within 4 m (a sidewalk along the house), else 1 m.
      const houseNear = f !== null && Math.abs(f - w.t) < 4 ? f : null;
      const lo = edgeT.filter((t) => t < w.t - 0.3 && t > w.t - 3).at(-1) ?? (sg < 0 ? houseNear : null) ?? w.t - 1;
      const hi = edgeT.filter((t) => t > w.t + 0.3 && t < w.t + 3)[0] ?? (sg > 0 ? houseNear : null) ?? w.t + 1;
      const clip = (t) => (sg < 0 ? Math.min(Math.max(t, f ?? -Infinity), kerb) : Math.max(Math.min(t, f ?? Infinity), kerb));
      const [a, b] = [clip(lo), clip(hi)];
      if (b - a >= 0.5) polys.push(rect(702, "chodník (OSM)", a, b));
    }
  }
  // A cycle track OSM maps on its own beyond a kerb, short of the house (1000 Slovak streets: 21 of 35 missing cycle
  // tracks lay in the estimate's unknown, green or paved strips): its width (OSM width, else 2.5 m two-way, 2 m one-way)
  // about its line, within the map's lines around it, never over the roadway or past the house. Before the sidewalks'
  // stretches below, so it wins where both would be.
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const out = k2 && side === pSide, kerb = out ? k2[side] : k[side], f = o.facade[side];
    for (const w of o.ways.filter((x) => OSM_CYCLEWAY(x.tags) && sameLevel(x, o) && sg * (x.t - kerb) > 0.5 && (f === null || sg * (f - x.t) > 0.3))) {
      const width = num(w.tags.width) || (["yes", "-1"].includes(OSM_SHARED(w.tags) ? w.tags["oneway:bicycle"] ?? w.tags.oneway : w.tags.oneway) ? 2 : 2.5);
      const lo = edgeT.filter((t) => t < w.t - 0.3 && t > w.t - width / 2 - 0.5).at(-1) ?? w.t - width / 2;
      const hi = edgeT.filter((t) => t > w.t + 0.3 && t < w.t + width / 2 + 0.5)[0] ?? w.t + width / 2;
      const clip = (t) => (sg < 0 ? Math.min(Math.max(t, f ?? -Infinity), kerb) : Math.max(Math.min(t, f ?? Infinity), kerb));
      const [a, b] = [clip(lo), clip(hi)];
      // A path shared with walkers is a sidewalk-like part (702: derive.js sidewalkUse makes it C 9 / C 10), not a cycle track.
      if (b - a >= 0.8) polys.push(OSM_SHARED(w.tags) ? rect(702, "stezka pro chodce a cyklisty (OSM)", a, b) : rect(703, "cyklostezka (OSM)", a, b));
    }
  }
  polys.areas = 0;
  for (const f of areas) {
    const rings = (f.geometry?.rings || []).map((r) => r.map(([lo, la]) => frame.toXY(lo, la)));
    if (!rings.length) continue;
    const under = rings.some((r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) c = !c; } return c; });
    if (under) continue;
    polys.push({ code: f.attributes.CTVUK_KOD, label: f.attributes.CTVUK_POPIS, rings, bbox: bboxOf(rings[0]) });
    polys.areas++;
  }
  // A street on a bridge (its own bridge tag, a level above the ground) lies over OSM's water and green, which are the
  // ground under it: they do not end the profile there (Most Kotlarski in Kraków was cut as water between its
  // carriageways and over its sidewalks); derive.js ends the street behind its outer sidewalk, as with surface maps.
  // ?off=mostvoda: as before.
  const overGround = levelOf(o.own.tags) > 0 && o.own.tags.bridge && o.own.tags.bridge !== "no" && !P.off?.has("mostvoda");
  // With the bridge's deck mapped (deckSpans) only what lies under the deck goes: water or green beside it or between
  // two decks of one bridge (Vilnius, w-9 of evaluation/archive/bridge-water/blind) stays.
  for (const el of o.greens) {
    const [code, label] = GREEN(el.tags) ? [401, "zeleň (OSM)"] : ["allotments", "cemetery"].includes(el.tags.landuse) ? [300, "zahrady (OSM)"] : [501, "voda (OSM)"];
    if (overGround && Number(el.tags.layer || 0) < levelOf(o.own.tags) && (WATER(el.tags) || GREEN(el.tags))) {
      if (!decks) continue;
      const rings = [el.geometry, ...(el.holes || [])].map((r) => { const g = r.map((q) => tu(q.lon, q.lat)); return [...g, g[0]]; });
      // All the crossings, however far (a river's piece reaches far beyond the cut: an odd count would lose it).
      const ts = rings.flatMap((r) => crossT(r, Infinity).map((x) => x.t)).sort((a, b) => a - b);
      for (let i = 0; i + 1 < ts.length; i += 2) for (const [a, b] of offDecks(Math.max(ts[i], -60), Math.min(ts[i + 1], 60), decks)) if (b - a >= DECK_MIN) polys.push(rect(code, label, a, b));
      continue;
    }
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    polys.push({ code, label, guess: true, orthoOsm: true, rings, bbox: bboxOf(rings[0]) });
  }
  // A stretch without a sidewalk (past SIDEWALK_MAX, or all of it where OSM says there is none): greenery where the image
  // is mostly green, a paved area up to REST_MAX m, else nothing (the profile ends: a yard, a field, a plot of its own).
  // The kind the map's symbols give a stretch [a, b] across the cut (the most frequent within 15 m along), or null.
  const symT = symbols.map((p) => { const [t, u] = tu(p.x, p.y); return { t, u, code: p.code }; }).filter((p) => Math.abs(p.u) < 15);
  const symbolAt = (a, b) => {
    const n = new Map();
    for (const p of symT) if (p.t > a && p.t < b) n.set(p.code, (n.get(p.code) || 0) + 1);
    return n.size ? [...n].sort((x, y) => y[1] - x[1])[0][0] : null;
  };
  const SYMBOL_LABEL = { 401: "zeleň (technická mapa)", 702: "chodník (technická mapa)", 1003: "zpevněná plocha (technická mapa)", 603: "dvůr (technická mapa)", 704: "parkoviště (technická mapa)" };
  const rest = (a, b) => {
    const sym = symbolAt(a, b);
    if (SYMBOL_LABEL[sym]) { polys.push({ ...rect(sym, SYMBOL_LABEL[sym], a, b), guess: false }); edgeUsed = true; return; }
    const g = [];
    if (k.cols) for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
    if (g.length && g.reduce((x, y) => x + y, 0) / g.length >= GREEN_AREA) polys.push(rect(401, "zeleň (ortofoto)", a, b));
    else if (b - a <= REST_MAX) polys.push(rect(1003, "plocha před domem (odhad)", a, b));
  };
  let edgeUsed = k.why.A === "mapa" || k.why.B === "mapa" || (k2 && (k2.why.A === "mapa" || k2.why.B === "mapa"));
  // The median between the two carriageways: greenery where the image is mostly green, else a paved strip.
  if (k2) {
    const [a, b] = pSide === "A" ? [k2.B, k.A] : [k.B, k2.A];
    if (b - a >= 0.3) {
      const g = [];
      if (k.cols) for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
      // Tram tracks of OSM in it: the street's tram bed (as MTVU's 705: derive.js makes its tracks).
      let rails = o.ways.filter((w) => w.tags.railway === "tram" && sameLevel(w, o) && w.t > a && w.t < b);
      // No tram but a railway in the median (Bahnhofstraße with the train between the carriageways): its bed the same way.
      const heavy = !rails.length && railTracks(o.ways.filter((w) => heavyRail(w, o) && w.t > a && w.t < b));
      const [bedCode, bedLabel, bedHalf] = heavy.length ? [RAILWAY_CODE, "železnice (OSM)", railHalf(heavy[0])] : [705, "tramvajové těleso (OSM)", TRACK_HALF];
      if (heavy.length) rails = heavy;
      const greenOr = (x, y) => {
        const gg = [];
        if (k.cols) for (let i = k.cols.ti(x); i < k.cols.ti(y); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) gg.push(k.cols.green[i]);
        return gg.length && gg.reduce((u, v) => u + v, 0) / gg.length >= GREEN_AREA ? rect(401, "zeleň (ortofoto)", x, y) : rect(1003, "dělicí pás (odhad)", x, y);
      };
      // The bed only round its tracks (TRACK_HALF beyond the outer axes): the rest of a wide median keeps its own
      // surface (Werichova in 2022, the whole 36 m between the carriageways became two trams of 18 m).
      if (rails.length) {
        const ts = rails.map((w) => w.t).sort((x, y) => x - y), lo = Math.max(a, ts[0] - bedHalf), hi = Math.min(b, ts[ts.length - 1] + bedHalf);
        if (lo - a >= 0.5) polys.push(greenOr(a, lo)); else if (lo > a) polys.push(rect(bedCode, bedLabel, a, lo));
        polys.push(rect(bedCode, bedLabel, lo, hi));
        if (b - hi >= 0.5) polys.push(greenOr(hi, b)); else if (b > hi) polys.push(rect(bedCode, bedLabel, hi, b));
      } else polys.push(greenOr(a, b));
    }
  }
  // Where a side without a house ends (Bára 17. 11. 2026, Smetanovo nábřeží: the profile ran on over the ground below
  // the street on both sides): at the first steps (a change of level), fence or wall OSM maps across the cut beyond the
  // kerb, or the fenced edge of a park.
  // Where the carriageway OSM says ends on a side (its lanes' width about the axis): a track beyond it is no embedded one,
  // whatever kerb the image found (the track's bed reads as roadway on it).
  const edgeOf = (side) => { const out = k2 && side === pSide; return (out ? pair.t : o.own.t) + (side === "A" ? -1 : 1) * (out ? road2 : road).reach[side]; };
  const ends = { A: null, B: null }, hard = { A: null, B: null }, chain = { A: [], B: [] }, reached = { A: null, B: null };
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (o.facade[side] !== null) continue;
    const kerbT = (k2 && side === pSide ? k2 : k)[side];
    const cand = [
      ...o.ways.filter((w) => sameLevel(w, o) && (w.tags.highway === "steps" || ["fence", "wall", "retaining_wall", "city_wall"].includes(w.tags.barrier))).map((w) => w.t),
      // A fenced green area's edge (barrier on the area; tools/build_osm_tiles.mjs keeps it), not where a tile cut it.
      ...o.greens.filter((g) => ["fence", "wall"].includes(g.tags?.barrier)).flatMap((g) => {
        const r = [...g.geometry, g.geometry[0]], onBorder = (a, b) => [["lon", a.lon, b.lon], ["lat", a.lat, b.lat]].some(([, x, y]) => x === y && Math.abs(x / TILE - Math.round(x / TILE)) < 1e-6);
        const out = [];
        for (let i = 0; i + 1 < r.length; i++) if (!onBorder(r[i], r[i + 1])) out.push(...crossT([r[i], r[i + 1]].map((q) => tu(q.lon, q.lat)), 45).map((x) => x.t));
        return out;
      }),
    ].filter((t) => sg * (t - kerbT) > 0.5 && Math.abs(t - o.own.t) < 40);
    if (cand.length) { ends[side] = hard[side] = cand.reduce((a, b) => (sg * (b - a) < 0 ? b : a)); continue; }
    // No such end: the side ends just beyond the last thing of the street OSM maps there (a sidewalk or path, a cycle
    // track, tram tracks, another carriageway), each LAST_WALK within the one before; nothing there: LAST_NONE past the
    // kerb (Bára 17. 11. 2026, Generála Šišky: "když nic pak není, tak se řez vezme jen po poslední zajímavý prvek").
    // A sidewalk mapped apart is drawn as one.
    const things0 = o.ways.filter((w) => sameLevel(w, o) && (heavyRail(w, o) ? sg * (w.t - edgeOf(side)) > 0.3 : sg * (w.t - kerbT) > 0.3) && Math.abs(w.t - o.own.t) < 40 && (w.tags.railway === "tram" || heavyRail(w, o) || ["footway", "path", "pedestrian", "cycleway", "steps"].includes(w.tags.highway) || (STREET.test(w.tags.highway || "") && w.tags.highway !== "service")))
      .sort((a, b) => sg * (a.t - b.t));
    const things = things0.filter((w) => !heavyRail(w, o) || railTracks(things0.filter((x) => heavyRail(x, o))).includes(w));
    let last = kerbT, lastW = null;
    let nRail = 0;
    for (const w of things) {
      if (sg * (w.t - last) > (heavyRail(w, o) ? RAIL_GAP : LAST_WALK)) break;
      if (heavyRail(w, o) && ++nRail > MAX_RAILS) break;
      if (sg * (w.t - last) > 0) last = w.t;
      lastW = w; chain[side].push(w);
    }
    const halfOf = (w) => (w?.tags.railway === "tram" ? TRACK_HALF : w && heavyRail(w, o) ? railHalf(w) : w?.tags.highway === "cycleway" ? 1.3 : STREET.test(w?.tags.highway || "") ? 3 : SIDEWALK / 2);
    // Nothing mapped there: a soft end, moved out past the estimate's own last sidewalk, parking or tree row (trimToEnds).
    // The side the user stretched beyond the usual reach (Bára 27. 11. 2026, Tikkurilantie in Vantaa and Via Leopardi in Merano:
    // the profile stopped at the cycle track or sidewalk with a lawn and a wood beyond it): no end at the last thing; the
    // lawn, other areas and things go on to the reach, or to a house, a fence or a wall (above). stretch: { A: true, B: false }
    // from app.js (a reach beyond MAX_REACH that the user set). on by default, ?dosah=0 off (Bára 27. 11. 2026; evaluation/archive/railway/REPORT.md).
    if (stretch?.[side] && P.stretchOn) { ends[side] = null; continue; }
    ends[side] = lastW ? (sg > 0 ? Math.max : Math.min)(last + sg * halfOf(lastW), ...chain[side].map((w) => w.t + sg * halfOf(w))) : kerbT + sg * LAST_NONE;
    if (!lastW) (ends.soft ??= {})[side] = true;
  }
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    // Beyond the other carriageway its kerb and its sidewalk tags count.
    const out = k2 && side === pSide, rd = out ? road2 : road;
    const kerb = out ? k2[side] : k[side], f = o.facade[side], says = rd.sidewalk[side];
    const far = f !== null ? f : says === "no" ? null : says || rd.sidewalkW[side] ? kerb + sg * (rd.sidewalkW[side] || SIDEWALK) : null;
    reached[side] = far !== null && sg * (far - kerb) >= 0.3 ? far : kerb;
    if (far === null || sg * (far - kerb) < 0.3) continue;
    const span = (x, y) => (sg < 0 ? [y, x] : [x, y]);
    // A sidewalk of at most SIDEWALK_MAX; the rest up to the house is some other area (a front garden, a yard, a lawn:
    // MTVU in Prague and Brno: 34 of 42 such stretches over 6 m hold a sidewalk of at most 6 m).
    // A smaller cap, also by the street's class, lost (docs/decisions.md): telling a sidewalk from other paving needs the
    // image, not a number.
    let swEnd = says === "no" ? kerb : Math.abs(far - kerb) > SIDEWALK_MAX ? kerb + sg * SIDEWALK_MAX : far;
    // Lines of the map across the stretch from the kerb to the house (not the house's own front): its pieces, each a
    // sidewalk or green by the image (Bára, Štúrova in Piešťany: the sidewalks lie by the houses, the green strip by
    // the kerb) or by the map's symbol in it. Without such lines a sidewalk from the kerb as before.
    const roadGreen = (() => { if (!k.cols) return 0; const g = []; for (let i = k.cols.ti(o.own.t - 1.5); i <= k.cols.ti(o.own.t + 1.5); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]); return g.length ? g.reduce((x, y) => x + y, 0) / g.length : 0; })();
    const cuts = says === "no" ? [] : edgeT.filter((t) => sg * (t - kerb) >= 1 && sg * (far - t) > 0.5).sort((x, y) => sg * (x - y));
    if (cuts.length) {
      edgeUsed = true;
      const ends = [kerb, ...cuts, far];
      for (let q = 0; q + 1 < ends.length; q++) {
        const [a, b] = span(ends[q], ends[q + 1]);
        const sym = symbolAt(a, b);
        const put = (p) => polys.push(p);
        if (SYMBOL_LABEL[sym]) { put({ ...rect(sym, SYMBOL_LABEL[sym], a, b), guess: false }); continue; }
        const g = [];
        if (k.cols) for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
        // Against the roadway's own share by the axis (the Slovak mosaic is greenish all over).
        const green = g.length && g.reduce((x, y) => x + y, 0) / g.length >= PIECE_GREEN + roadGreen;
        // The last piece up to a house farther than a sidewalk: as the rest (a front garden, a yard). So is any other
        // paved piece wider than a sidewalk, and the first one by the kerb keeps SIDEWALK_MAX of sidewalk (1000 Slovak
        // streets: 8 sidewalks of 9–18 m between the town map's lines).
        const wide = !green && b - a > SIDEWALK_MAX;
        if (q === ends.length - 2 && b - a > SIDEWALK_MAX) rest(a, b);
        else if (wide && q === 0) { const m = kerb + sg * SIDEWALK_MAX, [c, d] = span(kerb, m), [e, h] = span(m, ends[1]); put(rect(702, "chodník (ortofoto a mapa)", c, d)); rest(e, h); }
        else if (wide) rest(a, b);
        else put(green ? rect(401, "zeleň (ortofoto a mapa)", a, b) : rect(702, "chodník (ortofoto a mapa)", a, b));
      }
    } else if (aiSurf && P.aiWalk) {
      // P.aiWalk (a trial, 19. 11. 2026): the model's kinds from the kerb to the house (or OSM's sidewalk end) decide
      // sidewalk, green and other, in runs of at least AI_RUN (the rules confuse sidewalks under trees with lawns and
      // dry lawns with paving; the hold-out: some 300 m each way).
      const kindAt = (t) => { const k2 = aiSurf(t); return k2 === "chodník" ? 702 : k2 === "zeleň" ? 401 : k2 ? 1003 : null; };
      const runs = [];
      for (let t = kerb + sg * 0.1; sg * (far - t) > 0; t += sg * 0.2) { const c = kindAt(t) ?? runs.at(-1)?.c ?? 702; const l = runs.at(-1); if (l && l.c === c) l.e = t + sg * 0.1; else runs.push({ c, s: t - sg * 0.1, e: t + sg * 0.1 }); }
      for (let q = 0; q < runs.length; q++) if (runs.length > 1 && Math.abs(runs[q].e - runs[q].s) < AI_RUN) { const nb = q > 0 ? q - 1 : q + 1; runs[nb].s = sg * runs[nb].s < sg * runs[q].s ? runs[nb].s : runs[q].s; runs[nb].e = sg * runs[nb].e > sg * runs[q].e ? runs[nb].e : runs[q].e; runs.splice(q, 1); q = -1; }
      if (runs.length) { runs[0].s = kerb; runs.at(-1).e = far; }
      // Paving the model calls sidewalk counts as sidewalk only up to SIDEWALK_MAX from the kerb, beyond it as a paved
      // area (German maps: forecourts and yards of 8–12 m between the sidewalk and the house, the model's "sidewalk"
      // up to the house; the hold-out, Rudolf-Reusch-Straße, Pestalozzistraße).
      const lim = kerb + sg * SIDEWALK_MAX;
      const out = [];
      for (const r of runs) {
        if (r.c !== 702 || sg * (r.e - lim) <= 0) { out.push(r); continue; }
        if (sg * (r.s - lim) >= 0) { out.push({ ...r, c: 1003 }); continue; }
        out.push({ ...r, e: lim }, { c: 1003, s: lim, e: r.e });
      }
      runs.splice(0, runs.length, ...out);
      const LBL = { 702: "chodník (AI)", 401: "zeleň (AI)", 1003: "zpevněná plocha (AI)" };
      for (const r of runs) polys.push(rect(r.c, LBL[r.c], ...span(r.s, r.e)));
    } else {
      // The sidewalk ends where the image turns green for good (Bára 18. 11. 2026, Za Kalváriou in Prešov: a 1.4 m
      // sidewalk by the kerb, then lawn and trees up to the house, was drawn 6 m wide: the cap, not the image). From
      // WALK_MIN off the kerb on, the first WALK_WIN that is green as a piece between map lines is (PIECE_GREEN over
      // the roadway's own share) ends it, if the next WALK_WIN is green too. Saturation, yellowness and edges of the
      // image as other ends of it lost (docs/decisions.md).
      if (k.cols && swEnd !== kerb && Math.abs(swEnd - kerb) > WALK_MIN + 2 * WALK_WIN) {
        const greenOf = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], g = []; for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]); return g.length ? g.reduce((u, v) => u + v, 0) / g.length : NaN; };
        const soft = (x, y) => greenOf(x, y) >= PIECE_GREEN + roadGreen;
        for (let x = kerb + sg * WALK_MIN; sg * (swEnd - x) > 2 * WALK_WIN; x += sg * 0.2) {
          if (soft(x, x + sg * WALK_WIN) && soft(x + sg * WALK_WIN, x + sg * 2 * WALK_WIN)) { swEnd = x; break; }
        }
      }
      if (swEnd !== kerb) {
        // The map's symbol in the sidewalk's stretch: a lawn there is a green strip, not a sidewalk.
        const sym = symbolAt(...span(kerb, swEnd));
        if (sym === 401) { polys.push({ ...rect(401, SYMBOL_LABEL[401], ...span(kerb, swEnd)), guess: false }); edgeUsed = true; }
        else polys.push(rect(702, "chodník (ortofoto a OSM)", ...span(kerb, swEnd)));
      }
      if (swEnd !== far) rest(...span(swEnd, far));
    }
    // A house found only beside the cut (on a line u ≠ 0): its front drawn across the cut, so the profile ends at it.
    if (f !== null && o.facadeU[side] !== 0) polys.push({ ...rect(601, "budova (OSM, vedle řezu)", ...span(far, far + sg * HOUSE)), guess: false });
  }
  // Between the street's own sidewalk and the end the last thing of the street sets (a path, a cycle track, tracks,
  // another carriageway OSM maps there; Bára 18. 11. 2026: "Neurčeno" beyond the street in 67 of 87 Prague cuts, under
  // it MTVU's green, paths and side roads; evaluation/ortho-osm/errors.mjs): each such thing drawn as what it is, the
  // gaps between them green where the image is mostly green, else paved. A side road
  // there is a roadway of its own.
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (!chain[side].length || reached[side] === null) continue;
    let outer = reached[side];
    const span = (x, y) => (sg < 0 ? [y, x] : [x, y]);
    const fill = (x, y) => {
      if (sg * (y - x) < 0.3) return;
      const g = [];
      if (k.cols) for (let i = k.cols.ti(Math.min(x, y)); i < k.cols.ti(Math.max(x, y)); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
      const green = g.length && g.reduce((u, v) => u + v, 0) / g.length >= GREEN_AREA;
      polys.push(green ? rect(401, "zeleň (ortofoto)", ...span(x, y)) : rect(1003, "zpevněná plocha (odhad)", ...span(x, y)));
    };
    for (const w of chain[side]) {
      const kind = w.tags.railway === "tram" ? [705, "tramvajové těleso (OSM)", TRACK_HALF] : heavyRail(w, o) ? [RAILWAY_CODE, "železnice (OSM)", railHalf(w)] : w.tags.highway === "cycleway" && !OSM_SHARED(w.tags) ? [703, "cyklostezka (OSM)", 1.3]
        : STREET.test(w.tags.highway || "") ? [701, "vozovka (OSM, souběžná)", 3] : [702, "chodník (OSM, zvlášť)", SIDEWALK / 2];
      if (!kind) break;
      const a = w.t - sg * kind[2], b = w.t + sg * kind[2];
      if (sg * (b - outer) < 0.3) continue;
      fill(outer, a);
      polys.push(rect(kind[0], kind[1], ...span(sg * (a - outer) > 0 ? a : outer, b)));
      outer = b;
    }
  }
  // Whatever is left uncovered beyond the street (a yard, a lawn past a path, ground up to a house farther than REST_MAX:
  // "Neurčeno" in most cuts, errors.mjs, Bára 18. 11. 2026): green or paved by the image, in runs of at least
  // BACK_MIN, behind everything else (the order is the priority; trimToEnds does not reach out for them).
  if (k.cols) {
    const c = k.cols, half = Math.round(1 / c.res), isG = [];
    for (let i = 0; i < c.nt; i++) {
      let sum = 0, n = 0;
      for (let q = i - half; q <= i + half; q++) if (q >= 0 && q < c.nt && Number.isFinite(c.green[q]) && c.seen[q] >= 0.5) { sum += c.green[q]; n++; }
      isG.push(n ? sum / n >= GREEN_AREA : null);
    }
    const runs = [];
    for (let i = 0; i < c.nt; i++) {
      if (isG[i] === null) continue;
      const l = runs.at(-1);
      if (l && l.g === isG[i] && l.i1 === i - 1) l.i1 = i; else runs.push({ g: isG[i], i0: i, i1: i });
    }
    // Short runs join the longer neighbour.
    for (let q = 0; q < runs.length; q++) {
      const r = runs[q];
      if ((r.i1 - r.i0 + 1) * c.res >= BACK_MIN || runs.length < 2) continue;
      const nb = q > 0 && (q === runs.length - 1 || runs[q - 1].i1 - runs[q - 1].i0 >= runs[q + 1].i1 - runs[q + 1].i0) ? q - 1 : q + 1;
      if (runs[nb].i1 === r.i0 - 1 || runs[nb].i0 === r.i1 + 1) { runs[nb].i0 = Math.min(runs[nb].i0, r.i0); runs[nb].i1 = Math.max(runs[nb].i1, r.i1); runs.splice(q, 1); q = -1; }
    }
    // Not behind a house; paving only up to REST_MAX (a far house gives no tens of metres of paving).
    const fA = o.facade.A ?? -Infinity, fB = o.facade.B ?? Infinity;
    for (const r of runs) {
      const a = Math.max(fA, c.tOf(r.i0) - c.res / 2), b = Math.min(fB, c.tOf(r.i1) + c.res / 2);
      // Paving beyond REST_MAX is no lot of the street, but up to a wall, a fence or steps the street's side ends at (Bára
      // 27. 11. 2026, Leipzig, Berliner Straße: the profile stopped 1.3 m before the wall): from the kerb to that end.
      if (!r.g && b - a > REST_MAX) {
        for (const [side, sg] of [["A", -1], ["B", 1]]) {
          const e = hard[side];
          if (e === null) continue;
          const kt = (k2 && side === pSide ? k2 : k)[side], [x, y] = sg < 0 ? [Math.max(a, e), Math.min(b, kt)] : [Math.max(a, kt), Math.min(b, e)];
          if (y - x >= BACK_MIN) polys.push(rect(1003, "zpevněná plocha (odhad)", x, y));
        }
        continue;
      }
      if (b - a < BACK_MIN || (!r.g && b - a > REST_MAX)) continue;
      polys.push(r.g ? rect(401, "zeleň (ortofoto)", a, b) : rect(1003, "zpevněná plocha (odhad)", a, b));
    }
  }
  // A street on a bridge ends at the edge of its deck (Bára 26. 11. 2026: "pokud je to na mostě, tak bych to ukončila
  // hranicí té plochy"): the deck holding the outermost kerb on each side, its edge at least DECK_MIN beyond the kerb (a
  // narrower deck than the roadway is OSM's mistake), a hard end wherever the side would reach past it (trimToEnds).
  // ends.deck: the sides so ended (bridgeRailings). ?off=mostdeska: none (deckSpans gives null).
  // The other carriageway of the street on a deck of its own (two bridges side by side, the gap between them: e-12, e-36
  // of evaluation/archive/bridge-water/edge) belongs to the street: the end is that deck's edge. Such a carriageway: a road of
  // the street's level within 40 m, of its name or ref (one of them unnamed: of its class, both one-way; Autoroute des
  // Cigognes and its unnamed twin, M 35 both). A soft end (nothing of OSM beyond the kerb, trimToEnds reaches out to the
  // street's own last part) stays soft, only never past the deck (cap). A road of another name on the next deck (a
  // motorway's slip road beside N579a, e-12) is not the street's.
  const own = o.own.tags;
  const sameStreet = (w) => STREET.test(w.tags.highway || "") && sameLevel(w, o) && Math.abs(w.t - o.own.t) < 40 &&
    ((own.name && w.tags.name === own.name) || (own.ref && w.tags.ref === own.ref) || ((!own.name || !w.tags.name) && w.tags.highway === own.highway && ONEWAY(w.tags) && ONEWAY(own)));
  if (decks && overGround) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const kerbT = (k2 && side === pSide ? k2 : k)[side];
    let d = deckAt(decks, kerbT, 0.3);
    if (!d) continue;
    for (const w of o.ways.filter((x) => sg * (x.t - kerbT) > 0 && sg * (x.t - kerbT) <= TWIN_DECK && sameStreet(x))) {
      const d2 = deckAt(decks, w.t);
      if (d2 && sg * ((sg < 0 ? d2.s : d2.e) - (sg < 0 ? d.s : d.e)) > 0) d = d2;
    }
    const edge = sg < 0 ? d.s : d.e;
    if (sg * (edge - kerbT) < DECK_MIN) continue;
    if (ends.soft?.[side]) (ends.cap ??= {})[side] = edge;
    else if (ends[side] === null || sg * (ends[side] - edge) > 0) ends[side] = edge;
    (ends.deck ??= {})[side] = edge;
  }
  // The railway beside the street: its tracks beyond the carriageway OSM says, each a bed of its width, drawn before the
  // carriageway (the bed of gravel reads as roadway on the image, and the sidewalk and the rest come after it). On a
  // side with a house up to it; the side without one has its tracks in chain (the end of the side reaches them).
  if (!P.off?.has("railway")) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const out = k2 && side === pSide, kerb = out ? k2[side] : k[side], f = o.facade[side];
    if (out) continue;
    const all = o.ways.filter((w) => heavyRail(w, o) && sg * (w.t - edgeOf(side)) > 0.3 && sg * (w.t - o.own.t) < 40);
    const tracks = railTracks(all).sort((a, b) => sg * (a.t - b.t));
    const beds = [];
    let last = kerb;
    for (const w of tracks) {
      if (sg * (w.t - last) > RAIL_GAP || beds.length >= MAX_RAILS) break;
      // The bed starts at the image's kerb where the track's axis lies beyond it (it must not bite into the roadway).
      const h = railHalf(w), a0 = w.t - sg * h, a = sg * (w.t - kerb) > 0 && sg * (a0 - kerb) < 0 ? kerb : a0, b = f !== null && sg * (w.t + sg * h - f) > 0 ? f : w.t + sg * h;
      if (f !== null && sg * (f - w.t) < 0.5) break;
      beds.push(rect(RAILWAY_CODE, "železnice (OSM)", ...(sg < 0 ? [b, a] : [a, b])));
      if (sg * (w.t - last) > 0) last = w.t;
    }
    polys.splice(0, 0, ...beds);
  }
  polys.ends = ends;
  // Whether a line of the town's map decided a kerb or a sidewalk's edge (the credits).
  polys.edges = !!edgeUsed;
  polys.widthFrom = road.from;
  polys.kerbs = { A: k.A, B: k.B, why: k.why, ...(k2 && { pair: { A: k2.A, B: k2.B, why: k2.why } }) };
  // Whether the orthophoto decided anything (a kerb found on it); else the kerbs are OSM's (the status says so).
  polys.image = k.image;
  // Where the houses come from (the note under the street's name, estimateNote): the facades' sources, else those of
  // all the houses it read, else OSM.
  polys.houses = houseSources(o);
  return polys;
}
