// The words of a credit line and the line itself: "{what} © {holder}, {year} ({detail}, {licence})" (Bára 27. 11. 2026,
// docs/i18n-simplify.md): the word of what the data are (orthophoto, surface map, buildings …) is in the language of the
// page (credits.what.<id>), the holder, the product and the licence are names and stay as the holder writes them
// ("Comune di Bologna", "PDOK", "CC BY 4.0"). The text a licence prescribes (the Open Government Licence's sentence,
// Flanders' "Bron: …") is a name as well. Used by credits.js (the sources of a cut), the maps' layers (app.js,
// lanes-ortho.js credit ids), the networks (site.js) and the cities (city.js, through data.js cityTexts).
import { t, ref, text, list, ucfirst } from "./i18n.js";

// A word of a credit in the language: credits.what.<id>.
export const W = (id) => text(ref(`credits.what.${id}`));
// "stav 11/2026", "upraveno": the data's date and that they were modified.
const asOf = (date) => t("credits.asOf", { date });
const modified = () => t("credits.modified");
// "{what} ({detail}) © {holder}, {year} ({note, …})": the note holds the licence, the product and the date.
export function cr(what, holder, { detail = [], year, note = [] } = {}) {
  return `${what}${detail.length ? ` (${detail.join(", ")})` : ""} ©${holder ? ` ${holder}` : ""}${year ? `, ${year}` : ""}${note.length ? ` (${note.join(", ")})` : ""}`;
}
// A credit a licence words itself: "{what}: {the sentence}" (Open Government Licence, Flanders' "Bron: …").
export const quoted = (what, sentence, detail) => `${what}${detail ? ` (${detail})` : ""}: ${sentence}`;
// A credit in the words the holder asks for, after the word of what the data are ("budovy © Gipuzkoako Foru Aldundia").
export const lead = (what, words) => `${what} ${words}`;

