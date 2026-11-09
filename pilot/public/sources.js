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

// Brno asks the city's services on a click, as Prague asks IPR's; only the OSM tiles are files.
export const osm = (lat, lon, r) => (isBrno ? brnoOsm(lat, lon, r) : STATIC ? osmTiles(lat, lon, r) : getJSON(`/api/osm?lat=${lat}&lon=${lon}&r=${r}`));

export const mtvu = (bbox) => (isBrno ? brnoSurfaces(bbox) : STATIC
  ? query(MTVU, { ...envelope(bbox), outFields: MTVU_FIELDS })
  : getJSON(`/api/mtvu?bbox=${bbox}`));

export const linie = (bbox) => (isBrno ? brnoLines(bbox) : STATIC
  ? query(TM_LINES, { ...envelope(bbox), where: LINE_WHERE, outFields: "CTMTP_KOD" })
  : getJSON(`/api/linie?bbox=${bbox}`));

// ---------- Brno ----------
// The city's GIS (gis.brno.cz) and open data (data.brno.cz) answer the browser directly (CORS):
// MTVU (Mapa technického využití území) for the surfaces, the drawing of the technical map (UMPS) for
// tracks, guard rails, fences, walls, railings, slopes, lamps, trees, benches and bollards.
const BRNO_GIS = "https://gis.brno.cz";
const BRNO_MTVU = `${BRNO_GIS}/ags3/rest/services/PUBLIC/opendata_mtvu/MapServer/1/query`;
const BRNO_UMPS = `${BRNO_GIS}/ags3/rest/services/PUBLIC/opendata_umps/MapServer/identify`;
const BRNO_KAM = `${BRNO_GIS}/ags1/rest/services/Hosted/KAM_pruzkum_budov_OD_WGS_Projekt/FeatureServer/0/query`;
const BRNO_OD = "https://services6.arcgis.com/fUWVlHWZNxUvTUh8/arcgis/rest/services";
const TCODE = "ted_work.DBO.MTVU_DIL_P.TCODE";

// Brno's MTVU codes (5100xxx, the classes of the technical map; legend of PUBLIC/ted_MTVU_plochy_povrch)
// → Prague's MTVU codes that derive.js and types.js know; null: unknown kind.
export function brnoMtvuCode(code) {
  const c = code - 5100000;
  if (c >= 100 && c < 200) return 100; // zemědělská půda
  if (c === 200) return 200; // les
  if (c === 320) return 300; // zahrada
  if (c >= 410 && c < 430) return 401; // parková zeleň, travnatá a okrasná plocha
  if (c === 440) return 402; // hřbitov
  if (c === 510 || c === 511) return 501; // vodní tok, upravené koryto
  if ((c >= 520 && c < 530) || c === 566) return 502; // nádrže
  if (c === 555) return 402; // meliorační příkop, žlab: along roads a gutter, not water
  if (c >= 550 && c < 570) return 503; // hráze, protipovodňové stavby
  if (c === 610) return 601; // budova
  if (c === 626) return 702; // rampa
  if (c === 650) return 1003; // neveřejná zpevněná plocha
  if (c === 652) return 603; // dvůr, nádvoří
  if (c >= 620 && c < 680) return 602; // ostatní stavby, zdi, drobné stavby
  if (c >= 710 && c < 720) return 701; // komunikace
  if (c >= 720 && c < 730) return 702; // chodník, nástupiště, schodiště, signální prvek
  if (c === 730) return 703; // cyklostezka
  if (c === 740) return 704; // parkoviště
  if (c === 751 || c === 752) return 702; // nájezd, dopravní ostrůvek
  if (c === 753) return 401; // dělící pás
  if (c === 757) return 701; // přidružená plocha (zálivy, krajnice)
  if (c === 755) return 402; // příkop, násep, zářez
  if (c === 750 || c === 754) return 1003; // provozní a manipulační plochy
  if (c === 761) return 705; // tramvajová dráha
  if (c === 762 || c === 1100) return 1100; // lanová dráha, železnice
  if (c === 910) return 901; // hřiště
  if (c === 1010) return 402; // hospodářsky nevyužívaná plocha
  if (c >= 1020 && c < 1030) return 1003; // důl, lom, rekultivace
  return null;
}

