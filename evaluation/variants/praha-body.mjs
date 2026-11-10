// The point layer of IPR's technical map (dtmp/MapServer/9): traction poles, stop poles, bollards and poles
// without wires (lamps); without its trees (praha-stromy-dtm) and without the open data.
import { prahaLines, parkovani } from "../../pilot/public/sources.js";
export const about = "body technické mapy (bez stromů)";
export const lines = (bbox) => prahaLines(bbox, { tmTrees: false, opendata: false });
export const parking = (bbox, inZone) => parkovani(bbox, inZone, { zakaz: false });
