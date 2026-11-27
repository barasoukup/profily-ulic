// What the data of a cut or a city are called, said by one template for each kind of data and a name in the
// brackets after it (Bára 27. 11. 2026, docs/i18n-simplify.md): "mapa povrchů (Boston)", "ortofoto (MassGIS)", never
// "mapy povrchů Bostonu": the template needs no case or gender, the name is the nominative (the keys place.<id>, an
// exonym or another script where the language has one) or a proper name that is not translated (MassGIS, GRB, DDOT).
// The kinds are the keys data.<kind>; a list of them is told by Intl.ListFormat ("A, B and C").
// Used by: the footer's and the Stav's line of data (app.js cutData), the city's texts (city.js: its data, server,
// layer name, parking source, the head of the widths), the notes and the outages (sources.js).
import { t, ref, text, place, list, ucfirst, countryName } from "./i18n.js";
import { CITY_CREDIT } from "./credit-text.js";
import { PASSPORT_NAMES, GREEN_PASSPORTS } from "./towns/passport-names.js";

// The name a kind's template takes: the place the data are of, or the holder (a source's name).
const PARAM = { surfaceMap: "place", surfaceMapLines: "place", roadInventory: "place", greenInventory: "place", townMap: "place",
  streetInventory: "place", thematicMap: "place", technicalMap: "source", orthophoto: "source", inventory: "source" };

// A kind of data (a text to tell later) and the name in its brackets: a place (place("boston")) or a proper name ("GRB").
export const part = (kind, who) => (kind in PARAM && who !== undefined ? ref(`data.${kind}`, { [PARAM[kind]]: who }) : ref(`data.${kind}`));
// The kinds that carry no name: "ortofoto", "úřední vyměřování".
const ANY = { orthophoto: "orthophotoAny" };
const bare = (kind) => ref(`data.${ANY[kind] ?? kind}`);
// The parts of a line of data as one text: "mapa povrchů (Boston), ortofoto (MassGIS) a OSM".
export const dataText = (parts) => list(parts.map((p) => (typeof p === "string" ? p : text(p))));
// The first part's name as a text of a sentence's beginning: "Mapa povrchů (Boston)".
const heading = (p) => ucfirst(typeof p === "string" ? p : text(p));

const OSM = "OSM", CUZK = "ČÚZK";

// The Slovak towns by the id of their map (towns/slovakia.js SK_TOWNS, EDGE_SOURCES) and the id of their name.
const SK_PLACE = { nitra: "nitra", piestany: "piestany", zvolen: "zvolen", hlohovec: "hlohovec", presov: "presov", "bratislava-tm": "bratislava",
  bratislava: "bratislava", zilina: "zilina", bystrica: "bystrica", kosice: "kosice" };

// What a cut's sources (state.cut.sources, app.js cutAt) say its data are: the town or state map that gave the
// surfaces, the orthophoto, OSM. Nothing known: undefined (the city's own short line then).
const BY_MAP = {
  atTown: { wien: [part("surfaceMap", place("wien")), OSM] },
  deTown: { berlin: [part("surfaceMap", place("berlin")), OSM], hamburg: [part("surfaceMap", place("hamburg")), OSM], aachen: [part("streetInventory", place("aachen")), OSM] },
  plTown: { krakow: [part("surfaceMap", place("krakow")), part("orthophoto", "GUGiK"), OSM] },
  frTown: { paris: [part("surfaceMap", place("paris")), part("orthophoto", "IGN"), OSM] },
  eeTown: { tallinn: [part("surfaceMap", place("tallinn")), bare("orthophoto"), OSM] },
  fiTown: { helsinki: [part("surfaceMap", place("helsinki")), bare("orthophoto"), OSM] },
  ltTown: { vilnius: [part("surfaceMap", place("vilnius")), OSM] },
  cityMap: {
    dc: [part("surfaceMap", place("washington")), part("inventory", "DDOT"), bare("orthophoto"), OSM],
    toronto: [part("surfaceMap", place("toronto")), bare("orthophoto"), OSM],
    nyc: [part("surfaceMap", place("newyork")), bare("orthophoto"), OSM],
    sf: [part("surfaceMap", place("sanfrancisco")), OSM],
    boston: [part("surfaceMap", place("boston")), part("orthophoto", "MassGIS"), OSM],
    cambridge: [part("surfaceMap", place("cambridge")), part("orthophoto", "MassGIS"), OSM],
  },
  itTown: { bologna: [part("surfaceMap", place("bologna")), bare("orthophoto"), OSM], lombardia: [part("surfaceMap", place("lombardy")), OSM] },
  esTown: { zaragoza: [part("surfaceMap", place("zaragoza")), part("orthophoto", "PNOA"), OSM] },
  beTown: { grb: [part("surfaceMap", "GRB"), bare("orthophoto"), OSM] },
};
const BY_FLAG = [
  ["chAv", [bare("cadastralSurvey"), part("orthophoto", "SWISSIMAGE"), OSM]],
  ["nlBgt", [part("surfaceMap", "BGT"), part("orthophoto", "PDOK"), OSM]],
];

