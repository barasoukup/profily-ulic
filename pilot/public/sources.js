// Data sources of the app. With the local server (config STATIC = false) every call goes to its
// /api endpoints, which cache the answers. On static hosting (STATIC = true) the browser asks the
// services itself: IPR ArcGIS and Streetmix allow cross-origin requests, and the OSM extract is
// served as the same tiles the server reads (data/osm-tiles/<ix>_<iy>.json).
// The queries mirror the ones in server.mjs; change both together.
import { STATIC } from "./config.js";

const IPR = "https://gs-pub.praha.eu/arcgis/rest/services";
const MTVU = `${IPR}/dtmp/dtmp/MapServer/15/query`;
const TM_LINES = `${IPR}/dtmp/dtmp/MapServer/10/query`;
const PARKOVANI = `${IPR}/dop/zony_placeneho_stani/MapServer`;
const PODLAZNOST = "https://mp.iprpraha.cz/arcgis/rest/services/Hosted/URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0/query";
// Line features of the technical map: tram track axes (55010), barriers and slopes (see server.mjs).
const LINE_CODES = [55010, 71522, 71540, 61530, 61209, 61210, 71210, 81210, 91210, 61422, 71422, 81422, 81214, 42105, 42107];
// Parking sections (layer 3) and special stalls: ZTP (5, 6), deliveries (7), special (8).
const PARKING_LAYERS = { 3: "useky", 5: "ztp", 6: "ztp", 7: "zasobovani", 8: "specialni" };
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

async function getJSON(url) {
  for (let i = 0; ; i++) {
    try {
      return await getOnce(url);
    } catch (err) {
      if (i >= RETRY_DELAYS.length) throw err;
      console.warn("opakuji dotaz", url.slice(0, 80), err.message);
      await new Promise((res) => setTimeout(res, RETRY_DELAYS[i]));
    }
  }
}

const envelope = (bbox) => ({
  geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", f: "json",
});
const query = (base, params) => getJSON(`${base}?${new URLSearchParams(params)}`);

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
  for (const els of await Promise.all(names.map((n) => fetch(`data/osm-tiles/${n}.json`).then((r) => (r.ok ? r.json() : []), () => [])))) {
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
  ? query(MTVU, { ...envelope(bbox), outFields: "CTVUK_KOD,CTVUK_POPIS" })
  : getJSON(`/api/mtvu?bbox=${bbox}`));

export const linie = (bbox) => (STATIC
  ? query(TM_LINES, { ...envelope(bbox), where: `CTMTP_KOD IN (${LINE_CODES.join(",")})`, outFields: "CTMTP_KOD" })
  : getJSON(`/api/linie?bbox=${bbox}`));

export async function parkovani(bbox) {
  if (!STATIC) return getJSON(`/api/parkovani?bbox=${bbox}`);
  const parts = await Promise.all(Object.entries(PARKING_LAYERS).map(async ([layer, kind]) => {
    const json = await query(`${PARKOVANI}/${layer}/query`, { ...envelope(bbox), outFields: layer === "3" ? "ZPS_ID,TYPZONY,PS_ZPS" : "ZPS_ID" });
    return (json.features || []).map((f) => ({ ...f, attributes: { ...f.attributes, KIND: kind } }));
  }));
  return { features: parts.flat() };
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
    outFields: "pocet_podlazi,ustup_stres,podlaz_celk,strecha", returnGeometry: "false", f: "json",
  });
  const a = json.features?.[0]?.attributes;
  return a ? { cornice: a.pocet_podlazi, roof: a.ustup_stres || 0, total: a.podlaz_celk, roofType: a.strecha } : {};
}

// Creates an anonymous public street on streetmix.net; returns {url, id}.
export async function streetmix(street) {
  const r = await fetch(STATIC ? "https://streetmix.net/api/v1/streets" : "/api/streetmix", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(street),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Streetmix ${r.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  return STATIC ? { url: `https://streetmix.net/-/${json.namespacedId}`, id: json.id } : json;
}
