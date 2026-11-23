// France (FR; Bára 22. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/france.js (Paris's Plan de voirie, IGN's BD TOPO), IGN's orthophoto lanes-ortho.js "fr". Sources, norms and
// signs: evaluation/france/ (ZDROJE.md, NORMY.md, ab/).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/france/NORMY.md): France has no binding national table of widths beyond accessibility (the arrêté
// of 15. 1. 2007 on the accessibility of streets: a sidewalk's free passage 1.4 m, 1.2 m where nothing stands beside
// it). Cycling by CEREMA's national recommendations (second hand: the ministry's annex and Paris's guide citing them)
// and Paris's guide of 2023; parking by Paris's guide; lanes by Grand Lyon's reference of 2010, only as the base
// (orange; Lyon's is a city's figure). No warning for a bus lane alone, a tram belt (no source found) or angled parking.
const lanes = (segs) => segs.filter((x) => x.type === "pruh" || x.type === "pruh_piktokoridor");
function limitsFR(s, segs) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      // 1.2 m only with no wall nor obstacle on either side (de part et d'autre): a sidewalk at a facade has one (the
      // hostile review); the arrêté as published in 2007, a later amendment not verified (NORMY.md).
      return { min: 1.4, zaklad: 1.8, why: t("chodník: volný průchod nejméně 1,4 m, 1,2 m jen bez zdi a překážek po obou stranách (vyhláška o přístupnosti ulic z 15. 1. 2007, čl. 1, znění z roku 2007); Paříž doporučuje 1,8 m") };
    case "stezka_sdilena":
      return { min: 0, zaklad: 3, why: t("zelená cesta (voie verte) pro chodce a cyklisty: doporučeno 3 m, při silném provozu 3,5–4 m (doporučení CEREMA)") };
    case "cyklostezka":
      return { min: 1.6, zaklad: 2, why: t("stezka pro cyklisty jednosměrná: 2 m, nejméně 1,6 m; obousměrná 3 m, nejméně 2,5 m (doporučení CEREMA a příručka Paříže 2023)") };
    case "cyklopruh":
      // Paris's 1 m is for a short stretch only (the hostile review): Lyon's 1.2 m as the minimum.
      return { min: 1.2, zaklad: 1.5, why: t("cyklopruh: 1,5 m (doporučení CEREMA a příručka Paříže 2023), nejméně 1,2 m (Grand Lyon 2010); od podélného stání odstup 0,5 m") };
    case "bus_cyklo":
      return { min: 3, zaklad: 3.2, why: t("společný pruh pro autobusy a cyklisty: 3,2–3,5 m, nejméně 3 m (doporučení CEREMA)") };
    case "pruh": case "pruh_piktokoridor": {
      if (s.turn) return null;
      const L = lanes(segs), oneway = L.length > 0 && L.every((x) => (x.dir ?? "forward") === (L[0].dir ?? "forward"));
      // Two lanes or more one way: Grand Lyon's 2.5 m (double voie; the hostile review).
      if (oneway && L.length >= 2) return { min: 0, zaklad: 2.5, why: t("jízdní pruh vícepruhové jednosměrné vozovky: 2,5 m (referenční příručka Grand Lyon 2010, doporučení města)") };
      return oneway ? { min: 0, zaklad: 3, why: t("jízdní pruh jednosměrné ulice: 3–3,25 m (referenční příručka Grand Lyon 2010, doporučení města)") }
        : { min: 0, zaklad: 2.75, why: t("jízdní pruh obousměrné ulice: 2,75–3,25 m (referenční příručka Grand Lyon 2010, doporučení města)") };
    }
    case "parkovani":
      if (s.orient === "sikme") return null;
      return s.orient === "kolme" ? { min: 4.5, zaklad: 5, why: t("kolmé stání: délka 5 m, nejméně 4,5 m (příručka Paříže 2023, stání)") }
        : { min: 1.8, zaklad: 2, why: t("podélné stání: 2 × 5 m, nejméně 1,8 m (příručka Paříže 2023, stání)") };
    default:
      return null;
  }
}

// The signs of the state FR (pilot/public/signs-FR/, README there; arrêté of 24. 11. 1967 on the signs of roads and
// motorways; Wikimedia Commons). Official works as in Luxembourg (Bára 21. 11. 2026: "značky jsou úřední dílo"; for France
// 23. 11. 2026: "Značky jsou volně"): the
// CC BY-SA of a redrawing on Commons is not credited. France has no sign of a cycle street, a paid zone or a path
// split between walkers and cyclists; no plate for the disabled's parking without "SAUF" (left out).
const FR_FILE = { b1: "B0", b11: "B7b", b8: "B9b", b30: "B9a", b28: "B6d", b29: "B6a1", ip11a: "C1a", ip14a: "C207", ip15a: "C107", ip20a: "B27a",
  zona30: "B30-30", ip26a: "B52", ip27a: "B54", c8a: "B22a", c9a: "C115", c7a: "B22b" };
const FR_CODE = { ...FR_FILE, zona30: "B30" };
const FR_SPEEDS = [20, 30, 50, 70, 80, 90, 110, 130];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // C12 where the lane goes away (a one-way street), B1 where it comes towards the viewer (no entry); with cyclists in
  // contraflow B1 with the plate M9v2 "sauf cyclistes" (drawn in the file).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "B1-plus-M9" : "B1") : "C12";
  if (s.k === "b20a") return FR_SPEEDS.includes(s.v) ? `B14-${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return FR_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "B1" + (x.plate === "protismer" ? " + M9v2" : "") : "C12") : x.k === "b20a" ? "B14" : FR_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
};

// No drawings of its own (as Belgium): the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "FR",
  bounds: [-5.2, 41.3, 9.6, 51.1],
  // Code de la route R417-10 and R417-11: no free width beside parked cars in figures (only "gêner le moins possible"
  // and a continuous line that the others would have to cross); a car on the sidewalk or a cycle lane is "très
  // gênant" (R417-11 I 8°). As Luxembourg and Poland (Bára 21. 11. 2026: with no general free width parking is
  // allowed almost everywhere): the lanes beside the cars stay drivable, 3 m at least.
  freeLane: 3,
  lawNeed: (oneway, lanes, minLane) => Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes)),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání auta na chodníku je ve Francii „velmi obtěžující stání“, přestupek 4. třídy (čl. R417-11 zákona o silničním provozu); volnou šířku vozovky zákon neuvádí, aplikace nechává průjezdné pruhy, tedy aspoň {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  // Paris's boulevards and avenues are 30–70 m between facades, with promenades and side roads: a main street's side
  // ending at the reach in its median reaches 35 m (app.js).
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsFR,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-FR", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "fr",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { france: { ...czechFurniture, ...atPosts } },
  // No panel houses (as Belgium): a flat-roofed slab is the plain flat-roofed house, after 1990 the modern one.
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["geopf"],
};
