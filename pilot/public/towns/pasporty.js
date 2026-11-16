// The road and green passports of towns without a city module of their own (found 13.–15. 11. 2026; Bára
// 16. 11. 2026: in the app before their A/B test, which waits for the DMVS outage of 12.–18. 11. to end, see
// evaluation/PASPORTY-AB.md). Anywhere else in the Czech Republic ("cesko"), a cut inside one of these towns
// (pasporty.json, tools/build_pasporty.mjs) takes the passport's surfaces and the national DTM of ČÚZK
// elsewhere, as the towns' modules do (towns/overlay.js overDmvs):
//   chomutov, sumperk, roznov: T-MAPY PaKom WFS (ms:pk-pov), as Karviná;
//   litomerice: ArcGIS FeatureServer of the town (18 chodníky, 19 úseky komunikací, 2018);
//   chotebor: ArcGIS FeatureServer of the town (6 komunikace_p, 2016);
//   slapanice: ArcGIS (1 Komunikace by class, 0 Parkoviště);
//   kurim: ArcGIS lines of winter maintenance with their width (0 roads, 1 sidewalks), made areas of that width;
//   prachatice, roudnice: passports of green only (lawns, shrubs, paths and playgrounds; green polygons).
// Left out: Mohelnice and Velké Meziříčí (an empty passport on 15. 11.), Litoměřice's T-MAPY (asks to log in).
// No licence is stated by any of them (as with the T-MAPY towns already used).
import { query, envelope, asMtvu, asPassport, insideRings } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { overDmvs, tmapyWfs } from "./overlay.js";
export { PASSPORT_NAMES } from "./pasporty-names.js";

// RÚIAN codes of the towns (tools/build_pasporty.mjs); their names in pasporty-names.js.
export const PASSPORT_CODES = { chomutov: 562971, sumperk: 523704, roznov: 544841, litomerice: 564567, chotebor: 568759,
  slapanice: 583952, kurim: 583251, prachatice: 550094, roudnice: 565555 };
// The hosts the page asks (index.html CSP, tests/city.test.js).
export const PASSPORT_HOSTS = ["https://gis.chomutov.cz", "https://gis.sumperk.cz", "https://mapy.roznov.cz", "https://services.arcgis.com",
  "https://services1.arcgis.com", "https://services5.arcgis.com", "https://services6.arcgis.com"];

const none = () => ({ features: [] });
// The kinds of each passport → MTVU codes (701 roadway, 702 sidewalk or park path, 703 cycle path, 704 parking,
// 1003 other paved, 401 green, 200 wood, 901 playground, 502 pond); null: left to the DTM (stairs, a petrol station).
const ROAD = 701, WALK = 702, BIKE = 703, PARK = 704, OTHER = 1003, GREEN = 401, WOOD = 200, PLAY = 901, POND = 502;
const T_MAPY = {
  chomutov: { base: "https://gis.chomutov.cz/services/mapserver/common/pakom",
    // Most roadways carry their class (MK II.–IV., Účelová komunikace, Silnice) as their kind.
    code: (a) => /^chodník/i.test(a.typ) ? WALK : /^parkovi/i.test(a.typ) ? PARK : /^cyklo/i.test(a.typ) ? BIKE : /^ostatní/i.test(a.typ) ? OTHER
      : /^(vozovka|MK|účelová|silnice)/i.test(a.typ || "") ? ROAD : null },
  sumperk: { base: "https://gis.sumperk.cz/services/mapserver/common/pakom",
    code: (a) => ({ chodník: WALK, "pěší zóna": WALK, nástupiště: WALK, "chodník/cyklostezka": BIKE, cyklostezka: BIKE, komunikace: ROAD, most: ROAD, ostatní: OTHER })[a.typ] ?? null },
  roznov: { base: "https://mapy.roznov.cz/services/mapserver/common/pakom",
    code: (a) => ({ chodník: WALK, cyklostezka: BIKE, komunikace: ROAD, ostatní: OTHER })[a.typ] ?? null },
};
const LITOMERICE = "https://services1.arcgis.com/mTfRiT2AnnZ0WMqk/arcgis/rest/services/Komunikace/FeatureServer";
const LT_DRUH = { vozovka: ROAD, "park. plocha": PARK, zastávka: ROAD, "mosty a lávky": ROAD };
const CHOTEBOR = "https://services.arcgis.com/qiROLxpdxrEizyHD/arcgis/rest/services/Komunikace___Chot%C4%9Bbo%C5%99_WFL1/FeatureServer/6";
const CH_TYP = { vozovka: ROAD, zivice: ROAD, kruhovy_objezd: ROAD, okruzni_kriz: ROAD, prejezd: ROAD, zel_prejezd: ROAD, sjezd: ROAD,
  bus_zastavka: ROAD, obytzona: ROAD, parkoviste: PARK, chodnik: WALK };
