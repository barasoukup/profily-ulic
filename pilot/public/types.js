// Segment types of the street profile. Colors follow Streetmix-like ground tones.
// label: the one name of the type, in the palette, the editor and under the drawing (Bára: one name
// everywhere; under a narrow part it shrinks or is left out). raised: on the curb (15 cm above the roadway).
import { city } from "./city.js";

export const TYPES = {
  chodnik: { label: "Chodník", color: "#d6d1c4", raised: true, sprite: "people" },
  chodnik_kola: { label: "Chodník s cyklisty", color: "#d9c9c0", raised: true, sprite: "people", withBike: true },
  stezka_sdilena: { label: "Stezka pro chodce a cyklisty", color: "#d4b8a8", raised: true, sprite: "people", withBike: true },
  predzahradka: { label: "Předzahrádka", color: "#a7c66b", raised: true, sprite: "bush" },
  zelen: { label: "Zeleň", color: "#8fbf55", raised: true, sprite: "bush" },
  stromorad: { label: "Stromořadí", color: "#7fb04a", raised: true, sprite: "tree" },
  nastupiste: { label: "Nástupiště", color: "#e0cfa0", raised: true, sprite: "people" },
  cyklostezka: { label: "Stezka pro cyklisty", color: "#c1786a", raised: true, sprite: "biker", directional: true },
  cyklopruh: { label: "Vyhrazený cyklopruh", color: "#b5574a", sprite: "biker", directional: true },
  ochranny_pruh: { label: "Ochranný cyklopruh", color: "#8a5a50", sprite: "biker", directional: true },
  parkovani: { label: "Parkování", color: "#7b7b78", sprite: "car" },
  pruh: { label: "Jízdní pruh", color: "#5c5c59", sprite: "car", directional: true },
  pruh_piktokoridor: { label: "Piktokoridor", color: "#5c5c59", sprite: "car", directional: true, sharrow: true },
  obsluzna: { label: "Přístupová cesta", color: "#8a8780", sprite: "car" },
  krajnice: { label: "Krajnice", color: "#77756f" },
  bus: { label: "Pruh BUS", color: "#9c4038", sprite: "bus", directional: true },
  bus_cyklo: { label: "Pruh pro BUS a cyklisty", color: "#9c4038", sprite: "bus", directional: true, bike: true },
  tramvaj_v_pruhu: { label: "Tramvaj v pruhu", color: "#736a55", sprite: "streetcar", tracks: true, directional: true },
  tramvaj: { label: "Tramvajový pás", color: "#8c8672", sprite: "streetcar", tracks: true, directional: true },
  delici: { label: "Dělicí pás", color: "#b4b2a9", raised: true },
  plocha: { label: "Zpevněná plocha", color: "#cfccc2", raised: true },
  zahradka: { label: "Zahrádka restaurace", color: "#d9c7a8", raised: true, sprite: "cafe" },
  voda: { label: "Voda", color: "#7fa9cf" },
  zed: { label: "Zeď", color: "#a39e92", raised: true, wall: true },
  nezname: { label: "Neurčeno", color: "#ebe8df", raised: true },
};

export const SOURCES = {
  dtm: { label: "změřeno z technické mapy", color: "#3b6d11" },
  osm: { label: "doplněno z OSM", color: "#854f0b" },
  tsk: { get label() { return city.parkingSource; }, color: "#0f6e56" }, // the current city's
  odhad: { label: "odhad", color: "#8f8b82" },
  user: { label: "upraveno ručně", color: "#534ab7" },
};

// Default widths (m) for newly added segments.
// Items drawn inside a segment (street furniture, barriers, slopes).
export const ITEMS = {
  lampa: "Lampa", lavicka: "Lavička", stojan_kola: "Stojan na kola", sdilena_kola: "Sdílená kola",
  pristresek: "Přístřešek zastávky", rozcestnik: "Rozcestník / mapa", taxi: "Stanoviště taxi",
  sloupek: "Sloupek", kvetinac: "Květináč", svodidlo: "Svodidlo", zabradli: "Zábradlí", plot: "Plot / zeď",
  oporna_zed: "Opěrná zeď", zivy_plot: "Živý plot", svah: "Hrana svahu", zahradka: "Zahrádka restaurace",
};

export const PARKING_USE = { ztp: "ZTP", zasobovani: "zásobování", specialni: "speciální" };

export const DEFAULT_WIDTH = {
  chodnik: 2.5, chodnik_kola: 2.5, stezka_sdilena: 3, predzahradka: 2, zelen: 2, stromorad: 2, nastupiste: 3, cyklostezka: 2.5, cyklopruh: 1.5, ochranny_pruh: 1.25, pruh_piktokoridor: 3.25, parkovani: 2,
  pruh: 3, obsluzna: 3, bus: 3.5, bus_cyklo: 4.25, tramvaj_v_pruhu: 3.25, tramvaj: 3, delici: 1.5, plocha: 2, zahradka: 3, voda: 5, zed: 0.5, nezname: 2, krajnice: 1,
};

// MTVU code (CTVUK_KOD) to segment type.
export function typeFromMtvu(code) {
  if (code === 701 || code === 700) return "pruh";
  if (code === 702) return "chodnik";
  if (code === 703) return "cyklostezka";
  if (code === 704) return "parkovani";
  if (code === 705) return "tramvaj";
  if (code === 300) return "predzahradka";
  if (code >= 500 && code < 600) return "voda";
  if (code >= 400 && code < 500) return "zelen";
  if (code === null || code === undefined) return "nezname";
  return "plocha";
}

// 602 "ostatní stavby" (garages, kiosks, walls) is not a building facade; it ends the profile as a minor structure.
export const isBuilding = (code) => code === 601 || code === 604 || code === 600;
export const isMinorStructure = (code) => code === 602;
