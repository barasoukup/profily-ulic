// Switzerland and Liechtenstein (Bára 17. 11. 2026): the states of a cut inside states.json's "switzerland" and
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
import { flagsOf } from "../flags.js";
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { osmAreas } from "./slovakia.js";
import { CANTONS } from "../credits.js";
import { inside } from "../places.js";
import { ringsOf } from "./shared.js";

const flag = flagsOf("PROFILY_CH");

export const AV_WFS = "https://geodienste.ch/db/av_0/deu";
// The kinds of the survey (DM.01-AV-CH, Bodenbedeckung Art) → MTVU codes (city.js MTVU_LABELS). Strasse_Weg is the
// roadway and any path (a footpath in a park too); the profile's parts come from OSM over it (derive.js), as with
// Aachen's. A parking area has no kind of its own (in Strasse_Weg or uebrige_befestigte). Bahn is any railway (a
// station's tracks beside a street too: the hostile review), so a railway (1100); a tram's own bed comes from OSM.
export const AV_KIND = {
  Strasse_Weg: 701, Trottoir: 702, Verkehrsinsel: 1003, Bahn: 1100, uebrige_befestigte: 1003, Flugplatz: 1003, Wasserbecken: 501,
  Gebaeude: 601,
  Acker_Wiese_Weide: 401, Reben: 401, uebrige_Intensivkultur: 401, Gartenanlage: 401, Hoch_Flachmoor: 401, uebrige_humusierte: 401,
  geschlossener_Wald: 401, uebrige_bestockte: 401, Wytweide_dicht: 401, Wytweide_offen: 401,
  stehendes: 501, fliessendes: 501, Gewaesser_stehendes: 501, Gewaesser_fliessendes: 501, Schilfguertel: 401,
};
export const avCode = (p) => AV_KIND[p.Art] ?? null;
// One request a box (a cut moved a little asks the same box again): the survey's answers kept for the session, at most
// 30 (geodienste.ch fair use: 10 WFS requests a minute).
const memo = new Map();
async function av(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!memo.has(key)) {
    memo.set(key, avAsk(bbox).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
async function avAsk(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  // WFS 2.0 in EPSG:4326 with the URN: the axes lat, lon (the answer's GeoJSON is lon, lat).
  const json = await getJSON(`${AV_WFS}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "ms:LCSF",
    SRSNAME: "urn:ogc:def:crs:EPSG::4326", BBOX: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, COUNT: "3000",
    OUTPUTFORMAT: "application/json; subtype=geojson" })}`);
  const features = (json?.features || []).map((f) => {
    const g = f.geometry, p = f.properties || {};
    const rings = ringsOf(g);
    const c = avCode(p);
    if (!rings || !c) return null;
    return { attributes: { code: c, canton: p.Kanton || null }, geometry: { rings: rings.map((r) => r.map(([x, y]) => [x, y])) } };
  }).filter(Boolean);
  return { features };
}

// The kinds of a street at the cut's centre. Not uebrige_befestigte (1003): the A/B test (evaluation/switzerland/ab/)
// found it under a bridge's deck, a quay, a pier and a car park, where the survey made the whole cut one "other area".
const STREET = new Set([701, 702, 703, 704]);

async function surfaces(bbox) {
  if (flag("av") === "0") return { features: [], abroad: true };
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let own, got;
  try {
    got = await av(bbox);
    own = asMtvu([[got, (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, chFailed: true };
  }
  // Only where the survey has a surface of the street at the cut's centre (the one there decides), or, in a gap of the
  // survey, within 1.5 m of it.
  const dy = 1.5 / 110574, dx = 1.5 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at0 = got.features.findIndex((f) => inside(f.geometry.rings, cx, cy));
  const centre = at0 >= 0 ? { attributes: { CTVUK_KOD: got.features[at0].attributes.code } } : null;
  // The credit: the canton whose survey lies under the cut's centre (else the first one around).
  const canton = (got.features[at0] || got.features.find((f) => f.attributes.canton))?.attributes.canton ?? null;
  const at = centre ? STREET.has(centre.attributes.CTVUK_KOD)
    : own.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && [[dx, 0], [-dx, 0], [0, dy], [0, -dy]].some(([ox, oy]) => inside(f.geometry.rings, cx + ox, cy + oy)));
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

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: the cadastral survey of every canton and of Liechtenstein, but Vaud and Lucerne, which answer empty (by their
// NUTS 3 codes: CH011 Vaud, CH061 Luzern; "-" leaves an area out).
export const SURFACE_MAPS = ["all", "-CH011", "-CH061"];
