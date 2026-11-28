// Lanes of a roadway: the tags of a kerb side, the split into lanes with directions, parking and the law, the lane tags.
import { country } from "../city.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { centreLine } from "../lanes-ortho.js";
import { ORIENT } from "./parking.js";
import { drivingLeft, isOnewayTags } from "./tags.js";
import { CAR_MIN, RAIL_HALF, TRAM_HALF, TRAM_LANE_HALF, tramLanes } from "./tram.js";
import { TRAM_KINDS } from "./part-types.js";

const KERB_POSITIONS = new Set(["on_kerb", "half_on_kerb"]);

const tag = (tags, ...keys) => keys.map((k) => tags[k]).find((v) => v !== undefined);

const COLOURS = { red: "#c0503f", green: "#5f9e4a", blue: "#3f6fb0" };

export function sideTags(tags, side) {
  // New scheme: parking:<side>=lane|street_side|yes + parking:<side>:orientation; old: parking:lane:<side>=parallel…
  const parking = tag(tags, `parking:${side}`, "parking:both", `parking:lane:${side}`, "parking:lane:both");
  const orientation = tag(tags, `parking:${side}:orientation`, "parking:both:orientation") || parking;
  // Cars up on the sidewalk: parking:<side>=on_kerb|half_on_kerb (new scheme), or the old
  // parking:lane:<side>=parallel|diagonal|perpendicular with parking:lane:<side>:<orientation>=on_kerb|half_on_kerb.
  const oldPos = ORIENT[parking] ? tag(tags, `parking:lane:${side}:${parking}`, `parking:lane:both:${parking}`) : undefined;
  const kerbPos = KERB_POSITIONS.has(parking) ? parking : KERB_POSITIONS.has(oldPos) ? oldPos : null;
  const depth = orientation === "perpendicular" ? 5 : orientation === "diagonal" ? 4.5 : 2;
  // On a one-way street the side-less tags (cycleway=*, busway=*) describe its right side.
  const generic = !(isOnewayTags(tags) && side === drivingLeft(tags));
  // …except opposite_* values, which describe the contraflow on its left.
  const opposite = String(tags.cycleway || "").startsWith("opposite");
  const cycle = tag(tags, `cycleway:${side}`, "cycleway:both") ??
    (generic ? (opposite ? undefined : tags.cycleway) : opposite ? tags.cycleway : undefined);
  return {
    parking: !kerbPos && ["lane", "street_side", "yes", "parallel", "diagonal", "perpendicular"].includes(parking),
    // Tagged as no parking here, or mapped as separate areas (which then would have crossed the cut); cars on
    // the sidewalk are no parking in the roadway either (no estimate there).
    parkingNo: !!kerbPos || ["no", "none", "separate"].includes(parking),
    parkingWidth: depth,
    parkingOrient: ORIENT[orientation],
    // Cars parked up on the sidewalk: fully (on_kerb, the whole car on the sidewalk) or across the kerb
    // (half_on_kerb, half the car on the sidewalk, half in the roadway). kerbDepth: the car's depth.
    kerbPos,
    kerbDepth: kerbPos ? depth : 0,
    bike: ["lane", "opposite_lane"].includes(cycle) ? "cyklopruh" : cycle === "soft_lane" ? "ochranny_pruh" : null,
    // A cycle track along the road, mapped on the road itself (cycleway:<side>=track; Denmark's usual way: the review of
    // 24. 11. 2026, 24 % of Copenhagen's streets), with its width where OSM has one (trackAlongRoad).
    track: cycle === "track" || cycle === "opposite_track",
    trackWidth: parseFloat(String(tag(tags, `cycleway:${side}:width`, "cycleway:both:width", ...(generic ? ["cycleway:width"] : [])) || "").replace(",", ".")) || null,
    trackOneway: tag(tags, `cycleway:${side}:oneway`, "cycleway:both:oneway", ...(generic ? ["cycleway:oneway"] : [])),
    sharrow: cycle === "shared_lane",
    // Cyclists allowed in the bus lane along this curb (vyhrazený pruh BUS + cyklisté).
    shareBus: cycle === "share_busway" || cycle === "opposite_share_busway",
    // Contraflow cycling: explicit opposite_* values, cycleway:<side>:oneway=-1, or the left side of a
    // one-way street open to cyclists both ways (oneway:bicycle=no), where the contraflow is marked.
    contra: ["opposite_lane", "opposite", "opposite_track"].includes(cycle) || tags[`cycleway:${side}:oneway`] === "-1"
      || (side === drivingLeft(tags) && isOnewayTags(tags) && tags["oneway:bicycle"] === "no" && !!cycle && cycle !== "no"),
    osmSide: side,
    bikeColor: COLOURS[tag(tags, `cycleway:${side}:surface:colour`, "cycleway:both:surface:colour", "cycleway:surface:colour")],
    // Bus lane along this curb: busway:<side>=lane (old scheme: busway=lane for both sides).
    bus: ["lane", "opposite_lane"].includes(generic ? tag(tags, `busway:${side}`, "busway:both", "busway") : tag(tags, `busway:${side}`, "busway:both")),
  };
}

