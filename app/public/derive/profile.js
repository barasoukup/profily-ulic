// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways.
import { typeFromMtvu, isBuilding, isMinorStructure, PERMEABLE_TYPES } from "../types.js";
import { country } from "../city.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { MINOR, carsBanned, classGroup, isOnewayTags, osmGroup, tramWithBus, transitAllowed, transitOnly } from "./tags.js";
import { REACH, attachItems, insertPlatforms, insertTrees, itemPositions, platformPositions, treePositions } from "./items.js";
import { OD_SECTION } from "./crossings.js";
import { MEDIAN } from "./classify.js";
import { bedOf, bedSurfaces } from "./tram.js";
import { inside } from "./geometry.js";
import { OSM_OUTDOOR, OSM_PARKING, OSM_PLATFORM, isTskParking } from "./polygons.js";
import { carveKerbParking, markIslands, mergeParking, perpDepth } from "./parking.js";
import { TUNED_BUILDING, buildingAt, centreKm, gableToStreet } from "./buildings.js";
import { sideTags, splitRoadway } from "./lanes.js";
import { cycleTrack, sidewalkUse } from "./walkways.js";
import { TRAFFIC, TRAM_KINDS } from "./part-types.js";
import { aisleOrient, toSegment } from "./output.js";
import { classifyRuns, prepareCut } from "./profile-prepare.js";
import { findAxisRun, keepRuns, reachLimits, walkToEdges } from "./profile-reach.js";

const GRASS_BED_MIN = 2.5; // a green area at least this wide with tracks in it is a grass tram bed (m)

// Lanes under trolley wires, and a street open to public transport but closed to other motor traffic.
const WIRED = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]);

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

// A house standing with its gable to the street (a village house, Bára 16. 11. 2026): a narrow footprint, clearly
// longer than wide, its long side running away from the street (along the cut).
const WALK_FRONT = 6; // m: a wider paving before a house is a yard read as a sidewalk
const ARCADE_COVER = new Set(["arcade", "colonnade", "building_arcade"]);

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
  const ctx = { center, dir, half, polys, osm, frame, way, tracks, parking, lines, reach, lanesImage, roadOnPath, normal };
  const early = prepareCut(ctx);
  if (early) return early;
  classifyRuns(ctx);
  const { cross, tramTs, runs } = ctx;
  polys = ctx.polys;
  let { axisT } = ctx;
  const early2 = findAxisRun(ctx);
  if (early2) return early2;
  reachLimits(ctx);
  walkToEdges(ctx);
  const early3 = keepRuns(ctx);
  if (early3) return early3;
  const { edges, forks, kept, inMedian } = ctx;
  axisT = ctx.axisT;
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
