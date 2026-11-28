// How far a cut reaches from its middle (the usual reach, the wider reach of a motorway or a main street, the ends on the map).
// No DOM: the geometry of the cut line (the core of a cut, step 13b).
import { crossFromA, MAX_REACH } from "../derive.js";

export const HALF = 40; // half-length of the cut used for reading the data (m)
// A cut end dragged further out (a house set back from a wide road) reads that much more, up to MAX_HALF (m); 103 since
// 27. 11. 2026 (Bára: only dragging reaches that far, a side up to 100 m; a new cut keeps its usual reach).
export const MAX_HALF = 103, HALF_PAD = 3;
export const MIN_REACH = 3; // shortest profile side the user can drag the cut end to (m)
export const defaultReach = () => ({ left: MAX_REACH, right: MAX_REACH });
export const WIDE_REACH = 35;
const WIDE_END = new Set(["plocha", "delici", "zelen", "stromorad", "chodnik", "tramvaj", "railway"]); // a median's or a promenade's parts
// A side of a new cut that may reach WIDE_REACH (evaluation/archive/unification, Bára 25. 11. 2026: a rule of the data at the cut,
// not of a state; it replaced the states' wideRoads and wideStreets: A/B of 112 cuts, 6 changed, better 4 : 2, Paris's
// boulevards as before, the states without a map unchanged): a motorway or an expressway, or a main street ending at the reach in a median's, promenade's or
// sidewalk's part, whose profile ends at the reach on that side, and only where the street goes on beyond it: no surface
// map lies there (the estimate's land: a street-area map such as Vienna's ends at the parcel line), the street's own
// other carriageway (an OSM way of its name or ref) crosses the cut there, or the map's street surfaces go on from the
// reach to a roadway. A map that draws all land (the Czech DTM, the
// BGT, the cadastral survey) has fields, woods and car parks beyond a motorway's verge: 35 m ran into them (Czech
// motorways, worse 13 : 1).
export const WIDE_ROADS = /^(motorway|trunk)(_link)?$/;
const WIDE_STREETS = /^(primary|secondary)$/;
const CAR_WAYS = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)(_link)?$/;
// MTVU codes: a roadway or a tram bed; the surfaces of a street (with a sidewalk, a cycle track, a median, other paving).
const WIDE_ROADWAY = new Set([700, 701, 705]), STREET_SURFACE = new Set([700, 701, 702, 703, 705, 1003, 9950]);
const inRingXY = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
export function widerSides(result, reach, way, osm, frame, dir, polys) {
  const hw = way?.tags?.highway || "", road = WIDE_ROADS.test(hw);
  if (!(road || WIDE_STREETS.test(hw)) || !result?.extent || !result.segments?.length) return null;
  const normal = [-dir[1], dir[0]];
  // A house is no land of a map (the estimate's states have their buildings too).
  const codeAt = (t) => { const x = normal[0] * t, y = normal[1] * t; return polys.find((p) => (!p.bbox || (x >= p.bbox[0] && x <= p.bbox[2] && y >= p.bbox[1] && y <= p.bbox[3])) && p.rings?.length && inRingXY(p.rings[0], x, y))?.code ?? null; };
  const mapAt = (t) => { const c = codeAt(t); return c !== null && c !== 601; };
  // The map's street surfaces from the reach on, without a break, up to a roadway (Paris: the promenade of Bd Marguerite
  // de Rochechouart, its cycle track, then the other carriageway; the other half of the boulevard has another name).
  const roadwayOn = (from, sg) => { for (let d = 0.25; d <= WIDE_REACH - from; d += 0.5) { const c = codeAt(sg * (from + d)); if (WIDE_ROADWAY.has(c)) return true; if (!STREET_SURFACE.has(c)) return false; } return false; };
  const name = way.tags.name, ref = way.tags.ref;
  // The street's other carriageways across the cut, by their offset along the normal (+: side A).
  const own = crossFromA(osm, frame, dir, [-WIDE_REACH, WIDE_REACH]).filter((c) => CAR_WAYS.test(c.tags.highway || "") && ((name && c.tags.name === name) || (ref && c.tags.ref === ref))).map((c) => WIDE_REACH - c.at);
  const longer = {};
  for (const [side, sg, end, part] of [["left", 1, result.extent[1], result.segments[0]], ["right", -1, -result.extent[0], result.segments.at(-1)]]) {
    if (reach[side] >= WIDE_REACH || end < reach[side] - 1 || !(road || WIDE_END.has(part.type))) continue;
    const beyond = [0.5, 1.5, 3].map((d) => sg * (reach[side] + d));
    if (!beyond.some(mapAt) || own.some((t) => sg * t > reach[side] && sg * t <= WIDE_REACH) || roadwayOn(reach[side], sg)) longer[side] = WIDE_REACH;
  }
  return Object.keys(longer).length ? longer : null;
}
// Ends of the cut on the map: right end at -normal, left end at +normal.
export const cutEnds = (f, normal, reach) => [
  f.toLonLat(-normal[0] * reach.right, -normal[1] * reach.right),
  f.toLonLat(normal[0] * reach.left, normal[1] * reach.left),
];
// The cut line and its ends A, B on the map show where the profile ends (facades, fences…), not how
// far the data was searched (Bára); a profile only estimated from OSM has no ends, so the reach shows.
export const cutSpan = (cut) => cut?.span || cut?.reach || defaultReach();
