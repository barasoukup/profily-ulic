// The regional looks of a house in Europe (docs/house-types-europe.md, checked on street photos; Bára 23. 11. 2026):
// the rules the states' modules (countries/<ISO>.js houseLook, houseDetails) call. profile.js buildingStyle hands the
// look it derived (after westernLook) to the state's houseLook; a regional look replaces only the "old" looks the
// rule names (sikma, mestan, nizky; vila and statek for wooden houses), never a look with its own date or use
// (funkce, povalecny, moderni, kancelar, hala, skola, kostel, garaz). No query at run time: the old towns are lists of
// centres and radii here. Sweden, Norway, Denmark and Finland have no modules yet: nordicLook(iso) and
// nordicDetails(iso) are what their countries/SE.js … will call (tests/house-looks.test.js tests them directly).
// No import of city.js (the states import this module).

// The gabled looks (the North Sea step, neck and bell gable, the Hanseatic house of Tallinn) draw the gable's outline
// above the side view (Bára 23. 11. 2026: approved, drawn by default for the old houses the rules pick); ?stit=0 turns
// them off (the cornice brick house, the look left as it was).
const STIT = typeof location !== "undefined" ? new URLSearchParams(location.search).get("stit") : null;
// The gable cut by the frame (two thirds of a wider house: the house runs on past the cut like the others; Bára
// 23. 11. 2026 chose it over the whole symmetric gable, which ?stit=cely still draws).
export const LOOKS = { gables: STIT !== "0", gableCut: STIT !== "cely" };

const OLD = new Set(["sikma", "mestan", "nizky"]);
const yearOf = (info) => info?.built ?? info?.start;
// The house's place: derive.js point while the cut is made, app.js at (rounded) in the profile kept and saved.
export const placeOf = (info) => info?.point || info?.at;
const PI = Math.PI;
// [lon0, lat0, lon1, lat1]
const inBox = (p, b) => !!p && p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
const inBoxes = (p, boxes) => boxes.some((b) => inBox(p, b));
const kmTo = (p, [lon, lat]) => Math.hypot((p[0] - lon) * 111.32 * Math.cos((lat * PI) / 180), (p[1] - lat) * 110.54);
// A point within one of the old towns ({ name, centre: [lon, lat], km }).
export const inOldTown = (towns, p) => !!p && (towns || []).some((t) => kmTo(p, t.centre) <= t.km);
// A number of the house that stays the same on every drawing (its place), to vary looks among neighbours.
export const houseHash = (info) => {
  const p = placeOf(info);
  if (!p) return (info?.tint ?? 0) + (info?.levels || 0);
  return ((Math.round(p[0] * 1e5) * 73856093) ^ (Math.round(p[1] * 1e5) * 19349663)) >>> 0;
};
const isSlab = (b) => !!b && ((b.fill >= 0.65 && b.width <= 16) || (b.parts >= 2 && (b.length + b.width) / b.parts >= 30));
const wooden = (info) => /^(wood|timber|log|wooden)$/.test(info?.material || "");
const HOUSE_TYPES = new Set(["house", "detached", "semidetached_house", "terrace", "bungalow", "villa", "farm"]);

// --- 2. The Mediterranean town house and its variants -------------------------------------------------------------
// Northern Spain's glazed galleries (Galicia, Asturias, Cantabria, the Basque Country; rough boxes of the regions).
const ES_NORTH = [[-9.4, 41.8, -6.7, 43.8], [-7.2, 42.85, -3.15, 43.7], [-3.45, 42.75, -1.73, 43.45]];
// The province of Bolzano is alpine, not Mediterranean (its houses stay as they are).
const BOLZANO = [10.38, 46.22, 12.48, 47.09];
// The French departments on the Mediterranean (06, 13, 83, 30, 34, 11, 66, 2A, 2B), as rough boxes.
export const FR_MED = [[1.7, 42.3, 3.3, 43.45], [2.5, 43.2, 4.9, 44.0], [4.2, 42.9, 7.0, 43.95], [6.6, 43.45, 7.75, 44.0], [8.5, 41.3, 9.6, 43.05]];
// The old cores of Cyprus (Nicosia within the Venetian walls, Limassol, Larnaca, Paphos).
export const CY_OLD_TOWNS = [
  { name: "Lefkosia", centre: [33.3640, 35.1745], km: 0.75 }, { name: "Lemesos", centre: [33.0430, 34.6740], km: 0.6 },
  { name: "Larnaka", centre: [33.6360, 34.9150], km: 0.6 }, { name: "Pafos", centre: [32.4230, 34.7760], km: 0.6 },
];

