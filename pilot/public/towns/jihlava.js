// Jihlava: the city's GIS (gis.jihlava-city.cz) answers the browser directly (CORS), as IPR does: the
// passport of the roads (Pasporty, sections of roadway and sidewalk kept by the city, with the street's
// name and class) for the surfaces, RÚIAN buildings (with floors) and the city's lawns around them, the
// parking sections of the city with their orientation, fences and railings of the technical map, and
// trees, lamps, stops and bike stands of the city's passports.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; the shapes are those of Prague's answers, see
// queries.js) and app.js its base maps. Copy this file for another town.
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints, parkingStrip, ruianBuilding, metres } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const JI = "https://gis.jihlava-city.cz";
const JI_PASPORT = `${JI}/server1/rest/services/ost/Pasporty/MapServer`;
const JI_ROADS = `${JI_PASPORT}/112/query`;
const JI_LAWNS = `${JI_PASPORT}/25/query`;
const JI_BUILDINGS = `${JI}/server/rest/services/ost/ORP_RUIAN/MapServer/7/query`;
const JI_PARCELS = `${JI}/server/rest/services/ost/Ji_parcely/MapServer/1/query`;
const JI_DTM = `${JI}/server1/rest/services/DTM/DTM_ZPS_verejnost/MapServer`;
const JI_PARKING = `${JI}/server1/rest/services/verejnost/doprava_verejnost/MapServer/105/query`;
// The town's services turn S-JTSK into WGS 84 by another transformation than IPR's and the orthophotos
// (15965, about 6 m off OSM in Jihlava): answers come with S_JTSK_To_WGS_1984_1 (1623), as IPR's. (An
// input point would have to be moved into their WGS 84 by [3.2e-5, 4.9e-5] lon, lat.)
const JI_DATUM = { datumTransformation: 1623 };
const jiQuery = (url, params) => query(url, { ...params, ...JI_DATUM });
const none = () => ({ features: [] });

// The passport is asked once per cut for the surfaces and again for the parking: one request.
const roadsCache = new Map();
const roads = (bbox) => {
  if (!roadsCache.has(bbox)) {
    if (roadsCache.size > 8) roadsCache.delete(roadsCache.keys().next().value);
    roadsCache.set(bbox, jiQuery(JI_ROADS, { ...envelope(bbox), outFields: "typ_useku,spravce,povrch" }).catch((err) => { roadsCache.delete(bbox); throw err; }));
  }
  return roadsCache.get(bbox);
};

