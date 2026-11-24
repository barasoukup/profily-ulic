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
  // Slovenia (23. 11. 2026): GISCO's, after Italy and Austria (their rings come first by the border; Croatia stays abroad).
  slovenia: () => gisco("SI"),
  // Finland (23. 11. 2026): GISCO's, with the islands and Åland (an autonomous part of Finland; the app reads it with the
  // Finnish rules, evaluation/finland/ZDROJE.md 6).
  finland: () => gisco("FI"),
  // Denmark (23. 11. 2026): GISCO's DK, with Bornholm and the islands; the Faroes (FO) and Greenland (GL) are GISCO's own
  // entries and stay abroad (no data of theirs). By Flensburg and Padborg the same GISCO line as Germany's ring.
  denmark: () => gisco("DK"),
  // Lithuania (24. 11. 2026): GISCO's LT, after Poland's exact PRG ring (by Suwałki and Sejny the Polish line first);
  // Latvia, Belarus and Kaliningrad stay abroad.
  lithuania: () => gisco("LT"),
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
  // Not ours, kept out of the coast's tolerance (city.js cityAt): Gibraltar and Andorra are abroad.
  foreign_gi: () => gisco("GI"),
  foreign_ad: () => gisco("AD"),
  // Where the app makes no profile (Bára 23. 11. 2026, the review): the north of Cyprus (GISCO draws one island; the
  // republic by OSM comes first) and Italy beyond the open orthophotos, San Marino and the Vatican with it.
  closed_cy: () => gisco("CY"),
  // (GISCO's outer rings of Italy take in San Marino and the Vatican.)
  closed_it: () => gisco("IT"),
};
const file = new URL("../pilot/public/staty.json", import.meta.url);
const only = process.argv.slice(2);
const old = only.length ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
// The order of BUILD is the order of staty.json (city.js cityAt takes the first state a point lies in).
const out = {};
for (const id of Object.keys(BUILD)) out[id] = !only.length || only.includes(id) ? await BUILD[id]() : old[id];
for (const [id, r] of Object.entries(out)) console.log(id, r.length, "kruhů,", r.reduce((a, x) => a + x.length, 0), "bodů");
fs.writeFileSync(file, JSON.stringify(out));
