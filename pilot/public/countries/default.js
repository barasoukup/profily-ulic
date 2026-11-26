// The rules of a state: here those of a place in no state the app knows (cizina, ISO code null) and what every state
// has unless its own module (CZ.js, SK.js, AT.js) says otherwise: the Czech ones, where the app began. A state's module
// spreads this one and changes what is its own (docs/architecture-countries.md). Where states differ by code, the
// module has a function, not a flag the core would branch on again. No import of city.js or of a module importing it
// (city.js imports the states).
import { t, mark } from "../i18n.js";
import { GROUP, fmt } from "../norms.js";

const LANE_BY_GROUP = {
  // The standard is not public: no red warning, only the basic width (Fable).
  A: { min: 0, zaklad: 3.5, why: t("jízdní pruh dálnice: ČSN 73 6110 skupina A 3,5 m") },
  B: { min: 3, zaklad: 3, why: t("jízdní pruh sběrné komunikace MK I nebo II: ČSN 73 6110 skupina B 3–3,25 m, Manuál C.2 základ 3 m") },
  C: { min: 2.75, zaklad: 3, why: t("jízdní pruh obslužné komunikace MK III: ČSN 73 6110 skupina C 2,75–3 m") },
  D: { min: 2.5, zaklad: 2.75, why: t("jízdní pruh zklidněné komunikace MK IV: Manuál C.2 2,75 m, při nízkých intenzitách 2,5 m") },
};
const laneByClass = (cls) => LANE_BY_GROUP[GROUP[cls]];

// Width a part should have: [minimum, basic], or null when the manual gives none for it.
function limits(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola": case "stezka_sdilena":
      // Minimum narrowed sidewalk 1.5 m (1.2 m in exceptions), basic 2–2.5 m. Beside cars parked on it (OSM
      // on_kerb / half_on_kerb) the same holds for what the cars leave free.
      if (parking?.position) return { min: 1.5, zaklad: 2, why: parking.position === "on_kerb" ? t("zbytek chodníku vedle stání na chodníku: zúžený chodník min. 1,5 m, základ 2–2,5 m") : t("zbytek chodníku vedle stání napůl na chodníku: zúžený chodník min. 1,5 m, základ 2–2,5 m") };
      return { min: 1.5, zaklad: 2, why: t("chodník: zúžený min. 1,5 m, základ 2–2,5 m") };
    case "pruh": case "pruh_piktokoridor":
      // A turning lane: about 2.5 m in tight places (Manuál C.2); narrower is orange (Bára 11. 11. 2026).
      if (s.turn) return { min: 0, zaklad: 2.5, why: t("řadicí pruh: cca 2,5 m ve stísněných poměrech (Manuál C.2)") };
      return laneByClass(s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass) || { min: 2.5, zaklad: 3, why: t("jízdní pruh: základ 3 m, ve zklidněné ulici 2,5 m") };
    case "bus": case "bus_cyklo":
      return s.type === "bus_cyklo"
        ? { min: 4.25, zaklad: 4.25, why: t("pruh pro autobus a cyklisty: 4,25–4,5 m") }
        : { min: 3, zaklad: 3.25, why: t("pruh pro autobusy: 3,25 m") };
    case "cyklopruh": case "ochranny_pruh": {
      if (parking) {
        const perp = parking.orient === "kolme" || parking.orient === "sikme";
        return perp
          ? { min: 2, zaklad: 2, why: t("cyklopruh vedle kolmého nebo šikmého stání: min. 2 m") }
          : { min: 1.75, zaklad: 1.75, why: t("cyklopruh vedle podélného stání: min. 1,75 m") };
      }
      return s.type === "ochranny_pruh"
        ? { min: 1.25, zaklad: 1.5, why: t("ochranný cyklopruh: základ 1,5 m, nejméně 1,25 m") }
        : { min: 1.5, zaklad: 1.5, why: t("cyklopruh u obruby: 1,5 m") };
    }
    // Below these widths orange only (Bára 11. 11. 2026).
    case "cyklostezka":
      return { min: 0, zaklad: 2.5, why: t("cyklostezka: 2,5 m") };
    case "nastupiste":
      return { min: 0, zaklad: [segs[i - 1], segs[i + 1]].some((x) => /^tramvaj/.test(x?.type || "")) ? 2.5 : 2, why: t("nástupiště zastávky: světlá šířka nejméně 2 m (Manuál C.2)") };
    case "parkovani":
      // Angled stalls keep the rules of perpendicular ones, their depth by the angle (Manuál C.2): 2.5 × 5 m at 45°
      // is about 5.3 m deep, at 30° 4.7 m.
      return s.orient === "kolme" || s.orient === "sikme"
        ? { min: 4.5, zaklad: 5, why: t("kolmé a šikmé stání: 5 m (4,5 m s přesahem nad chodník)") }
        : { min: 2, zaklad: 2, why: t("podélné stání: 2 m") };
    default:
      return null;
  }
}


