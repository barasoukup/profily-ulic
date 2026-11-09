// Data sources of the app. With the local server (config STATIC = false) every call goes to its
// /api endpoints, which cache the answers. On static hosting (STATIC = true) the browser asks the
// services itself: IPR ArcGIS allows cross-origin requests, and the OSM extract is
// served as the same tiles the server reads (data/osm-tiles/<ix>_<iy>.json).
// Layers, fields and the reading of answers are shared with server.mjs (queries.js).
import { STATIC } from "./config.js";
import { isBrno, MTVU_LABELS } from "./city.js";

import { MTVU, MTVU_FIELDS, TM_LINES, LINE_WHERE, PARKOVANI, PARKING_LAYERS, parkingFields, PODLAZNOST, PODLAZNOST_FIELDS, podlaznostInfo } from "./queries.js";
const TILE = 0.005; // degrees, as in tools/build_osm_tiles.mjs
const TIMEOUT = 25000;
// IPR's ArcGIS queues requests and under load answers "503 Wait timeout for the request exceeded"
// (or not at all): a failed request is tried again after a pause.
const RETRY_DELAYS = [1500, 4000];

async function getOnce(url) {
  const r = await fetch(url, STATIC ? { signal: AbortSignal.timeout(TIMEOUT) } : undefined);
  if (!r.ok) throw new Error(await r.text());
  const json = await r.json();
  // ArcGIS reports failures with HTTP 200 and an "error" field.
  if (json?.error) throw new Error(`${json.error.code} ${json.error.message}`);
  return json;
}

// Retries are announced (the app shows them in its status line). A request that timed out is not
// repeated: IPR is overloaded then, and another 25 s of waiting would not help.
export const events = new EventTarget();
async function getJSON(url) {
  for (let i = 0; ; i++) {
    try {
      return await getOnce(url);
    } catch (err) {
      if (i >= RETRY_DELAYS.length || err.name === "TimeoutError" || err.name === "AbortError") throw err;
      console.warn("opakuji dotaz", url.slice(0, 80), err.message);
      events.dispatchEvent(new CustomEvent("retry", { detail: { attempt: i + 2, of: RETRY_DELAYS.length + 1 } }));
      await new Promise((res) => setTimeout(res, RETRY_DELAYS[i]));
    }
  }
}

const envelope = (bbox) => ({
  geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", f: "json",
});
const query = (base, params) => getJSON(`${base}?${new URLSearchParams(params)}`);

// The last TILES_KEPT tiles stay in memory: the next cut nearby (or a dragged cut) needs no
// download. A tile that failed to load is asked for again next time.
const TILES_KEPT = 24;
const tiles = new Map();
const tile = (n) => {
  if (tiles.has(n)) {
    const p = tiles.get(n);
    tiles.delete(n); // most recently used goes to the end
    tiles.set(n, p);
    return p;
  }
  if (tiles.size >= TILES_KEPT) tiles.delete(tiles.keys().next().value);
  tiles.set(n, fetch(`data/osm-tiles/${n}.json`).then((r) => (r.ok ? r.json() : r.status === 404 ? [] : Promise.reject(new Error(`dlaždice OSM ${r.status}`))))
    .catch((err) => { tiles.delete(n); throw err; }));
  return tiles.get(n);
};

// OSM elements around a point, merged from the tiles it touches (as the server's localOsm()).
async function osmTiles(lat, lon, radius) {
  const dLat = radius / 110574;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++) {
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  }
  const seen = new Set();
  const elements = [];
  for (const els of await Promise.all(names.map(tile))) {
    for (const el of els) {
      const key = el.id + ":" + el.geometry[0].lat + ":" + el.geometry[0].lon;
      if (seen.has(key)) continue;
      seen.add(key);
      elements.push(el);
    }
  }
  return { source: "local", elements };
}

// Brno reads only files made at deploy time (no server of its own to ask on a click).
export const osm = (lat, lon, r) => (STATIC || isBrno ? osmTiles(lat, lon, r) : getJSON(`/api/osm?lat=${lat}&lon=${lon}&r=${r}`));

export const mtvu = (bbox) => (isBrno ? brnoSurfaces(bbox) : STATIC
  ? query(MTVU, { ...envelope(bbox), outFields: MTVU_FIELDS })
  : getJSON(`/api/mtvu?bbox=${bbox}`));

export const linie = (bbox) => (isBrno ? brnoLines(bbox) : STATIC
  ? query(TM_LINES, { ...envelope(bbox), where: LINE_WHERE, outFields: "CTMTP_KOD" })
  : getJSON(`/api/linie?bbox=${bbox}`));

