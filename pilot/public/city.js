// What differs between the cities the app knows: data sources, map, wording, illustrations.
// The city comes from config.js (CITY): the Prague site is the default, the Brno site (/brno/) is the
// same app with CITY = "brno" (written by the deploy workflow and by the local server).
import { CITY } from "./config.js";

// Labels of the MTVU codes, for Brno's surfaces (Prague's MTVU sends its own).
export const MTVU_LABELS = {
  100: "hospodářská půda", 200: "les", 300: "louky, zahrady", 401: "zeleň v zástavbě - veřejná zeleň",
  402: "zeleň v zástavbě - ostatní zeleň", 501: "vodní plochy - řeka, potok", 502: "vodní plochy - rybník, jezírko",
  503: "vodní plochy - vodní dílo, hráz", 601: "zástavba - budovy", 602: "zástavba - ostatní stavby", 603: "zástavba - dvory",
  700: "komunikace", 701: "komunikace - silnice", 702: "komunikace - chodník nebo parková cesta", 703: "komunikace - cyklostezka",
  704: "komunikace - parkoviště", 705: "komunikace - samostatné tramvajové těleso", 901: "rekreační plochy - sportoviště",
  1003: "ostatní plochy - zpevněné plochy kolem zástavby", 1100: "železnice",
};

const CITIES = {
  praha: {
    id: "praha",
    view: [50.0817, 14.4176],
    // Old Town Square: the inner city of tenements versus the outer estates (derive.js centreKm).
    centre: [14.4208, 50.0875],
    inCity: "v Praze",
    adjective: "pražské",
    mapLabel: "Mapa Prahy",
    dataShort: "IPR a OSM",
    techMap: "technickou mapu IPR",
    parkingSource: "úseky parkování TSK",
    rulesHead: "Šířky podle Manuálu tvorby veřejných prostranství IPR (C.2):",
    art: "praha",
    artLabel: "Pražské ilustrace",
    artTitle: "Kreslit pražskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "data © IPR Praha (technická mapa, podlažnosti, vývoj zástavby) a TSK hl. m. Prahy (CC BY 4.0) · © přispěvatelé OpenStreetMap",
    storeSuffix: "",
    example: "50.082707, 14.419918",
  },
  brno: {
    id: "brno",
    view: [49.1951, 16.6085],
    centre: [16.6085, 49.1951], // náměstí Svobody
    inCity: "v Brně",
    adjective: "brněnské",
    mapLabel: "Mapa Brna",
    dataShort: "města Brna a OSM",
    techMap: "technickou mapu Brna",
    parkingSource: "úseky placeného stání (parkovanivbrne.cz)",
    // rules.js holds the widths of IPR's manual (mostly the ČSN values); Brno has no rules of its own in the app yet.
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Brno orientačně:",
    art: "brno",
    artLabel: "Brněnské ilustrace",
    artTitle: "Kreslit brněnskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "brno/45t-inbound.svg",
    credit: "data © Statutární město Brno (technická mapa a MTVU; budovy CC BY 4.0), parkování © parkovanivbrne.cz · © přispěvatelé OpenStreetMap",
    storeSuffix: "-brno",
    // Changes to the profile tried in Brno first (derive.js); Prague keeps its behaviour until they are
    // checked there too. serviceJunctions: a service road joining counts as a junction; axisToRoadway:
    // an OSM axis up to 4.5 m beside the roadway moves onto it; roadUnderAxis: a paved area under a
    // street axis is its roadway (estimate).
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.195100, 16.608500",
  },
};

// globalThis.PROFILY_CITY lets a script (tools/build_og.mjs) draw for the other city.
export const city = CITIES[globalThis.PROFILY_CITY || CITY] || CITIES.praha;
export const isBrno = city.id === "brno";
