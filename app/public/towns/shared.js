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
