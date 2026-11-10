// Jihlava's passport, but the roadways of the state's and the region's roads (ŘSD, Krajská správa a údržba
// silnic) with no surface recorded, which the city draws as strips of the road's nominal width, from the
// national DTM of ČÚZK where the DTM has a roadway on the cut. Everything else as the passport has it.
import { roads, dmvs, compose, dtmLayer, above, passportLayer, stateRoad, hasRoadway } from "./_jihlava.mjs";

export const about = "pasport, vozovky silnic ŘSD a KSÚS bez povrchu z DTM ČÚZK";
export async function surfaces(bbox) {
  const [r, d] = await Promise.all([roads(bbox), dmvs(bbox)]);
  const swap = hasRoadway(d) && (r.features || []).some((f) => stateRoad(f.attributes));
  const kept = (r.features || []).some((f) => f.attributes.typ_useku === "vozovka" && !(swap && stateRoad(f.attributes)));
  const middle = swap ? [passportLayer(r, (a) => !stateRoad(a)), dtmLayer(d)] : [passportLayer(r)];
  const out = await compose(bbox, middle, kept || (swap && hasRoadway(d)));
  if (swap) out.features.push(...above(d));
  return out;
}
