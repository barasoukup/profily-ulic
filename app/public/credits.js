// The credit of each data source by its key (docs/architecture-countries.md, step 2). A source that gave data to a
// cut leaves its key in state.cut.sources (app.js: { orthoCity: "sk", skTown: "presov", zbgis: true … }), not a
// sentence: a saved file and a change of language would keep a sentence in the old language. Here each key and
// value has its credit line (Czech, through t()), creditLines (city.js) writes them in this order, and validate.js
// keeps of a saved cut only the keys and values listed here. A new source: its key here and where app.js cutAt writes
// state.cut.sources (and, for the footer's short line, app.js cutData).
// No import of city.js (it imports this).
import { t } from "./i18n.js";
import { CR, W, cr, lead, quoted } from "./credit-text.js";
import { PASSPORT_NAMES, GREEN_PASSPORTS } from "./towns/passport-names.js";
import { DE_ORTHO, TO_ORTHO_WHO } from "./lanes-ortho.js";

// The cantons (and Liechtenstein, FL in the survey) by their code in Switzerland's cadastral survey (towns/switzerland.js).
export const CANTONS = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH", "FL", "LI"];

// The official survey of a canton (or the cantons, Liechtenstein): the holder in the words of the language.
const surveyCredit = (holder) => cr(W("cadastralSurvey"), holder, { detail: ["Bodenbedeckung"], note: ["geodienste.ch"] });

