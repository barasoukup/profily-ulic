// Austria (Bára 16. 11. 2026): the state of a cut inside staty.json's Austria. As in Slovakia, no Czech technical map,
// RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and basemap.at's orthophoto (app.js,
// ortho-osm.js, lanes-ortho.js "at"), the houses are OSM's. Cities' own data come with their A/B tests
// (evaluation/austria/).
//
// Vienna: the Flächen-Mehrzweckkarte (FMZK) of the city (data.wien.gv.at, WFS 2.0, CORS for any origin, CC BY 4.0
// "Stadt Wien – data.wien.gv.at"): roadways, sidewalks, parking lanes, tram beds, islands, green and buildings as
// surfaces of the cut, as MTVU in Prague. Only where it has a surface at the cut's centre (elsewhere the estimate).
// ?wien=0 leaves it out (the A/B test, evaluation/austria/ab/).
import { osmTiles, getJSON, asMtvu } from "../gis.js";
import { city, MTVU_LABELS } from "../city.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_AT?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const WIEN_WFS = "https://data.wien.gv.at/daten/geo";
// Vienna's box (its boundary within it; outside the city the layers are empty).
const WIEN_BOX = [16.18, 48.11, 16.58, 48.33];
export const inWien = (lon, lat) => lon >= WIEN_BOX[0] && lon <= WIEN_BOX[2] && lat >= WIEN_BOX[1] && lat <= WIEN_BOX[3];

// FMZK classes (F_KLASSE) → MTVU codes (city.js MTVU_LABELS). Small furniture areas, phone boxes and the crossings
// belong to the surface they stand on; the rails in the roadway (Schienenbereich) are roadway, OSM gives the tracks.
export const FMZK = {
  21: 701, 27: 701, 30: 701, 32: 701, // Fahrbahn, Schienenbereich, Zebrastreifen, Fahrbahnschwelle
  22: 1003, // Verkehrsinsel
  26: 1003, 39: 1003, 59: 1003, 74: 1003, 60: 1003, // private, sonstige, befestigte Verkehrsfläche, Stiege, Baustelle
  23: 702, 24: 702, 31: 702, 82: 702, 86: 702, // Gehsteig, Fußgängerzone, Straßenmobiliar, Telefonzelle, Portal
  // Gehweg, Radweg: mostly shared paths and park paths (the hostile review; OSM's cycleway tells a cycle track).
  25: 702,
  33: 704, // Ruhender Verkehr
  28: 705, // Gleiskörper Wiener Linien
  29: 1100, // Gleiskörper Bahn
  51: 603, // Innenhof
  58: 401, 69: 402, 61: 901, // Grünfläche, sonstige Grünfläche, Sportfeld
  41: 501, 42: 501, 43: 501, // water: rivers and canals, pools, fountains
  11: 601, 16: 602, 19: 602, 71: 602, 73: 602, 81: 602, 83: 602, 84: 602, // Gebäude, Brückenpfeiler, sonstiges Bauwerk, Mauer, Sockelzaun, Denkmal, Stationseinrichtung, Kiosk
};
// An overbuilding (Überbauung 12: arcades, passages) or a canopy (Flugdach 13) stands over the surface KLASSE_SUB names.
export const fmzkCode = (a) => (a.F_KLASSE === 12 || a.F_KLASSE === 13 ? FMZK[a.KLASSE_SUB] : FMZK[a.F_KLASSE]) ?? null;
// The street's own surfaces: one of them at the cut's centre makes the map the cut's.
const STREET = new Set([701, 702, 703, 704, 705, 1003]);

// One WFS layer in a box (lon, lat): ESRI-like features with rings in WGS 84, as the other sources give them.
async function wfs(type, bbox) {
  const json = await getJSON(`${WIEN_WFS}?${new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: `ogdwien:${type}`, srsName: "EPSG:4326",
    outputFormat: "application/json", bbox: `${bbox},EPSG:4326`, count: 3000,
  })}`);
  return {
    features: (json.features || []).map((f) => {
      const g = f.geometry;
      const rings = g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null;
      return { attributes: f.properties || {}, geometry: rings ? { rings } : null };
    }).filter((f) => f.geometry),
  };
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (param("wien") === "0" || city.id !== "austria" || !inWien(cx, cy)) return { features: [], abroad: true };
  // A layer that does not answer: none of them (a map without its sidewalks would be wrong), the estimate with a note.
  let layers;
  try {
    layers = await Promise.all(["FMZKGEBOGD", "FMZKVERKEHR1OGD", "FMZKVERKEHR2OGD", "FMZKGRUEN2OGD", "FMZKGEWOGD", "FMZKMAUOGD"].map((t) => wfs(t, bbox)));
  } catch {
    return { features: [], abroad: true, atFailed: "wien" };
  }
  const out = asMtvu(layers.map((j) => [j, fmzkCode]), MTVU_LABELS);
  // Only where the map has a surface of the street at the cut's centre or 1.5 m around it (a courtyard, a park or a
  // monument there: the estimate).
  const dy = 1.5 / 110574, dx = 1.5 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at = out.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && [[0, 0], [dx, 0], [-dx, 0], [0, dy], [0, -dy]].some(([ox, oy]) => inRings(f.geometry.rings, cx + ox, cy + oy)));
  if (!at) return { features: [], abroad: true };
  return { ...out, atTown: "wien" };
}

// Salzburg (Bára 16. 11. 2026): the city's cadastre of traffic signs (verkehrszeichen, data.stadt-salzburg.at WFS, CORS,
// CC BY 3.0 AT "Stadt Salzburg"), with the StVO number of each sign (VZNR "52-13b…") and its street. The signs of no
// stopping and no parking by the cut (app.js: on the side of the street they stand) go into the row of signs.
// ?salzburg=0 leaves them out (the A/B test).
export const SALZBURG_WFS = "https://data.stadt-salzburg.at/geodaten/wfs";
const SALZBURG_BOX = [12.98, 47.75, 13.12, 47.86];
export const inSalzburg = (lon, lat) => lon >= SALZBURG_BOX[0] && lon <= SALZBURG_BOX[2] && lat >= SALZBURG_BOX[1] && lat <= SALZBURG_BOX[3];
const SIGN_KEY = { "52-13b": "no_stopping", "52-13a": "no_parking" };
export function salzburgSigns(json) {
  return (json?.features || []).filter((f) => f.geometry?.type === "Point").map((f) => {
    const p = f.properties || {};
    return { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], restriction: SIGN_KEY[String(p.VZNR || "").trim().split("_")[0]], street: String(p.STRASSE || "").trim() };
  }).filter((x) => x.restriction);
}
async function lines(bbox) {
  const empty = { features: [], edges: [], widths: [], areas: [] };
  if (!bbox || param("salzburg") === "0" || city.id !== "austria") return empty;
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  if (!inSalzburg((x0 + x1) / 2, (y0 + y1) / 2)) return empty;
  const json = await getJSON(`${SALZBURG_WFS}?${new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ogdsbg:verkehrszeichen", srsName: "EPSG:4326",
    outputFormat: "application/json", bbox: `${bbox},EPSG:4326`, count: 1000,
  })}`).catch(() => null);
  return { ...empty, atSigns: salzburgSigns(json) };
}

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
}

export const sources = {
  osm,
  surfaces,
  lines,
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
