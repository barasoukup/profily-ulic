// The USA (US; Bára 24. 11. 2026, phase 2 of the North America pilot): what differs from the Czech rules of
// countries/default.js. Only the metro of Washington DC and San Francisco are covered (staty-america.json "usa"; the rest of
// the USA is closed_us; San Francisco since 26. 11. 2026, towns/sanfrancisco.js, evaluation/usa/sf/);
// its sources are towns/usa.js (DC's Planimetrics 2023 as the surface map, DDOT's Roadway SubBlock inventory for the
// lanes and parking), the orthophoto DC's of 2025 (lanes-ortho.js "us", only over DC). Sources and norms:
// evaluation/usa/ (NORMY.md), the pilot evaluation/usa-dc/.
import { t } from "../i18n.js";
import { northAmericaLook, northAmericaDetails } from "../house-looks-america.js";
import { LATE_BOUNDS } from "../late.js";
import { northAmericaFurniture, ownArt, NORTH_AMERICA_VEHICLES } from "../art.js";
import { city } from "../city.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";

// Norms (evaluation/usa/NORMY.md): DDOT's Design and Engineering Manual (DEM, December 2023), its Bicycle Facility Design
// Guide (v2, 2020) and NACTO's guides. The DEM is binding for new streets in DC, but DDOT may keep existing conditions
// and the app reads existing streets (and the metro beyond DC), so orange only (Bára 24. 11. 2026: no invented values).
// No tram belt: neither NACTO nor DC's Streetcar Design Criteria give one.
const PARKED = (segs, i) => [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
// San Francisco (26. 11. 2026, evaluation/usa/sf/NORMY.md): DDOT's manual is not its law. The sidewalks by the widths by street type of
// SFMTA's Sidewalk Widths of 2014 (an AECOM study; the street types of the Better Streets Plan): the least 10 ft in neighbourhood residential
// streets, 12 ft in most others, 6 ft in alleys, 8 ft in industrial ones); a bike lane beside parking and a bus lane by
// NACTO as in DC; nothing else (no source of the city's own was read). Orange only.
function limitsSF(s, segs, i) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 3.05, why: t("chodník: v San Franciscu podle typu ulice nejméně 10 ft (3,05 m) v místních obytných, 12 ft (3,66 m) ve většině ostatních, doporučeno 12–15 ft (SFMTA, Sidewalk Widths 2014)") };
    case "cyklopruh": case "ochranny_pruh":
      return PARKED(segs, i) ? { min: 0, zaklad: 1.52, why: t("cyklopruh vedle stání: nejméně 5 ft (1,52 m), od obruby nejméně 12 ft (3,66 m) včetně stání (NACTO Urban Bikeway Design Guide)") } : null;
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.05, why: t("pruh pro autobusy: 10–12 ft (3,05–3,66 m) (NACTO Transit Street Design Guide)") };
    default:
      return null;
  }
}
function limitsUS(s, segs = [], i = -1) {
  if (city.id === "sanfrancisco") return limitsSF(s, segs, i);
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 1.83, why: t("chodník: průchozí šířka nejméně 6 ft (1,83 m) v řídké obytné zástavbě, 8 ft (2,44 m) v husté, 10 ft (3,05 m) v centru (DDOT DEM 2023)") };
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 0, zaklad: 3.05, why: t("společná stezka pro chodce a cyklisty: nejméně 10 ft (3,05 m) (DDOT DEM 2023)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.52, why: PARKED(segs, i)
        ? t("cyklopruh vedle stání: nejméně 5 ft (1,52 m), od obruby nejméně 12 ft (3,66 m) včetně stání (NACTO Urban Bikeway Design Guide)")
        : t("cyklopruh: nejméně 5 ft (1,52 m), lépe 6 ft (1,83 m) (DDOT DEM 2023)") };
    case "cyklostezka": {
      // A half of a two-way track by the whole track (countries/cycletrack.js).
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.52, why: t("jednosměrná chráněná cyklostezka: nejméně 5 ft (1,52 m), při silném provozu 7 ft (2,13 m) (DDOT DEM 2023; NACTO)") },
        { min: 0, zaklad: 2.44, why: t("obousměrná cyklostezka: 10 ft (3,05 m), ve stísněných poměrech 8 ft (2,44 m) (DDOT Bicycle Facility Design Guide 2020)") });
    }
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.05, why: t("pruh pro autobusy: 10–12 ft (3,05–3,66 m) (NACTO Transit Street Design Guide)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 2.74, why: t("řadicí pruh: nejméně 9 ft (2,74 m), lépe 10 ft (3,05 m) (DDOT DEM 2023)") };
      return { min: 0, zaklad: 3.05, why: t("jízdní pruh: 10 ft (3,05 m), na trase autobusů 11 ft (3,35 m) (DDOT DEM 2023; NACTO)") };
    case "parkovani":
      if (s.orient === "kolme") return { min: 0, zaklad: 5.49, why: t("kolmé stání: hloubka 18 ft (5,49 m) (DDOT DEM 2023)") };
      if (s.orient === "sikme") return { min: 0, zaklad: 5.38, why: t("šikmé stání pod 45°: hloubka 17 ft 8 in (5,38 m) (DDOT DEM 2023)") };
      return { min: 0, zaklad: 2.13, why: t("podélné stání: 8 ft (2,44 m), v místní ulici 7 ft (2,13 m) (DDOT DEM 2023)") };
    default:
      return null;
  }
}

