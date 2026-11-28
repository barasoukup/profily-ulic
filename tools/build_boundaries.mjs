// The boundaries the app reads (app/public/*.json), built from the open services at build time, none on a click; the files are
// kept in the repository (boundaries change rarely). One tool for all of them (docs/code-health-plan.md, step 20; before: build_states,
// build_towns, build_towns_sk/at/us/ca, build_laender, build_regions_cz/be/es):
//   node tools/build_boundaries.mjs states [id …]       states.json and states-america.json (all, or just the named states)
//   node tools/build_boundaries.mjs towns [cz sk at us ca] [file.geojson]
//                                                        towns.json (cz), towns-sk/at/us/ca.json (default: all five; the file is
//                                                        GISCO's LAU GeoJSON downloaded before, for at); us needs states-america.json first
//   node tools/build_boundaries.mjs regions [cz be es]  regions-cz/be/es.json (default: all three)
//   node tools/build_boundaries.mjs laender             laender.json (Germany's Länder)
//   node tools/build_boundaries.mjs all                 all of the above, in this order
// Each part keeps the rounding and simplification its file always had (the output is the same byte for byte: the parts differ in
// decimals and in how a closed ring is split, so there is not one simplify); what they share is here once: the retry of a flaky
// service (retry), GISCO's NUTS rings (nutsRings), the outline of areas with common boundaries (outline), the file name (pub).
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const pub = (name) => new URL(`../app/public/${name}`, import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The services close a connection now and then: a few tries (the last error is thrown).
async function retry(fn, tries = 4, wait = 2000) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (err) { if (i === tries - 1) throw err; await sleep(wait); }
  }
}
const GISCO_NUTS = (level) => `https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_${level}.geojson`;
// GISCO NUTS 2024 level 1 at 1 : 1 000 000 (© EuroGeographics): the outer rings of the units named in `codes` (NUTS id → our id),
// rounded to 3 decimals (about 100 m), a point repeated in a row dropped, rings of 3 points or fewer left out (Germany's Länder,
// Belgium's regions).
async function nutsRings(codes) {
  const all = await (await fetch(GISCO_NUTS(1))).json();
  const out = {};
  for (const f of all.features) {
    const code = codes[f.properties.NUTS_ID];
    if (!code) continue;
    const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    out[code] = polys.map((p) => p[0].map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]))
      .filter((r) => r.length > 3);
  }
  return out;
}

// ---- states.json, states-america.json
// The boundaries of the states the app has OSM tiles of (Bára 15. 11. 2026), so a cut outside the cities of
// towns.json takes its state (city.js cityAt): "cesko" (RÚIAN Stát, ČÚZK), "slovensko" (ZBGIS of ÚGKK SR, layer
// Slovenská republika), "austria" (Eurostat GISCO 2024, 1 : 1 000 000, © EuroGeographics; the BEV's WFS is off, Bára
// 16. 11. 2026), "germany" (GISCO as Austria, Bára 17. 11. 2026), "netherlands" (GISCO, the European part; 20. 11. 2026), "belgium" and "luxembourg" (GISCO, 20. 11. 2026), "poland" (the national PRG of GUGiK, exact, before Austria and Germany; 21. 11. 2026), "france" (GISCO, metropolitan; 22. 11. 2026), "spain" (GISCO with the islands, Ceuta, Melilla; 23. 11. 2026), "portugal" (GISCO with Madeira and the Azores; 23. 11. 2026), "slovenia" (GISCO, 23. 11. 2026), "finland" (GISCO with Åland, 23. 11. 2026), "denmark" (GISCO with Bornholm, without the Faroes and Greenland, 23. 11. 2026), "switzerland" and "liechtenstein" (swisstopo's
// A state's land borders (GISCO's boundary lines, COAS_FLAG "F"; LEFT_URI and RIGHT_URI are ISO 3166-1 alpha-3).
let giscoLines = null;
async function giscoLand(iso3) {
  const all = giscoLines ??= await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_BN_01M_2024_4326.geojson")).json();
  return all.features.filter((f) => f.properties.COAS_FLAG === "F" && [f.properties.LEFT_URI, f.properties.RIGHT_URI].includes(iso3))
    .flatMap((f) => (f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates]))
    .map((l) => l.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]));
}
// swissBOUNDARIES3D through api3.geo.admin.ch, open data "© swisstopo", 17. 11. 2026); a point in none is "cizina". The
// order matters: Czechia, Slovakia, Switzerland and Liechtenstein first (their borders are exact, GISCO's coarser), so a
// point by their border with Austria or Germany takes theirs (Büsingen and Campione are holes of Switzerland's ring). Simplified to about 30 m, written into app/public/states.json and kept in the repository
// (boundaries change rarely): node tools/build_boundaries.mjs states, or node tools/build_boundaries.mjs states germany for one
// state (the others stay as they are in states.json).

const CZ = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/19/query";
// ZBGIS answers its query operation with 503 (15. 11. 2026): the state is asked by identify at a point inside it.
const SK = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Uzemnospravne_clenenie/MapServer/identify";
const OFFSET = 0.0003; // degrees, about 25–30 m

async function rings(url, params) {
  const q = new URLSearchParams({ outSR: 4326, maxAllowableOffset: OFFSET, geometryPrecision: 4, f: "json", ...params });
  return retry(async () => {
    const json = await (await fetch(`${url}?${q}`)).json();
    const all = (json.features || json.results || []).flatMap((f) => f.geometry?.rings || []);
    if (!all.length) throw new Error(`${url}: žádná hranice`);
    return all;
  });
}

// Austria from GISCO's countries of 1 : 1 000 000 (one file of all, about 60 MB; its MultiPolygon's outer rings).
// holes: the inner rings too (France: Llívia, a Spanish enclave; cityAt counts the rings a point lies in, as
// Switzerland's Büsingen and Campione).
let giscoAll = null;
async function gisco(cntr, holes = false) {
  const all = giscoAll ??= await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_01M_2024_4326.geojson")).json();
  const g = all.features.find((f) => f.properties.CNTR_ID === cntr).geometry;
  const polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  return (holes ? polys.flat() : polys.map((p) => p[0])).map((r) => r.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]));
}

