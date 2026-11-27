// A trial without rebuilding the OSM packs: adds the bridge decks (man_made=bridge polygons) to a local pack the way
// tools/build_osm_tiles.mjs now keeps them (tools/osm_areas.mjs), and packs it again (tools/pack_osm_tiles.mjs).
// The decks come from the local extract with osmium:
//   osmium tags-filter -o pl-br.pbf data/osm/pl/pl.osm.pbf a/man_made=bridge
//   osmium export -a type,id -f geojsonseq --geometry-types=polygon -o pl.geojsonl pl-br.pbf
//   node evaluation/archive/bridge-water/edge/patch-pack.mjs <in.posm> <decks.geojsonl> <out.posm>
// The deploy builds them in (tools/build_osm_data.sh, layer "bridges") once the workflow rebuilds the packs.
import fs from "node:fs";
import zlib from "node:zlib";
import { packTiles } from "../../../../tools/pack_osm_tiles.mjs";
import { tilePieces, BRIDGE_AREA, bridgeTags } from "../../../../tools/osm_areas.mjs";

const [inFile, decksFile, outFile] = process.argv.slice(2);
const buf = fs.readFileSync(inFile);
if (buf.toString("ascii", 0, 4) !== "POSM") throw new Error("není soubor dlaždic OSM");
const headLen = buf.readUInt32LE(8), base = 12 + headLen;
const head = JSON.parse(zlib.gunzipSync(buf.subarray(12, base)).toString());
const B = head.block, T = ["w", "a", "n", "a"];
const tiles = new Map(); // name → [osmtile line objects]
for (const [bx, by, leafAt, leafLen, dataAt] of head.blocks) {
  const lengths = zlib.gunzipSync(buf.subarray(base + leafAt, base + leafAt + leafLen));
  let at = base + dataAt;
  for (let i = 0; i < B * B; i++) {
    const len = lengths.readUInt32LE(i * 4);
    if (!len) continue;
    const ix = bx * B + (i % B), iy = by * B + Math.floor(i / B);
    const arr = JSON.parse(zlib.gunzipSync(buf.subarray(at, at + len)).toString());
    at += len;
    tiles.set(`${ix}_${iy}`, arr.map(([type, id, tagList, g = [], o, h]) => {
      const k = {};
      for (let j = 0; j < tagList.length; j++) {
        const t = tagList[j];
        if (typeof t === "number" && t >= 0) { const [ki, v] = head.pairs[t]; k[head.keys[ki]] = v; }
        else k[typeof t === "number" ? head.keys[-1 - t] : t] = tagList[++j];
      }
      const step = type === 3 ? 500 : 5000, gg = [...g];
      if (gg.length) { gg[0] += ix * step; gg[1] += iy * step; }
      const el = { t: T[type], i: id, k, g: gg };
      if (o !== undefined && o !== null) el.o = o;
      if (h) el.h = h;
      if (type === 3) el.q = 5;
      return el;
    }));
  }
}
let added = 0, decks = 0;
for (const line of fs.readFileSync(decksFile, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const f = JSON.parse(line.replace(/^\x1e/, ""));
  const tags = f.properties || {};
  if (!BRIDGE_AREA(tags)) continue;
  decks++;
  const id = Number(tags["@id"]) || 0;
  const g = f.geometry;
  for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
    // Only tiles the pack has (build_osm_tiles.mjs: the tiles a road runs through).
    for (const [key, el] of tilePieces(poly, id, bridgeTags(tags), (k) => tiles.has(k))) { tiles.get(key).push(el); added++; }
  }
}
const names = [...tiles.keys()];
const r = packTiles(names, (n) => tiles.get(n).map((e) => JSON.stringify(e)).join("\n") + "\n", { source: `${head.source || ""}+bridges` });
fs.writeFileSync(outFile, r.file);
console.log(`${decks} mostů, ${added} kusů v dlaždicích; ${names.length} dlaždic → ${outFile} ${(r.file.length / 1e6).toFixed(1)} MB (dřív ${(buf.length / 1e6).toFixed(1)} MB)`);
