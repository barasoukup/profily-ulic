// The road passports of towns without a city module of their own (found 13.–15. 11. 2026, in the app from
// 16. 11. 2026). Anywhere else in the Czech Republic ("cesko"), a cut inside one of these towns (passports.json,
// tools/build_passports.mjs) takes the passport's surfaces and the national DTM of ČÚZK elsewhere, as the towns'
// modules do (towns/overlay.js overDmvs); a passport with nothing in the box leaves the DTM alone (withPassports):
//   roznov: T-MAPY PaKom WFS (ms:pk-pov), as Karviná;
// The A/B test after the DMVS outage (26. 11. 2026, evaluation/PASPORTY-AB.md: the app with the passport against
// the DTM alone, judged over the orthophoto) kept three (Rožnov, Šlapanice, Kuřim) and left out the five that did not win: Chomutov
// (better without 33 : 8), Šumperk (4 : 4), Litoměřice (6 : 5), Prachatice (2 : 1) and Roudnice nad Labem (9 : 0),
// their code in the history. Chotěboř won (4 : 1) but was left out too (Bára 26. 11. 2026): its layer sits on a
// private account of an "ArcGIS Demo portál" organisation, not the town's (evaluation/licence/ZPRAVA.md). Šlapanice left out (Bára 26. 11. 2026) after
// the blind A/B on new cuts, 12 : 12 (evaluation/pasporty-blind/ZPRAVA.md), its credit too; Kuřim (lines of winter maintenance with their widths) after the same blind A/B, 14 : 16. Left out before: Mohelnice and Velké Meziříčí (an empty passport on 15. 11.),
// Litoměřice's T-MAPY (asks to log in).
// No licence is stated by any of them (as with the T-MAPY towns already used).
import { asMtvu, asPassport, insideRings } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { overDmvs, tmapyWfs } from "./overlay.js";
export { PASSPORT_NAMES } from "./passport-names.js";

// RÚIAN codes of the towns (tools/build_passports.mjs); their names in passport-names.js.
export const PASSPORT_CODES = { roznov: 544841 };
// The hosts the page asks (index.html CSP, tests/city.test.js).
export const PASSPORT_HOSTS = ["https://mapy.roznov.cz"];

const none = () => ({ features: [] });
// The kinds of each passport → MTVU codes (701 roadway, 702 sidewalk or park path, 703 cycle path, 704 parking,
// 1003 other paved); null: left to the DTM (stairs, a petrol station).
const ROAD = 701, WALK = 702, BIKE = 703, OTHER = 1003;
const T_MAPY = {
  roznov: { base: "https://mapy.roznov.cz/services/mapserver/common/pakom",
    code: (a) => ({ chodník: WALK, cyklostezka: BIKE, komunikace: ROAD, ostatní: OTHER })[a.typ] ?? null },
};
export const codes = { roznov: T_MAPY.roznov.code };


// The passport's surfaces of a town in a box (MTVU features).
export async function passport(id, bbox) {
  if (T_MAPY[id]) return asMtvu([[await tmapyWfs(T_MAPY[id].base, "ms:pk-pov", bbox, "typ,msGeometry"), T_MAPY[id].code]], MTVU_LABELS);
  return none();
}

// The town of a point (passports.json, loaded once; in Node, as the evaluation runs, from the file).
let bounds;
async function loadBounds() {
  const url = new URL("../passports.json", import.meta.url);
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
