// The kerbs of the carriageway read by a trained model (Bára 18. 11. 2026, a trial: ?ai=1; evaluation/ai-segmentation/).
// Only where the profile is the estimate from the orthophoto and OSM (ortho-osm.js) and only the carriageway's two
// kerbs: there the model did better than the rules (target area: kerbs within 0.5 m 43 % against 25 %, Brno 52 % against
// 43 %); sidewalks, green and parking stay the estimate's.
// The model: a U-Net with a MobileNetV3 encoder (timm, Apache 2.0) taught on the surface maps of Prague (MTVU, © IPR
// Praha), Vienna (FMZK, Stadt Wien – data.wien.gv.at, CC BY 4.0), Berlin and Hamburg, run in the browser by
// onnxruntime-web (MIT, pilot/public/ort/). Its input: a north-up square of 83.2 m around the cut, 416 px (20 cm),
// the orthophoto and eight channels of OSM drawn on it (evaluation/ai-segmentation/train.py osm_channels: streets,
// the street's width as OSM suggests it, paths, cycle ways, tram tracks, buildings, green, parking); its output five
// kinds per pixel (carriageway, sidewalk, green, building, other). Across the cut every 20 cm, the majority of three
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
async function model() {
  session ??= (async () => {
    const ort = await import("./ort/ort.wasm.min.mjs");
    ort.env.wasm.wasmPaths = new URL("./ort/", import.meta.url).href;
    ort.env.wasm.numThreads = globalThis.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    // ?aimodel=kerbs-int8: another file in ai/ (comparing a smaller model on the same cuts).
    const name = (typeof location !== "undefined" && new URLSearchParams(location.search).get("aimodel")?.replace(/[^a-z0-9-]/gi, "")) || "kerbs";
    const s = await ort.InferenceSession.create(new URL(`./ai/${name}.onnx`, import.meta.url).href, { executionProviders: ["wasm"] });
    return { ort, s };
  })().catch((err) => { session = null; throw err; });
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
  const logits = out.logits.data, kinds = out.logits.dims[1];
  const at = (row, col) => { let best = 0; for (let q = 1; q < kinds; q++) if (logits[q * n + row * PX + col] > logits[best * n + row * PX + col]) best = q; return best; };
  const normal = [-dir[1], dir[0]], ts = [], cls = [];
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
  }
  const res = { ts, cls, source: photo.source };
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
