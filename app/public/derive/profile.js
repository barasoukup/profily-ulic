// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways.
import { typeFromMtvu, isBuilding, isMinorStructure, PERMEABLE_TYPES } from "../types.js";
import { country } from "../city.js";
import { t } from "../i18n.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { CAR_ROADS, MINOR, STREETS, carsBanned, classGroup, isOnewayTags, levelTag, osmGroup, tramWithBus, transitAllowed, transitOnly } from "./tags.js";
import { REACH, attachItems, insertPlatforms, insertTrees, itemPositions, platformPositions, treePositions } from "./items.js";
import { OD_SECTION, crossings, dualPartner, lineCrossings } from "./crossings.js";
import { MEDIAN, absorbParkingSlivers, capParallelBay, classify, linePieces, mergeTiny, splitMedians } from "./classify.js";
import { bedOf, bedSurfaces, mapTramBeds, mergeTrackAxes, snapTracksToBeds } from "./tram.js";
import { inside } from "./geometry.js";
import { estimateFromOsm } from "./estimate.js";
import { OSM_OUTDOOR, OSM_PARKING, OSM_PLATFORM, TSK_CODES, TSK_PARKING, isTskParking, osmOutdoorPolygons, osmParkingPolygons, osmPlatformPolygons } from "./polygons.js";
import { carveKerbParking, markIslands, mergeParking, orientFromStalls, perpDepth } from "./parking.js";
import { TUNED_BUILDING, buildingAt, centreKm, gableToStreet } from "./buildings.js";
import { sideTags, splitRoadway } from "./lanes.js";
import { cycleTrack, sidewalkUse } from "./walkways.js";
import { TRAFFIC, TRAM_KINDS } from "./part-types.js";
import { aisleOrient, toSegment } from "./output.js";

export const MAX_REACH = 22; // default reach of the profile from the street axis on each side (m)
const WALL_MAX = 2; // "ostatní stavby" narrower than this are walls / parapets, not a structure ending the street (m)
const PASSAGE_MIN = 10; // an "ostatní stavby" piece this long along the cut with a street through it is a passage over the street (m)
const OPEN_LAND = 8; // greenery at least this wide ends the profile as open surroundings (m)

const GRASS_BED_MIN = 2.5; // a green area at least this wide with tracks in it is a grass tram bed (m)

// Lanes under trolley wires, and a street open to public transport but closed to other motor traffic.
const WIRED = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]);

const SECTION_NEAR = 12; // the line of a TSK street section within this of the roadway's middle is its section (m)

const AXIS_SNAP = 4.5; // m: an OSM axis this close beside the roadway belongs to it (deriveProfile, the axis to the roadway)
// Streets for the axis fixes: roads and residential streets, not tracks or bridleways (Brno test č. 99).
const isRoadway = (c) => c === 700 || c === 701;
const OTHER_ANGLE = Math.cos((20 * Math.PI) / 180); // an axis turned more than 20° from the cut's street

const otherStreet = (c, way, dir, cross) => {
  const t = c.way.tags || {}, own = way?.tags || {};
  return c.way.id !== way?.id && !!own.name && !!t.name && t.name !== own.name && CAR_ROADS.has(t.highway) && !/_link$/.test(t.highway) && levelTag(t) === levelTag(own)
    && Math.abs(c.d[0] * dir[0] + c.d[1] * dir[1]) < OTHER_ANGLE && !cross.some((x) => x.way.id !== c.way.id && x.way.tags?.name === own.name && Math.abs(x.t - c.t) < 4);
};

const ROAD_ON_PATH_MIN = 5; // m (deriveProfile roadOnPath)
const ROAD_UNDER_AXIS_MIN = 3; // m: a paved area under the axis narrower than a lane (3.00 m) is no roadway

const isLine = (l) => !!l.pts;

const KERB_PARK_TOL = 1; // a register's parking point: slack across the kerb (m)
// …and along the street: a gap of a driveway or a gate between two stretches is no kerb without parking (Paris, Rue
// Jacob: the cut 4 m past the end of a delivery bay).
const KERB_PARK_ALONG = 5;

// Outside the built-up area a kerb without a sidewalk gets no estimate (Bára): no building of OSM or of the
// city's surfaces within BUILT_ALONG along the street and BUILT_OUT out from the kerb on that side. A sidewalk
// is a footway surface beyond the kerb, past a green strip up to WALK_GREEN, or OSM's sidewalk tags or a
// footway along the street within WALK_OSM of the kerb.
const BUILT_ALONG = 40, BUILT_OUT = 40, WALK_GREEN = 10, WALK_OSM = 12;

// A house standing with its gable to the street (a village house, Bára 16. 11. 2026): a narrow footprint, clearly
// longer than wide, its long side running away from the street (along the cut).
const WALK_FRONT = 6; // m: a wider paving before a house is a yard read as a sidewalk
const ARCADE_COVER = new Set(["arcade", "colonnade", "building_arcade"]);

// Codes of the technical map (and overlays) a street axis may lie on.
// Only unpaved land under the axis (no surface, field, meadow, garden, greenery) counts as a mismatch:
// paved "other areas" (e.g. 1003) can hold a street the technical map has not split out.
const isUnpaved = (c) => c === null || c === undefined || c === 100 || c === 200 || (c >= 300 && c < 500);
const REACH_SNAP = 1.5; // a run cut by the reach is kept whole (or dropped) within this much (m)
// Guard rails of the technical map splitting one MTVU roadway into two carriageways.
const GUARD_RAILS = new Set([71522, 71540]);
// Fences and walls ending the street: technical map (fences and walls > 0.3 m) and OSM barriers.
const FENCE_LINES = new Set([61210, 71210, 81210, 91210]);
const FENCE_BARRIERS = new Set(["fence", "wall", "city_wall", "hedge"]);
const FENCE_AT_FACADE = 1; // m
const FENCE_SLIVER = 0.6; // m
const PAVERS = new Set(["grass_paver"]); // OSM surfaces of permeable paving
// OSM surfaces of no paving (Bára: unpaved cycle paths and footways soak the rain in too).
const UNPAVED = new Set(["unpaved", "compacted", "fine_gravel", "gravel", "pebblestone", "ground", "dirt", "earth", "mud", "sand", "woodchips", "grass"]);
const APRON = 1; // a paved strip narrower than this at a building's wall is its apron, not a sidewalk (m)
const APRON_BEYOND = new Set(["zelen", "predzahradka", "stromorad"]);

