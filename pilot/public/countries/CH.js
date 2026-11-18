// Switzerland (CH; Bára 17. 11. 2026): what differs from the Czech rules of countries/default.js. The land cover of the
// official cadastral survey (Amtliche Vermessung, geodienste.ch) is towns/switzerland.js, the orthophoto swisstopo's
// SWISSIMAGE (lanes-ortho.js "ch"). Liechtenstein (countries/LI.js) takes these rules with its own law's names.
// Sources, norms and signs: evaluation/switzerland/ (ZDROJE.md, NORMY.md, ZNACKY.md, RECENZE.md).
import { t } from "../i18n.js";
import { GROUP } from "../norms.js";
import { czechFurniture } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/switzerland/NORMY.md): the VSS norms (SN 640 070, 640 201, 640 060, 40 252, 40 291) are not
// public: their values as cantonal and city guidelines quote them (Kanton Bern TBA 2021 and 2026, Basel-Stadt
// Standards Fuss- und Veloverkehr 2024, Kanton Zürich Standards Veloverkehr 2023, Kanton Schwyz Normalie D 2.01),
// said so. Where no source was found (a lane of a local street, a pure bus lane, angled parking, a tram belt), no
// warning (as in Germany).
const CH_LANE_BY_GROUP = {
  B: { min: 0, zaklad: 3, why: t("jízdní pruh hlavní ulice v obci: orientačně 3 m (vedle cyklopruhu 3 m, při méně než 300 nákladních autech a autobusech denně 2,75 m, Kanton Zürich 2023; na kantonálních silnicích Schwyzu 3,25 m)") },
};
function limitsCH(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.8, zaklad: 2, why: t("chodník ostatních místních tras: 2 m, nejméně 1,8 m; na hlavních trasách 2,4 m (Standards Fuss- und Veloverkehr Basel-Stadt 2024, tab. 1, podle SN 640 070)") };
    case "stezka_sdilena":
      return { min: 0, zaklad: 3, why: t("společná stezka pro chodce a cyklisty: 3 m, s cyklisty v obou směrech 3,5 m (Normalie D 2.01 kantonu Schwyz, 2025)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return null;
      return CH_LANE_BY_GROUP[GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]] || null;
    case "bus_cyklo":
      return { min: 3, zaklad: 3, why: t("pruh pro autobusy s cyklisty: 3 m (autobus cyklistu nepředjíždí), nebo aspoň 4,5 m, aby ho předjel; mezi tím ne (Kanton Bern TBA 2021, Basel-Stadt 2024)") };
    case "cyklopruh": case "ochranny_pruh":
      return parking ? { min: 2, zaklad: 2.25, why: t("cyklopruh vedle podélného stání: 1,5 m a bezpečnostní odstup 0,5–0,75 m (VSS 40 291a podle kantonu Bern 2021; Kanton Zürich 2023)") }
        : { min: 1.5, zaklad: 1.5, why: t("cyklopruh (Radstreifen): 1,5 m, mezi dvěma pruhy 1,8 m (VSS 40 201 a 40 252 podle kantonu Bern 2021; Basilej má základ 1,8 m)") };
    case "cyklostezka":
      return { min: 1.8, zaklad: 2.6, why: t("stezka pro cyklisty jednosměrná: min. 1,8 m (na hlavních trasách 2,2 m), základ 2,6 m; obousměrná 2,5–3 m a 3–4,5 m (SN 640 060 podle kantonu Bern 2021)") };
    case "parkovani":
      if (s.orient === "sikme") return null;
      return s.orient === "kolme" ? { min: 5, zaklad: 5, why: t("kolmé stání: hloubka 5 m (VSS 40 291 podle kantonu Bern 2026)") }
        : { min: 1.9, zaklad: 1.9, why: t("podélné stání: 1,9 m, u vysoké obruby 2,2–2,5 m (VSS 40 291 podle kantonu Bern 2026)") };
    default:
      return null;
  }
}

// The signs of the state CH (pilot/public/signs-CH/, README there; Signalisationsverordnung SSV, SR 741.21, Anhang 2,
// Stand 1. 10. 2026; Wikimedia Commons, by ASTRA, official works not protected by URG Art. 5). Liechtenstein's SSV
// (LR 741.21) has the same numbers. No sign for parking on the sidewalk (VRV Art. 41 Abs. 1bis: 4.17 and markings), no
// numbered plate for "Zubringerdienst gestattet" (a text) nor for "ausgenommen Velos": a sign with such a plate is left
// out (alone it would forbid what the plate allows). A cycle lane is a marking (6.09), no sign. The forms of parking are
// a symbol inside 4.17, not a number of their own.
const CH_CODE = { b1: "2.01", b11: "2.14", b8: "2.05", b30: "2.15", b20a: "2.30", b28: "2.49", b29: "2.50", oneway: "4.08",
  c8a: "2.60", c9a: "2.63.1", c10a: "2.63", c7a: "2.61", ip11a: "4.17", ztp: "4.17 + 5.34.4", ip14a: "4.01", ip15a: "4.03",
  ip20a: "2.64", zona30: "2.59.1", ip26a: "2.59.5", ip27a: "2.59.3" };
