// Finland (FI; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/finland.js (Helsinki's register of public areas YLRE, Helsinki's buildings, Ryhti's), the towns' orthophotos
// lanes-ortho.js "fi" (Helsinki, Espoo, Turku; none elsewhere). Sources, norms and signs: evaluation/finland/ (ZDROJE.md,
// NORMY.md). Åland is in (GISCO counts it to Finland) with the Finnish rules; its own road act is not read.
import { t } from "../i18n.js";
import { fmt } from "../norms.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";
import { nordicDetails, nordicLook } from "../house-looks.js";

// Norms (evaluation/finland/NORMY.md A, D): Finland has no binding widths of streets; only guides: the national
// Väyläviraston ohjeita 18/2020 for cycling, Helsinki's "Katutilan mitoitus" (05/2014) for the rest. So nothing red,
// orange below the lowest width the guide recommends for an ordinary street (its default given in the text).
const BESIDE_BIKE = new Set(["cyklopruh", "ochranny_pruh"]);
function limitsFI(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 2, why: t("chodník: 2,5 m, v obytné ulici a vedle cyklostezky 2 m (helsinská příručka šířek uličního prostoru, 2014)") };
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 0, zaklad: 3, why: t("společná stezka pro chodce a cyklisty: nejméně 3–4,5 m podle provozu (příručka Väylä 18/2020, tab. 17)") };
    case "cyklopruh": case "ochranny_pruh":
      return { min: 0, zaklad: 1.5, why: t("cyklopruh: 1,75–2 m, na místní trase 1,5 m, krátce výjimečně 1,25 m (příručka Väylä 18/2020, tab. 14)") };
    case "cyklostezka":
      // A half of a two-way track by the whole track (tab. 16); one-way, or without a direction, by tab. 15
      // (countries/cycletrack.js; the review of 24. 11. 2026).
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.5, why: t("jednosměrná stezka pro cyklisty: 2–2,5 m, na místní trase 1,5 m (příručka Väylä 18/2020, tab. 15)") },
        { min: 0, zaklad: 2.5, why: t("obousměrná stezka pro cyklisty: 3–4 m, na místní trase 2,5 m (příručka Väylä 18/2020, tab. 16)") });
    case "bus":
      return { min: 0, zaklad: 3.5, why: t("jízdní pruh na trase autobusu: 3,5 m (helsinská příručka šířek uličního prostoru, 2014)") };
    case "bus_cyklo":
      return { min: 0, zaklad: 4.5, why: t("pruh pro autobusy a cyklisty: 4,5 m (helsinská příručka šířek uličního prostoru, 2014)") };
    case "parkovani":
      if (s.orient === "kolme") return { min: 0, zaklad: 5, why: t("kolmé stání: 5 m (helsinská příručka šířek uličního prostoru, 2014)") };
      return s.orient === "sikme" ? null : { min: 0, zaklad: 2, why: t("podélné stání: 2 m (helsinská příručka šířek uličního prostoru, 2014)") };
    case "pruh": case "pruh_piktokoridor":
      // Only beside a cycle lane does the national guide give a lane's width (the national road standard was not read).
      return [segs[i - 1], segs[i + 1]].some((x) => BESIDE_BIKE.has(x?.type))
        ? { min: 0, zaklad: 3, why: t("jízdní pruh vedle cyklopruhu: 3–3,25 m při 30–40 km/h, 3,25–3,5 m při 50–60 km/h (příručka Väylä 18/2020)") } : null;
    default:
      return null;
  }
}

// The signs of the state FI (pilot/public/signs-FI/, README there): appendix 3 of the road traffic act 729/2018, the
// drawings from Wikimedia Commons ("Finland road sign …", public domain, "Republic of Finland"). That the act's appendix
// is free (Tekijänoikeuslaki 404/1961 § 9: no copyright in laws and decrees) is the app's reading (NORMY.md C1; Bára to
// confirm). Finland has no shared zone; plates (H) are not drawn (their licences on Commons not checked).
const FI_FILE = { b1: "C1", b11: "C2", b8: "C11", b30: "C13", b28: "C37", b29: "C38", ip11a: "E2", ip14a: "E15", ip15a: "E17", ip20a: "E9.1",
  zona30: "C34-30", ip26a: "E24", ip27a: "E26", cyklozona: "E28", c8a: "D5", c9a: "D6", c10a: "D7.1", c7a: "D4" };
export const FI_SPEEDS = [20, 30, 40, 50, 60, 70, 80, 100, 120];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // E14.1 where the lane goes away (a one-way street; E14.2 is an arrow along the street, left out as in Austria), C17
  // where it comes towards the viewer; the plate of cyclists in contraflow is not drawn, so then only E14.1 (it holds for
  // the cars) and no "no entry".
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? null : "C17") : "E14.1";
  if (s.k === "b20a") return FI_SPEEDS.includes(s.v) ? `C32-${s.v}` : null;
  // D7.1 has the pedestrians on the right, D7.2 on the left (as drawn on Commons); without data on the right, as the
  // Czech C 10a.
  if (s.k === "c10a") return s.walk === "left" ? "D7.2" : "D7.1";
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate)) return null;
  return FI_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "C17" : x.dir === "forward" ? "E14" : "E14 / C17") : x.k === "b20a" ? "C32" : x.k === "zona30" ? "C34" : x.k === "c10a" ? "D7" : x.k === "ip20a" ? "E9" : FI_FILE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "FI",
  bounds: [19.0, 59.4, 31.7, 70.1],
  // Tieliikennelaki 729/2018 § 37 (2) 9: no stopping where less than 3 m is left to a solid line; no general figure. The
  // app keeps its convention of 3 m a direction (NORMY.md B1, the app's reading, for Bára). § 37 (2) 1: no parking on the
  // sidewalk; only the plate H13 allows it.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Ve Finsku je stání na chodníku zakázané (§ 37 zákona o silničním provozu), dovolit ho může jen dodatková tabulka; aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsFI,
  // Väylä 18/2020 p. 61: a one-way street with cyclists both ways, without parking, 4.25 m of roadway (a guide: orange).
  contraflow: (parked) => (parked ? null : { lo: 0, base: 4.25, why: t("jednosměrka s cyklisty v protisměru bez stání: vozovka 4,25 m (příručka Väylä 18/2020)") }),
  // Helsinki's guide: a two-track tram lane in the street's middle 6.4 m, a separate bed 8 m (orange).
  tramBelt(belt, w) {
    return w < 6.4 - 0.005 ? [{ level: "zaklad", text: t("Tramvajový pás {w} je užší než 6,4 m pro dvoukolejný tramvajový pruh (helsinská příručka šířek uličního prostoru, 2014).", { w: fmt(w) }) }] : [];
  },
  signs: { dir: "signs-FI", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "fi",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { finland: { ...czechFurniture, ...atPosts } },
  // Finland's concrete estates of the 1960s–80s are not drawn as the Czech panel houses (Bára's memory: the socialist
  // looks only in CZ, SK, PL, EE and the GDR); question 4 of ZDROJE.md decided so (docs/backlog.md, Bára 23. 11. 2026:
  // the estates as "povalecny").
  socialistLooks: false,
  search: ["photon-fi", "ryhti"],
  // The Nordic looks (house-looks.js): the stone town's tenement, the painted wooden house, the wooden town house.
  houseLook: nordicLook("FI"),
  houseDetails: nordicDetails("FI"),
};
