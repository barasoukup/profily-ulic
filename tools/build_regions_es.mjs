// The Basque Country and Navarre (Bára 23. 11. 2026), where the Catastro has no buildings (their own foral cadastres),
// so a cut there does not ask it but the cadastre of its province (towns/spain-foral.js): Eurostat GISCO NUTS 2024
// level 3 at 1 : 1 000 000 (© EuroGeographics; the finest NUTS of 2024 in GeoJSON), the three Basque provinces ES211
// Álava (ar), ES212 Gipuzkoa (gi), ES213 Bizkaia (bi) and Navarre ES220 (nc), with their holes (the Treviño enclave of
// Burgos in Álava and the Valle de Villaverde of Cantabria in Bizkaia), simplified to about 30 m. Written into pilot/public/regions-es.json:
// node tools/build_regions_es.mjs
import fs from "node:fs";

const NUTS = { ES211: "ar", ES212: "gi", ES213: "bi", ES220: "nc" };
const all = await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_3.geojson")).json();
// Douglas–Peucker in degrees (0.0003° ≈ 30 m), then rounded to 4 decimals.
const simplify = (pts, tol) => {
  if (pts.length < 3) return pts;
  let best = 0, at = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i], d = len ? Math.abs(dy * (px - ax) - dx * (py - ay)) / len : Math.hypot(px - ax, py - ay);
    if (d > best) { best = d; at = i; }
  }
  return best <= tol ? [pts[0], pts[pts.length - 1]] : [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
};
const out = {};
for (const f of all.features) {
  const code = NUTS[f.properties.NUTS_ID];
  if (!code) continue;
  const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  // All rings (outlines and holes) of all polygons: the point test is even–odd.
  out[code] = polys.flat().map((r) => {
    const h = Math.floor(r.length / 2); // a closed ring split in two, so Douglas–Peucker has two ends
    return [...simplify(r.slice(0, h + 1), 0.0003).slice(0, -1), ...simplify(r.slice(h), 0.0003)];
  }).map((r) => r.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]))
    .filter((r) => r.length > 3);
}
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.length} kruhů, ${v.flat().length} bodů`).join("; "));
fs.writeFileSync(new URL("../pilot/public/regions-es.json", import.meta.url), JSON.stringify(out));