const BIKE_WIDTH = { cyklopruh: 1.5, ochranny_pruh: 1.5 }; // basic widths (Bára: the protective lane too 1.5 m)
// A bike lane next to parking includes the door-opening clearance (TP 179 tab. 2, IPR Manuál
// C.2): 1.75 m beside parallel parking, 2.0 m beside perpendicular or angled parking.
const bikeWidth = (type, parkOrient) =>
  !parkOrient ? BIKE_WIDTH[type] : parkOrient === "podelne" ? 1.75 : 2;

const MIN_LANE = 2.5; // narrowest driving lane kept when curb strips are carved out (m)
const OSM_LANE_GIVE = 0.3; // what each lane of an estimated roadway may give up for parking tagged in OSM (m)
// Widest driving lane before the rest becomes a shoulder / hatched area (m). ČSN 73 6110 lanes
// are 3.0–3.5 m, but Prague streets commonly have 4 m lanes (Bára: an 8 m street is two 4 m lanes,
// no shoulder); motorways and expressways 3.75 m with a hard shoulder.
export const LANE_CAP = {
  motorway: 3.75, trunk: 3.75, motorway_link: 3.75, trunk_link: 3.75,
  // Local streets: a wider lane is normal (cars pass the parked ones), no shoulder there.
  residential: 4.5, unclassified: 4.5, service: 4.5,
};
export const LANE_CAP_DEFAULT = 4;
// The cap by the class of the street (Prague: TSK's class, classGroup), before OSM's highway: on motorways and
// MK I (the main network: rapid and the main collector roads) 3.75 m, as on OSM's motorways and trunks (ČSN 73
// 6110 group A: 3.50 m lanes). A/B on the orthophoto (evaluation/archive/rules-2026-11): their marked lanes are about
// 3.5 m; a cap of 4 m for MK II and 4.5 m for MK IV did not help, so there OSM decides.
const LANE_CAP_CLASS = { dalnice: 3.75, mk1: 3.75 };
export const KRAJNICE_MIN = 1; // narrowest shoulder / hatched strip drawn (m)
const BUS_FROM_SHOULDER = 2.75; // a shoulder taken for a bus lane OSM tags at that kerb (m)
// Streets where cars commonly park at the curb even where neither TSK nor OSM says so.
// Not on main streets (secondary, tertiary and up): there the curb is mostly kept free (Bára).
// Not in a residential zone (living_street, Bára): § 39 of act 361/2000 Sb. allows parking there only in marked
// places, so only parking from OSM or the city's data is drawn.
const PARK_GUESS = new Set(["residential", "unclassified"]);
const GUESS_PARK_W = 2; // estimated parallel parking strip (m)

// § 25 of act 361/2000 Sb. (silniční provoz): a parked car leaves a lane at least LAW_LANE wide free for each
// direction (odst. 3) and keeps LAW_RAIL from the nearest tram rail (odst. 2, from 5 to 19 h).
const LAW_RAIL = 3.5;
// The free lane by the law of the state (countries/<ISO>.js freeLane): Czechia and Slovakia 3 m per direction, Austria
// about 2.6 m (StVO § 24).
const lawLane = () => country.freeLane;
// The width the law leaves beside parked cars: the free lane per direction, or the state's own rule
// (countries/<ISO>.js lawNeed; Germany: 3.05 m to pass, the lanes kept at MIN_LANE each).
export const lawNeedFor = (oneway, lanesTotal) => (country.lawNeed ? country.lawNeed(oneway, lanesTotal, MIN_LANE) : lawLane() * Math.max(oneway ? 1 : 2, lanesTotal));

