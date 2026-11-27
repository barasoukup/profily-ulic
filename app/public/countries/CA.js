// Canada (CA; Bára 25. 11. 2026): what differs from the Czech rules of countries/default.js. Only Toronto and the
// municipalities around it are covered (states.json "canada"; the rest of Canada is closed_ca); its sources are towns/canada.js
// (the City of Toronto's topographic mapping as the surface map), the orthophoto Toronto's current year (lanes-ortho.js
// "ca", only over the city). Sources and norms: evaluation/canada/ (NORMY.md).
import { t } from "../i18n.js";
import { northAmericaLook, northAmericaDetails } from "../house-looks-america.js";
import { LATE_BOUNDS } from "../late.js";
import { northAmericaFurniture, ownArt, NORTH_AMERICA_VEHICLES } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";

// Norms (evaluation/canada/NORMY.md): the City of Toronto's Lane Widths Guideline (V3.0, 2025), its On-Street Bikeway Design
// Guidelines (2023) and its Complete Streets Guidelines (2017). Guidelines for new design in the city, and the app
// reads existing streets (and the suburbs), so orange only. No tram belt, angled stall nor shared path: no published
// width was found.
function limitsCA(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 2.1, why: t("chodník: průchozí šířka nejméně 2,1 m (Toronto Complete Streets Guidelines 2017, odd. 4.3)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.5, why: t("cyklopruh: 1,6 m, nejméně 1,5 m (Toronto On-Street Bikeway Design Guidelines 2023, tab. 3.4)") };
    case "cyklostezka":
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.5, why: t("jednosměrná cyklostezka: 2,1 m, nejméně 1,5 m (Toronto On-Street Bikeway Design Guidelines 2023, tab. 3.1)") },
        { min: 0, zaklad: 2.4, why: t("obousměrná cyklostezka: 3,5 m, nejméně 2,4 m (Toronto On-Street Bikeway Design Guidelines 2023, tab. 3.2)") });
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 3.3, why: t("pruh pro autobusy: 3,3–3,5 m (Toronto Lane Widths Guideline 2025, tab. 11)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 3, why: t("řadicí pruh: nejméně 3,0 m (Toronto Lane Widths Guideline 2025, tab. 6 a 7)") };
      return { min: 0, zaklad: 3, why: t("jízdní pruh: 3,0 m, u obruby 3,3 m, při 60 km/h a víc u obruby 3,5 m (Toronto Lane Widths Guideline 2025, tab. 2 a 5)") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme" ? null : { min: 0, zaklad: 2, why: t("podélné stání: 2,0–2,4 m (Toronto Lane Widths Guideline 2025, tab. 12)") };
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
  // Code ch. 950 name none; NORMY.md), so the app's usual 3 m a direction and not their law.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Aplikace nechává {need}.", { free, need }),
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
