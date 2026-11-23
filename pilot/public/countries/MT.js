// Malta (MT; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Traffic keeps LEFT (reg. 75
// of S.L. 65.11; derive.js turns only the directions). Its source is towns/malta.js (the estimate), the Planning
// Authority's orthophoto of 2018 lanes-ortho.js "mt". Sources, norms and signs: evaluation/malta/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/malta/NORMY.md): no binding widths of streets; the sidewalk by Access for All (CRPD, 1.2 m) and
// Transport Malta's Road Geometry Handbook (1.5 m), perpendicular parking by the Planning Authority's DC15 (4.8 m). No
// Maltese figure found for lanes, bus lanes, cycle lanes and tracks, parallel parking: no warning.
function limitsMT(s) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.2, zaklad: 1.5, why: t("chodník: nejméně 1,2 m (zásady přístupnosti CRPD), u silnic 1,5 m (příručka Transport Malta 2003); doporučení") };
    case "parkovani":
      return s.orient === "kolme" ? { min: 4.8, zaklad: 4.8, why: t("kolmé stání: 4,8 m (stavební standard DC15 maltského stavebního úřadu)") } : null;
    default:
      return null;
  }
}

// The signs of the state MT (pilot/public/signs-MT/, README there; S.L. 65.05 and the Highway Code of 2025). Malta's
// copyright gives the government its drawings: only files of Commons with their own licence (UK drawings under the Open
// Government Licence v3.0, credited in the footer; Maltese ones in the public domain; evaluation/malta/signs-licence.json).
// No motorway, residential or shared zone in Malta.
const MT_FILE = { b1: "II.A5", b11: "II.A6", b8: "II.B1", b30: "II.B5", b28: "II.D7", b29: "II.D6", ip11a: "III.B1", ip20a: "II.E11",
  zona30: "II.D12-30", ip27a: "II.B6", c8a: "UK-955", c9a: "UK-956", c10a: "UK-957" };
const MT_CODE = { ...MT_FILE, zona30: "II.D12", c8a: null, c9a: null, c10a: null };
const MT_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "II.A4-plus-cycles" : "II.A4") : "UK-652";
  if (s.k === "b20a") return MT_SPEEDS.includes(s.v) ? `II.D1-${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return MT_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "II.A4" : null) : x.k === "b20a" ? "II.D1" : MT_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "MT",
  bounds: [13.9, 35.5, 14.9, 36.35],
  // Traffic keeps left.
  leftHand: true,
  // No free width in the law (only "obstruction", reg. 74 and 77 of S.L. 65.11); the Planning Authority's DC15: two cars
  // pass on 4.1 m, an aisle beside parallel parking 3 m (NORMY.md B1). Parking on the sidewalk banned (reg. 79 d) but
  // where the sign III.B8–B10 allows it.
  freeLane: 3,
  lawNeed: (oneway) => (oneway ? 3 : 4.1),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je na Maltě zakázané (předpis S.L. 65.11, čl. 79), ledaže ho povolí značka; aplikace nechává {need} (stavební standard DC15).", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsMT,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-MT", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "mt",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { malta: { ...czechFurniture, ...atPosts } },
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-mt"],
};
