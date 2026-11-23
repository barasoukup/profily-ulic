// Monaco (MC; Bára 23. 11. 2026): France's settings where Monaco has nothing of its own, its own where it has
// (evaluation/monaco/PRAVIDLA.md): the source is towns/monaco.js (the estimate), the orthophoto IGN's French one
// (lanes-ortho.js "fr", which covers Monaco).
import { t } from "../i18n.js";
import FR from "./FR.js";
import { CZ_CODE } from "./default.js";

export default {
  ...FR,
  code: "MC",
  bounds: [7.40, 43.72, 7.44, 43.76],
  // Code de la route of Monaco art. 31: parking only where the road marking shows it, so no estimate by the law (only
  // OSM's parking); art. 32 1°: parking on the sidewalk is "gênant".
  parkGuess: false,
  halfKerbNote: (free) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je v Monaku zakázané (čl. 32 zákona o silničním provozu), stát se smí jen na místech vyznačených na vozovce (čl. 31).", { free }),
  // No widths of streets in Monaco's law (its accessibility law is about buildings): no warning; France's numbers do not
  // apply there.
  limits: () => null,
  // The look of France's signs (the Geneva protocol of 1949, ordonnance 793/1953), without the French numbers.
  signs: { ...FR.signs, label: (x, own, label) => label.replace(CZ_CODE, "") },
  // IGN's French orthophoto covers Monaco; no tram, no panorama; contraflow as France.
  laneOrtho: "fr",
  bedOrtho: null,
  panorama: false,
  contraflow: FR.contraflow,
  tramBelt: FR.tramBelt,
  art: { monaco: FR.art.france },
  search: ["photon-mc"],
};