// noParkGuess: no parking estimated by the law alone (Monaco; and everywhere for the profile the lanes are measured on, app.js lawAt).
/** One object of arguments: @param {import("./types.js").DeriveArgs} args @returns {import("./types.js").Profile} */
export function deriveProfile({ center, dir, half, polys, osm, frame, way, tracks = [], parking = [], lines = [], reach, inZps: zoneKnown, itemReach, ortho, lanesImage, roadOnPath = false, noParkGuess = false, lawAt = [], kerbParking = null, osmParkGive = false }) {
  const reachItems = { ...REACH, ...itemReach };
  const at = (t) => [center[0] + normal[0] * t, center[1] + normal[1] * t];
  // The street section of TSK whose line runs along the street nearest to the point at offset t (within
  // SECTION_NEAR): its class, or null.
  const streetClass = (ls, t) => {
    const [px, py] = at(t);
    let best = null;
    for (const l of ls) {
      if (l.code !== OD_SECTION || !l.pts) continue;
      for (let i = 0; i < l.pts.length - 1; i++) {
        const [ax, ay] = l.pts[i], [bx, by] = l.pts[i + 1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
        if (len < 0.5 || Math.abs((dx * dir[0] + dy * dir[1]) / len) < 0.8) continue;
        const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (len * len)));
        const d = Math.hypot(px - ax - u * dx, py - ay - u * dy);
        if (d < SECTION_NEAR && (!best || d < best.d)) best = { d, cls: l.cls };
      }
    }
    return best?.cls || null;
  };
  const normal = [-dir[1], dir[0]];
  const cross = crossings(osm, frame, center, normal, half, way);
  const own = cross.find((c) => c.way.id === way?.id);
  polys = linePieces(polys, way?.tags || {}, center, normal, lanesImage, own ? own.d[0] * dir[0] + own.d[1] * dir[1] >= 0 : true);
  // A tram area that maps the tracks in the asphalt too (Berlin's Gleiskörper; Neue Schönhauser Straße: Bára 17. 11.
  // 2026, two tracks in a one-way street with parking both sides) is roadway where OSM puts the rails in the street
  // (embedded_rails); the tracks are then OSM's in the lanes.
  const asRoad = /tram/.test(way?.tags?.embedded_rails || "");
  const beds = mapTramBeds(polys, center, normal, half, (p) => asRoad && p.anyTram);
  if (asRoad) polys = polys.map((p) => (p.anyTram && p.code === 705 ? { ...p, code: 701, label: "" } : p));
  // A building connection over a street (a covered passage, Na Klaudiánce in Prague: Bára 17. 11. 2026) is drawn in
  // the technical map as a strip of "other structures" above the street, and a cut across the street runs along it.
  // No wall is 10 m thick with a street through it: such a piece is no ground of its own, so it is left out (as the
  // areas above the ground below) and the street under it comes from OSM.
  polys = polys.filter((p) => {
    if (!isMinorStructure(p.code) || p.level) return true;
    let lo = Infinity, hi = -Infinity;
    for (let t = -half; t <= half + 1e-9; t += 0.25) {
      const [x, y] = [center[0] + normal[0] * t, center[1] + normal[1] * t];
      const [x0, y0, x1, y1] = p.bbox || [-Infinity, -Infinity, Infinity, Infinity];
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && inside(p.rings, x, y)) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
    }
    return !(hi - lo >= PASSAGE_MIN && cross.some((c) => c.t >= lo && c.t <= hi && STREETS.has(c.way.tags?.highway)));
  });
  let axisT = cross.find((c) => c.way.id === way.id)?.t ?? 0;
  // Tram track axes: measured ones from the technical map when available, else OSM.
  const measured = lineCrossings(tracks, center, normal, half);
  // A road tagged as the tram line itself (highway + railway=tram, the tracks not mapped apart: Smetanovo nábřeží in OSM
  // until 2017) carries a track each way, 3 m apart (Manuál C.2), unless it is one-way or says one track.
  const roadTram = (c) => c.way.tags?.highway && c.way.tags.oneway !== "yes" && !["1", 1].includes(c.way.tags["railway:tracks"] ?? c.way.tags.tracks);
  const tramTs = mergeTrackAxes(measured.length ? measured : cross.filter((c) => c.way.tags?.railway === "tram").flatMap((c) => (roadTram(c) ? [c.t - 1.5, c.t + 1.5] : [c.t])));
  tramTs.measured = measured.length > 0;
  if (!tramTs.measured && !ORTHO_P.off?.has("tramsnap")) snapTracksToBeds(tramTs, beds);

  if (!polys.length) return estimateFromOsm(way);
  // Areas above the ground (bridge decks, Brno's MTVU level 1) count only for a cut on a bridge, and
  // then before the ground under them.
  if (polys.some((p) => p.level)) {
    const onBridge = way.tags?.bridge && way.tags.bridge !== "no";
    polys = onBridge ? [...polys.filter((p) => p.level), ...polys.filter((p) => !p.level)] : polys.filter((p) => !p.level);
  }

  const classifyAll = (osmParking) => absorbParkingSlivers(mergeTiny(classify(center, normal, half, [
    ...osmPlatformPolygons(osm, frame),
    // Special stalls (ZTP, deliveries…) before the plain sections that contain them.
    ...parking.filter((p) => p.kind !== "useky").map((p) => ({ ...p, code: TSK_CODES[p.kind] || TSK_PARKING, use: p.kind })),
    ...parking.filter((p) => p.kind === "useky").map((p) => ({ ...p, code: TSK_PARKING, orient: p.orient || orientFromStalls(p, dir) })),
    ...osmOutdoorPolygons(osm, frame),
    ...(osmParking ? osmParkingPolygons(osm, frame, way) : []),
    ...polys,
  ])));
  const axisRun = (rs) => rs.findIndex((r) => r.s <= axisT && r.e >= axisT);
  let runs = classifyAll(true);
  // An OSM street-parking area under the street axis covers the carriageway itself (drawn
  // over the whole street): the bays cannot be told apart, so the technical map alone decides.
  if (runs[axisRun(runs)]?.code === OSM_PARKING) runs = classifyAll(false);
  runs = capParallelBay(runs, axisT);
  // roadOnPath (Prague, Bára 15. 11. 2026): a "sidewalk or park path" (702) at least ROAD_ON_PATH_MIN wide that an
  // OSM road crosses is its roadway, as an estimate, where the technical map has no roadway along the whole cut
  // (Poncarova: MTVU codes a two-lane road 702). OSM's sidewalks play no part. 142 cuts of Prague's samples
  // unchanged (evaluation/variants/cesta-vozovka.mjs).
  if (roadOnPath && !runs.some((r) => r.code === 700 || r.code === 701)) {
    const roads = cross.filter((c) => CAR_ROADS.has(c.way.tags?.highway) && c.way.tags?.area !== "yes");
    runs = runs.map((r) => (r.code === 702 && r.e - r.s >= ROAD_ON_PATH_MIN && roads.some((c) => c.t > r.s && c.t < r.e) ? { ...r, code: 701, guess: true } : r));
  }
  // Start at the run under the street axis and expand to the first building on each side.
  let i0 = axisRun(runs);
  // An axis inside a building (a passage): start from the nearest run that is not a building.
  if (i0 < 0 || isBuilding(runs[i0].code)) {
    const open = runs.filter((r) => !isBuilding(r.code));
    const near = open.sort((a, b) => Math.min(Math.abs(a.s - axisT), Math.abs(a.e - axisT)) - Math.min(Math.abs(b.s - axisT), Math.abs(b.e - axisT)))[0];
    i0 = runs.indexOf(near);
  }
  if (i0 < 0) return { ...estimateFromOsm(way), runs };
  const carriage = (c) => c === 700 || c === 701 || c === 705;
  // The OSM axis fixes (first Brno's, 9. 11. 2026; every city since 25. 11. 2026, Bára: one rule everywhere;
  // ?off=osafix: none, Prague's old behaviour). A paved strip under the axis between two roadways is a median, whose
  // axis is the street's middle (Prague č. 42, Generála Šišky: a single OSM axis on the 1.5 m paved divider of two
  // roadways, which the old rules made a lane and moved off the middle); ?off=osaroad drops that test.
  const axisFix = STREETS.has(way.tags?.highway) && !ORTHO_P.off?.has("osafix"), guarded = !ORTHO_P.off?.has("osaroad");
  const gap = (r) => (axisT < r.s ? r.s - axisT : axisT > r.e ? axisT - r.e : 0);
  const roadsNear = (side) => runs.some((r) => carriage(r.code) && gap(r) <= AXIS_SNAP && (side < 0 ? r.e <= axisT : r.s >= axisT));
  const onDivider = guarded && roadsNear(-1) && roadsNear(1);
  // A paved area under the axis of a street (not a path) is its roadway, as an estimate (Brno's MTVU codes a rebuilt
  // road as "manipulační plocha", e.g. Žabovřeská). Not a wide one (a 55 m construction site is no roadway to split
  // into lanes), not one narrower than a lane (ROAD_UNDER_AXIS_MIN), not a divider between two roadways.
  const paved = runs[i0].code === 1003 || runs[i0].code === 603, pavedW = runs[i0].e - runs[i0].s;
  if (axisFix && paved && pavedW <= 25 && !onDivider && !(guarded && pavedW < ROAD_UNDER_AXIS_MIN)) {
    runs[i0] = { ...runs[i0], code: 701, guess: true };
  }
  // An OSM axis a few metres beside the roadway (on its sidewalk or verge) is moved onto it, so the profile does not
  // start beside the street (Brno test of 100 cuts: axes 2–4 m off). Not from a divider between two roadways, and on a
  // dual carriageway not across to the other carriageway's side: the axis belongs to the roadway on its own side.
  if (axisFix && !carriage(runs[i0].code) && !onDivider) {
    const partnerT = guarded ? dualPartner(cross, way, half)?.t : undefined;
    const ownSide = (r) => partnerT === undefined || Math.sign(r.s + (r.e - r.s) / 2 - axisT) !== Math.sign(partnerT - axisT);
    const road = runs.filter((r) => carriage(r.code) && gap(r) <= AXIS_SNAP && ownSide(r)).sort((a, b) => gap(a) - gap(b))[0];
    if (road) {
      axisT = road.s + (road.e - road.s) / 2;
      i0 = runs.indexOf(road);
    }
  }
  // The technical map has no street surface where OSM draws a street (a new road, a field, a
  // gap in MTVU): the profile falls back to OSM and says so.
  // A named service road counts too: a new estate's street is often mapped so (Devětsilová in Prague, MTVU still a
  // field, Bára 23. 11. 2026); an unnamed one over a field is a farm drive.
  const street = !MINOR.has(way.tags?.highway) || (way.tags?.highway === "service" && !!way.tags?.name);
  if (street && isUnpaved(runs[i0]?.code)) {
    const code = runs[i0]?.code;
    return { ...estimateFromOsm(way), runs, notice: t("derive.surfaceMapHasNo", { what: code === null || code === undefined ? t("derive.noSurface") : `${t("derive.surface")} ${code} ${polys.find((p) => p.code === code)?.label || ""}`.trim() }) };
  }
  // Dual carriageway: the reach counts from the middle between the two carriageways, and green
  // between them is the median, not the end of the street.
  const partner = dualPartner(cross, way, half);
  const ref = partner ? (axisT + partner.t) / 2 : axisT;
  const between = partner ? [Math.min(axisT, partner.t), Math.max(axisT, partner.t)] : null;
  const inMedian = (r) => between && r.s >= between[0] - 0.05 && r.e <= between[1] + 0.05;
  // Expansion stops at a building, at a garden (front gardens are drawn as the edge,
  // not counted in the street width), or once a run starts too far from the axis.
  const isOpenLand = (c) => c === 100 || c === 200 || (c >= 400 && c < 500);
  // The reach on each side can be shortened by dragging the cut ends (left = larger t).
  const capL = half - Math.max(0, ref), capR = half + Math.min(0, ref);
  let reachL = Math.min(reach?.left ?? MAX_REACH, capL), reachR = Math.min(reach?.right ?? MAX_REACH, capR);
  // What lies between a street and a house on an estate: lawns, paths, roads, a parking lane. A paved
  // yard, a garden, a field or wood, water or an unknown stretch means a plot of its own (Jihlava č. 53:
  // a family house behind an overgrown plot and its yard), and the profile does not reach over it.
  const streetLand = (r) => r.code === 401 || r.code === 402 || (r.code >= 700 && r.code < 800 && !(r.code === 704 && r.e - r.s >= OPEN_LAND)) || r.code >= 9000; // 9xxx: OSM and TSK parking, platforms, medians
  // A lawn in front of a house (estates: tř. Budovatelů in Most, Bára) belongs to the street: wide
  // greenery ends the profile only where no building follows within the reach on that side.
  const houseAhead = (k, step, limit) => {
    for (; k >= 0 && k < runs.length; k += step) {
      const r = runs[k];
      if (Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit) return false;
      if (isBuilding(r.code)) return true;
      if (!streetLand(r)) return false;
    }
    return false;
  };
  // Facade to facade (Bára): a house beyond the default reach, across lawns and paths, draws the profile
  // out to it, up to the end of the data read (half). A reach shortened by hand stays as it is.
  const facade = (k, step, cap) => {
    for (; k >= 0 && k < runs.length; k += step) {
      const r = runs[k], near = step > 0 ? r.s - ref : ref - r.e;
      if (near > cap) return null;
      if (isBuilding(r.code)) return near;
      if (!streetLand(r)) return null;
    }
    return null;
  };
  if ((reach?.left ?? MAX_REACH) >= MAX_REACH) { const d = facade(i0 + 1, 1, capL); if (d !== null) reachL = Math.max(reachL, Math.min(capL, d + 0.5)); }
  if ((reach?.right ?? MAX_REACH) >= MAX_REACH) { const d = facade(i0 - 1, -1, capR); if (d !== null) reachR = Math.max(reachR, Math.min(capR, d + 0.5)); }
  // A cut end dragged out past the default reach (by hand) asks for what is out there: the profile goes over
  // fences, gardens, lawns and yards to the next building, or to the dragged end (Bára, Pardubice, Palackého).
  // Also a reach set by hand short of that, but past where the profile would end by itself (Bára, Mladá Boleslav,
  // Revoluční: an end dragged from 16 m to 20 m sprang back to the grass where the profile had stopped).
  const byHand = { L: (reach?.left ?? 0) > MAX_REACH + 0.5, R: (reach?.right ?? 0) > MAX_REACH + 0.5 };
  const onBridgeWay = way.tags?.bridge && way.tags.bridge !== "no", SIDEWALKS = new Set([702, 703]);
  const stopAt = (r, limit, k, step) => {
    if (isBuilding(r.code)) return "budova";
    if (byHand[step > 0 ? "L" : "R"]) return Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit ? "volno" : null;
    // A narrow "other structure" is a wall or parapet (e.g. an embankment wall): the profile goes on.
    if (isMinorStructure(r.code) && r.e - r.s >= WALL_MAX) return "stavba";
    if (inMedian(r)) return null;
    // A street on a bridge ends with the bridge: past its outer sidewalk lies the ground under it (Bára, Hlávkův
    // most); a roadway right after a sidewalk is the other half of the bridge (Brno, a paved median).
    if (onBridgeWay && SIDEWALKS.has(runs[k - step]?.code) && !SIDEWALKS.has(r.code) && !carriage(r.code)) return "volno";
    if (r.code >= 500 && r.code < 600 && r.e - r.s >= OPEN_LAND) return "voda";
    if (r.code === 300) return "zahrada";
    if (isOpenLand(r.code) && r.e - r.s >= OPEN_LAND && !houseAhead(k + step, step, limit)) return "zelen";
    // A large parking area beside the street is the edge of the profile, not a parking lane.
    if (r.code === 704 && r.e - r.s >= OPEN_LAND) return "parkoviste";
    // No technical-map surface over a wide stretch: nothing more to measure on this side.
    if (r.code === null && r.e - r.s >= OPEN_LAND) return "volno";
    if (Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit) return "volno";
    return null;
  };
  const walk = () => {
    let lo = i0, hi = i0, right = "volno", left = "volno";
    while (lo > 0) { const s = stopAt(runs[lo - 1], reachR, lo - 1, -1); if (s) { right = s; break; } lo--; }
    while (hi < runs.length - 1) { const s = stopAt(runs[hi + 1], reachL, hi + 1, 1); if (s) { left = s; break; } hi++; }
    return { lo, hi, right, left };
  };
  let { lo, hi, right, left } = walk();
  // Another street inside the profile, at an angle (S Street SE and Minnesota Avenue meeting at 34°, H Street NW in the
  // fork with New York Avenue: the review of 25. 11. 2026): its roadway is not this street's: the cut runs
  // through a junction, said so (?off=otherstreet: not). Ending the profile at the sidewalk or green before it was a tie
  // (docs/decisions.md) and was deleted.
  let forks = false;
  const foreign = ORTHO_P.off?.has("otherstreet") ? [] : cross.filter((c) => otherStreet(c, way, dir, cross));
  for (const step of foreign.length ? [1, -1] : []) {
    let at0 = i0;
    while (at0 >= lo && at0 <= hi && !(isRoadway(runs[at0].code) && foreign.some((c) => c.t > runs[at0].s && c.t < runs[at0].e))) at0 += step;
    if (at0 < lo || at0 > hi) continue;
    if (at0 === i0) { forks = true; continue; }
    if (byHand[step > 0 ? "L" : "R"]) continue;
    forks = true;
  }
  const handSet = (v) => typeof v === "number" && Math.abs(v - MAX_REACH) > 0.05;
  const pastL = !byHand.L && handSet(reach?.left) && left !== "budova" && reach.left > runs[hi].e - ref + 0.5;
  const pastR = !byHand.R && handSet(reach?.right) && right !== "budova" && reach.right > ref - runs[lo].s + 0.5;
  if (pastL || pastR) {
    byHand.L ||= pastL;
    byHand.R ||= pastR;
    ({ lo, hi, right, left } = walk());
  }
  const edges = { right, left };

  // A fence or wall beyond the outermost carriageway is the edge of the street (Bára: what is behind
  // the fence is not part of the street profile). Technical-map fences and walls taller than 0.3 m,
  // and OSM fences, walls and hedges.
  const fenceTs = [
    ...lineCrossings(lines.filter((l) => isLine(l) && FENCE_LINES.has(l.code)).map((l) => l.pts), center, normal, half),
    ...cross.filter((c) => FENCE_BARRIERS.has(c.way.tags?.barrier)).map((c) => c.t),
  ];
  const isCarriage = (r) => r.code === 700 || r.code === 701 || r.code === 705;
  const road = runs.slice(lo, hi + 1).filter(isCarriage);
  const roadMin = Math.min(ref, ...road.map((r) => r.s)), roadMax = Math.max(ref, ...road.map((r) => r.e));
  // A fence along a building's façade (within FENCE_AT_FACADE of it) leaves the building as the edge.
  const nearL = edges.left === "budova" ? FENCE_AT_FACADE : 0.05, nearR = edges.right === "budova" ? FENCE_AT_FACADE : 0.05;
  // A side the user dragged to a reach of his own (not the default, beyond the fence too) is his: the fence does not end it (Bára
  // 27. 11. 2026, Palackého třída in Pardubice: the cut's end at 19.9 m, the map's fence 6 m off, a sidewalk and the house
  // behind it; the fence is drawn as an item and the profile goes on to the reach).
  // A railing at the kerb (within RAIL_KERB of the outermost carriageway, the map's sidewalk or paved area behind it: Jahnova in
  // Pardubice, the technical map codes the railing that parts the sidewalk from the roadway as a fence) is no edge of the
  // street: the profile goes on past it. A fence round a garden or a yard (green or other land behind it) stays the edge.
  // ?off=zabradli: as before.
  const RAIL_KERB = 1, BEHIND = new Set([702, 703, 1003]);
  const railing = (t, sg) => !ORTHO_P.off?.has("zabradli") && Math.abs(t - (sg > 0 ? roadMax : roadMin)) <= RAIL_KERB + 0.3 && [0.3, 1.2].some((d) => BEHIND.has(runs.find((r) => sg * (r.e - (t + sg * d)) > 0 && sg * (r.s - (t + sg * d)) <= 0)?.code));
  const fenceAway = (side) => handSet(reach?.[side]);
  const fenceL = byHand.L || fenceAway("left") ? Infinity : Math.min(Infinity, ...fenceTs.filter((t) => t > roadMax + 0.3 && t < runs[hi].e - nearL && !railing(t, 1)));
  const fenceR = byHand.R || fenceAway("right") ? -Infinity : Math.max(-Infinity, ...fenceTs.filter((t) => t < roadMin - 0.3 && t > runs[lo].s + nearR && !railing(t, -1)));

  // A run cut by the reach is kept whole when little of it is left out, and dropped when
  // little of it is inside, so the profile does not end in a sliver.
  const clip = (r, lim, isEnd) => {
    const outside = isEnd ? r.e - lim : lim - r.s, inside = isEnd ? lim - r.s : r.e - lim;
    if (outside <= 0) return isEnd ? r.e : r.s;
    if (outside < REACH_SNAP) return isEnd ? r.e : r.s;
    if (inside < REACH_SNAP) return isEnd ? r.s : r.e;
    return lim;
  };
  const kept = splitMedians(runs.slice(lo, hi + 1).map((r) => ({
    ...r,
    s: Math.max(clip(r, ref - reachR, false), fenceR),
    e: Math.min(clip(r, ref + reachL, true), fenceL),
  })).filter((r) => r.e - r.s > 0.05), cross, lineCrossings(lines.filter((l) => isLine(l) && GUARD_RAILS.has(l.code)).map((l) => l.pts), center, normal, half));
  // A profile cut short by the user ends in open space, not at the building behind.
  if (!kept.length) return { ...estimateFromOsm(way), runs };
  if (kept[0].s > runs[lo].s + 0.05) edges.right = "volno";
  if (kept.at(-1).e < runs[hi].e - 0.05) edges.left = "volno";
  if (Math.abs(kept[0].s - fenceR) < 0.06) edges.right = "plot";
  if (Math.abs(kept.at(-1).e - fenceL) < 0.06) edges.left = "plot";
  // A strip under FENCE_SLIVER between the sidewalk and the fence (the fence base, a kerb) joins its neighbour.
  if (edges.left === "plot" && kept.length > 1 && kept.at(-1).e - kept.at(-1).s < FENCE_SLIVER) { kept.at(-2).e = kept.at(-1).e; kept.pop(); }
  if (edges.right === "plot" && kept.length > 1 && kept[0].e - kept[0].s < FENCE_SLIVER) { kept[1].s = kept[0].s; kept.shift(); }
  const segs = [];
  const kerbReqs = [];
  // Each roadway with the tags of its own OSM way, for the signs of its lanes (signs.js): on a street of two
  // roadways the other one's rules are not the clicked way's (Hradec, Hlavní: a living street beside the road).
  const roads = [];
  // Inside (or within 100 m of) a paid parking zone, from the TSK zone boundaries (caller's inZps);
  // without them, TSK parking sections along the cut stand for the zone.
  const inZps = zoneKnown ?? parking.some((p) => p.kind === "useky");
  // A sidewalk beyond the kerb of roadway r on side sd (L: larger t): a footway or cycle path surface, past a
  // green strip; or the street's OSM sidewalk tags on that side (st.osmSide) or a footway along the street.
  const walkBeyond = (r, sd, after, before, st, tags) => {
    const step = sd === "L" ? after : before;
    let x = step(r), green = 0;
    while (x && ((x.code >= 400 && x.code < 500) || x.e - x.s < 0.5) && green + x.e - x.s <= WALK_GREEN) { green += x.e - x.s; x = step(x); }
    if (x && (x.code === 702 || x.code === 703)) return true;
    const t = tags || {}, osmSide = st?.osmSide;
    if (["both", "yes", "separate", osmSide].includes(t.sidewalk) || ["yes", "separate"].includes(t[`sidewalk:${osmSide}`]) || ["yes", "separate"].includes(t["sidewalk:both"])) return true;
    const kerb = sd === "L" ? r.e : r.s, k = sd === "L" ? 1 : -1;
    return cross.some((c) => {
      const h = c.way.tags?.highway, d = (c.t - kerb) * k;
      return d > -0.5 && d <= WALK_OSM && Math.abs(c.d[0] * dir[0] + c.d[1] * dir[1]) >= 0.8 &&
        (c.way.tags.footway === "sidewalk" || ["footway", "path", "cycleway", "pedestrian"].includes(h));
    });
  };
  // Built-up area at a kerb (offset kerb, k = 1 outwards to larger t): the profile ends at a building there,
  // or a building of OSM or of the surfaces has a corner within BUILT_ALONG along the street and BUILT_OUT out.
  let buildingRings = null;
  const builtUp = (kerb, k, edge) => {
    if (edge === "budova") return true;
    buildingRings ??= [
      ...(osm.elements || []).filter((el) => el.type === "area" && TUNED_BUILDING(el.tags)).map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat))),
      ...polys.filter((p) => isBuilding(p.code)).flatMap((p) => p.rings || []),
    ];
    const [cx, cy] = at(kerb);
    const uv = ([x, y]) => [(x - cx) * dir[0] + (y - cy) * dir[1], ((x - cx) * normal[0] + (y - cy) * normal[1]) * k];
    // An outline edge reaching into the box [−BUILT_ALONG, BUILT_ALONG] × [0, BUILT_OUT] (clipped, Liang–Barsky).
    const hits = ([u0, v0], [u1, v1]) => {
      let a = 0, b = 1;
      for (const [p, q] of [[u0 - u1, u0 + BUILT_ALONG], [u1 - u0, BUILT_ALONG - u0], [v0 - v1, v0], [v1 - v0, BUILT_OUT - v0]]) {
        if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
        const r = q / p;
        if (p < 0) a = Math.max(a, r); else b = Math.min(b, r);
        if (a > b) return false;
      }
      return true;
    };
    return buildingRings.some((ring) => ring.some((p, i) => i > 0 && hits(uv(ring[i - 1]), uv(p))));
  };
  // Is a run the national DTM's tram area (dmvs.js: in the roadway or apart from it), not MTVU's separate bed?
  const dtmTramIn = (r) => { const [x, y] = at((r.s + r.e) / 2); return polys.some((p) => p.dtmTram && x >= p.bbox[0] && x <= p.bbox[2] && y >= p.bbox[1] && y <= p.bbox[3] && inside(p.rings, x, y)); };
  for (const r of kept) {
    const type = typeFromMtvu(r.code);
    if (r.code === 701 || r.code === 700) {
      const inRun = (t) => t > r.s && t < r.e;
      // (A cycle track a planimetric map's roadway had cut out at its side, towns/planimetrics.js osmTracks: an axis under it
      // is this roadway's.)
      const carvedBy = kept.filter((k) => k.carved && (Math.abs(k.e - r.s) < 0.15 || Math.abs(k.s - r.e) < 0.15));
      const onRoad = (t) => inRun(t) || carvedBy.some((k) => t > k.s && t < k.e);
      // OSM road axes in this carriageway: each lane takes the direction of the nearest one.
      const here = cross.filter((c) => onRoad(c.t) && c.way.tags?.highway && !MINOR.has(c.way.tags.highway));
      // A roadway surface crossed only by a track, service road or footway is an access way,
      // not a street with lanes (e.g. a sidewalk that cars may occasionally use).
      const minor = cross.filter((c) => inRun(c.t) && MINOR.has(c.way.tags?.highway));
      // …unless trams or buses use it (a pedestrian zone with public transport keeps its roadway).
      const inside = tramTs.filter(inRun);
      inside.measured = tramTs.measured;
      // A roadway in a pedestrian zone (highway=pedestrian) stays a roadway too (Bára: a pedestrian-zone
      // carriageway is not a sidewalk), as one lane both ways unless lanes are tagged.
      const transit = inside.length > 0 || minor.some((c) => c.way.tags.highway === "pedestrian" ||
        ["yes", "designated"].includes(c.way.tags.bus) || ["yes", "designated"].includes(c.way.tags.psv));
      // (The street's own: its axis crosses it, or, by default (ORTHO_P.axisroad; ?axisroad=0 turns it off), the axis fix above moved the axis
      // onto it: Lippard Avenue in San Francisco, the axis in the parking lane the curb carved, the rest a footway's. Off:
      // 1 of 290 cuts of five cities changes, too few to measure; evaluation/usa/sf/fixes/REPORT.md.)
      const ownRoad = cross.some((c) => c.way.id === way.id && inRun(c.t)) || (!!ORTHO_P.axisroad && inRun(axisT));
      if (!here.length && minor.length && !transit && !(ownRoad && !MINOR.has(way.tags.highway))) {
        const foot = minor.some((c) => ["footway", "pedestrian", "path", "steps"].includes(c.way.tags.highway));
        // A cycle way (OSM highway=cycleway, or a path for bicycles) over the surface is a cycle track: a map that
        // draws it as a roadway (Bratislava's town map, Dunajská; Bára 16. 11. 2026) does not make it an access road.
        const bike = minor.some((c) => c.way.tags.highway === "cycleway" || (c.way.tags.highway === "path" && c.way.tags.bicycle === "designated"));
        segs.push({ type: bike ? "cyklostezka" : foot ? "chodnik" : "obsluzna", s: r.s, e: r.e, source: "dtm" });
        continue;
      }
      const own = here.find((c) => c.way.id === way.id) || here[0];
      const tags = own?.way.tags || (transit ? (minor.find((c) => c.way.tags.highway === "pedestrian") || minor[0])?.way.tags : null) || way.tags || {};
      const axes = (here.length ? here : [{ t: axisT, way, d: dir }]).map((c) => {
        const t2 = c.way.tags || {};
        const oneway = isOnewayTags(t2) || t2.junction === "roundabout";
        const along = (c.d[0] * dir[0] + c.d[1] * dir[1] >= 0) !== (t2.oneway === "-1");
        // A pedestrian or residential zone has no lanes marked: its roadway is one lane (Bára; třída Míru in
        // Pardubice), whatever OSM counts (lanes=2 there counts the buses' contraflow).
        const zone = t2.highway === "pedestrian" || t2.highway === "living_street";
        const lanes = zone ? 1 : parseInt(t2.lanes, 10) || (oneway ? 1 : 2);
        const geomAlong = c.d[0] * dir[0] + c.d[1] * dir[1] >= 0;
        return { t: c.t, oneway, along, geomAlong, lanes, id: c.way.id, tags: t2 };
      });
      const dirAt = (m) => {
        const a = axes.reduce((b, x) => (Math.abs(x.t - m) < Math.abs(b.t - m) ? x : b));
        if (a.oneway) return a.along ? "forward" : "backward";
        // Two-way: traffic keeps right, so the half left of the axis runs against the cut's street (keeping left,
        // countries/<ISO>.js leftHand: the other half; a one-way axis keeps the direction of its geometry).
        return (m > a.t) !== !!country.leftHand ? "backward" : "forward";
      };
      const lanesTotal = [...new Map(axes.map((a) => [a.id, a.lanes])).values()].reduce((x, y) => x + y, 0);
      const ownAxis = own ? axes.find((a) => a.id === own.way.id) : null;
      const parked = [];
      // A parking bay already measured (MTVU 704) or mapped (OSM area) next to the roadway
      // stands for the street-side parking in the tags.
      const isBay = (x) => x?.code === OSM_PARKING || isTskParking(x?.code) || x?.code === 704;
      if (isBay(kept[kept.indexOf(r) + 1])) parked.push("L");
      if (isBay(kept[kept.indexOf(r) - 1])) parked.push("R");
      // Each curb takes its side tags from the OSM axis nearest to it: on a dual carriageway
      // mapped as two one-way ways, both carriageways' right sides are the outer curbs.
      const edgeTags = (side) => {
        const at = side === "L" ? r.e : r.s;
        const a = axes.reduce((b, x) => (Math.abs(x.t - at) < Math.abs(b.t - at) ? x : b));
        const osmSide = (side === "L") === a.geomAlong ? "left" : "right";
        return sideTags(a.tags || tags, osmSide);
      };
      const sideTagsLR = { L: edgeTags("L"), R: edgeTags("R") };
      // A cycle track a map measured right beside the kerb (Paris's Plan de voirie, 703) is the cycle way OSM tags on that
      // side (cycleway:<side>=lane on the road for a track beside it): no cycle lane in the roadway as well (the hostile
      // review of France: Rue de Cléry had a cycle lane 1.5 m and the map's track 1.35 m side by side). ?off=kolodvakrat.
      const besideTrack = (x) => x?.code === 703 && !ORTHO_P.off?.has("kolodvakrat");
      for (const [side, x] of [["L", kept[kept.indexOf(r) + 1]], ["R", kept[kept.indexOf(r) - 1]]]) {
        if (besideTrack(x) && sideTagsLR[side].bike === "cyklopruh") sideTagsLR[side] = { ...sideTagsLR[side], bike: null };
      }
      // A city's register of parking stretches (Paris, towns/france.js: points in the middle of the strip with its length,
      // depth and arrangement) decides each kerb: a stretch reaching the cut whose point lies at this kerb, inside the
      // roadway up to its depth (± KERB_PARK_TOL), is parking there; a kerb with none has no parking (the register
      // covers the whole city). Only a stretch of this street where the register names one (its nomvoie in OSM's name),
      // except on a square: the register names its sides by the streets (Place des Alpes: Bd Vincent Auriol).
      if (kerbParking) {
        const plain = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
        const name = /^(PLACE|SQUARE|CARREFOUR|ROND POINT|PARVIS|ESPLANADE) /.test(plain(tags.name)) ? "" : plain(tags.name);
        for (const [side, kerb, k] of [["L", r.e, -1], ["R", r.s, 1]]) {
          const hit = kerbParking.find((p) => {
            const a = (p.xy[0] - center[0]) * dir[0] + (p.xy[1] - center[1]) * dir[1], t = (p.xy[0] - center[0]) * normal[0] + (p.xy[1] - center[1]) * normal[1];
            const into = (t - kerb) * k;
            return Math.abs(a) <= p.len / 2 + KERB_PARK_ALONG && into >= -KERB_PARK_TOL && into <= p.w + KERB_PARK_TOL && (!p.street || !name || name.includes(plain(p.street)));
          });
          sideTagsLR[side] = hit ? { ...sideTagsLR[side], parking: true, parkingNo: false, parkingWidth: hit.w, parkingOrient: hit.orient, kerbPos: null, kerbDepth: 0 }
            : { ...sideTagsLR[side], parking: false, parkingNo: true, kerbPos: null, kerbDepth: 0 };
        }
      }
      // The neighbours of the roadway, past the profile end too when the end is a real one (a building), not
      // one cut by the reach.
      const ri = kept.indexOf(r);
      const after = (x) => runs.find((y) => y.s >= x.e - 0.01 && y !== x);
      const before = (x) => [...runs].reverse().find((y) => y.e <= x.s + 0.01 && y !== x);
      const next = kept[ri + 1] || (edges.left === "volno" ? null : after(r));
      const prev = kept[ri - 1] || (edges.right === "volno" ? null : before(r));
      // Outer curbs, where the estimate of parked cars may go: not at a median, a tram bed or another roadway
      // (a sidewalk there or not, Bára).
      // A green strip up to 15 m with a roadway behind it is a median too (Ostrava č. 78).
      const road = (x) => x && (x.code === 700 || x.code === 701);
      const inner = (x, y) => x && (x.code === MEDIAN || x.code === 705 || road(x) || inMedian(x) || (x.code >= 400 && x.code < 500 && x.e - x.s <= 15 && road(y)));
      const kerbOpen = [["L", !inner(next, kept[ri + 2])], ["R", !inner(prev, kept[ri - 2])]].filter(([, ok]) => ok).map(([sd]) => sd);
      // Cars on the sidewalk at an outer kerb: carved out of it after the split; where a bay is measured or mapped
      // there (parked), the bay keeps its width and only takes the position from OSM.
      for (const [side, st, at] of [["L", sideTagsLR.L, r.e], ["R", sideTagsLR.R, r.s]]) {
        if (st.kerbPos && kerbOpen.includes(side)) kerbReqs.push({ side, at, w: st.kerbDepth, orient: st.parkingOrient, pos: st.kerbPos, bay: parked.includes(side) });
      }
      // Kerbs without a sidewalk outside the built-up area (Bára): no parking is estimated there.
      const kerbBare = kerbOpen.filter((sd) => !walkBeyond(r, sd, after, before, edgeTags(sd), tags) && !builtUp(sd === "L" ? r.e : r.s, sd === "L" ? 1 : -1, edges[sd === "L" ? "left" : "right"]));
      // Half of a divided road: across a median or a green strip (up to 15 m) lies another roadway.
      const k = kept.indexOf(r), isRoad = (x) => x && (x.code === 701 || x.code === 700);
      const sep = (a, b) => isRoad(b) && a && (a.code === MEDIAN || inMedian(a) || (a.code >= 400 && a.code < 500 && a.e - a.s <= 15));
      const divided = sep(kept[k - 1], kept[k - 2]) || sep(kept[k + 1], kept[k + 2]);
      // Trolley wires over the street (OSM trolley_wire, or over one direction only: trolley_wire:forward /
      // :backward, Plzeň): its bus lanes carry trolleybuses (Jihlava, Brno).
      const trolley = [tags, ...axes.map((a) => a.tags)].some((t) => ["", ":forward", ":backward"].some((k) => t?.[`trolley_wire${k}`] === "yes"));
      // The class of the street by TSK (Prague): on collector and main roads (MK I, II, roads of the state) cars
      // do not park at the kerb, whatever OSM calls them, so no parking is estimated there. Elsewhere OSM decides
      // (A/B: an MK III that OSM calls tertiary had no parked cars in 5 of 6 cuts, evaluation/archive/praha-opendata).
      const cls = streetClass(lines, (r.s + r.e) / 2);
      const guessPark = noParkGuess || (cls && (cls.road || cls.motorway || cls.mk === 1 || cls.mk === 2)) ? false : undefined;
      // A state without street classes of its own here (Austria): the OSM highway gives the group (countries/AT.js).
      const roadClass = classGroup(cls) ?? (country.roadClassFromOsm ? osmGroup(tags.highway) : null);
      // fwd: the roadway's traffic runs along the cut's direction (undefined: not known); signs.js, a one-way roadway of a divided street.
      roads.push({ s: r.s, e: r.e, tags, fwd: ownAxis ? ownAxis.along !== (tags.oneway === "-1") : undefined });
      const noCars = carsBanned(tags), toBus = noCars && transitAllowed(tags);
      segs.push(...splitRoadway(r, { guessPark, osmParkGive, lanesImage, tags, trams: inside, dirAt, lanesTotal, along: ownAxis ? (ownAxis.along !== (tags.oneway === "-1")) : true, single: new Set(axes.map((a) => a.id)).size === 1, parked, sides: sideTagsLR, kerbOpen, kerbBare, inZps, axesOneway: axes.every((a) => a.oneway), axes, axisInside: here.length > 0, divided, roadClass }).map((x) => ({ ...x, mtvu: r.code, ...(noCars && x.type === "pruh" && (toBus ? { type: "bus" } : { noCar: true })),
        // Bus lanes carry trolleybuses; so does the lane of a zone closed to cars but open to public transport
        // (třída Míru in Pardubice: motor_vehicle=delivery, psv=yes).
        trolley: trolley && (x.type === "bus" || x.type === "bus_cyklo" || toBus || (x.type === "pruh" && transitOnly(tags))),
        // The wires hang over the lanes (drawn in the profile).
        wires: trolley && WIRED.has(x.type), roadClass })));
    } else if (r.code === MEDIAN) {
      segs.push({ type: "delici", s: r.s, e: r.e, source: "dtm" });
    } else if (isMinorStructure(r.code)) {
      segs.push({ type: "zed", s: r.s, e: r.e, source: "dtm" });
    } else if (r.code === OSM_PLATFORM) {
      segs.push({ type: "nastupiste", s: r.s, e: r.e, source: "osm" });
    } else if (isTskParking(r.code)) {
      segs.push({ type: "parkovani", s: r.s, e: r.e, source: "tsk", orient: r.orient, use: r.use });
    } else if (r.code === OSM_OUTDOOR) {
      segs.push({ type: "zahradka", s: r.s, e: r.e, source: "osm" });
    } else if (r.code === OSM_PARKING) {
      segs.push({ type: "parkovani", s: r.s, e: r.e, source: "osm", orient: r.orient });
    } else if (type === "tramvaj" && dtmTramIn(r) && [kept[kept.indexOf(r) - 1], kept[kept.indexOf(r) + 1]].every((n) => n && (n.code === 700 || n.code === 701))) {
      // The national DTM's tram area with the roadway on both sides and no curb or green between: the tracks lie
      // in the roadway (Olomouc, Sokolská; Bára), a track each way when it is wide enough.
      const parts = r.e - r.s > 5 ? [[r.s, (r.s + r.e) / 2, "forward"], [(r.s + r.e) / 2, r.e, "backward"]] : [[r.s, r.e, undefined]];
      for (const [a, b, d] of parts) segs.push({ type: "tramvaj_v_pruhu", s: a, e: b, dir: d, source: "dtm" });
    } else if (type === "tramvaj" || (type === "zelen" && r.e - r.s >= GRASS_BED_MIN && tramTs.some((t) => t > r.s + 0.5 && t < r.e - 0.5))) {
      // A separate tram bed (MTVU 705 and the towns' equivalents), or a green area with tracks in it: a bed
      // of grass. Wider than 5 m it carries a track each way.
      const bed = type === "zelen" ? { kind: "trava", source: "dtm" } : bedOf(cross, r);
      // A green area is a bed only round its tracks (1.75 m beyond the outer axes); the rest stays green (Werichova:
      // a 36 m lawn with two tracks drew two trams of 18 m).
      let s0 = r.s, e0 = r.e;
      if (type === "zelen") {
        const ins = tramTs.filter((t) => t > r.s && t < r.e);
        s0 = Math.max(r.s, Math.min(...ins) - 1.75); e0 = Math.min(r.e, Math.max(...ins) + 1.75);
        if (s0 - r.s < 0.5) s0 = r.s;
        if (r.e - e0 < 0.5) e0 = r.e;
        if (s0 > r.s) segs.push({ type: "zelen", s: r.s, e: s0, source: r.code === null ? "odhad" : "dtm" });
      }
      const parts = e0 - s0 > 5 ? [[s0, (s0 + e0) / 2, "forward"], [(s0 + e0) / 2, e0, "backward"]] : [[s0, e0, undefined]];
      for (const [a, b, d] of parts) segs.push({ type: "tramvaj", s: a, e: b, dir: d, bed: bed.kind, bedSource: bed.source, source: "dtm" });
      if (e0 < r.e) segs.push({ type: "zelen", s: e0, e: r.e, source: r.code === null ? "odhad" : "dtm" });
    } else if (type === "railway") {
      // A railway track of OSM beside the street (ortho-osm.js heavyRail): a gravel bed; a narrow gauge is drawn narrower.
      segs.push({ type: "railway", s: r.s, e: r.e, source: "osm", ...(cross.some((c) => c.way.tags?.railway === "narrow_gauge" && c.t > r.s - 0.3 && c.t < r.e + 0.3) && { narrow: true }) });
    } else if (type === "cyklostezka") {
      segs.push(...cycleTrack(r, cross, dir));
    } else {
      if (type === "chodnik") segs.push(...sidewalkUse(r, cross, way, axisT, dir));
      else segs.push({ type, s: r.s, e: r.e, source: r.code === null ? "odhad" : "dtm", ...(type === "parkovani" && r.orient && { orient: r.orient }) });
    }
  }
  // Tracks with no car lane beside them in their roadway, while the cars have lanes of their own
  // elsewhere in the street, lie between the carriageways (Patočkova): a tram belt.
  if (segs.some((x) => x.type === "pruh")) {
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].type !== "tramvaj_v_pruhu") continue;
      let j = i;
      while (segs[j + 1]?.type === "tramvaj_v_pruhu") j++;
      const besideCars = [segs[i - 1], segs[j + 1]].some((x) => x && TRAFFIC.has(x.type) && x.type !== "tramvaj_v_pruhu");
      // Tracks of a street with rails in its roadway (embedded_rails) are a reserved tram lane, level with it;
      // without, the tracks lie apart from the carriageway: a separate tram bed (Bára).
      if (!besideCars) {
        for (let k = i; k <= j; k++) {
          if (segs[k].embedded) segs[k].type = "tramvaj_pruh";
          else Object.assign(segs[k], { type: "tramvaj", bed: "panely", bedSource: "odhad" });
        }
      }
      i = j;
    }
  }
  // Buses on the tram tracks (psv / bus = yes or designated, highway=busway on a tram way): the tram part is
  // a lane for trams and buses (Prague: about 186 such tracks).
  const busTracks = cross.filter((c) => c.way.tags?.railway === "tram" && tramWithBus(c.way.tags)).map((c) => c.t);
  for (const x of segs) if (TRAM_KINDS.has(x.type) && busTracks.some((t) => t >= x.s - 0.3 && t <= x.e + 0.3)) x.withBus = true;
  // The surface of the beds nobody describes: the orthophoto (ortho: ortho.js bedOrtho) and the rules.
  bedSurfaces(segs, { rails: tramTs, ortho, at, dir, highway: way.tags?.highway });
  // Roadway outer edges are measured; only the internal split comes from OSM.
  const kerbNotes = [];
  const withKerb = carveKerbParking(markIslands(segs, lawAt), kerbReqs, kerbNotes);
  const withPlatforms = insertPlatforms(withKerb, platformPositions(osm, frame, center, normal, half), axisT);
  const parkedTrees = [];
  // In a pedestrian zone the estimate's unknown is the zone's walking surface (pedestrianZone below makes it a
  // sidewalk): its trees stand there too, so it takes them as a sidewalk would.
  const zoneWalk = way.tags?.highway === "pedestrian" && !ORTHO_P.off?.has("pesizona");
  const withTrees = insertTrees(withPlatforms, treePositions(osm, frame, center, normal, half, lines, reachItems), parkedTrees, zoneWalk);
  const withItems = attachItems(perpDepth(mergeParking(withTrees)), [...itemPositions(osm, frame, center, normal, half, lines, reachItems), ...parkedTrees]);
  // Points 4 m inside the buildings at both ends, for their height and number of floors.
  const probe = { left: at(kept.at(-1).e + 4), right: at(kept[0].s - 4) };
  for (const side of ["left", "right"]) {
    if (edges[side] !== "budova") continue;
    const b = buildingAt(osm, frame, probe[side]);
    const point = frame.toLonLat(...probe[side]);
    edges[`${side}Info`] = { levels: b?.levels, height: b?.height, point, km: +centreKm(point).toFixed(1), block: b?.block, tint: side === "left" ? 0 : 3 };
    if (b?.type && b.type !== "yes") edges[`${side}Info`].type = b.type;
    if (b?.roofShape) edges[`${side}Info`].roofShape = b.roofShape;
    if (b?.start) edges[`${side}Info`].start = b.start;
    // The footprint (m²): a small house alone is a family house when nothing else is known (house-looks.js smallHouse).
    if (b?.footprint) edges[`${side}Info`].footprint = Math.round(b.footprint);
    if (b?.panel) edges[`${side}Info`].panel = 1;
    if (b?.own) edges[`${side}Info`].own = b.own;
    if (b?.around) edges[`${side}Info`].around = b.around;
    // The walls' material (OSM building:material): a wooden house in Estonia and the north, Malta's limestone
    // (house-looks.js); no Czech look reads it.
    if (b?.material) edges[`${side}Info`].material = b.material;
    if (gableToStreet(b?.axis, normal)) edges[`${side}Info`].across = 1;
    // The house stands at the sidewalk (no front yard), on a main street or one with tracks (house-looks.js, North America: no
    // porch there, a joined row a shopping street's).
    const endRun = side === "left" ? kept.at(-1) : kept[0];
    if ((endRun.code === 702 || endRun.code === 703) && endRun.e - endRun.s <= WALK_FRONT) edges[`${side}Info`].atWalk = 1;
    if (/^(primary|secondary)$/.test(way.tags?.highway || "") || tramTs.length) edges[`${side}Info`].main = 1;
    // An arcade under the house (Bára 16. 11. 2026: only where the data say so): an OSM way tagged covered=arcade,
    // colonnade or building_arcade crossing the cut by the facade (5 m in front of it to 8 m behind).
    const edgeT = side === "left" ? kept.at(-1).e : kept[0].s, out = side === "left" ? 1 : -1;
    if (cross.some((c) => ARCADE_COVER.has(c.way.tags?.covered) && (c.t - edgeT) * out > -5 && (c.t - edgeT) * out < 8)) edges[`${side}Info`].arcade = 1;
  }
  // Permeable paving from OSM (Bára 12. 11. 2026, rainwater 5.1.2): grass pavers (surface=grass_paver) of an area the
  // part's middle lies on (parking: about 300 in Czechia), or of a way crossing the part (service roads, footways,
  // paths: about 900). The only rainwater object the data show along streets.
  // Unpaved surfaces of the same (fine gravel, compacted earth…) are "nezpevneny".
  const kindOf = (t) => (PAVERS.has(t?.surface) ? true : UNPAVED.has(t?.surface) ? "nezpevneny" : null);
  const surfAreas = (osm.elements || []).filter((el) => el.type === "area" && kindOf(el.tags) && el.geometry)
    .map((el) => ({ kind: kindOf(el.tags), rings: [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat))) }));
  const surfWays = cross.filter((c) => kindOf(c.way.tags)).map((c) => ({ kind: kindOf(c.way.tags), t: c.t }));
  for (const x of withItems) {
    if (!PERMEABLE_TYPES.includes(x.type)) continue;
    const [px, py] = at((x.s + x.e) / 2);
    const hit = surfWays.find((w) => w.t > x.s && w.t < x.e) || surfAreas.find((a) => inside(a.rings, px, py));
    if (hit) x.permeable = hit.kind;
  }
  // A strip of paving under APRON along a building's wall (an apron, "okapový chodník") with green past it is no
  // sidewalk but a paved area (the rest of a sidewalk beside cars parked on it stays one): it is not walked along (Bára, Vysoké Mýto, Komenského: 0.70 m was warned as a
  // sidewalk below the minimum). withItems runs from the right end (edges.right) to the left one.
  for (const [k, side, step] of [[0, "right", 1], [withItems.length - 1, "left", -1]]) {
    const x = withItems[k], beyond = withItems[k + step];
    if (edges[side] === "budova" && x?.type === "chodnik" && x.e - x.s < APRON && APRON_BEYOND.has(beyond?.type)) x.type = "plocha";
  }
  // A part lying mostly on an area the technical map leaves open (completed along OSM), or on parking
  // stalls of a paid zone (Plzeň), is an estimate.
  const guessed = runs.filter((r) => r.guess);
  if (guessed.length) {
    for (const x of withItems) {
      const over = guessed.reduce((a, r) => a + Math.max(0, Math.min(r.e, x.e) - Math.max(r.s, x.s)), 0);
      if ((x.source === "dtm" || x.source === "tsk") && over > (x.e - x.s) / 2) x.source = "odhad";
    }
  }
  // A part measured on a town's passport says so (Bára 16. 11. 2026), not "from the technical map".
  const passports = polys.filter((p) => p.passport);
  if (passports.length) for (const x of withItems) {
    if (x.source !== "dtm") continue;
    const [px, py] = at((x.s + x.e) / 2);
    if (passports.some((p) => inside(p.rings, px, py))) x.source = "pasport";
  }
  return {
    segments: aisleOrient(withItems.reverse().map(toSegment)),
    edges: { ...edges },
    runs,
    axisT,
    roads,
    extent: [kept[0].s, kept.at(-1).e], // offsets of the right and left profile ends along the cut
    // A roadway this wide along the cut usually means the cut crosses a junction.
    junction: forks || kept.some((r) => (r.code === 701 || r.code === 700) && r.e - r.s > 25),
    ...(kerbNotes.length ? { notice: kerbNotes.join(" ") } : {}),
  };
}