// A slight turn is drawn as the turn itself (Bára: "slight_right" with the arrow to the right).
const SLIGHT = { slight_right: "right", slight_left: "left" };
const turnList = (v) => (v ? v.split("|").map((x) => [...new Set((x || "none").split(";").map((y) => SLIGHT[y] || y))].join(";")) : null);

// Split one roadway run [s,e] into parking, bike and driving/tram lanes using OSM tags.
// ctx.dirAt(t): driving direction ("forward"/"backward" relative to the cut's street) at offset t,
// from the nearest OSM road axis, so both carriageways of a dual carriageway are right.
// ctx.along: the run's own OSM way points the same way as the cut's street (its left = our left).
// ctx.parked: sides ("L"/"R") already having a parking bay next to this run.
// The tracks lie between the two one-way carriageways of a dual road (OSM axes on both sides of them, neither with
// rails in it): { R, L } lanes of the carriageway below and above them, else null (splitRoadway).
function dualBed(axes, trams) {
  if (!axes?.length || axes.some((a) => a.tags?.embedded_rails)) return null;
  const lo = Math.min(...trams), hi = Math.max(...trams), byId = (xs) => [...new Map(xs.map((a) => [a.id, a])).values()];
  const below = byId(axes.filter((a) => a.t < lo)), above = byId(axes.filter((a) => a.t > hi));
  if (!below.length || !above.length || ![...below, ...above].every((a) => a.oneway)) return null;
  return { R: below.reduce((n, a) => n + a.lanes, 0), L: above.reduce((n, a) => n + a.lanes, 0) };
}

