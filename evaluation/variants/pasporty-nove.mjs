// The towns' passports found on 13.–15. 11. 2026 (Bára: A/B of the new Czech sources), laid over the national
// DTM of ČÚZK as the towns' modules do (towns/overlay.js overDmvs): the passport's surfaces where it has them,
// the DTM's elsewhere. One module for all the towns, by CITY:
//   chomutov, sumperk, roznov: T-MAPY PaKom WFS (ms:pk-pov), as Karviná;
//   litomerice: ArcGIS FeatureServer of the town (18 chodníky, 19 úseky komunikací, 2018);
//   chotebor: ArcGIS FeatureServer of the town (6 komunikace_p, 2016);
//   slapanice: ArcGIS (1 Komunikace by class, 0 Parkoviště);
//   kurim: ArcGIS lines of winter maintenance with their width (0 roads, 1 sidewalks), made areas of that width;
//   prachatice, roudnice: passports of green only (lawns, shrubs, paths and playgrounds; green polygons).
// Left out: Mohelnice and Velké Meziříčí (an empty passport on 15. 11.), Litoměřice's T-MAPY (asks to log in).
// No licence is stated by any of them (as with the T-MAPY towns already used).
//   CITY=chomutov VARIANTS=city,pasporty-nove CACHE=disk node evaluation/ab.mjs
import { query, envelope, asMtvu } from "../../pilot/public/gis.js";
import { MTVU_LABELS } from "../../pilot/public/city.js";
import { overDmvs, tmapyWfs } from "../../pilot/public/towns/overlay.js";

const none = () => ({ features: [] });
// The kinds of each passport → MTVU codes (701 roadway, 702 sidewalk, 703 cycle path, 704 parking, 1003 other
// paved); null: left to the DTM (stairs, a petrol station).
const ROAD = 701, WALK = 702, BIKE = 703, PARK = 704, OTHER = 1003;
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
// Both are kept in S-JTSK: asked in WGS 84 by the same transformation as IPR's and the towns' services (1623).
const SLAPANICE = "https://services5.arcgis.com/8F7J7ODVYrBts9AD/arcgis/rest/services/Pasport_komunikac%C3%AD_WFL1/FeatureServer";
const KURIM = "https://services6.arcgis.com/nSl4NxcJbmr0IlpX/arcgis/rest/services/zu/FeatureServer";
const PRACHATICE = "https://services1.arcgis.com/VDzFO1pOYUxTI8kx/arcgis/rest/services/PasportZelen022026_WFL1/FeatureServer";
const ROUDNICE = "https://services.arcgis.com/qiROLxpdxrEizyHD/arcgis/rest/services/Roudnice_pasport_zelene/FeatureServer/2";
const GREEN = 401, PLAY = 901, POND = 502;
// Prachatice's technical areas (169): paths and paved areas as park paths, playgrounds, water.
const PR_TECH = (a) => /^Cesty/.test(a.Typ_popis || "") ? WALK : /^Hřiště/.test(a.Typ_popis || "") ? PLAY : /Rybník|vodní plochy/.test(a.Typ_popis || "") ? POND : null;
// Kuřim's lines (paths in WGS 84) as areas of their width (m): one rectangle a segment, its ends square.
function widen(json, code) {
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
const arc = (url, fields, bbox) => query(`${url}/query`, { ...envelope(bbox), outFields: fields, datumTransformation: 1623 });

async function own(bbox) {
  const city = globalThis.PROFILY_CITY;
  if (T_MAPY[city]) {
    const t = T_MAPY[city];
    return asMtvu([[await tmapyWfs(t.base, "ms:pk-pov", bbox, "typ,msGeometry"), t.code]], MTVU_LABELS);
  }
  if (city === "litomerice") {
    const [walk, road] = await Promise.all([arc(`${LITOMERICE}/18`, "OBJECTID", bbox), arc(`${LITOMERICE}/19`, "xxxDRUH_MK", bbox)]);
    return asMtvu([[walk, WALK], [road, (a) => LT_DRUH[a.xxxDRUH_MK] ?? null]], MTVU_LABELS);
  }
  if (city === "chotebor") return asMtvu([[await arc(CHOTEBOR, "TYP", bbox), (a) => CH_TYP[a.TYP] ?? null]], MTVU_LABELS);
  if (city === "slapanice") {
    const [road, park] = await Promise.all([arc(`${SLAPANICE}/1`, "TRIDA", bbox), arc(`${SLAPANICE}/0`, "FID", bbox)]);
    return asMtvu([[road, (a) => (/chodník/.test(a.TRIDA || "") ? WALK : ROAD)], [park, PARK]], MTVU_LABELS);
  }
  if (city === "kurim") {
    const [road, walk] = await Promise.all([arc(`${KURIM}/0`, "šířka", bbox), arc(`${KURIM}/1`, "šířka", bbox)]);
    return { features: [...widen(road, ROAD).features, ...widen(walk, WALK).features] };
  }
  if (city === "prachatice") {
    const [tech, bio] = await Promise.all([arc(`${PRACHATICE}/169`, "Typ_popis", bbox), arc(`${PRACHATICE}/168`, "Druh_popis", bbox)]);
    return asMtvu([[tech, PR_TECH], [bio, GREEN]], MTVU_LABELS);
  }
  if (city === "roudnice") return asMtvu([[await arc(ROUDNICE, "KATEGORIE", bbox), (a) => (/^Lesní/.test(a.KATEGORIE || "") ? 200 : GREEN)]], MTVU_LABELS);
  return none();
}
export const about = "nové pasporty komunikací a zeleně měst (T-MAPY / ArcGIS) nad DTM ČÚZK";
export const surfaces = async (bbox) => overDmvs(await own(bbox).catch(none), bbox);
