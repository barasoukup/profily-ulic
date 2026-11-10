// Ústí nad Labem, tried for the parking only: the surfaces stay those of "cesko" (the national DTM of ČÚZK,
// nearly complete in the Ústí region), the parking places come from the town's GIS (mapy.usti.cz, ArcGIS
// Enterprise, CORS for barasoukup.github.io): Doprava/Parkovaci_zony_UL layer 3 "Parkovací místo", one
// polygon per row of stalls with its kind (DOPRAVNI_ZNACENI: 0 podélné, 1 kolmé, 2 šikmé, 3 parkovací pruh,
// 4 vyhrazené, 5 ZTP, 6 časově omezené, 7 bez značení; AKTUALIZACE 2026), about 435 rows in the paid zones
// of the centre. The service turns S-JTSK into WGS 84 by its default about 12 m off OSM: answers with
// datumTransformation 1623 (as Jihlava, Opava, Plzeň). derive.js reads the orientation from the polygon's depth, as for Opava's stalls.
// A/B: CITY=usti-stani VARIANTS=city,usti-stani CACHE=disk node evaluation/ab.mjs (city = the app now).
import { query, envelope } from "../../pilot/public/gis.js";

const UL_PARKING = "https://mapy.usti.cz/server/rest/services/Doprava/Parkovaci_zony_UL/MapServer/3/query";

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

export const about = "stání z GIS Ústí (Parkovací místo) k DTM ČÚZK";
export { parking };