export const SOURCE_CREDITS = {
  // A Czech town's passport over the DTM (towns/passports.js).
  passport: Object.fromEntries(Object.keys(PASSPORT_NAMES).map((id) => [id, () => (GREEN_PASSPORTS.has(id)
    ? cr(W("greenInventory"), PASSPORT_NAMES[id])
    : cr(W("roadInventory"), PASSPORT_NAMES[id]))])),
  // ČÚZK's orthophoto, where it was read (a tram bed, the lanes, the estimate's kerbs).
  ortho: { true: () => CR["credits.orthophotoCuzk2025Cc"]() },
  // A city's or a state's own orthophoto (lanes-ortho.js).
  orthoCity: {
    ipr: () => CR["credits.orthophotoIprPraha2024"](), brno: () => CR["credits.orthophotoStatutarniMestoBrno"](), plzen: () => CR["credits.orthophotoStatutarniMestoPlzen"](),
    sk: () => CR["credits.orthophotoGkuBratislavaNlc"](), at: () => CR["credits.orthophotoBasemapCc4"](),
    at19: () => CR["credits.orthophotoBasemapCc4"](),
    ch: () => CR["common.orthophotoSwissimageSwisstopo"](),
    nl: () => CR["common.orthophotoBeeldmateriaalNlPdok"](),
    "be-vl": () => CR["credits.orthophotoBronLuchtopnamenDigitaal"](), "be-wal": () => CR["credits.orthophotoSpwServicePublic"](),
    lu: () => CR["common.orthophotoActLuxembourgGeoportail"](),
    pl: () => CR["common.orthophotoGugikGeoportalGov"](),
    fr: () => CR["common.orthophotoIgnGeoplateforme"](),
    es: () => CR["common.pnoaOrthophotoIgnCc"](),
    "pt-25": () => CR["common.orthophotoDgt"](),
    cy: () => CR["common.orthophotoDlsCyprus"](), // with the flight's year, 2019, as in the footer (Bára 27. 11. 2026)
    mt: () => CR["credits.orthophotoPlanningAuthorityMalta"](),
    ee: () => CR["common.orthophotoMaaJaRuumiamet"](),
    si: () => CR["credits.orthophotoDof025GeodetskaUprava"](),
    // Finland: the towns' orthophotos (lanes-ortho.js FI_ORTHO).
    "fi-hki": () => CR["credits.orthophotoHelsinginKaupunkiKaupunkimittauspalvel"](),
    "fi-esp": () => CR["credits.orthophotoEspoonKaupunkiCc"](),
    "fi-tku": () => CR["credits.orthophotoTurunKaupunki2022"](),
    // The USA: DC's orthophoto (lanes-ortho.js US_ORTHO).
    "us-dc": () => CR["credits.orthophotoDcOfficeChief"](),
    "us-nyc": () => CR["credits.orthophotoNysGeospatialServices"](),
    "us-ma": () => CR["credits.orthophotoMassgisBureauGeographic"](),
    "ca-tor": () => CR["credits.orthophotoCityToronto2025"](),
    // Denmark: GeoDanmark's spring orthophoto through Dataforsyningen, credited as its terms ask (evaluation/denmark/SOURCES.md 1).
    dk: () => CR["common.orthophotoIndeholderDataFra"](),
    "it-bo": () => CR["credits.orthophotoComuneDiBologna"](),
    "it-mo": () => CR["credits.orthophotoComuneDiModena"](),
    "it-to": () => lead(W("orthophoto"), TO_ORTHO_WHO),
    "it-bz": () => CR["credits.orthophotoProvinciaAutonomaDi"](),
    "pt-21": () => CR["common.orthophotoDgt"](),
    "pt-18": () => CR["common.orthophotoDgt"](),
    "pt-sat": () => CR["common.orthophotoDgt"](),
    // Germany: the orthophoto of the Land (lanes-ortho.js DE_ORTHO, "de-BY" …), with the credit the Land asks for.
    ...Object.fromEntries(Object.entries(DE_ORTHO).map(([land, o]) => [`de-${land}`, () => lead(W("orthophoto"), o.credit)])),
  },
  // Bratislava's technical map: only in cuts saved before the trial ?tm=1 was deleted (28. 11. 2026).
  skTm: { true: () => CR["credits.technicalMapCityBratislava"]() },
  // A Slovak town's passport where the cut took its surfaces (towns/slovakia.js SK_TOWNS).
  skTown: {
    bratislava: () => CR["credits.roadInventoryCityBratislava"](), presov: () => CR["credits.inventoryRoadsGreenCity"](),
    zilina: () => CR["credits.roadInventoryCityZilina"](), bystrica: () => CR["credits.roadInventoryCityBanska"](), kosice: () => CR["credits.roadInventoryMestoKosice"](),
  },
  // The lines of a town's map that placed the kerbs (towns/slovakia.js EDGE_SOURCES).
  skEdges: {
    nitra: () => CR["credits.mapDrawingCityNitra"](), piestany: () => CR["credits.mapDrawingCityPiestany"](), zvolen: () => CR["credits.mapDrawingCityZvolen"](), hlohovec: () => CR["credits.planimetryCityHlohovec"](),
    presov: () => CR["credits.landUseBoundariesCity"](), "bratislava-tm": () => CR["credits.technicalMapCityBratislava"](),
    // Belgium's regions (towns/belgium.js).
    grb: () => CR["credits.grbLinesBronGrootschalig"](), picc: () => CR["credits.piccLinesSpwService"](),
    // Copenhagen's kerb lines (towns/denmark.js, on; ?kbhkant=0 leaves them out).
    "kbh-vejkant": () => CR["credits.carriagewayEdgesGeodanmarkK"](),
  },
  // Salzburg's cadastre of signs and Vienna's Flächen-Mehrzweckkarte (towns/austria.js).
  atSigns: { salzburg: () => CR["credits.trafficSignsStadtSalzburg"]() },
  // The signs of Cyprus and Malta drawn after British ones (countries/CY.js, MT.js signs.ogl): the Open Government
  // Licence v1.0 asks for this sentence where the Stav shows one.
  ukSigns: { true: () => CR["credits.trafficSignsContainsPublic"]() },
  atTown: { wien: () => CR["credits.surfaceMapFmzkStadt"]() },
  // The street surfaces of German cities (towns/germany.js).
  deTown: {
    berlin: () => CR["credits.streetSurfacesStraEnbefahrung"](),
    hamburg: () => CR["credits.streetSurfacesFeinkartierungStra"](),
    aachen: () => CR["credits.streetSurfacesStraEndatenbank"](),
  },
  // The land cover of the official cadastral survey of Switzerland and Liechtenstein (towns/switzerland.js), by the
  // canton whose survey it is (geodienste.ch).
  chAv: Object.fromEntries([...CANTONS, "CH"].map((c) => [c, () => surveyCredit(c === "FL" || c === "LI" ? "Fürstentum Liechtenstein" : c === "CH" ? W("cantons") : t("credits.canton", { canton: c }))])),
  // The Netherlands' national large-scale topography (towns/netherlands.js).
  // Kraków's base map (towns/poland.js).
  plTown: { krakow: () => CR["credits.surfaceMapMjoGmina"]() },
  // Paris's Plan de voirie (towns/france.js).
  frTown: { paris: () => CR["credits.surfaceMapPlanDe"]() },
  // Zaragoza's paving map (towns/spain.js).
  esTown: { zaragoza: () => CR["credits.surfaceMapAyuntamientoDe"]() },
  // The buildings of the foral cadastres of Navarre and the Basque provinces (towns/spain-foral.js), in the words each
  // service asks for (Navarre: this sentence with CC BY 4.0; Gipuzkoa: the author named).
  esForal: {
    nc: () => lead(W("buildings"), "Servicio proporcionado por el Gobierno de Navarra (CC BY 4.0)"),
    gi: () => lead(W("buildings"), "© Gipuzkoako Foru Aldundia"),
    bi: () => lead(W("buildings"), "© Bizkaiko Foru Aldundia – Diputación Foral de Bizkaia"),
    ar: () => lead(W("buildings"), "© Diputación Foral de Álava – Arabako Foru Aldundia"),
  },
  // The buildings of the national Catastro (towns/spain.js), where it told of a house (Bára 27. 11. 2026: in the exports too).
  esCatastro: { true: () => lead(W("buildings"), "© Dirección General del Catastro") },
  // Bologna's road areas (towns/italy.js).
  // The buildings of Slovenia's cadastre (towns/slovenia.js), where they told of a house.
  siGurs: { true: () => CR["credits.buildingsGeodetskaUpravaRs"]() },
  eeTown: { tallinn: () => CR["credits.tallinnSurfaceMapTar"]() },
  // The buildings of Estonia's topographic database (towns/estonia.js), where they told of a house.
  eeEtak: { true: () => CR["credits.etakBuildingsMaaJa"]() },
  // Vilnius's topographic areas 1 : 500 (towns/lithuania.js).
  ltTown: { vilnius: () => CR["credits.surfaceMapTopographicAreas"]() },
  ltGrpk: { true: () => CR["credits.buildingsGrpkLietuvosRespublikos"]() },
  cyDls: { true: () => CR["credits.buildingsDepartmentLandsSurveys"]() },
  // DC's Planimetrics and DDOT's inventory (towns/usa.js).
  cityMap: { dc: () => CR["credits.surfaceMapPlanimetrics2023"](),
    // Toronto's topographic mapping (towns/canada.js), with the statement its licence asks for.
    toronto: () => CR["credits.surfaceMapContainsInformation"](),
    // New York's planimetrics (towns/newyork.js).
    nyc: () => CR["credits.surfaceMapNycPlanimetric"](),
    // San Francisco's right of way, kerbs and buildings (towns/sanfrancisco.js; PDDL asks for no credit, the city is named).
    sf: () => CR["credits.surfaceMapRightWay"](),
    // Boston's and Cambridge's (towns/boston.js), both under the PDDL (no credit asked, given).
    boston: () => CR["credits.surfaceMapStreetEdges"](),
    cambridge: () => CR["credits.surfaceMapCityCambridge"]() },
  // San Francisco's digital curb (towns/sanfrancisco.js), where it placed the parking.
  sfCurb: { true: () => CR["credits.parkingDigitalCurbSfmta"]() },
  // San Francisco's building heights, where they gave the floors.
  sfHouse: { true: () => CR["credits.buildingHeightsCityCounty"]() },
  usHouse: { boston: () => CR["credits.buildingStoreysCityBoston"]() },
  caHouse: { true: () => CR["credits.buildingHeightsCityToronto"]() },
  // DC's assessment tables, where they told of a house.
  usCama: { true: () => CR["credits.housesCamaDcOffice"]() },
  usDdot: { true: () => CR["credits.lanesParkingRoadwaySubblock"]() },
  // New York's building footprints, where they told of a house (towns/newyork.js).
  nycHouse: { true: () => lead(W("buildings"), "© NYC Office of Technology and Innovation (NYCmaps, NYC Open Data)") },
  // Helsinki's register of public areas (towns/finland.js).
  fiTown: { helsinki: () => CR["credits.surfaceMapYleistenAlueiden"]() },
  // The buildings of Helsinki's register or of Ryhti (towns/finland.js), where they told of a house.
  // The buildings of Copenhagen or Aarhus (towns/denmark.js), where they told of a house.
  dkBuild: {
    kbh: () => CR["credits.buildingsBbrGeodanmarkK"](),
    aar: () => CR["credits.buildingsBbrAarhusKommune"](),
    both: () => `${CR["credits.buildingsBbrGeodanmarkK"]()}, ${CR["credits.buildingsBbrAarhusKommune"]()}`,
  },
  // Copenhagen's parking areas (towns/denmark.js, on; ?kbhpark=0 leaves them out).
  dkParking: { true: () => CR["credits.parkingAreasKBenhavns"]() },
  fiBuild: {
    hki: () => CR["credits.buildingsHelsinginKaupunkiCc"](),
    ryhti: () => CR["credits.buildingsSuomenYmparistokeskusSyke"](),
    both: () => `${CR["credits.buildingsHelsinginKaupunkiCc"]()}, ${CR["credits.buildingsSuomenYmparistokeskusSyke"]()}`,
  },
  // Bologna's Carta tecnica and Lombardy's DBT (towns/italy.js, towns/lombardy.js).
  itTown: { bologna: () => CR["credits.surfaceMapCartaTecnica"](), lombardia: () => CR["credits.surfaceMapDatabaseTopografico"]() },
  // Flanders' road corridors WBN and their division WGO (towns/belgium.js), in the words the licence asks for.
  beTown: { grb: () => quoted(W("surfaceMap"), "Bron: Grootschalig Referentie Bestand Vlaanderen, Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0)", "GRB") },
  nlBgt: { true: () => CR["credits.bgtSurfaceMapKadaster"]() },
  // Amsterdam's parking spaces (towns/netherlands.js).
  // ZBGIS's roads, car parks and lawns in the estimate (towns/slovakia.js).
  zbgis: { true: () => CR["credits.roadsCarParksGrass"]() },
  // The carriageway's kerbs read by the AI model (ai-kerbs.js, ?ai=1): the surface maps and OSM it learnt on.
  aiKerbs: { true: () => t("credits.aiKerbs", { who: "© IPR Praha, Stadt Wien – data.wien.gv.at (CC BY 4.0), Geoportal Berlin (dl-de/zero-2-0), Freie und Hansestadt Hamburg (dl-de/by-2-0)" }) },
};

// The credit line of one key and value, or null for one not listed.
export const sourceCredit = (key, value) => (Object.hasOwn(SOURCE_CREDITS, key) && Object.hasOwn(SOURCE_CREDITS[key], String(value)) ? SOURCE_CREDITS[key][String(value)]() : null);
// The credit lines of a cut's sources in the order above; one line said once (Bratislava's technical map as the
// surfaces and as the kerbs' lines).
export const sourceCredits = (src = {}) => [...new Set(Object.keys(SOURCE_CREDITS).map((k) => (k in src ? sourceCredit(k, src[k]) : null)).filter(Boolean))];
// Of a saved cut's sources the listed keys with a listed value (validate.js).
// Only a word or true (a flag), as app.js writes them.
export const knownSources = (src = {}) => Object.fromEntries(Object.keys(SOURCE_CREDITS).filter((k) => k in src && (typeof src[k] === "string" || src[k] === true) && sourceCredit(k, src[k]) !== null).map((k) => [k, src[k]]));
