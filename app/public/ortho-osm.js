// The street from the orthophoto and OSM where no technical map answers (Bára 15. 11. 2026; evaluation/ortho-osm/
// REPORT.md, method M2): the surfaces derive.js needs are made up of the OSM buildings, a carriageway whose kerbs are
// read on the orthophoto of the click (lanes-ortho.js laneImage) near where OSM expects them (width, lanes, parking,
// tram tracks), and sidewalks from the kerbs to the buildings. Every surface but the buildings is an estimate
// (guess: the parts are "odhad"). Against MTVU (Prague, Brno, simple cuts): kerbs within 0.5 m at 39–49 %, within 1 m
// at 57–69 %, against 26–35 % / 51–59 % from OSM alone; with an OSM width tag much better.

import { TILE } from "./osmtile.js";
import { strongLines } from "./lanes-ortho.js";
import { RAILWAY_CODE, RAIL_KINDS } from "./types.js";

const median = (a) => { const b = a.filter((v) => Number.isFinite(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };

// ---------- what OSM says along the cut ----------
const underground = (tags) => Number(tags.layer) < 0 || Number(tags.level) < 0 || tags.location === "underground" || tags.tunnel === "yes";
// Where a ring or a line (in the cut's [t, u]) crosses the line u = u0, within |t| ≤ half.
function crossT(pts, half, u0 = 0) {
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
const levelOf = (t) => Number(t.layer) || (t.tunnel && t.tunnel !== "no" ? -1 : t.bridge && t.bridge !== "no" ? 1 : 0);
export const onBridge = (t) => !!t?.bridge && t.bridge !== "no" && levelOf(t) > 0;

// ---------- the deck of a bridge ----------
// Where the cut runs over a bridge deck OSM maps as its outline (man_made=bridge; tools/build_osm_tiles.mjs keeps the
// decks since 26. 11. 2026, cut by tiles: the pieces of one deck join again here): the stretches [s, e] of the cut's
// line on a deck (t as derive.js, from the cut's centre). Only for a street on a bridge (onBridge), only decks of its
// level (a deck without a layer counts), and only when a deck holds the street's axis (else OSM's deck and its street
// do not agree and nothing is decided by it). Returns { spans, axis } or null. ?off=mostdeska: none (as before).
const DECK_GAP = 0.1; // m: pieces of one deck (cut by tiles) closer than this join
export function deckSpans(elements, frame, dir, way) {
  if (P.off?.has("mostdeska") || !onBridge(way?.tags)) return null;
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const level = levelOf(way.tags);
  let axis = null;
  const raw = [];
  for (const el of elements || []) {
    if (el.type === "way" && el.id === way.id) {
      for (const x of crossT(el.geometry.map((p) => tu(p.lon, p.lat)), 60)) if (axis === null || Math.abs(x.t) < Math.abs(axis)) axis = x.t;
      continue;
    }
    if (el.type !== "area" || el.tags?.man_made !== "bridge") continue;
    if (el.tags.layer !== undefined && Number(el.tags.layer) !== level) continue;
    const rings = [el.geometry, ...(el.holes || [])].map((r) => { const g = r.map((p) => tu(p.lon, p.lat)); return [...g, g[0]]; });
    const ts = rings.flatMap((r) => crossT(r, 60).map((x) => x.t)).sort((a, b) => a - b);
    for (let i = 0; i + 1 < ts.length; i += 2) if (ts[i + 1] - ts[i] > 0.05) raw.push({ s: ts[i], e: ts[i + 1] });
  }
  if (axis === null || !raw.length) return null;
  raw.sort((a, b) => a.s - b.s);
  const spans = [];
  for (const r of raw) { const l = spans.at(-1); if (l && r.s <= l.e + DECK_GAP) l.e = Math.max(l.e, r.e); else spans.push({ ...r }); }
  if (!spans.some((x) => x.s <= axis && axis <= x.e)) return null;
  return { spans, axis };
}
// The deck stretch holding t (within tol), or null.
export const deckAt = (decks, t, tol = 0) => decks?.spans.find((x) => x.s - tol <= t && t <= x.e + tol) || null;
// A stretch [a, b] of the cut less the decks: the pieces of it off them (the ground beside or between the decks). The
// water beside the outer deck ends the street at the deck's edge too (derive.js): keeping only the gap between two decks
// lost 6 of the blind A/B's wins for 2 of its losses (evaluation/archive/bridge-water/edge/REPORT.md).
export const offDecks = (a, b, decks) => {
  let out = [[a, b]];
  for (const d of decks?.spans || []) out = out.flatMap(([x, y]) => (d.e <= x || d.s >= y ? [[x, y]] : [...(d.s > x ? [[x, d.s]] : []), ...(d.e < y ? [[d.e, y]] : [])]));
  return out;
};

// A railing at the outer edge of a street on a bridge (Bára 26. 11. 2026: "ideálně dokreslila do profilu zábradlí"):
// an item "zabradli" at the outer side of the outermost part, where the profile ends at the deck's edge (ends.deck,
// or within RAIL_NEAR of it), or, with no deck mapped, where it ends in open space after a sidewalk or cycle track
// (derive.js ends a street on a bridge behind its outer sidewalk). Not where a building, a fence or water ends it, nor
// where a railing is already drawn there. result: deriveProfile's (segments left to right from extent[1] down to
// extent[0]); way: the clicked street; decks: deckSpans; ends: orthoOsmPolys' ends. Returns the sides given one.
// ?off=zabradli: none.
// The strip an estimate leaves unnamed ("nezname", "plocha") at the outer side of a street on a bridge, between its
// roadway and the end of the profile (the deck's edge or open space), is the bridge's sidewalk (Bára 27. 11. 2026:
// Augustusbrücke in Dresden, two metres of "Ostatní" at both edges, in fact sidewalks). Only the estimate's own strip
// (source "odhad", so still marked as an estimate), only beside a roadway part, up to BRIDGE_WALK_MAX m wide. Returns the
// number of strips changed (not on a motorway, motorroad or a way tagged without a sidewalk). ?off=mostchodnik: none.
const BRIDGE_WALK_MAX = 4.5, BRIDGE_WALK_FROM = new Set(["nezname", "plocha"]);
const BRIDGE_ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
export function bridgeWalks(result, way) {
  const t = way?.tags;
  if (P.off?.has("mostchodnik") || !onBridge(t) || !result?.segments?.length) return 0;
  // Not on a motorway or a motorroad, nor where OSM says there is no sidewalk: the strip is a verge there.
  if (/^motorway/.test(t.highway) || t.motorroad === "yes" || ["no", "none"].includes(t.sidewalk) || (["no", "none"].includes(t["sidewalk:left"]) && ["no", "none"].includes(t["sidewalk:right"]))) return 0;
  const segs = result.segments;
  let n = 0;
  for (const [i, inner] of [[0, 1], [segs.length - 1, segs.length - 2]]) {
    const s = segs[i], r = segs[inner];
    if (!s || !r || i === inner || s.source !== "odhad" || !BRIDGE_WALK_FROM.has(s.type) || !BRIDGE_ROADWAY.has(r.type) || s.width > BRIDGE_WALK_MAX) continue;
    s.type = "chodnik"; n++;
  }
  return n;
}
const RAIL_NEAR = 1.0, RAIL_PARTS = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "cyklostezka", "zelen", "plocha", "nastupiste"]);
export function bridgeRailings(result, way, decks, ends) {
  const out = [];
  if (P.off?.has("zabradli") || !onBridge(way?.tags) || !result?.extent || !result.segments?.length) return out;
  const segs = result.segments;
  for (const [side, edgeKey, seg, f, t] of [["B", "left", segs[0], 0, result.extent[1]], ["A", "right", segs.at(-1), 1, result.extent[0]]]) {
    const edge = result.edges?.[edgeKey];
    if (edge && edge !== "volno") continue;
    if ((seg.items || []).some((it) => it.kind === "zabradli" && Math.abs(it.f - f) < 0.25)) continue;
    const sg = side === "A" ? -1 : 1;
    const d = decks && deckAt(decks, t - sg * 0.5), edgeT = ends?.deck?.[side] ?? (d ? (sg > 0 ? d.e : d.s) : null);
    const atDeck = edgeT !== null && Math.abs(edgeT - t) <= RAIL_NEAR;
    const noDeck = !decks && RAIL_PARTS.has(seg.type);
    if (!atDeck && !noDeck) continue;
    (seg.items ||= []).push({ kind: "zabradli", f, bridge: true });
    out.push(side);
  }
  return out;
}
const sameLevel = (w, o) => levelOf(w.tags) === levelOf(o.own.tags);
// A railway track on the ground beside the street (Bára 27. 11. 2026, Rudolfstraße in Linz: the profile left the track
// out): OSM railway=rail, light_rail, narrow_gauge or subway at the street's level (not a tunnel or a bridge over or
// under it, not abandoned, disused or razed ones), running along it (within 35° of its direction). ?off=railway: none.
const RAIL_ALONG = 0.7; // |across| / |along| of the track's direction at the cut
export const heavyRail = (w, o) => !!RAIL_KINDS[w.tags.railway] && sameLevel(w, o) && !P.off?.has("railway") && (!w.d || Math.abs(w.d[0]) <= RAIL_ALONG * Math.abs(w.d[1]));
// Half the width of a track's bed (types.js RAIL_KINDS) and the most tracks one side takes (a station's yard is no street).
// A track farther than RAIL_GAP from the last thing of the street (its kerb or sidewalk) is no part of it (the first blind A/B,
// 27. 11. 2026: a track 16 m off behind trees drew a bed and moved the estimate's parking).
const RAIL_GAP = 10;
const railHalf = (w) => RAIL_KINDS[w.tags.railway][0] / 2, MAX_RAILS = 4;
// One track mapped twice (two ways on the same line, or a curve crossing the cut twice) counts once.
const railTracks = (ws) => ws.filter((w) => !ws.some((v) => v !== w && v.tags.railway === w.tags.railway && Math.abs(v.t - w.t) < 1.5 && (Math.abs(v.t - w.t) > 1e-9 ? v.t < w.t : v.id < w.id)));

// ---------- the carriageway OSM implies ----------
const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
const ONEWAY = (t) => t.oneway === "yes" || t.oneway === "1" || t.oneway === "-1" || t.junction === "roundabout" || t.highway === "motorway";
// Lane width by the road's class (the app's 3 m, wider on main roads, narrower in residential streets).
const LANE_W = { motorway: 3.5, trunk: 3.5, primary: 3.25, secondary: 3.25, tertiary: 3.0 };
export const laneWidth = (hw) => LANE_W[String(hw).replace("_link", "")] ?? 2.75;
// Parking at one side of the way (left / right of its drawing direction), the street-parking schemes old and new:
// its kind and how much of the carriageway it takes (m).
// Only parking on the carriageway counts (lane, street_side, half of half_on_kerb); no_parking, no_stopping, yes and
// the like take nothing. The old scheme: parking:lane:<side>=parallel|diagonal|perpendicular|marked with the place in
// parking:lane:<side>:<orientation>=on_street|half_on_kerb|on_kerb|lay_by.
const OLD_ORIENT = ["parallel", "diagonal", "perpendicular", "marked", "inline"];
function parkingSide(t, side) {
  const v = t[`parking:${side}`] ?? t["parking:both"], orient = t[`parking:${side}:orientation`] ?? t["parking:both:orientation"];
  const old = t[`parking:lane:${side}`] ?? t["parking:lane:both"];
  let kind = v ?? null, or = orient ?? "parallel";
  if (!kind && old) {
    if (OLD_ORIENT.includes(old)) {
      or = old === "marked" || old === "inline" ? "parallel" : old;
      const at = t[`parking:lane:${side}:${old}`] ?? t[`parking:lane:both:${old}`];
      kind = at === "on_kerb" ? "on_kerb" : at === "half_on_kerb" ? "half_on_kerb" : at === "lay_by" || at === "street_side" ? "street_side" : "lane";
    } else kind = old;
  }
  if (!["lane", "street_side", "half_on_kerb"].includes(kind)) return { kind, w: 0 };
  const full = or === "perpendicular" ? 5 : or === "diagonal" ? 4.5 : 2.0;
  return { kind, w: kind === "half_on_kerb" ? full / 2 : full, or };
}
// The orientation of the parking OSM has on the carriageway at a side of the way ("left", "right"): "parallel",
// "diagonal", "perpendicular", or null (none tagged, or on the kerb).
export function parkingOrient(t, side) {
  const p = parkingSide(t || {}, side);
  return p.w && p.kind !== "half_on_kerb" && ["parallel", "diagonal", "perpendicular"].includes(p.or) ? p.or : null;
}
const cyclewaySide = (t, side) => { const v = t[`cycleway:${side}`] ?? t["cycleway:both"] ?? t.cycleway; return v === "lane" || v === "share_busway" ? 1.5 : 0; };
// own: osmAlong's own. Returns { w, reach: { A, B } (from the axis), lanes, parking, sidewalk, sidewalkW, from }; side A
// of the cut is t < axis, the way's left is side B when it runs with u.
export function osmRoad(own) {
  const t = own.tags, ow = ONEWAY(t), hw = t.highway;
  const lanes = num(t.lanes) ?? (hw === "living_street" || hw === "pedestrian" || hw === "service" ? 1 : ow ? 1 : 2);
  const leftIs = own.along > 0 ? "B" : "A", rightIs = leftIs === "A" ? "B" : "A";
  const pl = parkingSide(t, "left"), pr = parkingSide(t, "right");
  const parking = { [leftIs]: pl.w, [rightIs]: pr.w }, parkKind = { [leftIs]: pl.kind, [rightIs]: pr.kind };
  const cyc = cyclewaySide(t, "left") + cyclewaySide(t, "right");
  const width = num(t.width);
  // A width tag between one lane and 40 m is the carriageway's width (it is meant so; sometimes it is the street's).
  const w = width && width >= 2.5 && width <= 40 ? width : Math.max(lanes, 1) * laneWidth(hw) + parking.A + parking.B + cyc;
  const sw = (side) => t[`sidewalk:${side}`] ?? t["sidewalk:both"] ?? (t.sidewalk === "both" || t.sidewalk === side ? "yes" : t.sidewalk === "no" || t.sidewalk === "none" ? "no" : t.sidewalk === "separate" ? "separate" : t.sidewalk === "left" || t.sidewalk === "right" ? "no" : null);
  const swW = (side) => num(t[`sidewalk:${side}:width`] ?? t["sidewalk:both:width"] ?? t["sidewalk:width"]);
  return { w, reach: { A: w / 2, B: w / 2 }, lanes, oneway: ow, parking, parkKind, sidewalk: { [leftIs]: sw("left"), [rightIs]: sw("right") }, sidewalkW: { [leftIs]: swW("left"), [rightIs]: swW("right") }, from: width ? "width" : num(t.lanes) ? "lanes" : "výchozí" };
}
// Tram tracks in the street: where OSM tracks cross the cut within the expected carriageway, it reaches at least
// 1.7 m past the outer track's axis (half a tram and a little).
export function withRails(road, o) {
  const axis = o.own.t, far = Math.max(road.reach.A, road.reach.B), rails = o.ways.filter((w) => w.tags.railway === "tram" && sameLevel(w, o) && Math.abs(w.t - axis) < far + 3.5);
  // A two-way street with its tracks in the roadway (embedded_rails) but not mapped apart: two tracks 3 m apart about
  // the axis, so the roadway reaches at least 1.5 + 1.7 m each way (Josefstädter Straße in 2019 read 4.7 m on the photo
  // and drew trams of 2.0 and 2.7 m; ?off=embedded2).
  if (!rails.length && o.own.tags.embedded_rails === "tram" && !ONEWAY(o.own.tags) && !P.off?.has("embedded2")) {
    const reach = { A: Math.max(road.reach.A, 3.2), B: Math.max(road.reach.B, 3.2) };
    return { ...road, reach, w: reach.A + reach.B, rails: 2, embeddedOnly: true };
  }
  if (!rails.length || (o.own.tags.embedded_rails === undefined && !rails.some((w) => Math.abs(w.t - axis) < far))) return road;
  const reach = { ...road.reach };
  for (const w of rails) { const side = w.t < axis ? "A" : "B"; reach[side] = Math.max(reach[side], Math.abs(w.t - axis) + 1.7); }
  return { ...road, reach, w: reach.A + reach.B, rails: rails.length };
}
// Where a kerb may lie on each side: up to the facade, 0.75 m short of a separately mapped sidewalk (its line is the
// sidewalk's middle), halfway to a partner carriageway (ways of the street's own level only); at most 25 m.
export function limits(o, axis) {
  const lim = { A: axis - 25, B: axis + 25 };
  const near = (side, t, back = 0) => { if (side === "A" && t < axis && t + back > lim.A) lim.A = t + back; if (side === "B" && t > axis && t - back < lim.B) lim.B = t - back; };
  for (const side of ["A", "B"]) if (o.facade[side] !== null) near(side, o.facade[side]);
  for (const w of o.ways) {
    if (!sameLevel(w, o)) continue;
    const hw = w.tags.highway, side = w.t < axis ? "A" : "B";
    if (hw === "footway" && w.tags.footway === "sidewalk") near(side, w.t, 0.75);
    if ((w.id === o.pairId || ["motorway", "trunk", "primary", "secondary", "tertiary"].includes(String(hw).replace("_link", "")) && w.tags.oneway === "yes") && Math.abs(w.t - axis) > 4) near(side, (w.t + axis) / 2);
    // Tracks between the street's two carriageways mapped as roads too (a tram bed: Radlinského): the kerb stays 1.7 m
    // off the nearer rail (only these: with all of Prague's tracks the regression lost a point).
    if (!P.off?.has("raillimit") && o.pairT !== undefined && w.tags.railway === "tram" && w.tags.highway && (w.t - axis) * (o.pairT - axis) > 0 && Math.abs(w.t - axis) < Math.abs(o.pairT - axis)) near(side, w.t, 1.7);
  }
  return lim;
}

// The other carriageway of a street of two one-way ones (Suché mýto in Bratislava; Bára 16. 11. 2026): the nearest
// one-way street way of the same level and name (unnamed: of the same class), 4 to 35 m from the clicked one. Its
// kerbs are read as the clicked one's; the strip between them is a median.
// How far the other carriageway of a street of two one-way ones may lie: 35 m / 40 m (`before`); 80 m with ?partner80=1
// (Bára 27. 11. 2026, Paseo de la Casa de Campo in Madrid). Off by default: the blind A/B of 43 changed cuts of 72 (two
// judges, only the aerial) gave 24 : 28 for 80 m, no gain (evaluation/archive/unification/amiens-far).
export const partnerReach = (before) => (P.partner80 ? 80 : before);
export function partnerOf(o) {
  const own = o.own, tg = own.tags;
  if (!ONEWAY(tg)) return null;
  const same = (w) => (tg.name ? w.tags.name === tg.name : String(w.tags.highway).replace("_link", "") === String(tg.highway).replace("_link", ""));
  const c = o.ways.filter((w) => STREET.test(w.tags.highway || "") && (P.off?.has("railpair") || !w.tags.railway) && ONEWAY(w.tags) && sameLevel(w, o) && same(w) && Math.abs(w.t - own.t) > 4 && Math.abs(w.t - own.t) < partnerReach(35));
  // Of the same class first (Bára 18. 11. 2026, Košická in Bratislava: the one-lane residential side road 8.5 m off
  // was taken for the other carriageway of the primary 9.9 m off, which then was left out; ?off=pairclass: nearest).
  const cls = (w) => String(w.tags.highway).replace("_link", "");
  const rank = (w) => (P.off?.has("pairclass") || cls(w) === cls(own) ? 0 : 1000) + Math.abs(w.t - own.t);
  return c.length ? c.reduce((a, b) => (rank(b) < rank(a) ? b : a)) : null;
}

// ---------- the image across the cut, per column ----------
// Per 5 m piece along the street (8 of them) the median brightness of each column; the column's median over them,
// its green share (G ≥ 10: treetops, lawns) and saturation. The kerb is a step of brightness (or of green) that holds
// along the street: in most of the pieces, with the same sign. st: laneImage's (L, G, S; t0, res, nt, nu).
const BLOCKS = 8;
export function columns(st) {
  const { nt, nu, res, t0, L, G, S } = st, bl = Array.from({ length: BLOCKS }, () => new Float32Array(nt));
  const medL = new Float32Array(nt), green = new Float32Array(nt), sat = new Float32Array(nt), seen = new Float32Array(nt), yel = new Float32Array(nt);
  const bs = Array.from({ length: BLOCKS }, () => new Float32Array(nt));
  const per = Math.floor(nu / BLOCKS);
  const v_seen = (i) => { let c = 0; for (let j = 0; j < BLOCKS * per; j++) if (!Number.isNaN(L[j * nt + i])) c++; return c; };
  for (let i = 0; i < nt; i++) {
    let gn = 0, n = 0; const sv = [];
    for (let b = 0; b < BLOCKS; b++) {
      const v = [];
      for (let j = b * per; j < (b + 1) * per; j++) {
        const q = j * nt + i, x = L[q];
        if (Number.isNaN(x)) continue;
        v.push(x);
        // Under the crown of a tree OSM knows the green is the tree, not a lawn (st.canopy; Václavské náměstí).
        if (!st.canopy?.[q]) { n++; if (G[q] >= 10) gn++; }
        if (j % 2 === 0) sv.push(S[q]);
      }
      bl[b][i] = v.length ? median(v) : NaN;
      const vs = [];
      for (let j = b * per; j < (b + 1) * per; j += 2) { const q = j * nt + i; if (!Number.isNaN(L[q])) vs.push(S[q]); }
      bs[b][i] = vs.length ? median(vs) : NaN;
    }
    medL[i] = median(Array.from(bl, (x) => x[i]));
    // Yellowness ((R+G)/2 − B; LITERATURE-2.md: dry grass is yellow, a shadow blue), where the image has it.
    if (st.Y) { const yv = []; for (let j = 0; j < nu; j += 2) { const q = j * nt + i; if (!Number.isNaN(L[q])) yv.push(st.Y[q]); } yel[i] = yv.length ? median(yv) : NaN; } else yel[i] = NaN;
    green[i] = n ? gn / n : st.canopy ? 0 : NaN; sat[i] = median(sv); seen[i] = v_seen(i) / nu;
  }
  // A blank stretch (the image's edge of coverage: white or black and flat along the street, a metre wide or more) is
  // not seen: no road there and no kerb at its edge. A painted line is narrower.
  const flat = (i) => {
    let n = 0, s = 0, s2 = 0;
    for (let j = 0; j < nu; j += 3) { const x = L[j * nt + i]; if (Number.isNaN(x)) continue; n++; s += x; s2 += x * x; }
    if (!n) return false;
    const m = s / n;
    return (m >= 248 || m <= 5) && Math.sqrt(Math.max(0, s2 / n - m * m)) < 2;
  };
  const isFlat = Uint8Array.from({ length: nt }, (_, i) => (flat(i) ? 1 : 0)), wide = Math.round(1 / res);
  for (let i = 0; i < nt;) {
    if (!isFlat[i]) { i++; continue; }
    let e = i;
    while (e < nt && isFlat[e]) e++;
    if (e - i >= wide) for (let q = i; q < e; q++) seen[q] = 0;
    i = e;
  }
  // Edges between columns i-1 and i: the signed difference of the pieces' brightness across ±d, its median over the
  // pieces, times the share of pieces that agree in sign; plus the step of green. Relative to the typical change.
  const d = Math.max(1, Math.round(0.25 / res)), edge = new Float32Array(nt + 1);
  for (let i = d; i <= nt - d; i++) {
    const diffs = [];
    for (let b = 0; b < BLOCKS; b++) {
      let a = 0, c = 0, na = 0, nc = 0;
      for (let k = 0; k < d; k++) { const x = bl[b][i - 1 - k], y = bl[b][i + k]; if (!Number.isNaN(x)) { a += x; na++; } if (!Number.isNaN(y)) { c += y; nc++; } }
      if (na && nc) diffs.push(c / nc - a / na);
    }
    if (diffs.length < 4) continue;
    const m = median(diffs), agree = diffs.filter((x) => Math.sign(x) === Math.sign(m) && Math.abs(x) >= 3).length / diffs.length;
    let ga = 0, gc = 0;
    for (let k = 0; k < d; k++) { ga += green[i - 1 - k] || 0; gc += green[i + k] || 0; }
    edge[i] = Math.abs(m) * agree + 60 * Math.abs(gc - ga) / d;
  }
  const typical = median(Array.from(edge).filter((x) => x > 0)) || 1;
  const E = Float32Array.from(edge, (x) => x / typical);
  // A change of surface (Bára 19. 11. 2026: the sidewalk's edge to the grass is plain to see, more than its kerb): in
  // brightness and in saturation, each against its own typical step on this image (no absolute values: seasons,
  // climates, orthophotos differ), per 5 m piece the largest step within ±0.3 m (an edge of front gardens is not
  // ruler-straight), the median over the pieces (it holds along the street). Ec, relative to its own typical value.
  const shift = Math.round(0.3 / res), stepAt = (arr, b, i) => {
    let a = 0, c = 0, na = 0, nc = 0;
    for (let k = 0; k < d; k++) { const x = arr[b][i - 1 - k], y = arr[b][i + k]; if (!Number.isNaN(x)) { a += x; na++; } if (!Number.isNaN(y)) { c += y; nc++; } }
    return na && nc ? Math.abs(c / nc - a / na) : NaN;
  };
  const allL = [], allS = [];
  for (let i = d; i <= nt - d; i += 2) for (let b = 0; b < BLOCKS; b++) { const x = stepAt(bl, b, i), y = stepAt(bs, b, i); if (x > 0) allL.push(x); if (y > 0) allS.push(y); }
  const tL = median(allL) || 1, tS = median(allS) || 1, ec = new Float32Array(nt + 1);
  for (let i = d + shift; i <= nt - d - shift; i++) {
    const per5 = [];
    for (let b = 0; b < BLOCKS; b++) {
      let best = NaN;
      for (let q = i - shift; q <= i + shift; q++) { const v = (stepAt(bl, b, q) || 0) / tL + (stepAt(bs, b, q) || 0) / tS; if (!(v <= best)) best = v; }
      if (Number.isFinite(best)) per5.push(best);
    }
    if (per5.length >= 4) ec[i] = median(per5);
  }
  const typicalC = median(Array.from(ec).filter((x) => x > 0)) || 1;
  const Ec = Float32Array.from(ec, (x) => x / typicalC);
  return { nt, res, t0, medL, green, sat, seen, yel, E, Ec, tL, tS, ti: (t) => Math.round((t - t0) / res), tOf: (i) => t0 + i * res };
}
// Half the width of a tram bed beyond its outer track axis (a 3.3 m track, as derive.js carveTramTracks).
const TRACK_HALF = 1.75;
// The roadway at the axis (±1.5 m, not green): its brightness and saturation; does column i look like it?
export const P = { tolL: 0.2, tolS: 18, greenMax: 0.3, minEdge: 1.6, alpha: 1.5, beta: 0.5, gamma: 0.8, sigmaMin: 1.0, sigmaRel: 0.3, lineOff: 0.4, mapBonus: 0.8, cars: false, axisroad: true };
export function roadRef(cols, axis) {
  const i0 = cols.ti(axis - 1.5), i1 = cols.ti(axis + 1.5), L = [], S = [];
  for (let i = Math.max(0, i0); i <= Math.min(cols.nt - 1, i1); i++) if (cols.green[i] < 0.3) { L.push(cols.medL[i]); S.push(cols.sat[i]); }
  return { L: median(L), S: median(S) };
}
export const roadLike = (cols, ref, i) => cols.green[i] < P.greenMax && Math.abs(cols.medL[i] - ref.L) <= Math.max(14, P.tolL * ref.L) && Math.abs(cols.sat[i] - ref.S) <= P.tolS;

// ---------- the kerbs (M2) ----------
// Candidates: local maxima of the edge strength (≥ minEdge) between 1 m from the axis and the limits, and a kerb lineOff
// beyond each strong line near where OSM expects the kerb (the edge line, V 4). Score: the edge (saturating) + alpha ×
// the share of road-like columns between the axis and it − gamma × that share in the metre beyond it − beta ×
// ((distance − expected) / sigma)²; expected = OSM's reach on that side. Returns { A, B, why: { A, B } } or null.
// edges: where the lines of a town's technical map (an edge of a kerb, of a sidewalk; towns/slovakia.js) cross the
// cut: each is a candidate too, mapBonus better than an edge of the image alone.
export function kerbs(cols, axis, lim, road, lines = [], edges = []) {
  const ref = roadRef(cols, axis), out = {}, why = {};
  if (!Number.isFinite(ref.L)) return null;
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const exp = road.reach[side] * (P.expScale ?? 1), sigma = Math.max(P.sigmaMin, P.sigmaRel * exp);
    const lo = sg < 0 ? Math.max(lim.A, cols.t0 + 0.3) : axis + 1, hi = sg < 0 ? axis - 1 : Math.min(lim.B, cols.t0 + cols.nt * cols.res - 0.3);
    const cand = [], w = Math.round(0.3 / cols.res);
    for (let i = Math.max(1, cols.ti(lo)); i <= Math.min(cols.E.length - 2, cols.ti(hi)); i++) {
      if (cols.E[i] < P.minEdge) continue;
      let top = true;
      for (let q = i - w; q <= i + w; q++) if (q !== i && cols.E[q] > cols.E[i]) { top = false; break; }
      if (top) cand.push({ i, from: "hrana" });
    }
    for (const l of lines) {
      const t = l + sg * P.lineOff;
      if ((sg < 0 ? l < axis : l > axis) && t > lo && t < hi && Math.abs(Math.abs(t - axis) - exp) < 2.5 * sigma) cand.push({ i: cols.ti(t), from: "čára" });
    }
    for (const t of edges) if (t > lo && t < hi && Math.abs(Math.abs(t - axis) - exp) < 2.5 * sigma) cand.push({ i: cols.ti(t), from: "mapa" });
    // Not at the edge of what the image shows (within 0.6 m of a column not seen).
    const near = Math.round(0.6 / cols.res), atEdge = (i) => { for (let q = i - near; q <= i + near; q++) if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) return true; return false; };
    let best = null;
    for (const c of cand) {
      if (atEdge(c.i)) continue;
      const ia = cols.ti(axis), span = sg < 0 ? [c.i, ia] : [ia, c.i];
      let n = 0, ok = 0;
      for (let q = span[0]; q < span[1]; q++) { if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; n++; if (roadLike(cols, ref, q)) ok++; }
      let nb = 0, okb = 0;
      for (let k = 1; k <= Math.round(1 / cols.res); k++) { const q = sg < 0 ? c.i - k : c.i + k - 1; if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; nb++; if (roadLike(cols, ref, q)) okb++; }
      const dist = Math.abs(cols.tOf(c.i) - axis), e = Math.min(cols.E[c.i] ?? 0, 12);
      const score = e / (e + 3) + P.alpha * (n ? ok / n : 0) - P.gamma * (nb ? okb / nb : 0) - P.beta * ((dist - exp) / sigma) ** 2 + (c.from === "mapa" ? P.mapBonus : 0);
      if (!best || score > best.score) best = { score, t: cols.tOf(c.i), from: c.from };
    }
    // No candidate at all: OSM's expectation.
    out[side] = best ? best.t : sg < 0 ? Math.max(lim.A + 0.5, axis - exp) : Math.min(lim.B - 0.5, axis + exp);
    why[side] = best ? best.from : "osm";
  }
  out.why = why;
  return out;
}
// Is there anything to read on the image: mostly seen (not outside the source's coverage), not one flat colour (a
// blank or white answer), not black or white all over?
export function usable(st) {
  if (!st?.L?.length) return false;
  let n = 0, seen = 0, sum = 0, sq = 0;
  for (let q = 0; q < st.L.length; q += 7) { n++; const v = st.L[q]; if (Number.isNaN(v)) continue; seen++; sum += v; sq += v * v; }
  if (seen < 0.5 * n) return false;
  const mean = sum / seen, sd = Math.sqrt(Math.max(0, sq / seen - mean * mean));
  return sd >= 4 && mean > 5 && mean < 245;
}
// Kerbs on the image st (laneImage's), for the street o (osmAlong) and its road (osmRoad, withRails). Without a usable
// image, or when the roadway at the axis cannot be seen (treetops over it): where OSM expects them (why "osm", image
// false). mapRuns: the surface map's runs along the cut where it has some but none at the axis (derive.js runs): its
// sidewalks and buildings bound the kerbs, the estimate does not cover what the map measured.
const MAP_BOUND = (c) => c === 702 || c === 703 || c === 600 || c === 601 || c === 604;
export function kerbsOnImage(st, o, road, mapRuns = [], edges = []) {
  const axis = o.own.t, lim = limits(o, axis);
  for (const r of mapRuns) {
    if (!MAP_BOUND(r.code)) continue;
    if (r.e <= axis && r.e > lim.A) lim.A = r.e;
    if (r.s >= axis && r.s < lim.B) lim.B = r.s;
  }
  const byOsm = { A: Math.max(lim.A + 0.5, axis - road.reach.A), B: Math.min(lim.B - 0.5, axis + road.reach.B), why: { A: "osm", B: "osm" }, lim, cols: null, image: false };
  // Without the image a line of the map near where OSM expects the kerb (within 2 m) is the kerb.
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const exp = road.reach[side], near = edges.filter((t) => sg * (t - axis) > 1 && (sg < 0 ? t > lim.A : t < lim.B) && Math.abs(Math.abs(t - axis) - exp) < 2)
      .sort((x, y) => Math.abs(Math.abs(x - axis) - exp) - Math.abs(Math.abs(y - axis) - exp));
    if (near.length) { byOsm[side] = near[0]; byOsm.why[side] = "mapa"; }
  }
  if (!usable(st)) return byOsm;
  const end = st.t0 + st.nt * st.res;
  const lo = Math.max(lim.A, st.t0 + 0.5), hi = Math.min(lim.B, end - 0.5);
  const lines = hi - lo > 4 ? strongLines(st, lo + 1.5, hi - 1.5) : [];
  const cols = columns(st);
  const k = kerbs(cols, axis, lim, road, lines, edges);
  if (!k) return { ...byOsm, cols };
  return { ...k, lim, cols, image: k.why.A !== "osm" || k.why.B !== "osm" };
}