// iso: ES, PT, IT, CY, MT, FR (Mediterranean departments), MC. Up to 1930 (Malta, Cyprus 1940) or of no known year.
export function mediterraneanLook(iso) {
  return (style, info, n) => {
    const y = yearOf(info), p = placeOf(info);
    // Malta and Cyprus build flat roofs: a flat house of no known year (funkce by OSM's roof:shape=flat) is old too.
    const flatOld = (iso === "MT" || iso === "CY") && style === "funkce" && !y && !(n > 4);
    if (!OLD.has(style) && !flatOld) return undefined;
    if (iso === "MT") return y > 1940 || info?.start > 1960 || n >= 8 ? undefined : "malta";
    if (iso === "CY") {
      if (y) return y <= 1940 ? "kypr" : undefined;
      return !(n > 3) && inOldTown(CY_OLD_TOWNS, p) ? "kypr" : undefined;
    }
    if (y > 1930) return undefined;
    if (style === "nizky" && !(n >= 2)) return undefined; // a one-storey house stays
    if (iso === "IT" && inBox(p, BOLZANO)) return undefined;
    if (iso === "ES" && inBoxes(p, ES_NORTH) && n !== 1) return "galeria";
    if (iso === "PT") return houseHash(info) % 2 ? "azulejo" : "stredomori"; // not every house is tiled
    return "stredomori";
  };
}
// The roof of a Mediterranean house: a flat terrace where OSM says flat; else a tile roof in Italy and Portugal, in
// Spain a terrace in Catalonia and the south and every other house elsewhere. Spain's roller blinds and awnings.
export function mediterraneanDetails(iso) {
  return (look, info) => {
    if (!["stredomori", "azulejo", "galeria", "kypr"].includes(look)) return {};
    const rs = info?.roofShape, p = placeOf(info);
    const known = rs ? rs === "flat" : null;
    if (iso !== "ES") return known === null ? {} : { terrace: known };
    const flatty = !!p && (p[1] < 38.6 || (p[0] > 0.7 && p[1] > 40.5)); // Andalusia, Murcia; Catalonia
    return { terrace: known ?? (look === "galeria" ? false : flatty || houseHash(info) % 2 === 0), blinds: true };
  };
}

