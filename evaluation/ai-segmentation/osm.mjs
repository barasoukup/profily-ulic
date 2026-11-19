// OSM around each patch from the app's own tiles (the packs on R2, as a cut reads them): the hints the model gets
// besides the photo (lines of streets, paths, cycle ways and tram tracks; buildings, green, parking).
//   node evaluation/ai-segmentation/osm.mjs praha
// Writes data/ai-seg/patches/<city>/<n>.osm.json.
import fs from "node:fs";
import { setCity, sources } from "./labels-lib.mjs";
import { CITIES } from "./sample.mjs";

const ROOT = new URL("../../../../../data/ai-seg/patches/", import.meta.url);
const ROADS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "service",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "busway", "road"]);
const FOOT = new Set(["footway", "path", "pedestrian", "steps", "track", "bridleway", "corridor"]);
const GREEN = (t) => ["grass", "meadow", "village_green", "forest", "cemetery", "allotments", "recreation_ground", "flowerbed"].includes(t.landuse)
  || ["park", "garden", "playground", "pitch"].includes(t.leisure) || ["wood", "scrub", "grassland", "heath"].includes(t.natural);

// Which hint an element gives (null: none). Bridges and tunnels are left out (not what the photo shows at ground).
export function kind(e) {
  const t = e.tags || {};
  if (t.tunnel && t.tunnel !== "no") return null;
  if (Number(t.layer) < 0 || Number(t.level) < 0) return null;
  if (e.type === "way") {
    if (t.railway === "tram") return "tram";
    if (t.highway === "cycleway") return "cycle";
    if (FOOT.has(t.highway)) return "foot";
    if (ROADS.has(t.highway)) return "road";
  }
  if (e.type === "area") {
    if (t.building) return "building";
    if (t.amenity === "parking") return "parking";
    if (t.highway === "pedestrian" || t["area:highway"]) return "foot";
    if (GREEN(t)) return "green";
  }
  return null;
}

// The hints of OSM elements around a box (lon0, lat0, lon1, lat1): only what reaches the box (and 20 % around it).
export function hintsOf(elements, box) {
  const [x0, y0, x1, y1] = box, mx = (x1 - x0) * 0.2, my = (y1 - y0) * 0.2;
  const hints = [];
  for (const e of elements || []) {
    const k = kind(e);
    if (!k || !e.geometry?.length) continue;
    const pts = e.geometry.map((g) => [+g.lon.toFixed(7), +g.lat.toFixed(7)]);
    if (!pts.some(([x, y]) => x > x0 - mx && x < x1 + mx && y > y0 - my && y < y1 + my) && pts.length < 50) continue;
    const t = e.tags || {};
    hints.push({ k, pts, ...(t.lanes && { lanes: Number(t.lanes) || undefined }), ...(e.type === "way" && t.highway && { hw: t.highway }) });
  }
  return hints;
}

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

async function main() {
  const id = process.argv[2];
  setCity(CITIES[id].city);
  const dir = new URL(`${id}/`, ROOT);
  const files = fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f));
  let done = 0;
  for (const f of files) {
    const out = new URL(f.replace(".json", ".osm.json"), dir);
    if (fs.existsSync(out)) continue;
    const p = JSON.parse(fs.readFileSync(new URL(f, dir)));
    const j = await sources.osm(p.lat, p.lon, 60);
    fs.writeFileSync(out, JSON.stringify(hintsOf(j.elements, p.box)));
    if (++done % 50 === 0) console.log(`${id}: ${done}`);
  }
  console.log(`${id}: osm for ${files.length} patches`);
}
