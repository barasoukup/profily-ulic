// Data sources of the app. With the local server (config STATIC = false) every call goes to its
// /api endpoints, which cache the answers. On static hosting (STATIC = true) the browser asks the
// services itself: IPR ArcGIS allows cross-origin requests, and the OSM extract is
// served as the same tiles the server reads (data/osm-tiles/<ix>_<iy>.json).
// Layers, fields and the reading of answers are shared with server.mjs (queries.js).
import { STATIC } from "./config.js";

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

export const osm = (lat, lon, r) => (STATIC ? osmTiles(lat, lon, r) : getJSON(`/api/osm?lat=${lat}&lon=${lon}&r=${r}`));

export const mtvu = (bbox) => (STATIC
  ? query(MTVU, { ...envelope(bbox), outFields: MTVU_FIELDS })
  : getJSON(`/api/mtvu?bbox=${bbox}`));

export const linie = (bbox) => (STATIC
  ? query(TM_LINES, { ...envelope(bbox), where: LINE_WHERE, outFields: "CTMTP_KOD" })
  : getJSON(`/api/linie?bbox=${bbox}`));

// The special stalls (5–8) lie inside paid zones: in a zone (by the zone file, inZone) all layers
// are asked for at once; elsewhere only where the sections (3) found something, which spares IPR
// four requests per cut. As in server.mjs.
export async function parkovani(bbox, inZone) {
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

export async function podlaznost(lat, lon) {
  if (!STATIC) return getJSON(`/api/podlaznost?lat=${lat}&lon=${lon}`);
  const json = await query(PODLAZNOST, {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: PODLAZNOST_FIELDS, returnGeometry: "false", f: "json",
  });
  return podlaznostInfo(json, lat);
}
