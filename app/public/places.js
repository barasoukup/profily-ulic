// Which area a point lies in: rings of boundaries ([[lon, lat], …] per ring) with their boxes, and the Slovak towns'
// boundaries (tools/build_towns_sk.mjs, mesta-sk.json). No import of city.js (the states' modules use it, city.js
// imports them).
export const inside = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
export const boxed = (id, rings) => {
  const xs = rings.flat().map((p) => p[0]), ys = rings.flat().map((p) => p[1]);
  return { id, rings, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
};
export const within = (list, lat, lon) => list.find((b) => lon >= b.box[0] && lon <= b.box[2] && lat >= b.box[1] && lat <= b.box[3] && inside(b.rings, lon, lat))?.id;
// The Slovak towns' boundaries: is the point in town id? undefined without the file or the town (the caller keeps its
// box then).
let skTowns = null;
export const loadSkTowns = (json) => { skTowns = { ...skTowns, ...Object.fromEntries(Object.entries(json || {}).map(([id, rings]) => [id, boxed(id, rings)])) }; };
// (The cities of the other states join them: city.js loadTowns, mesta-at.json, mesta-us.json.)
export const inSkTown = (id, lon, lat) => {
  const b = skTowns?.[id];
  if (!b) return undefined;
  return lon >= b.box[0] && lon <= b.box[2] && lat >= b.box[1] && lat <= b.box[3] && inside(b.rings, lon, lat);
};

// The territory of a source, a set of illustrations or a city that is not one of mesta.json (docs/architecture-countries.md,
// step 4): a box [lon0, lat0, lon1, lat1] and, where mesta-sk.json or mesta-us.json has the town's boundary, the town (the box cut to it;
// without the file the box alone).
// near: metres beyond the town's boundary that still count (a street along the boundary: Washington's Southern Avenue).
export const inArea = (area, lon, lat) => lon >= area.box[0] && lon <= area.box[2] && lat >= area.box[1] && lat <= area.box[3]
  && (area.town ? (inSkTown(area.town, lon, lat) ?? true) || (!!area.near && metresTo(skTowns[area.town].rings, lon, lat) <= area.near) : true);
function metresTo(rings, lon, lat) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  let d = Infinity;
  for (const r of rings) for (let i = 1; i < r.length; i++) {
    const ax = (r[i - 1][0] - lon) * kx, ay = (r[i - 1][1] - lat) * ky, dx = (r[i][0] - lon) * kx - ax, dy = (r[i][1] - lat) * ky - ay;
    const u = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    d = Math.min(d, Math.hypot(ax + u * dx, ay + u * dy));
  }
  return d;
}
// The first of named areas ({ id: area }) that has the point, or null.
export const areaAt = (areas, lon, lat) => Object.entries(areas).find(([, a]) => inArea(a, lon, lat))?.[0] ?? null;
// Austria's cities by their boxes (towns/austria.js: Vienna's map of surfaces, Salzburg's signs; countries/AT.js: the
// towns' vehicles; search-at.js: Vienna's addresses).
export const AT_AREAS = { wien: { box: [16.18, 48.11, 16.58, 48.33] }, graz: { box: [15.35, 47.0, 15.53, 47.13] }, linz: { box: [14.2, 48.22, 14.4, 48.36] },
  salzburg: { box: [12.98, 47.75, 13.12, 47.86] }, innsbruck: { box: [11.3, 47.23, 11.47, 47.3] } };
