// Downloads IPR's "Vývoj zástavby v Praze v letech 1840–2010" (built-up area in 1840, 1880, 1920,
// 1950, 1970, 1990 and 2010; URK_CUR_URK_VYVOJZASTAVBY_P, CC BY) once and cuts it into tiles, so
// the app finds the age of the area around a building without asking IPR on a click.
//   node tools/build_vyvoj.mjs [out-dir]   (default pilot/data/vyvoj)
// Output: <out-dir>/<ix>_<iy>.json (TILE degrees, as the OSM tiles) with [[year, [rings]], …]
// for every polygon whose bounding box touches the tile. © IPR Praha.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LAYER = "https://mp.iprpraha.cz/arcgis/rest/services/Hosted/URK_CUR_URK_VYVOJZASTAVBY_P/FeatureServer/0/query";
const out = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "pilot", "data", "vyvoj");
const PAGE = 2000, TILE = 0.01;

const polys = [];
for (let offset = 0; ; offset += PAGE) {
  const params = new URLSearchParams({
    where: "1=1", outFields: "rok", outSR: "4326", returnGeometry: "true", orderByFields: "objectid",
    maxAllowableOffset: "0.00001", geometryPrecision: "6", resultOffset: String(offset), resultRecordCount: String(PAGE), f: "json",
  });
  let json;
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`${LAYER}?${params}`, { headers: { "User-Agent": "profily-ulic build" }, signal: AbortSignal.timeout(90000) });
      json = await r.json();
      if (json.error) throw new Error(`${json.error.code} ${json.error.message}`);
      break;
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((res) => setTimeout(res, 5000 * (attempt + 1)));
    }
  }
  for (const f of json.features || []) {
    const rings = f.geometry?.rings;
    if (rings?.length && f.attributes?.rok) polys.push([f.attributes.rok, rings]);
  }
  if (!json.exceededTransferLimit || !(json.features || []).length) break;
}
if (polys.length < 10000) throw new Error(`only ${polys.length} polygons, not writing ${out}`);

const tiles = new Map();
for (const p of polys) {
  const pts = p[1].flat();
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  for (let ix = Math.floor(Math.min(...xs) / TILE); ix <= Math.floor(Math.max(...xs) / TILE); ix++) {
    for (let iy = Math.floor(Math.min(...ys) / TILE); iy <= Math.floor(Math.max(...ys) / TILE); iy++) {
      const k = `${ix}_${iy}`;
      if (!tiles.has(k)) tiles.set(k, []);
      tiles.get(k).push(p);
    }
  }
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const [k, list] of tiles) fs.writeFileSync(path.join(out, `${k}.json`), JSON.stringify(list));
console.log(`${polys.length} polygons in ${tiles.size} tiles → ${out}`);
