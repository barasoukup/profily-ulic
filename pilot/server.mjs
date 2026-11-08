// Local server for the street profile pilot: serves public/, answers OSM queries
// from a local extract (data/osm-tiles) and proxies IPR MTVU with a cache in cache/.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PUBLIC = path.join(ROOT, "public");
const CACHE = path.join(ROOT, "cache");
const PORT = Number(process.env.PORT || 5173);

const MTVU = "https://gs-pub.praha.eu/arcgis/rest/services/dtmp/dtmp/MapServer/15/query";
const UA = "streetdesign-pilot/0.1 (local)";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
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

// Local OSM extract split into tiles by tools/build_osm_tiles.mjs. Returns null when
// the point is outside the extract.
const TILES = path.join(ROOT, "data", "osm-tiles");
const TILE = 0.005;

async function localOsm(lat, lon, radius) {
  const dLat = radius / 110574;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const seen = new Set();
  const elements = [];
  let found = false;
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++) {
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) {
      let els;
      try {
        els = JSON.parse(await fs.readFile(path.join(TILES, `${ix}_${iy}.json`), "utf8"));
      } catch {
        continue;
      }
      found = true;
      for (const el of els) {
        const key = el.id + ":" + el.geometry[0].lat + ":" + el.geometry[0].lon;
        if (seen.has(key)) continue;
        seen.add(key);
        elements.push(el);
      }
    }
  }
  return found ? JSON.stringify({ source: "local", elements }) : null;
}

// Line features of the technical map: tram track axes (55010) plus barriers and slopes
// (guard rails, railings, fences and walls, retaining walls, hedges, top/bottom edges of slopes).
const LINE_CODES = [55010, 71522, 71540, 61530, 61209, 61210, 71210, 81210, 91210, 61422, 71422, 81422, 81214, 42105, 42107];
const TM_LINES = "https://gs-pub.praha.eu/arcgis/rest/services/dtmp/dtmp/MapServer/10/query";

async function koleje(bbox) {
  const params = new URLSearchParams({
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    where: `CTMTP_KOD IN (${LINE_CODES.join(",")})`,
    outFields: "CTMTP_KOD",
    f: "json",
  });
  const r = await upstream(`${TM_LINES}?${params}`);
  if (!r.ok) throw new Error(`koleje ${r.status}`);
  return r.text();
}

// Parking sections (úseky parkovacích stání) of the paid parking zones, by TSK, via IPR.
const PARKOVANI = "https://gs-pub.praha.eu/arcgis/rest/services/dop/zony_placeneho_stani/MapServer/3/query";

// Parking sections (layer 3) and special stalls: ZTP (5, 6), deliveries (7), special (8).
const PARKING_LAYERS = { 3: "useky", 5: "ztp", 6: "ztp", 7: "zasobovani", 8: "specialni" };

async function parkovani(bbox) {
  const features = [];
  for (const [layer, kind] of Object.entries(PARKING_LAYERS)) {
    const params = new URLSearchParams({
      geometry: bbox,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      outSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: layer === "3" ? "ZPS_ID,TYPZONY,PS_ZPS" : "ZPS_ID",
      f: "json",
    });
    const r = await upstream(`${PARKOVANI.replace("/3/query", `/${layer}/query`)}?${params}`);
    if (!r.ok) throw new Error(`parkovani ${layer} ${r.status}`);
    const json = await r.json();
    // Re-serialised below, so an ArcGIS error must be caught here or it would be cached as "no parking".
    if (json.error) throw new Error(`parkovani ${layer}: ${json.error.code} ${json.error.message}`);
    for (const f of json.features || []) features.push({ ...f, attributes: { ...f.attributes, KIND: kind } });
  }
  return JSON.stringify({ features });
}

// Building floors (IPR "Podlažnosti"): floors up to the cornice, roof / set-back floors, total.
const PODLAZNOST = "https://mp.iprpraha.cz/arcgis/rest/services/Hosted/URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0/query";

async function podlaznost(lat, lon) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "pocet_podlazi,ustup_stres,podlaz_celk,strecha,typ,SHAPE__Area",
    returnGeometry: "false",
    f: "json",
  });
  const r = await upstream(`${PODLAZNOST}?${params}`);
  if (!r.ok) throw new Error(`podlaznost ${r.status}`);
  const json = await r.json();
  if (json.error) throw new Error(`podlaznost: ${json.error.code} ${json.error.message}`);
  const a = json.features?.[0]?.attributes;
  // SHAPE__Area is in Web Mercator square metres: scaled back to the ground by cos² of the latitude.
  const area = a?.SHAPE__Area ? Math.round(a.SHAPE__Area * Math.cos((lat * Math.PI) / 180) ** 2) : undefined;
  return JSON.stringify(a ? { cornice: a.pocet_podlazi, roof: a.ustup_stres || 0, total: a.podlaz_celk, roofType: a.strecha, kind: a.typ, area } : {});
}

async function mtvu(bbox) {
  const params = new URLSearchParams({
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "CTVUK_KOD,CTVUK_POPIS",
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/api/osm") {
      const lat = round(url.searchParams.get("lat"));
      const lon = round(url.searchParams.get("lon"));
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
      const body = await cached("parkovani2", bbox, () => parkovani(bbox));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    if (url.pathname === "/api/streetmix" && req.method === "POST") {
      // Create an anonymous street on streetmix.net and return its address.
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1e6) throw new Error("Streetmix: ulice je moc velká");
      }
      const r = await upstream("https://streetmix.net/api/v1/streets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`Streetmix ${r.status}: ${text.slice(0, 200)}`);
      const street = JSON.parse(text);
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(JSON.stringify({ url: `https://streetmix.net/-/${street.namespacedId}`, id: street.id }));
    }
    if (url.pathname === "/api/podlaznost") {
      const lat = round(url.searchParams.get("lat"), 6), lon = round(url.searchParams.get("lon"), 6);
      const body = await cached("podlaznost2", `${lat},${lon}`, () => podlaznost(lat, lon));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    if (url.pathname === "/api/linie") {
      const bbox = bboxParam(url);
      const body = await cached("linie", bbox, () => koleje(bbox));
      res.writeHead(200, { "Content-Type": TYPES[".json"] });
      return res.end(body);
    }
    const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    // data/… (OSM tiles, parking zones) is served from pilot/data, as the web build places it next to the app.
    const base = rel.startsWith("data/") ? path.join(ROOT, "data") : PUBLIC;
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

server.listen(PORT, () => console.log(`Profily ulic běží na http://localhost:${PORT}`));