// Estonia's towns on a land border (the review of 24. 11. 2026: GISCO's 1 : 1 M line cuts the river bank of Narva, Jõe
// tänav and Sadama tee, and the streets of Valga by Valka): the cadastral boundary of the town (EHAK, WFS of the Maa- ja
// Ruumiamet, gsavalik.envir.ee baasandmed:ehak_linn; "Haldus- ja asustusjaotus: Maa- ja Ruumiamet", its open licence),
// which runs along the state border there. Narva linn (the municipality, with its garden exclaves) and Valga linn (the
// settlement of Valga vald), thinned to about 2 m. Inland both: their rings are land borders too (land_estonia).
let ehakRings = null;
async function ehak() {
  if (ehakRings) return ehakRings;
  const q = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "baasandmed:ehak_linn", outputFormat: "application/json",
    srsName: "EPSG:4326", CQL_FILTER: "nimi LIKE 'Narva linn%' OR nimi LIKE 'Valga linn%'" });
  const json = await (await fetch(`https://gsavalik.envir.ee/geoserver/baasandmed/ows?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
  const towns = json.features.filter((f) => ["Narva linn", "Valga linn"].includes(f.properties.nimi.trim()));
  if (towns.length !== 2) throw new Error("EHAK: Narva a Valga nenalezeny");
  return (ehakRings = towns.flatMap((f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]).map((p) => simplify(p[0], 0.00002))));
}
// Helsinki and Espoo with their sea (the review of 24. 11. 2026: 17 streets of Helsinki, on bridges and islands GISCO's
// 1 : 1 M coast leaves out, Itäväylä, Laivakoirankatu, Ramsinniementie, Hanasaarenranta, lay more than the coast's 400 m
// off it): the municipal boundaries of HSY's regional map (Seutukartta, kartta.hel.fi avoindata:Seutukartta_aluejako_kuntarajat,
// CC BY 4.0, Helsingin seudun ympäristöpalvelut HSY), which take in the sea up to the open water; simplified as the others.
async function seutukartta() {
  const q = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "avoindata:Seutukartta_aluejako_kuntarajat", outputFormat: "application/json", srsName: "EPSG:4326" });
  const json = await (await fetch(`https://kartta.hel.fi/ws/geoserver/avoindata/wfs?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
  const towns = json.features.filter((f) => ["Helsinki", "Espoo"].includes(f.properties.nimi));
  if (towns.length !== 2) throw new Error("Seutukartta: Helsinki a Espoo nenalezeny");
  return towns.flatMap((f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]).map((p) => simplify(p[0])));
}
// swissBOUNDARIES3D (Landesgrenzen) of one state, CH or LI, with its holes (Büsingen, Campione), simplified as the
// others (Douglas–Peucker to about 30 m).
function simplify(ring, eps = OFFSET) {
  const keep = new Uint8Array(ring.length); keep[0] = keep[ring.length - 1] = 1;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(), [ax, ay] = ring[a], [bx, by] = ring[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let far = -1, dmax = 0;
    // a closed ring's ends are one point: the distance to it
    for (let i = a + 1; i < b; i++) { const d = len ? Math.abs(dy * (ring[i][0] - ax) - dx * (ring[i][1] - ay)) / len : Math.hypot(ring[i][0] - ax, ring[i][1] - ay); if (d > dmax) { dmax = d; far = i; } }
    if (far >= 0 && dmax > eps) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return ring.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]);
}
// Poland's border from the national register of boundaries PRG (GUGiK, WFS, GML in EPSG:4326: lat lon pairs), simplified
// as the others (the hostile review: GISCO's 1 : 1 000 000 gave Germany a strip of Zgorzelec and Słubice).
async function prg() {
  const gml = await (await fetch("https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:A00_Granice_panstwa&SRSNAME=urn:ogc:def:crs:EPSG::4326", { headers: { "User-Agent": "profily-ulic" } })).text();
  const rings = [...gml.matchAll(/<gml:exterior>[\s\S]*?<gml:posList[^>]*>([^<]*)<\/gml:posList>/g)].map((m) => {
    const v = m[1].trim().split(/\s+/).map(Number), ring = [];
    for (let i = 0; i + 1 < v.length; i += 2) ring.push([v[i + 1], v[i]]);
    return simplify(ring);
  });
  if (!rings.length) throw new Error("PRG: no border");
  return rings;
}
async function swiss(iso) {
  const json = await (await fetch(`https://api3.geo.admin.ch/rest/services/api/MapServer/ch.swisstopo.swissboundaries3d-land-flaeche.fill/${iso}?geometryFormat=geojson&sr=4326`, { headers: { "User-Agent": "profily-ulic" } })).json();
  const g = json.feature.geometry;
  return (g.type === "MultiPolygon" ? g.coordinates.flat() : g.coordinates).map((r) => simplify(r)).filter((r) => r.length >= 4);
}

