// Surfaces of any Czech town from the national digital technical map (DTM, IS DMVS of ČÚZK), read live on a
// click. Each region fills the DTM in the same JVF DTM model, with the kinds of surface of an MTVU map:
// roadways, sidewalks, parking, islands, tram beds, green, gardens, yards, buildings. ČÚZK publishes it
// only as a WMS (CORS open): map images and the type of the surface at a pixel (GetFeatureInfo), no
// geometry. So the polygons are read from the images:
//   1. the areas (dtm_zps_plochy_bar) and their boundary lines (dtm_zps_linie_body) as two PNGs of the
//      cut's envelope at RES m/px, decoded here (one code path for the browser and the evaluation in Node);
//   2. every pixel snapped to the nearest colour of the map's legend, the drawn lines and edges between
//      colours left open; areas of one colour that touch (a roadway and its parking bays are both white)
//      are parted by the boundary lines;
//   3. connected areas found and their outlines traced (pixel cracks, then Douglas–Peucker);
//   4. the areas on the cut labelled by one GetFeatureInfo each, in parallel, where their colour does not
//      tell the type (white: roadway, parking, driveway, bridge; light grey: islands, platforms, medians…).
// In the nine regions whose DTM answers a WFS (dtmwfs.js) surfaces() takes the polygons from there instead
// (opts.wfs) and keeps the images for the other regions and when the WFS fails.
// Where the region has not drawn the DTM (whole blocks are blank in Pardubice in 2026), RÚIAN of ČÚZK
// fills in: its buildings, then the use of its parcels (gardens, yards, green).
import { query, envelope, asMtvu, metres } from "./gis.js";
import { wfsAreas } from "./dtmwfs.js";

const WMS = "https://dmvs.cuzk.gov.cz/api/wms";
export const DMVS_AREAS = `${WMS}/dtm_zps_plochy_bar`;
export const DMVS_LINES = `${WMS}/dtm_zps_linie_body`;
// Lines that bound areas: not the underground objects, terrain edges and definition points, which cross them.
const BOUNDARY_LAYERS = "bud,prisl_st,st_kult_sakr,dopr_st,vod_dila,udrz_zelen,ost_pl,dop_konstr";
const RES = 0.1; // m per pixel
const MAX_PX = 4000; // the service draws up to 8192 px a side
const MAX_INFO = 16; // GetFeatureInfo requests per click
const SIMPLIFY = 0.2; // m, Douglas–Peucker tolerance of the outlines
const MAX_GAP = 25; // m, the widest blank roadway between areas of the DTM read as a street drawn in part
const PAD = 0.0004; // degrees around the cut in the envelope app.js and run_brno.mjs ask for
const TIMEOUT = 8000; // a slower answer is not waited for (srovnani-dmvs: once 21 s in Most)

// ---------- PNG ----------
export async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// A PNG (grey, RGB, palette, grey+alpha or RGBA; 8 bits, a palette also 1–4; not interlaced) →
// { width, height, rgba } with 4 bytes per pixel.
export async function decodePng(buf) {
  const b = new Uint8Array(buf);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length < 8 || dv.getUint32(0) !== 0x89504e47) throw new Error("not a PNG");
  let width = 0, height = 0, depth = 8, type = 0, palette = null, trns = null;
  const idat = [];
  for (let o = 8; o + 8 <= b.length; ) {
    const len = dv.getUint32(o), name = String.fromCharCode(...b.subarray(o + 4, o + 8)), data = b.subarray(o + 8, o + 8 + len);
    if (name === "IHDR") {
      width = dv.getUint32(o + 8); height = dv.getUint32(o + 12); depth = b[o + 16]; type = b[o + 17];
      if (b[o + 20]) throw new Error("interlaced PNG");
    } else if (name === "PLTE") palette = data;
    else if (name === "tRNS") trns = data;
    else if (name === "IDAT") idat.push(data);
    else if (name === "IEND") break;
    o += 12 + len;
  }
  const all = new Uint8Array(idat.reduce((n, d) => n + d.length, 0));
  idat.reduce((n, d) => (all.set(d, n), n + d.length), 0);
  const raw = await inflate(all);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels || (depth !== 8 && type !== 3 && type !== 0)) throw new Error(`PNG type ${type}/${depth}`);
  const bpp = Math.max(1, (channels * depth) >> 3); // bytes per pixel for the filters
  const stride = (width * channels * depth + 7) >> 3;
  const lines = new Uint8Array(stride * height);
  // Undo the filters line by line (None, Sub, Up, Average, Paeth).
  for (let y = 0, p = 0; y < height; y++) {
    const f = raw[p++], row = y * stride, up = row - stride;
    for (let x = 0; x < stride; x++, p++) {
      const a = x >= bpp ? lines[row + x - bpp] : 0, u = y ? lines[up + x] : 0, c = y && x >= bpp ? lines[up + x - bpp] : 0;
      let v = raw[p];
      if (f === 1) v += a;
      else if (f === 2) v += u;
      else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) {
        const q = a + u - c, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c;
      }
      lines[row + x] = v;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  const sample = (row, i) => (depth === 8 ? lines[row + i] : (lines[row + ((i * depth) >> 3)] >> (8 - depth - ((i * depth) & 7))) & ((1 << depth) - 1));
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (type === 3) {
        const k = sample(row, x);
        rgba[o] = palette[k * 3]; rgba[o + 1] = palette[k * 3 + 1]; rgba[o + 2] = palette[k * 3 + 2];
        rgba[o + 3] = trns && k < trns.length ? trns[k] : 255;
      } else if (type === 0) {
        rgba[o] = rgba[o + 1] = rgba[o + 2] = depth === 8 ? lines[row + x] : (sample(row, x) * 255) / ((1 << depth) - 1);
        rgba[o + 3] = 255;
      } else if (type === 4) {
        rgba[o] = rgba[o + 1] = rgba[o + 2] = lines[row + x * 2];
        rgba[o + 3] = lines[row + x * 2 + 1];
      } else {
        rgba[o] = lines[row + x * channels]; rgba[o + 1] = lines[row + x * channels + 1]; rgba[o + 2] = lines[row + x * channels + 2];
        rgba[o + 3] = type === 6 ? lines[row + x * 4 + 3] : 255;
      }
    }
  }
  return { width, height, rgba };
}

