// The Netherlands (Bára 20. 11. 2026): the state of a cut inside staty.json's "netherlands". As in Switzerland, no
// Czech technical map, RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and PDOK's orthophoto
// (app.js, ortho-osm.js, lanes-ortho.js "nl"), unless the national large-scale topography has the street.
// - BGT (Basisregistratie Grootschalige Topografie, PDOK OGC API Features, CORS *, CC0 1.0): every municipality's,
//   province's, water board's and Rijkswaterstaat's surfaces of the whole country at 1 : 500 to 1 : 5 000, in one
//   register: roadways, footways, cycle tracks, parking areas, public transport lanes, verges, traffic islands, green,
//   water, yards, buildings. The API keeps the old versions too: datetime=now asks only the current ones (a request
//   without it gave three times as many, one surface over another). ?bgt=0 leaves it out (the A/B test,
//   evaluation/netherlands/ab/).
// - BAG (Basisregistratie Adressen en Gebouwen, PDOK OGC API, CORS *, Public Domain Mark 1.0): the year a building was
//   built and what it is used for; 3D BAG (3dbag.nl, TU Delft and 3DGI, CORS *, CC BY 4.0): its floors and roof.
// As in Switzerland: the BGT's surfaces with OSM's green and water after them, the BGT's buildings (the BAG's
// footprints) among them, only where the BGT has a surface of the street at the cut's centre (elsewhere the estimate);
// a BGT that does not answer: the estimate, with a note.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { osmAreas } from "./slovensko.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_NL?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const BGT_API = "https://api.pdok.nl/kadaster/bgt/ogc/v1/collections";
// The layers of the BGT asked for a cut, each its own request (the API takes one collection at a time).
export const BGT_LAYERS = ["wegdeel", "ondersteunendwegdeel", "begroeidterreindeel", "onbegroeidterreindeel", "waterdeel", "pand", "spoor"];
// Wegdeel's function (IMGeo 2.1 FunctieWeg) → MTVU codes (city.js MTVU_LABELS). A roadway of any kind of road, a
// woonerf, a level crossing: roadway (the lanes from OSM and the orthophoto); an OV-baan (a lane only for trams and
// buses) is a tram's bed where a BGT tram track lies in it, else roadway (a bus lane, OSM says so); a driveway (inrit)
// crosses the sidewalk. A transition piece (transitie) belongs to nothing.
const WEG = {
  "rijbaan autosnelweg": 701, "rijbaan autoweg": 701, "rijbaan regionale weg": 701, "rijbaan lokale weg": 701, woonerf: 701, overweg: 701,
  "OV-baan": 701, fietspad: 703, voetpad: 702, "voetpad op trap": 702, voetgangersgebied: 702, ruiterpad: 702, inrit: 702,
  parkeervlak: 704, spoorbaan: 1100, "baan voor vliegverkeer": 1003,
};
// Ondersteunend wegdeel (the parts beside a road): a traffic island is a paved island, a verge green when it is grown
// or unpaved, else paved.
const GREEN_LOOK = new Set(["groenvoorziening", "onverhard", "grasland overig", "gras- en kruidachtigen"]);
const KIND = {
  wegdeel: (p) => WEG[p.functie] ?? null,
  ondersteunendwegdeel: (p) => (p.functie === "verkeerseiland" ? 1003 : GREEN_LOOK.has(p.fysiek_voorkomen) ? 401 : 1003),
  begroeidterreindeel: () => 401,
  // Unvegetated land: a yard (erf) is a courtyard, anything else paved.
  onbegroeidterreindeel: (p) => (p.fysiek_voorkomen === "erf" ? 603 : 1003),
  waterdeel: () => 501,
  pand: () => 601,
};
export const bgtCode = (layer, p) => KIND[layer]?.(p || {}) ?? null;