// --- 1. The Haussmann house ---------------------------------------------------------------------------------------
// The big cities (Paris within the boulevards des Maréchaux), where a closed block of 5–8 floors of no known year is
// taken for one.
export const FR_BIG_TOWNS = [
  { name: "Paris", centre: [2.3488, 48.8534], km: 5.5 }, { name: "Lyon", centre: [4.8357, 45.7640], km: 3 },
  { name: "Marseille", centre: [5.3698, 43.2965], km: 3 }, { name: "Bordeaux", centre: [-0.5792, 44.8378], km: 2.5 },
  { name: "Nice", centre: [7.2620, 43.7102], km: 2.5 }, { name: "Lille", centre: [3.0573, 50.6292], km: 2 },
  { name: "Toulouse", centre: [1.4442, 43.6047], km: 2 }, { name: "Nantes", centre: [-1.5536, 47.2184], km: 2 },
  { name: "Strasbourg", centre: [7.7521, 48.5734], km: 2 }, { name: "Montpellier", centre: [3.8767, 43.6108], km: 2 },
];
// A mansard (OSM roof:shape) anywhere; 5+ floors of 1850–1930; 5–8 floors of no known year in a closed block of a
// big town (not with needYear: Luxembourg has much postwar building). 2–4 floors without a mansard are not one.
export function haussmannLook({ bigTowns = [], needYear = false, low = false } = {}) {
  return (style, info, n) => {
    if (style !== "sikma" && style !== "mestan") return undefined;
    const y = yearOf(info);
    if (y > 1930) return undefined;
    if (info?.roofShape === "mansard") return "haussmann";
    if (y >= 1850 && n >= 5) return "haussmann";
    if (!y && !needYear && n >= 5 && n <= 8 && !isSlab(info?.block) && inOldTown(bigTowns, placeOf(info))) return "haussmann";
    // Brussels: the narrower maison bourgeoise of 3–4 floors as a Haussmann house without the long balconies.
    if (low && (!y || y >= 1850) && !(n > 8)) return "haussmann";
    return undefined;
  };
}
// France: Haussmann; on the Mediterranean the lower ones are Mediterranean houses.
const frHaussmann = haussmannLook({ bigTowns: FR_BIG_TOWNS }), frMed = mediterraneanLook("FR");
export const franceLook = (style, info, n) => frHaussmann(style, info, n) || (inBoxes(placeOf(info), FR_MED) ? frMed(style, info, n) : undefined);
export const franceDetails = (look, info) => (inBoxes(placeOf(info), FR_MED) ? mediterraneanDetails("FR")(look, info) : {});
// Monaco: Haussmann from 5 floors, below Mediterranean.
const mcHaussmann = haussmannLook({ bigTowns: [{ name: "Monaco", centre: [7.4246, 43.7384], km: 2 }] }), mcMed = mediterraneanLook("MC");
export const monacoLook = (style, info, n) => (n >= 5 || info?.roofShape === "mansard" ? mcHaussmann(style, info, n) : mcMed(style, info, n));
export const luxembourgLook = haussmannLook({ needYear: true });

// --- 3. The North Sea brick house ---------------------------------------------------------------------------------
// The cornice house (lijstgevel, 1750–1920) of the towns; the gabled house (step, neck or bell gable, 1600–1800) only
// with LOOKS.gables: before 1800 with its ridge across the street (derive.js across, a narrow house running away from
// the street), or of no known year in the old towns.
export const NL_GABLE_TOWNS = [
  { name: "Amsterdam", centre: [4.8936, 52.3708], km: 1.6 }, { name: "Leiden", centre: [4.4880, 52.1600], km: 0.8 },
  { name: "Haarlem", centre: [4.6370, 52.3810], km: 0.7 }, { name: "Delft", centre: [4.3580, 52.0115], km: 0.6 },
];
export const BE_GABLE_TOWNS = [
  { name: "Gent", centre: [3.7210, 51.0550], km: 0.9 }, { name: "Brugge", centre: [3.2247, 51.2093], km: 1.1 },
  { name: "Antwerpen", centre: [4.4005, 51.2210], km: 0.8 }, { name: "Bruxelles Grand-Place", centre: [4.3525, 50.8467], km: 0.35 },
];
export function brickLook(gableTowns = []) {
  return (style, info, n) => {
    if (!OLD.has(style)) return undefined;
    // A house of a row of no known floors is a town house too (Flanders: 3 floors; evaluation/all-buildings).
    if (style === "nizky" && !(n >= 2) && !(!n && HOUSE_TYPES.has(info?.type) && info?.block?.parts >= 3)) return undefined;
    const y = yearOf(info);
    if (y > 1920) return undefined; // the Amsterdam School stays functionalist
    if (LOOKS.gables && info?.across && (y ? y < 1800 : inOldTown(gableTowns, placeOf(info)))) return "stit";
    return "cihlovy";
  };
}
export const netherlandsLook = brickLook(NL_GABLE_TOWNS);
// Belgium: Brussels-Capital (box) has Haussmann's boulevards and the maison bourgeoise, older houses of brick;
// Flanders (north of the language border, roughly lat 50.74) brick; Wallonia stays.
const BRUSSELS = [4.24, 50.76, 4.48, 50.92];
const beHaussmann = haussmannLook({ low: true }), beBrick = brickLook(BE_GABLE_TOWNS);
export function belgiumLook(style, info, n) {
  const p = placeOf(info);
  if (inBox(p, BRUSSELS)) return (yearOf(info) < 1850 ? undefined : beHaussmann(style, info, n)) || beBrick(style, info, n);
  if (p && p[1] > 50.74) return beBrick(style, info, n);
  return undefined;
}
// Brussels renders its houses white more often than Paris builds stone.
export const belgiumDetails = (look) => (look === "haussmann" ? { palette: ["#f1efe8", "#ece6d8", "#e8dcc4", "#f1efe8", "#e6dccb"] } : {});

