// What differs between the cities the app knows: data sources, map, wording, illustrations. One page for
// the whole Czech Republic (Bára 10. 11. 2026): a cut takes the city it lies in (cityAt, by the boundaries
// of mesta.json), anywhere else "cesko" (the national DTM of ČÚZK, RÚIAN and OSM). `city` is the city of
// the current cut, changed in place by setCity, so modules read it at the time they need it.

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

// A town's own vehicles (pilot/public/<art>/tram-*, trolejbus-*) in place of Streetmix's.
const TRAM = { "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound" };
const TROLLEY = { "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound" };

const CITIES = {
  // Anywhere outside the cities above: the national DTM of ČÚZK (dmvs.js), RÚIAN houses, OSM.
  cesko: {
    id: "cesko",
    server: "technické mapy ČÚZK",
    cover: "Českou republiku",
    dataName: "Technická mapa ČÚZK",
    view: [49.8, 15.5],
    centre: null, // no inner town known: houses by RÚIAN and their block
    inCity: "v Česku",
    adjective: "české",
    mapLabel: "Mapa",
    dataShort: "technické mapy ČÚZK, RÚIAN a OSM",
    techMap: "technickou mapu ČÚZK",
    parkingSource: "parkoviště z technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), mimo Prahu orientačně:",
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "technická mapa © {kraj}, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "",
    innerKm: 0, estateKm: 0.5,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.907481, 16.442219",
    // Prague's furniture (copies in cesko/); vehicles from Streetmix.
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
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
    credit: "data © IPR Praha (technická mapa, podlažnosti, vývoj zástavby), TSK hl. m. Prahy (parkování) a MHMP, Geoportál Praha (stromy, zákaz stání, uliční úseky), CC BY 4.0, upraveno",
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
    credit: "data © Statutární město Brno (technická mapa a MTVU; budovy a cykloopatření, data.brno.cz, CC BY 4.0, upraveno), parkování © parkovanivbrne.cz",
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
    credit: "data © Statutární město Jihlava (pasport komunikací, parkování, mobiliář), RÚIAN a katastr © ČÚZK, 2026 (CC BY 4.0, upraveno)",
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
    credit: "data © Statutární město Most (objektová a technická mapa, veřejné osvětlení), RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
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
    credit: "data © Statutární město Opava (účelová mapa, parkování, stromy, lavičky, zastávky), RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
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
    credit: "technická mapa © Pardubický kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
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
    credit: "data © Statutární město Plzeň (technická mapa, budovy 3D, pasport zeleně a mobiliáře, parkovací zóny), RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-plzen",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 1.3, estateKm: 3,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true, bedPanels: true },
    example: "49.747700, 13.377600",
    // Plzeň illustrations (plzen/): PMDP's yellow tram Škoda 40T, green trolleybus Škoda 26Tr (Solaris body) and red
    // bus SOR NS 12; the furniture as in Prague for now.
    artMap: {
      "streetcar-inbound": "tram-inbound", "streetcar-outbound": "tram-outbound",
      "trolleybus-inbound": "trolejbus-inbound", "trolleybus-outbound": "trolejbus-outbound", ...TOWN_ART,
    },
  },
  usti: {
    id: "usti",
    server: "technické mapy ČÚZK", // "Server … neodpovídá"
    cover: "Ústí nad Labem", // "Data pokrývají jen …"
    dataName: "Technická mapa ČÚZK", // "… teď neodpovídá"
    view: [50.6607, 14.0322],
    centre: [14.0322, 50.6607], // Mírové náměstí
    inCity: "v Ústí nad Labem",
    adjective: "ústecké",
    mapLabel: "Mapa Ústí",
    dataShort: "technické mapy ČÚZK, města Ústí a OSM",
    techMap: "technickou mapu ČÚZK",
    parkingSource: "parkovací místa (město Ústí nad Labem)",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Ústí orientačně:",
    // Its own vehicles (drawn after photos of Wikimedia Commons), Prague's furniture (copies in its folder).
    art: "usti",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "technická mapa © Ústecký kraj, IS DMVS ČÚZK, parkovací místa © Statutární město Ústí nad Labem, RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-usti",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.5,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "50.660700, 14.032200",
    // The surfaces are the national DTM (towns/usti.js), only the parking is the town's.
    artMap: { ...TROLLEY, ...TOWN_ART },
  },
  ostrava: {
    id: "ostrava",
    server: "města Ostravy", // "Server … neodpovídá"
    cover: "Ostravu", // "Data pokrývají jen …"
    dataName: "Technická mapa Ostravy", // "… teď neodpovídá"
    view: [49.8355, 18.2924],
    centre: [18.2924, 49.8355], // Masarykovo náměstí
    inCity: "v Ostravě",
    adjective: "ostravské",
    mapLabel: "Mapa Ostravy",
    dataShort: "města Ostravy a OSM",
    techMap: "technickou mapu Ostravy",
    parkingSource: "úseky placeného stání (město Ostrava)",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Ostravu orientačně:",
    // Its own vehicles (drawn after photos of Wikimedia Commons), Prague's furniture (copies in its folder).
    art: "ostrava",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "data © Statutární město Ostrava (technická mapa – generalizace, osy tramvajových kolejí, úseky placeného stání), RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-ostrava",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 1.0, estateKm: 2.0,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.835500, 18.292400",
    // The surfaces are the city's generalized technical map (towns/ostrava.js, data to 2019).
    artMap: { ...TRAM, ...TROLLEY, ...TOWN_ART },
  },
  "frydek-mistek": {
    id: "frydek-mistek",
    server: "města Frýdku-Místku", // "Server … neodpovídá"
    cover: "Frýdek-Místek", // "Data pokrývají jen …"
    dataName: "Pasport komunikací Frýdku-Místku", // "… teď neodpovídá"
    view: [49.6837, 18.3504],
    centre: [18.3504, 49.6837], // náměstí Svobody (Místek)
    inCity: "ve Frýdku-Místku",
    adjective: "frýdecko-místecké",
    mapLabel: "Mapa Frýdku-Místku",
    dataShort: "města Frýdku-Místku, technické mapy ČÚZK a OSM",
    techMap: "pasport komunikací Frýdku-Místku",
    parkingSource: "parkoviště z technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Frýdek-Místek orientačně:",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, Streetmix's vehicles).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "data © Statutární město Frýdek-Místek (pasport komunikací, zeleně, mobiliáře a osvětlení), technická mapa © Moravskoslezský kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-frydek-mistek",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.6, estateKm: 1.2,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.683700, 18.350400",
    // The town's road passport over the national DTM (towns/frydek-mistek.js, towns/overlay.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  karvina: {
    id: "karvina",
    server: "města Karviné", // "Server … neodpovídá"
    cover: "Karvinou", // "Data pokrývají jen …"
    dataName: "Pasport komunikací Karviné", // "… teď neodpovídá"
    view: [49.8542, 18.542],
    centre: [18.542, 49.8542], // Masarykovo náměstí (Fryštát)
    inCity: "v Karviné",
    adjective: "karvinské",
    mapLabel: "Mapa Karviné",
    dataShort: "města Karviné, technické mapy ČÚZK a OSM",
    techMap: "pasport komunikací Karviné",
    parkingSource: "parkoviště z technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Karvinou orientačně:",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, Streetmix's vehicles).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "data © Statutární město Karviná (pasport komunikací a zeleně, technická mapa, mobiliář, osvětlení), technická mapa © Moravskoslezský kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-karvina",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.5, estateKm: 1.0,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.854200, 18.542000",
    // The town's road passport (part of the town) over the national DTM (towns/karvina.js, towns/overlay.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  trebic: {
    id: "trebic",
    server: "města Třebíče", // "Server … neodpovídá"
    cover: "Třebíč", // "Data pokrývají jen …"
    dataName: "Pasport komunikací Třebíče", // "… teď neodpovídá"
    view: [49.215, 15.8799],
    centre: [15.8799, 49.215], // Karlovo náměstí
    inCity: "v Třebíči",
    adjective: "třebíčské",
    mapLabel: "Mapa Třebíče",
    dataShort: "města Třebíče, technické mapy ČÚZK a OSM",
    techMap: "pasport komunikací Třebíče",
    parkingSource: "parkoviště z pasportu a technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Třebíč orientačně:",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, Streetmix's vehicles).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "data © Město Třebíč (pasport komunikací, veřejné osvětlení, lavičky), technická mapa © Kraj Vysočina, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-trebic",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.6, estateKm: 1.2,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.215000, 15.879900",
    // The town's road passport over the national DTM (towns/trebic.js, towns/overlay.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
  prerov: {
    id: "prerov",
    server: "města Přerova", // "Server … neodpovídá"
    cover: "Přerov", // "Data pokrývají jen …"
    dataName: "Technická mapa Přerova", // "… teď neodpovídá"
    view: [49.4555, 17.451],
    centre: [17.451, 49.4555], // náměstí T. G. Masaryka
    inCity: "v Přerově",
    adjective: "přerovské",
    mapLabel: "Mapa Přerova",
    dataShort: "města Přerova a OSM",
    techMap: "technickou mapu Přerova",
    parkingSource: "parkoviště z technické mapy",
    rulesHead: "Šířky podle pražského Manuálu IPR (C.2), pro Přerov orientačně:",
    // No illustrations of its own yet: those of the rest of the country (Prague's furniture, Streetmix's vehicles).
    art: "cesko",
    artLabel: "Ilustrace",
    artTitle: "Kreslit domy a mobiliář (vypnuto: ilustrace Streetmixu)",
    emptyImg: "praha/t3-inbound.svg",
    credit: "data © Statutární město Přerov (technická mapa, vektorové dlaždice), RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)",
    storeSuffix: "-prerov",
    // Old inner town (pitched-roof tenements) within innerKm of the centre, estates from estateKm (profile.js).
    innerKm: 0.7, estateKm: 1.5,
    fix: { serviceJunctions: true, axisToRoadway: true, roadUnderAxis: true },
    example: "49.455500, 17.451000",
    // The surfaces are the city's technical map read from its vector tiles (towns/prerov.js).
    artMap: Object.fromEntries(Object.entries(TOWN_ART).filter(([k]) => !k.startsWith("bus-"))),
  },
};

