// The surface of a separate tram bed from the orthophoto (Bára 10. 11. 2026): OSM rarely tags it (126 of 2625
// Prague tram ways, almost all asphalt or sett) and the technical maps not at all. On a click whose cut crosses
// tram tracks of OSM, one small image of ČÚZK's orthophoto (the one the map shows) around the tracks is asked
// in parallel with the other sources, with a short timeout; derive.js reads the pixels of each tram bed
// between its edges, away from the rails, and tells grass by its green. What fails is left to the rules.
// The image is a PNG, decoded by dmvs.js (one code path for the browser and the evaluation in Node), loaded
// only for a cut with tracks.

export const ORTHO_WMS = "https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer";
const RES = 0.25; // m per pixel
const PAD = 5; // m beyond the outermost tracks along the cut (a bed reaches 2–5 m past its track)
const ALONG = 3; // m along the street on each side of the cut
const TIMEOUT = 2500; // ms; a slower answer is not waited for (the profile then keeps the rules)
const R = 6378137;
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];

// Offsets along the cut (t, as derive.js: center + normal · t) where tram ways of OSM cross it.
export function tramOffsets(osm, frame, center, dir, half) {
  const normal = [-dir[1], dir[0]], out = [];
  for (const el of osm?.elements || []) {
    if (el.type !== "way" || el.tags?.railway !== "tram" || !el.geometry) continue;
    const p = el.geometry.map((g) => frame.toXY(g.lon, g.lat)).map(([x, y]) => [x - center[0], y - center[1]]);
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      const da = ax * dir[0] + ay * dir[1], db = bx * dir[0] + by * dir[1];
      if (da === db || (da > 0) === (db > 0)) continue;
      const f = da / (da - db), t = (ax + (bx - ax) * f) * normal[0] + (ay + (by - ay) * f) * normal[1];
      if (Math.abs(t) <= half) out.push(t);
    }
  }
  return out;
}

// The orthophoto around the tracks the cut crosses, or null (no tracks, no answer in time, a bad image).
// Returns { look(s, e, rails, at, dir) → { kind, green, … } | null } for derive.js, and ms (the request's time).
export async function bedOrtho({ osm, frame, center = [0, 0], dir, half = 40, timeout = TIMEOUT, res = RES, fetchImpl = fetch }) {
  const ts = tramOffsets(osm, frame, center, dir, half);
  if (!ts.length) return null;
  const normal = [-dir[1], dir[0]], lo = Math.min(...ts) - PAD, hi = Math.max(...ts) + PAD;
  const corners = [];
  for (const t of [lo, hi]) for (const u of [-ALONG, ALONG]) corners.push(frame.toLonLat(center[0] + normal[0] * t + dir[0] * u, center[1] + normal[1] * t + dir[1] * u));
  const ms = corners.map(([lon, lat]) => merc(lon, lat));
  const [x0, x1] = [Math.min(...ms.map((m) => m[0])), Math.max(...ms.map((m) => m[0]))];
  const [y0, y1] = [Math.min(...ms.map((m) => m[1])), Math.max(...ms.map((m) => m[1]))];
  const k = Math.cos((corners[0][1] * Math.PI) / 180); // Web Mercator metres per ground metre
  const width = Math.max(8, Math.round(((x1 - x0) * k) / res)), height = Math.max(8, Math.round(((y1 - y0) * k) / res));
  const url = `${ORTHO_WMS}?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox: [x0, y0, x1, y1].join(","), width, height, format: "image/png" })}`;
  const t0 = Date.now();
  try {
    const r = await fetchImpl(url, { signal: AbortSignal.timeout(timeout) });
    if (!r.ok) return null;
    const { decodePng } = await import("./dmvs.js");
    const img = await decodePng(await r.arrayBuffer());
    const pixel = (x, y) => {
      const [mx, my] = merc(...frame.toLonLat(x, y));
      const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height);
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) return null;
      const o = (py * img.width + px) * 4;
      return [img.rgba[o], img.rgba[o + 1], img.rgba[o + 2]];
    };
    return { ms: Date.now() - t0, look: (s, e, rails, at, d) => classifyBed(bedPixels(pixel, s, e, rails, at, d, res)) };
  } catch {
    return null;
  }
}