// ---------- Areas of an image ----------
// The fills of the map's legend (GetLegendGraphic of each sublayer) with the MTVU code a colour tells by
// itself, or null where the type must be asked (one colour for several types).
const PALETTE = [
  [[255, 255, 255], null], // provozní plocha komunikace, parkoviště, nájezd, mostní konstrukce, hosp. nevyužívaná plocha
  [[245, 245, 245], null], // manipulační plocha, přidružená plocha, příkop, mostní váha, dvůr, stavba pro zpevnění povrchu
  [[230, 230, 230], null], // nástupiště, dopravní ostrůvek, dělicí pás, terasa, rampa, vodní díla
  [[210, 210, 210], 602], // zdi, opěrné zdi, patky, komíny, portály, kulturní a sakrální stavby
  [[214, 212, 212], 601], [[235, 233, 232], 601], // budova
  [[255, 254, 232], 702], // chodník, schodiště
  [[246, 236, 222], 703], // cyklostezka
  [[240, 236, 235], 705], // tramvajová dráha
  [[215, 211, 237], 1100], [[212, 189, 199], 1100], // železnice, speciální dráha
  [[227, 240, 216], 401], [[212, 240, 194], 401], // udržovaná zeleň, vegetační mísa, parková zeleň, stromy a keře
  [[211, 224, 188], 200], [[249, 252, 245], 300], [[255, 249, 239], 100], // les, zahrada, zemědělská půda
  [[217, 242, 255], 502], [[230, 246, 255], 501], [[222, 235, 255], 602], // jezero, vodní tok, bazén
  [[213, 224, 222], 602], [[204, 197, 186], 602], // skleník, hradby
  [[247, 247, 250], null], // zastřešení (a roof over the ground: the type beneath is asked)
  [[222, 214, 204], 1003], [[232, 229, 225], 1003], [[222, 227, 209], 1003], // průmysl a hospodářství
  [[210, 212, 188], 901], [[255, 250, 219], 901], // rekreační stavby
];
const SNAP = 10; // farthest colour (RGB distance) still read as a fill; more: an edge, a line or text
const BLANK = -1, OPEN = -2;

// Per pixel: the palette index, BLANK (no area) or OPEN (a boundary line, an edge between two fills, text).
export function classify(areas, lines) {
  const n = areas.width * areas.height, cls = new Int16Array(n);
  const cache = new Map();
  for (let i = 0; i < n; i++) {
    const o = i * 4, a = areas.rgba;
    if (lines && lines.rgba[o + 3] >= 64) { cls[i] = OPEN; continue; }
    if (a[o + 3] < 128) { cls[i] = BLANK; continue; }
    const key = (a[o] << 16) | (a[o + 1] << 8) | a[o + 2];
    let c = cache.get(key);
    if (c === undefined) {
      let best = Infinity;
      c = OPEN;
      PALETTE.forEach(([[r, g, bl]], k) => {
        const d = Math.hypot(a[o] - r, a[o + 1] - g, a[o + 2] - bl);
        if (d < best) { best = d; c = d <= SNAP ? k : OPEN; }
      });
      cache.set(key, c);
    }
    cls[i] = c;
  }
  return cls;
}

