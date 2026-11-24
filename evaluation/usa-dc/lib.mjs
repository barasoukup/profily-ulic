// The Washington DC pilot (phase 1, Bára 24. 11. 2026): shared pieces. OSM from the app's own tile format, built
// locally from Geofabrik's district-of-columbia extract (data/osm-tiles, tools/build_osm_data.sh; no Overpass), the
// cut placed as the app places a click (derive.js nearestStreet, awayFromJunctions, centerOnStreet, the north flip of
// app.js cutAt), and a polite cached fetch for DC GIS (data/cache, one request at a time, a pause between them).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { TILE, decodeTile, mergePieces } from "../../pilot/public/osmtile.js";
import { localFrame, nearestStreet, awayFromJunctions, centerOnStreet } from "../../pilot/public/derive.js";

export const ROOT = path.dirname(new URL(import.meta.url).pathname);
export const DATA = path.join(ROOT, "data");
const TILES = path.join(DATA, "osm-tiles"), CACHE = path.join(DATA, "cache");
const UA = { "User-Agent": "profily-ulic evaluation (street cross-sections)" };

async function tile(name) {
  try { return decodeTile(await fs.readFile(path.join(TILES, `${name}.json`), "utf8")); } catch { return []; }
}
export async function osmAround(lat, lon, radius = 80) {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++)
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  return { elements: mergePieces(await Promise.all(names.map(tile))) };
}

// A GET of JSON, cached by its URL (a test asks DC GIS once per box), 1.5 s between requests, 3 tries.
let last = 0;
export async function cachedJSON(url) {
  await fs.mkdir(CACHE, { recursive: true });
  const f = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  try { return JSON.parse(await fs.readFile(f, "utf8")); } catch {}
  for (let i = 0; ; i++) {
    const wait = last + 1500 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.error) throw new Error(JSON.stringify(j.error));
      await fs.writeFile(f, JSON.stringify(j));
      return j;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

// The cut as the app makes it from a click at (lat, lon): the street, away from junctions, a dual carriageway cut in
// its middle, the street's direction turned to point north (A on the west / left). Returns { lat, lon, bearing, way }.
export async function placeCut(lat, lon) {
  const osm = await osmAround(lat, lon, 80);
  let frame = localFrame(lat, lon);
  let near = nearestStreet(osm, frame, [0, 0]);
  if (!near) return null;
  near = awayFromJunctions(osm, frame, near);
  near = centerOnStreet(osm, frame, near);
  const [clon, clat] = frame.toLonLat(...near.point);
  let dir = near.dir;
  if (dir[1] < -1e-9 || (Math.abs(dir[1]) <= 1e-9 && dir[0] < 0)) dir = [-dir[0], -dir[1]];
  return { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, way: near.way, nearDir: near.dir };
}

export const ft = (x) => (Number(x) || 0) * 0.3048;
