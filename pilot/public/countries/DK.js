// Denmark (DK; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/denmark.js (Copenhagen's and Aarhus's buildings, Copenhagen's kerb lines and parking areas), the spring
// orthophoto of GeoDanmark through Dataforsyningen with the app's token (lanes-ortho.js "dk", keys.js). Sources, norms
// and signs: evaluation/denmark/ (ZDROJE.md, NORMY.md). Bornholm is in; the Faroes and Greenland are not (GISCO's FO, GL).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { nordicDetails, nordicLook } from "../house-looks.js";

// Norms (evaluation/denmark/NORMY.md A, D): the Danish vejregler are recommendations (vejledende), so orange only:
// below the guide's minimum, the normal width said in the text. Red only where a binding rule is quoted: a two-way cycle
// track of 2.5 m (circular 95/1984, binding for the road authorities; quoted in the guide).
const PARKED = (segs, i) => [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
function limitsDK(s, segs = [], i = -1) {
  switch (s.type) {
    case "chodnik":
      return { min: 0, zaklad: 1.5, why: t("chodník: běžně 2,5 m, nejméně 1,5 m (dánská příručka Tværprofiler i byer, 2019; doporučení)") };
    case "chodnik_kola": case "stezka_sdilena":
      return { min: 0, zaklad: 1.8, why: t("jednosměrná společná stezka pro chodce a cyklisty: běžně 2,25 m, nejméně 1,8 m (dánská příručka Tværprofiler i byer, 2019; doporučení)") };
    case "cyklopruh": case "ochranny_pruh": {
      const p = PARKED(segs, i);
      return p && p.orient !== "kolme" && p.orient !== "sikme"
        ? { min: 0, zaklad: 1.8, why: t("cyklopruh vedle podélného stání: 1,8 m včetně čáry (dánská příručka Tværprofiler i byer, 2019; doporučení)") }
        : { min: 0, zaklad: 1.5, why: t("cyklopruh: 1,5 m včetně čáry, vedle podélného stání 1,8 m (dánská příručka Tværprofiler i byer, 2019; doporučení)") };
    }
    case "cyklostezka":
      return s.dir ? { min: 0, zaklad: 1.8, why: t("jednosměrná stezka pro cyklisty: běžně 2,25 m, nejméně 1,8 m (dánská příručka Tværprofiler i byer, 2019; doporučení)") }
        : { min: 2.5, zaklad: 2.5, why: t("obousměrná stezka pro cyklisty podél silnice: nejméně 2,5 m (oběžník 95/1984, závazný pro správce silnic, citovaný v příručce Tværprofiler i byer)") };
    case "bus":
      return { min: 0, zaklad: 3, why: t("pruh pro autobusy: běžně 3,5 m, krátce při nízké rychlosti nejméně 3 m (dánská příručka Tværprofiler i byer, 2019; doporučení)") };
    case "bus_cyklo":
      return { min: 0, zaklad: 4, why: t("pruh pro autobusy s cyklisty: o 1 m širší než pruh pro autobusy, tedy běžně 4,5 m, nejméně 4 m (dánská příručka Tværprofiler i byer, 2019; doporučení)") };
    case "parkovani":
      if (s.orient === "kolme") return { min: 0, zaklad: 5, why: t("kolmé stání: 5 m (dánská příručka Anlæg for parkering og standsning i byer, 2023; doporučení)") };
      if (s.orient === "sikme") return { min: 0, zaklad: 4.9, why: t("šikmé stání: hloubka 4,9 m při 30°, 5,6–5,9 m při 45–75° (dánská příručka Anlæg for parkering og standsning i byer, 2023; doporučení)") };
      return { min: 0, zaklad: 2, why: t("podélné stání: 2 m, 2,3 m včetně čáry (dánské příručky Tværprofiler i byer, 2019, a Anlæg for parkering og standsning i byer, 2023; doporučení)") };
    case "pruh": case "pruh_piktokoridor":
      // § 164 (2) of the order on the use of road markings (quoted in the guide) wants 2.75 m between lines; whether a
      // lane of OSM is marked the app does not know, so orange.
      return { min: 0, zaklad: 2.75, why: t("jízdní pruh: 3,25 m při 50 km/h (nejméně 3 m), 2,75 m při 30–40 km/h; pruh mezi čarami nejméně 2,75 m (vyhláška o užití dopravního značení, § 164, citovaná v dánské příručce Tværprofiler i byer)") };
    default:
      return null;
  }
}

// The signs of the state DK (pilot/public/signs-DK/, README there; bekendtgørelse om vejafmærkning 425/2023): the drawings
// from Wikimedia Commons ("Denmark road sign …", Public domain, PD-ineligible; licences checked through Commons' API
// 23. 11. 2026, evaluation/denmark/signs-licence.json). The Danish copyright act § 9 (2) keeps the copyright of works
// that appear in a regulation as independent contributions; treated as France's (official works, Bára to confirm;
// NORMY.md C1). The speed sign C 55 is the app's template (the red ring of C 21, the number filled in). Not drawn: the
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

export default {
  ...base,
  code: "DK",
  bounds: [7.9, 54.5, 15.3, 57.8],
  // Færdselsloven (LBK 118/2026) § 29 (1) 8: no stopping beside a solid line leaving less than 3 m; no general free width
  // beside parked cars (§ 28 (1): no danger or nuisance). The app keeps its convention of 3 m a direction (NORMY.md B1,
  // the app's reading, for Bára). § 28 (3): no parking on a sidewalk, cycle track or path; partly on the sidewalk only
  // outside built-up areas.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. V Dánsku je stání na chodníku v obci zakázané (§ 28 odst. 3 zákona o silničním provozu), smí jen mimo obec; zákon volnou šířku vozovky uvádí jen vedle plné čáry (3 m, § 29), aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
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
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { denmark: { ...czechFurniture, ...atPosts } },
  // The estates of the 1960s–70s (almene boliger) are not socialist panel houses (ZDROJE.md 6).
  socialistLooks: false,
  // GSearch of Dataforsyningen with the token (search-dk.js), Photon without it.
  search: ["gsearch", "photon-dk"],
  // The Nordic looks (house-looks.js): the Danish brick tenement (rendered: the stone town's), the painted wooden house
  // only on Bornholm.
  houseLook: nordicLook("DK"),
  houseDetails: nordicDetails("DK"),
};
