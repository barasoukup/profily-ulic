// The result parts: a working part to a profile segment, the parking aisle's orientation.
import { round } from "./geometry.js";
import { PERP_MIN, orientFromDepth } from "./parking.js";

// The three kinds of tram (Bára): in a lane with cars, a reserved tram lane in the roadway, a separate tram bed.
const LANE_TYPES = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]); // parts that carry the street's class

export function toSegment(x) {
  const seg = { type: x.type, width: round(x.e - x.s), source: x.source };
  if (x.dir) seg.dir = x.dir;
  if (x.turn && x.turn !== "none") seg.turn = x.turn;
  if (x.bikeDir) seg.bikeDir = x.bikeDir;
  if (x.use && x.use !== "useky") seg.use = x.use;
  if (x.color) seg.color = x.color;
  if (x.trolley) seg.trolley = true;
  if (x.noCar) seg.noCar = true;
  if (x.wires) seg.wires = true;
  if (x.type === "tramvaj") { seg.bed = x.bed || "panely"; if (x.bedSource === "odhad") seg.bedGuess = true; }
  if (x.withBus) seg.withBus = true;
  if (x.narrow) seg.narrow = true;
  if (x.permeable) seg.permeable = x.permeable;
  if (x.roadClass && LANE_TYPES.has(x.type)) seg.roadClass = x.roadClass;
  // Segments are reversed to screen order, so item positions flip too.
  if (x.items?.length) seg.items = x.items.map((it) => ({ ...it, f: +(1 - it.f).toFixed(3) }));
  if (x.type === "parkovani") {
    // Cars on the sidewalk (on_kerb) or across the kerb (half_on_kerb), from OSM.
    if (x.position) seg.position = x.position;
    seg.orient = x.orient || orientFromDepth(seg.width);
    // Last guard (ČSN 73 6056): perpendicular parking is never shallower than PERP_MIN.
    if (seg.orient === "kolme" && seg.width < PERP_MIN) seg.orient = "sikme";
  }
  return seg;
}

// Cars drive into perpendicular stalls from an aisle about 6 m wide, into stalls at 45° from about 3.5 m (ČSN 73 6056).
// A "perpendicular" guess (from the depth, or from the stalls of a TSK section, which trees and driveways between
// the stalls mislead) beside a carriageway narrower than PERP_AISLE is angled parking (Laubova: 4.3 m, Bára).
const PERP_AISLE = 5;
const AISLE = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu"]);
export function aisleOrient(segs) {
  segs.forEach((s, i) => {
    if (s.type !== "parkovani" || s.orient !== "kolme") return;
    for (const step of [-1, 1]) {
      let w = 0, j = i + step;
      while (segs[j] && AISLE.has(segs[j].type)) w += segs[j].width, j += step;
      if (w > 0 && w < PERP_AISLE) { s.orient = "sikme"; return; }
    }
  });
  return segs;
}
