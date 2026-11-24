// The kerbs of the carriageway read by a trained model (Bára 18. 11. 2026, a trial: ?ai=1; evaluation/ai-segmentation/).
// Only where the profile is the estimate from the orthophoto and OSM (ortho-osm.js) and only the carriageway's two
// kerbs: there the model did better than the rules (target area: kerbs within 0.5 m 43 % against 25 %, Brno 52 % against
// 43 %); sidewalks, green and parking stay the estimate's.
// The model: a U-Net with a MobileNetV3 encoder (timm, Apache 2.0) taught on the surface maps of Prague (MTVU, © IPR
// Praha), Vienna (FMZK, Stadt Wien – data.wien.gv.at, CC BY 4.0), Berlin and Hamburg, run in the browser by
// onnxruntime-web (MIT, pilot/public/ort/). Its input: a north-up square of 83.2 m around the cut, 416 px (20 cm),
// the orthophoto and eight channels of OSM drawn on it (evaluation/ai-segmentation/train.py osm_channels: streets,
// the street's width as OSM suggests it, paths, cycle ways, tram tracks, buildings, green, parking); its output five
// kinds per pixel (carriageway, sidewalk, green, building, other), and a second output, parking (a small branch of its
// own on the frozen encoder, learnt on the maps of Vienna, Berlin and Hamburg, which tell parking apart; parkFromAi). Across the cut every 20 cm, the majority of three
// lines 3 m apart; the carriageway is the run nearest the axis (gaps to 0.6 m bridged, within 4 m of it), as
// evaluation/ai-segmentation/compare.py measured it.
import { orthoPatch } from "./lanes-ortho.js";

const HALF = 41.6, PX = 416, R = 6378137;
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];
const HINTS = ["road", "road-width", "foot", "cycle", "tram", "building", "green", "parking"];
const ROAD_M = { motorway: 7.5, trunk: 7, primary: 7, secondary: 6.5, tertiary: 6, unclassified: 5, residential: 5, living_street: 4, service: 3.5, busway: 3.5 };
const WIDTH = { road: 1.2, foot: 1.0, cycle: 1.0, tram: 1.5 };
const ROADS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "service",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "busway", "road"]);
const FOOT = new Set(["footway", "path", "pedestrian", "steps", "track", "bridleway", "corridor"]);
const GREEN = (t) => ["grass", "meadow", "village_green", "forest", "cemetery", "allotments", "recreation_ground", "flowerbed"].includes(t.landuse)
  || ["park", "garden", "playground", "pitch"].includes(t.leisure) || ["wood", "scrub", "grassland", "heath"].includes(t.natural);
const STEP = 0.2, LINES = [-3, 0, 3], CARRIAGE = 0;
// Parking (Bára 20. 11. 2026): the model's second output, its probability averaged over 40 m along the street.
const PLINES = Array.from({ length: 21 }, (_, k) => -20 + 2 * k);

const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];

// Which hint an OSM element gives (evaluation/ai-segmentation/osm.mjs kind: the same, the model learnt from it).
export function kind(e) {
  const t = e.tags || {};
  if (t.tunnel && t.tunnel !== "no") return null;
  if (Number(t.layer) < 0 || Number(t.level) < 0) return null;
  if (e.type === "way") {
    if (t.railway === "tram") return "tram";
    if (t.highway === "cycleway") return "cycle";
    if (FOOT.has(t.highway)) return "foot";
    if (ROADS.has(t.highway)) return "road";
  }
  if (e.type === "area") {
    if (t.building) return "building";
    if (t.amenity === "parking") return "parking";
    if (t.highway === "pedestrian" || t["area:highway"]) return "foot";
    if (GREEN(t)) return "green";
  }
  return null;
}

let session = null;
// The download of the library and the model (once, about 7 MB packed; Bára 19. 11. 2026: the first estimated cut
// seemed stuck): its progress for the status line (onAiProgress), and whether it is ready (aiReady).
const SIZES = { wasm: 11210254, model: 5470211 }; // unpacked bytes (what the stream gives); only for the share shown
const got = { wasm: 0, model: 0 };
let progressFn = null, ready = false;
export const onAiProgress = (fn) => { progressFn = fn; };
export const aiReady = () => ready;
const report = () => progressFn?.(Math.min(0.99, (got.wasm + got.model) / (SIZES.wasm + SIZES.model)));
async function download(url, part) {
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`${url} ${r.status}`);
  const reader = r.body.getReader(), chunks = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got[part] += value.length; report(); }
  const out = new Uint8Array(got[part]);
  let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
