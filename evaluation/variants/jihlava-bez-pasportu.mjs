// Jihlava without the road passport: the town's buildings, lawns and cadastre, the national DTM of ČÚZK
// where it has areas on the cut, else (no roadway at all) the estimate from OSM. Parking strips beside
// the DTM's roadway.
import { dmvs, compose, dtmLayer, above, hasRoadway, parkingBeside } from "./_jihlava.mjs";

export const about = "bez pasportu: budovy, trávníky, katastr + DTM ČÚZK, jinak odhad z OSM";
export async function surfaces(bbox) {
  const d = await dmvs(bbox);
  const out = await compose(bbox, [dtmLayer(d)], hasRoadway(d));
  out.features.push(...above(d));
  return out;
}
export async function parking(bbox) {
  const d = await dmvs(bbox);
  return parkingBeside(bbox, (d.features || []).filter((f) => f.attributes.CTVUK_KOD === 701));
}
