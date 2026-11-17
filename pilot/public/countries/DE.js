// Germany (DE; Bára 17. 11. 2026): what differs from the Czech rules of countries/default.js. Its cities' street surface
// maps (Berlin, Hamburg, Aachen) are towns/germany.js, the orthophotos of its 16 Länder lanes-ortho.js DE_ORTHO.
// Sources, norms and signs: evaluation/germany/ (ZDROJE.md, NORMY.md, RECENZE.md).
import { t } from "../i18n.js";
import { GROUP } from "../norms.js";
import { TOWN_ART, czechFurniture } from "../art.js";
import { landsAt } from "../lanes-ortho.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/germany/NORMY.md): RASt 06, ERA 2010, EFA 2002 and EAR 23 of the FGSV are not public: their values
// as Land guidelines and reports quote them (Lower Saxony's overview of ERA and VwV-StVO, DUH 2024 for EAR 23), said so.
// Where no source was found, no warning (the hostile review of Germany).
const DE_LANE_BY_GROUP = {
  B: { min: 0, zaklad: 3.25, why: t("jízdní pruh hlavní ulice: vozovka 6,5 m pro potkávání autobusů, tedy asi 3,25 m (RASt 06 podle dopisu, kterým ji Bavorsko zavedlo, 2009)") },
};
function limitsDE(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.8, zaklad: 2.5, why: t("chodník: 2,5 m, nejméně 1,8 m (RASt 06 a EFA 2002 podle přehledu Dolního Saska)") };
    case "stezka_sdilena":
      return { min: 2.5, zaklad: 3, why: t("společná stezka pro chodce a cyklisty: min. 2,5 m, základ 3 m (VwV-StVO k Z 240, ERA 2010 podle přehledu Dolního Saska)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return DE_LANE_BY_GROUP[GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]] || null;
    case "cyklopruh":
      return parking ? { min: 1.85, zaklad: 2.6, why: t("cyklopruh vedle stání: 1,85 m a bezpečnostní odstup 0,75 m (ERA 2010 podle přehledu Dolního Saska)") }
        : { min: 1.5, zaklad: 1.85, why: t("cyklopruh (Radfahrstreifen): min. 1,5 m, základ 1,85 m i s čarou (VwV-StVO, ERA 2010 podle přehledu Dolního Saska)") };
    case "ochranny_pruh":
      return parking ? { min: 1.25, zaklad: 2.25, why: t("ochranný pruh vedle stání: 1,5 m a bezpečnostní odstup 0,75 m (ERA 2010 podle přehledu Dolního Saska)") }
        : { min: 1.25, zaklad: 1.5, why: t("ochranný pruh (Schutzstreifen): min. 1,25 m, základ 1,5 m (ERA 2010 podle přehledu Dolního Saska)") };
    case "cyklostezka":
      return { min: 1.6, zaklad: 2, why: t("stezka pro cyklisty jednosměrná: min. 1,6 m, základ 2 m; obousměrná 2,5 a 3 m (ERA 2010 podle přehledu Dolního Saska)") };
    case "parkovani":
      if (s.orient === "sikme") return null;
      return s.orient === "kolme" ? { min: 4.5, zaklad: 5.2, why: t("kolmé stání: hloubka 4,5 m a přesah 0,7 m nad obrubou (EAR 23 podle DUH 2024)") }
        : { min: 2, zaklad: 2, why: t("podélné stání: 2 m (EAR 23 podle DUH 2024)") };
    default:
      return null;
  }
}

// The signs of the state DE (pilot/public/signs-DE/, README there; StVO Anlage 2 and 3, Wikimedia Commons, German
// official works § 5 UrhG): the Zeichen number and the file, with the Zusatzzeichen. Germany has no shared zone and no
// sign for parking on the sidewalk drawn here (Z 315 has many forms), nor one for a reserved space.
const DE_CODE = { b1: "Z 250", b11: "Z 260", b8: "Z 254", b30: "Z 259", b20a: "Z 274", b28: "Z 283", b29: "Z 286", oneway: "Z 220 / Z 267",
  c8a: "Z 237", c9a: "Z 240", c10a: "Z 241", c7a: "Z 239", ip11a: "Z 314", ztp: "Z 314 + 1044-10", ip14a: "Z 330.1", ip15a: "Z 331.1",
  ip20a: "Z 245", zona30: "Z 274.1", ip26a: "Z 325.1", ip27a: "Z 242.1", cyklozona: "Z 244.1" };
