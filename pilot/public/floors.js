// Floors from a building's height (m), one function for every place that has a height and wants floors (Bára 27. 11. 2026:
// "that conversion we could finish, and use it elsewhere"). Floors that are known (OSM building:levels, an official count)
// always come first: this is only for a height alone. The height is to the top (the ridge of a pitched roof, the parapet of
// a flat one). Rules, each judged on photographs (evaluation/floors-height/ZPRAVA.md):
// - a flat or unknown roof: 2.2 m of roof and plinth over floors of 3.3 m (3.05 m from 25 m up: Toronto's review of 25. 11. 2026),
//   but under 8 m the boundary of one and two floors lies at 6.0 m (a two-storey house of 6.4–6.8 m came out of one);
// - a roof known to be pitched (OSM roof:shape, or the caller's `pitched`): PITCHED m of roof taken off before the floors
//   (a steep gable on a bay-and-gable house raises the height by a floor);
// - a hall (OSM building=train_station, warehouse, industrial, sports_hall, hangar…): no floors from the height, undefined.
// ?off=floorsh: the old rule (floorsOld) everywhere.
const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_CA?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const floorsHOff = () => (param("off") || "").split(",").includes("floorsh");

export const HALLS = new Set(["train_station", "transportation", "warehouse", "industrial", "sports_hall", "hangar", "hall", "factory", "manufacture",
  "sports_centre", "stadium", "grandstand", "parking", "service", "silo", "storage_tank", "greenhouse", "barn"]);
export const PITCHED_SHAPES = new Set(["gabled", "hipped", "half-hipped", "gambrel", "mansard", "pyramidal", "saltbox", "skillion", "side_hipped",
  "hipped_and_gabled", "gabled_height_moved", "cone", "round"]);
export const LOW_MAX = 8, TWO_FROM = 6.0, PITCHED = 3.5;

// The rule of Toronto of 25. 11. 2026, kept as ?off=floorsh.
export const floorsOld = (h) => (h > 2 && h < 400 ? Math.max(1, Math.round((h - 2.2) / (h <= 25 ? 3.3 : 3.05))) : undefined);

// h: the height in metres. o: { type: OSM building=…, roofShape: OSM roof:shape, pitched: true/false when the caller knows }.
// Returns the number of floors above the ground, or undefined (no height, or a hall).
export function floorsFromHeight(h, o = {}) {
  if (floorsHOff()) return floorsOld(h);
  if (!(h > 2 && h < 400)) return undefined;
  if (HALLS.has(o.type)) return undefined;
  const storey = h <= 25 ? 3.3 : 3.05;
  const pitched = o.pitched ?? PITCHED_SHAPES.has(o.roofShape);
  if (pitched) return Math.max(1, Math.round((h - PITCHED) / storey));
  if (h < LOW_MAX) return h >= TWO_FROM ? 2 : 1;
  return Math.max(1, Math.round((h - 2.2) / storey));
}
