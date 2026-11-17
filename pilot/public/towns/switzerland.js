// Switzerland and Liechtenstein (Bára 17. 11. 2026): the states of a cut inside staty.json's "switzerland" and
// "liechtenstein". As in Austria and Germany, no Czech technical map, RÚIAN or ČÚZK orthophoto is asked: the profile is
// the estimate from OSM and swisstopo's SWISSIMAGE (app.js, ortho-osm.js, lanes-ortho.js "ch"), unless the official
// cadastral survey has the street.
// - Amtliche Vermessung, Bodenbedeckung (the land cover of the official cadastral survey, DM.01 "LCSF"): every canton's
//   and Liechtenstein's survey in one WFS of the cantons' conference (geodienste.ch, CORS *, GeoJSON in WGS 84). Its
//   kinds: Strasse_Weg (roadway and paths), Trottoir, Verkehrsinsel, Bahn, Gebaeude, uebrige_befestigte, the green and
//   the water. Some cantons do not share it freely (Vaud and Lucerne answered empty, 17. 11. 2026): the estimate there.
//   The use as each canton's terms say (geodienste.ch Betriebsbestimmungen, "fair use": 10 requests a minute for a
//   WFS, a web application of about 10 000 users a day is fair use). ?av=0 leaves it out (the A/B test).
// As in Germany's city maps: the survey's surfaces with OSM's green and water after them, the survey's own buildings
// (a building of the survey, Gebaeude, is the land registry's footprint) before them, only where the survey has a
// surface of the street at the cut's centre (elsewhere the estimate); a survey that does not answer: the estimate, with
// a note.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { osmAreas } from "./slovensko.js";
import { CANTONS } from "../credits.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_CH?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const AV_WFS = "https://geodienste.ch/db/av_0/deu";
// The kinds of the survey (DM.01-AV-CH, Bodenbedeckung Art) → MTVU codes (city.js MTVU_LABELS). Strasse_Weg is the
// roadway and any path (a footpath in a park too); the profile's parts come from OSM over it (derive.js), as with
// Aachen's. A parking area has no kind of its own (in Strasse_Weg or uebrige_befestigte). Bahn is a railway or a tram
// on its own bed (a tram in the street lies in Strasse_Weg).
export const AV_KIND = {
  Strasse_Weg: 701, Trottoir: 702, Verkehrsinsel: 1003, Bahn: 705, uebrige_befestigte: 1003, Flugplatz: 1003, Wasserbecken: 501,
  Gebaeude: 601,
  Acker_Wiese_Weide: 401, Reben: 401, uebrige_Intensivkultur: 401, Gartenanlage: 401, Hoch_Flachmoor: 401, uebrige_humusierte: 401,
  geschlossener_Wald: 401, uebrige_bestockte: 401, Wytweide_dicht: 401, Wytweide_offen: 401,
  stehendes: 501, fliessendes: 501, Gewaesser_stehendes: 501, Gewaesser_fliessendes: 501, Schilfguertel: 401,
};
export const avCode = (p) => AV_KIND[p.Art] ?? null;
async function av(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  // WFS 2.0 in EPSG:4326 with the URN: the axes lat, lon (the answer's GeoJSON is lon, lat).
  const json = await getJSON(`${AV_WFS}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "ms:LCSF",
    SRSNAME: "urn:ogc:def:crs:EPSG::4326", BBOX: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, COUNT: "3000",
    OUTPUTFORMAT: "application/json; subtype=geojson" })}`);
  const cantons = new Map();
  const features = (json?.features || []).map((f) => {
    const g = f.geometry, p = f.properties || {};
    const rings = g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null;
    const c = avCode(p);
    if (!rings || !c) return null;
    if (p.Kanton) cantons.set(p.Kanton, (cantons.get(p.Kanton) || 0) + 1);
    return { attributes: { code: c }, geometry: { rings: rings.map((r) => r.map(([x, y]) => [x, y])) } };
  }).filter(Boolean);
  // The canton with most of the box (its credit).
  const canton = [...cantons].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { features, canton };
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const STREET = new Set([701, 702, 703, 704, 705, 1003]);

async function surfaces(bbox) {
  if (param("av") === "0") return { features: [], abroad: true };
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let own, canton;
  try {
    const got = await av(bbox);
    canton = got.canton;
    own = asMtvu([[got, (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, chFailed: true };
  }
  // Only where the survey has a surface of the street at the cut's centre or 1.5 m around it.
  const dy = 1.5 / 110574, dx = 1.5 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at = own.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && [[0, 0], [dx, 0], [-dx, 0], [0, dy], [0, -dy]].some(([ox, oy]) => inRings(f.geometry.rings, cx + ox, cy + oy)));
  if (!at) return { features: [], abroad: true };
  // The survey's buildings stand; OSM's green and water fill what the survey leaves (it covers all land, so little).
  const o = await osmAreas(bbox);
  return { features: [...asPassport(own).features, ...o.rest], chAv: CANTONS.includes(canton) ? canton : "CH", passport: true };
}

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
}

export const sources = {
  osm,
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
