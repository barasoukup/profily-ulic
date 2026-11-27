// Belgium (BE; Bára 20. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/belgium.js (the lines of Flanders' GRB and Wallonia's PICC for the kerbs), the regions' orthophotos
// lanes-ortho.js "be". Sources, norms and signs: evaluation/belgium/ (ZDROJE.md, NORMY.md, ab/).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";
import { belgiumDetails, belgiumLook } from "../house-looks.js";

// Norms (evaluation/belgium/NORMY.md): the three regions have guidelines of their own and the app does not tell them
// apart, so the lowest of them is the minimum, Flanders' figure the base, each quoted. No warning for a lane (Flanders'
// 3.2 m is for its main regional roads only), a tram belt or parking (the 2 m of parallel parking is only derived:
// the hostile review).
function limitsBE(s) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.5, zaklad: 1.8, why: t("chodník: volný průchod nejméně 1,5 m, základ 1,8 m (Flandry, Vademecum voetgangersvoorzieningen 2026; Valonsko 1,5 m; Brusel 2 m)") };
    case "stezka_sdilena":
      return { min: 2, zaklad: 2.5, why: t("společná stezka pro chodce a cyklisty (D10): jednosměrná 2 m, obousměrná 2,5 m, doporučeno 3 m (Valonsko, Guide cyclable)") };
    case "cyklostezka":
      return { min: 1.3, zaklad: 2, why: t("stezka pro cyklisty jednosměrná: Flandry 2 m (Vademecum fietsvoorzieningen 2024), Valonsko nejméně 1,3 m (Guide cyclable); obousměrná Flandry 3 m, Valonsko 2,2–2,6 m") };
    case "cyklopruh":
      return { min: 1.1, zaklad: 1.3, why: t("vyznačený cyklopruh: 1,3 m, nejméně 1,1 m, vedle stání odstup 0,8 m (Valonsko, Guide cyclable)") };
    case "ochranny_pruh":
      return { min: 0.7, zaklad: 1.7, why: t("doporučený cyklopruh: Flandry 1,7–2 m podle šířky vozovky (fietssuggestiestrook, Vademecum fietsvoorzieningen 2024), Valonsko 0,7–0,9 m (Guide cyclable)") };
    case "bus": case "bus_cyklo":
      return { min: 2.75, zaklad: 3.25, why: t("vyhrazený pruh pro autobusy: 3–3,25 m, ve Valonsku se souhlasem dopravce 2,75 m (Flandry, Vademecum fietsvoorzieningen; Valonsko, Guide cyclable)") };
    default:
      return null;
  }
}

// The signs of the state BE (app/public/signs-BE/, README there; AR 1. 12. 1975, annexe 1; Wikimedia Commons, public
// domain). No plates drawn (a sign with one is left out); the disabled's E9 needs a plate (not drawn), a reserved
// space has no sign of its own.
const BE_FILE = { b1: "C3", b11: "C5_C7_C9", b8: "C11", b30: "C19", b28: "E3", b29: "E1", ip11a: "E9", ip14a: "F5", ip15a: "F9", ip20a: "F17",
  zona30: "F4a", ip26a: "F12a", ip27a: "F103", c8a: "D07", c9a: "D10", c10a: "D09", c7a: "D11", cyklozona: "F111" };
const BE_CODE = { ...BE_FILE, b11: "C5 + C7 + C9", c8a: "D7", c10a: "D9", b20a: "C43", ip11a: "E9a" };
const BE_SPEEDS = [30, 50, 70, 90, 100, 110, 120];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // F19 where the lane goes away (a one-way street), C1 where it comes towards the viewer (no entry); with cyclists in
  // contraflow C1 needs the plate M2 (not drawn: left out).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? null : "C1") : "F19";
  if (s.k === "b20a") return BE_SPEEDS.includes(s.v) ? `C43_${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate)) return null;
  return BE_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "C1" : "F19") : BE_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
};

// No drawings of its own (as the Netherlands): the neutral vehicles of generic/, the Czech furniture, the Austrian
// stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "BE",
  bounds: [2.5, 49.49, 6.41, 51.51],
  // AR 1975 art. 25.1, 7°: no parking where the free passage on the roadway would be less than 3 m (in all, not per
  // direction); art. 24, 1°: none on the sidewalk unless a local rule allows it. As in Germany the lanes beside the
  // cars stay drivable.
  freeLane: 3,
  lawNeed: (oneway, lanes, minLane) => Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes)),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Na chodníku se smí stát jen podle místní úpravy (čl. 24 AR 1975), ve vozovce musí zůstat 3 m volného průjezdu (čl. 25.1, 7°); aplikace nechává průjezdné pruhy, tedy aspoň {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  roadClassFromOsm: true,
  limits: limitsBE,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-BE", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "be",
  orthoEstimate: true,
  panorama: false,
  art: { belgium: { ...czechFurniture, ...atPosts } },
  search: ["photon-be"],
  // The regional looks of its old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026).
  houseLook: belgiumLook,
  houseDetails: belgiumDetails,
};
