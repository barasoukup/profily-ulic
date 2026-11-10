// Jihlava's passport with the roadways of state and regional roads that the city drew as a uniform strip of
// the road's nominal crown (ŘSD, KSÚS, no surface recorded, 13 m across along much of it:
// I/38 as 13.0 m; the same polygon may narrow to 9 m elsewhere, so it is judged edge by edge), narrowed by TRIM on each side: the crown includes the unpaved verges, the asphalt is about
// 10.5 m (evaluation/jihlava/PASPORT.md). The rest as towns/jihlava.js.
import { roads, compose, passportLayer, stateRoad } from "./_jihlava.mjs";
import { metres } from "../../pilot/public/gis.js";

export const about = "pasport, pás silnice ŘSD/KSÚS široký 13 m zúžený o 1,25 m z každé strany";
// The strip: 13 m (12.7–13.2) across over at least SHARE of the polygon's edges, as a buffer of the axis is.
const TRIM = 1.25, MIN_STRIP = 12.7, MAX_STRIP = 13.2, SHARE = 0.3;

// Widths of a polygon (metres) across it: from points along each edge, inwards to the next edge hit.
function widths(ring) {
  const out = []; // per edge: the median width from its points, or null
  const n = ring.length - 1;
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  const inward = area > 0 ? 1 : -1; // counter-clockwise: the inside lies to the left
  for (let i = 0; i < n; i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[i + 1], len = Math.hypot(bx - ax, by - ay);
    const here = [];
    out.push(here);
    if (len < 0.5) continue;
    const nx = (-(by - ay) / len) * inward, ny = ((bx - ax) / len) * inward;
    for (let s = 0.5; s < len; s += 2) {
      const px = ax + ((bx - ax) * s) / len, py = ay + ((by - ay) * s) / len;
      let best = Infinity;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const [cx, cy] = ring[j], [dx, dy] = ring[j + 1], ex = dx - cx, ey = dy - cy;
        const den = nx * ey - ny * ex;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((cx - px) * ey - (cy - py) * ex) / den, u = ((cx - px) * ny - (cy - py) * nx) / den;
        if (t > 0.05 && u >= 0 && u <= 1 && t < best) best = t;
      }
      if (best < 60) here.push(best);
    }
  }
  return { out: out.map((w) => (w.length ? w.sort((a, b) => a - b)[Math.floor(w.length / 2)] : null)), inward };
}
// A polygon moved inwards along the vertex bisectors, vertex i by d[i].
function shrink(ring, d, inward) {
  const n = ring.length - 1, out = [];
  const normal = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(-(b[1] - a[1]) / l) * inward, ((b[0] - a[0]) / l) * inward]; };
  for (let i = 0; i < n; i++) {
    const p = ring[(i - 1 + n) % n], c = ring[i], q = ring[i + 1];
    const n1 = normal(p, c), n2 = normal(c, q);
    let bx = n1[0] + n2[0], by = n1[1] + n2[1];
    const bl = Math.hypot(bx, by);
    if (bl < 1e-6) { bx = n2[0]; by = n2[1]; } else { bx /= bl; by /= bl; }
    const k = Math.max(0.5, bx * n2[0] + by * n2[1]);
    out.push([c[0] + (bx * d[i]) / k, c[1] + (by * d[i]) / k]);
  }
  out.push(out[0]);
  return out;
}
export function narrowStrip(f, lat) {
  const [kx, ky] = metres(lat);
  const rings = f.geometry?.rings;
  if (!rings || rings.length !== 1) return f;
  const ring = rings[0].map(([x, y]) => [x * kx, y * ky]);
  const { out: ws, inward } = widths(ring);
  const n = ws.length, strip = (w) => w !== null && w >= MIN_STRIP && w <= MAX_STRIP;
  // An edge without a measured width (a short one) takes its neighbours'.
  const at = (i) => { for (let k = 0; k < n; k++) for (const j of [i - k, i + k]) { const w = ws[(j + n) % n]; if (w !== null) return w; } return null; };
  const d = ws.map((_, i) => (strip(at((i - 1 + n) % n)) && strip(at(i)) ? TRIM : 0));
  if (!d.some(Boolean) || ws.filter(strip).length < SHARE * ws.filter((w) => w !== null).length) return f;
  return { ...f, attributes: { ...f.attributes, narrowed: d.filter(Boolean).length }, geometry: { rings: [shrink(ring, d, inward).map(([x, y]) => [x / kx, y / ky])] } };
}
export async function surfaces(bbox) {
  const r = await roads(bbox);
  const lat = Number(bbox.split(",")[1]);
  const features = (r.features || []).map((f) => (stateRoad(f.attributes) ? narrowStrip(f, lat) : f));
  return compose(bbox, [passportLayer({ features })], features.some((f) => f.attributes.typ_useku === "vozovka"));
}
