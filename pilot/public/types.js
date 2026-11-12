// Segment types of the street profile. Colors follow Streetmix-like ground tones.
// label: the one name of the type, in the palette, the editor and under the drawing (Bára: one name
// everywhere; under a narrow part it shrinks or is left out). raised: on the curb (15 cm above the roadway).
import { city } from "./city.js";
import { t } from "./i18n.js";

export const TYPES = {
  chodnik: { label: t("Chodník"), color: "#d6d1c4", raised: true, sprite: "people" },
  chodnik_kola: { label: t("Chodník s cyklisty"), color: "#d9c9c0", raised: true, sprite: "people", withBike: true },
  stezka_sdilena: { label: t("Stezka pro chodce a cyklisty"), color: "#d4b8a8", raised: true, sprite: "people", withBike: true },
  predzahradka: { label: t("Předzahrádka"), color: "#a7c66b", raised: true, sprite: "bush" },
  zelen: { label: t("Zeleň"), color: "#8fbf55", raised: true, sprite: "bush" },
  stromorad: { label: t("Stromořadí"), color: "#7fb04a", raised: true, sprite: "tree" },
  nastupiste: { label: t("Nástupiště"), color: "#e0cfa0", raised: true, sprite: "people" },
  cyklostezka: { label: t("Stezka pro cyklisty"), color: "#c1786a", raised: true, sprite: "biker", directional: true },
  cyklopruh: { label: t("Vyhrazený cyklopruh"), color: "#b5574a", sprite: "biker", directional: true },
  ochranny_pruh: { label: t("Ochranný cyklopruh"), color: "#8a5a50", sprite: "biker", directional: true },
  parkovani: { label: t("Parkování"), color: "#7b7b78", sprite: "car" },
  pruh: { label: t("Jízdní pruh"), color: "#5c5c59", sprite: "car", directional: true },
  pruh_piktokoridor: { label: t("Piktokoridor"), color: "#5c5c59", sprite: "car", directional: true, sharrow: true },
  obsluzna: { label: t("Přístupová cesta"), color: "#8a8780", sprite: "car" },
  krajnice: { label: t("Krajnice"), color: "#77756f" },
  bus: { label: t("Pruh BUS"), color: "#9c4038", sprite: "bus", directional: true },
  bus_cyklo: { label: t("Pruh pro BUS a cyklisty"), color: "#9c4038", sprite: "bus", directional: true, bike: true },
  // Three kinds of tram (Bára): in a lane shared with cars; a reserved tram lane in the roadway, level with it
  // and marked off; a separate tram bed, raised behind curbs, of panels, gravel or grass (TRAM_BEDS).
  tramvaj_v_pruhu: { label: t("Tramvaj v pruhu"), color: "#736a55", sprite: "streetcar", tracks: true, directional: true },
  tramvaj_pruh: { label: t("Tramvajový pruh"), color: "#6f6a5e", sprite: "streetcar", tracks: true, directional: true, marked: true },
  tramvaj: { label: t("Tramvajové těleso"), color: "#a39d8c", sprite: "streetcar", tracks: true, directional: true, raised: true, bed: true },
  delici: { label: t("Dělicí pás"), color: "#b4b2a9", raised: true },
  plocha: { label: t("Zpevněná plocha"), color: "#cfccc2", raised: true },
  zahradka: { label: t("Zahrádka restaurace"), color: "#d9c7a8", raised: true, sprite: "cafe" },
  // Rainwater management (Bára 12. 11. 2026, after Magdalena; Standardy hospodaření se srážkovými vodami na území
  // hl. m. Prahy, MHMP, ČVUT FSv, chap. 5.1): the surface objects as parts of their own, hdv: the standard's chapter.
  // Only in a design: the data do not tell them. What lies under a part is its "under" (HDV_UNDER).
  pruleh: { label: t("Vsakovací průleh"), color: "#86b46a", raised: true, hdv: "5.1.5", water: true },
  ryha: { label: t("Vsakovací rýha"), color: "#b8b1a2", raised: true, hdv: "5.1.6", water: true },
  nadrz: { label: t("Retenční nádrž"), color: "#7fa9cf", raised: true, hdv: "5.1.10", water: true },
  voda: { label: t("Voda"), color: "#7fa9cf" },
  zed: { label: t("Zeď"), color: "#a39e92", raised: true, wall: true },
  nezname: { label: t("Neurčeno"), color: "#ebe8df", raised: true },
};