const CH_FILE = { b1: "2.01", b11: "2.14", b8: "2.05", b30: "2.15", b28: "2.49", b29: "2.50", c8a: "2.60", c9a: "2.63.1", c10a: "2.63",
  c7a: "2.61", ip11a: "4.17", ztp: "4.17", ip14a: "4.01", ip15a: "4.03", ip20a: "2.64", zona30: "2.59.1", ip26a: "2.59.5", ip27a: "2.59.3" };
const CH_SPEEDS = [20, 30, 40, 50, 60, 70, 80, 100, 120];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // 4.08 where the lane goes away (as IP 4b), 2.02 Einfahrt verboten where it comes towards the viewer; with cyclists
  // in contraflow 4.08.1 (its plate drawn in), 2.02 would need the plate "ausgenommen Velos" (not drawn: left out).
  if (s.k === "oneway") {
    if (dir === "backward") return s.plate === "protismer" ? null : "2.02";
    return s.plate === "protismer" ? "4.08.1" : "4.08";
  }
  if (s.k === "b20a") return CH_SPEEDS.includes(s.v) ? "2.30" : null;
  // Only the plates the set has: the disabled (5.34.4); the forms of parking are inside 4.17.
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate) && s.k !== "ztp") return null;
  return CH_FILE[s.k] || null;
}
const plateFile = (s) => (s.k === "ztp" ? "5.34.4" : null);
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" && x.plate === "protismer" ? "4.08.1" : x.k === "oneway" && (x.dir === "backward") ? "2.02" : CH_CODE[x.k];
  return code ? `SSV ${code} ${label.replace(CZ_CODE, "")}` : label;
};

export default {
  ...base,
  code: "CH",
  bounds: [5.9, 45.8, 10.5, 47.85],
  // VRV Art. 19 Abs. 2 and 3 (SR 741.11): no parking on a main road inside a town where two motor cars could not pass
  // each other, on a narrow street on one side only; no width in the law. The cantons' guidelines (Kanton Bern TBA,
  // Arbeitshilfe Parkierung 2026; Kanton Luzern, Richtlinie 653.115) take 3 m to pass on a minor road and 6 m on a main
  // one (a vehicle up to 2.6 m wide). As in Germany the lanes the profile keeps beside the cars stay drivable.
  freeLane: 3,
  lawNeed: (oneway, lanes, minLane) => Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes)),
  // VRV Art. 19 Abs. 2: no parking on a cycle lane nor on the roadway beside it.
  parkByCycleLane: false,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Zákon šířku neuvádí (VRV čl. 19), pomůcky kantonů Bern a Luzern berou 3 m na projetí, aplikace navíc nechává průjezdné pruhy, tedy aspoň {need}; na chodníku musí zůstat 1,5 m (VRV čl. 41).", { free, need }),
  parkGuess: true,
  wideRoads: true,
  roadClassFromOsm: true,
  limits: limitsCH,
  // A one-way street with contraflow cyclists and no cycle lane: a roadway of 4.8 m for a bicycle meeting a lorry (Kanton
  // Zürich Standards Veloverkehr 2023, kap. 4.9) as the base; no minimum (Bern's 3 m + 1.5 m are for a contraflow
  // cycle lane: the hostile review).
  contraflow: () => ({ lo: 0, base: 4.8, why: t("jednosměrka s cyklisty v protisměru: vozovka 4,8 m pro potkání kola s nákladním autem (Kanton Zürich 2023, kap. 4.9), minimum nenalezeno") }),
  // No public width of a Swiss tram belt was found: no warning.
  tramBelt: () => [],
  signs: { dir: "signs-CH", file: signFile, plate: plateFile, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "ch",
  orthoEstimate: true,
  // The survey's land cover covers all land, but a street's surface may end at the parcel: filled up to the houses
  // within 25 m (as Germany's city maps).
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  // No drawings of its own (Bára 17. 11. 2026: the neutral vehicles of generic/, no new illustrations): the Czech
  // furniture and stop posts.
  art: { switzerland: { ...czechFurniture } },
  // No panel houses (Bára 17. 11. 2026, as Austria and western Germany): a flat-roofed slab is the plain flat-roofed
  // house, after 1990 the modern one, an office an office.
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-ch"],
};
