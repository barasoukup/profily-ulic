// The estimate from OSM alone, where the technical map has no surface, and the cut's own crossing.
import { DEFAULT_WIDTH } from "../types.js";
import { country } from "../city.js";
import { crossings } from "./crossings.js";
import { round } from "./geometry.js";
import { isOnewayTags } from "./tags.js";

// The OSM ways crossing the cut, with their place from the profile's end A (extent: deriveProfile's [right, left]).
export function crossFromA(osm, frame, dir, extent, way = null) {
  const normal = [-dir[1], dir[0]], half = Math.max(Math.abs(extent[0]), Math.abs(extent[1])) + 1;
  return crossings(osm, frame, [0, 0], normal, half, way).map((c) => ({ at: extent[1] - c.t, tags: c.way.tags || {} }));
}

// Fallback outside MTVU coverage: a typical profile from OSM tags.
// A path, footway, cycle way or flight of steps (a cut that caught one, not a street): one part of its kind and width
// (OSM width, else a typical one), not a road of two lanes (1000 Slovak cuts: 238 such paths drawn as 2 × 3 m lanes).
const PATH_WAYS = new Set(["footway", "path", "cycleway", "steps", "bridleway", "corridor"]);
const PATH_WIDTH = { footway: 2, path: 1.5, cycleway: 2.5, steps: 2, bridleway: 2, corridor: 2 };
function estimatePath(tags) {
  // A cycle way with walkers on it unsegregated, or a footway or path for bicycles, is shared; a cycle way alone a cycle
  // track; anything else a sidewalk-like walk.
  const shared = tags.highway === "cycleway" ? ["designated", "yes"].includes(tags.foot) && tags.segregated !== "yes" : tags.bicycle === "designated";
  const type = shared ? "stezka_sdilena" : tags.highway === "cycleway" ? "cyklostezka" : "chodnik";
  const w = parseFloat(String(tags.width || "").replace(",", "."));
  const width = w > 0.5 && w < 12 ? w : PATH_WIDTH[tags.highway] || 2;
  return { segments: [{ type, width: round(width), source: w > 0.5 && w < 12 ? "osm" : "odhad" }], edges: { left: "volno", right: "volno" }, runs: [], axisT: 0, estimate: true, path: true };
}

export function estimateFromOsm(way) {
  const tags = way.tags || {};
  if (PATH_WAYS.has(tags.highway)) return estimatePath(tags);
  const oneway = isOnewayTags(tags);
  const lanes = tags.highway === "pedestrian" || tags.highway === "living_street" ? 1 : parseInt(tags.lanes, 10) || (oneway ? 1 : 2);
  const total = parseFloat(tags.width) || null;
  const segs = [];
  const sw = tags.sidewalk && tags.sidewalk !== "no" && tags.sidewalk !== "none";
  if (sw) segs.push({ type: "chodnik", width: DEFAULT_WIDTH.chodnik, source: "odhad" });
  const lw = total ? total / lanes : DEFAULT_WIDTH.pruh;
  for (let i = 0; i < lanes; i++) {
    segs.push({ type: "pruh", width: round(lw), source: total ? "osm" : "odhad", dir: oneway || (i >= lanes / 2) !== !!country.leftHand ? "forward" : "backward" });
  }
  if (sw) segs.push({ type: "chodnik", width: DEFAULT_WIDTH.chodnik, source: "odhad" });
  // estimate: no surface to derive from (app.js then tries the orthophoto and OSM, ortho-osm.js).
  return { segments: segs, edges: { left: "volno", right: "volno" }, runs: [], axisT: 0, estimate: true };
}
