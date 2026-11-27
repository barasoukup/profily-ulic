// The boundaries of Belgium's regions (Bára 20. 11. 2026), so a cut asks only its region's orthophoto and map lines
// (lanes-ortho.js BE_ORTHO, towns/belgium.js): Eurostat GISCO NUTS 2024 level 1 at 1 : 1 000 000 (© EuroGeographics),
// rounded to about 100 m. Written into app/public/regions-be.json: node tools/build_regions_be.mjs
import fs from "node:fs";

const NUTS = { BE1: "bru", BE2: "vl", BE3: "wal" };
const all = await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_1.geojson")).json();
const out = {};
for (const f of all.features) {
  const code = NUTS[f.properties.NUTS_ID];
  if (!code) continue;
  const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  out[code] = polys.map((p) => p[0].map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]))
    .filter((r) => r.length > 3);
}
console.log(Object.keys(out));
fs.writeFileSync(new URL("../app/public/regions-be.json", import.meta.url), JSON.stringify(out));