export function splitRoadway(run, ctx) {
  const { tags, trams, dirAt, along, single, parked, sides } = ctx;
  let s = run.s, e = run.e;
  const width = e - s;
  // OSM left/right follow the way; L/R here follow the cut's street (L = larger t).
  const sideL = sides?.L ?? sideTags(tags, along ? "left" : "right");
  const sideR = sides?.R ?? sideTags(tags, along ? "right" : "left");
  // With tracks in the roadway a strip at the curb must also stay clear of the tram's swept space
  // (axis ± TRAM_HALF): parking or a bike lane tagged in OSM where the track runs close to the
  // curb is not there (e.g. Seifertova), the tram shares the lane with the cars up to the curb.
  const clear = trams.length
    ? { R: Math.min(...trams) - TRAM_HALF - s, L: e - Math.max(...trams) - TRAM_HALF }
    : { R: Infinity, L: Infinity };
  const edge = [];
  // Cars across the kerb (half_on_kerb, Bára 10. 11. 2026): the roadway half of the car at the curb, the other
  // half is taken from the sidewalk later (carveKerbParking). The data say the cars stand there, so they come
  // first, while one lane of MIN_LANE stays; the lanes then share what is left, as many as fit.
  let room = width - MIN_LANE;
  for (const [side, st] of [["R", sideR], ["L", sideL]]) {
    if (st.kerbPos !== "half_on_kerb" || parked.includes(side) || !(ctx.kerbOpen ?? ["L", "R"]).includes(side)) continue;
    const w = st.kerbDepth / 2;
    if (room < w - 1e-6 || clear[side] < w - 0.1) continue;
    edge.push({ side, type: "parkovani", w, orient: st.parkingOrient, source: "osm", position: "half_on_kerb" });
    room -= w; clear[side] -= w;
  }
  const inner = width - edge.reduce((a, x) => a + x.w, 0);
  // A roadway too narrow for the tagged (or default) lanes holds as many as fit, at least one.
  const lanesTotal = Math.max(1, Math.min(ctx.lanesTotal, Math.floor(inner / MIN_LANE + 1e-9)));
  // Curb strips are added while the driving lanes keep at least MIN_LANE each.
  let left = inner - lanesTotal * MIN_LANE;
  const fits = (side, w) => left >= w - 1e-9 && clear[side] >= w - 0.1;
  const take = (side, w) => { left -= w; clear[side] -= w; };
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (!st.bike) continue;
    const w = bikeWidth(st.bike, st.parking || parked.includes(side) ? st.parkingOrient || "podelne" : null);
    if (fits(side, w)) { edge.push({ side, type: st.bike, w }); take(side, w); }
  }
  // Parking the data put there (OSM) stays when a little room is missing in an estimated roadway (the universal
  // judging, 17. 11. 2026: an estimated roadway of 4.4 m dropped the tagged parallel parking of Großer Brockhaus for
  // 0.1 m): the stall keeps its width and the lanes give up to OSM_LANE_GIVE each (the review of the port: a narrowed
  // stall was red in Návrh at once). A measured roadway (MTVU, a technical map, a town's surface map) gives as much
  // too, unless ?off=mapfill (ctx.osmParkGive, app.js mapFill; Bára 24. 11. 2026, Apollonkatu in Helsinki: YLRE's roadway
  // of 6.9 m dropped the tagged parallel parking for 0.1 m, the cars stand there; Czechia too, evaluation/archive/mapfill-cz).
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (!st.parking || parked.includes(side)) continue;
    const w = st.parkingWidth;
    if (fits(side, w) || ((run.guess || ctx.osmParkGive) && left + OSM_LANE_GIVE * lanesTotal >= w - 1e-6 && clear[side] >= w - 0.1)) {
      edge.push({ side, type: "parkovani", w, orient: st.parkingOrient });
      take(side, w);
    }
  }
  // Cars parked at the curb, though no data says so: a parallel strip as an estimate where the law allows it
  // (Bára): § 25(3) of act 361/2000 Sb. leaves a lane of at least LAW_LANE free for each direction, so a two-way
  // street takes it from 8 m of roadway on one side and from 10 m on both, a one-way street from 5 m and 7 m.
  // The lanes beside it keep LAW_LANE too (as many as OSM counts). Next to tracks the car keeps LAW_RAIL from the
  // nearest rail (§ 25(2), from 5 to 19 h). A sidewalk at the curb does not decide; only an outer curb counts
  // (not one at a median, a tram bed or another roadway, ctx.kerbOpen).
  // Only outside the paid parking zones (Bára): inside them TSK has surveyed every stall.
  if (!ctx.inZps && (ctx.guessPark ?? PARK_GUESS.has(tags.highway))) {
    const oneway = isOnewayTags(tags) || tags.junction === "roundabout";
    const need = lawNeedFor(oneway, lanesTotal);
    // A state whose law keeps cars off some roadways altogether (countries/<ISO>.js parkOnRoadway; Slovenia: none on a
    // two-way street without a centre line, none on a one-way carriageway of two lanes).
    let lawful = country.parkOnRoadway ? country.parkOnRoadway(tags, oneway, lanesTotal) : true;
    // The centre line, read on the orthophoto, in the place of OSM's count of lanes (countries/<ISO>.js centreLine; Bára
    // 27. 11. 2026; no photo, a tram in the roadway: not known, the rule above stands). centre.required: a
    // two-way roadway has no parking without one (Slovenia, ZPrCP čl. 65/4/12); centre.solid: where the line is solid
    // the free width is measured to it, not to the opposite kerb (čl. 65/4/10).
    const cl = country.centreLine && !oneway && !trams.length && ctx.lanesImage ? centreLine(ctx.lanesImage, run.s, run.e) : null;
    if (cl && country.centreLine.required) lawful = cl.found;
    const solidAt = cl?.found && cl.kind === "solid" && country.centreLine.solid ? cl.t : null;
    const lo = trams.length ? Math.min(...trams) - RAIL_HALF : Infinity, hi = trams.length ? Math.max(...trams) + RAIL_HALF : -Infinity;
    // Keeping left (Cyprus, Malta) cars stand along the kerb on the driver's left: on a one-way street that kerb is tried
    // first (the estimate is no part of the data, so it may sit there; review of 23. 11. 2026).
    const leftKerb = country.leftHand && oneway && dirAt((s + e) / 2) === "backward";
    const order = country.leftHand && !leftKerb ? [["L", sideL], ["R", sideR]] : [["R", sideR], ["L", sideL]];
    for (const [side, st] of order) {
      if (!lawful) break;
      if (!(ctx.kerbOpen ?? ["L", "R"]).includes(side) || ctx.kerbBare?.includes(side) || parked.includes(side) || st.parkingNo || edge.some((x) => x.side === side && x.type === "parkovani")) continue;
      // Switzerland (countries/CH.js parkByCycleLane: VRV Art. 19 Abs. 2): no parking on the roadway beside a cycle lane.
      if (!country.parkByCycleLane && edge.some((x) => x.side === side && (x.type === "cyklopruh" || x.type === "ochranny_pruh"))) continue;
      const rest = width - edge.reduce((a, x) => a + x.w, 0) - GUESS_PARK_W;
      // The car's outer side, from the curb strips of this side and the strip itself.
      const own = edge.filter((x) => x.side === side).reduce((a, x) => a + x.w, 0) + GUESS_PARK_W;
      if (solidAt !== null ? (side === "R" ? solidAt - (s + own) : (e - own) - solidAt) < lawLane() - 1e-6 : rest < need - 1e-6) continue;
      const railGap = side === "R" ? lo - (s + own) : (e - own) - hi;
      if (railGap < LAW_RAIL - 1e-6) continue;
      edge.push({ side, type: "parkovani", w: GUESS_PARK_W, orient: "podelne", source: "odhad" });
    }
  }
  // Parking sits at the curb, the bike lane between it and the traffic.
  edge.sort((a, b) => (a.type === "parkovani" ? -1 : 0) - (b.type === "parkovani" ? -1 : 0));
  const leftEdge = [], rightEdge = [];
  // § 25(3) holds for cars across the kerb too: the free width left beside them (lawFree), for the notice.
  const oneway = isOnewayTags(tags) || tags.junction === "roundabout";
  const lawFree = edge.some((x) => x.position) ? width - edge.reduce((a, x) => a + x.w, 0) : null;
  const lawNeed = lawNeedFor(oneway, lanesTotal);
  for (const x of edge) {
    const extra = x.position ? { position: x.position, ...(lawFree < lawNeed - 1e-6 ? { lawFree, lawNeed } : {}) } : {};
    if (x.side === "L") { leftEdge.push({ type: x.type, s: e - x.w, e, orient: x.orient, source: x.source, ...extra }); e -= x.w; }
    else { rightEdge.push({ type: x.type, s, e: s + x.w, orient: x.orient, source: x.source, ...extra }); s += x.w; }
  }
  let mid = trams.length ? tramLanes(s, e, trams, dirAt) : [];
  // All the street's lanes fit beside the tracks (Národní: lanes=2, one on each side; Spálená: lanes:forward=1
  // and lanes:backward=1): cars do not drive on the tracks, so they are a reserved tram lane in the roadway,
  // level with it (Bára; the tram in a lane with cars is OSM's embedded_rails where the lanes do not fit). Only where OSM counts the lanes, so an unmapped parking lane is not taken for one.
  // Where the lanes fit only with the tram kept to a 3.0 m lane (axis ± TRAM_LANE_HALF; Spálená: 2.4 m beside
  // the usual envelope, 2.7 m beside this one), the narrower one is taken.
  if (trams.length && (tags.lanes || tags["lanes:forward"] || tags["lanes:backward"])) {
    const lo = Math.min(...trams), hi = Math.max(...trams);
    // The lanes OSM counts include those with the rails (railway:lanes…=tram|no: Hybešova, Dukelská in Brno, lanes=4 of
    // which two are the tram's; Bára 18. 11. 2026): the cars need the rest.
    const railLanes = ["railway:lanes", "railway:lanes:forward", "railway:lanes:backward"].reduce((a, k) => a + String(tags[k] || "").split("|").filter((v) => v === "tram").length, 0);
    const fitsBeside = (m) => {
      const cars = m.filter((x) => x.type === "pruh");
      const bothSides = cars.some((x) => x.e <= lo) && cars.some((x) => x.s >= hi);
      return cars.length >= Math.max(1, ctx.lanesTotal - railLanes) && (bothSides || isOnewayTags(tags));
    };
    const narrow = !fitsBeside(mid) && tramLanes(s, e, trams, dirAt, TRAM_LANE_HALF);
    if (narrow && fitsBeside(narrow)) mid = narrow;
    if (fitsBeside(mid)) for (const x of mid) if (x.type === "tramvaj_v_pruhu") x.type = "tramvaj_pruh";
  }
  // Tracks between the two carriageways of a dual road, which OSM maps as two one-way ways with the rails apart
  // (no embedded_rails), lie on a separate bed even where the map draws one roadway over all of it (Střelničná:
  // MTVU's 24 m roadway, the photo shows two lanes each way and a ballast bed between; Bára 23. 11. 2026).
  // Each carriageway takes its OSM lanes (up to the lane cap), the rest between is the bed.
  const sep = trams.length && dualBed(ctx.axes, trams);
  if (sep) {
    const cap = LANE_CAP_CLASS[ctx.roadClass] ?? LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
    const lo = Math.min(...trams) - TRAM_HALF, hi = Math.max(...trams) + TRAM_HALF;
    const wR = Math.min(lo - s, sep.R * cap), wL = Math.min(e - hi, sep.L * cap);
    if (wR >= sep.R * CAR_MIN && wL >= sep.L * CAR_MIN) {
      const src = trams.measured ? "dtm" : "osm";
      const lanesOf = (a, b, n) => Array.from({ length: n }, (_, k) => ({ type: "pruh", s: a + (k * (b - a)) / n, e: a + ((k + 1) * (b - a)) / n, dir: dirAt(a + ((k + 0.5) * (b - a)) / n), source: src }));
      const bs = s + wR, be = e - wL, bm = (bs + be) / 2;
      mid = [...lanesOf(s, bs, sep.R),
        { type: "tramvaj", s: bs, e: bm, dir: "forward", bed: "panely", bedSource: "odhad", source: "odhad" },
        { type: "tramvaj", s: bm, e: be, dir: "backward", bed: "panely", bedSource: "odhad", source: "odhad" },
        ...lanesOf(be, e, sep.L)];
    }
  }
  if (!trams.length) {
    // One lane on a two-way street carries both directions (no arrow).
    const twoWaySingle = lanesTotal === 1 && !isOnewayTags(tags) && tags.junction !== "roundabout";
    // Lanes wider than the cap leave the rest as a shoulder / hatched area at the curbs (estimate):
    // the technical map has no lane markings, so an even split would make 5–8 m lanes.
    const cap = LANE_CAP_CLASS[ctx.roadClass] ?? LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
    const excess = (e - s) - lanesTotal * cap;
    // Strips under KRAJNICE_MIN are left in the lanes (a lane 3.7 m wide is no error).
    // A pedestrian or residential zone is one paved roadway without lanes: no shoulder is guessed in it.
    const zone = tags.highway === "pedestrian" || tags.highway === "living_street";
    if (!twoWaySingle && !zone && excess >= KRAJNICE_MIN) {
      // A carriageway of a divided road has its shoulder on the outer edge, the driver's right, not along
      // the median; other roadways, one-way town streets too, at both curbs (Bára). One-way by the OSM
      // axis in this roadway, not the clicked street (a divided road's other half).
      const oneway = single && ctx.axesOneway && ctx.divided;
      const both = !oneway && excess >= 2 * KRAJNICE_MIN;
      const outerL = oneway && dirAt((s + e) / 2) === (country.leftHand ? "forward" : "backward");
      const wR = both ? excess / 2 : outerL ? 0 : excess, wL = both ? excess / 2 : outerL ? excess : 0;
      if (wR) { rightEdge.push({ type: "krajnice", s, e: s + wR, source: "odhad" }); s += wR; }
      if (wL) { leftEdge.unshift({ type: "krajnice", s: e - wL, e, source: "odhad" }); e -= wL; }
    }
    const lw = (e - s) / lanesTotal;
    // A two-way street of one OSM axis has half its lanes each way, wherever the axis lies (an axis off
    // the middle of the roadway turned both lanes one way; Jihlava, Polenská).
    // Only for an axis running in this roadway: a divided road mapped as one way on its median keeps the
    // side of the axis (Prague č. 21, 42).
    const halves = single && ctx.axisInside && !ctx.axesOneway && lanesTotal > 1;
    for (let i = 0; i < lanesTotal; i++) {
      const ls = s + i * lw, le = ls + lw;
      const half = 2 * i + 1 === lanesTotal ? null : (2 * i + 1 < lanesTotal) !== !!country.leftHand ? "forward" : "backward";
      mid.push({ type: "pruh", s: ls, e: le, dir: twoWaySingle ? undefined : (halves && half) || dirAt((ls + le) / 2) });
    }
    if (single) applyLaneTags(mid, tags, along);
  }
  // Shared lane markings (piktokoridor) sit in the lane next to the curb; cyclists ride with
  // the traffic, or against it on a contraflow side.
  const flip = (d) => (d === "backward" ? "forward" : "backward");
  // tramLanes() lists car lanes before the tram envelopes: sort so the ends are the curb lanes.
  mid.sort((a, b) => a.s - b.s);
  const curbLane = { R: mid[0], L: mid.at(-1) };
  for (const [side, st] of [["R", sideR], ["L", sideL]]) {
    const lane = curbLane[side];
    if (st.sharrow && lane?.type === "pruh") {
      lane.type = "pruh_piktokoridor";
      lane.bikeDir = st.contra ? flip(lane.dir) : lane.dir;
    }
  }
  for (const x of [...rightEdge, ...leftEdge]) {
    if (x.type !== "cyklopruh" && x.type !== "ochranny_pruh") continue;
    const side = x.s >= e - 1e-6 ? "L" : "R";
    const st = side === "L" ? sideL : sideR;
    const base = curbLane[side]?.dir || "forward";
    x.dir = st.contra ? flip(base) : base;
    if (st.bikeColor) x.color = st.bikeColor;
  }
  // Bus lanes along the curb.
  for (const [side, st] of [["R", sideR], ["L", sideL]]) {
    const lane = curbLane[side];
    // bus:lanes / psv:lanes, when present, already placed the bus lanes lane by lane.
    const perLane = single && Object.keys(tags).some((k) => k.startsWith("bus:lanes") || k.startsWith("psv:lanes"));
    if (st.bus && !perLane && lane?.type === "pruh" && mid.length > 1) lane.type = "bus";
    if (st.shareBus && lane?.type === "bus") lane.type = "bus_cyklo";
  }
  // A bus lane OSM tags along a kerb where all the lanes it counts are the cars' (lanes=1, oneway=yes, busway:left=lane
  // with oneway:psv=no: the contraflow bus lane of Rue La Fayette in Paris): the shoulder the cap left at that kerb, wide
  // enough for a bus, is the bus lane; contraflow on a one-way street's left (busway:<side>:oneway=-1). ?off=buskrajnice.
  if (!ORTHO_P.off?.has("buskrajnice")) {
    for (const [side, st, list] of [["R", sideR, rightEdge], ["L", sideL, leftEdge]]) {
      const lane = curbLane[side], k = side === "R" ? list.at(-1) : list[0];
      if (!st.bus || lane?.type === "bus" || lane?.type === "bus_cyklo" || k?.type !== "krajnice" || k.e - k.s < BUS_FROM_SHOULDER) continue;
      const against = tags[`busway:${st.osmSide}:oneway`] === "-1" || (isOnewayTags(tags) && st.osmSide === drivingLeft(tags) && tags["oneway:psv"] === "no");
      k.type = st.shareBus ? "bus_cyklo" : "bus"; k.dir = against ? flip(lane?.dir || "forward") : lane?.dir || "forward"; k.source = "osm";
    }
  }
  // One-way street open to cyclists both ways with no marking: they share the lane in contraflow.
  const anyContra = [sideL, sideR].some((st) => st.contra);
  if (isOnewayTags(tags) && tags["oneway:bicycle"] === "no" && !anyContra) {
    const wayLeft = sideL.osmSide === drivingLeft(tags) ? "L" : "R";
    const lane = curbLane[wayLeft];
    if (lane && !lane.bikeDir) lane.bikeDir = flip(lane.dir);
  }
  return [...rightEdge, ...mid, ...leftEdge]
    .map((x) => ({ type: x.type, s: x.s, e: x.e, dir: x.dir, turn: x.turn, orient: x.orient, bikeDir: x.bikeDir, color: x.color, source: x.source || "osm",
      ...(TRAM_KINDS.has(x.type) && tags.embedded_rails === "tram" ? { embedded: true } : {}),
      ...(x.position ? { position: x.position, lawFree: x.lawFree, lawNeed: x.lawNeed } : {}) }))
    .sort((a, b) => a.s - b.s);
}

