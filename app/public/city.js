// What differs between the cities the app knows: data sources, map, wording, illustrations. One page for
// the whole Czech Republic (Bára 10. 11. 2026): a cut takes the city it lies in (cityAt, by the boundaries
// of towns.json), anywhere else "cesko" (the national DTM of ČÚZK, RÚIAN and OSM). `city` is the city of
// the current cut, changed in place by setCity, so modules read it at the time they need it.
// The city's texts (server, dataName, dataShort, techMap, parkingSource, rulesHead, credit) are not here but in the
// languages' files, city.<id>.<field> (locales/cs.json the Czech; i18n.js cityTexts): a town without its own takes its
// state's (like). Here only what is no text: dataName and techMap null (no map to name), credit "" (nothing to credit).

import { sourceCredits } from "./credits.js";
import { TOWN_ART, TRAM, TROLLEY } from "./art.js";
import { boxed, within, loadSkTowns, inSkTown } from "./places.js";
import { countryOf, COUNTRIES } from "./countries/index.js";
import { isLate } from "./late.js";
export { loadSkTowns, inSkTown };
import { t } from "./i18n.js";
import { cityTexts, CLOSED_TEXT } from "./data.js";
import { dmvsCredit, ruianCredit } from "./credit-text.js";

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
  // Anywhere outside the cities above: the national DTM of ČÚZK (dmvs.js), RÚIAN houses, OSM.
  cesko: {
    id: "cesko",
    cover: "Českou republiku",
    view: [49.8, 15.5],
    centre: null, // no inner town known: houses by RÚIAN and their block
    inCity: "v Česku",
    adjective: "české",
    mapLabel: "Mapa",
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    innerKm: 0, estateKm: 0.5,
    example: "49.907481, 16.442219",
    // Prague's furniture (copies in cesko/); the neutral tram and bus (generic/, profile.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  praha: {
    id: "praha",
    cover: "Prahu", // "Data pokrývají jen …"
    view: [50.0817, 14.4176],
    // Old Town Square: the inner city of tenements versus the outer estates (derive.js centreKm).
    centre: [14.4208, 50.0875],
    coreKm: 0.6, // the old town around the square (burgher houses, profile.js oldCore)
    inCity: "v Praze",
    adjective: "pražské",
    mapLabel: "Mapa Prahy",
    art: "praha",
    artLabel: "Pražské ilustrace",
    artTitle: "Kreslit pražskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // What only Prague's data have. roadOnPath: a paved path of the map under a street's axis is its roadway
    // (derive.js); slowServer: IPR's server is often overloaded (no timeout, the outage says so); paidZoneFile: the
    // boxes of the paid zones (data/zps.json, sources.js zps, maplayers.js); builtAgeTiles: IPR's "Vývoj zástavby"
    // (data/built-up-age, sources.js vyvoj); iprHouseKind: IPR's kind of building 6 is a family house (profile.js);
    // ruianYear: the year, walls and use of a house from RÚIAN (app.js), as IPR gives none.
    roadOnPath: true, slowServer: true, paidZoneFile: true, builtAgeTiles: true, iprHouseKind: true, ruianYear: true,
    // Its own orthophoto for the lanes (lanes-ortho.js), in place of the state's.
    laneOrtho: "ipr",
    example: "50.082707, 14.419918",
  },
  brno: {
    id: "brno",
    cover: "Brno", // "Data pokrývají jen …"
    view: [49.1951, 16.6085],
    centre: [16.6085, 49.1951], // náměstí Svobody
    inCity: "v Brně",
    adjective: "brněnské",
    mapLabel: "Mapa Brna",
    // rules.js holds the widths of IPR's manual (mostly the ČSN values); Brno has no rules of its own in the app yet.
    art: "brno",
    artLabel: "Brněnské ilustrace",
    artTitle: "Kreslit brněnskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "brno/t3-inbound.svg",
    // KAM gives floors and roofs but not the year of a house: RÚIAN's (app.js). Its own orthophoto for the lanes.
    ruianYear: true, laneOrtho: "brno",
    example: "49.195100, 16.608500",
  },
  jihlava: {
    id: "jihlava",
    cover: "Jihlavu", // "Data pokrývají jen …"
    view: [49.3961, 15.5912],
    centre: [15.5912, 49.3961], // Masarykovo náměstí
    inCity: "v Jihlavě",
    adjective: "jihlavské",
    mapLabel: "Mapa Jihlavy",
    art: "jihlava",
    artLabel: "Jihlavské ilustrace",
    artTitle: "Kreslit jihlavskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "jihlava/trolleybus-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.6,
    example: "49.396100, 15.591200",
    // Jihlava illustrations (jihlava/): the trolleybus and bus of DPmJ in its cream and red (Bára's photos), the
    // trolleybus with its poles in bus lanes under trolley wires; the furniture as in Prague for now.
    artMap: {
      "trolleybus-inbound": "trolleybus-inbound", "trolleybus-outbound": "trolleybus-outbound",
      ...TOWN_ART,
    },
  },
  most: {
    id: "most",
    cover: "Most", // "Data pokrývají jen …"
    view: [50.5030, 13.6363],
    centre: [13.6363, 50.5030], // 1. náměstí
    inCity: "v Mostě",
    adjective: "mostecké",
    mapLabel: "Mapa Mostu",
    art: "most",
    artLabel: "Mostecké ilustrace",
    artTitle: "Kreslit mosteckými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "most/tram-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0, estateKm: 0.5,
    example: "50.503000, 13.636300",
    artMap: { "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound", ...TOWN_ART },
  },
  opava: {
    id: "opava",
    cover: "Opavu", // "Data pokrývají jen …"
    view: [49.9387, 17.9026],
    centre: [17.9026, 49.9387], // Horní náměstí
    inCity: "v Opavě",
    adjective: "opavské",
    mapLabel: "Mapa Opavy",
    art: "opava",
    artLabel: "Opavské ilustrace",
    artTitle: "Kreslit opavskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "opava/trolleybus-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.6,
    example: "49.938700, 17.902600",
    artMap: { "trolleybus-inbound": "trolleybus-inbound", "trolleybus-outbound": "trolleybus-outbound", ...TOWN_ART },
  },
  pardubice: {
    id: "pardubice",
    cover: "Pardubice", // "Data pokrývají jen …"
    view: [50.0383, 15.7791],
    centre: [15.7791, 50.0383], // Pernštýnské náměstí
    inCity: "v Pardubicích",
    adjective: "pardubické",
    mapLabel: "Mapa Pardubic",
    art: "pardubice",
    artLabel: "Pardubické ilustrace",
    artTitle: "Kreslit pardubickými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "pardubice/trolleybus-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.9, estateKm: 2,
    example: "50.038300, 15.779100",
    // No town GIS of its own: the surfaces come from the national DTM of ČÚZK (towns/dmvs.js), any town could.
    artMap: { "trolleybus-inbound": "trolleybus-inbound", "trolleybus-outbound": "trolleybus-outbound", ...TOWN_ART },
  },
  plzen: {
    id: "plzen",
    cover: "Plzeň", // "Data pokrývají jen …"
    view: [49.7477, 13.3776],
    centre: [13.3776, 49.7477], // náměstí Republiky
    inCity: "v Plzni",
    adjective: "plzeňské",
    mapLabel: "Mapa Plzně",
    art: "plzen",
    artLabel: "Plzeňské ilustrace",
    artTitle: "Kreslit plzeňskými ilustracemi (vypnuto: ilustrace Streetmixu)",
    emptyImg: "plzen/tram-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 1.3, estateKm: 3,
    bedPanels: true, // a tram bed without data is of panels (derive.js; Plzeň's data, A/B)
    laneOrtho: "plzen", // its own orthophoto for the lanes (lanes-ortho.js)
    example: "49.747700, 13.377600",
    // Plzeň illustrations (plzen/): PMDP's yellow tram Škoda 40T, green trolleybus Škoda 26Tr (Solaris body) and red
    // bus SOR NS 12; the furniture as in Prague for now.
    artMap: {
      "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound",
      "trolleybus-inbound": "trolleybus-inbound", "trolleybus-outbound": "trolleybus-outbound", ...TOWN_ART,
    },
  },
  usti: {
    id: "usti",
    cover: "Ústí nad Labem", // "Data pokrývají jen …"
    view: [50.6607, 14.0322],
    centre: [14.0322, 50.6607], // Mírové náměstí
    inCity: "v Ústí nad Labem",
    adjective: "ústecké",
    mapLabel: "Mapa Ústí",
    // Its own vehicles (drawn after photos of Wikimedia Commons), Prague's furniture (copies in its folder).
    art: "usti",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.5,
    example: "50.660700, 14.032200",
    // The surfaces are the national DTM (towns/usti.js), only the parking is the town's.
    artMap: { ...TROLLEY, ...TOWN_ART },
  },
  ostrava: {
    id: "ostrava",
    cover: "Ostravu", // "Data pokrývají jen …"
    view: [49.8355, 18.2924],
    centre: [18.2924, 49.8355], // Masarykovo náměstí
    inCity: "v Ostravě",
    adjective: "ostravské",
    mapLabel: "Mapa Ostravy",
    // Its own vehicles (drawn after photos of Wikimedia Commons), Prague's furniture (copies in its folder).
    art: "ostrava",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 1.0, estateKm: 2.0,
    example: "49.835500, 18.292400",
    // The surfaces are the city's generalized technical map (towns/ostrava.js, data to 2019).
    artMap: { ...TRAM, ...TROLLEY, ...TOWN_ART },
  },
  "frydek-mistek": {
    id: "frydek-mistek",
    cover: "Frýdek-Místek", // "Data pokrývají jen …"
    view: [49.6837, 18.3504],
    centre: [18.3504, 49.6837], // náměstí Svobody (Místek)
    inCity: "ve Frýdku-Místku",
    adjective: "frýdecko-místecké",
    mapLabel: "Mapa Frýdku-Místku",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, the neutral vehicles of generic/).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.6, estateKm: 1.2,
    example: "49.683700, 18.350400",
    // The town's road passport over the national DTM (towns/frydek-mistek.js, towns/overlay.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  karvina: {
    id: "karvina",
    cover: "Karvinou", // "Data pokrývají jen …"
    view: [49.8542, 18.542],
    centre: [18.542, 49.8542], // Masarykovo náměstí (Fryštát)
    inCity: "v Karviné",
    adjective: "karvinské",
    mapLabel: "Mapa Karviné",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, the neutral vehicles of generic/).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.5, estateKm: 1.0,
    example: "49.854200, 18.542000",
    // The town's road passport (part of the town) over the national DTM (towns/karvina.js, towns/overlay.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  trebic: {
    id: "trebic",
    cover: "Třebíč", // "Data pokrývají jen …"
    view: [49.215, 15.8799],
    centre: [15.8799, 49.215], // Karlovo náměstí
    inCity: "v Třebíči",
    adjective: "třebíčské",
    mapLabel: "Mapa Třebíče",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, the neutral vehicles of generic/).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.6, estateKm: 1.2,
    example: "49.215000, 15.879900",
    // The town's road passport over the national DTM (towns/trebic.js, towns/overlay.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  prerov: {
    id: "prerov",
    cover: "Přerov", // "Data pokrývají jen …"
    view: [49.4555, 17.451],
    centre: [17.451, 49.4555], // náměstí T. G. Masaryka
    inCity: "v Přerově",
    adjective: "přerovské",
    mapLabel: "Mapa Přerova",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, the neutral vehicles of generic/).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.5,
    example: "49.455500, 17.451000",
    // The surfaces are the city's technical map read from its vector tiles (towns/prerov.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
};

