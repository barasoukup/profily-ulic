// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways.
import { PERMEABLE_TYPES } from "../types.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { REACH, attachItems, insertPlatforms, insertTrees, itemPositions, platformPositions, treePositions } from "./items.js";
import { inside } from "./geometry.js";
import { carveKerbParking, markIslands, mergeParking, perpDepth } from "./parking.js";
import { buildingAt, centreKm, gableToStreet } from "./buildings.js";
import { aisleOrient, toSegment } from "./output.js";
import { classifyRuns, prepareCut } from "./profile-prepare.js";
import { buildParts } from "./profile-parts.js";
import { findAxisRun, keepRuns, reachLimits, walkToEdges } from "./profile-reach.js";

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
  const normal = [-dir[1], dir[0]];
  const ctx = { center, dir, half, polys, osm, frame, way, tracks, parking, lines, reach, lanesImage, roadOnPath, normal, at, zoneKnown, reachItems, ortho, lawAt, kerbParking, noParkGuess, osmParkGive };
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
  const { edges, forks, kept } = ctx;
  axisT = ctx.axisT;
  buildParts(ctx);
  const { segs, kerbReqs, roads } = ctx;
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
