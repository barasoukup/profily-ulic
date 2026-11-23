// Cyprus (CY; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Traffic keeps LEFT
// (leftHand: derive.js reads the directions of a two-way roadway the other way round, every part in place). Its sources
// are towns/cyprus.js (the estimate, the DLS buildings), the DLS orthophoto lanes-ortho.js "cy". Sources, norms and
// signs: evaluation/cyprus/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/cyprus/NORMY.md D): no binding widths of streets found; all from the Public Works Department's
// design manual (recommendations). No warning for parking (no figure found) or a tram (none in Cyprus).
function limitsCY(s) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 2, zaklad: 2.5, why: t("chodník: 2 m u místních a obslužných ulic, 2,5 m u sběrných (příručka odboru veřejných prací Kypru, doporučení)") };
    case "cyklopruh":
      return { min: 1.5, zaklad: 1.5, why: t("cyklopruh: 1,5 m, v protisměru 2 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "cyklostezka":
      return { min: 2, zaklad: 2, why: t("stezka pro cyklisty: jednosměrná 2 m, obousměrná 3 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "bus":
      return { min: 3, zaklad: 3.5, why: t("vyhrazený pruh BUS: 3,5 m, nejméně 3 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "bus_cyklo":
      return { min: 3.5, zaklad: 4, why: t("společný pruh pro autobusy a cyklisty: 4 m, nejméně 3,5 m (příručka odboru veřejných prací Kypru, doporučení)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return { min: 0, zaklad: 3, why: t("jízdní pruh: 3 m u obslužných ulic, 3,5 m u sběrných (příručka odboru veřejných prací Kypru, doporučení)") };
    default:
      return null;
  }
}

// The signs of the state CY (pilot/public/signs-CY/, README there; the Highway Code of 2012 under reg. 71 of 66/1984).
// The Code has no numbers: the label is the sign's name. Cyprus excludes no official text from copyright, so only files
// of Commons with their own licence (UK signs under the Open Government Licence v1.0, credited in the footer; Cypriot
// and Vienna-convention ones in the public domain; evaluation/cyprus/signs-licence.json). No zone 30, shared zone,
// cycle street or "except cycles" plate in the Code: left out (one-way with contraflow cycling: the plain no entry).
const CY_FILE = { b1: "b1", b11: "b11", b8: "b8", b30: "b30", b28: "b28", b29: "b29", ip11a: "p", ip14a: "motorway", ip15a: "expressway", ip20a: "bus",
  ip26a: "ip26a", ip27a: "ped", c7a: "ped", c8a: "c8a", c9a: "c9a", c10a: "c10a" };
const CY_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  if (s.k === "oneway") return dir === "backward" ? "noentry" : "oneway";
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
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Na Kypru je stání i zastavení na chodníku zakázané bez výjimky (předpis 66/1984, čl. 58); aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsCY,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-CY", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "cy",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { cyprus: { ...czechFurniture, ...atPosts } },
  // No panel houses: a flat-roofed slab is the plain flat-roofed house, after 1990 the modern one.
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-cy"],
};
