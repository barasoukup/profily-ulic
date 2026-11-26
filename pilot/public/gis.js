// What every data source needs: requests with retries (announced to the app), ArcGIS queries in an
// envelope, the OSM tiles around a point, and a few geometry helpers the cities' sources share
// (sources.js for Prague and Brno, towns/*.js for the towns asking their own GIS on a click).
import { t } from "./i18n.js";
import { STATIC } from "./config.js";
import { city } from "./city.js";

import { TILE, decodeTile, mergePieces } from "./osmtile.js";
import { PackSet } from "./osmpack.js";
export { TILE };
const TIMEOUT = 25000;
// IPR's ArcGIS queues requests and under load answers "503 Wait timeout for the request exceeded"
// (or not at all): a failed request is tried again after a pause.
const RETRY_DELAYS = [1500, 4000];

async function getOnce(url) {
  // Brno asks the city's servers from the browser also on the local server: with a timeout there too.
  const r = await fetch(url, STATIC || !city.slowServer ? { signal: AbortSignal.timeout(TIMEOUT) } : undefined);
  if (!r.ok) throw Object.assign(new Error(await r.text()), { refused: r.status >= 400 && r.status < 500 && r.status !== 429 });
  const json = await r.json();
  // ArcGIS reports failures with HTTP 200 and an "error" field; under load also "400 Unable to complete operation",
  // which is worth another try (Fable): refused only a query it names as wrong (a field, a parameter, a layer).
  if (json?.error) throw Object.assign(new Error(`${json.error.code} ${json.error.message}`), { refused: /^4\d\d$/.test(String(json.error.code)) && /invalid|parameter|field|not found|does not exist/i.test(`${json.error.message} ${(json.error.details || []).join(" ")}`) });
  return json;
}

// Retries are announced (the app shows them in its status line). A request that timed out is not
// repeated: IPR is overloaded then, and another 25 s of waiting would not help.
export const events = new EventTarget();
export async function getJSON(url) {
  for (let i = 0; ; i++) {
    try {
      return await getOnce(url);
    } catch (err) {
      // A query the server refuses (an HTTP 4xx, or ArcGIS naming a wrong field or parameter) would be refused again.
      if (i >= RETRY_DELAYS.length || err.name === "TimeoutError" || err.name === "AbortError" || err.refused) throw err;
      console.warn("opakuji dotaz", url.slice(0, 80), err.message);
      events.dispatchEvent(new CustomEvent("retry", { detail: { attempt: i + 2, of: RETRY_DELAYS.length + 1, host: new URL(url, "http://localhost").hostname } }));
      await new Promise((res) => setTimeout(res, RETRY_DELAYS[i]));
    }
  }
}

export const envelope = (bbox) => ({
  geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", f: "json",
});
export const query = (base, params) => getJSON(`${base}?${new URLSearchParams(params)}`);

// The OSM tiles of the whole Czech Republic (tools/build_osm_tiles.mjs, the compact form of osmtile.js), one file
// each, as the local server has them (on the web they come packed, below).
const TILES_AT = "data/osm-tiles";
// The last TILES_KEPT tiles stay in memory: the next cut nearby (or a dragged cut) needs no
// download. A tile that failed to load is asked for again next time; a missing tile has nothing in it.
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
  // With a timeout: a tile that does not come would otherwise hold the cut up for good.
  tiles.set(n, fetch(`${TILES_AT}/${n}.json`, { signal: AbortSignal.timeout(TIMEOUT) }).then((r) => (r.ok ? r.text().then(decodeTile) : r.status === 404 ? [] : Promise.reject(new Error(t("dlaždice OSM {status}", { status: r.status })))))
    .catch((err) => { tiles.delete(n); throw err; }));
  return tiles.get(n);
};

