// Street furniture along the cut: trees, platforms, points of OSM and the technical map, attached to the parts.
import { OD_ROW, OD_TREE, lineCrossings } from "./crossings.js";
import { TRAFFIC, WALK } from "./part-types.js";
import { isPlatformTags } from "./tags.js";

const TREE_STRIP = 1.5; // width of a tree strip carved out of a sidewalk (m)
// A cut never hits a point: a point this close to the cut, measured along the street, is drawn in the
// profile (m), per kind. The nearest one of a row (the same kind at about the same offset) is kept, so a
// reach of half the usual spacing shows one at most cuts and never two of a row (Bára: tuned on the
// Prague sample, evaluation/archive/praha-opendata/REPORT.md).
export const REACH = {
  strom: 8, // street trees, single (rows crossing the cut always count): about 8–16 m apart
  lampa: 20, // street lamps (OSM, the technical map's poles without wires): about 25–32 m apart
  sloup: 20, // tram and trolleybus overhead-line poles: about 22–38 m apart
  zastavka: 15, // stop poles and shelters: one per stop, a platform is 15–60 m long
  sloupek: 3, // bollards, planters: 2.5 m apart, a row ending short of the cut is not in it
  lavicka: 6, // benches: single
  jine: 6, // everything else standing (bike racks, sign posts, taxi stands, terraces)
};
const REACH_GROUP = { lampa: "lampa", lavicka: "lavicka", sloupek: "sloupek", kvetinac: "sloupek", sloup_trakce: "sloup", oznacnik: "zastavka", pristresek: "zastavka" };
export const reachOf = (kind, reach = REACH) => reach[REACH_GROUP[kind] || (kind === "strom" ? "strom" : "jine")] ?? REACH[REACH_GROUP[kind] || "jine"];
const ROW_GAP = 1.5; // points of one kind this close across the street stand in one row: one is drawn (m)
const STOP_GAP = { pristresek: 4, oznacnik: 4 }; // a stop's shelter or post: one within this across (m)

const SAME_POINT = 3; // a technical-map or open-data point this close to an OSM one of its kind is the same thing (m)
const STOP_REACH = 40; // a shelter takes the tram/bus kind of the nearest stop node this close (m)
const PLATFORM_STRIP = 3; // waiting area of a stop along the curb of a wide sidewalk (m)

const TM_TREE = 83130; // technical map: strom mimo park
// Points of the technical map that are drawn as street furniture (TM_TREE is a tree).
export const POINT_ITEM = { 26015: "sloup_trakce", 75240: "oznacnik", 75241: "oznacnik", 74110: "sloupek", 76010: "lampa" };

// Offsets along the cut of trees: tree rows crossing the cut and single trees within the reach of it
// (street trees are spaced along the street, rarely on the cut). From OSM, and in Prague from the
// technical map (strom mimo park) and the open data (trees and tree rows of TSK, MHMP and the districts).
export function treePositions(osm, frame, center, normal, half, lines = [], reach = REACH) {
  const rows = (osm.elements || [])
    .filter((el) => el.type === "way" && el.tags?.natural === "tree_row")
    .map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat)));
  const ts = lineCrossings(rows, center, normal, half).map((t) => ({ t, src: "osm" }));
  ts.push(...lineCrossings(lines.filter((l) => l.code === OD_ROW && l.pts).map((l) => l.pts), center, normal, half).map((t) => ({ t, src: "data" })));
  const lim = reachOf("strom", reach);
  const take = ([x, y], src) => {
    const dx = x - center[0], dy = y - center[1];
    const along = Math.abs(dx * normal[1] - dy * normal[0]);
    if (along <= lim) ts.push({ t: dx * normal[0] + dy * normal[1], src });
  };
  for (const el of osm.elements || []) {
    if (el.type === "node" && el.tags?.natural === "tree") take(frame.toXY(el.geometry[0].lon, el.geometry[0].lat), "osm");
  }
  for (const l of lines) if (l.point && (l.code === TM_TREE || l.code === OD_TREE)) take(l.point, l.code === TM_TREE ? "dtm" : "data");
  // Trees of one row sit at nearly the same offset; keep one position per row, its source the most
  // exact one (technical map, then the city's open data, then OSM).
  const RANK = { dtm: 0, data: 1, osm: 2 };
  const out = [];
  for (const { t, src } of ts.sort((a, b) => a.t - b.t)) {
    const c = out.at(-1);
    if (c && t - c.last < ROW_GAP) { c.sum += t; c.n++; c.last = t; if (RANK[src] < RANK[c.src]) c.src = src; }
    else out.push({ sum: t, n: 1, last: t, src });
  }
  return out.map((c) => ({ t: c.sum / c.n, src: c.src }));
}

