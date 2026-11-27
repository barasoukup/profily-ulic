// Poland (PL; Bára 21. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/poland.js (Kraków's base map), GUGiK's orthophoto lanes-ortho.js "pl". Sources, norms and signs:
// evaluation/poland/ (SOURCES.md, NORMS.md, ab/).
import { t } from "../i18n.js";
import { GROUP, fmt } from "../norms.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/poland/NORMS.md): the binding regulation on the technical conditions of public roads (RMI 2022,
// Dz.U. 2022 poz. 1518) gives the minimum and the standard; where it is silent (bus lane, parking, tram belt) the
// ministry's non-binding recommendations WR-D only as the base, said so. The class of a road (GP, G, Z, L, D) is not
// in the data: the app's groups by OSM, main streets as Z (the cautious figure), local L, calmed D.
const PL_LANE_BY_GROUP = {
  A: { min: 3.5, zaklad: 3.75, why: t("jízdní pruh dálnice a rychlostní silnice (třídy A a S): 3,75 m, nejméně 3,5 m (RMI 2022 § 17)") },
  B: { min: 2.75, zaklad: 3, why: t("jízdní pruh sběrné ulice (třída Z): 3 m, nejméně 2,75 m; hlavní ulice třídy G 3,5 m (RMI 2022 § 17)") },
  C: { min: 2.5, zaklad: 2.75, why: t("jízdní pruh místní ulice (třída L): 2,75 m, nejméně 2,5 m (RMI 2022 § 17)") },
  D: { min: 2.25, zaklad: 2.5, why: t("jízdní pruh obslužné ulice (třída D): 2,5 m, nejméně 2,25 m (RMI 2022 § 17)") },
};
function limitsPL(s, segs, i) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1, zaklad: 1.8, why: t("chodník: 1,8 m, v obtížných podmínkách nejméně 1 m s místy k vyhnutí (RMI 2022 § 29)") };
    case "stezka_sdilena":
      return { min: 2.5, zaklad: 3, why: t("společná stezka pro chodce a cyklisty: 3 m, nejméně 2,5 m (RMI 2022 § 42 odst. 4)") };
    case "cyklostezka":
      return { min: 1.2, zaklad: 1.5, why: t("stezka pro cyklisty jednosměrná: 1,5 m, nejméně 1,2 m; obousměrná 2,5 m, nejméně 2 m (RMI 2022 § 42 odst. 2 a 3)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 1.25, zaklad: 1.5, why: t("cyklopruh a kontrapas: 1,5 m, nejméně 1,25 m; od podélného stání odstup 0,5 m (RMI 2022 § 42 odst. 5, § 44)") };
    case "bus": case "bus_cyklo":
      return { min: 3, zaklad: 3.25, why: t("vyhrazený pruh pro autobusy: doporučeno 3,25 m, nejméně 3 m (doporučení ministerstva WR-D-24-2, nezávazné)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      // A roadway of one lane: at least 3.5 m (RMI 2022 § 17 odst. 3; the hostile review).
      if (segs.filter((x) => x.type === "pruh" || x.type === "pruh_piktokoridor").length === 1) return { min: 3.5, zaklad: 3.5, why: t("jednopruhová vozovka: nejméně 3,5 m (RMI 2022 § 17 odst. 3)") };
      return PL_LANE_BY_GROUP[GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]] || null;
    case "parkovani":
      if (s.orient === "sikme") return null;
      return s.orient === "kolme" ? { min: 0, zaklad: 5, why: t("kolmé stání: 2,5 × 5 m (doporučení ministerstva WR-D-24-2, nezávazné)") }
        : { min: 0, zaklad: 2.5, why: t("podélné stání: 2,5 × 6 m (doporučení ministerstva WR-D-24-2, nezávazné)") };
    default:
      return null;
  }
}

// The signs of the state PL (app/public/signs-PL/, README there; Rozporządzenie w sprawie znaków i sygnałów
// drogowych, Dz.U. 2019 poz. 2310; Wikimedia Commons, public domain: road signs are no subject of copyright, art. 4
// of the Polish copyright act). Poland has no sign of a pedestrian zone or a cycle street.
const PL_FILE = { ip25a: "D-44", b1: "B-1", b11: "B-3", b8: "B-9", b30: "B-41", b28: "B-36", b29: "B-35", ip11a: "D-18", ztp: "D-18", ip12: "D-18a", ip14a: "D-9",
  ip15a: "D-7", ip20a: "D-12", zona30: "B-43-30", ip26a: "D-40", c8a: "C-13", c9a: "C-13-16", c10a: "C-13-16a", c7a: "C-16" };
const PL_CODE = { ...PL_FILE, zona30: "B-43", ztp: "D-18 + T-29", c9a: "C-13/16", c10a: "C-13/16" };
const PL_SPEEDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // D-3 where the lane goes away, B-2 (no entry) where it comes towards the viewer; with cyclists in contraflow both
  // with the plate T-22 (drawn in the files).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "B-2_T-22" : "B-2") : s.plate === "protismer" ? "D-3_T-22" : "D-3";
  if (s.k === "b20a") return PL_SPEEDS.includes(s.v) ? `B-33-${s.v}` : null;
  // C-13/16 segregated: the cyclists on the left and the pedestrians on the right, or the other way (as C 10a).
  if (s.k === "c10a") return s.walk === "left" ? "C-13-16b" : "C-13-16a";
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate) && s.k !== "ztp") return null;
  return PL_FILE[s.k] || null;
}
const plateFile = (s) => (s.k === "ztp" ? "T-29" : null);
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "B-2" : "D-3") + (x.plate === "protismer" ? " + T-22" : "") : x.k === "b20a" ? "B-33" : PL_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
};