// The sign files of vyhláška 294/2015 Sb. (znacky/) and the plates under them.
const SPEEDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // IP 4c (vyhl. 205/2025): one-way with contraflow cyclists, in place of IP 4b + E 12a.
  if (s.k === "oneway") return dir === "backward" ? "B2" : s.plate === "protismer" ? "IP4c" : "IP4b";
  // Oblique stalls have the sign of perpendicular ones (IP 11b, Bára).
  if (s.k === "ip11a") return s.plate === "podelne" ? "IP11c" : s.plate ? "IP11b" : "IP11a";
  if (s.k === "ip27a" && s.plate === "kola") return "IZ6a-kola";
  // C 10a: the design has the pedestrians on the right; the side of the path (walk) when the data know it.
  if (s.k === "c10a") return s.walk === "left" ? "C10a" : "C10a-chodci-vpravo";
  if (s.k === "b20a") return SPEEDS.includes(s.v) ? `B20a-${s.v}` : "B20a";
  return { b1: "B1", b2: "B2", b8: "B8", b11: "B11", b28: "B28", b29: "B29", b30: "B30", c8a: "C8a", c9a: "C9a", c10a: "C10a",
    ip11d: "IP11d", ip11e: "IP11e", ip11f: "IP11f", ip11g: "IP11g",
    ip12: "IP12", ztp: "IP12-ztp", ip14a: "IZ1a", ip15a: "IZ2a", ip20a: "IP20a-symbol", zona30: "IZ8a-30",
    ip26a: "IZ5a", ip27a: "IZ6a", cyklozona: "IZ9a", sdilena: "IZ10a", c7a: "C7a" }[s.k] || s.k;
}
function plateFile(s, seg) {
  if (s.plate === "protismer") return (s.dir ?? seg?.dir) === "backward" ? "E12b" : null; // IP 4c says it itself
  if (s.plate === "obsluha") return "E13";
  if (s.plate === "kolo") return "C8a"; // the round bike symbol under the bus of IP 20a
  return null;
}

// The Czech signs (Czechia: CZ.js).
export const CZ_SIGNS = { dir: "znacky", file: signFile, plate: plateFile, label: null, drawable: null };

// The sentence about parking half on the sidewalk under a law of 3 m for each direction (Czechia, Slovakia).
export const lawNote = (law) => (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}, {law} žádá {need} (3 m pro každý směr).", { free, need, law });

// The Czech number at the start of a label ("IP 4c / B 2 + E 12b ", "IP 12 + O 1 ", "B 20a "), for a state that puts
// its own number in its place.
export const CZ_CODE = /^(?:[A-Z]{1,2} \d+[a-z]?(?: [/+] |\s))+/;