// The OSM tiles of each country in one file (osmpack.js, tools/pack_osm_tiles.mjs), read in pieces over HTTP Range
// (Bára 15. 11. 2026): on the web from Cloudflare R2 (data.streetspace.eu), the same files on Pages when R2 fails.
// ?osm=r2 reads R2 only (its r2.dev address as the second place), ?osm=balik the files of the local server
// (pilot/data/osm-pack); the local server otherwise keeps to the tiles of data/osm-tiles.
export const OSM_R2 = "https://data.streetspace.eu/osm", OSM_R2_DEV = "https://pub-a2b7312aca0a4dfe8a49583ae59ddbc6.r2.dev/osm";
export const OSM_PACK = (() => {
  const v = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("osm");
  return v === "r2" || v === "balik" ? v : STATIC ? "web" : null;
})();
const PACK_AT = { web: [OSM_R2, "data/osm-pack"], r2: [OSM_R2, OSM_R2_DEV], balik: ["data/osm-pack"] }[OSM_PACK];
const packs = PACK_AT && new PackSet(PACK_AT, { timeout: TIMEOUT });

// OSM elements around a point, from the tiles it touches, lines joined back across them (as the server's localOsm()).
export async function osmTiles(lat, lon, radius) {
  const dLat = radius / 110574;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++) {
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  }
  if (packs) return { source: "local", elements: mergePieces(await packs.tiles(names)) };
  return { source: "local", elements: mergePieces(await Promise.all(names.map(tile))) };
}

export const insideRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
};

// Metres per degree of longitude and latitude around a latitude.
export const metres = (lat) => [111320 * Math.cos((lat * Math.PI) / 180), 110574];

// The envelope "x0,y0,x1,y1" of radius metres around a point.
export const boxAround = (lat, lon, radius) => {
  const [kx, ky] = metres(lat);
  return [lon - radius / kx, lat - radius / ky, lon + radius / kx, lat + radius / ky].join(",");
};

// Area of an ArcGIS polygon's first ring in m².
export function ringArea(geometry, lat) {
  const [kx, ky] = metres(lat);
  const r = geometry?.rings?.[0] || [];
  let area = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) area += (r[j][0] - r[i][0]) * kx * (r[j][1] + r[i][1]) * ky;
  return Math.round(Math.abs(area) / 2);
}

export const insideAny = (feats, x, y) => feats.find((f) => f.geometry?.rings && insideRings(f.geometry.rings, x, y));

// Surfaces of a town as the MTVU features derive.js reads: each layer's features with a code (or a
// function of the attributes giving a code, or [code, guess] for an estimate; null: left out).
export function asMtvu(layers, labels) {
  const features = [];
  for (const [json, code] of layers) {
    for (const f of json?.features || []) {
      const v = typeof code === "function" ? code(f.attributes || {}) : code;
      const [c, guess] = Array.isArray(v) ? v : [v, false];
      if (c && f.geometry?.rings) features.push({ attributes: { CTVUK_KOD: c, CTVUK_POPIS: labels[c] || "", ODHAD: guess ? 1 : 0, ...(f.attributes?.ANY_TRAM ? { ANY_TRAM: 1 } : {}), ...(f.attributes?.OUTER_GAP ? { OUTER_GAP: 1 } : {}), ...(f.attributes?.ORIENT ? { ORIENT: f.attributes.ORIENT } : {}) }, geometry: f.geometry });
    }
  }
  return { features };
}

// A town's passport's surfaces marked so: the profile's parts over them say "z pasportu města" (derive.js; Bára
// 16. 11. 2026), not "změřeno z mapy povrchů".
export function asPassport(json) {
  for (const f of json?.features || []) f.attributes = { ...f.attributes, PASPORT: 1 };
  return json;
}

