// The boundaries of the American cities the app has illustrations or a surface map of (as build_towns_sk.mjs and
// build_towns_at.mjs; Bára 25. 11. 2026): a few queries at build time, none on a click. Written into
// pilot/public/mesta-us.json (city.js loadTowns), kept in the repository; staty-america.json first:
//   node tools/build_staty.mjs usa && node tools/build_towns_us.mjs
// A further city is a line of TOWNS.
//   washington: the District of Columbia from DC's own service (DCGIS "DC Boundary", CC BY 4.0), simplified by the service
//     to about 20 m;
//   newyork: New York City, its five boroughs (Bronx, Kings, New York, Queens, Richmond) from the Census Bureau's TIGERweb
//     (State_County, layer Counties; public domain), merged to one outline before it is simplified to about 20 m (each
//     county simplified alone would leave gaps along their common lines; 26. 11. 2026);
//   sanfrancisco: the incorporated place of TIGERweb (GEOID 0667000, the same line as the City and County, with its water
//     and the Farallon Islands; public domain; 26. 11. 2026);
//   boston, cambridge (Bára 26. 11. 2026): TIGERweb's incorporated places, the areas of their surface maps (towns/boston.js);
//   bostonmetro: the metro of Boston as staty-america.json has it (tools/build_staty.mjs METROS), the area of its buses and
//     orthophoto (countries/US.js art, lanes-ortho.js us-ma). The city (boston) comes before its metro.
import fs from "node:fs";

const UA = { headers: { "User-Agent": "profily-ulic" } };
const DC = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/10/query";
const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query";
// TIGERweb's incorporated places of the current vintage (layer 4; GEOID: state and place code).
const PLACES = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query";
async function rings(url, where, n = null, offset = "0.0002") {
  const q = new URLSearchParams({ where, outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", ...(offset && { maxAllowableOffset: offset }), f: "json" });
  const j = await (await fetch(`${url}?${q}`, UA)).json();
  if (!j.features?.length || (n && j.features.length !== n)) throw new Error(`${url}: ${j.features?.length} hranic`);
  return j.features.flatMap((f) => f.geometry.rings);
}
// Areas with common boundaries merged to their outline: the edges two of them share cancel out (as build_staty.mjs).
function outline(list) {
  const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`, at = new Map(), edges = new Map();
  for (const r of list) for (let i = 1; i < r.length; i++) {
    const a = key(r[i - 1]), b = key(r[i]);
    if (a === b) continue;
    at.set(a, r[i - 1]); at.set(b, r[i]);
    const k = a < b ? `${a} ${b}` : `${b} ${a}`;
    if (edges.has(k)) edges.delete(k); else edges.set(k, [a, b]);
  }
  const next = new Map();
  for (const [k, [a, b]] of edges) for (const [p, q] of [[a, b], [b, a]]) next.set(p, [...(next.get(p) || []), { q, k }]);
  const used = new Set(), out = [];
  for (const [k, [a, b]] of edges) {
    if (used.has(k)) continue;
    used.add(k);
    const ring = [a, b];
    while (ring.at(-1) !== a) {
      const e = (next.get(ring.at(-1)) || []).find((x) => !used.has(x.k));
      if (!e) break;
      used.add(e.k); ring.push(e.q);
    }
    if (ring.at(-1) === a) out.push(ring.map((p) => at.get(p)));
  }
  return out;
}
// Douglas–Peucker in degrees.
function simplify(ring, eps) {
  const keep = new Uint8Array(ring.length);
  keep[0] = keep[ring.length - 1] = 1;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    const [ax, ay] = ring[i], [bx, by] = ring[j], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    let best = -1, d = 0;
    for (let k = i + 1; k < j; k++) {
      const [x, y] = ring[k], e = L ? Math.abs(dy * x - dx * y + bx * ay - by * ax) / L : Math.hypot(x - ax, y - ay);
      if (e > d) { d = e; best = k; }
    }
    if (d > eps) { keep[best] = 1; stack.push([i, best], [best, j]); }
  }
  return ring.filter((_, k) => keep[k]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
}
const NYC = ["36005", "36047", "36061", "36081", "36085"];
const TOWNS = {
  washington: () => rings(DC, "1=1"),
  newyork: async () => outline(await rings(TIGER, `GEOID IN (${NYC.map((g) => `'${g}'`).join(",")})`, NYC.length, null))
    .map((r) => simplify(r, 0.0002)).filter((r) => r.length >= 4),
  sanfrancisco: () => rings(PLACES, "GEOID='0667000'"),
  boston: () => rings(PLACES, "GEOID='2507000'"),
  cambridge: () => rings(PLACES, "GEOID='2511000'"),
};
const out = {};
for (const [id, make] of Object.entries(TOWNS)) {
  out[id] = await make();
  console.log(id, out[id].map((r) => r.length), "bodů");
}
// The metro of Boston: the ring of staty-america.json's "usa" that holds Boston's city hall.
const states = JSON.parse(fs.readFileSync(new URL("../pilot/public/staty-america.json", import.meta.url), "utf8"));
const inRing = (r, x, y) => { let c = false; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, yi] = r[i], [xk, yk] = r[k]; if (yi > y !== yk > y && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) c = !c; } return c; };
const metro = states.usa.filter((r) => inRing(r, -71.0578, 42.3603));
if (!metro.length) throw new Error("staty-america.json: metro Bostonu chybí (nejdřív node tools/build_staty.mjs usa)");
out.bostonmetro = metro;
console.log("bostonmetro", metro.map((r) => r.length), "bodů");
fs.writeFileSync(new URL("../pilot/public/mesta-us.json", import.meta.url), JSON.stringify(out));