export default {
  code: null, // ISO 3166-1 of the state
  bounds: null, // [lon0, lat0, lon1, lat1]: where a saved cut may lie (validate.js)
  // The law of parking (derive.js): the free lane left for each direction, the sentence about parking half on the
  // sidewalk; whether parking is estimated by the law at all (app.js).
  freeLane: 3,
  // The width the law leaves beside parked cars, when it is not freeLane per direction: (oneway, lanes, minLane) → m.
  lawNeed: null,
  // May the law's estimate put cars on this roadway at all: (tags, oneway, lanes) → boolean (null: yes; Slovenia: not on
  // a two-way street without a centre line).
  parkOnRoadway: null,
  // May the law's estimate put cars on the roadway beside a cycle lane (Switzerland: no, VRV Art. 19 Abs. 2).
  parkByCycleLane: true,
  // (A place in no state the app knows has no law of its own: the width the app leaves, no Czech paragraph; Czechia's
  // in CZ.js.)
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  // The group of a street from its OSM class where there is no class of the city's own (derive.js).
  roadClassFromOsm: false,
  // The width rules (rules.js): the minimum and basic width of a part, the one-way street with contraflow cyclists
  // without a cycle lane (null: no rule known), the tram belt of two tracks ([{ level, text }]).
  limits,
  contraflow: () => ({ lo: 3, base: 4, why: t("jednosměrka s cyklisty v protisměru: základ 4 m, při velmi nízké intenzitě 3 m, při vyšší až 4,5 m (Manuál C.2)") }),
  tramBelt(belt, w) {
    // 6.5 m at least, 7 m as the standard and 8 m with the overhead-line poles between the tracks (Manuál C.2; Bára:
    // 6.5–7 m without poles is orange).
    const poles = belt.some((x) => x.items?.some((it) => it.kind === "sloup_trakce"));
    if (w < 6.5 - 0.005) return [{ level: "min", text: t("Tramvajový pás {w} je užší než minimum 6,5 m pro dvě koleje.", { w: fmt(w) }) }];
    if (poles && w < 8 - 0.005) return [{ level: "zaklad", text: t("Tramvajový pás se sloupy trakčního vedení {w} je užší než 8 m (Manuál C.2).", { w: fmt(w) }) }];
    if (!poles && w < 7 - 0.005) return [{ level: "zaklad", text: t("Tramvajový pás {w} je užší než standard 7 m (Manuál C.2).", { w: fmt(w) }) }];
    return [];
  },
  // Traffic signs (signs.js): the folder, the file of a sign and of its plate, the label (null: the Czech one), whether
  // a sign can be drawn (null: all). A place in no state the app knows: none (as the USA and Canada), the label without
  // the Czech number; Czechia's are CZ_SIGNS (CZ.js; Bára 26. 11. 2026: nothing Czech beyond Czechia).
  signs: { dir: "znacky", file: () => null, plate: () => null, label: (x, own, label) => label.replace(CZ_CODE, ""), drawable: () => false },
  // The orthophotos: of a tram bed (ortho.js; null: none) and of the lanes (lanes-ortho.js; a city may have its own;
  // "none": none). ČÚZK's only in Czechia (CZ.js).
  bedOrtho: null,
  laneOrtho: "none",
  // The profile made from the orthophoto and OSM is said as such ("odhad z ortofota a OSM"; else "jen odhad z OSM").
  orthoEstimate: false,
  // How far beyond a town's passport or surface map (m) the pieces up to the houses go (app.js, ortho-osm.js
  // besidePassport, in every state; null: its own 15 m).
  besideMax: null,
  // Mapy.com's panoramas (app.js): only in Czechia (CZ.js).
  panorama: false,
  // What a cut lacks when its lines do not answer (sources.js outage), marked for t().
  linesMissing: mark("kolejí, plotů a svahů"),
  // The state's illustrations (profile.js): the sets of its cities by their id, its own set by the id of its rest
  // (city.js: a city with a set of its own draws it, the others the state's).
  art: {},
  // The socialist looks of a house (sorela, the brick block of the 1950s–60s, the panel house; profile.js buildingStyle):
  // only in the states that built them (Bára 23. 11. 2026: CZ, SK, PL, EE; DE in the former GDR); elsewhere the
  // postwar block of flats (profile.js westernLook). true, false, or (city) => boolean.
  socialistLooks: false,
  // A regional look of an old house (house-looks.js; profile.js buildingStyle calls it after westernLook):
  // (style, info, n, city) → a look of profile.js BUILDING_STYLES, or undefined to keep the style. null: none.
  houseLook: null,
  // What the state changes in drawing a look (profile.js): (look, info, city) → { terrace, blinds, boards, palette }.
  houseDetails: null,
  // The search services asked where the map shows the state (search.js), besides RÚIAN.
  search: [],
  // What the state decides by the place of the cut, set on the city (app.js): async (lon, lat) → { … }, or null.
  atPlace: null,
  // The author's name as the About dialog gives it (about.js; Bára 23. 11. 2026: "Bara Soukup" outside Czechia and
  // Slovakia, as in the credits of foreign data).
  author: "Bara Soukup",
};
