// Luxembourg (LU; Bára 20. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/luxembourg.js (OSM), the ACT's orthophoto lanes-ortho.js "lu". Sources, norms and signs:
// evaluation/luxembourg/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/luxembourg/NORMY.md): the ministry's guidelines on calming (Apaisement 2023) and the Commission de
// circulation's opinion on cycling of 2001 (the guidelines of 2018 not found); Luxembourg gives the roadway's width,
// not a lane's: no warning for a lane, a tram belt or parking.
function limitsLU(s) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.5, zaklad: 2, why: t("chodník: nejméně 1,5 m, doporučeno 2 m (Lignes directrices Apaisement 2023, fiche A 05)") };
    case "cyklopruh":
      return { min: 1.5, zaklad: 1.5, why: t("cyklopruh (voie cyclable): 1,5 m, vedle stání navíc 0,5–1 m (stanovisko Commission de circulation 2001)") };
    case "ochranny_pruh":
      return { min: 1.25, zaklad: 1.5, why: t("doporučený cyklopruh (voie suggestive): 1,25–1,5 m (stanovisko Commission de circulation 2001)") };
    case "cyklostezka":
      return { min: 1.2, zaklad: 1.5, why: t("stezka pro cyklisty jednosměrná: vedle vozovky 1,2 m a ochranná zóna 0,65 m, v samostatné trase 1,5 m a krajnice; obousměrná 2–2,5 m (stanovisko Commission de circulation 2001)") };
    case "bus": case "bus_cyklo":
      return { min: 3, zaklad: 3.5, why: t("vyhrazený pruh pro autobusy: 3–3,5 m (stanovisko Commission de circulation 2001)") };
    default:
      return null;
  }
}

// The signs of the state LU (pilot/public/signs-LU/, README there; Code de la route, arrêté grand-ducal of
// 23. 11. 1955; Wikimedia Commons, public domain and CC BY-SA 4.0 by GilPe). Speed signs exist only for 50 and 70.
const LU_FILE = { b1: "C_2", b11: "C_3a", b8: "C_3c", b30: "C_3g", b28: "C_19", b29: "C_18", ip11a: "E_23", ip14a: "E_15", ip15a: "E_17",
  ip20a: "D_10", zona30: "H_1_1", ip26a: "E_25a", ip27a: "E_27a", c8a: "D_4", c9a: "D_5b", c10a: "D_5a", c7a: "D_5" };
const LU_SPEEDS = [50, 70];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // E,13a where the lane goes away, C,1a (no entry) where it comes towards the viewer; with a plate for cyclists left out.
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? null : "C_1a") : "E_13a";
  if (s.k === "b20a") return LU_SPEEDS.includes(s.v) ? `C_14_${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme"].includes(s.plate)) return null;
  return LU_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const f = x.k === "oneway" ? (x.dir === "backward" ? "C_1a" : "E_13a") : x.k === "b20a" ? "C_14" : LU_FILE[x.k];
  return f ? `${f.replace("_", ",").replace(/_(\d)$/, "")} ${label.replace(CZ_CODE, "")}` : label;
};

const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "LU",
  bounds: [5.73, 49.44, 6.53, 50.19],
  // AGD 23. 11. 1955 art. 166 d: no parking on the sidewalk unless signed; a free width of 3 m only beside a solid line
  // or a reserved part (art. 166 r), no general one: as elsewhere, the lanes beside the cars stay drivable, 3 m at least.
  freeLane: 3,
  lawNeed: (oneway, lanes, minLane) => Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes)),
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Na chodníku se smí stát jen se značkou (čl. 166 d Code de la route), obecnou volnou šířku zákon neuvádí (3 m jen u plné čáry, čl. 166 r); aplikace nechává průjezdné pruhy, tedy aspoň {need}.", { free, need }),
  // No parking estimated by the law: it has no general free width (NORMY.md advises against it; the hostile review), to
  // be decided by Bára as for Austria and Germany.
  parkGuess: false,
  parkByCycleLane: true,
  wideRoads: true,
  roadClassFromOsm: true,
  limits: limitsLU,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-LU", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "lu",
  orthoEstimate: true,
  besidePassport: false,
  panorama: false,
  art: { luxembourg: { ...czechFurniture, ...atPosts } },
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-be"],
};
