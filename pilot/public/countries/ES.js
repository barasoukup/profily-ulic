// Spain (ES; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/spain.js (Zaragoza's paving map, the Catastro), IGN's PNOA orthophoto lanes-ortho.js "es". Sources, norms and
// signs: evaluation/spain/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { mediterraneanDetails, mediterraneanLook } from "../house-looks.js";

// Norms (evaluation/spain/NORMY.md): binding only the accessibility order (Orden TMA/851/2021, art. 5.2 b: a free width
// of 1.80 m on the accessible pedestrian route); the rest the ministry's recommendations for cycling infrastructure
// (2023/2024), which give the city's lanes and parking too. No warning for a bus lane, a bus lane with bikes, a tram
// belt (no source found) or a shared path (5 m undivided: it would shine almost everywhere; for Bára).
const lanes = (segs) => segs.filter((x) => x.type === "pruh" || x.type === "pruh_piktokoridor");
function limitsES(s, segs) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.8, zaklad: 2, why: t("chodník: volná šířka přístupné pěší trasy nejméně 1,8 m (vyhláška o přístupnosti TMA/851/2021, čl. 5.2 b); ministerstvo doporučuje 3 m, nikdy pod 2 m") };
    // 1.4 m is the minimum, 1 m only an exception on a short stretch (the review of 23. 11. 2026); the guide has no
    // wider recommended width, so no orange. Its widths are without the lines and buffers; a two-way track (2.6 m,
    // exceptionally 2.2 m) is only in the text (the profile does not tell a two-way track).
    case "cyklostezka": case "cyklopruh":
      return { min: 1.4, zaklad: 1.4, why: t("cyklopruh a stezka pro cyklisty jednosměrné: nejméně 1,4 m, jen výjimečně na krátkém úseku 1 m; obousměrné 2,6 m, výjimečně 2,2 m; šířky bez vodicích čar a odstupů (doporučení ministerstva dopravy 2024)") };
    case "pruh": case "pruh_piktokoridor": {
      if (s.turn) return null;
      // Several lanes one way may narrow to 2.5 m; one lane a direction keeps 3 m (Bára 23. 11. 2026, the review 14: the
      // guide's 2.50–3.00 m, "no dimensionar por encima de los 3,00 m").
      const L = lanes(segs), sameWay = L.filter((x) => (x.dir ?? "forward") === (s.dir ?? "forward")).length;
      return sameWay >= 2
        ? { min: 0, zaklad: 2.5, why: t("jízdní pruh vozovky s více pruhy jedním směrem: 2,5–2,75 m (doporučení ministerstva dopravy 2024)") }
        : { min: 0, zaklad: 3, why: t("jízdní pruh městské ulice: 2,5–3 m, ne víc než 3 m (doporučení ministerstva dopravy 2024)") };
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
// force from 1. 7. 2025; Wikimedia Commons; the zone 30 is the panel "ZONA" with R-301 30 of the catalogue of 2003, which
// the 2025 one lacks: labelled without a code, Bára 23. 11. 2026 chose the panel). Part of a regulation, so no object of copyright (art. 13 of the LPI; Bára
// 23. 11. 2026 for France: "Značky jsou volně"). Spain has no sign of a cycle street or a paid zone; the disabled's and
// reserved parking only with a text (left out).
const ES_FILE = { b1: "R-100", b11: "R-102", b8: "R-114", b30: "R-116", b28: "R-307", b29: "R-308", ip11a: "S-17", ip15a: "S-3", ip20a: "S-51a-bus",
  zona30: "S-30", ip26a: "S-28", sdilena: "S-47", ip27a: "S-30a", c8a: "R-407a", c9a: "S-33", c10a: "S-41", c7a: "R-410" };
const ES_CODE = { ...ES_FILE, ip20a: "S-51a", zona30: null };
const ES_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
// A motorway is an autopista (S-1) where one of its refs says so (AP-…, "E-15;AP-7" too), an autovía (S-1a) where one is
// A-…; other refs (C-32, R-2, M-12: either kind) and none: no sign (the review of 23. 11. 2026).
const motorway = (s) => { const r = String(s?.ref || ""); return /(^|;)\s*AP-/.test(r) ? "S-1" : /(^|;)\s*A-/.test(r) ? "S-1a" : null; };
const num = (v) => { const m = /^(\d+)/.exec(String(v ?? "")); return m ? Number(m[1]) : undefined; };
// A living street (OSM living_street) is S-47 Zona de coexistencia (20 km/h) unless OSM says 10 km/h: then S-28 Zona de
// estancia y juego, which stands with R-301 10 (NORMY.md B4); with another speed no zone sign, only the speed (the
// review of 23. 11. 2026: S-28 is no longer the residential street of 20 km/h).
const esZones = (z, tags) => z.flatMap((x) => {
  if (x.k !== "ip26a") return [x];
  const v = num(tags.maxspeed);
  return v === 10 ? [x] : !v || v === 20 ? [{ k: "sdilena" }] : [];
});
// RGC art. 50.1 (NORMY.md B4): in a town 20 km/h on a single platform, 30 with one lane a direction, 50 with two or more
// (lanes reserved for buses not counted). The town's speed is drawn only where it differs from these. OSM does not tell
// a single platform: a living street is taken for one.
function esTownSpeed(tags) {
  if (tags.highway === "living_street") return 20;
  const n = Number(tags.lanes) - (Number(tags["lanes:bus"]) || 0) - (Number(tags["lanes:psv"]) || 0);
  const oneway = ["yes", "1", "true", "-1"].includes(tags.oneway);
  return (oneway ? n : n / 2) >= 2 ? 50 : 30;
}
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
  if (x.k === "zona30") return label.replace(CZ_CODE, "");
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
  // direction (evaluation/spain/NORMY.md B1; the literal reading, for Bára). Parking is estimated as in Luxembourg: the
  // lanes OSM counts keep MIN_LANE each beside it (the review of 23. 11. 2026: 3 m alone left two lanes of 1.5 m).
  freeLane: 3,
  lawNeed: (oneway, lanes, minLane) => Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes)),
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
  // zoneSpeed: S-28 hides no speed (its R-301 10 is drawn), S-47 says 20 (signs.js).
  signs: { dir: "signs-ES", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg),
    zones: esZones, zoneSpeed: { ip27a: 20, zona30: 30, sdilena: 20 }, townSpeed: esTownSpeed },
  bedOrtho: null,
  laneOrtho: "es",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { spain: { ...czechFurniture, ...atPosts } },
  search: ["cartociudad"],
  // The regional looks of its old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026).
  houseLook: mediterraneanLook("ES"),
  houseDetails: mediterraneanDetails("ES"),
};
