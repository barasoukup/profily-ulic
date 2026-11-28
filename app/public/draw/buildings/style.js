// Which look a building gets (set by hand, else from IPR, RÚIAN, OSM and the state's own rules), and the names of the looks.
import { AMERICA } from "../../houses-america-spec.js";
import { city, country } from "../../city.js";
import { PANEL_SCORE, panelScore, smallHouse, strictSlab } from "../../house-looks.js";
import { t as tr } from "../../i18n.js";
import { buildingHeight, heightFloors } from "./info.js";

// Prague buildings are drawn from the side (we look along the street): the outline tells the type.
// nizky: a smaller town house (lower storeys and windows, mostly a gabled tile roof), with any number of floors
// (Bára: "nízký" was wrong on 4 floors).
// More looks (Bára 16. 11. 2026, from the data of Czechia): the family houses by age (a villa or older house, the
// "cube" of the 1960s–80s, a new one), a village house with its gable to the street, the socialist-realist house of
// the 1950s, the office building. The socialist looks (sorela, typovy, the panel house) only where they were built
// (socialistLooks below); elsewhere the postwar block of flats (povalecny, Bára 23. 11. 2026). Each is drawn on the base of an older look (BASE_STYLE) with its own details.
export const BUILDING_STYLES = {
  sikma: tr("profile.tenementPitchedRoof"), sorela: tr("profile.n1950sHouseSocialist"), funkce: tr("profile.functionalistApartmentBlock"),
  plocha: tr("profile.prefabPanelBlock"), moderni: tr("profile.modernApartmentBuilding"), kancelar: tr("profile.officeBuilding"), nizky: tr("profile.townHouse"),
  typovy: tr("profile.brickBlockFlats1950s"), povalecny: tr("profile.postwarBlockFlats"), vila: tr("profile.villaOlderFamilyHouse"), kostka: tr("profile.familyHouse1960s80s"), novyrd: tr("profile.newFamilyHouse"),
  statek: tr("profile.villageHouseGableStreet"), mestan: tr("profile.burgherHouseTownSquare"), skola: tr("profile.school"),
  kostel: tr("profile.church"), garaz: tr("profile.garage"), hala: tr("profile.hall"),
  // The regional looks of Europe's old houses (house-looks.js, docs/house-types-europe.md; Bára 23. 11. 2026), given by
  // the states' houseLook; by hand anywhere. The gabled ones (stit, hanza) only with ?stit=1 (LOOKS.gables).
  haussmann: tr("profile.haussmannBuilding"), stredomori: tr("profile.mediterraneanTownHouse"), azulejo: tr("profile.portugueseHouseAzulejoTiles"),
  galeria: tr("profile.houseGlazedGallery"), malta: tr("profile.malteseHouseTimberBalcony"), kypr: tr("profile.cypriotStoneHouse"),
  cihlovy: tr("profile.brickHouseCornice"), stit: tr("profile.brickHouseGableStreet"), dansky: tr("profile.danishBrickApartmentBuilding"),
  stenstad: tr("profile.nordicRenderedApartmentBuilding"), drevak: tr("profile.paintedWoodenHouse"), puukaupunki: tr("profile.woodenTownHouse"),
  tallinnamaja: tr("profile.tallinnHouse"), hanza: tr("profile.hanseaticGabledHouse"),
  // North America (houses-america.js, docs/house-types-north-america.md; Bára 25. 11. 2026), given by the states' houseLook.
  bayrow: tr("profile.americanBrickRowHouse"), porchrow: tr("profile.rowHousePorch"), framehouse: tr("profile.americanHousePorch"),
  brickblock: tr("profile.americanBrickApartmentHouse"), slab: tr("profile.americanSlabApartmentBlock"), podium: tr("profile.apartmentsOverShops"),
  glasstower: tr("profile.glassTower"), mainstreet: tr("profile.americanMainStreetBuilding"), stripmall: tr("profile.oneStoreyShops"),
  brownstone: tr("profile.newYorkBrownstone"), tenement: tr("profile.newYorkTenementFire"), tripledecker: tr("profile.bostonTripleDecker"),
  baygable: tr("profile.torontoBayGableHouse"), victorian: tr("profile.sanFranciscoVictorian"),
};
// The gabled looks draw a licence Bára has yet to approve: offered by hand only with ?stit=1.
export const GABLE_LOOKS = new Set(["stit", "hanza"]);
export const BASE_STYLE = { sorela: "sikma", typovy: "sikma", mestan: "sikma", kancelar: "plocha", vila: "nizky", kostka: "nizky", novyrd: "nizky", statek: "nizky",
  // The regional looks: four drawings of their own (stredomori, cihla, drevo) and the tenement's (sikma).
  haussmann: "sikma", stenstad: "sikma", stredomori: "stredomori", azulejo: "stredomori", galeria: "stredomori", malta: "stredomori", kypr: "stredomori",
  cihlovy: "cihla", stit: "cihla", dansky: "cihla", hanza: "cihla", drevak: "drevo", puukaupunki: "drevo", tallinnamaja: "drevo",
  ...Object.fromEntries(Object.keys(AMERICA).map((k) => [k, "america"])) };