// Outside the Czech Republic (Bára 15. 11. 2026): Slovakia, whose OSM tiles the app has, and anywhere else
// ("cizina": the margins of the OSM extracts beyond the borders). No technical map, no RÚIAN: the profile is the
// estimate from OSM and the orthophoto (ortho-osm.js), the houses are OSM's (towns/slovakia.js). dataName null: no
// map to fail. Prague's furniture and the neutral vehicles of generic/, as in "cesko".
const abroad = (id, country, cover, inCity, adjective, view, example) => ({
  ...CITIES.cesko, id, like: "cesko", abroad: true, country, cover, inCity, adjective, view, example,
  dataName: null, techMap: null,
  credit: "",
  centre: null, innerKm: 0, estateKm: 0.5,
});
Object.assign(CITIES, {
  // The houses of ZBGIS (towns/slovakia.js); the orthophoto is credited where it was read (creditLines).
  slovensko: abroad("slovensko", "SK", "Slovensko", "na Slovensku", "slovenské", [48.7, 19.7], "48.146736, 17.106998"),
  // Austria (Bára 16. 11. 2026): basemap.at's orthophoto and OSM (towns/austria.js).
  austria: abroad("austria", "AT", "Rakousko", "v Rakousku", "rakouské", [47.6, 14.1], "48.209900, 16.374800"),
  // Germany (Bára 17. 11. 2026): the orthophotos of the Länder and OSM, the street surfaces of Berlin, Hamburg and
  // Aachen (towns/germany.js).
  germany: abroad("germany", "DE", "Německo", "v Německu", "německé", [51.1, 10.4], "52.516300, 13.377700"),
  // Switzerland and Liechtenstein (Bára 17. 11. 2026): swisstopo's SWISSIMAGE and OSM, the official cadastral survey's
  // land cover (Amtliche Vermessung, geodienste.ch) where it has the street (towns/switzerland.js).
  switzerland: abroad("switzerland", "CH", "Švýcarsko", "ve Švýcarsku", "švýcarské", [46.8, 8.2], "47.372500, 8.539000"),
  liechtenstein: abroad("liechtenstein", "LI", "Lichtenštejnsko", "v Lichtenštejnsku", "lichtenštejnské", [47.14, 9.55], "47.141000, 9.521500"),
  // The Netherlands (Bára 20. 11. 2026): PDOK's orthophoto and OSM, the national large-scale topography (BGT) where it
  // has the street, the buildings of the BAG and 3D BAG (towns/netherlands.js).
  netherlands: abroad("netherlands", "NL", "Nizozemsko", "v Nizozemsku", "nizozemské", [52.2, 5.3], "52.372700, 4.893300"),
  // Belgium and Luxembourg (Bára 20. 11. 2026): the regions' orthophotos and OSM, in Flanders and Wallonia with the lines
  // of their large-scale maps for the kerbs (towns/belgium.js); Luxembourg the ACT's orthophoto and OSM.
  belgium: abroad("belgium", "BE", "Belgie", "v Belgii", "belgické", [50.6, 4.6], "50.846700, 4.352500"),
  luxembourg: abroad("luxembourg", "LU", "Lucembursko", "v Lucembursku", "lucemburské", [49.7, 6.1], "49.611000, 6.130000"),
  // Poland (Bára 21. 11. 2026): GUGiK's orthophoto and OSM, Kraków's base map where it has the street (towns/poland.js).
  poland: abroad("poland", "PL", "Polsko", "v Polsku", "polské", [52.0, 19.4], "52.229700, 21.012200"),
  // France (Bára 22. 11. 2026): IGN's orthophoto and OSM, Paris's Plan de voirie where it has the street (towns/france.js).
  france: abroad("france", "FR", "Francie", "ve Francii", "francouzské", [46.6, 2.4], "48.856600, 2.352200"),
  // Cyprus (Bára 23. 11. 2026): the DLS orthophoto and buildings, OSM (towns/cyprus.js); traffic keeps left.
  cyprus: abroad("cyprus", "CY", "Kypr", "na Kypru", "kyperské", [35.1, 33.4], "35.170000, 33.360000"),
  // Italy (Bára 23. 11. 2026): only where an orthophoto has an open licence (Bolzano, Turin, Bologna, Modena); Bologna's
  // road areas (towns/italy.js).
  italy: abroad("italy", "IT", "Itálie", "v Itálii", "italské", [44.9, 10.4], "44.493800, 11.342600"),
  // Estonia (Bára 23. 11. 2026): the Board's orthophoto, ETAK's buildings, OSM (towns/estonia.js).
  estonia: abroad("estonia", "EE", "Estonsko", "v Estonsku", "estonské", [58.7, 25.0], "59.437000, 24.753600"),
  // Slovenia (Bára 23. 11. 2026): the GURS orthophoto, the buildings of its cadastre, OSM (towns/slovenia.js).
  slovenia: abroad("slovenia", "SI", "Slovinsko", "ve Slovinsku", "slovinské", [46.1, 14.8], "46.051400, 14.505800"),
  // Finland (Bára 23. 11. 2026): OSM, the towns' orthophotos (Helsinki, Espoo, Turku), Helsinki's register of public
  // areas, the buildings of Helsinki and Ryhti (towns/finland.js).
  finland: abroad("finland", "FI", "Finsko", "ve Finsku", "finské", [62.0, 25.5], "60.169500, 24.938000"),
  // Denmark (Bára 23. 11. 2026): the spring orthophoto of GeoDanmark (with the app's token), OSM, the buildings of
  // Copenhagen and Aarhus (towns/denmark.js).
  denmark: abroad("denmark", "DK", "Dánsko", "v Dánsku", "dánské", [56.0, 10.5], "55.676100, 12.568300"),
  // Lithuania (Bára 24. 11. 2026): OSM only (no orthophoto may be used), Vilnius's topographic areas (towns/lithuania.js).
  lithuania: abroad("lithuania", "LT", "Litva", "v Litvě", "litevské", [55.2, 23.9], "54.687200, 25.279700"),
  // The USA (Bára 24. 11. 2026, phase 2): only the metro of Washington DC; DC's Planimetrics and DDOT's inventory, DC's
  // orthophoto, OSM (towns/usa.js).
  usa: abroad("usa", "US", "USA", "v USA", "americké", [38.9, -77.03], "38.897700, -77.036500"),
  // Canada (Bára 25. 11. 2026): only Toronto and its surroundings; Toronto's topographic mapping and orthophoto, OSM
  // (towns/canada.js).
  canada: abroad("canada", "CA", "Kanada", "v Kanadě", "kanadské", [43.7, -79.4], "43.658890, -79.416460"),
  // Malta (Bára 23. 11. 2026): the Planning Authority's orthophoto and OSM (towns/malta.js); traffic keeps left.
  malta: abroad("malta", "MT", "Malta", "na Maltě", "maltské", [35.9, 14.45], "35.898900, 14.514600"),
  // Monaco (Bára 23. 11. 2026): IGN's French orthophoto and OSM (towns/monaco.js).
  monaco: abroad("monaco", "MC", "Monako", "v Monaku", "monacké", [43.738, 7.424], "43.738400, 7.424600"),
  // Spain (Bára 23. 11. 2026): IGN's PNOA orthophoto and OSM, Zaragoza's paving map where it has the street (towns/spain.js).
  spain: abroad("spain", "ES", "Španělsko", "ve Španělsku", "španělské", [40.2, -3.7], "40.416800, -3.703800"),
  // Portugal (Bára 23. 11. 2026): DGT's orthophotos and OSM (towns/portugal.js).
  portugal: abroad("portugal", "PT", "Portugalsko", "v Portugalsku", "portugalské", [39.6, -8.0], "38.722200, -9.139300"),
  cizina: abroad("cizina", null, "cizinu", "v cizině", "zahraniční", [49.8, 15.5], "48.146736, 17.106998"),
});
// The rest of Slovakia and of Austria draws the state's own set (countries/<ISO>.js art).
// (The Czech furniture's map of "cesko" is not theirs: the state's set has its furniture, profile.js.)
for (const c of Object.values(CITIES)) if (c.abroad && c.country) { c.art = c.id; delete c.artMap; }