async function model() {
  session ??= (async () => {
    const ort = await import("./ort/ort.wasm.min.mjs");
    ort.env.wasm.wasmPaths = new URL("./ort/", import.meta.url).href;
    ort.env.wasm.numThreads = globalThis.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    // ?aimodel=kerbs-int8: another file in ai/ (comparing a smaller model on the same cuts).
    const name = (typeof location !== "undefined" && new URLSearchParams(location.search).get("aimodel")?.replace(/[^a-z0-9-]/gi, "")) || "street";
    const [wasm, bytes] = await Promise.all([download(new URL("./ort/ort-wasm-simd-threaded.wasm", import.meta.url).href, "wasm"),
      download(new URL(`./ai/${name}.onnx`, import.meta.url).href, "model")]);
    ort.env.wasm.wasmBinary = wasm;
    const s = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
    ready = true; progressFn?.(1);
    return { ort, s };
  })().catch((err) => { session = null; got.wasm = got.model = 0; throw err; });
  return session;
}

// The OSM hints drawn on the patch (box: Web Mercator, not shifted: the photo is), 0 or 1 per pixel and channel.
function hints(elements, box, lat) {
  const k = Math.cos((lat * Math.PI) / 180), s = PX / (box[2] - box[0]), pxM = s / k;
  const [x0, y0, x1, y1] = [box[0], box[1], box[2], box[3]], mx = (x1 - x0) * 0.2, my = (y1 - y0) * 0.2;
  const canvas = new OffscreenCanvas(PX, PX), g = canvas.getContext("2d");
  const layers = HINTS.map(() => new Uint8Array(PX * PX));
  const byKind = Object.fromEntries(HINTS.map((h) => [h, []]));
  for (const e of elements || []) {
    const kd = kind(e);
    if (!kd || !e.geometry?.length) continue;
    const pts = e.geometry.map((p) => merc(p.lon, p.lat));
    if (!pts.some(([x, y]) => x > x0 - mx && x < x1 + mx && y > y0 - my && y < y1 + my) && pts.length < 50) continue;
    byKind[kd].push({ e, pts: pts.map(([x, y]) => [(x - x0) * s, (y1 - y) * s]) });
  }
  const draw = (fill) => {
    const d = g.getImageData(0, 0, PX, PX).data, out = new Uint8Array(PX * PX);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4] >= 128 ? 1 : 0;
    g.clearRect(0, 0, PX, PX);
    return out;
  };
  const line = (pts, w) => { g.lineWidth = Math.max(1, Math.round(w * pxM)); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
  g.strokeStyle = g.fillStyle = "#fff"; g.lineCap = "butt"; g.lineJoin = "miter";
  for (const [c, h] of HINTS.entries()) {
    g.clearRect(0, 0, PX, PX);
    if (h === "road-width") {
      for (const { e, pts } of byKind.road) if (pts.length >= 2) line(pts, (Number(e.tags?.lanes) || 0) * 3 || 2 * (ROAD_M[e.tags?.highway] ?? 5));
    } else {
      for (const { e, pts } of byKind[h]) {
        if (pts.length < 2) continue;
        if (h === "building" || h === "green" || h === "parking" || (h === "foot" && e.type === "area")) {
          if (pts.length >= 3) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); }
        } else line(pts, WIDTH[h]);
      }
    }
    layers[c] = draw();
  }
  return layers;
}