// Land of the cadastre (druh pozemku, způsob využití) → MTVU codes, for what the layers above leave
// open: front gardens, yards, verges. Prague's MTVU covers the whole ground; Jihlava's passport only the
// roads, so without this the rest of a cut was "Neurčeno". The road's own parcel beyond the passport's
// roadway and sidewalk is mostly a grass verge: green, as an estimate.
const JI_LAND = [
  [/^(zahrada|ovocný sad|vinice|chmelnice)/, 300], [/^trvalý travní porost/, 401], [/^orná půda/, 100],
  [/^lesní pozemek/, 200], [/^vodní plocha/, 501], [/^zastavěná plocha/, 603],
  [/\((zeleň|neplodná půda)\)/, 401], [/\((ostatní komunikace|silnice)\)/, [401, true]],
  [/\(manipulační plocha\)/, 1003], [/\(sportoviště/, 901], [/\(dráha\)/, 1100],
];
const landCode = (name) => JI_LAND.find(([re]) => re.test(name || ""))?.[1] ?? null;

// Roads of the state and the region (ŘSD, Krajská správa a údržba silnic) with no surface recorded are drawn
// by the city in places as a strip of the road's nominal crown: I/38 as 13.0 m along kilometres, unpaved
// verges included, where the asphalt is about 10.5 m. Where such a strip is 13 m across (12.7–13.2 m, over at
// least SHARE of its edges; the same polygon may narrow to 9 m elsewhere, so it is judged edge by edge) it
// is narrowed by TRIM on each side (A/B test evaluation/jihlava/PASPORT.md: 3 of 5 changed cuts better, none worse).
const stateRoad = (a) => a.typ_useku === "vozovka" && /ŘSD|Krajsk/i.test(a.spravce || "") && !(a.povrch || "").trim();
const TRIM = 1.25, MIN_STRIP = 12.7, MAX_STRIP = 13.2, SHARE = 0.3;
// Widths of a polygon (metres) across it: from points along each edge, inwards to the next edge hit.
function widths(ring) {
  const out = []; // per edge: the median width from its points, or null
  const n = ring.length - 1;
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  const inward = area > 0 ? 1 : -1; // counter-clockwise: the inside lies to the left
  for (let i = 0; i < n; i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[i + 1], len = Math.hypot(bx - ax, by - ay);
    const here = [];
    out.push(here);
    if (len < 0.5) continue;
    const nx = (-(by - ay) / len) * inward, ny = ((bx - ax) / len) * inward;
    for (let s = 0.5; s < len; s += 2) {
      const px = ax + ((bx - ax) * s) / len, py = ay + ((by - ay) * s) / len;
      let best = Infinity;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const [cx, cy] = ring[j], [dx, dy] = ring[j + 1], ex = dx - cx, ey = dy - cy;
        const den = nx * ey - ny * ex;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((cx - px) * ey - (cy - py) * ex) / den, u = ((cx - px) * ny - (cy - py) * nx) / den;
        if (t > 0.05 && u >= 0 && u <= 1 && t < best) best = t;
      }
      if (best < 60) here.push(best);
    }
  }
  return { out: out.map((w) => (w.length ? w.sort((a, b) => a - b)[Math.floor(w.length / 2)] : null)), inward };
}
// A polygon moved inwards along the vertex bisectors, vertex i by d[i].
function shrink(ring, d, inward) {
  const n = ring.length - 1, out = [];
  const normal = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(-(b[1] - a[1]) / l) * inward, ((b[0] - a[0]) / l) * inward]; };
  for (let i = 0; i < n; i++) {
    const p = ring[(i - 1 + n) % n], c = ring[i], q = ring[i + 1];
    const n1 = normal(p, c), n2 = normal(c, q);
    let bx = n1[0] + n2[0], by = n1[1] + n2[1];
    const bl = Math.hypot(bx, by);
    if (bl < 1e-6) { bx = n2[0]; by = n2[1]; } else { bx /= bl; by /= bl; }
    const k = Math.max(0.5, bx * n2[0] + by * n2[1]);
    out.push([c[0] + (bx * d[i]) / k, c[1] + (by * d[i]) / k]);
  }
  out.push(out[0]);
  return out;
}
function narrowStrip(f, lat) {
  const [kx, ky] = metres(lat);
  const rings = f.geometry?.rings;
  if (!rings || rings.length !== 1) return f;
  const ring = rings[0].map(([x, y]) => [x * kx, y * ky]);
  const { out: ws, inward } = widths(ring);
  const n = ws.length, strip = (w) => w !== null && w >= MIN_STRIP && w <= MAX_STRIP;
  // An edge without a measured width (a short one) takes its neighbours'.
  const at = (i) => { for (let k = 0; k < n; k++) for (const j of [i - k, i + k]) { const w = ws[(j + n) % n]; if (w !== null) return w; } return null; };
  const d = ws.map((_, i) => (strip(at((i - 1 + n) % n)) && strip(at(i)) ? TRIM : 0));
  if (!d.some(Boolean) || ws.filter(strip).length < SHARE * ws.filter((w) => w !== null).length) return f;
  return { ...f, attributes: { ...f.attributes, narrowed: d.filter(Boolean).length }, geometry: { rings: [shrink(ring, d, inward).map(([x, y]) => [x / kx, y / ky])] } };
}
// Buildings first (the passport passes under some of them), then the roads, the lawns, and the cadastre.
async function surfaces(bbox) {
  const [r, buildings, lawns, parcels] = await Promise.all([
    roads(bbox),
    jiQuery(JI_BUILDINGS, { ...envelope(bbox), outFields: "pocet_podl" }).catch(none),
    jiQuery(JI_LAWNS, { ...envelope(bbox), outFields: "druh_plocha" }).catch(none),
    jiQuery(JI_PARCELS, { ...envelope(bbox), outFields: "drupoz_naz" }).catch(none),
  ]);
  // Without the passport's roadway around (a road it does not keep) the road parcel stays open: green
  // there would hide the road the profile then estimates from OSM.
  const hasRoadway = (r.features || []).some((f) => f.attributes?.typ_useku === "vozovka");
  const lat = Number(bbox.split(",")[1]);
  const passport = { features: (r.features || []).map((f) => (stateRoad(f.attributes || {}) ? narrowStrip(f, lat) : f)) };
  return asMtvu([
    [buildings, 601],
    [passport, (a) => (a.typ_useku === "vozovka" ? 701 : a.typ_useku === "chodník" ? 702 : null)],
    [lawns, 401],
    [parcels, (a) => { const c = landCode(a.drupoz_naz); return Array.isArray(c) && !hasRoadway ? null : c; }],
  ], MTVU_LABELS);
}

// Lines of the technical map → the codes of IPR's line layer (derive.js FENCE_LINES and the rest).
const JI_LINE_CODES = { Plot: 61210, Zabradli: 61530, "Zed Linie": 71210, Svodidlo: 71522, "Protihlukova Stena": 71210 };
async function lines(bbox) {
  const json = await jiQuery(`${JI_DTM}/12/query`, {
    ...envelope(bbox), outFields: "nazev", where: `nazev IN (${Object.keys(JI_LINE_CODES).map((k) => `'${k}'`).join(",")})`,
  });
  const features = [];
  for (const f of json.features || []) {
    const code = JI_LINE_CODES[f.attributes?.nazev];
    if (code && f.geometry?.paths) features.push({ attributes: { CTMTP_KOD: code }, geometry: f.geometry });
  }
  return { features };
}