// Connected areas: pixels of one colour whose four neighbours share it (so the one-pixel blends along an
// edge do not form areas of their own), joined by 4-connectivity; then every open pixel next to an area
// joins it, GROW times over (lines, edges and text closed again). → { label (Int32, -1 none), count, cls }
const GROW = 3;
export function components(cls, w, h) {
  const n = w * h, label = new Int32Array(n).fill(-1), colour = [];
  const core = (i) => {
    const c = cls[i];
    if (c < 0) return false;
    const x = i % w;
    return (x > 0 && cls[i - 1] === c) && (x < w - 1 && cls[i + 1] === c) && (i >= w && cls[i - w] === c) && (i < n - w && cls[i + w] === c);
  };
  const stack = new Int32Array(n);
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (label[s] >= 0 || !core(s)) continue;
    const c = cls[s];
    let top = 0;
    stack[top++] = s;
    label[s] = count;
    while (top) {
      const i = stack[--top], x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j >= 0 && j < n && label[j] < 0 && cls[j] === c && core(j)) { label[j] = count; stack[top++] = j; }
      }
    }
    colour.push(c);
    count++;
  }
  // Grow into the open pixels and the blends (not into blank ground).
  let front = [];
  for (let i = 0; i < n; i++) if (label[i] >= 0) front.push(i);
  for (let g = 0; g < GROW && front.length; g++) {
    const next = [];
    for (const i of front) {
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j >= 0 && j < n && label[j] < 0 && cls[j] !== BLANK) { label[j] = label[i]; next.push(j); }
      }
    }
    front = next;
  }
  return { label, count, colour };
}

// Outlines of one area as closed rings in pixel corners (x right, y down): the cracks between its pixels
// and the rest, joined into loops; outer rings and holes alike (derive.js tests points even–odd).
export function trace(label, w, h, id, box) {
  const [bx0, by0, bx1, by1] = box || [0, 0, w - 1, h - 1];
  const W = w + 1;
  const next = new Map(); // corner → corners the cracks lead to
  const add = (x0, y0, x1, y1) => {
    const k = y0 * W + x0, v = y1 * W + x1;
    const l = next.get(k);
    if (l) l.push(v); else next.set(k, [v]);
  };
  const out = (x, y) => x < 0 || y < 0 || x >= w || y >= h || label[y * w + x] !== id;
  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      if (label[y * w + x] !== id) continue;
      if (out(x, y - 1)) add(x, y, x + 1, y);
      if (out(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (out(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (out(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const rings = [];
  for (const start of next.keys()) {
    while (next.get(start)?.length) {
      const ring = [];
      let k = start;
      do {
        ring.push([k % W, Math.floor(k / W)]);
        const l = next.get(k);
        const v = l.pop();
        if (!l.length) next.delete(k);
        k = v;
      } while (k !== start && next.has(k));
      if (ring.length >= 4) rings.push(ring);
    }
  }
  return rings;
}

// Douglas–Peucker of a closed ring (tolerance in its units): first the corners, then the points that
// keep the outline within tol.
export function simplify(ring, tol) {
  const pts = ring.filter((p, i) => {
    const a = ring[(i - 1 + ring.length) % ring.length], b = ring[(i + 1) % ring.length];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
  if (pts.length < 4) return pts;
  // Split at the point farthest from the first one, simplify both halves.
  let far = 0, fd = -1;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > fd) { fd = d; far = i; } });
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[far] = 1;
  const dp = (i, j) => {
    const [ax, ay] = pts[i], [bx, by] = j === pts.length ? pts[0] : pts[j];
    const l = Math.hypot(bx - ax, by - ay);
    let best = -1, d = 0;
    for (let k = i + 1; k < j; k++) {
      const [px, py] = pts[k];
      const e = l ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / l : Math.hypot(px - ax, py - ay);
      if (e > d) { d = e; best = k; }
    }
    if (best >= 0 && d > tol) { keep[best] = 1; dp(i, best); dp(best, j); }
  };
  dp(0, far);
  dp(far, pts.length);
  return pts.filter((_, i) => keep[i]);
}

const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]);
  return Math.abs(a) / 2;
};

// ---------- Types of the DTM → MTVU codes ----------
// The type names of GetFeatureInfo (objektovytypnazev) → MTVU codes (as tools/build_dtm_brno.py and
// towns/plzen.js read the JVF types). The first match wins.
const TYPES = [
  [/podchod|tunel|podzemní|zastřešen/, null], // under the ground; roofs over it (a stop's canopy)
  [/tramvajov/, 705], [/cyklostezk/, 703], [/parkovišt|odstavn/, 704],
  [/mostní konstrukc|mostovk/, 700], // a bridge deck ("plocha mostovky") too (srovnani-dmvs: Hlávkův most)
  [/provozní plocha pozemní komunikace|mostní váh|přidružen/, 701],
  [/chodník|nájezd|nástupišt|ostrůvk|schodišt|ramp/, 702],
  [/děl[ií]c|zelen|travnat|vegetační mís|stromů a keřů/, 401],
  [/příkop|násep|nevyužívan|hřbitov|meliorační/, 402],
  [/zahrad/, 300], [/\bles/, 200], [/orn|vinic|chmelnic|sad|travní porost|zemědělsk/, 100],
  [/vodní(ho)? tok|koryt/, 501], [/nádrž|jezer|rybník|vodní ploch/, 502], [/hráz|\bjez|stupeň|stupně|vodní dílo|vodního díla/, 503],
  [/budov/, 601], [/dvůr|dvor|nádvoří/, 603], [/hřišt|sportovišt/, 901], [/manipulační|zpevnění povrchu/, 1003],
  [/železni|dráh/, 1100],
  [/zeď|zdi|podezdív|teras|komín|sklení|patk|desk|pilíř|portál|propustk|hradeb|hradby|stavb|stavby|bazén/, 602],
];
export const typeCode = (name) => {
  const t = (name || "").toLowerCase();
  const hit = TYPES.find(([re]) => re.test(t));
  return hit ? hit[1] : undefined;
};

// ---------- Requests ----------
const R = 6378137;
const mercX = (lon) => (R * lon * Math.PI) / 180;
const mercY = (lat) => R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const latOf = (y) => (360 * Math.atan(Math.exp(y / R))) / Math.PI - 90;

async function get(url, as) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
      if (!r.ok) throw new Error(`DMVS ${r.status}`);
      return as === "json" ? await r.json() : await r.arrayBuffer();
    } catch (err) {
      if (i >= 1 || err.name === "TimeoutError") throw err;
      await new Promise((res) => setTimeout(res, 800));
    }
  }
}

