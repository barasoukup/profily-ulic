// Estonia (EE; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/estonia.js (ETAK's buildings), the Land and Spatial Development Board's orthophoto lanes-ortho.js "ee". Sources,
// norms and signs: evaluation/estonia/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/estonia/NORMY.md D): the sidewalk of 1.5 m binding (the accessibility regulation of 2026 for new and
// rebuilt streets); the rest the street standard EVS 843:2016 (second hand: paid) and Tallinn's guide. No warning for
// parking (no figure found), a bus lane with bikes or a tram belt.
function limitsEE(s) {
  switch (s.type) {
    case "chodnik":
      return { min: 1.5, zaklad: 2, why: t("chodník: nejméně 1,5 m (nařízení o přístupnosti 2026, nové a přestavěné ulice); pro dva chodce 2 m (norma EVS 843, z druhé ruky)") };
    case "chodnik_kola":
      return { min: 1.5, zaklad: 2.5, why: t("stezka pro chodce a cyklisty: nejméně 1,5 m (nařízení o přístupnosti 2026), doporučeno 2,5 m (normy projektování silnic 2023)") };
    case "cyklopruh":
      return { min: 1, zaklad: 1.5, why: t("cyklopruh: 1,5 m, s nízkou obrubou nejméně 1 m (norma EVS 843, z druhé ruky)") };
    case "cyklostezka":
      return { min: 1.5, zaklad: 2.5, why: t("stezka pro cyklisty: 2,5 m, výjimečně 1,5 m (norma EVS 843, z druhé ruky)") };
    case "bus":
      return { min: 3, zaklad: 3, why: t("pruh pro veřejnou dopravu: nejméně 3 m (norma EVS 843, z druhé ruky)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return { min: 0, zaklad: 2.75, why: t("jízdní pruh: 3 m, u místních ulic 2,75 m (příručka uličního prostoru Tallinnu a norma EVS 843, z druhé ruky)") };
    default:
      return null;
  }
}

// The signs of the state EE (pilot/public/signs-EE/, README there; the signs regulation "Liiklusmärgid ja nende
// kasutamine"; Wikimedia Commons). Official texts are not protected (Autoriõiguse seadus § 5; the drawings read as part of
// them, NORMY.md C). Estonia's law has no pedestrian zone: the zone 381 with the footpath 432 (Commons' "386") stands
// for it, for Bára.
const EE_FILE = { b1: "311a", b11: "312", b8: "321", b30: "324", b28: "361", b29: "362", ip11a: "575a", ztp: "575d", ip12: "575g", ip14a: "511",
  ip20a: "525a", zona30: "381-351-30", ip26a: "573", ip27a: "386", c8a: "431", c9a: "435", c10a: "433", c7a: "432" };
const EE_CODE = { ...EE_FILE, zona30: "381", ip27a: "381" };
const EE_SPEEDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // 521 where the lane goes away (a one-way street), 331 where it comes towards the viewer (no entry); with cyclists in
  // contraflow 331 with the plate 891a and a bicycle (drawn in the file).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "331-plus-891a-kolo" : "331") : (s.plate === "protismer" ? "521-plus-836" : "521");
  if (s.k === "b20a") return EE_SPEEDS.includes(s.v) ? `351-${s.v}` : null;
  if (s.k === "ip20a" && s.plate === "kolo") return "525b";
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return EE_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "331" : "521") + (x.plate === "protismer" ? (x.dir === "backward" ? " + 891a" : " + 836") : "") : x.k === "b20a" ? "351" : x.k === "ip20a" && x.plate === "kolo" ? "525b" : EE_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "EE",
  bounds: [21.6, 57.5, 28.3, 59.8],
  // Liiklusseadus § 21 (2) 7: 3 m only beside a continuous line; no general figure: 3 m a direction as elsewhere
  // (NORMY.md B1; for Bára). A car on the sidewalk only where a sign allows it, leaving 1.5 m (§ 20 (4)).
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. V Estonsku smí auto stát na chodníku jen tam, kde to dovolí značka, a chodcům musí zůstat aspoň 1,5 m (§ 20 zákona o silničním provozu); aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsEE,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-EE", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "ee",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { estonia: { ...czechFurniture, ...atPosts } },
  // Soviet panel estates are like the Czech ones (Lasnamäe, Mustamäe): panel houses and the blocks of the 1950s–60s
  // as in Czechia (Bára 23. 11. 2026).
  socialistLooks: true,
  search: ["inads"],
};
