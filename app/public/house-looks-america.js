// The looks of a house in North America (countries/US.js, CA.js houseLook, houseDetails), loaded with them (late.js).
import { yearOf, placeOf, inOldTown, houseHash, HOUSE_TYPES } from "./house-looks.js";

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
const NA_OWN = new Set(["kostel", "garaz"]); // a look of the house's use stays
// What a footprint covers (m²) and one house of a joined row (block: derive.js blockShape).
const partArea = (b) => (b ? (b.length * b.width * b.fill) / Math.max(1, b.parts) : 0);
const inRow = (b) => !!b && b.parts >= 3;
// What OSM's kind, floors, year and block tell; the place tells which row house. Without data the plain look: a flat-
// fronted row house in an old town, the porch row in the city around, the detached house elsewhere.
export function northAmericaLook(style, info, n) {
  const type = info?.type, b = info?.block, y = yearOf(info), p = placeOf(info), town = naTown(p), area = partArea(b);
  if (NA_OWN.has(style)) return undefined;
  if (style === "skola") return n >= 5 ? "kancelar" : "brickblock"; // not the Czech school's red roof
  if (style === "hala") return NA_SHOPS.has(type) ? (n >= 2 || inRow(b) ? "mainstreet" : "stripmall") : undefined; // works and warehouses stay halls
  const office = style === "kancelar" || info?.office || (OFFICE.has(type) && type !== "commercial" && type !== "hotel");
  // An office of masonry walls (CAMA) is no glass tower (evaluation/north-america-art/cama).
  if (office) return y >= 1990 && n >= 10 && !/brick|stone|concrete/.test(info?.material || "") ? "glasstower" : "kancelar";
  if (NA_SHOPS.has(type)) return n >= 5 ? (y >= 1990 ? "podium" : "kancelar") : n >= 2 || (!n && inRow(b)) ? "mainstreet" : "stripmall";
  const row = () => {
    // A joined row of no known kind at the sidewalk of a main street: shops (Queen Street West; the review of 25. 11. 2026).
    if (info?.main && info.atWalk && inRow(b) && !HOUSE_TYPES.has(type) && !NA_ROWS.has(type)) return "mainstreet";
    if (y >= 1990) return "bayrow"; // a new townhouse: flat-fronted (northAmericaDetails)
    if (!town) return inRow(b) || NA_ROWS.has(type) ? "porchrow" : "framehouse";
    if (town.look === "bayrow" && y > 1920 && !town.front) return "porchrow";
    if (town.look === "porchrow" && !town.deck && !type && !y) return "bayrow"; // a row of no known kind: the plain front
    if (town.deck) return n === 3 && !(y > 1940) ? "tripledecker" : "framehouse";
    if (town.tall && n >= 5) return town.tall;
    return town.look;
  };
  const flats = () => {
    if (y >= 1990) return n >= 8 ? "glasstower" : !n || n >= 4 ? "podium" : "moderni";
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