// The view of a cut: its envelope in Web Mercator and the image size at RES.
export function view(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const [kx, ky] = metres((y0 + y1) / 2);
  const res = Math.max(RES, ((x1 - x0) * kx) / MAX_PX, ((y1 - y0) * ky) / MAX_PX);
  const w = Math.round(((x1 - x0) * kx) / res), h = Math.round(((y1 - y0) * ky) / res);
  const merc = [mercX(x0), mercY(y0), mercX(x1), mercY(y1)];
  const params = { service: "WMS", version: "1.3.0", crs: "EPSG:3857", bbox: merc.join(","), width: w, height: h, styles: "" };
  // Pixel (corner coordinates) → [lon, lat] and back.
  const toLonLat = ([px, py]) => [x0 + (px / w) * (x1 - x0), latOf(merc[3] - (py / h) * (merc[3] - merc[1]))];
  const toPx = ([lon, lat]) => [((lon - x0) / (x1 - x0)) * w, ((merc[3] - mercY(lat)) / (merc[3] - merc[1])) * h];
  return { w, h, res, params, toLonLat, toPx };
}

const mapUrl = (base, layers, v) => `${base}?${new URLSearchParams({ ...v.params, request: "GetMap", layers, format: "image/png", transparent: "true" })}`;
const infoUrl = (v, [i, j]) => `${DMVS_AREAS}?${new URLSearchParams({
  ...v.params, request: "GetFeatureInfo", layers: "dtm_zps_plochy_bar", query_layers: "dtm_zps_plochy_bar",
  info_format: "application/json", feature_count: 5, i, j,
})}`;

// The type of the area at a pixel: { code, level } of the surface on the ground (level 0) and of a bridge
// deck above it (level > 0); objects under the ground are left out. Region (isDtmk) for the report.
async function typeAt(v, px) {
  const json = await get(infoUrl(v, px), "json");
  const out = { region: json.isDtmk?.nazev, names: [] };
  for (const f of json.features || []) {
    const p = f.properties || {}, level = Number(p.urovenumisteniobjektuzps) || 0;
    out.names.push(p.objektovytypnazev);
    if (level < 0) continue;
    const code = typeCode(p.objektovytypnazev);
    if (code === undefined) console.warn("DMVS: neznámý typ", p.objektovytypnazev);
    if (!code) continue;
    if (level > 0) out.above ??= code;
    else out.ground ??= code;
  }
  return out;
}

