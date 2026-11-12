// Data sources of the app. With the local server (config STATIC = false) every call goes to its
// /api endpoints, which cache the answers. On static hosting (STATIC = true) the browser asks the
// services itself: IPR ArcGIS allows cross-origin requests, and the OSM extract is
// served as the same tiles the server reads (data/osm-tiles/<ix>_<iy>.json).
// Layers, fields and the reading of answers are shared with server.mjs (queries.js).
import { STATIC } from "./config.js";
import { city, MTVU_LABELS } from "./city.js";
import { TILE, getJSON, query, envelope, osmTiles, insideRings } from "./gis.js";
import { TOWNS } from "./towns/index.js";
import { t, mark } from "./i18n.js";
export { events } from "./gis.js";

import { MTVU, MTVU_FIELDS, TM_LINES, LINE_WHERE, TM_POINTS, POINT_WHERE, PARKOVANI, PARKING_LAYERS, parkingFields, PODLAZNOST, PODLAZNOST_FIELDS, podlaznostInfo } from "./queries.js";
// Brno asks the city's services on a click, as Prague asks IPR's; only the OSM tiles are files.
// A town (towns/<id>.js, also "cesko" anywhere else) brings its own sources; read for the city of the
// current cut each time.
const town = () => TOWNS[city.id]?.sources;
const isBrno = () => city.id === "brno";
const isLive = () => city.id !== "praha";

export const osm = (lat, lon, r) => (town() ? town().osm(lat, lon, r) : isBrno() ? brnoOsm(lat, lon, r) : STATIC ? osmTiles(lat, lon, r) : getJSON(`/api/osm?lat=${lat}&lon=${lon}&r=${r}`));

// Where the city's own map has nothing (a cut outside the city: Česká Třebová from the Most page, a village
// beyond Prague) or does not answer (IPR overloaded), the national DTM of ČÚZK read live (dmvs.js) stands in,
// as for Pardubice. dmvs: the export credits the DMVS and the region (city.js creditLines); fallback: the city's
// own service failed (app.js says so); dmvsFailed: the city's map was empty and the DMVS did not answer either.
// When the DMVS has nothing either, the city's failure stands (the profile is an estimate from OSM).
// read: the DMVS reader (dmvs.js surfaces), given by the tests.
export const national = async (json, bbox, err, read) => {
  if (!err && json?.features?.length) return json;
  if (TOWNS[city.id]?.national) { if (err) throw err; return json; }
  const surfaces = read || (await import("./dmvs.js")).surfaces;
  let r;
  try { r = await surfaces(bbox, MTVU_LABELS, { wfs: true }); } catch {
    if (err) throw err;
    return { ...json, dmvsFailed: true };
  }
  if (!r.features?.length) { if (err) throw err; return json; }
  return { ...r, dmvs: true, ...(err && { fallback: true }) };
};
export const mtvu = (bbox) => (town() ? town().surfaces(bbox) : isBrno() ? brnoSurfaces(bbox) : STATIC
  ? query(MTVU, { ...envelope(bbox), outFields: MTVU_FIELDS })
  : getJSON(`/api/mtvu?bbox=${bbox}`)).then((json) => national(json, bbox), (err) => national({ features: [] }, bbox, err));

