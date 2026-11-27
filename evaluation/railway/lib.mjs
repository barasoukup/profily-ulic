// Offline reading of the OSM packs (pilot/data/osm-pack, local files of all states) for the railway measurement
// (Bára 27. 11. 2026): the ways around a point, without the browser and without any query.
import fs from "node:fs/promises";
import path from "node:path";
import { Pack } from "../../pilot/public/osmpack.js";
import { TILE, mergePieces } from "../../pilot/public/osmtile.js";

const DIR = process.env.OSM_PACK || path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "pilot", "data", "osm-pack");
const packs = new Map();
export async function pack(code) {
  if (!packs.has(code)) {
    const idx = JSON.parse(await fs.readFile(path.join(DIR, "index.json"), "utf8"));
    const fh = await fs.open(path.join(DIR, idx.files[code]), "r");
    const read = async (s, e) => { const b = Buffer.alloc(e - s + 1); const { bytesRead } = await fh.read(b, 0, b.length, s); return { bytes: new Uint8Array(b.buffer, 0, bytesRead) }; };
    packs.set(code, new Pack(read));
  }
  return packs.get(code);
}
export const tileOf = (lon, lat) => [Math.floor(lon / TILE), Math.floor(lat / TILE)];
// Elements (merged pieces) of the tiles of a box [lon0, lat0, lon1, lat1] from the pack of a state.
export async function elementsIn(code, box) {
  const p = await pack(code), [x0, y0] = tileOf(box[0], box[1]), [x1, y1] = tileOf(box[2], box[3]), names = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) names.push(`${x}_${y}`);
  return mergePieces(await p.tiles(names));
}
export const RAIL = new Set(["rail", "light_rail", "narrow_gauge", "subway"]);