// ---------- The surfaces of a cut ----------
// The areas of the DTM along a cut as ArcGIS-like features in degrees: { features: [{ attributes:
// { code, guess, level, type }, geometry: { rings } }], region, requests }. cut: the ends of the cut as
// [[lon, lat], [lon, lat]]; without it both diagonals of the envelope less PAD (the cut runs along one).
export async function dtmAreas(bbox, { cut } = {}) {
  const v = view(bbox);
  const [areasBuf, linesBuf] = await Promise.all([
    get(mapUrl(DMVS_AREAS, "dtm_zps_plochy_bar", v)),
    get(mapUrl(DMVS_LINES, BOUNDARY_LAYERS, v)).catch(() => null),
  ]);
  const areas = await decodePng(areasBuf);
  const lines = linesBuf ? await decodePng(linesBuf).catch(() => null) : null;
  const { w, h } = v;
  const cls = classify(areas, lines && lines.width === w && lines.height === h ? lines : null);
  const { label, count, colour } = components(cls, w, h);
  // The street drawn only as lines: the Středočeský kraj sends the DTM's lines to ČÚZK without its areas, and
  // where a region has areas around a street but not the street's own (Kolín, Mladá Boleslav), its roadway is
  // lines too (Bára 12. 11. 2026: the general way whenever only the lines are there). The blank ground under the
  // cut's centre is then read from the lines (fromLines), the areas around kept; without any area or roadway
  // found, nothing, said so (linesOnly).
  const hasLines = lines?.width === w && lines.height === h && lines.rgba.some((x, i) => (i & 3) === 3 && x >= 64);
  let fromLinesPart = null;
  if (hasLines && blankCentre(label, w, h, 1 / v.res)) {
    fromLinesPart = await fromLines(v, lines, undefined, count ? (i) => label[i] >= 0 : null);
    if (!count) return fromLinesPart ? { ...fromLinesPart, requests: 2 + fromLinesPart.requests } : { features: [], gap: false, requests: 2, linesOnly: true };
  }

  // The areas the cut crosses, with the pixel in the middle of their longest stretch and how near the
  // centre they come.
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cuts = cut ? [cut] : [[[x0 + PAD, y0 + PAD], [x1 - PAD, y1 - PAD]], [[x0 + PAD, y1 - PAD], [x1 - PAD, y0 + PAD]]];
  const onCut = new Map(); // id → { near, px, run }
  // A blank stretch under the centre with areas of the DTM on both sides near it: a street the region
  // has drawn only in part (its roadway missing), not a street it has not drawn at all.
  let gap = false;
  for (const [a, b] of cuts) {
    const pa = v.toPx(a), pb = v.toPx(b), len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]), steps = Math.ceil(len);
    let prev = -1, runStart = 0;
    const close = (id, s, e) => {
      if (id < 0) return;
      const m = (s + e) / 2, t = m / steps, px = [Math.floor(pa[0] + (pb[0] - pa[0]) * t), Math.floor(pa[1] + (pb[1] - pa[1]) * t)];
      const near = Math.min(Math.abs(s / steps - 0.5), Math.abs(e / steps - 0.5), s <= steps / 2 && e >= steps / 2 ? 0 : 1) * len;
      const o = onCut.get(id);
      if (!o) onCut.set(id, { near, px, run: e - s });
      else {
        o.near = Math.min(o.near, near);
        if (e - s > o.run) Object.assign(o, { px, run: e - s });
      }
    };
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, x = Math.floor(pa[0] + (pb[0] - pa[0]) * t), y = Math.floor(pa[1] + (pb[1] - pa[1]) * t);
      const id = x >= 0 && y >= 0 && x < w && y < h ? label[y * w + x] : -1;
      if (id !== prev) { close(prev, runStart, s); prev = id; runStart = s; }
    }
    close(prev, runStart, steps);
    const at = (s) => {
      const t = s / steps, x = Math.floor(pa[0] + (pb[0] - pa[0]) * t), y = Math.floor(pa[1] + (pb[1] - pa[1]) * t);
      return x >= 0 && y >= 0 && x < w && y < h ? label[y * w + x] : -1;
    };
    const mid = Math.round(steps / 2), reach = MAX_GAP / 2 / v.res;
    let lo = mid, hi = mid;
    while (at(lo) < 0 && lo > 0 && mid - lo < reach) lo--;
    while (at(hi) < 0 && hi < steps && hi - mid < reach) hi++;
    if (lo < mid && at(lo) >= 0 && at(hi) >= 0) gap = true;
  }

  // Areas that touch: an area left unlabelled takes the type of a touching labelled area of its colour
  // (a sidewalk cut in two by a line, the inside of a drawn tree).
  const touch = new Map();
  const link = (a, b) => {
    if (a < 0 || b < 0 || a === b || colour[a] !== colour[b]) return;
    (touch.get(a) || touch.set(a, new Set()).get(a)).add(b);
    (touch.get(b) || touch.set(b, new Set()).get(b)).add(a);
  };
  for (const id of onCut.keys()) touch.set(id, touch.get(id) || new Set());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, a = label[i];
      if (a < 0 || !touch.has(a)) continue;
      if (x < w - 1) link(a, label[i + 1]);
      if (y < h - 1) link(a, label[i + w]);
    }
  }

  // Ask the type where the colour does not tell it: the areas nearest the centre first, those with a
  // stretch of at least 0.3 m on the cut.
  const ask = [...onCut].filter(([id, o]) => PALETTE[colour[id]][1] === null && o.run * v.res >= 0.3)
    .sort((a, b) => a[1].near - b[1].near).slice(0, MAX_INFO);
  const types = new Map();
  let region;
  await Promise.all(ask.map(async ([id, o]) => {
    try {
      const t = await typeAt(v, o.px);
      region ||= t.region;
      types.set(id, t);
    } catch (err) {
      console.warn("DMVS GetFeatureInfo", err.message);
    }
  }));
  const typeOf = (id, seen = new Set()) => {
    if (types.has(id)) return types.get(id);
    seen.add(id);
    for (const n of touch.get(id) || []) if (!seen.has(n) && types.has(n)) return types.get(n);
    return null;
  };

  // Outlines of the areas on the cut, in degrees.
  const boxes = new Map([...onCut.keys()].map((id) => [id, [w, h, -1, -1]]));
  for (let i = 0; i < w * h; i++) {
    const b = boxes.get(label[i]);
    if (!b) continue;
    const x = i % w, y = (i - x) / w;
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
  }
  const features = [];
  for (const id of onCut.keys()) {
    const own = PALETTE[colour[id]][1];
    const t = own === null ? typeOf(id) : null;
    // Colour alone (white: the roadway, light grey: an island) where the type could not be asked: an estimate.
    const code = own ?? (t ? t.ground : { 0: 701, 1: 1003, 2: 702 }[colour[id]]);
    const rings = trace(label, w, h, id, boxes.get(id)).map((r) => simplify(r, SIMPLIFY / v.res))
      .filter((r) => r.length >= 3 && ringArea(r) * v.res ** 2 >= 0.05)
      .map((r) => { const ll = r.map(v.toLonLat); ll.push(ll[0]); return ll; });
    if (!rings.length) continue;
    const type = t?.names?.join("; ");
    if (code) features.push({ attributes: { code, guess: own === null && !t, level: 0, type }, geometry: { rings } });
    if (t?.above) features.push({ attributes: { code: t.above, guess: false, level: 1, type }, geometry: { rings } });
  }
  if (fromLinesPart) features.push(...fromLinesPart.features);
  return { features, region: region || fromLinesPart?.region, gap, requests: 2 + ask.length + (fromLinesPart?.requests || 0), size: [w, h], areas: count,
    ...(fromLinesPart && { fromLines: true }) };
}