const SLAPANICE = "https://services5.arcgis.com/8F7J7ODVYrBts9AD/arcgis/rest/services/Pasport_komunikac%C3%AD_WFL1/FeatureServer";
const KURIM = "https://services6.arcgis.com/nSl4NxcJbmr0IlpX/arcgis/rest/services/zu/FeatureServer";
const PRACHATICE = "https://services1.arcgis.com/VDzFO1pOYUxTI8kx/arcgis/rest/services/PasportZelen022026_WFL1/FeatureServer";
const ROUDNICE = "https://services.arcgis.com/qiROLxpdxrEizyHD/arcgis/rest/services/Roudnice_pasport_zelene/FeatureServer/2";
// Prachatice's technical areas (169): paths and paved areas as park paths, playgrounds, water.
export const prTech = (a) => /^Cesty/.test(a.Typ_popis || "") ? WALK : /^Hřiště/.test(a.Typ_popis || "") ? PLAY : /Rybník|vodní plochy/.test(a.Typ_popis || "") ? POND : null;
export const codes = { chomutov: T_MAPY.chomutov.code, sumperk: T_MAPY.sumperk.code, roznov: T_MAPY.roznov.code };

// Kuřim's lines (paths in WGS 84) as areas of their width (m): one rectangle a segment, its ends square.
export function widen(json, code) {
  const features = [];
  for (const f of json.features || []) {
    const w = Number(f.attributes?.["šířka"]);
    if (!(w > 0) || !f.geometry?.paths) continue;
    for (const path of f.geometry.paths) for (let i = 0; i + 1 < path.length; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1];
      const kx = 111320 * Math.cos((y0 * Math.PI) / 180), ky = 110574;
      const dx = (x1 - x0) * kx, dy = (y1 - y0) * ky, len = Math.hypot(dx, dy) || 1;
      const ox = ((-dy / len) * w) / 2 / kx, oy = ((dx / len) * w) / 2 / ky;
      features.push({ attributes: {}, geometry: { rings: [[[x0 + ox, y0 + oy], [x1 + ox, y1 + oy], [x1 - ox, y1 - oy], [x0 - ox, y0 - oy], [x0 + ox, y0 + oy]]] } });
    }
  }
  return asMtvu([[{ features }, code]], MTVU_LABELS);
}
// The ArcGIS ones are kept in S-JTSK: asked in WGS 84 by the same transformation as IPR's and the towns' (1623).
const arc = (url, fields, bbox) => query(`${url}/query`, { ...envelope(bbox), outFields: fields, datumTransformation: 1623 });

// The passport's surfaces of a town in a box (MTVU features).
export async function passport(id, bbox) {
  if (T_MAPY[id]) return asMtvu([[await tmapyWfs(T_MAPY[id].base, "ms:pk-pov", bbox, "typ,msGeometry"), T_MAPY[id].code]], MTVU_LABELS);
  if (id === "litomerice") {
    const [walk, road] = await Promise.all([arc(`${LITOMERICE}/18`, "OBJECTID", bbox), arc(`${LITOMERICE}/19`, "xxxDRUH_MK", bbox)]);
    return asMtvu([[walk, WALK], [road, (a) => LT_DRUH[a.xxxDRUH_MK] ?? null]], MTVU_LABELS);
  }
  if (id === "chotebor") return asMtvu([[await arc(CHOTEBOR, "TYP", bbox), (a) => CH_TYP[a.TYP] ?? null]], MTVU_LABELS);
  if (id === "slapanice") {
    const [road, park] = await Promise.all([arc(`${SLAPANICE}/1`, "TRIDA", bbox), arc(`${SLAPANICE}/0`, "FID", bbox)]);
    return asMtvu([[road, (a) => (/chodník/.test(a.TRIDA || "") ? WALK : ROAD)], [park, PARK]], MTVU_LABELS);
  }
  if (id === "kurim") {
    const [road, walk] = await Promise.all([arc(`${KURIM}/0`, "šířka", bbox), arc(`${KURIM}/1`, "šířka", bbox)]);
    return { features: [...widen(road, ROAD).features, ...widen(walk, WALK).features] };
  }
  if (id === "prachatice") {
    const [tech, bio] = await Promise.all([arc(`${PRACHATICE}/169`, "Typ_popis", bbox), arc(`${PRACHATICE}/168`, "Druh_popis", bbox)]);
    return asMtvu([[tech, prTech], [bio, GREEN]], MTVU_LABELS);
  }
  if (id === "roudnice") return asMtvu([[await arc(ROUDNICE, "KATEGORIE", bbox), (a) => (/^Lesní/.test(a.KATEGORIE || "") ? WOOD : GREEN)]], MTVU_LABELS);
  return none();
}

// The town of a point (pasporty.json, loaded once; in Node, as the evaluation runs, from the file).
let bounds;
async function loadBounds() {
  const url = new URL("../pasporty.json", import.meta.url);
  try {
    bounds = url.protocol === "file:" ? JSON.parse((await import("node:fs")).readFileSync(url, "utf8")) : await fetch(url).then((r) => r.json());
  } catch { bounds = {}; }
  return bounds;
}
export async function passportAt(lon, lat) {
  const b = bounds || (await loadBounds());
  return Object.keys(b).find((id) => insideRings(b[id], lon, lat)) || null;
}

// The surfaces of a box: the passport of its town over the national DTM (which surfaces gives), or the DTM alone.
// The answer names the town (passport) for the export's credits (app.js, city.js creditLines).
export function withPassports(surfaces) {
  return async (bbox) => {
    const [x0, y0, x1, y1] = bbox.split(",").map(Number);
    const id = await passportAt((x0 + x1) / 2, (y0 + y1) / 2);
    if (!id) return surfaces(bbox);
    const own = asPassport(await passport(id, bbox).catch(none));
    if (!own.features.length) return surfaces(bbox);
    return { ...(await overDmvs(own, bbox)), passport: id };
  };
}