// ---------- parked cars ----------
// A row of parked cars along a kerb (Bára: Kozia, Drevená took them for the sidewalk; Hlavná, Vojtecha Spanyola had
// parking estimated where no car stands): along the street the strip's brightness changes car by car (roofs,
// windows, shadows, gaps), the roadway's beside them stays even. The strip [a, b] across the cut: the spread along the
// street of its mean brightness, against the same of a strip of roadway by the axis.
const CAR_W = 2.0, CAR_SPREAD = 14, CAR_RATIO = 1.8;
const LOCAL_STREET = new Set(["residential", "living_street", "service", "unclassified", "tertiary"]);
function alongSpread(st, a, b) {
  const i0 = Math.max(0, Math.round((a - st.t0) / st.res)), i1 = Math.min(st.nt - 1, Math.round((b - st.t0) / st.res));
  if (i1 - i0 < 3) return NaN;
  const rows = [];
  for (let j = 0; j < st.nu; j++) {
    let sum = 0, n = 0;
    for (let i = i0; i <= i1; i++) { const v = st.L[j * st.nt + i]; if (!Number.isNaN(v)) { sum += v; n++; } }
    if (n > (i1 - i0) / 2) rows.push(sum / n);
  }
  if (rows.length < st.nu / 2) return NaN;
  // Over 1 m pieces along the street (a car is 4–5 m): the spread of their means.
  const per = Math.max(1, Math.round(1 / st.res)), m = [];
  for (let j = 0; j + per <= rows.length; j += per) m.push(rows.slice(j, j + per).reduce((x, y) => x + y, 0) / per);
  const mean = m.reduce((x, y) => x + y, 0) / m.length;
  return Math.sqrt(m.reduce((x, y) => x + (y - mean) ** 2, 0) / m.length);
}
// Parked cars told by their colours (Bára 19. 11. 2026: "když tam stojí dost aut, musí to vychýlit histogram toho pásu"):
// per metre along the street the strip's mean saturation; cars of all colours and the gaps between them make it vary
// (spread ≥ CAR_SAT_SD), a shadow (dark, CAR_DARK) or treetops (green, CAR_GREEN) do not count. Checked by eye on 125
// kerb strips of Prague and Brno (evaluation/ortho-osm/CARS.md): 13 found, none false; the brightness spread alone
// (carsSeen) fired as often on shadows and trees.
const CAR_SAT_SD = 10, CAR_DARK = 0.15, CAR_GREEN = 0.05;
export function carsColoured(st, a, b) {
  if (!usable(st) || !st.S || !st.G) return false;
  const i0 = Math.max(0, Math.round((Math.min(a, b) - st.t0) / st.res)), i1 = Math.min(st.nt - 1, Math.round((Math.max(a, b) - st.t0) / st.res));
  const per = Math.max(1, Math.round(1 / st.res)), sat = [];
  let n = 0, dark = 0, green = 0;
  for (let j0 = 0; j0 + per <= st.nu; j0 += per) {
    let s = 0, m = 0;
    for (let j = j0; j < j0 + per; j++) for (let i = i0; i <= i1; i++) {
      const q = j * st.nt + i, v = st.L[q];
      if (Number.isNaN(v)) continue;
      m++; s += st.S[q]; if (v < 50) dark++; if (st.G[q] >= 10) green++;
    }
    n += m;
    if (m) sat.push(s / m);
  }
  if (sat.length < 10 || !n) return false;
  const mean = sat.reduce((x, y) => x + y, 0) / sat.length, sd = Math.sqrt(sat.reduce((x, y) => x + (y - mean) ** 2, 0) / sat.length);
  return sd >= CAR_SAT_SD && dark / n <= CAR_DARK && green / n <= CAR_GREEN;
}
export function carsSeen(st, a, b, axis) {
  if (!usable(st)) return false;
  const strip = alongSpread(st, a, b), road = alongSpread(st, axis - 0.8, axis + 0.8);
  return Number.isFinite(strip) && strip >= CAR_SPREAD && strip >= CAR_RATIO * (Number.isFinite(road) ? road : 0);
}