// The Slovak and Austrian cities (step 4b of docs/architecture-countries.md; Bára 16. 11. 2026: cities everywhere, as
// Brno): by their boundaries (towns-sk.json from ZBGIS, towns-at.json from GISCO's LAU, towns-us.json of DC, towns-ca.json of Toronto), everything else of their
// state's rest (texts, sources, orthophoto), only the illustrations their own where the state has a set of the town
// (else the state's). Their sources keep their own territories (towns/slovakia.js, towns/austria.js AREAS).
const LATE_ART = new Set(["washington", "boston", "bostonmetro", "newyork", "toronto", "sanfrancisco"]); // their states' sets come later (late.js)
const stateTown = (id, state, view) => ({ ...CITIES[state], id, like: state, view, art: LATE_ART.has(id) || COUNTRIES[CITIES[state].country].art[id] ? id : state });
export const STATE_TOWNS = {
  SK: ["bratislava", "kosice", "zilina", "bystrica", "presov", "nitra", "trnava", "trencin", "martin", "poprad", "piestany", "hlohovec", "zvolen"],
  AT: ["wien", "graz", "linz", "salzburg", "innsbruck"],
  // Boston (Bára 26. 11. 2026): the city (its acorn lamp, its surface map) before its metro (the MBTA's bus and tram,
  // MassGIS's orthophoto, Boston's guidelines); towns-us.json has both, in this order.
  US: ["washington", "newyork", "sanfrancisco", "boston", "bostonmetro"],
  CA: ["toronto"],
};
const VIEW = { bratislava: [48.1440, 17.1100], kosice: [48.7190, 21.2580], zilina: [49.2230, 18.7400], bystrica: [48.7360, 19.1460], presov: [48.9980, 21.2400],
  nitra: [48.3120, 18.0870], trnava: [48.3774, 17.5883], trencin: [48.8945, 18.0444], martin: [49.0665, 18.9230], poprad: [49.0555, 20.2975],
  piestany: [48.5918, 17.8273], hlohovec: [48.4310, 17.8030], zvolen: [48.5762, 19.1371],
  wien: [48.2085, 16.3731], graz: [47.0707, 15.4395], linz: [48.3059, 14.2862], salzburg: [47.8, 13.045], innsbruck: [47.2654, 11.3927],
  washington: [38.8977, -77.0365], newyork: [40.758, -73.9855], boston: [42.3603, -71.0578], bostonmetro: [42.3603, -71.0578], toronto: [43.6535, -79.3839], sanfrancisco: [37.7793, -122.4193] };
