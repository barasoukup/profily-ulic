// The USA (US; Bára 24. 11. 2026, phase 2 of the North America pilot): what differs from the Czech rules of
// countries/default.js. Only the metros of the OSM packs are covered (states-america.json "usa"; the rest of the
// USA is closed_us): Washington DC, New York City (26. 11. 2026, towns/newyork.js, evaluation/usa/nyc/), San Francisco
// (26. 11. 2026, towns/sanfrancisco.js, evaluation/usa/sf/) and Boston (26. 11. 2026, towns/boston.js: the surface maps of
// Boston and Cambridge, evaluation/usa/boston/);
// its sources are towns/usa.js (DC's Planimetrics 2023 as the surface map, DDOT's Roadway SubBlock inventory for the
// lanes and parking), the orthophotos DC's of 2025 over DC and MassGIS's of 2025 over Boston's metro (lanes-ortho.js "us").
// Sources and norms: evaluation/usa/ (NORMS.md), evaluation/usa/boston/ (NORMS.md), the pilot evaluation/usa-dc/.
import { t } from "../i18n.js";
import { norm } from "../norm-text.js";
import { northAmericaLook, northAmericaDetails } from "../house-looks-america.js";
import { LATE_BOUNDS } from "../late.js";
import { northAmericaFurniture, ownArt, NORTH_AMERICA_VEHICLES } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";
import { city } from "../city.js";

// Norms (evaluation/usa/NORMS.md): DDOT's Design and Engineering Manual (DEM, December 2023), its Bicycle Facility Design
// Guide (v2, 2020) and NACTO's guides. The DEM is binding for new streets in DC, but DDOT may keep existing conditions
// and the app reads existing streets (and the metro beyond DC), so orange only (Bára 24. 11. 2026: no invented values).
// No tram belt: neither NACTO nor DC's Streetcar Design Criteria give one.
const PARKED = (segs, i) => [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
// San Francisco (26. 11. 2026, evaluation/usa/sf/NORMS.md): DDOT's manual is not its law. The sidewalks by the minimums of
// the Better Streets Plan's street types as SFMTA's dataset Sidewalk Widths of 2014 (DataSF 4g86-grxu, a study by AECOM)
// gives them to each block: the least 10 ft in neighbourhood residential streets, 12 ft in most others, 6 ft in alleys,
// 8 ft in industrial ones; a bike lane beside parking and a bus lane by NACTO as in DC; nothing else (no source of the
// city's own was read). Orange only. The type of the street from OSM where the cut has it (street: state.cut, kind):
// an alley (service=alley) by its 6 ft; another service road (a driveway, a parking aisle) has no number, so no warning.
// Industrial streets are not told: OSM's tiles of the app have no landuse (they keep the 10 ft of the others).
function limitsSF(s, segs, i, street = null) {
  switch (s.type) {
    case "chodnik":
      if (street?.kind === "alley") return { min: 0, zaklad: 1.83, why: t("country.us.sidewalkAlleyLeast6") };
      if (street?.kind === "service") return null;
      return { min: 0, zaklad: 3.05, why: t("country.us.sidewalkSanFranciscoStreet") };
    case "cyklopruh": case "ochranny_pruh":
      return PARKED(segs, i) ? { min: 0, zaklad: 1.52, why: t("country.us.cycleLaneBesideParking") } : null;
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.05, why: t("country.us.busLane1012") };
    default:
      return null;
  }
}
// The city by the place rules.js passes, else the city of the cut; street: the cut's kind of street (rules.js checkRules).
function limitsUS(s, segs = [], i = -1, place = city, street = null) {
  if (place?.id === "newyork") return limitsNYC(s, segs, i);
  if (place?.id === "sanfrancisco") return limitsSF(s, segs, i, street);
  if (BOSTON_TOWNS.has(place?.id)) return limitsBoston(s, segs, i);
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 1.83, why: t("country.us.sidewalkClearWalkingWidth") };
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 0, zaklad: 3.05, why: norm("sharedPath", [["min", { ft: 10 }]], ["DDOT DEM 2023"]) };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.52, why: PARKED(segs, i)
        ? t("country.us.cycleLaneBesideParking")
        : norm("cycleLane", [["min", { ft: 5 }], ["rec", { ft: 6 }]], ["DDOT DEM 2023"]) };
    case "cyklostezka": {
      // A half of a two-way track by the whole track (countries/cycletrack.js).
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.52, why: t("country.us.oneWayProtectedCycle") },
        { min: 0, zaklad: 2.44, why: norm("twoWayCycleTrack", [[null, { ft: 10 }], ["tight", { ft: 8 }]], ["DDOT Bicycle Facility Design Guide 2020"]) });
    }
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.05, why: t("country.us.busLane1012") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 2.74, why: norm("turnLane", [["min", { ft: 9 }], ["rec", { ft: 10 }]], ["DDOT DEM 2023"]) };
      return { min: 0, zaklad: 3.05, why: t("country.us.trafficLane10Ft") };
    case "parkovani":
      if (s.orient === "kolme") return { min: 0, zaklad: 5.49, why: norm("perpendicularParking", [["depth", { ft: 18 }]], ["DDOT DEM 2023"]) };
      if (s.orient === "sikme") return { min: 0, zaklad: 5.38, why: t("country.us.angledParking45Depth") };
      return { min: 0, zaklad: 2.13, why: t("country.us.parallelParking8Ft") };
    default:
      return null;
  }
}

