// Karviná: the town's road passport (pasport komunikací), passport of green and the lines of its technical
// map (UMPS) on its T-MAPY server (gis.karvina.cz, MapServer WFS 2.0, GeoJSON, CORS): surfaces of the roads
// the town keeps (roadway, sidewalk, cycle path; only part of the town: Fryštát, parts of Nové Město and
// Ráj), lawns, shrubs and hedges, fences and retaining walls, laid over the national DTM of ČÚZK
// (towns/overlay.js), with RÚIAN's buildings and parcels where the DTM has nothing. Trees, benches and lamp
// posts from the town's passports where OSM has none; floors of the buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { osmTiles, boxAround, asMtvu, addPoints, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { overDmvs, tmapyWfs } from "./overlay.js";

const KA = "https://gis.karvina.cz/services/mapserver/common";
const none = () => ({ features: [] });
// The server's Web Mercator lies within 0.1 m of RÚIAN here: no shift.
const wfs = (base, type, bbox, props) => tmapyWfs(base, type, bbox, props);

// Kinds of the passport's surfaces (typ) → MTVU codes.
const PAKOM = { komunikace: 701, chodník: 702, cyklostezka: 703, ostatní: 1003 };
const greenCode = (a) => (/Cesty|Hřiště|Pískoviště|bez vegetačního/.test(a.druh_nazev || "") ? null : 401);

// The passports' surfaces alone (MTVU features: the roads, and the green under the DTM), and over the national DTM.
export async function own(bbox) {
  const [pakom, green] = await Promise.all([
    wfs(`${KA}/pakom`, "ms:pk-pov", bbox, "typ,msGeometry"),
    wfs(`${KA}/pazel`, "ms:pz-p-ver", bbox, "druh_nazev,msGeometry").catch(none),
  ]);
  return { passport: asMtvu([[pakom, (a) => PAKOM[a.typ] ?? null]], MTVU_LABELS), green: asMtvu([[green, greenCode]], MTVU_LABELS) };
}
const surfaces = async (bbox) => { const o = await own(bbox); return overDmvs(o.passport, bbox, o.green); };

// Lines of the technical map (UMPS; the kind only in the first words of the HTML note) → the codes of IPR's
// line layer (derive.js FENCE_LINES and TECH_ITEM): fences and walls end the street, a retaining wall is an
// item, railings and guard rails split.
const LINE_CODES = [[/^Plot/, 61210], [/opěr/, 71422], [/^Linie zdi|^Zeď|protihluk/, 71210], [/^Zábradlí/, 61530], [/^Svodidl/, 71522]];
async function lines(bbox) {
  const json = await wfs(`${KA}/dtmm`, "ms:dtm-umps-l", bbox, "poznamka,msGeometry");
  const features = [];
  for (const f of json.features) {
    const kind = (f.attributes.poznamka || "").split("<")[0].trim();
    const code = LINE_CODES.find(([re]) => re.test(kind))?.[1];
    if (code && f.geometry.paths) features.push({ attributes: { CTMTP_KOD: code }, geometry: f.geometry });
  }
  return { features };
}
// The passport's parking areas carry no orientation: the DTM's car parks and OSM's tags give the parking.
const parking = async () => none();

// OSM around a point plus the town's trees, benches and lamp posts where OSM has none nearby.
const KA_POINTS = [
  [`${KA}/pazel`, "ms:pz-biob-ver", "druh_nazev", (a) => (/strom/i.test(a.druh_nazev || "") ? { natural: "tree" } : null)],
  [`${KA}/pamob`, "ms:mob-nab-all", "typ", () => ({ amenity: "bench" })],
  [`${KA}/paosv`, "ms:osv-sto-s", "pocet_lamp", () => ({ highway: "street_lamp" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, Math.min(radius, 50));
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...KA_POINTS.map(([base, type, props]) => wfs(base, type, box, `${props},msGeometry`).catch(none)),
  ]);
  return addPoints(o, pts, KA_POINTS.map(([, , , tagsOf]) => tagsOf), "Karviná", lat);
}

export const sources = { osm, surfaces, lines, parking, podlaznost: ruianBuilding };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";
// No base maps of its own (the national ones show the town); the orthophoto of the evaluation is ČÚZK's.
export const ortho = null;
// The surfaces already include the national DTM (towns/overlay.js): sources.js must not ask it again.
export const national = true;
