// The boundaries of the states the app has OSM tiles of (Bára 15. 11. 2026), so a cut outside the cities of
// mesta.json takes its state (city.js cityAt): "cesko" (RÚIAN Stát, ČÚZK), "slovensko" (ZBGIS of ÚGKK SR, layer
// Slovenská republika), "austria" (Eurostat GISCO 2024, 1 : 1 000 000, © EuroGeographics; the BEV's WFS is off, Bára
// 16. 11. 2026), "germany" (GISCO as Austria, Bára 17. 11. 2026), "netherlands" (GISCO, the European part; 20. 11. 2026), "switzerland" and "liechtenstein" (swisstopo's
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
async function gisco(cntr) {
  const all = await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_01M_2024_4326.geojson")).json();
  const g = all.features.find((f) => f.properties.CNTR_ID === cntr).geometry;
  const polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  return polys.map((p) => p[0].map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]));
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
  austria: () => gisco("AT"),
  germany: () => gisco("DE"),
  netherlands: () => gisco("NL"),
};
const file = new URL("../pilot/public/staty.json", import.meta.url);
const only = process.argv.slice(2);
const old = only.length ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
// The order of BUILD is the order of staty.json (city.js cityAt takes the first state a point lies in).
const out = {};
for (const id of Object.keys(BUILD)) out[id] = !only.length || only.includes(id) ? await BUILD[id]() : old[id];
for (const [id, r] of Object.entries(out)) console.log(id, r.length, "kruhů,", r.reduce((a, x) => a + x.length, 0), "bodů");
fs.writeFileSync(file, JSON.stringify(out));