// New York City (26. 11. 2026, evaluation/usa/nyc/NORMS.md): NYC DOT's Street Design Manual (the online edition,
// nycstreetdesign.info, Geometry: Lanes, Curb Bus Lane, Bike Lane Table), orange only as DC's. The manual gives no clear path
// of the sidewalk (it refers to the ADA), no width of a turn lane nor of an angled or perpendicular stall: none.
function limitsNYC(s, segs, i) {
  switch (s.type) {
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.52, why: t("country.us.cycleLaneTypically5") };
    case "cyklostezka":
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.22, why: t("country.us.oneWayProtectedCycleTrack") },
        { min: 0, zaklad: 2.44, why: t("country.us.twoWayProtectedCycle") });
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.35, why: norm("busLaneKerbside", [["min", { ft: 11 }]], ["NYC Street Design Manual", "Curb Bus Lane"]) };
    case "pruh": case "pruh_piktokoridor":
      return { min: 0, zaklad: 3.05, why: t("country.us.trafficLaneTypically10") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme" ? null : { min: 0, zaklad: 1.83, why: t("country.us.parallelParkingTypically8") };
    default:
      return null;
  }
}
// Boston's metro (Bára 26. 11. 2026; evaluation/usa/boston/NORMS.md): the Boston Complete Streets Guidelines (Boston
// Transportation Department, 2013), its tables "Preferred and Minimum Widths for Sidewalk Zones" (p. 23) and "Minimum Widths
// for Roadway Lanes" (p. 103). Guidelines for the city's own design, and the app reads existing streets (and the cities
// around), so orange only. No figure for a cycle track, a shared path, an angled or perpendicular stall was read in
// them: none is warned of.
function limitsBoston(s) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 2.13, why: t("country.us.sidewalkTotalLeast7") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.52, why: t("country.us.cycleLaneLeast5Ft") };
    case "bus":
      return { min: 0, zaklad: 3.35, why: norm("busLane", [["min", { ft: 11 }]], ["Boston Complete Streets Guidelines 2013", ["page", "103"]]) };
    case "bus_cyklo":
      return { min: 0, zaklad: 3.66, why: t("country.us.sharedBusCycleLane") };
    case "pruh": case "pruh_piktokoridor":
      return { min: 0, zaklad: 3.05, why: s.turn ? norm("turnLane", [["min", { ft: 10 }]], ["Boston Complete Streets Guidelines 2013", ["page", "103"]])
        : t("country.us.trafficLaneLeast10") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme" ? null : { min: 0, zaklad: 2.13, why: norm("parallelParking", [["min", { ft: 7 }]], ["Boston Complete Streets Guidelines 2013", ["page", "103"]]) };
    default:
      return null;
  }
}
const BOSTON_TOWNS = new Set(["boston", "bostonmetro"]);

// The bus of the whole state is Metrobus (WMATA): the state is the metro of Washington alone and WMATA runs in its
// suburbs too (Bára 25. 11. 2026); a further metro spreads its own buses (art.js NORTH_AMERICA_VEHICLES). No tram of its
// own: the streetcar closed on 31. 3. 2026.
const usa = { ...northAmericaFurniture, "bus-inbound": "../washington/bus-inbound", "bus-outbound": "../washington/bus-outbound" };
// In Washington its bus stop, also by the shelter, and its globe as the lamp up to 5 m.
const washington = { ...usa, ...ownArt(["stop-post-left", "stop-post-right",
  "transit-shelter-01-left", "transit-shelter-01-right", "transit-shelter-green-left", "transit-shelter-green-right"]), "lamp-post-top": "lamp-globe-left" };
