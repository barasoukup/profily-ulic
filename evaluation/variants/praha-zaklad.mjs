// Prague before the open data and the point layer (10. 11. 2026): the line layer of the technical map and
// IPR's parking alone. The base of the A/B tests in evaluation/praha-opendata/ZPRAVA.md.
//   CITY=praha VARIANTS=praha-zaklad,praha-body ITEMS=1 node evaluation/ab.mjs
import { prahaLines, parkovani } from "../../pilot/public/sources.js";
export const about = "Praha bez bodů technické mapy a bez otevřených dat";
export const lines = (bbox) => prahaLines(bbox, { points: false, opendata: false });
export const parking = (bbox, inZone) => parkovani(bbox, inZone, { zakaz: false });
