// Monaco (MC; Bára 23. 11. 2026): France's settings where Monaco has nothing of its own, its own where it has
// (evaluation/monaco/RULES.md): the source is towns/monaco.js (the estimate), the orthophoto IGN's French one
// (lanes-ortho.js "fr", which covers Monaco).
import { t } from "../i18n.js";
import FR from "./FR.js";
import { CZ_CODE } from "./default.js";
import { mediterraneanDetails, monacoLook } from "../house-looks.js";

// The signs with a footing in Monaco's Code de la route (evaluation/monaco/RULES.md 1; Bára 23. 11. 2026: no French
// sign the code does not know): entry bans, parking, one-way, the reserved lane (art. 32), the cycle track (art. 1), the
// aire piétonne (art. 1), speeds only 30, 50 and 70 (art. 11). Not drawn: zone 30, zone de rencontre (not in the code),
// the voie verte, the motorway and the route express (French notions), the path for pedestrians, the contraflow plate
// ("double sens cyclable" not in the code). The drawings are France's (signs-FR/, without the French numbers).
const MC_SIGNS = new Set(["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip20a", "ip27a", "c8a", "oneway"]);
const MC_SPEEDS = [30, 50, 70];
function signFile(s, seg) {
  if (s.k === "b20a") return MC_SPEEDS.includes(s.v) ? FR.signs.file(s, seg) : null;
  if (!MC_SIGNS.has(s.k) || (s.k === "oneway" && s.plate === "protismer")) return null;
  return FR.signs.file(s, seg);
}

// What Monaco takes from France knowingly: the parking law's figure (lawNeed; unused, no estimate here), the reach
// beside a town's map (besideMax: Paris's boulevards, not tried in Monaco), the look of the
// houses without panel houses, the estimate from OSM and the orthophoto. Nothing of these was decided for Monaco.
export default {
  ...FR,
  code: "MC",
  // The east tip lies at 7.43987 (OSM): a margin beyond it.
  bounds: [7.40, 43.72, 7.445, 43.76],
  // Code de la route of Monaco art. 31: parking only where the road marking shows it, so no estimate by the law (only
  // OSM's parking); art. 32 1°: parking on the sidewalk is "gênant".
  parkGuess: false,
  // The Code de la route is an ordonnance souveraine (n° 1.691 of 1957), not a law (the review of 23. 11. 2026).
  halfKerbNote: (free) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je v Monaku zakázané (čl. 32 pravidel silničního provozu, Code de la route), stát se smí jen na místech vyznačených na vozovce (čl. 31).", { free }),
  // No widths of streets in Monaco's law (its accessibility law is about buildings): no warning; France's numbers do not
  // apply there.
  limits: () => null,
  // The look of France's signs (Monaco follows the Geneva protocol of 1949, ordonnance 793/1953; that its signs look
  // French is an observation, RULES.md 3), without the French numbers. No zone sign is drawn, so none hides a speed
  // but the aire piétonne's.
  signs: { ...FR.signs, file: signFile, drawable: (x, seg) => !!signFile(x, seg), label: (x, own, label) => label.replace(CZ_CODE, ""), zoneSpeed: { ip27a: 20 } },
  // IGN's French orthophoto covers Monaco; no tram, no panorama; contraflow as France.
  laneOrtho: "fr",
  bedOrtho: null,
  panorama: false,
  contraflow: FR.contraflow,
  tramBelt: FR.tramBelt,
  art: { monaco: FR.art.france },
  search: ["photon-mc"],
  // The regional looks of its old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026).
  houseLook: monacoLook,
  houseDetails: mediterraneanDetails("MC"),
};
