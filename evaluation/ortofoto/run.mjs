// Experiment (Bára 11. 11. 2026): what the orthophoto tells of a roadway, for several orthophotos.
// For each sampled cut of a city (the current profile from ab.mjs: evaluation/<city>/data/ab-city-stejne/<n>.json)
// one image per orthophoto around the cut is fetched (cached in data/<city>/img/<source>/<n>.png), turned so the
// cut runs left → right and the street up/down (the "strip"), and three detectors read it:
//   - čáry: the road markings across the roadway (narrow bright stripes repeated along the street), and from them
//     the lane widths, against the lane boundaries of the profile;
//   - výplň: what an estimated shoulder (krajnice, odhad) holds: hatching, cars, plain asphalt;
//   - auta: parked cars at each outer kerb along ±20 m, against the parking of the profile (most of all the
//     estimated one, whose side the rules do not know).
// Out: data/<city>/results.json, data/<city>/strip/<source>/<n>.png (the strip at 10 px/m) and
// data/<city>/index.html (every cut, every orthophoto, the profile and the findings drawn over it).
//   CITY=praha node evaluation/ortofoto/run.mjs [ONLY=1,5,9] [SOURCES=cuzk25,ipr05]
// ČÚZK and IPR one request at a time with pauses (polite.mjs); Brno's tiles likewise, a little apart.
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { politeFetch } from "../polite.mjs";
import { decodePng } from "../../pilot/public/dmvs.js";
import { TYPES } from "../../pilot/public/types.js";

const run = promisify(execFile);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const OUT = path.join(ROOT, "data", CITY);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(",").map(Number)) : null;

// ---------- the orthophotos ----------
const CUZK = "https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer";
const IPR = (name) => `https://gs-pub.praha.eu/imgs/rest/services/ort/${name}/ImageServer/exportImage`;
const ALL = {
  cuzk25: { label: "ČÚZK 25 cm", res: 0.25, cities: null, get: (b, w, h) => `${CUZK}?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format: "image/png" })}` },
  cuzk12: { label: "ČÚZK 12,5 cm", res: 0.125, cities: null, get: (b, w, h) => `${CUZK}?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format: "image/png" })}` },
  ipr10: { label: "IPR léto 2024, 10 cm", res: 0.1, cities: ["praha"], get: (b, w, h) => `${IPR("letecke_snimkovani")}?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "png", f: "image" })}` },
  ipr05: { label: "IPR jaro 2025 bez listí, 5 cm", res: 0.05, cities: ["praha"], get: (b, w, h) => `${IPR("mimovegetacni_letecke_snimkovani")}?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "png", f: "image" })}` },
  brno25: { label: "Brno 2025, 10 cm", res: 0.1, cities: ["brno"], tiles: "https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile", z: 20 },
};
const SOURCES = (process.env.SOURCES ? process.env.SOURCES.split(",") : Object.keys(ALL)).filter((k) => !ALL[k].cities || ALL[k].cities.includes(CITY));