// The kinds along the cut: { ts, cls } (cls -1 outside the patch), or null (no photo, no model). frame, dir: the cut's
// (app.js; t across along the normal, u along dir); source: the orthophoto key (city.laneOrtho, country.laneOrtho).
export async function aiCut({ osm, frame, dir, source }) {
  const [lon, lat] = frame.toLonLat(0, 0);
  const [{ ort, s }, photo] = await Promise.all([model(), orthoPatch({ source, lon, lat, half: HALF, px: PX })]);
  if (!photo) return null;
  const k = Math.cos((lat * Math.PI) / 180), [cx, cy] = merc(lon, lat), h = HALF / k;
  const box = [cx - h, cy - h, cx + h, cy + h];
  const osmL = hints(osm?.elements, box, lat), n = PX * PX, x = new Float32Array((3 + HINTS.length) * n), d = photo.img.data;
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) x[c * n + i] = (d[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  osmL.forEach((l, c) => { for (let i = 0; i < n; i++) x[(3 + c) * n + i] = l[i]; });
  const out = await s.run({ image: new ort.Tensor("float32", x, [1, 3 + HINTS.length, PX, PX]) });
  const logits = out.logits.data, kinds = out.logits.dims[1], parking = out.parking?.data;
  const at = (row, col) => { let best = 0; for (let q = 1; q < kinds; q++) if (logits[q * n + row * PX + col] > logits[best * n + row * PX + col]) best = q; return best; };
  const normal = [-dir[1], dir[0]], ts = [], cls = [], park = [];
  for (let i = 0; i <= 400; i++) {
    const t = -40 + i * STEP, votes = new Array(kinds).fill(0);
    let seen = 0;
    for (const u of LINES) {
      const [mx, my] = merc(...frame.toLonLat(normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u));
      const col = Math.floor(((mx - box[0]) / (box[2] - box[0])) * PX), row = Math.floor(((box[3] - my) / (box[3] - box[1])) * PX);
      if (row < 0 || col < 0 || row >= PX || col >= PX) continue;
      votes[at(row, col)]++; seen++;
    }
    ts.push(t); cls.push(seen ? votes.indexOf(Math.max(...votes)) : -1);
    if (parking) {
      let sum = 0, m = 0;
      for (const u of PLINES) {
        const [mx, my] = merc(...frame.toLonLat(normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u));
        const col = Math.floor(((mx - box[0]) / (box[2] - box[0])) * PX), row = Math.floor(((box[3] - my) / (box[3] - box[1])) * PX);
        if (row < 0 || col < 0 || row >= PX || col >= PX) continue;
        sum += 1 / (1 + Math.exp(-parking[row * PX + col])); m++;
      }
      park.push(m ? sum / m : -1);
    }
  }
  const res = { ts, cls, source: photo.source, ...(parking && { park }) };
  globalThis.__aiLast = res; // for checking (evaluation/ai-segmentation)
  return res;
}

// The carriageway nearest the axis (t of the clicked way) on the model's cut: { A, B } or null.
export function aiKerbs(cut, axis) {
  if (!cut) return null;
  const { ts, cls } = cut, runs = [];
  let start = null;
  for (let i = 0; i <= cls.length; i++) {
    const v = i < cls.length && cls[i] === CARRIAGE;
    if (v && start === null) start = i;
    else if (!v && start !== null) { runs.push([start, i - 1]); start = null; }
  }
  const merged = [];
  for (const r of runs) {
    if (merged.length && (r[0] - merged.at(-1)[1] - 1) * STEP <= 0.6 + 1e-9) merged.at(-1)[1] = r[1];
    else merged.push([...r]);
  }
  const gap = (r) => (ts[r[0]] <= axis && axis <= ts[r[1]] ? 0 : Math.min(Math.abs(ts[r[0]] - axis), Math.abs(ts[r[1]] - axis)));
  const near = merged.filter((r) => gap(r) <= 4).sort((a, b) => gap(a) - gap(b));
  if (!near.length) return null;
  const [i0, i1] = near[0];
  return { A: ts[i0] - STEP / 2, B: ts[i1] + STEP / 2 };
}

// The model's kind at t across the cut (the five of the model → the profile's: sidewalk, green, building, other,
// carriageway), or null outside the patch (ortho-osm.js aiSurf, a trial: ?aiplochy=1).
const FIVE = ["vozovka", "chodník", "zeleň", "budova", "jiné"];
export function aiSurface(cut) {
  if (!cut) return null;
  const { ts, cls } = cut, t0 = ts[0], step = ts[1] - ts[0];
  return (t) => { const i = Math.round((t - t0) / step); return i >= 0 && i < cls.length && cls[i] >= 0 ? FIVE[cls[i]] : null; };
}

// The model's parking probability at t across the cut, or null (outside the patch, a model without parking).
export function aiParking(cut) {
  if (!cut?.park) return null;
  const { ts, park } = cut, t0 = ts[0], step = ts[1] - ts[0];
  return (t) => { const i = Math.round((t - t0) / step); return i >= 0 && i < park.length && park[i] >= 0 ? park[i] : null; };
}

// Parking at the outer kerbs of an estimated profile as the model sees it (Bára 20. 11. 2026: the parking branch learnt
// on the surface maps of Vienna, Berlin and Hamburg, which tell parking apart; hand-labelled sides of Brno: 20 of 37
// rows of cars found, 2 false of 83, against the estimate's 12 and 4). At each outer kerb the band where the probability
// stays at PARK_ON or more (gaps to 0.4 m), starting within 0.6 m of the kerb: inside the roadway it takes the strip at
// the kerb (a shoulder first, a lane only while LANE_LEFT stays); outside it, a sidewalk, paved area or green at the
// kerb gives its strip to cars standing on the kerb. A parallel strip the law estimated where the model sees no cars
// (below PARK_OFF in the 2.5 m at the kerb) goes back to the lane. Parking the data put there stays. ?off=aipark.
export const PARK = { on: 0.4, off: 0.2, minW: 1.6, laneLeft: 2.75, road: 3 };
const ROADISH = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "cyklopruh", "ochranny_pruh", "obsluzna", "parkovani"]);
const KERBSIDE = new Set(["chodnik", "plocha", "zelen"]);
const r2 = (x) => Math.round(x * 100) / 100;
function stallOf(w) {
  if (w < 3.2) return { orient: "podelne", width: Math.min(Math.max(w, 2), 2.5) };
  if (w < 4.4) return { orient: "sikme", width: r2(w) };
  return { orient: "kolme", width: r2(Math.min(w, 5.5)) };
}
// Where parking data exist, they decide, not the model (Bára 20. 11. 2026): a cut in a paid parking zone or with the
// city's parking sections near it is left alone (`all`), and so is a side whose OSM way tags its parking, a no too
// (`hi`: the side at larger t, the profile's L; `lo`: the other). parkSkip gives them from the way's tags.
const PARK_KEYS = (side) => [`parking:${side}`, "parking:both", `parking:lane:${side}`, "parking:lane:both", `parking:${side}:restriction`, "parking:both:restriction",
  `parking:condition:${side}`, "parking:condition:both"];
