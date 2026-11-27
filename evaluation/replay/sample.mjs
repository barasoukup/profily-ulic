// The cuts of the safety net (docs/architecture-countries.md, step 0), chosen to cover the branches the rebuild
// touches: Slovakia (the towns of the 995 checked streets, those with passports and map lines more, the trunk roads),
// Austria (Vienna with its map of surfaces, Graz, Linz, Salzburg with its signs, Innsbruck, Klagenfurt, smaller
// towns, motorways), Prague and Brno (few in Prague, to spare IPR) and the margins abroad. The Czech towns asking
// the national DTM of ČÚZK come after its outage (from 19. 11. 2026) in sample-cz.json. Points on named streets,
// from the local OSM pack (app/data/osm-pack), as evaluation/slovakia/check/sample-streets.mjs.
//   node evaluation/replay/sample.mjs   → sample.json
import fs from "node:fs";
import path from "node:path";
import { PackSet } from "../../app/public/osmpack.js";
import { mergePieces, TILE } from "../../app/public/osmtile.js";

const HERE = new URL(".", import.meta.url);
const PACK = new URL("../../app/data/osm-pack/", import.meta.url);
const fileFetch = async (url, opts = {}) => {
  const buf = fs.readFileSync(new URL(String(url).replace(/^pack:\/\//, ""), PACK));
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
let seed = 20261118;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
// want points within radius m of the centre, on a street of the classes (named unless roads), at most two per street.
async function streets(town, [lat0, lon0, Rt], want, classes = STREETS, named = true) {
  const out = [], per = {};
  for (let tries = 0; out.length < want && tries < want * 8; tries++) {
    const r = Rt * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const lat = lat0 + (r * Math.cos(a)) / 111320, lon = lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180));
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
    let best = null;
    for (const el of await around(lat, lon)) {
      const t = el.tags || {};
      if (el.type !== "way" || !classes.has(t.highway) || (named && !t.name) || t.tunnel || t.bridge || t.covered === "yes" || (+t.layer || 0) < 0) continue;
      const g = el.geometry;
      for (let i = 0; i + 1 < g.length; i++) {
        const ax = (g[i].lon - lon) * kx, ay = (g[i].lat - lat) * ky, bx = (g[i + 1].lon - lon) * kx, by = (g[i + 1].lat - lat) * ky;
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, u = l ? Math.max(0.2, Math.min(0.8, -(ax * dx + ay * dy) / l)) : 0.5;
        const px = ax + u * dx, py = ay + u * dy, d = Math.hypot(px, py);
        if (d <= R && (!best || d < best.d)) best = { d, lat: lat + py / ky, lon: lon + px / kx, name: t.name || t.ref || String(el.id), highway: t.highway };
      }
    }
    if (!best || (per[best.name] || 0) >= 2) continue;
    per[best.name] = (per[best.name] || 0) + 1;
    out.push({ town, lat: +best.lat.toFixed(6), lon: +best.lon.toFixed(6), street: best.name, highway: best.highway });
  }
  return out;
}

// The Czech towns asking the national DTM of ČÚZK (after JVF DTM 1.5, 19. 11. 2026): the regions' images and WFS,
// a region of lines only (Středočeský), the passport towns and Jihlava's own map (26. 11. 2026).
//   node evaluation/replay/sample.mjs cz   → sample-cz.json (sample.json stays)
if (process.argv[2] === "cz") {
  const cz = [{ town: "vysoke-myto", lat: 49.952092, lon: 16.157395, street: "Komenského", highway: "residential" }];
  for (const [town, c, n] of [["vysoke-myto", [49.953, 16.16, 1000], 3], ["pardubice", [50.038, 15.779, 2000], 4], ["olomouc", [49.594, 17.251, 2000], 4],
    ["liberec", [50.768, 15.056, 2000], 4], ["hradec", [50.21, 15.833, 2000], 4], ["budejovice", [48.974, 14.474, 2000], 4], ["zlin", [49.226, 17.667, 2000], 3],
    ["karlovy-vary", [50.23, 12.871, 2000], 3], ["tabor", [49.414, 14.658, 1500], 3], ["prostejov", [49.472, 17.111, 1500], 3], ["kolin", [50.028, 15.2, 1500], 3],
    ["mlada-boleslav", [50.411, 14.903, 1500], 3], ["jihlava", [49.396, 15.591, 1500], 3], ["chomutov", [50.46, 13.418, 1500], 3], ["sumperk", [49.965, 16.97, 1200], 3],
    ["litomerice", [50.534, 14.131, 1200], 3], ["kurim", [49.2985, 16.531, 1000], 2]]) cz.push(...await streets(town, c, n));
  cz.forEach((p, i) => (p.id = i + 1));
  fs.writeFileSync(new URL("sample-cz.json", HERE), JSON.stringify(cz, null, 0).replace(/\},\{/g, "},\n{"));
  console.log(cz.length, "řezů");
  process.exit(0);
}

// The other states (step 3 of docs/code-health-plan.md, 27. 11. 2026): 12 cuts of each from the points that exist already
// (the universal measurement and the A/B samples of the states, evaluation/axisroad-check/ax-*.json), round-robin over the
// towns, only those whose answers the common recording has (data/replay/index.jsonl, imported by import.mjs): no new
// request to a service. Each cut keeps the name it has in that recording (`rec`).
//   node evaluation/replay/sample.mjs states   → sample-states.json
if (process.argv[2] === "states") {
  const { DATA } = await import("./paths.mjs");
  const recorded = new Set(fs.readFileSync(path.join(DATA, "index.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).cut));
  const AX = new URL("../axisroad-check/", import.meta.url);
  const rows = [];
  for (const f of fs.readdirSync(AX).filter((f) => /^ax-.*\.json$/.test(f)).sort())
    for (const p of JSON.parse(fs.readFileSync(new URL(f, AX)))) { const rec = `${f.slice(0, -5)}:${p.id}`; if (recorded.has(rec)) rows.push({ ...p, rec }); }
  const STATES = ["DE", "CH", "LI", "NL", "BE", "LU", "PL", "FR", "MC", "ES", "PT", "CY", "MT", "IT", "EE", "SI", "FI", "DK", "LT", "US", "CA"], N = 12, out = [], seen = new Set();
  for (const c of STATES) {
    const towns = {};
    for (const p of rows.filter((p) => p.country === c && p.src !== "ctl")) { const k = `${p.lat},${p.lon}`; if (seen.has(k)) continue; seen.add(k); (towns[p.town || "-"] ||= []).push(p); }
    const lists = Object.keys(towns).sort().map((t) => towns[t]), pick = [];
    for (let i = 0; pick.length < N && lists.some((l) => l.length); i++)
      for (const l of lists) { if (pick.length >= N) break; if (l.length) pick.push(l.splice(Math.floor((l.length * ((i * 0.37) % 1))), 1)[0]); }
    out.push(...pick.map((p) => ({ country: c, town: p.town, lat: p.lat, lon: p.lon, street: p.src, rec: p.rec })));
  }
  out.forEach((p, i) => (p.id = i + 1));
  fs.writeFileSync(new URL("sample-states.json", HERE), JSON.stringify(out, null, 0).replace(/\},\{/g, "},\n{"));
  console.log(out.length, "řezů", JSON.stringify(out.reduce((a, p) => ((a[p.country] = (a[p.country] || 0) + 1), a), {})));
  process.exit(0);
}

const all = [];
// Slovakia: the checked streets of 16. 11. 2026, by town (Bratislava and the passport towns more).
const SK_N = { bratislava: 45, kosice: 20, presov: 12, zilina: 12, "banska-bystrica": 12, nitra: 10, zvolen: 8, piestany: 8, trnava: 6, trencin: 6, martin: 6, poprad: 6 };
const sk = JSON.parse(fs.readFileSync(new URL("../slovakia/check/vzorek-ulice.json", import.meta.url)));
const byTown = {};
for (const p of sk) (byTown[p.town] ||= []).push(p);
for (const [town, list] of Object.entries(byTown)) {
  const n = SK_N[town] ?? 3, step = list.length / n;
  for (let i = 0; i < n && i * step < list.length; i++) { const p = list[Math.floor(i * step)]; all.push({ town, lat: p.lat, lon: p.lon, street: p.street, highway: p.highway }); }
}
for (const p of sk.filter((p) => p.highway === "trunk")) if (!all.some((q) => q.lat === p.lat)) all.push({ town: p.town, lat: p.lat, lon: p.lon, street: p.street, highway: p.highway });
const ROADS = new Set(["motorway", "trunk"]);
all.push(...await streets("sk-dialnica", [48.17, 17.17, 6000], 4, ROADS, false));
all.push(...await streets("sk-dialnica", [48.75, 19.14, 4000], 3, ROADS, false));
// Austria: Vienna's sample of the A/B (its map of surfaces), the other cities, smaller towns, motorways.
const wien = JSON.parse(fs.readFileSync(new URL("../austria/ab/sample.json", import.meta.url)));
all.push(...wien.slice(0, 30).map((p) => ({ town: "wien", lat: p.lat, lon: p.lon })));
all.push(...await streets("wien", [48.2, 16.37, 6000], 10));
for (const [town, c, n] of [["graz", [47.0707, 15.4395, 2500], 12], ["linz", [48.3059, 14.2862, 2500], 12], ["salzburg", [47.8, 13.045, 2000], 14], ["innsbruck", [47.2654, 11.3927, 2000], 10],
  ["klagenfurt", [46.6247, 14.3053, 2000], 6], ["st-poelten", [48.2047, 15.6256, 1500], 4], ["wels", [48.1575, 14.0289, 1500], 4], ["villach", [46.6103, 13.8558, 1500], 4],
  ["eisenstadt", [47.8456, 16.5233, 1200], 3], ["bregenz", [47.5031, 9.7471, 1200], 3]]) all.push(...await streets(town, c, n));
all.push(...await streets("at-autobahn", [48.19, 16.42, 5000], 4, ROADS, false));
all.push(...await streets("at-autobahn", [47.05, 15.43, 6000], 2, ROADS, false));
// Prague and Brno (the Czech sample of the A/B; few in Prague) and a few Prague streets of the rules (trams, a bus lane).
const cz = JSON.parse(fs.readFileSync(new URL("../slovakia/check/vzorek-ulice-cz.json", import.meta.url)));
all.push(...cz.filter((p) => p.town === "praha").slice(0, 14).map((p) => ({ town: "praha", lat: p.lat, lon: p.lon, street: p.street, highway: p.highway })));
all.push(...[[50.081704, 14.417590, "Národní"], [50.080164, 14.422601, "Spálená"], [50.084097, 14.454861, "Olšanská"], [50.075487, 14.430251, "Vinohradská"], [50.1003, 14.3920, "Evropská"], [50.0680, 14.4006, "Plzeňská"]]
  .map(([lat, lon, street]) => ({ town: "praha", lat, lon, street })));
all.push(...cz.filter((p) => p.town === "brno").slice(0, 30).map((p) => ({ town: "brno", lat: p.lat, lon: p.lon, street: p.street, highway: p.highway })));
// Abroad, at the margins of the OSM extracts (cizina).
all.push(...[[47.8705, 17.2690, "mosonmagyarovar"], [47.7397, 18.1186, "komarom"], [49.7496, 18.6326, "cieszyn"], [48.5745, 13.4600, "passau"], [48.0080, 16.2340, "at-okraj"]]
  .map(([lat, lon, town]) => ({ town, lat, lon })));
all.forEach((p, i) => (p.id = i + 1));
fs.writeFileSync(new URL("sample.json", HERE), JSON.stringify(all, null, 0).replace(/\},\{/g, "},\n{"));
const by = all.reduce((a, p) => ((a[p.town] = (a[p.town] || 0) + 1), a), {});
console.log(all.length, "řezů", JSON.stringify(by));
