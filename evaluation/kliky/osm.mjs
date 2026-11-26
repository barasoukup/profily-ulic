// The OSM elements of a click without a server or a browser: the app's own reader (pilot/public/osmpack.js, osmtile.js) over
// the packs on disk (pilot/data/osm-pack/index.json; the pack of Washington, which this branch does not have, by KLIKY_PACKS),
// and Washington's alleys, which its module adds to them as areas (DC Planimetrics, one cached request a place).
import fs from "node:fs/promises";
import path from "node:path";
import { Pack } from "../../pilot/public/osmpack.js";
import { TILE, mergePieces } from "../../pilot/public/osmtile.js";
export const ROOT = path.dirname(new URL(import.meta.url).pathname);
const AT = path.join(ROOT, "../../pilot/data/osm-pack");
const DC = process.env.KLIKY_PACKS || path.join(ROOT, "../../../agent-a29244ef82f1b8e80/pilot/data/osm-pack/us_dc-novy.posm");
const fileRead = (file) => { let fh; return async (a, b) => { fh ??= await fs.open(file); const buf = Buffer.alloc(b - a + 1), { bytesRead } = await fh.read(buf, 0, buf.length, a); return { bytes: new Uint8Array(buf.buffer, buf.byteOffset, bytesRead), etag: "1" }; }; };
let packs;
const open = async () => (packs ??= (async () => {
  const { files, bbox = {} } = JSON.parse(await fs.readFile(path.join(AT, "index.json"), "utf8"));
  const list = Object.entries(files).map(([code, f]) => ({ code, box: bbox[code], pack: new Pack(fileRead(path.join(AT, f))) }));
  if (await fs.stat(DC).catch(() => null)) list.push({ code: "us_dc", box: null, dc: true, pack: new Pack(fileRead(DC)) });
  return list;
})());
export async function tiles(names) {
  const ij = names.map((n) => n.split("_").map(Number)), lists = [];
  for (const p of await open()) {
    if (p.dc ? !ij.some(([x]) => x < 0) : p.box && !ij.some(([x, y]) => x >= p.box[0] && x <= p.box[2] && y >= p.box[1] && y <= p.box[3])) continue;
    lists.push(await p.pack.tiles(names).catch(() => names.map(() => [])));
  }
  return names.flatMap((_, i) => lists.map((l) => l[i]).filter((e) => e.length));
}
export const isDC = (lat, lon) => lat > 38.79 && lat < 39 && lon > -77.12 && lon < -76.9;
async function alleys(lat, lon, radius) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), dx = radius / kx, dy = radius / 110574;
  const bbox = [lon - dx, lat - dy, lon + dx, lat + dy].map((x) => x.toFixed(6)).join(",");
  const file = path.join(ROOT, "data", `dc-${bbox.replace(/,/g, "_")}.json`);
  let json = JSON.parse(await fs.readFile(file, "utf8").catch(() => "null"));
  if (!json) {
    await new Promise((r) => setTimeout(r, 400));
    const q = new URLSearchParams({ f: "json", geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: 4326, outSR: 4326, spatialRel: "esriSpatialRelIntersects", where: "DESCRIPTION = 'Alley'", outFields: "DESCRIPTION", returnGeometry: "true" });
    json = await (await fetch(`https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Planimetrics_2023/MapServer/10/query?${q}`)).json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    await fs.writeFile(file, JSON.stringify(json));
  }
  return (json.features || []).filter((f) => f.geometry?.rings?.length)
    .map((f, k) => ({ type: "area", id: -(k + 1), tags: { service: "alley", source: "DC Planimetrics" }, geometry: f.geometry.rings[0].map(([x, y]) => ({ lat: y, lon: x })) }));
}
export async function osmAt(lat, lon, radius = 80, withAlleys = true) {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++)
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  const elements = mergePieces(await tiles(names));
  return { elements: withAlleys && isDC(lat, lon) ? [...elements, ...await alleys(lat, lon, radius)] : elements };
}