// ---------- Brno ----------
// Surfaces and barrier lines of the DTM of Jihomoravský kraj, polygonized and turned into MTVU codes
// by tools/build_dtm_brno.py (data/dtm-tiles/<ix>_<iy>.json = {p: [[code, rings]], l: [[code, path]]}).
const dtmTiles = new Map();
const dtmTile = (n) => {
  if (!dtmTiles.has(n)) {
    if (dtmTiles.size >= TILES_KEPT) dtmTiles.delete(dtmTiles.keys().next().value);
    dtmTiles.set(n, fetch(`data/dtm-tiles/${n}.json`).then((r) => (r.ok ? r.json() : r.status === 404 ? { p: [], l: [] } : Promise.reject(new Error(`dlaždice DTM ${r.status}`))))
      .catch((err) => { dtmTiles.delete(n); throw err; }));
  }
  return dtmTiles.get(n);
};
const bboxTiles = (bbox) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const names = [];
  for (let ix = Math.floor(x0 / TILE); ix <= Math.floor(x1 / TILE); ix++) for (let iy = Math.floor(y0 / TILE); iy <= Math.floor(y1 / TILE); iy++) names.push(`${ix}_${iy}`);
  return { names, box: [x0, y0, x1, y1] };
};
const meets = (pts, [x0, y0, x1, y1]) => {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of pts) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }
  return a <= x1 && c >= x0 && b <= y1 && d >= y0;
};

async function brnoSurfaces(bbox) {
  const { names, box } = bboxTiles(bbox);
  const features = [];
  for (const t of await Promise.all(names.map(dtmTile))) {
    for (const [code, rings] of t.p) {
      if (meets(rings[0], box)) features.push({ attributes: { CTVUK_KOD: code, CTVUK_POPIS: MTVU_LABELS[code] || "" }, geometry: { rings } });
    }
  }
  return { features };
}

// Barrier lines from the DTM, and the tram track axes from OSM (the DTM has the tram surface, not the
// tracks) under IPR's code 55010.
async function brnoLines(bbox) {
  const { names, box } = bboxTiles(bbox);
  const features = [];
  for (const t of await Promise.all(names.map(dtmTile))) {
    for (const [code, path] of t.l) if (meets(path, box)) features.push({ attributes: { CTMTP_KOD: code }, geometry: { paths: [path] } });
  }
  const [x0, y0, x1, y1] = box;
  const lat = (y0 + y1) / 2, lon = (x0 + x1) / 2;
  const r = Math.max((y1 - y0) * 110574, (x1 - x0) * 111320 * Math.cos((lat * Math.PI) / 180)) / 2;
  const { elements } = await osmTiles(lat, lon, r);
  for (const el of elements) {
    const t = el.tags || {};
    if (el.type !== "way" || t.railway !== "tram" || (t.tunnel && t.tunnel !== "no") || parseFloat(t.layer) < 0) continue;
    const path = el.geometry.map((g) => [g.lon, g.lat]);
    if (meets(path, box)) features.push({ attributes: { CTMTP_KOD: 55010 }, geometry: { paths: [path] } });
  }
  return { features };
}

// Paid parking sections of Brno (one file, data/parkovani.json, from tools/build_brno_data.mjs).
let brnoParking;
async function brnoParkovani(bbox) {
  brnoParking ??= fetch("data/parkovani.json").then((r) => (r.ok ? r.json() : { features: [] }), () => ({ features: [] }));
  const { box } = bboxTiles(bbox);
  return { features: (await brnoParking).features.filter((f) => meets(f.geometry.rings[0], box)) };
}

// Floors of a Brno building (KAM průzkum budov, data/budovy/<ix>_<iy>.json = [[floors, roof floors,
// roof, use of the ground floor, rings]]), in the shape podlaznostInfo gives for Prague.
// Uses that read as a hall (IPR typ 3) or a small low building (typ 6) by profile.js buildingStyle.
const HALL_USES = new Set(["sklad, distribuce, logistika", "průmyslová výroba", "velkoobchod", "nerušící výroba, montáže", "zemědělská a lesnická výroba", "vozovna"]);
const LOW_USES = new Set(["garáž", "zahrádky", "rekreace"]);
const budovyTiles = new Map();
async function brnoPodlaznost(lat, lon) {
  const k = `${Math.floor(lon / TILE)}_${Math.floor(lat / TILE)}`;
  if (!budovyTiles.has(k)) budovyTiles.set(k, fetch(`data/budovy/${k}.json`).then((r) => (r.ok ? r.json() : []), () => []));
  const rec = (await budovyTiles.get(k)).find(([, , , , rings]) => insideRings(rings, lon, lat));
  if (!rec) return {};
  const [floors, roofFloors, roof, use, rings] = rec;
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  let area = 0;
  const r = rings[0];
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) area += (r[j][0] - r[i][0]) * kx * (r[j][1] + r[i][1]) * ky;
  return {
    cornice: floors || undefined, roof: roofFloors || 0, total: (floors || 0) + (roofFloors || 0), roofType: roof || undefined,
    kind: HALL_USES.has(use) ? 3 : LOW_USES.has(use) ? 6 : undefined, newBuild: false, area: Math.round(Math.abs(area) / 2),
  };
}

