// Trees of IPR's technical map (layer 9, 83130 strom mimo park) beside the OSM trees.
import { prahaLines, parkovani } from "../../pilot/public/sources.js";
export const about = "stromy technické mapy";
export const lines = async (bbox) => {
  const json = await prahaLines(bbox, { opendata: false });
  return { features: json.features.filter((f) => f.geometry?.x === undefined || Number(f.attributes.CTMTP_KOD) === 83130) };
};
export const parking = (bbox, inZone) => parkovani(bbox, inZone, { zakaz: false });
