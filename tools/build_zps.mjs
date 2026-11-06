// Downloads the paid parking zones of Prague (TSK, "Zóny placeného stání vymezené tarifem", IPR
// service dop/zony_placeneho_stani/MapServer/10) once and keeps only their bounding boxes:
// the app needs just "is a zone within 100 m", so it never asks IPR for zones on a click.
//   node tools/build_zps.mjs [out.json]   (default pilot/data/zps.json)
// Output: {source, built, boxes: [[lon0, lat0, lon1, lat1], …]}. © TSK hl. m. Prahy / IPR Praha.
import fs from "node:fs";
import path from "node:path";

const LAYER = "https://gs-pub.praha.eu/arcgis/rest/services/dop/zony_placeneho_stani/MapServer/10/query";
const out = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), "..", "pilot", "data", "zps.json");
const PAGE = 1000;

const boxes = [];
for (let offset = 0; ; offset += PAGE) {
  const params = new URLSearchParams({
    where: "1=1", outFields: "OBJECTID_1", outSR: "4326", returnGeometry: "true",
    maxAllowableOffset: "0.00005", geometryPrecision: "5", resultOffset: String(offset), resultRecordCount: String(PAGE), f: "json",
  });
  let json;
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`${LAYER}?${params}`, { headers: { "User-Agent": "profily-ulic build" }, signal: AbortSignal.timeout(60000) });
      json = await r.json();
      if (json.error) throw new Error(`${json.error.code} ${json.error.message}`);
      break;
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((res) => setTimeout(res, 5000 * (attempt + 1)));
    }
  }
  for (const f of json.features || []) {
    const pts = (f.geometry?.rings || []).flat();
    if (!pts.length) continue;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    boxes.push([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((v) => +v.toFixed(5)));
  }
  if (!json.exceededTransferLimit || !(json.features || []).length) break;
}
if (boxes.length < 100) throw new Error(`only ${boxes.length} zones, not writing ${out}`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ source: "TSK hl. m. Prahy / IPR Praha, zóny placeného stání", built: new Date().toISOString().slice(0, 10), boxes }));
console.log(`${boxes.length} zones → ${out}`);