// ---------- Surfaces from the lines alone ----------
// Where a region sends only the DTM's lines, the pieces between them still give the widths: the lines split the
// image into areas (as the boundary lines part the areas above), the one under the cut's centre (the OSM axis the
// cut is snapped to) is the roadway, and outwards from it each piece between two boundaries of a transport area
// ("Hranice dopravní stavby nebo plochy") is a sidewalk, up to the first other line (a fence, a building): what
// lies beyond is left to RÚIAN (gardens, yards, buildings, green verges). The direction across the street is the
// roadway's own (its pixels near the centre). The types are estimates, the widths the DTM's.
const LINE_GAP = PALETTE.length; // the class of every pixel off the lines
const TRANSPORT_LINE = /dopravní/i;
const LINE_REACH = 25, LINE_SIDE = 4, WALK_MAX = 4.5; // m along the cut each way; crossings asked per side; widest sidewalk (m)
const lineInfoUrl = (v, [i, j]) => `${DMVS_LINES}?${new URLSearchParams({
  ...v.params, request: "GetFeatureInfo", layers: BOUNDARY_LAYERS, query_layers: BOUNDARY_LAYERS,
  info_format: "application/json", feature_count: 3, i, j,
})}`;
// No area of the DTM within r pixels of the image's centre (the cut's centre).
function blankCentre(label, w, h, r) {
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
  for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(w - 1, cx + r); x++) if (label[y * w + x] >= 0) return false;
  return true;
}
// taken(i): a pixel of an area the DTM has (left as it is, a boundary like a line).
export async function fromLines(v, lines, info = (px) => get(lineInfoUrl(v, px), "json"), taken = null) {
  const { w, h, res } = v, n = w * h;
  const onLine = taken ? (i) => lines.rgba[i * 4 + 3] >= 64 || taken(i) : (i) => lines.rgba[i * 4 + 3] >= 64;
  const cls = new Int16Array(n);
  for (let i = 0; i < n; i++) cls[i] = onLine(i) ? OPEN : LINE_GAP;
  const { label } = components(cls, w, h);
  // The roadway: the area nearest the centre, off the lines.
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
  let road = -1;
  for (let r = 0; r < 3 / res && road < 0; r++) {
    for (let dy = -r; dy <= r && road < 0; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx, y = cy + dy, i = y * w + x;
      if (x >= 0 && y >= 0 && x < w && y < h && label[i] >= 0 && !onLine(i)) { road = label[i]; break; }
    }
  }
  if (road < 0) return null;
  // Its direction near the centre (the main axis of its pixels within 10 m); the cut runs across it.
  const R = 10 / res;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, k = 0;
  for (let y = Math.max(0, cy - R); y < Math.min(h, cy + R); y++) {
    for (let x = Math.max(0, cx - R); x < Math.min(w, cx + R); x++) {
      if (label[y * w + x] !== road || (x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
      sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; k++;
    }
  }
  // An area filling the whole disc is no roadway between lines (no lines near the centre).
  if (!k || k > 0.9 * Math.PI * R * R) return null;
  const vx = sxx / k - (sx / k) ** 2, vy = syy / k - (sy / k) ** 2, cxy = sxy / k - (sx / k) * (sy / k);
  const along = 0.5 * Math.atan2(2 * cxy, vx - vy);
  const [ux, uy] = [-Math.sin(along), Math.cos(along)]; // across the roadway
  // Walk each way from the centre: the areas passed and the lines crossed between them.
  const sides = [1, -1].map((sign) => {
    const steps = [];
    let cur = road, lineAt = null;
    for (let t = 0; t <= LINE_REACH / res; t++) {
      const x = Math.floor(cx + sign * ux * t), y = Math.floor(cy + sign * uy * t);
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      const i = y * w + x;
      if (onLine(i)) { lineAt ??= t; continue; }
      if (lineAt !== null) {
        const mid = Math.round((lineAt + t) / 2);
        steps.push({ px: [Math.floor(cx + sign * ux * mid), Math.floor(cy + sign * uy * mid)], from: cur, to: label[i], at: mid * res });
        cur = label[i];
        lineAt = null;
        if (steps.length >= LINE_SIDE) break;
      }
    }
    return steps;
  });
  const first = sides.map((st) => st[0]?.at);
  if (first.some((a) => a === undefined) || first[0] + first[1] < 2.5 || first[0] + first[1] > 30) return null;
  // The type of each line crossed.
  let region, requests = 0; // GetFeatureInfo requests of its own (the two images are the caller's)
  await Promise.all(sides.flat().map(async (st) => {
    requests++;
    try {
      const json = await info(st.px);
      region ||= json.isDtmk?.nazev;
      st.names = (json.features || []).map((f) => f.properties?.objektovytypnazev || "");
    } catch (err) {
      console.warn("DMVS GetFeatureInfo", err.message);
    }
  }));
  const transport = (st) => st?.names?.some((x) => TRANSPORT_LINE.test(x));
  const codes = new Map([[road, 701]]);
  for (const st of sides) {
    for (let j = 0; j < st.length && transport(st[j]); j++) {
      const next = st[j + 1];
      if (!transport(next) || next.at - st[j].at > WALK_MAX || codes.has(st[j].to)) break;
      codes.set(st[j].to, 702);
    }
  }
  // The outlines of the areas typed, in degrees.
  const boxes = new Map([...codes.keys()].map((id) => [id, [w, h, -1, -1]]));
  for (let i = 0; i < n; i++) {
    const b = boxes.get(label[i]);
    if (!b) continue;
    const x = i % w, y = (i - x) / w;
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
  }
  const features = [];
  for (const [id, code] of codes) {
    const rings = trace(label, w, h, id, boxes.get(id)).map((r) => simplify(r, SIMPLIFY / res))
      .filter((r) => r.length >= 3 && ringArea(r) * res ** 2 >= 0.05)
      .map((r) => { const ll = r.map(v.toLonLat); ll.push(ll[0]); return ll; });
    if (rings.length) features.push({ attributes: { code, guess: true, level: 0, type: "z čar technické mapy", fromLines: true }, geometry: { rings } });
  }
  return features.length ? { features, region, gap: false, requests, fromLines: true } : null;
}

// ---------- RÚIAN for what the DTM leaves blank ----------
const RUIAN = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer";
// Kinds of land (druh pozemku) and uses (způsob využití) of a parcel → MTVU codes; [code, true] an estimate.
// A road's parcel left blank by the DTM between its drawn sidewalks and verges is mostly a roadway the
// region has not drawn yet (Palackého třída in Pardubice, 2026): a roadway as an estimate.
const LAND_KIND = { 2: 100, 3: 100, 4: 100, 5: 300, 6: 100, 7: 401, 10: 200, 11: 501, 13: 603 };
const LAND_USE = {
  12: 603, 14: 1100, 15: [701, true], 16: [701, true], 17: [701, true], 18: [1003, true], 19: 401, 20: 901,
  21: 402, 22: 1003, 23: 1003, 27: 402, 30: 402, 6: 502, 7: 501, 8: 501, 9: 502, 10: 502, 11: 402,
};
export async function ruianAreas(bbox) {
  const none = () => ({ features: [] });
  const [buildings, parcels] = await Promise.all([
    query(`${RUIAN}/3/query`, { ...envelope(bbox), outFields: "objectid" }).catch(none),
    query(`${RUIAN}/5/query`, { ...envelope(bbox), outFields: "druhpozemkukod,zpusobyvyuzitipozemku" }).catch(none),
  ]);
  return { buildings, parcels };
}
const parcelCode = (a) => LAND_USE[a.zpusobyvyuzitipozemku] ?? LAND_KIND[a.druhpozemkukod] ?? null;

// Surfaces of a cut as MTVU features (derive.js mtvuPolygons): the DTM first, then RÚIAN's buildings and
// parcels where the DTM has nothing. labels: MTVU_LABELS of city.js. Areas above the ground carry LEVEL 1.
// opts.wfs: the region's own WFS first where it has one (dtmwfs.js), the map images where it has none or fails.
// A region's server stalls now and then for 5 s (Liberec, 11/2026): when the WFS has not answered in HEDGE ms
// the images are asked too and the first good answer wins.
const HEDGE = 1500;
async function wfsOrImages(bbox, opts) {
  const images = () => dtmAreas(bbox, opts);
  const wfs = wfsAreas(bbox, opts).catch((err) => { console.warn("DTM WFS", err.message); return null; });
  const first = await Promise.race([wfs, new Promise((r) => setTimeout(() => r(undefined), HEDGE))]);
  if (first) return first;
  if (first === null) return images(); // no WFS here, or it failed
  return Promise.any([wfs.then((r) => r || Promise.reject(new Error("DTM WFS"))), images()]);
}
export async function surfaces(bbox, labels, opts = {}) {
  const [dtm, ruian] = await Promise.all([
    opts.wfs ? wfsOrImages(bbox, opts) : dtmAreas(bbox, opts),
    opts.ruian === false ? null : ruianAreas(bbox),
  ]);
  const at = (level) => (a) => (a.level === level ? (a.guess ? [a.code, true] : a.code) : null);
  const ground = asMtvu([[dtm, at(0)]], labels);
  // The areas read from the lines keep their mark (derive.js linePieces).
  const ground0 = dtm.features.filter((f) => f.attributes.level === 0 && f.attributes.code && f.geometry?.rings);
  ground.features.forEach((f, k) => { if (ground0[k]?.attributes.fromLines) f.attributes.Z_CAR = 1; });
  const above = asMtvu([[dtm, at(1)]], labels);
  for (const f of above.features) f.attributes.LEVEL = 1;
  // The DTM's "tramvajová dráha" is the tracks' area, in the roadway or apart from it (not MTVU's separate bed).
  for (const f of ground.features) if (f.attributes.CTVUK_KOD === 705) f.attributes.DTM_TRAM = 1;
  const fill = ruian ? asMtvu([[ruian.buildings, 601], [ruian.parcels, parcelCode]], labels) : { features: [] };
  // A road's parcel is a roadway (an estimate) only in the blank gap of a street the DTM has drawn in part;
  // elsewhere it is a verge, and under a street the DTM has not drawn at all it stays open: the profile is
  // then estimated from OSM (and says so).
  for (const f of fill.features) {
    if (f.attributes.ODHAD && f.attributes.CTVUK_KOD === 701 && !dtm.gap) Object.assign(f.attributes, { CTVUK_KOD: 401, CTVUK_POPIS: labels[401] });
  }
  // Where the DTM has nothing around the cut (local streets of regions that map only the main roads),
  // RÚIAN alone is no profile: none of it, so the profile is the admitted estimate from OSM (srovnani-dmvs:
  // Brno č. 95, one "Neurčeno" of 33 m between RÚIAN's houses).
  const anyDtm = dtm.features.some((f) => f.attributes.level === 0);
  if (!anyDtm) fill.features = [];
  return { features: [...ground.features, ...above.features, ...fill.features], region: dtm.region, requests: dtm.requests, wfs: !!dtm.wfs,
    ...(dtm.fromLines && { fromLines: true }), ...(dtm.linesOnly && { linesOnly: true }) };
}