export function cutDataParts(src = {}, { abroad, noOrtho } = {}) {
  for (const [key, map] of Object.entries(BY_MAP)) if (map[src[key]]) return map[src[key]];
  for (const [key, parts] of BY_FLAG) if (src[key]) return parts;
  // The lines of a Belgian region's map that placed the kerbs (towns/belgium.js).
  if (src.skEdges === "grb") return [part("surfaceMapLines", "GRB"), bare("orthophoto"), OSM];
  if (src.skEdges === "picc") return [part("surfaceMapLines", "PICC"), bare("orthophoto"), OSM];
  // The lines of a Slovak town's map that placed the kerbs (towns/slovakia.js EDGE_SOURCES; Bára: the data really used),
  // a town's passport that gave the surfaces (SK_TOWNS).
  const sk = SK_PLACE[src.skTown], edges = SK_PLACE[src.skEdges];
  if (sk && edges === sk) return [part("roadInventory", place(sk)), part("townMap", place(edges)), "ZBGIS", OSM];
  if (sk) return [part("roadInventory", place(sk)), "ZBGIS", OSM];
  if (edges) return [part("townMap", place(edges)), "ZBGIS", OSM];
  const id = src.passport;
  // Where the state's orthophoto does not reach (Madeira, the Azores; Bára 27. 11. 2026), the state's line naming an
  // orthophoto would be wrong: the profile is OSM's alone.
  if (!PASSPORT_NAMES[id] && noOrtho && abroad && !src.ortho && !src.orthoCity) return [OSM];
  if (!PASSPORT_NAMES[id]) return undefined;
  return [part(GREEN_PASSPORTS.has(id) ? "greenInventory" : "roadInventory", place(id)), part("technicalMap", CUZK), OSM];
}

