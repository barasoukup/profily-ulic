// Ústí nad Labem: the surfaces as anywhere in the Czech Republic (the national DTM of ČÚZK, nearly
// complete in the Ústí region, dmvs.js via towns/cesko.js), plus the town's parking places from its GIS
// (mapy.usti.cz, ArcGIS Enterprise, CORS): Doprava/Parkovaci_zony_UL layer 3 "Parkovací místo", one polygon
// per row of stalls, kept current (AKTUALIZACE 2026), about 435 rows in and around the paid zones of the
// centre. DOPRAVNI_ZNACENI: 0 podélné, 1 kolmé, 2 šikmé, 3 parkovací pruh, 4 vyhrazené, 5 ZTP,
// 6 časově omezené, 7 bez značení; derive.js reads the orientation from the polygon's depth.
// A/B over the orthophoto (evaluation/variants/usti-stani.mjs, 36 cuts at the stalls): better 6, worse 1, as good 3.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { query, envelope } from "../gis.js";
import { sources as cesko } from "./pardubice.js";

const UL_PARKING = "https://mapy.usti.cz/server/rest/services/Doprava/Parkovaci_zony_UL/MapServer/3/query";

// The service turns S-JTSK into WGS 84 by its default transformation about 12 m off OSM and ČÚZK:
// answers with S_JTSK_To_WGS_1984_1 (1623), as in Jihlava, Opava and Plzeň.
async function parking(bbox) {
  const json = await query(UL_PARKING, { ...envelope(bbox), outFields: "DOPRAVNI_ZNACENI", datumTransformation: 1623 });
  const features = [];
  for (const f of json.features || []) {
    if (!f.geometry?.rings) continue;
    const z = String(f.attributes?.DOPRAVNI_ZNACENI ?? "");
    const kind = z === "5" ? "ztp" : z === "4" ? "specialni" : "useky";
    features.push({ attributes: { KIND: kind, PS_ZPS: 1 }, geometry: f.geometry });
  }
  return { features };
}

export const sources = { ...cesko, parking };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";

// The orthophoto for the evaluation: ČÚZK's (evaluation/run_brno.mjs).
export const ortho = null;

// The surfaces already are the national DTM: no fallback to it (sources.js), no base maps of its own.
export const national = true;
