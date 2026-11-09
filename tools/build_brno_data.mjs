// Brno open data for the Brno version, downloaded once per deploy (a click never asks Brno's
// servers): data.brno.cz (statutární město Brno) and the city's GIS.
//   node tools/build_brno_data.mjs pilot/data/brno [pilot/data/brno/osm-tiles]
// Writes into the output directory:
//   parkovani.json  úseky placeného stání (paid parking sections, CC BY-SA 4.0), polygons as ArcGIS JSON
//   zps.json        bounding boxes of the residential parking areas (oblasti rezidentního parkování,
//                   CC BY-SA 4.0), in the format of tools/build_zps.mjs
//   budovy/<ix>_<iy>.json  KAM průzkum budov (floors, roof floors, roof, use; CC BY), 0.005° tiles
// With the OSM tile directory, the city's trees (pasport zeleně), street lamps (veřejné osvětlení) and
// benches (mobiliář městských částí), all CC BY, are added to the OSM tiles as nodes, except where
// OSM already has the same thing within DEDUP m.
import fs from "node:fs";
import path from "node:path";

const OD = "https://services6.arcgis.com/fUWVlHWZNxUvTUh8/arcgis/rest/services";
const GIS = "https://gis.brno.cz/ags1/rest/services";
const TILE = 0.005; // as the OSM tiles
const DEDUP = 3; // m

const [outDir, osmDir] = process.argv.slice(2);
if (!outDir) {
  console.error("použití: node tools/build_brno_data.mjs <výstup> [dlaždice OSM]");
  process.exit(1);
}

// All features of a layer as GeoJSON in WGS 84, page by page.
async function all(layer, where = "1=1", outFields = "*") {
  const out = [];
  for (let offset = 0; ; ) {
    const q = new URLSearchParams({ where, outFields, outSR: "4326", f: "geojson", resultOffset: offset, resultRecordCount: 2000, orderByFields: "" });
    let json;
    for (let i = 0; ; i++) {
      try {
        const r = await fetch(`${layer}/query?${q}`, { signal: AbortSignal.timeout(60000) });
        if (!r.ok) throw new Error(`${r.status}`);
        json = await r.json();
        if (json.error) throw new Error(json.error.message);
        break;
      } catch (err) {
        if (i >= 3) throw new Error(`${layer}: ${err.message}`);
        await new Promise((res) => setTimeout(res, 3000 * (i + 1)));
      }
    }
    out.push(...json.features);
    if (!json.features.length || !(json.exceededTransferLimit || json.properties?.exceededTransferLimit)) break;
    offset += json.features.length;
  }
  console.log(`${layer.split("/services/")[1]}: ${out.length}`);
  return out;
}

