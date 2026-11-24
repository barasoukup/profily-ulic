// The boundaries of the states the app has OSM tiles of (Bára 15. 11. 2026), so a cut outside the cities of
// mesta.json takes its state (city.js cityAt): "cesko" (RÚIAN Stát, ČÚZK), "slovensko" (ZBGIS of ÚGKK SR, layer
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
// point by their border with Austria or Germany takes theirs (Büsingen and Campione are holes of Switzerland's ring). Simplified to about 30 m, written into pilot/public/staty.json and kept in the repository
// (boundaries change rarely): node tools/build_staty.mjs, or node tools/build_staty.mjs germany for one state (the
// others stay as they are in staty.json).
import fs from "node:fs";

const CZ = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/19/query";
// ZBGIS answers its query operation with 503 (15. 11. 2026): the state is asked by identify at a point inside it.
const SK = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Uzemnospravne_clenenie/MapServer/identify";
const OFFSET = 0.0003; // degrees, about 25–30 m

async function rings(url, params) {
  const q = new URLSearchParams({ outSR: 4326, maxAllowableOffset: OFFSET, geometryPrecision: 4, f: "json", ...params });
  // The services close a connection now and then: a few tries.
  for (let i = 0; ; i++) {
    try {
      const json = await (await fetch(`${url}?${q}`)).json();
      const all = (json.features || json.results || []).flatMap((f) => f.geometry?.rings || []);
      if (!all.length) throw new Error(`${url}: žádná hranice`);
      return all;
    } catch (err) { if (i === 3) throw err; await new Promise((r) => setTimeout(r, 2000)); }
  }
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

// The USA (Bára 24. 11. 2026, phase 2 of the North America pilot): only the metro of Washington DC is covered, the
// District and the counties and cities around it whose OSM the pack us_dc holds (tools/countries.mjs): Montgomery and
// Prince George's in Maryland; Arlington, Fairfax County, Fairfax city, Falls Church and Alexandria in Virginia. Their
// boundaries from the Census Bureau's TIGERweb (State_County, layer Counties; works of the federal government, public
// domain), with their holes (Fairfax County's ring has Fairfax city as a hole: the rings of one entry count by parity,
// so the city's own ring makes it inside again), simplified as the others.
const DC_METRO = ["11001", "24031", "24033", "51013", "51059", "51600", "51610", "51510"];
async function dcMetro() {
  const q = new URLSearchParams({ where: `GEOID IN (${DC_METRO.map((g) => `'${g}'`).join(",")})`, outFields: "GEOID", returnGeometry: "true", outSR: "4326", f: "json" });
  const json = await (await fetch(`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
  if ((json.features || []).length !== DC_METRO.length) throw new Error(`TIGERweb: ${json.features?.length} of ${DC_METRO.length} counties`);
  // Not simplified: each county simplified on its own left gaps along the shared boundaries (Southern Avenue, the DC line,
  // fell into closed_us); the rings rounded to 1e-5° (about 1 m) only, equal on both sides of a boundary.
  return json.features.flatMap((f) => f.geometry.rings).map((r) => r.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)])).filter((r) => r.length >= 4);
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
  // not ours; evaluation/italy/ZDROJE.md): the province of Bolzano (ProvCM, COD_PROV 21) and the municipalities of Turin,
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
  // Finnish rules, evaluation/finland/ZDROJE.md 6).
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
  // The USA (24. 11. 2026): the metro of Washington DC (dcMetro above); the rest of the USA is closed_us below.
  usa: () => dcMetro(),
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
  // The USA beyond the metro of Washington (24. 11. 2026: the OSM pack us_dc holds only the metro): GISCO's US with
  // Alaska, Hawaii and the islands, simplified to about 1 km (a message, not a border to cut by).
  closed_us: async () => (await gisco("US")).map((r) => simplify(r, 0.01)).filter((r) => r.length >= 4),
};
const file = new URL("../pilot/public/staty.json", import.meta.url);
const only = process.argv.slice(2);
const old = only.length ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
// The order of BUILD is the order of staty.json (city.js cityAt takes the first state a point lies in).
const out = {};
for (const id of Object.keys(BUILD)) out[id] = !only.length || only.includes(id) ? await BUILD[id]() : old[id];
for (const [id, r] of Object.entries(out)) console.log(id, r.length, "kruhů,", r.reduce((a, x) => a + x.length, 0), "bodů");
fs.writeFileSync(file, JSON.stringify(out));