// ---------- the surfaces for derive.js ----------
// The MTVU codes the profile knows: 701 the roadway, 702 a sidewalk, 1003 a paved area, 601 a building. A sidewalk runs
// from the kerb to the facade, at most SIDEWALK_MAX (the rest greenery where the image is mostly green, else a
// paved area up to REST_MAX m, else nothing); with no facade within reach, only where OSM tags one (sidewalk:width,
// else the default SIDEWALK m), then nothing (the profile ends there). Where OSM says there is no sidewalk the space
// is treated as that rest.
// PIECE_GREEN: a piece between two lines of a town's map is green from this share of green columns (treetops over a
// sidewalk make some).
const PIECE_GREEN = 0.35, AREA_GREEN = 0.2;
// The narrowest sidewalk the image may end (from the kerb) and the stretch of green that ends it (m).
const WALK_MIN = 1.0, WALK_WIN = 1.0, WALK_SAT = 8, WALK_LIGHT = 100, AI_RUN = 1.0, AI_SNAP = 0.6, SPLIT_MIN = 1.5;

const BACK_MIN = 2; // m: the shortest run of green or paving the image may give behind everything else
// m: a deck edge nearer the kerb (or inside the roadway) does not end the street: OSM drew the roadway only, or roughly
// (e-18, e-13: sidewalks of 0.34 and 0.82 m left)
const DECK_MIN = 1.0;
// m: the axis of the street's other carriageway on a deck of its own at most this far past the kerb (Route des Jeunes,
// e-43: its twin 35 m off, beyond a motorway's two decks, is not the same cross-section)
const TWIN_DECK = 20;
const LAST_WALK = 15, LAST_NONE = 2; // m: the next thing of the street at most this far on; with none, this past the kerb
const ALONG = 10, SIDEWALK = 2.5, SIDEWALK_MAX = 6, REST_MAX = 12, HOUSE = 5, GREEN_AREA = 0.1; // evaluation/ortho-osm/green.mjs: on ČÚZK 12.5 cm 67 % (Prague) and 82 % (Brno) of the metres right
const STREET = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|road)(_link)?$/;
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
  if (o.own.tags.railway && !P.off?.has("tramway")) {
    const name = o.own.tags.name;
    const road = o.ways.filter((w) => !w.tags.railway && STREET.test(w.tags.highway || "") && w.tags.highway !== "service" && sameLevel(w, o) && (!name || w.tags.name === name) && Math.abs(w.t - o.own.t) < 12)
      .sort((a, b) => Math.abs(a.t - o.own.t) - Math.abs(b.t - o.own.t))[0];
    if (road) o = { ...o, own: road, ways: [...o.ways.filter((w) => w !== road), o.own] };
  }
  // Where the map's lines cross the cut (t), on the cut's line and a metre either side (a line may end just at it).
  const edgeT = [...new Set(edges.flatMap((path) => [0, -1, 1].flatMap((u0) => crossT(path.map(([lo, la]) => tu(lo, la)), 45, u0).map((x) => Math.round(x.t * 20) / 20))))].sort((a, b) => a - b);
  const pair = P.off?.has("pair") ? null : partnerOf(o);
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
  // (Bára 17. 11. 2026, Václavské náměstí: paving under the crowns read as grass; ?off=koruny).
  if (st && !P.off?.has("koruny")) st = { ...st, canopy: canopyMask(st, osm, tu) };
  const road = withRails(mapWidth(osmRoad(o.own), o.own.t), o), k = kerbsOnImage(st, o, road, mapRuns, edgeT);
  const byAi = ai?.(o.own.t);
  if (byAi) {
    const A = Math.max(byAi.A, k.lim?.A ?? -Infinity), B = Math.min(byAi.B, k.lim?.B ?? Infinity);
    if (B - A >= 2 && A < o.own.t && o.own.t < B) { k.A = A; k.B = B; k.why = { A: "ai", B: "ai" }; k.image = true; }
  }
  if (!Number.isFinite(k.A) || !Number.isFinite(k.B) || k.B - k.A < 2) return null;
  // No kerb across a track: with trams in the roadway it reaches at least as far as withRails says (?off=embedded2).
  if (road.embeddedOnly && !P.off?.has("embedded2")) { k.A = Math.min(k.A, o.own.t - road.reach.A); k.B = Math.max(k.B, o.own.t + road.reach.B); }
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
  // Parked cars at the outer kerbs: inside the carriageway (its own stalls, drawn before it: the first surface wins)
  // or beyond the kerb the image found (the cars were taken for the edge: the kerb lies 2 m further out).
  const cars = [], carsOut = {};
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (pair && side === (pair.t < o.own.t ? "A" : "B")) continue; // towards the other carriageway: a median, no kerb
    // Off (P.cars false): the regression of 16. 11. 2026 (evaluation/ortho-osm/regression.mjs) found it adding parking
    // where none is (Prague 33 against 5, Brno 52 against 7), as the hand detector of evaluation/orthophoto/CARS-DL.md
    // (56 % precision: shadows, trees, roofs); a trained detector there did far better but its licence does not fit.
    // P.carsColour (?auta=1, 19. 11. 2026): by their colours (carsColoured), in local streets only (on main roads moving
    // cars colour the lanes too); off: the regression found Prague's kerbs a little better (median 1.00 → 0.90 m) but
    // Brno's sidewalks on ČÚZK worse (1.05 → 1.15 m) and on IPR's 10 cm more parking MTVU has not (6 → 16; tuned on
    // ČÚZK, and MTVU lacks most parking in the roadway). P.cars: the brightness rule of before, everywhere.
    const seen = P.cars ? (a, b) => carsSeen(st, a, b, o.own.t) : P.carsColour && LOCAL_STREET.has(o.own.tags.highway) ? (a, b) => carsColoured(st, a, b) : null;
    if (!seen) continue;
    const kb = k[side];
    if (seen(...(sg < 0 ? [kb, kb + CAR_W] : [kb - CAR_W, kb]))) cars.push(rect(704, "stání (auta na ortofotu)", ...(sg < 0 ? [kb, kb + CAR_W] : [kb - CAR_W, kb])));
    else if (seen(...(sg < 0 ? [kb - CAR_W, kb] : [kb, kb + CAR_W]))) {
      cars.push(rect(704, "stání (auta na ortofotu)", ...(sg < 0 ? [kb - CAR_W, kb] : [kb, kb + CAR_W])));
      carsOut[side] = kb + sg * CAR_W;
    }
  }
  const polys = [...cars, rect(701, "vozovka (ortofoto a OSM)", k.A, k.B)];
  polys.cars = cars.length;
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
  // stretches below, so it wins where both would be. P.off "osmbike": off (the A/B).
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (P.off?.has("osmbike")) break;
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
    // A lawn of the national map only where the image shows green across the cut too (Bára: Štúrova in Nitra, ZBGIS's
    // lawn over the sidewalk by the house): its stretches on the cut against the roadway's own green.
    // Off unless P.areaGreen: the A/B of 16. 11. 2026 on 91 cuts changed 9, Štúrova no better (its sidewalk by the house
    // stays unseen) and Mudroňova lost the lawn ZBGIS had right.
    if (f.attributes.CTVUK_KOD === 401 && k.cols && P.areaGreen) {
      const ts = (f.geometry?.rings || []).flatMap((r) => crossT(r.map(([lo, la]) => tu(lo, la)), 45).map((x) => x.t)).sort((x, y) => x - y);
      const g = [];
      for (let q = 0; q + 1 < ts.length; q += 2) for (let i = k.cols.ti(ts[q]); i < k.cols.ti(ts[q + 1]); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
      const road = (() => { const r = []; for (let i = k.cols.ti(o.own.t - 1.5); i <= k.cols.ti(o.own.t + 1.5); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) r.push(k.cols.green[i]); return r.length ? r.reduce((x, y) => x + y, 0) / r.length : 0; })();
      if (g.length && g.reduce((x, y) => x + y, 0) / g.length < road + AREA_GREEN) continue;
    }
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
  // Where a paved stretch from the kerb reaches the cap (SIDEWALK_MAX), the sidewalk's edge was not found: the
  // strongest change of surface on the image (columns Ec) between SPLIT_MIN and the cap, if it is at least
  // P.splitMin (Bára 19. 11. 2026: "když nám vyjde 6 m, je to skoro jistě blbě; hledat dodatečné hrany"). A trial
  // (P.split6, off): without the model 204 of 381 sides reach the cap, the split moves sidewalk F1 by ±1 pp
  // (regression); with the model's surfaces only 4 of 229 sides in Brno reach it, nothing changes.
  const splitAt = (kerb, sg) => {
    const c = k.cols;
    if (!c?.Ec || !P.split6) return null;
    let best = null;
    for (let i = c.ti(kerb + sg * SPLIT_MIN); sg > 0 ? i <= c.ti(kerb + sg * SIDEWALK_MAX) : i >= c.ti(kerb + sg * SIDEWALK_MAX); i += sg > 0 ? 1 : -1)
      if (i > 0 && i < c.nt && c.Ec[i] >= (P.splitMin ?? 3) && c.Ec[i] >= (c.Ec[i - 1] || 0) && c.Ec[i] >= (c.Ec[i + 1] || 0) && (best === null || c.Ec[i] > c.Ec[best])) best = i;
    return best === null ? null : c.tOf(best);
  };
  let edgeUsed = k.why.A === "mapa" || k.why.B === "mapa" || (k2 && (k2.why.A === "mapa" || k2.why.B === "mapa"));
  // The median between the two carriageways: greenery where the image is mostly green, else a paved strip.
  if (k2) {
    const [a, b] = pSide === "A" ? [k2.B, k.A] : [k.B, k2.A];
    if (b - a >= 0.3) {
      const g = [];
      if (k.cols) for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
      // Tram tracks of OSM in it: the street's tram bed (as MTVU's 705: derive.js makes its tracks).
      let rails = P.off?.has("tramway") ? [] : o.ways.filter((w) => w.tags.railway === "tram" && sameLevel(w, o) && w.t > a && w.t < b);
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
      // surface (Werichova in 2022, the whole 36 m between the carriageways became two trams of 18 m; ?off=bedwidth).
      if (rails.length && !P.off?.has("bedwidth")) {
        const ts = rails.map((w) => w.t).sort((x, y) => x - y), lo = Math.max(a, ts[0] - bedHalf), hi = Math.min(b, ts[ts.length - 1] + bedHalf);
        if (lo - a >= 0.5) polys.push(greenOr(a, lo)); else if (lo > a) polys.push(rect(bedCode, bedLabel, a, lo));
        polys.push(rect(bedCode, bedLabel, lo, hi));
        if (b - hi >= 0.5) polys.push(greenOr(hi, b)); else if (b > hi) polys.push(rect(bedCode, bedLabel, hi, b));
      } else if (rails.length) polys.push(rect(bedCode, bedLabel, a, b));
      else polys.push(greenOr(a, b));
    }
  }
  // Where a side without a house ends (Bára 17. 11. 2026, Smetanovo nábřeží: the profile ran on over the ground below
  // the street on both sides): at the first steps (a change of level), fence or wall OSM maps across the cut beyond the
  // kerb, or the fenced edge of a park; null: as before (?off=konec).
  // Where the carriageway OSM says ends on a side (its lanes' width about the axis): a track beyond it is no embedded one,
  // whatever kerb the image found (the track's bed reads as roadway on it).
  const edgeOf = (side) => { const out = k2 && side === pSide; return (out ? pair.t : o.own.t) + (side === "A" ? -1 : 1) * (out ? road2 : road).reach[side]; };
  const ends = { A: null, B: null }, hard = { A: null, B: null }, chain = { A: [], B: [] }, reached = { A: null, B: null };
  const FILL_OFF = !!P.off?.has("vyplnkonec");
  if (!P.off?.has("konec")) for (const [side, sg] of [["A", -1], ["B", 1]]) {
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
    // A sidewalk mapped apart is drawn as one. ?off=zachodnikem: as before (to the reach).
    if (P.off?.has("zachodnikem")) continue;
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
    if (FILL_OFF && lastW && ["footway", "path"].includes(lastW.tags.highway) && sg * (lastW.t - kerbT) > SIDEWALK / 2) {
      const a = lastW.t - sg * SIDEWALK / 2, b = lastW.t + sg * SIDEWALK / 2;
      polys.push(rect(702, "chodník (OSM, zvlášť)", ...(sg < 0 ? [b, a] : [a, b])));
    }
  }
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    // Beyond the other carriageway its kerb and its sidewalk tags count.
    const out = k2 && side === pSide, rd = out ? road2 : road;
    const kerb = out ? k2[side] : carsOut[side] ?? k[side], f = o.facade[side], says = rd.sidewalk[side];
    const far = f !== null ? f : says === "no" ? null : says || rd.sidewalkW[side] ? kerb + sg * (rd.sidewalkW[side] || SIDEWALK) : null;
    reached[side] = far !== null && sg * (far - kerb) >= 0.3 ? far : kerb;
    if (far === null || sg * (far - kerb) < 0.3) continue;
    const span = (x, y) => (sg < 0 ? [y, x] : [x, y]);
    // A sidewalk of at most SIDEWALK_MAX; the rest up to the house is some other area (a front garden, a yard, a lawn:
    // MTVU in Prague and Brno: 34 of 42 such stretches over 6 m hold a sidewalk of at most 6 m).
    // P.walkCap (evaluation/ai-segmentation, 18. 11. 2026): a smaller cap for trials. 2.5 m fixed the sidewalks of up to
    // 3.5 m (Brno within 1 m 31 → 59 %) but cut the wide ones (over 3.5 m: Brno 55 → 18 %, Prague 36 → 27 %), so the
    // app keeps SIDEWALK_MAX: telling a sidewalk from other paving needs the image, not a number.
    // A cap by the street's class (Bára 19. 11. 2026, the worst sidewalks of the regression: a local street's 6 m to
    // the house is a narrow sidewalk and then a forecourt, a parking bay or a lawn; the main streets' are wide).
    // Off since the same day: "within 1 m" of the width rewarded any narrow cap (1 m everywhere came out best, Bára:
    // "nemáš to trochu biasované?"); the sidewalk metre by metre (F1) does not move: regression Prague 62 → 60 %, Brno
    // 57 → 57 %, hold-out −1 [−2, 0] pp. ?chodnik=2.5,3.5,5 (app.js) or P.walkCapBy: trials.
    const capBy = P.off?.has("walkcapby") ? {} : P.walkCapBy ?? {};
    const cap = capBy[o.own.tags?.highway] ?? P.walkCap ?? SIDEWALK_MAX;
    let swEnd = says === "no" ? kerb : Math.abs(far - kerb) > cap ? kerb + sg * cap : far;
    if (says !== "no" && Math.abs(far - kerb) > cap && cap >= SIDEWALK_MAX) { const t = splitAt(kerb, sg); if (t !== null) swEnd = t; }
    // Lines of the map across the stretch from the kerb to the house (not the house's own front): its pieces, each a
    // sidewalk or green by the image (Bára, Štúrova in Piešťany: the sidewalks lie by the houses, the green strip by
    // the kerb) or by the map's symbol in it. Without such lines a sidewalk from the kerb as before.
    const roadGreen = (() => { if (!k.cols) return 0; const g = []; for (let i = k.cols.ti(o.own.t - 1.5); i <= k.cols.ti(o.own.t + 1.5); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]); return g.length ? g.reduce((x, y) => x + y, 0) / g.length : 0; })();
    const cuts = says === "no" || P.off?.has("pieces") ? [] : edgeT.filter((t) => sg * (t - kerb) >= 1 && sg * (far - t) > 0.5).sort((x, y) => sg * (x - y));
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
        // streets: 8 sidewalks of 9–18 m between the town map's lines; P.off "pieceMax": as before).
        const wide = !green && b - a > SIDEWALK_MAX && !P.off?.has("pieceMax");
        if (q === ends.length - 2 && b - a > SIDEWALK_MAX) rest(a, b);
        else if (wide && q === 0) { const m = kerb + sg * SIDEWALK_MAX, [c, d] = span(kerb, m), [e, h] = span(m, ends[1]); put(rect(702, "chodník (ortofoto a mapa)", c, d)); rest(e, h); }
        else if (wide) rest(a, b);
        else put(green ? rect(401, "zeleň (ortofoto a mapa)", a, b) : rect(702, "chodník (ortofoto a mapa)", a, b));
      }
    } else if (aiSurf && P.aiWalk && !P.off?.has("aiwalk")) {
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
      // up to the house; the hold-out, Rudolf-Reusch-Straße, Pestalozzistraße). ?off=aiwalkcap: as the model says.
      if (!P.off?.has("aiwalkcap")) {
        let lim = kerb + sg * (P.aiWalkMax ?? SIDEWALK_MAX);
        const first = runs[0];
        if (first?.c === 702 && sg * (first.e - lim) > -0.05) { const t = splitAt(kerb, sg); if (t !== null) lim = t; }
        const out = [];
        for (const r of runs) {
          if (r.c !== 702 || sg * (r.e - lim) <= 0) { out.push(r); continue; }
          if (sg * (r.s - lim) >= 0) { out.push({ ...r, c: 1003 }); continue; }
          out.push({ ...r, e: lim }, { c: 1003, s: lim, e: r.e });
        }
        runs.splice(0, runs.length, ...out);
      }
      // P.aiSnap (a trial): each boundary between two of the model's runs moved to the strongest change of surface on
      // the image (columns Ec) within ±AI_SNAP, if there is one of at least P.aiSnapMin (the model draws by 20 cm
      // pixels and its boundary wanders; the line between the sidewalk and the lawn is often plain on the photo).
      if (P.aiSnap && k.cols?.Ec) for (let q = 0; q + 1 < runs.length; q++) {
        const b = runs[q].e, c = k.cols;
        let best = null;
        for (let i = c.ti(b - AI_SNAP); i <= c.ti(b + AI_SNAP); i++) if (i > 0 && i < c.nt && c.Ec[i] >= (P.aiSnapMin ?? 3) && (!best || c.Ec[i] > c.Ec[best])) best = i;
        if (best !== null) { const t = c.tOf(best); if (sg * (t - runs[q].s) > 0.3 && sg * (runs[q + 1].e - t) > 0.3) runs[q].e = runs[q + 1].s = t; }
      }
      const LBL = { 702: "chodník (AI)", 401: "zeleň (AI)", 1003: "zpevněná plocha (AI)" };
      for (const r of runs) polys.push(rect(r.c, LBL[r.c], ...span(r.s, r.e)));
    } else {
      // The sidewalk ends where the image turns green for good (Bára 18. 11. 2026, Za Kalváriou in Prešov: a 1.4 m
      // sidewalk by the kerb, then lawn and trees up to the house, was drawn 6 m wide: the cap, not the image). From
      // WALK_MIN off the kerb on, the first WALK_WIN that is green as a piece between map lines is (PIECE_GREEN over
      // the roadway's own share) ends it, if the next WALK_WIN is green too. ?off=walkedge: as before.
      if (k.cols && swEnd !== kerb && Math.abs(swEnd - kerb) > WALK_MIN + 2 * WALK_WIN && !P.off?.has("walkedge")) {
        const greenOf = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], g = []; for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]); return g.length ? g.reduce((u, v) => u + v, 0) / g.length : NaN; };
        // Or where the colour turns more saturated than the sidewalk's own first metre (Bára 19. 11. 2026, Hegelstraße in
        // Cottbus: a 2 m sidewalk, then front gardens of dry grass, yellowish, not green; paving S 2–7, grass 12–23).
        // ?off=walksat: green only.
        const satOf = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], v = []; for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.sat[i])) v.push(k.cols.sat[i]); return v.length ? v.reduce((u, w) => u + w, 0) / v.length : NaN; };
        // Off by default since 19. 11. 2026: the hold-out showed nothing either way (+1 [−1, 2] pp); P.walkSatOn: on.
        const walkSat = satOf(kerb + sg * 0.3, kerb + sg * WALK_MIN), useSat = Number.isFinite(walkSat) && !!P.walkSatOn && !P.off?.has("walksat");
        // Not in a shadow: a house's shadow is dark and bluish, saturated as grass (Bělohorská, Olšanská in Prague).
        const lightOf = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], v = []; for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.medL[i])) v.push(k.cols.medL[i]); return v.length ? v.reduce((u, w) => u + w, 0) / v.length : NaN; };
        // P.walkYellow (a trial): the saturated stretch must also be yellower than the sidewalk (grass, not a shadow or
        // coloured paving), instead of the light test.
        const yelOf = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], v = []; for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.yel[i])) v.push(k.cols.yel[i]); return v.length ? v.reduce((u, w) => u + w, 0) / v.length : NaN; };
        const walkYel = yelOf(kerb + sg * 0.3, kerb + sg * WALK_MIN);
        const notShadow = (x, y) => (P.walkYellow != null && Number.isFinite(walkYel) ? yelOf(x, y) >= walkYel + P.walkYellow : lightOf(x, y) >= (P.walkLight ?? WALK_LIGHT));
        const soft = (x, y) => greenOf(x, y) >= PIECE_GREEN + roadGreen || (useSat && satOf(x, y) >= walkSat + (P.walkSat ?? WALK_SAT) && notShadow(x, y));
        const mode = P.walkMode ?? "colour";
        if (mode !== "edge") for (let x = kerb + sg * WALK_MIN; sg * (swEnd - x) > 2 * WALK_WIN; x += sg * 0.2) {
          if (soft(x, x + sg * WALK_WIN) && soft(x + sg * WALK_WIN, x + sg * 2 * WALK_WIN)) { swEnd = x; break; }
        }
        // P.walkMode "edge" / "both": the first change of surface (Ec, a local peak of at least P.walkEdge) from WALK_MIN
        // off the kerb on, nearer than the sidewalk found so far.
        if (mode !== "colour" && k.cols.Ec) {
          const c = k.cols, i0 = c.ti(kerb + sg * WALK_MIN), i1 = c.ti(swEnd), st2 = sg > 0 ? 1 : -1;
          for (let i = i0; sg > 0 ? i < i1 : i > i1; i += st2) {
            const v = c.Ec[i];
            if (!(v >= (P.walkEdge ?? 4)) || v < (c.Ec[i - 1] || 0) || v < (c.Ec[i + 1] || 0)) continue;
            // Beyond it (1 m) another surface than the sidewalk's first metre, in brightness or saturation, against the
            // image's typical step (c.tL, c.tS).
            const t = c.tOf(i), mean = (arr, x, y) => { const [a, b] = x < y ? [x, y] : [y, x], q = []; for (let j = c.ti(a); j < c.ti(b); j++) if (j >= 0 && j < c.nt && Number.isFinite(arr[j])) q.push(arr[j]); return q.length ? q.reduce((u, w) => u + w, 0) / q.length : NaN; };
            const dL = Math.abs(mean(c.medL, t + sg * 0.2, t + sg * 1.2) - mean(c.medL, kerb + sg * 0.3, kerb + sg * WALK_MIN)) / c.tL;
            const dS = Math.abs(mean(c.sat, t + sg * 0.2, t + sg * 1.2) - mean(c.sat, kerb + sg * 0.3, kerb + sg * WALK_MIN)) / c.tS;
            if (!(dL + dS >= (P.walkDiff ?? 6))) continue;
            // Not into a shadow (a house's: much darker beyond; grass in a tree's shade is green, the rule above).
            if (mean(c.medL, t + sg * 0.2, t + sg * 1.2) < (P.walkShadow ?? 0.7) * mean(c.medL, kerb + sg * 0.3, kerb + sg * WALK_MIN)) continue;
            swEnd = t; break;
          }
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
  // gaps between them green where the image is mostly green, else paved. ?off=vyplnkonec: as before. A side road
  // there is a roadway of its own (?off=soubezna: it ends the filling).
  if (!FILL_OFF) for (const [side, sg] of [["A", -1], ["B", 1]]) {
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
        : STREET.test(w.tags.highway || "") ? (P.off?.has("soubezna") ? null : [701, "vozovka (OSM, souběžná)", 3]) : [702, "chodník (OSM, zvlášť)", SIDEWALK / 2];
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
  // BACK_MIN, behind everything else (the order is the priority; trimToEnds does not reach out for them). ?off=pozadi.
  if (k.cols && !P.off?.has("pozadi")) {
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
      // ?off=murkonec: as before.
      if (!r.g && b - a > REST_MAX && !P.off?.has("murkonec")) {
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
    polys.splice(polys.cars || 0, 0, ...beds);
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

// The default reach of a new cut goes on to the first building, wall or fence (Bára 27. 11. 2026, Berliner Straße in Leipzig:
// "na první klik by se mi líbilo, kdyby A bylo až na té zdi"). For each side of the cut that has none of them within its
// reach (from: { A, B }, m from the axis) and has one between there and MAX_EDGE: the distance of the first from the axis
// (+ a margin), unless another street's roadway lies between (the profile does not cross it). null where the side stays.
// ?nastenu=1 only (P.edgeOn). osm: OSM elements; frame, dir, way: as orthoOsmPolys.
const WALLS = new Set(["wall", "fence", "retaining_wall", "city_wall"]), MAX_EDGE = 40, EDGE_MARGIN = 0.4;
export function edgeBeyond({ osm, frame, dir, way, from }) {
  const none = { A: null, B: null };
  if (!P.edgeOn || !way) return none;
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const o = osmAlong(osm?.elements, tu, way.id);
  if (!o.own) return none;
  const out = { A: null, B: null };
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const d = (t) => sg * (t - o.own.t);
    const stops = [...o.ways.filter((w) => WALLS.has(w.tags.barrier) && sameLevel(w, o)).map((w) => d(w.t)), ...(o.facade[side] !== null ? [d(o.facade[side])] : [])].filter((x) => x > 0.3);
    if (!stops.length || stops.some((x) => x <= from[side] + 0.3)) continue;
    const first = Math.min(...stops);
    if (first > MAX_EDGE) continue;
    // Another street between the reach and the wall (not a service way, not the street itself).
    const own = way.tags || {};
    const blocked = o.ways.some((w) => STREET.test(w.tags.highway || "") && w.tags.highway !== "service" && sameLevel(w, o) && d(w.t) > from[side] && d(w.t) < first
      && !((own.name && w.tags.name === own.name) || (own.ref && w.tags.ref === own.ref)));
    if (!blocked) out[side] = +(first + EDGE_MARGIN).toFixed(1);
  }
  return out;
}

// The sources of the estimate's houses (osmAlong): of the facades that end the sides, else of every house the cut
// crosses; an element's "from" (gis.js ruianOutlines RÚIAN, towns/lithuania.js GRPK), else OSM. The state's own
// register first, OSM last.
// A surface map's gaps beyond the outer sidewalk (towns/planimetrics.js outerGaps: what OSM had no building or lot for),
// at least OUTER_WIDE m wide (a front yard stays the map's green), told on the orthophoto: paving where the part the image
// covers (OUTER_SEEN m of it at least) is neither green (GREEN_AREA, as the estimate's rest) nor yellowish or saturated
// as a lawn is out of leaf (MassGIS's photos are of April: OUTER_YELLOW, OUTER_SAT; evaluation/usa/boston/outer/REPORT.md).
// A paved gap of OPEN_LAND or more is a lot beside the street (704: the profile ends at it, as at a wide lawn), a
// narrower one a paved area (1003). polys: derive.js mtvuPolygons (changed in place); dir: the street's direction in
// frame; st: laneImage's. Returns how many changed.
const OUTER_WIDE = 6, OUTER_SEEN = 3, OUTER_YELLOW = 6, OUTER_SAT = 12, OUTER_LOT = 8;
export function outerGapsByImage(polys, dir, st) {
  if (!usable(st) || !polys.some((p) => p.outerGap && p.code === 401)) return 0;
  const cols = columns(st), normal = [-dir[1], dir[0]];
  let n = 0;
  for (const p of polys) {
    if (!p.outerGap || p.code !== 401) continue;
    const ts = p.rings[0].map(([x, y]) => x * normal[0] + y * normal[1]), a = Math.min(...ts), b = Math.max(...ts);
    if (b - a < OUTER_WIDE) continue;
    const g = [], Y = [], S = [];
    for (let i = cols.ti(a); i < cols.ti(b); i++) if (i >= 0 && i < cols.nt && Number.isFinite(cols.green[i])) { g.push(cols.green[i]); if (Number.isFinite(cols.yel[i])) Y.push(cols.yel[i]); S.push(cols.sat[i]); }
    if (g.length * st.res < OUTER_SEEN || g.reduce((x, y) => x + y, 0) / g.length >= GREEN_AREA) continue;
    if ((Y.length && median(Y) >= OUTER_YELLOW) || median(S) >= OUTER_SAT) continue;
    const lot = b - a >= OUTER_LOT;
    Object.assign(p, { code: lot ? 704 : 1003, label: lot ? "parkoviště nebo plocha (ortofoto)" : "zpevněná plocha (ortofoto)", guess: true });
    n++;
  }
  return n;
}

// A planimetric map's gaps between two roadways taken as medians (towns/planimetrics.js gapsBetweenRoads, Toronto), told on
// the orthophoto: green as the estimate's rest (GREEN_AREA) is the grass strip it is (401), the rest stays the median. Not by
// yellowness or saturation as outerGapsByImage: on Toronto's orthophoto the concrete islands are as yellow and saturated
// as dry grass (the 26 judged medians of the second review: concrete green 0–0.01, grass 0.11–0.42, the dry one of Markham
// Road 0). At least MEDIAN_SEEN m of it seen. Returns how many changed.
const MEDIAN_SEEN = 0.8;
export function medianGapsByImage(polys, dir, st) {
  if (!usable(st) || !polys.some((p) => p.medianGap && p.code === 9950)) return 0;
  const cols = columns(st), normal = [-dir[1], dir[0]];
  let n = 0;
  for (const p of polys) {
    if (!p.medianGap || p.code !== 9950) continue;
    const ts = p.rings[0].map(([x, y]) => x * normal[0] + y * normal[1]), a = Math.min(...ts), b = Math.max(...ts);
    const g = [];
    // (Not the edges: a kerb's shadow or a painted line.)
    for (let i = cols.ti(a + 0.2); i < cols.ti(b - 0.2); i++) if (i >= 0 && i < cols.nt && Number.isFinite(cols.green[i])) g.push(cols.green[i]);
    if (g.length * st.res < MEDIAN_SEEN) continue;
    if (g.reduce((x, y) => x + y, 0) / g.length < GREEN_AREA) continue;
    Object.assign(p, { code: 401, label: "zeleň (ortofoto)", guess: true });
    n++;
  }
  return n;
}

export function houseSources(o) {
  const facades = ["A", "B"].map((side) => o.facadeFrom?.[side]).filter(Boolean);
  const all = facades.length ? facades : o.buildings.map((b) => b.from);
  const set = [...new Set(all.length ? all : ["OSM"])];
  return set.sort((a, b) => (a === "OSM") - (b === "OSM"));
}

// The note under the street's name for a profile of the estimate (app.js): where its kerbs and its houses come from.
// fb: orthoOsmPolys' result; tried: an orthophoto was looked for here; tr: i18n.js t; list: the names joined in the
// page's language (Intl.ListFormat), "{a} a {b}" by default. The source's name is not declined (Bára 17. 11. 2026).
export function estimateNote(fb, tried, tr, list = (xs) => xs.join(" a ")) {
  const houses = list(fb.houses?.length ? fb.houses : ["OSM"]);
  return fb.image ? tr("orthoOsm.kerbsEstimatedOrthophotoBuildings", { houses })
    : tried ? tr("orthoOsm.orthophotoDidNotHelp", { houses })
    : tr("orthoOsm.kerbsFollowOsmBuildings", { houses });
}

// ---------- beyond a town's passport (Slovakia) ----------
// A passport keeps only the roads a town maintains: its sidewalk or square may end metres short of the houses (Poštová
// in Bratislava: the paving between its tree rows and the hotel; 17. novembra in Prešov: a gap before the house, the
// sidewalk on the other side missing). On each side, from the axis up to the nearest end (a house of the surfaces or of
// OSM, an OSM fence or wall, the far side of a separately mapped OSM sidewalk), every stretch no surface covers gets
// pieces, only where that end lies within BESIDE_MAX of the last surface (no end: the profile ends as before; Bára,
// Tranovského: no sidewalk laid over a lawn up to a far house). The pieces between the lines of the town's map are a
// sidewalk or green by the map's symbol, else by the image (against the green at the axis); an OSM sidewalk is a
// sidewalk; a stretch without lines wider than SIDEWALK_MAX a sidewalk by the street and the rest green or paving by
// the image. All an estimate. polys: the surfaces as derive.js takes them (frame XY). P.off "beside": off (the A/B).
const BESIDE_MAX = 15, WALK_REACH = 8, BESIDE_GREEN = 0.22, BARRIER = (t) => ["fence", "wall", "retaining_wall", "hedge"].includes(t.barrier);
// A path for walkers and cyclists in one (C 9): a footway or path with bicycle=designated and not segregated=yes (the
// segregated one stays a cycle track as before: its two halves are not measured), a cycle way with foot=designated and not
// segregated, or segregated=no. One part along the street, not a cycle track
// (Brandenburger Straße in Leipzig: a path=sidewalk with oneway:bicycle=yes drew two cycle tracks; ?off=sdilena: as before).
const OSM_SHARED = (t) => !P.off?.has("sdilena") && (["path", "footway"].includes(t.highway) ? t.bicycle === "designated" && t.segregated !== "yes"
  : t.highway === "cycleway" && (t.segregated === "no" || (t.foot === "designated" && t.segregated !== "yes")));
const OSM_SIDEWALK = (t) => t.highway === "footway" && t.footway === "sidewalk";
const OSM_CYCLEWAY = (t) => (t.highway === "cycleway" || (["path", "footway"].includes(t.highway) && t.bicycle === "designated"));
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
// max: how far beyond the last surface the end may lie (countries/<ISO>.js besideMax; Germany 25 m for Aachen's front
// gardens of 15–18 m, A/B of 17. 11. 2026; else BESIDE_MAX).
// aiSurf: the model's kinds across the cut (ai-kerbs.js aiSurface: t → "chodník", "zeleň", "vozovka", "budova", "jiné" or
// null), where it read the orthophoto: the pieces take its kinds as the estimate's sidewalks and front gardens do without
// the map (Bára 24. 11. 2026, evaluation/finland/ab3: Helsinki's gardens beyond YLRE were "plocha (odhad)", the image's
// green share there is near nil; the model told them). ?off=mapfill: as before (also the house beside the cut below).
export function besidePassport({ osm, frame, dir, way, st, edges = [], symbols = [], areas = [], polys = [], max = BESIDE_MAX, aiSurf = null }) {
  // Not beside a motorway or an expressway (R1 in Banská Bystrica: a sidewalk up to a hall across the ditch).
  if (P.off?.has("beside") || !way || /^(motorway|trunk)/.test(way.tags?.highway || "")) return [];
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const xy = (t, u) => [normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u];
  const o = osmAlong(osm?.elements, tu, way.id);
  if (!o.own) return [];
  // What the surfaces have at t on the cut: "house", the surface's code or null.
  const at = (t) => {
    const [x, y] = xy(t, 0);
    for (const p of polys) {
      const b = p.bbox;
      if (b && (x < b[0] || x > b[2] || y < b[1] || y > b[3])) continue;
      if (!p.rings?.length || !inRing(p.rings[0], x, y) || p.rings.slice(1).some((h) => inRing(h, x, y))) continue;
      return p.code === 601 ? "house" : p.code;
    }
    return null;
  };
  const cols = st && st.nt ? columns(st) : null;
  const greenOf = (a, b) => { if (!cols) return NaN; const g = []; for (let i = cols.ti(a); i < cols.ti(b); i++) if (i >= 0 && i < cols.nt && Number.isFinite(cols.green[i])) g.push(cols.green[i]); return g.length ? g.reduce((x, y) => x + y, 0) / g.length : NaN; };
  const axisGreen = greenOf(o.own.t - 1.5, o.own.t + 1.5) || 0;
  const edgeT = [...new Set(edges.flatMap((path) => [0, -1, 1].flatMap((u0) => crossT(path.map(([lo, la]) => tu(lo, la)), 45, u0).map((x) => Math.round(x.t * 20) / 20))))];
  const symT = symbols.map((p) => { const [t, u] = tu(p.x, p.y); return { t, u, code: p.code }; }).filter((p) => Math.abs(p.u) < 15);
  const symbolAt = (a, b) => { const n = new Map(); for (const p of symT) if (p.t > a && p.t < b) n.set(p.code, (n.get(p.code) || 0) + 1); return n.size ? [...n].sort((x, y) => y[1] - x[1])[0][0] : null; };
  const bboxOf = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const rect = (code, label, s, e) => { const ring = [xy(s, -ALONG), xy(e, -ALONG), xy(e, ALONG), xy(s, ALONG), xy(s, -ALONG)]; return { code, label, guess: true, orthoOsm: true, rings: [ring], bbox: bboxOf(ring), span: [Math.min(s, e), Math.max(s, e)] }; };
  const LABEL = { 401: "zeleň (technická mapa)", 702: "chodník (technická mapa)", 1003: "zpevněná plocha (technická mapa)", 603: "dvůr (technická mapa)", 704: "parkoviště (technická mapa)" };
  // The national map's lawns and car parks (ZBGIS, towns/slovakia.js) say what a piece is where they cover its middle
  // (front gardens: their image is as green as the paving, 0.12–0.32 against 0.04–0.20).
  const zb = P.off?.has("besidezbgis") ? [] : areas.map((f) => ({ code: f.attributes?.CTVUK_KOD, rings: (f.geometry?.rings || []).map((r) => r.map(([lo, la]) => frame.toXY(lo, la))) })).filter((f) => f.rings.length);
  const zbAt = (t) => { const [x, y] = xy(t, 0); return zb.find((f) => inRing(f.rings[0], x, y))?.code ?? null; };
  const ZB_LABEL = { 401: "zeleň (ZBGIS)", 704: "parkoviště (ZBGIS)" };
  const out = [];
  // Which sources a piece took (the credits of the cut: the town's map lines or symbols, ZBGIS, the image).
  out.used = { edges: false, zbgis: false, image: false };
  // A piece [a, b]; near: its end towards the street (a wide one keeps its sidewalk there); walk: whether it may be a
  // sidewalk (the side has none yet: beyond a passport's sidewalk the rest is a front garden or a paved area, not a
  // second sidewalk; Bára, Tranovského). Returns whether it took the side's sidewalk.
  const piece = (a, b, near, walk) => {
    const sym = symbolAt(a, b);
    if (LABEL[sym]) { out.push({ ...rect(sym, LABEL[sym], a, b), guess: false }); out.used.edges = true; return sym === 702; }
    const z = zbAt((a + b) / 2);
    if (ZB_LABEL[z]) { out.push(rect(z, ZB_LABEL[z], a, b)); out.used.zbgis = true; return false; }
    if (model) return byModel(a, b, near, walk);
    const g = greenOf(a, b);
    if (Number.isFinite(g)) out.used.image = true;
    const green = Number.isFinite(g) && g >= Math.min(BESIDE_GREEN, PIECE_GREEN + axisGreen);
    if (green) { out.push(rect(401, "zeleň (ortofoto)", a, b)); return false; }
    if (!walk) { out.push(rect(1003, "plocha před domem (odhad)", a, b)); return false; }
    if (b - a <= SIDEWALK_MAX) { out.push(rect(702, "chodník (ortofoto a OSM)", a, b)); return true; }
    const [s0, s1] = near === a ? [a, a + SIDEWALK_MAX] : [b - SIDEWALK_MAX, b];
    out.push(rect(702, "chodník (ortofoto a OSM)", s0, s1));
    const [r0, r1] = s0 === a ? [s1, b] : [a, s0], gr = greenOf(r0, r1);
    out.push(Number.isFinite(gr) && gr >= GREEN_AREA ? rect(401, "zeleň (ortofoto)", r0, r1) : rect(1003, "plocha před domem (odhad)", r0, r1));
    return true;
  };
  // The model's runs over [a, b] (from the street out), each at least AI_RUN (a shorter one joins its neighbour): a
  // sidewalk only where the side has none yet, its first run (behind a car park too), at most SIDEWALK_MAX of it (as the
  // estimate's aiWalkCap), the rest a paved area (another run of sidewalk: green or paving by the image's green share, as
  // without the model); green as green; a roadway, a house's roof or anything else as a paved area (the
  // surfaces and OSM's houses decide those).
  const model = !!aiSurf && !P.off?.has("mapfill");
  const runsOf = (a, b) => {
    const runs = [];
    for (let t = a + 0.1; t < b; t += 0.2) { const k = aiSurf(t), c = k === "chodník" ? 702 : k === "zeleň" ? 401 : k ? 1003 : runs.at(-1)?.c ?? 1003; const l = runs.at(-1); if (l && l.c === c) l.e = Math.min(b, t + 0.1); else runs.push({ c, s: Math.max(a, t - 0.1), e: Math.min(b, t + 0.1) }); }
    for (let q = 0; q < runs.length; q++) if (runs.length > 1 && runs[q].e - runs[q].s < AI_RUN) { const nb = q > 0 ? q - 1 : q + 1; runs[nb].s = Math.min(runs[nb].s, runs[q].s); runs[nb].e = Math.max(runs[nb].e, runs[q].e); runs.splice(q, 1); q = -1; }
    if (runs.length) { runs[0].s = a; runs.at(-1).e = b; }
    return runs;
  };
  // A street the surfaces draw without any sidewalk or cycle track across the cut (a narrow lane between lawns,
  // Runoilijanpolku in Helsinki) gets none from the model either: what it reads there as a sidewalk is the lane's edge.
  const mapWalks = model && (() => { for (let t = o.own.t - 30; t <= o.own.t + 30; t += 0.25) if ([702, 703].includes(at(t))) return true; return false; })();
  const byModel = (a, b, near, walk) => {
    out.used.image = true;
    walk = walk && mapWalks;
    const runs = runsOf(a, b), from = near === a ? 1 : -1;
    if (from < 0) runs.reverse();
    let took = false;
    for (const r of runs) {
      if (r.c === 702 && walk && !took) {
        const cap = from > 0 ? [r.s, Math.min(r.e, r.s + SIDEWALK_MAX)] : [Math.max(r.s, r.e - SIDEWALK_MAX), r.e];
        out.push(rect(702, "chodník (AI)", ...cap));
        if (cap[1] - cap[0] < r.e - r.s - 0.05) out.push(from > 0 ? rect(1003, "plocha před domem (AI)", cap[1], r.e) : rect(1003, "plocha před domem (AI)", r.s, cap[0]));
        took = true;
        continue;
      }
      // A sidewalk the side may not take: the image's green share decides, as without the model.
      if (r.c === 702) { const g = greenOf(r.s, r.e); out.push(Number.isFinite(g) && g >= Math.min(BESIDE_GREEN, PIECE_GREEN + axisGreen) ? rect(401, "zeleň (ortofoto)", r.s, r.e) : rect(1003, "plocha před domem (odhad)", r.s, r.e)); continue; }
      out.push(r.c === 401 ? rect(401, "zeleň (AI)", r.s, r.e) : rect(1003, "plocha před domem (AI)", r.s, r.e));
    }
    return took;
  };
  // Where the end lies farther than max (a house 30 m off across a car park and a lawn), with the model: the side goes
  // on to the far edge of the first sidewalk the model reads within WALK_REACH of the map's last surface, else as before
  // (Maasälväntie in Helsinki: the sidewalk behind perpendicular parking was missing).
  const walkBeyond = (last, sg) => {
    if (!model || !mapWalks) return null;
    let on = null;
    for (let d = 0.1; d < WALK_REACH + SIDEWALK_MAX; d += 0.2) {
      const t = last + sg * d, k = aiSurf(t);
      if (k === null) break;
      if (k === "chodník") { if (on === null) { if (d > WALK_REACH) break; on = d; } }
      else if (on !== null) { if (d - on >= AI_RUN) return last + sg * d; on = null; }
    }
    return on !== null && WALK_REACH + SIDEWALK_MAX - on >= AI_RUN ? last + sg * (WALK_REACH + SIDEWALK_MAX) : null;
  };
  const STEP = 0.1;
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    // The surfaces along the cut from the axis out: the first house, the last covered t before it.
    let house = null, last = o.own.t;
    for (let t = o.own.t; Math.abs(t - o.own.t) < 40; t += sg * STEP) {
      const k = at(t);
      if (k === "house") { house = t; break; }
      if (k) last = t;
    }
    // Whether the surfaces have a sidewalk on this side already (a passport's sidewalk, footway or square).
    let walked = false;
    for (let t = o.own.t; sg * (last - t) >= 0; t += sg * STEP) if ([702, 703].includes(at(t))) { walked = true; break; }
    const before = out.length;
    const walks = o.ways.filter((w) => OSM_SIDEWALK(w.tags) && sg * (w.t - last) > 0.3);
    const ends = [house, o.facade[side], ...o.ways.filter((w) => BARRIER(w.tags) && sg * (w.t - o.own.t) > 0.3).map((w) => w.t), ...walks.map((w) => w.t + sg * 1)]
      .filter((x) => x !== null && x !== undefined && sg * (x - o.own.t) > 0.3);
    if (!ends.length) continue;
    let to = ends.reduce((a, b) => (sg * (b - a) < 0 ? b : a)), farEnd = false;
    if (sg * (to - last) > max) {
      const w = walkBeyond(last, sg);
      if (w === null || sg * (to - w) < 0) continue;
      to = w; farEnd = true;
    }
    // The OSM sidewalk before the end: 2 m about its line.
    const walk = walks.filter((w) => sg * (to - w.t) >= 0).sort((a, b) => sg * (a.t - b.t))[0];
    const walkAt = walk ? [walk.t - 1, walk.t + 1] : null;
    // The stretches nothing covers between the axis and the end.
    const gaps = [];
    let g0 = null;
    for (let t = o.own.t; sg * (to - t) > 0; t += sg * STEP) {
      const free = !at(t);
      if (free && g0 === null) g0 = t;
      if (!free && g0 !== null) { gaps.push([g0, t]); g0 = null; }
    }
    if (g0 !== null) gaps.push([g0, to]);
    // From the street out (the gaps nearest first).
    for (const [p, q] of gaps) {
      if (Math.abs(q - p) < 0.3) continue;
      const [a, b] = sg < 0 ? [q, p] : [p, q];
      const lines = edgeT.filter((t) => t - a >= 0.5 && b - t >= 0.5);
      if (lines.length) out.used.edges = true;
      const stops = [a, ...lines, ...(walkAt ? walkAt.filter((t) => t - a >= 0.3 && b - t >= 0.3) : []), b].sort((x, y) => x - y);
      const order = [...Array(stops.length - 1).keys()];
      if (sg < 0) order.reverse();
      for (const n of order) {
        const [s, e] = [stops[n], stops[n + 1]];
        if (walkAt && s >= walkAt[0] - 0.01 && e <= walkAt[1] + 0.01) { out.push(rect(702, "chodník (OSM)", s, e)); walked = true; continue; }
        if (piece(s, e, sg < 0 ? e : s, !walked && !walkAt)) walked = true;
      }
    }
    // A strip of paving up to FACADE_STRIP wide between a sidewalk and the house it ends at is the sidewalk's own (the
    // house's outline drawn a little off the map's sidewalk: Rue des Tournelles in Paris 0.65 m, Helsinki's YLRE; Bára
    // 26. 11. 2026, evaluation/archive/facade-strip). ?off=fasada: as before.
    if (!farEnd && !P.off?.has("fasada") && (to === house || to === o.facade[side]) && out.length > before) facadeStrip(out, before, to, sg, at);
    // The house found beside the cut only: its front across the cut, the profile ends at it.
    // With ?off=mapfill only where the surfaces have no house farther on (Tammitie in Helsinki: OSM's house beside the
    // cut stood nearer than the city's outline across it, the profile ran on past it as "neurčeno").
    if (!farEnd && out.length > before && to === o.facade[side] && (house === null || (!P.off?.has("mapfill") && sg * (house - to) > 0.3)) && o.facadeU[side] !== 0) out.push({ ...rect(601, "budova (OSM, vedle řezu)", ...(sg < 0 ? [to - HOUSE, to] : [to, to + HOUSE])), guess: false });
  }
  return out;
}

// The outermost piece of a side (out[before…], pushed from the street out) when it is paving no wider than FACADE_STRIP,
// reaches the end `to` and has a sidewalk on its street side (the map's at(t) or the side's piece before it): it becomes
// sidewalk (deriveProfile then joins it to its neighbour).
const FACADE_STRIP = 1.5;
export function facadeStrip(out, before, to, sg, at) {
  const k = out.length - 1, p = out[k];
  if (p.code !== 1003 || !p.span) return;
  const [inner, outer] = sg < 0 ? [p.span[1], p.span[0]] : p.span;
  if (Math.abs(outer - to) > 0.15 || Math.abs(outer - inner) > FACADE_STRIP + 0.01) return;
  const prev = k > before ? out[k - 1] : null;
  const walk = [702, 703].includes(at(inner - sg * 0.15)) || (prev?.code === 702 && prev.span && Math.abs(prev.span[sg < 0 ? 0 : 1] - inner) < 0.15);
  if (!walk) return;
  out[k] = { ...p, code: 702, label: "chodník u fasády (odhad)" };
  if (P.dbg) P.dbg.facade = (P.dbg.facade || 0) + 1;
}

// The profile cut to the ends orthoOsmPolys found (polys.ends; t from the cut's centre, A below it, B above): parts
// beyond them dropped, the part across an end shortened; that end then "volno". result: deriveProfile's.
export function trimToEnds(result, ends) {
  if (!ends || !result?.extent || !result.segments?.length) return result;
  let lo = ends.A ?? -Infinity, hi = ends.B ?? Infinity;
  // A soft end (nothing of OSM there) goes out to the outer edge of the last part that is the street's own (not green,
  // unknown, paving or water beyond it).
  const OPEN = new Set(["zelen", "nezname", "plocha", "voda", "predzahradka"]);
  if (ends.soft) {
    let t = result.extent[1];
    for (const s of result.segments) {
      const e = t, b = t - s.width;
      t = b;
      if (OPEN.has(s.type)) continue;
      if (ends.soft.A && b < lo) lo = b;
      if (ends.soft.B && e > hi) hi = e;
    }
  }
  // Never past the edge of a bridge's deck (orthoOsmPolys ends.cap).
  if (ends.cap?.A !== undefined) lo = Math.max(lo, ends.cap.A);
  if (ends.cap?.B !== undefined) hi = Math.min(hi, ends.cap.B);
  if (lo <= result.extent[0] + 0.05 && hi >= result.extent[1] - 0.05) return result;
  // segments run from extent[1] (B, the profile's left) down to extent[0].
  let t = result.extent[1];
  const kept = [];
  for (const s of result.segments) {
    const e = t, b = t - s.width;
    t = b;
    const ee = Math.min(e, hi), bb = Math.max(b, lo);
    if (ee - bb < 0.05) continue;
    kept.push(ee - bb < s.width - 0.01 ? { ...s, width: +(ee - bb).toFixed(2) } : s);
  }
  const ext = [Math.max(result.extent[0], lo), Math.min(result.extent[1], hi)];
  const edges = { ...(result.edges || {}) };
  if (hi < result.extent[1] - 0.05) edges.left = "volno";
  if (lo > result.extent[0] + 0.05) edges.right = "volno";
  return { ...result, segments: kept, extent: ext, edges };
}
