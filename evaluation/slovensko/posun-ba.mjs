// How far Bratislava's passport of roadways lies from OSM (and the ZBGIS orthophoto OSM is traced on): the hold-out set
// of 19. 11. 2026 found the estimate's street 1.2 m off the passport's, along the cut, in Bratislava only. Here: the
// roadway polygons of the magistrát (one bbox, a few requests) against the axes of OSM's streets inside them: at each
// axis point the polygon's middle across the street, the offset along the normal; a 2-D shift fitted to all of them.
//   node evaluation/slovensko/posun-ba.mjs [lon0,lat0,lon1,lat1]
import fs from "node:fs";
import path from "node:path";
import { PackSet } from "../../app/public/osmpack.js";
import { mergePieces, TILE } from "../../app/public/osmtile.js";

const BOX = (process.argv[2] || "17.095,48.135,17.135,48.160").split(",").map(Number);
const URL0 = "https://services8.arcgis.com/pRlN1m0su5BYaFAS/arcgis/rest/services/Vozovka_technick%C3%BD_stav_pod%C4%BEa_OSK_zobrazenie/FeatureServer/0/query";
const feats = [];
for (let offset = 0; offset < 20000; offset += 2000) {
  const q = new URLSearchParams({ where: "1=1", geometry: BOX.join(","), geometryType: "esriGeometryEnvelope", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
    outFields: "OBJECTID", returnGeometry: "true", outSR: "4326", f: "json", resultOffset: String(offset), resultRecordCount: "2000" });
  const j = await (await fetch(`${URL0}?${q}`)).json();
  feats.push(...(j.features || []));
  if (!j.exceededTransferLimit) break;
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(feats.length, "ploch vozovky");
const lat0 = (BOX[1] + BOX[3]) / 2, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
const xy = ([lon, lat]) => [(lon - BOX[0]) * kx, (lat - BOX[1]) * ky];
const rings = feats.flatMap((f) => (f.geometry?.rings || []).map((r) => r.map(xy)));

const PACK = path.join(path.dirname(new URL(import.meta.url).pathname), "../../app/data/osm-pack/");
const fileFetch = async (url, opts = {}) => {
  const buf = fs.readFileSync(path.join(PACK, String(url).replace(/^pack:\/\/\.?\/?/, "")));
  const m = /bytes=(\d+)-(\d+)/.exec(opts.headers?.Range || "");
  const body = m ? buf.subarray(+m[1], +m[2] + 1) : buf;
  return { ok: true, status: m ? 206 : 200, headers: { get: () => null }, json: async () => JSON.parse(buf), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) };
};
const packs = new PackSet(["pack://."], { fetch: fileFetch });
const names = [];
for (let ix = Math.floor(BOX[0] / TILE); ix <= Math.floor(BOX[2] / TILE); ix++) for (let iy = Math.floor(BOX[1] / TILE); iy <= Math.floor(BOX[3] / TILE); iy++) names.push(`${ix}_${iy}`);
const els = mergePieces(await packs.tiles(names));
const ROADS = new Set(["primary", "secondary", "tertiary", "residential", "unclassified", "living_street"]);
const ways = els.filter((e) => e.type === "way" && ROADS.has(e.tags?.highway) && !e.tags.oneway && !e.tags.bridge && !e.tags.tunnel && !(+e.tags.layer));

// Where a ray from p along n crosses the rings: the nearest crossing each way.
function cross(p, n, maxD = 15) {
  let fw = Infinity, bw = Infinity;
  for (const r of rings) for (let i = 0; i + 1 < r.length; i++) {
    const a = r[i], b = r[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], den = n[0] * ey - n[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den, u = ((a[0] - p[0]) * n[1] - (a[1] - p[1]) * n[0]) / den;
    if (u < 0 || u > 1) continue;
    if (t > 0 && t < fw) fw = t; if (t < 0 && -t < bw) bw = -t;
  }
  return fw < maxD && bw < maxD ? (fw - bw) / 2 : null;
}
const obs = [];
for (const w of ways) {
  const g = w.geometry.map((q) => xy([q.lon, q.lat]));
  for (let i = 0; i + 1 < g.length; i++) {
    const [a, b] = [g[i], g[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 20) continue;
    for (let s = 5; s < L - 5; s += 15) {
      const p = [a[0] + (dx * s) / L, a[1] + (dy * s) / L], n = [-dy / L, dx / L], off = cross(p, n);
      if (off !== null && Math.abs(off) < 6) obs.push({ n, off });
    }
  }
}
// The 2-D shift d (passport middle minus OSM axis): off ≈ n·d, least squares, then once more without the worst 10 %.
function fit(list) {
  let a = 0, b = 0, c = 0, u = 0, v = 0;
  for (const { n, off } of list) { a += n[0] * n[0]; b += n[0] * n[1]; c += n[1] * n[1]; u += n[0] * off; v += n[1] * off; }
  const det = a * c - b * b, d = [(c * u - b * v) / det, (a * v - b * u) / det];
  const res = list.map((o) => Math.abs(o.off - (o.n[0] * d[0] + o.n[1] * d[1])));
  return { d, res };
}
let { d, res } = fit(obs);
const keep = obs.filter((_, i) => res[i] <= [...res].sort((x, y) => x - y)[Math.floor(res.length * 0.9)]);
({ d, res } = fit(keep));
const med = (x) => [...x].sort((p, q) => p - q)[x.length >> 1];
console.log(`${obs.length} míst na ${ways.length} osách; posun pasportu proti OSM: východ ${d[0].toFixed(2)} m, sever ${d[1].toFixed(2)} m (|d| ${Math.hypot(...d).toFixed(2)} m), medián zbytku ${med(res).toFixed(2)} m`);