export const MED_LOOKS = new Set(["stredomori", "azulejo", "galeria", "malta", "kypr"]);
export const REGIONAL = new Set(Object.keys(BASE_STYLE).filter((k) => ["stredomori", "cihla", "drevo"].includes(BASE_STYLE[k]) || k === "haussmann" || k === "stenstad"));
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
export const IPR_ROOF = { 1: "sikma", 3: "plocha", 5: "sikma" };
// Within innerKm of the centre an unknown building is taken for a pitched-roof tenement, from estateKm
// for a panel house; a town has its own (city.js innerKm, estateKm; Most has no old inner town).
const innerKm = () => city.innerKm ?? 3;

export const OFFICE_TYPES = new Set(["office", "commercial", "civic", "government", "public", "school", "university", "hospital", "hotel"]);

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
  const regional = country.houseLook(look, info, info?.levels || heightFloors(h), city);
  return BUILDING_STYLES[regional] ? regional : look;
}
// What the state changes in drawing a look (countries/<ISO>.js houseDetails): a terrace or a tile roof, Spain's roller
// blinds, upright or horizontal boards, its own colours.
export const houseDetails = (kind, info) => (country.houseDetails && country.houseDetails(kind, info, city)) || {};
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
  const n = info?.levels || heightFloors(h);
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
  // common again) looks like any new block of flats (evaluation/archive/panel-buildings: 16 houses after 2000).
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
  if (!n) return info?.km > innerKm() ? "nizky" : smallHouse(info) ? smallKind(info) : "sikma";
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
// 16. 11. 2026, evaluation/archive/panel-buildings/REPORT.md). Panel walls in RÚIAN still make a panel house (above).
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

// The look of a small house alone (smallHouse): the year OSM gives (start_date) as RÚIAN's; its garage and shed joined to
// it are no row (familyKind reads 3 joined parts as one); a footprint under 30 m² is a shed or a hut.
const SHED_AREA = 30;
const smallKind = (info) => (info.footprint < SHED_AREA ? "garaz" : familyKind({ ...info, built: info.start, block: undefined }));

// A flat-roofed house: a panel house, or a functionalist tenement in a city block. Told apart by
// the block the OSM building belongs to (blockShape in derive.js): a panel house is a slab at most
// PANEL_WIDTH wide filling its rectangle, a block of few long parts (an L of slabs: PANEL_PART m
// of outline per building or more), 8+ floors, or out on the estates; a house joined into a wider
// block of short houses round a courtyard is a tenement. Checked on 361 OSM apartment houses of 4+
// floors with a building date (evaluation/archive/building-types): 72 % of the 1958–90 ones and 78 % of the
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
// Not a panel house (evaluation/archive/panel-buildings, RÚIAN walls of 780 houses in 11 towns, Bára 16. 11. 2026: "paneláků
// máme moc"): a house completed before PANEL_FROM (the first Czech panel houses are of the mid-1950s; a slab of the
// 1930s or 40s was drawn as one), or one whose walls RÚIAN gives as bricks, stone, monolith or wood (info.solid).
// Such a flat-roofed block of flats is drawn as the plain flat-roofed tenement.
const OLD_SETBACK_KM = 4.5, PANEL_FROM = 1955, MODERN_FROM = 1995;
const isSlab = (b) => !!b && ((b.fill >= PANEL_FILL && b.width <= PANEL_WIDTH) || (b.parts >= 2 && (b.length + b.width) / b.parts >= PANEL_PART));
// Abroad, where panel houses were built (socialistLooks), the shape alone makes a panel house only as a long compact slab (house-looks.js strictSlab); Czechia keeps isSlab.
const slabOf = (b, info) => {
  if (!(city.abroad && socialistLooks())) return isSlab(b);
  const sc = panelScore(info);
  return sc === null ? strictSlab(b) : sc >= PANEL_SCORE;
};
function flatKind(info, n) {
  if (OFFICE_TYPES.has(info?.type) || (info?.office && !FLAT_RESIDENTIAL.has(info?.type))) return "kancelar";
  if (info?.newBuild) return "moderni"; // IPR "nová budova"
  const b = info?.block;
  const slab = slabOf(b, info);
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
  // A small house alone, nothing else known of it: a family house (house-looks.js smallHouse), whatever its roof or year.
  if (!n && !OFFICE_TYPES.has(info?.type) && smallHouse(info)) return smallKind(info);
  const y = info?.start;
  if (y) return y < 1920 || (y >= 1946 && y < 1958) ? "sikma" : flatKind({ ...info, built: y }, n);
  const rs = info?.roofShape;
  if (rs && rs !== "flat") return "sikma";
  if (OFFICE_TYPES.has(info?.type)) return "plocha";
  // Where panel houses were built, the shape of a block alone (no floors, no kind) tells none (evaluation/archive/all-buildings).
  if ((slabOf(info?.block, info) && (n || info?.type || !socialistLooks())) || (n >= PANEL_FLOORS && !info?.block)) return "plocha";
  return rs === "flat" ? "funkce" : "sikma";
}

// A low building has a pitched roof where it is known to (IPR's roof shape), or where it is a house:
// RÚIAN "rodinný dům" or cottage (info.house), an OSM house type, an IPR family house (typ 6, Prague).
// Otherwise (a shop, a school, a garage, nothing known) a plain flat roof (Bára: Most, tř. Budovatelů).
export function pitchedLow(info) {
  const roof = IPR_ROOF[info?.roofType];
  if (roof) return roof !== "plocha";
  return !!(info?.house || HOUSE_TYPES.has(info?.type) || (city.iprHouseKind && info?.iprKind === 6));
}
