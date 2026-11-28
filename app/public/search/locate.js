// Where a chosen item goes: { lat, lon, zoom, cut } — cut is the point on the street to cut at (an address on a street, a
// street), or null (a town, a district, an address without a street). The service that found it knows the place.
import { KINDS } from "./rank.js";
import { serviceOf } from "./registry.js";
import { getJSON } from "./http.js";

export async function locate(item, signal) {
  const where = await serviceOf(item).locate(item, { getJSON, signal });
  return { ...where, zoom: KINDS[item.type]?.zoom || 16 };
}