// Towns with no data of their own (the national DTM of ČÚZK, as "cesko"), only their own vehicles.
const artTown = (id, inCity, adjective, art) => ({ ...CITIES.cesko, id, inCity, adjective, art: id, artMap: { ...art, ...TOWN_ART } });
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
  const kraj = src.region || "kraje";
  const data = [`Data: ${c.credit.replace(/^data /, "").replace("{kraj}", kraj)}`];
  if (src.dmvs && !c.credit.includes("IS DMVS")) data.push(`technická mapa © ${kraj}, IS DMVS ČÚZK`);
  if (src.dmvs && !c.credit.includes("RÚIAN")) data.push("RÚIAN © ČÚZK, 2026 (CC BY 4.0, upraveno)");
  if (src.ortho) data.push("ortofoto © ČÚZK, 2025 (CC BY 4.0)");
  data.push("© přispěvatelé OpenStreetMap (ODbL)");
  return [
    data.join(" · "),
    `Ilustrace © Streetmix, streetmix.net (CC BY-SA 4.0)${art ? " a Bára Soukupová (MIT)" : ""} · obrázek CC BY-SA 4.0 · `
      + "licence: creativecommons.org/licenses/by/4.0, creativecommons.org/licenses/by-sa/4.0",
  ];
}

export const CITY_IDS = Object.keys(CITIES);
export const cityById = (id) => CITIES[id];