// Trees turn a green segment into a tree row, or carve a tree strip (TREE_STRIP wide)
// out of the paved segment holding them. A tree standing in the parking strip (trees between the stalls,
// Bára) is an item of the parking (parked: given to attachItems).
const TREE_ROW_MAX = 3; // m (Bára 17. 11. 2026)
export function insertTrees(segs, trees, parked = [], unknownWalk = false) {
  let out = segs;
  for (const { t, src } of trees) {
    const i = out.findIndex((x) => x.s <= t && x.e >= t);
    const host = out[i];
    // A green strip turns into a tree row, at most TREE_ROW_MAX wide round the tree; a wider green area keeps the
    // rest (Bára 17. 11. 2026: Václavské náměstí drew a tree row of 8.75 m with one tree).
    if (host?.type === "zelen" && host.e - host.s <= TREE_ROW_MAX) { host.type = "stromorad"; continue; }
    if (host?.type === "zelen") {
      let a = Math.max(host.s, t - TREE_ROW_MAX / 2), b = Math.min(host.e, t + TREE_ROW_MAX / 2);
      if (a === host.s) b = Math.min(host.e, host.s + TREE_ROW_MAX); else if (b === host.e) a = Math.max(host.s, host.e - TREE_ROW_MAX);
      if (a - host.s < 0.5) a = host.s;
      if (host.e - b < 0.5) b = host.e;
      const parts = [];
      if (a > host.s) parts.push({ ...host, e: a });
      parts.push({ ...host, type: "stromorad", s: a, e: b });
      if (b < host.e) parts.push({ ...host, s: b });
      out = [...out.slice(0, i), ...parts, ...out.slice(i + 1)];
      continue;
    }
    if (host?.type === "parkovani") { parked.push({ kind: "strom", t, along: 0, parked: true }); continue; }
    if (!host || !(WALK.has(host.type) || (unknownWalk && host.type === "nezname" && host.source !== "user"))) continue;
    const s = Math.max(host.s, t - TREE_STRIP / 2), e = Math.min(host.e, t + TREE_STRIP / 2);
    // Leftover sidewalk slivers under 0.5 m join the tree strip.
    const strip = { type: "stromorad", s: s - host.s < 0.5 ? host.s : s, e: host.e - e < 0.5 ? host.e : e, source: src };
    const parts = [];
    if (strip.s > host.s) parts.push({ ...host, e: strip.s });
    parts.push(strip);
    if (strip.e < host.e) parts.push({ ...host, s: strip.e });
    out = [...out.slice(0, i), ...parts, ...out.slice(i + 1)];
  }
  return out;
}

// Public transport platforms crossing the cut (OSM lines along the platform edge).
export function platformPositions(osm, frame, center, normal, half) {
  const lines = (osm.elements || [])
    .filter((el) => el.type === "way" && isPlatformTags(el.tags))
    .map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat)));
  return lineCrossings(lines, center, normal, half);
}

// A raised island holding a platform becomes the platform; on a wide sidewalk only the
// strip along the curb (PLATFORM_STRIP) is the waiting area of the stop.
export function insertPlatforms(segs, platforms, axisT) {
  let out = segs;
  for (const t of platforms) {
    const i = out.findIndex((x) => x.s <= t && x.e >= t);
    const host = out[i];
    if (!host || !(WALK.has(host.type) || ["delici", "nezname"].includes(host.type))) continue;
    if (host.e - host.s <= PLATFORM_STRIP + 1) { host.type = "nastupiste"; host.source = "osm"; continue; }
    const curbAtEnd = (host.s + host.e) / 2 < axisT; // the curb faces the street axis
    const strip = curbAtEnd
      ? { type: "nastupiste", s: host.e - PLATFORM_STRIP, e: host.e, source: "osm" }
      : { type: "nastupiste", s: host.s, e: host.s + PLATFORM_STRIP, source: "osm" };
    const rest = curbAtEnd ? { ...host, e: strip.s } : { ...host, s: strip.e };
    out = [...out.slice(0, i), ...(curbAtEnd ? [rest, strip] : [strip, rest]), ...out.slice(i + 1)];
  }
  return out;
}