// The note is the Czech text (mark): the cut keeps it so, app.js translates it when it shows it.
// What a cut lacks because a source did not answer, from the settled requests of app.js cutAt (surfaces,
// lines, parking): the note after the street's name and the status line. Without the surfaces the
// profile is an estimate from OSM; without the lines it lacks tram tracks, fences and slopes; without the
// parking it lacks the stalls (and in a paid zone none are estimated). Prague's lines carry missing
// "opendata" when the tiles of its open data failed (street classes of TSK, trees).
export function outage({ surfaces, lines, parking }, dataName = city.dataName) {
  const s = surfaces.status === "fulfilled" ? surfaces.value : null;
  const lacks = [];
  if (lines.status !== "fulfilled") lacks.push(t("kolejí, plotů a svahů"));
  if (parking.status !== "fulfilled") lacks.push(t("parkovacích stání"));
  if (lines.status === "fulfilled" && lines.value?.missing?.includes("opendata")) lacks.push(t("stromů a tříd ulic TSK"));
  const without = lacks.length ? " " + t("Chybí data {what} (server neodpověděl).", { what: lacks.join(", ") }) : "";
  const again = " " + t("Zkuste kliknout znovu za chvíli.");
  const failed = !s;
  const empty = s && !s.features?.length;
  const note = failed ? mark(" · technická mapa neodpověděla, jen odhad")
    : s.fallback ? mark(" · plochy z technické mapy ČÚZK")
    : empty ? (s.dmvsFailed ? mark(" · technická mapa neodpověděla, jen odhad") : s.linesOnly ? mark(" · technická mapa tu má jen čáry, jen odhad") : mark(" · mimo technickou mapu, jen odhad"))
    : s.fromLines ? mark(" · plochy odvozené z čar technické mapy")
    : lacks.length ? mark(" · neúplná data") : "";
  const text = failed ? (city.id === "praha" ? t("{name} teď neodpovídá (server je přetížený), profil je jen odhad z OSM.", { name: dataName })
      : t("{name} teď neodpovídá, profil je jen odhad z OSM.", { name: dataName })) + without + again
    : s.fallback ? t("{name} teď neodpovídá, plochy jsou z technické mapy ČÚZK.", { name: dataName }) + without
    : empty && s.dmvsFailed ? t("Technická mapa ČÚZK teď neodpovídá, profil je odhad z OSM.") + without + again
    : empty && s.linesOnly ? t("Technická mapa tu má jen čáry bez ploch (kraj plochy do ní nedodává), profil je odhad z OSM.") + without
    : empty ? t("Technická mapa tu nic nevrátila, profil je odhad z OSM.") + without
    : s.fromLines ? t("Technická mapa tu má jen čáry bez ploch: šířky jsou změřené mezi nimi, vozovka a chodníky odhadnuté.") + without
    : without ? without.trim() + again : "";
  return { note, text, error: failed || !!s.fallback || !!s.dmvsFailed || lacks.length > 0 };
}

export const linie = (bbox) => (town() ? town().lines(bbox) : isBrno() ? brnoLines(bbox) : prahaLines(bbox));

// ---------- Prague ----------
// The line layer of IPR's technical map (tracks, barriers, slopes) and, in parallel with it, its point
// layer (traction poles, stop poles, bollards, trees, poles without wires: one query, the codes in one
// WHERE) and the static tiles of Prague's open data (trees, tree rows, street classes). All in one answer
// of line and point features, read by derive.js techLines; what fails is left out, the lines stay.
// opts (for evaluation/variants): { points: false } without the point layer, { tmTrees: false } without its
// trees, { opendata: false } without the open data, { trees: false } / { sections: false } without its trees
// or street sections.
const POINTS_TIMEOUT = 10000; // ms
export async function prahaLines(bbox, opts = {}) {
  const params = (where) => ({ ...envelope(bbox), where, outFields: "CTMTP_KOD" });
  // The points are asked once, without retries, so a slow answer never holds the profile up for long.
  const once = (url) => fetch(url, { signal: AbortSignal.timeout(POINTS_TIMEOUT) }).then((r) => (r.ok ? r.json() : null)).then((j) => (j?.error ? null : j));
  const [lines, points, open] = await Promise.all([
    STATIC ? query(TM_LINES, params(LINE_WHERE)) : getJSON(`/api/linie?bbox=${bbox}`),
    opts.points === false ? null : once(STATIC ? `${TM_POINTS}?${new URLSearchParams(params(POINT_WHERE))}` : `/api/body?bbox=${bbox}`)
      .catch((err) => { console.warn("body technické mapy", err.message); return null; }),
    opts.opendata === false ? null : prahaOpendata(bbox).catch(() => undefined),
  ]);
  const pts = (points?.features || []).filter((f) => f.geometry?.x !== undefined && (opts.tmTrees !== false || Number(f.attributes?.CTMTP_KOD) !== 83130));
  // undefined: the tiles failed (outage tells the visitor), null: not asked.
  return { features: [...(lines.features || []), ...pts, ...(open ? opendataFeatures(open, opts) : [])], ...(open === undefined && { missing: ["opendata"] }) };
}