const DE_CHOICE_CODE = { "oneway+protismer": "Z 220 + 1000-33 / Z 267 + 1022-10", "ip20a+kolo": "Z 245 + 1022-10", "ip27a+kola": "Z 242.1 + 1022-10",
  "b1+obsluha": "Z 250 + 1020-30", "b11+obsluha": "Z 260 + 1020-30" };
const DE_FILE = { b1: "250", b11: "260", b8: "254", b30: "259", b28: "283", b29: "286", c8a: "237", c9a: "240", c7a: "239",
  ip11a: "314", ztp: "314", ip14a: "330.1", ip15a: "331.1", ip20a: "245", zona30: "274.1", ip26a: "325.1", ip27a: "242.1", cyklozona: "244.1" };
const DE_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // Z 220 (the arrow) where the lane goes away from the viewer, Z 267 where it comes towards them.
  if (s.k === "oneway") return dir === "backward" ? "267" : "220-20";
  if (s.k === "b20a") return DE_SPEEDS.includes(s.v) ? `274-${s.v}` : "274";
  // Z 241-30: the cycle path on the left, the footway on the right (as C 10a's design); 241-31 the other way.
  if (s.k === "c10a") return s.walk === "left" ? "241-31" : "241-30";
  return DE_FILE[s.k] || null;
}
function plateFile(s, seg) {
  if (s.plate === "protismer") return (s.dir ?? seg?.dir) === "backward" ? "1022-10" : "1000-33";
  if (s.plate === "obsluha") return "1020-30";
  if (s.plate === "kolo" || s.plate === "kola") return "1022-10";
  return s.k === "ztp" ? "1044-10" : null;
}
const signLabel = (x, own, label) => {
  const code = (own && DE_CHOICE_CODE[`${x.k}+${x.plate}`]) || DE_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
};

// No drawings of its own yet (Bára 17. 11. 2026: "obrázky jsou nejdražší"): the Austrian stop posts and shelters (the
// round H of Zeichen 224 looks the same), the Czech furniture, Streetmix's vehicles.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right",
  "transit-shelter-01-left", "transit-shelter-01-right", "transit-shelter-green-left", "transit-shelter-green-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

const GDR = new Set(["BE", "BB", "MV", "SN", "ST", "TH"]);

export default {
  ...base,
  code: "DE",
  bounds: [5.8, 47.2, 15.1, 55.1],
  // StVO § 12 Abs. 1 Nr. 1, Abs. 3 Nr. 3: no width in the law; the courts take about 3.05 m for one vehicle to pass
  // (VG Regensburg RO 5 K 16.497, evaluation/germany/NORMY.md), and the lanes the profile keeps beside the cars stay
  // drivable (the hostile review: a two-way 5.1 m roadway gave two lanes of 1.55 m).
  freeLane: 3.05,
  lawNeed: (oneway, lanes, minLane) => Math.max(3.05, minLane * Math.max(oneway ? 1 : 2, lanes)),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}, podle StVO § 12 a judikatury 3,05 m na projetí, s pruhy vedle stání aspoň {need}.", { free, need }),
  // The law's estimate on local streets as in Czechia (the universal judging, 17. 11. 2026: parking was missing in 15
  // of 34 German cuts; ?odhadstani=0 in app.js leaves it out).
  parkGuess: true,
  wideRoads: true,
  roadClassFromOsm: true,
  limits: limitsDE,
  // No public width for a one-way street with contraflow cyclists nor for a tram belt was found: no warning.
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-DE", file: signFile, plate: plateFile, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "de",
  orthoEstimate: true,
  // The street surfaces of Berlin, Hamburg and Aachen end at the street's land: filled up to the houses within 25 m
  // (Aachen's front gardens of 15–18 m).
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { germany: { ...czechFurniture, ...atPosts } },
  // Panel houses (Plattenbau) only in the former GDR (city.panels, set by the cut from the Land: app.js); in the west as
  // in Austria: an office stays an office, a block of flats is the modern one when new, else the plain flat-roofed one.
  houseLook: (style, info, office, city) => (style === "plocha" && !city?.panels ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-de"],
  // The former GDR (with all of Berlin) by the Länder of laender.json (the review: a polygon of the inner German border
  // was wrong by kilometres): city.panels for houseLook.
  atPlace: async (lon, lat) => ({ panels: GDR.has((await landsAt(lon, lat).catch(() => []))[0]) }),
};