const round = (v) => +v.toFixed(7);
const polysOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
const ringsBox = (rings) => {
  const xs = rings.flat().map((p) => p[0]), ys = rings.flat().map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
const tilesOfBox = ([x0, y0, x1, y1]) => {
  const out = [];
  for (let ix = Math.floor(x0 / TILE); ix <= Math.floor(x1 / TILE); ix++) for (let iy = Math.floor(y0 / TILE); iy <= Math.floor(y1 / TILE); iy++) out.push(`${ix}_${iy}`);
  return out;
};

fs.mkdirSync(outDir, { recursive: true });

// Paid parking sections still valid today (the layer keeps old ones with their end date).
const now = Date.now();
const sections = (await all(`${OD}/useky_placeneho_stani/FeatureServer/0`, "1=1", "platnostdo"))
  .filter((f) => !f.properties.platnostdo || f.properties.platnostdo > now);
const parking = { features: sections.flatMap((f) => polysOf(f.geometry).map((p) => ({
  attributes: { KIND: "useky" },
  geometry: { rings: p.map((r) => r.map(([x, y]) => [round(x), round(y)])) },
}))) };
fs.writeFileSync(path.join(outDir, "parkovani.json"), JSON.stringify(parking));

const areas = await all(`${OD}/parkovaci_oblasti/FeatureServer/0`, "1=1", "oblast_t,platnostdo");
const boxes = areas.filter((f) => !f.properties.platnostdo || f.properties.platnostdo > now)
  .flatMap((f) => polysOf(f.geometry).map((p) => ringsBox(p).map(round)));
fs.writeFileSync(path.join(outDir, "zps.json"), JSON.stringify({ source: "Parkovací oblasti rezidentního parkování, © Statutární město Brno, CC BY-SA 4.0", boxes }));

// Buildings: floors (npodl), roof floors (strpodl), roof shape and the use of the ground floor.
// Roofs as IPR's codes (profile.js IPR_ROOF): 1 pitched, 3 flat, 4 mixed.
const ROOF = { "rovná střecha": 3, "rovná stŕecha": 3, "šikmá střecha": 1, "využité podkroví": 1, kombinace: 4 };
const buildings = await all(`${GIS}/Hosted/KAM_pruzkum_budov_OD_WGS_Projekt/FeatureServer/0`, "1=1", "npodl,strpodl,strecha,np1_1f");
const bTiles = new Map();
for (const f of buildings) {
  const p = f.properties;
  for (const poly of polysOf(f.geometry)) {
    const rings = poly.map((r) => r.map(([x, y]) => [round(x), round(y)]));
    const rec = [p.npodl || 0, p.strpodl || 0, ROOF[p.strecha] || 0, p.np1_1f || "", rings];
    for (const k of tilesOfBox(ringsBox(rings))) {
      if (!bTiles.has(k)) bTiles.set(k, []);
      bTiles.get(k).push(rec);
    }
  }
}
const bDir = path.join(outDir, "budovy");
fs.rmSync(bDir, { recursive: true, force: true });
fs.mkdirSync(bDir, { recursive: true });
for (const [k, recs] of bTiles) fs.writeFileSync(path.join(bDir, `${k}.json`), JSON.stringify(recs));
console.log(`budovy: ${bTiles.size} dlaždic`);

if (osmDir) {
  const points = (features, tags) => features.flatMap((f) => (f.geometry?.type === "MultiPoint" ? f.geometry.coordinates : f.geometry?.type === "Point" ? [f.geometry.coordinates] : [])
    .map(([lon, lat]) => ({ lon, lat, tags })));
  const trees = points(await all(`${OD}/stromy_kere/FeatureServer/0`, "druh_bio_kod LIKE 'Soliterní stromy%' OR druh_bio_kod LIKE 'Stromy%'", "druh_bio_kod"), { natural: "tree", source: "Brno" });
  const lamps = points(await all(`${GIS}/ODAE/ODAE_street_lights/FeatureServer/0`, "typ_sv__místa = 'Stožár'", "objectid"), { highway: "street_lamp", source: "Brno" });
  const benches = points(await all(`${OD}/mobiliar_nabytek_a_vybaveni/FeatureServer/0`, "typ_tid = 'Lavičky, sedátka'", "typ_tid"), { amenity: "bench", source: "Brno" });
  const same = (a, b) => (a.natural === "tree" && b.natural === "tree") || (a.highway === "street_lamp" && b.highway === "street_lamp") || (a.amenity === "bench" && b.amenity === "bench");
  const near = (a, b) => Math.hypot((a.lon - b.lon) * 72900, (a.lat - b.lat) * 111200) < DEDUP;
  let added = 0, skipped = 0, id = -1;
  const byTile = new Map();
  for (const pt of [...trees, ...lamps, ...benches]) {
    const k = `${Math.floor(pt.lon / TILE)}_${Math.floor(pt.lat / TILE)}`;
    if (!byTile.has(k)) byTile.set(k, []);
    byTile.get(k).push(pt);
  }
  for (const [k, pts] of byTile) {
    const file = path.join(osmDir, `${k}.json`);
    let els = [];
    try { els = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    const nodes = els.filter((e) => e.type === "node").map((e) => ({ ...e.geometry[0], tags: e.tags }));
    for (const pt of pts) {
      if (nodes.some((n) => same(n.tags, pt.tags) && near(n, pt))) { skipped++; continue; }
      els.push({ type: "node", id: id--, tags: pt.tags, geometry: [{ lat: round(pt.lat), lon: round(pt.lon) }] });
      nodes.push(pt);
      added++;
    }
    fs.writeFileSync(file, JSON.stringify(els));
  }
  console.log(`stromy, lampy a lavičky: ${added} přidáno do dlaždic OSM, ${skipped} už v OSM bylo`);
}