for (const id of STATE_TOWNS.SK) CITIES[id] = stateTown(id, "slovensko", VIEW[id]);
for (const id of STATE_TOWNS.AT) CITIES[id] = stateTown(id, "austria", VIEW[id]);
for (const id of STATE_TOWNS.US) CITIES[id] = stateTown(id, "usa", VIEW[id]);
// Boston's metro: its data and its rules of width (countries/US.js limitsBoston), not DC's: its texts are Boston's
// (city.boston.* in locales/<lang>.json; i18n.js TEXT_ALIAS).
for (const id of STATE_TOWNS.CA) CITIES[id] = stateTown(id, "canada", VIEW[id]);
// San Francisco (26. 11. 2026): its own surface map (towns/sanfrancisco.js) and its own norms (countries/US.js), not DC's
// (its texts city.sanfrancisco.* in locales/<lang>.json).

// Towns with no data of their own (the national DTM of ČÚZK, as "cesko"), only their own vehicles.
const artTown = (id, inCity, adjective, art) => ({ ...CITIES.cesko, id, like: "cesko", inCity, adjective, art: id, artMap: { ...art, ...TOWN_ART } });
Object.assign(CITIES, {
  olomouc: artTown("olomouc", "v Olomouci", "olomoucké", TRAM),
  liberec: artTown("liberec", "v Liberci", "liberecké", TRAM),
  hradec: artTown("hradec", "v Hradci Králové", "hradecké", TROLLEY),
  budejovice: artTown("budejovice", "v Českých Budějovicích", "budějovické", TROLLEY),
  zlin: artTown("zlin", "ve Zlíně", "zlínské", TROLLEY),
});