// Rainwater objects under a part (segment.under; the standard's chapter): under green, a sidewalk, parking…
export const HDV_UNDER = {
  ryha: { label: t("podzemní rýha"), hdv: "5.1.7" },
  nadrz: { label: t("podzemní retenční nádrž"), hdv: "5.1.11" },
  sachta: { label: t("vsakovací šachta"), hdv: "5.1.9" },
};
// The parts that may have one; with a průleh above, a rýha under it is the standard's "průleh s podzemní rýhou" (5.1.8).
export const UNDER_TYPES = ["zelen", "stromorad", "predzahradka", "delici", "pruleh", "chodnik", "chodnik_kola", "stezka_sdilena", "plocha", "parkovani", "nastupiste", "zahradka"];
// The paved parts that may be permeable (segment.permeable: joints, porous paving; 5.1.2).
export const PERMEABLE_TYPES = ["chodnik", "chodnik_kola", "stezka_sdilena", "plocha", "parkovani", "zahradka", "cyklostezka"];
// The Prague standard of rainwater management, cited by its chapters.
export const HDV_SOURCE = "https://iprpraha.cz/assets/files/files/bddf4f520d27099cbc0f7a3609918e90.pdf";

export const SOURCES = {
  dtm: { label: t("změřeno z technické mapy"), color: "#3b6d11" },
  osm: { label: t("doplněno z OSM"), color: "#854f0b" },
  data: { label: t("otevřená data města"), color: "#2f6f8f" }, // Prague: trees of TSK, MHMP and the districts
  tsk: { get label() { return city.parkingSource; }, color: "#0f6e56" }, // the current city's
  odhad: { label: t("odhad"), color: "#8f8b82" },
  ortofoto: { label: t("podle čar na ortofotu"), color: "#c07a12" }, // lanes-ortho.js
  user: { label: t("upraveno ručně"), color: "#534ab7" },
};

// Default widths (m) for newly added segments.
// Items drawn inside a segment (street furniture, barriers, slopes).
export const ITEMS = {
  strom: t("Strom"), lampa: t("Lampa"), lavicka: t("Lavička"), stojan_kola: t("Stojan na kola"), sdilena_kola: t("Sdílená kola"),
  pristresek: t("Přístřešek zastávky"), rozcestnik: t("Rozcestník / mapa"), taxi: t("Stanoviště taxi"),
  sloupek: t("Sloupek"), sloup_trakce: t("Sloup trakčního vedení"), oznacnik: t("Označník zastávky"), kvetinac: t("Květináč"), svodidlo: t("Svodidlo"), zabradli: t("Zábradlí"), plot: t("Plot / zeď"),
  pristresek_zeleny: t("Přístřešek zastávky se zelenou střechou"),
  oporna_zed: t("Opěrná zeď"), zivy_plot: t("Živý plot"), svah: t("Hrana svahu"), zahradka: t("Zahrádka restaurace"),
};

// Surfaces of a separate tram bed (segment.bed); the default is panels. Asphalt (beds used by buses) is drawn
// like the roadway.
export const TRAM_BEDS = { panely: { label: t("panely"), color: "#b3ada0" }, strk: { label: t("štěrk"), color: "#9a948a" }, trava: { label: t("tráva"), color: "#86b552" }, asfalt: { label: t("asfalt"), color: "#5c5c59" } };

// Turn arrows on a lane (segment.turn; OSM turn:lanes values joined by ";"): the words and their names, and the
// combinations Návrh offers (a lane from the data may carry any other combination of the words).
export const TURNS = { left: t("vlevo"), slight_left: t("mírně vlevo"), sharp_left: t("ostře vlevo"), through: t("rovně"), right: t("vpravo"),
  slight_right: t("mírně vpravo"), sharp_right: t("ostře vpravo"), reverse: t("otočení"), merge_to_left: t("připojení"), merge_to_right: t("připojení") };
export const TURN_CHOICES = ["left", "left;through", "through", "through;right", "right", "left;right", "left;through;right"];
export const isTurn = (v) => typeof v === "string" && v.split(";").every((x) => x in TURNS);

export const PARKING_USE = { ztp: t("ZTP"), zasobovani: t("zásobování"), specialni: t("speciální") };
// Where parked cars stand besides the roadway (segment.position; OSM parking:<side>=on_kerb|half_on_kerb): fully on
// the sidewalk, or across the kerb, half on the sidewalk. Without it, in the roadway.
export const PARKING_POSITION = { on_kerb: t("na chodníku"), half_on_kerb: t("napůl na chodníku") };

export const DEFAULT_WIDTH = {
  chodnik: 2.5, chodnik_kola: 2.5, stezka_sdilena: 3, predzahradka: 2, zelen: 2, stromorad: 2, nastupiste: 3, cyklostezka: 2.5, cyklopruh: 1.5, ochranny_pruh: 1.5, pruh_piktokoridor: 3.25, parkovani: 2,
  pruleh: 2, ryha: 1, nadrz: 4, pruh: 3, obsluzna: 3, bus: 3.5, bus_cyklo: 4.25, tramvaj_v_pruhu: 3.25, tramvaj_pruh: 3.5, tramvaj: 3.5, delici: 1.5, plocha: 2, zahradka: 3, voda: 5, zed: 0.5, nezname: 2, krajnice: 1,
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