const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "PL",
  bounds: [14.1, 49.0, 24.2, 54.9],
  // Prawo o ruchu drogowym art. 46–49: no free width for traffic beside parked cars in the law (as Luxembourg; Bára
  // 21. 11. 2026 for Luxembourg: then parking is allowed almost everywhere, all the more estimated); the lanes beside
  // the cars stay drivable, 3 m at least. Art. 47: on the sidewalk only where 1.5 m is left for pedestrians.
  freeLane: 3,
  lawNeed: (oneway, lanes, minLane) => Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes)),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Na chodníku se smí stát, je-li široký aspoň 1,5 m a stání neomezí chodce (čl. 47 zákona o silničním provozu), volnou šířku vozovky zákon neuvádí; aplikace nechává průjezdné pruhy, tedy aspoň {need}.", { free, need }),
  parkGuess: true,
  // RMI 2022 § 44 odst. 2: parking beside a cycle lane only parallel and 0.5 m from it (art. 49 forbids stopping on the
  // lane itself, not beside it: the hostile review).
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsPL,
  // A contraflow cycle lane (kontrapas): 1.5 m (RMI 2022 § 42 odst. 5), no width of the whole street.
  contraflow: () => null,
  // The ministry's recommendation WR-D-43-3 (non-binding): two tracks for a 2.4 m car 6.8 m, at least 6.3 m, with the
  // poles between the tracks 7.8 m.
  tramBelt(belt, w) {
    // Tracks in the roadway shared with cars (type TC/TD of WR-D-43-3): 6 m at least, 7 m as the base (the hostile review).
    if (belt.length && belt.every((x) => x.type === "tramvaj_pruh" || x.type === "tramvaj_v_pruhu")) {
      if (w < 6 - 0.005) return [{ level: "min", text: t("Tramvajový pás ve vozovce {w} je užší než 6 m (doporučení WR-D-43-3, typ TC/TD).", { w: fmt(w) }) }];
      if (w < 7 - 0.005) return [{ level: "zaklad", text: t("Tramvajový pás ve vozovce {w} je užší než 7 m (doporučení WR-D-43-3, typ TC/TD).", { w: fmt(w) }) }];
      return [];
    }
    const poles = belt.some((x) => x.items?.some((it) => it.kind === "sloup_trakce"));
    if (w < 6.3 - 0.005) return [{ level: "min", text: t("Tramvajový pás {w} je užší než 6,3 m pro dvě koleje (doporučení WR-D-43-3).", { w: fmt(w) }) }];
    if (poles && w < 7.8 - 0.005) return [{ level: "zaklad", text: t("Tramvajový pás se sloupy {w} je užší než 7,8 m (doporučení WR-D-43-3).", { w: fmt(w) }) }];
    if (!poles && w < 6.8 - 0.005) return [{ level: "zaklad", text: t("Tramvajový pás {w} je užší než 6,8 m (doporučení WR-D-43-3).", { w: fmt(w) }) }];
    return [];
  },
  signs: { dir: "signs-PL", file: signFile, plate: plateFile, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "pl",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { poland: { ...czechFurniture, ...atPosts } },
  // Panel houses (wielka płyta) and socialist realism are common in Poland as in Czechia: the Czech looks are kept.
  socialistLooks: true,
  search: ["uug"],
};
