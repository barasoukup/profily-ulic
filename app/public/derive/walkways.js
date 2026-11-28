// Sidewalks and cycle tracks: use of a walking surface, a cycle track, the direction of cycling.
import { country } from "../city.js";

const BIKE_OK = new Set(["yes", "permissive", "designated"]);

// The direction cyclists ride a path one way only: oneway:bicycle, else oneway (-1 against the way); null for both ways.
// d: the way's direction at the cut, dir: the profile's (as cycleTrack).
function bikeDir(t, d, dir) {
  const o = t["oneway:bicycle"] ?? t.oneway;
  if (!["yes", "1", "true", "-1"].includes(o)) return null;
  const along = d[0] * dir[0] + d[1] * dir[1] >= 0;
  return along !== (o === "-1") ? "forward" : "backward";
}

// What cyclists may do on a sidewalk (MTVU 702), from the OSM way running along it:
// segregated=yes → foot and cycle path side by side (C10: sidewalk + cycle track, split in half),
// bicycle=designated → shared foot and cycle path (C9), bicycle=yes → sidewalk open to cyclists.
// Without a way of its own, the street's sidewalk:<side>:bicycle tag tells.
const SEG_MIN = 0.9; // m: the narrowest half of a segregated path told by its width tags
export function sidewalkUse(r, cross, way, axisT, dir) {
  const plain = [{ type: "chodnik", s: r.s, e: r.e, source: "dtm" }];
  const c = cross.find((x) => x.t > r.s && x.t < r.e && ["footway", "path", "cycleway", "pedestrian"].includes(x.way.tags?.highway));
  let t = c?.way.tags;
  if (!t) {
    const own = cross.find((x) => x.way.id === way.id);
    if (!own) return plain;
    const along = own.d[0] * dir[0] + own.d[1] * dir[1] >= 0;
    const osmSide = ((r.s + r.e) / 2 > axisT) === along ? "left" : "right";
    const b = way.tags?.[`sidewalk:${osmSide}:bicycle`] ?? way.tags?.["sidewalk:both:bicycle"] ?? way.tags?.["sidewalk:bicycle"];
    if (!BIKE_OK.has(b)) return plain;
    t = { highway: "footway", bicycle: b };
  }
  const bikes = t.highway === "cycleway" ? "designated" : t.bicycle;
  if (!BIKE_OK.has(bikes)) return plain;
  if (t.segregated === "yes" && r.e - r.s >= 2.5) {
    // The two halves, unless OSM gives the width of one of them (cycleway:width, footway:width; a combined path's own
    // width is the sum, not told apart): the cycle track as wide as it says, the sidewalk the rest, each at least
    // SEG_MIN.
    const total = r.e - r.s, num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return n > 0 && n < 10 ? n : null; };
    const cw = num(t["cycleway:width"]), fw = num(t["footway:width"]);
    const told = cw !== null ? cw : fw !== null ? total - fw : null;
    const bikeW = told !== null && told >= SEG_MIN && total - told >= SEG_MIN ? told : total / 2;
    // The cycle half lies on the roadway side (the side nearer the street axis).
    const bikeLow = Math.abs(r.s - axisT) < Math.abs(r.e - axisT);
    const m = bikeLow ? r.s + bikeW : r.e - bikeW;
    const halves = [{ type: "cyklostezka", source: "osm" }, { type: "chodnik", source: "osm" }];
    if (!bikeLow) halves.reverse();
    return [{ ...halves[0], s: r.s, e: m }, { ...halves[1], s: m, e: r.e }];
  }
  // segregated=no is used only on paths shared by both, even when foot is not tagged designated.
  const shared = bikes === "designated" && (t.highway !== "cycleway" || t.foot === "designated" || t.segregated === "no");
  // Cyclists one way only (oneway:bicycle, else oneway): the part has that direction (the walkers keep both).
  const bd = shared && c ? bikeDir(t, c.d, dir) : null;
  return [{ type: shared ? "stezka_sdilena" : "chodnik_kola", s: r.s, e: r.e, ...(bd && { dir: bd }), source: "dtm" }];
}

// A cycle track (MTVU 703) takes its direction from the OSM cycleway running in it: one-way
// tracks ride with their way, two-way tracks split into two halves (keep right).
export function cycleTrack(r, cross, dir) {
  const c = cross.find((x) => x.t > r.s && x.t < r.e &&
    (x.way.tags?.highway === "cycleway" || x.way.tags?.bicycle === "designated"));
  if (!c) return [{ type: "cyklostezka", s: r.s, e: r.e, source: "dtm" }];
  const t = c.way.tags;
  const bd = bikeDir(t, c.d, dir);
  if (bd) {
    return [{ type: "cyklostezka", s: r.s, e: r.e, dir: bd, source: "dtm" }];
  }
  // TP 179 kap. 4.9: a two-way cycle path is at least 2.5 m wide (one-way min. 2.0 m).
  if (r.e - r.s < 2.5) return [{ type: "cyklostezka", s: r.s, e: r.e, source: "dtm" }];
  const m = (r.s + r.e) / 2;
  return [
    { type: "cyklostezka", s: r.s, e: m, dir: country.leftHand ? "backward" : "forward", source: "dtm" },
    { type: "cyklostezka", s: m, e: r.e, dir: country.leftHand ? "forward" : "backward", source: "dtm" },
  ];
}
