// plzen: not connected yet. Until it is, a click reads OSM alone (no surfaces of the town). See
// towns/jihlava.js for a whole town module.
import { osmTiles } from "../gis.js";

const none = async () => ({ features: [] });
export const sources = { osm: osmTiles, surfaces: none, lines: none, parking: none, podlaznost: async () => ({}) };

export function maps({ osm, cuzk }) {
  return { base: { "Ortofoto ČÚZK": [cuzk()], "OpenStreetMap": [osm(1)] }, default: "Ortofoto ČÚZK", lines: null };
}

export const ortho = null;