// The USA (Bára 24. 11. 2026, phase 2 of the North America pilot): only the metros the OSM packs hold (tools/countries.mjs),
// a table so that further cities join as rows (26. 11. 2026), each a list of counties (and independent cities; GEOID: state
// and county FIPS) from the Census Bureau's TIGERweb (State_County, layer Counties; works of the federal government, public
// domain), with their holes (Fairfax County's ring has Fairfax city as a hole: the rings of one entry count by parity, so
// the city's own ring makes it inside again): each metro merged to one outline on its own (their rings do not touch), then
// simplified to about 10 m; the state "usa" is all of them.
//   dc: the District of Columbia only (the pack us_dc; Bára 26. 11. 2026: only where good free sources cover it, the
//       counties of Maryland and Virginia have no surface map, so they are the closed USA now).
//   nyc: New York City, its five boroughs (Bronx, Kings, New York, Queens, Richmond; the pack us_nyc, 26. 11. 2026). The
//       counties of New Jersey, Westchester and Nassau around it are left out: no surface map of theirs.
//   sf: San Francisco, the City and County (06075; its legal boundary with the water of the bay and the ocean to 3 nautical
//       miles and the Farallon Islands; the pack us_sf, 26. 11. 2026). The counties around it (San Mateo, Marin, Alameda)
//       have no surface map of the app, so they stay the closed USA (Bára decides).
//   boston: Suffolk (Boston, Chelsea, Revere, Winthrop), Middlesex (Cambridge, Somerville, Newton …) and Norfolk
//       (Brookline, Quincy …) in Massachusetts (the pack us_bos, Bára 26. 11. 2026; the towns part takes the
//       metro's ring from states-america.json as "bostonmetro").
const METROS = {
  dc: ["11001"],
  nyc: ["36005", "36047", "36061", "36081", "36085"],
  sf: ["06075"],
  boston: ["25025", "25017", "25021"],
};
async function metro(ids) {
  const q = new URLSearchParams({ where: `GEOID IN (${ids.map((g) => `'${g}'`).join(",")})`, outFields: "GEOID", returnGeometry: "true", outSR: "4326", f: "json" });
  const json = await (await fetch(`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
  if ((json.features || []).length !== ids.length) throw new Error(`TIGERweb: ${json.features?.length} of ${ids.length} counties`);
  return outline(json.features.flatMap((f) => f.geometry.rings)).map((r) => simplify(r, 0.0001)).filter((r) => r.length >= 4);
}
const usMetros = async () => (await Promise.all(Object.values(METROS).map(async (ids) => grow(await metro(ids), EDGE_M)))).flat();
// A street along the boundary (Washington's Southern Avenue, Toronto's Steeles Avenue) belongs to the city whose map reads it
// (towns/*.js AREAS near): each ring of the North American states grown by EDGE_M metres (a mitre offset in a local plane,
// the mitre at most 3 × EDGE_M), so that its other half is not the closed USA or Canada (Bára 26. 11. 2026: the cities only).
const EDGE_M = 60;
export function grow(rings, m) {
  return rings.map((r) => {
    const lat0 = r.reduce((a, p) => a + p[1], 0) / r.length, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
    const q = r.slice(0, -1).map(([x, y]) => [x * kx, y * ky]), n = q.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % n]; area += x0 * y1 - x1 * y0; }
    const out = area > 0 ? 1 : -1; // counter-clockwise: the outside is to the right
    const norm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [(dy / l) * out, (-dx / l) * out]; };
    const moved = q.map((p, i) => {
      const n1 = norm(q[(i - 1 + n) % n], p), n2 = norm(p, q[(i + 1) % n]);
      let bx = n1[0] + n2[0], by = n1[1] + n2[1];
      const bl = Math.hypot(bx, by);
      if (bl < 1e-9) { bx = n1[0]; by = n1[1]; } else { bx /= bl; by /= bl; }
      const cos = bx * n1[0] + by * n1[1], d = Math.min(m / Math.max(cos, 1e-6), 3 * m);
      return [+((p[0] + bx * d) / kx).toFixed(5), +((p[1] + by * d) / ky).toFixed(5)];
    });
    return [...moved, moved[0]];
  });
}
// Areas with common boundaries (the same vertices on both sides) merged to their outline before it is simplified: the
// edges two of them share cancel out, so nothing stays along the common lines (each county simplified alone left gaps
// there: Southern Avenue, the DC line, fell into closed_us; unsimplified it was 863 kB for every visitor).
export function outline(list) {
  const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`, at = new Map(), edges = new Map();
  for (const r of list) for (let i = 1; i < r.length; i++) {
    const a = key(r[i - 1]), b = key(r[i]);
    if (a === b) continue;
    at.set(a, r[i - 1]); at.set(b, r[i]);
    const k = a < b ? `${a} ${b}` : `${b} ${a}`;
    if (edges.has(k)) edges.delete(k); else edges.set(k, [a, b]);
  }
  const next = new Map();
  for (const [k, [a, b]] of edges) for (const [p, q] of [[a, b], [b, a]]) next.set(p, [...(next.get(p) || []), { q, k }]);
  const used = new Set(), out = [];
  for (const [k, [a, b]] of edges) {
    if (used.has(k)) continue;
    used.add(k);
    const ring = [a, b];
    while (ring.at(-1) !== a) {
      const e = (next.get(ring.at(-1)) || []).find((x) => !used.has(x.k));
      if (!e) break;
      used.add(e.k); ring.push(e.q);
    }
    if (ring.at(-1) === a) out.push(ring.map((p) => at.get(p)));
  }
  return out;
}

// Toronto, the city only (Bára 26. 11. 2026: only where good free sources cover it; the municipalities around it, which
// have no surface map, are the closed Canada), Statistics Canada's census subdivision of 2021 (the digital boundary file,
// with the lake; Statistics Canada Open Licence), simplified to about 10 m.
const GTA = ["3520005"];
async function statcan(ids) {
  const q = new URLSearchParams({ where: `CSDUID IN (${ids.map((i) => `'${i}'`).join(",")})`, outFields: "CSDUID", returnGeometry: "true", outSR: "4326", f: "json" });
  const json = await (await fetch(`https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Digital_boundary_files/MapServer/9/query?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
  if (json.features?.length !== ids.length) throw new Error(`StatCan: ${json.features?.length} of ${ids.length}`);
  return outline(json.features.flatMap((f) => f.geometry.rings));
}

const US_BORDER = ([x, y]) => (x > -83.6 && x < -66.9 && y > 41.6) || (x < -97 && y < 32.8 && (y < 30.2 || x < -101)); // Detroit to Maine, Mexico
const CA_BORDER = ([x, y]) => x > -83.6 && x < -66.9 && y > 41.6 && y < 47.5;
// coarse0: how coarse it is away from the border (degrees; south of 49.6° N, where people live, 0.01), islands: the smallest island that does (square degrees).
function closedFar(rings, onBorder, coarse0 = 0.01, islands = 0) {
  const area = (r) => { let a = 0; for (let i = 1; i < r.length; i++) a += (r[i][0] - r[i - 1][0]) * (r[i][1] + r[i - 1][1]); return Math.abs(a / 2); };
  return rings.map((r) => {
    const a = area(r);
    if (Math.min(...r.map((p) => p[1])) > 50) return a < Math.max(0.003, islands * 10) ? [] : simplify(r, Math.max(0.03, coarse0 * 2));
    if (a < islands && !r.some(onBorder)) return [];
    const coarse = simplify(r, a < 100 ? 0.01 : coarse0);
    if (a < 100) return coarse;
    const keep = new Set([...coarse, ...(coarse0 > 0.01 ? simplify(r, 0.01).filter((p) => p[1] < 49.6) : []), ...simplify(r, 0.001).filter(onBorder)].map((p) => p.join()));
    return r.filter((p) => keep.has(p.join()));
  }).map((r) => r.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)])).filter((r) => r.length >= 4);
}

// Ydre Nordhavn (denmark below): the hull of the OSM streets the review found abroad, 150 m round them.
const NORDHAVN = [[12.6174,55.6999],[12.6176,55.6994],[12.6181,55.699],[12.6189,55.6987],[12.6198,55.6986],[12.6404,55.6986],[12.6414,55.6987],[12.6421,55.699],[12.6427,55.6995],[12.6492,55.7092],[12.6447,55.723],[12.6442,55.7235],[12.6434,55.7238],[12.6425,55.7239],[12.6299,55.7241],[12.6289,55.724],[12.6288,55.724],[12.6264,55.7227],[12.6259,55.7223],[12.6174,55.6999]];

const BUILD = {
  cesko: () => rings(CZ, { where: "1=1", outFields: "nazev" }),
  slovensko: () => rings(SK, { geometry: "19.70,48.67", geometryType: "esriGeometryPoint", sr: 4326, layers: "all:0", tolerance: 2,
    mapExtent: "16.8,47.7,22.6,49.7", imageDisplay: "800,600,96", returnGeometry: true }),
  switzerland: () => swiss("CH"),
  liechtenstein: () => swiss("LI"),
  // Poland's exact border (PRG) before the coarse ones of Austria and Germany.
  poland: () => prg(),
  austria: () => gisco("AT"),
  germany: () => gisco("DE"),
  netherlands: () => gisco("NL"),
  belgium: () => gisco("BE"),
  luxembourg: () => gisco("LU"),
  // Monaco (23. 11. 2026): GISCO's 1 : 1 M ring has 11 points for 2 km², so the land boundary of OSM (admin_level 8,
  // without the territorial waters; tools/monaco-border.json, © OpenStreetMap contributors, ODbL), simplified as the others; before France, whose coarse ring may cover it).
  // Simplified to about 2 m, not 30 (the review of 23. 11. 2026: the state is 300 m wide in places, its second ring fell to a
  // line and 16 of its streets were France or abroad).
  monaco: () => JSON.parse(fs.readFileSync(new URL("./monaco-border.json", import.meta.url), "utf8")).map((r) => simplify(r, 0.00002)),
  // Metropolitan France only (GISCO's FR has the overseas regions too): the rings in Europe.
  // GISCO's ring of Monaco is France's too: Monaco by OSM comes first, and what GISCO gives Monaco beyond it is France
  // (Beausoleil, Cap-d'Ail: 17 streets abroad, the review of 23. 11. 2026).
  france: async () => [...(await gisco("FR", true)).filter((r) => r.every(([x, y]) => x > -6 && x < 10 && y > 41 && y < 52)), ...(await gisco("MC"))],
  // Spain with the Canary and Balearic Islands, Ceuta, Melilla and Llívia (an outer ring inside France's hole; 23. 11. 2026).
  spain: () => gisco("ES"),
  // Portugal with Madeira and the Azores (23. 11. 2026).
  portugal: () => gisco("PT"),
  // Cyprus (23. 11. 2026): the area the Republic controls and the British bases, from OSM (admin_level 3 "Cyprus" and
  // "Akrotiri and Dhekelia", their holes kept; tools/cyprus-border.json, © OpenStreetMap contributors, ODbL). The north is
  // a state of its own the app does not have yet (Bára 23. 11. 2026), GISCO draws one island.
  cyprus: () => JSON.parse(fs.readFileSync(new URL("./cyprus-border.json", import.meta.url), "utf8")).map((r) => simplify(r)),
  // Italy (23. 11. 2026): only where an orthophoto has an open licence (Bára 23. 11. 2026: AGEA's "institutional use" is
  // not ours; evaluation/italy/SOURCES.md): the province of Bolzano (ProvCM, COD_PROV 21) and the municipalities of Turin,
  // Bologna and Modena with its exclaves (Com, PRO_COM_T 001272, 037006, 036023), from ISTAT's "Confini delle unità
  // amministrative a fini statistici al 1° gennaio 2026", not generalised (© ISTAT, CC BY 4.0; Bára 23. 11. 2026, the
  // review: GISCO's 1 : 1 000 000 took in strips of the neighbours, where the city's orthophoto is black). The shapefiles
  // are in EPSG:32632; tools/italy-border.json holds their rings in WGS 84 (ogr2ogr -t_srs EPSG:4326, thinned to 5 m), from
  // https://www.istat.it/storage/cartografia/confini_amministrativi/non_generalizzati/2026/Limiti01012026.zip. The rest of
  // Italy, San Marino and the Vatican are not covered yet.
  // Lombardy (24. 11. 2026): where Regione Lombardia's DBT is the surface map (towns/lombardy.js), with Campione d'Italia,
  // the exclaves by Piedmont and the holes of the Oltrepò; tools/lombardy-border.json holds the region's boundary
  // ("Limiti amministrativi Regione Lombardia 2020 con aggiornamenti DbT/PGT", dati.lombardia.it b7fb-r6ie, CC0 1.0,
  // Regione Lombardia), thinned to 5 m.
  italy: () => ["./italy-border.json", "./lombardy-border.json"].flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"))).map((r) => simplify(r)),
  // Estonia (23. 11. 2026): GISCO's, with the islands.
  estonia: () => gisco("EE"),
  // More rings of a state, over its own ("<id>+<what>": city.js loadStates reads them as <id>, kept apart since the rings
  // of one entry count by parity; tools/build_coverage.mjs leaves them out; 24. 11. 2026): Narva and Valga by the
  // cadastre (ehak above).
  "estonia+ehak": () => ehak(),
  // Slovenia (23. 11. 2026): GISCO's, after Italy and Austria (their rings come first by the border; Croatia stays abroad).
  slovenia: () => gisco("SI"),
  // Finland (23. 11. 2026): GISCO's, with the islands and Åland (an autonomous part of Finland; the app reads it with the
  // Finnish rules, evaluation/finland/SOURCES.md 6).
  finland: () => gisco("FI"),
  // Helsinki and Espoo with their sea from HSY's regional map (seutukartta above, 24. 11. 2026).
  "finland+hsy": () => seutukartta(),
  // Denmark (23. 11. 2026): GISCO's DK, with Bornholm and the islands; the Faroes (FO) and Greenland (GL) are GISCO's own
  // entries and stay abroad (no data of theirs). By Flensburg and Padborg the same GISCO line as Germany's ring.
  denmark: () => gisco("DK"),
  // Ydre Nordhavn (the review of 24. 11. 2026: Nordsøvej and Oceankaj, land reclaimed in the 2010s, lie up to 1.3 km off
  // GISCO's coast): the hull of its streets in OSM (the local pack of 24. 11. 2026, © OpenStreetMap contributors, ODbL),
  // 150 m round them. Malmö is 20 km off.
  "denmark+nordhavn": () => [NORDHAVN],
  // Lithuania (24. 11. 2026): GISCO's LT, after Poland's exact PRG ring (by Suwałki and Sejny the Polish line first);
  // Latvia, Belarus and Kaliningrad stay abroad.
  lithuania: () => gisco("LT"),
  // The USA (24. 11. 2026): the metros of METROS above (Washington DC, New York City, San Francisco, Boston); the rest of
  // the USA is closed_us below.
  usa: () => usMetros(),
  // Canada (25. 11. 2026): Toronto, since 26. 11. 2026 the city only (statcan above); the rest of Canada is closed_ca below.
  canada: async () => grow((await statcan(GTA)).map((r) => simplify(r, 0.0001)).filter((r) => r.length >= 4), EDGE_M),
  // Malta (23. 11. 2026): OSM's boundary with the territorial waters (one ring round the islands, no neighbour; GISCO's
  // coast cuts off quays; tools/malta-border.json, © OpenStreetMap contributors, ODbL).
  malta: () => JSON.parse(fs.readFileSync(new URL("./malta-border.json", import.meta.url), "utf8")).map((r) => simplify(r)),
  // The land borders of the states with a coast's tolerance whose neighbours the app does not have (city.js stateEntry:
  // the tolerance holds by the sea, not along these; Bára 24. 11. 2026): GISCO's boundary lines of 1 : 1 000 000 without
  // the coast flag, the same vertices as the rings above (rounded alike). Lines, not rings: city.js loadStates keeps
  // them apart.
  land_lithuania: () => giscoLand("LTU"),
  land_finland: () => giscoLand("FIN"),
  land_denmark: () => giscoLand("DNK"),
  // Estonia's and Slovenia's (24. 11. 2026, the reviews: the harbours of Haapsalu, Virtsu, Kuivastu, Heltermaa,
  // Rohuküla and Paldiski, the old town of Koper and the west of Piran); Estonia's with the rings of Narva and Valga.
  land_estonia: async () => [...await giscoLand("EST"), ...await ehak()],
  land_slovenia: () => giscoLand("SVN"),
  // Not ours, kept out of the coast's tolerance (city.js cityAt): Gibraltar and Andorra are abroad.
  foreign_gi: () => gisco("GI"),
  foreign_ad: () => gisco("AD"),
  // Where the app makes no profile (Bára 23. 11. 2026, the review): the north of Cyprus (GISCO draws one island; the
  // republic by OSM comes first) and Italy beyond the open orthophotos, San Marino and the Vatican with it.
  closed_cy: () => gisco("CY"),
  // (GISCO's outer rings of Italy take in San Marino and the Vatican.)
  closed_it: () => gisco("IT"),
  // The USA beyond its metros (24. 11. 2026: the OSM packs us_dc, us_nyc, us_sf and us_bos hold only the metros): GISCO's US, a message
  // and not a border to cut by: to about 1 km, Alaska to 3 km without its small islands; along the land borders to 100 m
  // (at 1 km the quays of Windsor in Ontario and of Nuevo Laredo got the message of the USA).
  closed_us: async () => closedFar(await gisco("US"), US_BORDER),
  // Canada beyond Toronto's surroundings (25. 11. 2026), as the USA's: the same line at Windsor and Niagara.
  closed_ca: async () => closedFar(await gisco("CA"), CA_BORDER, 0.05, 0.02),
};

// Writes states.json and states-america.json; `only`: the ids of the states to build, the others stay as they are in the files.
async function buildStates(only = []) {
  const file = pub("states.json");
  // North America's entries have a file of their own, asked for only when a cut or the map is there (app/public/late.js).
  const AMERICA = /^(closed_)?(usa?|canada|ca)$/, farFile = pub("states-america.json");
  const old = only.length ? { ...JSON.parse(fs.readFileSync(file, "utf8")), ...JSON.parse(fs.readFileSync(farFile, "utf8")) } : {};
  // The order of BUILD is the order of states.json (city.js cityAt takes the first state a point lies in).
  const out = {};
  for (const id of Object.keys(BUILD)) out[id] = !only.length || only.includes(id) ? await BUILD[id]() : old[id];
  for (const [id, r] of Object.entries(out)) console.log(id, r.length, "kruhů,", r.reduce((a, x) => a + x.length, 0), "bodů");
  for (const [f, far] of [[file, false], [farFile, true]]) fs.writeFileSync(f, JSON.stringify(Object.fromEntries(Object.entries(out).filter(([id]) => AMERICA.test(id) === far))));
}

// ---- towns*.json: the boundaries of the cities the app knows (city.js cityAt, loadTowns)

// The boundaries of the cities the app knows (RÚIAN obce from ČÚZK, simplified to about 20 m), so a cut
// takes the data sources, illustrations and texts of the city it lies in (city.js cityAt); anywhere else
// in the Czech Republic it is "cesko". Written into app/public/towns.json and kept in the repository
// (a few kB; boundaries change rarely)
async function buildTownsCz() {
  const OBEC = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/12/query";
  // RÚIAN codes of the cities (obec).
  const CODES = { praha: 554782, brno: 582786, jihlava: 586846, most: 567027, opava: 505927, pardubice: 555134, plzen: 554791, usti: 554804,
    ostrava: 554821, "frydek-mistek": 598003, karvina: 598917, trebic: 590266, prerov: 511382,
    // Towns with only their own vehicles (city.js artTown).
    olomouc: 500496, liberec: 563889, hradec: 569810, budejovice: 544256, zlin: 585068 };
  const out = {};
  for (const [id, kod] of Object.entries(CODES)) {
    const q = new URLSearchParams({ where: `kod=${kod}`, outFields: "nazev", outSR: 4326, maxAllowableOffset: 0.0002, geometryPrecision: 5, f: "json" });
    const json = await retry(async () => await (await fetch(`${OBEC}?${q}`)).json());
    const f = json.features?.[0];
    if (!f) throw new Error(`obec ${kod} (${id}) nenalezena`);
    out[id] = f.geometry.rings;
    console.log(id, f.attributes.nazev, f.geometry.rings.reduce((a, r) => a + r.length, 0), "bodů");
  }
  fs.writeFileSync(pub("towns.json"), JSON.stringify(out));
}

// The boundaries of the Slovak towns the app has data or illustrations of (the review of Slovakia, 16. 11. 2026: the
// boxes reached Šamorín, Ivanka pri Dunaji or Svätý Jur, which got Bratislava's buses and its passport's queries), from
// ZBGIS of ÚGKK SR (Uzemnospravne_clenenie, CC BY 4.0): Bratislava and Košice as their districts (okres Bratislava
// I–V, Košice I–IV), the other towns as their municipality. ZBGIS answers its query operation with 503, so each part
// is asked by identify at a point inside it. Simplified to about 30 m, written into app/public/towns-sk.json
// (city.js loadSkTowns), kept in the repository
async function buildTownsSk() {
  const URL_ID = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Uzemnospravne_clenenie/MapServer/identify";
  const OFFSET = 0.0003;
  // town → [layer (2 okres, 3 obec), points inside its parts]
  const TOWNS = {
    bratislava: [2, [[17.107, 48.1467], [17.17, 48.16], [17.13, 48.19], [17.03, 48.19], [17.11, 48.11]]],
    kosice: [2, [[21.2575, 48.7235], [21.215, 48.70], [21.30, 48.735], [21.265, 48.685]]],
    zilina: [3, [[18.74, 49.223]]],
    bystrica: [3, [[19.146, 48.736]]],
    presov: [3, [[21.24, 48.998]]],
    nitra: [3, [[18.084, 48.309]]],
    trnava: [3, [[17.587, 48.377]]],
    trencin: [3, [[18.036, 48.892]]],
    martin: [3, [[18.921, 49.066]]],
    poprad: [3, [[20.297, 49.059]]],
    piestany: [3, [[17.832, 48.594]]],
    hlohovec: [3, [[17.803, 48.425]]],
    zvolen: [3, [[19.127, 48.575]]],
  };

  async function part(layer, [x, y]) {
    const q = new URLSearchParams({ geometry: `${x},${y}`, geometryType: "esriGeometryPoint", sr: 4326, layers: `all:${layer}`, tolerance: 0,
      mapExtent: "16.8,47.7,22.6,49.7", imageDisplay: "800,600,96", returnGeometry: true, maxAllowableOffset: OFFSET, geometryPrecision: 4, f: "json" });
    return retry(async () => {
      const json = await (await fetch(`${URL_ID}?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
      const r = (json.results || []).find((x) => x.layerId === layer);
      if (!r?.geometry?.rings?.length) throw new Error(`no ${layer} at ${x},${y}`);
      return { name: r.attributes["Názov okresu"] && layer === 2 ? r.attributes["Názov okresu"] : r.attributes["Názov obce"], rings: r.geometry.rings };
    });
  }

  const out = {};
  for (const [id, [layer, pts]] of Object.entries(TOWNS)) {
    const parts = [];
    for (const p of pts) { parts.push(await part(layer, p)); await sleep(300); }
    out[id] = parts.flatMap((p) => p.rings);
    console.log(id, parts.map((p) => p.name).join(", "), out[id].length, "kruhů");
  }
  fs.writeFileSync(pub("towns-sk.json"), JSON.stringify(out));
}

// The boundaries of the Austrian cities the app has illustrations or data of (step 4b of docs/architecture-countries.md:
// cities everywhere, Bára 16. 11. 2026), from Eurostat GISCO's local administrative units 2024 (LAU, the municipalities
// of Statistik Austria; © EuroGeographics, as the state's boundary in states.json). Statistik Austria's own file is no longer
// at its open-data address and GeoSphere's map service gives no geometry. One download of about 150 MB at build time,
// none on a click. Simplified to about 30 m, written into app/public/towns-at.json (city.js loadTowns), kept in the
// repository
// (`file`: GISCO's LAU GeoJSON downloaded before, else it is fetched)
async function buildTownsAt(file) {
  const URL_LAU = "https://gisco-services.ec.europa.eu/distribution/v2/lau/geojson/LAU_RG_01M_2024_4326.geojson";
  // city → LAU id (Gemeindekennziffer)
  const TOWNS = { wien: "90001", graz: "60101", linz: "40101", salzburg: "50101", innsbruck: "70101" };
  const TOL = 0.0003;

  // Douglas–Peucker on a ring (degrees; about 30 m), rounded to 5 decimals.
  function simplify(pts) {
    if (pts.length < 5) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    // A closed ring: first split at the point farthest from its start (the chord of a closed ring has no length).
    let far = 1;
    for (let i = 1; i < pts.length - 1; i++) if (Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]) > Math.hypot(pts[far][0] - pts[0][0], pts[far][1] - pts[0][1])) far = i;
    keep[far] = 1;
    const stack = [[0, far], [far, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      let best = -1, d = 0;
      const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1e-12;
      for (let i = a + 1; i < b; i++) { const e = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / l; if (e > d) { d = e; best = i; } }
      if (d > TOL) { keep[best] = 1; stack.push([a, best], [best, b]); }
    }
    return pts.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  }

  const all = file ? JSON.parse(fs.readFileSync(file, "utf8")) : await (await fetch(URL_LAU, { headers: { "User-Agent": "profily-ulic" } })).json();
  const out = {};
  for (const [id, lau] of Object.entries(TOWNS)) {
    const f = all.features.find((x) => x.properties.GISCO_ID === `AT_${lau}`);
    if (!f) throw new Error(`LAU AT ${lau} (${id}) nenalezena`);
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    out[id] = polys.map((p) => simplify(p[0]));
    console.log(id, f.properties.LAU_NAME, out[id].length, "kruhů", out[id].reduce((a, r) => a + r.length, 0), "bodů");
  }
  fs.writeFileSync(pub("towns-at.json"), JSON.stringify(out));
}