// The credit lines of an export and of a saved file (Bára 10. 11. 2026): the data of the cut's city with the
// region of a national DTM by name, the DMVS where it stood in for a city's own map (sources.js national),
// the orthophoto where it was read (ortho.js), then the illustrations and the licences. src: the cut's
// { region, dmvs, ortho } (app.js); art: the city's own illustrations are drawn. Two lines: data, then the rest.
export function creditLines(c, src = {}, art = false) {
  const kraj = src.region || t("cities.regions");
  // Abroad the city has no data of its own (credit ""): the line starts with OSM.
  // The credit starts with the word the line starts with ("data ©", "Daten ©", "Données ©"): said once, not
  // "Daten: Daten ©" (the Bulgarian critic, 17. 11. 2026).
  const word = t("cities.data", { data: "" }).replace(/[\s:]+$/, "").toLowerCase();
  const own = (s) => (s.split(" ")[0].toLowerCase() === word || /^data$/i.test(s.split(" ")[0]) ? s.slice(s.indexOf(" ") + 1) : s);
  const data = c.credit ? [t("cities.data", { data: own(c.credit).replace("{kraj}", kraj) })] : [];
  if (src.dmvs && !c.credit.includes("IS DMVS")) data.push(dmvsCredit(kraj));
  if (src.dmvs && !c.credit.includes("RÚIAN")) data.push(ruianCredit());
  // The sources that gave data to the cut, by their keys (credits.js).
  data.push(...sourceCredits(src));
  data.push(data.length ? t("cities.openstreetmapContributorsOdbl") : t("cities.data", { data: t("cities.openstreetmapContributorsOdbl") }));
  return [
    data.join(" · "),
    (art ? t("cities.illustrationsStreetmixNetCc")
      : t("cities.illustrationsStreetmixNetCcSa"))
      + t("cities.licencesCreativecommonsOrgLicenses"),
  ];
}