// ---------- What a city says of itself (city.js): its server, data, layer name, parking source, head of the widths ----------
const CZ_SERVER = ["brno", "jihlava", "most", "opava", "ostrava", "plzen", "prerov", "trebic", "karvina", "frydek-mistek"];
// The short line of a city's data (the footer, a cut without a map of its own): the parts, in the order the city's data
// are told. A town without one takes its state's (like).
const SHORT = {
  austria: ["basemap.at", OSM], belgium: [ref("data.orthophotosRegions"), OSM], boston: [part("orthophoto", "MassGIS"), OSM],
  brno: [part("townMap", place("brno")), OSM], canada: [part("townMap", place("toronto")), OSM],
  cesko: [part("technicalMap", CUZK), "RÚIAN", OSM], cizina: [OSM], cyprus: [part("orthophoto", "DLS"), OSM],
  denmark: [part("orthophoto", "GeoDanmark"), OSM], estonia: [part("orthophoto", "Maa- ja Ruumiamet"), OSM],
  finland: [OSM, ref("data.orthophotosCities")], france: [part("orthophoto", "IGN"), OSM],
  "frydek-mistek": [part("townMap", place("frydek-mistek")), part("technicalMap", CUZK), OSM],
  germany: [ref("data.orthophotosLaender"), OSM], italy: [ref("data.orthophotosOpen"), OSM], jihlava: [part("townMap", place("jihlava")), OSM],
  karvina: [part("townMap", place("karvina")), part("technicalMap", CUZK), OSM], liechtenstein: [part("orthophoto", "SWISSIMAGE"), OSM],
  lithuania: [OSM], luxembourg: [part("orthophoto", "ACT"), OSM], malta: [ref("data.orthophotoBuildingAuthority"), OSM],
  monaco: [part("orthophoto", "IGN"), OSM], most: [part("townMap", place("most")), OSM], netherlands: [part("orthophoto", "PDOK"), OSM],
  opava: [part("townMap", place("opava")), OSM], ostrava: [part("townMap", place("ostrava")), OSM],
  pardubice: [part("technicalMap", CUZK), OSM], plzen: [part("townMap", place("plzen")), OSM], poland: [part("orthophoto", "GUGiK"), OSM],
  portugal: [part("orthophoto", "DGT"), OSM], praha: ["IPR", OSM], prerov: [part("townMap", place("prerov")), OSM],
  sanfrancisco: [part("townMap", place("sanfrancisco")), OSM], slovenia: [part("orthophoto", "GURS"), OSM], slovensko: ["ZBGIS", OSM],
  spain: [part("orthophoto", "PNOA"), OSM], switzerland: [part("orthophoto", "SWISSIMAGE"), OSM],
  trebic: [part("townMap", place("trebic")), part("technicalMap", CUZK), OSM], usa: [ref("data.townMaps"), OSM],
  usti: [part("technicalMap", CUZK), part("townMap", place("usti")), OSM],
};
// The name of the map a city's data come from (a layer's name, "Načítám data: …"); none abroad.
const MAP = {
  brno: part("technicalMap", place("brno")), cesko: part("technicalMap", CUZK), "frydek-mistek": part("roadInventory", place("frydek-mistek")),
  jihlava: part("roadInventory", place("jihlava")), karvina: part("roadInventory", place("karvina")), most: part("technicalMap", place("most")),
  opava: part("thematicMap", place("opava")), ostrava: part("technicalMap", place("ostrava")), pardubice: part("technicalMap", CUZK),
  plzen: part("technicalMap", place("plzen")), praha: part("technicalMap", "IPR"), prerov: part("technicalMap", place("prerov")),
  trebic: part("roadInventory", place("trebic")), usti: part("technicalMap", CUZK),
};
// Whose server answers (the outage's "Server (Brno) neodpovídá"): the city, the office, or OSM's files.
const SERVER = { praha: "IPR", cesko: CUZK, pardubice: CUZK, usti: CUZK, ...Object.fromEntries(CZ_SERVER.map((id) => [id, place(id)])) };
// Where the parking comes from: its kind (parking.source.<kind>) and whose.
const PARKING = {
  praha: ["paidSections", "TSK"], brno: ["paidSections", "parkovanivbrne.cz"], ostrava: ["paidSections", place("ostrava")],
  jihlava: ["spaces", place("jihlava")], opava: ["spaces", place("opava")], usti: ["spaces", place("usti")],
  cesko: ["technicalMap"], "frydek-mistek": ["technicalMap"], karvina: ["technicalMap"], most: ["technicalMap"], pardubice: ["technicalMap"],
  prerov: ["technicalMap"], plzen: ["technicalMapZones", place("plzen")], trebic: ["passportTechnicalMap"],
};
// The head of the list of widths: its template (rules.head.<kind>), the place it is for and the documents it goes by.
const HEAD = {
  praha: ["prague"], cesko: ["pragueManual", countryName("CZ")], cizina: ["pragueManualAbroad"], monaco: ["monaco"],
  austria: ["regulations", "AT", "RVS 03.02.13, Wiener Projektierungshandbuch"], belgium: ["regulationsOnly", "BE"],
  boston: ["indicative", place("boston"), "Boston Complete Streets Guidelines (2013)"], canada: ["indicativeOnly", place("toronto")],
  cyprus: ["guidelinesOnly", "CY"], denmark: ["guidelines", "DK", "vejregler"], estonia: ["regulationsOnly", "EE"],
  finland: ["guidelines", "FI", "Väylä 18/2020, Helsinki 2014"], france: ["regulations", "FR", "Cerema"],
  germany: ["regulations", "DE", "RASt 06, ERA 2010, VwV-StVO"], italy: ["regulationsOnly", "IT"], liechtenstein: ["regulations", "LI", "VSS"],
  lithuania: ["guidelines", "LT", "Vilnius, Kaunas"], luxembourg: ["regulationsOnly", "LU"], malta: ["regulationsOnly", "MT"],
  netherlands: ["guidelines", "NL", "CROW"], poland: ["regulations", "PL", "RMI 2022"], portugal: ["regulationsOnly", "PT"],
  sanfrancisco: ["indicative", place("sanfrancisco"), "SFMTA (Sidewalk Widths), NACTO"], slovenia: ["regulationsOnly", "SI"],
  slovensko: ["regulations", "SK", "TP 117, TP 73 6110, TP 085, vyhl. 532/2002 Z. z."], spain: ["regulationsOnly", "ES"],
  switzerland: ["regulations", "CH", "VSS"], usa: ["indicative", "US", "DDOT (Design and Engineering Manual 2023), NYC Street Design Manual, NACTO"],
  ...Object.fromEntries(CZ_SERVER.map((id) => [id, ["pragueManual", place(id)]])), pardubice: ["pragueManual", place("pardubice")], usti: ["pragueManual", place("usti")],
};
const named = (where) => (typeof where === "string" && /^[A-Z]{2}$/.test(where) ? countryName(where) : typeof where === "object" ? text(where) : where);