// Line codes of Brno's technical map (UMPS, 7 digits) → those of IPR's line layer: the same scheme
// with a prefix (1255010 osa kolejí MHD = 55010, 1271522 svodidlo = 71522 …).
export function brnoLineCode(t) {
  if (t === 1255010) return 55010; // osa kolejí MHD
  if (t >= 1271522 && t <= 1271525) return 71522; // svodidlo jednostranné
  if (t >= 1271540 && t <= 1271543) return 71540; // svodidlo zdvojené
  if ((t >= 1161530 && t <= 1161533) || t === 1381530) return 61530; // zábradlí
  if (t === 1661209 || (t >= 1661211 && t <= 1661213)) return 61209; // plot nerozlišený
  if ([1660215, 1660216, 1660225, 1660226, 1660227, 1381214].includes(t)) return 81214; // živý plot
  if ([1660217, 1660228, 1660229, 1660230, 1181870].includes(t)) return 71210; // zděný plot, ohradní a protihluková zeď
  if ((t >= 1660211 && t <= 1660230) || t === 1661210 || (t >= 1661214 && t <= 1661216) || t === 1621904) return 61210; // ploty, podezdívky
  if (t >= 1661419 && t <= 1661422) return 61422; // opěrná zeď
  if (t === 1381422) return 81422;
  if (t === 1381210) return 81210;
  if (t === 1542105 || t === 1542115) return 42105; // horní hrana svahu
  if (t === 1542107 || t === 1542117) return 42107; // dolní hrana svahu
  return null;
}
const UMPS_LINES = {
  36: "TCODE IN (1255010,1271522,1271523,1271524,1271525,1271540,1271541,1271542,1271543)",
  37: "(TCODE BETWEEN 1660211 AND 1660230) OR (TCODE BETWEEN 1661209 AND 1661216) OR (TCODE BETWEEN 1661419 AND 1661422) OR TCODE = 1621904",
  38: "TCODE IN (1161530,1161531,1161532,1161533,1181870)",
  40: "TCODE IN (1542105,1542107,1542115,1542117)",
  41: "TCODE IN (1381210,1381214,1381422,1381530)",
};
// Points of the technical map that stand in a street, as OSM tags (derive.js reads them like OSM nodes).
const UMPS_POINTS = { 14: "TCODE = 606560", 19: "TCODE = 1274110", 20: "TCODE = 1181850", 23: "TCODE = 1383130" };
const POINT_TAGS = { 606560: { highway: "street_lamp" }, 1274110: { barrier: "bollard" }, 1181850: { amenity: "bench" }, 1383130: { natural: "tree" } };

// One identify request for several layers of the technical-map drawing, with a filter per layer.
const umps = ([x0, y0, x1, y1], defs) => query(BRNO_UMPS, {
  geometry: [x0, y0, x1, y1].join(","), geometryType: "esriGeometryEnvelope", sr: "4326",
  layers: `all:${Object.keys(defs).join(",")}`, layerDefs: JSON.stringify(defs), tolerance: "0",
  mapExtent: [x0, y0, x1, y1].join(","), imageDisplay: "800,800,96", returnGeometry: "true", f: "json",
});

async function brnoSurfaces(bbox) {
  const json = await query(BRNO_MTVU, { ...envelope(bbox), outFields: TCODE });
  const features = [];
  for (const f of json.features || []) {
    const code = brnoMtvuCode(Number(f.attributes[TCODE]));
    if (code !== null && f.geometry?.rings) features.push({ attributes: { CTVUK_KOD: code, CTVUK_POPIS: MTVU_LABELS[code] || "" }, geometry: f.geometry });
  }
  return { features };
}

async function brnoLines(bbox) {
  const json = await umps(bbox.split(",").map(Number), UMPS_LINES);
  const features = [];
  for (const r of json.results || []) {
    const code = brnoLineCode(Number(r.attributes?.TCODE));
    if (code !== null && r.geometry?.paths) features.push({ attributes: { CTMTP_KOD: code }, geometry: r.geometry });
  }
  return { features };
}

