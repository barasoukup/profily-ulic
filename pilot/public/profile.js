// SVG drawing and direct editing of a street profile. Drawing units are centimetres,
// matching the Streetmix illustrations (1 px = 1 cm).
import { TYPES, SOURCES, PARKING_USE, PARKING_POSITION, TRAM_BEDS, TURNS, HDV_UNDER, LAMP_H, underSize } from "./types.js";
import { city, country, cityById, CITY_IDS, creditLines } from "./city.js";
import { COUNTRIES } from "./countries/index.js";
import { GENERIC_VEHICLES } from "./art.js";
import { PLATES, signFile, plateFile, signLabel, signDir, SPEED_TEMPLATES } from "./signs.js";
// tr: t is a part's type here.
import { t as tr, num } from "./i18n.js";
import { LOOKS, houseHash } from "./house-looks.js";
import { AMERICA, AMERICA_PALETTES, drawAmerican } from "./houses-america.js";

const NS = "http://www.w3.org/2000/svg";
const GROUND = 760; // roadway surface
const SIGN_SIZE = 125; // traffic signs under the labels in an export: width of a basic sign (cm)
const CURB = 15;
const EDGE = 400; // width drawn for the building / open edge
const FLOOR = 3.5; // typical floor height for estimating floors from a building's height (m)
const H = 1000;
// How far the rows under the ground (sources, labels, signs) move down to make room for the networks under the
// street (site.js, a trial): 0 without them.
let DROP = 0;

const SPRITE_FILES = [
  "car-inbound", "car-outbound", "streetcar-inbound", "streetcar-outbound", "bus-inbound", "bus-outbound",
  "biker-01-inbound", "biker-01-outbound", "people-01", "people-05", "people-12", "people-20", "people-27",
  "tree", "bush",
  "car-sideways-left", "car-sideways-right", "car-angled-front-left", "car-angled-front-right",
  "bench-center", "cafe-seating-occupied", "bike-rack-perpendicular-left", "bikeshare-left",
  "transit-shelter-01-left", "transit-shelter-01-right", "bollard", "planter-box", "guardrail",
  "lamp-modern-left", "lamp-modern-right",
];
const PEOPLE = ["people-01", "people-05", "people-12", "people-20", "people-27"];
// Prague illustrations (praha/) standing in for Streetmix ones; the rest stays Streetmix.
const PRAHA = {
  "streetcar-inbound": "t3-inbound", "streetcar-outbound": "t3-outbound", "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
  "transit-shelter-tram-left": "transit-shelter-tram-left", "transit-shelter-tram-right": "transit-shelter-tram-right",
  "tram-pole-left": "sloup-trakce-left", "tram-pole-right": "sloup-trakce-right",
  "tram-pole-lamp-left": "sloup-trakce-lampa-left", "tram-pole-lamp-right": "sloup-trakce-lampa-right",
  "stop-post-left": "oznacnik-left", "stop-post-right": "oznacnik-right",
  "stop-post-tram-left": "oznacnik-tram-left", "stop-post-tram-right": "oznacnik-tram-right",
  // Rainwater management (Bára 12. 11. 2026): a shelter with a green roof, the planting of a swale, reeds of a pond.
  "transit-shelter-green-left": "transit-shelter-green-left", "transit-shelter-green-right": "transit-shelter-green-right",
  "swale-plants": "pruleh-rostliny", "reeds-left": "rakos-left", "reeds-right": "rakos-right",
};
// Brno illustrations (brno/): the tram Tatra T3 in DPMB colours (Bára: the nicest; 45T and 13T drawn too) and bus, and furniture after the
// rules of Brno's city architect (KAM, Principy tvorby veřejných prostranství, kap. 9): anthracite steel,
// wooden slats, a slim glass stop shelter, a stainless bike rack. Houses are drawn as in Prague.
const BRNO = {
  "streetcar-inbound": "t3-inbound", "streetcar-outbound": "t3-outbound", "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
  "transit-shelter-tram-left": "transit-shelter-tram-left", "transit-shelter-tram-right": "transit-shelter-tram-right",
  "tram-pole-left": "sloup-trakce-left", "tram-pole-right": "sloup-trakce-right",
  "tram-pole-lamp-left": "sloup-trakce-lampa-left", "tram-pole-lamp-right": "sloup-trakce-lampa-right",
  "stop-post-left": "oznacnik-left", "stop-post-right": "oznacnik-right",
  "stop-post-tram-left": "oznacnik-tram-left", "stop-post-tram-right": "oznacnik-tram-right",
  // Rainwater management (Bára 12. 11. 2026): a shelter with a green roof, the planting of a swale, reeds of a pond.
  "transit-shelter-green-left": "transit-shelter-green-left", "transit-shelter-green-right": "transit-shelter-green-right",
  "swale-plants": "pruleh-rostliny", "reeds-left": "rakos-left", "reeds-right": "rakos-right",
};
// Every other city brings its own map of illustrations (city.js artMap, files in pilot/public/<art>/).
const CITY_ART = { praha: PRAHA, brno: BRNO };
for (const id of CITY_IDS) { const c = cityById(id); if (c.artMap) CITY_ART[c.art] = c.artMap; }
// The states' sets of their cities (countries/<ISO>.js art: the Slovak and Austrian cities' vehicles, city.js art).
for (const c of Object.values(COUNTRIES)) Object.assign(CITY_ART, c.art);
// A set without a tram or a bus of its own draws the neutral ones (art.js GENERIC_VEHICLES).
for (const [k, v] of Object.entries(CITY_ART)) CITY_ART[k] = { ...GENERIC_VEHICLES, ...v };
// The illustrations of the current cut's city, or Streetmix's (the switch "Ilustrace" off).
let artOn = true;
const artKey = () => (artOn ? city.art : "streetmix");
const cityArt = () => artOn && !!CITY_ART[city.art]; // the city's own set
// The set of illustrations of an art folder (tests).
export const artSet = (art) => CITY_ART[art];
// The credit lines of an export or a saved file for the current city and art (src: the cut's sources, app.js).
export const exportCredits = (src) => creditLines(city, src || {}, cityArt());
// Prague buildings are drawn from the side (we look along the street): the outline tells the type.
// nizky: a smaller town house (lower storeys and windows, mostly a gabled tile roof), with any number of floors
// (Bára: "nízký" was wrong on 4 floors).
// More looks (Bára 16. 11. 2026, from the data of Czechia): the family houses by age (a villa or older house, the
// "cube" of the 1960s–80s, a new one), a village house with its gable to the street, the socialist-realist house of
// the 1950s, the office building. The socialist looks (sorela, typovy, the panel house) only where they were built
// (socialistLooks below); elsewhere the postwar block of flats (povalecny, Bára 23. 11. 2026). Each is drawn on the base of an older look (BASE_STYLE) with its own details.
export const BUILDING_STYLES = {
  sikma: tr("činžovní dům se šikmou střechou"), sorela: tr("dům 50. let (sorela)"), funkce: tr("funkcionalistický činžák"),
  plocha: tr("panelový dům"), moderni: tr("moderní bytový dům"), kancelar: tr("kancelářská budova"), nizky: tr("městský dům"),
  typovy: tr("zděný bytový dům 50.–60. let"), povalecny: tr("poválečný bytový dům"), vila: tr("vila, starší rodinný dům"), kostka: tr("rodinný dům 60.–80. let"), novyrd: tr("nový rodinný dům"),
  statek: tr("venkovský dům štítem do ulice"), mestan: tr("měšťanský dům na náměstí"), skola: tr("škola"),
  kostel: tr("kostel"), garaz: tr("garáž"), hala: tr("hala"),
  // The regional looks of Europe's old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026), given by
  // the states' houseLook; by hand anywhere. The gabled ones (stit, hanza) only with ?stit=1 (LOOKS.gables).
  haussmann: tr("haussmannovský dům"), stredomori: tr("středomořský městský dům"), azulejo: tr("portugalský dům s obkladem azulejos"),
  galeria: tr("dům s prosklenou galerií"), malta: tr("maltský dům s dřevěným balkonem"), kypr: tr("kyperský kamenný dům"),
  cihlovy: tr("cihlový dům s římsou"), stit: tr("cihlový dům se štítem do ulice"), dansky: tr("dánský cihlový činžák"),
  stenstad: tr("severský omítaný činžák"), drevak: tr("malovaný dřevěný dům"), puukaupunki: tr("dřevěný městský dům"),
  tallinnamaja: tr("tallinnský dům"), hanza: tr("hanzovní dům se štítem"),
  // North America (houses-america.js, docs/house-types-north-america.md; Bára 25. 11. 2026), given by the states' houseLook.
  bayrow: tr("cihlový řadový dům s arkýřem"), porchrow: tr("řadový dům s verandou"), framehouse: tr("americký dům s verandou"),
  brickblock: tr("americký cihlový bytový dům"), slab: tr("americký deskový bytový dům"), podium: tr("bytový dům nad obchody"),
  glasstower: tr("prosklená věž"), mainstreet: tr("americký dům s obchodem v přízemí"), stripmall: tr("přízemní obchody"),
  brownstone: tr("newyorský dům z hnědého pískovce"), tenement: tr("newyorský činžák s požárním schodištěm"), tripledecker: tr("bostonský třípodlažní dřevěný dům"),
  baygable: tr("torontský dům s arkýřem a štítem"), victorian: tr("sanfranciský viktoriánský dům"),
};
// The gabled looks draw a licence Bára has yet to approve: offered by hand only with ?stit=1.
export const GABLE_LOOKS = new Set(["stit", "hanza"]);
const BASE_STYLE = { sorela: "sikma", typovy: "sikma", mestan: "sikma", kancelar: "plocha", vila: "nizky", kostka: "nizky", novyrd: "nizky", statek: "nizky",
  // The regional looks: four drawings of their own (stredomori, cihla, drevo) and the tenement's (sikma).
  haussmann: "sikma", stenstad: "sikma", stredomori: "stredomori", azulejo: "stredomori", galeria: "stredomori", malta: "stredomori", kypr: "stredomori",
  cihlovy: "cihla", stit: "cihla", dansky: "cihla", hanza: "cihla", drevak: "drevo", puukaupunki: "drevo", tallinnamaja: "drevo",
  ...Object.fromEntries(Object.keys(AMERICA).map((k) => [k, "america"])) };
const MED_LOOKS = new Set(["stredomori", "azulejo", "galeria", "malta", "kypr"]);
const REGIONAL = new Set(Object.keys(BASE_STYLE).filter((k) => ["stredomori", "cihla", "drevo"].includes(BASE_STYLE[k]) || k === "haussmann" || k === "stenstad"));
const OLD_STYLES = { centrum: "sikma", "centrum-obchod": "sikma", sidliste: "plocha", "sidliste-lodzie": "plocha", rd: "vila" };
const HOUSE_TYPES = new Set(["house", "detached", "semidetached_house", "terrace", "bungalow", "villa", "farm", "garage", "garages", "shed"]);
const FAMILY_TYPES = new Set(["house", "detached", "semidetached_house", "terrace", "bungalow", "villa"]);
const FARM_TYPES = new Set(["farm", "farmhouse"]);
const CHURCH_TYPES = new Set(["church", "cathedral", "chapel", "religious", "synagogue", "mosque", "temple", "monastery"]);
const SCHOOL_TYPES = new Set(["school", "kindergarten"]);
const GARAGE_TYPES = new Set(["garage", "garages", "carport"]);
const HALL_TYPES = new Set(["retail", "supermarket", "industrial", "manufacture", "warehouse", "hangar", "sports_hall", "service", "commercial_hall"]);
const HALL_AREA = 1200; // m²: a footprint this big on up to 3 floors reads as a hall
const FLAT_RESIDENTIAL = new Set(["apartments", "residential", "dormitory"]); // flat-roofed homes get balconies
// IPR "Podlažnosti" roof shape (domain URK_STRECHA): 1 pitched, 3 flat, 4 atypical (mix), 5 dome, 99 unknown.
const IPR_ROOF = { 1: "sikma", 3: "plocha", 5: "sikma" };
// Within innerKm of the centre an unknown building is taken for a pitched-roof tenement, from estateKm
// for a panel house; a town has its own (city.js innerKm, estateKm; Most has no old inner town).
const innerKm = () => city.innerKm ?? 3;
const STOREY = { sikma: 360, sorela: 330, typovy: 300, povalecny: 290, mestan: 330, skola: 380, kostel: 1000, garaz: 260, funkce: 310, moderni: 300, plocha: 280, kancelar: 330, nizky: 300, vila: 300, kostka: 280, novyrd: 280, statek: 280, hala: 700,
  haussmann: 330, stredomori: 340, azulejo: 320, galeria: 330, malta: 360, kypr: 380, cihlovy: 310, stit: 310, dansky: 300, stenstad: 330, drevak: 270, puukaupunki: 290, tallinnamaja: 290, hanza: 320 }; // typical storey (cm); a hall is one tall storey
const DEFAULT_FLOORS = { sikma: 5, sorela: 5, typovy: 4, povalecny: 5, mestan: 3, skola: 3, kostel: 1, garaz: 1, funkce: 6, moderni: 6, plocha: 8, kancelar: 5, nizky: 1, vila: 2, kostka: 2, novyrd: 2, statek: 1, hala: 1,
  haussmann: 7, stredomori: 5, azulejo: 4, galeria: 5, malta: 3, kypr: 2, cihlovy: 4, stit: 4, dansky: 5, stenstad: 5, drevak: 2, puukaupunki: 1, tallinnamaja: 3, hanza: 3 };
const PITCH = Math.tan((40 * Math.PI) / 180);
const RIDGE = 260; // ridge of a family house, from its street facade (cm)
// Side windows: width and gap (cm), sill and height as a share of the storey.
const WINDOWS = { sikma: { w: 85, gap: 60, sill: 0.24, h: 0.56 }, plocha: { w: 120, gap: 50, sill: 0.3, h: 0.45 },
  nizky: { w: 85, gap: 70, sill: 0.3, h: 0.45 }, funkce: { w: 110, gap: 60, sill: 0.3, h: 0.5 }, moderni: { w: 120, gap: 40, sill: 0.05, h: 0.8 }, hala: {},
  sorela: { w: 90, gap: 70, sill: 0.28, h: 0.52 }, typovy: { w: 100, gap: 80, sill: 0.3, h: 0.47 }, povalecny: { w: 130, gap: 50, sill: 0.33, h: 0.45 }, mestan: { w: 80, gap: 90, sill: 0.3, h: 0.45 }, vila: { w: 90, gap: 70, sill: 0.3, h: 0.47 }, kostka: { w: 140, gap: 60, sill: 0.32, h: 0.42 },
  novyrd: { w: 110, gap: 50, sill: 0.1, h: 0.72 }, statek: { w: 70, gap: 90, sill: 0.32, h: 0.4 },
  // The regional looks (docs/house-types-europe.md): French windows to the floor in Paris and the south, the big sash
  // windows of the North Sea close together, small ones in the Hanseatic and wooden houses.
  haussmann: { w: 115, gap: 100, sill: 0.04, h: 0.7 }, stredomori: { w: 100, gap: 100, sill: 0.04, h: 0.72 }, azulejo: { w: 95, gap: 85, sill: 0.05, h: 0.7 },
  galeria: { w: 100, gap: 100, sill: 0.04, h: 0.72 }, malta: { w: 110, gap: 140, sill: 0.08, h: 0.66 }, kypr: { w: 100, gap: 120, sill: 0.1, h: 0.62 },
  cihlovy: { w: 110, gap: 50, sill: 0.18, h: 0.66 }, stit: { w: 110, gap: 50, sill: 0.18, h: 0.66 }, dansky: { w: 95, gap: 75, sill: 0.28, h: 0.56 },
  stenstad: { w: 100, gap: 90, sill: 0.27, h: 0.56 }, drevak: { w: 90, gap: 110, sill: 0.32, h: 0.45 }, puukaupunki: { w: 90, gap: 100, sill: 0.33, h: 0.47 },
  tallinnamaja: { w: 90, gap: 80, sill: 0.3, h: 0.5 }, hanza: { w: 80, gap: 80, sill: 0.3, h: 0.48 } };
// Roof coverings of the family houses: the cube's sheet or fibre-cement, the new house's anthracite concrete tiles.
const ROOF_OF = { kostka: ["#7a7f84", "#5c6065"], novyrd: ["#44474b", "#2e3033"], kostel: ["#4f5d6b", "#36414c"], // slate
  // The regional looks: Roman tiles of the south, Galicia's slate, the North Sea's black glazed tiles, the Hanseatic
  // red tiles; more by the house (ROOF_PICK).
  haussmann: ["#8d969b", "#6c757a"], stredomori: ["#c0673f", "#9a4c30"], azulejo: ["#c0673f", "#9a4c30"], kypr: ["#c0673f", "#9a4c30"],
  galeria: ["#4f5d6b", "#36414c"], cihlovy: ["#3f4142", "#2c2e2f"], stit: ["#3f4142", "#2c2e2f"], hanza: ["#b0553b", "#8f3f2b"] };
// Coverings that differ house by house: the stone town's sheet painted black or red-brown, Danish slate or red tile,
// the wooden houses' tiles, black or red or grey sheet.
const ROOF_PICK = {
  stenstad: [["#3b3d3f", "#26282a"], ["#7a3b2e", "#5a2a20"]], dansky: [["#4f5960", "#394147"], ["#b65a3c", "#8f4129"]],
  drevak: [["#b0553b", "#8f3f2b"], ["#2e3133", "#1f2224"]], puukaupunki: [["#8d3b2c", "#6e2c20"], ["#7d8387", "#5f6468"]],
  tallinnamaja: [["#7d8387", "#5f6468"], ["#8f3f2b", "#6e2c20"]],
};
// Streetmix-like colours: saturated pastel walls, dark glass with a diagonal glint, cream frames.
const PALETTES = {
  sikma: ["#e7b96a", "#d99a86", "#8fb79a", "#86a9c6", "#e0c98f"],
  // Panel houses: quiet colours (sand, warm grey, grey-blue, muted terracotta), the wall a lighter shade.
  plocha: ["#d2bd97", "#c5bcb0", "#aab6bd", "#c4ab9a"],
  plochaWall: ["#e6dcc4", "#d6e2e6", "#ecd5c7", "#dfe6cf"],
  nizky: ["#efd29a", "#ece4d2", "#e6bfa9"],
  // Functionalist tenements: light smooth plaster (cream, warm white, pale ochre, pale grey).
  funkce: ["#efe6d2", "#ebe7de", "#e8d9bb", "#dfe1dc", "#e6cf9f", "#d3d8cc"],
  // New-built flats: white or light grey render; the accent is anthracite or larch cladding.
  moderni: ["#f2f1ee", "#e4e4e1", "#ecebe6", "#d9dbdc"],
  hala: ["#e0574f", "#3f88c5", "#4caf7d"],
  // Sorela: warm ochre, salmon and sand render over a rusticated ground floor.
  sorela: ["#dcb98c", "#d6a48c", "#cfc69c", "#d9c2a3"],
  // Plain brick blocks of flats of the 1950s–60s (Street View of 25 houses, evaluation/budovy-panel): smooth render in
  // sand, ochre, grey, a pitched tiled roof with chimneys.
  typovy: ["#d8c9a3", "#cfc2a8", "#c9c4b6", "#dcc79a"],
  // Postwar blocks of flats in the west (1946–90): plain light render (off-white, pale grey, pale yellow, pale
  // salmon, grey-green); the balcony fronts in a colour of the time (povalecnyAccent).
  povalecny: ["#ece6d6", "#e2dfd8", "#efe3c2", "#ead6c8", "#d9ded3", "#e6ddcb"],
  povalecnyAccent: ["#6f8796", "#b8664a", "#c9a440", "#6f8f72", "#8a8f94"],
  // Burgher houses on a town square: baroque pastels.
  mestan: ["#f0d58f", "#e9b9a6", "#f2ece0", "#b9cfb4", "#e7c7a0"],
  skola: ["#e8d6a8", "#e2c9b0", "#dfe0d6"],
  kostel: ["#efe9da", "#e9dcbf"],
  garaz: ["#bdb8ae", "#c9c3b5", "#a9aaa5"],
  vila: ["#efd29a", "#ece4d2", "#e6bfa9", "#dfe3d3"],
  // The "cube": brizolit, the rough grey, beige or ochre render of the 1960s–80s.
  kostka: ["#c9c2b2", "#bdb6a6", "#d3c7ad", "#b7bcb4"],
  novyrd: ["#f4f3ef", "#eceae4", "#f1ece2"],
  // A village house: limewash white, ochre or pale grey.
  statek: ["#f1ead9", "#ead9a2", "#e9e6dc"],
  // The regional looks (docs/house-types-europe.md, checked on street photos): Lutetian limestone; the south's ochre,
  // terracotta, yellow, salmon, off-white; azulejo tiles (blue, green, yellow, pink on white); northern Spain's stone or
  // white; Malta's globigerina limestone; Cyprus's sandstone or lime render; brick of the North Sea and Denmark; the
  // Nordic pastels; the wooden houses' paint; the Hanseatic render.
  haussmann: ["#e8dcc4", "#e3d5b8", "#efe6d3", "#ddd0b5", "#e6dccb"],
  stredomori: ["#e0b062", "#c4704f", "#ecd590", "#e8a98c", "#f1ede4", "#e1c27e", "#d7965a"],
  stredomoriShutter: ["#4f6b4a", "#3f6b5a", "#7a5a3c"],
  azulejo: ["#8fb0d6", "#86b3a2", "#efd88f", "#e6bcbc"],
  galeria: ["#b9b2a3", "#efece4", "#c9c2b2"],
  malta: ["#e2c891", "#d8bc7e", "#ead6a6", "#dcc59a"],
  maltaAccent: ["#2f6b3f", "#9c2f2a", "#2f4f7a", "#6b4a30"],
  kypr: ["#d8c39a", "#cdb48a", "#efe9dc"],
  kyprShutter: ["#4f6f5a", "#3d6f8f", "#6b4a30"],
  cihlovy: ["#8a3f2c", "#a24f35", "#6b3a2c", "#b65d3f", "#7a4a3a"],
  stit: ["#8a3f2c", "#a24f35", "#6b3a2c", "#b65d3f", "#7a4a3a"],
  dansky: ["#a64b33", "#9a4430", "#d7b46a", "#cfa95f"],
  stenstad: ["#e2b766", "#e0a184", "#b9c9a4", "#cfcabf", "#ecd9a0", "#e7c3b0", "#b4c0c8"],
  drevak: ["#8d2a1e", "#d9a441", "#e3c06a", "#f2f0ea", "#d5d3cc", "#b5c8a0"],
  puukaupunki: ["#e7c873", "#b5c8a0", "#a8bccc", "#9a3a2a", "#d9a441", "#d9a6a0"],
  tallinnamaja: ["#d9b36a", "#a9bf98", "#8ea4b3", "#e9d79a", "#8a6a4a", "#9aa596"],
  hanza: ["#efeee6", "#e2c27a", "#e6b8a6", "#c8c4bb", "#c9d4b4"],
  ...AMERICA_PALETTES,
};
const ROOF = { tile: "#c25a3c", tileDark: "#8f3f2b", slate: "#4f5d6b", slateDark: "#36414c" };
const BRICK = "#b8644a", SKLEP = "#8e8a82";
const PV_METAL = "#8d9093", PV_SHUTTER = "#d6d2c8"; // the postwar block's door frame and roller shutters
const GLASS = "#2f3557", GLINT = "#454a75", LIT = "#f4d98c", FRAME = "#f6efdf", DOOR = "#7a4f3a", STONE = "#b9ab8f";
export const OFFICE_TYPES = new Set(["office", "commercial", "civic", "government", "public", "school", "university", "hospital", "hotel"]);
const TALL_SHARE = 0.45; // the most of the view's width a building may rise above the ground
let labelTop = -Infinity; // building labels stay below this y (set per drawing in buildSvg)
const sprites = {};
export const setArt = (on) => { artOn = on; };
export const getArt = () => artOn;

