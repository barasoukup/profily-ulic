// 1000 cuts on real streets of Slovakia (Bára 16. 11. 2026: "více zaměřit na cesty, které jsou fakt ulice", not the
// paths and service roads of some premises): the random points of sample.mjs (same towns, same seed), each moved to
// the nearest point of a named street of the classes below within 250 m (else dropped), until 1000; at most two
// points on the same street. Reads the local OSM pack (app/data/osm-pack, tools/pack_osm_tiles.mjs).
//   node evaluation/slovakia/check/sample-streets.mjs   → vzorek-ulice.json
import fs from "node:fs";
import { PackSet } from "../../../app/public/osmpack.js";
import { mergePieces, TILE } from "../../../app/public/osmtile.js";

const PACK = new URL("../../../app/data/osm-pack/", import.meta.url);
// The pack reader asks by HTTP with a Range header; here the files are read from the disk.
const fileFetch = async (url, opts = {}) => {
  const path = new URL(String(url).replace(/^pack:\/\//, ""), PACK);
  const buf = fs.readFileSync(path);
  const m = /bytes=(\d+)-(\d+)/.exec(opts.headers?.Range || "");
  const body = m ? buf.subarray(+m[1], +m[2] + 1) : buf;
  return { ok: true, status: m ? 206 : 200, headers: { get: () => null }, json: async () => JSON.parse(buf), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) };
};
const packs = new PackSet(["pack://."], { fetch: fileFetch });
const STREETS = new Set(["primary", "secondary", "tertiary", "residential", "unclassified", "living_street", "trunk", "primary_link", "secondary_link", "tertiary_link"]);
const R = 250;

async function around(lat, lon) {
  const dLat = R / 110574, dLon = R / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++)
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  return mergePieces(await packs.tiles(names));
}

// The towns and the seed of sample.mjs, with more points drawn than needed (some fall far from any street).
// STAT=cz: a small Czech sample for the A/B of the steps that run in app.js (towns with their own services, few in
// Prague to spare IPR), written to vzorek-ulice-cz.json.
const CZ = process.env.STAT === "cz";
const TOWNS = CZ ? { brno: 60, plzen: 40, ostrava: 40, jihlava: 25, opava: 15, praha: 20 }
  : JSON.parse(fs.readFileSync(new URL("vzorek.json", import.meta.url))).reduce((a, p) => ((a[p.town] = (a[p.town] || 0) + 1), a), {});
const CENTRES = { bratislava: [48.1440, 17.1100, 4000], kosice: [48.7190, 21.2580, 3000], presov: [48.9980, 21.2400, 2000], zilina: [49.2230, 18.7400, 2000],
  nitra: [48.3120, 18.0870, 2000], "banska-bystrica": [48.7360, 19.1460, 2000], trnava: [48.3774, 17.5883, 2000], trencin: [48.8945, 18.0444, 2000],
  martin: [49.0665, 18.9230, 1800], poprad: [49.0555, 20.2975, 1800], zvolen: [48.5762, 19.1371, 1200], piestany: [48.5918, 17.8273, 1200],
  michalovce: [48.7543, 21.9195, 1200], "spisska-nova-ves": [48.9446, 20.5615, 1200], komarno: [47.7631, 18.1295, 1200], levice: [48.2153, 18.6070, 1200],
  lucenec: [48.3298, 19.6667, 1200], humenne: [48.9371, 21.9163, 1200], bardejov: [49.2918, 21.2727, 1200], "liptovsky-mikulas": [49.0811, 19.6113, 1200],
  ruzomberok: [49.0748, 19.3006, 1200], "dunajska-streda": [47.9926, 17.6172, 1200], topolcany: [48.5617, 18.1775, 1200],
  "povazska-bystrica": [49.1214, 18.4206, 1200], roznava: [48.6608, 20.5323, 1200], senica: [48.6797, 17.3667, 1200],
  brno: [49.1951, 16.6085, 3000], plzen: [49.7477, 13.3776, 2500], ostrava: [49.8355, 18.2924, 3000], jihlava: [49.3961, 15.5912, 1500],
  opava: [49.9387, 17.9026, 1500], praha: [50.0875, 14.4208, 5000] };
let seed = 20261117;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const out = [];
for (const [town, want] of Object.entries(TOWNS)) {
  const [lat0, lon0, Rt] = CENTRES[town];
  const perStreet = {};
  let got = 0, tries = 0;
  while (got < want && tries++ < want * 6) {
    const r = Rt * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const lat = lat0 + (r * Math.cos(a)) / 111320, lon = lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180));
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
    let best = null;
    for (const el of await around(lat, lon)) {
      const t = el.tags || {};
      if (el.type !== "way" || !STREETS.has(t.highway) || !t.name || t.tunnel || t.covered === "yes" || (+t.layer || 0) < 0) continue;
      const g = el.geometry;
      for (let i = 0; i + 1 < g.length; i++) {
        const ax = (g[i].lon - lon) * kx, ay = (g[i].lat - lat) * ky, bx = (g[i + 1].lon - lon) * kx, by = (g[i + 1].lat - lat) * ky;
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, u = l ? Math.max(0.2, Math.min(0.8, -(ax * dx + ay * dy) / l)) : 0.5;
        const px = ax + u * dx, py = ay + u * dy, d = Math.hypot(px, py);
        if (d <= R && (!best || d < best.d)) best = { d, lat: lat + py / ky, lon: lon + px / kx, name: t.name, highway: t.highway };
      }
    }
    if (!best || (perStreet[best.name] || 0) >= 2) continue;
    perStreet[best.name] = (perStreet[best.name] || 0) + 1;
    out.push({ id: out.length + 1, town, lat: +best.lat.toFixed(6), lon: +best.lon.toFixed(6), street: best.name, highway: best.highway });
    got++;
  }
}
fs.writeFileSync(new URL(CZ ? "vzorek-ulice-cz.json" : "vzorek-ulice.json", import.meta.url), JSON.stringify(out));
const by = out.reduce((a, p) => ((a[p.highway] = (a[p.highway] || 0) + 1), a), {});
console.log(out.length, "bodů na ulicích", JSON.stringify(by));
