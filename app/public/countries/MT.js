// Malta (MT; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Traffic keeps LEFT (reg. 75
// of S.L. 65.11; derive.js turns only the directions). Its source is towns/malta.js (the estimate), the Planning
// Authority's orthophoto of 2018 lanes-ortho.js "mt". Sources, norms and signs: evaluation/malta/ (SOURCES.md, NORMS.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { mediterraneanLook } from "../house-looks.js";

// Norms (evaluation/malta/NORMS.md): no binding widths of streets; the sidewalk by Access for All (CRPD, 1.2 m for an
// accessible route) only orange (the review of 23. 11. 2026: guidance for routes to buildings, not a law for public
// sidewalks; the Road Geometry Handbook's 1.5 m is from its Table 1A, whose 1.30 / 1.50 m look swapped: not used until
// the table is read as an image), perpendicular parking by the Planning Authority's DC15 (4.8 m). No Maltese
// figure found for lanes, bus lanes, cycle lanes and tracks, parallel parking: lanes and parking without warning; cycle lanes,
// tracks and bus lanes by the UK's guidance Malta follows (LTN 1/20, LTN 1/97), orange only (Bára 27. 11. 2026).
function limitsMT(s) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 0, zaklad: 1.2, why: t("country.mt.sidewalk12M") };
    case "parkovani":
      return s.orient === "kolme" ? { min: 4.8, zaklad: 4.8, why: t("country.mt.perpendicularParking48") } : null;
    // No Maltese figure: the UK's guidance Malta follows in practice, orange only (Bára 27. 11. 2026).
    case "cyklopruh":
      return { min: 0, zaklad: 2, why: t("country.mt.cycleLane2M") };
    case "cyklostezka":
      return { min: 0, zaklad: s.dir ? 2 : 3, why: t("country.mt.cycleTrackOneWay") };
    case "bus": case "bus_cyklo":
      return { min: 0, zaklad: 4, why: t("country.mt.busLane4M") };
    default:
      return null;
  }
}

// The signs of the state MT (app/public/signs-MT/, README there; S.L. 65.05). Malta's copyright gives the government
// its drawings: only files of Commons with their own licence (UK drawings under the Open Government Licence v1.0,
// credited in the footer; Maltese ones in the public domain; evaluation/malta/signs-licence.json). Only the signs of the
// regulation's Schedule (reg. 2): no one-way sign, no cycle route signs (the Highway Code's British ones are guidance)
// and no "except cycles" plate (not verified in Malta), so a one-way street with contraflow cycling has no sign (the
// review of 23. 11. 2026). No motorway, residential or shared zone in Malta. The own drawings after the Schedule
// (II.E11 without its time plate, II.B6, II.D12) are labelled by name only, not as the official sign.
const MT_FILE = { b1: "II.A5", b11: "II.A6", b8: "II.B1", b30: "II.B5", b28: "II.D7", b29: "II.D6", ip11a: "III.B1", ip20a: "II.E11",
  zona30: "II.D12-30", ip27a: "II.B6" };
const MT_CODE = { ...MT_FILE, ip20a: null, zona30: null, ip27a: null };
const MT_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  if (s.k === "oneway") return dir === "backward" && s.plate !== "protismer" ? "II.A4" : null;
  if (s.k === "b20a") return MT_SPEEDS.includes(s.v) ? `II.D1-${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return MT_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  // A one-way sign is drawn only as II.A4 (against the lane's direction), whatever x.dir says.
  const code = x.k === "oneway" ? "II.A4" : x.k === "b20a" ? "II.D1" : MT_CODE[x.k];
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
  // pass on 4.1 m, an aisle beside parallel parking 3 m (NORMS.md B1). Parking on the sidewalk banned (reg. 79 d) but
  // where the sign III.B8–B10 allows it.
  freeLane: 3,
  // At least DC15's 4.1 m (two-way) or 3 m (one-way), and the lanes OSM counts keep MIN_LANE (2.5 m) each beside it
  // (the review of 23. 11. 2026: 4.1 m left four lanes of 2 m); a two-way street so keeps 5 m.
  lawNeed: (oneway, lanes, minLane) => Math.max(oneway ? 3 : 4.1, minLane * Math.max(oneway ? 1 : 2, lanes)),
  halfKerbNote: (free, need) => t("country.mt.parkingHalfSidewalkOsm", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsMT,
  contraflow: () => null,
  tramBelt: () => [],
  // ogl: the files drawn after British signs under the Open Government Licence v1.0, whose credit a cut showing one needs
  // ("Contains public sector information licensed under the Open Government Licence v1.0"; for the export, app.js).
  signs: { dir: "signs-MT", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg),
    ogl: new Set(["II.A4", "II.A5", "II.B1", "II.D6", "II.D7", "II.E11", "III.B1"]) },
  bedOrtho: null,
  laneOrtho: "mt",
  orthoEstimate: true,
  panorama: false,
  art: { malta: { ...czechFurniture, ...atPosts } },
  search: ["photon-mt"],
  // The regional looks of its old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026).
  houseLook: mediterraneanLook("MT"),
  houseDetails: null,
};