// OSM around a point plus the city's trees, lamps, stop shelters, benches at stops and bike stands where OSM
// has no such thing nearby (its layer of benches does not answer queries).
// Each layer: its url, the fields it needs, and the OSM tags of a feature (null: not drawn).
const JI_POINTS = [
  [`${JI_PASPORT}/28/query`, "objectid", () => ({ natural: "tree" })],
  [`${JI_PASPORT}/50/query`, "objectid", () => ({ highway: "street_lamp" })],
  // Stops of the town's passport: the shelter (with its bench) where there is one, else a bench standing
  // on its own.
  [`${JI_PASPORT}/127/query`, "pristresek,lavicka,stav", (a) => (a.stav === "Návrh" ? null
    : a.pristresek === "ano" ? { amenity: "shelter", shelter_type: "public_transport", bus: "yes" }
    : /Pevně|Volně/.test(a.lavicka || "") ? { amenity: "bench" } : null)],
  [`${JI}/server1/rest/services/verejnost/doprava_verejnost/MapServer/150/query`, "stav", (a) => (a.stav && a.stav !== "Stávající" ? null : { amenity: "bicycle_parking" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, radius);
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...JI_POINTS.map(([url, outFields]) => jiQuery(url, { ...envelope(box), outFields }).catch(none)),
  ]);
  return addPoints(o, pts, JI_POINTS.map(([, , tagsOf]) => tagsOf), "Jihlava", lat);
}

// The city's parking sections are lines with the kind of stalls: each becomes a strip as deep as its
// stalls, on the roadway side of a line drawn along the curb.
const JI_DEPTH = { podélné: 2.0, šikmé: 4.5, kolmé: 5.0 };
const JI_SPECIAL = new Set(["K+R", "Taxi", "Vyhrazené"]);
async function parking(bbox) {
  const [park, r] = await Promise.all([
    jiQuery(JI_PARKING, { ...envelope(bbox), outFields: "druh_stani,rezim,pocet_mist", where: "stav_prvku = 'Stávající'" }),
    roads(bbox).catch(none),
  ]);
  const lat = Number(bbox.split(",")[1]);
  const roadway = (r.features || []).filter((f) => f.attributes?.typ_useku === "vozovka");
  const features = [];
  for (const f of park.features || []) {
    const { druh_stani: kind, rezim, pocet_mist: count } = f.attributes || {};
    if (!rezim || /^Zákaz/.test(rezim)) continue;
    for (const ring of parkingStrip(f.geometry?.paths, JI_DEPTH[kind] || 2.0, roadway, lat)) {
      features.push({ attributes: { KIND: JI_SPECIAL.has(rezim) ? "specialni" : "useky", PS_ZPS: count || 0 }, geometry: { rings: [ring] } });
    }
  }
  return { features };
}

// Floors, use, year and walls of a building from RÚIAN of ČÚZK (gis.js ruianBuilding): the town's copy
// of RÚIAN has no year of completion.
const podlaznost = ruianBuilding;
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";

export const sources = { osm, surfaces, lines, parking, podlaznost };

// Base maps: the city's orthophoto and technical map, drawn by its GIS as export images in Web Mercator
// (its caches are in S-JTSK), with OSM underneath for the zoomed-out view. ctx: { L, ArcgisExport,
// BIG_TILES, osm (an OSM layer), cuzk (the ČÚZK orthophoto) } from app.js.
export function maps({ ArcgisExport, BIG_TILES, osm: osmLayer, cuzk }) {
  return {
    base: {
      "Ortofoto Jihlava": [osmLayer(1), new ArcgisExport("", { service: `${JI}/server/rest/services/basemaps/ORP_ortofoto/MapServer`, minZoom: 15, maxZoom: 21, ...BIG_TILES, attribution: "ortofoto © Statutární město Jihlava" })],
      "Technická mapa": [osmLayer(0.5), new ArcgisExport("", { service: JI_DTM, minZoom: 17, maxZoom: 21, ...BIG_TILES, attribution: "technická mapa © Statutární město Jihlava" })],
      "Ortofoto ČÚZK": [cuzk()],
      "OpenStreetMap": [osmLayer(1)],
    },
    default: "Ortofoto Jihlava",
    lines: new ArcgisExport("", { service: JI_DTM, maxZoom: 21, minZoom: 16, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © Statutární město Jihlava" }),
  };
}

// The orthophoto for the evaluation (evaluation/run_brno.mjs): an ArcGIS export in Web Mercator.
export const ortho = { service: `${JI}/server/rest/services/basemaps/ORP_ortofoto/MapServer/export`, datum: 1623 };
