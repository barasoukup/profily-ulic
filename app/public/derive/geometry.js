// Plane geometry in the local metric frame of a cut: frame, polylines, rings.


export function localFrame(lat0, lon0) {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110574;
  return {
    toXY: (lon, lat) => [(lon - lon0) * kx, (lat - lat0) * ky],
    toLonLat: (x, y) => [lon0 + x / kx, lat0 + y / ky],
  };
}

export function closestOnPolyline(pts, p) {
  let best = { d: Infinity };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2));
    const qx = ax + t * dx, qy = ay + t * dy;
    const d = Math.hypot(p[0] - qx, p[1] - qy);
    if (d < best.d) {
      const len = Math.sqrt(len2);
      best = { d, point: [qx, qy], dir: [dx / len, dy / len], index: i };
    }
  }
  return best;
}

// Move a snapped point along its way away from junctions and pedestrian crossings, where a
// perpendicular cut runs along a side street or over a zebra. Junctions are nodes the way shares
// with another street (its plain continuation under the same name does not count); the way ends
// keep END_CLEARANCE as before. The point stays on its own way, as close to the click as possible.
// The point of the polyline pts nearest to q: { dist, p }.
export function nearestOnLine(pts, q) {
  let best = null;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], d = [b[0] - a[0], b[1] - a[1]], L2 = d[0] * d[0] + d[1] * d[1];
    if (!L2) continue;
    const u = Math.max(0, Math.min(1, ((q[0] - a[0]) * d[0] + (q[1] - a[1]) * d[1]) / L2)), p = [a[0] + u * d[0], a[1] + u * d[1]];
    const dist = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (!best || dist < best.dist) best = { dist, p };
  }
  return best;
}

export function bboxOf(ring) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

// Even-odd test over all rings (outer rings and holes alike).
export function inside(rings, x, y) {
  let c = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
}

export function segIntersect(p, p2, q, q2) {
  const r = [p2[0] - p[0], p2[1] - p[1]];
  const s = [q2[0] - q[0], q2[1] - q[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return null;
  const qp = [q[0] - p[0], q[1] - p[1]];
  const t = (qp[0] * s[1] - qp[1] * s[0]) / den;
  const u = (qp[0] * r[1] - qp[1] * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

export const round = (v) => Math.round(v * 100) / 100;