// The pixels of a bed from s to e along the cut (rows along the street, step res), leaving out a margin at the
// edges (curbs) and the rails (track axes ± half the gauge). A row between the rails of a track is marked
// (sleeper): there the sleepers of a gravel bed show as stripes across it.
const EDGE = 0.4, RAIL = 0.7175, RAIL_OFF = 0.3, SLEEPER_ROW = RAIL - RAIL_OFF;
export function bedPixels(pixel, s, e, rails, at, dir, res = RES) {
  const rows = [];
  rows.res = res;
  for (let t = s + EDGE; t <= e - EDGE + 1e-9; t += res) {
    if (rails.some((r) => Math.abs(Math.abs(t - r) - RAIL) < RAIL_OFF)) continue;
    const [cx, cy] = at(t), row = [];
    for (let u = -ALONG + res / 2; u < ALONG; u += res) row.push(pixel(cx + dir[0] * u, cy + dir[1] * u));
    if (rails.some((r) => Math.abs(t - r) <= SLEEPER_ROW)) row.sleeper = true;
    rows.push(row);
  }
  return rows;
}

// How regularly the brightness of a row along the street repeats at the spacing of sleepers (SLEEPERS m):
// the highest autocorrelation of the row's brightness at those lags, from −1 to 1. A row with a gap: null.
const SLEEPERS = [0.5, 0.9];
export function sleeperRepeat(row, res) {
  if (row.some((p) => !p)) return null;
  const L = row.map(([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b);
  const mu = L.reduce((a, v) => a + v, 0) / L.length, d = L.map((v) => v - mu);
  const v = d.reduce((a, x) => a + x * x, 0) / d.length;
  if (v < 1) return 0;
  let best = -1;
  for (let k = Math.max(1, Math.round(SLEEPERS[0] / res)); k <= Math.round(SLEEPERS[1] / res); k++) {
    let c = 0;
    for (let i = 0; i + k < d.length; i++) c += d[i] * d[i + k];
    best = Math.max(best, c / (d.length - k) / v);
  }
  return best;
}

// What the pixels say: the share of green among the lit pixels (grass), their brightness, how much it changes
// from one pixel to the next along the street, and how regularly it repeats between the rails (sleepers).
// rows: arrays of [r, g, b] or null (bedPixels).
const SHADOW = 50; // brightness below which a pixel is shade
const GREEN = 10; // 2g − r − b of a green pixel (the dull grass of the orthophoto: Kolbenova about 17 on average)
export function bedFeatures(rows) {
  let n = 0, green = 0, shade = 0, lum = 0, tex = 0, nt = 0;
  const repeats = [];
  for (const row of rows) {
    let prev = null;
    for (const p of row) {
      if (!p) { prev = null; continue; }
      const [r, g, b] = p, L = 0.299 * r + 0.587 * g + 0.114 * b;
      if (L < SHADOW) { shade++; prev = null; continue; }
      n++; lum += L;
      if (2 * g - r - b >= GREEN && g > b) green++;
      if (prev !== null) { tex += Math.abs(L - prev); nt++; }
      prev = L;
    }
    const q = row.sleeper && rows.res <= 0.15 ? sleeperRepeat(row, rows.res) : null;
    if (q !== null) repeats.push(q);
  }
  const sleepers = repeats.length ? repeats.reduce((a, v) => a + v, 0) / repeats.length : null;
  return { n, shade, green: n ? green / n : 0, lum: n ? lum / n : 0, tex: nt ? tex / nt : 0, sleepers };
}

// Grass where at least GRASS of the lit pixels are green; nothing else is told apart. Gravel shows its sleepers
// only at 0.1 m/px (sleepers, ab.mjs variant tram-orto-10) and even then they part gravel from paving in half of
// the beds only; asphalt and panels look alike (evaluation/pravidla-11-2026/ZPRAVA.md, section 4). Too few lit
// pixels (shade, trees, outside the image): null.
const GRASS = 0.35, MIN_PIXELS = 40;
export function classifyBed(rows) {
  const f = bedFeatures(rows);
  if (f.n < MIN_PIXELS || f.n < f.shade) return null;
  return { kind: f.green >= GRASS ? "trava" : null, ...f };
}
