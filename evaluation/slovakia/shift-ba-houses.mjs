// Bratislava's technical map (houses, layer 8) against OSM's buildings (mostly from the cadastre) in the centre: is the
// city's map (and its passport, which matches it) off, or OSM and the orthophoto? (Bára 19. 11. 2026)
import fs from "node:fs";
import path from "node:path";
import { PackSet } from "../../app/public/osmpack.js";
import { mergePieces, TILE } from "../../app/public/osmtile.js";
const BOX = (process.argv[2] || "17.100,48.138,17.125,48.155").split(",").map(Number);
const TM = "https://geoportal.bratislava.sk/hsite/rest/services/tm/Technická_mapa_TM/MapServer/8/query";
const out = [];
for (let off = 0; off < 30000; off += 1000) {
  const p = new URLSearchParams({ where: "1=1", outFields: "Typ", geometry: BOX.join(","), geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", returnGeometry: "true", f: "json", resultOffset: String(off), resultRecordCount: "1000" });
  const j = await (await fetch(`${encodeURI(TM)}?${p}`)).json();
  out.push(...(j.features || [])); if (!j.exceededTransferLimit) break; await new Promise((r) => setTimeout(r, 1500));
}
const PACK = path.join(path.dirname(new URL(import.meta.url).pathname), "../../app/data/osm-pack/");
const fileFetch = async (url, opts = {}) => { const buf = fs.readFileSync(path.join(PACK, String(url).replace(/^pack:\/\/\.?\/?/, ""))); const m = /bytes=(\d+)-(\d+)/.exec(opts.headers?.Range || ""); const body = m ? buf.subarray(+m[1], +m[2] + 1) : buf; return { ok: true, status: m ? 206 : 200, headers: { get: () => null }, json: async () => JSON.parse(buf), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) }; };
const packs = new PackSet(["pack://."], { fetch: fileFetch });
const names = []; for (let ix = Math.floor(BOX[0] / TILE); ix <= Math.floor(BOX[2] / TILE); ix++) for (let iy = Math.floor(BOX[1] / TILE); iy <= Math.floor(BOX[3] / TILE); iy++) names.push(`${ix}_${iy}`);
const osmB = mergePieces(await packs.tiles(names)).filter((e) => e.type === "area" && e.tags?.building);
const lat0 = (BOX[1] + BOX[3]) / 2, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574, xy = ([lon, lat]) => [(lon - BOX[0]) * kx, (lat - BOX[1]) * ky];
const segs = osmB.flatMap((e) => { const r = e.geometry.map((g) => xy([g.lon, g.lat])); return r.slice(1).map((p, i) => [r[i], p]); });
console.log(out.length, "domů TM,", osmB.length, "budov OSM");
const obs = [];
for (const f of out) for (const ring of f.geometry?.rings || []) {
  const g = ring.map(xy);
  for (let i = 0; i + 1 < g.length; i++) {
    const [a, b] = [g[i], g[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 4) continue;
    const p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = [-dy / L, dx / L];
    let best = null;
    for (const [c, d] of segs) {
      const ex = d[0] - c[0], ey = d[1] - c[1], den = n[0] * ey - n[1] * ex;
      if (Math.abs(den) < 1e-9 || Math.abs(ex * dx + ey * dy) / (Math.hypot(ex, ey) * L) < 0.95) continue;
      const t = ((c[0] - p[0]) * ey - (c[1] - p[1]) * ex) / den, u = ((c[0] - p[0]) * n[1] - (c[1] - p[1]) * n[0]) / den;
      if (u < 0 || u > 1 || Math.abs(t) > 4) continue;
      if (best === null || Math.abs(t) < Math.abs(best)) best = t;
    }
    if (best !== null) obs.push({ n, off: best });
  }
}
function fit(list) { let a = 0, b = 0, c = 0, u = 0, v = 0; for (const { n, off } of list) { a += n[0] * n[0]; b += n[0] * n[1]; c += n[1] * n[1]; u += n[0] * off; v += n[1] * off; } const det = a * c - b * b, d = [(c * u - b * v) / det, (a * v - b * u) / det]; return { d, res: list.map((o) => Math.abs(o.off - (o.n[0] * d[0] + o.n[1] * d[1]))) }; }
let { d, res } = fit(obs); const lim = [...res].sort((x, y) => x - y)[Math.floor(res.length * 0.8)]; ({ d, res } = fit(obs.filter((_, i) => res[i] <= lim)));
const med = (x) => [...x].sort((p, r) => p - r)[x.length >> 1];
console.log(`${obs.length} hran: OSM budovy proti domům TM: východ ${d[0].toFixed(2)} m, sever ${d[1].toFixed(2)} m, medián zbytku ${med(res).toFixed(2)} m`);
