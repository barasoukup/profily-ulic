import { RAILWAY_CODE } from "../types.js";
import { GREEN, WATER, crossT, levelOf, osmAlong, sameLevel } from "./osm-along.js";
import { greenValues, meanOf } from "./columns.js";
import { offDecks } from "./bridges.js";
import { TRACK_HALF, heavyRail, railHalf, railTracks } from "./rail.js";
import { OSM_CYCLEWAY, OSM_SHARED, OSM_SIDEWALK, STREET, num, osmRoad, partnerOf, withRails } from "./road-tags.js";
import { P } from "./settings.js";
import { kerbsOnImage } from "./kerbs.js";
import { ALONG, GREEN_AREA } from "./measures.js";
import { houseSources } from "./estimate-info.js";
import { DECK_MIN, findSideEnds, capAtDecks, addRailBeds } from "./polys-ends.js";
import { readyRest, addSidewalks, addNearThings, addBackground } from "./polys-sides.js";

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

// The surfaces are made in phases, each a function of the cut's context cx (openCut makes it, the phases add what they find
// to it): openCut and findKerbs, then the polygons in the order of their priority (derive.js classify takes the first one
// containing a point): the carriageways, the OSM buildings, the sidewalks and cycle tracks OSM maps apart, the national
// map's areas, OSM's green and water, the median, then the ends of the sides (polys-ends.js), the sidewalks and what lies
// behind them (polys-sides.js), the bridge's deck and the railway.
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
// ai: the kerbs a trained model read (ai-kerbs.js; ?ai=1, Bára 18. 11. 2026), a function of the axis (t of the
// clicked way) giving { A, B } or null: they replace the carriageway's kerbs found here, within OSM's limits.
export function orthoOsmPolys({ osm, frame, dir, way, st, mapRuns = [], edges = [], widths = [], areas = [], symbols = [], ai = null, aiSurf = null, decks = null, stretch = null }) {
  const cx = openCut({ osm, frame, dir, way, st, mapRuns, edges, widths, areas, symbols, ai, aiSurf, decks, stretch });
  if (!cx || !findKerbs(cx)) return null;
  startPolys(cx);
  addOsmSidewalks(cx);
  addOsmCycleTracks(cx);
  addMapAreas(cx);
  addOsmGreens(cx);
  readyRest(cx);
  addMedian(cx);
  findSideEnds(cx);
  addSidewalks(cx);
  addNearThings(cx);
  addBackground(cx);
  capAtDecks(cx);
  addRailBeds(cx);
  return finishPolys(cx);
}

// What is known of the cut before any surface is made: the helpers of the frame, what OSM has along the cut (o), the lines of
// the town's map across it (edgeT), the other carriageway of the street (pair), the widths of the national map, the crowns
// of the trees. null: not a street, or OSM has not the clicked way.
function openCut({ osm, frame, dir, way, st, mapRuns, edges, widths, areas, symbols, ai, aiSurf, decks, stretch }) {
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
  return { osm, frame, dir, way, st, mapRuns, edges, widths, areas, symbols, ai, aiSurf, decks, stretch, normal, tu, xy, o, edgeT, pair, mapWidth };
}

// The kerbs of the clicked carriageway (read on the image, or the model's, within OSM's limits) and of the other carriageway
// of the street. false: no kerbs to make a street of.
function findKerbs(cx) {
  const { st, o, mapRuns, edgeT, ai, pair, mapWidth } = cx;
  const road = withRails(mapWidth(osmRoad(o.own), o.own.t), o), k = kerbsOnImage(st, o, road, mapRuns, edgeT);
  const byAi = ai?.(o.own.t);
  if (byAi) {
    const A = Math.max(byAi.A, k.lim?.A ?? -Infinity), B = Math.min(byAi.B, k.lim?.B ?? Infinity);
    if (B - A >= 2 && A < o.own.t && o.own.t < B) { k.A = A; k.B = B; k.why = { A: "ai", B: "ai" }; k.image = true; }
  }
  if (!Number.isFinite(k.A) || !Number.isFinite(k.B) || k.B - k.A < 2) return false;
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
  Object.assign(cx, { road, k, k2, road2, pSide });
  return true;
}

// The first surfaces: the carriageway, the other carriageway, the OSM buildings.
// The order is the priority (derive.js classify takes the first polygon containing a point): the carriageway, the
// OSM buildings, OSM's green areas, water and allotments, then the sidewalks and the rest up to the houses. A house in
// a park stays a house; where OSM has a lawn beside the street it is greenery; water and allotments end the profile.
function startPolys(cx) {
  const { frame, xy, o, k, k2 } = cx;
  const bboxOf = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const rect = (code, label, s, e) => { const ring = [xy(s, -ALONG), xy(e, -ALONG), xy(e, ALONG), xy(s, ALONG), xy(s, -ALONG)]; return { code, label, guess: true, orthoOsm: true, rings: [ring], bbox: bboxOf(ring) }; };
  const polys = [rect(701, "vozovka (ortofoto a OSM)", k.A, k.B)];
  if (k2) polys.push(rect(701, "vozovka (ortofoto a OSM)", k2.A, k2.B));
  for (const { el } of o.outlines) {
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    polys.push({ code: 601, label: "budova (OSM)", rings, bbox: bboxOf(rings[0]) });
  }
  Object.assign(cx, { bboxOf, rect, polys });
}

