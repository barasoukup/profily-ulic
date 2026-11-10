// Ostrava: the city's GIS (mapy.ostrava.cz, ArcGIS, CORS) holds its technical map as surfaces (Polohopis DTM –
// generalizace: roadway, sidewalk, paved areas, green, buildings, walls, bridges… by the key of the city's DTM,
// field POPIS; surveyed 1996–2019, imported 12/2019), the axes of the tram tracks and the sections of the
// streets with paid parking. Floors of the buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { query, envelope, osmTiles, asMtvu, insideRings, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const OV = "https://mapy.ostrava.cz/arcgisserver/rest/services";
const OV_DTM = `${OV}/MAPPA/Polohopis_DTM_generalizace/MapServer/0/query`;
const OV_TRAM = `${OV}/BaseMap/podkladova_mapa_OSTRAVA/MapServer/25/query`;
const OV_PARKING = `${OV}/SMO/parkovaci_mista/MapServer/9/query`;
// The city's services turn S-JTSK into WGS 84 by 15965 by default, 1.5 m west of OSM: answers come with
// S_JTSK_To_WGS_1984_1 (1623), within 0.1 m of OSM's buildings.
const ovQuery = (url, params) => query(url, { ...params, datumTransformation: 1623 });
const none = () => ({ features: [] });

// The DTM is asked once per cut for the surfaces and again for the walls and fences.
const dtmCache = new Map();
const dtm = (bbox) => {
  if (!dtmCache.has(bbox)) {
    if (dtmCache.size > 8) dtmCache.delete(dtmCache.keys().next().value);
    dtmCache.set(bbox, ovQuery(OV_DTM, { ...envelope(bbox), outFields: "POPIS" }).catch((err) => { dtmCache.delete(bbox); throw err; }));
  }
  return dtmCache.get(bbox);
};

// Kinds of the DTM (POPIS) → MTVU codes; the first that matches. Curbs, gutters, joints, footings, manholes
// and the like are left out (the surface around them goes on). "Nevyhodnocená plocha" is left open.
const OV_CODES = [
  [/^Budova podchodná|^Podchod/, null],
  [/^Budova|^Kostel|^Synagoga|^Zvonice|^Skleník|^Elektrárna|^Čistírna|^Průmyslová nádrž/, 601],
  [/^Komunikace|^Most|^Příčný práh/, 701],
  [/^Chodník|^Schody|^Podesty|^Vstupní nájezdová|^Přístřešek|^Výtah v chodníku|^Okapový/, 702],
  [/^Zpevněná plocha|^Zpevněný|^Nakládací|^Váha/, 1003],
  [/^Nádvoří|^Anglický dvorek|^Světlík/, 603],
  [/^Zahrada|^Ovocný sad/, 300],
  [/^Park|^Květinový|^Keřová|^Skupina|^Neudržovaná|^Louka|^Neplodná/, 401],
  [/^Hřbitov|^Hrob/, 402],
  [/^Lesní půda|^Les /, 200], [/^Orná/, 100],
  [/^Hřiště|^Bazén/, 901],
  [/^Vodní tok|^Močál/, 501], [/^Vodní nádrž|^Požární nádrž|^Kašna/, 502],
  [/^Zeď|^Okrasná zídka|^Plot zděný|^Podezdívka|^Pilíř|^Zděný sloupek|^Pomník|^Plastika|^Vysoký komín|^Zbořeniště/, 602],
];
const popis = (a) => (a.POPIS || "").trim();
const code = (a) => { const t = popis(a); const hit = OV_CODES.find(([re]) => re.test(t)); return hit ? hit[1] : null; };

// The DTM draws a tram track off the road as a paved area ("Zpevněná plocha"): one with a tram axis of the
// city's map in it is a tram track (705), as IPR's MTVU has it (č. 23 28. října, č. 43 Výškovická).
const tram = (bbox) => ovQuery(OV_TRAM, { ...envelope(bbox), outFields: "OBJECTID" }).catch(none);
async function surfaces(bbox) {
  const [d, t] = await Promise.all([dtm(bbox), tram(bbox)]);
  const axes = (t.features || []).flatMap((f) => f.geometry?.paths || []);
  // Points along the axes every 2 m or so (vertices and midpoints).
  const pts = axes.flatMap((p) => p.flatMap((q, i) => (i ? [[(q[0] + p[i - 1][0]) / 2, (q[1] + p[i - 1][1]) / 2], q] : [q])));
  const onTrack = (f) => pts.some(([x, y]) => insideRings(f.geometry.rings, x, y));
  const out = asMtvu([[d, code]], MTVU_LABELS);
  for (const f of out.features) {
    if (f.attributes.CTVUK_KOD === 1003 && pts.length && onTrack(f)) Object.assign(f.attributes, { CTVUK_KOD: 705, CTVUK_POPIS: MTVU_LABELS[705] });
  }
  return out;
}

// Walls and fences of the DTM (polygons) → the codes of IPR's line layer (derive.js FENCE_LINES and TECH_ITEM),
// their outlines crossing the cut where they stand; the tram tracks' axes as IPR's (55010).
const OV_LINE_CODES = [[/^Plot zděný|^Podezdívka/, 61210], [/^Zeď opěrná/, 71422], [/^Zeď|^Okrasná zídka/, 71210]];
async function lines(bbox) {
  const [d, t] = await Promise.all([dtm(bbox), tram(bbox)]);
  const features = [];
  for (const f of d.features || []) {
    const c = OV_LINE_CODES.find(([re]) => re.test(popis(f.attributes || {})))?.[1];
    if (c && f.geometry?.rings) features.push({ attributes: { CTMTP_KOD: c }, geometry: { paths: f.geometry.rings } });
  }
  for (const f of t.features || []) if (f.geometry?.paths) features.push({ attributes: { CTMTP_KOD: 55010 }, geometry: f.geometry });
  return { features };
}

// Sections of the streets with paid parking (by ticket), strips along the curb as deep as the stalls:
// derive.js reads the orientation from the depth.
async function parking(bbox) {
  const json = await ovQuery(OV_PARKING, { ...envelope(bbox), outFields: "OBJECTID" });
  return { features: (json.features || []).filter((f) => f.geometry?.rings).map((f) => ({ attributes: { KIND: "useky", PS_ZPS: 1 }, geometry: f.geometry })) };
}

const osm = (lat, lon, radius) => osmTiles(lat, lon, radius);

export const sources = { osm, surfaces, lines, parking, podlaznost: ruianBuilding };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";
// No base maps of its own yet (the national ones show the city); the orthophoto of the evaluation is ČÚZK's.
// Where the city's map has nothing (outlying parts), sources.js asks the national DTM.
export const ortho = null;
