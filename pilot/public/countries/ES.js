// Spain (ES; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/spain.js (Zaragoza's paving map, the Catastro), IGN's PNOA orthophoto lanes-ortho.js "es". Sources, norms and
// signs: evaluation/spain/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/spain/NORMY.md): binding only the accessibility order (Orden TMA/851/2021, art. 5.2 b: a free width
// of 1.80 m on the accessible pedestrian route); the rest the ministry's recommendations for cycling infrastructure
// (2023/2024), which give the city's lanes and parking too. No warning for a bus lane, a bus lane with bikes, a tram
// belt (no source found) or a shared path (5 m undivided: it would shine almost everywhere; for Bára).
const lanes = (segs) => segs.filter((x) => x.type === "pruh" || x.type === "pruh_piktokoridor");
function limitsES(s, segs) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.8, zaklad: 2, why: t("chodník: volná šířka přístupné pěší trasy nejméně 1,8 m (vyhláška o přístupnosti TMA/851/2021, čl. 5.2 b); ministerstvo doporučuje 3 m, nikdy pod 2 m") };
    case "cyklostezka": case "cyklopruh":
      return { min: 1, zaklad: 1.4, why: t("cyklopruh a stezka pro cyklisty jednosměrné: nejméně 1,4 m, výjimečně 1 m; obousměrné 2,6 m, výjimečně 2,2 m (doporučení ministerstva dopravy 2024)") };
    case "pruh": case "pruh_piktokoridor": {
      if (s.turn) return null;
      const L = lanes(segs), oneway = L.length > 0 && L.every((x) => (x.dir ?? "forward") === (L[0].dir ?? "forward"));
      return oneway && L.length >= 2
        ? { min: 0, zaklad: 2.5, why: t("jízdní pruh vozovky s více pruhy jedním směrem: 2,5–2,75 m (doporučení ministerstva dopravy 2024)") }
        : { min: 0, zaklad: 2.5, why: t("jízdní pruh městské ulice: 2,5–3 m, ne víc než 3 m (doporučení ministerstva dopravy 2024)") };
    }
    case "parkovani":
      if (s.orient === "sikme") return { min: 0, zaklad: 4, why: t("šikmé stání: pás 4 m při 45°, 4,5 m při 60° (doporučení ministerstva dopravy 2024)") };
      return s.orient === "kolme" ? { min: 4.5, zaklad: 5, why: t("kolmé stání: pás 5 m, nejméně 4,5 m (doporučení ministerstva dopravy 2024)") }
        : { min: 1.8, zaklad: 2, why: t("podélné stání: pás 2 m, nejméně 1,8 m (doporučení ministerstva dopravy 2024)") };
    default:
      return null;
  }
}

// The signs of the state ES (pilot/public/signs-ES/, README there; the catalogue of RD 465/2025, annex I of the RGC, in
// force from 1. 7. 2025; Wikimedia Commons). Part of a regulation, so no object of copyright (art. 13 of the LPI; Bára
// 23. 11. 2026 for France: "Značky jsou volně"). Spain has no sign of a cycle street or a paid zone; the disabled's and
// reserved parking only with a text (left out).
const ES_FILE = { b1: "R-100", b11: "R-102", b8: "R-114", b30: "R-116", b28: "R-307", b29: "R-308", ip11a: "S-17", ip15a: "S-3", ip20a: "S-51a-bus",
  zona30: "S-30", ip26a: "S-28", sdilena: "S-47", ip27a: "S-30a", c8a: "R-407a", c9a: "S-33", c10a: "S-41", c7a: "R-410" };
const ES_CODE = { ...ES_FILE, ip20a: "S-51a" };
const ES_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
// A motorway is an autopista (S-1) where its ref says so (AP-…), else an autovía (S-1a, A-…).
const motorway = (s) => (/^AP-/.test(String(s?.ref || "")) ? "S-1" : "S-1a");
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // S-11 where the lane goes away (a one-way street), R-101 where it comes towards the viewer (no entry); with cyclists
  // in contraflow (art. 153.6 of the RGC) R-101 with the plate S-880d "EXCEPTO" (drawn in the file).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "R-101-plus-S-880d" : "R-101") : "S-11";
  if (s.k === "b20a") return ES_SPEEDS.includes(s.v) ? `R-301-${s.v}` : null;
  if (s.k === "ip14a") return motorway(s);
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return ES_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "R-101" + (x.plate === "protismer" ? " + S-880d" : "") : "S-11") : x.k === "b20a" ? "R-301" : x.k === "ip14a" ? motorway(x) : ES_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
};

// No drawings of its own (as France): the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "ES",
  bounds: [-18.2, 27.6, 4.4, 43.8],
  // RGC art. 91.2 a): parking is dangerous or seriously obstructive "cuando la distancia entre el vehículo y el borde
  // opuesto de la calzada o una marca longitudinal … sea inferior a tres metros": 3 m to the opposite edge, not 3 m a
  // direction (evaluation/spain/NORMY.md B1; the literal reading, for Bára). Parking is estimated as in Luxembourg.
  freeLane: 3,
  lawNeed: () => 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je ve Španělsku zakázané (čl. 94.2 e nařízení o silničním provozu); vedle stojícího auta musí zůstat aspoň 3 m k protějšímu okraji vozovky (čl. 91.2 a), aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  // Main streets ending at the reach in their median reach 35 m (app.js; the paseos and ramblas).
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsES,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-ES", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "es",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { spain: { ...czechFurniture, ...atPosts } },
  // No panel houses (as France): a flat-roofed slab is the plain flat-roofed house, after 1990 the modern one.
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["cartociudad"],
};
