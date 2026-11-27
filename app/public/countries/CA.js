// Canada (CA; Bára 25. 11. 2026): what differs from the Czech rules of countries/default.js. Only Toronto and the
// municipalities around it are covered (states.json "canada"; the rest of Canada is closed_ca); its sources are towns/canada.js
// (the City of Toronto's topographic mapping as the surface map), the orthophoto Toronto's current year (lanes-ortho.js
// "ca", only over the city). Sources and norms: evaluation/canada/ (NORMS.md).
import { t } from "../i18n.js";
import { northAmericaLook, northAmericaDetails } from "../house-looks-america.js";
import { LATE_BOUNDS } from "../late.js";
import { northAmericaFurniture, ownArt, NORTH_AMERICA_VEHICLES } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";

// Norms (evaluation/canada/NORMS.md): the City of Toronto's Lane Widths Guideline (V3.0, 2025), its On-Street Bikeway Design
// Guidelines (2023) and its Complete Streets Guidelines (2017). Guidelines for new design in the city, and the app
// reads existing streets (and the suburbs), so orange only. No tram belt, angled stall nor shared path: no published
// width was found.
function limitsCA(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 2.1, why: t("country.ca.sidewalkClearWidthLeast") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.5, why: t("country.ca.cycleLane16") };
    case "cyklostezka":
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.5, why: t("country.ca.oneWayCycleTrack") },
        { min: 0, zaklad: 2.4, why: t("country.ca.twoWayCycleTrack") });
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.3, why: t("country.ca.busLane35") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 3, why: t("country.ca.turnLaneLeast3") };
      return { min: 0, zaklad: 3, why: t("country.ca.trafficLane30") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme" ? null : { min: 0, zaklad: 2, why: t("country.ca.parallelParking20") };
    default:
      return null;
  }
}

// The furniture of North America, in Toronto its stops and shelters and TTC's bus and streetcar (Flexity); in the
// suburbs, which other operators serve, the neutral vehicles.
const toronto = { ...northAmericaFurniture, ...NORTH_AMERICA_VEHICLES.toronto, ...ownArt(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right",
  "transit-shelter-01-left", "transit-shelter-01-right", "transit-shelter-green-left", "transit-shelter-green-right"]) };

export default {
  ...base,
  code: "CA",
  // Toronto and its surroundings (states.json "canada", the OSM pack ca_on_toronto).
  bounds: LATE_BOUNDS.CA,
  // No width that must stay free beside a parked car was found (Ontario's Highway Traffic Act s. 170 and Toronto's Municipal
  // Code ch. 950 name none; NORMS.md), so the app's usual 3 m a direction and not their law.
  freeLane: 3,
  halfKerbNote: (free, need) => t("common.parkingHalfSidewalkOsm", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsCA,
  contraflow: () => null,
  tramBelt: () => [],
  // No sign row (the rights to Ontario's signs are unclear): nothing drawn, nothing offered in the design.
  signs: { dir: "signs-CA", file: () => null, plate: () => null, label: (x, own, label) => label.replace(CZ_CODE, ""), drawable: () => false },
  bedOrtho: null,
  laneOrtho: "ca",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { canada: northAmericaFurniture, toronto },
  socialistLooks: false,
  houseLook: northAmericaLook,
  houseDetails: northAmericaDetails,
  search: ["photon-ca"],
};
