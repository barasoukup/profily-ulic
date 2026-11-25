// The Netherlands (NL; Bára 20. 11. 2026): what differs from the Czech rules of countries/default.js. The national
// large-scale topography (BGT) and the buildings of the BAG are towns/netherlands.js, PDOK's orthophoto lanes-ortho.js "nl".
// Sources, norms and signs: evaluation/netherlands/ (ZDROJE.md, NORMY.md, RECENZE.md).
import { t } from "../i18n.js";
import { GROUP } from "../norms.js";
import { TOWN_ART, czechFurniture } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { netherlandsLook } from "../house-looks.js";

// Norms (evaluation/netherlands/NORMY.md): CROW's ASVV 2021 and Ontwerpwijzer fietsverkeer are not public: their
// values as CROW-Fietsberaad's discussion notes, CROW's GOW30 guide and Amsterdam's handbooks quote them, said so.
// Where no source was found (a bus lane, angled parking, a tram belt, a path shared with pedestrians), no warning.
const NL_LANE_BY_GROUP = {
  B: { min: 2.5, zaklad: 2.9, why: t("jízdní pruh ulice s 50 km/h: 2,9 m, vozovka nejméně 5,8 m, při nedostatku místa pruh 2,5 m (CROW-Fietsberaad 2014; CROW GOW30 2023 podle ASVV 2021)") },
};
function limitsNL(s, segs, i) {
  // Parallel parking beside (the figures of CROW-Fietsberaad 2014 are for it, not for perpendicular or angled bays).
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani" && !["kolme", "sikme"].includes(x.orient));
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.8, zaklad: 2, why: t("chodník: volný průchod nejméně 1,8 m, základ 2–2,2 m (Amsterdam, Ruimte voor de voetganger 2020 a Handboek Rood 2024)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return NL_LANE_BY_GROUP[GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]] || null;
    case "cyklopruh": case "ochranny_pruh":
      return parking ? { min: 1.7, zaklad: 2, why: t("cyklopruh vedle podélného stání: nejméně 1,7 m, základ 2 m, stání vedle něj aspoň 2,3 m (CROW-Fietsberaad 2014)") }
        : { min: 1.5, zaklad: 2, why: t("cyklopruh (fietsstrook): základ 2–2,5 m; ASVV 2021 nejméně 2 m, starší doporučení CROW 1,5 m (podle CROW-Fietsberaad 2014)") };
    case "cyklostezka":
      return { min: 2, zaklad: 2.2, why: t("stezka pro cyklisty jednosměrná: nejméně 2 m, základ 2,2 m; obousměrná 2,5 m a 3,5 m (CROW-Fietsberaad 2021 podle doporučení CROW)") };
    case "parkovani":
      if (s.orient === "sikme") return null;
      return s.orient === "kolme" ? { min: 5, zaklad: 5, why: t("kolmé stání: 2,5 × 5 m (ASVV 2012 podle parkovacích norem obce Oost Gelre)") }
        : { min: 2, zaklad: 2, why: t("podélné stání: 2 × 6 m (ASVV 2012 podle obce Oost Gelre), v Amsterdamu 2,1–2,4 m") };
    default:
      return null;
  }
}

// The signs of the state NL (pilot/public/signs-NL/, README there; RVV 1990, Bijlage 1, Wikimedia Commons, Dutch
// official works in the public domain, art. 11 Auteurswet). The plates (onderborden) are not drawn: a sign with one is
// left out (alone it would forbid what the plate allows). The Netherlands has no sign for a footway shared with
// cyclists (C 9a, C 10a), a cycle street or a shared zone; a cycle lane is a marking.
const NL_CODE = { b1: "C1", b11: "C12", b8: "C14", b30: "C16", b20a: "A1", b28: "E2", b29: "E1", c8a: "G11", c7a: "G7", ip11a: "E4", ztp: "E6",
  ip12: "E9", ip14a: "G1", ip15a: "G3", ip20a: "F13", zona30: "A1 zone", ip26a: "G5", ip27a: "G7 zone" };
