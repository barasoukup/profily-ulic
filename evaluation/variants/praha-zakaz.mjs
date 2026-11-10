// The no-parking sections of TSK (open data "Zákaz stání"): no parking at that kerb.
import { prahaLines, parkovani } from "../../pilot/public/sources.js";
export const about = "zákaz stání TSK";
export const lines = (bbox) => prahaLines(bbox, { points: false, opendata: false });
export const parking = (bbox, inZone) => parkovani(bbox, inZone);
