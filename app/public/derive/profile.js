// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways. The work goes in named phases that hand one
// context object on (docs/code-health-plan.md, step 12); a phase that has nothing to derive from returns a finished profile
// (the estimate from OSM) and ends the derivation:
//   profile-prepare  prepareCut (ways under the cut, polygons, tram axes), classifyRuns (the runs along the cut)
//   profile-reach    findAxisRun (the start run), reachLimits and walkToEdges (how far to each side), keepRuns (fences, reach)
//   profile-parts    buildParts (roadways with lanes in profile-roadway, tram beds, parking, sidewalks, the tram belt)
//   profile-finish   addFurniture (kerb parking, platforms, trees, items), describeEdges (houses), markSurfaces, profileOf
import { REACH } from "./items.js";
import { classifyRuns, prepareCut } from "./profile-prepare.js";
import { buildParts } from "./profile-parts.js";
import { addFurniture, describeEdges, markSurfaces, profileOf } from "./profile-finish.js";
import { findAxisRun, keepRuns, reachLimits, walkToEdges } from "./profile-reach.js";

// noParkGuess: no parking estimated by the law alone (Monaco; and everywhere for the profile the lanes are measured on, app.js lawAt).
/** One object of arguments: @param {import("./types.js").DeriveArgs} args @returns {import("./types.js").Profile} */
export function deriveProfile({ center, dir, half, polys, osm, frame, way, tracks = [], parking = [], lines = [], reach, inZps: zoneKnown, itemReach, ortho, lanesImage, roadOnPath = false, noParkGuess = false, lawAt = [], kerbParking = null, osmParkGive = false }) {
  const reachItems = { ...REACH, ...itemReach };
  const normal = [-dir[1], dir[0]];
  const at = (t) => [center[0] + normal[0] * t, center[1] + normal[1] * t];
  const ctx = { center, dir, half, polys, osm, frame, way, tracks, parking, lines, reach, lanesImage, roadOnPath, normal, at, zoneKnown, reachItems, ortho, lawAt, kerbParking, noParkGuess, osmParkGive };
  const phases = [prepareCut, classifyRuns, findAxisRun, reachLimits, walkToEdges, keepRuns];
  for (const phase of phases) {
    const done = phase(ctx);
    if (done) return done;
  }
  buildParts(ctx);
  addFurniture(ctx);
  describeEdges(ctx);
  markSurfaces(ctx);
  return profileOf(ctx);
}
