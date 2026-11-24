// Slovenia (SI; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/slovenia.js (the buildings of GURS's cadastre), GURS's orthophoto lanes-ortho.js "si". Sources, norms and signs:
// evaluation/slovenia/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { GROUP } from "../norms.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";

// Norms (evaluation/slovenia/NORMY.md A): the Pravilnik o kolesarskih površinah (36/18) and the Pravilnik o projektiranju
// cest (91/05 …), both "no longer in force but still applied" until the rules of ZCes-2 come: binding for new roads, so the
// design widths orange and only the cycling minima red. No minimum width of a sidewalk was found (none warned), nor of
// perpendicular or angled parking; there are no trams.
const SI_LANE_A = { min: 0, zaklad: 3.25, why: t("jízdní pruh dálkové silnice (70 km/h a víc): 3,25–3,75 m (pravidlo o projektování silnic, čl. 28)") };
const SI_LANE = { min: 0, zaklad: 2.5, why: t("jízdní pruh místní a sběrné ulice do 50 km/h: 2,5 m (pravidlo o projektování silnic, čl. 28)") };
function limitsSI(s, segs = [], i = -1) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik":
      // ZPrCP čl. 65: a car on the sidewalk (only where signs allow it) leaves the pedestrians 1.6 m away from the roadway.
      return parking?.position ? { min: 1.6, zaklad: 1.6, why: t("zbytek chodníku vedle stání na chodníku: nejméně 1,6 m (zákon o pravidlech silničního provozu, čl. 65)") } : null;
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 1.6, zaklad: 2, why: t("společná stezka pro chodce a cyklisty: 2 m, výjimečně 1,6 m (pravidlo o cyklistických plochách, čl. 15)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 1, zaklad: 1.75, why: t("cyklopruh: 1,75 m, nejméně 1 m (pravidlo o cyklistických plochách, čl. 14)") };
    case "cyklostezka":
      // A half of a two-way track by the whole track; one-way, or without a direction (derive.js gives OSM's one-way
      // tracks none), by the one-way figure (countries/cycletrack.js; the review of 24. 11. 2026).
      return cycleTrackLimits(s, segs, i, { min: 1, zaklad: 2, why: t("jednosměrná stezka pro cyklisty: 2 m, nejméně 1 m (pravidlo o cyklistických plochách, čl. 13)") },
        { min: 2, zaklad: 3, why: t("obousměrná stezka pro cyklisty: 3 m, nejméně 2 m (pravidlo o cyklistických plochách, čl. 13)") });
    case "bus":
      return { min: 0, zaklad: 3, why: t("pruh pro veřejnou dopravu: nejméně 3 m (pravidlo o projektování silnic, čl. 32)") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme" ? null : { min: 0, zaklad: 2.5, why: t("podélné stání: 2,5 m (pravidlo o projektování silnic, čl. 33)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 3, why: t("řadicí pruh pro odbočení vlevo ve městě: 3 m, při málo nákladních vozidlech 2,75 m (pravidlo o projektování silnic, čl. 28)") };
      // The OSM class as the regulation's kind of road is the app's reading (NORMY.md A): a motorway or trunk road as a
      // "daljinska cesta", a primary or secondary one (GROUP B) none: it may be a collector street of 50 km/h (2.5 m) or a
      // "povezovalna cesta" of 60–90 km/h (2.75–3.5 m) and the app knows neither its kind nor its design speed (the review
      // of 24. 11. 2026); the rest as the local and collector streets of 50 km/h.
      switch (GROUP[s.roadClass ?? segs.find((x) => x?.roadClass)?.roadClass]) {
        case "A": return SI_LANE_A;
        case "B": return null;
        default: return SI_LANE;
      }
    default:
      return null;
  }
}