// A sidewalk OSM maps on its own beyond a kerb, short of the house: a sidewalk over the national map's lawn or OSM's
// green (Bára: Štúrova in Nitra, ZBGIS's lawns up to the houses over the sidewalks). Between the map's lines around
// it (within 3 m; outwards the house within 4 m), else 2 m about its line. P.off "osmwalk": off (the A/B).
function addOsmSidewalks(cx) {
  const { o, edgeT, k, k2, pSide, rect, polys } = cx;
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
}

// A cycle track OSM maps on its own beyond a kerb, short of the house (1000 Slovak streets: 21 of 35 missing cycle
// tracks lay in the estimate's unknown, green or paved strips): its width (OSM width, else 2.5 m two-way, 2 m one-way)
// about its line, within the map's lines around it, never over the roadway or past the house. Before the sidewalks'
// stretches below, so it wins where both would be.
function addOsmCycleTracks(cx) {
  const { o, edgeT, k, k2, pSide, rect, polys } = cx;
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
}

// The areas of a national map beside the street.
function addMapAreas(cx) {
  const { frame, areas, bboxOf, polys } = cx;
  polys.areas = 0;
  for (const f of areas) {
    const rings = (f.geometry?.rings || []).map((r) => r.map(([lo, la]) => frame.toXY(lo, la)));
    if (!rings.length) continue;
    const under = rings.some((r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) c = !c; } return c; });
    if (under) continue;
    polys.push({ code: f.attributes.CTVUK_KOD, label: f.attributes.CTVUK_POPIS, rings, bbox: bboxOf(rings[0]) });
    polys.areas++;
  }
}

// A street on a bridge (its own bridge tag, a level above the ground) lies over OSM's water and green, which are the
// ground under it: they do not end the profile there (Most Kotlarski in Kraków was cut as water between its
// carriageways and over its sidewalks); derive.js ends the street behind its outer sidewalk, as with surface maps.
// ?off=mostvoda: as before.
function addOsmGreens(cx) {
  const { frame, decks, tu, o, bboxOf, rect, polys } = cx;
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
  cx.overGround = overGround;
}

// The median between the two carriageways: greenery where the image is mostly green, else a paved strip.
function addMedian(cx) {
  const { o, k, k2, pSide, rect, polys } = cx;
  if (k2) {
    const [a, b] = pSide === "A" ? [k2.B, k.A] : [k.B, k2.A];
    if (b - a >= 0.3) {
      // Tram tracks of OSM in it: the street's tram bed (as MTVU's 705: derive.js makes its tracks).
      let rails = o.ways.filter((w) => w.tags.railway === "tram" && sameLevel(w, o) && w.t > a && w.t < b);
      // No tram but a railway in the median (Bahnhofstraße with the train between the carriageways): its bed the same way.
      const heavy = !rails.length && railTracks(o.ways.filter((w) => heavyRail(w, o) && w.t > a && w.t < b));
      const [bedCode, bedLabel, bedHalf] = heavy.length ? [RAILWAY_CODE, "železnice (OSM)", railHalf(heavy[0])] : [705, "tramvajové těleso (OSM)", TRACK_HALF];
      if (heavy.length) rails = heavy;
      const greenOr = (x, y) => {
        const gg = greenValues(k.cols, x, y);
        return gg.length && meanOf(gg) >= GREEN_AREA ? rect(401, "zeleň (ortofoto)", x, y) : rect(1003, "dělicí pás (odhad)", x, y);
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
}

// The notes of the surfaces: where the ends are, what the map's lines decided, where the houses come from.
function finishPolys(cx) {
  const { o, road, k, k2, polys, ends } = cx;
  polys.ends = ends;
  // Whether a line of the town's map decided a kerb or a sidewalk's edge (the credits).
  polys.edges = !!cx.edgeUsed;
  polys.widthFrom = road.from;
  polys.kerbs = { A: k.A, B: k.B, why: k.why, ...(k2 && { pair: { A: k2.A, B: k2.B, why: k2.why } }) };
  // Whether the orthophoto decided anything (a kerb found on it); else the kerbs are OSM's (the status says so).
  polys.image = k.image;
  // Where the houses come from (the note under the street's name, estimateNote): the facades' sources, else those of
  // all the houses it read, else OSM.
  polys.houses = houseSources(o);
  return polys;
}