// In New York (26. 11. 2026) MTA's bus, the city's davit lamp from 6 m and its bus stop (newyork/; evaluation/north-america-art/
// furniture/SOURCES.md); the shelter and the rest of North America's. The Bishop's Crook (lamp-bishop-*) has no place yet: the
// app has one lamp over the street.
const newyork = { ...northAmericaFurniture, ...NORTH_AMERICA_VEHICLES.newyork, ...ownArt(["lamp-modern-left", "lamp-modern-right", "stop-post-left", "stop-post-right"]) };
// San Francisco (26. 11. 2026): Muni's bus (Xcelsior XDE40), trolleybus (XT40) and light rail (LRV4, where OSM has tracks) and its
// stop post; the shelters and the rest of North America's. Not drawn: the PCC of the F line (a trolley pole, the app draws a
// pantograph), the cable car, and the Path of Gold (a lamp of 9.8 m on Market Street alone, not a post-top lamp up to 5 m).
const sanfrancisco = { ...northAmericaFurniture, ...NORTH_AMERICA_VEHICLES.sanfrancisco, ...ownArt(["stop-post-left", "stop-post-right"]) };
// Boston's metro (Bára 26. 11. 2026): the MBTA's bus everywhere in it (the MBTA runs in the cities around), its Green Line
// tram where OSM has the tracks (the tram is drawn only on them), its stop post; in the City of Boston its acorn lamp up to
// 5 m. No shelter of its own drawn: North America's.
const bostonmetro = { ...northAmericaFurniture, ...NORTH_AMERICA_VEHICLES.boston, ...ownArt(["stop-post-left", "stop-post-right"]) };
const boston = { ...bostonmetro, "lamp-post-top": "lamp-acorn-left" };

/** @type {import("../types.js").Country} */
export default {
  ...base,
  code: "US",
  // The metros of Washington, New York, San Francisco and Boston (states-america.json "usa", the OSM packs us_dc, us_nyc,
  // us_sf and us_bos).
  bounds: LATE_BOUNDS.US,
  // The International Fire Code 503.2.1 (adopted by DC with its supplement, 12 DCMR H): a fire apparatus access road
  // keeps 20 ft (6.10 m) unobstructed, about 3 m a direction; 18 DCMR 2405.2(g) forbids parking where less than 10 ft of
  // open roadway stays (NORMS.md B). So the app's 3 m a direction. DC itself parks on both sides of local streets of
  // 16 ft lanes and 16 ft parking (about 8.75–9.75 m, DDOT's inventory); where the inventory answers it decides the
  // parking, not this estimate (towns/usa.js), so the 3 m work in Maryland and Virginia, for which NORMS.md has no source
  // of their own: the app's usual width, not their law.
  freeLane: 3,
  halfKerbNote: (free, need) => t("common.parkingHalfSidewalkOsm", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  // Boston's metro by Boston's guidelines, the rest by DC's (the town of the cut, city.js STATE_TOWNS).
  limits: limitsUS,
  contraflow: () => null,
  tramBelt: () => [],
  // No sign row in phase 2 (Bára 24. 11. 2026; MUTCD later): nothing drawn, nothing offered in the design.
  signs: { dir: "signs-US", file: () => null, plate: () => null, label: (x, own, label) => label.replace(CZ_CODE, ""), drawable: () => false },
  bedOrtho: null,
  // DC's orthophoto of 2025 over DC only, MassGIS's of 2025 over Boston's metro (lanes-ortho.js US_ORTHO); elsewhere in
  // Washington's metro the estimate from OSM.
  laneOrtho: "us",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { usa, washington, newyork, sanfrancisco, boston, bostonmetro },
  // No panel estates drawn as the Czech ones (Bára's memory: the socialist looks only where they were built).
  socialistLooks: false,
  // The houses of North America (house-looks.js, docs/house-types-north-america.md; Bára 25. 11. 2026).
  houseLook: northAmericaLook,
  houseDetails: northAmericaDetails,
  search: ["photon-us"],
};