// A missing or broken illustration is left out of the drawing instead of stopping the app.
async function loadSprite(key, path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${r.status}`);
    const text = await r.text();
    const vb = text.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    if (!vb) throw new Error("bez viewBox");
    const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
    sprites[key] = { uri, w: vb[2], h: vb[3] };
  } catch (err) {
    console.warn("ilustrace chybí", path, err.message);
  }
}

// Streetmix's sprites once, a city's own set when a cut first lands in it.
const loadedArt = new Set();
export async function loadSprites() {
  const sets = [];
  if (!loadedArt.has("streetmix")) { loadedArt.add("streetmix"); sets.push(...SPRITE_FILES.map((name) => loadSprite(name, `streetmix/${name}.svg`))); }
  const a = city.art;
  if (CITY_ART[a] && !loadedArt.has(a)) { loadedArt.add(a); sets.push(...[...new Set(Object.values(CITY_ART[a]))].map((file) => loadSprite(`${a}/${file}`, `${a}/${file}.svg`))); }
  await Promise.all(sets);
}

const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

const fmt = (m) => num(m) + " m";
export const totalWidth = (p) => p.segments.reduce((a, s) => a + s.width, 0);

// ---------- Rainwater management (types.js water, HDV_UNDER; Bára after Magdalena, 12. 11. 2026) ----------
// Simplified, as Magdalena advised at this scale: a swale is a shallow dip with perennials, a pond a deeper one
// with water, a surface trench gravel to the top; under a part, a trench of gravel, a tank or a shaft in the earth
// below it (schematic depths, not to scale); permeable paving shows its open joints. Blue arrows show where the
// rain runs in from the paved parts beside a swale, a trench or a pond.
const MEDIAN_LAMP = new Set(["delici", "zelen", "stromorad", "tramvaj"]); // parts where a lamp lights both roadways
const PAPER = "#fbfaf6", WATER = "#5b93c7", GRAVEL = "#b8b1a2", PEBBLE = "#8e8778";
const RUNOFF = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "plocha", "parkovani", "pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "cyklopruh", "ochranny_pruh", "cyklostezka", "nastupiste"]);
function pebbles(g, x, y, w, h, r = 2.5) {
  for (let v = y + 5; v < y + h - 2; v += 9) for (let u = x + 5 + ((v / 9) % 2) * 5; u < x + w - 3; u += 11) el("circle", { cx: u, cy: v, r, fill: PEBBLE }, g);
}
function drawWaterPart(g, s, x, w, top, before, after) {
  const edge = Math.min(40, w * 0.2);
  if (s.type === "pruleh" || s.type === "nadrz") {
    const depth = s.type === "pruleh" ? 26 : 62;
    // A pond's banks and bottom are earth with grass (its blue is the palette's, for the water).
    if (s.type === "nadrz") el("rect", { x, y: top, width: w, height: GROUND + 60 - top, fill: "#86b46a" }, g);
    // The dip: the air over it in the paper's colour, its bottom a darker band.
    el("path", { d: `M${x} ${top - 1} L${x + w} ${top - 1} L${x + w - edge} ${top + depth} L${x + edge} ${top + depth} Z`, fill: PAPER }, g);
    el("path", { d: `M${x} ${top} L${x + edge} ${top + depth} L${x + w - edge} ${top + depth} L${x + w} ${top}`, fill: "none", stroke: "#5f8f3a", "stroke-width": 5, "stroke-linejoin": "round" }, g);
    if (s.type === "nadrz") {
      const lvl = top + depth * 0.45, k = (lvl - top) / depth; // the water's level, the banks at that height
      el("path", { d: `M${x + edge * k} ${lvl} L${x + w - edge * k} ${lvl} L${x + w - edge} ${top + depth - 2} L${x + edge} ${top + depth - 2} Z`, fill: "#9cc3e4", opacity: 0.9 }, g);
      el("line", { x1: x + edge * k, x2: x + w - edge * k, y1: lvl, y2: lvl, stroke: WATER, "stroke-width": 3 }, g);
    }
    // Perennials and grasses on the bottom (a swale), reeds at the banks (a pond): the city's pictures where it has
    // them (swale-plants about 1 m wide, reeds-left/right), else a few strokes.
    const swale = s.type === "pruleh", pic = swale ? "swale-plants" : null;
    const plants = swale ? Math.max(1, Math.floor((w - 2 * edge) / (ownSprite("swale-plants") ? 110 : 70))) : 2;
    for (let k = 0; k < plants; k++) {
      const px = swale ? x + edge + ((k + 0.5) * (w - 2 * edge)) / plants : k ? x + w - edge * 0.8 : x + edge * 0.8;
      const py = swale ? top + depth : top + depth * 0.5;
      const own = pic || (k ? "reeds-right" : "reeds-left");
      if (ownSprite(own)) { sprite(g, own, px, py); continue; }
      for (const [dx, h, c] of [[-12, 34, "#4f8a35"], [-4, 46, "#3f7a2d"], [5, 40, "#5f9e3a"], [13, 30, "#4f8a35"]]) {
        el("path", { d: `M${px + dx} ${py} q${dx / 3} ${-h / 2} ${dx / 2} ${-h}`, fill: "none", stroke: c, "stroke-width": 3.5, "stroke-linecap": "round" }, g);
      }
      if (s.type === "pruleh" && k % 2 === 0) el("circle", { cx: px + 2, cy: py - 44, r: 5, fill: "#c98bc4" }, g); // a flower
    }
  } else if (s.type === "ryha") {
    // A surface trench: gravel to the top, a little below the edges.
    el("rect", { x, y: top + 4, width: w, height: 56, fill: GRAVEL }, g);
    pebbles(g, x, top + 4, w, 56);
  }
  // The rain running in from the paved parts beside it.
  const arrow = (ax, dir) => el("path", { d: `M${ax - dir * 26} ${top - 26} q${dir * 14} 0 ${dir * 22} 16 m${-dir * 8} -2 l${dir * 8} 2 l2 -8`, fill: "none", stroke: WATER, "stroke-width": 3.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
  // Not from permeable paving: no other water is led onto it, and its own soaks away (5.1.2).
  if (RUNOFF.has(before?.type) && !before.permeable) arrow(x + 6, 1);
  if (RUNOFF.has(after?.type) && !after.permeable) arrow(x + w - 6, -1);
}
// A rainwater object under a part (segment.under): in the earth below the street at its size and depth (types.js
// underSize; Bára: to see it with the networks), on the same scale and from the same depth 0 as the networks
// (drawNetworks), centred under the part.
function drawUnder(g, s, x, w) {
  const z = underSize(s), zero = NET_TOP + BASE_COURSE, base = GROUND + 104 + DROP;
  const bw = Math.min(w - 8, z.w * 100), bx = x + (w - bw) / 2;
  const y0 = zero + z.top * NET_V, y1 = Math.min(base - 4, y0 + z.h * NET_V);
  const box = el("g", {}, g);
  el("title", {}, box).textContent = tr("{name} {w} × {h} m, {from}–{to} m pod povrchem", { name: HDV_UNDER[s.under].label, w: num(z.w), h: num(z.h), from: num(z.top), to: num(+(z.top + z.h).toFixed(2)) });
  if (s.under === "sachta") {
    el("rect", { x: bx, y: y0, width: bw, height: y1 - y0, fill: "#d9d4c8", stroke: "#7d776b", "stroke-width": 2 }, box);
    for (let v = y0 + 20; v < y1 - 10; v += 22) el("line", { x1: bx, x2: bx + bw, y1: v, y2: v, stroke: "#7d776b", "stroke-width": 1.5 }, box);
    el("rect", { x: bx + 3, y: y1 - 24, width: bw - 6, height: 21, fill: "#9cc3e4" }, box);
  } else if (s.under === "ryha") {
    el("rect", { x: bx, y: y0, width: bw, height: y1 - y0, fill: GRAVEL, stroke: "#7d776b", "stroke-width": 2, "stroke-dasharray": "8 5" }, box);
    pebbles(box, bx, y0, bw, y1 - y0, 2);
  } else if (s.under === "nadrz") {
    el("rect", { x: bx, y: y0, width: bw, height: y1 - y0, rx: 10, fill: "#cfe2f1", stroke: "#4a7fae", "stroke-width": 3 }, box);
    const lvl = y0 + (y1 - y0) * 0.45;
    el("path", { d: `M${bx + 6} ${lvl} q${bw / 8} -6 ${bw / 4} 0 t${bw / 4} 0 t${bw / 4} 0 t${bw / 4 - 12} 0`, fill: "none", stroke: WATER, "stroke-width": 2.5 }, box);
    el("rect", { x: bx + 3, y: lvl + 3, width: bw - 6, height: y1 - lvl - 6, rx: 7, fill: "#9cc3e4", opacity: 0.7 }, box);
  }
}
// Permeable paving (segment.permeable, 5.1.2) and unpaved surfaces: no concrete slab under them (Bára), but a gravel
// bed down to the earth; grass pavers as concrete blocks with grass between them (at first sight something between
// parking and a lawn), an unpaved surface gravel all through.
const GRAVEL_BED = "#cdbf9f", GRAVEL_DOT = "#8e8170", TOPSOIL = "#7a5f43";
const SOIL_PARTS = new Set(["zelen", "stromorad", "predzahradka", "pruleh"]);
function drawPermeable(g, x, w, top, unpaved) {
  el("rect", { x, y: top, width: w, height: GROUND + 60 - top, fill: GRAVEL_BED }, g);
  for (let v = top + (unpaved ? 5 : 32); v < GROUND + 56; v += 8) {
    for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: unpaved ? 1.8 : 2.2, fill: GRAVEL_DOT }, g);
  }
  if (unpaved) return;
  el("rect", { x, y: top, width: w, height: 26, fill: "#7fae55" }, g);
  for (let u = x + 4; u < x + w - 12; u += 24) {
    el("rect", { x: u, y: top + 2, width: 14, height: 24, fill: "#b9b5ab", stroke: "#9a968b", "stroke-width": 1.5 }, g);
    el("path", { d: `M${u + 17} ${top + 1} l2 -7 l2 7 M${u + 20} ${top + 1} l2 -5 l1 5`, fill: "#5f9e3a", stroke: "#5f9e3a", "stroke-width": 1.5 }, g);
  }
}

// Street furniture and barriers standing at x on a surface at height top.
// The surface of a separate tram bed, raised behind curbs (Bára): concrete panels with their joints, gravel
// with the sleepers showing, grass, or asphalt like the roadway (beds used by buses). A curb stone at each end where the bed meets another part.
function drawTramBed(g, s, x, w, top, bedBefore, bedAfter) {
  const kind = TRAM_BEDS[s.bed] ? s.bed : "panely";
  el("rect", { x, y: top, width: w, height: 14, fill: TRAM_BEDS[kind].color }, g);
  if (kind === "panely") {
    for (let u = x + 60; u < x + w - 20; u += 120) el("rect", { x: u, y: top, width: 2, height: 14, fill: "#8d887c" }, g);
  } else if (kind === "strk") {
    // A gravel bed all the way down (Bára: no concrete under it).
    el("rect", { x, y: top + 14, width: w, height: GROUND + 60 - top - 14, fill: GRAVEL_BED }, g);
    for (let v = top + 20; v < GROUND + 56; v += 8) {
      for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: 2, fill: GRAVEL_DOT }, g);
    }
    for (let u = x + 8; u < x + w - 4; u += 14) el("circle", { cx: u, cy: top + 4 + ((u / 14) % 2) * 5, r: 2.5, fill: "#6f6a61" }, g);
    for (let u = x + 30; u < x + w - 30; u += 60) el("rect", { x: u, y: top - 2, width: 26, height: 5, fill: "#5d5247" }, g);
  } else if (kind === "trava") {
    // A green track: no concrete under the grass (Bára, as under permeable paving): topsoil, then a gravel bed with
    // the sleepers in it, down to the earth.
    el("rect", { x, y: top + 14, width: w, height: 22, fill: TOPSOIL }, g);
    el("rect", { x, y: top + 36, width: w, height: GROUND + 60 - top - 36, fill: GRAVEL_BED }, g);
    for (let v = top + 42; v < GROUND + 56; v += 8) {
      for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: 2, fill: GRAVEL_DOT }, g);
    }
    for (let u = x + 30; u < x + w - 30; u += 60) el("rect", { x: u, y: top + 30, width: 26, height: 10, fill: "#8d887c" }, g);
    for (let u = x + 5; u < x + w - 3; u += 9) el("path", { d: `M${u} ${top + 2} l3 -9 l3 9`, fill: "#5f9e3a" }, g);
  }
  const curb = (cx) => el("rect", { x: cx, y: top, width: 12, height: CURB + 8, fill: "#c9c5ba", stroke: "#8d887c", "stroke-width": 1 }, g);
  if (!bedBefore) curb(x);
  if (!bedAfter) curb(x + w - 12);
}

export const ROADWAY = new Set(["pruh", "krajnice", "obsluzna", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "cyklopruh", "ochranny_pruh", "parkovani"]);
// The lanes the contact wires hang over: one each way (Bára, Olomoucká: not over every lane), the trolleybus's own
// (a bus lane under the wires) where there is one, else the outer lane of that direction, the farthest from the
// middle of the wired street; a lane both ways keeps its wires.
function wiredLanes(segs, bounds) {
  const all = segs.map((s, i) => (s.wires ? i : -1)).filter((i) => i >= 0);
  if (!all.length) return all;
  const mid = (bounds[all[0]] + bounds[all.at(-1) + 1]) / 2, off = (i) => Math.abs((bounds[i] + bounds[i + 1]) / 2 - mid);
  const keep = new Set(all.filter((i) => !segs[i].dir));
  for (const dir of ["forward", "backward"]) {
    const way = all.filter((i) => segs[i].dir === dir);
    if (!way.length) continue;
    const own = way.filter((i) => segs[i].trolley);
    for (const i of own.length ? own : [way.reduce((b, i) => (off(i) > off(b) ? i : b))]) keep.add(i);
  }
  return all.filter((i) => keep.has(i));
}

// Which side of an item (at f of part i) the nearest roadway lies on, "left" or "right" (by metres along the
// profile), or null when there is none.
export function nearestRoadway(segs, i, f) {
  let left = Infinity, right = Infinity, d = (f ?? 0.5) * segs[i].width;
  for (let k = i - 1; k >= 0; d += segs[k].width, k--) if (ROADWAY.has(segs[k].type)) { left = d; break; }
  d = (1 - (f ?? 0.5)) * segs[i].width;
  for (let k = i + 1; k < segs.length; d += segs[k].width, k++) if (ROADWAY.has(segs[k].type)) { right = d; break; }
  return left === Infinity && right === Infinity ? null : left <= right ? "left" : "right";
}
// Where the luminaire of the city's lamp picture hangs (m): Brno's at 7.4 m, the others' (Prague's and its copies,
// Streetmix's) at LAMP_H (Fable: Brno's "6 m" came out lower than a 5 m post-top lamp).
const lampLight = () => (artKey() === "brno" ? 7.4 : LAMP_H);
const POLE_SCALE = 0.93; // overhead-line poles: their contact wire (5.9 m in the picture) at WIRE_H
// A span wire (spanPlan) from a pole across the tracks to its other end, with an insulator by each end and a hanger
// down to the contact wire over each track (as the poles' brackets); on a building, a wall rosette.
function spanWire(g, { x, y, end, xs }) {
  const yWire = GROUND - WIRE_H, sg = el("g", { class: "span-wire" }, g), dir = Math.sign(end.x - x);
  const yAt = (cx) => y + ((end.y - y) * (cx - x)) / (end.x - x || 1);
  el("line", { x1: x, y1: y, x2: end.x, y2: end.y, stroke: "#94989a", "stroke-width": 3 }, sg);
  for (const [ix, d] of [[x, dir], ...(end.kind === "free" ? [] : [[end.x, -dir]])]) {
    el("rect", { x: ix + d * 40 - 6, y: yAt(ix + d * 40) - 6, width: 13, height: 13, rx: 2, fill: "#6b4a36" }, sg);
  }
  if (end.kind === "wall") el("circle", { cx: end.x, cy: end.y, r: 9, fill: "#727678", stroke: "#55595b", "stroke-width": 2 }, sg);
  for (const cx of xs) {
    el("line", { x1: cx, x2: cx, y1: yAt(cx), y2: yWire, stroke: "#55595b", "stroke-width": 2.5 }, sg);
    el("circle", { cx, cy: yWire + 2, r: 3.4, fill: "#2f3234" }, sg);
  }
}
function drawItem(g, it, x, top, right) {
  const line = (attrs) => el("rect", attrs, g);
  switch (it.kind) {
    // The lamp's arm reaches over the street: on the right half the arm points left. Its foot (not
    // the middle of the picture) stands at x: x = 348 in the "left" picture, 22 in the "right" one.
    case "lampa": {
      // A lamp of its own height (it.h, m; Bára: a small lamp is not a big one made smaller). From 6 m the city's
      // lamp with its mast longer or shorter: the bracket and luminaire (the top 300 cm of the 930 cm picture) and
      // the foot (its bottom 130 cm) at their size, the mast between them stretched. Up to 5 m a post-top lamp: a
      // slim pole with the luminaire on top, as in parks and quiet streets.
      const name = right ? "lamp-modern-left" : "lamp-modern-right", anchor = right ? 348 : 22;
      if (!it.h) return sprite(g, name, x, top, false, anchor);
      const dark = artKey() === "brno", pole = dark ? "#3d4246" : "#b5b9ba", shade = dark ? "#2c3033" : "#94989a";
      if (it.h <= 5) {
        const head = top - it.h * 100;
        el("path", { d: `M${x - 15} ${top} L${x - 13} ${top - 70} H${x + 13} L${x + 15} ${top} Z`, fill: dark ? "#33373a" : "#727678" }, g);
        el("rect", { x: x - 6, y: head + 30, width: 12, height: it.h * 100 - 100, fill: pole }, g);
        el("rect", { x: x + 2, y: head + 30, width: 4, height: it.h * 100 - 100, fill: shade }, g);
        el("path", { d: `M${x - 30} ${head + 30} L${x - 22} ${head + 8} H${x + 22} L${x + 30} ${head + 30} Z`, fill: dark ? "#3d4246" : "#2f3335" }, g); // the luminaire
        el("rect", { x: x - 26, y: head + 26, width: 52, height: 4, fill: "#b9c2c1" }, g); // its glass, facing down
        el("rect", { x: x - 3, y: head, width: 6, height: 9, rx: 2, fill: dark ? "#3d4246" : "#2f3335" }, g);
        return;
      }
      const d = it.h * 100 - lampLight() * 100, base = top - 930;
      const part = (y0, y1, transform) => {
        const id = `lamp${++clipN}`, og = el("g", transform ? { transform } : {}, g);
        el("rect", { x: x - 400, y: base + y0, width: 800, height: y1 - y0 }, el("clipPath", { id }, og));
        sprite(el("g", { "clip-path": `url(#${id})` }, og), name, x, top, false, anchor);
      };
      part(0, 301, `translate(0 ${-d})`); // the top up or down by d
      part(299, 801, `translate(0 ${base + 800}) scale(1 ${(500 + d) / 500}) translate(0 ${-(base + 800)})`); // the mast
      part(799, 930); // the foot
      return;
    }
    // The Prague bench has its back on the left: on the right half it turns to face the street too.
    case "lavicka": return sprite(g, "bench-center", x, top, right);
    case "strom": return sprite(g, "tree", x, top);
    // A rack across the street shows a bike from its side; one along it (it.along, Magdalena) a bike from the front
    // beside the rack seen edge-on (about 0.8 m of room in a row instead of 1.9 m; app.js spreadItems).
    case "stojan_kola": {
      if (!it.along) return sprite(g, "bike-rack-perpendicular-left", x, top);
      const rack = artKey() === "praha" ? "#3a332e" : "#7c8082", tyre = "#2c2c2c", frame = "#5f7f8e";
      el("rect", { x: x - 8, y: top - 104, width: 16, height: 5, rx: 2.5, fill: tyre }, g); // the saddle, behind and higher
      el("ellipse", { cx: x, cy: top - 33, rx: 4, ry: 32, fill: "none", stroke: tyre, "stroke-width": 4 }, g); // the wheel, edge-on
      el("path", { d: `M${x} ${top - 66} L${x} ${top - 92}`, stroke: frame, "stroke-width": 4, "stroke-linecap": "round" }, g); // the fork
      el("path", { d: `M${x - 30} ${top - 90} Q${x} ${top - 99} ${x + 30} ${top - 90}`, fill: "none", stroke: "#4a4d4f", "stroke-width": 3, "stroke-linecap": "round" }, g);
      for (const d of [-30, 30]) el("rect", { x: x + d - 3, y: top - 93, width: 6, height: 7, rx: 2, fill: tyre }, g); // the grips
      el("circle", { cx: x, cy: top - 82, r: 3.5, fill: "#f2e9a0", stroke: tyre, "stroke-width": 1 }, g); // the lamp
      // The rack beside the wheel, seen edge-on: one tube.
      el("rect", { x: right ? x - 18 : x + 12, y: top - 80, width: 6, height: 80, rx: 3, fill: rack }, g);
      return;
    }
    case "sdilena_kola": return sprite(g, "bikeshare-left", x, top);
    case "pristresek": case "pristresek_zeleny": {
      const side = right ? "right" : "left";
      // A green roof (rainwater management 5.1.1): the city's own picture of it where there is one.
      // (A tram stop keeps its own shelter, with the roof laid on it.)
      if (it.kind === "pristresek_zeleny" && !it.tram && ownSprite(`transit-shelter-green-${side}`)) return sprite(g, `transit-shelter-green-${side}`, x, top);
      // A tram stop's own shelter where the city has one (Prague, Brno), else the bus stop's.
      const name = it.tram && ownSprite(`transit-shelter-tram-${side}`) ? `transit-shelter-tram-${side}` : `transit-shelter-01-${side}`;
      sprite(g, name, x, top);
      if (it.kind === "pristresek_zeleny") greenRoof(g, name, x, top, right);
      return;
    }
    case "sloupek": return sprite(g, "bollard", x, top);
    // Tram overhead-line pole (technical map): a 9 m steel pole with its bracket over the tracks; a street
    // lamp mounted on it (OSM) is drawn with it.
    case "sloup_trakce": {
      // The city's own pole (praha/sloup-trakce-*): its bracket over the tracks, on the right half pointing left;
      // a pole between the tracks (it.center) carries brackets over both (Bára's photo, Prague).
      const lamp = it.lamp ? "-lamp" : "";
      if (ownSprite(`tram-pole${lamp}-left`)) {
        // Scaled so the wire hangs at WIRE_H, where the trams' pantographs and the trolleybuses' poles reach.
        // A pole between the tracks reaches with each bracket to the middle of its track (it.reach, cm; the picture's
        // wire hangs 290 cm from the pole).
        const sx = it.reach ? it.reach / 290 : POLE_SCALE;
        const pg = el("g", { transform: `translate(${x} ${top}) scale(${sx} ${POLE_SCALE}) translate(${-x} ${-top})` }, g);
        // A pole away from the tracks (it.span) holds a span wire to them (spanPlan, drawn with the street), not a bracket (Bára, 17. listopadu): the picture without its bracket (all of the same shape: the
        // shaft, and the lamp above the bracket's tie at 165 cm from the top of the 1010 cm picture).
        if (it.span) {
          const id = `pole${++clipN}`, cp = el("clipPath", { id }, pg);
          el("rect", { x: x - 30, y: top - 1010, width: 60, height: 1010 }, cp);
          el("rect", { x: x - 200, y: top - 1010, width: 400, height: 165 }, cp);
          pg.setAttribute("clip-path", `url(#${id})`);
        }
        if (it.center || !right) sprite(pg, `tram-pole${lamp}-right`, x, top, false, 22);
        if (it.center || right) sprite(pg, `tram-pole${lamp}-left`, x, top, false, 348);
        return;
      }
      if (it.lamp) sprite(g, right ? "lamp-modern-left" : "lamp-modern-right", x, top, false, right ? 348 : 22);
      const arm = right ? -1 : 1;
      el("path", { d: `M ${x - 14} ${top} L ${x - 9} ${top - 900} L ${x + 9} ${top - 900} L ${x + 14} ${top} Z`, fill: "#5b6460" }, g);
      if (it.span) return; // a span wire instead of the bracket (spanPlan)
      line({ x: Math.min(x, x + arm * 260), y: top - 830, width: 260, height: 7, fill: "#5b6460" });
      el("line", { x1: x, y1: top - 760, x2: x + arm * 260, y2: top - 826, stroke: "#5b6460", "stroke-width": 4 }, g);
      return;
    }
    // Stop pole (označník zastávky, technical map).
    case "oznacnik":
      if (ownSprite("stop-post-left")) return sprite(g, `stop-post${it.tram ? "-tram" : ""}-${right ? "right" : "left"}`, x, top);
      line({ x: x - 4, y: top - 280, width: 8, height: 280, fill: "#3d3b36" });
      line({ x: x - 26, y: top - 300, width: 52, height: 64, fill: "#fff", stroke: "#b5302a", "stroke-width": 5 });
      el("text", { x, y: top - 256, "text-anchor": "middle", "font-size": 30, "font-weight": "bold", fill: "#1f1f1d" }, g).textContent = "Z";
      return;
    case "kvetinac": return sprite(g, "planter-box", x, top);
    case "svodidlo": return sprite(g, "guardrail", x, top);
    case "zahradka": return sprite(g, "cafe-seating-occupied", x, top);
    case "zivy_plot": return sprite(g, "bush", x, top);
    case "plot":
      line({ x: x - 4, y: top - 150, width: 8, height: 150, fill: "#6b6a65" });
      for (let k = 0; k < 3; k++) line({ x: x - 30, y: top - 140 + k * 45, width: 60, height: 5, fill: "#6b6a65" });
      return;
    case "zabradli":
      line({ x: x - 3, y: top - 100, width: 6, height: 100, fill: "#55534d" });
      line({ x: x - 40, y: top - 100, width: 80, height: 6, fill: "#55534d" });
      return;
    case "oporna_zed":
      line({ x: x - 15, y: top - 120, width: 30, height: 120, fill: "#a39e92" });
      return;
    case "rozcestnik":
      line({ x: x - 4, y: top - 230, width: 8, height: 230, fill: "#3d3b36" });
      line({ x: x - 40, y: top - 240, width: 80, height: 60, fill: "#2f5f8f" });
      return;
    case "taxi":
      line({ x: x - 4, y: top - 230, width: 8, height: 230, fill: "#3d3b36" });
      line({ x: x - 45, y: top - 250, width: 90, height: 45, fill: "#e8c23a" });
      el("text", { x, y: top - 218, "text-anchor": "middle", "font-size": 30, fill: "#1f1f1d" }, g).textContent = "TAXI";
      return;
    case "svah":
      el("path", { d: `M ${x - 40} ${top} L ${x} ${top - 40} L ${x + 40} ${top} Z`, fill: "#9b7f5f", opacity: 0.6 }, g);
      return;
  }
}

// Direction of the nearest driving lane, so parked cars face the traffic next to them.
function laneDir(segs, i) {
  for (let d = 1; d < segs.length; d++) {
    for (const j of [i - d, i + d]) {
      if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(segs[j]?.type)) return segs[j].dir || "forward";
    }
  }
  return "forward";
}

export const ORIENT_LABEL = { podelne: tr("podélné"), sikme: tr("šikmé"), kolme: tr("kolmé") };
const CAR_TRACK = 170; // wheel to wheel of the parked car's sprite (cm), for its tilt across the kerb
const KERB_PAVING = "#c4c0b4"; // the sidewalk's paving under parked cars, a shade darker than the sidewalk
// On the curb: raised types, and cars parked fully on the sidewalk.
// An empty place left in a design (a deleted part: Neurčeno by the user) lies at road level, no kerbs (Fable).
export const isHole = (s) => s?.type === "nezname" && s.source === "user";
const isRaised = (s) => !!s && !isHole(s) && (!!TYPES[s.type]?.raised || (s.type === "parkovani" && s.position === "on_kerb"));
export const turnLabel = (v) => v.split(";").map((x) => TURNS[x] || x).join(" + ");

// anchor: the picture's x (its own units) that stands at cx; the middle when not given.
// The most even split of a name into two lines (null for one word).
export function twoLines(text) {
  // A name of two things ("Jízdní pruh ↑, piktokoridor ↓") breaks after the comma.
  const comma = text.indexOf(", ");
  if (comma > 0) return [text.slice(0, comma + 1), text.slice(comma + 2)];
  const words = text.split(" ");
  let best = null;
  for (let j = 1; j < words.length; j++) {
    const a = words.slice(0, j).join(" "), b = words.slice(j).join(" ");
    if (!best || Math.max(a.length, b.length) < Math.max(best[0].length, best[1].length)) best = [a, b];
  }
  return best;
}

// A tram with its pantograph raised to the contact wire (WIRE_H, as the trolleybuses' wires; Bára): the picture is
// drawn up to its roof (PANTO_CUT of the 420 high picture), its own lowered pantograph left out, and the pantograph
// is drawn from the roof to the wire, seen from the front and so symmetric (Bára), 1 px = 1 cm, after photos of the
// trams themselves (scratchpad sberace-1): the head 1.95 m wide with its two contact strips and the horns bent down.
const WIRE_H = 550, PANTO_CUT = 92;
// Trams with the older diamond pantograph (art folder/file, checked on photos): Prague's T3R.P. Brno's T3R.PV and
// T3R.EV carry a single-arm one today (photos of 1560, 1603, 1658), as the low-floor trams do.
const DIAMOND = new Set(["praha/t3-inbound", "praha/t3-outbound"]);
// The frame's paint by city: yellow on the trams of Prague, Brno, Plzeň, Ostrava, Olomouc and Liberec; the Most EVO2
// and Streetmix's streetcar have a dark one.
const PANTO_YELLOW = new Set(["praha", "brno", "plzen", "ostrava", "olomouc", "liberec"]);
let clipN = 0;
function tramSprite(g, name, cx, bottom) {
  const s = (cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`]) || sprites[name];
  if (!s) return;
  const k = s.h / 420, x = cx - s.w / 2, y = bottom - s.h, roof = y + PANTO_CUT * k + 6;
  const head = bottom - WIRE_H, id = `pc${++clipN}`;
  el("rect", { x, y: roof - 8, width: s.w, height: bottom - roof + 8 }, el("clipPath", { id }, el("defs", {}, g)));
  const ink = "#2a2c2e", rise = roof - head, base = roof - 8;
  const yellow = PANTO_YELLOW.has(artKey());
  const col = yellow ? "#e3b324" : "#44474a", edge = yellow ? "#a37f10" : "#1f2123";
  const p = el("g", { stroke: col, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
  const diamond = DIAMOND.has(`${artKey()}/${CITY_ART[artKey()]?.[name] || name}`);
  // The base frame on the roof, on its insulators (four under a diamond, two under a single arm).
  const bw = diamond ? 64 : 40;
  for (const dx of diamond ? [-52, -22, 22, 52] : [-28, 28]) el("rect", { x: cx + dx - 3, y: roof - 13, width: 6, height: 7, rx: 1.5, fill: "#8d8f8c", stroke: "none" }, p);
  el("rect", { x: cx - bw, y: roof - 8, width: 2 * bw, height: 6, rx: 2, fill: ink, stroke: "none" }, p);
  if (diamond) {
    // The diamond (Prague T3R.P) seen from the front is a rectangle (Bára's photos, T3 7232): two upright parallel
    // posts about 1.15 m apart from the base frame to the head, a thin cross between them.
    const w = 58, top = head + 12;
    el("path", { d: `M${cx - w} ${base} V${top} M${cx + w} ${base} V${top}`, "stroke-width": 3 }, p);
    // The cross only in the upper half (Bára).
    const mid = (base + top) / 2;
    el("path", { d: `M${cx - w} ${mid} L${cx + w} ${top} M${cx + w} ${mid} L${cx - w} ${top}`, "stroke-width": 1.5 }, p);
  } else {
    // A single-arm pantograph (Škoda, EVO, Stadler, the modernised T3s): from the front the lower arm is one thick
    // column up to the knee, the upper arm a narrow V opening to the head, with the thin rocker rods crossing it.
    const knee = roof - rise * 0.5;
    el("path", { d: `M${cx - 9} ${base} L${cx - 6} ${knee} H${cx + 6} L${cx + 9} ${base} Z`, fill: col, stroke: edge, "stroke-width": 1 }, p);
    el("rect", { x: cx - 19, y: knee - 4, width: 38, height: 8, rx: 3, fill: col, stroke: edge, "stroke-width": 1 }, p);
    el("path", { d: `M${cx - 15} ${knee} L${cx - 44} ${head + 14} M${cx + 15} ${knee} L${cx + 44} ${head + 14}`, "stroke-width": 4.5 }, p);
    el("path", { d: `M${cx - 36} ${head + 10} L${cx + 12} ${knee - 4} M${cx + 36} ${head + 10} L${cx - 12} ${knee - 4}`, stroke: ink, "stroke-width": 1.2 }, p);
    el("path", { d: `M${cx - 44} ${head + 14} L${cx - 56} ${head + 8} M${cx + 44} ${head + 14} L${cx + 56} ${head + 8}`, stroke: ink, "stroke-width": 2.5 }, p);
  }
  // The head: the bow with its horns bent down (1.95 m wide; the T3's about 1.6 m, its ends bent down a little),
  // the two contact strips on it touching the wire.
  if (diamond) el("path", { d: `M${cx - 82} ${head + 15} L${cx - 76} ${head + 8} H${cx + 76} L${cx + 82} ${head + 15}`, stroke: ink, "stroke-width": 4 }, p);
  else el("path", { d: `M${cx - 97} ${head + 32} Q${cx - 95} ${head + 12} ${cx - 80} ${head + 9} H${cx + 80} Q${cx + 95} ${head + 12} ${cx + 97} ${head + 32}`, stroke: ink, "stroke-width": 4.5 }, p);
  el("rect", { x: cx - 62, y: head, width: 124, height: 3.5, rx: 1, fill: ink, stroke: "none" }, p);
  el("rect", { x: cx - 62, y: head + 5, width: 124, height: 2.5, rx: 1, fill: "#6b6e6a", stroke: "none" }, p);
  el("image", { href: s.uri, width: s.w, height: s.h, x, y, "clip-path": `url(#${id})` }, g);
}

// The current city's own sprite of a name, or undefined (poles and stop posts have no Streetmix stand-in).
const ownSprite = (name) => cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`];
function sprite(g, name, cx, bottom, flip = false, anchor = null) {
  const s = (cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`]) || sprites[name];
  if (!s) return;
  const img = el("image", { href: s.uri, width: s.w, height: s.h, x: cx - (anchor ?? s.w / 2), y: bottom - s.h }, g);
  if (flip) img.setAttribute("transform", `translate(${2 * cx} 0) scale(-1 1)`);
}

// Building height in metres: tagged in OSM, else from floors (FLOOR per floor).
export function buildingHeight(info) {
  if (!info) return null;
  return info.height || (info.levels ? info.levels * FLOOR : null);
}

// Floors: IPR "Podlažnosti" (cornice + roof floors) or OSM building:levels.
// A building's data with the floors set by hand (edges.leftLevels, Bára 12. 11. 2026): they stand for the data's
// floors and height.
export const edgeInfo = (edges, side) => {
  const info = edges?.[`${side}Info`], n = edges?.[`${side}Levels`];
  return n ? { ...info, levels: n, cornice: undefined, roof: undefined, height: undefined } : info;
};

export function buildingLevels(info) {
  if (!info?.levels) return null;
  return { n: info.levels, cornice: info.cornice, roof: info.roof };
}

