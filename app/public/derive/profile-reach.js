// Phases 3 to 5 of deriveProfile: where the profile starts (the run under the street axis), how far it reaches on each
// side (to a building, a fence, the end of the map, the reach set by hand) and the runs kept inside that.
import { isBuilding, isMinorStructure } from "../types.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { t } from "../i18n.js";
import { CAR_ROADS, MINOR, STREETS, levelTag } from "./tags.js";
import { dualPartner, lineCrossings } from "./crossings.js";
import { splitMedians } from "./classify.js";
import { estimateFromOsm } from "./estimate.js";
import { runUnder } from "./profile-prepare.js";

export const MAX_REACH = 22; // default reach of the profile from the street axis on each side (m)
const WALL_MAX = 2; // "ostatní stavby" narrower than this are walls / parapets, not a structure ending the street (m)
const OPEN_LAND = 8; // greenery at least this wide ends the profile as open surroundings (m)
const AXIS_SNAP = 4.5; // m: an OSM axis this close beside the roadway belongs to it (deriveProfile, the axis to the roadway)
const ROAD_UNDER_AXIS_MIN = 3; // m: a paved area under the axis narrower than a lane (3.00 m) is no roadway
const REACH_SNAP = 1.5; // a run cut by the reach is kept whole (or dropped) within this much (m)
const FENCE_AT_FACADE = 1; // m
const FENCE_SLIVER = 0.6; // m
// Guard rails of the technical map splitting one MTVU roadway into two carriageways.
const GUARD_RAILS = new Set([71522, 71540]);
// Fences and walls ending the street: technical map (fences and walls > 0.3 m) and OSM barriers.
const FENCE_LINES = new Set([61210, 71210, 81210, 91210]);
const FENCE_BARRIERS = new Set(["fence", "wall", "city_wall", "hedge"]);
// Streets for the axis fixes: roads and residential streets, not tracks or bridleways (Brno test č. 99).
const isRoadway = (c) => c === 700 || c === 701;
const OTHER_ANGLE = Math.cos((20 * Math.PI) / 180); // an axis turned more than 20° from the cut's street
const isLine = (l) => !!l.pts;
// Codes of the technical map (and overlays) a street axis may lie on.
// Only unpaved land under the axis (no surface, field, meadow, garden, greenery) counts as a mismatch:
// paved "other areas" (e.g. 1003) can hold a street the technical map has not split out.
const isUnpaved = (c) => c === null || c === undefined || c === 100 || c === 200 || (c >= 300 && c < 500);
const carriage = (c) => c === 700 || c === 701 || c === 705;
const isOpenLand = (c) => c === 100 || c === 200 || (c >= 400 && c < 500);
// An end of the cut dragged to a reach of its own (not the default).
const handSet = (v) => typeof v === "number" && Math.abs(v - MAX_REACH) > 0.05;

const otherStreet = (c, way, dir, cross) => {
  const t = c.way.tags || {}, own = way?.tags || {};
  return c.way.id !== way?.id && !!own.name && !!t.name && t.name !== own.name && CAR_ROADS.has(t.highway) && !/_link$/.test(t.highway) && levelTag(t) === levelTag(own)
    && Math.abs(c.d[0] * dir[0] + c.d[1] * dir[1]) < OTHER_ANGLE && !cross.some((x) => x.way.id !== c.way.id && x.way.tags?.name === own.name && Math.abs(x.t - c.t) < 4);
};

// Phase 3: the run the profile starts from, set as ctx.i0; the street axis moves onto a roadway beside it (ctx.axisT).
// Returns a finished profile (the estimate from OSM) where the surfaces have no street under the axis.
export function findAxisRun(ctx) {
  const { half, way, cross, runs, polys } = ctx;
  let { axisT } = ctx;
  // Start at the run under the street axis and expand to the first building on each side.
  let i0 = runUnder(runs, axisT);
  // An axis inside a building (a passage): start from the nearest run that is not a building.
  if (i0 < 0 || isBuilding(runs[i0].code)) {
    const open = runs.filter((r) => !isBuilding(r.code));
    const near = open.sort((a, b) => Math.min(Math.abs(a.s - axisT), Math.abs(a.e - axisT)) - Math.min(Math.abs(b.s - axisT), Math.abs(b.e - axisT)))[0];
    i0 = runs.indexOf(near);
  }
  if (i0 < 0) return { ...estimateFromOsm(way), runs };
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
  Object.assign(ctx, { i0, axisT });
}

// Phase 4a: the reach on each side (from the middle between two carriageways, to a house beyond lawns); sets
// ctx.ref, inMedian, houseAhead, reachL and reachR.
export function reachLimits(ctx) {
  const { half, way, cross, runs, reach, i0, axisT } = ctx;
  // Dual carriageway: the reach counts from the middle between the two carriageways, and green
  // between them is the median, not the end of the street.
  const partner = dualPartner(cross, way, half);
  const ref = partner ? (axisT + partner.t) / 2 : axisT;
  const between = partner ? [Math.min(axisT, partner.t), Math.max(axisT, partner.t)] : null;
  const inMedian = (r) => between && r.s >= between[0] - 0.05 && r.e <= between[1] + 0.05;
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
  Object.assign(ctx, { ref, inMedian, houseAhead, reachL, reachR });
}

// Phase 4b: walk out from the start run to the first building, garden, water or the end of the reach on each side;
// sets ctx.lo, hi (the first and last run), edges (what ends each side), forks (another street inside) and byHand.
export function walkToEdges(ctx) {
  const { dir, way, cross, runs, reach, i0, ref, inMedian, houseAhead, reachL, reachR } = ctx;
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
  const pastL = !byHand.L && handSet(reach?.left) && left !== "budova" && reach.left > runs[hi].e - ref + 0.5;
  const pastR = !byHand.R && handSet(reach?.right) && right !== "budova" && reach.right > ref - runs[lo].s + 0.5;
  if (pastL || pastR) {
    byHand.L ||= pastL;
    byHand.R ||= pastR;
    ({ lo, hi, right, left } = walk());
  }
  const edges = { right, left };
  Object.assign(ctx, { lo, hi, edges, forks, byHand });
}

// Phase 5: the runs inside the reach, cut at a fence or wall; sets ctx.kept and the edges of the profile ("volno",
// "plot"). Returns a finished profile (the estimate from OSM) when nothing is left.
export function keepRuns(ctx) {
  const { center, normal, half, way, cross, runs, lines, reach, lo, hi, ref, edges, byHand, reachL, reachR } = ctx;
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
  ctx.kept = kept;
}