// The credits of the map layers and the sources, by the id the code keeps (the layers' credit: in lanes-ortho.js, the
// sources' in credits.js).
export const CR = {
  "app.orthophotoDof025GeodetskaUprava": () => cr(W("orthophoto"), "Geodetska uprava RS", { detail: ["DOF025"], note: ["CC BY 4.0"] }),
  "app.orthophotoGermanLanderGeobasis": () => cr(W("orthophoto"), "GeoBasis-DE", { note: [W("laender")] }),
  "app.orthophotoPlanningAuthorityMalta": () => cr(W("orthophoto"), "Planning Authority Malta", { note: ["CC BY 4.0"] }),
  "common.orthophotoActLuxembourgGeoportail": () => cr(W("orthophoto"), "ACT Luxembourg", { note: ["geoportail.lu", "CC0"] }),
  "common.orthophotoBeeldmateriaalNlPdok": () => cr(W("orthophoto"), "Beeldmateriaal.nl", { note: ["PDOK", "CC BY 4.0"] }),
  "common.orthophotoDgt": () => cr(W("orthophoto"), "DGT"),
  "common.orthophotoDlsCyprus": () => cr(W("orthophoto"), "Department of Lands and Surveys (DLS)", { year: 2019 }),
  "common.orthophotoGugikGeoportalGov": () => cr(W("orthophoto"), "GUGiK", { note: ["Geoportal.gov.pl"] }),
  "common.orthophotoIgnGeoplateforme": () => cr(W("orthophoto"), "IGN", { note: ["Géoplateforme"] }),
  "common.orthophotoMaaJaRuumiamet": () => cr(W("orthophoto"), "Maa- ja Ruumiamet", { year: 2024, note: [asOf("11/2026")] }),
  "common.orthophotoSwissimageSwisstopo": () => cr(W("orthophoto"), "swisstopo", { detail: ["SWISSIMAGE"] }),
  "common.pnoaOrthophotoIgnCc": () => cr(W("orthophoto"), "IGN", { detail: ["PNOA"], note: ["CC BY 4.0"] }),
  "credits.bgtSurfaceMapKadaster": () => cr(W("surfaceMap"), "Kadaster a správci BGT", { detail: ["BGT"], note: ["PDOK", "CC0"] }),
  "credits.buildingHeightsCityCounty": () => cr(W("buildingHeights"), "City and County of San Francisco, DataSF", { note: ["PDDL"] }),
  "credits.buildingHeightsCityToronto": () => cr(W("buildingHeights"), "City of Toronto", { note: ["Open Government Licence – Toronto"] }),
  "credits.buildingStoreysCityBoston": () => cr(W("buildingStoreys"), "City of Boston", { note: ["ODC PDDL"] }),
  "credits.buildingsBbrAarhusKommune": () => cr(W("buildings"), "Aarhus Kommune", { detail: ["BBR"], note: ["CC BY 4.0"] }),
  "credits.buildingsBbrGeodanmarkK": () => cr(W("buildings"), "Københavns Kommune", { detail: ["BBR, GeoDanmark"] }),
  "credits.buildingsDepartmentLandsSurveys": () => cr(W("buildings"), "Department of Lands and Surveys", { note: ["DLS", "CC BY 4.0"] }),
  "credits.buildingsGeodetskaUpravaRs": () => cr(W("buildings"), "Geodetska uprava RS", { note: [W("buildingCadastre"), asOf("11/2026"), "CC BY 4.0"] }),
  "credits.buildingsGrpkLietuvosRespublikos": () => cr(W("buildings"), "Lietuvos Respublikos aplinkos ministerija", { detail: ["GRPK"], note: ["CC BY 4.0"] }),
  "credits.buildingsHelsinginKaupunkiCc": () => cr(W("buildings"), "Helsingin kaupunki", { note: ["CC BY 4.0"] }),
  "credits.buildingsSuomenYmparistokeskusSyke": () => cr(W("buildings"), "Suomen ympäristökeskus SYKE", { note: ["Ryhti", "CC BY 4.0"] }),
  "credits.carriagewayEdgesGeodanmarkK": () => cr(W("carriagewayEdges"), "Københavns Kommune", { detail: ["GeoDanmark"] }),
  "credits.etakBuildingsMaaJa": () => cr(W("buildings"), "Maa- ja Ruumiamet", { detail: ["ETAK"], note: [asOf("11/2026")] }),
  "credits.housesCamaDcOffice": () => cr(W("houses"), "DC Office of Tax and Revenue, DC GIS", { detail: ["CAMA"], note: ["CC BY 4.0"] }),
  "credits.inventoryRoadsGreenCity": () => cr(W("roadGreenInventory"), "mesto Prešov", { note: ["CC BY 4.0"] }),
  "credits.landUseBoundariesCity": () => cr(W("landUseBoundaries"), "mesto Prešov", { note: ["CC BY 4.0"] }),
  "credits.lanesParkingRoadwaySubblock": () => cr(W("lanesParking"), "DDOT, DC GIS", { detail: ["Roadway SubBlock"], note: ["CC BY 4.0"] }),
  "credits.mapDrawingCityNitra": () => cr(W("drawing"), "mesto Nitra"),
  "credits.mapDrawingCityPiestany": () => cr(W("drawing"), "mesto Piešťany"),
  "credits.mapDrawingCityZvolen": () => cr(W("drawing"), "mesto Zvolen"),
  "credits.orthophotoBasemapCc4": () => cr(W("orthophoto"), "basemap.at", { note: ["CC BY 4.0"] }),
  "credits.orthophotoCityToronto2025": () => cr(W("orthophoto"), "City of Toronto", { year: 2025, note: ["Open Government Licence – Toronto"] }),
  "credits.orthophotoComuneDiBologna": () => cr(W("orthophoto"), "Comune di Bologna, Regione Emilia-Romagna", { note: ["CC BY 4.0"] }),
  "credits.orthophotoComuneDiModena": () => cr(W("orthophoto"), "Comune di Modena, Regione Emilia-Romagna", { note: ["CC BY 4.0"] }),
  "credits.orthophotoCuzk2025Cc": () => cr(W("orthophoto"), "ČÚZK", { year: 2025, note: ["CC BY 4.0"] }),
  "credits.orthophotoDcOfficeChief": () => cr(W("orthophoto"), "DC Office of the Chief Technology Officer", { year: 2025, note: ["CC BY 4.0"] }),
  "credits.orthophotoDof025GeodetskaUprava": () => cr(W("orthophoto"), "Geodetska uprava RS", { detail: ["DOF025"], note: [asOf("11/2026"), "CC BY 4.0"] }),
  "credits.orthophotoEspoonKaupunkiCc": () => cr(W("orthophoto"), "Espoon kaupunki", { note: ["CC BY 4.0"] }),
  "credits.orthophotoGkuBratislavaNlc": () => cr(W("orthophoto"), "GKÚ Bratislava, NLC", { note: ["ZBGIS", "CC BY 4.0"] }),
  "credits.orthophotoHelsinginKaupunkiKaupunkimittauspalvel": () => cr(W("orthophoto"), "Helsingin kaupunki, kaupunkimittauspalvelut", { note: ["CC BY 4.0"] }),
  "credits.orthophotoIprPraha2024": () => cr(W("orthophoto"), "IPR Praha", { year: 2024 }),
  "credits.orthophotoMassgisBureauGeographic": () => cr(W("orthophoto"), "MassGIS (Bureau of Geographic Information)", { year: 2025 }),
  "credits.orthophotoNysGeospatialServices": () => cr(W("orthophoto"), "NYS ITS Geospatial Services", { year: 2024 }),
  "credits.orthophotoPlanningAuthorityMalta": () => cr(W("orthophoto"), "Planning Authority Malta", { year: 2018, note: ["CC BY 4.0"] }),
  "credits.orthophotoProvinciaAutonomaDi": () => cr(W("orthophoto"), "Provincia autonoma di Bolzano", { note: ["CC BY 4.0"] }),
  "credits.orthophotoSpwServicePublic": () => cr(W("orthophoto"), "SPW", { note: ["Service public de Wallonie", "CC BY 4.0"] }),
  "credits.orthophotoStatutarniMestoBrno": () => cr(W("orthophoto"), "Statutární město Brno", { year: 2025 }),
  "credits.orthophotoStatutarniMestoPlzen": () => cr(W("orthophoto"), "Statutární město Plzeň", { year: 2024 }),
  "credits.orthophotoTurunKaupunki2022": () => cr(W("orthophoto"), "Turun kaupunki", { year: 2022, note: ["CC BY 4.0"] }),
  "credits.parkingAreasKBenhavns": () => cr(W("parkingAreas"), "Københavns Kommune"),
  "credits.parkingDigitalCurbSfmta": () => cr(W("parking"), "SFMTA, DataSF", { detail: ["Digital Curb"], note: ["PDDL"] }),
  "credits.parkingRegulationLocationsSigns": () => cr(W("parking"), "NYC DOT, NYC Open Data", { detail: ["Parking Regulation Locations and Signs"] }),
  "credits.parkingSpacesGemeenteAmsterdam": () => cr(W("parkingSpaces"), "Gemeente Amsterdam"),
  "credits.piccLinesSpwService": () => cr(W("lines"), "SPW", { detail: ["PICC"], note: ["Service public de Wallonie", "CC BY 4.0"] }),
  "credits.planimetryCityHlohovec": () => cr(W("planimetry"), "mesto Hlohovec"),
  "credits.roadInventoryCityBanska": () => cr(W("roadInventory"), "mesto Banská Bystrica"),
  "credits.roadInventoryCityBratislava": () => cr(W("roadInventory"), "Hlavné mesto SR Bratislava a MČ Dúbravka, © EUROSENSE SLOVAKIA, s.r.o."),
  "credits.roadInventoryCityZilina": () => cr(W("roadInventory"), "mesto Žilina"),
  "credits.roadInventoryMestoKosice": () => cr(W("roadInventory"), "mesto Košice"),
  "credits.roadsCarParksGrass": () => cr(W("roadsCarParksGrass"), "GKÚ Bratislava", { note: ["ZBGIS", "CC BY 4.0"] }),
  "credits.roadsPavedAreasCity": () => cr(W("roadsPavedAreas"), "mesto Zvolen"),
  "credits.streetSurfacesFeinkartierungStra": () => cr(W("streetSurfaces"), "Freie und Hansestadt Hamburg", { detail: ["Feinkartierung Straße"], note: ["dl-de/by-2-0"] }),
  "credits.streetSurfacesStraEnbefahrung": () => cr(W("streetSurfaces"), "Geoportal Berlin", { detail: ["Straßenbefahrung 2014"], note: ["dl-de/zero-2-0"] }),
  "credits.streetSurfacesStraEndatenbank": () => cr(W("streetSurfaces"), "Stadt Aachen", { detail: ["Straßendatenbank"], note: ["dl-de/zero-2-0"] }),
  "credits.surfaceMapAyuntamientoDe": () => cr(W("surfaceMap"), "Ayuntamiento de Zaragoza", { note: ["IDEZar"] }),
  "credits.surfaceMapCartaTecnica": () => cr(W("surfaceMap"), "Comune di Bologna", { detail: ["Carta tecnica comunale"], note: ["CC BY 4.0"] }),
  "credits.surfaceMapCityCambridge": () => cr(W("surfaceMap"), "City of Cambridge GIS", { note: ["ODC PDDL"] }),
  "credits.surfaceMapDatabaseTopografico": () => cr(W("surfaceMap"), "Regione Lombardia", { detail: ["Database Topografico"], note: ["CC BY 4.0"] }),
  "credits.surfaceMapFmzkStadt": () => cr(W("surfaceMap"), "Stadt Wien – data.wien.gv.at", { detail: ["FMZK"], note: ["CC BY 4.0"] }),
  "credits.surfaceMapMjoGmina": () => cr(W("surfaceMap"), "Gmina Miejska Kraków", { detail: ["MJO"] }),
  "credits.surfaceMapNycPlanimetric": () => cr(W("surfaceMap"), "NYC Office of Technology and Innovation", { detail: ["NYC Planimetric Database 2022"], note: ["NYCmaps", "NYC Open Data"] }),
  "credits.surfaceMapPlanDe": () => cr(W("surfaceMap"), "Ville de Paris", { detail: ["Plan de voirie"] }),
  "credits.surfaceMapPlanimetrics2023": () => cr(W("surfaceMap"), "DC GIS, Office of the Chief Technology Officer", { detail: ["Planimetrics 2023"], note: ["CC BY 4.0"] }),
  "credits.surfaceMapRightWay": () => cr(W("surfaceMap"), "City and County of San Francisco, DataSF, SFMTA", { detail: ["Right of Way, Curbs, Building Footprints"], note: ["PDDL"] }),
  "credits.surfaceMapStreetEdges": () => cr(W("surfaceMap"), "City of Boston", { detail: ["Street Edges, Sidewalk Inventory", W("buildings")], note: ["ODC PDDL"] }),
  "credits.surfaceMapTopographicAreas": () => cr(W("surfaceMap"), "Vilniaus miesto savivaldybė / Vilniaus planas", { detail: [`${W("topographicAreas")} 1 : 500`] }),
  "credits.surfaceMapYleistenAlueiden": () => cr(W("surfaceMap"), "Helsingin kaupunki", { detail: ["Yleisten alueiden rekisteri"], note: ["CC BY 4.0"] }),
  "credits.tallinnSurfaceMapTar": () => cr(W("surfaceMap"), "Tallinna Linnaplaneerimise Amet", { detail: ["tar_maakate", asOf("11/2026")] }),
  "credits.technicalMapCityBratislava": () => cr(W("technicalMap"), "Hlavné mesto SR Bratislava"),
  "credits.trafficSignsStadtSalzburg": () => cr(W("trafficSigns"), "Stadt Salzburg", { note: ["CC BY 3.0 AT"] }),
  "credits.orthophotoBronLuchtopnamenDigitaal": () => quoted(W("orthophoto"), "Bron: Luchtopnamen Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0)"),
  "common.orthophotoIndeholderDataFra": () => quoted(W("orthophoto"), "Indeholder data fra Styrelsen for Dataforsyning og Infrastruktur, Ortofoto forår, WMTS-tjeneste"),
  "credits.grbLinesBronGrootschalig": () => quoted(W("lines"), "Bron: Grootschalig Referentie Bestand Vlaanderen, Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0)", "GRB"),
  "credits.trafficSignsContainsPublic": () => quoted(W("trafficSigns"), "Contains public sector information licensed under the Open Government Licence v1.0 (UK Department for Transport)"),
  "credits.surfaceMapContainsInformation": () => quoted(W("surfaceMap"), "Contains information licensed under the Open Government Licence – Toronto."),
};
// A credit by its id (a layer's credit: "credits.orthophotoSpwServicePublic"); an id that is none is the text itself.
export const creditText = (id) => CR[id]?.() ?? id;