// The city of the current cut. globalThis.PROFILY_CITY lets a script (tools/build_og.mjs, the evaluation)
// start in another city; globalThis.PROFILY_FIX lets a test (evaluation/run.mjs FIX=1) try the Brno fixes on Prague.
export const city = {};
export function setCity(id) {
  for (const k of Object.keys(city)) delete city[k];
  Object.assign(city, CITIES[id] || CITIES.cesko);
  if (globalThis.PROFILY_FIX) city.fix = globalThis.PROFILY_FIX;
  return city;
}
setCity(globalThis.PROFILY_CITY || "praha");

// The city a point lies in, by the boundaries of the cities (mesta.json, tools/build_mesta.mjs); "cesko"
// elsewhere. Before the file has loaded (or without it) the current city.
let bounds = null;
export const loadBounds = (json) => {
  bounds = Object.entries(json).map(([id, rings]) => {
    const xs = rings.flat().map((p) => p[0]), ys = rings.flat().map((p) => p[1]);
    return { id, rings, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
};
const inside = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
export function cityAt(lat, lon) {
  if (!bounds) return city.id;
  return bounds.find((b) => lon >= b.box[0] && lon <= b.box[2] && lat >= b.box[1] && lat <= b.box[3] && inside(b.rings, lon, lat))?.id || "cesko";
}
