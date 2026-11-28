// What a building's data says: height, floors, the floors set by hand.
const FLOOR = 3.5; // typical floor height for estimating floors from a building's height (m)

// Floors of a building known only by its height (OSM height without building:levels): height / FLOOR (floors.js did not
// win on photos there, docs/decisions.md).
export const heightFloors = (h) => (!h ? null : Math.round(h / FLOOR));

// Building height in metres: tagged in OSM, else from floors (FLOOR per floor).
export function buildingHeight(info) {
  if (!info) return null;
  return info.height || (info.levels ? info.levels * FLOOR : null);
}

// Floors: IPR "Podlažnosti" (cornice + roof floors) or OSM building:levels.
// A building's data with the floors set by hand (edges.leftLevels, Bára 12. 11. 2026): they stand for the data's
// floors and height.
export const edgeInfo = (edges, side) => {
  const info = edges?.[`${side}Info`], n = edges?.[`${side}Levels`];
  return n ? { ...info, levels: n, cornice: undefined, roof: undefined, height: undefined } : info;
};

export function buildingLevels(info) {
  if (!info?.levels) return null;
  return { n: info.levels, cornice: info.cornice, roof: info.roof };
}
