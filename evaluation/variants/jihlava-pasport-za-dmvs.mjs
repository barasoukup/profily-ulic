// Jihlava with the national DTM of ČÚZK first: where the DTM has areas on the cut they replace the road
// passport (the town's buildings, lawns and cadastre around them); the passport only where the DTM has
// nothing (the town's normal surfaces).
import { sources } from "../../pilot/public/towns/jihlava.js";
import { dmvs, compose, dtmLayer, above, hasAny, hasRoadway } from "./_jihlava.mjs";

export const about = "pasport jen tam, kde DTM ČÚZK nemá nic";
export async function surfaces(bbox) {
  const d = await dmvs(bbox);
  if (!hasAny(d)) return sources.surfaces(bbox);
  const out = await compose(bbox, [dtmLayer(d)], hasRoadway(d));
  out.features.push(...above(d));
  return out;
}
