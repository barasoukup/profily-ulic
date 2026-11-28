// Geometry of a found street (lon, lat; a local metric scale is enough for one street).
const k = (lat) => Math.cos((lat * Math.PI) / 180);
function nearestOnSegment([ax, ay], [bx, by], [px, py], c) {
  const dx = (bx - ax) * c, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * c * dx + (py - ay) * dy) / len2)) : 0;
  const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
  return { point: [x, y], d2: ((x - px) * c) ** 2 + (y - py) ** 2 };
}
// The point of a polyline nearest to p.
export function nearestOnPaths(paths, p) {
  const c = k(p[1]);
  let best = null;
  for (const path of paths || []) {
    if (path.length === 1) { const d2 = ((path[0][0] - p[0]) * c) ** 2 + (path[0][1] - p[1]) ** 2; if (!best || d2 < best.d2) best = { point: path[0], d2 }; }
    for (let i = 0; i + 1 < path.length; i++) {
      const r = nearestOnSegment(path[i], path[i + 1], p, c);
      if (!best || r.d2 < best.d2) best = r;
    }
  }
  return best?.point || null;
}
// The middle of a street: the length-weighted centre of its segments, put back on the street (a street of many
// pieces, a curved one: the centre itself can lie off it).
export function streetMiddle(paths) {
  let sx = 0, sy = 0, sl = 0;
  const lat0 = paths?.[0]?.[0]?.[1];
  if (lat0 === undefined) return null;
  const c = k(lat0);
  for (const path of paths) for (let i = 0; i + 1 < path.length; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    const l = Math.hypot((bx - ax) * c, by - ay);
    sx += ((ax + bx) / 2) * l; sy += ((ay + by) / 2) * l; sl += l;
  }
  const centre = sl ? [sx / sl, sy / sl] : paths[0][0];
  return nearestOnPaths(paths, centre);
}
