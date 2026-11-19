// The frozen hold-out set (Bára 19. 11. 2026, step 1 of evaluation/ortofoto/LITERATURA-2.md): cuts never looked at
// while tuning rules or the model, drawn once with a fixed seed, stratified by the class of the street, in the cities
// with a map of surfaces (the truth) and in Plzeň as a city new to everything. Points within 60 m of any cut used so
// far (the regression's, the replay's, the AI's patches and target points) are left out.
//   node evaluation/holdout/sample.mjs   → evaluation/holdout/sample.json
// Then: the app cuts each point twice through the replay recorder (evaluation/replay, light capture): with the city's
// map (the truth) and with ?mapa=0 (the estimate); README.md.
import fs from "node:fs";
import path from "node:path";
import { PackSet } from "../../pilot/public/osmpack.js";
import { mergePieces, TILE } from "../../pilot/public/osmtile.js";

const HERE = path.dirname(new URL(import.meta.url).pathname), EVAL = path.join(HERE, "..");
const PACK = path.join(HERE, "../../pilot/data/osm-pack/");
const fileFetch = async (url, opts = {}) => {
  const buf = fs.readFileSync(path.join(PACK, String(url).replace(/^pack:\/\/\.?\/?/, "")));
  const m = /bytes=(\d+)-(\d+)/.exec(opts.headers?.Range || "");
  const body = m ? buf.subarray(+m[1], +m[2] + 1) : buf;
  return { ok: true, status: m ? 206 : 200, headers: { get: () => null }, json: async () => JSON.parse(buf), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) };
};
const packs = new PackSet(["pack://."], { fetch: fileFetch });
const R = 120;
async function around(lat, lon) {
  const dLat = R / 110574, dLon = R / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++)
    for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  return mergePieces(await packs.tiles(names));
}

// Points used so far: none of the hold-out within 60 m of them.
const used = [];
const add = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && used.push([lat, lon]);
for (const city of ["praha", "brno"]) {
  const d = path.join(EVAL, city, "data", "ab-city-stejne");
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d).filter((x) => /^\d+\.json$/.test(x))) { const r = JSON.parse(fs.readFileSync(path.join(d, f), "utf8")); add(r.cut?.lat, r.cut?.lon); }
}
for (const p of JSON.parse(fs.readFileSync(path.join(EVAL, "replay", "sample.json"), "utf8"))) add(p.lat, p.lon);
const AI = "/Users/barasoukupova/streetdesign/data/ai-seg";
for (const sub of ["cuts/praha", "cuts/brno", "cuts/target"]) {
  const d = path.join(AI, sub);
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d).filter((x) => /^\d+\.json$/.test(x))) { const r = JSON.parse(fs.readFileSync(path.join(d, f), "utf8")); add(r.lat, r.lon); }
}
for (const city of fs.existsSync(path.join(AI, "patches")) ? fs.readdirSync(path.join(AI, "patches")) : []) {
  const d = path.join(AI, "patches", city);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d).filter((x) => /^\d+\.json$/.test(x))) { const r = JSON.parse(fs.readFileSync(path.join(d, f), "utf8")); add(r.lat, r.lon); }
}
const near = (lat, lon) => used.some(([a, b]) => Math.hypot((a - lat) * 110574, (b - lon) * 111320 * Math.cos((lat * Math.PI) / 180)) < 60);

let seed = 20261119;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
// The strata: main roads, tertiary, local streets; the quotas a third each.
const STRATA = { main: new Set(["trunk", "primary", "secondary"]), tertiary: new Set(["tertiary"]), local: new Set(["residential", "living_street", "unclassified"]) };
async function streets(town, [lat0, lon0, Rt], want) {
  const out = [], per = {}, quota = { main: Math.round(want / 3), tertiary: Math.round(want / 3), local: want - 2 * Math.round(want / 3) }, got = { main: 0, tertiary: 0, local: 0 };
  for (let tries = 0; out.length < want && tries < want * 40; tries++) {
    const r = Rt * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const lat = lat0 + (r * Math.cos(a)) / 111320, lon = lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180));
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
    let best = null;
    for (const el of await around(lat, lon)) {
      const t = el.tags || {}, stratum = Object.keys(STRATA).find((k) => STRATA[k].has(t.highway));
      if (el.type !== "way" || !stratum || got[stratum] >= quota[stratum] || !t.name || t.tunnel || t.bridge || t.covered === "yes" || (+t.layer || 0) < 0) continue;
      const g = el.geometry;
      for (let i = 0; i + 1 < g.length; i++) {
        const ax = (g[i].lon - lon) * kx, ay = (g[i].lat - lat) * ky, bx = (g[i + 1].lon - lon) * kx, by = (g[i + 1].lat - lat) * ky;
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, u = l ? Math.max(0.2, Math.min(0.8, -(ax * dx + ay * dy) / l)) : 0.5;
        const px = ax + u * dx, py = ay + u * dy, d = Math.hypot(px, py);
        if (d <= R && (!best || d < best.d)) best = { d, lat: lat + py / ky, lon: lon + px / kx, name: t.name, highway: t.highway, stratum };
      }
    }
    if (!best || (per[best.name] || 0) >= 1 || near(best.lat, best.lon)) continue;
    per[best.name] = 1; got[best.stratum]++;
    const p = { town, lat: +best.lat.toFixed(6), lon: +best.lon.toFixed(6), street: best.name, highway: best.highway, stratum: best.stratum };
    out.push(p); add(p.lat, p.lon);
  }
  return out;
}

// The truth by city: MTVU (Prague, Brno), the city's maps (Plzeň, Vienna's FMZK, Berlin, Hamburg, Aachen), the
// passports (Bratislava, Prešov, Žilina). Oversampled (cuts off the map are dropped after recording). "ai":
// whether the model learnt on the city (its numbers there are not a test of the model).
export const CITIES = [
  ["praha", [50.08, 14.43, 7000], 110, true], ["brno", [49.195, 16.61, 5000], 110, false], ["plzen", [49.7477, 13.3776, 3500], 70, false],
  ["wien", [48.205, 16.37, 6000], 50, true], ["berlin", [52.515, 13.4, 7000], 50, true], ["hamburg", [53.555, 9.99, 6000], 50, true],
  ["aachen", [50.776, 6.084, 3000], 50, false], ["bratislava", [48.148, 17.11, 5000], 50, false], ["presov", [48.998, 21.24, 2500], 40, false],
  ["zilina", [49.223, 18.74, 2500], 40, false],
];
const all = [];
for (const [town, c, n, ai] of CITIES) all.push(...(await streets(town, c, n)).map((p) => ({ ...p, aiTrained: ai })));
all.forEach((p, i) => (p.id = i + 1));
fs.writeFileSync(path.join(HERE, "sample.json"), JSON.stringify(all, null, 0).replace(/\},\{/g, "},\n{"));
const by = all.reduce((a, p) => ((a[`${p.town}/${p.stratum}`] = (a[`${p.town}/${p.stratum}`] || 0) + 1), a), {});
console.log(all.length, "řezů,", used.length, "použitých bodů vynecháno okolím", JSON.stringify(by));
