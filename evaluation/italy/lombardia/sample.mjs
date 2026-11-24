// The A/B sample of Lombardy's DBT (towns/lombardy.js; Bára 24. 11. 2026): random points with a fixed seed around the
// centres of Lombardy's towns, inside the boxes of the local OSM pack (data/osm/it/build.sh): Milan 16, Monza, Bergamo,
// Brescia 3 each, the other towns 2 each.
//   node evaluation/italy/lombardia/sample.mjs > evaluation/italy/lombardia/sample.json
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = [["milano", 45.4642, 9.19, 16, 2500], ["monza", 45.5845, 9.2744, 3, 1200], ["bergamo", 45.6950, 9.6700, 3, 1200], ["brescia", 45.5390, 10.2200, 3, 1500],
  ["como", 45.8100, 9.0850, 2, 900], ["varese", 45.8200, 8.8250, 2, 900], ["pavia", 45.1850, 9.1550, 2, 900], ["cremona", 45.1350, 10.0250, 2, 900],
  ["mantova", 45.1580, 10.7920, 2, 700], ["lecco", 45.8550, 9.3950, 2, 800], ["lodi", 45.3140, 9.5030, 2, 800], ["busto", 45.6110, 8.8510, 2, 900]];
const out = [];
for (const [town, lat0, lon0, n, R] of TOWNS) for (let i = 1; i <= n; i++) {
  const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `${town.slice(0, 3)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