// The bus of the whole state is Metrobus (WMATA): the state is the metro of Washington alone and WMATA runs in its
// suburbs too (Bára 25. 11. 2026); a further metro spreads its own buses (art.js NORTH_AMERICA_VEHICLES). No tram of its
// own: the streetcar closed on 31. 3. 2026.
const usa = { ...northAmericaFurniture, "bus-inbound": "../washington/bus-inbound", "bus-outbound": "../washington/bus-outbound" };
// In Washington its bus stop, also by the shelter, and its globe as the lamp up to 5 m (Boston's: "lamp-acorn-left").
const washington = { ...usa, ...ownArt(["stop-post-left", "stop-post-right",
  "transit-shelter-01-left", "transit-shelter-01-right", "transit-shelter-green-left", "transit-shelter-green-right"]), "lamp-post-top": "lamp-globe-left" };
// San Francisco (26. 11. 2026): Muni's bus (Xcelsior XDE40), trolleybus (XT40) and light rail (LRV4, where OSM has tracks) and its
// stop post; the shelters and the rest of North America's. Not drawn: the PCC of the F line (a trolley pole, the app draws a
// pantograph), the cable car, and the Path of Gold (a lamp of 9.8 m on Market Street alone, not a post-top lamp up to 5 m).
const sanfrancisco = { ...northAmericaFurniture, ...NORTH_AMERICA_VEHICLES.sanfrancisco, ...ownArt(["stop-post-left", "stop-post-right"]) };

export default {
  ...base,
  code: "US",
  // The metro of Washington (staty.json "usa", the OSM pack us_dc); San Francisco's box is LATE_BOUNDS.US_SF.
  bounds: LATE_BOUNDS.US,
  // The International Fire Code 503.2.1 (adopted by DC with its supplement, 12 DCMR H): a fire apparatus access road
  // keeps 20 ft (6.10 m) unobstructed, about 3 m a direction; 18 DCMR 2405.2(g) forbids parking where less than 10 ft of
  // open roadway stays (NORMY.md B). So the app's 3 m a direction. DC itself parks on both sides of local streets of
  // 16 ft lanes and 16 ft parking (about 8.75–9.75 m, DDOT's inventory); where the inventory answers it decides the
  // parking, not this estimate (towns/usa.js), so the 3 m work in Maryland and Virginia, for which NORMY.md has no source
  // of their own: the app's usual width, not their law.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsUS,
  contraflow: () => null,
  tramBelt: () => [],
  // No sign row in phase 2 (Bára 24. 11. 2026; MUTCD later): nothing drawn, nothing offered in the design.
  signs: { dir: "signs-US", file: () => null, plate: () => null, label: (x, own, label) => label.replace(CZ_CODE, ""), drawable: () => false },
  bedOrtho: null,
  // DC's orthophoto of 2025 over DC only (lanes-ortho.js US_ORTHO); elsewhere in the metro the estimate from OSM.
  laneOrtho: "us",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { usa, washington, sanfrancisco },
  // No panel estates drawn as the Czech ones (Bára's memory: the socialist looks only where they were built).
  socialistLooks: false,
  // The houses of North America (house-looks.js, docs/house-types-north-america.md; Bára 25. 11. 2026).
  houseLook: northAmericaLook,
  houseDetails: northAmericaDetails,
  search: ["photon-us"],
};