// lanes:forward / lanes:backward and turn:lanes(:forward|:backward) for a single carriageway.
// Lanes come in t order (right side of the cut's street first).
function applyLaneTags(lanes, tags, along) {
  const oneway = isOnewayTags(tags);
  const wayFwd = parseInt(tags["lanes:forward"], 10), wayBwd = parseInt(tags["lanes:backward"], 10);
  // Lanes travelling with the cut's street sit on its right (low t); keeping left on its left (high t).
  if (!oneway && wayFwd >= 0 && wayBwd >= 0 && wayFwd + wayBwd === lanes.length) {
    const ours = along ? wayFwd : wayBwd;
    lanes.forEach((l, i) => (l.dir = (country.leftHand ? i >= lanes.length - ours : i < ours) ? "forward" : "backward"));
  }
  const wayFwdTurns = turnList(tags["turn:lanes:forward"] || (oneway ? tags["turn:lanes"] : undefined));
  const wayBwdTurns = turnList(tags["turn:lanes:backward"]);
  const sameAsWay = along !== (tags.oneway === "-1");
  const fwdTurns = sameAsWay ? wayFwdTurns : wayBwdTurns;
  const bwdTurns = sameAsWay ? wayBwdTurns : wayFwdTurns;
  // turn:lanes are listed from the driver's left: for our forward lanes that is high t first,
  // for backward lanes low t first (keeping left too: there the driver's left is the kerb, high t for forward lanes).
  const fwd = lanes.filter((l) => l.dir === "forward").reverse();
  const bwd = lanes.filter((l) => l.dir === "backward");
  if (fwdTurns?.length === fwd.length) fwd.forEach((l, i) => (l.turn = fwdTurns[i]));
  if (bwdTurns?.length === bwd.length) bwd.forEach((l, i) => (l.turn = bwdTurns[i]));
  // bus:lanes / psv:lanes list lanes like turn:lanes; "designated" marks a bus lane.
  const busList = (suffix) => turnList(tags[`bus:lanes${suffix}`] || tags[`psv:lanes${suffix}`]);
  // "designated" is a bus lane; "yes" / "permissive" just let buses use an ordinary lane, unless the lane is
  // closed to other traffic (access:lanes / motor_vehicle:lanes = no, e.g. Českobrodská: bus:lanes:forward=|yes
  // with access:lanes:forward=|no).
  const closedList = (suffix) => turnList(tags[`access:lanes${suffix}`] || tags[`motor_vehicle:lanes${suffix}`] || tags[`vehicle:lanes${suffix}`]);
  const isBus = (v, closed) => v === "designated" || (["yes", "permissive"].includes(v) && closed === "no");
  const wayFwdBus = busList(":forward") || (oneway ? busList("") : null);
  const wayBwdBus = busList(":backward");
  const wayFwdClosed = closedList(":forward") || (oneway ? closedList("") : null), wayBwdClosed = closedList(":backward");
  const fwdBus = sameAsWay ? wayFwdBus : wayBwdBus, bwdBus = sameAsWay ? wayBwdBus : wayFwdBus;
  const fwdClosed = sameAsWay ? wayFwdClosed : wayBwdClosed, bwdClosed = sameAsWay ? wayBwdClosed : wayFwdClosed;
  if (fwdBus?.length === fwd.length) fwd.forEach((l, i) => { if (isBus(fwdBus[i], fwdClosed?.[i])) l.type = "bus"; });
  if (bwdBus?.length === bwd.length) bwd.forEach((l, i) => { if (isBus(bwdBus[i], bwdClosed?.[i])) l.type = "bus"; });
  // bicycle:lanes marks the bus lanes cyclists may use.
  const bikeList = (suffix) => turnList(tags[`bicycle:lanes${suffix}`]);
  const wayFwdBike = bikeList(":forward") || (oneway ? bikeList("") : null);
  const wayBwdBike = bikeList(":backward");
  const fwdBike = sameAsWay ? wayFwdBike : wayBwdBike, bwdBike = sameAsWay ? wayBwdBike : wayFwdBike;
  const bikeOk = (v) => v === "designated" || v === "yes";
  if (fwdBike?.length === fwd.length) fwd.forEach((l, i) => { if (l.type === "bus" && bikeOk(fwdBike[i])) l.type = "bus_cyklo"; });
  if (bwdBike?.length === bwd.length) bwd.forEach((l, i) => { if (l.type === "bus" && bikeOk(bwdBike[i])) l.type = "bus_cyklo"; });
  // lanes:bus / lanes:psv on a one-way street: that many lanes from the right curb.
  const nBus = parseInt(tags["lanes:bus"] || tags["lanes:psv"], 10);
  if (oneway && nBus > 0 && nBus < lanes.length) {
    const ours = lanes.filter((l) => l.dir === (sameAsWay ? "forward" : "backward"));
    const fromRight = sameAsWay ? ours : [...ours].reverse();
    fromRight.slice(0, nBus).forEach((l) => (l.type = "bus"));
  }
}
