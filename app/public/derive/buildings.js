// The building at an end of the profile: height, floors, footprint, the block it stands in.
import { city } from "../city.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { bboxOf, inside } from "./geometry.js";

// Distance from the city centre (km; Old Town Square in Prague, náměstí Svobody in Brno): the inner
// city of tenements versus the outer estates.
// Distance from the centre of the cut's city (city.js centre); far out where no centre is known ("cesko").
export const centreKm = ([lon, lat]) => {
  const c = city.centre;
  return c ? Math.hypot((lon - c[0]) * 111.32 * Math.cos((c[1] * Math.PI) / 180), (lat - c[1]) * 111.2) : 99;
};

// OSM building containing a point, with building:levels (+ roof:levels) and height when tagged,
// and the shape of the block it belongs to (blockShape).
// The OSM buildings the built-up test was tuned on: until 15. 11. 2026 the tiles held only those with floors or a height
// (tools/build_osm_tiles.mjs now keeps all). The look of a house reads every building, in every state (Bára 25. 11.
// 2026; a blind test in 13 states, evaluation/archive/all-buildings): the kind and the block are often all OSM has.
// ?off=vsedomy: the look reads the tuned ones only.
export const TUNED_BUILDING = (t) => !!t?.building && (t["building:levels"] !== undefined || t.height !== undefined || t["roof:levels"] !== undefined);
export function buildingAt(osm, frame, p) {
  const all = (osm.elements || []).filter((el) => el.type === "area" && (TUNED_BUILDING(el.tags) || (el.tags?.building && el.tags.building !== "roof" && !ORTHO_P.off?.has("vsedomy"))))
    .map((el) => {
      const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
      return { el, ring, rings: [ring, ...(el.holes || []).map((r) => r.map((g) => frame.toXY(g.lon, g.lat)))], bbox: bboxOf(ring) };
    });
  for (const b of all) {
    const [x0, y0, x1, y1] = b.bbox;
    if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1 || !inside(b.rings, p[0], p[1])) continue;
    const { el } = b;
    const levels = parseInt(el.tags["building:levels"], 10);
    const roof = parseInt(el.tags["roof:levels"], 10);
    const height = parseFloat(el.tags.height);
    // The roof's shape and the year built, where OSM has them (the look of a house abroad: profile.js buildingStyle).
    const year = parseInt(String(el.tags.start_date ?? "").slice(0, 4), 10);
    return { levels: levels ? levels + (roof || 0) : undefined, height: height || undefined, type: el.tags.building, block: blockShape(b, all), axis: mainAxis(b.ring),
      roofShape: el.tags["roof:shape"], start: year > 1000 ? year : undefined, material: el.tags["building:material"],
      // OSM says panels (building:prefabricated=yes, building:material=concrete_panel…): the panel house's own evidence.
      panel: el.tags["building:prefabricated"] === "yes" || /panel|prefab/i.test(el.tags["building:material"] || "") ? true : undefined,
      own: ownShape(b), around: aroundOf(b, all, osm.elements, frame),
      footprint: ringArea(b.ring) - (b.rings.slice(1).reduce((a, r) => a + ringArea(r), 0)) };
  }
  return null;
}
// The house's own outline: how much of its smallest rectangle it fills (a slab: close to 1) and the rectangle's sides (m).
function ownShape(b) {
  const a = mainAxis(b.ring), area = ringArea(b.ring);
  return { rect: +(area / (a.length * a.width || 1)).toFixed(2), length: +a.length.toFixed(1), width: +a.width.toFixed(1) };
}
// What lies round the house within AROUND_R m (house-looks.js panelScore): the share built over by other buildings and the
// share of green (OSM grass, wood, park, garden…), by a grid of points. An estate of slabs stands free in green, a town
// street's house between others. Only what the OSM elements loaded hold (whole tiles of about 550 × 350 m round the cut).
const AROUND_R = 80, AROUND_STEP = 10, GREEN_TAGS = (t) => /^(grass|forest|meadow|village_green|recreation_ground|orchard)$/.test(t.landuse || "")
  || /^(park|garden|pitch|playground)$/.test(t.leisure || "") || /^(wood|scrub|grassland)$/.test(t.natural || "");