const OWN = (id, like) => (id in SHORT || id in HEAD ? id : like);
// A city's texts in the page's language (city.js composes them over the city): `like` is the state a town without
// texts of its own goes by, Boston's metro goes by Boston (city.js TEXT_ALIAS).
const ALIAS = { bostonmetro: "boston" };
export function cityTexts(id, like) {
  const key = ALIAS[id] ?? OWN(id, like);
  const credit = CITY_CREDIT[key]?.();
  const out = { ...(credit !== undefined && { credit }), server: SERVER[key] ? (typeof SERVER[key] === "string" ? SERVER[key] : text(SERVER[key])) : "OpenStreetMap" };
  if (SHORT[key]) out.dataShort = dataText(SHORT[key]);
  if (MAP[key]) { out.dataName = heading(MAP[key]); out.techMap = text(MAP[key]); }
  const [pk, who, docs] = HEAD[key] || [];
  if (pk) out.rulesHead = text(ref(`rules.head.${pk}`, { where: named(who) ?? "", documents: docs })).replace(/\.\.$/, "."); // a document ending with a full stop ("Z. z.")
  const [pkind, owner] = PARKING[key] || ["estimate"];
  out.parkingSource = text(ref(`parking.source.${pkind}`, owner ? { who: owner } : undefined));
  return out;
}

// ---------- Where the app makes no profile (city.js CLOSED): the places it does make them in, one template for a state ----------
const placeText = (id) => text(place(id));
const closedIn = (country, places) => t("cities.closed", { country: countryName(country), places: list(places) });
export const CLOSED_TEXT = {
  closed_cy: () => t("cities.closedCyprus"),
  closed_ca: () => closedIn("CA", [placeText("toronto")]),
  closed_us: () => closedIn("US", [
    t("cities.placeDetail", { place: placeText("washington"), detail: placeText("dc") }), placeText("newyork"), placeText("sanfrancisco"),
    t("cities.surroundingsCounties", { place: placeText("boston"), names: list(["Suffolk", "Middlesex", "Norfolk"]) }),
  ]),
  closed_it: () => `${closedIn("IT", ["southtyrol", "lombardy", "turin", "bologna", "modena"].map(placeText))} ${t("cities.openLicenceOnly")}`,
};
