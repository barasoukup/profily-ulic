// The illustrations a city or a state draws in place of Streetmix's (files in pilot/public/<art>/, profile.js): the
// names of the sprites by their Streetmix name. No import of city.js (the states' modules use it).
// The rest of a town's illustrations (pilot/public/<art>/): its bus and, until it has its own, Prague's
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

// A town's own vehicles (pilot/public/<art>/tram-*, trolejbus-*) in place of Streetmix's.
export const TRAM = { "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound" };
export const TROLLEY = { "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound" };

// Prague's furniture as the Czech set has it (the files of cesko/, "../cesko/…" from another folder): the furniture of
// a state without its own.
export const czechFurniture = Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-")).map(([k, v]) => [k, `../cesko/${v}`]));