// Building style: set by hand, else from IPR (roof shape, kind of object, footprint) and the OSM building type.
// Checked on the 100 sample cuts (evaluation/data/budovy3-hodnoceni-*.md).
export function buildingStyle(info, chosen) {
  const set = OLD_STYLES[chosen] || chosen;
  if (BUILDING_STYLES[set]) return set;
  const style = derivedStyle(info);
  const look = socialistLooks() ? style : westernLook(style, info, OFFICE_TYPES.has(info?.type) || !!info?.office);
  // The state's regional look of an old house (countries/<ISO>.js houseLook, house-looks.js): after westernLook, it
  // replaces only the old looks its rule names; Czechia has none (Czech output unchanged).
  if (!country.houseLook) return look;
  const h = buildingHeight(info);
  const regional = country.houseLook(look, info, info?.levels || (h ? Math.round(h / FLOOR) : null), city);
  return BUILDING_STYLES[regional] ? regional : look;
}
// What the state changes in drawing a look (countries/<ISO>.js houseDetails): a terrace or a tile roof, Spain's roller
// blinds, upright or horizontal boards, its own colours.
const houseDetails = (kind, info) => (country.houseDetails && country.houseDetails(kind, info, city)) || {};
// The socialist looks (sorela, the plain brick block of the 1950s–60s, the panel house) only where they were built
// (Bára 23. 11. 2026): countries/<ISO>.js socialistLooks, true in Czechia, Slovakia, Poland and Estonia; Germany
// decides by the place (the former GDR, city.panels); false elsewhere and abroad (default.js).
export const socialistLooks = () => (typeof country.socialistLooks === "function" ? !!country.socialistLooks(city) : !!country.socialistLooks);
// Elsewhere a block of flats of 1946–90 is the postwar block (povalecny): sorela and the brick block of the 1950s–60s,
// a panel slab of the panel era (or of no known year), a flat-roofed tenement of those years. A panel slab before 1946
// is a functionalist house, after 1990 a modern one; offices stay offices.
const POSTWAR_FROM = 1946, POSTWAR_TO = 1990;
export function westernLook(style, info, office) {
  if (style === "sorela" || style === "typovy") return "povalecny";
  const y = info?.start || info?.built;
  if (style === "plocha") return office ? "kancelar" : y > POSTWAR_TO ? "moderni" : y < POSTWAR_FROM ? "funkce" : "povalecny";
  if (style === "funkce" && y >= POSTWAR_FROM && y <= POSTWAR_TO) return "povalecny";
  return style;
}
function derivedStyle(info) {
  const h = buildingHeight(info);
  const n = info?.levels || (h ? Math.round(h / FLOOR) : null);
  const roof = IPR_ROOF[info?.roofType];
  const cornice = info?.cornice || info?.levels; // a height alone says nothing about floors in a hall
  // Halls: an OSM shop or works building, or a big low footprint, unless IPR says pitched roof on 3+ floors.
  const big = info?.area >= HALL_AREA && !HOUSE_TYPES.has(info?.type);
  if (CHURCH_TYPES.has(info?.type)) return "kostel"; // OSM: a church, chapel, synagogue
  if ((HALL_TYPES.has(info?.type) || big || (info?.iprKind === 3 && info?.area >= HALL_AREA / 4)) && !(cornice > 2) && roof !== "sikma") return "hala";
  if (GARAGE_TYPES.has(info?.type) || info?.garage) return "garaz"; // OSM garages, RÚIAN garáž
  if (SCHOOL_TYPES.has(info?.type)) return "skola";
  if ((info?.farm || FARM_TYPES.has(info?.type)) && !(n > 2)) return "statek"; // RÚIAN zemědělská usedlost, OSM farm
  // An IPR family house (typ 6) in Prague's inner city is a small town house, not a villa (review 16. 11. 2026).
  const family = info?.house || FAMILY_TYPES.has(info?.type) || (city.iprHouseKind && info?.iprKind === 6 && info?.km > innerKm());
  if (family && !(n > 3)) return familyKind(info);
  // An old house on the square, also of 1–2 floors (the small towns), unless its roof is known to be flat.
  if (oldCore(info, n) && roof !== "plocha") return "mestan";
  if (info?.iprKind === 6 || HOUSE_TYPES.has(info?.type) || (n && n <= 2)) return "nizky";
  // RÚIAN: walls of concrete panels. Panel houses of the panel era; a newer one (prefabricated walls are
  // common again) looks like any new block of flats (evaluation/budovy-panel: 16 houses after 2000).
  if (info?.panel) return info.built > MODERN_FROM ? "moderni" : "plocha";
  if (roof) return roof === "plocha" ? flatKind(info, n) : yearLook(info, n) || roof; // a pitched roof (IPR, Plzeň's 3D buildings)
  // RÚIAN's year the house was completed, where the roof is not known (the towns): houses up to 1919
  // and of the early 1950s (socialist realism) have pitched roofs, the rest is told by flatKind.
  const built = info?.built;
  // 1948–57: socialist realism (sorela).
  if (built) return yearLook(info, n) || (built < 1920 || built < SORELA_FROM && built >= 1946 ? "sikma" : flatKind(info, n));
  // Abroad no city centre is known, so the distance says nothing (Bára 16. 11. 2026: panel houses even in the centre
  // of Bratislava): what OSM knows of the house decides.
  if (city.abroad && !city.centre) return abroadStyle(info, n);
  // Nothing known about the building: a tenement in the inner city, a small house elsewhere (least misleading).
  if (!n) return info?.km > innerKm() ? "nizky" : "sikma";
  return info?.km > innerKm() ? flatKind(info, n) : "sikma";
}

// A family house by its age: the year of the house (RÚIAN), else the age of the area (IPR, Prague: the first year
// it shows as built up, so 1950 means 1921–50). With its gable to the street outside the inner town it is a village
// house; in a row (OSM terrace, 3+ houses joined) an older one is a town house.
const SORELA_FROM = 1948;
// A burgher house on the old town square (Bára 16. 11. 2026): an old house (RÚIAN before 1920, Prague: built up by
// 1840) of up to 5 floors in the very heart of the town (city.coreKm from its centre: the square; Prague's Old Town).
const oldCore = (info, n) => !!city.centre && info?.km <= (city.coreKm ?? 0.3) && !(n > 5)
  // Prague knows the age of the area too: built up by 1840 (RÚIAN's "before 1919" also covers the tenements of 1900).
  && (info?.period ? info.period <= 1840 && !(info.built >= 1920) : info?.built < 1920);
// 1958–69, walls not panels (RÚIAN code 10, bricks or none): 19 of 25 such houses drawn as panel houses were brick
// blocks, 13 of them with a pitched roof and chimneys, 2 were panel houses (both after 1970; Street View, Bára
// 16. 11. 2026, evaluation/budovy-panel/ZPRAVA.md). Panel walls in RÚIAN still make a panel house (above).
const TYPOVY_TO = 1970;
// The looks the year of a house with a pitched or unknown roof gives (RÚIAN; Plzeň's 3D buildings know the roof too):
// sorela 1948–57, the plain brick block 1958–69 of up to 5 floors (a taller one can be a panel house). Its slab shape
// says nothing: all 11 brick houses of 1958–69 in the Street View sample were slabs. Undefined: no such look.
function yearLook(info, n) {
  const b = info?.built;
  if (!b || OFFICE_TYPES.has(info?.type) || info?.office) return undefined;
  if (b >= SORELA_FROM && b < 1958) return "sorela";
  if (b >= 1958 && b < TYPOVY_TO && !(n > 5)) return "typovy";
  return undefined;
}
function familyKind(info) {
  const y = info?.built ?? info?.period;
  // The cube is a house of the 1960s–80s; one of 1946–59 still looks like an older house.
  const old = !y || (info?.built ? y < 1960 : y <= 1950);
  if (y && (info?.built ? y >= 1990 : y > 1990)) return "novyrd";
  // A row (an old garden-city terrace: Spořilov, Ořechovka) before the village house: their plots are narrow too.
  if (info?.type === "terrace" || info?.block?.parts >= 3) return old ? "nizky" : "kostka";
  if (info?.across && old && info?.km > innerKm()) return "statek";
  return old ? "vila" : "kostka";
}

// A flat-roofed house: a panel house, or a functionalist tenement in a city block. Told apart by
// the block the OSM building belongs to (blockShape in derive.js): a panel house is a slab at most
// PANEL_WIDTH wide filling its rectangle, a block of few long parts (an L of slabs: PANEL_PART m
// of outline per building or more), 8+ floors, or out on the estates; a house joined into a wider
// block of short houses round a courtyard is a tenement. Checked on 361 OSM apartment houses of 4+
// floors with a building date (evaluation/budovy-typ): 72 % of the 1958–90 ones and 78 % of the
// 1925–45 ones come out right. Offices keep the flat style (drawn as offices by their type).
// A modern block of flats (after 1995): IPR marks it as new against its base map (rare: only the
// newest), or, short of a panel slab, it has a set-back floor outside the inner city (functionalist
// set-backs are an inner-city thing; panel houses have none). Height says nothing: panel houses of
// 4 floors are common (Bára).
const PANEL_WIDTH = 16, PANEL_FILL = 0.65, PANEL_PART = 30, PANEL_FLOORS = 8, estateKm = () => city.estateKm ?? 7;
// The age of the area (IPR "Vývoj zástavby", info.period = the first year it shows as built up) is
// the default, overruled by what is known of the house itself (Bára): built up by 1920 → a house of
// the older town (the tenement look) unless it is a panel slab; by 1950 → a functionalist
// tenement unless a panel slab or a modern set-back block further out; 1970–1990 → the panel era;
// 2010 or later → a modern block of flats. IPR "nová budova" overrules all.
// Not a panel house (evaluation/budovy-panel, RÚIAN walls of 780 houses in 11 towns, Bára 16. 11. 2026: "paneláků
// máme moc"): a house completed before PANEL_FROM (the first Czech panel houses are of the mid-1950s; a slab of the
// 1930s or 40s was drawn as one), or one whose walls RÚIAN gives as bricks, stone, monolith or wood (info.solid).
// Such a flat-roofed block of flats is drawn as the plain flat-roofed tenement.
const OLD_SETBACK_KM = 4.5, PANEL_FROM = 1955, MODERN_FROM = 1995;
const isSlab = (b) => !!b && ((b.fill >= PANEL_FILL && b.width <= PANEL_WIDTH) || (b.parts >= 2 && (b.length + b.width) / b.parts >= PANEL_PART));
function flatKind(info, n) {
  if (OFFICE_TYPES.has(info?.type) || (info?.office && !FLAT_RESIDENTIAL.has(info?.type))) return "kancelar";
  if (info?.newBuild) return "moderni"; // IPR "nová budova"
  const b = info?.block;
  const slab = isSlab(b);
  const setback = !slab && n < PANEL_FLOORS && info?.roof >= 1;
  // The year of the house (RÚIAN) before the age of the area; it is exact, so modern from 1996.
  const p = info?.built ?? info?.period;
  const panelAge = !info?.solid && !(info?.built < PANEL_FROM);
  if (p) {
    if (p > (info?.built ? MODERN_FROM : 2009)) return "moderni";
    if (p >= 1970) return setback && info?.km > innerKm() ? "moderni" : panelAge ? "plocha" : "funkce";
    if (panelAge && (slab || (n >= PANEL_FLOORS && p >= PANEL_FROM))) return "plocha"; // a tall block of the panel era too
    if (p <= 1920) return "sikma";
    return setback && info?.km > OLD_SETBACK_KM ? "moderni" : "funkce";
  }
  if (setback && info?.km > innerKm()) return "moderni";
  if (!panelAge) return "funkce";
  // No centre known (the rest of the country, Slovakia, abroad: km 99): only the block's shape or 8+ floors tell a
  // panel house, not the distance (it made every unknown house of 3 floors or more a panel house).
  if (!city.centre) return slab || n >= PANEL_FLOORS ? "plocha" : "funkce";
  if (n >= PANEL_FLOORS || info?.km >= estateKm()) return "plocha";
  if (b) return slab ? "plocha" : "funkce";
  return info?.km > innerKm() ? "plocha" : "funkce";
}

// The look of a house abroad: the year OSM gives (start_date) as RÚIAN's; else a pitched roof where OSM says so, an
// office by its type, a panel house only as a slab (or 8+ floors on its own), else a tenement: with a pitched roof,
// flat where OSM says the roof is flat.
function abroadStyle(info, n) {
  const y = info?.start;
  if (y) return y < 1920 || (y >= 1946 && y < 1958) ? "sikma" : flatKind({ ...info, built: y }, n);
  const rs = info?.roofShape;
  if (rs && rs !== "flat") return "sikma";
  if (OFFICE_TYPES.has(info?.type)) return "plocha";
  if (isSlab(info?.block) || (n >= PANEL_FLOORS && !info?.block)) return "plocha";
  return rs === "flat" ? "funkce" : "sikma";
}

// A low building has a pitched roof where it is known to (IPR's roof shape), or where it is a house:
// RÚIAN "rodinný dům" or cottage (info.house), an OSM house type, an IPR family house (typ 6, Prague).
// Otherwise (a shop, a school, a garage, nothing known) a plain flat roof (Bára: Most, tř. Budovatelů).
function pitchedLow(info) {
  const roof = IPR_ROOF[info?.roofType];
  if (roof) return roof !== "plocha";
  return !!(info?.house || HOUSE_TYPES.has(info?.type) || (city.iprHouseKind && info?.iprKind === 6));
}

// Side outline of a Prague building: floors, storey height, roof floors and the height of each part (cm).
const ARCADE_D = 260; // how far the drawn arcade reaches from the facade into the house (cm)
const FAMILY_LOOKS = new Set(["vila", "kostka", "novyrd", "statek"]);
// Roof pitch of the family houses: the low hipped roof of the "cube", the steep one of a new house.
const deg = (a) => Math.tan((a * Math.PI) / 180);
const ROOF_PITCH = { kostka: deg(18), novyrd: deg(38), mestan: deg(52), kostel: deg(55),
  stredomori: deg(20), azulejo: deg(22), galeria: deg(28), kypr: deg(18), dansky: deg(45), stenstad: deg(30), drevak: deg(35), puukaupunki: deg(27), tallinnamaja: deg(27) };
// The ground floor of the regional looks: Haussmann's shop floor with its entresol, the Hanseatic house's hall.
const GROUND_K = { haussmann: 1.5, stenstad: 1.2, stredomori: 1.2, azulejo: 1.2, galeria: 1.2, malta: 1.1, kypr: 1, cihlovy: 1.2, stit: 1.2, dansky: 1.1, hanza: 1.4, drevak: 1, puukaupunki: 1, tallinnamaja: 1 };
// A family house's ridge lies within the 4 m strip (the small wooden houses too); a tenement's deeper.
const SMALL_RIDGE = new Set(["drevak", "puukaupunki"]);
// A canal house's raised ground floor over its stoep (every other house, by its place).
const stoepZ = (kind, info) => ((kind === "cihlovy" || kind === "stit") && houseHash(info) % 2 === 1 ? 75 : 0);
// The roof of a gabled house seen from the side: the band of its slope up to the ridge running away from the street.
const GABLE_RISE = { stit: 400, hanza: 480 };
// With the gable's outline (LOOKS.gables, ?stit=0 off): the gable stands on the wall's top across its whole width (0 to
// EDGE, its axis GABLE_C in the middle), two to three storeys tall, the roof running back hidden behind it. The house is
// mirror-symmetric to that axis (Bára 23. 11. 2026): the window columns of all its floors (the door and the ground-floor
// window too) stand in GABLE_AXES (the centres of the front and back column), the gable's windows keep them; its
// narrower top holds one window in the axis. Its form by the house's place: the North Sea's step, neck or bell
// gable; Tallinn's plain gable, every fourth stepped. Heights in storeys (GABLE_TOP: the top of the outline).
const GABLE_C = EDGE / 2;
const GABLE_AXES = { stit: [GABLE_C - 95, GABLE_C + 95], hanza: [GABLE_C - 70, GABLE_C + 70] };
// The default (Bára 23. 11. 2026; ?stit=cely: the whole symmetric gable, LOOKS.gableCut false): the house 6 m wide with three window columns, the frame
// showing its street-side two thirds (the axis and the front column inside, the back column out of it, cut at EDGE).
const GABLE_CUT_C = 300, GABLE_CUT_AXES = [140, 300, 460];
const gableC = () => (LOOKS.gableCut ? GABLE_CUT_C : GABLE_C);
const gableAxes = (kind) => (LOOKS.gableCut ? GABLE_CUT_AXES : GABLE_AXES[kind]);
const gableForm = (kind, info) => (kind === "hanza" ? (houseHash(info) % 4 === 0 ? "trap" : "plain") : ["trap", "hals", "klok"][houseHash(info) % 3]);
const GABLE_TOP = { trap: 2.3, hals: 2.38, klok: 2.4, plain: 2.0, htrap: 2.38 };
const gableTop = (kind, info) => GABLE_TOP[kind === "hanza" && gableForm(kind, info) === "trap" ? "htrap" : gableForm(kind, info)];
const gableOn = (kind) => !!GABLE_RISE[kind] && LOOKS.gables;
const BARN_RISE = 380; // a village house: its roof rises this high (cm) from the eaves to the ridge (6–8 m deep house)
// A tenement's side gable (Bára 23. 11. 2026: the round window belongs under the ridge, and the ridge must show): like the
// gabled houses' default, the frame shows the street-side part of the gable, its ridge at TENEMENT_RIDGE (cm from the
// street facade) and the back slope running down to the cut. Only a tenement without a mansard (its gable is plain).
const TENEMENT_RIDGE = 300;
const tenementGable = (kind, roofRows, flat) => (kind === "sikma" || kind === "haussmann") && !roofRows && !flat;
// The wall between the top floor's window heads and the main cornice (Bára 23. 11. 2026: the cornice must not sit on the
// windows): the attic's knee wall over the top floor's ceiling, added to the wall's height (cm at the look's own storey,
// scaled with it). About 1.5 m on a Prague tenement from the window head to the cornice's underside (an architrave line,
// the frieze, the cornice on its consoles).
const FRIEZE = { sikma: 145, mestan: 130, sorela: 180, typovy: 25, haussmann: 75, stenstad: 115, stredomori: 45, azulejo: 45, malta: 20,
  kypr: 20, cihlovy: 65, dansky: 80 };
// A house of North America (houses-america.js): its first floor over its base, the known height setting the storey.
function americaForm(info, kind) {
  const A = AMERICA[kind], h = buildingHeight(info), lv = buildingLevels(info);
  const k = A.groundK || 1;
  const n = Math.max(1, lv?.n || (h ? Math.max(1, Math.round((h * 100 - A.base - A.attic) / A.storey)) : A.floors));
  const s0 = info?.height ? (info.height * 100 - A.base - A.attic) / (n - 1 + k) : A.storey;
  const storey = Math.min(A.storey * 1.5, Math.max(A.storey * 0.7, s0));
  const ground = A.base + storey * k;
  return { n, roofRows: 0, storey, base: A.base, ground, body: ground + (n - 1) * storey + A.attic, roofH: A.roof, flat: true, pitch: PITCH, chimney: 0 };
}
function buildingForm(info, kind) {
  if (AMERICA[kind]) return americaForm(info, kind);
  const style = BASE_STYLE[kind] || kind;
  const lv = buildingLevels(info);
  const h = buildingHeight(info);
  const n = style === "hala" || kind === "kostel" || kind === "garaz" ? 1 : Math.max(1, lv?.n || (h ? Math.round(h / FLOOR) : DEFAULT_FLOORS[kind]));
  let roofRows = style !== "hala" && kind !== "kostel" && kind !== "garaz" && lv?.roof && lv.cornice ? Math.min(lv.roof, n - 1) : 0;
  // A Haussmann house always has its zinc mansard: one floor of its seven, two from seven floors.
  if (kind === "haussmann" && !roofRows && n >= 3) roofRows = n >= 7 ? 2 : 1;
  // The brick, wooden and Mediterranean houses draw their roof floors in the roof (dormers, a gable), not as a mansard.
  if (style === "cihla" || style === "drevo" || MED_LOOKS.has(kind)) roofRows = 0;
  // A gable turned towards us (?stit=1) holds the top floor: the floors below it are one fewer.
  if (gableOn(kind) && n >= 2) roofRows = 1;
  const S = STOREY[kind];
  // A known height sets the storey (within reason); pitched roofs sit above it.
  const storey = h ? Math.min(S * 1.5, Math.max(S * 0.7, (h * 100) / n)) : S;
  // Tenements have a taller ground floor.
  // A panel house stands on a 100 cm plinth (raised ground floor).
  // A "cube" family house has a raised ground floor over its half-sunk garage and cellar.
  const ground = GROUND_K[kind] ? storey * GROUND_K[kind] : kind === "sikma" ? storey * 1.2 : style === "sikma" ? storey * 1.1 : style === "funkce" ? storey * 1.15
    : kind === "plocha" ? storey + 90 : kind === "kostka" ? storey + 110 : storey;
  const frieze = FRIEZE[kind] && !gableOn(kind) ? (FRIEZE[kind] * storey) / S : 0;
  const body = ground + (n - roofRows - 1) * storey + frieze;
  const flat = style === "plocha" || style === "funkce" || style === "povalecny" || style === "moderni" || style === "hala" || kind === "garaz"
    || (kind === "skola" && (info?.built ?? info?.period) > 1955) || (kind === "nizky" && !pitchedLow(info))
    // Malta's houses and the south's terraces (azotea, terrazza): a flat roof behind a balustrade.
    || kind === "malta" || (MED_LOOKS.has(kind) && (houseDetails(kind, info).terrace ?? (kind === "kypr" ? !(info?.roofShape && info.roofShape !== "flat") : info?.roofShape === "flat")));
  const pitch = ROOF_PITCH[kind] || PITCH;
  const sawtooth = style === "hala" && ["industrial", "manufacture"].includes(info?.type) && IPR_ROOF[info?.roofType] !== "plocha";
  // A family house shows its ridge inside the 4 m strip; a tenement's ridge lies deeper, past the cut.
  const pitched = kind === "statek" ? BARN_RISE + 40 : tenementGable(kind, roofRows, false) ? (TENEMENT_RIDGE + 5) * pitch + 45 : gableOn(kind) ? gableTop(kind, info) * storey + 90 : GABLE_RISE[kind] ? GABLE_RISE[kind] + 100 : kind === "cihlovy" ? 250
    : style === "nizky" || SMALL_RIDGE.has(kind) ? (RIDGE + 55) * pitch + 45 : (EDGE + 35) * pitch + 45;
  const roofH = flat ? roofRows * storey + (sawtooth ? 430 : style === "hala" ? 110 : MED_LOOKS.has(kind) ? 230 : 50) : roofRows && kind !== "statek" && !gableOn(kind) ? roofRows * storey + 170 : pitched;
  return { n, roofRows: kind === "statek" ? 0 : roofRows, storey, ground, body, roofH, flat, pitch, chimney: flat ? 0 : 70 };
}

// How high the facades at the edges are (cm), for a span wire fixed to one.
const facades = (edges) => Object.fromEntries(["left", "right"].map((side) => {
  if (edges?.[side] !== "budova") return [side, 0];
  const info = edgeInfo(edges, side);
  return [side, cityArt() ? buildingForm(info, buildingStyle(info, edges[`${side}Style`])).body : (buildingHeight(info) || 0) * 100];
}));
export function edgeHeight(kind, info, style) {
  if (kind !== "budova") return 0;
  if (!cityArt()) return (buildingHeight(info) || 0) * 100;
  const f = buildingForm(info, buildingStyle(info, style));
  return f.body + f.roofH + f.chimney;
}

// Darker or lighter shade of a hex colour (k < 1 darkens).
const tint = (hex, k) => "#" + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k)))
  .toString(16).padStart(2, "0")).join("");