// --- 4. Estonia ---------------------------------------------------------------------------------------------------
export const EE_OLD_TOWNS = [
  { name: "Tallinn Vanalinn", centre: [24.7450, 59.4370], km: 0.45 }, { name: "Tartu", centre: [26.7225, 58.3805], km: 0.35 },
];
// The wooden districts of 1900–40 (Tallinna maja and wooden houses), centre and radius.
export const EE_WOOD_DISTRICTS = [
  { name: "Kalamaja", centre: [24.7340, 59.4460], km: 0.75 }, { name: "Pelgulinn", centre: [24.7130, 59.4380], km: 0.7 },
  { name: "Kassisaba", centre: [24.7280, 59.4310], km: 0.4 }, { name: "Uus Maailm", centre: [24.7390, 59.4250], km: 0.45 },
  { name: "Kopli", centre: [24.6840, 59.4520], km: 0.6 }, { name: "Supilinn", centre: [26.7160, 58.3880], km: 0.35 },
  { name: "Karlova", centre: [26.7400, 58.3690], km: 0.5 },
];
export function estoniaLook(style, info, n) {
  const y = yearOf(info), wood = wooden(info), p = placeOf(info);
  // The Hanseatic house of the old towns: its ridge across the street; along it a tenement (half of them, Pikk).
  if (LOOKS.gables && OLD.has(style) && !(y > 1919) && info?.across && inOldTown(EE_OLD_TOWNS, p)) return "hanza";
  if (inOldTown(EE_OLD_TOWNS, p)) return undefined;
  // The Tallinn house: 2–3 floors, of 1900–40, wooden, or of no known year in the wooden districts. A flat-roof guess
  // (funkce) of a wooden house is no functionalist one.
  const town = style === "sikma" || (style === "nizky" && !HOUSE_TYPES.has(info?.type)) || (style === "funkce" && wood);
  if (town && n >= 2 && n <= 3 && ((y >= 1900 && y <= 1940) || wood || (!y && inOldTown(EE_WOOD_DISTRICTS, p)))) return "tallinnamaja";
  // A wooden family house (Nõmme, Tartu, Pärnu, Haapsalu).
  if ((style === "vila" || style === "statek" || (style === "nizky" && HOUSE_TYPES.has(info?.type))) && (wood || y <= 1940)) return "drevak";
  return undefined;
}
export const estoniaDetails = (look) => (look === "drevak" ? { boards: "horizontal", palette: ["#d9b36a", "#a9bf98", "#8ea4b3", "#e9d79a", "#8a6a4a", "#9aa596"] } : {});

