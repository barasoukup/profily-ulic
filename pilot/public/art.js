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

// The street lamp's picture of a set (by art folder) where it is not the usual one: where its luminaire hangs (light, m),
// the end of its top part and the start of its foot from the top of the picture (cut, foot, cm; between them the mast
// stretches to a lamp's own height, profile.js), a post-top lamp (postTop: centred, no arm, drawn for every height).
// The pictures wait for their cities with these: boston { light: 4.7, cut: 545, foot: 840, postTop: true },
// sanfrancisco { light: 9.2, cut: 215, foot: 580, postTop: true, h: 985 }, newyork { light: 8.75 } (lamp-bishop: 6.6,
// cut: 300, foot: 630).
export const LAMP_PICTURES = { brno: { light: 7.4 }, washington: { light: 5.2, cut: 500, foot: 820, postTop: true } };
export const LAMP_PICTURE = { cut: 300, foot: 800, h: 930, postTop: false };

// The neutral tram and bus (generic/: no operator's livery, no logo; Bára 17. 11. 2026: "všude, kde nemáme
// specifickou"): drawn in every set that has no tram or bus of its own, in place of Streetmix's. Trolleybuses and cars
// stay Streetmix's.
export const GENERIC_VEHICLES = {
  "streetcar-inbound": "../generic/tram-inbound", "streetcar-outbound": "../generic/tram-outbound",
  "bus-inbound": "../generic/bus-inbound", "bus-outbound": "../generic/bus-outbound",
};