// The special stalls (5–8) lie inside paid zones: in a zone (by the zone file, inZone) all layers
// are asked for at once; elsewhere only where the sections (3) found something, which spares IPR
// four requests per cut. As in server.mjs.
export async function parkovani(bbox, inZone) {
  if (isBrno) return brnoParkovani(bbox);
  if (!STATIC) return getJSON(`/api/parkovani?bbox=${bbox}${inZone ? "&zone=1" : ""}`);
  const layer = async (n, kind) => {
    const json = await query(`${PARKOVANI}/${n}/query`, { ...envelope(bbox), outFields: parkingFields(n) });
    return (json.features || []).map((f) => ({ ...f, attributes: { ...f.attributes, KIND: kind } }));
  };
  if (inZone) {
    const parts = await Promise.all(Object.entries(PARKING_LAYERS).map(([n, kind]) => layer(n, kind)));
    return { features: parts.flat() };
  }
  const sections = await layer("3", PARKING_LAYERS[3]);
  if (!sections.length) return { features: [] };
  const rest = await Promise.all(Object.entries(PARKING_LAYERS).filter(([n]) => n !== "3").map(([n, kind]) => layer(n, kind)));
  return { features: [...sections, ...rest.flat()] };
}

// Is the point within ZPS_RADIUS of a paid parking zone? The zones' bounding boxes are a file made
// once by tools/build_zps.mjs (data/zps.json, on the web built at deploy time), so a click never asks
// IPR. Without the file the answer is unknown (undefined) and the profile falls back to TSK sections.
const ZPS_RADIUS = 100; // m
let zpsBoxes;
export async function zps(lat, lon) {
  zpsBoxes ??= fetch("data/zps.json").then((r) => (r.ok ? r.json() : null)).then((j) => j?.boxes || null, () => null);
  const boxes = await zpsBoxes;
  if (!boxes) return undefined;
  const dLat = ZPS_RADIUS / 110574, dLon = ZPS_RADIUS / (111320 * Math.cos((lat * Math.PI) / 180));
  return boxes.some(([x0, y0, x1, y1]) => lon >= x0 - dLon && lon <= x1 + dLon && lat >= y0 - dLat && lat <= y1 + dLat);
}

// When the area around a point was first built up, from IPR's "Vývoj zástavby" (built-up area in
// 1840, 1880, 1920, 1950, 1970, 1990, 2010), cut into static tiles by tools/build_vyvoj.mjs, so a
// click never asks IPR. Returns the earliest year whose area contains the point, AFTER_2010 when
// the point lies in none (built later), undefined when there is no tile (data missing).
export const AFTER_2010 = 2020;
const VYVOJ_TILE = 0.01;
const vyvojTiles = new Map();
const insideRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
};
export async function vyvoj(lat, lon) {
  if (isBrno) return undefined; // Brno has no such layer: the look comes from the house alone
  const k = `${Math.floor(lon / VYVOJ_TILE)}_${Math.floor(lat / VYVOJ_TILE)}`;
  if (!vyvojTiles.has(k)) vyvojTiles.set(k, fetch(`data/vyvoj/${k}.json`).then((r) => (r.ok ? r.json() : null), () => null));
  const polys = await vyvojTiles.get(k);
  if (!polys) return undefined;
  let year = AFTER_2010;
  for (const [rok, rings] of polys) if (rok < year && insideRings(rings, lon, lat)) year = rok;
  return year;
}

export async function podlaznost(lat, lon) {
  if (isBrno) return brnoPodlaznost(lat, lon);
  if (!STATIC) return getJSON(`/api/podlaznost?lat=${lat}&lon=${lon}`);
  const json = await query(PODLAZNOST, {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: PODLAZNOST_FIELDS, returnGeometry: "false", f: "json",
  });
  return podlaznostInfo(json, lat);
}
