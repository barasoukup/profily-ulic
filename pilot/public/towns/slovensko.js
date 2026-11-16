// Outside the Czech Republic (Bára 15. 11. 2026): Slovakia, and the margins of the OSM extracts beyond the borders
// ("cizina"). Only the OSM tiles are read: the technical map of ČÚZK (DMVS) and RÚIAN cover the Czech Republic only
// (the DMVS answers outside it without CORS, which looked like an outage), so they are not asked at all. The surfaces
// are none, so the profile is the estimate from OSM and the orthophoto (app.js, ortho-osm.js). The houses of
// Slovakia: ZBGIS of ÚGKK SR (layer Budova, CC BY 4.0, GKÚ Bratislava) gives the use and the height above the ground,
// no floors and no year: the floors are the height by 3.3 m; elsewhere abroad OSM's building:levels.
import { osmTiles } from "../gis.js";
import { city } from "../city.js";

export const ZBGIS_BUILDINGS = "https://zbgis.skgeodesy.sk/zbgis/rest/services/ZBGIS/MapServer";
const FLOOR = 3.3; // m of height per floor (the height runs to the top of the roof)
// Uses read as a hall (IPR typ 3), as a small low building (typ 6), as a family house (a pitched roof, profile.js).
const HALL = new Set(["Výrobná, technologická budova", "Sklad", "Poľnohospodárska budova", "Depo", "Hangár", "Autoservis", "Senník",
  "Zariadenie na železnici na uskladnenie/opravu", "Údržbárska dielňa pre lietadlá", "Športová hala, telocvičňa", "Zimný štadión", "Nákupné stredisko", "Tržnica"]);
const LOW = new Set(["Garáž", "Spoločné garáže", "Šopa, kôlňa", "Transformovňa", "Skleník", "Chata", "Poľovnícka chata", "Kontrolná budova, vrátnica"]);
const HOUSE = new Set(["Rodinný dom", "Chata", "Fara, farská budova"]);
// Where people live: the panel house look fits these only (Bára 16. 11. 2026); any other known use is drawn as an
// office or a public building (profile.js OFFICE_TYPES), hotels and schools alike.
const RESIDENTIAL = new Set(["Bytový dom", "Ubytovňa, penzión", "Domov dôchodcov", "Detský domov", "Kláštor", "Kňažský seminár"]);
const OFFICE = new Set(["Administratívna budova", "Banka", "Budova štátnej alebo verejnej správy", "Mestský, obecný úrad", "Správna a súdna budova", "Radnica", "Veľvyslanectvo, konzulát"]);
// An OSM building type for the use (profile.js reads info.type).
export const zbgisType = (use) => !use || use === "Neznámy" || HOUSE.has(use) ? undefined : RESIDENTIAL.has(use) ? "apartments"
  : HALL.has(use) || LOW.has(use) ? undefined : OFFICE.has(use) ? "office" : "commercial";

// The building of ZBGIS at a point (a facade of the cut), as RÚIAN's (gis.js ruianBuilding) for profile.js: identify
// within about half a metre (ZBGIS answers its query operation with 503).
export function zbgisBuilding(json) {
  const a = (json?.results || []).find((r) => r.layerId === 41)?.attributes;
  if (!a) return {};
  const height = parseFloat(String(a["Výška nad povrchom (m)"] ?? a.HGT ?? "").replace(",", "."));
  const use = a["Typ, účel využitia budovy"] ?? "";
  const area = parseFloat(String(a["Plocha (m²)"] ?? "").replace(",", "."));
  const floors = height > 0 ? Math.max(1, Math.round(height / FLOOR)) : undefined;
  return {
    cornice: floors, fromHeight: true, roof: 0, total: floors || 0, height: height > 0 ? height : undefined, use: use || undefined,
    kind: HALL.has(use) ? 3 : LOW.has(use) ? 6 : undefined, newBuild: false, area: area > 0 ? Math.round(area) : undefined,
    house: HOUSE.has(use) || undefined,
    type: zbgisType(use),
  };
}
async function podlaznost(lat, lon) {
  if (city.id !== "slovensko") return {};
  const d = 0.0004; // the map around the point: tolerance 3 px of 400 is about 0.6 m
  const q = new URLSearchParams({
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", sr: 4326, layers: "all:41", tolerance: 3,
    mapExtent: [lon - d, lat - d, lon + d, lat + d].join(","), imageDisplay: "400,400,96", returnGeometry: "false", f: "json",
  });
  const r = await fetch(`${ZBGIS_BUILDINGS}/identify?${q}`, { signal: AbortSignal.timeout(4000) });
  return r.ok ? zbgisBuilding(await r.json()) : {};
}

// abroad: the surfaces are missing on purpose (sources.js outage says the profile is an estimate outside Czechia).
const none = async () => ({ features: [], abroad: true });
export const sources = { osm: osmTiles, surfaces: none, lines: async () => ({ features: [] }), parking: async () => ({ features: [] }), podlaznost };

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