// ---------- geometry: the cut's local frame (t across the street, A → B; u along it) ----------
const R = 6378137;
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
function frameOf(cut) {
  const b = (cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const kx = R * Math.cos((cut.lat * Math.PI) / 180) * Math.PI / 180, ky = (R * Math.PI) / 180;
  // (t, u) → lon, lat (metres east/north from the centre: normal · t + dir · u)
  const lonlat = (t, u) => [cut.lon + (normal[0] * t + dir[0] * u) / kx, cut.lat + (normal[1] * t + dir[1] * u) / ky];
  return { lonlat };
}
const ALONG = 20; // m along the street each way (parked cars need a row, not one car)
const PAD = 3; // m beyond the profile's ends

async function fetchImage(src, cut, t0, t1, file) {
  try { return decodePng(await fs.readFile(file)); } catch {}
  const f = frameOf(cut), corners = [];
  for (const t of [t0, t1]) for (const u of [-ALONG, ALONG]) corners.push(merc(...f.lonlat(t, u)));
  const x0 = Math.min(...corners.map((c) => c[0])), x1 = Math.max(...corners.map((c) => c[0]));
  const y0 = Math.min(...corners.map((c) => c[1])), y1 = Math.max(...corners.map((c) => c[1]));
  const k = Math.cos((cut.lat * Math.PI) / 180);
  let buf;
  if (src.tiles) buf = await tileMosaic(src, [x0, y0, x1, y1], file);
  else {
    const w = Math.round(((x1 - x0) * k) / src.res), h = Math.round(((y1 - y0) * k) / src.res);
    const r = await politeFetch(src.get([x0, y0, x1, y1], w, h), { signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    buf = Buffer.from(await r.arrayBuffer());
    if (buf[0] !== 0x89) throw new Error("not a PNG: " + buf.subarray(0, 80).toString());
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buf);
  await fs.writeFile(file + ".json", JSON.stringify({ bbox: [x0, y0, x1, y1] }));
  return decodePng(buf);
}
const bboxOf = async (file) => JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox;

// Brno: XYZ tiles (JPEG) of Web Mercator, glued with sips (macOS) into one PNG of the exact bbox.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function tileMosaic(src, [x0, y0, x1, y1], file) {
  const z = src.z, size = (2 * Math.PI * R) / 2 ** z; // metres of Web Mercator per tile
  const tx0 = Math.floor((x0 + Math.PI * R) / size), tx1 = Math.floor((x1 + Math.PI * R) / size);
  const ty0 = Math.floor((Math.PI * R - y1) / size), ty1 = Math.floor((Math.PI * R - y0) / size);
  const tmp = file + ".tiles";
  await fs.mkdir(tmp, { recursive: true });
  const nx = tx1 - tx0 + 1, ny = ty1 - ty0 + 1, W = nx * 256, H = ny * 256, rgba = new Uint8Array(W * H * 4);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const jpg = path.join(tmp, `${ty}-${tx}.jpg`), png = jpg.replace(/jpg$/, "png");
    try { await fs.access(png); } catch {
      await wait(150);
      const r = await fetch(`${src.tiles}/${z}/${ty}/${tx}`, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) continue;
      await fs.writeFile(jpg, Buffer.from(await r.arrayBuffer()));
      await run("sips", ["-s", "format", "png", jpg, "--out", png]);
    }
    const img = await decodePng(await fs.readFile(png));
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const o = (y * img.width + x) * 4, p = (((ty - ty0) * 256 + y) * W + (tx - tx0) * 256 + x) * 4;
      rgba[p] = img.rgba[o]; rgba[p + 1] = img.rgba[o + 1]; rgba[p + 2] = img.rgba[o + 2]; rgba[p + 3] = 255;
    }
  }
  // Crop to the bbox.
  const cx0 = Math.round((x0 + Math.PI * R) / size * 256) - tx0 * 256, cy0 = Math.round((Math.PI * R - y1) / size * 256) - ty0 * 256;
  const cw = Math.round(((x1 - x0) / size) * 256), ch = Math.round(((y1 - y0) / size) * 256);
  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) out.set(rgba.subarray(((cy0 + y) * W + cx0) * 4, ((cy0 + y) * W + cx0 + cw) * 4), y * cw * 4);
  await fs.rm(tmp, { recursive: true, force: true });
  return encodePng(out, cw, ch);
}