export const CITY_IDS = Object.keys(CITIES);
// A city by its id with its texts in the page's language (before it is the current one; setCity adds the state).
export const cityById = (id) => CITIES[id] && { ...CITIES[id], ...cityTexts(id, CITIES[id].like) };

// The city of the current cut. globalThis.PROFILY_CITY lets a script (tools/build_og.mjs, the evaluation)
// start in another city.
export const city = {};
// The state of the current cut as a module (countries/<ISO>.js; countries/default.js outside the states the app knows):
// what differs by state (norms, signs, orthophoto, houses, illustrations…). city.country stays its ISO code.
export let country = countryOf(null);
// The state of a city by its id (before it is the current one).
export const countryOfCity = (id) => { const c = CITIES[id] || CITIES.cesko; return countryOf("country" in c ? c.country : "CZ"); };
export function setCity(id) {
  for (const k of Object.keys(city)) delete city[k];
  // country: the state of the cut (ISO 3166-1: "CZ", "SK"; null elsewhere), for its data, norms and signs; the
  // language of the interface is the visitor's (i18n.js), not the place's.
  const c = { country: "CZ", ...(CITIES[id] || CITIES.cesko) };
  // The city's texts in the page's language (locales/<lang>.json city.<id>.*: its name in sentences, its data, its credits).
  Object.assign(city, c, cityTexts(c.id, c.like));
  country = countryOf(city.country);
  return city;
}
setCity(globalThis.PROFILY_CITY || "praha");

