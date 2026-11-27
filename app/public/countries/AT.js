// Austria (AT; Bára 16. 11. 2026): what differs from the Czech rules of countries/default.js. Its towns' data are
// towns/austria.js.
import { t } from "../i18n.js";
import { GROUP, fmt } from "../norms.js";
import { TOWN_ART, TRAM, TROLLEY, czechFurniture } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Austria (the state of the cut AT; Bára 16. 11. 2026): evaluation/austria/NORMY.md. The cycling widths of RVS 03.02.13
// (2022; quoted in the tables of Lower Austria's Leitfaden Förderung des Radverkehrs 2024: Ausbaustufe D the minimum,
// C the basic width), the rest after Vienna's Projektierungshandbuch Öffentlicher Raum (MA 18, 2011). RVS 03.02.12,
// 03.04.12 and 03.07.11 (pedestrians, cross-sections, parking) are not public.
const AT_LANE = { min: 2.5, zaklad: 2.75, why: t("jízdní pruh v obci: dva pruhy pro osobní auta 5 m, s nákladními a autobusy 5,5–6,5 m (Wiener Projektierungshandbuch, Blatt 6)") };
const AT_LANE_BY_GROUP = {
  // RVS 03.03.30 is not public: no red, only the basic width.
  A: { min: 0, zaklad: 3.75, why: t("jízdní pruh dálnice: obvykle 3,75 m (RVS 03.03.30 se nepodařilo ověřit, orientačně)") },
  B: { min: 2.75, zaklad: 3.25, why: t("jízdní pruh hlavní ulice: min. 2,75 m, základ 3,25 m (NÖ Leitfaden Radverkehr 2024, s. 22; Wiener Projektierungshandbuch)") },
  C: AT_LANE,
  D: { min: 2.5, zaklad: 2.5, why: t("jízdní pruh místní ulice: dva pruhy pro osobní auta 5 m (Wiener Projektierungshandbuch, Blatt 6)") },
};
function limitsAT(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.5, zaklad: 2, why: t("chodník: 2 m, výjimečně 1,5 m (Wiener Projektierungshandbuch; STEP 2025)") };
    case "stezka_sdilena":
      return parking ? { min: 3.05, zaklad: 3.75, why: t("společná stezka pro chodce a cyklisty vedle podélného stání: min. 3,05 m, základ 3,75 m (RVS 03.02.13 podle NÖ Leitfaden 2024)") }
        : { min: 2.8, zaklad: 3.5, why: t("společná stezka pro chodce a cyklisty: min. 2,8 m, základ 3,5 m (RVS 03.02.13 podle NÖ Leitfaden 2024)") };
    case "pruh": case "pruh_piktokoridor":
      if (s.turn) return { min: 0, zaklad: 2.75, why: t("řadicí pruh: orientačně 2,75 m (rakouský zdroj nenalezen)") };
      return AT_LANE_BY_GROUP[GROUP[s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass]] || AT_LANE;
    case "bus":
      return { min: 0, zaklad: 3.5, why: t("pruh pro autobusy: 3,5 m (Wiener Projektierungshandbuch, kap. 2)") };
    case "bus_cyklo":
      return { min: 0, zaklad: 4, why: t("pruh pro autobusy s cyklisty: 4 m, hlavně ve stoupání (Wiener Projektierungshandbuch, kap. 2)") };
    case "cyklopruh": case "ochranny_pruh": {
      // Radfahrstreifen and Mehrzweckstreifen have the same widths (RVS 03.02.13, tables 7 and 8).
      if (parking) {
        const perp = parking.orient === "kolme" || parking.orient === "sikme";
        return perp
          ? { min: 2.5, zaklad: 2.5, why: t("cyklopruh vedle kolmého nebo šikmého stání: 1,75 m a bezpečnostní pás 0,75 m (Wiener Projektierungshandbuch)") }
          : { min: 2, zaklad: 2, why: t("cyklopruh vedle podélného stání: 2 m (RVS 03.02.13 podle NÖ Leitfaden 2024)") };
      }
      return { min: 1.5, zaklad: 1.5, why: t("cyklopruh: 1,5 m, na hlavních trasách 1,8 m (RVS 03.02.13 podle NÖ Leitfaden 2024)") };
    }
    case "cyklostezka":
      return parking ? { min: 1.75, zaklad: 2.05, why: t("stezka pro cyklisty vedle podélného stání: min. 1,75 m, základ 2,05 m (RVS 03.02.13 podle NÖ Leitfaden 2024)") }
        : { min: 1.5, zaklad: 1.8, why: t("stezka pro cyklisty jednosměrná: min. 1,5 m, základ 1,8 m; obousměrná 2,5 a 3,1 m (RVS 03.02.13 podle NÖ Leitfaden 2024)") };
    case "nastupiste":
      return { min: 2.5, zaklad: 3.3, why: t("nástupiště zastávky: s přístřeškem min. 2,5 m, základ 3,3 m (Wiener Projektierungshandbuch)") };
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme" ? null : { min: 2, zaklad: 2, why: t("podélné stání: 2 m (Wiener Projektierungshandbuch)") };
    default:
      return null;
  }
}


