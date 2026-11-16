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
export const loadSkTowns = (json) => { skTowns = Object.fromEntries(Object.entries(json || {}).map(([id, rings]) => [id, boxed(id, rings)])); };
export const inSkTown = (id, lon, lat) => {
  const b = skTowns?.[id];
  if (!b) return undefined;
  return lon >= b.box[0] && lon <= b.box[2] && lat >= b.box[1] && lat <= b.box[3] && inside(b.rings, lon, lat);
};
