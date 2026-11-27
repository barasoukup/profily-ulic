// Slovakia (SK; Bára 15.–16. 11. 2026): what differs from the Czech rules of countries/default.js. Its towns' data are
// towns/slovakia.js.
import { t, mark } from "../i18n.js";
import { GROUP } from "../norms.js";
import { TOWN_ART, TRAM, TROLLEY, czechFurniture } from "../art.js";
import base, { CZ_CODE, lawNote } from "./default.js";

// Slovakia (the state of the cut SK; Bára 16. 11. 2026): the Slovak rules where they are public, after
// evaluation/slovakia/NORMS.md: TP 117 (2023, signs and markings: the minimum widths of marked lanes), TP 118, TP 73 6110
// (2024), TP 085 (2019, cycling), vyhláška 532/2002 Z. z. (sidewalk), IDS BK (platforms). STN 73 6110:2024 itself is
// not public: lanes by class after its 2004 values and TP 117/118. No public Slovak width of a tram belt: no warning.
const SK_LANE = { min: 2.75, zaklad: 3, why: t("country.sk.laneTownLeast2") };
const SK_LANE_BY_GROUP = {
  // The standard is not public: no red warning, only the basic width (Fable).
  A: { min: 0, zaklad: 3.5, why: t("country.sk.motorwayLane35") },
  B: { min: 2.75, zaklad: 3, why: t("country.sk.laneCollectorRoadLeast") },
  C: SK_LANE,
  D: { min: 2.5, zaklad: 2.75, why: t("country.sk.laneTrafficCalmedStreet") },
};
function limitsSK(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      if (parking?.position) return { min: 1.5, zaklad: 2, why: t("country.sk.restSidewalkBesideParking") };
      return { min: 1.3, zaklad: 1.5, why: t("country.sk.sidewalkLeast13") };
    case "stezka_sdilena":
      return { min: 2.5, zaklad: 3, why: t("country.sk.sharedPathPedestriansCyclistsTown") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 2.75, why: t("country.sk.turningLaneMarkedLane") };
      return SK_LANE_BY_GROUP[GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]] || SK_LANE;
    case "bus":
      return { min: 3, zaklad: 3.5, why: t("country.sk.busLane35") };
    case "bus_cyklo":
      // Bicycles in a bus lane: 3.5 m at most, or 4.75 m and more; not between (TP 117, 2.12.4.1).
      return s.width > 3.5 + 0.005
        ? { min: 4.75, zaklad: 4.75, why: t("country.sk.busLaneCyclistsMost") }
        : { min: 3, zaklad: 3, why: t("country.sk.busLaneCyclists3") };
    case "cyklopruh": {
      if (parking) {
        const perp = parking.orient === "kolme" || parking.orient === "sikme";
        return perp
          ? { min: 2.5, zaklad: 2.75, why: t("country.sk.cycleLaneBesidePerpendicular") }
          : { min: 2.25, zaklad: 2.5, why: t("country.sk.cycleLaneBesideParallel") };
      }
      return { min: 1.75, zaklad: 2, why: t("country.sk.cycleLaneLeast1") };
    }
    case "ochranny_pruh":
      return { min: 1.25, zaklad: 1.5, why: t("country.sk.advisoryCycleLane1") };
    case "cyklostezka":
      return { min: 2, zaklad: 2.5, why: t("country.sk.cycleTrackOneWay") };
    case "nastupiste":
      return { min: 0, zaklad: [segs[i - 1], segs[i + 1]].some((x) => /^tramvaj/.test(x?.type || "")) ? 2.5 : 2, why: t("country.sk.stopPlatformRuleLeast") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme"
        ? { min: 4.5, zaklad: 5, why: t("country.sk.perpendicularAngledParking5") }
        : { min: 2, zaklad: 2, why: t("country.sk.parallelParking2M") };
    default:
      return null;
  }
}