// One request a box and layer (a cut moved a little asks the same box again), kept for the session, at most 30 boxes.
const memo = new Map();
function bgt(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!memo.has(key)) {
    memo.set(key, bgtAsk(bbox).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
async function layer(name, bbox, now) {
  const features = [];
  let url = `${BGT_API}/${name}/items?${new URLSearchParams({ f: "json", limit: "1000", bbox, datetime: now })}`;
  // A cut's box has a few hundred surfaces; more come on the next page (at most three).
  for (let page = 0; url && page < 3; page++) {
    const json = await getJSON(url);
    features.push(...(json.features || []));
    url = (json.links || []).find((l) => l.rel === "next")?.href || null;
  }
  return features;
}
async function bgtAsk(bbox) {
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const got = await Promise.all(BGT_LAYERS.map((name) => layer(name, bbox, now)));
  return Object.fromEntries(BGT_LAYERS.map((name, i) => [name, got[i]]));
}

const ringsOf = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};

// The BGT's layers as the ESRI-like features asMtvu takes. Only the level of the street at the cut's centre
// (relatieve_hoogteligging: a bridge 1, a tunnel −1; the CLAUDE.md rule: no streets under bridges); buildings at the
// ground. An OV-baan with a BGT tram track in it is a tram's bed (705, derive.js asks OSM whether the rails lie in the
// asphalt, as Berlin's Gleiskörper).
export function bgtFeatures(got, cx, cy) {
  const level = (got.wegdeel || []).find((f) => { const r = ringsOf(f.geometry); return r && inRings(r, cx, cy); })?.properties?.relatieve_hoogteligging ?? 0;
  const trams = (got.spoor || []).filter((f) => f.properties?.functie === "tram" && (f.properties?.relatieve_hoogteligging ?? 0) === level)
    .flatMap((f) => (f.geometry?.type === "LineString" ? [f.geometry.coordinates] : f.geometry?.type === "MultiLineString" ? f.geometry.coordinates : []));
  const features = [];
  for (const name of Object.keys(KIND)) {
    for (const f of got[name] || []) {
      const p = f.properties || {}, rings = ringsOf(f.geometry);
      if (!rings || (p.relatieve_hoogteligging ?? 0) !== (name === "pand" ? 0 : level)) continue;
      let code = bgtCode(name, p);
      if (!code) continue;
      const tram = name === "wegdeel" && p.functie === "OV-baan" && trams.some((line) => line.some(([x, y]) => inRings(rings, x, y)));
      if (tram) code = 705;
      features.push({ attributes: { code, ...(tram ? { ANY_TRAM: 1 } : {}) }, geometry: { rings } });
    }
  }
  return { features };
}

// The kinds of a street at the cut's centre (roadway, footway, cycle track, parking, a tram's bed). Not a paved
// island or other paved land (1003): as in Switzerland, a square or a quay would make the whole cut one area.
const STREET = new Set([701, 702, 703, 704, 705]);

async function surfaces(bbox) {
  if (param("bgt") === "0") return { features: [], abroad: true };
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let own;
  try {
    own = asMtvu([[bgtFeatures(await bgt(bbox), cx, cy), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, nlFailed: true };
  }
  // Only where the BGT has a surface of the street at the cut's centre or 1.5 m around it.
  const dy = 1.5 / 110574, dx = 1.5 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at0 = own.features.find((f) => inRings(f.geometry.rings, cx, cy));
  const at = at0 ? STREET.has(at0.attributes.CTVUK_KOD)
    : own.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && [[dx, 0], [-dx, 0], [0, dy], [0, -dy]].some(([ox, oy]) => inRings(f.geometry.rings, cx + ox, cy + oy)));
  if (!at) return { features: [], abroad: true };
  // The BGT covers all land, so OSM's green and water fill little.
  const o = await osmAreas(bbox);
  return { features: [...asPassport(own).features, ...o.rest], nlBgt: true, passport: true };
}

// ---------- buildings: BAG and 3D BAG ----------
export const BAG_API = "https://api.pdok.nl/kadaster/bag/ogc/v2/collections/pand/items";
export const BAG3D_API = "https://api.3dbag.nl/collections/pand/items";
// BAG's uses (gebruiksdoel, a list) → an OSM building type for profile.js (info.type) and the facts of app.js ruianFacts.
export function bagBuilding(pand, bag3d) {
  const p = pand?.properties || {};
  const uses = String(p.gebruiksdoel || "").split(",").map((u) => u.trim()).filter(Boolean);
  const built = p.bouwjaar > 1000 && p.bouwjaar <= new Date().getFullYear() + 2 ? p.bouwjaar : undefined;
  const a = bag3d ? Object.values(bag3d.feature?.CityObjects || bag3d.CityObjects || {}).find((o) => o.attributes)?.attributes || {} : {};
  const floors = a.b3_bouwlagen > 0 ? Math.round(a.b3_bouwlagen) : undefined;
  const height = a.b3_h_dak_70p > 0 && a.b3_h_maaiveld != null ? a.b3_h_dak_70p - a.b3_h_maaiveld : undefined;
  const office = uses.length > 0 && !uses.includes("woonfunctie") && uses.some((u) => ["kantoorfunctie", "onderwijsfunctie", "gezondheidszorgfunctie", "logiesfunctie", "bijeenkomstfunctie"].includes(u));
  const living = uses.includes("woonfunctie");
  const type = !uses.length ? undefined : living ? (p.aantal_verblijfsobjecten > 1 ? "apartments" : "house")
    : uses.includes("industriefunctie") ? "industrial" : uses.includes("onderwijsfunctie") ? "school" : office ? "office"
    : uses.includes("winkelfunctie") ? "retail" : undefined;
  return {
    built, office: office || undefined, house: (living && p.aantal_verblijfsobjecten === 1) || undefined, type,
    ...(floors && { cornice: floors, total: floors, roof: 0, fromHeight: true, height: height > 0 ? Math.round(height * 10) / 10 : undefined }),
    // The roof (IPR's codes, profile.js IPR_ROOF): slanted 1, flat 3.
    ...(a.b3_dak_type === "slanted" ? { roofType: 1 } : /flat|horizontal/.test(a.b3_dak_type || "") ? { roofType: 3 } : {}),
  };
}
async function podlaznost(lat, lon) {
  const d = 0.000005; // about half a metre around the facade's point
  const json = await getJSON(`${BAG_API}?${new URLSearchParams({ f: "json", limit: "5", bbox: [lon - d, lat - d, lon + d, lat + d].join(",") })}`);
  const pand = (json?.features || []).find((f) => { const r = ringsOf(f.geometry); return r && inRings(r, lon, lat); }) || json?.features?.[0];
  if (!pand) return {};
  let bag3d = null;
  try { bag3d = await getJSON(`${BAG3D_API}/NL.IMBAG.Pand.${pand.properties.identificatie}`); } catch {}
  return bagBuilding(pand, bag3d);
}

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
}

export const sources = {
  osm,
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
