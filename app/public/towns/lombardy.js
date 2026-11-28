// Lombardy (Bára 24. 11. 2026: a surface map is better for us than an orthophoto): Regione Lombardia's Database
// Topografico Regionale (DBT, 1 : 1 000 in the towns, 1 : 2 000 elsewhere; every one of the region's 1 502 comuni,
// surveyed 2005–2022; CC BY 4.0, "Dati di proprietà di Regione Lombardia", the Geoportale's record
// r_lombar:1CE0E71B-6451-4B5D-8E4D-BC0FF6E0A46F; evaluation/italy/lombardia/REPORT.md). Its ArcGIS MapServer
// (BaseMap/dbtr, CORS for the asking origin) gives no geometry to a query (returnGeometry is ignored: the layers have Z),
// but identify does: one request for all the layers of the cut's box, in WGS 84 (the service is in WGS 84 / UTM 32N,
// no datum shift). The areas of the cut as MTVU in Prague, as Vienna's FMZK (towns/austria.js): roadways, sidewalks,
// cycle tracks, parking strips, islands, tram beds, green, courtyards, water, buildings. Only where the map has a surface
// of the street at the cut's centre or 1.5 m around it (elsewhere the estimate from OSM; Lombardy has no orthophoto with
// an open licence: AGEA's). ?lombardia=0 leaves it out (the A/B test).
import { flagsOf } from "../flags.js";
import { getJSON, asMtvu, osmTiles } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const flag = flagsOf("PROFILY_IT");
export const DBT = "https://www.cartografia.servizirl.it/arcgis2/rest/services/BaseMap/dbtr/MapServer";
// The region (its box and inLombardy) in towns/lombardy-area.js, a module without imports: lanes-ortho.js keeps
// Bolzano's orthophoto out of it (the review of 24. 11. 2026: Ponte di Legno and Valfurva asked Bolzano's WMS).
import { LOMBARDY_BOX, inLombardy } from "./lombardy-area.js";
export { LOMBARDY_BOX, inLombardy };

// The layers (identify's layerId) in the order of precedence (the first surface at a point wins, derive.js classify):
// the walkways under porticoes before the buildings (a portico is the street's, as Vienna's arcades), then the
// buildings, the street's own surfaces, the rest.
const PORTICO = 1050; // 105 with ZONA "area a porticato" (a code of this module only)
export const LAYERS = [97, 99, 106, 105, 103, 114, 101, 113, 109, 110, 87, 84, 90];
const under = (a) => /sotterran|galleria|interrat/i.test(a.SEDE || "");
// A DBT feature (identify's layerId, attributes by their aliases) → an MTVU code (city.js MTVU_LABELS), null for none.
export function dbtCode(layer, a) {
  const zona = String(a.ZONA || ""), tipo = String(a.TIPO || "");
  switch (layer) {
    case 97: return /edificio/i.test(a.cr_edf_ct || "edificio") ? 601 : 602; // corpo edificato (a canopy, a shed: 602)
    case 99: return 602; // edificio minore
    case 106: // area di circolazione veicolare
      if (under(a)) return null;
      if (/sosta|parcheggio/i.test(zona)) return 704; // fascia di sosta laterale, piazzola di sosta, parcheggio
      if (/isol/i.test(zona)) return 1003; // isole di traffico a raso
      if (/pertinenza/i.test(zona)) return 1003; // the driveways and yards of a property, not the street
      return 701; // tronco carreggiata, incroci, rotatorie, piazze, banchine, golfi di fermata
    case 105: // area di circolazione pedonale
      if (under(a) && !/galleria pedonale/i.test(zona)) return null;
      // A portico's walkway (not a covered gallery inside a block: Galleria del Toro in the A/B, 55 m of sidewalk).
      if (/porticato/i.test(zona)) return PORTICO;
      return /salvagente/i.test(zona) ? 1003 : 702;
    case 103: return under(a) ? null : 703; // area di circolazione ciclabile
    // Sede di trasporto su ferro: tram beds and railways alike (TIPO mostly empty): a railway, a tram bed where OSM has
    // a tram track in it (trams()). The A/B: Brescia's station drawn as a tram bed with platforms.
    case 114: return under(a) ? null : 1100;
    case 101: return /giardino/i.test(tipo) ? 402 : 401; // area verde: aiuola, prato, siepe, alberi / giardino
    case 113: return /altro/i.test(tipo) ? 1003 : 603; // area attrezzata del suolo: cortile, corte, cavedio, spazio interno
    case 109: case 110: return 501; // water
    case 87: return 901; // attrezzature sportive
    case 84: case 90: return 602; // monuments and street furniture, walls
    default: return null;
  }
}
// The street's own surfaces: one of them at the cut's centre makes the map the cut's.
const STREET = new Set([701, 702, 703, 704, 705, 1003]);

