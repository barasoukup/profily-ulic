// The city module with the boundaries and the states loaded, the way the page loads them (towns.json, states.json; with
// `america` also the states of North America and the towns of the files asked for). Each call loads again, so a test may
// load its own states after it.
import { readJson } from "./files.js";

export async function loadCities({ america = false, towns = [] } = {}) {
  if (america) await import("../../app/public/america.js"); // the states of North America (late.js) are loaded on the spot
  const C = await import("../../app/public/city.js");
  C.loadBounds(readJson("towns.json"));
  C.loadStates(america ? { ...readJson("states.json"), ...readJson("states-america.json") } : readJson("states.json"));
  for (const f of towns) C.loadTowns(readJson(f));
  return C;
}