// Point layers of a town (trees, lamps, benches, stop shelters…) added to the OSM answer where OSM has
// no such thing nearby: 3 m, 15 m for a shelter (OSM may keep it as the stop node with shelter=yes).
// layers: [{ features }] in the order of tagsOf; tagsOf(attributes) → OSM tags, or null (not drawn).
export function addPoints(o, layers, tagsOfs, source, lat) {
  const [kx, ky] = metres(lat);
  const key = (t) => Object.entries(t).find(([k]) => ["highway", "amenity", "natural", "barrier"].includes(k))?.join("=");
  const nodes = o.elements.filter((e) => e.type === "node");
  let id = -1;
  layers.forEach((json, i) => {
    for (const f of json?.features || []) {
      const g = f.geometry, tags = tagsOfs[i](f.attributes || {});
      if (!tags || !g || g.x === undefined) continue;
      const k = key(tags);
      const shelter = tags.amenity === "shelter";
      const same = (t) => key(t) === k || (shelter && t.shelter === "yes");
      if (nodes.some((n) => same(n.tags || {}) && Math.hypot((n.geometry[0].lon - g.x) * kx, (n.geometry[0].lat - g.y) * ky) < (shelter ? 15 : 3))) continue;
      o.elements.push({ type: "node", id: id--, tags: { ...tags, source }, geometry: [{ lat: g.y, lon: g.x }] });
    }
  });
  return o;
}

// A parking line (stalls along a curb, or the middle row of stalls) as a strip as deep as its stalls:
// with roadway on one side only the strip lies on that side, else it is centred on the line.
// Returns the rings (one per path) in degrees.
export function parkingStrip(paths, depth, roadway, lat) {
  const [kx, ky] = metres(lat);
  const rings = [];
  for (const path of paths || []) {
    if (path.length < 2) continue;
    const xy = path.map(([x, y]) => [x * kx, y * ky]);
    const [ax, ay] = xy[0], [bx, by] = xy[xy.length - 1], l = Math.hypot(bx - ax, by - ay) || 1;
    const n = [-(by - ay) / l, (bx - ax) / l];
    const mid = xy[Math.floor(xy.length / 2)];
    const on = (d) => !!insideAny(roadway, (mid[0] + n[0] * d) / kx, (mid[1] + n[1] * d) / ky);
    const left = on(1), right = on(-1);
    const [lo, hi] = left === right ? [-depth / 2, depth / 2] : left ? [0, depth] : [-depth, 0];
    const ring = [...xy.map(([x, y]) => [x + n[0] * lo, y + n[1] * lo]), ...[...xy].reverse().map(([x, y]) => [x + n[0] * hi, y + n[1] * hi])];
    ring.push(ring[0]);
    rings.push(ring.map(([x, y]) => [x / kx, y / ky]));
  }
  return rings;
}

