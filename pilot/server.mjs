// Local server for the street profile pilot: serves public/, answers OSM queries
// from a local extract (data/osm-tiles) and proxies IPR MTVU with a cache in cache/.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { SITES } from "../tools/cities.mjs";
import { TILE, decodeTile, mergePieces } from "./public/osmtile.js";
import { MTVU, MTVU_FIELDS, TM_LINES, LINE_WHERE, PARKOVANI, PARKING_LAYERS, parkingFields, PODLAZNOST, PODLAZNOST_FIELDS, podlaznostInfo } from "./public/queries.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const CACHE = path.join(ROOT, "cache");
const PORT = Number(process.env.PORT || 5173);

const UA = "streetdesign-pilot/0.1 (local)";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".md": "text/markdown; charset=utf-8",
};

async function cached(kind, key, fetcher) {
  const file = path.join(CACHE, kind, crypto.createHash("sha1").update(key).digest("hex") + ".json");
  try {
    return await fs.readFile(file, "utf8");
  } catch {}
  const body = await fetcher();
  // ArcGIS reports failures (e.g. 503 "Wait timeout") with HTTP 200 and an "error" field:
  // never cache those, or the place would stay broken for good.
  let error;
  try { error = JSON.parse(body).error; } catch {}
  if (error) throw new Error(`${kind}: ${error.code} ${error.message}`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  return body;
}

// Upstream requests give up after this long instead of hanging the profile.
const TIMEOUT = 20000;
const upstream = (url, opts = {}) => fetch(url, { ...opts, headers: { "User-Agent": UA, ...opts.headers }, signal: AbortSignal.timeout(TIMEOUT) });

// OSM tiles of the Czech Republic (tools/build_osm_tiles.mjs, read as the app reads them: osmtile.js).
// Returns null when no tile around the point exists.
const TILES = path.join(ROOT, "data", "osm-tiles");

async function localOsm(lat, lon, radius) {
  const dLat = radius / 110574;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const lists = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++) {
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) {
      try {
        lists.push(decodeTile(await fs.readFile(path.join(TILES, `${ix}_${iy}.json`), "utf8")));
      } catch {}
    }
  }
  return lists.length ? JSON.stringify({ source: "local", elements: mergePieces(lists) }) : null;
}

// Tram track axes, barriers and slopes of the technical map (queries.js).
async function koleje(bbox) {
  const params = new URLSearchParams({
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    where: LINE_WHERE,
    outFields: "CTMTP_KOD",
    f: "json",
  });
  const r = await upstream(`${TM_LINES}?${params}`);
  if (!r.ok) throw new Error(`koleje ${r.status}`);
  return r.text();
}

// Parking sections (úseky parkovacích stání) of the paid parking zones, by TSK, via IPR, and the
// special stalls (queries.js). The special stalls lie inside paid zones: in a zone (by the zone
// file, inZone) all layers are asked for at once; elsewhere they are asked for only where the
// sections found something, which spares IPR four requests per cut.
async function parkingLayer(bbox, layer, kind) {
  const params = new URLSearchParams({
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: parkingFields(layer),
    f: "json",
  });
  const r = await upstream(`${PARKOVANI}/${layer}/query?${params}`);
  if (!r.ok) throw new Error(`parkovani ${layer} ${r.status}`);
  const json = await r.json();
  // Re-serialised below, so an ArcGIS error must be caught here or it would be cached as "no parking".
  if (json.error) throw new Error(`parkovani ${layer}: ${json.error.code} ${json.error.message}`);
  return (json.features || []).map((f) => ({ ...f, attributes: { ...f.attributes, KIND: kind } }));
}

async function parkovani(bbox, inZone) {
  const special = Object.entries(PARKING_LAYERS).filter(([n]) => n !== "3");
  if (inZone) {
    const parts = await Promise.all(Object.entries(PARKING_LAYERS).map(([n, kind]) => parkingLayer(bbox, n, kind)));
    return JSON.stringify({ features: parts.flat() });
  }
  const sections = await parkingLayer(bbox, "3", PARKING_LAYERS[3]);
  const rest = sections.length ? await Promise.all(special.map(([n, kind]) => parkingLayer(bbox, n, kind))) : [];
  return JSON.stringify({ features: [...sections, ...rest.flat()] });
}