// ---------- The cities' credits (data.js cityTexts): the line of data a city's own sources are credited by ----------
const ruian = () => cr("RÚIAN", "ČÚZK", { year: 2026, note: ["CC BY 4.0", modified()] });
const dmvs = (region) => `${cr(W("technicalMap"), region)}, IS DMVS ČÚZK`;
// "data © {holder} ({items})": the items are words, the line goes on with what follows.
const dataOf = (holder, ...groups) => `${W("data")} © ${holder} (${groups.join("; ")})`;
export const CITY_CREDIT = {
  praha: () => `${W("data")} © ${list([`IPR Praha (${list([W("technicalMap"), W("storeys"), W("builtUpAge")])})`, `TSK hl. m. Prahy (${W("parking")})`,
    `MHMP, Geoportál Praha (${list([W("trees"), W("streetSections")])})`])}, CC BY 4.0, ${modified()}`,
  brno: () => `${W("data")} © Statutární město Brno (${list([W("technicalMap"), "MTVU"])}; ${list([W("buildings"), W("cycleMeasures")])}, data.brno.cz, CC BY 4.0, ${modified()}), ${cr(W("parking"), "parkovanivbrne.cz")}`,
  cesko: () => `${dmvs("{kraj}")}, ${ruian()}`,
  "frydek-mistek": () => `${dataOf("Statutární město Frýdek-Místek", list([W("roadInventory"), W("greenInventory"), W("furniture"), W("lighting")]))}, ${dmvs("Moravskoslezský kraj")}, ${ruian()}`,
  jihlava: () => `${dataOf("Statutární město Jihlava", [W("roadInventory"), `${W("parking")} CC BY-SA`, W("furniture")].join(", "))}, ${cr(list(["RÚIAN", W("cadastre")]), "ČÚZK", { year: 2026, note: ["CC BY 4.0", modified()] })}`,
  karvina: () => `${dataOf("Statutární město Karviná", [list([W("roadInventory"), W("greenInventory")]), W("technicalMap"), W("furniture"), W("lighting")].join(", "))}, ${dmvs("Moravskoslezský kraj")}, ${ruian()}`,
  most: () => `${dataOf("Statutární město Most", `${list([W("objectMap"), W("publicLighting")])}, CC BY-SA; ${W("technicalMap")}`)}, ${ruian()}`,
  netherlands: () => `${cr(W("buildings"), "Kadaster", { note: ["BAG"] })}, ${cr("3D BAG", "TU Delft, 3DGI", { note: ["CC BY 4.0"] })}`,
  opava: () => `${dataOf("Statutární město Opava", [W("thematicMap"), W("parking"), W("trees"), W("benches"), W("stops")].join(", "))}, ${ruian()}`,
  ostrava: () => `${dataOf("Statutární město Ostrava", [`${W("technicalMap")} – ${W("generalisation")}`, W("tramTrackAxes"), W("paidParkingSections")].join(", "))}, ${ruian()}`,
  pardubice: () => `${dmvs("Pardubický kraj")}, ${ruian()}`,
  plzen: () => `${dataOf("Statutární město Plzeň", [W("technicalMap"), W("buildings3d"), list([W("greenInventory"), W("furniture")]), W("parkingZones")].join(", "))}, ${ruian()}`,
  prerov: () => `${dataOf("Statutární město Přerov", [W("technicalMap"), W("vectorTiles")].join(", "))}, ${ruian()}`,
  slovensko: () => cr(W("buildings"), "GKÚ Bratislava", { note: ["ZBGIS", "CC BY 4.0"] }),
  trebic: () => `${dataOf("Město Třebíč", [W("roadInventory"), W("publicLighting"), W("benches")].join(", "))}, ${dmvs("Kraj Vysočina")}, ${ruian()}`,
  usti: () => `${dmvs("Ústecký kraj")}, ${cr(W("parkingSpaces"), "Statutární město Ústí nad Labem")}, ${ruian()}`,
};
// The credit lines the export adds beside a city's: the DMVS's technical map of a region, RÚIAN.
export const dmvsCredit = (kraj) => dmvs(kraj);
export const ruianCredit = ruian;
// The networks' credit ("Sítě © …", site.js): the word capitalised, ending with a full stop.
export const networks = (holder, ...note) => `${ucfirst(W("networks"))} ©${` ${holder}`}${note.length ? ` (${note.join(", ")})` : ""}.`;
