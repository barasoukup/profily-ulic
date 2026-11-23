// Portugal (PT; Bára 23. 11. 2026): what differs from the Czech rules of countries/default.js. Its sources are
// towns/portugal.js (the estimate only: no city publishes its street surfaces online), DGT's orthophotos lanes-ortho.js
// "pt". Sources, norms and signs: evaluation/portugal/ (ZDROJE.md, NORMY.md).
import { t } from "../i18n.js";
import { czechFurniture, TOWN_ART } from "../art.js";
import base, { CZ_CODE } from "./default.js";

// Norms (evaluation/portugal/NORMY.md D): binding only accessibility (Decreto-Lei 163/2006: the free width of a sidewalk
// of the main and collector streets 1.5 m, of every pedestrian route 1.2 m; Bára 23. 11. 2026: 1.5 m everywhere); the rest IMT's technical documents and
// Lisbon's guide (recommendations; the cycle tracks by IMT, Bára 23. 11. 2026). No warning for a tram belt (no source found).
const lanes = (segs) => segs.filter((x) => x.type === "pruh" || x.type === "pruh_piktokoridor");
function limitsPT(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola":
      return { min: 1.5, zaklad: 1.8, why: t("chodník: volná šířka nejméně 1,5 m u hlavních a sběrných ulic, 1,2 m u každé pěší trasy (zákon o přístupnosti 163/2006); doporučeno 1,8 m (IMT, Lisabon)") };
    // Beside parallel parking IMT's 2.2 m at least, 2.5 m recommended, 1 m of it a buffer (NORMY.md A2; the review of
    // 23. 11. 2026: the text said 2.5 m of Lisbon, which gives only a buffer of 0.7 m, and the code did not look).
    case "cyklopruh":
      if (parking && (parking.orient || "podelne") === "podelne")
        return { min: 2.2, zaklad: 2.5, why: t("cyklopruh vedle podélného stání: nejméně 2,2 m, doporučeno 2,5 m, z toho 1 m ochranný pás (IMT)") };
      return { min: 1.2, zaklad: 1.5, why: t("cyklopruh: 1,5 m, nejméně 1,2 m (IMT)") };
    case "cyklostezka":
      return { min: 1.75, zaklad: 2, why: t("stezka pro cyklisty jednosměrná: 2 m, nejméně 1,75 m; obousměrná 3 m, při malém provozu 2,4 m (IMT a LNEC 2024)") };
    // IMT's 3 m is France's figure it cites (CEREMA 2016, second hand: NORMY.md A3); Lisbon's 3.25 m at the kerb.
    case "bus":
      // Orange only (Bára 23. 11. 2026): the 3 m minimum is CEREMA's, second hand.
      return { min: 0, zaklad: 3.25, why: t("vyhrazený pruh BUS: 3,25 m (příručka Lisabonu); nejméně 3 m podle IMT, který cituje francouzskou CEREMA") };
    // The minimum is Lisbon's; IMT recommends 3.25 m and calls the shared lane not advisable (NORMY.md A2).
    case "bus_cyklo":
      return { min: 3.25, zaklad: 3.25, why: t("společný pruh pro autobusy a cyklisty: nejméně 3,25 m (příručka Lisabonu); IMT doporučuje 3,25 m a společný pruh nedoporučuje") };
    case "pruh": case "pruh_piktokoridor": {
      if (s.turn) return null;
      const L = lanes(segs), oneway = L.length > 0 && L.every((x) => (x.dir ?? "forward") === (L[0].dir ?? "forward"));
      return oneway && L.length >= 2
        ? { min: 0, zaklad: 2.75, why: t("jízdní pruh vozovky s více pruhy jedním směrem: 2,75 m (příručka Lisabonu)") }
        : { min: 0, zaklad: 3, why: t("jízdní pruh: 3 m (IMT, příručka Lisabonu)") };
    }
    case "parkovani":
      if (s.orient === "sikme") return { min: 0, zaklad: 4.2, why: t("šikmé stání: pás 4,2 m (příručka Lisabonu)") };
      return s.orient === "kolme" ? { min: 4.5, zaklad: 5, why: t("kolmé stání: pás 5 m, nejméně 4,5 m (IMT, příručka Lisabonu)") }
        : { min: 1.8, zaklad: 2, why: t("podélné stání: pás 2 m, v historickém centru 1,8 m (IMT, příručka Lisabonu)") };
    default:
      return null;
  }
}

// The signs of the state PT (pilot/public/signs-PT/, README there; Regulamento de Sinalização do Trânsito, Decreto
// Regulamentar 22-A/98 as amended by 6/2019; Wikimedia Commons). Part of a regulation, so by our reading not protected
// (art. 8 and 3 of the Código do Direito de Autor speak of texts; NORMY.md C1; as France and Spain, Bára 23. 11. 2026:
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
  // art. 49/1 g) 3 m beside a continuous line: read as the Czech 3 m a direction (evaluation/portugal/NORMY.md B1; for
  // Bára). Parking is estimated as in Luxembourg.
  freeLane: 3,
  halfKerbNote: (free, need) => t("Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je v Portugalsku zakázané (čl. 49 odst. 1 písm. f zákona o silničním provozu), ledaže ho povolí značka; ostatní nesmějí muset vjet do protisměru (čl. 50), aplikace nechává {need}.", { free, need }),
  parkGuess: true,
  parkByCycleLane: true,
  wideRoads: true,
  wideStreets: /^(primary|secondary)$/,
  roadClassFromOsm: true,
  limits: limitsPT,
  contraflow: () => null,
  tramBelt: () => [],
  signs: { dir: "signs-PT", file: signFile, plate: () => null, label: signLabel, drawable: (x, seg) => !!signFile(x, seg) },
  bedOrtho: null,
  laneOrtho: "pt",
  orthoEstimate: true,
  besidePassport: true,
  besideMax: 25,
  panorama: false,
  art: { portugal: { ...czechFurniture, ...atPosts } },
  search: ["photon-pt"],
};
