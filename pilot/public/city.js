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

// The rest of a town's illustrations (pilot/public/<art>/): its bus and, until it has its own, Prague's
// furniture (copies in the town's folder).
const TOWN_ART = {
  "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
};

const CITIES = {
  praha: {
    id: "praha",
    server: "IPR", // "Server … neodpovídá"
    cover: "Prahu", // "Data pokrývají jen …"
    dataName: "Technická mapa IPR", // "… teď neodpovídá"
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
    server: "města Brna", // "Server … neodpovídá"
    cover: "Brno", // "Data pokrývají jen …"
    dataName: "Technická mapa města Brna", // "… teď neodpovídá"
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
    emptyImg: "brno/t3-inbound.svg",
    credit: "data © Statutární město Brno (technická mapa a MTVU; budovy CC BY 4.0), parkování © parkovanivbrne.cz · © přispěvatelé OpenStreetMap",
    storeSuffix: "-brno",
    // Changes to the profile tried in Brno first (derive.js); Prague keeps its behaviour until they are
    // checked there too. serviceJunctions: a service road joining counts as a junction; axisToRoadway:
    // an OSM axis up to 4.5 m beside the roadway moves onto it; roadUnderAxis: a paved area under a
    // street axis is its roadway (estimate).
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.195100, 16.608500",
  },
  jihlava: {
    id: "jihlava",
    server: "města Jihlavy", // "Server … neodpovídá"
    cover: "Jihlavu", // "Data pokrývají jen …"
    dataName: "Pasport komunikací Jihlavy", // "… teď neodpovídá"
    view: [49.3961, 15.5912],
    centre: [15.5912, 49.3961], // Masarykovo náměstí
    inCity: "v Jihlavě",
    adjective: "jihlavské",
    mapLabel: "Mapa Jihlavy",
    dataShort: "města Jihlavy a OSM",
    techMap: "pasport komunikací Jihlavy",
    parkingSource: "parkovací místa (město Jihlava)",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Jihlavu orientačně:",
    art: "jihlava",
    artLabel: "Jihlavské ilustrace",
    artTitle: "Kreslit jihlavskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "jihlava/trolejbus-inbound.svg",
    credit: "data © Statutární město Jihlava (pasport komunikací, parkování, mobiliář), RÚIAN a katastr © ČÚZK (CC BY 4.0) · © přispěvatelé OpenStreetMap",
    storeSuffix: "-jihlava",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.6,
    // The Brno changes to the profile: Jihlava's surfaces come from a passport of the roads, as Brno's
    // from a technical map, so the same OSM axis fixes apply.
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.396100, 15.591200",
    // Jihlava illustrations (jihlava/): the trolleybus and bus of DPmJ in its cream and red (Bára's photos), the
    // trolleybus with its poles in bus lanes under trolley wires; the furniture as in Prague for now.
    artMap: {
      "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound",
      ...TOWN_ART,
    },
  },
  most: {
    id: "most",
    server: "města Mostu", // "Server … neodpovídá"
    cover: "Most", // "Data pokrývají jen …"
    dataName: "Technická mapa Mostu", // "… teď neodpovídá"
    view: [50.5030, 13.6363],
    centre: [13.6363, 50.5030], // 1. náměstí
    inCity: "v Mostě",
    adjective: "mostecké",
    mapLabel: "Mapa Mostu",
    dataShort: "města Mostu a OSM",
    techMap: "technickou mapu Mostu",
    parkingSource: "parkoviště z technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Most orientačně:",
    art: "most",
    artLabel: "Mostecké ilustrace",
    artTitle: "Kreslit mosteckými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "most/tram-inbound.svg",
    credit: "data © Statutární město Most (objektová a technická mapa, veřejné osvětlení), RÚIAN © ČÚZK (CC BY 4.0) · © přispěvatelé OpenStreetMap",
    storeSuffix: "-most",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0, estateKm: 0.5,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "50.503000, 13.636300",
    artMap: { "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound", ...TOWN_ART },
  },
  opava: {
    id: "opava",
    server: "města Opavy", // "Server … neodpovídá"
    cover: "Opavu", // "Data pokrývají jen …"
    dataName: "Účelová mapa Opavy", // "… teď neodpovídá"
    view: [49.9387, 17.9026],
    centre: [17.9026, 49.9387], // Horní náměstí
    inCity: "v Opavě",
    adjective: "opavské",
    mapLabel: "Mapa Opavy",
    dataShort: "města Opavy a OSM",
    techMap: "technickou mapu Opavy",
    parkingSource: "parkovací stání (město Opava)",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Opavu orientačně:",
    art: "opava",
    artLabel: "Opavské ilustrace",
    artTitle: "Kreslit opavskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "opava/trolejbus-inbound.svg",
    credit: "data © Statutární město Opava (účelová mapa, parkování, stromy, lavičky, zastávky), RÚIAN © ČÚZK (CC BY 4.0) · © přispěvatelé OpenStreetMap",
    storeSuffix: "-opava",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.6,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.938700, 17.902600",
    artMap: { "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound", ...TOWN_ART },
  },
  pardubice: {
    id: "pardubice",
    server: "technické mapy ČÚZK", // "Server … neodpovídá"
    cover: "Pardubice", // "Data pokrývají jen …"
    dataName: "Technická mapa ČÚZK", // "… teď neodpovídá"
    view: [50.0383, 15.7791],
    centre: [15.7791, 50.0383], // Pernštýnské náměstí
    inCity: "v Pardubicích",
    adjective: "pardubické",
    mapLabel: "Mapa Pardubic",
    dataShort: "technické mapy ČÚZK a OSM",
    techMap: "technickou mapu ČÚZK",
    parkingSource: "parkoviště z technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Pardubice orientačně:",
    art: "pardubice",
    artLabel: "Pardubické ilustrace",
    artTitle: "Kreslit pardubickými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "pardubice/trolejbus-inbound.svg",
    credit: "technická mapa © Pardubický kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK (CC BY 4.0) · © přispěvatelé OpenStreetMap",
    storeSuffix: "-pardubice",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.9, estateKm: 2,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "50.038300, 15.779100",
    // No town GIS of its own: the surfaces come from the national DTM of ČÚZK (towns/dmvs.js), any town could.
    artMap: { "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound", ...TOWN_ART },
  },
  plzen: {
    id: "plzen",
    server: "města Plzně", // "Server … neodpovídá"
    cover: "Plzeň", // "Data pokrývají jen …"
    dataName: "Technická mapa Plzně", // "… teď neodpovídá"
    view: [49.7477, 13.3776],
    centre: [13.3776, 49.7477], // náměstí Republiky
    inCity: "v Plzni",
    adjective: "plzeňské",
    mapLabel: "Mapa Plzně",
    dataShort: "města Plzně a OSM",
    techMap: "technickou mapu Plzně",
    parkingSource: "parkoviště z technické mapy a placené zóny (město Plzeň)",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Plzeň orientačně:",
    art: "plzen",
    artLabel: "Plzeňské ilustrace",
    artTitle: "Kreslit plzeňskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "plzen/tram-inbound.svg",
    credit: "data © Statutární město Plzeň (technická mapa, budovy 3D, pasport zeleně a mobiliáře, parkovací zóny), RÚIAN © ČÚZK (CC BY 4.0) · © přispěvatelé OpenStreetMap",
    storeSuffix: "-plzen",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 1.3, estateKm: 3,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.747700, 13.377600",
    // Plzeň illustrations (plzen/): PMDP's yellow tram Škoda 40T, green trolleybus Škoda 26Tr (Solaris body) and red
    // bus SOR NS 12; the furniture as in Prague for now.
    artMap: {
      "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound",
      "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound", ...TOWN_ART,
    },
  },
};

// globalThis.PROFILY_CITY lets a script (tools/build_og.mjs) draw for the other city.
export const city = { ...(CITIES[globalThis.PROFILY_CITY || CITY] || CITIES.praha) };
// globalThis.PROFILY_FIX lets a test (evaluation/run.mjs FIX=1) try the Brno fixes on Prague.
if (globalThis.PROFILY_FIX) city.fix = globalThis.PROFILY_FIX;
export const isBrno = city.id === "brno";
export const isJihlava = city.id === "jihlava";
// Cities whose page asks the city's servers from the browser also on the local server: all but Prague.
export const isLive = city.id !== "praha";
export const CITY_IDS = Object.keys(CITIES);