// A building of RÚIAN (ČÚZK, CORS open, the same WGS 84 as OSM) at a point, for any Czech town: floors,
// use as the look of the house (industrial, farm, production and storage buildings read as a hall,
// IPR typ 3; cottages and garages as small low buildings, typ 6), the year it was completed (old
// houses carry a summary date of 1910–1919, "before 1919") and its walls: concrete wall panels (druh
// konstrukce 4, 41, 43) make a panel house; bricks, stone, monolith or wood (1–3, 5, 6, 11, 42, 61–66) rule one out
// (evaluation/budovy-panel). Code 10 ("kámen, cihly, tvárnice vč. kombinací") says nothing: a third of the panel
// houses of Brno-Lesná carry it.
const RUIAN_SO = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/3/query";
// A farmstead (zemědělská usedlost, 2) is a village house, not a hall (Bára 16. 11. 2026).
export const RUIAN_HALL = new Set([1, 12, 13]), RUIAN_LOW = new Set([8, 18]);
const RUIAN_PANEL = new Set([4, 41, 43]), RUIAN_SOLID = new Set([1, 2, 3, 5, 6, 11, 42, 61, 62, 63, 64, 65, 66]);
// Offices, authorities, schools, hotels (občanská vybavenost 5 and 15, ubytování 11, administrativa 14): drawn as an
// office building where OSM does not say what the house is.
const RUIAN_OFFICE = new Set([5, 11, 14, 15]);
// What RÚIAN tells of the look of a house (also Plzeň's own copy of RÚIAN, towns/plzen.js).
export const ruianLook = (use, walls, dokonceni) => ({
  kind: RUIAN_HALL.has(use) ? 3 : RUIAN_LOW.has(use) ? 6 : undefined,
  built: dokonceni ? new Date(dokonceni).getUTCFullYear() : undefined, panel: RUIAN_PANEL.has(walls) || undefined, solid: RUIAN_SOLID.has(walls) || undefined,
  house: use === 7 || use === 8 || undefined, // rodinný dům, stavba pro rodinnou rekreaci: a pitched roof (profile.js)
  farm: use === 2 || undefined, office: RUIAN_OFFICE.has(use) || undefined, garage: use === 18 || undefined,
});
// The outlines of RÚIAN's buildings in a bbox as OSM areas (type "area", tags.building, geometry of { lon, lat }), for
// the estimate from the orthophoto and OSM (ortho-osm.js) where no surface map covers the cut: in Czechia RÚIAN knows
// the houses better than OSM (Bára 23. 11. 2026; a cottage by the road the cut missed in OSM, Královéhradecký kraj).
export async function ruianOutlines(bbox) {
  const json = await query(RUIAN_SO, { ...envelope(bbox), outFields: "objectid", returnGeometry: "true" });
  return (json.features || []).filter((f) => f.geometry?.rings?.length).map((f, i) => {
    const [outer, ...holes] = f.geometry.rings.map((r) => r.map(([lon, lat]) => ({ lon, lat })));
    return { type: "area", id: `ruian-${f.attributes?.objectid ?? i}`, from: "RÚIAN", tags: { building: "yes", source: "RÚIAN" }, geometry: outer, holes };
  });
}
// OSM's elements with RÚIAN's buildings: "first" (the app) RÚIAN's outlines and OSM's buildings only where none of
// RÚIAN's lies under them (their middle in none); "fill" only the RÚIAN outlines no OSM building overlaps.
export function withBuildings(osm, outlines, mode = "fill") {
  if (!outlines?.length) return osm;
  const inRing = (r, x, y) => {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const a = r[i], b = r[j];
      if (a.lat > y !== b.lat > y && x < ((b.lon - a.lon) * (y - a.lat)) / (b.lat - a.lat) + a.lon) c = !c;
    }
    return c;
  };
  const mid = (g) => [g.reduce((a, p) => a + p.lon, 0) / (g.length || 1), g.reduce((a, p) => a + p.lat, 0) / (g.length || 1)];
  const houses = (osm.elements || []).filter((el) => el.type === "area" && el.tags?.building && el.geometry?.length);
  const overlap = (a, b) => inRing(a.geometry, ...mid(b.geometry)) || inRing(b.geometry, ...mid(a.geometry));
  if (mode === "first") return { ...osm, elements: [...outlines, ...(osm.elements || []).filter((el) => !houses.includes(el) || !outlines.some((o) => inRing(o.geometry, ...mid(el.geometry))))] };
  const missing = outlines.filter((o) => !houses.some((h) => overlap(o, h)));
  return missing.length ? { ...osm, elements: [...(osm.elements || []), ...missing] } : osm;
}

export async function ruianBuilding(lat, lon) {
  const json = await query(RUIAN_SO, {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: "pocetpodlazi,zpusobvyuzitikod,dokonceni,druhkonstrukcekod,zastavenaplocha", returnGeometry: "false", f: "json",
  });
  const a = json.features?.[0]?.attributes;
  if (!a) return {};
  const { pocetpodlazi: floors, zpusobvyuzitikod: use, dokonceni, druhkonstrukcekod: walls, zastavenaplocha: area } = a;
  // RÚIAN counts a lived-in attic as a floor (as towns/plzen.js finds by the eaves): a family house or a
  // cottage (drawn with a pitched roof) of 2 floors or more has its top one in the roof (Jeseník: 1 NP and an
  // attic drawn as 2 NP under a roof; silnice 230 by Mariánské Lázně, Bára 23. 11. 2026).
  const attic = (use === 7 || use === 8) && floors >= 2 ? 1 : 0;
  return { cornice: floors ? floors - attic : undefined, roof: attic, total: floors || 0, newBuild: false, area: area || undefined, ...ruianLook(use, walls, dokonceni) };
}