// Street furniture, barriers and slopes found along the cut, as {kind, t}.
export const TECH_ITEM = {
  71522: "svodidlo", 71540: "svodidlo", 61530: "zabradli", 61209: "plot", 61210: "plot", 71210: "plot",
  81210: "plot", 91210: "plot", 61422: "oporna_zed", 71422: "oporna_zed", 81422: "oporna_zed", 81214: "zivy_plot",
  42105: "svah", 42107: "svah",
};
export const BARRIER_ITEM = {
  guard_rail: "svodidlo", jersey_barrier: "svodidlo", fence: "plot", wall: "plot", city_wall: "plot",
  retaining_wall: "oporna_zed", hedge: "zivy_plot", handrail: "zabradli",
};

export function nodeItem(t) {
  if (t.highway === "street_lamp") return "lampa";
  if (t.amenity === "bench") return "lavicka";
  if (t.amenity === "bicycle_parking") return "stojan_kola";
  if (t.amenity === "bicycle_rental") return "sdilena_kola";
  if (t.amenity === "shelter" || (t.highway === "bus_stop" && t.shelter === "yes")) return "pristresek";
  if (t.amenity === "taxi") return "taxi";
  if (["guidepost", "board", "map"].includes(t.information)) return "rozcestnik";
  if (t.barrier === "bollard") return "sloupek";
  if (t.barrier === "planter") return "kvetinac";
  if (t.leisure === "outdoor_seating") return "zahradka";
  return null;
}

// Tram or bus stop a node marks: true (tram), false (bus), null (neither).
function stopMode(t) {
  if (t.railway === "tram_stop" || t.tram === "yes") return true;
  if (t.highway === "bus_stop" || t.bus === "yes" || t.trolleybus === "yes") return false;
  return null;
}

// A shelter belongs to a tram stop when its own tags or the nearest stop node within STOP_REACH say so.
function shelterIsTram(t, x, y, stops) {
  const own = stopMode(t);
  if (own !== null) return own;
  let best = null, bestD = STOP_REACH;
  for (const s of stops) {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) [best, bestD] = [s.tram, d];
  }
  return best === true;
}

export function itemPositions(osm, frame, center, normal, half, lines, reach = REACH) {
  const items = [];
  const osmPoints = [];
  const stops = [];
  for (const el of osm.elements || []) {
    if (el.type !== "node") continue;
    const tram = stopMode(el.tags || {});
    if (tram === null) continue;
    const [x, y] = frame.toXY(el.geometry[0].lon, el.geometry[0].lat);
    stops.push({ x, y, tram });
  }
  for (const el of osm.elements || []) {
    if (el.type === "node") {
      const kind = nodeItem(el.tags || {});
      if (!kind) continue;
      const [x, y] = frame.toXY(el.geometry[0].lon, el.geometry[0].lat);
      osmPoints.push({ kind, x, y });
      const dx = x - center[0], dy = y - center[1];
      const along = Math.abs(dx * normal[1] - dy * normal[0]);
      if (along > reachOf(kind, reach)) continue;
      const item = { kind, t: dx * normal[0] + dy * normal[1], along, stands: true };
      if (kind === "pristresek" && shelterIsTram(el.tags || {}, x, y, stops)) item.tram = true;
      items.push(item);
    } else if (el.type === "way" && BARRIER_ITEM[el.tags?.barrier]) {
      const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
      for (const t of lineCrossings([pts], center, normal, half)) items.push({ kind: BARRIER_ITEM[el.tags.barrier], t, along: 0, osm: true });
    }
  }
  for (const l of lines) {
    if (l.point) {
      // A point of the technical map, unless OSM has the same thing there (an OSM lamp on a traction pole
      // stays a lamp of the pole: the pole is drawn with its lamp).
      const kind = POINT_ITEM[l.code];
      if (!kind) continue;
      const [x, y] = l.point;
      if (osmPoints.some((o) => o.kind === kind && Math.hypot(o.x - x, o.y - y) < SAME_POINT)) continue;
      const dx = x - center[0], dy = y - center[1];
      const along = Math.abs(dx * normal[1] - dy * normal[0]);
      if (along > reachOf(kind, reach)) continue;
      items.push({ kind, t: dx * normal[0] + dy * normal[1], along, stands: true, dtm: true });
      continue;
    }
    const kind = TECH_ITEM[l.code];
    if (kind) for (const t of lineCrossings([l.pts], center, normal, half)) items.push({ kind, t, along: 0 });
  }
  // A lamp on a traction pole (within SAME_POINT across the cut, both within reach) is the pole's lamp.
  for (const p of items) {
    if (p.kind !== "sloup_trakce") continue;
    const lamp = items.find((o) => o.kind === "lampa" && Math.abs(o.t - p.t) < SAME_POINT);
    if (lamp) { p.lamp = true; lamp.drop = true; }
  }
  // One item of a row: of the same kind at about the same offset (the technical map and OSM drawing the
  // same fence, lamps every 30 m along a sidewalk, bollards every 2.5 m) the one nearest the cut stays,
  // where it stands across the street.
  const kept = [];
  for (const it of items.filter((x) => !x.drop).sort((a, b) => a.along - b.along || a.t - b.t)) {
    // A stop has one shelter and one post: two of them within STOP_GAP across (OSM's shelter and the stop's
    // shelter=yes, two shelters of one platform; Türkova) are one.
    const gap = STOP_GAP[it.kind] ?? (it.along ? ROW_GAP : 1);
    if (!kept.some((o) => o.kind === it.kind && Math.abs(o.t - it.t) < (o.along || it.along ? Math.max(gap, ROW_GAP) : gap))) kept.push(it);
  }
  return kept.sort((a, b) => a.t - b.t);
}

