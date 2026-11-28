// Denmark (DK; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/denmark.js (Copenhagen's and Aarhus's buildings, Copenhagen's kerb lines and parking areas), the spring
// orthophoto of GeoDanmark through Dataforsyningen with the app's token (lanes-ortho.js "dk", keys.js). Sources, norms
// and signs: evaluation/denmark/ (SOURCES.md, NORMS.md). Bornholm is in; the Faroes and Greenland are not (GISCO's FO, GL).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { cycleTrackLimits } from "./cycletrack.js";
import { nordicDetails, nordicLook } from "../house-looks.js";

// Norms (evaluation/denmark/NORMS.md A, D): the Danish vejregler are recommendations (vejledende), so orange only:
// below the guide's minimum, the normal width said in the text. Red only where a binding rule is quoted: a two-way cycle
// track of 2.5 m (circular 95/1984, binding for the road authorities; quoted in the guide).
const PARKED = (segs, i) => [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
function limitsDK(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 1.5, why: t("country.dk.sidewalkUsually25") };
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 0, zaklad: 1.8, why: t("country.dk.oneWaySharedPath") };
    case "cyklopruh": case "ochranny_pruh": {
      const p = PARKED(segs, i);
      return p && p.orient !== "kolme" && p.orient !== "sikme"
        ? { min: 0, zaklad: 1.8, why: t("country.dk.cycleLaneBesideParallel") }
        : { min: 0, zaklad: 1.5, why: t("country.dk.cycleLane15") };
    }
    case "cyklostezka":
      // A half of a two-way track by the whole track; one-way, or without a direction (derive.js gives OSM's one-way
      // tracks none), by the one-way figure (countries/cycletrack.js). Orange only (the review of 24. 11. 2026): the
      // circular 95/1984 is known only as the handbook cites it (NORMS.md: second hand), its text and validity unread.
      return cycleTrackLimits(s, segs, i, { min: 0, zaklad: 1.8, why: t("country.dk.oneWayCycleTrack") },
        { min: 0, zaklad: 2.5, why: t("country.dk.twoWayCycleTrack") });
    case "bus":
      return { min: 0, zaklad: 3, why: t("country.dk.busLaneUsually3") };
    case "bus_cyklo":
      return { min: 0, zaklad: 4, why: t("country.dk.busLaneCyclists1") };
    case "parkovani":
      if (s.orient === "kolme") return { min: 0, zaklad: 5, why: t("country.dk.perpendicularParking5M") };
      if (s.orient === "sikme") return { min: 0, zaklad: 4.9, why: t("country.dk.angledParkingDepth4") };
      return { min: 0, zaklad: 2, why: t("country.dk.parallelParking2M") };
    case "pruh": case "pruh_piktokoridor":
      // § 164 (2) of the order on the use of road markings (quoted in the guide) wants 2.75 m between lines; whether a
      // lane of OSM is marked the app does not know, so orange.
      return { min: 0, zaklad: 2.75, why: t("country.dk.trafficLane325") };
    default:
      return null;
  }
}

// The signs of the state DK (app/public/signs-DK/, README there; bekendtgørelse om vejafmærkning 425/2023): the drawings
// from Wikimedia Commons ("Denmark road sign …", Public domain, PD-ineligible; licences checked through Commons' API
// 23. 11. 2026, evaluation/denmark/signs-licence.json). The Danish copyright act § 9 (2) keeps the copyright of works
// that appear in a regulation as independent contributions; treated as France's (official works, Bára to confirm;
// NORMS.md C1). The speed sign C 55 is the app's template (the red ring of C 21, the number filled in). Not drawn: the
// one-way arrow E 19 (a sign along the street, as in Austria), the plates (text), a zone of 30 (E 68 on Commons has 40),
// the bus lane (a road marking), the reserved and the disabled's parking (plates). Denmark has no shared zone.
const DK_FILE = { b1: "C21", b11: "C22.1", b8: "C25.1", b30: "C26.2", b28: "C61", b29: "C62", ip11a: "E33.1", ip14a: "E42", ip15a: "E43",
  ip26a: "E51", ip27a: "E49", cyklozona: "E47", c8a: "D21", c9a: "D27", c10a: "D26", c7a: "D22" };
const DK_CODE = { b1: "C 21", b11: "C 22,1", b8: "C 25,1", b30: "C 26,2", b28: "C 61", b29: "C 62", ip11a: "E 33", ip14a: "E 42", ip15a: "E 43",
  ip26a: "E 51", ip27a: "E 49", cyklozona: "E 47", c8a: "D 21", c9a: "D 27", c10a: "D 26", c7a: "D 22", b20a: "C 55" };
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // C 19 where the lane comes towards the viewer; with cyclists in contraflow its plate is text (not drawn): none.
  if (s.k === "oneway") return dir === "backward" && s.plate !== "protismer" ? "C19" : null;
  if (s.k === "b20a") return typeof s.v === "number" ? "C55" : null;
  // D 26 has the pedestrians on the left, D 26,2 on the right (as drawn on Commons); without data on the right, as the
  // Czech C 10a.
  if (s.k === "c10a") return s.walk === "left" ? "D26" : "D26.2";
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate)) return null;
  return DK_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? "C 19" : DK_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

/** @type {import("../types.js").Country} */
export default {
  ...base,
  code: "DK",
  bounds: [7.9, 54.5, 15.3, 57.8],
  // Færdselsloven (LBK 118/2026) § 29 (1) 8: no stopping beside a solid line leaving less than 3 m; no general free width
  // beside parked cars (§ 28 (1): no danger or nuisance). The app keeps its convention of 3 m a direction (NORMS.md B1,
  // the app's reading, for Bára). § 28 (3): no parking on a sidewalk, cycle track or path; partly on the sidewalk only
  // outside built-up areas.
  freeLane: 3,
  halfKerbNote: (free, need) => t("country.dk.parkingHalfSidewalkOsm", { free, need }),
  parkGuess: true,
  // A cycle track OSM tags on the road (derive.js trackAlongRoad) without a width of its own: the usual one-way track of
  // the handbook Tværprofiler i byer (2019), 2.25 m (the review of 24. 11. 2026, bod 2; evaluation/denmark/ab/CYCLE-TRACKS.md).
  trackWidth: 2.25,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsDK,
  // The guide gives no width of a one-way street with cyclists both ways, nor of a tram belt (Odense's and Aarhus's
  // letbane: not found).
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-DK", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "dk",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { denmark: { ...czechFurniture, ...atPosts } },
  // The estates of the 1960s–70s (almene boliger) are not socialist panel houses (SOURCES.md 6).
  socialistLooks: false,
  // GSearch of Dataforsyningen with the token (search-dk.js), Photon without it.
  search: ["gsearch", "photon-dk"],
  // The Nordic looks (house-looks.js): the Danish brick tenement (rendered: the stone town's), the painted wooden house
  // only on Bornholm.
  houseLook: nordicLook("DK"),
  houseDetails: nordicDetails("DK"),
};
