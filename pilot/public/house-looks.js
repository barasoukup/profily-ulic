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

// A small house standing alone, of which OSM knows nothing else (no floors, no height): a family house, not a block of
// flats (Bára 27. 11. 2026: Girbigsdorfer Straße, a village, two small houses drawn as five-floor tenements). Its own
// footprint up to SMALL_HOUSE_AREA m², at most 3 buildings joined to it (the house with its garage and shed) and all of
// them together up to SMALL_BLOCK_AREA m². ?off=vesnice: as before.
export const SMALL_HOUSE_AREA = 250, SMALL_BLOCK_AREA = 450, SMALL_BLOCK_PARTS = 3;
export const villageOff = () => ((typeof location === "undefined" ? globalThis.PROFILY_CA?.off : new URLSearchParams(location.search).get("off")) || "").split(",").includes("vesnice");
export const smallHouse = (info) => !villageOff() && info?.footprint > 0 && info.footprint <= SMALL_HOUSE_AREA
  && !!info.block && info.block.parts <= SMALL_BLOCK_PARTS && info.block.area <= SMALL_BLOCK_AREA;

// A panel house abroad (Bára 27. 11. 2026: Leipzig, two town houses of 6 floors drawn as panel houses): the shape alone makes
// one only as a long compact slab, filling its box (a street row of town houses in a bent line does not: its 4 parts
// filled 29 % of the box); stronger evidence is a year of the panel era (flatKind) or OSM's own word (info.panel).
// NOT the default: the blind A/B on photographs (EE, LT, PL, 36 houses, two judges) came 11 : 12 and 14 : 10
// (evaluation/village-houses/ZPRAVA.md). ?panel2=1 turns it on (globalThis.PROFILY_CA.panel2 in scripts).
export const panelOn = () => (typeof location === "undefined" ? globalThis.PROFILY_CA?.panel2 : new URLSearchParams(location.search).get("panel2")) === "1";
// Where the house's own outline and surroundings are known (derive.js own, around), the panel house needs a clear agreement of
// several signs (Bára 27. 11. 2026: "better no panel house than a false one"): an exact rectangle, a big building, free
// space round it (little built over within 80 m; green adds), the estate of slabs rather than the town's street. Score:
// rectangle (own outline fills its smallest rectangle; under 0.7 no panel house at all) 0.7 → 1, 0.8 → 1.5; built share round 0.2 → 1, 0.12 → 1.5;
// size (footprint 500 m² or 8+ floors) 1; green 20 % of the ground round +0.5. At least PANEL_SCORE. Without them (a saved
// cut) the old shape rule (profile.js isSlab).
export const PANEL_SCORE = 3;
export function panelScore(info) {
  const o = info?.own, a = info?.around;
  if (!o || !a) return null;
  if (o.rect < 0.7) return 0; // not an exact rectangle: no panel house, whatever else
  return (o.rect >= 0.8 ? 1.5 : o.rect >= 0.7 ? 1 : 0) + (a.built <= 0.12 ? 1.5 : a.built <= 0.2 ? 1 : 0)
    + (info.footprint >= 500 || info.levels >= 8 ? 1 : 0) + (a.green >= 0.2 ? 0.5 : 0);
}
export const strictSlab = (b) => !!b && ((b.fill >= 0.8 && b.width <= 16 && b.length >= 25) || (b.parts >= 2 && b.fill >= 0.5 && b.width <= 20 && (b.length + b.width) / b.parts >= 30));

const OLD = new Set(["sikma", "mestan", "nizky"]);
export const yearOf = (info) => info?.built ?? info?.start;
// The house's place: derive.js point while the cut is made, app.js at (rounded) in the profile kept and saved.
export const placeOf = (info) => info?.point || info?.at;
const PI = Math.PI;
// [lon0, lat0, lon1, lat1]
const inBox = (p, b) => !!p && p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
const inBoxes = (p, boxes) => boxes.some((b) => inBox(p, b));
export const kmTo = (p, [lon, lat]) => Math.hypot((p[0] - lon) * 111.32 * Math.cos((lat * PI) / 180), (p[1] - lat) * 110.54);
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
export const HOUSE_TYPES = new Set(["house", "detached", "semidetached_house", "terrace", "bungalow", "villa", "farm"]);

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
