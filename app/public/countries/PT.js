// Portugal (PT; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/portugal.js (the estimate only: no city publishes its street surfaces online), DGT's orthophotos lanes-ortho.js
// "pt". Sources, norms and signs: evaluation/portugal/ (SOURCES.md, NORMS.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { mediterraneanDetails, mediterraneanLook } from "../house-looks.js";

// Norms (evaluation/portugal/NORMS.md D): binding only accessibility (Decreto-Lei 163/2006: the free width of a sidewalk
// of the main and collector streets 1.5 m, of every pedestrian route 1.2 m; Bára 23. 11. 2026: 1.5 m everywhere); the rest IMT's technical documents and
// Lisbon's guide (recommendations; the cycle tracks by IMT, Bára 23. 11. 2026). No warning for a tram belt (no source found).
const lanes = (segs) => segs.filter((x) => x.type === "pruh" || x.type === "pruh_piktokoridor");
function limitsPT(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.5, zaklad: 1.8, why: t("country.pt.sidewalkFreeWidthLeast") };
    // Beside parallel parking IMT's 2.2 m at least, 2.5 m recommended, 1 m of it a buffer (NORMS.md A2; the review of
    // 23. 11. 2026: the text said 2.5 m of Lisbon, which gives only a buffer of 0.7 m, and the code did not look).
    case "cyklopruh":
      if (parking && (parking.orient || "podelne") === "podelne")
        return { min: 2.2, zaklad: 2.5, why: t("country.pt.cycleLaneBesideParallel") };
      return { min: 1.2, zaklad: 1.5, why: t("country.pt.cycleLane15") };
    case "cyklostezka":
      return { min: 1.75, zaklad: 2, why: t("country.pt.oneWayCycleTrack") };
    // IMT's 3 m is France's figure it cites (CEREMA 2016, second hand: NORMS.md A3); Lisbon's 3.25 m at the kerb.
    case "bus":
      // Orange only (Bára 23. 11. 2026): the 3 m minimum is CEREMA's, second hand.
      return { min: 0, zaklad: 3.25, why: t("country.pt.busLane325") };
    // The minimum is Lisbon's; IMT recommends 3.25 m and calls the shared lane not advisable (NORMS.md A2).
    case "bus_cyklo":
      return { min: 3.25, zaklad: 3.25, why: t("country.pt.sharedBusCycleLane") };
    case "pruh": case "pruh_piktokoridor": {
      if (s.turn) return null;
      const L = lanes(segs), oneway = L.length > 0 && L.every((x) => (x.dir ?? "forward") === (L[0].dir ?? "forward"));
      return oneway && L.length >= 2
        ? { min: 0, zaklad: 2.75, why: t("country.pt.laneCarriagewaySeveralLanes") }
        : { min: 0, zaklad: 3, why: t("country.pt.trafficLane3M") };
    }
    case "parkovani":
      if (s.orient === "sikme") return { min: 0, zaklad: 4.2, why: t("country.pt.angledParkingStrip4") };
      return s.orient === "kolme" ? { min: 4.5, zaklad: 5, why: t("country.pt.perpendicularParkingStrip5") }
        : { min: 1.8, zaklad: 2, why: t("country.pt.parallelParkingStrip2") };
    default:
      return null;
  }
}

// The signs of the state PT (app/public/signs-PT/, README there; Regulamento de Sinalização do Trânsito, Decreto
// Regulamentar 22-A/98 as amended by 6/2019; Wikimedia Commons). Part of a regulation, so by our reading not protected
// (art. 8 and 3 of the Código do Direito de Autor speak of texts; NORMS.md C1; as France and Spain, Bára 23. 11. 2026:
// "Značky jsou volně"). Portugal has no sign
// of a pedestrian zone (G5a, a zone closed to traffic, stands for it), of a cycle street, nor tells a residential zone
// from a shared one (H46 both).
const PT_FILE = { b1: "C2", b11: "C4a", b8: "C3g", b30: "C3l", b28: "C16", b29: "C15", ip11a: "H1a", ip14a: "H24", ip15a: "H25", ip20a: "D6",
  zona30: "G4a", ip26a: "H46", sdilena: "H46", ip27a: "G5a", c8a: "D7a", c9a: "D7e", c10a: "D7f", c7a: "D7b" };
const PT_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // H3 where the lane goes away (a one-way street), C1 where it comes towards the viewer (no entry); with cyclists in
  // contraflow C1 with the plate modelo 10e "EXCETO" and a bicycle (drawn in the file).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "C1-plus-10e" : "C1") : "H3";
  if (s.k === "b20a") return PT_SPEEDS.includes(s.v) ? `C13-${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return PT_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "C1" + (x.plate === "protismer" ? " + 10e" : "") : "H3") : x.k === "b20a" ? "C13" : PT_FILE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
};

// No drawings of its own (as Spain): the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "PT",
  bounds: [-31.3, 32.6, -6.18, 42.16],
  // Código da Estrada art. 50/1 a): no parking where the others would have to cross into the other direction to pass,
  // art. 49/1 g) 3 m beside a continuous line: read as the Czech 3 m a direction (evaluation/portugal/NORMS.md B1; for
  // Bára). Parking is estimated as in Luxembourg.
  freeLane: 3,
  halfKerbNote: (free, need) => t("country.pt.parkingHalfSidewalkOsm", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsPT,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-PT", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "pt",
  orthoEstimate: true,
  besideMax: 25,
  panorama: false,
  art: { portugal: { ...czechFurniture, ...atPosts } },
  search: ["photon-pt"],
  // The regional looks of its old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026).
  houseLook: mediterraneanLook("PT"),
  houseDetails: mediterraneanDetails("PT"),
};