// The city a point lies in, by the boundaries of the cities (towns.json, tools/build_boundaries.mjs); elsewhere its
// state (below). Before the file has loaded (or without it) the current city.
let bounds = null;
export const loadBounds = (json) => { bounds = Object.entries(json).map(([id, rings]) => boxed(id, rings)); };
// The states (states.json, tools/build_boundaries.mjs): the Czech Republic (RÚIAN) and Slovakia; a point in neither is
// "cizina". Without the file (or before it has loaded) a point outside the cities is "cesko", as before.
let states = null;
// The land borders of a state of COAST whose neighbours are abroad (states.json land_<id>: lines, not rings; Bára
// 24. 11. 2026): its vertices, and the lines.
let land = {};
const LAND = /^land_/;
// More rings of a state over its own (states.json "<id>+<what>": Narva and Valga by the Estonian cadastre, Helsinki and
// Espoo with their sea, Ydre Nordhavn; the reviews of 24. 11. 2026): an entry of their own, since the rings of one entry
// count by parity (places.js inside), read as <id>.
const PLUS = /\+.*$/;
export const loadStates = (json) => { land = {}; states = []; addStates(json); };
// (states-america.json joins it: late.js.)
export const addStates = (json) => {
  const entries = Object.entries(json);
  Object.assign(land, Object.fromEntries(entries.filter(([id]) => LAND.test(id)).map(([id, lines]) => [id.slice(5), { lines, at: new Set(lines.flat().map((p) => p.join())) }])));
  states = [...(states || []), ...entries.filter(([id]) => !LAND.test(id)).map(([id, rings]) => ({ ...boxed(id, rings), id: id.replace(PLUS, "") }))];
};
// The cities of the other states (towns-sk.json, towns-at.json, towns-us.json; STATE_TOWNS): within their state, else its rest.
let towns = [];
export const loadTowns = (json) => { loadSkTowns(json); towns = [...towns.filter((b) => !(b.id in (json || {}))), ...Object.entries(json || {}).filter(([id]) => CITIES[id]).map(([id, rings]) => boxed(id, rings))]; };
// The state entry of a point: the first ring it lies in; on a coast (GISCO's 1 : 1 M ring cuts off quays and ports: the
// review of 23. 11. 2026, Barceloneta, Cais do Sodré, Funchal, Mareterra) the entry within COAST_TOLERANCE metres, if the
// nearest is a state of COAST or an entry kept out of it (foreign_*: Gibraltar, Andorra; closed_*). Only by the sea
// (Bára 24. 11. 2026): a segment of a state's land border (land_<id>) does not count, and a point nearer to that border
// than to the coast is not the state's (300 m inside Latvia, Belarus, Russia or Sweden is not Lithuania or Finland).
// Estonia and Slovenia too (the reviews of 24. 11. 2026: the harbours of Haapsalu, Virtsu, Kuivastu, Heltermaa, Rohuküla
// and Paldiski, Pirita tee, the old town of Koper, Žusterna and the west of Piran were abroad), with their land borders.
const COAST = new Set(["spain", "portugal", "monaco", "france", "finland", "denmark", "lithuania", "estonia", "slovenia"]);
const COAST_TOLERANCE = 400;
function stateEntry(lat, lon) {
  const hit = within(states, lat, lon);
  if (hit) return hit;
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110540, pad = COAST_TOLERANCE / ky * 1.5;
  const dist = (p, q) => {
    const ax = (p[0] - lon) * kx, ay = (p[1] - lat) * ky, dx = (q[0] - lon) * kx - ax, dy = (q[1] - lat) * ky - ay;
    const u = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(ax + u * dx, ay + u * dy);
  };
  let best = null, dmin = COAST_TOLERANCE;
  for (const b of states) {
    // (Not the messages of the USA and Canada: americanCoast below.)
    if (/^closed_(us|ca)$/.test(b.id) || !(COAST.has(b.id) || /^(foreign|closed)_/.test(b.id))) continue;
    if (lon < b.box[0] - pad * 2 || lon > b.box[2] + pad * 2 || lat < b.box[1] - pad || lat > b.box[3] + pad) continue;
    const own = land[b.id];
    let d0 = dmin;
    for (const r of b.rings) for (let i = 1; i < r.length; i++) {
      if (own?.at.has(r[i - 1].join()) && own.at.has(r[i].join())) continue;
      d0 = Math.min(d0, dist(r[i - 1], r[i]));
    }
    if (d0 >= dmin) continue;
    if (own && own.lines.some((l) => l.some((p, i) => i > 0 && dist(l[i - 1], p) <= d0))) continue;
    dmin = d0; best = b.id;
  }
  return best || americanCoast(lat, lon, dist);
}
// The coasts of the USA and Canada, whose messages' rings are drawn to a kilometre or three (states-america.json: Halifax, Juneau,
// the Battery and the Ferry Building had no message: the review of 25. 11. 2026): the nearest ring within AMERICAN_COAST,
// not near the line with Mexico (MEXICO: a rough one; Nuevo Laredo is no place of the USA).
const AMERICAN_COAST = 6000, NEAR_MEXICO = 40000;
const MEXICO = [[-117.12, 32.53], [-114.72, 32.72], [-114.81, 32.49], [-111.07, 31.33], [-108.21, 31.33], [-108.21, 31.78], [-106.53, 31.78], [-104.9, 30.6], [-103.15, 28.98],
  [-102.4, 29.77], [-101.4, 29.77], [-100.3, 28.28], [-99.5, 27.5], [-99.1, 26.4], [-97.14, 25.95]];
