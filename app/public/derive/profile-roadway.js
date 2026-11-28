// Phase 6a of deriveProfile: the parts of one roadway run. The OSM axes in it give the lanes' directions and tags, the
// neighbours its kerbs (parking, sidewalks, built-up area), and splitRoadway makes the lanes.
import { isBuilding } from "../types.js";
import { country } from "../city.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { MINOR, carsBanned, classGroup, isOnewayTags, osmGroup, transitAllowed, transitOnly } from "./tags.js";
import { OD_SECTION } from "./crossings.js";
import { MEDIAN } from "./classify.js";
import { OSM_PARKING, isTskParking } from "./polygons.js";
import { TUNED_BUILDING } from "./buildings.js";
import { sideTags, splitRoadway } from "./lanes.js";

const SECTION_NEAR = 12; // the line of a TSK street section within this of the roadway's middle is its section (m)
const KERB_PARK_TOL = 1; // a register's parking point: slack across the kerb (m)
// …and along the street: a gap of a driveway or a gate between two stretches is no kerb without parking (Paris, Rue
// Jacob: the cut 4 m past the end of a delivery bay).
const KERB_PARK_ALONG = 5;
// Outside the built-up area a kerb without a sidewalk gets no estimate (Bára): no building of OSM or of the
// city's surfaces within BUILT_ALONG along the street and BUILT_OUT out from the kerb on that side. A sidewalk
// is a footway surface beyond the kerb, past a green strip up to WALK_GREEN, or OSM's sidewalk tags or a
// footway along the street within WALK_OSM of the kerb.
const BUILT_ALONG = 40, BUILT_OUT = 40, WALK_GREEN = 10, WALK_OSM = 12;
// Lanes under trolley wires, and a street open to public transport but closed to other motor traffic.
const WIRED = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]);

// The street section of TSK whose line runs along the street nearest to the point at offset t (within
// SECTION_NEAR): its class, or null.
function streetClassAt(ctx, ls, t) {
const { at, dir } = ctx;
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
}

// A sidewalk beyond the kerb of roadway r on side sd (L: larger t): a footway or cycle path surface, past a
// green strip; or the street's OSM sidewalk tags on that side (st.osmSide) or a footway along the street.
function walkBeyond(ctx, r, sd, after, before, st, tags) {
const { cross, dir } = ctx;
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
}

// Built-up area at a kerb (offset kerb, k = 1 outwards to larger t): the profile ends at a building there,
// or a building of OSM or of the surfaces has a corner within BUILT_ALONG along the street and BUILT_OUT out.
  function builtUp(ctx, kerb, k, edge) {
const { osm, frame, polys, at, dir, normal } = ctx;
  if (edge === "budova") return true;
  ctx.buildingRings ??= [
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
  return ctx.buildingRings.some((ring) => ring.some((p, i) => i > 0 && hits(uv(ring[i - 1]), uv(p))));
}

// The roadway's OSM axes and the tram axes in it. Returns null (after adding an access way or a cycle track as the
// part) for a surface that is no street with lanes.
function roadwayAxes(ctx, r) {
  const { cross, tramTs, way, axisT, dir, kept } = ctx;
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
    ctx.segs.push({ type: bike ? "cyklostezka" : foot ? "chodnik" : "obsluzna", s: r.s, e: r.e, source: "dtm" });
    return null;
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
  return { here, inside, tags, axes, dirAt, lanesTotal, ownAxis };
}

// The side tags of the two kerbs (L: larger t) and the parking bays the neighbours stand for.
function roadwaySides(ctx, r, rw) {
  const { kept, kerbParking, center, dir, normal } = ctx;
  const { axes, tags } = rw;
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
  return { parked, edgeTags, sideTagsLR };
}

// The outer kerbs (where cars may park), the kerbs without a sidewalk in the open land and whether the street is
// divided; adds the requests for cars on the sidewalk to ctx.kerbReqs.
function roadwayKerbs(ctx, r, rw) {
  const { kept, runs, edges, inMedian, kerbReqs } = ctx;
  const { tags, parked, sideTagsLR } = rw;
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
  const kerbBare = kerbOpen.filter((sd) => !walkBeyond(ctx, r, sd, after, before, rw.edgeTags(sd), tags) && !builtUp(ctx, sd === "L" ? r.e : r.s, sd === "L" ? 1 : -1, edges[sd === "L" ? "left" : "right"]));
  // Half of a divided road: across a median or a green strip (up to 15 m) lies another roadway.
  const k = kept.indexOf(r), isRoad = (x) => x && (x.code === 701 || x.code === 700);
  const sep = (a, b) => isRoad(b) && a && (a.code === MEDIAN || inMedian(a) || (a.code >= 400 && a.code < 500 && a.e - a.s <= 15));
  const divided = sep(kept[k - 1], kept[k - 2]) || sep(kept[k + 1], kept[k + 2]);
  return { kerbOpen, kerbBare, divided };
}

// The lanes of the roadway: adds the roadway's own tags to ctx.roads and the lanes to ctx.segs.
function roadwayLanes(ctx, r, rw) {
  const { lines, noParkGuess, osmParkGive, lanesImage, inZps, roads, segs } = ctx;
  const { here, inside, tags, axes, dirAt, lanesTotal, ownAxis, parked, sideTagsLR, kerbOpen, kerbBare, divided } = rw;
  // Trolley wires over the street (OSM trolley_wire, or over one direction only: trolley_wire:forward /
  // :backward, Plzeň): its bus lanes carry trolleybuses (Jihlava, Brno).
  const trolley = [tags, ...axes.map((a) => a.tags)].some((t) => ["", ":forward", ":backward"].some((k) => t?.[`trolley_wire${k}`] === "yes"));
  // The class of the street by TSK (Prague): on collector and main roads (MK I, II, roads of the state) cars
  // do not park at the kerb, whatever OSM calls them, so no parking is estimated there. Elsewhere OSM decides
  // (A/B: an MK III that OSM calls tertiary had no parked cars in 5 of 6 cuts, evaluation/archive/praha-opendata).
  const cls = streetClassAt(ctx, lines, (r.s + r.e) / 2);
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
}

// One roadway run (MTVU 700, 701) as parts.
export function roadwayParts(ctx, r) {
  const rw = roadwayAxes(ctx, r);
  if (!rw) return;
  Object.assign(rw, roadwaySides(ctx, r, rw));
  Object.assign(rw, roadwayKerbs(ctx, r, rw));
  roadwayLanes(ctx, r, rw);
}