const NL_FILE = { b1: "C1", b11: "C12", b8: "C14", b30: "C16", b28: "E2", b29: "E1", c8a: "G11", c7a: "G7", ip11a: "E4", ztp: "E6", ip12: "E9",
  ip14a: "G1", ip15a: "G3", ip20a: "F13", zona30: "A1_30_Zone", ip26a: "G5", ip27a: "G7_Zone" };
const NL_SPEEDS = [20, 30, 50, 60, 70, 80, 100, 120, 130];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // C3 where the lane goes away (a one-way road), C2 where it comes towards the viewer; C2 with cyclists in
  // contraflow would need the plate "uitgezonderd fietsers" (not drawn: left out), C3 holds for them too.
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? null : "C2") : "C3";
  if (s.k === "b20a") return NL_SPEEDS.includes(s.v) ? `A1-${s.v}` : null;
  // Only the forms of parking are no plate of their own (the E4 alone); the disabled are inside E6.
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate) && s.k !== "ztp") return null;
  return NL_FILE[s.k] || null;
}
const plateFile = () => null;
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? ((x.dir === "backward") ? "C2" : "C3") : NL_CODE[x.k];
  return code ? `RVV ${code} ${label.replace(CZ_CODE, "")}` : label;
};

// No drawings of its own (Bára 20. 11. 2026: "stačí s univerzálními ilustracemi"): the neutral vehicles of generic/,
// the Czech furniture, the Austrian stop posts (a round sign with the bus, as the Dutch stops have none of the Czech
// kind; the shelter is a plain glass one).
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "NL",
  bounds: [3.3, 50.7, 7.3, 53.6],
  // RVV 1990 art. 23–26 give no width left beside parked cars (evaluation/netherlands/NORMY.md): the practice is 3.5 m
  // free for the fire brigade (Handreiking Bereikbaarheid Hulpdiensten 2018) on a one-way street and a roadway of 4.5 m
  // for two-way traffic (CROW-Fietsberaad 2014, a mixed 30 km/h street); the lanes beside the cars stay drivable.
  freeLane: 3.5,
  lawNeed: (oneway, lanes, minLane) => Math.max(oneway ? 3.5 : 4.5, minLane * Math.max(oneway ? 1 : 2, lanes)),
  // Two wheels on the sidewalk only where the sign E8b allows it (RVV 1990 art. 10); else a parked car on the
  // sidewalk is an offence.
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Smí se jen u značky E8b (RVV 1990 čl. 10). Zákon šířku neuvádí, v praxi 3,5 m pro hasiče na jednosměrce a 4,5 m vozovky pro oba směry; aplikace nechává průjezdné pruhy, tedy aspoň {need}.", { free, need }),
  // RVV 1990 art. 23 (1b): no stopping on a cycle lane nor on the roadway beside it.
  parkByCycleLane: false,
  parkGuess: true,
  roadClassFromOsm: true,
  limits: limitsNL,
  // A one-way street with contraflow cyclists: Amsterdam's cycle street of one way for cars, both for bicycles, 3.5 m,
  // 4 m as the base (Afwegingskader fietsstraten 2020); no national figure.
  contraflow: () => ({ lo: 3.5, base: 4, why: t("jednosměrka s cyklisty v protisměru: vozovka nejméně 3,5 m, základ 4 m (Amsterdam, Afwegingskader fietsstraten 2020)") }),
  tramBelt: () => [],
  signs: { dir: "signs-NL", file: signFile, plate: plateFile, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "nl",
  orthoEstimate: true,
  // The BGT covers all land: a street's surface ends at a front garden or a yard, filled up to the houses within 25 m.
  besideMax: 25,
  panorama: false,
  art: { netherlands: { ...czechFurniture, ...atPosts } },
  search: ["pdok"],
  // The regional looks of its old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026).
  houseLook: netherlandsLook,
  houseDetails: null,
};
