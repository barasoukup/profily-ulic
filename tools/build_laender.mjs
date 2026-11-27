// The boundaries of Germany's Länder (Bára 17. 11. 2026), so a cut in Germany asks the orthophoto of its Land
// (lanes-ortho.js DE_ORTHO): Eurostat GISCO NUTS 2024 level 1 at 1 : 1 000 000 (© EuroGeographics), rounded to about
// 100 m. Near a border the next Land is tried too (lanes-ortho.js). Written into app/public/laender.json and kept in
// the repository: node tools/build_laender.mjs
import fs from "node:fs";

// NUTS 1 → the Land's code as lanes-ortho.js names it (ISO 3166-2:DE without "DE-").
const NUTS = { DE1: "BW", DE2: "BY", DE3: "BE", DE4: "BB", DE5: "HB", DE6: "HH", DE7: "HE", DE8: "MV", DE9: "NI", DEA: "NW", DEB: "RP",
  DEC: "SL", DED: "SN", DEE: "ST", DEF: "SH", DEG: "TH" };
const all = await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_1.geojson")).json();
const out = {};
for (const f of all.features) {
  const code = NUTS[f.properties.NUTS_ID];
  if (!code) continue;
  const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  out[code] = polys.map((p) => p[0].map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]).filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]))
    .filter((r) => r.length > 3);
}
console.log(Object.keys(out).length, "zemí");
fs.writeFileSync(new URL("../app/public/laender.json", import.meta.url), JSON.stringify(out));
