// The credit of each data source by its key (docs/architecture-countries.md, step 2). A source that gave data to a
// cut leaves its key in state.cut.sources (app.js: { orthoCity: "sk", skTown: "presov", zbgis: true … }), not a
// sentence: a saved file and a change of language would keep a sentence in the old language. Here each key and
// value has its credit line (Czech, through t()), creditLines (city.js) writes them in this order, and validate.js
// keeps of a saved cut only the keys and values listed here. A new source: its key here and where app.js cutAt writes
// state.cut.sources (and, for the footer's short line, app.js cutData).
// No import of city.js (it imports this).
import { t } from "./i18n.js";
import { PASSPORT_NAMES, GREEN_PASSPORTS } from "./towns/pasporty-names.js";
import { DE_ORTHO, TO_ORTHO_WHO } from "./lanes-ortho.js";

// The cantons (and Liechtenstein, FL in the survey) by their code in Switzerland's cadastral survey (towns/switzerland.js).
export const CANTONS = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH", "FL", "LI"];

export const SOURCE_CREDITS = {
  // A Czech town's passport over the DTM (towns/pasporty.js).
  passport: Object.fromEntries(Object.keys(PASSPORT_NAMES).map((id) => [id, () => (GREEN_PASSPORTS.has(id)
    ? t("pasport zeleně © {town}", { town: PASSPORT_NAMES[id] }) : t("pasport komunikací © {town}", { town: PASSPORT_NAMES[id] }))])),
  // ČÚZK's orthophoto, where it was read (a tram bed, the lanes, the estimate's kerbs).
  ortho: { true: () => t("ortofoto © ČÚZK, 2025 (CC BY 4.0)") },
  // A city's or a state's own orthophoto (lanes-ortho.js).
  orthoCity: {
    ipr: () => t("ortofoto © IPR Praha, 2024"), brno: () => t("ortofoto © Statutární město Brno, 2025"), plzen: () => t("ortofoto © Statutární město Plzeň, 2024"),
    sk: () => t("ortofoto © GKÚ Bratislava, NLC (ZBGIS, CC BY 4.0)"), at: () => t("ortofoto © basemap.at (CC BY 4.0)"),
    at19: () => t("ortofoto © basemap.at (CC BY 4.0)"),
    ch: () => t("ortofoto SWISSIMAGE © swisstopo"),
    nl: () => t("ortofoto © PDOK (Beeldmateriaal Nederland)"),
    "be-vl": () => t("ortofoto © Digitaal Vlaanderen"), "be-wal": () => t("ortofoto © SPW (Service public de Wallonie)"),
    lu: () => t("ortofoto © ACT Luxembourg (geoportail.lu)"),
    pl: () => t("ortofoto © GUGiK (Geoportal.gov.pl)"),
    fr: () => t("ortofoto © IGN (Géoplateforme)"),
    es: () => t("ortofoto PNOA © IGN (CC BY 4.0)"),
    "pt-25": () => t("ortofoto © DGT"),
    cy: () => t("ortofoto © DLS Kypr"),
    mt: () => t("ortofoto © Planning Authority Malta, 2018 (CC BY 4.0)"),
    ee: () => t("ortofoto © Maa- ja Ruumiamet"),
    si: () => t("ortofoto DOF025 © Geodetska uprava RS, stav 11/2026 (CC BY 4.0)"),
    // Finland: the towns' orthophotos (lanes-ortho.js FI_ORTHO).
    "fi-hki": () => t("ortofoto © Helsingin kaupunki, kaupunkimittauspalvelut (CC BY 4.0)"),
    "fi-esp": () => t("ortofoto © Espoon kaupunki (CC BY 4.0)"),
    "fi-tku": () => t("ortofoto © Turun kaupunki, 2022 (CC BY 4.0)"),
    // Denmark: GeoDanmark's spring orthophoto through Dataforsyningen, credited as its terms ask (evaluation/denmark/ZDROJE.md 1).
    dk: () => t("ortofoto: Indeholder data fra Styrelsen for Dataforsyning og Infrastruktur, Ortofoto forår, WMTS-tjeneste"),
    "it-bo": () => t("ortofoto © Comune di Bologna, Regione Emilia-Romagna (CC BY 4.0)"),
    "it-mo": () => t("ortofoto © Comune di Modena, Regione Emilia-Romagna (CC BY 4.0)"),
    "it-to": () => t("ortofoto {who}", { who: TO_ORTHO_WHO }),
    "it-bz": () => t("ortofoto © Provincia autonoma di Bolzano (CC BY 4.0)"),
    "pt-21": () => t("ortofoto © DGT"),
    "pt-18": () => t("ortofoto © DGT"),
    "pt-sat": () => t("ortofoto © DGT"),
    // Germany: the orthophoto of the Land (lanes-ortho.js DE_ORTHO, "de-BY" …), with the credit the Land asks for.
    ...Object.fromEntries(Object.entries(DE_ORTHO).map(([land, o]) => [`de-${land}`, () => t("ortofoto {who}", { who: o.credit })])),
  },
  // Bratislava's technical map (towns/slovensko.js, ?tm=1).
  skTm: { true: () => t("technická mapa © Hlavné mesto SR Bratislava") },
  // A Slovak town's passport where the cut took its surfaces (towns/slovensko.js SK_TOWNS).
  skTown: {
    bratislava: () => t("pasport komunikácií © Hlavné mesto SR Bratislava a MČ Dúbravka"), presov: () => t("pasport dopravy a zelene © mesto Prešov (CC BY 4.0)"),
    zilina: () => t("pasport komunikácií © mesto Žilina"), bystrica: () => t("pasport komunikácií © mesto Banská Bystrica"), kosice: () => t("pasport komunikácií © mesto Košice"),
    zvolen: () => t("komunikácie a spevnené plochy © mesto Zvolen"),
  },
  // The lines of a town's map that placed the kerbs (towns/slovensko.js EDGE_SOURCES).
  skEdges: {
    nitra: () => t("kresba © mesto Nitra"), piestany: () => t("kresba © mesto Piešťany"), zvolen: () => t("kresba © mesto Zvolen"), hlohovec: () => t("polohopis © mesto Hlohovec"),
    presov: () => t("hranice druhov pozemkov © mesto Prešov (CC BY 4.0)"), "bratislava-tm": () => t("technická mapa © Hlavné mesto SR Bratislava"),
    // Belgium's regions (towns/belgium.js).
    grb: () => t("čáry GRB © Digitaal Vlaanderen"), picc: () => t("čáry PICC © SPW (Service public de Wallonie)"),
    // Copenhagen's kerb lines (towns/denmark.js, on; ?kbhkant=0 leaves them out).
    "kbh-vejkant": () => t("okraje vozovek (GeoDanmark) © Københavns Kommune"),
  },
  // Salzburg's cadastre of signs and Vienna's Flächen-Mehrzweckkarte (towns/austria.js).
  atSigns: { salzburg: () => t("dopravní značky © Stadt Salzburg (CC BY 3.0 AT)") },
  // The signs of Cyprus and Malta drawn after British ones (countries/CY.js, MT.js signs.ogl): the Open Government
  // Licence v1.0 asks for this sentence where the Stav shows one.
  ukSigns: { true: () => t("dopravní značky: Contains public sector information licensed under the Open Government Licence v1.0 (UK Department for Transport)") },
  atTown: { wien: () => t("mapa povrchů (FMZK) © Stadt Wien – data.wien.gv.at (CC BY 4.0)") },
  // The street surfaces of German cities (towns/germany.js).
  deTown: {
    berlin: () => t("povrchy ulic (Straßenbefahrung 2014) © Geoportal Berlin (dl-de/zero-2-0)"),
    hamburg: () => t("povrchy ulic (Feinkartierung Straße) © Freie und Hansestadt Hamburg (dl-de/by-2-0)"),
    aachen: () => t("povrchy ulic (Straßendatenbank) © Stadt Aachen (dl-de/zero-2-0)"),
  },
  // The land cover of the official cadastral survey of Switzerland and Liechtenstein (towns/switzerland.js), by the
  // canton whose survey it is (geodienste.ch).
  chAv: Object.fromEntries([...CANTONS, "CH"].map((c) => [c, () => (c === "FL" || c === "LI" ? t("úřední vyměřování (Bodenbedeckung) © Fürstentum Liechtenstein (geodienste.ch)")
    : c === "CH" ? t("úřední vyměřování (Bodenbedeckung) © kantony (geodienste.ch)") : t("úřední vyměřování (Bodenbedeckung) © kanton {canton} (geodienste.ch)", { canton: c }))])),
  // The Netherlands' national large-scale topography (towns/netherlands.js).
  // Kraków's base map (towns/poland.js).
  plTown: { krakow: () => t("mapa povrchů (MJO) © Gmina Miejska Kraków") },
  // Paris's Plan de voirie (towns/france.js).
  frTown: { paris: () => t("mapa povrchů (Plan de voirie) © Ville de Paris") },
  // Zaragoza's paving map (towns/spain.js).
  esTown: { zaragoza: () => t("mapa povrchů © Ayuntamiento de Zaragoza (IDEZar)") },
  // The buildings of the foral cadastres of Navarre and the Basque provinces (towns/spain-foral.js), in the words each
  // service asks for (Navarre: this sentence with CC BY 4.0; Gipuzkoa: the author named).
  esForal: {
    nc: () => t("budovy {who}", { who: "Servicio proporcionado por el Gobierno de Navarra (CC BY 4.0)" }),
    gi: () => t("budovy {who}", { who: "© Gipuzkoako Foru Aldundia" }),
    bi: () => t("budovy {who}", { who: "© Bizkaiko Foru Aldundia – Diputación Foral de Bizkaia" }),
    ar: () => t("budovy {who}", { who: "© Diputación Foral de Álava – Arabako Foru Aldundia" }),
  },
  // Bologna's road areas (towns/italy.js).
  // The buildings of Slovenia's cadastre (towns/slovenia.js), where they told of a house.
  siGurs: { true: () => t("budovy © Geodetska uprava RS (kataster stavb, stav 11/2026, CC BY 4.0)") },
  eeTown: { tallinn: () => t("mapa povrchů © Tallinna Linnaplaneerimise Amet") },
  // Vilnius's topographic areas 1 : 500 (towns/lithuania.js).
  ltTown: { vilnius: () => t("mapa povrchů (topografické plochy 1 : 500) © Vilniaus miesto savivaldybė / Vilniaus planas") },
  ltGrpk: { true: () => t("budovy GRPK © Lietuvos Respublikos aplinkos ministerija (CC BY 4.0)") },
  // Helsinki's register of public areas (towns/finland.js).
  fiTown: { helsinki: () => t("mapa povrchů (Yleisten alueiden rekisteri) © Helsingin kaupunki (CC BY 4.0)") },
  // The buildings of Helsinki's register or of Ryhti (towns/finland.js), where they told of a house.
  // The buildings of Copenhagen or Aarhus (towns/denmark.js), where they told of a house.
  dkBuild: {
    kbh: () => t("budovy (BBR, GeoDanmark) © Københavns Kommune"),
    aar: () => t("budovy (BBR) © Aarhus Kommune (CC BY 4.0)"),
    both: () => `${t("budovy (BBR, GeoDanmark) © Københavns Kommune")}, ${t("budovy (BBR) © Aarhus Kommune (CC BY 4.0)")}`,
  },
  // Copenhagen's parking areas (towns/denmark.js, on; ?kbhpark=0 leaves them out).
  dkParking: { true: () => t("parkovací plochy © Københavns Kommune") },
  fiBuild: {
    hki: () => t("budovy © Helsingin kaupunki (CC BY 4.0)"),
    ryhti: () => t("budovy © Suomen ympäristökeskus SYKE (Ryhti, CC BY 4.0)"),
    both: () => `${t("budovy © Helsingin kaupunki (CC BY 4.0)")}, ${t("budovy © Suomen ympäristökeskus SYKE (Ryhti, CC BY 4.0)")}`,
  },
  // Bologna's Carta tecnica and Lombardy's DBT (towns/italy.js, towns/lombardy.js).
  itTown: { bologna: () => t("mapa povrchů (Carta tecnica comunale) © Comune di Bologna (CC BY 4.0)"), lombardia: () => t("mapa povrchů (Database Topografico) © Regione Lombardia (CC BY 4.0)") },
  // Flanders' road corridors WBN and their division WGO (towns/belgium.js), in the words the licence asks for.
  beTown: { grb: () => t("mapa povrchů (GRB): {who}", { who: "Bron: Grootschalig Referentie Bestand Vlaanderen, Digitaal Vlaanderen (Gratis Open Data Licentie Vlaanderen v1.02)" }) },
  nlBgt: { true: () => t("mapa povrchů BGT © Kadaster a správci BGT (PDOK, CC0)") },
  // Amsterdam's parking spaces (towns/netherlands.js).
  amsParking: { true: () => t("parkovací místa © Gemeente Amsterdam") },
  // ZBGIS's roads, car parks and lawns in the estimate (towns/slovensko.js).
  zbgis: { true: () => t("cesty, parkoviská a tráva © GKÚ Bratislava (ZBGIS, CC BY 4.0)") },
  // The carriageway's kerbs read by the AI model (ai-kerbs.js, ?ai=1): the surface maps and OSM it learnt on.
  aiKerbs: { true: () => t("obruby vozovky: model AI učený na mapách povrchů {who}", { who: "© IPR Praha, Stadt Wien – data.wien.gv.at (CC BY 4.0), Geoportal Berlin (dl-de/zero-2-0), Freie und Hansestadt Hamburg (dl-de/by-2-0)" }) },
};

// The credit line of one key and value, or null for one not listed.
export const sourceCredit = (key, value) => (Object.hasOwn(SOURCE_CREDITS, key) && Object.hasOwn(SOURCE_CREDITS[key], String(value)) ? SOURCE_CREDITS[key][String(value)]() : null);
// The credit lines of a cut's sources in the order above; one line said once (Bratislava's technical map as the
// surfaces and as the kerbs' lines).
export const sourceCredits = (src = {}) => [...new Set(Object.keys(SOURCE_CREDITS).map((k) => (k in src ? sourceCredit(k, src[k]) : null)).filter(Boolean))];
// Of a saved cut's sources the listed keys with a listed value (validate.js).
// Only a word or true (a flag), as app.js writes them.
export const knownSources = (src = {}) => Object.fromEntries(Object.keys(SOURCE_CREDITS).filter((k) => k in src && (typeof src[k] === "string" || src[k] === true) && sourceCredit(k, src[k]) !== null).map((k) => [k, src[k]]));
