// Trees and tree rows of Prague's open data (Sdílená data o zeleni – vegetační prvky – body; Stromořadí)
// beside the OSM trees.
import { prahaLines, parkovani } from "../../pilot/public/sources.js";
export const about = "stromy a stromořadí z otevřených dat";
export const lines = (bbox) => prahaLines(bbox, { points: false, sections: false });
export const parking = (bbox, inZone) => parkovani(bbox, inZone, { zakaz: false });
