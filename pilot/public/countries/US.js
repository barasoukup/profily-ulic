// The USA (US; Bára 24. 11. 2026, phase 2 of the North America pilot): what differs from the Czech rules of
// countries/default.js. Only the metro of Washington DC is covered (staty.json "usa"; the rest of the USA is closed_us);
// its sources are towns/usa.js (DC's Planimetrics 2023 as the surface map, DDOT's Roadway SubBlock inventory for the
// lanes and parking), the orthophoto DC's of 2025 (lanes-ortho.js "us", only over DC). Sources and norms:
// evaluation/usa/ (NORMY.md), the pilot evaluation/usa-dc/.
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";

// Norms (evaluation/usa/NORMY.md): DDOT's Design and Engineering Manual (DEM, December 2023), its Bicycle Facility Design
// Guide (v2, 2020) and NACTO's guides. The DEM is binding for new streets in DC, but DDOT may keep existing conditions
// and the app reads existing streets (and the metro beyond DC), so orange only (Bára 24. 11. 2026: no invented values).
// No tram belt: neither NACTO nor DC's Streetcar Design Criteria give one.
const PARKED = (segs, i) => [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
function limitsUS(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 1.83, why: t("chodník: průchozí šířka nejméně 6 ft (1,83 m) v řídké obytné zástavbě, 8 ft (2,44 m) v husté, 10 ft (3,05 m) v centru (DDOT DEM 2023, tab. 31-1)") };
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 0, zaklad: 3.05, why: t("společná stezka pro chodce a cyklisty: nejméně 10 ft (3,05 m) (DDOT DEM 2023, odd. 29.4.1)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.52, why: PARKED(segs, i)
        ? t("cyklopruh vedle stání: nejméně 5 ft (1,52 m), od obruby nejméně 12 ft (3,66 m) včetně stání (NACTO Urban Bikeway Design Guide)")
        : t("cyklopruh: nejméně 5 ft (1,52 m), lépe 6 ft (1,83 m) (DDOT DEM 2023, odd. 29.3.3)") };
    case "cyklostezka": {
      // A half of a two-way track by the whole track (countries/cycletrack.js).
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.52, why: t("jednosměrná chráněná cyklostezka: nejméně 5 ft (1,52 m), při silném provozu 7 ft (2,13 m) (DDOT DEM 2023, odd. 29.3.3; NACTO)") },
        { min: 0, zaklad: 2.44, why: t("obousměrná cyklostezka: 10 ft (3,05 m), ve stísněných poměrech 8 ft (2,44 m) (DDOT Bicycle Facility Design Guide 2020)") });
    }
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.05, why: t("pruh pro autobusy: 10–12 ft (3,05–3,66 m) (NACTO Transit Street Design Guide)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 2.74, why: t("řadicí pruh: nejméně 9 ft (2,74 m), lépe 10 ft (3,05 m) (DDOT DEM 2023, tab. 30-13)") };
      return { min: 0, zaklad: 3.05, why: t("jízdní pruh: 10 ft (3,05 m), na trase autobusů 11 ft (3,35 m) (DDOT DEM 2023, tab. 30-13 a 30-14; NACTO)") };
    case "parkovani":
      if (s.orient === "kolme") return { min: 0, zaklad: 5.49, why: t("kolmé stání: hloubka 18 ft (5,49 m) (DDOT DEM 2023, tab. 45-1)") };
      if (s.orient === "sikme") return { min: 0, zaklad: 5.38, why: t("šikmé stání pod 45°: hloubka 17 ft 8 in (5,38 m) (DDOT DEM 2023, tab. 45-1)") };
      return { min: 0, zaklad: 2.13, why: t("podélné stání: 8 ft (2,44 m), v místní ulici 7 ft (2,13 m) (DDOT DEM 2023, tab. 45-1)") };
    default:
      return null;
  }
}

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts (as Lithuania,
// Finland and Denmark; an American stop sign is not drawn).
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "US",
  // The metro of Washington (staty.json "usa", the OSM pack us_dc).
  bounds: [-77.6, 38.5, -76.6, 39.4],
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
  art: { usa: { ...czechFurniture, ...atPosts } },
  // No panel estates drawn as the Czech ones (Bára's memory: the socialist looks only where they were built).
  socialistLooks: false,
  search: ["photon-us"],
};
