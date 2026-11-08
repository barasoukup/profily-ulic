// Building shape (blockShape in derive.js) of OSM apartment buildings with a known period:
// built 1925–1945 (functionalist tenements) versus 1958–1990 (panel estates), and the ones tagged
// building:architecture=functionalism. Reads data/osm/praha_buildings.geojsonl and the OSM tiles.
// Usage: node evaluation/budovy-typ/labels.mjs > evaluation/budovy-typ/labels.tsv
import fs from "node:fs";
import readline from "node:readline";
import { localFrame, buildingAt } from "../../pilot/public/derive.js";

const TILE = 0.005;
const tiles = new Map();
const tile = (n) => {
  if (!tiles.has(n)) { try { tiles.set(n, JSON.parse(fs.readFileSync(`pilot/data/osm-tiles/${n}.json`, "utf8"))); } catch { tiles.set(n, []); } }
  return tiles.get(n);
};
const around = (lat, lon) => {
  const els = [], seen = new Set();
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    for (const el of tile(`${Math.floor(lon / TILE) + dx}_${Math.floor(lat / TILE) + dy}`)) {
      const k = el.id + ":" + el.geometry[0].lat; if (seen.has(k)) continue; seen.add(k); els.push(el);
    }
  }
  return { elements: els };
};
const CENTRE = [14.4208, 50.0875];
const rows = [];
const rl = readline.createInterface({ input: fs.createReadStream("data/osm/praha_buildings.geojsonl") });
for await (const line of rl) {
  const j = JSON.parse(line), p = j.properties, ot = p.other_tags || "";
  if (!["apartments", "residential"].includes(p.building)) continue;
  const y = +(ot.match(/"start_date"=>"(\d{4})/)?.[1] || 0);
  const fun = /architecture"=>"functionalism/.test(ot);
  const label = fun ? "funkce-tag" : y >= 1925 && y <= 1945 ? "1925-45" : y >= 1958 && y <= 1990 ? "1958-90" : null;
  if (!label) continue;
  const ring = j.geometry.type === "MultiPolygon" ? j.geometry.coordinates[0][0] : j.geometry.coordinates[0];
  const lon = ring.reduce((a, c) => a + c[0], 0) / ring.length, lat = ring.reduce((a, c) => a + c[1], 0) / ring.length;
  const frame = localFrame(lat, lon);
  const b = buildingAt(around(lat, lon), frame, [0, 0]);
  if (!b?.block) continue;
  const levels = +(ot.match(/"building:levels"=>"(\d+)/)?.[1] || 0);
  const km = Math.hypot((lon - CENTRE[0]) * 71.5, (lat - CENTRE[1]) * 111.2);
  const { length, width, fill, parts } = b.block;
  rows.push([label, y, levels, km.toFixed(1), length, width, fill, parts, ((length + width) / parts).toFixed(1), lat.toFixed(6), lon.toFixed(6)].join("\t"));
}
console.log(["label", "year", "levels", "km", "length", "width", "fill", "parts", "perPart", "lat", "lon"].join("\t"));
console.log(rows.join("\n"));
