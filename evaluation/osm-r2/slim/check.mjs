// The slim packs (tools/osm_slim.mjs) against the full ones at the cuts of the samples: what the app gets from the tiles
// around a cut (gis.js osmTiles: the tiles within 80 m, mergePieces) must be the same elements in the same order, with the
// same geometry and the same tags, but for what the slimming takes by design: the id of an area or a point (0) and the
// keys of osm_slim.mjs DROP_KEY. Any other difference is listed.
//   node evaluation/osm-r2/slim/check.mjs pilot/data/osm-pack pilot/data/osm-pack-slim sample.json …
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { PackSet } from "../../../pilot/public/osmpack.js";
import { mergePieces, TILE } from "../../../pilot/public/osmtile.js";
import { DROP_KEY } from "../../../tools/osm_slim.mjs";

const [fullDir, slimDir, ...samples] = process.argv.slice(2);
const fileFetch = (dir) => async (url, opts = {}) => {
  const buf = fs.readFileSync(path.join(dir, String(url).replace(/^pack:\/\/\.\//, "")));
  const m = /bytes=(\d+)-(\d+)/.exec(opts.headers?.Range || "");
  const body = m ? buf.subarray(+m[1], +m[2] + 1) : buf;
  return { ok: true, status: m ? 206 : 200, headers: { get: () => null }, json: async () => JSON.parse(buf), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) };
};
const full = new PackSet(["pack://."], { fetch: fileFetch(fullDir) }), slim = new PackSet(["pack://."], { fetch: fileFetch(slimDir) });
const around = (lat, lon, r = 80) => {
  const dLat = r / 110574, dLon = r / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++)
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  return names;
};
// What the slimming may change: an area's or a point's id, the dropped keys.
const bare = (el) => ({ ...el, id: el.type === "way" ? el.id : 0, tags: Object.fromEntries(Object.entries(el.tags).filter(([k]) => !DROP_KEY.test(k))) });
let cuts = 0, same = 0, els = 0, ids = 0, tags = 0;
for (const f of samples) {
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const s of Array.isArray(j) ? j : j.samples) {
    const lat = s.lat ?? s.point?.[0], lon = s.lon ?? s.point?.[1];
    if (!Number.isFinite(lat)) continue;
    const names = around(lat, lon);
    const a = mergePieces(await full.tiles(names)), b = mergePieces(await slim.tiles(names));
    cuts++;
    els += a.length;
    const ok = a.length === b.length && a.every((x, i) => isDeepStrictEqual(bare(x), bare(b[i])));
    if (ok) same++; else console.log("jiný řez", f, s.id ?? "", lat, lon, a.length, b.length);
    a.forEach((x, i) => { if (b[i] && x.id !== b[i].id) ids++; if (b[i] && Object.keys(x.tags).length !== Object.keys(b[i].tags).length) tags++; });
  }
}
console.log(`řezy: ${same} z ${cuts} stejné (${els} prvků OSM; jiné id ${ids}, ubrané klíče u ${tags} prvků)`);
if (same < cuts) process.exit(1);