// Prague open data (Geoportál Praha, CC BY 4.0), built once per deploy by tools/build_praha_opendata.mjs
// into tiles of PRAHA_TILE degrees (data/praha/opendata/<ix>_<iy>.json; one file holds every dataset):
// t single trees, r tree rows, z no-parking sections, u street sections of TSK with their class.
// Coordinates are millionths of a degree from the tile's south-west corner.
export const PRAHA_TILE = 0.01;
const prahaTiles = new Map();
export function decodePrahaTile(json, ix, iy) {
  const x0 = ix * PRAHA_TILE, y0 = iy * PRAHA_TILE;
  const pts = (c, from = 0) => { const out = []; for (let i = from; i + 1 < c.length; i += 2) out.push([x0 + c[i] / 1e6, y0 + c[i + 1] / 1e6]); return out; };
  return {
    trees: pts(json.t || []),
    rows: (json.r || []).map((c) => ({ id: c[0], pts: pts(c, 1) })),
    noParking: (json.z || []).map((c) => ({ id: c[0], ring: pts(c, 1) })),
    sections: (json.u || []).map((c) => ({ id: c[0], mk: c[1], road: c[2], motorway: c[3], kind: c[4], pts: pts(c, 5) })),
  };
}
// A tile of the site's own data: a missing one (404) is empty ground, any other failure is one (the caller
// reports it, sources.js outage) and is not kept, so the next click asks again (Fable's review).
function staticTile(cache, k, url, empty, read = (j) => j) {
  const p = fetch(url).then((r) => (r.ok ? r.json() : r.status === 404 ? empty : Promise.reject(new Error(`${url} ${r.status}`)))).then(read);
  p.catch(() => { if (cache.get(k) === p) cache.delete(k); });
  cache.set(k, p);
  return p;
}
// The tiles a bbox "x0,y0,x1,y1" touches, merged (shapes in several tiles once), only what lies in it.
export async function prahaOpendata(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const parts = [];
  for (let ix = Math.floor(x0 / PRAHA_TILE); ix <= Math.floor(x1 / PRAHA_TILE); ix++) {
    for (let iy = Math.floor(y0 / PRAHA_TILE); iy <= Math.floor(y1 / PRAHA_TILE); iy++) {
      const k = `${ix}_${iy}`;
      if (!prahaTiles.has(k)) {
        if (prahaTiles.size >= 16) prahaTiles.delete(prahaTiles.keys().next().value);
        staticTile(prahaTiles, k, `data/praha/opendata/${k}.json`, {}, (j) => decodePrahaTile(j, ix, iy));
      }
      parts.push(prahaTiles.get(k));
    }
  }
  const tiles = await Promise.all(parts);
  const inBox = ([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const touches = (ps) => { const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]); return Math.min(...xs) <= x1 && Math.max(...xs) >= x0 && Math.min(...ys) <= y1 && Math.max(...ys) >= y0; };
  const once = (key, get) => { const seen = new Set(); return tiles.flatMap((t) => t[key]).filter((x) => !seen.has(x.id) && seen.add(x.id) && touches(get(x))); };
  return {
    trees: tiles.flatMap((t) => t.trees).filter(inBox),
    rows: once("rows", (x) => x.pts), noParking: once("noParking", (x) => x.ring), sections: once("sections", (x) => x.pts),
  };
}
// The open data as features of the technical-map answer: trees and tree rows (code OD_TREE, OD_ROW) and
// the street sections of TSK (OD_SECTION, with their class). opts.trees / opts.sections false: left out.
export const OD_TREE = "od_strom", OD_ROW = "od_stromorad", OD_SECTION = "od_usek";
function opendataFeatures(open, opts = {}) {
  const out = [];
  if (opts.trees !== false) {
    for (const [x, y] of open.trees) out.push({ attributes: { CTMTP_KOD: OD_TREE }, geometry: { x, y } });
    for (const r of open.rows) out.push({ attributes: { CTMTP_KOD: OD_ROW }, geometry: { paths: [r.pts] } });
  }
  if (opts.sections !== false) {
    for (const u of open.sections) out.push({ attributes: { CTMTP_KOD: OD_SECTION, MK: u.mk, SIL: u.road, DALNICE: u.motorway, TYP: u.kind }, geometry: { paths: [u.pts] } });
  }
  return out;
}

// ---------- Brno ----------
// The city's GIS (gis.brno.cz) and open data (data.brno.cz) answer the browser directly (CORS):
// MTVU (Mapa technického využití území) for the surfaces, the drawing of the technical map (UMPS) for
// tracks, guard rails, fences, walls, railings, slopes, lamps, trees, benches and bollards.
const BRNO_GIS = "https://gis.brno.cz";
const BRNO_MTVU = `${BRNO_GIS}/ags3/rest/services/PUBLIC/opendata_mtvu/MapServer/1/query`;
const BRNO_UMPS = `${BRNO_GIS}/ags3/rest/services/PUBLIC/opendata_umps/MapServer/identify`;
const BRNO_MTVU_ABOVE = `${BRNO_GIS}/ags3/rest/services/PUBLIC/ted_MTVU_plochy_nadzemni/MapServer/0/query`;
const BRNO_KAM = `${BRNO_GIS}/ags1/rest/services/Hosted/KAM_pruzkum_budov_OD_WGS_Projekt/FeatureServer/0/query`;
const BRNO_OD = "https://services6.arcgis.com/fUWVlHWZNxUvTUh8/arcgis/rest/services";
const TCODE = "ted_work.DBO.MTVU_DIL_P.TCODE";