export function parkSkip(tags = {}, alongWay = true, data = false) {
  const tagged = (side) => PARK_KEYS(side).some((k) => tags[k] !== undefined);
  return { all: !!data, hi: tagged(alongWay ? "left" : "right"), lo: tagged(alongWay ? "right" : "left") };
}
export function parkFromAi(result, pAt, skip = {}) {
  if (!pAt || skip.all || !result?.segments?.length || !result.extent) return 0;
  const segs = result.segments;
  // Screen order runs from extent[1] down: segment k spans [hi - w, hi].
  const lay = () => { let t = result.extent[1]; return segs.map((s) => { const r = { s: t - s.width, e: t }; t -= s.width; return r; }); };
  // How far the run of PARK.on or more reaches from the kerb toward sg (+1: larger t), gaps to 0.4 m bridged; it must
  // touch the kerb (within 0.6 m on either side, `touch`).
  const reach = (kerb, sg) => {
    let w = 0, gap = 0, started = false;
    for (let d = 0.1; d < 7; d += STEP) {
      const p = pAt(kerb + sg * d);
      if (p === null) break;
      if (p >= PARK.on) { started = true; w = d + STEP / 2; gap = 0; }
      else if (!started) { if (d > 0.6) return 0; }
      else if ((gap += STEP) > 0.4 + 1e-9) break;
    }
    return w;
  };
  const maxIn = (kerb, sg, to = 2.5) => { let m = 0; for (let d = 0.1; d < to; d += STEP) { const p = pAt(kerb + sg * d); if (p !== null) m = Math.max(m, p); } return m; };
  let changed = 0;
  const ends = [];
  segs.forEach((s, k) => {
    if (!ROADISH.has(s.type)) return;
    if (!ROADISH.has(segs[k - 1]?.type)) ends.push({ X: s, sg: -1 }); // its high end (larger t) is a kerb; inward = lower t
    if (!ROADISH.has(segs[k + 1]?.type)) ends.push({ X: s, sg: 1 });
  });
  for (const { X, sg } of ends) {
    const k = segs.indexOf(X);
    if (k < 0) continue;
    if (sg < 0 ? skip.hi : skip.lo) continue;
    const out = k + sg, L = lay(), kerb = sg < 0 ? L[k].e : L[k].s, dirIn = sg < 0 ? -1 : 1;
    if (ROADISH.has(segs[out]?.type)) continue;
    let a = reach(kerb, dirIn), b = reach(kerb, -dirIn);
    const N = segs[out];
    // Cars cannot stand in a row of trees or beyond the profile: what reaches there counts to the roadway (the kerb is
    // a little off; Charbulova in Brno).
    // skip.inside (a surface map's roadway, app.js mapFill): the map measured what lies beyond its kerb, only the cars in
    // the roadway count.
    if (skip.inside) b = 0;
    else if (!KERBSIDE.has(N?.type)) { a += b; b = 0; }
    if (a < 0.6 && b < 0.6) {
      // No cars at this kerb: a strip the law estimated goes back to the lane. In a surface map's roadway (inside) none
      // within 2.5 m past the strip either: the map's kerb need not sit on the orthophoto's (evaluation/mapfill-cz:
      // Šatrova in Prague, MTVU's kerb 2.3 m beyond the one on the photo, the cars there read as none at the kerb).
      if (X.type === "parkovani" && X.source === "odhad" && !X.ai && maxIn(kerb, dirIn, skip.inside ? X.width + 2.5 : 2.5) < PARK.off) {
        const Y = segs[sg < 0 ? k + 1 : k - 1];
        if (Y && (Y.type === "pruh" || Y.type === "krajnice")) { Y.width = r2(Y.width + X.width); segs.splice(k, 1); changed++; }
      }
      continue;
    }
    if (a + b < PARK.minW || X.type === "parkovani") continue;
    if (a < 0.6) a = 0; // the cars stand beyond the kerb
    if (b < 0.6) b = 0; // in the roadway
    const st = stallOf(a + b), k2 = st.width / (a + b);
    a = r2(a * k2); b = r2(b * k2);
    if (b && N.width < b - 0.3) continue;
    // The roadway's part: a shoulder at the kerb first, then the run's driving lanes share what is left (at least
    // PARK.road; as many lanes as keep PARK.laneLeft, at least one).
    let lanes = [];
    if (a) {
      if (X.type !== "krajnice" && X.type !== "pruh") continue;
      let i0 = k, i1 = k;
      while (ROADISH.has(segs[i0 - 1]?.type)) i0--;
      while (ROADISH.has(segs[i1 + 1]?.type)) i1++;
      lanes = segs.slice(i0, i1 + 1).filter((x) => x.type === "pruh");
      const fromX = X.type === "krajnice" ? Math.min(X.width, a) : 0, need = r2(a - fromX), total = lanes.reduce((q, x) => q + x.width, 0);
      if (need > 0 && (!lanes.length || total - need < PARK.road - 1e-6)) continue;
      X.width = r2(X.width - fromX);
      if (need > 0) {
        const n = Math.max(1, Math.min(lanes.length, Math.floor((total - need) / PARK.laneLeft + 1e-9))), each = r2((total - need) / n);
        lanes.forEach((x, q) => { if (q < n) { x.width = q === n - 1 ? r2(total - need - each * (n - 1)) : each; if (n === 1 && lanes.length > 1) delete x.dir; } });
        for (const x of lanes.slice(n)) segs.splice(segs.indexOf(x), 1);
      }
    }
    const stall = { type: "parkovani", width: r2(a + b), orient: st.orient, source: "odhad", ai: true, ...(b && { position: a ? "half_on_kerb" : "on_kerb" }) };
    if (b) {
      if (N.width - b < 0.8) { stall.width = r2(a + N.width); segs.splice(segs.indexOf(N), 1); }
      else N.width = r2(N.width - b);
    }
    if (X.type === "krajnice" && X.width < 0.3) { stall.width = r2(stall.width + X.width); segs.splice(segs.indexOf(X), 1); }
    // At the kerb: at the run's high end before its first part, at the low end after its last.
    const run = [X, ...lanes].map((x) => segs.indexOf(x)).filter((q) => q >= 0);
    if (sg < 0) segs.splice(Math.min(...run), 0, stall); else segs.splice(Math.max(...run) + 1, 0, stall);
    changed++;
  }
  return changed;
}
