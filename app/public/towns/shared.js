// What the town modules (towns/*.js) do alike: a GeoJSON geometry as the rings and paths derive.js reads, an answer kept
// by its box, a request with a time limit, the pages of an Opendatasoft table. One copy of each (code-health plan step 8,
// 28. 11. 2026; before, about 30 modules had their own, differing here and there in a detail that is a parameter now).
// The point in rings test is places.js inside.

// The polygons of a GeoJSON geometry, each an array of rings (the outer ring and its holes); none for any other kind.
export const polygonsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
// All the rings of a Polygon or MultiPolygon in one array (holes and parts alike, as the even-odd test takes them), or
// null for any other kind (a feature with no area).
export const ringsOf = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);
// The lines of a LineString or MultiLineString, each an array of points; none for any other kind.
export const pathsOf = (g) => (g?.type === "LineString" ? [g.coordinates] : g?.type === "MultiLineString" ? g.coordinates : []);

// "x0,y0,x1,y1" with each number rounded to digits decimals (4 is about 10 m): a cut moved a little asks the same box.
export const boxKey = (bbox, digits = 4) => bbox.split(",").map((v) => (+v).toFixed(digits)).join(",");

// One answer a key in memo (a Map the module owns), kept as the promise: a click asks each source once, and the one that
// failed is asked again. At most max kept, the oldest out. evictFirst is where the copies differed: false puts the new
// answer in and then drops the oldest above max (max kept), true drops the oldest first (one more than max kept).
export function cachedBy(memo, key, make, { max = 30, evictFirst = false } = {}) {
  if (!memo.has(key)) {
    if (evictFirst && memo.size > max) memo.delete(memo.keys().next().value);
    memo.set(key, make().catch((err) => { memo.delete(key); throw err; }));
    if (!evictFirst && memo.size > max) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
