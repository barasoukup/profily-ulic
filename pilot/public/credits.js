// The credit of each data source by its key (docs/architecture-countries.md, step 2). A source that gave data to a
// cut leaves its key in state.cut.sources (app.js: { orthoCity: "sk", skTown: "presov", zbgis: true … }), not a
// sentence: a saved file and a change of language would keep a sentence in the old language. Here each key and
// value has its credit line (Czech, through t()), creditLines (city.js) writes them in this order, and validate.js
// keeps of a saved cut only the keys and values listed here. A new source: its key here and where app.js cutAt writes
// state.cut.sources (and, for the footer's short line, app.js cutData).
// No import of city.js (it imports this).
import { t } from "./i18n.js";
import { PASSPORT_NAMES, GREEN_PASSPORTS } from "./towns/pasporty-names.js";
import { DE_ORTHO } from "./lanes-ortho.js";

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
  },
  // Salzburg's cadastre of signs and Vienna's Flächen-Mehrzweckkarte (towns/austria.js).
  atSigns: { salzburg: () => t("dopravní značky © Stadt Salzburg (CC BY 3.0 AT)") },
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
  // ZBGIS's roads, car parks and lawns in the estimate (towns/slovensko.js).
  zbgis: { true: () => t("cesty, parkoviská a tráva © GKÚ Bratislava (ZBGIS, CC BY 4.0)") },
};

// The credit line of one key and value, or null for one not listed.
export const sourceCredit = (key, value) => (Object.hasOwn(SOURCE_CREDITS, key) && Object.hasOwn(SOURCE_CREDITS[key], String(value)) ? SOURCE_CREDITS[key][String(value)]() : null);
// The credit lines of a cut's sources in the order above; one line said once (Bratislava's technical map as the
// surfaces and as the kerbs' lines).
export const sourceCredits = (src = {}) => [...new Set(Object.keys(SOURCE_CREDITS).map((k) => (k in src ? sourceCredit(k, src[k]) : null)).filter(Boolean))];
// Of a saved cut's sources the listed keys with a listed value (validate.js).
// Only a word or true (a flag), as app.js writes them.
export const knownSources = (src = {}) => Object.fromEntries(Object.keys(SOURCE_CREDITS).filter((k) => k in src && (typeof src[k] === "string" || src[k] === true) && sourceCredit(k, src[k]) !== null).map((k) => [k, src[k]]));
