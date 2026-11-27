// The credit of each data source by its key (docs/architecture-countries.md, step 2). A source that gave data to a
// cut leaves its key in state.cut.sources (app.js: { orthoCity: "sk", skTown: "presov", zbgis: true … }), not a
// sentence: a saved file and a change of language would keep a sentence in the old language. Here each key and
// value has its credit line (Czech, through t()), creditLines (city.js) writes them in this order, and validate.js
// keeps of a saved cut only the keys and values listed here. A new source: its key here and where app.js cutAt writes
// state.cut.sources (and, for the footer's short line, app.js cutData).
// No import of city.js (it imports this).
import { t } from "./i18n.js";
import { PASSPORT_NAMES, GREEN_PASSPORTS } from "./towns/passport-names.js";
import { DE_ORTHO, TO_ORTHO_WHO } from "./lanes-ortho.js";

// The cantons (and Liechtenstein, FL in the survey) by their code in Switzerland's cadastral survey (towns/switzerland.js).
export const CANTONS = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH", "FL", "LI"];

export const SOURCE_CREDITS = {
  // A Czech town's passport over the DTM (towns/passports.js).
  passport: Object.fromEntries(Object.keys(PASSPORT_NAMES).map((id) => [id, () => (GREEN_PASSPORTS.has(id)
    ? t("credits.greenInventoryTown", { town: PASSPORT_NAMES[id] })
    : t("credits.roadInventoryTown", { town: PASSPORT_NAMES[id] }))])),
  // ČÚZK's orthophoto, where it was read (a tram bed, the lanes, the estimate's kerbs).
  ortho: { true: () => t("credits.orthophotoCuzk2025Cc") },
  // A city's or a state's own orthophoto (lanes-ortho.js).
  orthoCity: {
    ipr: () => t("credits.orthophotoIprPraha2024"), brno: () => t("credits.orthophotoStatutarniMestoBrno"), plzen: () => t("credits.orthophotoStatutarniMestoPlzen"),
    sk: () => t("credits.orthophotoGkuBratislavaNlc"), at: () => t("credits.orthophotoBasemapCc4"),
    at19: () => t("credits.orthophotoBasemapCc4"),
    ch: () => t("common.orthophotoSwissimageSwisstopo"),
    nl: () => t("common.orthophotoBeeldmateriaalNlPdok"),
    "be-vl": () => t("credits.orthophotoBronLuchtopnamenDigitaal"), "be-wal": () => t("credits.orthophotoSpwServicePublic"),
    lu: () => t("common.orthophotoActLuxembourgGeoportail"),
    pl: () => t("common.orthophotoGugikGeoportalGov"),
    fr: () => t("common.orthophotoIgnGeoplateforme"),
    es: () => t("common.pnoaOrthophotoIgnCc"),
    "pt-25": () => t("common.orthophotoDgt"),
    cy: () => `${t("common.orthophotoDlsCyprus")}, 2019`, // the flight's year as in the footer (Bára 27. 11. 2026)
    mt: () => t("credits.orthophotoPlanningAuthorityMalta"),
    ee: () => t("common.orthophotoMaaJaRuumiamet"),
    si: () => t("credits.orthophotoDof025GeodetskaUprava"),
    // Finland: the towns' orthophotos (lanes-ortho.js FI_ORTHO).
    "fi-hki": () => t("credits.orthophotoHelsinginKaupunkiKaupunkimittauspalvel"),
    "fi-esp": () => t("credits.orthophotoEspoonKaupunkiCc"),
    "fi-tku": () => t("credits.orthophotoTurunKaupunki2022"),
    // The USA: DC's orthophoto (lanes-ortho.js US_ORTHO).
    "us-dc": () => t("credits.orthophotoDcOfficeChief"),
    "us-nyc": () => t("credits.orthophotoNysGeospatialServices"),
    "us-ma": () => t("credits.orthophotoMassgisBureauGeographic"),
    "ca-tor": () => t("credits.orthophotoCityToronto2025"),
    // Denmark: GeoDanmark's spring orthophoto through Dataforsyningen, credited as its terms ask (evaluation/denmark/SOURCES.md 1).
    dk: () => t("common.orthophotoIndeholderDataFra"),
    "it-bo": () => t("credits.orthophotoComuneDiBologna"),
    "it-mo": () => t("credits.orthophotoComuneDiModena"),
    "it-to": () => t("common.orthophotoWho", { who: TO_ORTHO_WHO }),
    "it-bz": () => t("credits.orthophotoProvinciaAutonomaDi"),
    "pt-21": () => t("common.orthophotoDgt"),
    "pt-18": () => t("common.orthophotoDgt"),
    "pt-sat": () => t("common.orthophotoDgt"),
    // Germany: the orthophoto of the Land (lanes-ortho.js DE_ORTHO, "de-BY" …), with the credit the Land asks for.
    ...Object.fromEntries(Object.entries(DE_ORTHO).map(([land, o]) => [`de-${land}`, () => t("common.orthophotoWho", { who: o.credit })])),
  },
  // Bratislava's technical map (towns/slovakia.js, ?tm=1).
  skTm: { true: () => t("credits.technicalMapCityBratislava") },
  // A Slovak town's passport where the cut took its surfaces (towns/slovakia.js SK_TOWNS).
  skTown: {
    bratislava: () => t("credits.roadInventoryCityBratislava"), presov: () => t("credits.inventoryRoadsGreenCity"),
    zilina: () => t("credits.roadInventoryCityZilina"), bystrica: () => t("credits.roadInventoryCityBanska"), kosice: () => t("credits.roadInventoryMestoKosice"),
    zvolen: () => t("credits.roadsPavedAreasCity"),
  },
  // The lines of a town's map that placed the kerbs (towns/slovakia.js EDGE_SOURCES).
  skEdges: {
    nitra: () => t("credits.mapDrawingCityNitra"), piestany: () => t("credits.mapDrawingCityPiestany"), zvolen: () => t("credits.mapDrawingCityZvolen"), hlohovec: () => t("credits.planimetryCityHlohovec"),
    presov: () => t("credits.landUseBoundariesCity"), "bratislava-tm": () => t("credits.technicalMapCityBratislava"),
    // Belgium's regions (towns/belgium.js).
    grb: () => t("credits.grbLinesBronGrootschalig"), picc: () => t("credits.piccLinesSpwService"),
    // Copenhagen's kerb lines (towns/denmark.js, on; ?kbhkant=0 leaves them out).
    "kbh-vejkant": () => t("credits.carriagewayEdgesGeodanmarkK"),
  },
  // Salzburg's cadastre of signs and Vienna's Flächen-Mehrzweckkarte (towns/austria.js).
  atSigns: { salzburg: () => t("credits.trafficSignsStadtSalzburg") },
  // The signs of Cyprus and Malta drawn after British ones (countries/CY.js, MT.js signs.ogl): the Open Government
  // Licence v1.0 asks for this sentence where the Stav shows one.
  ukSigns: { true: () => t("credits.trafficSignsContainsPublic") },
  atTown: { wien: () => t("credits.surfaceMapFmzkStadt") },
  // The street surfaces of German cities (towns/germany.js).
  deTown: {
    berlin: () => t("credits.streetSurfacesStraEnbefahrung"),
    hamburg: () => t("credits.streetSurfacesFeinkartierungStra"),
    aachen: () => t("credits.streetSurfacesStraEndatenbank"),
  },
  // The land cover of the official cadastral survey of Switzerland and Liechtenstein (towns/switzerland.js), by the
  // canton whose survey it is (geodienste.ch).
  chAv: Object.fromEntries([...CANTONS, "CH"].map((c) => [c, () => (c === "FL" || c === "LI" ? t("credits.officialCadastralSurveyBodenbedeckung")
    : c === "CH" ? t("credits.officialCadastralSurveyBodenbedeckungCantons") : t("credits.officialCadastralSurveyBodenbedeckungCanton", { canton: c }))])),
  // The Netherlands' national large-scale topography (towns/netherlands.js).
  // Kraków's base map (towns/poland.js).
  plTown: { krakow: () => t("credits.surfaceMapMjoGmina") },
  // Paris's Plan de voirie (towns/france.js).
  frTown: { paris: () => t("credits.surfaceMapPlanDe") },
  // Zaragoza's paving map (towns/spain.js).
  esTown: { zaragoza: () => t("credits.surfaceMapAyuntamientoDe") },
  // The buildings of the foral cadastres of Navarre and the Basque provinces (towns/spain-foral.js), in the words each
  // service asks for (Navarre: this sentence with CC BY 4.0; Gipuzkoa: the author named).
  esForal: {
    nc: () => t("credits.buildingsWho", { who: "Servicio proporcionado por el Gobierno de Navarra (CC BY 4.0)" }),
    gi: () => t("credits.buildingsWho", { who: "© Gipuzkoako Foru Aldundia" }),
    bi: () => t("credits.buildingsWho", { who: "© Bizkaiko Foru Aldundia – Diputación Foral de Bizkaia" }),
    ar: () => t("credits.buildingsWho", { who: "© Diputación Foral de Álava – Arabako Foru Aldundia" }),
  },
  // The buildings of the national Catastro (towns/spain.js), where it told of a house (Bára 27. 11. 2026: in the exports too).
  esCatastro: { true: () => t("credits.buildingsWho", { who: "© Dirección General del Catastro" }) },
  // Bologna's road areas (towns/italy.js).
  // The buildings of Slovenia's cadastre (towns/slovenia.js), where they told of a house.
  siGurs: { true: () => t("credits.buildingsGeodetskaUpravaRs") },
  eeTown: { tallinn: () => t("credits.tallinnSurfaceMapTar") },
  // The buildings of Estonia's topographic database (towns/estonia.js), where they told of a house.
  eeEtak: { true: () => t("credits.etakBuildingsMaaJa") },
  // Vilnius's topographic areas 1 : 500 (towns/lithuania.js).
  ltTown: { vilnius: () => t("credits.surfaceMapTopographicAreas") },
  ltGrpk: { true: () => t("credits.buildingsGrpkLietuvosRespublikos") },
  cyDls: { true: () => t("credits.buildingsDepartmentLandsSurveys") },
  // DC's Planimetrics and DDOT's inventory (towns/usa.js).
  cityMap: { dc: () => t("credits.surfaceMapPlanimetrics2023"),
    // Toronto's topographic mapping (towns/canada.js), with the statement its licence asks for.
    toronto: () => t("credits.surfaceMapContainsInformation"),
    // New York's planimetrics (towns/newyork.js).
    nyc: () => t("credits.surfaceMapNycPlanimetric"),
    // San Francisco's right of way, kerbs and buildings (towns/sanfrancisco.js; PDDL asks for no credit, the city is named).
    sf: () => t("credits.surfaceMapRightWay"),
    // Boston's and Cambridge's (towns/boston.js), both under the PDDL (no credit asked, given).
    boston: () => t("credits.surfaceMapStreetEdges"),
    cambridge: () => t("credits.surfaceMapCityCambridge") },
  // San Francisco's digital curb (towns/sanfrancisco.js), where it placed the parking.
  sfCurb: { true: () => t("credits.parkingDigitalCurbSfmta") },
  nycSigns: { true: () => t("credits.parkingRegulationLocationsSigns") },
  // San Francisco's building heights, where they gave the floors.
  sfHouse: { true: () => t("credits.buildingHeightsCityCounty") },
  usHouse: { boston: () => t("credits.buildingStoreysCityBoston") },
  caHouse: { true: () => t("credits.buildingHeightsCityToronto") },
  // DC's assessment tables, where they told of a house.
  usCama: { true: () => t("credits.housesCamaDcOffice") },
  usDdot: { true: () => t("credits.lanesParkingRoadwaySubblock") },
  // New York's building footprints, where they told of a house (towns/newyork.js).
  nycHouse: { true: () => t("credits.buildingsWho", { who: "© NYC Office of Technology and Innovation (NYCmaps, NYC Open Data)" }) },
  // Helsinki's register of public areas (towns/finland.js).
  fiTown: { helsinki: () => t("credits.surfaceMapYleistenAlueiden") },
  // The buildings of Helsinki's register or of Ryhti (towns/finland.js), where they told of a house.
  // The buildings of Copenhagen or Aarhus (towns/denmark.js), where they told of a house.
  dkBuild: {
    kbh: () => t("credits.buildingsBbrGeodanmarkK"),
    aar: () => t("credits.buildingsBbrAarhusKommune"),
    both: () => `${t("credits.buildingsBbrGeodanmarkK")}, ${t("credits.buildingsBbrAarhusKommune")}`,
  },
  // Copenhagen's parking areas (towns/denmark.js, on; ?kbhpark=0 leaves them out).
  dkParking: { true: () => t("credits.parkingAreasKBenhavns") },
  fiBuild: {
    hki: () => t("credits.buildingsHelsinginKaupunkiCc"),
    ryhti: () => t("credits.buildingsSuomenYmparistokeskusSyke"),
    both: () => `${t("credits.buildingsHelsinginKaupunkiCc")}, ${t("credits.buildingsSuomenYmparistokeskusSyke")}`,
  },
  // Bologna's Carta tecnica and Lombardy's DBT (towns/italy.js, towns/lombardy.js).
  itTown: { bologna: () => t("credits.surfaceMapCartaTecnica"), lombardia: () => t("credits.surfaceMapDatabaseTopografico") },
  // Flanders' road corridors WBN and their division WGO (towns/belgium.js), in the words the licence asks for.
  beTown: { grb: () => t("credits.surfaceMapGrbWho", { who: "Bron: Grootschalig Referentie Bestand Vlaanderen, Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0)" }) },
  nlBgt: { true: () => t("credits.bgtSurfaceMapKadaster") },
  // Amsterdam's parking spaces (towns/netherlands.js).
  amsParking: { true: () => t("credits.parkingSpacesGemeenteAmsterdam") },
  // ZBGIS's roads, car parks and lawns in the estimate (towns/slovakia.js).
  zbgis: { true: () => t("credits.roadsCarParksGrass") },
  // The carriageway's kerbs read by the AI model (ai-kerbs.js, ?ai=1): the surface maps and OSM it learnt on.
  aiKerbs: { true: () => t("credits.carriagewayKerbsAiModel", { who: "© IPR Praha, Stadt Wien – data.wien.gv.at (CC BY 4.0), Geoportal Berlin (dl-de/zero-2-0), Freie und Hansestadt Hamburg (dl-de/by-2-0)" }) },
};

// The credit line of one key and value, or null for one not listed.
export const sourceCredit = (key, value) => (Object.hasOwn(SOURCE_CREDITS, key) && Object.hasOwn(SOURCE_CREDITS[key], String(value)) ? SOURCE_CREDITS[key][String(value)]() : null);
// The credit lines of a cut's sources in the order above; one line said once (Bratislava's technical map as the
// surfaces and as the kerbs' lines).
export const sourceCredits = (src = {}) => [...new Set(Object.keys(SOURCE_CREDITS).map((k) => (k in src ? sourceCredit(k, src[k]) : null)).filter(Boolean))];
// Of a saved cut's sources the listed keys with a listed value (validate.js).
// Only a word or true (a flag), as app.js writes them.
export const knownSources = (src = {}) => Object.fromEntries(Object.keys(SOURCE_CREDITS).filter((k) => k in src && (typeof src[k] === "string" || src[k] === true) && sourceCredit(k, src[k]) !== null).map((k) => [k, src[k]]));
