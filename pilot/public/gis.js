// What every data source needs: requests with retries (announced to the app), ArcGIS queries in an
// envelope, the OSM tiles around a point, and a few geometry helpers the cities' sources share
// (sources.js for Prague and Brno, towns/*.js for the towns asking their own GIS on a click).
import { STATIC } from "./config.js";
import { isLive } from "./city.js";

export const TILE = 0.005; // degrees, as in tools/build_osm_tiles.mjs
const TIMEOUT = 25000;
// IPR's ArcGIS queues requests and under load answers "503 Wait timeout for the request exceeded"
// (or not at all): a failed request is tried again after a pause.
const RETRY_DELAYS = [1500, 4000];

async function getOnce(url) {
  // Brno asks the city's servers from the browser also on the local server: with a timeout there too.
  const r = await fetch(url, STATIC || isLive ? { signal: AbortSignal.timeout(TIMEOUT) } : undefined);
  if (!r.ok) throw new Error(await r.text());
  const json = await r.json();
  // ArcGIS reports failures with HTTP 200 and an "error" field.
  if (json?.error) throw new Error(`${json.error.code} ${json.error.message}`);
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
      if (i >= RETRY_DELAYS.length || err.name === "TimeoutError" || err.name === "AbortError") throw err;
      console.warn("opakuji dotaz", url.slice(0, 80), err.message);
      events.dispatchEvent(new CustomEvent("retry", { detail: { attempt: i + 2, of: RETRY_DELAYS.length + 1 } }));
      await new Promise((res) => setTimeout(res, RETRY_DELAYS[i]));
    }
  }
}

export const envelope = (bbox) => ({
  geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", f: "json",
});
export const query = (base, params) => getJSON(`${base}?${new URLSearchParams(params)}`);

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

// The tiles cover the box of the city's extract (data/osm-tiles/extent.json, tile indexes written by
// tools/build_osm_tiles.mjs). A place beyond it is asked from Overpass. Without the file (an older
// build) the tiles are taken as they are.
let extent;
const covered = async (ix0, ix1, iy0, iy1) => {
  extent ??= fetch("data/osm-tiles/extent.json").then((r) => (r.ok ? r.json() : null), () => null);
  const e = await extent;
  return !e || (ix0 >= e.ix[0] && ix1 <= e.ix[1] && iy0 >= e.iy[0] && iy1 <= e.iy[1]);
};