const ITEM_SHIFT = 3; // an OSM point this far off a kerb is moved onto it (m); further it is left out
// A traction pole or a stop post in the tram bed (between the tracks, or a point a little off) stands on the
// island or platform beside it, further than ITEM_SHIFT if need be: trams pass where it was drawn (Olšanská).
const BED_SHIFT = { sloup_trakce: 4, oznacnik: 4 };
const CENTER_POLE = 1.2; // a traction pole this close to the line between two tracks stands between them (m)

// One of these in a part, the nearest to the cut along the street (Bára, náměstí Jana Palacha: three traction poles
// of the technical map along a sidewalk drawn side by side in the cut; one is enough).
const ONE_PER_PART = new Set(["sloup_trakce", "lampa"]);
export function attachItems(segs, items) {
  for (const it of [...items].sort((a, b) => Math.abs(a.along ?? 0) - Math.abs(b.along ?? 0))) {
    let host = segs.find((x) => x.s <= it.t && x.e >= it.t);
    let t = it.t;
    let center = false;
    // A traction pole between two tracks (within CENTER_POLE of where the two track parts meet) stands there,
    // with brackets over both (Bára's photo): trams pass on either side of it.
    if (it.kind === "sloup_trakce" && host && /^tramvaj/.test(host.type)) {
      const k = segs.indexOf(host);
      const meet = [[segs[k - 1], host.s], [segs[k + 1], host.e]].find(([n, b]) => n && /^tramvaj/.test(n.type) && Math.abs(b - t) <= CENTER_POLE);
      if (meet) { t = meet[1]; center = true; host = t === host.s ? segs[k - 1] : host; }
    }
    if (!center && it.stands && (!host || TRAFFIC.has(host.type))) {
      // OSM points are a metre or two off: a lamp drawn in a lane goes to the nearest kerbside part.
      const gap = (x) => (t < x.s ? x.s - t : t > x.e ? t - x.e : 0);
      const shift = Math.max(ITEM_SHIFT, BED_SHIFT[it.kind] ?? 0);
      const near = segs.filter((x) => !TRAFFIC.has(x.type) && gap(x) <= shift).sort((a, b) => gap(a) - gap(b))[0];
      if (!near) continue;
      const inset = Math.min(0.3, (near.e - near.s) / 2);
      host = near;
      t = Math.min(Math.max(t, near.s + inset), near.e - inset);
    }
    if (!host || (it.parked && host.type !== "parkovani")) continue;
    // One tree per parking part: it stands in the middle, behind the car.
    if (it.parked) { if (!host.items?.some((o) => o.kind === "strom")) (host.items ||= []).push({ kind: "strom", f: 0.5 }); continue; }
    if (!center && ONE_PER_PART.has(it.kind) && host.items?.some((o) => o.kind === it.kind && !o.center)) continue;
    const item = { kind: it.kind, f: (t - host.s) / Math.max(host.e - host.s, 0.01) };
    if (it.tram) item.tram = true;
    if (it.lamp) item.lamp = true;
    if (center) { item.center = true; item.f = 1; }
    (host.items ||= []).push(item);
  }
  return segs;
}
