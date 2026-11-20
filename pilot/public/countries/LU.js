// Luxembourg (LU; Bára 20. 11. 2026): what differs from the Czech rules of countries/default.js. The sources are
// towns/luxembourg.js, the orthophoto lanes-ortho.js. Sources, norms and signs: evaluation/luxembourg/.
import { czechFurniture, TOWN_ART } from "../art.js";
import base from "./default.js";

// No drawings of its own (as the Netherlands): the neutral vehicles of generic/, the Czech furniture, the Austrian
// stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "LU",
  bounds: [5.73, 49.44, 6.53, 50.19],
  // Filled from the research (NORMY.md): the parking law, norms and signs.
  freeLane: 3,
  parkGuess: true,
  parkByCycleLane: false,
  wideRoads: true,
  roadClassFromOsm: true,
  limits: () => null,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-LU", file: () => null, plate: () => null, label: (x, own, label) => label, drawable: () => false },
  bedOrtho: null,
  laneOrtho: "lu",
  orthoEstimate: true,
  besidePassport: false,
  panorama: false,
  art: { luxembourg: { ...czechFurniture, ...atPosts } },
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-be"],
};
