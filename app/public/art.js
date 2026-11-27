// The illustrations a city or a state draws in place of Streetmix's (files in app/public/<art>/, profile.js): the
// names of the sprites by their Streetmix name. No import of city.js (the states' modules use it).
// The rest of a town's illustrations (app/public/<art>/): its bus and, until it has its own, Prague's
// furniture (copies in the town's folder).
export const TOWN_ART = {
  "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
  // Overhead-line poles and stop posts (copies of Prague's, Brno its own).
  "tram-pole-left": "sloup-trakce-left", "tram-pole-right": "sloup-trakce-right",
  "tram-pole-lamp-left": "sloup-trakce-lampa-left", "tram-pole-lamp-right": "sloup-trakce-lampa-right",
  "stop-post-left": "oznacnik-left", "stop-post-right": "oznacnik-right",
  "stop-post-tram-left": "oznacnik-tram-left", "stop-post-tram-right": "oznacnik-tram-right",
  // Rainwater management (Bára 12. 11. 2026): a shelter with a green roof, the planting of a swale, reeds of a pond.
  "transit-shelter-green-left": "transit-shelter-green-left", "transit-shelter-green-right": "transit-shelter-green-right",
  "swale-plants": "pruleh-rostliny", "reeds-left": "rakos-left", "reeds-right": "rakos-right",
};

// A town's own vehicles (app/public/<art>/tram-*, trolejbus-*) in place of Streetmix's.
export const TRAM = { "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound" };
export const TROLLEY = { "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound" };

// Prague's furniture as the Czech set has it (the files of cesko/, "../cesko/…" from another folder): the furniture of
// a state without its own.
export const czechFurniture = Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-")).map(([k, v]) => [k, `../cesko/${v}`]));

// The furniture of North America (northamerica/, Bára 25. 11. 2026; the plants of the swale and the reeds the Czech
// ones), and the pieces a city has of its own in its folder (ownArt). New York, Boston and San Francisco have theirs drawn
// (newyork/, boston/, sanfrancisco/), for the time the app covers them.
const PLANTS = new Set(["swale-plants", "reeds-left", "reeds-right"]);
export const northAmericaFurniture = Object.fromEntries(Object.entries(czechFurniture).map(([k, v]) => [k, PLANTS.has(k) ? v : `../northamerica/${TOWN_ART[k]}`]));
export const ownArt = (keys) => Object.fromEntries(keys.map((k) => [k, TOWN_ART[k]]));

// The neutral tram and bus (generic/: no operator's livery, no logo; Bára 17. 11. 2026: "všude, kde nemáme
// specifickou"): drawn in every set that has no tram or bus of its own, in place of Streetmix's. Trolleybuses and cars
// stay Streetmix's.
export const GENERIC_VEHICLES = {
  "streetcar-inbound": "../generic/tram-inbound", "streetcar-outbound": "../generic/tram-outbound",
  "bus-inbound": "../generic/bus-inbound", "bus-outbound": "../generic/bus-outbound",
};

// The vehicles of the North American cities (Toronto's in countries/CA.js, the others not covered yet; Bára 25. 11. 2026; evaluation/north-america-art/
// vehicles): spread into the city's set of its state (countries/<ISO>.js art) when it is added, as TRAM and TROLLEY.
// The second tram of San Francisco (sanfrancisco/pcc-*, the F line) has no place in a set yet (a trolley pole: the app draws a pantograph).
// San Francisco's set is in countries/US.js (26. 11. 2026).
const BUS = { "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound" };
export const NORTH_AMERICA_VEHICLES = { toronto: { ...TRAM, ...BUS }, newyork: BUS, boston: { ...TRAM, ...BUS }, sanfrancisco: { ...TRAM, ...TROLLEY, ...BUS } };