// Building floors (IPR "Podlažnosti", read by podlaznostInfo in queries.js).
async function podlaznost(lat, lon) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: PODLAZNOST_FIELDS,
    returnGeometry: "false",
    f: "json",
  });
  const r = await upstream(`${PODLAZNOST}?${params}`);
  if (!r.ok) throw new Error(`podlaznost ${r.status}`);
  const json = await r.json();
  if (json.error) throw new Error(`podlaznost: ${json.error.code} ${json.error.message}`);
  return JSON.stringify(podlaznostInfo(json, Number(lat)));
}

async function mtvu(bbox) {
  const params = new URLSearchParams({
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: MTVU_FIELDS,
    f: "json",
  });
  const r = await upstream(`${MTVU}?${params}`);
  if (!r.ok) throw new Error(`MTVU ${r.status}`);
  return r.text();
}

// The bbox of one cut (±40 m plus padding) is well under 0.01°; larger ones are refused so a
// request cannot pull (and cache) half of Prague.
function bboxParam(url) {
  const b = (url.searchParams.get("bbox") || "").split(",").map(Number);
  if (b.length !== 4 || b.some((v) => !Number.isFinite(v)) || b[2] - b[0] > 0.01 || b[3] - b[1] > 0.01 || b[2] < b[0] || b[3] < b[1]) {
    throw Object.assign(new Error("neplatný bbox"), { status: 400 });
  }
  return b.map((v) => round(v)).join(",");
}

function round(v, d = 5) {
  return Number(v).toFixed(d);
}

// A point in or around Prague (the local OSM extract and IPR data cover nothing else).
function pointParam(url, d = 5) {
  const lat = Number(url.searchParams.get("lat")), lon = Number(url.searchParams.get("lon"));
  if (!(lat > 48 && lat < 52 && lon > 12 && lon < 19)) throw Object.assign(new Error("neplatná poloha"), { status: 400 });
  return [round(lat, d), round(lon, d)];
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/api/osm") {
      const [lat, lon] = pointParam(url);
      const radius = Math.min(Number(url.searchParams.get("r") || 80), 200);
      const body = (await localOsm(Number(lat), Number(lon), radius)) ?? JSON.stringify({ source: "local", elements: [] });
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    if (url.pathname === "/api/mtvu") {
      const bbox = bboxParam(url);
      const body = await cached("mtvu", bbox, () => mtvu(bbox));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    if (url.pathname === "/api/parkovani") {
      const bbox = bboxParam(url);
      // The answer is the same either way, only the order of requests differs: one cache entry.
      const body = await cached("parkovani2", bbox, () => parkovani(bbox, url.searchParams.get("zone") === "1"));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    if (url.pathname === "/api/podlaznost") {
      const [lat, lon] = pointParam(url, 6);
      const body = await cached("podlaznost3", `${lat},${lon}`, () => podlaznost(lat, lon));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    if (url.pathname === "/api/linie") {
      const bbox = bboxParam(url);
      const body = await cached("linie", bbox, () => koleje(bbox));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    let rel;
    try {
      rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    } catch {
      throw Object.assign(new Error("neplatná adresa"), { status: 400 });
    }
    // A former city site (/brno/, /jihlava/, …): to the one page, over that city (tools/city_site.mjs).
    // (Only the page: the folder also holds the city's illustrations.)
    const site = Object.keys(SITES).find((c) => [c, `${c}/`, `${c}/index.html`].includes(rel));
    if (site) {
      res.writeHead(302, { Location: `/?mesto=${site}` });
      return res.end();
    }
    // data/… (OSM tiles, parking zones) is served from pilot/data, as the web build places it next to the app.
    const dataDir = path.join(ROOT, "data");
    const base = rel.startsWith("data/") ? dataDir : PUBLIC;
    const file = path.normalize(path.join(base, rel.startsWith("data/") ? rel.slice(5) : rel));
    if (!file.startsWith(base + path.sep)) throw Object.assign(new Error("forbidden"), { code: "ENOENT" });
    const data = await fs.readFile(file);
    // Local development: the browser always revalidates, so an edited file shows on reload.
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch (e) {
    const status = e.status || (e.code === "ENOENT" ? 404 : 502);
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(e.message || e));
  }
});

// Only this computer: the server forwards requests to IPR and must not be an open proxy.
// HOST=0.0.0.0 opens it to the local network (e.g. to try the app on a phone).
const HOST = process.env.HOST || "127.0.0.1";
server.listen(PORT, HOST, () => console.log(`Profily ulic běží na http://localhost:${PORT}`));