// The signs of the state AT (app/public/signs-AT/, README there; StVO 1960 § 52–53, Wikimedia Commons, Austrian
// official works): the label's number and the file. Austria has no sign for parking on the sidewalk, a reserved
// space or a cycle lane (markings), nor a one-way sign facing the driver (Einbahnstraße is a plate along the street), so those are not drawn.
const AT_CODE = { b1: "§ 52 Z 1", b11: "§ 52 Z 6c", b8: "§ 52 Z 8c", b30: "§ 52 Z 14b", b20a: "§ 52 Z 10a", b28: "§ 52 Z 13b",
  b29: "§ 52 Z 13a", c8a: "§ 52 Z 16", c9a: "§ 52 Z 17a", c10a: "§ 52 Z 17a", c7a: "§ 52 Z 17",
  ip11a: "§ 53 Z 1a", ip14a: "§ 53 Z 8a", ip15a: "§ 53 Z 8c", ip20a: "§ 53 Z 25", zona30: "§ 52 Z 11a", ip26a: "§ 53 Z 9c",
  ip27a: "§ 53 Z 9a", cyklozona: "§ 53 Z 26", sdilena: "§ 53 Z 9e" };
const AT_FILE = { b1: "1", b11: "6c", b8: "8c", b30: "14b", b28: "13b", b29: "13a", c8a: "16", c9a: "17a-a", c10a: "17a-b", c7a: "17",
  ip11a: "HZ1a", ip14a: "HZ8a", ip15a: "HZ8c", ip20a: "HZ25", zona30: "11a", ip26a: "HZ9c", ip27a: "HZ9a", cyklozona: "HZ26", sdilena: "HZ9e" };
const AT_SPEEDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
function signFile(s) {
  // No one-way sign under a lane (Bára 16. 11. 2026): Austria's Einbahnstraße (Hinweiszeichen 10) is the plate along
  // the street, there is none facing the driver.
  if (s.k === "oneway") return null;
  if (s.k === "b20a") return AT_SPEEDS.includes(s.v) ? `10a-${s.v}` : "10a";
  return AT_FILE[s.k] || null;
}
const signLabel = (x, own, label) => (AT_CODE[x.k] ? `${AT_CODE[x.k]} ${label.replace(CZ_CODE, "")}` : label);

// Austria's towns (Bára 16. 11. 2026; app/public/wien, graz, linz, drawn in rounds of a drawer and a critic): Vienna's
// Flexity and bus of Wiener Linien, the trams of Graz and Linz, elsewhere the neutral vehicles of generic/; the Austrian stop post
// (the round H sign, wien/stop-post-*) everywhere; the furniture the Czech set's.
const atPosts = (dir) => Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right",
  "transit-shelter-01-left", "transit-shelter-01-right", "transit-shelter-green-left", "transit-shelter-green-right"].map((k) => [k, `${dir}${TOWN_ART[k]}`]));
// Vienna its own stop posts (with the Wiener Linien plate at the tram stops), elsewhere the Austrian ones (austria/);
// the shelters of Austria everywhere.
const atArt = ({ posts = "../austria/", tram, trolley, bus }) => ({ ...czechFurniture, ...atPosts("../austria/"), ...(posts !== "../austria/" ? Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `${posts}${TOWN_ART[k]}`])) : {}),
  ...(bus ? { "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound" } : {}), ...(tram ? TRAM : {}), ...(trolley ? TROLLEY : {}) });
const AT_ART = { austria: atArt({}), wien: atArt({ posts: "", tram: true, bus: true }), graz: atArt({ tram: true, bus: true }), linz: atArt({ tram: true, trolley: true, bus: true }),
  salzburg: atArt({ trolley: true, bus: true }), innsbruck: atArt({ tram: true, bus: true }) };

export default {
  ...base,
  code: "AT",
  bounds: [9.5, 46.3, 17.2, 49.1],
  // StVO § 24 Abs. 3 lit. d, e: two lanes stay free on a two-way road, one on a one-way street; the VwGH takes a lane
  // of about 2.6 m (evaluation/austria/NORMY.md, secondary).
  freeLane: 2.6,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}, StVO § 24 odst. 3 žádá {need} (dva volné pruhy, v jednosměrce jeden, podle judikatury asi 2,6 m).", { free, need }),
  // The law's estimate on local streets as in Czechia (the universal judging, 17. 11. 2026: parking was missing in 14 of
  // 33 Austrian cuts; ?odhadstani=0 leaves it out).
  parkGuess: true,
  // Austria has no street classes of its own here: the OSM highway gives the group (limitsAT).
  roadClassFromOsm: true,
  limits: limitsAT,
  // 3.5 m at least, 3.75 m beside parking (Wiener Projektierungshandbuch).
  contraflow: (parked) => ({ ...(parked ? { lo: 3.75, base: 3.75 } : { lo: 3.5, base: 3.5 }), why: t("jednosměrka s cyklisty v protisměru bez cyklopruhu: nejméně 3,5 m, se stáním 3,75 m (Wiener Projektierungshandbuch)") }),
  // 6.6 m for two tracks 3 m apart, in a bed of their own or among cars (Wiener Projektierungshandbuch).
  tramBelt: (belt, w) => (w < 6.6 - 0.005 ? [{ level: "min", text: t("Tramvajový pás {w} je užší než 6,6 m pro dvě koleje (Wiener Projektierungshandbuch).", { w: fmt(w) }) }] : []),
  // Signs without an Austrian drawing and those with a plate (its Zusatztafeln are not drawn: B 1 alone would ban all
  // entry, not all but local traffic) are not drawn (the hostile review of Austria).
  signs: { dir: "signs-AT", file: signFile, plate: () => null, label: signLabel, drawable: (x) => !!signFile(x) && !x.plate },
  // basemap.at's orthophoto for the lanes; none for a tram bed (ČÚZK's is blank here).
  bedOrtho: null,
  laneOrtho: "at",
  orthoEstimate: true,
  panorama: false,
  art: AT_ART,
  search: ["photon"],
};