function americanCoast(lat, lon, dist) {
  if (!isLate(lat, lon) || MEXICO.some((p, i) => i > 0 && lon > -117.1 && dist(MEXICO[i - 1], p) < NEAR_MEXICO)) return null;
  let best = null, dmin = AMERICAN_COAST;
  for (const b of states) {
    if (!/^(usa|canada|closed_(us|ca))$/.test(b.id) || lon < b.box[0] - 0.2 || lon > b.box[2] + 0.2 || lat < b.box[1] - 0.1 || lat > b.box[3] + 0.1) continue;
    for (const r of b.rings) for (let i = 1; i < r.length; i++) {
      if (Math.abs(r[i][1] - lat) > 2 && Math.abs(r[i - 1][1] - lat) > 2) continue;
      const d = dist(r[i - 1], r[i]);
      if (d < dmin) { dmin = d; best = b.id; }
    }
  }
  return best;
}
// Where the app makes no profile (tools/build_boundaries.mjs closed_*; Bára 23. 11. 2026): the message to show, or null.
export function closedAt(lat, lon) {
  if (!states || (bounds && within(bounds, lat, lon))) return null;
  return CLOSED_TEXT[stateEntry(lat, lon)]?.() ?? null;
}
export function cityAt(lat, lon) {
  if (!bounds) return city.id;
  const own = within(bounds, lat, lon);
  if (own) return own;
  if (!states) return "cesko";
  const state = stateEntry(lat, lon);
  if (!state || /^(foreign|closed)_/.test(state)) return "cizina";
  const town = within(towns.filter((b) => CITIES[b.id].like === state), lat, lon);
  return town || state;
}
