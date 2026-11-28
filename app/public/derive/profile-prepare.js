// Phases 1 and 2 of deriveProfile: what lies under the cut (OSM ways, the polygons, the tram axes) and the runs of the
// surfaces along it.
import { isMinorStructure } from "../types.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { CAR_ROADS, STREETS } from "./tags.js";
import { crossings, lineCrossings } from "./crossings.js";
import { absorbParkingSlivers, capParallelBay, classify, linePieces, mergeTiny } from "./classify.js";
import { mapTramBeds, mergeTrackAxes, snapTracksToBeds } from "./tram.js";
import { inside } from "./geometry.js";
import { estimateFromOsm } from "./estimate.js";
import { OSM_PARKING, TSK_CODES, TSK_PARKING, osmOutdoorPolygons, osmParkingPolygons, osmPlatformPolygons } from "./polygons.js";
import { orientFromStalls } from "./parking.js";

const PASSAGE_MIN = 10; // an "ostatní stavby" piece this long along the cut with a street through it is a passage over the street (m)
const ROAD_ON_PATH_MIN = 5; // m (deriveProfile roadOnPath)

// The run under the street axis (-1: none).
export const runUnder = (runs, axisT) => runs.findIndex((r) => r.s <= axisT && r.e >= axisT);

// Phase 1: the ways the cut crosses, the polygons ready for classifying, the street axis and the tram axes.
// Sets ctx.cross, polys, axisT and tramTs; returns a finished profile (the estimate from OSM) when no polygon is left.
export function prepareCut(ctx) {
  const { center, dir, half, osm, frame, way, tracks, lanesImage, normal } = ctx;
  let { polys } = ctx;
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
  Object.assign(ctx, { cross, polys, axisT, tramTs });
}

// Phase 2: the surfaces along the cut as runs (OSM and TSK parking, platforms and gardens among the polygons), the
// parallel bays capped, a road on a path; sets ctx.runs.
export function classifyRuns(ctx) {
  const { center, dir, half, osm, frame, way, parking, polys, normal, axisT, cross, roadOnPath } = ctx;
  const classifyAll = (osmParking) => absorbParkingSlivers(mergeTiny(classify(center, normal, half, [
    ...osmPlatformPolygons(osm, frame),
    // Special stalls (ZTP, deliveries…) before the plain sections that contain them.
    ...parking.filter((p) => p.kind !== "useky").map((p) => ({ ...p, code: TSK_CODES[p.kind] || TSK_PARKING, use: p.kind })),
    ...parking.filter((p) => p.kind === "useky").map((p) => ({ ...p, code: TSK_PARKING, orient: p.orient || orientFromStalls(p, dir) })),
    ...osmOutdoorPolygons(osm, frame),
    ...(osmParking ? osmParkingPolygons(osm, frame, way) : []),
    ...polys,
  ])));
  let runs = classifyAll(true);
  // An OSM street-parking area under the street axis covers the carriageway itself (drawn
  // over the whole street): the bays cannot be told apart, so the technical map alone decides.
  if (runs[runUnder(runs, axisT)]?.code === OSM_PARKING) runs = classifyAll(false);
  runs = capParallelBay(runs, axisT);
  // roadOnPath (Prague, Bára 15. 11. 2026): a "sidewalk or park path" (702) at least ROAD_ON_PATH_MIN wide that an
  // OSM road crosses is its roadway, as an estimate, where the technical map has no roadway along the whole cut
  // (Poncarova: MTVU codes a two-lane road 702). OSM's sidewalks play no part. 142 cuts of Prague's samples
  // unchanged (evaluation/variants/cesta-vozovka.mjs).
  if (roadOnPath && !runs.some((r) => r.code === 700 || r.code === 701)) {
    const roads = cross.filter((c) => CAR_ROADS.has(c.way.tags?.highway) && c.way.tags?.area !== "yes");
    runs = runs.map((r) => (r.code === 702 && r.e - r.s >= ROAD_ON_PATH_MIN && roads.some((c) => c.t > r.s && c.t < r.e) ? { ...r, code: 701, guess: true } : r));
  }
  ctx.runs = runs;
}