// The signs of the state SK (app/public/signs-SK/, README there): the number for the label, the file of the sign
// and of its plate. SK has no plates for the manner of parking (272 alone), no one-way sign with contraflow
// cyclists (321 + plate 514, seen from the exit 230 + plate 507 with a bicycle), and puts a reserved parking
// space under Zákaz zastavenia (270 + plate 531).
const SK_CODE = { b1: "231", b11: "232", b8: "233", b30: "233", b20a: "253", b28: "270", b29: "271", oneway: "321 / 230",
  c8a: "221", c9a: "222", c10a: "223", ip11a: "272", ip11d: "273", ip11e: "273", ip11f: "273", ip11g: "273",
  ip12: "270 + 531", ztp: "272", ip14a: "309", ip15a: "311", ip20a: "224", zona30: "268", ip26a: "315", ip27a: "317", cyklozona: "323", c7a: "220" };
const SK_CHOICE_CODE = { "oneway+protismer": "321 + 514 / 230 + 507", "ip20a+kolo": "224 + 515", "ip27a+kola": "317 + 515",
  "b1+obsluha": "231 + 507", "b11+obsluha": "232 + 507" };
const SK_FILE = { b1: "231", b11: "232", b8: "233-58", b30: "233-60", b28: "270", b29: "271", c8a: "221", c9a: "222", c10a: "223-51",
  ip11a: "272", ip11d: "273-85", ip11e: "273-65", ip11f: "273-75", ip11g: "273-55", ip12: "270", ztp: "272",
  ip14a: "309", ip15a: "311", ip20a: "224", zona30: "268-30", ip26a: "315", ip27a: "317", cyklozona: "323", c7a: "220" };
// The names of the Slovak signs by their own meaning (vyhláška 30/2020 Z. z.; the review of Slovakia: "323 Zóna pre
// cyklistov" is "Bicyklová cesta"), in the page's language: in Slovak the official names (sk.js).
const SK_TITLE = {
  b1: t("country.sk.noEntryAllVehicles"),
  b11: t("country.sk.noEntryAllMotor"),
  b8: t("country.sk.noEntryBicycles"),
  b30: t("country.sk.noEntryPedestrians"),
  b20a: t("country.sk.speedLimit"),
  b28: t("country.sk.noStopping"),
  b29: t("common.noParking"),
  oneway: t("country.sk.oneWayRoadNo"),
  c7a: t("country.sk.footpath"),
  c8a: t("country.sk.cycleTrack"),
  c9a: t("country.sk.sharedPathPedestriansCyclists"),
  c10a: t("country.sk.segregatedPathPedestriansCyclists"),
  ip11a: t("common.parking"),
  ip11d: t("country.sk.perpendicularParkingFullyPavement"),
  ip11e: t("country.sk.parkingFullyPavement"),
  ip11f: t("country.sk.perpendicularParkingPartlyPavement"),
  ip11g: t("country.sk.parkingPartlyPavement"),
  ip14a: t("country.sk.motorway"),
  ip15a: t("country.sk.roadMotorVehicles"),
  ip20a: t("country.sk.reservedLanePublicTransport"),
  zona30: t("country.sk.speedLimitZone"),
  ip26a: t("country.sk.residentialZone"),
  ip27a: t("country.sk.pedestrianZone"),
  cyklozona: t("country.sk.cycleStreet"),
};
const SK_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  if (s.k === "oneway") return dir === "backward" ? "230" : "321-30";
  if (s.k === "b20a") return SK_SPEEDS.includes(s.v) ? `253-${s.v}` : "253";
  if (s.k === "c10a") return s.walk === "left" ? "223-51" : "223-50";
  return SK_FILE[s.k] || null; // a sign SK has not (the shared zone): none
}
function plateFile(s, seg) {
  if (s.plate === "protismer") return (s.dir ?? seg?.dir) === "backward" ? "507-bicycle" : "514";
  if (s.plate === "obsluha") return "except-access";
  if (s.plate === "kolo" || s.plate === "kola") return "515-bicycle";
  return { ip12: "531", ztp: "disabled" }[s.k] || null;
}
// The label keeps the sign's name in the language of the page and takes the Slovak number; own: the sign as a
// choice with its plate (signs.js SIGN_CHOICES), label: the Czech label, plates: the plates' names.
function signLabel(x, own, label, plates) {
  const code = (own && SK_CHOICE_CODE[`${x.k}+${x.plate}`]) || SK_CODE[x.k];
  // The Slovak sign's own name (SK_TITLE), not the Czech sign's translated.
  if (!own && SK_TITLE[x.k]) return `${code} ${SK_TITLE[x.k]}${typeof x.v === "number" ? ` ${x.v} km/h` : ""}${x.plate ? ` (${plates[x.plate]})` : ""}`;
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
}