// OSM elements around a point, merged from the tiles it touches (as the server's localOsm()).
export async function osmTiles(lat, lon, radius) {
  const dLat = radius / 110574;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const [ix0, ix1] = [Math.floor((lon - dLon) / TILE), Math.floor((lon + dLon) / TILE)];
  const [iy0, iy1] = [Math.floor((lat - dLat) / TILE), Math.floor((lat + dLat) / TILE)];
  if (!(await covered(ix0, ix1, iy0, iy1))) return osmOverpass(lat, lon, radius);
  const names = [];
  for (let ix = ix0; ix <= ix1; ix++) for (let iy = iy0; iy <= iy1; iy++) names.push(`${ix}_${iy}`);
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

// Overpass, where the tiles do not reach (Bára: allowed as a fallback; each visitor's browser asks, so the
// limits per address are far off). The same features as the tiles (tools/build_osm_data.sh), in the same
// shape: lines as "way", polygons as "area", points as "node". The public servers are slow at times: each
// is tried once with a short timeout, in turn; an answer is kept for the session.
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const OVERPASS_TIMEOUT = 25000; // in the evening a small box can take 20–37 s
const BARRIERS = "fence|wall|city_wall|retaining_wall|hedge|guard_rail|jersey_barrier|handrail";
export const overpassQuery = (b) => `[out:json][timeout:15];(
way[highway](${b});way[railway=tram](${b});way[barrier~"^(${BARRIERS})$"](${b});way[natural=tree_row](${b});
nwr[amenity=parking](${b});nwr[public_transport=platform](${b});nwr[railway=platform](${b});way[highway=platform](${b});
nwr[leisure=outdoor_seating](${b});way[building]["building:levels"](${b});way[building][height](${b});way[building]["roof:levels"](${b});
node[natural=tree](${b});node[highway~"^(street_lamp|bus_stop|turning_circle|turning_loop)$"](${b});node[barrier~"^(bollard|planter)$"](${b});
node[amenity~"^(bench|bicycle_parking|bicycle_rental|shelter|taxi)$"](${b});node[information~"^(board|guidepost|map)$"](${b});node[railway=tram_stop](${b});
);out geom;`;
// Keys that make a closed way a polygon (GDAL's osmconf.ini, as the exports the tiles are made of).
const AREA_KEYS = ["aeroway", "amenity", "boundary", "building", "craft", "geological", "historic", "land_area", "landuse", "leisure", "man_made", "military", "natural", "office", "place", "shop", "sport", "tourism"];
const pt = ({ lat, lon }) => ({ lat: +lat.toFixed(7), lon: +lon.toFixed(7) });
const isPlatform = (t) => t.public_transport === "platform" || t.railway === "platform" || t.highway === "platform";
const keepArea = (t) => t.amenity === "parking" || isPlatform(t) || t.leisure === "outdoor_seating"
  || (t.building && ("building:levels" in t || "height" in t || "roof:levels" in t));
const keepLine = (t) => t.highway || t.railway === "tram" || new RegExp(`^(${BARRIERS})$`).test(t.barrier || "") || t.natural === "tree_row";
const keepNode = (t) => t.natural === "tree" || /^(street_lamp|bus_stop|turning_circle|turning_loop)$/.test(t.highway || "")
  || /^(bollard|planter)$/.test(t.barrier || "") || /^(bench|bicycle_parking|bicycle_rental|shelter|taxi)$/.test(t.amenity || "")
  || /^(board|guidepost|map)$/.test(t.information || "") || t.railway === "tram_stop" || t.public_transport === "platform" || t.leisure === "outdoor_seating";
const slim = (t) => (t.building ? Object.fromEntries(Object.entries(t).filter(([k]) => ["building", "building:levels", "roof:levels", "height"].includes(k))) : t);
// Outer members of a multipolygon joined into closed rings.
function joinRings(parts) {
  const rings = [], open = parts.map((p) => [...p]);
  while (open.length) {
    let ring = open.shift();
    for (let grew = true; grew && ring[0] !== ring.at(-1);) {
      grew = false;
      const end = ring.at(-1), same = (a, b) => a.lat === b.lat && a.lon === b.lon;
      if (same(ring[0], end)) break;
      const i = open.findIndex((p) => same(p[0], end) || same(p.at(-1), end));
      if (i >= 0) { const p = open.splice(i, 1)[0]; ring = ring.concat((same(p[0], end) ? p : [...p].reverse()).slice(1)); grew = true; }
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}
export function fromOverpass(json) {
  const elements = [];
  for (const e of json.elements || []) {
    const t = e.tags || {};
    if (e.type === "node") {
      if (keepNode(t)) elements.push({ type: "node", id: e.id, tags: t, geometry: [pt(e)] });
    } else if (e.type === "way" && e.geometry?.length > 1) {
      const g = e.geometry.map(pt), closed = e.nodes?.[0] === e.nodes?.at(-1) && g.length > 3;
      const area = closed && t.area !== "no" && (t.area === "yes" || AREA_KEYS.some((k) => k in t));
      if (area && keepArea(t)) elements.push({ type: "area", id: e.id, tags: slim(t), geometry: g, holes: [] });
      else if (!area && keepLine(t)) elements.push({ type: "way", id: e.id, tags: t, geometry: g });
    } else if (e.type === "relation" && t.type === "multipolygon" && keepArea(t)) {
      const outer = (e.members || []).filter((m) => m.type === "way" && m.role !== "inner" && m.geometry).map((m) => m.geometry.map(pt));
      for (const ring of joinRings(outer)) elements.push({ type: "area", id: e.id, tags: slim(t), geometry: ring, holes: [] });
    }
  }
  return elements;
}
const overpassCache = new Map();
export function osmOverpass(lat, lon, radius) {
  // The box rounded out to 0.002° so nearby cuts reuse one answer.
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180)), r = (v, up) => (Math[up ? "ceil" : "floor"](v / 0.002) * 0.002).toFixed(3);
  const b = [r(lat - dLat), r(lon - dLon), r(lat + dLat, 1), r(lon + dLon, 1)].join(",");
  if (!overpassCache.has(b)) {
    overpassCache.set(b, (async () => {
      let last;
      for (const url of OVERPASS) {
        try {
          const res = await fetch(`${url}?data=${encodeURIComponent(overpassQuery(b))}`, { signal: AbortSignal.timeout(OVERPASS_TIMEOUT) });
          if (!res.ok) throw new Error(`Overpass ${res.status}`);
          return { source: "overpass", elements: fromOverpass(await res.json()) };
        } catch (err) {
          last = err;
          events.dispatchEvent(new CustomEvent("overpass", { detail: { url } }));
        }
      }
      throw last;
    })().catch((err) => { overpassCache.delete(b); throw err; }));
  }
  return overpassCache.get(b);
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
      if (c && f.geometry?.rings) features.push({ attributes: { CTVUK_KOD: c, CTVUK_POPIS: labels[c] || "", ODHAD: guess ? 1 : 0 }, geometry: f.geometry });
    }
  }
  return { features };
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
// houses carry a summary date of 1910–1919, "before 1919") and its walls of panels (druh konstrukce 4,
// 41–43: a panel house whatever else is known).
const RUIAN_SO = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/3/query";
export const RUIAN_HALL = new Set([1, 2, 12, 13]), RUIAN_LOW = new Set([8, 18]);
const RUIAN_PANEL = new Set([4, 41, 42, 43]);
export async function ruianBuilding(lat, lon) {
  const json = await query(RUIAN_SO, {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: "pocetpodlazi,zpusobvyuzitikod,dokonceni,druhkonstrukcekod,zastavenaplocha", returnGeometry: "false", f: "json",
  });
  const a = json.features?.[0]?.attributes;
  if (!a) return {};
  const { pocetpodlazi: floors, zpusobvyuzitikod: use, dokonceni, druhkonstrukcekod: walls, zastavenaplocha: area } = a;
  return {
    cornice: floors || undefined, roof: 0, total: floors || 0,
    kind: RUIAN_HALL.has(use) ? 3 : RUIAN_LOW.has(use) ? 6 : undefined, newBuild: false, area: area || undefined,
    built: dokonceni ? new Date(dokonceni).getUTCFullYear() : undefined, panel: RUIAN_PANEL.has(walls) || undefined,
  };
}
