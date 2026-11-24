// Lithuania (LT; Bára 24. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/lithuania.js (Vilnius's topographic areas 1 : 500); no orthophoto (the NŽT's is for viewing on geoportal.lt only),
// so the profile is the estimate from OSM elsewhere. Sources, norms and signs: evaluation/lithuania/ (ZDROJE.md,
// NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/lithuania/NORMY.md D): the state's STR 2.06.04:2014 was not read (e-seimas blocked), so only the
// street guides of Vilnius (2021) and Kaunas (2024), which call themselves recommendations: orange only. Lithuania has
// no trams: no tram belt.
const PARKED = (segs, i) => [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
function limitsLT(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 2.5, why: t("chodník: doporučeno nejméně 2,5 m (příručka ulic Kaunasu 2024; státní minimum nenalezeno)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.5, why: PARKED(segs, i) ? t("cyklopruh: nejméně 1,5 m, u podélného stání vést za stáním s ochranným pásem (příručka ulic Kaunasu 2024, doporučení)") : t("cyklopruh: nejméně 1,5 m (příručka ulic Kaunasu 2024, doporučení)") };
    case "cyklostezka":
      return { min: 0, zaklad: 2.5, why: t("stezka pro cyklisty: 2,5–3,5 m (příručka ulic Kaunasu 2024, doporučení)") };
    case "bus":
      return { min: 0, zaklad: 3.05, why: t("pruh pro veřejnou dopravu: 3,25 m při dvou pruzích, 3 m při třech a více, zúžit lze na 3,05 m (příručka ulic Vilniusu 2021, doporučení)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return { min: 0, zaklad: 2.75, why: t("jízdní pruh: 3 m při 50 km/h, 2,75 m při 30 km/h (příručka ulic Vilniusu 2021, doporučení)") };
    case "parkovani":
      // Angled stalls: the guide gives no size (only "in exceptional cases"); no warning.
      if (s.orient === "sikme") return null;
      if (s.orient === "kolme") return { min: 0, zaklad: 4.35, why: t("kolmé stání: místo 4,35 m a ochranný pás 0,75 m, jen výjimečně (příručka ulic Kaunasu 2024, doporučení)") };
      return { min: 0, zaklad: 2.3, why: t("podélné stání: 2,3–2,5 m (příručka ulic Kaunasu 2024, doporučení)") };
    default:
      return null;
  }
}

// The signs of the state LT (pilot/public/signs-LT/, README there; the annex 1 of the traffic rules KET, government
// resolution 1950/2002): the drawings from Wikimedia Commons, by Augustasci (CC BY 4.0, the 4xx Public domain) and
// Gigillo83 (the plates 846 and 853, CC BY-SA 4.0), credited in the footer. Numbers and names by lt.wikipedia
// (second hand, NORMY.md C2). The speed sign 329 is the app's template (the ring of 302, the number filled in).
// Not drawn: the pedestrian zone and the shared zone (Lithuania has none found), the plates of the way of parking
// (830–838, not on Commons) and the plate "except service" (not found).
const LT_FILE = { b1: "302", b11: "303", b8: "309", b30: "310", b28: "332", b29: "333", ip11a: "528", ztp: "528", ip12: "531", ip14a: "501",
  ip15a: "555", ip20a: "523", zona30: "542", ip26a: "552", cyklozona: "559", c8a: "411", c7a: "412", c9a: "413" };
const LT_CODE = { ...LT_FILE, ztp: "528 + 846", c10a: "413a" };
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // 503 where the lane goes away (a one-way street), 301 where it comes towards the viewer; with cyclists in contraflow
  // 301 with the plate 853 ("except cyclists"); the other end has no plate of its own: none.
  if (s.k === "oneway") return dir === "backward" ? "301" : s.plate === "protismer" ? null : "503";
  if (s.k === "b20a") return typeof s.v === "number" ? "329" : null;
  // 413a has the pedestrians on the right, 413b on the left (as drawn on Commons); without data on the right.
  if (s.k === "c10a") return s.walk === "left" ? "413b" : "413a";
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return LT_FILE[s.k] || null;
}
function plateFile(s, seg) {
  if (s.k === "oneway" && s.plate === "protismer" && (s.dir ?? seg?.dir) === "backward") return "853";
  if (s.k === "ztp") return "846";
  return null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? (x.plate === "protismer" ? "301 + 853" : "301") : "503") : x.k === "b20a" ? "329" : x.k === "c10a" ? (x.walk === "left" ? "413b" : "413a") : LT_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts (as Estonia and
// Denmark; the Lithuanian stop sign 538 is not drawn yet).
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "LT",
  bounds: [20.9, 53.85, 26.9, 56.5],
  // KET 150.7 (second hand, NORMY.md B): no stopping where less than 3 m stays beside a solid line; read for both sides
  // of a narrow street by the commentaries: 3 m a direction as elsewhere. 150.5: no parking on the sidewalk unless a
  // sign of the way of parking allows it; the width left to pedestrians was not found.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. V Litvě smí auto stát na chodníku jen tam, kde to dovolí značka způsobu stání (bod 150.5 pravidel silničního provozu, z druhé ruky); volnou šířku pro chodce jsme v pravidlech nenašli, aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsLT,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-LT", file: signFile, plate: plateFile, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  // No orthophoto may be used (lanes-ortho.js "none"): the estimate from OSM.
  laneOrtho: "none",
  orthoEstimate: false,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { lithuania: { ...czechFurniture, ...atPosts } },
  // The Soviet panel estates (Žirmūnai, Lazdynai, Šilainiai, Dainava) were built here as in Estonia (Lasnamäe,
  // Mustamäe): the socialist looks by the same reasoning as Estonia's (Bára 23. 11. 2026: where they were built).
  socialistLooks: true,
  search: ["photon-lt"],
};