// The Slovak towns' vehicles (Bára 16. 11. 2026; app/public/<town>/, drawn after photos of Wikimedia Commons): a cut in
// Slovakia draws the trams, trolleybuses and buses of its town (by a box around it), elsewhere the neutral ones (generic/); the
// furniture is the Czech set's ("../cesko/…": the files of cesko/).
// The stop posts carry the Slovak sign 331 Zastávka (Bára 16. 11. 2026; slovakia/, for every Slovak town).
const skPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right", "transit-shelter-01-left", "transit-shelter-01-right",
  "transit-shelter-green-left", "transit-shelter-green-right"].map((k) => [k, `../slovensko/${TOWN_ART[k]}`]));
const skArt = (tram, trolley, bus = true) => ({ ...czechFurniture, ...skPosts, ...(bus ? { "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound" } : {}), ...(tram ? TRAM : {}), ...(trolley ? TROLLEY : {}) });
// slovensko: the rest of Slovakia (the neutral vehicles of generic/, the Czech furniture, the Slovak stop posts).
// Bratislava and Košice have their own stop posts (drawn after photos of their stops, 16. 11. 2026); the rest of
// Slovakia a generic Slovak city bus (slovensko/bus-*), Nitra, Trnava, Trenčín, Martin and Poprad their own.
const ownPosts = { "stop-post-left": "stop-post-left", "stop-post-right": "stop-post-right", "stop-post-tram-left": "stop-post-tram-left", "stop-post-tram-right": "stop-post-tram-right" };
const SK_ART = { slovensko: { ...skArt(false, false, false), "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound" },
  bratislava: { ...skArt(true, true), ...ownPosts }, kosice: { ...skArt(true, false), ...ownPosts }, zilina: skArt(false, true), bystrica: skArt(false, true), presov: skArt(false, true),
  nitra: skArt(false, false), trnava: skArt(false, false), trencin: skArt(false, false), martin: skArt(false, false), poprad: skArt(false, false) };



export default {
  ...base,
  code: "SK",
  bounds: [16.8, 47.7, 22.6, 49.7],
  halfKerbNote: lawNote("§ 23 ods. 1 zák. 8/2009 Z. z."),
  // The law's parking as everywhere (§ 23 ods. 1 zák. 8/2009 Z. z., 3 m per direction as Czechia's § 25 odst. 3). Off until
  // 25. 11. 2026: its losses were a fault of the shared code (ai-kerbs.js layLaw), without it Slovakia 6 : 7 on 148
  // local streets, Czechia 5 : 5 on 63 (evaluation/archive/unification/slovakia-parking).
  parkGuess: true,
  limits: limitsSK,
  // Slovakia: 3.75 m in a town, 3.5 m where it cannot be had, 4.75 m with much cycling or freight (TP 117, tab. 4).
  contraflow: () => ({ lo: 3.5, base: 3.75, why: t("country.sk.oneWayStreetContraflow") }),
  // No public Slovak width of a tram belt: no warning.
  tramBelt: () => [],
  // A sign SK has not is not drawn (Fable: no shared zone).
  signs: { dir: "signs-SK", file: signFile, plate: plateFile, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  // The ZBGIS orthophoto of ÚGKK SR (lanes-ortho.js "sk") for the tram bed and the lanes.
  bedOrtho: "sk",
  laneOrtho: "sk",
  orthoEstimate: true,
  panorama: false,
  linesMissing: mark("country.sk.townMapZbgis"),
  art: SK_ART,
  // The house looks as in Czechia: sorela, the brick block of the 1950s–60s, the panel house.
  socialistLooks: true,
  search: ["zbgis"],
};