// --- 5. Scandinavia and Finland -----------------------------------------------------------------------------------
export const NORDIC_WOOD_TOWNS = [
  { name: "Porvoo", centre: [25.6625, 60.3935], km: 0.4 }, { name: "Rauma", centre: [21.5110, 61.1280], km: 0.4 },
  { name: "Loviisa", centre: [26.2250, 60.4569], km: 0.4 }, { name: "Kokkola", centre: [23.1280, 63.8420], km: 0.4 },
  { name: "Turku Port Arthur", centre: [22.2520, 60.4405], km: 0.4 }, { name: "Puu-Vallila", centre: [24.9590, 60.1950], km: 0.35 },
  { name: "Käpylä", centre: [24.9500, 60.2150], km: 0.5 }, { name: "Pispala", centre: [23.7140, 61.5030], km: 0.8 },
  { name: "Bakklandet", centre: [10.4040, 63.4300], km: 0.35 }, { name: "Stavanger Gamle", centre: [5.7300, 58.9720], km: 0.3 },
  { name: "Bergen Nordnes", centre: [5.3150, 60.3970], km: 0.5 }, { name: "Eksjö", centre: [14.9700, 57.6670], km: 0.5 },
];
const BORNHOLM = [14.68, 54.98, 15.16, 55.3];
// iso: SE, NO, FI, DK. The stone town's tenement up to 1930 (Denmark: the brick one, rendered → stenstad), the painted
// wooden house up to 1950 (Denmark only on Bornholm), the wooden town house of 1–2 floors up to 1940.
export function nordicLook(iso) {
  return (style, info, n) => {
    const y = yearOf(info), wood = wooden(info), p = placeOf(info);
    if (iso !== "DK" && (style === "nizky" || style === "mestan") && !HOUSE_TYPES.has(info?.type) && !(n > 2)
      && (wood || (!(y > 1940) && inOldTown(NORDIC_WOOD_TOWNS, p)))) return "puukaupunki";
    if (style === "vila" || style === "statek" || (style === "nizky" && HOUSE_TYPES.has(info?.type) && !(n > 2))) {
      if (iso === "DK" && !inBox(p, BORNHOLM)) return undefined;
      return wood || !(y > 1950) ? "drevak" : undefined;
    }
    if (style === "sikma" || style === "mestan") {
      if (y > 1930) return undefined;
      if (iso === "DK") return /^(plaster|render|stucco)$/.test(info?.material || "") ? "stenstad" : "dansky";
      return "stenstad";
    }
    // A Danish row of houses (Nyboder, the Kartoffelrækkerne): brick.
    if (iso === "DK" && style === "nizky" && (info?.type === "terrace" || info?.block?.parts >= 3) && !(n > 2) && !(y > 1930)) return "dansky";
    return undefined;
  };
}
const FALU = "#8d2a1e";
const NORDIC_WOOD = {
  SE: ["#8d2a1e", "#7f2b1f", "#d9a441", "#e3c06a", "#f2f0ea"], FI: ["#8d2a1e", "#d9a441", "#e3c06a", "#b5c8a0", "#f2f0ea"],
  NO: ["#f2f0ea", "#f2f0ea", "#d5d3cc", FALU, "#e3c06a"], DK: ["#e3c06a", FALU, "#f2f0ea"],
};
// Board-and-batten upright in Sweden, horizontal boards in Finland and Norway.
export function nordicDetails(iso) {
  return (look) => (look === "drevak" ? { boards: iso === "SE" ? "vertical" : "horizontal", palette: NORDIC_WOOD[iso] } : {});
}

