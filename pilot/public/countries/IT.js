// Italy (IT; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Only where an orthophoto has
// an open licence (staty.json "italy"). Its sources are towns/italy.js (Bologna's road areas and buildings), the open
// orthophotos lanes-ortho.js "it". Sources, norms and signs: evaluation/italy/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/italy/NORMY.md): the accessibility route 0.9 m binding (D.M. 236/1989 8.2.1 through D.P.R. 503/1996);
// the rest D.M. 5. 11. 2001 (binding for new roads) and D.M. 557/1999 for cycling. No warning for a bus lane with bikes or
// a tram belt (no source found).
function limitsIT(s) {
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 0.9, zaklad: 1.5, why: t("chodník: přístupná trasa nejméně 0,9 m (vyhláška 236/1989, bod 8.2.1), nová ulice 1,5 m (vyhláška o silnicích z 5. 11. 2001, bod 3.4.6)") };
    case "cyklopruh": case "cyklostezka":
      return { min: 1, zaklad: 1.5, why: t("cyklopruh a stezka pro cyklisty jednosměrné: 1,5 m, na krátkém úseku nejméně 1 m; obousměrná stezka 2,5 m (vyhláška 557/1999, čl. 7)") };
    case "bus":
      return { min: 3.5, zaklad: 3.5, why: t("vyhrazený pruh BUS: 3,5 m (vyhláška o silnicích z 5. 11. 2001, bod 3.4.2)") };
    case "pruh": case "pruh_piktokoridor": {
      if (s.turn) return null;
      return { min: 0, zaklad: 2.75, why: t("jízdní pruh městské ulice: 2,75–3 m (vyhláška o silnicích z 5. 11. 2001, tab. 3.4.a)") };
    }
    case "parkovani":
      if (s.orient === "sikme") return { min: 0, zaklad: 4.8, why: t("šikmé stání (45°): pás 4,8 m (vyhláška o silnicích z 5. 11. 2001, bod 3.4.7)") };
      return s.orient === "kolme" ? { min: 0, zaklad: 5, why: t("kolmé stání: pás 5 m (vyhláška o silnicích z 5. 11. 2001, bod 3.4.7)") }
        : { min: 1.8, zaklad: 2, why: t("podélné stání: pás 2 m, nejméně 1,8 m (vyhláška o silnicích z 5. 11. 2001, bod 3.4.7)") };
    default:
      return null;
  }
}

// The signs of the state IT (pilot/public/signs-IT/, README there; the Regolamento of the Codice della strada, D.P.R.
// 495/1992, figures II.x; Wikimedia Commons). Texts of official acts are not protected (art. 5 of L. 633/1941), the
// figures read as part of them (NORMY.md C). Italy has no sign of a shared zone, a cycle street or a cycle zone.
const IT_FILE = { b1: "II-46", b11: "II-58", b8: "II-55", b30: "II-54", b28: "II-75", b29: "II-74", ip11a: "II-76", ztp: "II-79a-invalidi", ip14a: "II-345-autostrada",
  ip15a: "II-314", ip20a: "uso-corsie-bus", zona30: "II-323a-30", ip26a: "II-318", ip27a: "II-320", c8a: "II-90", c9a: "II-92b", c10a: "II-92a", c7a: "II-88" };
const IT_CODE = { ...Object.fromEntries(Object.entries(IT_FILE).map(([k, v]) => [k, v.replace(/^II-(\d+)([a-z]?).*$/, (m, n, l) => `II.${n}${l ? `/${l}` : ""}`)])), ip20a: null };
// 90–130 still to be downloaded from Commons (its upload server limits the rate): until then no sign for them.
const IT_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80];
function signFile(s, seg) {
  const dir = s.dir ?? seg?.dir;
  // II.349 where the lane goes away (a one-way street), II.47 where it comes towards the viewer (no entry); with cyclists
  // in contraflow II.47 with the plate II.4/b and a bicycle (drawn in the file).
  if (s.k === "oneway") return dir === "backward" ? (s.plate === "protismer" ? "II-47-plus-II-4b" : "II-47") : "II-349";
  if (s.k === "b20a") return IT_SPEEDS.includes(s.v) ? `II-50-${s.v}` : null;
  if (s.plate && !["podelne", "kolme", "sikme", "protismer"].includes(s.plate)) return null;
  return IT_FILE[s.k] || null;
}
const signLabel = (x, own, label) => {
  const code = x.k === "oneway" ? (x.dir === "backward" ? "II.47" : "II.349") : x.k === "b20a" ? "II.50" : IT_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label.replace(CZ_CODE, "");
};

// No drawings of its own: the neutral vehicles of generic/, the Czech furniture, the Austrian stop posts.
const atPosts = Object.fromEntries(["stop-post-left", "stop-post-right", "stop-post-tram-left", "stop-post-tram-right"].map((k) => [k, `../austria/${TOWN_ART[k]}`]));

export default {
  ...base,
  code: "IT",
  bounds: [6.6, 35.4, 18.6, 47.1],
  // Codice della strada art. 157 c. 4: 3 m free beside a car parked on the left of a one-way street; no general figure for a
  // two-way street: 3 m a direction as elsewhere (NORMY.md B; for Bára). Parking on the sidewalk banned (art. 158 c. 1 h)
  // but where signs allow it.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je v Itálii zakázané (čl. 158 zákona o silničním provozu), ledaže ho povolí značka; aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsIT,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-IT", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "it",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { italy: { ...czechFurniture, ...atPosts } },
  // No panel houses as the Czech ones (as France): a flat-roofed slab is the plain flat-roofed house, after 1990 the modern one.
  houseLook: (style, info, office) => (style === "plocha" ? (office ? "kancelar" : (info?.start || info?.built) > 1990 ? "moderni" : "funkce") : style),
  search: ["photon-it"],
};
