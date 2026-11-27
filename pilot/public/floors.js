// Floors from a building's height (m), one function for every place that has a height and wants floors (Bára 27. 11. 2026:
// "that conversion we could finish, and use it elsewhere"). Floors that are known (OSM building:levels, an official count)
// always come first: this is only for a height alone. The height is to the top (the ridge of a pitched roof, the parapet of
// a flat one). Rules, each judged on photographs (evaluation/floors-height/ZPRAVA.md):
// - a flat or unknown roof: 2.2 m of roof and plinth over floors of 3.3 m (3.05 m from 25 m up: Toronto's review of 25. 11. 2026),
//   but under 8 m the boundary of one and two floors lies at 6.0 m (a two-storey house of 6.4–6.8 m came out of one);
// - a roof known to be pitched (OSM roof:shape, or the caller's `pitched`): PITCHED m of roof taken off before the floors
//   (a steep gable on a bay-and-gable house raises the height by a floor);
// - a hall (OSM building=train_station, warehouse, industrial, sports_hall, hangar…) of 6 m or more: no floors from the height, undefined.
// ?off=floorsh: the old rule (floorsOld) everywhere.
const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_CA?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const floorsHOff = () => (param("off") || "").split(",").includes("floorsh");
// OSM's own height (profile.js, building:levels missing) is converted by this rule only with ?floorsosm=1: the blind A/B on photos
// did not show a win there (11 : 8, p = 0.65), so by default it stays height / 3.5.
export const floorsOsmOn = () => param("floorsosm") === "1" && !floorsHOff();

export const HALLS = new Set(["train_station", "transportation", "warehouse", "industrial", "sports_hall", "hangar", "hall", "factory", "manufacture",
  "sports_centre", "stadium", "grandstand", "service", "silo", "storage_tank", "greenhouse", "barn"]);
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
  if (HALLS.has(o.type)) return h < TWO_FROM ? 1 : undefined; // a low hall is one floor, a tall one is no count of floors
  const storey = h <= 25 ? 3.3 : 3.05;
  const pitched = o.pitched ?? PITCHED_SHAPES.has(o.roofShape);
  if (pitched) return Math.max(1, Math.round((h - PITCHED) / storey));
  if (h < LOW_MAX) return h >= TWO_FROM ? 2 : 1;
  return Math.max(1, Math.round((h - 2.2) / storey));
}

// A town's answer for a house (podlaznost) from a height: the floors by the plain rule, the height kept (hm) for refloor.
export function heightHouse(h, extra = {}) {
  const n = floorsFromHeight(h);
  return n ? { cornice: n, roof: 0, total: n, fromHeight: true, hm: h, ...extra } : {};
}
// The same answer once the building is known (OSM kind and roof shape of the info app.js holds): the floors again, none of a hall.
export function refloor(p, info) {
  if (!p?.fromHeight || !(p.hm > 0) || floorsHOff()) return p;
  const n = floorsFromHeight(p.hm, { type: info?.type, roofShape: info?.roofShape });
  return n ? { ...p, cornice: n, total: n } : { ...p, cornice: undefined, total: undefined, fromHeight: false };
}
