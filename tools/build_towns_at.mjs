// The boundaries of the Austrian cities the app has illustrations or data of (step 4b of docs/architecture-countries.md:
// cities everywhere, Bára 16. 11. 2026), from Eurostat GISCO's local administrative units 2024 (LAU, the municipalities
// of Statistik Austria; © EuroGeographics, as the state's boundary in staty.json). Statistik Austria's own file is no longer
// at its open-data address and GeoSphere's map service gives no geometry. One download of about 150 MB at build time,
// none on a click. Simplified to about 30 m, written into app/public/mesta-at.json (city.js loadTowns), kept in the
// repository: node tools/build_towns_at.mjs [file.geojson]  (a file downloaded before, else it is fetched)
import fs from "node:fs";

const URL_LAU = "https://gisco-services.ec.europa.eu/distribution/v2/lau/geojson/LAU_RG_01M_2024_4326.geojson";
// city → LAU id (Gemeindekennziffer)
const TOWNS = { wien: "90001", graz: "60101", linz: "40101", salzburg: "50101", innsbruck: "70101" };
const TOL = 0.0003;

// Douglas–Peucker on a ring (degrees; about 30 m), rounded to 5 decimals.
function simplify(pts) {
  if (pts.length < 5) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  // A closed ring: first split at the point farthest from its start (the chord of a closed ring has no length).
  let far = 1;
  for (let i = 1; i < pts.length - 1; i++) if (Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]) > Math.hypot(pts[far][0] - pts[0][0], pts[far][1] - pts[0][1])) far = i;
  keep[far] = 1;
  const stack = [[0, far], [far, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, d = 0;
    const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) { const e = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / l; if (e > d) { d = e; best = i; } }
    if (d > TOL) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
}

const file = process.argv[2];
const all = file ? JSON.parse(fs.readFileSync(file, "utf8")) : await (await fetch(URL_LAU, { headers: { "User-Agent": "profily-ulic" } })).json();
const out = {};
for (const [id, lau] of Object.entries(TOWNS)) {
  const f = all.features.find((x) => x.properties.GISCO_ID === `AT_${lau}`);
  if (!f) throw new Error(`LAU AT ${lau} (${id}) nenalezena`);
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  out[id] = polys.map((p) => simplify(p[0]));
  console.log(id, f.properties.LAU_NAME, out[id].length, "kruhů", out[id].reduce((a, r) => a + r.length, 0), "bodů");
}
fs.writeFileSync(new URL("../app/public/mesta-at.json", import.meta.url), JSON.stringify(out));