// ---------- PNG writer (RGBA, no filter) ----------
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(rgba, w, h) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- the strip: the image resampled on the cut's grid (step = the source's resolution) ----------
function strip(img, bbox, cut, t0, t1, res) {
  const f = frameOf(cut), [x0, y0, x1, y1] = bbox;
  const nt = Math.round((t1 - t0) / res), nu = Math.round((2 * ALONG) / res);
  const L = new Float32Array(nt * nu), S = new Float32Array(nt * nu), rgb = new Uint8Array(nt * nu * 3);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    const [mx, my] = merc(...f.lonlat(t0 + (i + 0.5) * res, ALONG - (j + 0.5) * res));
    const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height);
    const k = j * nt + i;
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) { L[k] = NaN; continue; }
    const o = (py * img.width + px) * 4, r = img.rgba[o], g = img.rgba[o + 1], b = img.rgba[o + 2];
    L[k] = 0.299 * r + 0.587 * g + 0.114 * b;
    S[k] = Math.max(r, g, b) - Math.min(r, g, b);
    rgb[k * 3] = r; rgb[k * 3 + 1] = g; rgb[k * 3 + 2] = b;
  }
  return { nt, nu, res, t0, L, S, rgb, at: (t, u) => [Math.floor((t - t0) / res), Math.floor((ALONG - u) / res)] };
}
const median = (a) => { const b = a.filter((v) => !Number.isNaN(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };

// ---------- the profile: where its parts lie across the cut ----------
const ROAD = new Set(Object.entries(TYPES).filter(([k, v]) => !v.raised && k !== "voda").map(([k]) => k));
// The profile keeps the street's width but not where each part lies (norm widths of tram beds and lanes move
// the parts by a metre or two), so each roadway of the profile is laid onto the carriageway of the surface map
// it overlaps most (runs of codes 700/701/704 and parking stalls 97xx, the geometry): its parts stretched to the carriageway's real edges.
const CARRIAGE = (c) => c === 700 || c === 701 || c === 704 || (c >= 9700 && c < 9800); // road, parking lots, parking stalls laid over
function layout(p) {
  let t = p.extent[0];
  const parts = p.segments.map((s, i) => { const o = { i, type: s.type, source: s.source, s: t, e: t + s.width, w: s.width, orient: s.orient }; t += s.width; return o; });
  const carriages = [];
  for (const r of p.runs || []) {
    const last = carriages.at(-1);
    if (!CARRIAGE(r.code)) continue;
    if (last && Math.abs(last.e - r.s) < 0.05) last.e = r.e; else carriages.push({ s: r.s, e: r.e });
  }
  // Roadways: runs of parts at road level.
  const ways = [];
  for (const x of parts) {
    if (!ROAD.has(x.type)) continue;
    const last = ways.at(-1);
    if (last && Math.abs(last.e - x.s) < 0.01) { last.e = x.e; last.parts.push(x); } else ways.push({ s: x.s, e: x.e, parts: [x] });
  }
  for (const w of ways) {
    const over = (c) => Math.max(0, Math.min(c.e, w.e) - Math.max(c.s, w.s));
    const c = carriages.reduce((b, x) => (over(x) > over(b ?? { s: 0, e: 0 }) ? x : b), null);
    if (!c || over(c) < 0.3 * (w.e - w.s) || c.s <= -39.9 || c.e >= 39.9) continue;
    const k = (c.e - c.s) / (w.e - w.s), map = (v) => c.s + (v - w.s) * k;
    for (const x of w.parts) { x.s = map(x.s); x.e = map(x.e); x.w = x.e - x.s; }
    w.s = c.s; w.e = c.e; w.geo = true;
  }
  // Kerbs for the alignment: the carriageways' real edges.
  const kerbs = carriages.flatMap((c) => [c.s, c.e]).filter((v) => Math.abs(v) < 39.9);
  return { parts, ways, kerbs };
}

// ---------- alignment: the profile shifted across the cut to fit the orthophoto ----------
// The kerbs (where the profile goes from road level to raised parts) show in the orthophoto as steps of the
// brightness across the street. The shift (±MAX_SHIFT m) that puts the most of that step on the profile's kerbs
// wins; a weak fit (no clear step) keeps the profile where it is.
const MAX_SHIFT = 3;
function align(st, kerbs) {
  const { res } = st, col = [];
  for (let i = 0; i < st.nt; i++) {
    const v = [];
    for (let j = 0; j < st.nu; j += 2) v.push(st.L[j * st.nt + i]);
    col.push(median(v));
  }
  const d = Math.max(1, Math.round(0.3 / res));
  const grad = col.map((_, i) => (i - d < 0 || i + d >= col.length || Number.isNaN(col[i - d]) || Number.isNaN(col[i + d]) ? 0 : Math.abs(col[i + d] - col[i - d])));
  if (!kerbs.length) return { shift: 0, fit: 0 };
  const near = Math.round(0.2 / res);
  const score = (delta) => kerbs.reduce((a, t) => {
    const i = Math.round((t + delta - st.t0) / res);
    let m = 0;
    for (let q = i - near; q <= i + near; q++) if (q >= 0 && q < grad.length) m = Math.max(m, grad[q]);
    return a + m;
  }, 0) / kerbs.length;
  // A shift has to earn its way: 5 % of the score per metre.
  let best = 0, bestScore = score(0), bestPen = bestScore;
  for (let delta = -MAX_SHIFT; delta <= MAX_SHIFT + 1e-9; delta += res) { const v = score(delta), pen = v * (1 - 0.05 * Math.abs(delta)); if (pen > bestPen + 1e-9) { best = delta; bestScore = v; bestPen = pen; } }
  const typical = median(grad.filter((g) => g > 0));
  // A fit counts when the kerbs land on steps clearly above the typical change across the image.
  const fit = typical ? bestScore / typical : 0;
  return fit >= 2 ? { shift: +best.toFixed(2), fit: +fit.toFixed(1) } : { shift: 0, fit: +fit.toFixed(1) };
}

// ---------- detector 1: road markings ----------
// For each t, the share of rows (±MARK_ALONG m) where the pixel is brighter than its row's surroundings
// (median over ±0.75 m) by MARK_REL of it (at least 10); markings are narrow peaks of that share (dashes repeat within 9 m).
const WIDER = 1.5; // m
const BLOCKS = 8, MIN_SPREAD = 3; // 5 m pieces along the ±20 m; a marking shows in at least 3
const MARK_ALONG = 20, MARK_REL = 0.14, MARK_SHARE = 0.1, MARK_MAX_W = 0.6;
function markings(st, way) {
  const { res } = st, win = Math.max(2, Math.round(0.75 / res));
  // A little beyond the profile's roadway: the profile may be narrower than the street really is.
  const [i0] = st.at(Math.max(st.t0, way.s - WIDER), 0), [i1] = st.at(Math.min(st.t0 + st.nt * res, way.e + WIDER) - res, 0);
  const [, j0] = st.at(0, MARK_ALONG), [, j1] = st.at(0, -MARK_ALONG);
  const share = [];
  for (let i = i0; i <= i1; i++) {
    let n = 0, hit = 0;
    const blocks = new Array(BLOCKS).fill(0), blockN = new Array(BLOCKS).fill(0);
    for (let j = j0; j < j1; j += 1) {
      const v = st.L[j * st.nt + i];
      if (Number.isNaN(v)) continue;
      const around = [];
      for (let d = -win; d <= win; d += Math.max(1, win >> 2)) if (Math.abs(d) > 1) around.push(st.L[j * st.nt + i + d]);
      const m = median(around);
      n++;
      const bk = Math.min(BLOCKS - 1, Math.floor(((j - j0) / (j1 - j0)) * BLOCKS));
      blockN[bk]++;
      if (v - m > Math.max(10, MARK_REL * m)) { hit++; blocks[bk]++; } // relative: a line in shade is dimmer
    }
    // In how many 5 m pieces along the street the line shows: a line repeats, an arrow or a patch does not.
    const spread = blocks.filter((b, q) => blockN[q] && b / blockN[q] >= 0.1).length;
    share.push({ t: st.t0 + (i + 0.5) * res, v: n ? hit / n : 0, spread });
  }
  // Peaks: local maxima of the share ≥ MARK_SHARE, at least 0.3 m apart, whose width at half their height
  // is narrow (a line, not a car or a patch).
  const out = [], sep = Math.round(0.3 / res);
  for (let k = 0; k < share.length; k++) {
    const v = share[k].v;
    if (v < MARK_SHARE) continue;
    let top = true;
    for (let q = Math.max(0, k - sep); q <= Math.min(share.length - 1, k + sep); q++) if (share[q].v > v || (share[q].v === v && q < k)) { top = false; break; }
    if (!top) continue;
    let a = k, e = k;
    while (a > 0 && share[a - 1].v >= v / 2) a--;
    while (e + 1 < share.length && share[e + 1].v >= v / 2) e++;
    const w = (e - a + 1) * res;
    if (w > MARK_MAX_W) continue;
    // It must stand out of its surroundings (±0.6 m), not sit on a generally busy patch.
    const ring = share.slice(Math.max(0, k - 2 * sep), Math.min(share.length, k + 2 * sep + 1)).map((x) => x.v);
    if (v - Math.min(...ring) < MARK_SHARE * 0.8) continue;
    if (Math.max(...share.slice(a, e + 1).map((x) => x.spread)) < MIN_SPREAD) continue;
    const seg = share.slice(a, e + 1), c = seg.reduce((x, y) => x + y.t * y.v, 0) / seg.reduce((x, y) => x + y.v, 0);
    out.push({ t: +c.toFixed(2), w: +w.toFixed(2), share: +v.toFixed(2), solid: v >= 0.6 });
  }
  return out;
}

// The lane boundaries of the profile inside a roadway (between two parts), against the markings found.
function compareLanes(way, marks) {
  const inner = way.parts.slice(1).map((x, k) => ({ t: x.s, between: `${way.parts[k].type}|${x.type}` }));
  const MATCH = 0.5;
  const matched = inner.map((b) => {
    const m = marks.reduce((best, x) => (Math.abs(x.t - b.t) < Math.abs((best?.t ?? Infinity) - b.t) ? x : best), null);
    return { ...b, t: +b.t.toFixed(2), mark: m && Math.abs(m.t - b.t) <= MATCH ? m.t : null, off: m ? +(m.t - b.t).toFixed(2) : null };
  });
  // What the markings say the lanes are: the gaps between markings (and the kerbs).
  const edges = [way.s, ...marks.map((m) => m.t), way.e];
  const gaps = edges.slice(1).map((e, k) => +(e - edges[k]).toFixed(2));
  return { inner: matched, gaps };
}

// ---------- detectors 2 and 3: what a band holds (cars, hatching, plain asphalt) ----------
// Per pixel: an edge where the brightness changes to the next pixel (along or across) by more than EDGE_REL of it
// (at least 12): cars are full of edges (windows, roofs, outlines), asphalt and smooth shade are not. Green pixels
// (treetops) are covered and left out. In the band [s, e] × u ∈ [-along, along], per 1 m piece along the street:
// a piece with cars has ≥ CAR_PIECE of its seen pixels on edges; rows = the share of such pieces among the seen
// ones; bright = share of pixels brighter than the asphalt by BRIGHT_DL (hatching); covered = share green.
const CARS = 0.3; // a row of cars: at least this share of the 1 m pieces
const EDGE_REL = 0.18, SAT = 45, BRIGHT_DL = 40, CAR_PIECE = 0.22, CAR_SD = 28, GREEN = 12;
function band(st, s, e, along, asphalt) {
  if (e - s < 0.4) return null;
  const [i0] = st.at(s, 0), [i1] = st.at(e, 0);
  const step = Math.max(1, Math.round(0.1 / st.res)); // compare pixels 10 cm apart, whatever the resolution
  const pieces = [];
  let n = 0, all = 0, edges = 0, bright = 0, green = 0;
  for (let u = along; u > -along; u -= 1) {
    const [, j0] = st.at(0, u), [, j1] = st.at(0, u - 1);
    let pn = 0, pe = 0, ps = 0, pss = 0;
    for (let j = j0; j < j1 && j + step < st.nu; j++) for (let i = i0; i < i1 && i + step < st.nt; i++) {
      const k = j * st.nt + i, v = st.L[k];
      if (Number.isNaN(v)) continue;
      all++;
      const r = st.rgb[k * 3], g = st.rgb[k * 3 + 1], b = st.rgb[k * 3 + 2];
      if (2 * g - r - b >= GREEN && g > b) { green++; continue; }
      const dx = Math.abs(st.L[k + step] - v), dy = Math.abs(st.L[k + step * st.nt] - v), lim = Math.max(12, EDGE_REL * Math.max(v, st.L[k + step], st.L[k + step * st.nt]));
      const edge = dx > lim || dy > lim || st.S[k] > SAT;
      n++; pn++; ps += v; pss += v * v;
      if (edge) { edges++; pe++; }
      if (v - asphalt > BRIGHT_DL) bright++;
    }
    // A piece with a car: busy (edges) or, at a coarse resolution, uneven (bright roof, dark windows and shadow).
    if (pn >= 10) { const sd = Math.sqrt(Math.max(0, pss / pn - (ps / pn) ** 2)); pieces.push(Math.max(pe / pn / CAR_PIECE, sd / CAR_SD)); }
  }
  if (!all) return null;
  const covered = green / all;
  if (n < 50 || covered > 0.5) return { covered: +covered.toFixed(2), edges: null, bright: null, rows: null };
  return { covered: +covered.toFixed(2), edges: +(edges / n).toFixed(2), bright: +(bright / n).toFixed(2), rows: pieces.length ? +(pieces.filter((x) => x >= 1).length / pieces.length).toFixed(2) : null };
}
function asphaltOf(st, way) {
  const vals = [];
  for (const x of way.parts) {
    if (!["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo"].includes(x.type)) continue;
    const m = (x.s + x.e) / 2;
    for (let u = -MARK_ALONG; u < MARK_ALONG; u += st.res * 2) for (let t = m - 0.5; t < m + 0.5; t += st.res * 2) {
      const [i, j] = st.at(t, u);
      vals.push(st.L[j * st.nt + i]);
    }
  }
  return median(vals);
}
// A band's verdict: cars (a row along the street), hatching (bright and spread, no row of cars), plain asphalt.
const verdict = (b) => (!b || b.rows === null ? null : b.rows >= CARS ? "auta" : b.bright >= 0.12 && b.rows < 0.35 ? "šrafy" : b.edges <= 0.08 ? "asfalt" : "nejasné");

// ---------- one cut ----------
async function cutOne(n) {
  let r;
  try { r = JSON.parse(await fs.readFile(path.join(AB, `${n}.json`), "utf8")); } catch { return null; }
  const p = r.a;
  if (!p || p.error || !p.segments?.length) return null;
  const { parts, ways, kerbs } = layout(p);
  const t0 = p.extent[0] - PAD, t1 = p.extent[1] + PAD;
  const out = { n, name: r.cut.name, highway: r.cut.highway, lanes: r.cut.tags?.lanes || null, cut: { lat: r.cut.lat, lon: r.cut.lon, bearing: r.cut.bearing }, extent: p.extent, parts, ways: ways.map((w) => ({ s: w.s, e: w.e })), by: {} };
  for (const key of SOURCES) {
    const src = ALL[key], file = path.join(OUT, "img", key, `${n}.png`);
    let img;
    try { img = await fetchImage(src, r.cut, t0, t1, file); } catch (e) { out.by[key] = { error: String(e.message || e).slice(0, 120) }; continue; }
    const st = strip(img, await bboxOf(file), r.cut, t0, t1, src.res);
    const al = align(st, kerbs);
    const sh = (x) => ({ ...x, s: x.s + al.shift, e: x.e + al.shift });
    const partsA = parts.map(sh), waysA = ways.map((w) => ({ ...sh(w), parts: w.parts.map(sh) }));
    const res = { shift: al.shift, fit: al.fit, ways: [] };
    for (const w of waysA) {
      const asphalt = asphaltOf(st, w);
      // Markings searched a little beyond the roadway; one seen from two roadways counts for the nearer one.
      // Rails shine like lines: nothing is looked for over tram tracks.
      const rails = partsA.filter((x) => /^tramvaj/.test(x.type));
      const marks = markings(st, w).filter((m) => !waysA.some((o) => o !== w && m.t >= o.s && m.t <= o.e) && !rails.some((x) => m.t > x.s + 0.2 && m.t < x.e - 0.2));
      const lanes = compareLanes(w, marks);
      // Estimated shoulders and parking strips: what they hold.
      const fills = w.parts.filter((x) => x.type === "krajnice" || x.type === "parkovani").map((x) => {
        const b = band(st, x.s + 0.2, x.e - 0.2, ALONG, asphalt);
        return { i: x.i, type: x.type, source: x.source, ...b, verdict: verdict(b) };
      });
      // Both outer kerbs of the roadway: a 2 m band inside, ±20 m along.
      const kerbs = ["s", "e"].map((side) => {
        const [a, b] = side === "s" ? [w.s + 0.25, w.s + 2.2] : [w.e - 2.2, w.e - 0.25];
        const bd = band(st, a, b, ALONG, asphalt);
        const here = w.parts.find((x) => (side === "s" ? x === w.parts[0] : x === w.parts.at(-1)));
        return { side: side === "s" ? "A" : "B", profile: here?.type === "parkovani" ? `parkovani (${here.source})` : here?.type, ...bd, cars: bd && bd.rows !== null ? bd.rows >= CARS : null };
      });
      res.ways.push({ s: w.s, e: w.e, asphalt: Math.round(asphalt), marks, lanes, fills, kerbs });
    }
    out.by[key] = res;
    await saveStrip(st, path.join(OUT, "strip", key, `${n}.png`), { parts: partsA, res, t0 });
  }
  return out;
}

// The strip at 10 px/m (box average), for the review page.
async function saveStrip(st, file, over) {
  const k = Math.max(1, Math.round(0.1 / st.res)), sc = 0.1 / st.res; // source pixels per output pixel
  const w = Math.floor(st.nt / sc), h = Math.floor(st.nu / sc), rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, c = 0;
    const ia = Math.floor(x * sc), ja = Math.floor(y * sc);
    for (let j = ja; j < Math.max(ja + 1, Math.floor((y + 1) * sc)); j++) for (let i = ia; i < Math.max(ia + 1, Math.floor((x + 1) * sc)); i++) {
      const q = (j * st.nt + i) * 3;
      r += st.rgb[q]; g += st.rgb[q + 1]; b += st.rgb[q + 2]; c++;
    }
    const o = (y * w + x) * 4;
    rgba[o] = r / c; rgba[o + 1] = g / c; rgba[o + 2] = b / c; rgba[o + 3] = 255;
  }
  void k;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", ...(await writeTmp(file, rgba, w, h)), "--out", file.replace(/png$/, "jpg")]);
  // The review image: the same with the profile's boundaries (blue, dashed, top half), the markings found
  // (red, bottom quarter) and the kerb bands with a row of cars (magenta frame) drawn in.
  if (over) {
    const px = (t) => Math.round((t - over.t0) * 10);
    const put = (x, y, c) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const o = (y * w + x) * 4; rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; };
    for (const p of over.parts.slice(1)) for (let y = 0; y < h / 2; y++) if ((y >> 2) % 2 === 0) put(px(p.s), y, [40, 140, 255]);
    for (const p of over.parts) if (p.source === "odhad") for (let x = px(p.s) + 1; x < px(p.e); x++) for (let y = 0; y < 5; y++) put(x, y, [255, 255, 255]);
    for (const wy of over.res.ways) {
      for (const m of wy.marks) for (let y = Math.round(h * 0.75); y < h; y++) { put(px(m.t), y, [255, 30, 30]); put(px(m.t) + 1, y, [255, 30, 30]); }
      // The kerb bands: their edges along the whole strip (thin), a thick bar in the middle where cars were found.
      for (const k of wy.kerbs) {
        const [a, e] = k.side === "A" ? [wy.s + 0.25, wy.s + 2.2] : [wy.e - 2.2, wy.e - 0.25];
        for (let y = 0; y < h; y += 3) { put(px(a), y, [230, 40, 160]); put(px(e), y, [230, 40, 160]); }
        if (k.cars) for (let x = px(a); x <= px(e); x++) for (let y = Math.round(h / 2 - 3); y <= h / 2 + 3; y++) put(x, y, [230, 40, 160]);
      }
      for (const f of wy.fills) {
        const c = { auta: [230, 40, 160], šrafy: [250, 200, 0], asfalt: [60, 200, 60], nejasné: [170, 170, 170] }[f.verdict];
        const p = over.parts[f.i];
        if (c) for (let x = px(p.s) + 2; x < px(p.e) - 2; x++) for (let y = Math.round(h * 0.6); y < h * 0.6 + 6; y++) put(x, y, c);
      }
    }
    await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "75", ...(await writeTmp(file, rgba, w, h)), "--out", file.replace(/\.png$/, "-r.jpg")]);
  }
  await fs.rm(file, { force: true });
}
async function writeTmp(file, rgba, w, h) {
  await fs.writeFile(file, encodePng(rgba, w, h));
  return [file];
}
// ---------- the review page ----------
const PX = 10; // px per metre
const COLOR = { auta: "#e0457b", šrafy: "#f2c230", asfalt: "#5ac85a", nejasné: "#aaa" };
function page(results) {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const rows = results.map((r) => {
    const t0 = r.extent[0] - PAD, W = (r.extent[1] - r.extent[0] + 2 * PAD) * PX, H = 2 * ALONG * PX;
    const x = (t) => ((t - t0) * PX).toFixed(1);
    const parts = r.parts.map((p) => `<rect x="${x(p.s)}" y="0" width="${(p.w * PX).toFixed(1)}" height="14" fill="${TYPES[p.type]?.color || "#999"}" stroke="#fff" stroke-width="0.5"><title>${esc(TYPES[p.type]?.label || p.type)} ${p.w.toFixed(2)} m (${p.source})</title></rect>` + (p.source === "odhad" ? `<text x="${x(p.s + p.w / 2)}" y="11" font-size="9" fill="#fff" text-anchor="middle">odhad</text>` : "")).join("");
    const bounds = r.parts.slice(1).map((p) => `<line x1="${x(p.s)}" x2="${x(p.s)}" y1="14" y2="${H}" stroke="#39f" stroke-width="1" stroke-dasharray="3 5" opacity="0.8"/>`).join("");
    const cells = Object.entries(r.by).map(([key, b]) => {
      if (b.error) return `<div class="src"><b>${esc(ALL[key].label)}</b>: chyba ${esc(b.error)}</div>`;
      const marks = b.ways.flatMap((w) => w.marks.map((m) => `<line x1="${x(m.t)}" x2="${x(m.t)}" y1="${H - 30}" y2="${H}" stroke="#f33" stroke-width="2"/>`)).join("");
      const kerbs = b.ways.flatMap((w) => w.kerbs.filter((k) => k.rows !== undefined).map((k) => {
        const [a, e] = k.side === "A" ? [w.s + 0.25, w.s + 2.2] : [w.e - 2.2, w.e - 0.25];
        return `<rect x="${x(a)}" y="${H / 2 - 6}" width="${((e - a) * PX).toFixed(1)}" height="12" fill="${k.cars ? COLOR.auta : "none"}" stroke="${COLOR.auta}" opacity="0.85"><title>obruba ${k.side}: řada aut ${k.rows}, hrany ${k.edges}, zakryto ${k.covered}</title></rect>`;
      })).join("");
      const fills = b.ways.flatMap((w) => w.fills.map((f) => { const p = r.parts[f.i]; return f.verdict ? `<rect x="${x(p.s + 0.2)}" y="${H / 2 + 10}" width="${Math.max(2, (p.w - 0.4) * PX).toFixed(1)}" height="10" fill="${COLOR[f.verdict]}"><title>${esc(p.type)} (${p.source}): ${f.verdict} – auta ${f.rows}, světlé ${f.bright}, hrany ${f.edges}</title></rect>` : ""; })).join("");
      const text = b.ways.map((w) => {
        const lanes = w.lanes.inner.length ? `hranice profilu potvrzené čarou: ${w.lanes.inner.filter((i) => i.mark !== null).length}/${w.lanes.inner.length}` : "bez vnitřních hranic";
        return `čar ${w.marks.length} (${w.marks.map((m) => m.t.toFixed(1) + (m.solid ? "▮" : "┆")).join(" ")}); mezery podle čar ${w.lanes.gaps.map((g) => g.toFixed(2)).join(" | ")}; ${lanes}; auta A ${w.kerbs[0].rows ?? "–"}, B ${w.kerbs[1].rows ?? "–"}` + (w.fills.length ? `; výplň: ${w.fills.map((f) => `${f.type}${f.source === "odhad" ? "*" : ""} → ${f.verdict ?? "–"}`).join(", ")}` : "");
      }).join("<br>");
      return `<div class="src"><b>${esc(ALL[key].label)}</b> <small>posun ${b.shift} m</small><div class="pic" style="width:${W}px;height:${H}px"><img src="strip/${key}/${r.n}-r.jpg" width="${W}" height="${H}" loading="lazy"></div><div class="t">${text}</div></div>`;
    }).join("");
    return `<section id="r${r.n}"><h2>${r.n}. ${esc(r.name || "bez názvu")} <small>${esc(r.highway)}${r.lanes ? `, lanes=${esc(r.lanes)}` : ""} · <a href="https://barasoukup.github.io/profily-ulic/#rez=${r.cut.lat.toFixed(6)},${r.cut.lon.toFixed(6)},${Math.round(r.cut.bearing)}">otevřít řez</a></small></h2><div class="row">${cells}</div></section>`;
  }).join("\n");
  return `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>Ortofoto – pokus ${CITY}</title><style>
body{font:13px/1.4 system-ui,sans-serif;margin:16px;background:#f4f2ec;color:#222}h2{font-size:15px;margin:22px 0 6px}small{font-weight:400;color:#666}
.row{display:flex;gap:14px;overflow-x:auto}.src{flex:none}.pic{position:relative}.pic img,.pic svg{position:absolute;left:0;top:0}.t{max-width:520px;color:#444;margin-top:4px}
.legend span{display:inline-block;width:12px;height:10px;margin:0 4px 0 12px;vertical-align:middle}</style></head><body>
<h1>Ortofoto: čáry, výplň krajnice, auta u obruby – ${CITY}</h1>
<p class="legend">Ulice vede shora dolů, řez zleva (A) doprava (B), výřez ±${ALONG} m podél ulice, 10 px = 1 m. Modré čárkované (horní polovina) = hranice částí profilu aplikace
po doladění polohy, bílý pruh nahoře = část „odhad“. <span style="background:#f33"></span>nalezené vodorovné značení (dolní čtvrtina; v textu ▮ plná, ┆ přerušovaná)
<span style="border:1px solid ${COLOR.auta}"></span>pás 2 m u obruby (tečkované okraje, plný pruh uprostřed = řada aut) · výplň krajnice/stání: <span style="background:${COLOR.auta}"></span>auta <span style="background:${COLOR.šrafy}"></span>šrafy <span style="background:${COLOR.asfalt}"></span>asfalt <span style="background:${COLOR.nejasné}"></span>nejasné.</p>
${rows}</body></html>`;
}

// ---------- main (also imported by cary.mjs for its helpers) ----------
export { ALL, frameOf, strip, median, layout, align, encodePng, markings, ROAD };
if (import.meta.url === `file://${process.argv[1]}`) {
const list = (await fs.readdir(AB)).filter((f) => /^\d+\.json$/.test(f)).map((f) => +f.slice(0, -5)).sort((a, b) => a - b).filter((n) => !ONLY || ONLY.has(n));
const results = [];
for (const n of list) {
  try {
    const r = await cutOne(n);
    if (r) { results.push(r); console.log(n, r.name, Object.entries(r.by).map(([k, b]) => `${k}:${b.error ? "chyba" : b.ways.reduce((a, w) => a + w.marks.length, 0) + "č"}`).join(" ")); }
  } catch (e) { console.log(n, "chyba", e.message); }
}
await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, "results.json"), JSON.stringify(results, null, 1));
await fs.writeFile(path.join(OUT, "index.html"), page(results));
console.log(`hotovo: ${results.length} řezů, ${path.join(OUT, "index.html")}`);
}
