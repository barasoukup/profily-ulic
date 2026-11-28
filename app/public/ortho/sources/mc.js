// Monaco: IGN's orthophoto covers it too (France's service, ortho/sources/fr.js); a cut there asks it as France's (countries/MC.js
// laneOrtho "fr"), so this source is only the map's layer over the principality (`lanes: false`).
import { FR_SERVICE } from "./fr.js";

export const sources = [
  { id: "mc", lanes: false, res: 0.2, credit: "common.orthophotoIgnGeoplateforme", service: FR_SERVICE,
    map: { kind: "bbox", state: "monaco", limit: "inside", suffix: "&TRANSPARENT=TRUE" } },
];