// identify → ESRI-like features { layer, attributes, geometry: { rings } } (WGS 84). One image of 0.2 m a pixel in the
// box so that every scale-dependent layer draws (105 only to 1 : 2 000).
export async function dbtFeatures(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const w = Math.min(4000, Math.max(200, Math.round(((x1 - x0) * 111320 * Math.cos((((y0 + y1) / 2) * Math.PI) / 180)) / 0.2)));
  const h = Math.min(4000, Math.max(200, Math.round(((y1 - y0) * 110574) / 0.2)));
  const json = await getJSON(`${DBT}/identify?${new URLSearchParams({
    geometry: bbox, geometryType: "esriGeometryEnvelope", sr: "4326", layers: `all:${LAYERS}`, tolerance: "0",
    mapExtent: bbox, imageDisplay: `${w},${h},96`, returnGeometry: "true", returnZ: "false", returnM: "false", f: "json",
  })}`);
  return (json.results || []).filter((r) => r.geometry?.rings).map((r) => ({ layer: r.layerId, attributes: r.attributes || {}, geometry: { rings: r.geometry.rings } }));
}

// The features as MTVU surfaces in the order of precedence.
export function dbtSurfaces(feats) {
  const coded = feats.map((f) => ({ ...f, code: dbtCode(f.layer, f.attributes) })).filter((f) => f.code);
  const rank = (f) => (f.code === PORTICO ? -1 : LAYERS.indexOf(f.layer));
  coded.sort((a, b) => rank(a) - rank(b));
  return asMtvu([[{ features: coded.map((f) => ({ attributes: { c: f.code === PORTICO ? 702 : f.code }, geometry: f.geometry })) }, (a) => a.c]], MTVU_LABELS);
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// The beds of railways (1100) with an OSM tram track inside (a point of it) are tram beds (705).
export function trams(out, osm) {
  const rails = (osm?.elements || []).filter((e) => e.type === "way" && e.tags?.railway === "tram" && e.geometry && !(Number(e.tags.layer) < 0) && e.tags.tunnel !== "yes");
  for (const f of out.features) {
    if (f.attributes.CTVUK_KOD !== 1100) continue;
    if (rails.some((w) => w.geometry.some((g) => inRings(f.geometry.rings, g.lon, g.lat)))) Object.assign(f.attributes, { CTVUK_KOD: 705, CTVUK_POPIS: MTVU_LABELS[705] });
  }
  return out;
}
// Does the map have a surface of the street at the box's centre or 1.5 m around it?
export function streetAtCentre(out, cx, cy) {
  const dy = 1.5 / 110574, dx = 1.5 / (111320 * Math.cos((cy * Math.PI) / 180));
  return out.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && [[0, 0], [dx, 0], [-dx, 0], [0, dy], [0, -dy]].some(([ox, oy]) => inRings(f.geometry.rings, cx + ox, cy + oy)));
}

const memo = new Map();
export async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (flag("lombardia") === "0" || !inLombardy(cx, cy)) return null;
  const key = bbox.split(",").map((v) => (+v).toFixed(5)).join(",");
  let out;
  try {
    if (!memo.has(key)) {
      memo.set(key, dbtFeatures(bbox).then(dbtSurfaces).catch((err) => { memo.delete(key); throw err; }));
      if (memo.size > 20) memo.delete(memo.keys().next().value);
    }
    out = await memo.get(key);
  } catch {
    return { features: [], abroad: true, itFailed: "lombardia" };
  }
  if (!streetAtCentre(out, cx, cy)) return { features: [], abroad: true };
  const copy = { features: out.features.map((f) => ({ ...f, attributes: { ...f.attributes } })) };
  if (copy.features.some((f) => f.attributes.CTVUK_KOD === 1100)) {
    const r = Math.max((x1 - x0) * 111320 * Math.cos((cy * Math.PI) / 180), (y1 - y0) * 110574) / 2;
    trams(copy, await osmTiles(cy, cx, r).catch(() => null));
  }
  return { ...copy, itTown: "lombardia" };
}

// inside: the region within its box (only the overview map of tools/build_coverage.mjs reads it; placeAt takes the box).
export const AREAS = { lombardia: { box: LOMBARDY_BOX, inside: inLombardy } };