// OSM around a point plus the lamps, trees, benches and bollards of the technical map, where OSM does
// not already have the same thing within 3 m.
async function brnoOsm(lat, lon, radius) {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const [o, p] = await Promise.all([osmTiles(lat, lon, radius), umps([lon - dLon, lat - dLat, lon + dLon, lat + dLat], UMPS_POINTS).catch(() => ({}))]);
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  const key = (t) => Object.entries(t).find(([k]) => ["highway", "barrier", "amenity", "natural"].includes(k))?.join("=");
  const nodes = o.elements.filter((e) => e.type === "node");
  let id = -1;
  for (const r of p.results || []) {
    const tags = POINT_TAGS[Number(r.attributes?.TCODE)];
    const g = r.geometry;
    if (!tags || !g || g.x === undefined) continue;
    const k = key(tags);
    if (nodes.some((n) => key(n.tags || {}) === k && Math.hypot((n.geometry[0].lon - g.x) * kx, (n.geometry[0].lat - g.y) * ky) < 3)) continue;
    o.elements.push({ type: "node", id: id--, tags: { ...tags, source: "Brno" }, geometry: [{ lat: g.y, lon: g.x }] });
  }
  return o;
}

// Paid parking sections still valid (data.brno.cz, Úseky placeného stání).
async function brnoParkovani(bbox) {
  const json = await query(`${BRNO_OD}/useky_placeneho_stani/FeatureServer/0/query`, {
    ...envelope(bbox), where: "platnostdo IS NULL OR platnostdo > CURRENT_TIMESTAMP", outFields: "ObjectId",
  });
  return { features: (json.features || []).map((f) => ({ attributes: { KIND: "useky" }, geometry: f.geometry })) };
}

// Floors of a Brno building (KAM průzkum budov), in the shape podlaznostInfo gives for Prague. Roofs
// as IPR's codes (profile.js IPR_ROOF): 1 pitched, 3 flat, 4 mixed. Uses of the ground floor that read
// as a hall (IPR typ 3) or a small low building (typ 6) by profile.js buildingStyle.
const ROOF = { "rovná střecha": 3, "rovná stŕecha": 3, "šikmá střecha": 1, "využité podkroví": 1, kombinace: 4 };
const HALL_USES = new Set(["sklad, distribuce, logistika", "průmyslová výroba", "velkoobchod", "nerušící výroba, montáže", "zemědělská a lesnická výroba", "vozovna"]);
const LOW_USES = new Set(["garáž", "zahrádky", "rekreace"]);
async function brnoPodlaznost(lat, lon) {
  const json = await query(BRNO_KAM, {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: "npodl,strpodl,strecha,np1_1f", f: "json",
  });
  const f = json.features?.[0];
  if (!f) return {};
  const { npodl, strpodl, strecha, np1_1f } = f.attributes;
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  let area = 0;
  const r = f.geometry?.rings?.[0] || [];
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) area += (r[j][0] - r[i][0]) * kx * (r[j][1] + r[i][1]) * ky;
  return {
    cornice: npodl || undefined, roof: strpodl || 0, total: (npodl || 0) + (strpodl || 0), roofType: ROOF[strecha],
    kind: HALL_USES.has(np1_1f) ? 3 : LOW_USES.has(np1_1f) ? 6 : undefined, newBuild: false, area: Math.round(Math.abs(area) / 2),
  };
}

// Within ZPS_RADIUS of a residential parking area (data.brno.cz, Parkovací oblasti rezidentního parkování)?
async function brnoZps(lat, lon) {
  const dLat = ZPS_RADIUS / 110574, dLon = ZPS_RADIUS / (111320 * Math.cos((lat * Math.PI) / 180));
  const json = await query(`${BRNO_OD}/parkovaci_oblasti/FeatureServer/0/query`, {
    ...envelope([lon - dLon, lat - dLat, lon + dLon, lat + dLat].join(",")), returnCountOnly: "true",
  });
  return (json.count || 0) > 0;
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
  if (isBrno) return brnoZps(lat, lon);
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
