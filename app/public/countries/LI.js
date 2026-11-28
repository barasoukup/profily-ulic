// Liechtenstein (LI; Bára 17. 11. 2026): its own traffic acts copy the Swiss ones (SVG LGBl. 1978 Nr. 18, LR 741.01;
// VRV LGBl. 1978 Nr. 19, LR 741.11; SSV LGBl. 1980 Nr. 65, LR 741.21, with the same signal numbers): the Swiss rules,
// norms and signs of countries/CH.js, its law named by its own articles (the VRV's are one higher: Art. 21 parking,
// Art. 40 the sidewalk). The cadastral survey of Liechtenstein is in geodienste.ch with the cantons'
// (towns/switzerland.js), SWISSIMAGE covers it. evaluation/switzerland/.
import { t } from "../i18n.js";
import { czechFurniture } from "../art.js";
import CH from "./CH.js";

/** @type {import("../types.js").Country} */
export default {
  ...CH,
  code: "LI",
  bounds: [9.47, 47.04, 9.64, 47.28],
  halfKerbNote: (free, need) => t("country.li.parkingHalfSidewalkOsm", { free, need }),
  parkByCycleLane: CH.parkByCycleLane,
  // The rest as in Switzerland, named here as the states' test asks (each state says its own).
  parkGuess: CH.parkGuess,
  laneOrtho: CH.laneOrtho,
  bedOrtho: CH.bedOrtho,
  panorama: CH.panorama,
  signs: CH.signs,
  limits: CH.limits,
  contraflow: CH.contraflow,
  tramBelt: CH.tramBelt,
  art: { liechtenstein: { ...czechFurniture } },
};