function aroundOf(self, all, elements, frame) {
  const c = [self.ring.reduce((a, q) => a + q[0], 0) / self.ring.length, self.ring.reduce((a, q) => a + q[1], 0) / self.ring.length];
  const near = (r) => r.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < AROUND_R + 60);
  const others = all.filter((b) => b !== self && b.bbox[2] > c[0] - AROUND_R && b.bbox[0] < c[0] + AROUND_R && b.bbox[3] > c[1] - AROUND_R && b.bbox[1] < c[1] + AROUND_R);
  const greens = (elements || []).filter((el) => el.type === "area" && el.geometry?.length > 2 && !el.tags?.building && GREEN_TAGS(el.tags || {}))
    .map((el) => ({ rings: [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat))) })).filter((g) => near(g.rings[0]));
  let n = 0, built = 0, green = 0;
  for (let x = -AROUND_R; x <= AROUND_R; x += AROUND_STEP) for (let y = -AROUND_R; y <= AROUND_R; y += AROUND_STEP) {
    if (Math.hypot(x, y) > AROUND_R) continue;
    const p = [c[0] + x, c[1] + y];
    n++;
    if (others.some((b) => p[0] >= b.bbox[0] && p[0] <= b.bbox[2] && p[1] >= b.bbox[1] && p[1] <= b.bbox[3] && inside(b.rings, p[0], p[1]))) built++;
    else if (greens.some((g) => inside(g.rings, p[0], p[1]))) green++;
  }
  return { built: +(built / n).toFixed(2), green: +(green / n).toFixed(2) };
}
const ringArea = (r) => Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0)) / 2;

// The main axis of one footprint (principal component of its outline): its direction and the house's length and
// width along and across it (m).
function mainAxis(pts) {
  const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length, my = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const ang = Math.atan2(2 * sxy, sxx - syy) / 2, u = [Math.cos(ang), Math.sin(ang)];
  const along = pts.map(([x, y]) => (x - mx) * u[0] + (y - my) * u[1]), across = pts.map(([x, y]) => -(x - mx) * u[1] + (y - my) * u[0]);
  return { u, length: Math.max(...along) - Math.min(...along), width: Math.max(...across) - Math.min(...across) };
}

const GABLE_MAX_W = 11, GABLE_RATIO = 1.4, GABLE_COS = 0.85;
export const gableToStreet = (axis, normal) => !!axis && axis.width <= GABLE_MAX_W && axis.length >= GABLE_RATIO * axis.width
  && Math.abs(axis.u[0] * normal[0] + axis.u[1] * normal[1]) / Math.hypot(...normal) >= GABLE_COS;

// The block a building belongs to: the buildings joined to it wall to wall (a vertex within
// TOUCH of another's outline), and the block's extent along its main axis (length, width, m),
// how much of that rectangle the buildings fill, and how many there are. A panel house is a
// long slab about 10–14 m wide that fills its rectangle; a city block of tenements is wide,
// with a courtyard (low fill); a building standing alone is one part.
const TOUCH = 0.8, BLOCK_MAX = 40;
function blockShape(start, all) {
  const near = (a, b) => a.bbox[0] - TOUCH <= b.bbox[2] && b.bbox[0] - TOUCH <= a.bbox[2] && a.bbox[1] - TOUCH <= b.bbox[3] && b.bbox[1] - TOUCH <= a.bbox[3];
  const segDist = ([px, py], [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  };
  const touches = (a, b) => [[a, b], [b, a]].some(([u, v]) => u.ring.some((q) =>
    v.ring.some((r, i) => i && segDist(q, v.ring[i - 1], r) < TOUCH)));
  const group = [start], seen = new Set([start]);
  for (let i = 0; i < group.length && group.length < BLOCK_MAX; i++) {
    for (const b of all) if (!seen.has(b) && near(group[i], b) && touches(group[i], b)) { seen.add(b); group.push(b); }
  }
  // Main axis of all the outline points (principal component), extents along it and across.
  const pts = group.flatMap((b) => b.ring);
  const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length, my = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const ang = Math.atan2(2 * sxy, sxx - syy) / 2, [ux, uy] = [Math.cos(ang), Math.sin(ang)];
  const along = pts.map(([x, y]) => (x - mx) * ux + (y - my) * uy), across = pts.map(([x, y]) => -(x - mx) * uy + (y - my) * ux);
  const l = Math.max(...along) - Math.min(...along), w = Math.max(...across) - Math.min(...across);
  const area = (r) => Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0)) / 2;
  const filled = group.reduce((a, b) => a + area(b.ring), 0);
  return { length: +l.toFixed(1), width: +w.toFixed(1), fill: +(filled / (l * w || 1)).toFixed(2), parts: group.length, area: Math.round(filled) };
}
