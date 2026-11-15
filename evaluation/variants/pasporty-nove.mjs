// The towns' road passports found on 13.–15. 11. 2026 (Bára: A/B of the new Czech sources), laid over the
// national DTM of ČÚZK as the towns' modules do (towns/overlay.js overDmvs): the passport's surfaces where it
// has them, the DTM's elsewhere. One module for four towns, by CITY:
//   chomutov, sumperk: T-MAPY PaKom WFS (ms:pk-pov), as Karviná;
//   litomerice: ArcGIS FeatureServer of the town (18 chodníky, 19 úseky komunikací, 2018);
//   chotebor: ArcGIS FeatureServer of the town (6 komunikace_p, 2016).
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
};
const LITOMERICE = "https://services1.arcgis.com/mTfRiT2AnnZ0WMqk/arcgis/rest/services/Komunikace/FeatureServer";
const LT_DRUH = { vozovka: ROAD, "park. plocha": PARK, zastávka: ROAD, "mosty a lávky": ROAD };
const CHOTEBOR = "https://services.arcgis.com/qiROLxpdxrEizyHD/arcgis/rest/services/Komunikace___Chot%C4%9Bbo%C5%99_WFL1/FeatureServer/6";
const CH_TYP = { vozovka: ROAD, zivice: ROAD, kruhovy_objezd: ROAD, okruzni_kriz: ROAD, prejezd: ROAD, zel_prejezd: ROAD, sjezd: ROAD,
  bus_zastavka: ROAD, obytzona: ROAD, parkoviste: PARK, chodnik: WALK };
// Both are kept in S-JTSK: asked in WGS 84 by the same transformation as IPR's and the towns' services (1623).
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
  return none();
}
export const about = "nové pasporty komunikací měst (T-MAPY / ArcGIS) nad DTM ČÚZK";
export const surfaces = async (bbox) => overDmvs(await own(bbox).catch(none), bbox);