// A one-way street with contraflow cyclists (Pravilnik o kolesarskih površinah čl. 38): odst. 2 lets them ride both ways
// on a one-way access road (dostopna cesta) and in a zone of calmed traffic with no width given; odst. 4 asks 3.2 m of
// the "other" streets in a town, odst. 5 3 m where a zone of calmed traffic is set up. So only on a collector road or
// above (the OSM class tertiary and up, GROUP A–C; the review of 24. 11. 2026): a residential, living or service street
// (mk4) and a road of unknown class get no warning, the lanes keep their own. run: the carriageway's parts (rules.js);
// without it (an older caller) none, so no width is claimed where the article gives none.
const CONTRA_SI = { lo: 3, base: 3.2, why: t("jednosměrka s cyklisty v protisměru: vozovka nejméně 3,2 m, v zóně zklidněného provozu 3 m (pravidlo o cyklistických plochách, čl. 38)") };
export const contraflowSI = (parked, run) => (Array.isArray(run) && run.some((x) => ["A", "B", "C"].includes(GROUP[x?.roadClass])) ? CONTRA_SI : null);

// The signs of the state SI (pilot/public/signs-SI/, README there). The numbers are those of the rule of 2015 kept by
// the Pravilnik o prometni signalizaciji of 2024 (from the AVP's booklet, second hand; NORMY.md C); the drawings on
// Wikimedia Commons are mostly of the rule of 2000 (II-x, III-x), the file named by the current number. Official texts are
// not protected (ZASP čl. 9/1/2; that it covers the drawings is Commons' reading, Bára to confirm). Slovenia has no
// cycle street or zone, and no drawing of the reserved parking space 2441 nor of the road for motor vehicles 2405.
const SI_FILE = { b1: "2202", b11: "2215", b8: "2206", b30: "2214", b28: "2236", b29: "2237", ip11a: "2436", ip14a: "2401", ip20a: "2411",
  zona30: "2421", ip26a: "2427", ip27a: "2423", sdilena: "2445", c8a: "2309", c9a: "2315", c10a: "2313", c7a: "2311" };
export const SI_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // 2407 where the lane goes away (a one-way street), 2201 where it comes towards the viewer; the plate of cyclists in
  // contraflow has no drawing, so then only the one-way sign (it holds for the cars) and no "no entry".
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? null : "2201") : "2407";
  if (s.k === "b20a") return SI_SPEEDS.includes(s.v) ? `2232-${s.v}` : null;
  // 2313: the pedestrians on the left of the drawing (Commons II-42), on the right II-42.1 (2313-1); without data the
  // pedestrians on the right, as the Czech C 10a.
  if (s.k === "c10a") return s.walk === "left" ? "2313" : "2313-1";
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate)) return null;
  return SI_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "2201" : x.dir === "forward" ? "2407" : "2407 / 2201") : x.k === "b20a" ? "2232" : SI_FILE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "SI",
  bounds: [13.3, 45.4, 16.7, 46.9],
  // ZPrCP čl. 65 odst. 4 bod 10: no stopping where less than 3 m is left beside the car (NORMY.md B), 3 m a direction as
  // elsewhere. Odst. 4 bod 12: none on the roadway of a two-way street in a town without a centre line; bod 14: none on
  // a one-way carriageway of two or more lanes. A centre line is read from OSM (two lanes or more, lane_markings not
  // "no"): a street without a lanes tag gets no estimate.
  freeLane: 3,
  parkOnRoadway: (tags, oneway, lanes) => (oneway ? lanes < 2 : Number(tags.lanes) >= 2 && tags.lane_markings !== "no"),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Ve Slovinsku smí auto stát na chodníku jen tam, kde to dovolí značka, a chodcům musí zůstat aspoň 1,6 m chodníku dál od vozovky (čl. 65 zákona o pravidlech silničního provozu); aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsSI,
  contraflow: contraflowSI,
  tramBelt: () => [],
  signs: { dir: "signs-SI", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "si",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { slovenia: { ...czechFurniture, ...atPosts } },
  // The Yugoslav estates are not the Czech panel houses (Bára 23. 11. 2026): the postwar look of the shared rule.
  socialistLooks: false,
  search: ["photon-si", "gurs"],
};