// --- 6. North America (docs/house-types-north-america.md; Bára 25. 11. 2026) ---------------------------------------
// The old town districts of the cities whose row houses have a look of their own (centre, radius in km), the rest of
// the city (around) a plainer one; outside them the detached house. Canada's module (CA) calls the same function.
const at = (name, lon, lat, km) => ({ name, centre: [lon, lat], km });
export const NA_TOWNS = [
  // Washington: the bay-front rows of 1870–1915 within L'Enfant's city and its first suburbs, Georgetown's flat fronts,
  // the porch-front rows of 1905–40 further out.
  { look: "bayrow", front: "flat", places: [at("Georgetown", -77.0650, 38.9080, 0.9), at("Foggy Bottom", -77.0530, 38.9010, 0.4), at("Alexandria Old Town", -77.0450, 38.8050, 0.9)] },
  { look: "bayrow", places: [at("Capitol Hill", -76.9930, 38.8860, 1.5), at("Shaw, Logan Circle, Dupont", -77.0330, 38.9120, 1.5), at("Adams Morgan", -77.0410, 38.9220, 0.8),
    at("Columbia Heights", -77.0290, 38.9270, 0.9), at("Bloomingdale, LeDroit Park", -77.0110, 38.9160, 0.8), at("Near Northeast", -76.9960, 38.8990, 0.9)] },
  { look: "porchrow", places: [at("Washington", -77.0150, 38.9200, 9)] },
  // New York: the brownstones of Manhattan and Brooklyn (up to four floors), their tenements (five and six).
  { look: "brownstone", tall: "tenement", places: [at("Manhattan", -73.9680, 40.7800, 4), at("Lower Manhattan", -73.9930, 40.7330, 3), at("Harlem", -73.9450, 40.8120, 2.2),
    at("Brownstone Brooklyn", -73.9720, 40.6790, 3.2), at("Bedford-Stuyvesant", -73.9400, 40.6850, 1.8)] },
  // Boston: the bow-fronts of the Back Bay, the South End and Charlestown, the triple-deckers around.
  { look: "bayrow", round: true, places: [at("South End, Back Bay", -71.0770, 42.3460, 1.3), at("Beacon Hill", -71.0680, 42.3580, 0.5), at("Charlestown", -71.0620, 42.3770, 0.6)] },
  { look: "porchrow", deck: true, places: [at("Boston", -71.0750, 42.3300, 8)] },
  // Toronto: the bay-and-gable of the Victorian city.
  { look: "baygable", places: [at("Cabbagetown", -79.3660, 43.6660, 0.9), at("Annex, Kensington", -79.4030, 43.6620, 1.4), at("Trinity Bellwoods", -79.4160, 43.6490, 1.2), at("Leslieville, Riverdale", -79.3470, 43.6680, 1.2)] },
  // San Francisco: the wooden Victorian of the burnt-over edge and the hills, the stucco rows further west and south.
  { look: "victorian", places: [at("Haight, Alamo Square, Western Addition", -122.4350, 37.7740, 1.6), at("Mission, Noe, Castro", -122.4270, 37.7580, 1.9), at("Pacific Heights", -122.4340, 37.7920, 1.2)] },
  { look: "victorian", plain: true, places: [at("San Francisco", -122.4500, 37.7580, 7)] },
];
// The office districts, where a big house of no known kind is an office.
export const NA_DOWNTOWNS = [at("Washington", -77.0350, 38.9020, 1.2), at("Southwest Federal Center", -77.0220, 38.8860, 0.6), at("NoMa", -77.0060, 38.9040, 0.4),
  at("Rosslyn", -77.0710, 38.8960, 0.5), at("Crystal City", -77.0500, 38.8540, 0.6), at("Midtown", -73.9800, 40.7560, 1.4), at("Financial District", -74.0100, 40.7070, 0.7),
  at("Boston", -71.0570, 42.3560, 0.7), at("Toronto", -79.3810, 43.6490, 0.8), at("San Francisco", -122.3990, 37.7910, 0.8)];
