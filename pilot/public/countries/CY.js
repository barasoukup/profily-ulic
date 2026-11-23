// Cyprus (CY; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Traffic keeps LEFT
// (leftHand: derive.js reads the directions of a two-way roadway the other way round, every part in place). Its sources
// are towns/cyprus.js (the estimate, the DLS buildings), the DLS orthophoto lanes-ortho.js "cy". Sources, norms and
// signs: evaluation/cyprus/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { GROUP } from "../norms.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/cyprus/NORMY.md D): no binding widths of streets found; all from the Public Works Department's
// design manual (recommendations). No warning for parking (no figure found) or a tram (none in Cyprus).
// The manual's distributors (primary and secondary) by OSM's class (primary, secondary, trunk: GROUP A and B; derive.js
// osmGroup); the rest are its local distributors and access roads.
const CY_MAIN = new Set(["A", "B"]);
const mainStreet = (s, segs = []) => CY_MAIN.has(GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]);
// A cycle lane against the traffic of the lane beside it (derive.js gives a contraflow lane the other direction).
const DRIVING = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]);
function contraflowLane(s, segs = [], i = -1) {
  if (!s.dir || i < 0) return false;
  for (let d = 1; d < segs.length; d++) for (const x of [segs[i - d], segs[i + d]]) if (x && DRIVING.has(x.type) && x.dir) return x.dir !== s.dir;
  return false;
}
function limitsCY(s, segs, i) {
  switch (s.type) {
    // The manual's footway widths are recommendations for new streets ("a guide to good practice only", which gives a
    // footpath 1.2 m): no red, the basic width orange (the review of 23. 11. 2026).
    case "chodnik": case "chodnik_kola":
      return { min: 0, zaklad: mainStreet(s, segs) ? 2.5 : 2, why: t("chodník: 2 m u místních a obslužných ulic, 2,5 m u sběrných (příručka odboru veřejných prací Kypru, doporučení)") };
    case "cyklopruh":
      return contraflowLane(s, segs, i) ? { min: 2, zaklad: 2, why: t("cyklopruh: 1,5 m, v protisměru 2 m (příručka odboru veřejných prací Kypru, doporučení)") }
        : { min: 1.5, zaklad: 1.5, why: t("cyklopruh: 1,5 m, v protisměru 2 m (příručka odboru veřejných prací Kypru, doporučení)") };
    // A track without a direction is a two-way one (OSM's default): 3 m orange, 2 m red as one way.
    case "cyklostezka":
      return { min: 2, zaklad: s.dir ? 2 : 3, why: t("stezka pro cyklisty: jednosměrná 2 m, obousměrná 3 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "bus":
      return { min: 3, zaklad: 3.5, why: t("vyhrazený pruh BUS: 3,5 m, nejméně 3 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "bus_cyklo":
      return { min: 3.5, zaklad: 4, why: t("společný pruh pro autobusy a cyklisty: 4 m, nejméně 3,5 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return { min: 0, zaklad: mainStreet(s, segs) ? 3.5 : 3, why: t("jízdní pruh: 3 m u obslužných ulic, 3,5 m u sběrných (příručka odboru veřejných prací Kypru, doporučení)") };
    default:
      return null;
  }
}

// The signs of the state CY (pilot/public/signs-CY/, README there; the Highway Code of 2012 under reg. 71 of 66/1984).
// The Code has no numbers: the label is the sign's name. Cyprus excludes no official text from copyright, so only files
// of Commons with their own licence (UK signs under the Open Government Licence v1.0, credited in the footer; Cypriot
// and Vienna-convention ones in the public domain; evaluation/cyprus/signs-licence.json). No zone 30, shared zone,
// cycle street or "except cycles" plate in the Code: left out, and a one-way street with contraflow cycling has no
// sign (no entry alone would say the opposite of the profile; the review of 23. 11. 2026). C 10a by the side of the
// pedestrians (the Code shows both forms; the left one is UK 957 mirrored).
const CY_FILE = { b1: "b1", b11: "b11", b8: "b8", b30: "b30", b28: "b28", b29: "b29", ip11a: "p", ip14a: "motorway", ip15a: "expressway", ip20a: "bus",
  ip26a: "ip26a", ip27a: "ped", c7a: "ped", c8a: "c8a", c9a: "c9a" };
const CY_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  if (s.k === "oneway") return s.plate === "protismer" ? null : dir === "backward" ? "noentry" : "oneway";
  if (s.k === "c10a") return s.walk === "left" ? "c10a-chodci-vlevo" : "c10a";
  if (s.k === "b20a") return CY_SPEEDS.includes(s.v) ? `speed-${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return CY_FILE[s.k] || null;
}
const signLabel = (x, own, label) => label.replace(CZ_CODE, "");

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "CY",
  bounds: [32.2, 34.5, 34.65, 35.75],
  // Traffic keeps left.
  leftHand: true,
  // The Highway Code gives no free width beside parked cars ("so that two cars can pass"): read as 3 m a direction as
  // elsewhere (NORMY.md B1; for Bára). Parking on the sidewalk is banned without exception (reg. 58(4) and 58(9)).
  freeLane: 3,
  // Art. 58(4) read in its text of 1984 (the consolidated one not opened; NORMY.md B2): said so.
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Na Kypru je stání i zastavení na chodníku zakázané bez výjimky (předpis 66/1984, čl. 58 odst. 4 v původním znění; Kodex silničního provozu 2012); aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsCY,
  contraflow: () => null,
  tramBelt: () => [],
  // ogl: the files drawn after British signs under the Open Government Licence v1.0, whose credit a cut showing one needs
  // ("Contains public sector information licensed under the Open Government Licence v1.0"; for the export, app.js).
  signs: { dir: "signs-CY", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg),
    ogl: new Set(["b1", "b8", "b28", "b29", "bus", "noentry", "c8a", "c9a", "c10a", "c10a-chodci-vlevo"]) },
  bedOrtho: null,
  laneOrtho: "cy",
  orthoEstimate: true,
  panorama: false,
  art: { cyprus: { ...czechFurniture, ...atPosts } },
  // No panel houses: a flat-roofed slab is the plain flat-roofed house, after 1990 the modern one.
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-cy"],
};