// d = distance from the street facade into the building (negative: towards the street), z = height above the surface.
let CUT_N = 0;
function drawPrahaBuilding(g, x, side, surface, info, chosen) {
  const kind = buildingStyle(info, chosen), style = BASE_STYLE[kind] || kind;
  // The house runs on past the cut (Bára 23. 11. 2026): the next window of its rhythm, standing across the cut, is cut
  // off there by the frame.
  const clipId = `cut${++CUT_N}`, cp = el("clipPath", { id: clipId }, g);
  el("rect", { x: side === "left" ? x : x + EDGE - 1e5, y: -1e5, width: 1e5, height: 2e5 }, cp);
  g = el("g", { "clip-path": `url(#${clipId})` }, g);
  const f = buildingForm(info, kind);
  // tint belongs to the house (set by derive.js), so a flipped profile keeps each house's colours.
  const seed = (info?.levels || 0) * 7 + Math.round((info?.km || 0) * 10) + (info?.tint ?? (side === "left" ? 0 : 3));
  const det = REGIONAL.has(kind) || AMERICA[kind] ? houseDetails(kind, info) : {};
  const pal = (k) => (k === kind && det.palette ? det.palette : PALETTES[k])[seed % (k === kind && det.palette ? det.palette : PALETTES[k]).length];
  const accent = pal(PALETTES[kind] ? kind : style);
  const med = MED_LOOKS.has(kind), brick = kind === "cihlovy" || kind === "stit" || kind === "dansky", wood = style === "drevo";
  const factory = style === "hala" && ["industrial", "manufacture"].includes(info?.type);
  const sawtooth = factory && IPR_ROOF[info?.roofType] !== "plocha";
  const shop = style === "hala" && ["retail", "supermarket"].includes(info?.type);
  const office = kind === "kancelar";
  const family = FAMILY_LOOKS.has(kind);
  // Window frames: brown wood in the cube, anthracite in a new house, cream elsewhere.
  // White frames in the north and in Paris.
  const WF = kind === "kostka" ? "#6b4a35" : kind === "novyrd" ? "#3c3f43" : brick || wood || kind === "stenstad" || kind === "haussmann" || kind === "hanza" ? "#f4f2ec" : FRAME;
  const tile = ROOF_PICK[kind]?.[(seed >> 1) % ROOF_PICK[kind].length] || ROOF_OF[kind] || [ROOF.tile, ROOF.tileDark];
  // A panel house is one colour: the light shade of its insulation colour (Bára: no two-tone field).
  const wall = style === "plocha" ? (office ? pal("plochaWall") : tint(accent, 1.22)) : factory ? BRICK : style === "hala" ? "#cdd4d9" : accent;
  const shade = tint(wall, 0.88), dark = tint(wall, 0.7), trim = tint(wall, 1.12);
  const X = (d) => (side === "left" ? x + EDGE - d : x + d);
  const poly = (pts, fill, extra = {}) => el("path", { d: "M" + pts.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L") + " Z", fill, ...extra }, g);
  // A box reaching the cut has no outline there (the wall runs on past it, Bára 23. 11. 2026): only its top, front and
  // bottom are stroked.
  const box = (d0, d1, z0, z1, fill, extra) => {
    if (!extra?.stroke || d1 < EDGE) return poly([[d0, z0], [d1, z0], [d1, z1], [d0, z1]], fill, extra);
    const { stroke, "stroke-width": sw, "vector-effect": ve, ...rest } = extra;
    poly([[d0, z0], [d1, z0], [d1, z1], [d0, z1]], fill, rest);
    return el("path", { d: `M${X(EDGE)} ${surface - z1} L${X(d0)} ${surface - z1} L${X(d0)} ${surface - z0} L${X(EDGE)} ${surface - z0}`, fill: "none", stroke, "stroke-width": sw, "vector-effect": ve }, g);
  };
  const dot = (d, z, r, fill) => el("circle", { cx: X(d), cy: surface - z, r, fill }, g);
  const outline = { stroke: dark, "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" };
  // Half disc of radius r standing on z, centred at d (an arched transom).
  const arch = (d, z, r, fill) => {
    const [x1, x2] = [X(d - r), X(d + r)].sort((a, b) => a - b);
    el("path", { d: `M${x1} ${surface - z} A ${r} ${r} 0 0 1 ${x2} ${surface - z} Z`, fill }, g);
  };
  const top = f.body;
  const full = f.n - f.roofRows;
  const floorZ = (k) => (k === 0 ? 0 : f.ground + (k - 1) * f.storey); // bottom of floor k
  const floorH = (k) => (k === 0 ? f.ground : f.storey);

  // The window columns of a look (their centres): the front one clear of the facade, the back one in the middle between
  // the door and the old end of the wall, then on the same pitch to the cut and one across it (Bára 23. 11. 2026: no more
  // wall at the cut than between two windows, the next window is there, out of the frame).
  const colAxes = (w) => { const a = Math.max(65, 35 + w / 2), b = (125 + EDGE - 30) / 2, out = [a, b]; for (let c = 2 * b - a; c - w / 2 < EDGE; c += b - a) out.push(c); return out; };
  if (AMERICA[kind]) { // North America: a drawing of its own over the same cellar and earth
    const cellarA = GROUND + 60 - surface;
    el("rect", { x, y: surface, width: EDGE, height: cellarA, fill: SKLEP }, g);
    box(0, EDGE, -8, 0, tint(SKLEP, 0.85));
    el("rect", { x, y: GROUND + 60, width: EDGE, height: 40, fill: "#9b7f5f" }, g);
    drawAmerican(kind, { g, el, X, surface, EDGE, f, seed, wall, det, info, box, poly, dot, tint, outline, colAxes });
    return surface - (top + f.roofH);
  }
  // A Streetmix window: cream frame, dark glass with a glint, a transom, a sill with its shadow; now and then
  // a lit pane, a flower box or a curtain.
  let noBox = false; // no flower boxes (the gable's windows)
  const window = (d, z, w, h, n) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13; // scatters the lit panes, flowers and curtains
    const lit = luck === 5;
    box(d - 10, d + w + 10, z - 22, z - 10, shade); // shadow under the sill
    if (kind === "vila" || kind === "sorela") box(d - 20, d + w + 20, z - 12, z + h + 22, trim, outline); // the window surround (šambrána)
    if (kind === "sorela") box(d - 30, d + w + 30, z + h + 22, z + h + 34, tint(trim, 0.95), outline); // and a little cornice over it
    if (wood) box(d - 16, d + w + 16, z - 12, z + h + 26, "#f6f4ee", outline); // the white boards round a wooden window
    if (med || kind === "stenstad" || kind === "haussmann") box(d - 14, d + w + 14, z - 10, z + h + 16, tint(wall, 1.08)); // the surround a shade lighter
    if (brick) box(d - 10, d + w + 10, z + h + 7, z + h + 24, "#d8cfb5"); // a sandstone lintel
    box(d - 7, d + w + 7, z - 7, z + h + 7, WF);
    box(d, d + w, z, z + h, lit ? LIT : GLASS);
    poly([[d + w * 0.5, z + h], [d + w, z + h], [d + w, z + h * 0.55]], lit ? "#f8e7b5" : GLINT);
    if (kind !== "novyrd") box(d + w / 2 - 3, d + w / 2 + 3, z, z + h, WF);
    if (kind !== "statek") box(d, d + w, z + h * (kind === "kostka" ? 0.62 : 0.7) - 3, z + h * (kind === "kostka" ? 0.62 : 0.7) + 3, WF);
    else box(d, d + w, z + h * 0.5 - 3, z + h * 0.5 + 3, WF); // a village window: a cross
    if (kind === "drevak") box(d, d + w, z + h * 0.35 - 3, z + h * 0.35 + 3, WF); // six panes
    if (brick) box(d, d + w, z + h * 0.45 - 3, z + h * 0.45 + 3, WF); // the sash window's meeting rail
    box(d - 12, d + w + 12, z - 12, z - 4, dark); // sill
    if (kind === "haussmann" && z > f.ground) { // a French window: its low iron guard instead of a flower box
      box(d - 4, d + w + 4, z + h * 0.3 - 4, z + h * 0.3, "#2b2d2f");
      box(d - 4, d + w + 4, z + 4, z + 7, "#2b2d2f");
      for (let dd = d; dd <= d + w; dd += 10) box(dd - 1.2, dd + 1.2, z, z + h * 0.3, "#2b2d2f");
    } else if ((luck === 2 || luck === 9 || luck === 11 || n === 3) && !lit && !noBox) {
      box(d - 4, d + w + 4, z - 28, z - 12, "#9b6a45");
      for (let i = 0; i < 4; i++) dot(d + 6 + (i * (w - 12)) / 3, z - 6, 9, i % 2 ? "#e2607a" : "#6fae4f");
    } else if (luck === 7) { // a net curtain with a wavy hem
      box(d + 4, d + w / 3, z + 14, z + h - 4, "#efe6cf", { "fill-opacity": 0.5 });
      for (let i = 0; i < 3; i++) dot(d + 4 + ((i + 0.5) * (w / 3 - 4)) / 3, z + 14, 5, "#efe6cf");
    }
  };
  // The south's shutters beside a window (persiane: louvred leaves, now and then one closed over it), or Spain's roller
  // blind let partly down under its box.
  const shutterCol = kind === "kypr" ? pal("kyprShutter") : kind === "malta" ? pal("maltaAccent") : pal("stredomoriShutter");
  const shutters = (d, z, w, h, n) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13;
    if (det.blinds) {
      const down = luck % 3 === 0 ? 0.6 : luck % 3 === 1 ? 0.3 : 0.1, BL = luck % 2 ? "#cdbb9a" : "#e3ddcf";
      box(d - 4, d + w + 4, z + h + 7, z + h + 24, tint(wall, 0.92), outline);
      box(d, d + w, z + h * (1 - down), z + h, BL);
      for (let zz = z + h - 7; zz > z + h * (1 - down) + 2; zz -= 7) box(d, d + w, zz - 1, zz, tint(BL, 0.82));
      return;
    }
    const leaf = (a, b) => {
      box(a, b, z - 4, z + h + 4, shutterCol, { stroke: tint(shutterCol, 0.7), "stroke-width": 1, "vector-effect": "non-scaling-stroke" });
      for (let zz = z + 8; zz < z + h; zz += 9) box(a + 4, b - 4, zz - 1.2, zz + 1.2, tint(shutterCol, 0.75));
    };
    if (luck === 4) { leaf(d, d + w / 2); leaf(d + w / 2, d + w); return; } // closed
    const lw = Math.min(w / 2, 48), lf = Math.min(lw, d - 20); // the front leaf stays on the wall
    if (lf > 14) leaf(d - 8 - lf, d - 8);
    leaf(d + w + 8, d + w + 8 + lw);
  };
  // A canopy over a door on the side wall, seen from the front: a slab, its shadow, two brackets.
  const canopy = (d0, d1, z, fill) => {
    const over = Math.min(20, d0 - 4); // never past the facade
    box(d0 - over, d1 + over, z, z + 12, tint(wall, 0.8));
    box(d0 - over, d1 + over, z + 12, z + 32, fill);
    for (const d of [d0 - over + 8, d1 + over - 8]) poly([[d - 6, z + 12], [d + 6, z + 12], [d, z - 14]], tint(fill, 0.85));
  };

  // The gable turned towards us (?stit=1): its outline over the wall's width, the roof hidden behind it; its windows in
  // the columns of the floors below (GABLE_AXES), one in the axis where it narrows; the hoist beam (end-on, under its
  // little hood in Amsterdam) above the uppermost window, in Tallinn over a loading door in the axis.
  function drawGable() {
    const S = f.storey, c = gableC(), form = gableForm(kind, info), win = WINDOWS[kind], axes = gableAxes(kind), ax0 = axes[0], ax1 = axes.at(-1);
    const sc = c / GABLE_C; // the widths of the outline grow with a wider house (the variant)
    const u = (k) => top + k * S;
    const STONE_W = "#efe9dc", SANDSTONE = "#e3d6b8", CAP = kind === "hanza" ? "#8f8a80" : STONE_W;
    // The left half of the outline as [half-width, height in storeys], from the wall's top up; mirrored for the right.
    let half, pedestal = null;
    const steps = (list, crown) => { const h = [[c, 0]]; let w = c; for (const [k, hw] of list) { h.push([w, k], [hw, k]); w = hw; } h.push([w, crown]); return h; };
    if (form === "trap" && kind === "stit") half = steps([[0.86, 155 * sc], [1.12, 122 * sc], [1.38, 90 * sc]], 2.22);
    else if (form === "trap") half = steps([[0.75, 135 * sc], [1.2, 100 * sc], [1.65, 68 * sc]], 2.3);
    else if (form === "hals") half = [[c, 0], [c, 0.86], [80 * sc, 0.86], [80 * sc, 2.0], [96 * sc, 2.0], [96 * sc, 2.06]];
    else if (form === "klok") {
      half = [[c, 0], [c, 0.86]];
      const B = 112 * sc;
      for (let i = 1; i <= 10; i++) { const t = i / 10, sm = t * t * (3 - 2 * t); half.push([c - (c - B) * sm, 0.86 + 0.5 * t]); }
      half.push([B, 1.9]);
      for (let i = 1; i <= 8; i++) { const v = (i / 8) * (Math.PI / 2); half.push([B * Math.cos(v), 1.9 + ((90 * sc) / S) * Math.sin(v)]); }
    } else half = [[c, 0], [0, GABLE_TOP.plain]];
    const left = half.map(([hw, k]) => [c - hw, u(k)]);
    const right = left.slice().reverse().map(([d, z]) => [2 * c - d, z]);
    let pts = [...left, ...right];
    if (form === "hals") { // the pediment over the neck's cornice: triangular or rounded (by the house's place)
      const zc = u(2.06), round = (houseHash(info) >> 3) % 2;
      const ped = round ? Array.from({ length: 9 }, (_, i) => { const v = (i / 8) * Math.PI; return [c - 88 * sc * Math.cos(v), zc + 70 * Math.sin(v)]; })
        : [[c - 92 * sc, zc], [c, zc + 0.3 * S], [c + 92 * sc, zc]];
      pts = [...left, ...ped, ...right];
      pedestal = ped;
    }
    // The gable itself over the whole wall, outlined along its edge only (no line, no step at its foot).
    poly(pts, wall);
    el("path", { d: "M" + pts.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L"), fill: "none", ...outline }, g);
    // How wide the gable is at height z (the run of the outline holding the axis).
    const hwAt = (z) => {
      let best = -Infinity;
      for (let i = 0; i + 1 < left.length; i++) {
        const [d0, z0] = left[i], [d1, z1] = left[i + 1];
        if ((z0 <= z && z <= z1) || (z1 <= z && z <= z0)) best = Math.max(best, z1 === z0 ? Math.min(d0, d1) : d0 + ((z - z0) / (z1 - z0)) * (d1 - d0));
      }
      return best === -Infinity ? 0 : c - best;
    };
    const fits = (dc, w, z0, z1) => [z0, (z0 + z1) / 2, z1].every((z) => Math.abs(dc - c) + w / 2 + 16 <= hwAt(z));
    if (kind === "stit") for (let z = top + 30; z < u(2.6); z += 30) { const hw = hwAt(z) - 6; if (hw > 20) box(c - hw, c + hw, z - 1.5, z + 1.5, tint(wall, 0.88)); }
    else box(c - hwAt(top + 20), c + hwAt(top + 20), top - 6, top + 6, tint(wall, 0.9)); // the band between the floors and the gable
    // The copings along the outline (white sandstone in Amsterdam, grey stone in Tallinn).
    const open = pts.slice(1, -1);
    el("path", { d: "M" + open.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L"), fill: "none", stroke: CAP, "stroke-width": kind === "hanza" ? 8 : 11, "stroke-linejoin": "round" }, g);
    if (pedestal) poly(pedestal, SANDSTONE, outline); // the pediment in sandstone
    // The claw pieces at the neck's shoulders, with a scroll at the outer end; the bell's scrolls at its foot.
    if (form === "hals" || form === "klok") for (const sgn of [-1, 1]) {
      if (form === "hals") {
        const claw = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12, sm = t * t * (3 - 2 * t); claw.push([c + sgn * (c - 14 - (c - 94 * sc) * t), u(0.86) + 40 + (0.5 * S - 40) * sm]); } // an S scroll
        claw.push([c + sgn * 80 * sc, u(0.86)], [c + sgn * (c - 4), u(0.86)]);
        poly(claw, SANDSTONE, outline);
      }
      dot(c + sgn * (c - 34), u(0.86) + 26, 24, SANDSTONE);
      dot(c + sgn * (c - 34), u(0.86) + 26, 15, tint(SANDSTONE, 0.8));
      dot(c + sgn * (c - 37), u(0.86) + 28, 9, SANDSTONE);
    }
    if (form === "klok") { // a stone vase on the round top, a little scroll each side of its foot
      const zt = u(1.9) + 90 * sc;
      box(c - 22, c + 22, zt, zt + 12, STONE_W, outline);
      dot(c, zt + 34, 20, STONE_W);
      box(c - 8, c + 8, zt + 50, zt + 62, STONE_W);
      for (const sgn of [-1, 1]) dot(c + sgn * 32, zt + 4, 10, STONE_W);
    }
    if (form === "trap" && kind === "stit") { box(c - 16, c + 16, u(2.22) + 4, u(2.22) + 16, STONE_W, outline); dot(c, u(2.22) + 30, 14, STONE_W); } // a stone ball on top
    // The windows: a floor of the gable holds both columns where they fit, else one window in the axis.
    const gh = win.h * 0.85 * S, ww = win.w;
    noBox = true;
    let lastTop = top, axisWin = 0;
    for (let k = 0; k < 3; k++) {
      const z0 = u(k + win.sill), z1 = z0 + gh;
      if (fits(ax0, ww, z0, z1) && fits(ax1, ww, z0, z1)) { for (const [i, a] of axes.entries()) window(a - ww / 2, z0, ww, gh, 20 + k * 3 + i); lastTop = z1; }
      else if (fits(c, ww, z0, z1)) { window(c - ww / 2, z0, ww, gh, 20 + k * 3); lastTop = z1; axisWin++; }
      else break;
    }
    // Tallinn: the loading door in the axis over the windows; the beam above it (or above the uppermost window).
    let beamZ = lastTop + 34;
    if (kind === "hanza") {
      const dw = 50, z0 = lastTop + 0.15 * S, z1 = z0 + 0.3 * S;
      if (fits(c, dw - 14, z0, z1)) {
        box(c - dw / 2 - 5, c + dw / 2 + 5, z0 - 5, z1 + 5, "#bdb6a4");
        box(c - dw / 2, c + dw / 2, z0, z1, "#6b4a30");
        box(c - 1.5, c + 1.5, z0, z1, tint("#6b4a30", 0.7));
        beamZ = z1 + 20;
      }
    }
    noBox = false;
    box(c - 14, c + 14, beamZ, beamZ + 26, "#5b4632", outline); // the beam's end
    box(c - 1.5, c + 1.5, beamZ - 40, beamZ, "#3a3a3a"); // its hook
    box(c - 7, c + 1.5, beamZ - 44, beamZ - 40, "#3a3a3a");
    if (kind === "stit") poly([[c - 36, beamZ + 30], [c, beamZ + 56], [c + 36, beamZ + 30]], "#5b4632", outline); // the hood over it
  }

  // --- Roof and gable, behind the wall ---
  if (kind === "cihlovy") {
    // The North Sea cornice house (lijstgevel): behind the white wooden cornice the band of a roof whose ridge runs
    // away from the street (seen like a village house's), black glazed tiles, a ridge, a chimney at the back.
    const zr = top + 200;
    box(EDGE - 110, EDGE - 66, zr - 30, zr + 70, tint(wall, 0.95));
    box(EDGE - 116, EDGE - 60, zr + 62, zr + 72, tint(wall, 0.7));
    box(30, EDGE, top, zr, tile[0]);
    for (let z = top + 30; z < zr - 8; z += 30) box(30, EDGE, z, z + 4, tile[1], { "fill-opacity": 0.6 });
    box(30, EDGE, zr - 8, zr + 4, tile[1]);
    box(EDGE - 150, EDGE - 100, top + 70, top + 130, tint(tile[1], 0.8)); // a roof light
  } else if (gableOn(kind)) {
    drawGable();
  } else if (GABLE_RISE[kind]) {
    // A house with its gable to the street (the North Sea's step, neck or bell gable; the Hanseatic house of Tallinn): the
    // band of its roof up to the ridge running away from the street, as a village house's. The gable stands edge-on at
    // the street; with ?stit=1 (LOOKS.gables, Bára to approve) its outline is drawn over the band as if turned towards us.
    const H = GABLE_RISE[kind], zr = top + H;
    box(EDGE - 120, EDGE - 76, zr - 40, zr + 70, kind === "hanza" ? "#c46a4b" : tint(wall, 0.95));
    box(EDGE - 126, EDGE - 70, zr + 62, zr + 72, "#8d4a34");
    box(0, EDGE, top - 10, zr, tile[0]);
    for (let z = top + 24, i = 0; z < zr - 10; z += 32, i++) {
      box(0, EDGE, z, z + 5, tile[1], { "fill-opacity": 0.55 });
      for (let d = i % 2 ? 10 : 30; d < EDGE; d += 40) box(d, d + 3, z - 27, z, tile[1], { "fill-opacity": 0.3 });
    }
    box(0, EDGE, zr - 10, zr + 6, tile[1]); // ridge
    const beamZ = zr - 70;
    if (LOOKS.gables) {
      // The gable's outline: rising from the cornice to its top over the middle of the strip (d = 200).
      const h = houseHash(info), a = 6, b = EDGE - 6, c = EDGE / 2, gTop = zr + 40;
      const form = kind === "hanza" ? (h % 4 === 0 ? "trap" : "plain") : ["trap", "hals", "klok"][h % 3];
      let pts;
      if (form === "trap") { // a stepped gable: four steps each side and a top block
        const steps = 4, sh = (gTop - top) / (steps + 1), sw = (c - 45 - a) / steps;
        pts = [[a, top]];
        for (let i = 0; i < steps; i++) pts.push([a + i * sw, top + (i + 1) * sh], [a + (i + 1) * sw, top + (i + 1) * sh]);
        pts.push([c - 45, gTop], [c + 45, gTop]);
        for (let i = steps - 1; i >= 0; i--) pts.push([b - (i + 1) * sw, top + (i + 1) * sh], [b - i * sw, top + (i + 1) * sh]);
        pts.push([b, top]);
      } else if (form === "hals") { // a neck gable: shoulders with volutes, the neck under a small pediment
        const zs = top + (gTop - top) * 0.42, nk = 70;
        pts = [[a, top], [a, zs - 30], [c - nk - 60, zs], [c - nk, zs], [c - nk, gTop - 50], [c, gTop], [c + nk, gTop - 50], [c + nk, zs], [c + nk + 60, zs], [b, zs - 30], [b, top]];
      } else if (form === "klok") { // a bell gable: an S curve to a round top
        const left = [], H2 = gTop - top;
        for (let i = 0; i <= 12; i++) {
          const u = (i / 12) * 0.86, sm = Math.min(1, Math.max(0, (u - 0.08) / 0.7)), s2 = sm * sm * (3 - 2 * sm);
          left.push([c - (60 + (c - a - 60) * (1 - s2)), top + u * H2]);
        }
        for (let i = 1; i <= 6; i++) { const v = i / 6; left.push([c - 60 * Math.cos((v * Math.PI) / 2), top + H2 * (0.86 + 0.14 * Math.sin((v * Math.PI) / 2))]); }
        pts = [[a, top], ...left, ...left.slice(0, -1).reverse().map(([d, z]) => [2 * c - d, z]), [b, top]];
      } else pts = [[a, top], [c, gTop], [b, top]]; // a plain steep gable
      poly(pts, wall, outline);
      if (brick || kind === "stit") for (let z = top + 30; z < gTop; z += 30) { // brick courses inside the outline (clipped by eye: short of its edge)
        const inside = pts.filter(([, pz]) => pz >= z);
        if (inside.length) { const d0 = Math.min(...inside.map(([pd]) => pd)) + 6, d1 = Math.max(...inside.map(([pd]) => pd)) - 6; if (d1 > d0) box(d0, d1, z - 1.5, z + 1.5, tint(wall, 0.88)); }
      }
      if (form === "trap" || form === "hals" || form === "klok") for (const [pd, pz] of pts.slice(1, -1)) if (pz > top + 20) box(pd - 4, pd + 4, pz, pz + 6, "#efe9dc"); // white copings
      // Windows of the attic floors and the loft door under the beam.
      const win = WINDOWS[kind];
      for (const d of [c - 95, c + 95 - win.w * 0.8]) window(d, top + 40, win.w * 0.8, Math.min(120, (gTop - top) * 0.3), 7);
      box(c - 36, c + 36, beamZ - 150, beamZ - 20, DOOR, outline);
      box(c - 2, c + 2, beamZ - 150, beamZ - 20, tint(DOOR, 0.7));
    } else {
      // Without the licence: the gable's plate, edge-on, rising past the ridge.
      box(-12, 12, top, zr + 80, tint(wall, 0.95), outline);
      if (brick || kind === "stit") for (let z = top + 30; z < zr + 80; z += 30) box(-12, 12, z - 1.5, z + 1.5, tint(wall, 0.85));
    }
    // The hoist beam over the street, its hook.
    box(-80, 12, beamZ, beamZ + 22, "#5b4632", outline);
    box(-74, -70, beamZ - 40, beamZ, "#3a3a3a");
  } else if (kind === "statek") {
    // A village house with its gable to the street: we see its long side, so the roof shows as a band of tiles
    // from the eaves up to the ridge running away from the street; the gable stands edge-on at the street with its
    // verge board, a chimney over the ridge.
    const zr = top + BARN_RISE;
    box(EDGE - 150, EDGE - 100, zr - 40, zr + 90, "#c46a4b");
    box(EDGE - 158, EDGE - 92, zr + 80, zr + 92, "#8d4a34");
    box(-25, EDGE, top - 14, zr, tile[0]);
    for (let z = top + 24, i = 0; z < zr - 10; z += 34, i++) {
      box(-25, EDGE, z, z + 5, tile[1], { "fill-opacity": 0.55 }); // rows of tiles
      for (let d = i % 2 ? -5 : 15; d < EDGE; d += 40) box(d, d + 3, z - 29, z, tile[1], { "fill-opacity": 0.35 }); // and their joints
    }
    box(EDGE - 120, EDGE - 70, top + 140, top + 200, tint(tile[1], 0.8)); // a roof light
    box(-25, EDGE, zr - 10, zr + 6, tile[1]); // ridge tiles
    box(-25, EDGE, top - 22, top - 10, tint(tile[1], 0.85)); // gutter
    box(-30, -12, top - 22, zr + 8, "#8a6a4a", outline); // the verge board of the gable, edge-on
    box(0, EDGE, top - 40, top - 22, shade); // shadow under the eaves
  } else if (style === "sikma" && f.roofRows) {
    // Mansard: steep slate slope with a dormer, shallow top; the gable end has the attic windows. Haussmann's is zinc,
    // with a row of brick chimney stacks on the ridge.
    const SL = kind === "haussmann" ? "#8d969b" : kind === "stenstad" ? tile[0] : ROOF.slate, SD = kind === "haussmann" ? "#6c757a" : kind === "stenstad" ? tile[1] : ROOF.slateDark;
    const rise = f.roofRows * f.storey, run = rise * 0.28, zt = top + rise;
    const zBack = zt + (EDGE - run) * 0.3;
    // Chimney first: the roof and the gable hide its foot.
    box(EDGE - 175, EDGE - 125, zt, zBack + 80, "#c46a4b");
    box(EDGE - 183, EDGE - 117, zBack + 70, zBack + 82, "#8d4a34");
    if (kind === "haussmann") for (const dc of [EDGE - 290, EDGE - 70].filter((d) => d > run + 40)) { // more stacks, each with its pots
      const zc = zt + (dc - run) * 0.3;
      box(dc - 22, dc + 22, zt, zc + 90, "#b8644a");
      box(dc - 28, dc + 28, zc + 82, zc + 94, "#8d4a34");
      for (const p of [-12, 0, 12]) box(dc + p - 4, dc + p + 4, zc + 94, zc + 112, "#a0553c");
    }
    poly([[0, top], [run, zt], [EDGE, zBack], [EDGE, top]], kind === "haussmann" ? "#a7b0b5" : kind === "stenstad" ? tint(tile[0], 1.15) : shade, outline);
    // A slate slab as thick as the tiled ones: dark underside, then the slate, a gutter at the foot and at the break.
    poly([[-30, top - 4], [run - 16, zt + 40], [EDGE, zBack + 40], [EDGE, zBack], [run, zt], [0, top]], SL);
    poly([[-8, top], [run - 4, zt + 10], [EDGE, zBack + 10], [EDGE, zBack], [run, zt], [0, top]], SD);
    dot(-26, top - 6, 10, SD);
    dot(run - 14, zt + 30, 8, SD);
    // The mansard keeps the columns of the floors below (as wide as theirs): a column where it stands clear of the slope.
    // The regional looks put each window in a dormer's face.
    const win = WINDOWS[kind] || WINDOWS[style], cols = colAxes(win.w).map((c) => c - win.w / 2);
    for (let k = 0; k < f.roofRows; k++) {
      const z0 = top + k * f.storey + 0.25 * f.storey, h = 0.5 * f.storey;
      for (const [i, d0] of cols.entries()) if (d0 >= ((z0 + h - top) / rise) * run + 10 && d0 < EDGE) {
        if (REGIONAL.has(kind)) box(d0 - 18, d0 + win.w + 18, z0 - 16, z0 + h + 22, kind === "haussmann" ? "#f1ece1" : tint(wall, 1.05), outline); // the dormer's face
        window(d0, z0, win.w, h, REGIONAL.has(kind) ? (full + k) * 3 + i : (full + k) * 3);
        if (kind === "haussmann") { const [x1, x2] = [X(d0 - 26), X(d0 + win.w + 26)].sort((p, q) => p - q); el("path", { d: `M${x1} ${surface - z0 - h - 22} Q ${(x1 + x2) / 2} ${surface - z0 - h - 74} ${x2} ${surface - z0 - h - 22} Z`, fill: "#f1ece1", ...outline }, g); }
        else if (REGIONAL.has(kind)) poly([[d0 - 26, z0 + h + 22], [d0 + win.w / 2, z0 + h + 60], [d0 + win.w + 26, z0 + h + 22]], SL, outline);
      }
    }
    // Dormer: only its cheek shows, between the steep slope and its face, under a little roof.
    const slopeD = (z) => ((z - top) / rise) * run;
    const zb = REGIONAL.has(kind) ? top + 0.25 * f.storey - 16 : top + rise * 0.3, zc = REGIONAL.has(kind) ? zb + 0.5 * f.storey + 38 : zb + 140, dF = Math.max(4, slopeD(zb) - 30);
    poly([[slopeD(zb), zb], [dF, zb], [dF, zc], [slopeD(zc), zc]], kind === "haussmann" ? "#7f888d" : tint(SL, 1.35), outline);
    box(dF, dF + 10, zb, zc, SD); // the window frame, edge-on
    if (kind === "haussmann") { // a zinc dormer with its little arched hood
      poly([[dF - 16, zc], [slopeD(zc) + 6, zc], [slopeD(zc) + 6, zc + 22], [dF - 16, zc + 22]], "#9aa3a8", outline);
      const [x1, x2] = [X(dF - 16), X(slopeD(zc) + 6)].sort((p, q) => p - q);
      el("path", { d: `M${x1} ${surface - zc - 22} Q ${(x1 + x2) / 2} ${surface - zc - 60} ${x2} ${surface - zc - 22} Z`, fill: "#9aa3a8", ...outline }, g);
    } else poly([[dF - 14, zc], [slopeD(zc), zc], [slopeD(zc), zc + 34], [dF - 14, zc + 14]], SD); // its little roof
  } else if (!f.flat) {
    const eave = { stredomori: 45, azulejo: 30, galeria: 40, kypr: 40, stenstad: 20, dansky: 30, drevak: 45, puukaupunki: 40, tallinnamaja: 45 }[kind]
      ?? (style === "nizky" ? (kind === "kostka" ? 30 : 55) : 35);
    const small = style === "nizky" || SMALL_RIDGE.has(kind);
    const ridge = small ? RIDGE : tenementGable(kind, f.roofRows, f.flat) ? TENEMENT_RIDGE : EDGE + 200, P = f.pitch;
    // The underside of the roof meets the wall top at the facade; the eaves reach lower, over the street.
    const z = (d) => top + 12 + Math.min(d, ridge) * P - Math.max(0, d - ridge) * P;
    // Chimney first (the roof hides its foot), then the gable up to the roof, then a thick tiled slab.
    const dc = small ? RIDGE + 50 : EDGE - 80;
    if (kind !== "kostel") { // a church has no chimney
      box(dc - 24, dc + 24, top, z(dc) + 100, "#c46a4b");
      box(dc - 32, dc + 32, z(dc) + 90, z(dc) + 102, "#8d4a34");
    }
    poly([[0, top], [Math.min(ridge, EDGE), z(Math.min(ridge, EDGE)) - 12], [EDGE, z(EDGE) - 12], [EDGE, top]], ["kostka", "vila", "sorela", "typovy", "mestan", "skola", "kostel"].includes(kind) ? tint(tile[0], 1.08)
      : tenementGable(kind, f.roofRows, f.flat) ? tint(wall, 1.04) : shade, outline); // a hipped roof shows its slope; a tenement's gable is its plastered wall
    const slab = (d0, d1) => {
      poly([[d0, z(d0)], [d1, z(d1)], [d1, z(d1) + 30], [d0, z(d0) + 30]], tile[0]);
      poly([[d0, z(d0) - 12], [d1, z(d1) - 12], [d1, z(d1)], [d0, z(d0)]], tile[1]);
    };
    slab(-eave, Math.min(ridge, EDGE));
    if (ridge < EDGE) slab(ridge, EDGE);
    box(0, EDGE, top - 26, top, shade); // shadow under the eaves
    if (style === "sikma" && kind !== "typovy" && kind !== "stenstad") for (const d of [-eave + 10, -eave / 2 + 2]) box(d - 5, d + 5, top - 16, z(d) - 12, ROOF.tileDark); // brackets
    else if (wood) box(-eave, -eave + 8, z(-eave) - 40, z(-eave) + 4, "#f6f4ee"); // the white fascia board
    else dot(-eave + 2, z(-eave) - 16, 10, tint(tile[1], 0.9)); // gutter
    if (tenementGable(kind, f.roofRows, f.flat)) dot(-eave + 2, z(-eave) - 16, 10, tint(tile[1], 0.9)); // and a tenement's gutter at its eaves
    if (kind === "stenstad") {
      // A sheet roof: the standing seams' ribs on the slope, the snow guard (snöräcke) along the eaves, a roof ladder.
      for (let d = -eave + 20; d < Math.min(ridge, EDGE); d += 60) box(d - 2, d + 2, z(d) + 30, z(d) + 38, tint(tile[0], 1.5));
      const zg = (d) => z(d) + 30;
      for (const d of [-eave + 14, 10, 34]) box(d - 2, d + 2, zg(d), zg(d) + 32, "#2b2d2f");
      poly([[-eave + 10, zg(-eave + 10) + 26], [40, zg(40) + 26], [40, zg(40) + 32], [-eave + 10, zg(-eave + 10) + 32]], "#2b2d2f");
      poly([[-eave + 10, zg(-eave + 10) + 12], [40, zg(40) + 12], [40, zg(40) + 15], [-eave + 10, zg(-eave + 10) + 15]], "#2b2d2f");
      for (let d = 120; d < EDGE - 40; d += 36) box(d - 10, d + 10, z(d) + 30, z(d) + 36, "#4a4d50"); // the roof walkway
    } else if (kind === "dansky") { // a white dormer (kvist) in the slope, rows of tiles or slates
      for (let zr = top + 40; zr < z(EDGE) - 30; zr += 34) box((zr - top - 12) / P + 8, EDGE, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
      // in the back column of the floors below (its window as wide as theirs), sitting on the slope
      const ww = WINDOWS.dansky.w, db = (125 + EDGE - 30 - ww) / 2 - 12.5, zb = top + (db - 20) * P;
      box(db, db + 120, zb, zb + 130, "#f4f2ec", outline);
      poly([[db - 12, zb + 126], [db + 132, zb + 126], [db + 132, zb + 146], [db - 12, zb + 140]], tile[1]);
      window(db + 12.5, zb + 20, ww, 85, 4);
    } else if (med && !small) { // rows of Roman tiles (coppi, teja árabe), the eaves' double row
      for (let zr = top + 40; zr < z(EDGE) - 26; zr += 26) box((zr - top - 12) / P + 8, EDGE, zr, zr + 5, tile[1], { "fill-opacity": 0.4 });
      for (let d = -eave + 6; d < -2; d += 14) dot(d, z(d) + 4, 6, tint(tile[0], 0.85));
    } else if (kind === "tallinnamaja") { // a sheet roof's seams, a small gable window over the eaves floor
      for (let d = -eave + 20; d < EDGE; d += 60) box(d - 2, d + 2, z(d) + 30, z(d) + 36, tint(tile[0], 1.4));
      const da = (125 + EDGE - 30) / 2; // in the axis of the back column below
      dot(da, top + 80, 24, "#f6f4ee");
      dot(da, top + 80, 17, GLASS);
    } else if (kind === "kostka") {} // the low hipped roof of the cube has no gable
    else if (kind === "skola" || kind === "kostel") { // rows of tiles (slates on a church), no gable
      for (let zr = top + 40; zr < z(Math.min(ridge, EDGE)) - 30; zr += 34) box((zr - top - 12) / P + 8, EDGE, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
    } else if (kind === "typovy") { // rows of tiles and a second chimney
      for (let zr = top + 40; zr < z(Math.min(ridge, EDGE)) - 30; zr += 34) box((zr - top - 12) / P + 8, EDGE, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
      box(EDGE - 200, EDGE - 160, z(EDGE - 180) - 10, z(EDGE - 180) + 90, "#c46a4b");
      box(EDGE - 206, EDGE - 154, z(EDGE - 180) + 82, z(EDGE - 180) + 94, "#8d4a34");
    }
    else if (kind === "vila" || kind === "sorela" || kind === "mestan") { // a hipped roof: rows of tiles on the slope, a dormer with its little gable
      for (let zr = top + 40; zr < z(Math.min(ridge, EDGE)) - 30; zr += 34) {
        const d0 = (zr - top - 12) / P, d1 = Math.min(EDGE, ridge + (z(ridge) - zr) / P);
        if (d1 > d0 + 20) box(d0 + 8, d1 - 8, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
      }
      // its window in the back column of the floors below, as wide as theirs
      const ww = WINDOWS[kind].w, d0 = (125 + EDGE - 30 - ww) / 2, zb = top + 70, dw = d0 - 25, dd = ww + 50;
      box(dw, dw + dd, zb, zb + 110, wall, outline);
      poly([[dw - 14, zb + 106], [dw + dd / 2, zb + 160], [dw + dd + 14, zb + 106]], tile[0], outline);
      window(d0, zb + 18, ww, 72, 2);
    }
    else if (kind === "novyrd") { // a new house: a larch-clad gable with a square window
      for (let d = 30; d < Math.min(ridge, EDGE) * 2 - 30 && d < EDGE; d += 16) {
        const zt = Math.min(z(d), z(d + 8)) - 18;
        if (zt > top + 6) box(d, d + 8, top, zt, tint("#b98a5a", d % 32 ? 1 : 0.88));
      }
      const ww = WINDOWS.novyrd.w, dc = (125 + EDGE - 30) / 2; // in the back column of the floors below, as wide
      box(dc - ww / 2, dc + ww / 2, top + 30, top + 30 + ww, "#3c3f43");
      box(dc - ww / 2 + 6, dc + ww / 2 - 6, top + 36, top + 24 + ww, GLASS);
    } else if (wood) { // the wooden houses: the gable's window in the back column of the floors below, clear of the roof
      const ww = WINDOWS[kind].w, d0 = (125 + EDGE - 30 - ww) / 2;
      noBox = true;
      window(d0, top + 50, ww, Math.min(95, Math.min(z(d0 - 10), z(d0 + ww + 10)) - 12 - top - 60 - 10), 1);
      noBox = false;
    } else if (f.roofRows || small) {
      // A window in the gable in the back column of the floors below (as wide as theirs), kept clear of the roof.
      const ww = (WINDOWS[kind] || WINDOWS[style]).w, d0 = (125 + EDGE - 30 - ww) / 2;
      window(d0, top + 50, ww, Math.min(95, Math.min(z(d0 - 10), z(d0 + ww + 10)) - 12 - top - 60 - 10), 1);
    } else {
      // The round window (volské oko) in the middle of the gable, under its ridge (Bára 23. 11. 2026).
      const dc = ridge, zc = top + (z(ridge) - top) * 0.55;
      dot(dc, zc, 40, tint(wall, 1.15)); // its plaster surround
      dot(dc, zc, 34, FRAME);
      dot(dc, zc, 27, GLASS);
    }
  }

  // --- The side wall, with its plinth (drawn before the door, which stands on the ground) ---
  // Under the building: a cellar band and the same earth as under the street.
  const cellar = GROUND + 60 - surface;
  el("rect", { x, y: surface, width: EDGE, height: cellar, fill: SKLEP }, g);
  box(0, EDGE, -8, 0, tint(SKLEP, 0.85));
  const dCellar = style === "hala" || office ? 32 : 230; // under the ground-floor window, not under the door
  if (!["plocha", "statek", "garaz", "kostel", "malta", "kypr", "drevak", "puukaupunki"].includes(kind)) { // a panel house has it in the plinth, a village house has no cellar window
    box(dCellar, dCellar + 66, -cellar * 0.55 - 6, -cellar * 0.55 + 31, FRAME); // a cellar window
    box(dCellar + 6, dCellar + 60, -cellar * 0.55, -cellar * 0.55 + 25, GLASS);
  }
  el("rect", { x, y: GROUND + 60, width: EDGE, height: 40, fill: "#9b7f5f" }, g);
  // The wall runs on past the cut (Bára 23. 11. 2026): no strip and no outline there, only along the street and the top.
  box(0, EDGE, 0, top, wall);
  // Under a gable turned towards us no line at the wall's top: the gable goes on from the wall without a seam.
  el("path", { d: `${gableOn(kind) ? "" : `M${X(EDGE)} ${surface - top} L`}${gableOn(kind) ? "M" : ""}${X(0)} ${surface - top} L${X(0)} ${surface}`, fill: "none", ...outline }, g);
  // The regional walls: brick courses, azulejo tiles, the ashlar of Malta and Cyprus, boards, Haussmann's rustication.
  if (brick) for (let z = 30, i = 0; z < top; z += 30, i++) { // brick courses with staggered joints (a bond, not boards)
    box(0, EDGE, z - 1.2, z + 1.2, tint(wall, 0.86));
    for (let d = i % 2 ? 50 : 20; d < EDGE; d += 60) box(d - 1, d + 1, z - 30, z, tint(wall, 0.88)); // symmetric to the middle (a gable's axis)
  }
  if (kind === "azulejo") {
    const line = tint(wall, 0.8);
    for (let z = 50; z < top; z += 15) box(0, EDGE, z - 0.6, z + 0.6, line);
    for (let d = 15; d < EDGE; d += 15) box(d - 0.6, d + 0.6, 50, top, line);
    for (let z = 57, i = 0; z < top; z += 15, i++) for (let d = i % 2 ? 7 : 22; d < EDGE; d += 30) dot(d, z, 2.2, tint(wall, 0.62)); // the pattern, as a dot
    box(0, 22, 0, top, "#f0ece2"); // the white stone of the corner
  }
  if (kind === "malta" || (kind === "kypr" && wall !== PALETTES.kypr[2])) {
    for (let z = 34, i = 0; z < top; z += 34, i++) {
      box(0, EDGE, z - 1, z + 1, tint(wall, 0.88));
      for (let d = i % 2 ? 35 : 70; d < EDGE; d += 70) box(d - 1, d + 1, z, Math.min(z + 34, top), tint(wall, 0.9));
    }
  }
  if (wood) {
    const z0 = kind === "tallinnamaja" ? f.ground : 0;
    if (z0) { box(0, EDGE, 0, z0, "#cfc6b0", outline); box(-6, EDGE, z0 - 8, z0 + 4, "#f6f4ee", outline); } // the rendered stone ground floor
    if (det.boards === "vertical") for (let d = 25; d < EDGE; d += 25) box(d - 2, d + 2, z0 + 40, top, tint(wall, 0.8)); // board and batten
    else for (let z = z0 + 15; z < top; z += 15) box(0, EDGE, z - 0.8, z + 0.8, tint(wall, 0.84));
    box(0, 22, z0 + 30, top, "#f6f4ee"); // the white corner board at the street (the house does not turn at the cut)
  }
  if (kind === "haussmann") { // the rusticated shop floor and entresol: light stone, joints every 40 cm
    const RS = tint(wall, 1.04);
    box(0, EDGE, 40, f.ground - 24, RS);
    for (let z = 80; z < f.ground - 24; z += 40) box(0, EDGE, z - 2.5, z + 2.5, tint(wall, 0.84));
  }
  const plinth = office ? [20, "#8a867d"] : {
    haussmann: [40, "#9a958c"], stredomori: [90, tint(wall, 0.78)], azulejo: [40, "#9c968c"], galeria: [60, "#8f8a80"], malta: [30, tint(wall, 0.85)],
    kypr: [30, tint(wall, 0.8)], cihlovy: [50, "#5b5f62"], stit: [50, "#5b5f62"], dansky: [50, "#5b5f62"], stenstad: [60, "#8f8b86"],
    drevak: [40, "#6e6b66"], puukaupunki: [40, "#6e6b66"], tallinnamaja: [40, "#8f8a80"], hanza: [50, "#bdb6a4"], kostel: [120, STONE], garaz: [15, "#8a867d"], skola: [90, "#a59c88"], mestan: [70, STONE], sorela: [100, "#a89a7f"], vila: [70, "#a59c88"], kostka: [110, "#8f8a80"], novyrd: [30, "#56585b"], statek: [55, "#8a8173"] }[kind]
    || { sikma: [90, STONE], funkce: [60, "#8f887c"], povalecny: [45, "#8c8a85"], moderni: [30, "#56585b"], plocha: [100, "#8a867d"], nizky: [60, "#a59c88"] }[style];
  if (plinth) box(-8, EDGE, 0, plinth[0], plinth[1]);

  // Windows and the ground floor. A panel house and a school keep their windows (and columns) for a set-back floor
  // (setBack(z of the floor, n, its front): below).
  let setBack = null;
  if (factory) {
    // A Prague brick factory hall: brick courses, a dark plinth, tall gridded industrial windows.
    for (let z = 30; z < top; z += 30) box(0, EDGE, z - 2, z + 2, tint(wall, 0.88));
    box(0, EDGE, 0, 70, "#8a5a48");
    const wh = Math.min(top - 220, 420), z0 = 120;
    for (const d of [130, 255, 380]) { // the third across the cut
      box(d - 8, d + 108, z0 - 8, z0 + wh + 8, FRAME);
      box(d, d + 100, z0, z0 + wh, GLASS);
      poly([[d + 50, z0 + wh], [d + 100, z0 + wh], [d + 100, z0 + wh * 0.6]], GLINT);
      for (let k = 33; k < 100; k += 33) box(d + k - 2, d + k + 2, z0, z0 + wh, FRAME);
      for (let k = 40; k < wh; k += 40) box(d, d + 100, z0 + k - 2, z0 + k + 2, FRAME);
      box(d - 14, d + 114, z0 + wh + 8, z0 + wh + 22, tint(wall, 0.75)); // brick lintel
    }
    // A plank door with an arched brick head, standing on the ground near the street.
    box(10, 120, 0, 14, "#9a8a7c");
    box(18, 112, 14, 270, tint(wall, 0.75));
    box(26, 104, 14, 262, DOOR);
    for (let d = 39; d < 104; d += 13) box(d - 1, d + 1, 14, 262, tint(DOOR, 0.8));
    arch(65, 270, 47, tint(wall, 0.75));
    arch(65, 270, 39, GLASS);
  } else if (style === "hala") {
    // The ribbon window stays above the door or gate (a low hall gets a lower gate and a slimmer band).
    const gateH = Math.min(340, top * 0.5), shopH = Math.min(310, top * 0.5);
    const zr = Math.max(top * 0.55, (shop ? shopH : gateH) + 50), hr = Math.min(170, top * 0.25, top - 90 - zr);
    for (let d = 20; d < EDGE; d += 30) box(d, d + 3, 0, top - 40, shade); // corrugated cladding
    if (hr >= 40) {
      box(0, EDGE, zr - 8, zr + hr + 8, FRAME);
      box(8, EDGE, zr, zr + hr, GLASS);
      poly([[EDGE - 170, zr + hr], [EDGE - 120, zr + hr], [EDGE - 180, zr], [EDGE - 230, zr]], GLINT);
      const span = EDGE - 46, parts = Math.round(span / 120);
      for (let i = 1; i < parts; i++) box(8 + (i * span) / parts - 3, 8 + (i * span) / parts + 3, zr, zr + hr, FRAME);
    }
    box(0, EDGE, top - 80, top - 40, accent); // coloured band
    if (shop) {
      box(0, 190, 0, shopH, FRAME);
      box(8, 182, 0, shopH - 10, GLASS);
      box(93, 97, 0, shopH - 10, FRAME);
      poly([[100, shopH - 10], [182, shopH - 10], [182, shopH - 110]], GLINT);
    } else {
      box(150, 340, 0, gateH, "#9aa3aa", outline); // roller door
      for (let z = 20; z < gateH; z += 30) box(150, 340, z, z + 4, "#868f96");
    }
  } else if (office) {
    // Offices: ribbon windows with mullions, a glazed ground floor.
    for (let k = 0; k < full; k++) {
      const z0 = floorZ(k), h = floorH(k);
      box(0, EDGE, z0 + h * 0.08, z0 + h * (k ? 0.82 : 0.9), FRAME); // the ribbon runs on past the cut
      box(8, EDGE, z0 + h * 0.12, z0 + h * (k ? 0.78 : 0.86), GLASS);
      const gTop = z0 + h * (k ? 0.78 : 0.86);
      poly([[EDGE - 150, gTop], [EDGE - 100, gTop], [EDGE - 160, z0 + h * 0.12], [EDGE - 210, z0 + h * 0.12]], GLINT);
      for (let d = 8 + 120; d < EDGE; d += 120) box(d - 3, d + 3, z0 + h * 0.12, gTop, FRAME);
      if (k) { box(0, EDGE, z0 - 4, z0 + h * 0.08, accent); } // spandrel band
    }
    box(14, 116, 0, 262, FRAME); // glazed entrance with a flat canopy
    box(22, 108, 0, 254, GLASS);
    box(63, 67, 0, 254, FRAME);
    canopy(14, 116, 262, dark);
  } else if (style === "moderni") {
    // A new-built block of flats (after 1995): crisp render with an accent panel (anthracite or
    // larch), tall windows down to the floor in anthracite frames, a glazed lobby on the ground
    // floor; glass balconies and the slab edges are drawn with what sticks out.
    const ANTH = "#3c3f43", LARCH = "#b98a5a";
    const accentPanel = seed % 2 ? ANTH : LARCH;
    box(EDGE - 150, EDGE, plinth[0], top, accentPanel); // the accent panel at the back
    if (accentPanel === LARCH) for (let d = EDGE - 140; d < EDGE; d += 14) box(d, d + 2, plinth[0], top, tint(LARCH, 0.85));
    // Lobby: a glazed entrance, anthracite frame, a letter-box panel.
    box(10, 150, plinth[0], f.ground - 30, ANTH);
    box(18, 142, plinth[0] + 8, f.ground - 38, GLASS);
    poly([[90, f.ground - 38], [142, f.ground - 38], [142, f.ground - 120]], GLINT);
    box(78, 82, plinth[0] + 8, f.ground - 38, ANTH);
    box(165, EDGE - 165, plinth[0] + 60, f.ground - 50, ANTH); // ground-floor window
    box(171, EDGE - 171, plinth[0] + 66, f.ground - 56, GLASS);
    box(EDGE - 115, EDGE - 35, plinth[0] + 60, f.ground - 50, ANTH); // and one in the accent panel
    box(EDGE - 109, EDGE - 41, plinth[0] + 66, f.ground - 56, GLASS);
    const french = (d0, d1, z, h, n) => { // a window to the floor with a fixed lower pane
      const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13;
      box(d0, d1, z, z + h, ANTH);
      box(d0 + 5, d1 - 5, z + 5, z + h - 5, luck === 5 ? LIT : GLASS);
      poly([[d0 + (d1 - d0) * 0.5, z + h - 5], [d1 - 5, z + h - 5], [d1 - 5, z + h * 0.55]], luck === 5 ? "#f8e7b5" : GLINT);
      box(d0, d1, z + 95, z + 99, ANTH); // the glass balustrade's line inside
      box((d0 + d1) / 2 - 2, (d0 + d1) / 2 + 2, z + 99, z + h, ANTH);
    };
    for (let k = 1; k < full; k++) {
      const z0 = floorZ(k), h = f.storey;
      french(20, 120, z0 + 10, 0.82 * h, k * 3); // to the balcony at the street end
      french(150, EDGE - 160, z0 + 10, 0.82 * h, k * 3 + 1);
      french(EDGE - 120, EDGE - 30, z0 + 10, 0.82 * h, k * 3 + 2); // in the accent panel, a pier's width from the cut
      box(0, EDGE, z0 - 3, z0 + 3, tint(wall, 0.9)); // floor line
    }
  } else if (style === "funkce") {
    // A functionalist tenement (1925–45): smooth light plaster in horizontal bands (a parapet band
    // on every floor), a clad ground floor with a shop window in a steel frame and the house door
    // under a thin canopy, "Prague windows" (a large undivided fixed pane between two narrow
    // casements with top lights) lying flat, a balcony door at the street end, sometimes a bay.
    const STEEL = "#3f4144";
    const cladding = seed % 2 ? ["#d8ccb3", 40, 1000] : seed % 4 === 0 ? ["#4f6a5a", 20, 10] : ["#7a4a3c", 20, 10];
    const [clad, cw, chh] = cladding; // travertine slabs, or ceramic tiles 20 × 10 cm
    box(0, EDGE, plinth[0], f.ground - 20, clad);
    for (let z = plinth[0] + (chh < 100 ? chh : 40); z < f.ground - 20; z += chh < 100 ? chh : 40) box(0, EDGE, z - 0.5, z + 0.5, chh < 100 ? "#e9e4d8" : tint(clad, 0.9), chh < 100 ? { "fill-opacity": 0.5 } : {});
    for (let d = cw; d < EDGE; d += cw) box(d - 0.5, d + 0.5, plinth[0], f.ground - 20, chh < 100 ? "#e9e4d8" : tint(clad, 0.9), chh < 100 ? { "fill-opacity": 0.5 } : {});
    // House door: steel, glass behind a three-bar grille, a top light, a thin canopy over the pavement.
    const doorTop = Math.min(240, f.ground - 90);
    box(14, 134, 0, doorTop + 48, STEEL);
    box(22, 126, 8, doorTop, GLASS);
    box(22, 126, doorTop + 8, doorTop + 40, GLASS);
    for (let z = 60; z < doorTop; z += 30) box(22, 126, z, z + 4, STEEL);
    box(-90, 0, doorTop + 52, doorTop + 58, tint(wall, 0.7));
    box(-90, 140, doorTop + 58, doorTop + 70, trim, outline);
    // Shop: a big window in a steel frame on a granite sill, the fascia for its lettering.
    const s0 = 160, s1 = EDGE - 40, sTop = f.ground - 80;
    box(s0 - 6, s1 + 6, 40, sTop + 6, STEEL);
    box(s0, s1, 46, sTop, GLASS);
    poly([[s0 + (s1 - s0) * 0.55, sTop], [s1, sTop], [s1, sTop - 120]], GLINT);
    box((s0 + s1) / 2 - 2, (s0 + s1) / 2 + 2, 46, sTop, STEEL);
    box(s0 - 6, s1 + 6, sTop + 6, sTop + 36, "#efe6d2", outline); // fascia with "letters"
    for (let i = 0; i < 4; i++) box(s0 + 20 + i * 34, s0 + 38 + i * 34, sTop + 14, sTop + 28, STEEL);
    const W = Math.min(200, EDGE - 30 - 150 - 20), wd = 150;
    const prague = (z, h, n) => { // the "Prague window": thin frames, the middle pane undivided
      const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13, d = wd, w = W;
      box(d - 4, d + w + 4, z - 4, z + h + 4, FRAME);
      box(d, d + w, z, z + h, luck === 5 ? LIT : GLASS);
      poly([[d + w * 0.5, z + h], [d + w * 0.78, z + h], [d + w * 0.78, z + h * 0.45]], luck === 5 ? "#f8e7b5" : GLINT);
      for (const t of [0.22, 0.78]) box(d + w * t - 2, d + w * t + 2, z, z + h, FRAME);
      for (const [a0, a1] of [[d, d + w * 0.22], [d + w * 0.78, d + w]]) box(a0, a1, z + h * 0.74 - 2, z + h * 0.74 + 2, FRAME); // top lights of the casements
      if (luck === 2 || luck === 9) for (let i = 0; i < 5; i++) dot(d + 10 + (i * (w - 20)) / 4, z + 4, 8, i % 2 ? "#e2607a" : "#6fae4f");
    };
    for (let k = 1; k < full; k++) {
      const z0 = floorZ(k), h = f.storey, sill = z0 + 0.3 * h;
      box(0, EDGE, sill - 60, sill - 10, tint(wall, 0.95)); // parapet zone and band: the horizontal lines
      box(-4, EDGE, sill - 10, sill - 2, "#f4efe4", outline);
      prague(sill, 0.48 * h, k);
      box(20, 104, z0, z0 + 0.82 * h, FRAME); // balcony door at the street end
      box(25, 99, z0 + 5, z0 + 0.82 * h - 5, GLASS);
      box(25, 99, z0 + 0.62 * h, z0 + 0.62 * h + 4, FRAME);
    }
  } else if (style === "povalecny") {
    // A postwar block of flats in the west (1946–90; Bára 23. 11. 2026): plain smooth render without ornament; a glazed
    // house door in a light metal frame up two steps under a thin slab, regular rows of wide windows with roller
    // shutters (the shutter box over each, some let half down), a balcony door at the street end. No panel joints, no
    // machine room. The balconies stick out (below), the flat roof has a thin parapet (the roof).
    const doorTop = Math.min(230, f.ground - 50);
    box(6, 138, 0, 10, tint(plinth[1], 1.18), outline); // two steps
    box(12, 132, 10, 20, tint(plinth[1], 1.18), outline);
    box(16, 126, 20, doorTop + 40, PV_METAL);
    for (const [d0, d1] of [[22, 68], [72, 120]]) {
      box(d0, d1, 26, doorTop, GLASS);
      poly([[d0 + (d1 - d0) * 0.5, doorTop], [d1, doorTop], [d1, doorTop - 50]], GLINT);
    }
    box(22, 120, doorTop + 6, doorTop + 34, GLASS); // top light
    box(60, 64, 90, 140, "#5d5f62"); // handle
    box(-70, 140, doorTop + 40, doorTop + 46, tint(wall, 0.72)); // the canopy's shadow and its thin slab
    box(-75, 140, doorTop + 46, doorTop + 58, "#dcd8cf", outline);
    // A window of two casements with its roller shutter.
    const shuttered = (d, z, w, h, n) => {
      const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13, lit = luck === 5;
      const down = luck === 3 || luck === 10 ? 0.5 : luck === 7 ? 0.85 : 0.1; // how far the shutter is let down
      box(d - 5, d + w + 5, z - 5, z + h + 5, FRAME);
      box(d, d + w, z, z + h, lit ? LIT : GLASS);
      poly([[d + w * 0.55, z + h], [d + w, z + h], [d + w, z + h * 0.5]], lit ? "#f8e7b5" : GLINT);
      box(d + w / 2 - 3, d + w / 2 + 3, z, z + h, FRAME);
      box(d, d + w, z + h * (1 - down), z + h, PV_SHUTTER);
      for (let zz = z + h - 8; zz > z + h * (1 - down) + 2; zz -= 8) box(d, d + w, zz - 1, zz, tint(PV_SHUTTER, 0.85));
      box(d - 8, d + w + 8, z + h + 5, z + h + 26, tint(wall, 0.94), outline); // the shutter box
      box(d - 10, d + w + 10, z - 12, z - 5, "#b9b6ae"); // the sill
      if ((luck === 2 || luck === 9) && !lit) for (let i = 0; i < 5; i++) dot(d + 10 + (i * (w - 20)) / 4, z + 5, 8, i % 2 ? "#e2607a" : "#6fae4f");
    };
    const win = WINDOWS.povalecny, wd = (126 + EDGE - 30 - win.w) / 2; // in the axis between the door and the back
    const wd2 = 2 * wd + win.w / 2 - 60; // the next window, on the pitch from the balcony door, across the cut
    for (const [i, d] of [wd, wd2].entries()) shuttered(d, plinth[0] + 0.3 * f.ground, win.w, win.h * f.storey, i);
    for (let k = 1; k < full; k++) {
      const z0 = floorZ(k), h = f.storey;
      box(20, 100, z0, z0 + 0.8 * h, FRAME); // the balcony door at the street end, its shutter box
      box(26, 94, z0 + 6, z0 + 0.8 * h - 6, GLASS);
      box(26, 94, z0 + 0.55 * h, z0 + 0.55 * h + 4, FRAME);
      box(14, 106, z0 + 0.8 * h, z0 + 0.8 * h + 20, tint(wall, 0.94), outline);
      for (const [i, d] of [wd, wd2].entries()) shuttered(d, z0 + win.sill * h, win.w, win.h * h, k * 3 + i);
    }
  } else if (style === "plocha") {
    // A panel house (revitalised): the panel grid of joints, loggias let into the corner by the
    // street with coloured parapets, wide windows in the panel bays, an entrance under a slab.
    // Sizes of a Czech panel house (cm; T06B, VVÚ-ETA, PS-69): storey 280, a raised ground floor on
    // a 100 cm plinth, windows 200 × 150 on a 90 cm parapet set deep in the insulation, loggias
    // 120 deep at the street corner, the entrance at street level, panel joints showing through.
    const LOG = 120; // depth of the loggias from the street facade
    const STEP = 0; // the entrance is level with the pavement (Bára)
    const joint = tint(wall, 0.76);
    // A storey stretched by the building's known height (often 3.3–3.5 m from IPR) gets a taller
    // window on a higher parapet, so the wall between the rows does not gape.
    const WW = 190, WH = Math.min(175, 150 + Math.max(0, f.storey - 280) * 0.4), WD = (LOG + EDGE - 34 - WW) / 2;
    const WD2 = WD + WW + 2 * (WD - LOG); // the next panel's window across the cut (the joint at the back between them)
    const SILL = Math.min(90 + Math.max(0, f.storey - 280) * 0.3, f.storey - WH - 30);
    const PVC = "#f6f3ec";
    // A revitalised window: white plastic in three upright panes (Bára), in a deep reveal of the
    // insulation, a grey metal sill; a lit pane or flowers now and then.
    const panelWindow = (z, n, d = WD, w = WW) => {
      const luck = (((n + seed * 31) * 2654435761) >>> 0) % 11;
      const h = WH;
      box(d - 8, d + w + 8, z - 2, z + h + 8, tint(wall, 0.82)); // reveal
      box(d, d + w, z, z + h, PVC);
      box(d + 7, d + w - 7, z + 7, z + h - 7, luck === 4 ? LIT : GLASS);
      box(d + 7, d + w - 7, z + h - 15, z + h - 7, tint(luck === 4 ? LIT : GLASS, 0.75)); // shade of the lintel
      poly([[d + w * 0.62, z + h - 15], [d + w - 7, z + h - 15], [d + w - 7, z + h * 0.45]], luck === 4 ? "#f8e7b5" : GLINT);
      for (const t of [1 / 3, 2 / 3]) box(d + w * t - 4, d + w * t + 4, z, z + h, PVC); // mullions
      box(d - 12, d + w + 12, z - 9, z - 5, tint(wall, 0.9)); // shadow under the sill
      box(d - 12, d + w + 12, z - 5, z, "#c9ccd0"); // metal sill
      if (luck === 1 || luck === 8) for (let i = 0; i < 5; i++) dot(d + 14 + (i * (w - 28)) / 4, z + 6, 8, i % 2 ? "#d9748a" : "#7f9f6a");
    };
    setBack = (z, n, back) => { // in the axis of the windows below, as wide as the floor allows
      const axis = WD + WW / 2, w = Math.min(WW, 2 * (axis - back - 12));
      panelWindow(z + SILL, n, axis - w / 2, w);
      panelWindow(z + SILL, n + 1, WD2);
    };
    // Cellar window in the plinth, above the pavement.
    box(200, 290, 30, 70, "#d9d6cf");
    box(206, 284, 36, 64, GLASS);
    // Entrance: level with the pavement, an anodised aluminium portal: a door leaf with a vertical handle,
    // a fixed side panel, a top light, a kick plate; a thin concrete canopy over it. It stands in
    // the column of the loggias, inside the facade.
    const ALU = "#bcbab4", door0 = 16, door1 = LOG - 8, doorTop = STEP + 210, lightTop = Math.min(STEP + 270, f.ground - 16);
    box(door0 - 6, door1 + 6, 0, 6, tint(plinth[1], 1.15)); // threshold
    box(door0 - 10, door1 + 10, STEP, lightTop + 10, tint(wall, 0.86)); // reveal around the portal
    box(door0, door1, STEP, lightTop, ALU);
    const panes = [[door0 + 8, door0 + 68], [door0 + 76, door1 - 8]]; // door leaf, side panel
    const ENTRY_GLASS = "#4a5578"; // lighter than the windows: the lit staircase shows through
    box(door0 + 8, door1 - 8, STEP + 8, STEP + 48, tint(ALU, 0.85)); // kick plate
    for (const [d0, d1] of panes) {
      box(d0, d1, STEP + 48, doorTop - 6, ENTRY_GLASS);
      poly([[d0 + (d1 - d0) * 0.55, doorTop - 6], [d1, doorTop - 6], [d1, doorTop - 60]], "#6a7396");
    }
    box(door0 + 56, door0 + 63, STEP + 80, STEP + 140, "#7d7a74"); // handle on the leaf
    box(door0 + 8, door1 - 8, doorTop + 2, lightTop - 8, ENTRY_GLASS); // top light
    panelWindow(plinth[0] + SILL, 0);
    panelWindow(plinth[0] + SILL, 1, WD2);
    for (let k = 1; k < full; k++) {
      const z0 = floorZ(k), h = f.storey;
      // The loggia: a recess, its ceiling slab, a solid parapet in the accent colour under a light coping.
      box(0, LOG, z0, z0 + h, tint(wall, 0.55));
      box(0, LOG, z0 + h - 18, z0 + h, tint(wall, 0.78));
      box(0, LOG, z0, z0 + 101, accent, outline);
      box(0, LOG, z0 + 98, z0 + 101, tint(accent, 0.7));
      box(-4, LOG, z0 + 101, z0 + 107, "#e8e5de"); // coping
      if ((k + seed) % 4 === 1) { box(28, 58, z0 + 107, z0 + 129, "#b5714a"); dot(43, z0 + 140, 15, "#7f9f6a"); }
      panelWindow(z0 + SILL, k);
      panelWindow(z0 + SILL, k + 7, WD2);
    }
    // Joints over everything: one at every floor, one at the loggias, one at the back.
    for (let k = 1; k <= full; k++) box(0, EDGE, floorZ(k) - 2, floorZ(k) + 3, joint);
    box(0, EDGE, plinth[0] - 2, plinth[0] + 2, tint(plinth[1], 0.8)); // top of the plinth
    box(LOG - 2, LOG + 3, lightTop + 30, top, joint); // the loggia joint starts above the canopy
    box(EDGE - 36, EDGE - 31, plinth[0], top, joint);
    box(-40, LOG, lightTop + 4, lightTop + 10, tint(wall, 0.6)); // canopy: shadow, slab, flashing
    box(-40, LOG, lightTop + 10, lightTop + 28, "#c4bfb5", outline);
    box(-40, LOG, lightTop + 28, lightTop + 31, "#9a9690");
  } else if (kind === "kostel") {
    // A church seen from the side: tall pointed windows with tracery, a stepped buttress at the back.
    const GL = "#3d4a7a", w0 = Math.max(plinth[0] + 120, top * 0.3), w1 = top - 160;
    for (const d of [70, 200, 330]) { // the third across the cut, the church goes on
      box(d - 10, d + 80, w0 - 10, w1, tint(wall, 0.85));
      arch(d + 35, w1, 45, tint(wall, 0.85));
      box(d, d + 70, w0, w1, GL);
      arch(d + 35, w1, 35, GL);
      box(d + 33, d + 37, w0, w1 + 35, FRAME); // the mullion
      for (let zz = w0 + 60; zz < w1; zz += 60) box(d, d + 70, zz - 1, zz + 1, tint(GL, 1.3)); // leading
    }
    box(280, 320, 0, top * 0.75, tint(wall, 0.9), outline); // buttress, stepped, between the windows
    poly([[280, top * 0.75], [320, top * 0.75 + 40], [320, top * 0.75]], tint(wall, 0.8));
    box(-6, EDGE, top - 36, top, tint(wall, 1.08), outline); // the eaves cornice
  } else if (kind === "garaz") {
    // A row of garages seen from the side: a blank rendered wall, a vent, a thin roof slab sloping back.
    box(0, EDGE, 0, 12, tint(wall, 0.8));
    box(EDGE / 2 - 30, EDGE / 2 + 30, top - 70, top - 40, tint(wall, 0.7));
    for (let zz = top - 66; zz < top - 42; zz += 6) box(EDGE / 2 - 26, EDGE / 2 + 26, zz, zz + 2, tint(wall, 0.85));
  } else if (kind === "skola") {
    // A school: a wide double door up three steps under a canopy, big windows of three parts on every floor,
    // a string course between the floors.
    for (let i = 0; i < 3; i++) box(6, 150 - i * 12, i * 18, (i + 1) * 18, tint(plinth[1], 1.12), outline);
    box(12, 140, 54, 54 + 250, FRAME);
    box(20, 132, 54, 54 + 242, DOOR);
    box(74, 78, 54, 54 + 242, tint(DOOR, 0.8));
    box(20, 132, 54 + 190, 54 + 242, GLASS);
    canopy(12, 140, 54 + 255, dark);
    if (full > 1) { dot(76, floorZ(1) + f.storey * 0.55, 34, FRAME); dot(76, floorZ(1) + f.storey * 0.55, 28, "#f8f5ec"); // a clock over the door
      box(74, 78, floorZ(1) + f.storey * 0.55, floorZ(1) + f.storey * 0.55 + 22, "#3c3f43"); box(76, 96, floorZ(1) + f.storey * 0.55 - 2, floorZ(1) + f.storey * 0.55 + 2, "#3c3f43"); }
    const big = (z, h, n) => {
      const d0 = 170, d1 = EDGE - 45, luck = (((n + seed * 31) * 2654435761) >>> 0) % 13;
      box(d0 - 8, d1 + 8, z - 8, z + h + 8, FRAME);
      box(d0, d1, z, z + h, luck === 5 ? LIT : GLASS);
      poly([[d0 + (d1 - d0) * 0.6, z + h], [d1, z + h], [d1, z + h * 0.5]], luck === 5 ? "#f8e7b5" : GLINT);
      for (const t of [1 / 3, 2 / 3]) box(d0 + (d1 - d0) * t - 3, d0 + (d1 - d0) * t + 3, z, z + h, FRAME);
      box(d0, d1, z + h * 0.72 - 3, z + h * 0.72 + 3, FRAME);
      box(d0 - 14, d1 + 14, z - 14, z - 6, dark); // sill
    };
    big(f.ground * 0.3, f.ground * 0.55, 0);
    setBack = (z, n, back) => { if (back <= 160) big(z + f.storey * 0.25, f.storey * 0.6, n); };
    for (let k = 1; k < full; k++) {
      box(-10, EDGE, floorZ(k) - 10, floorZ(k), trim, outline); // string course
      big(floorZ(k) + f.storey * 0.25, f.storey * 0.6, k);
      if (k > 1) window(40, floorZ(k) + f.storey * 0.3, 80, f.storey * 0.5, k * 7); // a narrower window by the street
    }
  } else {
    // Door near the street (arched in a tenement), windows behind it, and on every floor above.
    const win = WINDOWS[kind] || WINDOWS[style];
    // A gable turned towards us: the door in the front column, the house mirror-symmetric to the gable's axis.
    const gAxes = gableOn(kind) ? gableAxes(kind) : null, dd = gAxes ? gAxes[0] - 65 : 0;
    if (kind === "statek") {
      // A village house: no door by the street; small windows with a cross, the plank door into the yard behind.
      for (const d of [60, 170]) window(d, f.ground * win.sill, win.w, win.h * f.storey, d);
      box(262, 352, 0, 205, tint(wall, 0.8));
      box(268, 346, 0, 199, DOOR);
      for (let d = 281; d < 346; d += 13) box(d - 1, d + 1, 0, 199, tint(DOOR, 0.8));
      dot(334, 100, 5, "#f2d27a");
    } else {
      if (kind === "sorela") { // a rusticated ground floor: stone blocks with deep joints, under the windows and the door
        box(0, EDGE, plinth[0], f.ground - 22, tint(STONE, 1.12));
        for (let z = plinth[0] + 40, i = 0; z < f.ground - 30; z += 40, i++) {
          box(0, EDGE, z - 3, z + 3, tint(STONE, 0.85));
          for (let d = i % 2 ? 40 : 0; d < EDGE; d += 80) if (d) box(d - 2, d + 2, z, Math.min(z + 40, f.ground - 22), tint(STONE, 0.85));
        }
      }
      // A cube family house has its door up a flight of steps (a raised ground floor over the garage), with a rail.
      // A canal house of the North Sea has its door up its stoep from the street (every other house).
      const stoep = stoepZ(kind, info) > 0;
      const z0 = kind === "kostka" ? plinth[0] : stoepZ(kind, info);
      const doorH = Math.min(240, f.ground * 0.72);
      const doorFrame = kind === "novyrd" ? "#3c3f43" : FRAME;
      box(dd ? 0 : 10, 120 + dd, z0, z0 + 14, tint(plinth?.[1] || STONE, 1.15)); // doorstep (the landing)
      if (z0 && !stoep) {
        const steps = 6, rise = z0 / steps, tread = 28;
        for (let i = 0; i < steps; i++) box(120, 120 + (steps - i) * tread, i * rise, (i + 1) * rise, tint(plinth[1], 1.12), outline);
        box(122, 124, z0 + 14, z0 + 104, "#4d4f52"); // the rail: posts and a handrail along the flight
        box(120 + steps * tread - 2, 120 + steps * tread, 0, 100, "#4d4f52");
        poly([[122, z0 + 100], [120 + steps * tread, 96], [120 + steps * tread, 104], [122, z0 + 108]], "#4d4f52");
      }
      if (stoep) { // five steps out into the street with an iron rail
        for (let i = 0; i < 5; i++) box(-(5 - i) * 22, 10, i * 15, (i + 1) * 15, "#6a6e71", outline);
        box(-112, -108, 0, 100, "#2b2d2f");
        poly([[-112, 96], [-2, z0 + 96], [-2, z0 + 102], [-112, 102]], "#2b2d2f");
        box(-4, 0, z0, z0 + 100, "#2b2d2f");
      }
      const doorCol = brick ? (houseHash(info) % 3 ? "#23382c" : "#1f2224") : kind === "haussmann" ? "#3f4a3c" : kind === "malta" ? pal("maltaAccent") : kind === "kypr" ? shutterCol : med ? "#6b4a30" : DOOR;
      if (kind === "haussmann") {
        // The porte cochère: a tall arched carriage door in a stone frame, its fanlight.
        const dh = Math.min(f.ground - 80, 400) - 60;
        box(8, 152, 0, dh + 10, tint(wall, 0.9), outline);
        arch(80, dh + 10, 72, tint(wall, 0.9));
        box(16, 144, 14, dh, doorCol);
        arch(80, dh, 64, GLASS);
        for (const d of [56, 104]) box(d - 2, d + 2, dh, dh + 60, FRAME);
        box(78, 82, 14, dh, tint(doorCol, 0.7));
        for (const zz of [60, dh * 0.5]) box(16, 144, zz, zz + 4, tint(doorCol, 0.8));
      } else {
      box(16 + dd, 114 + dd, z0 + 14, z0 + doorH + 10, doorFrame);
      box(24 + dd, 106 + dd, z0 + 14, z0 + doorH, kind === "novyrd" ? "#3c3f43" : doorCol);
      dot(94 + dd, z0 + doorH * 0.4, 5, "#f2d27a");
      }
      if (kind === "haussmann") {}
      else if (kind === "sikma" || kind === "mestan" || kind === "stenstad" || kind === "dansky" || kind === "hanza" || med) { arch(65 + dd, doorH + 10, 49, kind === "hanza" ? "#bdb6a4" : FRAME); arch(65 + dd, doorH + 10, 41, GLASS); } // arched transom
      else if (brick) { box(16 + dd, 114 + dd, z0 + doorH + 10, z0 + doorH + 50, WF); box(24 + dd, 106 + dd, z0 + doorH + 14, z0 + doorH + 46, GLASS); } // a top light
      else if (kind === "drevak") {
        // The little porch (farstukvist): two posts and a gabled roof over the door, seen from the front.
        box(4, 12, 0, doorH + 30, "#f6f4ee", outline);
        box(118, 126, 0, doorH + 30, "#f6f4ee", outline);
        poly([[-10, doorH + 30], [65, doorH + 90], [140, doorH + 30]], tile[0], outline);
        poly([[10, doorH + 36], [65, doorH + 78], [120, doorH + 36]], wall);
        box(-10, 140, doorH + 24, doorH + 32, "#f6f4ee");
      }
      else if (kind === "sorela") { // a stone surround and a top light
        box(4, 126, 0, doorH + 70, tint(plinth[1], 1.1), outline);
        box(16, 114, 14, doorH + 50, FRAME);
        box(24, 106, 14, doorH, DOOR);
        box(24, 106, doorH + 10, doorH + 42, GLASS);
      } else if (kind === "novyrd") box(34, 50, z0 + 30, z0 + doorH - 20, GLASS); // a slot of glass in the door
      else {
        box(30, 100, z0 + doorH * 0.7, z0 + doorH - 8, GLASS);
        canopy(16, 114, z0 + doorH + 10, style === "nizky" ? tile[0] : dark);
      }
    }
    // The windows above stand in the axes of the door and of the ground-floor window.
    // Behind an arcade (drawn over the front 2.6 m) the ground-floor window moves back, clear of it.
    const backAxis = gAxes ? gAxes[1] - win.w / 2 : (125 + EDGE - 30 - win.w) / 2;
    const groundAt = info?.arcade ? Math.min(ARCADE_D + 25, EDGE - 40 - win.w) : backAxis;
    const shut = med && kind !== "azulejo" && kind !== "galeria";
    const win2 = (d, z, w, h, n) => { window(d, z, w, h, n); if (shut) shutters(d, z, w, h, n); };
    if (kind === "haussmann") {
      // The shop window of the ground floor, under the entresol's band.
      const s0 = 175, s1 = EDGE + 30, sTop = Math.min(f.ground - 150, 330); // on past the cut
      box(s0 - 8, s1 + 8, 40, sTop + 8, "#3f4a3c");
      box(s0, s1, 48, sTop, GLASS);
      poly([[s0 + (s1 - s0) * 0.55, sTop], [s1, sTop], [s1, sTop - 110]], GLINT);
      box((s0 + s1) / 2 - 2, (s0 + s1) / 2 + 2, 48, sTop, "#3f4a3c");
      window(groundAt + 20, sTop + 50, win.w * 0.8, Math.min(110, f.ground - sTop - 90), 0); // the entresol's window
    } else if (kind !== "statek") {
      win2(groundAt, f.ground * win.sill + (style === "sikma" ? 40 : 0) + (stoepZ(kind, info)), win.w, win.h * f.storey, 0);
      if (!info?.arcade) for (const c of (gAxes || colAxes(win.w)).slice(2)) win2(c - win.w / 2, f.ground * win.sill + (style === "sikma" ? 40 : 0) + stoepZ(kind, info), win.w, win.h * f.storey, 1);
    }
    const gallarija = kind === "malta" ? new Set(full >= 4 ? [1, 2] : full >= 2 ? [1] : []) : null;
    for (let k = 1; k < full; k++) {
      if (kind === "galeria") { // the glazed gallery over the whole wall, joining the one over the street
        const z = floorZ(k), h = f.storey;
        box(0, EDGE, z + 6, z + h - 6, "#f4f4f0", outline);
        box(6, EDGE, z + 0.28 * h, z + h - 14, "#7f95a8");
        poly([[EDGE * 0.45, z + h - 14], [EDGE, z + h - 14], [EDGE, z + 0.45 * h]], "#a9bccb");
        for (let d = 6 + 44; d < EDGE; d += 44) box(d - 3, d + 3, z + 0.28 * h, z + h - 14, "#f4f4f0");
        for (let d = 6 + 22; d < EDGE; d += 44) box(d - 1.5, d + 1.5, z + 0.7 * h, z + h - 14, "#f4f4f0");
        box(6, EDGE, z + 0.7 * h - 3, z + 0.7 * h + 3, "#f4f4f0");
        box(0, EDGE, z + 0.24 * h, z + 0.28 * h, "#f4f4f0");
        continue;
      }
      for (const [i, c] of (gAxes || colAxes(win.w)).entries()) {
        if (i === 0 && gallarija?.has(k)) { // the gallarija turns the corner: its front over the front column
          const col = pal("maltaAccent"), z = floorZ(k) + 20, h = f.storey * 0.8, d1 = c + win.w / 2 + 14;
          box(0, d1, z - 10, z, tint(wall, 0.95), outline);
          box(0, d1, z, z + h, col, { stroke: tint(col, 0.65), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" });
          box(4, d1 - 4, z + h * 0.3 - 3, z + h * 0.3 + 3, tint(col, 1.3));
          for (let a = 8; a + 30 <= d1 - 6; a += 36) {
            box(a, a + 30, z + h * 0.38, z + h - 14, tint(col, 0.75));
            for (let zz = z + h * 0.38 + 8; zz < z + h - 16; zz += 9) box(a + 2, a + 28, zz - 1.5, zz + 1.5, tint(col, 1.25));
          }
          poly([[0, z + h], [d1 + 6, z + h], [d1 + 6, z + h + 8], [0, z + h + 26]], tint(col, 0.8), outline);
          for (const d of [20, d1 - 20]) poly([[d - 9, z - 10], [d + 9, z - 10], [d + 4, z - 50], [d - 2, z - 50]], tint(wall, 0.92), outline);
          continue;
        }
        win2(c - win.w / 2, floorZ(k) + win.sill * f.storey, win.w, win.h * f.storey, k * 3 + i);
      }
    }
  }

  // --- Flat roof: parapet, set-back floors, factory roof lights ---
  if (f.flat) {
    const back = f.roofRows ? (style === "funkce" || style === "moderni" ? 200 : 160) : 0;
    if (f.roofRows) {
      if (style === "moderni") { // a terrace behind a glass balustrade in front of the set-back floor
        box(-30, EDGE, top - 8, top + 14, "#e9e8e4", outline);
        box(-26, back, top + 14, top + 110, "#bcd3dc", { "fill-opacity": 0.55 });
        box(-26, back, top + 106, top + 112, "#8e9aa0");
      } else if (style === "funkce") { // a roof terrace with a tubular railing in front of the set-back floor
        box(-45, EDGE, top - 12, top + 12, trim, outline);
        for (const z of [55, 100]) box(-30, back, top + z, top + z + 5, "#5d5f62");
        for (const d of [-30, back / 2 - 10]) box(d, d + 5, top + 12, top + 105, "#5d5f62");
      } else if (style === "povalecny") { // a terrace in front of the set-back floor: a thin slab, a metal railing
        box(-10, back, top, top + 16, tint(wall, 0.93), outline);
        box(-6, back, top + 100, top + 105, "#6d7074");
        for (let d = -6; d < back; d += 14) box(d, d + 2.5, top + 16, top + 100, "#6d7074");
      } else box(0, back, top, top + 40, tint(wall, 0.93), outline); // parapet in front of the set-back floor
      box(back, EDGE, top, top + f.roofRows * f.storey, wall, outline); // the set-back floor runs on past the cut
      if (style === "funkce" || style === "moderni") { // the set-back floor is glazed towards its terrace: one band
        for (let k = 0; k < f.roofRows; k++) {
          const z = top + k * f.storey + 0.25 * f.storey, h = 0.55 * f.storey;
          box(back + 6, EDGE - 46, z - 4, z + h + 4, FRAME);
          box(back + 10, EDGE - 50, z, z + h, GLASS);
          // its mullions on the lines of the windows below: the Prague window's casement, the modern window's edge
          const mullions = style === "funkce" ? [150 + Math.min(200, EDGE - 200) * 0.78] : [EDGE - 160, (EDGE - 160 + EDGE - 50) / 2];
          for (const d of mullions) box(d - 2, d + 2, z, z + h, FRAME);
        }
      } else if (style === "povalecny") { // the set-back floor's window in the axis of the windows below
        const win = WINDOWS.povalecny, wd0 = (126 + EDGE - 30 - win.w) / 2;
        for (let k = 0; k < f.roofRows; k++) for (const wd of [wd0, 2 * wd0 + win.w / 2 - 60]) if (wd >= back + 10) {
          const z = top + k * f.storey + win.sill * f.storey, h = win.h * f.storey;
          box(wd - 5, wd + win.w + 5, z - 5, z + h + 5, FRAME);
          box(wd, wd + win.w, z, z + h, GLASS);
          poly([[wd + win.w * 0.55, z + h], [wd + win.w, z + h], [wd + win.w, z + h * 0.5]], GLINT);
          box(wd + win.w / 2 - 3, wd + win.w / 2 + 3, z, z + h, FRAME);
          box(wd - 8, wd + win.w + 8, z + h + 5, z + h + 26, tint(wall, 0.94), outline); // the shutter box
          box(wd - 10, wd + win.w + 10, z - 12, z - 5, "#b9b6ae");
        }
      } else if (office) { // the offices' ribbon window, its mullions on the grid of the floors below
        for (let k = 0; k < f.roofRows; k++) {
          const z0 = top + k * f.storey, h = f.storey, g0 = z0 + h * 0.12, g1 = z0 + h * 0.78;
          box(back, EDGE, z0 + h * 0.08, z0 + h * 0.82, FRAME);
          box(back + 8, EDGE, g0, g1, GLASS);
          poly([[EDGE - 150, g1], [EDGE - 100, g1], [EDGE - 160, g0], [EDGE - 210, g0]], GLINT);
          for (let d = 8 + 120; d < EDGE; d += 120) if (d > back + 8) box(d - 3, d + 3, g0, g1, FRAME);
        }
      } else if (setBack) for (let k = 0; k < f.roofRows; k++) setBack(top + k * f.storey, full + k, back);
      else { // the columns of the floors below where they stand on the set-back floor
        const win = WINDOWS[kind] || WINDOWS[style], cols = colAxes(win.w).map((c) => c - win.w / 2);
        for (let k = 0; k < f.roofRows; k++) for (const [i, d0] of cols.entries()) if (d0 >= back + 10 && d0 < EDGE)
          window(d0, top + k * f.storey + win.sill * f.storey, win.w, win.h * f.storey, (full + k) * 3 + i);
      }
    }
    const zr = top + f.roofRows * f.storey;
    if (sawtooth) {
      // Saw-tooth roof lights standing on the roof, and a brick chimney behind.
      box(EDGE - 120, EDGE - 70, zr, zr + 420, wall, outline);
      for (let z = zr + 30; z < zr + 420; z += 30) box(EDGE - 120, EDGE - 70, z - 2, z + 2, tint(wall, 0.85));
      box(EDGE - 126, EDGE - 64, zr + 405, zr + 420, "#8a5a48");
      const tooth = (d) => zr + 170 - (d * 170) / 180; // height of the tooth's slope
      for (const d0 of [0, 180]) {
        poly([[d0, zr], [d0, zr + 170], [d0 + 180, zr]], ROOF.slate, outline);
        poly([[d0, zr], [d0, zr + 170], [d0 + 26, tooth(26)], [d0 + 26, zr]], FRAME);
        poly([[d0 + 5, zr + 8], [d0 + 5, zr + 160], [d0 + 21, tooth(21) - 8], [d0 + 21, zr + 8]], GLASS);
        poly([[d0 + 5, zr + 110], [d0 + 5, zr + 140], [d0 + 21, zr + 90], [d0 + 21, zr + 60]], GLINT);
      }
    } else {
      if (style === "plocha" && !office && !f.roofRows) { // the lift's machine room on the roof
        box(EDGE - 230, EDGE - 70, zr, zr + 230, tint(wall, 0.92), outline);
        box(EDGE - 236, EDGE - 64, zr + 222, zr + 236, dark);
        box(EDGE - 190, EDGE - 150, zr + 120, zr + 170, "#8f979d"); // louvre
      }
      if (style === "hala") { // an air-handling unit on the roof
        box(EDGE - 150, EDGE - 60, zr, zr + 100, "#aab2b8", outline);
        for (let d = EDGE - 140; d < EDGE - 70; d += 18) box(d, d + 8, zr + 50, zr + 88, "#8f979d");
      }
      if (med) {
        // The south's flat roof terrace: a parapet with a balustrade (Spain, Italy, Portugal), Malta's plain parapet a
        // metre high, a low one in Cyprus; a water tank or a stair house on it.
        const ph = kind === "kypr" ? 50 : 100, top2 = zr + ph;
        box(EDGE - 170, EDGE - 70, zr, zr + 210, tint(wall, 0.95), outline); // the stair house
        box(EDGE - 176, EDGE - 64, zr + 204, zr + 214, tint(wall, 0.75));
        if (kind === "malta" || kind === "kypr") box(-16, EDGE, zr, top2, tint(wall, 1.03), outline);
        else {
          box(-20, EDGE, zr, zr + 18, trim, outline);
          for (let d = -10; d < EDGE - 10; d += 22) box(d, d + 9, zr + 18, top2 - 14, trim, { stroke: dark, "stroke-width": 0.8, "vector-effect": "non-scaling-stroke" });
          box(-20, EDGE, top2 - 14, top2, trim, outline);
        }
        box(-22, EDGE, top2, top2 + 6, tint(wall, 0.8));
      } else if (style === "moderni") { // a crisp parapet with a dark coping
        box(back - 4, EDGE, zr, zr + 50, wall, outline);
        box(back - 8, EDGE, zr + 50, zr + 56, "#3c3f43");
      } else if (style === "povalecny") { // a thin parapet under a metal coping
        box(back - 4, EDGE, zr, zr + 30, tint(wall, 0.96), outline);
        box(back - 9, EDGE, zr + 30, zr + 36, "#6d7074");
      } else if (style === "funkce") { // a thin slab overhanging the wall, its shadow under it
        box(back, EDGE, zr - 12, zr, shade);
        box(back - 45, EDGE, zr, zr + 24, trim, outline);
      } else {
        box(back - 8, EDGE, zr, zr + 40, tint(wall, 0.93), outline);
        box(back - 8, EDGE, zr + 32, zr + 42, dark);
      }
    }
  }

  // --- An arcade (podloubí) where OSM has one by the facade (derive.js, info.arcade): the vaulted opening under the
  // front of the house seen from the side, a pillar at the street; doors and windows behind it are not seen.
  if (info?.arcade && style !== "hala") {
    // The vault stays under the ground floor's ceiling: a flatter (elliptic) arch where the floor is low.
    const a1 = ARCADE_D - 10, ah = Math.min(Math.max(200, f.ground - 150), f.ground - 70), rx = (a1 - 10) / 2;
    const ry = Math.max(20, Math.min(rx, f.ground - 40 - ah));
    box(10, a1 + 10, 0, ah + ry + 10, wall); // the wall over what stood there
    box(10, a1, 0, ah, "#5d564c");
    const [x1, x2] = [X(10), X(a1)].sort((p, q) => p - q);
    el("path", { d: `M${x1} ${surface - ah} A ${rx} ${ry} 0 0 1 ${x2} ${surface - ah} Z`, fill: "#5d564c" }, g);
    box(10, a1, 0, 30, "#7b7266"); // the paving under the arcade, lit
    box(-6, 10, 0, f.ground - 20, tint(wall, 0.92), outline); // the pillar by the street
    box(-16, 20, f.ground - 40, f.ground - 20, tint(STONE, 1.05), outline); // its capital
  }

  // --- What sticks out towards the street ---
  box(0, 10, plinth ? plinth[0] : 0, top, dark); // the street facade, seen edge-on
  if (kind === "sorela") {
    // Sorela: a stone band over the rusticated ground floor, a plain frieze and a heavy profiled cornice.
    box(-20, EDGE, f.ground - 22, f.ground, tint(STONE, 1.05), outline);
    const corn = tint(wall, 1.15);
    box(0, EDGE, top - 90, top - 62, tint(wall, 0.94)); // the frieze
    box(-4, EDGE, top - 124, top - 114, corn, outline); // its architrave line
    box(-12, EDGE, top - 62, top - 48, corn, outline);
    box(-30, EDGE, top - 48, top - 26, corn, outline);
    box(-52, EDGE, top - 26, top, corn, outline);
    box(0, EDGE, top - 104, top - 90, shade);
  } else if (kind === "typovy") {
    box(0, EDGE, top - 30, top, tint(wall, 0.92)); // a plain eaves band, nothing more
  } else if (style === "sikma") {
    box(-18, EDGE, f.ground - 18, f.ground, trim, outline); // string course
    box(-18, EDGE, f.ground - 30, f.ground - 18, shade);
    // Main cornice in three steps, the wall's colour lightened, with its shadow on the wall.
    const corn = tint(wall, 1.15);
    if (kind === "sikma" || kind === "mestan") {
      // Under the cornice the frieze, a shade lighter, over an architrave line; consoles carry the cornice.
      const zf = top - 58 - Math.min(60, f.storey * 0.17);
      box(0, EDGE, zf, top - 58, tint(wall, 1.07));
      box(-6, EDGE, zf - 12, zf, corn, outline);
      box(0, EDGE, zf - 20, zf - 12, shade);
      for (let d = 15; d < EDGE; d += 42) box(d, d + 12, top - 88, top - 58, corn, outline);
    } else box(0, EDGE, top - 76, top - 58, shade);
    box(-14, EDGE, top - 58, top - 44, corn, outline);
    box(-28, EDGE, top - 44, top - 22, corn, outline);
    box(-44, EDGE, top - 22, top, corn, outline);
  } else if (style === "moderni") {
    for (let k = 1; k < full; k++) { // balconies: a thin white slab, a frameless glass balustrade
      const z = floorZ(k);
      box(-140, 0, z - 4, z, tint(wall, 0.75));
      box(-145, 0, z, z + 18, "#f4f3f0", outline);
      box(-140, -4, z + 18, z + 110, "#bcd3dc", { "fill-opacity": 0.5 });
      box(-140, -4, z + 106, z + 110, "#8e9aa0");
      if ((k + seed) % 3 === 2) { box(-110, -80, z + 18, z + 42, "#9c9a92"); dot(-95, z + 56, 16, "#6fae4f"); }
    }
    box(-60, 160, f.ground - 22, f.ground - 10, "#3c3f43"); // canopy over the lobby
  } else if (style === "povalecny") {
    // Balconies on the upper floors: a thin concrete slab, a front of ribbed sheet in a colour of the time, a rail.
    const front = pal("povalecnyAccent");
    for (let k = 1; k < full; k++) {
      const z = floorZ(k);
      box(-125, 0, z - 6, z, tint(wall, 0.78));
      box(-130, 0, z, z + 14, "#dcd8cf", outline);
      box(-124, -6, z + 14, z + 96, front, { stroke: tint(front, 0.75), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" });
      for (let d = -114; d < -12; d += 14) box(d, d + 3, z + 18, z + 92, tint(front, 0.86));
      box(-128, -2, z + 96, z + 102, PV_METAL);
      if ((k + seed) % 3 === 1) { box(-100, -72, z + 96, z + 116, "#b5714a"); dot(-86, z + 128, 15, "#6fae4f"); }
    }
  } else if (style === "funkce") {
    box(-30, EDGE, f.ground - 20, f.ground, trim, outline); // a band over the ground floor
    // About two houses in five have a bay over the street from the 2nd floor up (Žižkov, Vršovice);
    // the others, and the 1st floor under a bay, have balconies with a solid lower part and one rail.
    const bay = seed % 5 < 2 && full >= 4;
    if (bay) {
      const z0 = floorZ(2) - 30, z1 = floorZ(full - 1) + f.storey;
      box(-80, 0, z0 - 10, z0, tint(wall, 0.8)); // soffit
      box(-80, 0, z0, z1, tint(wall, 1.03), outline);
      for (let k = 2; k < full; k++) {
        const zw = floorZ(k) + 0.3 * f.storey;
        box(-65, -15, zw - 4, zw + 0.48 * f.storey + 4, FRAME);
        box(-61, -19, zw, zw + 0.48 * f.storey, GLASS);
      }
    }
    for (let k = 1; k < (bay ? 2 : full); k++) {
      const z = floorZ(k), RAIL = "#5d5f62";
      box(-120, 0, z - 6, z, tint(wall, 0.8));
      box(-125, 0, z, z + 12, trim, outline); // slab
      box(-120, -4, z + 12, z + 60, tint(wall, 0.97), outline); // solid lower part
      box(-120, 0, z + 95, z + 100, RAIL); // the rail
      for (const d of [-120, -70, -20]) box(d, d + 4, z + 60, z + 95, RAIL);
      if ((k + seed) % 3 === 1) { box(-90, -60, z + 60, z + 80, "#b5714a"); dot(-75, z + 92, 14, "#6fae4f"); }
    }
  } else if (style === "hala") {
    box(-4, 0, 0, top, dark);
    if (shop) {
      // The awning's side: a wedge sloping out over the entrance, stripes along it, a scalloped valance, an arm.
      // It sits just above the shop window, so a low hall gets it lower too.
      const shopH = Math.min(310, top * 0.5);
      const z0 = shopH + 110, z1 = z0 - 80, reach = 240;
      const aOut = { stroke: tint(accent, 0.75), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" };
      poly([[0, z0 + 30], [-reach, z1], [-reach, z1 - 60], [0, z0 - 30]], accent, aOut);
      for (const k of [14, 34]) poly([[0, z0 + 30 - k], [-reach, z1 - k], [-reach, z1 - k - 8], [0, z0 + 22 - k]], "#fbf6ea");
      box(-reach, -reach + 14, z1 - 100, z1 - 60, accent, aOut); // valance
      dot(-reach + 7, z1 - 100, 10, accent); // scalloped hem
      poly([[0, shopH - 10], [-reach + 10, z1 - 60], [-reach + 4, z1 - 66], [0, shopH - 18]], "#5f666c");
      // A projecting sign, seen flat from the side, with a trolley on it, on the wall above the
      // awning where there is room, else standing on the roof.
      const zs = Math.min(Math.max(500, top * 0.7), top - 130) >= z0 + 50 ? Math.min(Math.max(500, top * 0.7), top - 130) : top + 60;
      if (zs > top) box(-100, -90, top, zs, dark); // the sign's post on the roof edge
      box(-20, 0, zs + 45, zs + 62, dark);
      box(-170, -20, zs, zs + 110, accent, aOut);
      dot(-95, zs + 55, 40, "#fbf6ea");
      poly([[-120, zs + 70], [-70, zs + 70], [-78, zs + 48], [-112, zs + 48]], accent);
      dot(-110, zs + 40, 6, accent);
      dot(-80, zs + 40, 6, accent);
    }
  }
  // --- The regional looks: balconies, galleries, cornices (docs/house-types-europe.md) ---
  const IRON = "#2b2d2f";
  // An iron railing seen from the side: its top and bottom rails and the bars between them.
  const railing = (d0, d1, z, h, col = IRON) => {
    box(d0, d1, z + h - 5, z + h, col);
    box(d0, d1, z + 8, z + 11, col);
    for (let d = d0; d <= d1 - 3; d += 11) box(d, d + 3, z, z + h, col);
  };
  // A balcony: its slab with a moulded edge, brackets under it, the railing.
  const balcony = (z, deep, h = 100, slab = 15) => {
    box(-deep, 0, z - 6, z, tint(wall, 0.75));
    box(-deep - 4, 0, z, z + slab, tint(wall, 1.06), outline);
    for (const d of deep > 50 ? [-deep + 14, -22] : [-deep / 2]) poly([[d - 9, z], [d + 9, z], [d, z - 34]], tint(wall, 0.9), outline);
    railing(-deep, -3, z + slab, h);
  };
  if (kind === "haussmann") {
    // The long stone balconies with iron railings on the 2nd and 5th floor (2e and 5e étage), on the others a French
    // balconette at the window; a cordon over the entresol. A low Brussels house: a balconette on the 1st floor only.
    const long = full >= 5 ? new Set([2, full - 1]) : new Set();
    for (let k = 1; k < full; k++) {
      const z = floorZ(k);
      if (long.has(k)) { balcony(z, 70); box(0, EDGE, z, z + 15, tint(wall, 1.06), outline); railing(0, EDGE, z + 15, 100); } // and along the wall
      else if (full >= 5 || k === 1) railing(-15, -2, z + f.storey * 0.05, 95);
    }
  } else if (med) {
    // The crowning cornice; on every floor a small balcony at each window (deeper on the piano nobile), the iron railing.
    if (!f.flat) { box(-40, EDGE, top - 30, top, trim, outline); box(0, EDGE, top - 46, top - 30, shade); }
    else box(-30, EDGE, top - 26, top, trim, outline);
    if (kind === "galeria") {
      // Northern Spain's glazed gallery (mirador) over the facade from the 1st floor: white frames in a dense grid.
      for (let k = 1; k < full; k++) {
        const z = floorZ(k), h = f.storey;
        box(-84, 0, z - 8, z + 6, tint(wall, 0.85), outline);
        if (k === 1) for (const d of [-70, -20]) poly([[d - 10, z - 8], [d + 10, z - 8], [d, z - 46]], tint(wall, 0.8), outline);
        box(-80, -2, z + 6, z + h - 6, "#f4f4f0", outline);
        box(-74, -8, z + 0.28 * h, z + h - 14, "#7f95a8");
        poly([[-50, z + h - 14], [-8, z + h - 14], [-8, z + 0.5 * h]], "#a9bccb");
        for (let d = -74 + 22; d < -8; d += 22) box(d - 2, d + 2, z + 0.28 * h, z + h - 14, "#f4f4f0");
        box(-74, -8, z + 0.66 * h - 2, z + 0.66 * h + 2, "#f4f4f0");
        box(-80, -2, z + 0.24 * h, z + 0.28 * h, "#f4f4f0");
      }
    } else if (kind === "malta") {
      // The gallarija: a closed wooden balcony on the 1st floor (and the 2nd of a taller house) on stone brackets, its
      // lower third panelled, louvred windows over it, a little lid on top.
      const col = pal("maltaAccent");
      for (const k of full >= 4 ? [1, 2] : full >= 2 ? [1] : []) {
        const z = floorZ(k) + 20, h = f.storey * 0.8;
        for (const d of [-60, -35, -10]) poly([[d - 9, z], [d + 9, z], [d + 4, z - 50], [d - 2, z - 50]], tint(wall, 0.92), outline);
        box(-74, 0, z - 10, z, tint(wall, 0.95), outline);
        box(-70, 0, z, z + h, col, { stroke: tint(col, 0.65), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" });
        box(-66, -4, z + h * 0.3 - 3, z + h * 0.3 + 3, tint(col, 1.3));
        for (const [a, b] of [[-64, -40], [-34, -8]]) {
          box(a, b, z + h * 0.38, z + h - 14, tint(col, 0.75));
          for (let zz = z + h * 0.38 + 8; zz < z + h - 16; zz += 9) box(a + 2, b - 2, zz - 1.5, zz + 1.5, tint(col, 1.25));
        }
        poly([[-80, z + h], [0, z + h], [0, z + h + 26], [-74, z + h + 8]], tint(col, 0.8), outline);
      }
    } else if (kind === "kypr") {
      if (full >= 2) balcony(floorZ(1), 80, 95, 12); // one balcony over the entrance
    } else {
      for (let k = 1; k < full; k++) {
        const z = floorZ(k), luck = (((k * 5 + seed * 31) * 2654435761) >>> 0) % 7;
        balcony(z, k === 1 ? 65 : 45, 95, 10);
        if (det.blinds && luck < 3) { // a striped canvas awning (toldo) over the balcony
          const zt = z + f.storey * 0.92, AW = luck === 1 ? "#3f7a5a" : luck === 2 ? "#b8553f" : "#3c6fa8";
          poly([[0, zt], [-70, zt - 80], [-70, zt - 104], [0, zt - 24]], AW, outline);
          poly([[0, zt - 8], [-70, zt - 88], [-70, zt - 96], [0, zt - 16]], "#f6f1e6");
          box(-74, -62, zt - 130, zt - 96, AW, outline); // the valance
        }
      }
    }
  } else if (kind === "cihlovy") {
    // The white wooden cornice on small brackets, a band of sandstone over the ground floor.
    box(-35, EDGE, top - 34, top, "#f4f2ec", outline);
    for (let d = -30; d < 0; d += 14) box(d, d + 6, top - 52, top - 34, "#e6e2d8");
    box(0, EDGE, top - 50, top - 34, shade);
    box(-8, EDGE, f.ground - 14, f.ground, "#d8cfb5", outline);
  } else if (kind === "dansky") {
    box(-10, EDGE, f.ground - 18, f.ground, "#ece5d5", outline); // a light rendered band over the shop floor
    box(-30, EDGE, top - 30, top, "#ece5d5", outline); // the cornice
    box(0, EDGE, top - 46, top - 30, shade);
    if (seed % 2) for (let k = 1; k < full; k++) railing(-14, -2, floorZ(k) + f.storey * 0.25, 70); // French balconettes
  } else if (GABLE_RISE[kind]) {
    box(-8, EDGE, f.ground - 14, f.ground, kind === "hanza" ? "#bdb6a4" : "#d8cfb5", outline); // a band over the hall
    if (kind === "hanza") { // the limestone portal round the door (in the front column under a gable turned towards us)
      const dd = gableOn(kind) ? gableAxes(kind)[0] - 65 : 0;
      box(6 + dd, 124 + dd, 0, Math.min(240, f.ground * 0.72) + 60, "#bdb6a4", outline);
      box(16 + dd, 114 + dd, 14, Math.min(240, f.ground * 0.72) + 10, pal("hanza") === "#efeee6" ? "#6b4a30" : DOOR);
      arch(65 + dd, Math.min(240, f.ground * 0.72) + 10, 49, "#bdb6a4");
      arch(65 + dd, Math.min(240, f.ground * 0.72) + 10, 41, GLASS);
    }
  } else if (kind === "stenstad" && seed % 3 === 0 && full >= 4) {
    for (const k of [2, 3]) balcony(floorZ(k), 60, 95, 12); // the Jugend balconies with iron railings
  }
  return surface - (top + f.roofH + f.chimney);
}

// The floor count above an edge building starts at its outer side, clear of the cut end A/B.
const floorLabelAt = (x, side) => (side === "left" ? { x: x + 12, "text-anchor": "start" } : { x: x + EDGE - 12, "text-anchor": "end" });

function drawEdge(svg, x, kind, side, surface, info, style) {
  const g = el("g", {}, svg);
  if (kind === "budova" && cityArt()) {
    let top = drawPrahaBuilding(g, x, side, surface, info, style);
    if (top < labelTop) {
      // Cut off above the view: a torn edge in the background colour says the building goes on.
      const yb = labelTop + 20;
      let d = `M${x - 4} ${yb - 4000} L${x - 4} ${yb}`;
      for (let i = 0; i <= 8; i++) d += ` L${x + (i * (EDGE + 8)) / 8 - 4} ${yb + (i % 2 ? 22 : 0)}`;
      el("path", { d: d + ` L${x + EDGE + 4} ${yb - 4000} Z`, fill: "#fbfaf6" }, g);
      // Balconies and cornices over the street are cut at the same line.
      el("rect", { x: side === "left" ? x + EDGE : x - 160, y: yb - 4000, width: 160, height: 4000 - 4, fill: "#fbfaf6" }, g);
      top = yb - 10;
      g.dataset.top = top; // what shows of it, for the page fitting the view (app.js layoutTop)
    }
    const lv = buildingLevels(info);
    const h = buildingHeight(info);
    if (lv || h) {
      const text = lv ? (lv.cornice && lv.roof ? tr("{n} + {roof} NP", { n: lv.cornice, roof: lv.roof }) : tr("{n} NP", { n: lv.n }))
        : buildingStyle(info, style) === "hala" ? tr("hala") : "";
      el("text", { ...floorLabelAt(x, side), y: top - 25, "font-size": 32, fill: "#4f4e49", class: "lbl-floor", "data-w": EDGE - 24, "data-free": 1 }, g).textContent =
        [text, h ? `${info.height ? "" : "≈ "}${fmt(h).replace(/[,.]00 /, " ")}` : ""].filter(Boolean).join(" · ");
    }
  } else if (kind === "budova") {
    const h = buildingHeight(info);
    const lv = buildingLevels(info);
    const top = h ? surface - h * 100 : 120;
    const rows = lv?.n || 5;
    const fh = (surface - top) / rows;
    // Roof / set-back floors above the cornice are drawn narrower and darker.
    const roofRows = lv?.roof && lv.cornice ? lv.roof : 0;
    const corniceY = surface - (rows - roofRows) * fh;
    const inset = roofRows ? 80 : 0;
    if (roofRows) {
      const rx = side === "left" ? x : x + inset;
      el("rect", { x: rx, y: top, width: EDGE - inset, height: corniceY - top, fill: "#c9bfae", stroke: "#b9ad97", "stroke-width": 3 }, g);
    }
    el("rect", { x, y: corniceY, width: EDGE, height: surface - corniceY, fill: "#ddd3c2", stroke: "#b9ad97", "stroke-width": 3 }, g);
    for (let row = 0; row < rows; row++) {
      const above = row < roofRows;
      for (let col = 0; col < 3; col++) {
        const wx = x + 50 + col * 120;
        if (above && (side === "left" ? wx + 70 > x + EDGE - inset : wx < x + inset)) continue;
        el("rect", { x: wx, y: top + row * fh + fh * 0.25, width: 70, height: fh * 0.5, fill: "#9fb4c2" }, g);
      }
    }
    if (lv) {
      const text = lv.cornice && lv.roof ? tr("{n} + {roof} NP", { n: lv.cornice, roof: lv.roof }) : tr("{n} NP", { n: lv.n });
      el("text", { ...floorLabelAt(x, side), y: top - 25, "font-size": 32, fill: "#4f4e49", class: "lbl-floor", "data-w": EDGE - 24, "data-free": 1 }, g).textContent =
        text + (h ? ` · ${info.height ? "" : "≈ "}${fmt(h).replace(/[,.]00 /, " ")}` : "");
    }
  } else if (kind === "stavba") {
    // Minor structure (garage, kiosk, wall): a low block.
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#e6e3da" }, g);
    const bx = side === "left" ? x + EDGE - 220 : x;
    el("rect", { x: bx, y: surface - 260, width: 220, height: 260, fill: "#cfc8ba", stroke: "#b9ad97", "stroke-width": 3 }, g);
  } else if (kind === "zahrada") {
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#a7c66b" }, g);
    const fx = side === "left" ? x + EDGE - 10 : x;
    el("rect", { x: fx, y: surface - 140, width: 10, height: 140, fill: "#6b6a65" }, g);
    for (let k = 0; k < 4; k++) el("rect", { x: side === "left" ? x + EDGE - 160 : x, y: surface - 140 + k * 40, width: 170, height: 6, fill: "#6b6a65" }, g);
    sprite(g, "bush", x + EDGE / 2, surface);
    sprite(g, "tree", side === "left" ? x + 120 : x + EDGE - 120, surface);
  } else if (kind === "voda") {
    el("rect", { x, y: GROUND + 20, width: EDGE, height: 80, fill: "#7fa9cf" }, g);
  } else if (kind === "plot") {
    // Fence or wall: the ground behind it is outside the street.
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#e6e3da" }, g);
    const fx = side === "left" ? x + EDGE - 10 : x;
    el("rect", { x: fx, y: surface - 160, width: 10, height: 160, fill: "#6b6a65" }, g);
    for (let k = 0; k < 3; k++) el("rect", { x: side === "left" ? x + EDGE - 120 : x, y: surface - 150 + k * 50, width: 130, height: 6, fill: "#6b6a65" }, g);
  } else if (kind === "parkoviste") {
    el("rect", { x, y: GROUND, width: EDGE, height: 60, fill: "#7b7b78" }, g);
    sprite(g, "car-sideways-left", x + EDGE / 2, GROUND);
  } else if (kind === "zelen") {
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#8fbf55" }, g);
    sprite(g, "tree", x + EDGE / 2, surface);
  } else {
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#e6e3da" }, g);
  }
  el("text", { class: "lbl-t", "data-row": 1, "data-w": EDGE, x: x + EDGE / 2, y: GROUND + DROP + 215, "text-anchor": "middle", "font-size": 30, fill: "#6b6a65" },
    g).textContent = { budova: tr("Budova"), stavba: tr("Drobná stavba"), voda: tr("Vodní tok / plocha"), zahrada: tr("Zahrada, louka (mimo ulici)"), zelen: tr("Zeleň (mimo ulici)"), parkoviste: tr("Parkoviště (mimo ulici)"), plot: tr("Za plotem (mimo ulici)") }[kind] || "";
  return g;
}

// Build an SVG element. opts: {editable, selected, view: [x0, width], onSelect(i), selectedEdge, onEdge(side)}
// Traffic-sign icons of the state of the cut (znacky/ for CZ, znacky-SK/ for SK; city.country, ISO 3166-1), loaded
// on first use: file → { uri, w, h }. A template (B 20a or 253 with another speed, E 13 with a text) gets its text
// filled in before it becomes a data URI.
const signArt = new Map();
const signCountry = () => country.code; // null: the Czech signs (countries/default.js)
const signKey = (a) => `${a.dir}/${a.file}${a.text ? `|${a.text}` : ""}`;
async function loadSignFile(a) {
  const key = signKey(a);
  const { dir, file, text } = a;
  if (signArt.has(key)) return;
  signArt.set(key, null);
  try {
    const r = await fetch(`${dir}/${file}.svg`);
    if (!r.ok) throw new Error(r.status);
    let svg = await r.text();
    if (text) svg = svg.replace(/(<text id="[vt]"[^>]*>)[^<]*/, `$1${text.replace(/[<&]/g, "")}`);
    const vb = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    signArt.set(key, { uri: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), w: vb[2], h: vb[3], u: signUnits(dir, vb[2], vb[3]) });
  } catch (err) {
    console.warn("značka chybí", file, err.message);
  }
}
// The width of a sign in units of a basic sign (100 in its viewBox = 500 mm). The Czech and Slovak sets are drawn so;
// the sets taken from Wikimedia Commons (AT, DE) come in their authors' units (a round sign 600, 960 or 100 wide), so
// their size goes by their shape (the review of Germany, 17. 11. 2026: Z 274 drawn six times too big, Austria's 10a-30
// ten times bigger than its 10a-50): as tall as a basic sign, a wide one (an arrow, a plate) 1.5 wide.
export function signUnits(dir, w, h) {
  if (dir === "znacky" || dir === "znacky-SK") return w / 100;
  return w / h > 1.6 ? 1.5 : w / h;
}
// The file (and filled-in text) of a sign and of its plate.
const signArtOf = (x, seg) => {
  const file = signFile(x, seg, signCountry());
  return { dir: signDir(signCountry()), file, text: SPEED_TEMPLATES.has(file) ? String(x.v) : null };
};
const plateArtOf = (x, seg) => {
  const file = plateFile(x, seg, signCountry());
  return file && { dir: signDir(signCountry()), file, text: file === "E13" ? PLATES[x.plate] : null };
};
// All signs of the profiles, loaded before drawing (the row is drawn from the cache).
// Resolves to true when something new was loaded (the drawing then needs redrawing).
export async function loadSigns(...profiles) {
  const all = profiles.filter(Boolean).flatMap((p) => p.segments.flatMap((s) => (s.signs || []).map((x) => [x, s])));
  const todo = all.flatMap(([x, s]) => [signArtOf(x, s), plateArtOf(x, s)].filter((a) => a?.file)).filter((a) => !signArt.has(signKey(a)));
  await Promise.all(todo.map(loadSignFile));
  return todo.length > 0;
}
const artFor = (a) => (a ? signArt.get(signKey(a)) : null);

// The row of signs under the labels (no head: the signs are what the data say, not always what is on the
// street; Bára): each part's signs under the part with their plates, and a sign shared by neighbouring parts
// once under a bracket over them. size: the height of a sign in drawing units; top: the top of the row; px:
// drawing units per screen pixel (for the bracket and the dot). A part too narrow for its signs gets a grey
// dot. Returns the bottom (top without signs).
export function layoutSigns(svg, size, top, px = size / 32) {
  const groups0 = [...svg.querySelectorAll("g.sign-group")];
  if (!groups0.length) return top;
  // All signs at one size (Bára): the size that lets every part's signs fit its width, but no smaller than
  // MIN_K of the full size; a part too narrow even for that shows a dot.
  const MIN_K = 0.6, gap = size * 0.12;
  const rowTop = top + 6 * px;
  const groups = groups0.map((g) => {
    const stacks = [...g.querySelectorAll("g.sign")];
    const ws = stacks.map((st) => Number(st.querySelector("image").dataset.u) * size);
    const need = ws.reduce((a, w) => a + w, 0) + gap * (ws.length - 1);
    return { g, stacks, ws, need, fit: (Number(g.dataset.w) * 0.94) / need };
  });
  const k = Math.min(1, ...groups.map((x) => x.fit).filter((f) => f >= MIN_K));
  const lineH = [0, 0];
  const bracket = 8 * px; // room for the bracket above shared signs
  const anyBracket = [0, 1].map((l) => groups0.some((g) => Number(g.dataset.line || 0) === l && g.querySelector("path.sign-bracket")));
  for (const { g, stacks, ws, need, fit } of groups) {
    const cx = Number(g.dataset.cx), line = Number(g.dataset.line || 0);
    const hidden = fit < MIN_K;
    for (const st of stacks) st.style.display = hidden ? "none" : "";
    let dot = g.querySelector("circle.sign-more");
    if (hidden) {
      // Not room for the signs: a dot, their names in the title (and in the editor).
      dot ??= el("circle", { class: "sign-more", fill: "#a8a397" }, g);
      dot.setAttribute("cx", cx); dot.setAttribute("r", 3 * px); dot.dataset.dy = 4 * px;
      dot.querySelector("title") || (el("title", {}, dot).textContent = stacks.map((st) => st.querySelector("title")?.textContent).join(", "));
      lineH[line] = Math.max(lineH[line], 8 * px);
      continue;
    }
    dot?.remove();
    // Every sign of the line one under the other's bracket room, so all stand on one line (Bára).
    const pad = anyBracket[line] ? bracket : 0;
    let x = cx - (need * k) / 2;
    stacks.forEach((st, j) => {
      let y = pad;
      const sw = ws[j] * k;
      for (const im of st.querySelectorAll("image")) {
        const ar = Number(im.dataset.ar);
        const plate = im.dataset.plate === "plate";
        // Every sign at one scale: a basic sign is size wide, a plate as wide as its sign.
        const w = plate ? sw : Number(im.dataset.u) * size * k, h = w / ar;
        im.setAttribute("x", x + (sw - w) / 2); im.dataset.dy = y;
        im.setAttribute("width", w); im.setAttribute("height", h);
        y += h + size * 0.04;
      }
      lineH[line] = Math.max(lineH[line], y);
      x += (ws[j] + gap) * k;
    });
  }
  // The second line (shared signs under parts that have their own) starts below the first.
  const lineTop = [rowTop, rowTop + (lineH[0] ? lineH[0] + size * 0.1 : 0)];
  for (const { g } of groups) {
    const t = lineTop[Number(g.dataset.line || 0)];
    for (const im of g.querySelectorAll("image")) im.setAttribute("y", t + Number(im.dataset.dy));
    const dot = g.querySelector("circle.sign-more");
    if (dot) dot.setAttribute("cy", t + Number(dot.dataset.dy));
    const br = g.querySelector("path.sign-bracket");
    if (br) {
      // A bracket over the parts a shared sign belongs to, the sign in its middle below.
      const a = Number(g.dataset.x0) + 6 * px, b = Number(g.dataset.x1) - 6 * px, y = t + 2 * px;
      br.setAttribute("d", `M${a} ${y + 5 * px} V${y} H${b} V${y + 5 * px}`);
      br.setAttribute("stroke-width", 1.2 * px);
    }
  }
  const rowH = lineH[1] ? lineTop[1] - rowTop + lineH[1] : lineH[0];
  return rowTop + rowH + size * 0.2;
}

function drawSigns(svg, profile, bounds) {
  const segs = profile.segments;
  const stack = (g, x, seg) => {
    const st = el("g", { class: "sign" }, g);
    const title = el("title", {}, st);
    title.textContent = signLabel(x, signCountry());
    for (const [a, plate] of [[signArtOf(x, seg), false], [plateArtOf(x, seg), true]]) {
      const art = artFor(a);
      if (!art) continue;
      // A plate (dodatková tabulka) is drawn as wide as its sign, a second symbol (the bike under the bus) as a sign.
      // data-u: the sign's width in units of a basic sign (100 in its viewBox = 500 mm), so a square IP 4b and an
      // upright IP 11 are as wide as on the street (Bára).
      el("image", { href: art.uri, "data-ar": art.w / art.h, "data-u": art.u ?? art.w / 100, ...(plate ? { "data-plate": a.file === "C8a" ? "symbol" : "plate" } : {}) }, st);
    }
    if (!st.querySelector("image")) st.remove();
  };
  // A sign shared by neighbouring parts (the street's speed or zone under all its lanes) is drawn once, in the
  // middle of the run (Bára); signs of one part under it. Same sign = same file, value and plate as drawn.
  const id = (x, s) => JSON.stringify([signArtOf(x, s), plateArtOf(x, s)]);
  const ids = segs.map((s) => (s.signs || []).map((x) => id(x, s)));
  const shared = new Map(); // "i-j" → [[sign, seg]] for runs of 2 and more parts
  const own = segs.map((s) => [...(s.signs || [])]);
  for (let i = 0; i < segs.length; i++) {
    for (const x of [...own[i]]) {
      const key = id(x, segs[i]);
      let j = i;
      while (j + 1 < segs.length && ids[j + 1].includes(key)) j++;
      if (j === i) continue;
      const span = `${i}-${j}`;
      if (!shared.has(span)) shared.set(span, []);
      shared.get(span).push([x, segs[i]]);
      for (let m = i; m <= j; m++) own[m] = own[m].filter((y) => id(y, segs[m]) !== key);
    }
  }
  own.forEach((list, i) => {
    if (!list.length) return;
    const g = el("g", { class: "sign-group", "data-line": 0, "data-cx": (bounds[i] + bounds[i + 1]) / 2, "data-w": bounds[i + 1] - bounds[i] }, svg);
    list.forEach((x) => stack(g, x, segs[i]));
  });
  for (const [span, list] of shared) {
    const [i, j] = span.split("-").map(Number);
    // Below the parts' own signs when any of the run's parts has some.
    const line = own.slice(i, j + 1).some((l) => l.length) ? 1 : 0;
    const g = el("g", { class: "sign-group", "data-line": line, "data-cx": (bounds[i] + bounds[j + 1]) / 2, "data-w": bounds[j + 1] - bounds[i], "data-x0": bounds[i], "data-x1": bounds[j + 1] }, svg);
    el("path", { class: "sign-bracket", fill: "none", stroke: "#a8a397" }, g);
    list.forEach(([x, s]) => stack(g, x, s));
  }
  for (const g of svg.querySelectorAll("g.sign-group")) if (!g.querySelector("image")) g.remove();
}

// How deep the rainwater objects under a profile's parts reach (m), 0 without any.
export const underDepth = (p) => Math.max(0, ...p.segments.filter((s) => s.under).map((s) => { const z = underSize(s); return z ? z.top + z.h : 0; }));
// Span wires across the street (Bára, 17. listopadu): a traction pole whose bracket would not reach a track
// (further than BRACKET_REACH from the nearest one) holds a span wire over the nearest run of tram parts to the
// other side: to the nearest pole beyond them (before the next run), else to the building at that edge when its
// facade reaches the wire (walls: the facades' heights, cm), else ending at the run's edge; not over tracks held by
// poles between them (Olšanská). One wire a side of a run: the pole nearest to it holds it, the further ones stand
// without a bracket (Fable). The wire hangs a contact wire over every track it crosses. It follows the profile's
// poles and edges, so adding a pole or changing an edge in Návrh changes it.
// free: the poles drawn without a bracket ("part:item" → on the right of the tracks); wires: what spanWire draws.
// The wire level at both ends (Bára: not slanting): where the poles' brackets are, above a sidewalk.
const BRACKET_REACH = 400, SPAN_Y = GROUND - CURB - 640 * POLE_SCALE;
export function spanPlan(segs, edges, total, walls = {}) {
  const at = [];
  let a = 0;
  for (const s of segs) { at.push(a); a += s.width * 100; }
  const poles = [], runs = [];
  segs.forEach((s, i) => (s.items || []).forEach((it, k) => {
    if (it.kind === "sloup_trakce" && !it.center && !TYPES[s.type]?.tracks) poles.push({ key: `${i}:${k}`, x: at[i] + it.f * s.width * 100 });
  }));
  segs.forEach((s, j) => {
    if (!TYPES[s.type]?.tracks) return;
    const mid = at[j] + s.width * 50, last = runs.at(-1);
    const held = (s.items || []).some((it) => it.kind === "sloup_trakce" && it.center);
    if (last && last.j === j - 1) { Object.assign(last, { j, x1: at[j] + s.width * 100 }).xs.push(mid); last.held ||= held; }
    else runs.push({ j, x0: at[j], x1: at[j] + s.width * 100, xs: [mid], held });
  });
  const dist = (r, x) => Math.min(...r.xs.map((m) => Math.abs(m - x)));
  const nearest = (x) => [...runs].sort((q, r) => dist(q, x) - dist(r, x))[0];
  const free = new Map(), wires = [], sides = new Set(), used = new Set();
  // The poles nearest to their tracks first, so they hold the wires.
  const plan = poles.map((p) => ({ p, run: nearest(p.x) })).filter((q) => q.run).sort((q, r) => dist(q.run, q.p.x) - dist(r.run, r.p.x));
  for (const { p, run } of plan) {
    if (used.has(p.key) || dist(run, p.x) <= BRACKET_REACH) continue;
    const right = p.x > run.x1, n = runs.indexOf(run);
    free.set(p.key, right);
    if (run.held || sides.has(`${n}:${right}`)) continue;
    sides.add(`${n}:${right}`);
    // Across: a pole beyond the run, before the next run of tracks on that side, the nearest to the run.
    const next = runs[right ? n - 1 : n + 1], edge = right ? run.x0 : run.x1;
    const across = poles.filter((q) => !used.has(q.key) && (right ? q.x < run.x0 && (!next || q.x > next.x1) : q.x > run.x1 && (!next || q.x < next.x0)))
      .sort((q, r) => Math.abs(q.x - edge) - Math.abs(r.x - edge))[0];
    const wallSide = right ? "left" : "right";
    let end;
    if (across) {
      end = { x: across.x, y: SPAN_Y, kind: "pole" };
      used.add(across.key);
      sides.add(`${n}:${!right}`);
      free.set(across.key, !right); // its bracket gives way to the wire (Fable: both over one track)
    } else if (edges?.[wallSide] === "budova" && (walls[wallSide] || 0) >= GROUND - SPAN_Y + 40) end = { x: right ? 0 : total, y: SPAN_Y, kind: "wall" };
    else end = { x: edge, y: SPAN_Y, kind: "free" };
    // A contact wire over every track the span crosses (two runs under one wire, Fable).
    const lo = Math.min(p.x, end.x), hi = Math.max(p.x, end.x);
    wires.push({ x: p.x, y: SPAN_Y, end, xs: runs.filter((r) => !r.held).flatMap((r) => r.xs).filter((m) => m > lo && m < hi) });
  }
  return { free, wires };
}
export function buildSvg(profile, opts = {}) {
  const segs = profile.segments;
  const total = totalWidth(profile) * 100;
  // The earth under the street, with its metres: for the networks (a trial, Prague) and for a rainwater object
  // under a part, which is drawn at its depth and size (with the networks or alone, also in Porovnat and exports).
  const nets = opts.underground?.items?.length ? opts.underground : null;
  // In Porovnat both profiles take the deeper one's earth (opts.deep), so they keep one scale (Fable).
  const deepest = Math.max(opts.deep || 0, underDepth(profile));
  const under = nets || (deepest ? { items: [], span: { left: total / 100 }, kinds: {} } : null);
  DROP = under ? undergroundDrop(under.items, under.kinds, deepest) : 0;
  const view = opts.view || [-EDGE, Math.max(total + 2 * EDGE, 2400)];
  const vx = view[0] - (view[1] - (total + 2 * EDGE)) / 2;
  // Tall buildings at the edges extend the drawing upwards.
  // Tall lamps and traction poles too (Fable: a 10 m lamp was cut off above a street without houses).
  const tallest = Math.max(0, ...["left", "right"].map((k) =>
    edgeHeight(profile.edges?.[k], profile.edges?.[`${k}Info`], profile.edges?.[`${k}Style`])),
    ...segs.flatMap((s) => (s.items || []).map((it) => (it.kind === "lampa" ? (it.h || lampLight()) * 100 + 80 : it.kind === "sloup_trakce" ? 960 : 0))));
  // A tower beside a narrow street would squash the street into a strip: the view shows at most
  // TALL_SHARE of its width above the ground, and taller buildings are cut with a break line.
  // opts.whole: the buildings whole (the sheets of evaluation/budovy-regiony).
  const shown = opts.whole ? tallest : Math.min(tallest, Math.max(1300, view[1] * TALL_SHARE));
  // The top row (total width, cut ends A/B) sits above the tallest building and its floor label.
  const y0 = Math.min(0, GROUND - shown - 140) - 110;
  labelTop = y0 + 190;
  // An export's title gets a band of its own above the top row (it covered the A of the cut's end).
  const yv = opts.title ? y0 - 130 : y0;
  // The bottom: the label rows, then the signs and the credits line of an export (set after the signs are laid out).
  let bottom = (opts.credits ? H + 110 : H) + DROP;
  const svg = el("svg", { xmlns: NS, viewBox: `${vx} ${yv} ${view[1]} ${bottom - yv}`, "font-family": "Inter, system-ui, sans-serif",
    role: "img", "aria-label": tr("Příčný profil, celkem {w}: ", { w: fmt(total / 100) }) + segs.map((s) => `${TYPES[s.type]?.label || s.type} ${fmt(s.width)}`).join(", ") });
  const bg = el("rect", { class: "bg", x: vx, y: yv, width: view[1], height: bottom - yv, fill: "#fbfaf6" }, svg);

  const firstRaised = isRaised(segs[0]);
  const lastRaised = isRaised(segs.at(-1));
  // The edges (a building, a fence, a garden…): selected by a click like the parts (Bára: a panel house that is a
  // two-storey town house, or a garden).
  for (const [side, x, raised] of [["left", -EDGE, firstRaised], ["right", total, lastRaised]]) {
    const kind = profile.edges?.[side] || "volno";
    const g = drawEdge(svg, x, kind, side, raised ? GROUND - CURB : GROUND, edgeInfo(profile.edges, side), profile.edges?.[`${side}Style`]);
    if (!opts.onEdge) continue;
    g.classList.add("edge");
    if (opts.selectedEdge === side) g.classList.add("selected");
    // Its whole column is the target, the open ground of "volno" too.
    g.prepend(el("rect", { x, y: yv, width: EDGE, height: GROUND + DROP + 260 - yv, fill: "transparent" }));
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", side === "left" ? tr("Levý okraj") : tr("Pravý okraj"));
    g.addEventListener("click", () => opts.onEdge(side));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onEdge(side); } });
  }

  let x = 0;
  const bounds = [0], undersLater = [], spans = spanPlan(segs, profile.edges, total, facades(profile.edges));
  segs.forEach((s, i) => {
    const t = TYPES[s.type] || TYPES.nezname;
    const w = s.width * 100;
    const top = isRaised(s) ? GROUND - CURB : GROUND;
    // Cars across the kerb (half_on_kerb): the half on the sidewalk side is raised (kerbLeft: the sidewalk is
    // on the left of the part).
    const half = s.type === "parkovani" && s.position === "half_on_kerb";
    const kerbLeft = half && (isRaised(segs[i - 1]) !== isRaised(segs[i + 1]) ? isRaised(segs[i - 1]) : x + w / 2 < total / 2);
    const g = el("g", { class: "seg" + (opts.selected === i ? " selected" : "") + (opts.changed?.has(i) ? " changed" : ""), "data-i": i }, svg);
    // Name and width on hover, also for parts too narrow for a label.
    el("title", {}, g).textContent = `${t.label}, ${fmt(s.width)}`;
    el("rect", { class: "ground", x, y: top, width: w, height: GROUND + 60 - top, fill: s.color || (s.position === "on_kerb" ? KERB_PAVING : t.color) }, g);
    // Green parts: grass on topsoil, not a green block all the way down (Bára: nothing that looks like a slab under
    // the green).
    if (SOIL_PARTS.has(s.type)) el("rect", { x, y: top + 12, width: w, height: GROUND + 60 - top - 12, fill: TOPSOIL }, g);
    if (half) {
      // The sidewalk half in the sidewalk's paving, with the kerb stone in the middle of the car.
      el("rect", { x: kerbLeft ? x : x + w / 2, y: GROUND - CURB, width: w / 2, height: CURB + 60, fill: KERB_PAVING }, g);
      el("rect", { x: x + w / 2 - (kerbLeft ? 12 : 0), y: GROUND - CURB, width: 12, height: CURB + 8, fill: "#c9c5ba", stroke: "#8d887c", "stroke-width": 1 }, g);
    }
    el("rect", { x, y: GROUND + 60, width: w, height: 40, fill: "#9b7f5f" }, g);
    el("rect", { x: x + 4, y: GROUND + DROP + 104, width: Math.max(w - 8, 1), height: 14, fill: SOURCES[s.source]?.color || "#999" }, g);
    const cx = x + w / 2;
    const forward = s.dir !== "backward";
    if (t.bed) drawTramBed(g, s, x, w, top, TYPES[segs[i - 1]?.type]?.bed, TYPES[segs[i + 1]?.type]?.bed);
    // Under the part: drawn after the networks' earth (below), which would cover it.
    if (s.under) undersLater.push([s, x, w]);
    if (t.water) drawWaterPart(g, s, x, w, top, segs[i - 1], segs[i + 1]);
    if (s.permeable) drawPermeable(g, x, w, top, s.permeable === "nezpevneny");
    if (t.marked) {
      // A reserved tram lane: a wide solid line (25 cm) on the roadway where a part that is no tram lies beside.
      if (!TYPES[segs[i - 1]?.type]?.tracks) el("rect", { x: x + 4, y: top - 3, width: 25, height: 4, fill: "#f2f0ea" }, g);
      if (!TYPES[segs[i + 1]?.type]?.tracks) el("rect", { x: x + w - 29, y: top - 3, width: 25, height: 4, fill: "#f2f0ea" }, g);
    }
    if (t.tracks) {
      for (const dx of [-72, 72]) el("rect", { x: cx + dx - 6, y: top - 6, width: 12, height: 8, fill: "#3d3b36" }, g);
    }
    // Trees between the stalls (a tree item of a parking part, Bára): the tree stands behind the car, along the street.
    if (s.type === "parkovani") for (const it of s.items || []) if (it.kind === "strom") sprite(g, "tree", x + it.f * w, GROUND);
    if (t.sprite === "people" && t.withBike && w >= 140) {
      // Shared with cyclists: a walker and a cyclist side by side (only the cyclist when narrow).
      const bike = forward ? "biker-01-outbound" : "biker-01-inbound";
      if (w >= 240) {
        sprite(g, PEOPLE[(i * 2) % PEOPLE.length], x + w * 0.3, top);
        sprite(g, bike, x + w * 0.7, top);
      } else sprite(g, bike, cx, top);
    } else if (t.sprite === "people") {
      const n = w >= 300 ? 2 : w >= 140 ? 1 : 0;
      for (let k = 0; k < n; k++) sprite(g, PEOPLE[(i * 2 + k) % PEOPLE.length], x + (w * (k + 1)) / (n + 1), top, k % 2 === 1);
    } else if (s.type === "parkovani" && w >= (s.position ? 150 : 180)) {
      // Parked car drawn by orientation: front view (parallel), side view (perpendicular), angled.
      const right = cx > total / 2;
      const name = s.orient === "kolme" ? `car-sideways-${right ? "right" : "left"}`
        : s.orient === "sikme" ? `car-angled-front-${right ? "right" : "left"}`
        : laneDir(segs, i) === "backward" ? "car-inbound" : "car-outbound";
      if (half) {
        // Across the kerb: the car stands half a kerb up, tilted towards the roadway.
        // Higher on the sidewalk side, lower towards the roadway (SVG angles turn clockwise).
        const tilt = el("g", { transform: `rotate(${((kerbLeft ? 1 : -1) * Math.atan2(CURB, CAR_TRACK) * 180) / Math.PI} ${cx} ${GROUND - CURB / 2})` }, g);
        sprite(tilt, name, cx, GROUND - CURB / 2);
      } else sprite(g, name, cx, top);
    } else if (t.sprite === "car" && w >= 180 && s.trolley && cityArt() && CITY_ART[artKey()]?.["trolleybus-inbound"]) {
      // A lane only public transport may use (a zone with trolley wires): its trolleybus.
      sprite(g, `trolleybus-${forward ? "outbound" : "inbound"}`, cx, top);
    } else if (t.sprite === "car" && w >= 180) {
      sprite(g, forward ? "car-outbound" : "car-inbound", cx, top);
    } else if (t.sprite === "streetcar" && w >= 240) {
      tramSprite(g, forward ? "streetcar-outbound" : "streetcar-inbound", cx, top - 2);
    } else if (t.sprite === "bus" && w >= 250) {
      // Under trolley wires a trolleybus, where the city's illustrations have one (else the bus).
      const trolley = s.trolley && cityArt() && CITY_ART[artKey()]?.["trolleybus-inbound"];
      sprite(g, `${trolley ? "trolleybus" : "bus"}-${forward ? "outbound" : "inbound"}`, cx, top);
    } else if (t.sprite === "biker" && w >= 80) {
      sprite(g, forward ? "biker-01-outbound" : "biker-01-inbound", cx, top);
    } else if (t.sprite === "tree" && w >= 100) {
      sprite(g, "tree", cx, top);
    } else if (t.sprite === "bush" && w >= 100) {
      sprite(g, "bush", cx, top);
    } else if (t.sprite === "cafe" && w >= 150) {
      sprite(g, "cafe-seating-occupied", cx, top);
    }
    if (t.wall) el("rect", { x, y: top - 90, width: w, height: 90, fill: t.color }, g);
    for (const it of s.items || []) {
      if (it.kind === "strom" && s.type === "parkovani") continue; // drawn behind the car
      let ix = x + it.f * w, onRight = ix > total / 2;
      if (it.kind === "pristresek" || it.kind === "pristresek_zeleny") {
        // A shelter opens towards the tram or bus beside its platform, its back wall at the platform's other edge,
        // by the cars (Bára, Jana Želivského).
        const transit = (n) => n && (TYPES[n.type]?.tracks || n.type === "bus" || n.type === "bus_cyklo");
        const toR = transit(segs[i + 1]), toL = transit(segs[i - 1]);
        if (toR !== toL) {
          onRight = toL;
          const half = Math.min(135, w / 2);
          ix = toR ? x + half : x + w - half;
        }
      }
      // A stop post at the platform's edge stays on the platform (it is 50 cm wide).
      if (it.kind === "oznacnik") ix = Math.min(Math.max(ix, x + 30), x + w - 30);
      // A lamp reaches over the nearest roadway, not over the grass (Bára, VMO Dobrovského); in a median between
      // two roadways it lights both (Wilsonova): its arms reach over both sides.
      if (it.kind === "lampa") {
        const near = nearestRoadway(segs, i, it.f);
        if (near) onRight = near === "left";
        // Only on a true median (a dividing strip, green or a tram bed between two roadways of a big road), not on a
        // walkway island by a turn (Bára, náměstí Jana Palacha).
        // (A post-top lamp has no arms: once is enough.)
        if (MEDIAN_LAMP.has(s.type) && ROADWAY.has(segs[i - 1]?.type) && ROADWAY.has(segs[i + 1]?.type) && !(it.h <= 5)) drawItem(g, it, ix, top, !onRight);
      }
      const key = `${i}:${s.items.indexOf(it)}`;
      if (spans.free.has(key)) { drawItem(g, { ...it, span: true }, ix, top, spans.free.get(key)); continue; }
      drawItem(g, it.kind === "sloup_trakce" && it.center ? { ...it, reach: w / 2 } : it, ix, top, onRight);
    }
    el("text", { class: "lbl-w", "data-row": 0, "data-w": w, x: cx, y: GROUND + DROP + 170, "text-anchor": "middle", "font-size": 40, "font-weight": 600, fill: "#1f1f1d" }, g).textContent = fmt(s.width);
    let wrapped = false;
    if (w >= 80) {
      const contra = s.bikeDir && s.bikeDir !== (s.dir || "forward");
      let label = TYPES[s.type]?.tracks && s.withBus ? `${t.label} + BUS` + (t.directional && s.dir ? (forward ? " ↑" : " ↓") : "")
        : s.type === "parkovani" && s.use ? tr("Parkování {what}", { what: PARKING_USE[s.use] })
        // Under a narrow part "Napůl na chodníku" alone (the long name would not fit on two lines).
        : s.type === "parkovani" && s.position ? (s.position === "half_on_kerb" && w < 300 ? tr("Napůl na chodníku") : tr("Parkování {what}", { what: PARKING_POSITION[s.position] }))
        : s.type === "parkovani" && s.orient ? tr("Parkování {what}", { what: ORIENT_LABEL[s.orient] })
        // A lane with a piktokoridor is first a lane (Bára): "Jízdní pruh ↑, piktokoridor ↓" with the cyclists' direction
        // when it differs; cyclists in contraflow in a plain lane likewise.
        : s.type === "pruh_piktokoridor" ? `${TYPES.pruh.label}${s.dir ? (forward ? " ↑" : " ↓") : ""}, ${tr("piktokoridor")}${contra ? (s.bikeDir === "backward" ? " ↓" : " ↑") : ""}`
        : t.label + (t.directional && s.dir ? (forward ? " ↑" : " ↓") : s.type === "pruh" ? " ↑↓" : "") +
          (contra ? `, ${tr("cyklisté")} ${s.bikeDir === "backward" ? "↓" : "↑"}` : "");
      // Trees between the stalls are named with the parking (Bára).
      if (s.type === "parkovani" && s.items?.some((it) => it.kind === "strom")) label += tr(" se stromy");
      // What lies under it (rainwater, types.js HDV_UNDER) and permeable paving, in the name.
      if (s.under && HDV_UNDER[s.under]) label += ` + ${HDV_UNDER[s.under].short}`;
      // "propustná dlažba": the surface graph counts it as partly permeable (Fable: two meanings of "propustný").
      if (s.permeable) label += s.permeable === "nezpevneny" ? tr(", nezpevněný") : tr(", propustná dlažba");
      const name = el("text", { class: "lbl-t", "data-row": 1, "data-w": w, "data-full": label, x: cx, y: GROUND + DROP + 215, "text-anchor": "middle", "font-size": 28, fill: "#4f4e49" }, g);
      const lines = twoLines(label);
      if (label.length * 0.56 * 28 > w && lines) {
        // A long name under a narrow part goes on two lines (the page refits it to the screen).
        lines.forEach((line, j) => { el("tspan", { x: cx, dy: j ? "1.15em" : "0" }, name).textContent = line; });
        wrapped = true;
      } else name.textContent = label;
    }
    if (s.turn) {
      el("text", { class: "lbl-t lbl-turn", "data-row": 2, "data-w": w, x: cx, y: GROUND + DROP + (wrapped ? 290 : 255), "text-anchor": "middle", "font-size": 28, fill: "#185fa5" }, g).textContent = turnLabel(s.turn);
    }
    if (t.sharrow || s.bikeDir || t.bike) {
      // Cyclist sharing the lane (with a painted pictogram on a piktokoridor), possibly in contraflow.
      const bikeFwd = (s.bikeDir || s.dir) !== "backward";
      // A cyclist keeps to the right of their direction: the lane's right edge riding away from the viewer, its left
      // edge riding towards them (Bára, Optátova in contraflow).
      const edge = Math.min(w * 0.2, 60) + 20;
      const bx = bikeFwd ? x + w - edge : x + edge;
      // The piktokoridor's double chevron in the cut of the road under the cyclist, pointing their way: V towards
      // the viewer, Λ away (Bára).
      if (t.sharrow) {
        const d = bikeFwd ? -1 : 1, y = GROUND + 30;
        el("path", { d: [-11, 11].map((o) => `M${bx - 20} ${y + o - 10 * d}L${bx} ${y + o + 10 * d}L${bx + 20} ${y + o - 10 * d}`).join(""),
          fill: "none", stroke: "#fff", "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      }
      sprite(g, bikeFwd ? "biker-01-outbound" : "biker-01-inbound", bx, top);
    }
    if (opts.onSelect) {
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${t.label}, ${fmt(s.width)}, ${SOURCES[s.source]?.label || ""}`);
      g.addEventListener("click", () => opts.onSelect(i));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onSelect(i); } });
    }
    x += w;
    bounds.push(x);
  });

  el("text", { class: "lbl-total top-row", x: total / 2, y: y0 + 70, "text-anchor": "middle", "font-size": 46, "font-weight": 600, fill: "#1f1f1d" }, svg).textContent =
    tr("Celkem {w}", { w: fmt(total / 100) });
  // Ends of the cut, lettered as on the map (A = left end, B = right end), above everything else.
  // On a narrow street A and B step aside so the total does not run into them (the page redoes
  // this at screen size in layoutTop, an export keeps it).
  const half = (tr("Celkem {w}", { w: fmt(total / 100) }).length * 0.56 * 46) / 2;
  const ends = [Math.min(0, total / 2 - half - 70), Math.max(total, total / 2 + half + 70)];
  for (const [letter, x] of [["A", ends[0]], ["B", ends[1]]]) {
    el("circle", { class: "top-row", cx: x, cy: y0 + 70, r: 52, fill: "#d8413f", stroke: "#fff", "stroke-width": 8 }, svg);
    el("text", { class: "top-row", x, y: y0 + 94, "text-anchor": "middle", "font-size": 68, "font-weight": 700, fill: "#fff" }, svg).textContent = letter;
  }

  if (spans.wires.length) { const sg = el("g", { class: "span-wires", "pointer-events": "none" }, svg); for (const w of spans.wires) spanWire(sg, w); }

  // Trolley wires over the lanes under them (OSM trolley_wire): a span wire across, from the first wired lane
  // to the last, and the two contact wires (0.6 m apart, 5.4 m above the road) over each lane, hung from it.
  const wired = wiredLanes(segs, bounds);
  if (wired.length) {
    const wg = el("g", { class: "trolley-wires" }, svg);
    const yContact = GROUND - WIRE_H, ySpan = GROUND - WIRE_H - 60;
    el("line", { x1: bounds[wired[0]] + 20, x2: bounds[wired.at(-1) + 1] - 20, y1: ySpan, y2: ySpan, stroke: "#4a4945", "stroke-width": 2.5 }, wg);
    for (const i of wired) {
      const cx = (bounds[i] + bounds[i + 1]) / 2;
      for (const dx of [-30, 30]) {
        el("line", { x1: cx + dx, x2: cx + dx, y1: ySpan, y2: yContact, stroke: "#4a4945", "stroke-width": 1.5 }, wg);
        el("circle", { cx: cx + dx, cy: yContact, r: 5, fill: "#2b2a27" }, wg);
      }
    }
  }

  if (under) drawNetworks(svg, under, total);
  // Rainwater objects under the parts, over the networks' earth (Fable's review).
  if (undersLater.length) {
    const ug = el("g", { class: "under" }, svg);
    for (const [s, x, w] of undersLater) drawUnder(ug, s, x, w);
    // The networks over them, so a pipe running through a tank shows (and its tooltip works).
    const over = el("g", { class: "networks" }, svg);
    for (const n of [...svg.querySelectorAll("g.networks > g")]) if (n.dataset.tip) over.append(n);
    if (!over.childNodes.length) over.remove();
  }
  svg.dataset.drop = DROP;

  if (opts.title) {
    // A title tag in the top left corner, over the building there.
    el("rect", { class: "title-bg", x: vx + 16, y: yv + 30, width: 60 + opts.title.length * 25, height: 80, rx: 16, fill: "#1d1d1b" }, svg);
    el("text", { class: "lbl-title", x: vx + 46, y: yv + 86, "font-size": 46, "font-weight": 700, fill: "#fff" }, svg).textContent = opts.title;
  }

  if (opts.editable) {
    bounds.forEach((bx, k) => {
      const h = el("g", { class: "handle", "data-k": k }, svg);
      el("line", { x1: bx, x2: bx, y1: GROUND - 300, y2: DROP ? NET_TOP : GROUND + 120, stroke: "#8a877e", "stroke-width": 2, "stroke-dasharray": "8 6" }, h);
      el("rect", { class: "grab", x: bx - 40, y: GROUND - 340, width: 80, height: 460, fill: "transparent" }, h);
      el("circle", { class: "knob", cx: bx, cy: GROUND - 300, r: 18, fill: "#fff", stroke: "#185fa5", "stroke-width": 5 }, h);
      el("path", { class: "knob", d: `M${bx - 8} ${GROUND - 300} h16 M${bx - 8} ${GROUND - 300} l5 -5 M${bx - 8} ${GROUND - 300} l5 5 M${bx + 8} ${GROUND - 300} l-5 -5 M${bx + 8} ${GROUND - 300} l-5 5`, stroke: "#185fa5", "stroke-width": 3, fill: "none" }, h);
    });
  }
  if (opts.signs !== false) {
    drawSigns(svg, profile, bounds);
    // Without the page's fitting (an export): the rows below the labels at a fixed size, the picture as tall
    // as they need.
    const end = layoutSigns(svg, SIGN_SIZE, GROUND + DROP + 320, 3.6);
    if (end > GROUND + DROP + 320) bottom += end - H - DROP + 20;
  }
  if (opts.credits) {
    // Exported pictures carry the attribution their sources require (CC BY-SA for the illustrations): the
    // lines of exportCredits (or the given ones), each broken at " · " to the picture's width, the picture
    // made as tall as they need.
    const FS = 24, LH = 32, fit = Math.max(40, Math.floor((view[1] - 60) / (FS * 0.52)));
    const rows = [];
    for (const line of Array.isArray(opts.credits) ? opts.credits : exportCredits()) {
      // Pieces with the separator before them; a part too long for a row breaks after its commas.
      const pieces = line.split(" · ").flatMap((part, i) => (part.length > fit ? part.split(/(?<=,) /) : [part])
        .map((t, j) => [j ? " " : i ? " · " : "", t]));
      let row = "";
      for (const [sep, t] of pieces) {
        if (row && row.length + sep.length + t.length > fit) { rows.push(row); row = t; } else row += row ? sep + t : t;
      }
      if (row) rows.push(row);
    }
    bottom += (rows.length - 1) * LH;
    rows.forEach((row, i) => {
      el("text", { class: "credits", x: vx + 30, y: bottom - 25 - (rows.length - 1 - i) * LH, "font-size": FS, fill: "#6b6a65" }, svg).textContent = row;
    });
  }
  svg.setAttribute("viewBox", `${vx} ${yv} ${view[1]} ${bottom - yv}`);
  bg.setAttribute("height", bottom - yv);
  svg.dataset.view = JSON.stringify(view);
  return svg;
}

// Narrowest width a segment can be dragged to: perpendicular parking keeps 4.5 m (ČSN 73 6056).
const minWidth = (seg) => (seg.type === "parkovani" && seg.orient === "kolme" ? 4.5 : 0.2);

// Mount an editable profile with draggable boundaries.
// onRedraw runs after each drawing (also while a handle is dragged), for the page to fit the labels.
export function mountEditor(container, profile, { editable = true, selected, onSelect, selectedEdge, onEdge, onChange, onRedraw, underground }) {
  const draw = (view) => {
    container.replaceChildren(buildSvg(profile, { editable, selected, onSelect, selectedEdge, onEdge, view, underground }));
    onRedraw?.(container);
    return container.firstChild;
  };
  let svg = draw();
  svg.addEventListener("pointerdown", startDrag);

  function startDrag(ev) {
    const h = ev.target.closest(".handle");
    if (!h) return;
    ev.preventDefault();
    const k = Number(h.dataset.k);
    const view = JSON.parse(svg.dataset.view);
    const toCm = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse()).x;
    };
    let last = toCm(ev), moved = false;
    const segs = profile.segments;
    const move = (e) => {
      const xcm = toCm(e);
      let d = Math.round((xcm - last) / 5) * 0.05; // 5 cm steps
      if (!d) return;
      moved = true;
      const a = segs[k - 1], b = segs[k];
      if (a && b) {
        d = Math.max(-(a.width - minWidth(a)), Math.min(b.width - minWidth(b), d));
        a.width = +(a.width + d).toFixed(2);
        b.width = +(b.width - d).toFixed(2);
        a.source = b.source = "user";
      } else if (b) {
        d = Math.min(b.width - minWidth(b), d);
        b.width = +(b.width - d).toFixed(2);
        b.source = "user";
      } else if (a) {
        d = Math.max(-(a.width - minWidth(a)), d);
        a.width = +(a.width + d).toFixed(2);
        a.source = "user";
      }
      last += d * 100;
      svg = draw(view);
      svg.addEventListener("pointerdown", startDrag);
    };
    // A cancelled touch (the browser took the gesture) ends the drag like lifting the finger.
    const up = (e) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (moved) { onChange(); return; }
      // A click on a handle's wide grab area (narrow parts lie under it: Fable) selects the part under the pointer.
      const xcm = toCm(e);
      let x = 0;
      const i = segs.findIndex((s) => (x += s.width * 100) > xcm);
      if (i >= 0 && xcm >= 0) onSelect?.(i);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
}

export function svgString(svgs, gap = 40) {
  if (svgs.length === 1) return new XMLSerializer().serializeToString(svgs[0]);
  // Stack several profiles vertically into one SVG.
  const boxes = svgs.map((s) => s.getAttribute("viewBox").split(" ").map(Number));
  const width = Math.max(...boxes.map((b) => b[2]));
  const height = boxes.reduce((a, b) => a + b[3] + gap, -gap);
  const out = el("svg", { xmlns: NS, viewBox: `0 0 ${width} ${height}` });
  let y = 0;
  svgs.forEach((s, i) => {
    const b = boxes[i];
    const inner = s.cloneNode(true);
    inner.setAttribute("x", (width - b[2]) / 2);
    inner.setAttribute("y", y);
    inner.setAttribute("width", b[2]);
    inner.setAttribute("height", b[3]);
    out.appendChild(inner);
    y += b[3] + gap;
  });
  return new XMLSerializer().serializeToString(out);
}

// The networks right under the street, at their real depth and size (a trial, Bára; the look proposed and criticised
// with Fable): the depth counts from the bottom of the drawn roadway (schematically, NET_TOP), under a thin base
// course; one light earth runs under the whole picture, the edges' foundations over it; pipes are hollow, cables
// full, each with a light halo and a dark rim so it shows on the earth; a depth missing in the data is a dashed ring
// at the kind's usual depth. The rows of labels move down by DROP; the legend in one column under the right edge.
const NET_V = 100, NET_TOP = GROUND + 60, BASE_COURSE = 12, LEGEND_ROW = 38; // drawing units per metre of depth, as across
const SOIL = "#e4d6bf", NET_ORDER = ["slaboproud", "silnoproud", "plynovod", "teplovod", "vodovod", "kanalizace", "jine"];
const lighten = (hex, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) + (251 - parseInt(hex.slice(i, i + 2), 16)) * k).toString(16).padStart(2, "0")).join("");
const netEntries = (items, kinds) => [
  ...NET_ORDER.filter((kind) => items.some((i) => i.kind === kind)).map((kind) => ({ k: kinds[kind] || kinds.jine })),
  ...(items.some((i) => !i.measured) ? [{ empty: true, k: { label: tr("hloubka neznámá"), color: "#6b6a65" } }] : []),
];
function undergroundDrop(items, kinds, objects = 0) {
  // The networks to 4 m at most (deeper ones sit at the bottom); a rainwater object to its bottom (editor: 10 m).
  const deepest = Math.max(Math.min(4, Math.max(items.length ? 2 : 1, ...items.map((i) => i.depth + 0.2))), objects + 0.2);
  const depth = BASE_COURSE + (deepest + 0.15) * NET_V + 40, legend = 30 + netEntries(items, kinds).length * LEGEND_ROW;
  return Math.max(0, NET_TOP + Math.max(depth, legend) - (GROUND + 104));
}
function drawNetworks(svg, { items, span, kinds }, total) {
  // At their place in metres from A (a design keeps the street's places: holes, Bára), not stretched.
  const x = (t) => (span.left - t) * 100;
  const g = el("g", { class: "networks" }, svg), base = GROUND + 104 + DROP, zero = NET_TOP + BASE_COURSE; // the sources' strips sit on its bottom
  // The earth: under the whole picture below the edges' foundations, under the street from the roadway down.
  el("rect", { x: -EDGE, y: GROUND + 100, width: total + 2 * EDGE, height: base - GROUND - 100, fill: SOIL }, g);
  el("rect", { x: 0, y: NET_TOP, width: total, height: GROUND + 100 - NET_TOP, fill: SOIL }, g);
  el("rect", { x: 0, y: NET_TOP, width: total, height: BASE_COURSE, fill: "#b9a384" }, g);
  el("line", { x1: 0, x2: total, y1: zero, y2: zero, stroke: "#a8906e", "stroke-width": 1.5 }, g);
  // Every metre: a dashed line, labelled at both ends (and in the middle of a wide street).
  for (let m = 1; zero + m * NET_V < base - 10; m++) {
    const y = zero + m * NET_V, at = [[10, "start"], [total - 10, "end"]];
    for (let mx = 1500; mx < total - 500; mx += 1500) at.push([mx, "middle"]); // and every 15 m
    el("line", { x1: 0, x2: total, y1: y, y2: y, stroke: "#c9b696", "stroke-width": 1.5, "stroke-dasharray": "6 6" }, g);
    for (const [lx, anchor] of at) el("text", { x: lx, y: y - 6, "text-anchor": anchor, "font-size": 24, fill: "#6b5a44" }, g).textContent = `${m} m`;
  }
  for (const it of items) {
    const cx = x(it.t);
    if (cx < -EDGE || cx > total + EDGE) continue;
    const k = kinds[it.kind] || kinds.jine, dn = it.profil > 20 && it.profil < 3000 ? it.profil : k.dn, r = Math.max(8, dn / 20);
    const cy = Math.min(base - r - 4, zero + it.depth * NET_V + r), n = el("g", {}, g);
    n.dataset.tip = `${k.label}${it.profil > 20 ? ` DN ${it.profil}` : ""} · ${it.measured ? tr("hloubka {d} m", { d: num(it.depth) }) : tr("hloubka neznámá (obvyklá {d} m)", { d: num(it.depth) })}${it.lines > 1 ? ` ${tr("(v datech {n}× vedle sebe)", { n: it.lines })}` : ""}\n${it.popis}`;
    el("circle", { cx, cy, r: Math.max(r, 24), fill: "transparent" }, n); // a target big enough for the tooltip
    if (it.measured) {
      el("circle", { cx, cy, r: r + 6, fill: "#fbfaf6", opacity: 0.55 }, n);
      el("circle", { class: "net", cx, cy, r, fill: k.color, stroke: "#2a2622", "stroke-opacity": 0.35, "stroke-width": 2 }, n);
      if (r >= 12) el("circle", { cx, cy, r: r - 4, fill: lighten(k.color, 0.55) }, n); // a pipe is hollow, a cable full
    } else {
      el("circle", { class: "net", cx, cy, r, fill: k.color, "fill-opacity": 0.35, stroke: k.color, "stroke-width": 3, "stroke-dasharray": "4 3" }, n);
    }
  }
  // The legend: one column under the right edge, a panel as wide as the edge and flush with the depth-0 line (Bára:
  // not floating), the kinds in their usual order from the top.
  const entries = netEntries(items, kinds);
  if (!entries.length) return; // the earth for a rainwater object alone
  el("rect", { x: total, y: zero, width: EDGE, height: entries.length * LEGEND_ROW + 20, fill: "#fbfaf6", stroke: "#e2ded4", "stroke-width": 1.5 }, g);
  entries.forEach((e, i) => {
    const lx = total + 16, ly = zero + 10 + (i + 0.5) * LEGEND_ROW;
    if (e.empty) el("circle", { cx: lx + 22, cy: ly, r: 11, fill: "#6b6a65", "fill-opacity": 0.35, stroke: e.k.color, "stroke-width": 3, "stroke-dasharray": "4 3" }, g);
    else el("circle", { cx: lx + 22, cy: ly, r: 11, fill: e.k.color, stroke: "#2a2622", "stroke-opacity": 0.35, "stroke-width": 2 }, g);
    el("text", { x: lx + 44, y: ly + 9, "font-size": 26, fill: "#4f4e49" }, g).textContent = e.k.label;
  });
}