const naTown = (p) => (p ? NA_TOWNS.find((t) => inOldTown(t.places, p)) : undefined);
const NA_FLATS = new Set(["apartments", "dormitory", "condominium"]);
const NA_SHOPS = new Set(["retail", "commercial", "shop", "supermarket", "restaurant", "kiosk"]);
const NA_ROWS = new Set(["terrace", "semidetached_house", "townhouse"]);
const NA_OWN = new Set(["kostel", "skola", "garaz"]); // a look of the house's use stays
// What a footprint covers (m²) and one house of a joined row (block: derive.js blockShape).
const partArea = (b) => (b ? (b.length * b.width * b.fill) / Math.max(1, b.parts) : 0);
const inRow = (b) => !!b && b.parts >= 3;
// What OSM's kind, floors, year and block tell; the place tells which row house. Without data the plain look: a flat-
// fronted row house in an old town, the porch row in the city around, the detached house elsewhere.
export function northAmericaLook(style, info, n) {
  const type = info?.type, b = info?.block, y = yearOf(info), p = placeOf(info), town = naTown(p), area = partArea(b);
  if (NA_OWN.has(style)) return undefined;
  if (style === "hala") return NA_SHOPS.has(type) ? (n >= 2 || inRow(b) ? "mainstreet" : "stripmall") : undefined; // works and warehouses stay halls
  const office = style === "kancelar" || info?.office || (OFFICE.has(type) && type !== "commercial" && type !== "hotel");
  if (office) return y >= 1990 && n >= 10 ? "glasstower" : "kancelar";
  if (NA_SHOPS.has(type)) return n >= 5 ? (y >= 1990 ? "podium" : "kancelar") : n >= 2 || (!n && inRow(b)) ? "mainstreet" : "stripmall";
  const row = () => {
    if (y >= 1990) return "bayrow"; // a new townhouse: flat-fronted (northAmericaDetails)
    if (!town) return inRow(b) || NA_ROWS.has(type) ? "porchrow" : "framehouse";
    if (town.look === "bayrow" && y > 1920 && !town.front) return "porchrow";
    if (town.look === "porchrow" && !town.deck && !type && !y) return "bayrow"; // a row of no known kind: the plain front
    if (town.deck) return n === 3 && !(y > 1940) ? "tripledecker" : "framehouse";
    if (town.tall && n >= 5) return town.tall;
    return town.look;
  };
  const flats = () => {
    if (y >= 1990) return n >= 8 ? "glasstower" : n >= 4 ? "podium" : "moderni";
    if (y >= 1946 && n >= 6) return "slab";
    if (!y && n >= 13) return "slab";
    if (town?.tall && n >= 5 && n <= 6 && !(y > 1920)) return town.tall;
    return "brickblock";
  };
  if (NA_FLATS.has(type) || type === "hotel") return flats();
  if (n >= 5) return inRow(b) && town?.tall && n <= 6 ? town.tall : !type && !y && p && inOldTown(NA_DOWNTOWNS, p) ? "kancelar" : flats();
  if (type === "detached" || type === "bungalow" || type === "cabin" || type === "farm") return town?.look === "baygable" || town?.deck ? row() : "framehouse";
  if (NA_ROWS.has(type) || HOUSE_TYPES.has(type)) return inRow(b) || NA_ROWS.has(type) || b?.parts === 2 || town?.deck || town?.look !== "porchrow" ? row() : "framehouse";
  // No kind: a joined row of small houses, one small house alone, a big footprint.
  if (!b && !n) return town ? row() : "framehouse"; // nothing known at all
  if (b && area > 450) return inOldTown(NA_DOWNTOWNS, p) ? "kancelar" : n === 1 ? "stripmall" : flats();
  if (inRow(b)) return row();
  if (!b) return town ? row() : "framehouse";
  return area > 300 || n >= 4 ? flats() : b.parts === 2 || (town && town.look !== "porchrow") ? row() : "framehouse";
}
const OFFICE = new Set(["office", "commercial", "civic", "government", "public", "university", "hospital", "hotel", "museum", "embassy"]);
// The front of a row house by its place (a bay only where the district builds them and the house is known to be a
// house), Boston's round bow, San Francisco's plain stucco, the brick of a detached house of the capital's region, the
// balconies of a slab (only where its year is known).
export function northAmericaDetails(look, info) {
  const p = placeOf(info), town = naTown(p), y = yearOf(info);
  if (look === "bayrow") return { front: y >= 1990 || !town || town.look !== "bayrow" || town.front === "flat" || !info?.block || !info?.type ? "flat" : "bay", round: !!town?.round };
  if (look === "victorian") return { plain: !town || town.look !== "victorian" || !!town.plain };
  if (look === "framehouse") {
    const brick = /brick/.test(info?.material || "") || (!info?.material && town?.look === "porchrow" && houseHash(info) % 2 === 0);
    return { ...(brick ? { palette: ["#a9573f", "#9c4a36", "#b98a64"] } : {}), stoop: y >= 1945 || houseHash(info) % 3 === 0 };
  }
  if (look === "slab") return { balconies: !!y };
  if (look === "glasstower") return { office: OFFICE.has(info?.type) };
  return {};
}