// The boundaries of the American cities the app has illustrations or a surface map of (as the Slovak and
// Austrian ones; Bára 25. 11. 2026): a few queries at build time, none on a click. Written into
// app/public/towns-us.json (city.js loadTowns), kept in the repository; states-america.json first:
//   
// A further city is a line of TOWNS.
//   washington: the District of Columbia from DC's own service (DCGIS "DC Boundary", CC BY 4.0), simplified by the service
//     to about 20 m;
//   newyork: New York City, its five boroughs (Bronx, Kings, New York, Queens, Richmond) from the Census Bureau's TIGERweb
//     (State_County, layer Counties; public domain), merged to one outline before it is simplified to about 20 m (each
//     county simplified alone would leave gaps along their common lines; 26. 11. 2026);
//   sanfrancisco: the incorporated place of TIGERweb (GEOID 0667000, the same line as the City and County, with its water
//     and the Farallon Islands; public domain; 26. 11. 2026);
//   boston, cambridge (Bára 26. 11. 2026): TIGERweb's incorporated places, the areas of their surface maps (towns/boston.js);
//   bostonmetro: the metro of Boston as states-america.json has it (METROS above), the area of its buses and
//     orthophoto (countries/US.js art, lanes-ortho.js us-ma). The city (boston) comes before its metro.
async function buildTownsUs() {
  const UA = { headers: { "User-Agent": "profily-ulic" } };
  const DC = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/10/query";
  const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query";
  // TIGERweb's incorporated places of the current vintage (layer 4; GEOID: state and place code).
  const PLACES = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query";
  async function rings(url, where, n = null, offset = "0.0002") {
    const q = new URLSearchParams({ where, outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", ...(offset && { maxAllowableOffset: offset }), f: "json" });
    const j = await (await fetch(`${url}?${q}`, UA)).json();
    if (!j.features?.length || (n && j.features.length !== n)) throw new Error(`${url}: ${j.features?.length} hranic`);
    return j.features.flatMap((f) => f.geometry.rings);
  }
  // Douglas–Peucker in degrees.
  function simplify(ring, eps) {
    const keep = new Uint8Array(ring.length);
    keep[0] = keep[ring.length - 1] = 1;
    const stack = [[0, ring.length - 1]];
    while (stack.length) {
      const [i, j] = stack.pop();
      const [ax, ay] = ring[i], [bx, by] = ring[j], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      let best = -1, d = 0;
      for (let k = i + 1; k < j; k++) {
        const [x, y] = ring[k], e = L ? Math.abs(dy * x - dx * y + bx * ay - by * ax) / L : Math.hypot(x - ax, y - ay);
        if (e > d) { d = e; best = k; }
      }
      if (d > eps) { keep[best] = 1; stack.push([i, best], [best, j]); }
    }
    return ring.filter((_, k) => keep[k]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  }
  const NYC = ["36005", "36047", "36061", "36081", "36085"];
  const TOWNS = {
    washington: () => rings(DC, "1=1"),
    newyork: async () => outline(await rings(TIGER, `GEOID IN (${NYC.map((g) => `'${g}'`).join(",")})`, NYC.length, null))
      .map((r) => simplify(r, 0.0002)).filter((r) => r.length >= 4),
    sanfrancisco: () => rings(PLACES, "GEOID='0667000'"),
    boston: () => rings(PLACES, "GEOID='2507000'"),
    cambridge: () => rings(PLACES, "GEOID='2511000'"),
  };
  const out = {};
  for (const [id, make] of Object.entries(TOWNS)) {
    out[id] = await make();
    console.log(id, out[id].map((r) => r.length), "bodů");
  }
  // The metro of Boston: the ring of states-america.json's "usa" that holds Boston's city hall.
  const states = JSON.parse(fs.readFileSync(pub("states-america.json"), "utf8"));
  const inRing = (r, x, y) => { let c = false; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, yi] = r[i], [xk, yk] = r[k]; if (yi > y !== yk > y && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) c = !c; } return c; };
  const metro = states.usa.filter((r) => inRing(r, -71.0578, 42.3603));
  if (!metro.length) throw new Error("states-america.json: metro Bostonu chybí (nejdřív node tools/build_boundaries.mjs states usa)");
  out.bostonmetro = metro;
  console.log("bostonmetro", metro.map((r) => r.length), "bodů");
  fs.writeFileSync(pub("towns-us.json"), JSON.stringify(out));
}

// The boundaries of the Canadian cities the app has a surface map of (as the American ones; Bára 25. 11. 2026): Toronto,
// Statistics Canada's census subdivision of 2021 (the digital boundary file, with the lake; Statistics Canada Open Licence).
// One query at build time, none on a click. Written into app/public/towns-ca.json, kept in the repository:
//
async function buildTownsCa() {
  const CSD = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Digital_boundary_files/MapServer/9/query";
  const q = new URLSearchParams({ where: "CSDUID='3520005'", outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", maxAllowableOffset: "0.0001", f: "json" });
  const j = await (await fetch(`${CSD}?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
  if (!j.features?.length) throw new Error("hranice Toronta se nenačetla");
  const out = { toronto: j.features.flatMap((f) => f.geometry.rings) };
  console.log("toronto", out.toronto.map((r) => r.length), "bodů");
  fs.writeFileSync(pub("towns-ca.json"), JSON.stringify(out));
}

const TOWNS_BUILD = { cz: buildTownsCz, sk: buildTownsSk, at: buildTownsAt, us: buildTownsUs, ca: buildTownsCa };

// ---- regions-*.json: the regions the orthophoto, map lines and cadastres are asked by

// The boundaries of the regions whose digital technical map (DTM kraje) answers a WFS with the polygons of the
// basic spatial situation (dtmwfs.js): RÚIAN VÚSC from ČÚZK, simplified to about 300 m (a cut within 400 m of a border
// asks both regions, dtmwfs.js regionsAt). Written into app/public/regions-cz.json and kept in the repository
// (boundaries change rarely)
async function buildRegionsCz() {
  const VUSC = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/17/query";
  // RÚIAN codes of the regions (VÚSC) → the id in dtmwfs.js REGIONS.
  const CODES = { 35: "jck", 51: "kvk", 78: "lbk", 86: "khk", 94: "pak", 108: "vys", 116: "jmk", 132: "msk", 141: "zlk" };
  const out = {};
  for (const [kod, id] of Object.entries(CODES)) {
    const q = new URLSearchParams({ where: `kod=${kod}`, outFields: "nazev", outSR: 4326, maxAllowableOffset: 0.003, geometryPrecision: 3, f: "json" });
    const json = await retry(async () => await (await fetch(`${VUSC}?${q}`)).json());
    const f = json.features?.[0];
    if (!f) throw new Error(`kraj ${kod} (${id}) nenalezen`);
    out[id] = f.geometry.rings;
    console.log(id, f.attributes.nazev, f.geometry.rings.reduce((a, r) => a + r.length, 0), "bodů");
    await sleep(500);
  }
  fs.writeFileSync(pub("regions-cz.json"), JSON.stringify(out));
}

// The boundaries of Belgium's regions (Bára 20. 11. 2026), so a cut asks only its region's orthophoto and map lines
// (lanes-ortho.js BE_ORTHO, towns/belgium.js): Eurostat GISCO NUTS 2024 level 1 at 1 : 1 000 000 (© EuroGeographics),
// rounded to about 100 m. Written into app/public/regions-be.json
async function buildRegionsBe() {
  const NUTS = { BE1: "bru", BE2: "vl", BE3: "wal" };
  const out = await nutsRings(NUTS);
  console.log(Object.keys(out));
  fs.writeFileSync(pub("regions-be.json"), JSON.stringify(out));
}

// The Basque Country and Navarre (Bára 23. 11. 2026), where the Catastro has no buildings (their own foral cadastres),
// so a cut there does not ask it but the cadastre of its province (towns/spain-foral.js): Eurostat GISCO NUTS 2024
// level 3 at 1 : 1 000 000 (© EuroGeographics; the finest NUTS of 2024 in GeoJSON), the three Basque provinces ES211
// Álava (ar), ES212 Gipuzkoa (gi), ES213 Bizkaia (bi) and Navarre ES220 (nc), with their holes (the Treviño enclave of
// Burgos in Álava and the Valle de Villaverde of Cantabria in Bizkaia), simplified to about 30 m. Written into app/public/regions-es.json:
//
async function buildRegionsEs() {
  const NUTS = { ES211: "ar", ES212: "gi", ES213: "bi", ES220: "nc" };
  const all = await (await fetch(GISCO_NUTS(3))).json();
  // Douglas–Peucker in degrees (0.0003° ≈ 30 m), then rounded to 4 decimals.
  const simplify = (pts, tol) => {
    if (pts.length < 3) return pts;
    let best = 0, at = 0;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i], d = len ? Math.abs(dy * (px - ax) - dx * (py - ay)) / len : Math.hypot(px - ax, py - ay);
      if (d > best) { best = d; at = i; }
    }
    return best <= tol ? [pts[0], pts[pts.length - 1]] : [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
  };
  const out = {};
  for (const f of all.features) {
    const code = NUTS[f.properties.NUTS_ID];
    if (!code) continue;
    const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    // All rings (outlines and holes) of all polygons: the point test is even–odd.
    out[code] = polys.flat().map((r) => {
      const h = Math.floor(r.length / 2); // a closed ring split in two, so Douglas–Peucker has two ends
      return [...simplify(r.slice(0, h + 1), 0.0003).slice(0, -1), ...simplify(r.slice(h), 0.0003)];
    }).map((r) => r.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]))
      .filter((r) => r.length > 3);
  }
  console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.length} kruhů, ${v.flat().length} bodů`).join("; "));
  fs.writeFileSync(pub("regions-es.json"), JSON.stringify(out));
}

const REGIONS_BUILD = { cz: buildRegionsCz, be: buildRegionsBe, es: buildRegionsEs };

// ---- laender.json
// The boundaries of Germany's Länder (Bára 17. 11. 2026), so a cut in Germany asks the orthophoto of its Land
// (lanes-ortho.js DE_ORTHO): Eurostat GISCO NUTS 2024 level 1 at 1 : 1 000 000 (© EuroGeographics), rounded to about
// 100 m. Near a border the next Land is tried too (lanes-ortho.js). Written into app/public/laender.json and kept in
// the repository
async function buildLaender() {
  // NUTS 1 → the Land's code as lanes-ortho.js names it (ISO 3166-2:DE without "DE-").
  const NUTS = { DE1: "BW", DE2: "BY", DE3: "BE", DE4: "BB", DE5: "HB", DE6: "HH", DE7: "HE", DE8: "MV", DE9: "NI", DEA: "NW", DEB: "RP",
    DEC: "SL", DED: "SN", DEE: "ST", DEF: "SH", DEG: "TH" };
  const out = await nutsRings(NUTS);
  console.log(Object.keys(out).length, "zemí");
  fs.writeFileSync(pub("laender.json"), JSON.stringify(out));
}

// ---- the command line
const STEPS = {
  states: (a) => buildStates(a),
  towns: async (a) => {
    const file = a.find((x) => /[./]/.test(x)), names = a.filter((x) => x !== file);
    for (const k of names.length ? names : Object.keys(TOWNS_BUILD)) {
      if (!TOWNS_BUILD[k]) throw new Error(`towns: neznám „${k}“ (${Object.keys(TOWNS_BUILD).join(", ")})`);
      await TOWNS_BUILD[k](file);
    }
  },
  regions: async (a) => {
    for (const k of a.length ? a : Object.keys(REGIONS_BUILD)) {
      if (!REGIONS_BUILD[k]) throw new Error(`regions: neznám „${k}“ (${Object.keys(REGIONS_BUILD).join(", ")})`);
      await REGIONS_BUILD[k]();
    }
  },
  laender: () => buildLaender(),
};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [what, ...args] = process.argv.slice(2);
  if (what === "all") for (const k of Object.keys(STEPS)) await STEPS[k]([]);
  else if (STEPS[what]) await STEPS[what](args);
  else throw new Error(`použití: node tools/build_boundaries.mjs <${[...Object.keys(STEPS), "all"].join("|")}> [co]`);
}