// Brno's MTVU codes (5100xxx, the classes of the technical map; legend of PUBLIC/ted_MTVU_plochy_povrch)
// → Prague's MTVU codes that derive.js and types.js know; null: unknown kind.
export function brnoMtvuCode(code) {
  const c = code % 10000; // 5100xxx on the ground, 5110xxx (and up) above it: the same classes
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

// The ground, and the areas above it (bridge decks; LEVEL 1, used by derive.js only for a cut on a bridge).
async function brnoSurfaces(bbox) {
  const [ground, above] = await Promise.all([
    query(BRNO_MTVU, { ...envelope(bbox), outFields: TCODE }),
    query(BRNO_MTVU_ABOVE, { ...envelope(bbox), outFields: "tcode" }).catch(() => ({ features: [] })),
  ]);
  const features = [];
  for (const [json, field, level] of [[ground, TCODE, 0], [above, "tcode", 1]]) {
    for (const f of json.features || []) {
      const code = brnoMtvuCode(Number(f.attributes[field]));
      if (code !== null && f.geometry?.rings) features.push({ attributes: { CTVUK_KOD: code, CTVUK_POPIS: MTVU_LABELS[code] || "", LEVEL: level }, geometry: f.geometry });
    }
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

// Cycling measures of the city (data.brno.cz, Cykloopatření – zrealizovaná) as OSM tags of the street
// they lie on: what OSM itself says about cycling wins (a street with any cycleway tag is left alone).
const CYKLO = {
  "Vyhrazený jízdní pruh pro cyklisty - V14": "lane", "Ochranný jízdní pruh pro cyklisty": "soft_lane",
  "Piktogramový koridor pro cyklisty - V20": "shared_lane", "Jízda cyklistů v protisměru (jízdní pruh)": "opposite_lane",
};
const CONTRAFLOW = /^Jízda cyklistů v protisměru/;
function addCycling(elements, measures, kx, ky) {
  const xy = (lon, lat) => [lon * kx, lat * ky];
  const streets = elements.filter((e) => e.type === "way" && e.tags?.highway && !["footway", "path", "cycleway", "steps", "pedestrian"].includes(e.tags.highway) && e.geometry?.length > 1);
  for (const m of measures) {
    const kind = m.attributes?.typ_opatreni || "";
    if (!CYKLO[kind] && !CONTRAFLOW.test(kind)) continue;
    const pts = (m.geometry?.paths || []).flat().map(([x, y]) => xy(x, y));
    if (pts.length < 2) continue;
    // the street whose axis runs closest along the measure (mean distance of its points, under 8 m)
    let best = null;
    for (const w of streets) {
      const g = w.geometry.map((q) => xy(q.lon, q.lat));
      let sum = 0, side = 0;
      for (const p of pts) {
        let dmin = Infinity, cross = 0;
        for (let i = 0; i < g.length - 1; i++) {
          const [ax, ay] = g[i], [bx, by] = g[i + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2));
          const d = Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy);
          if (d < dmin) { dmin = d; cross = dx * (p[1] - ay) - dy * (p[0] - ax); }
        }
        sum += dmin;
        side += Math.sign(cross);
      }
      const mean = sum / pts.length;
      if (mean < 8 && (!best || mean < best.mean)) best = { w, mean, side };
    }
    if (!best || Object.keys(best.w.tags).some((k) => k.startsWith("cycleway") || k === "oneway:bicycle")) continue;
    const i = elements.indexOf(best.w);
    const tags = { ...best.w.tags };
    if (CONTRAFLOW.test(kind)) tags["oneway:bicycle"] = "no";
    if (CYKLO[kind]) tags[`cycleway:${best.side >= 0 ? "left" : "right"}`] = CYKLO[kind];
    elements[i] = { ...best.w, tags }; // a copy: the cached tile keeps OSM's own tags
  }
}

// OSM around a point plus the lamps, trees, benches and bollards of the technical map, where OSM does
// not already have the same thing within 3 m, and the city's cycling measures.
async function brnoOsm(lat, lon, radius) {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const box = [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
  const [o, p, c] = await Promise.all([
    osmTiles(lat, lon, radius),
    umps(box, UMPS_POINTS).catch(() => ({})),
    query(`${BRNO_OD}/cykloopatreni_realizovana_opendata/FeatureServer/0/query`, { ...envelope(box.join(",")), outFields: "typ_opatreni" }).catch(() => ({})),
  ]);
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  addCycling(o.elements, c.features || [], kx, ky);
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

// Paid parking of Brno: the current sections of the parkovanivbrne.cz map, fetched at deploy time into
// tiles (tools/build_parkovani_brno.mjs; the map's file does not let other pages read it).
const parkTiles = new Map();
async function brnoParkovani(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const names = [];
  for (let ix = Math.floor(x0 / TILE); ix <= Math.floor(x1 / TILE); ix++) for (let iy = Math.floor(y0 / TILE); iy <= Math.floor(y1 / TILE); iy++) names.push(`${ix}_${iy}`);
  const seen = new Set(), features = [];
  for (const n of names) {
    if (!parkTiles.has(n)) staticTile(parkTiles, n, `data/brno/parkovani/${n}.json`, { features: [] });
    for (const f of (await parkTiles.get(n)).features) {
      const key = JSON.stringify(f.geometry.rings[0][0]);
      if (seen.has(key)) continue;
      seen.add(key);
      const xs = f.geometry.rings[0].map((q) => q[0]), ys = f.geometry.rings[0].map((q) => q[1]);
      if (Math.min(...xs) <= x1 && Math.max(...xs) >= x0 && Math.min(...ys) <= y1 && Math.max(...ys) >= y0) features.push(f);
    }
  }
  return { features };
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

// The special stalls (5–8) lie inside paid zones: in a zone (by the zone file, inZone) all layers
// are asked for at once; elsewhere only where the sections (3) found something, which spares IPR
// four requests per cut. As in server.mjs.
export async function parkovani(bbox, inZone, opts = {}) {
  if (town()) return town().parking(bbox);
  if (isBrno()) return brnoParkovani(bbox);
  // Prague: the no-parking sections of TSK (open data "Zákaz stání", static tiles) as features of KIND "zakaz"
  // (derive.js: no parking at that kerb), only when asked (opts.zakaz). Off by default (Bára 11. 11. 2026): they are
  // gaps of a few metres inside continuous parking (driveways, bins, trees between the stalls; 99 of 101 in Vinohrady
  // lie inside a TSK section, median length 5.6 m), below what a street profile shows.
  const [json, open] = await Promise.all([iprParking(bbox, inZone), opts.zakaz ? prahaOpendata(bbox).catch(() => null) : null]);
  const zakaz = (open?.noParking || []).map((z) => ({ attributes: { KIND: "zakaz" }, geometry: { rings: [z.ring] } }));
  return zakaz.length ? { ...json, features: [...(json.features || []), ...zakaz] } : json;
}
async function iprParking(bbox, inZone) {
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
// once by tools/build_zps.mjs (Brno: tools/build_parkovani_brno.mjs) (data/zps.json, on the web built at deploy time), so a click never asks
// IPR. Without the file the answer is unknown (undefined) and the profile falls back to TSK sections.
const ZPS_RADIUS = 100; // m
let zpsBoxes;
// The boxes [lon0, lat0, lon1, lat1] of Prague's zones, loaded once (also drawn on the map, maplayers.js); null without the file.
export const zpsZones = () => (zpsBoxes ??= fetch("data/zps.json").then((r) => (r.ok ? r.json() : null)).then((j) => j?.boxes || null, () => null));
export async function zps(lat, lon) {
  // Brno: the areas are rough outlines of whole quarters (Elišky Krásnohorské lies in 6-01 with no paid
  // section within 360 m), so the profile decides by the sections around the cut, which are current.
  if (isLive()) return undefined;
  const boxes = await zpsZones();
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
export async function vyvoj(lat, lon) {
  if (isLive()) return undefined; // Brno and the towns have no such layer: the look comes from the house alone
  const k = `${Math.floor(lon / VYVOJ_TILE)}_${Math.floor(lat / VYVOJ_TILE)}`;
  if (!vyvojTiles.has(k)) vyvojTiles.set(k, fetch(`data/vyvoj/${k}.json`).then((r) => (r.ok ? r.json() : null), () => null));
  const polys = await vyvojTiles.get(k);
  if (!polys) return undefined;
  let year = AFTER_2010;
  for (const [rok, rings] of polys) if (rok < year && insideRings(rings, lon, lat)) year = rok;
  return year;
}

export async function podlaznost(lat, lon) {
  if (town()) return town().podlaznost(lat, lon);
  if (isBrno()) return brnoPodlaznost(lat, lon);
  if (!STATIC) return getJSON(`/api/podlaznost?lat=${lat}&lon=${lon}`);
  const json = await query(PODLAZNOST, {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: PODLAZNOST_FIELDS, returnGeometry: "false", f: "json",
  });
  return podlaznostInfo(json, lat);
}
