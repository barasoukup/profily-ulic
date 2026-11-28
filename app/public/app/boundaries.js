// The boundaries of states and cities (tools/build_boundaries.mjs, build_boundaries.mjs), loaded before the first cut, a linked one included.
import { loadBounds, loadStates, loadSkTowns, loadTowns } from "../city.js";

// The boundaries of the cities with their own sources (tools/build_boundaries.mjs): a cut takes its city by them.
const statesJson = fetch("states.json").then((r) => (r.ok ? r.json() : null), () => null);
// The boundaries of the Slovak and Austrian cities (tools/build_boundaries.mjs, build_boundaries.mjs; the American and Canadian ones come with a cut there, late.js): the city of a cut
// and the territories of the Slovak towns' sources. Without them those cuts are their state's rest.
const townsJson = Promise.all(["towns-sk.json", "towns-at.json"].map((f) => fetch(f).then((r) => (r.ok ? r.json() : null), () => null)));
export const TOWN_BOUNDS = await fetch("towns.json").then((r) => (r.ok ? r.json() : null), () => null);
// Without the file every cut keeps the current city (rather than all becoming "cesko").
if (TOWN_BOUNDS) loadBounds(TOWN_BOUNDS); else console.warn("towns.json se nenačetl: město se podle polohy nepozná");
// The states (tools/build_boundaries.mjs): a cut outside the cities is in Czechia, in Slovakia or elsewhere (city.js cityAt).
// Loaded with the cities' file (both before the first cut, a linked one included).
export const STATES = await statesJson;
if (STATES) loadStates(STATES); else console.warn("states.json se nenačetl: stát se podle polohy nepozná");
{
  const [sk, ...rest] = await townsJson;
  if (sk) { loadSkTowns(sk); loadTowns(sk); }
  for (const towns of rest) if (towns) loadTowns(towns);
}
