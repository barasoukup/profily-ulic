// The class of the street by TSK (Uliční úseky TSK včetně zatřídění komunikací): parking at the kerb is
// estimated in local service streets (MK III, living streets of MK IV), not in collector and main roads.
import { prahaLines, parkovani } from "../../pilot/public/sources.js";
export const about = "zatřídění komunikací TSK pro odhad stání";
export const lines = (bbox) => prahaLines(bbox, { points: false, trees: false });
export const parking = (bbox, inZone) => parkovani(bbox, inZone, { zakaz: false });
